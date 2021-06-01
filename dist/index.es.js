function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}
class HtmlTag {
    constructor(anchor = null) {
        this.a = anchor;
        this.e = this.n = null;
    }
    m(html, target, anchor = null) {
        if (!this.e) {
            this.e = element(target.nodeName);
            this.t = target;
            this.h(html);
        }
        this.i(anchor);
    }
    h(html) {
        this.e.innerHTML = html;
        this.n = Array.from(this.e.childNodes);
    }
    i(anchor) {
        for (let i = 0; i < this.n.length; i += 1) {
            insert(this.t, this.n[i], anchor);
        }
    }
    p(html) {
        this.d();
        this.h(html);
        this.i(this.a);
    }
    d() {
        this.n.forEach(detach);
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor, customElement) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
    }
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        on_disconnect: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : options.context || []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, options.props || {}, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor, options.customElement);
        flush();
    }
    set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

/* src\icons\IconSorting.svelte generated by Svelte v3.38.2 */

function create_fragment$2(ctx) {
	let svg;
	let path0;
	let path0_fill_value;
	let path1;
	let path1_fill_value;

	return {
		c() {
			svg = svg_element("svg");
			path0 = svg_element("path");
			path1 = svg_element("path");
			attr(path0, "d", "M8.26186 13.7732C8.11155 13.9034 7.88845 13.9034 7.73814 13.7732L4.4809 10.9524C4.20094 10.7099 4.37241 10.25 4.74276 10.25L11.2572 10.25C11.6276 10.25 11.7991 10.7099 11.5191 10.9524L8.26186 13.7732Z");
			attr(path0, "fill", path0_fill_value = /*sortOrder*/ ctx[0] === 1 ? "#1D4ED8" : "#B0AEAC");
			attr(path1, "d", "M7.73814 2.22678C7.88845 2.09661 8.11155 2.09661 8.26186 2.22678L11.5191 5.04763C11.7991 5.29008 11.6276 5.75 11.2572 5.75H4.74276C4.37241 5.75 4.20094 5.29008 4.4809 5.04763L7.73814 2.22678Z");
			attr(path1, "fill", path1_fill_value = /*sortOrder*/ ctx[0] === -1 ? "#1D4ED8" : "#B0AEAC");
			attr(svg, "width", "16");
			attr(svg, "height", "16");
			attr(svg, "viewBox", "0 0 16 16");
			attr(svg, "fill", "none");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "class", "inline");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, path0);
			append(svg, path1);
		},
		p(ctx, [dirty]) {
			if (dirty & /*sortOrder*/ 1 && path0_fill_value !== (path0_fill_value = /*sortOrder*/ ctx[0] === 1 ? "#1D4ED8" : "#B0AEAC")) {
				attr(path0, "fill", path0_fill_value);
			}

			if (dirty & /*sortOrder*/ 1 && path1_fill_value !== (path1_fill_value = /*sortOrder*/ ctx[0] === -1 ? "#1D4ED8" : "#B0AEAC")) {
				attr(path1, "fill", path1_fill_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { sortOrder } = $$props;

	$$self.$$set = $$props => {
		if ("sortOrder" in $$props) $$invalidate(0, sortOrder = $$props.sortOrder);
	};

	return [sortOrder];
}

class IconSorting extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$2, safe_not_equal, { sortOrder: 0 });
	}
}

/* src\icons\IconTooltip.svelte generated by Svelte v3.38.2 */

function create_fragment$1(ctx) {
	let svg;
	let path0;
	let path1;

	return {
		c() {
			svg = svg_element("svg");
			path0 = svg_element("path");
			path1 = svg_element("path");
			attr(path0, "d", "M8.00005 1.30005C4.29974 1.30005 1.30005 4.29974 1.30005 8.00005C1.30005 11.7004 4.29974 14.7 8.00005 14.7C11.7004 14.7 14.7 11.7004 14.7 8.00005C14.7 4.29974 11.7004 1.30005 8.00005 1.30005ZM0.300049 8.00005C0.300049 3.74746 3.74746 0.300049 8.00005 0.300049C12.2526 0.300049 15.7 3.74746 15.7 8.00005C15.7 12.2526 12.2526 15.7 8.00005 15.7C3.74746 15.7 0.300049 12.2526 0.300049 8.00005Z");
			attr(path1, "d", "M9.0859 6.2C9.0859 6.7 8.8459 6.96 8.4659 7.28L7.8959 7.75C7.3659 8.18 7.2859 8.34 7.2859 8.97V9.61H8.6559V9.18C8.6559 8.9 8.7259 8.81 8.9359 8.64L9.6059 8.08C10.2559 7.54 10.6459 7.04 10.6459 6.12C10.6459 4.97 9.8959 4.04 8.0959 4.04C6.3059 4.04 5.3359 5.14 5.3659 6.71H6.8859C6.8859 5.63 7.4259 5.28 8.0659 5.28C8.7159 5.28 9.0859 5.64 9.0859 6.2ZM8.8459 12V10.48H7.0959V12H8.8459Z");
			attr(svg, "width", "16");
			attr(svg, "height", "16");
			attr(svg, "viewBox", "0 0 16 16");
			attr(svg, "fill", "currentColor");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "class", "inline -mt-1");
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, path0);
			append(svg, path1);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(svg);
		}
	};
}

class IconTooltip extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$1, safe_not_equal, {});
	}
}

/* src\SvelteTable.svelte generated by Svelte v3.38.2 */
const get_empty_slot_changes = dirty => ({});
const get_empty_slot_context = ctx => ({});

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[22] = list[i];
	child_ctx[24] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[25] = list[i];
	child_ctx[27] = i;
	return child_ctx;
}

const get_row_slot_changes = dirty => ({ row: dirty & /*sortedRows*/ 32 });
const get_row_slot_context = ctx => ({ row: /*row*/ ctx[22], n: /*n*/ ctx[24] });

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[25] = list[i];
	child_ctx[27] = i;
	return child_ctx;
}

const get_header_slot_changes = dirty => ({
	sortOrder: dirty & /*sortOrder*/ 2,
	sortBy: dirty & /*sortBy*/ 1
});

const get_header_slot_context = ctx => ({
	sortOrder: /*sortOrder*/ ctx[1],
	sortBy: /*sortBy*/ ctx[0]
});

// (80:0) {#if activeModal}
function create_if_block_6(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*activeModal*/ ctx[4];

	function switch_props(ctx) {
		return {};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
		switch_instance.$on("toggled", /*toggled_handler*/ ctx[13]);
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (switch_value !== (switch_value = /*activeModal*/ ctx[4])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					switch_instance.$on("toggled", /*toggled_handler*/ ctx[13]);
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

// (98:12) {#if col.sortable}
function create_if_block_4(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block_5, create_else_block_2];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*sortBy*/ ctx[0] === /*col*/ ctx[25].key) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (101:14) {:else}
function create_else_block_2(ctx) {
	let iconsorting;
	let current;
	iconsorting = new IconSorting({ props: { sortOrder: 0 } });

	return {
		c() {
			create_component(iconsorting.$$.fragment);
		},
		m(target, anchor) {
			mount_component(iconsorting, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(iconsorting.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(iconsorting.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(iconsorting, detaching);
		}
	};
}

// (99:14) {#if sortBy === col.key}
function create_if_block_5(ctx) {
	let iconsorting;
	let current;

	iconsorting = new IconSorting({
			props: { sortOrder: /*sortOrder*/ ctx[1] }
		});

	return {
		c() {
			create_component(iconsorting.$$.fragment);
		},
		m(target, anchor) {
			mount_component(iconsorting, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const iconsorting_changes = {};
			if (dirty & /*sortOrder*/ 2) iconsorting_changes.sortOrder = /*sortOrder*/ ctx[1];
			iconsorting.$set(iconsorting_changes);
		},
		i(local) {
			if (current) return;
			transition_in(iconsorting.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(iconsorting.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(iconsorting, detaching);
		}
	};
}

// (106:12) {#if col.helpModal}
function create_if_block_3(ctx) {
	let button;
	let icontooltip;
	let t0;
	let span;
	let current;
	let mounted;
	let dispose;
	icontooltip = new IconTooltip({});

	function click_handler() {
		return /*click_handler*/ ctx[14](/*col*/ ctx[25]);
	}

	return {
		c() {
			button = element("button");
			create_component(icontooltip.$$.fragment);
			t0 = space();
			span = element("span");
			span.textContent = "Show tooltip";
			attr(span, "class", "sr-only");
			attr(button, "class", "text-blue-700");
			attr(button, "type", "button");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			mount_component(icontooltip, button, null);
			append(button, t0);
			append(button, span);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
		},
		i(local) {
			if (current) return;
			transition_in(icontooltip.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(icontooltip.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			destroy_component(icontooltip);
			mounted = false;
			dispose();
		}
	};
}

// (90:8) {#each columns as col, i}
function create_each_block_2(ctx) {
	let th;
	let t0_value = /*col*/ ctx[25].title + "";
	let t0;
	let t1;
	let t2;
	let t3;
	let th_class_value;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*col*/ ctx[25].sortable && create_if_block_4(ctx);
	let if_block1 = /*col*/ ctx[25].helpModal && create_if_block_3(ctx);

	function click_handler_1(...args) {
		return /*click_handler_1*/ ctx[15](/*col*/ ctx[25], ...args);
	}

	return {
		c() {
			th = element("th");
			t0 = text(t0_value);
			t1 = space();
			if (if_block0) if_block0.c();
			t2 = space();
			if (if_block1) if_block1.c();
			t3 = space();
			attr(th, "class", th_class_value = `cursor-pointer ${/*styles*/ ctx[3].th} ${/*col*/ ctx[25].headerClass}`);
			toggle_class(th, "cursor-pointer", /*col*/ ctx[25].sortable);
			toggle_class(th, "pr-4", /*columns*/ ctx[2].length - 1 === /*i*/ ctx[27]);
		},
		m(target, anchor) {
			insert(target, th, anchor);
			append(th, t0);
			append(th, t1);
			if (if_block0) if_block0.m(th, null);
			append(th, t2);
			if (if_block1) if_block1.m(th, null);
			append(th, t3);
			current = true;

			if (!mounted) {
				dispose = listen(th, "click", function () {
					if (is_function(/*col*/ ctx[25].sortable ? click_handler_1 : undefined)) (/*col*/ ctx[25].sortable ? click_handler_1 : undefined).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if ((!current || dirty & /*columns*/ 4) && t0_value !== (t0_value = /*col*/ ctx[25].title + "")) set_data(t0, t0_value);

			if (/*col*/ ctx[25].sortable) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*columns*/ 4) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_4(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(th, t2);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*col*/ ctx[25].helpModal) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*columns*/ 4) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_3(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(th, t3);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (!current || dirty & /*styles, columns*/ 12 && th_class_value !== (th_class_value = `cursor-pointer ${/*styles*/ ctx[3].th} ${/*col*/ ctx[25].headerClass}`)) {
				attr(th, "class", th_class_value);
			}

			if (dirty & /*styles, columns, columns*/ 12) {
				toggle_class(th, "cursor-pointer", /*col*/ ctx[25].sortable);
			}

			if (dirty & /*styles, columns, columns*/ 12) {
				toggle_class(th, "pr-4", /*columns*/ ctx[2].length - 1 === /*i*/ ctx[27]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(th);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			dispose();
		}
	};
}

// (88:45)        
function fallback_block_1(ctx) {
	let tr;
	let current;
	let each_value_2 = /*columns*/ ctx[2];
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			tr = element("tr");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}
		},
		m(target, anchor) {
			insert(target, tr, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tr, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*styles, columns, handleClickCol, undefined, activeModal, sortOrder, sortBy*/ 159) {
				each_value_2 = /*columns*/ ctx[2];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tr, null);
					}
				}

				group_outros();

				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_2.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(tr);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (163:4) {:else}
function create_else_block_1(ctx) {
	let current;
	const empty_slot_template = /*#slots*/ ctx[12].empty;
	const empty_slot = create_slot(empty_slot_template, ctx, /*$$scope*/ ctx[11], get_empty_slot_context);

	return {
		c() {
			if (empty_slot) empty_slot.c();
		},
		m(target, anchor) {
			if (empty_slot) {
				empty_slot.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (empty_slot) {
				if (empty_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
					update_slot(empty_slot, empty_slot_template, ctx, /*$$scope*/ ctx[11], dirty, get_empty_slot_changes, get_empty_slot_context);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(empty_slot, local);
			current = true;
		},
		o(local) {
			transition_out(empty_slot, local);
			current = false;
		},
		d(detaching) {
			if (empty_slot) empty_slot.d(detaching);
		}
	};
}

// (122:4) {#if sortedRows.length}
function create_if_block(ctx) {
	let each_1_anchor;
	let current;
	let each_value = /*sortedRows*/ ctx[5];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*sortedRows, styles, handleClickRow, columns, handleClickCell, $$scope*/ 2860) {
				each_value = /*sortedRows*/ ctx[5];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (148:16) {:else}
function create_else_block(ctx) {
	let div;

	let raw_value = (/*col*/ ctx[25].renderValue
	? /*col*/ ctx[25].renderValue(/*row*/ ctx[22])
	: /*col*/ ctx[25].value(/*row*/ ctx[22]) || "") + "";

	let div_class_value;

	return {
		c() {
			div = element("div");
			attr(div, "class", div_class_value = /*styles*/ ctx[3].cell);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = raw_value;
		},
		p(ctx, dirty) {
			if (dirty & /*columns, sortedRows*/ 36 && raw_value !== (raw_value = (/*col*/ ctx[25].renderValue
			? /*col*/ ctx[25].renderValue(/*row*/ ctx[22])
			: /*col*/ ctx[25].value(/*row*/ ctx[22]) || "") + "")) div.innerHTML = raw_value;
			if (dirty & /*styles*/ 8 && div_class_value !== (div_class_value = /*styles*/ ctx[3].cell)) {
				attr(div, "class", div_class_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (140:16) {#if col.component}
function create_if_block_2(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;

	const switch_instance_spread_levels = [
		{ class: /*styles*/ ctx[3].cell },
		/*col*/ ctx[25].component.props || {},
		{ row: /*row*/ ctx[22] },
		{ col: /*col*/ ctx[25] }
	];

	var switch_value = /*col*/ ctx[25].component.component || /*col*/ ctx[25].component;

	function switch_props(ctx) {
		let switch_instance_props = {};

		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
		}

		return { props: switch_instance_props };
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
	}

	return {
		c() {
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
		},
		m(target, anchor) {
			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert(target, switch_instance_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const switch_instance_changes = (dirty & /*styles, columns, sortedRows*/ 44)
			? get_spread_update(switch_instance_spread_levels, [
					dirty & /*styles*/ 8 && { class: /*styles*/ ctx[3].cell },
					dirty & /*columns*/ 4 && get_spread_object(/*col*/ ctx[25].component.props || {}),
					dirty & /*sortedRows*/ 32 && { row: /*row*/ ctx[22] },
					dirty & /*columns*/ 4 && { col: /*col*/ ctx[25] }
				])
			: {};

			if (switch_value !== (switch_value = /*col*/ ctx[25].component.component || /*col*/ ctx[25].component)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props());
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};
}

// (132:12) {#each columns as col, i}
function create_each_block_1(ctx) {
	let td;
	let current_block_type_index;
	let if_block;
	let t;
	let td_class_value;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block_2, create_else_block];
	const if_blocks = [];

	function select_block_type_2(ctx, dirty) {
		if (/*col*/ ctx[25].component) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_2(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	function click_handler_2(...args) {
		return /*click_handler_2*/ ctx[16](/*row*/ ctx[22], /*col*/ ctx[25], ...args);
	}

	return {
		c() {
			td = element("td");
			if_block.c();
			t = space();
			attr(td, "class", td_class_value = `${/*col*/ ctx[25].class} ${/*styles*/ ctx[3].td}`);
			toggle_class(td, "pr-4", /*columns*/ ctx[2].length - 1 === /*i*/ ctx[27]);
		},
		m(target, anchor) {
			insert(target, td, anchor);
			if_blocks[current_block_type_index].m(td, null);
			append(td, t);
			current = true;

			if (!mounted) {
				dispose = listen(td, "click", click_handler_2);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_2(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(td, t);
			}

			if (!current || dirty & /*columns, styles*/ 12 && td_class_value !== (td_class_value = `${/*col*/ ctx[25].class} ${/*styles*/ ctx[3].td}`)) {
				attr(td, "class", td_class_value);
			}

			if (dirty & /*columns, styles, columns*/ 12) {
				toggle_class(td, "pr-4", /*columns*/ ctx[2].length - 1 === /*i*/ ctx[27]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(td);
			if_blocks[current_block_type_index].d();
			mounted = false;
			dispose();
		}
	};
}

// (158:10) {#if row['expandRow']?.show}
function create_if_block_1(ctx) {
	let html_tag;
	let raw_value = /*row*/ ctx[22]["expandRow"]["component"] + "";
	let html_anchor;

	return {
		c() {
			html_anchor = empty();
			html_tag = new HtmlTag(html_anchor);
		},
		m(target, anchor) {
			html_tag.m(raw_value, target, anchor);
			insert(target, html_anchor, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*sortedRows*/ 32 && raw_value !== (raw_value = /*row*/ ctx[22]["expandRow"]["component"] + "")) html_tag.p(raw_value);
		},
		d(detaching) {
			if (detaching) detach(html_anchor);
			if (detaching) html_tag.d();
		}
	};
}

// (124:35)            
function fallback_block(ctx) {
	let tr;
	let tr_class_value;
	let t0;
	let t1;
	let current;
	let mounted;
	let dispose;
	let each_value_1 = /*columns*/ ctx[2];
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	function click_handler_3(...args) {
		return /*click_handler_3*/ ctx[17](/*row*/ ctx[22], ...args);
	}

	let if_block = /*row*/ ctx[22]["expandRow"]?.show && create_if_block_1(ctx);

	return {
		c() {
			tr = element("tr");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			attr(tr, "class", tr_class_value = /*styles*/ ctx[3].tr);
			toggle_class(tr, "bg-gray-100", /*row*/ ctx[22]["expandRow"]?.show);
		},
		m(target, anchor) {
			insert(target, tr, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(tr, null);
			}

			insert(target, t0, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, t1, anchor);
			current = true;

			if (!mounted) {
				dispose = listen(tr, "click", click_handler_3);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*columns, styles, handleClickCell, sortedRows*/ 556) {
				each_value_1 = /*columns*/ ctx[2];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tr, null);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (!current || dirty & /*styles*/ 8 && tr_class_value !== (tr_class_value = /*styles*/ ctx[3].tr)) {
				attr(tr, "class", tr_class_value);
			}

			if (dirty & /*styles, sortedRows*/ 40) {
				toggle_class(tr, "bg-gray-100", /*row*/ ctx[22]["expandRow"]?.show);
			}

			if (/*row*/ ctx[22]["expandRow"]?.show) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block_1(ctx);
					if_block.c();
					if_block.m(t1.parentNode, t1);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(tr);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(t0);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(t1);
			mounted = false;
			dispose();
		}
	};
}

// (123:6) {#each sortedRows as row, n}
function create_each_block(ctx) {
	let current;
	const row_slot_template = /*#slots*/ ctx[12].row;
	const row_slot = create_slot(row_slot_template, ctx, /*$$scope*/ ctx[11], get_row_slot_context);
	const row_slot_or_fallback = row_slot || fallback_block(ctx);

	return {
		c() {
			if (row_slot_or_fallback) row_slot_or_fallback.c();
		},
		m(target, anchor) {
			if (row_slot_or_fallback) {
				row_slot_or_fallback.m(target, anchor);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (row_slot) {
				if (row_slot.p && (!current || dirty & /*$$scope, sortedRows*/ 2080)) {
					update_slot(row_slot, row_slot_template, ctx, /*$$scope*/ ctx[11], dirty, get_row_slot_changes, get_row_slot_context);
				}
			} else {
				if (row_slot_or_fallback && row_slot_or_fallback.p && dirty & /*sortedRows, styles, columns*/ 44) {
					row_slot_or_fallback.p(ctx, dirty);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(row_slot_or_fallback, local);
			current = true;
		},
		o(local) {
			transition_out(row_slot_or_fallback, local);
			current = false;
		},
		d(detaching) {
			if (row_slot_or_fallback) row_slot_or_fallback.d(detaching);
		}
	};
}

function create_fragment(ctx) {
	let t0;
	let table;
	let thead;
	let thead_class_value;
	let t1;
	let tbody;
	let current_block_type_index;
	let if_block1;
	let tbody_class_value;
	let table_class_value;
	let current;
	let if_block0 = /*activeModal*/ ctx[4] && create_if_block_6(ctx);
	const header_slot_template = /*#slots*/ ctx[12].header;
	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[11], get_header_slot_context);
	const header_slot_or_fallback = header_slot || fallback_block_1(ctx);
	const if_block_creators = [create_if_block, create_else_block_1];
	const if_blocks = [];

	function select_block_type_1(ctx, dirty) {
		if (/*sortedRows*/ ctx[5].length) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(ctx);
	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t0 = space();
			table = element("table");
			thead = element("thead");
			if (header_slot_or_fallback) header_slot_or_fallback.c();
			t1 = space();
			tbody = element("tbody");
			if_block1.c();
			attr(thead, "class", thead_class_value = /*styles*/ ctx[3].thead);
			attr(tbody, "class", tbody_class_value = /*styles*/ ctx[3].tbody);
			attr(table, "class", table_class_value = /*styles*/ ctx[3].table);
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t0, anchor);
			insert(target, table, anchor);
			append(table, thead);

			if (header_slot_or_fallback) {
				header_slot_or_fallback.m(thead, null);
			}

			append(table, t1);
			append(table, tbody);
			if_blocks[current_block_type_index].m(tbody, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*activeModal*/ ctx[4]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*activeModal*/ 16) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_6(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(t0.parentNode, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (header_slot) {
				if (header_slot.p && (!current || dirty & /*$$scope, sortOrder, sortBy*/ 2051)) {
					update_slot(header_slot, header_slot_template, ctx, /*$$scope*/ ctx[11], dirty, get_header_slot_changes, get_header_slot_context);
				}
			} else {
				if (header_slot_or_fallback && header_slot_or_fallback.p && dirty & /*columns, styles, activeModal, sortOrder, sortBy*/ 31) {
					header_slot_or_fallback.p(ctx, dirty);
				}
			}

			if (!current || dirty & /*styles*/ 8 && thead_class_value !== (thead_class_value = /*styles*/ ctx[3].thead)) {
				attr(thead, "class", thead_class_value);
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_1(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block1 = if_blocks[current_block_type_index];

				if (!if_block1) {
					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block1.c();
				} else {
					if_block1.p(ctx, dirty);
				}

				transition_in(if_block1, 1);
				if_block1.m(tbody, null);
			}

			if (!current || dirty & /*styles*/ 8 && tbody_class_value !== (tbody_class_value = /*styles*/ ctx[3].tbody)) {
				attr(tbody, "class", tbody_class_value);
			}

			if (!current || dirty & /*styles*/ 8 && table_class_value !== (table_class_value = /*styles*/ ctx[3].table)) {
				attr(table, "class", table_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(header_slot_or_fallback, local);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(header_slot_or_fallback, local);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t0);
			if (detaching) detach(table);
			if (header_slot_or_fallback) header_slot_or_fallback.d(detaching);
			if_blocks[current_block_type_index].d();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let sortedRows;
	let { $$slots: slots = {}, $$scope } = $$props;
	const dispatch = createEventDispatcher();
	let { columns } = $$props;
	let { rows } = $$props;
	let { sortBy = "" } = $$props;
	let { sortOrder = 0 } = $$props;
	let activeModal = null;

	const removeModal = state => {
		if (!state) {
			$$invalidate(4, activeModal = null);
		}
	};

	let { styles = {
		table: "",
		thead: "",
		th: "",
		tbody: "",
		tr: "",
		td: "",
		cell: ""
	} } = $$props;

	let columnByKey = {};

	columns.forEach(col => {
		columnByKey[col.key] = col;
	});

	const sortStrings = (a, b) => {
		if (!a) return -sortOrder;
		if (!b) return sortOrder;

		if (sortOrder > 0) {
			return a.localeCompare(b);
		} else {
			return b.localeCompare(a);
		}
	};

	const updateSortOrder = colKey => colKey === sortBy
	? $$invalidate(1, sortOrder = sortOrder === 1 ? -1 : 1)
	: $$invalidate(1, sortOrder = 1);

	const handleClickCol = (event, col) => {
		updateSortOrder(col.key);
		$$invalidate(0, sortBy = col.key);
		dispatch("clickCol", { event, col, key: col.key });
	};

	const handleClickRow = (event, row) => {
		dispatch("clickRow", { event, row });
	};

	const handleClickCell = (event, row, key) => {
		dispatch("clickCell", { event, row, key });
	};

	const toggled_handler = ({ isOpen }) => removeModal(isOpen);
	const click_handler = col => $$invalidate(4, activeModal = col.helpModal);
	const click_handler_1 = (col, e) => handleClickCol(e, col);

	const click_handler_2 = (row, col, e) => {
		handleClickCell(e, row, col.key);
	};

	const click_handler_3 = (row, e) => {
		handleClickRow(e, row);
	};

	$$self.$$set = $$props => {
		if ("columns" in $$props) $$invalidate(2, columns = $$props.columns);
		if ("rows" in $$props) $$invalidate(10, rows = $$props.rows);
		if ("sortBy" in $$props) $$invalidate(0, sortBy = $$props.sortBy);
		if ("sortOrder" in $$props) $$invalidate(1, sortOrder = $$props.sortOrder);
		if ("styles" in $$props) $$invalidate(3, styles = $$props.styles);
		if ("$$scope" in $$props) $$invalidate(11, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*rows, sortBy, sortOrder*/ 1027) {
			$$invalidate(5, sortedRows = rows.sort((a, b) => {
				if (typeof a[sortBy] === "string" || typeof b[sortBy] === "string") return sortStrings(a[sortBy], b[sortBy]);

				if (a[sortBy] > b[sortBy]) {
					return sortOrder;
				} else if (a[sortBy] < b[sortBy]) {
					return -sortOrder;
				}

				return 0;
			}));
		}
	};

	return [
		sortBy,
		sortOrder,
		columns,
		styles,
		activeModal,
		sortedRows,
		removeModal,
		handleClickCol,
		handleClickRow,
		handleClickCell,
		rows,
		$$scope,
		slots,
		toggled_handler,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3
	];
}

class SvelteTable extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance, create_fragment, safe_not_equal, {
			columns: 2,
			rows: 10,
			sortBy: 0,
			sortOrder: 1,
			styles: 3
		});
	}
}

export { SvelteTable };
