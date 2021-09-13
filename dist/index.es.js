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
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
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

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
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

function create_fragment$3(ctx) {
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

function instance$2($$self, $$props, $$invalidate) {
	let { sortOrder } = $$props;

	$$self.$$set = $$props => {
		if ("sortOrder" in $$props) $$invalidate(0, sortOrder = $$props.sortOrder);
	};

	return [sortOrder];
}

class IconSorting extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$3, safe_not_equal, { sortOrder: 0 });
	}
}

/* src\icons\IconTooltip.svelte generated by Svelte v3.38.2 */

function create_fragment$2(ctx) {
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
		init(this, options, null, create_fragment$2, safe_not_equal, {});
	}
}

/* src\Pagination.svelte generated by Svelte v3.38.2 */

function create_fragment$1(ctx) {
	let nav;
	let button0;
	let t0;
	let button0_class_value;
	let button0_tabindex_value;
	let t1;
	let button1;
	let t2;
	let button1_class_value;
	let button1_tabindex_value;
	let t3;
	let p;
	let t4_value = `${/*from*/ ctx[0]}-${/*to*/ ctx[1]} of ${/*totalItems*/ ctx[3]}` + "";
	let t4;
	let p_class_value;
	let t5;
	let button2;
	let t6;
	let button2_class_value;
	let button2_tabindex_value;
	let t7;
	let button3;
	let t8;
	let button3_class_value;
	let button3_tabindex_value;
	let nav_class_value;
	let nav_aria_label_value;
	let mounted;
	let dispose;

	return {
		c() {
			nav = element("nav");
			button0 = element("button");
			t0 = text("First");
			t1 = space();
			button1 = element("button");
			t2 = text("Prev");
			t3 = space();
			p = element("p");
			t4 = text(t4_value);
			t5 = space();
			button2 = element("button");
			t6 = text("Next");
			t7 = space();
			button3 = element("button");
			t8 = text("Last");
			attr(button0, "class", button0_class_value = /*styles*/ ctx[2].paginationButtons);
			attr(button0, "type", "button");
			attr(button0, "tabindex", button0_tabindex_value = /*isPrevDisabled*/ ctx[5] ? -1 : 0);
			button0.disabled = /*isPrevDisabled*/ ctx[5];
			attr(button0, "aria-disabled", /*isPrevDisabled*/ ctx[5]);
			attr(button0, "aria-label", "First page");
			attr(button1, "class", button1_class_value = /*styles*/ ctx[2].paginationButtons);
			attr(button1, "type", "button");
			attr(button1, "tabindex", button1_tabindex_value = /*isPrevDisabled*/ ctx[5] ? -1 : 0);
			button1.disabled = /*isPrevDisabled*/ ctx[5];
			attr(button1, "aria-disabled", /*isPrevDisabled*/ ctx[5]);
			attr(button1, "aria-label", "Previous page");
			attr(button1, "data-testid", "previous-button");
			attr(p, "class", p_class_value = /*styles*/ ctx[2].paginationInfo);
			attr(p, "aria-hidden", "true");
			attr(button2, "class", button2_class_value = /*styles*/ ctx[2].paginationButtons);
			attr(button2, "type", "button");
			attr(button2, "tabindex", button2_tabindex_value = /*isNextDisabled*/ ctx[6] ? -1 : 0);
			button2.disabled = /*isNextDisabled*/ ctx[6];
			attr(button2, "aria-disabled", /*isNextDisabled*/ ctx[6]);
			attr(button2, "aria-label", "Next page");
			attr(button2, "data-testid", "next-button");
			attr(button3, "class", button3_class_value = /*styles*/ ctx[2].paginationButtons);
			attr(button3, "type", "button");
			attr(button3, "tabindex", button3_tabindex_value = /*isNextDisabled*/ ctx[6] ? -1 : 0);
			button3.disabled = /*isNextDisabled*/ ctx[6];
			attr(button3, "aria-disabled", /*isNextDisabled*/ ctx[6]);
			attr(button3, "aria-label", "Last page");
			attr(nav, "class", nav_class_value = /*styles*/ ctx[2].paginationContainer);
			attr(nav, "aria-label", nav_aria_label_value = `Navigation pagination, showing items ${/*from*/ ctx[0]} to ${/*to*/ ctx[1]} of total ${/*totalItems*/ ctx[3]} items`);
		},
		m(target, anchor) {
			insert(target, nav, anchor);
			append(nav, button0);
			append(button0, t0);
			append(nav, t1);
			append(nav, button1);
			append(button1, t2);
			append(nav, t3);
			append(nav, p);
			append(p, t4);
			append(nav, t5);
			append(nav, button2);
			append(button2, t6);
			append(nav, t7);
			append(nav, button3);
			append(button3, t8);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[12]),
					listen(button1, "click", /*click_handler_1*/ ctx[13]),
					listen(button2, "click", /*click_handler_2*/ ctx[14]),
					listen(button3, "click", /*click_handler_3*/ ctx[15])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*styles*/ 4 && button0_class_value !== (button0_class_value = /*styles*/ ctx[2].paginationButtons)) {
				attr(button0, "class", button0_class_value);
			}

			if (dirty & /*isPrevDisabled*/ 32 && button0_tabindex_value !== (button0_tabindex_value = /*isPrevDisabled*/ ctx[5] ? -1 : 0)) {
				attr(button0, "tabindex", button0_tabindex_value);
			}

			if (dirty & /*isPrevDisabled*/ 32) {
				button0.disabled = /*isPrevDisabled*/ ctx[5];
			}

			if (dirty & /*isPrevDisabled*/ 32) {
				attr(button0, "aria-disabled", /*isPrevDisabled*/ ctx[5]);
			}

			if (dirty & /*styles*/ 4 && button1_class_value !== (button1_class_value = /*styles*/ ctx[2].paginationButtons)) {
				attr(button1, "class", button1_class_value);
			}

			if (dirty & /*isPrevDisabled*/ 32 && button1_tabindex_value !== (button1_tabindex_value = /*isPrevDisabled*/ ctx[5] ? -1 : 0)) {
				attr(button1, "tabindex", button1_tabindex_value);
			}

			if (dirty & /*isPrevDisabled*/ 32) {
				button1.disabled = /*isPrevDisabled*/ ctx[5];
			}

			if (dirty & /*isPrevDisabled*/ 32) {
				attr(button1, "aria-disabled", /*isPrevDisabled*/ ctx[5]);
			}

			if (dirty & /*from, to, totalItems*/ 11 && t4_value !== (t4_value = `${/*from*/ ctx[0]}-${/*to*/ ctx[1]} of ${/*totalItems*/ ctx[3]}` + "")) set_data(t4, t4_value);

			if (dirty & /*styles*/ 4 && p_class_value !== (p_class_value = /*styles*/ ctx[2].paginationInfo)) {
				attr(p, "class", p_class_value);
			}

			if (dirty & /*styles*/ 4 && button2_class_value !== (button2_class_value = /*styles*/ ctx[2].paginationButtons)) {
				attr(button2, "class", button2_class_value);
			}

			if (dirty & /*isNextDisabled*/ 64 && button2_tabindex_value !== (button2_tabindex_value = /*isNextDisabled*/ ctx[6] ? -1 : 0)) {
				attr(button2, "tabindex", button2_tabindex_value);
			}

			if (dirty & /*isNextDisabled*/ 64) {
				button2.disabled = /*isNextDisabled*/ ctx[6];
			}

			if (dirty & /*isNextDisabled*/ 64) {
				attr(button2, "aria-disabled", /*isNextDisabled*/ ctx[6]);
			}

			if (dirty & /*styles*/ 4 && button3_class_value !== (button3_class_value = /*styles*/ ctx[2].paginationButtons)) {
				attr(button3, "class", button3_class_value);
			}

			if (dirty & /*isNextDisabled*/ 64 && button3_tabindex_value !== (button3_tabindex_value = /*isNextDisabled*/ ctx[6] ? -1 : 0)) {
				attr(button3, "tabindex", button3_tabindex_value);
			}

			if (dirty & /*isNextDisabled*/ 64) {
				button3.disabled = /*isNextDisabled*/ ctx[6];
			}

			if (dirty & /*isNextDisabled*/ 64) {
				attr(button3, "aria-disabled", /*isNextDisabled*/ ctx[6]);
			}

			if (dirty & /*styles*/ 4 && nav_class_value !== (nav_class_value = /*styles*/ ctx[2].paginationContainer)) {
				attr(nav, "class", nav_class_value);
			}

			if (dirty & /*from, to, totalItems*/ 11 && nav_aria_label_value !== (nav_aria_label_value = `Navigation pagination, showing items ${/*from*/ ctx[0]} to ${/*to*/ ctx[1]} of total ${/*totalItems*/ ctx[3]} items`)) {
				attr(nav, "aria-label", nav_aria_label_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(nav);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let hasMoreItems;
	let isPrevDisabled;
	let isNextDisabled;
	let { activePage = 1 } = $$props;
	let { from = 0 } = $$props;
	let { rowsPerPage = 5 } = $$props;

	let { styles = {
		paginationContainer: "",
		paginationInfo: "",
		paginationButtons: ""
	} } = $$props;

	let { to = 0 } = $$props;
	let { totalItems = 0 } = $$props;
	let { rows } = $$props;
	let totalPages = 0;

	const handleClickPage = (direction, totalPages) => {
		switch (direction) {
			case "First":
				$$invalidate(8, activePage = 1);
				break;
			case "Prev":
				$$invalidate(8, activePage = activePage !== 1 ? $$invalidate(8, activePage -= 1) : 1);
				break;
			case "Next":
				$$invalidate(8, activePage = activePage !== totalPages
				? $$invalidate(8, activePage += 1)
				: totalPages);
				break;
			case "Last":
				$$invalidate(8, activePage = totalPages);
				break;
			default:
				return;
		}
	};

	const click_handler = () => handleClickPage("First", totalPages);
	const click_handler_1 = () => handleClickPage("Prev", totalPages);
	const click_handler_2 = () => handleClickPage("Next", totalPages);
	const click_handler_3 = () => handleClickPage("Last", totalPages);

	$$self.$$set = $$props => {
		if ("activePage" in $$props) $$invalidate(8, activePage = $$props.activePage);
		if ("from" in $$props) $$invalidate(0, from = $$props.from);
		if ("rowsPerPage" in $$props) $$invalidate(9, rowsPerPage = $$props.rowsPerPage);
		if ("styles" in $$props) $$invalidate(2, styles = $$props.styles);
		if ("to" in $$props) $$invalidate(1, to = $$props.to);
		if ("totalItems" in $$props) $$invalidate(3, totalItems = $$props.totalItems);
		if ("rows" in $$props) $$invalidate(10, rows = $$props.rows);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*activePage, rows, rowsPerPage*/ 1792) {
			$$invalidate(0, from = activePage === 1
			? rows.length ? 1 : 0
			: (activePage - 1) * rowsPerPage + 1);
		}

		if ($$self.$$.dirty & /*from, rowsPerPage, totalItems*/ 521) {
			$$invalidate(11, hasMoreItems = from + rowsPerPage < totalItems);
		}

		if ($$self.$$.dirty & /*activePage, rows*/ 1280) {
			$$invalidate(5, isPrevDisabled = activePage === 1 || !rows.length);
		}

		if ($$self.$$.dirty & /*totalItems, rowsPerPage*/ 520) {
			$$invalidate(4, totalPages = Math.ceil(totalItems / rowsPerPage));
		}

		if ($$self.$$.dirty & /*activePage, totalPages, hasMoreItems, rows*/ 3344) {
			$$invalidate(6, isNextDisabled = activePage === totalPages && !hasMoreItems || !rows.length);
		}

		if ($$self.$$.dirty & /*activePage, rowsPerPage, totalItems*/ 776) {
			$$invalidate(1, to = activePage * rowsPerPage > totalItems
			? totalItems
			: activePage * rowsPerPage);
		}
	};

	return [
		from,
		to,
		styles,
		totalItems,
		totalPages,
		isPrevDisabled,
		isNextDisabled,
		handleClickPage,
		activePage,
		rowsPerPage,
		rows,
		hasMoreItems,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3
	];
}

class Pagination extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
			activePage: 8,
			from: 0,
			rowsPerPage: 9,
			styles: 2,
			to: 1,
			totalItems: 3,
			rows: 10
		});
	}
}

/* src\SvelteTable.svelte generated by Svelte v3.38.2 */
const get_empty_slot_changes = dirty => ({});
const get_empty_slot_context = ctx => ({});

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[36] = list[i];
	child_ctx[38] = i;
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[39] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[39] = list[i];
	child_ctx[43] = i;
	return child_ctx;
}

const get_row_slot_changes = dirty => ({ row: dirty[0] & /*sortedRows*/ 4096 });
const get_row_slot_context = ctx => ({ row: /*row*/ ctx[36], n: /*n*/ ctx[38] });

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[39] = list[i];
	child_ctx[43] = i;
	return child_ctx;
}

const get_header_slot_changes = dirty => ({
	sortOrder: dirty[0] & /*sortOrder*/ 1,
	sortBy: dirty[0] & /*sortBy*/ 8
});

const get_header_slot_context = ctx => ({
	sortOrder: /*sortOrder*/ ctx[0],
	sortBy: /*sortBy*/ ctx[3]
});

// (109:0) {#if activeModal}
function create_if_block_10(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*activeModal*/ ctx[10];

	function switch_props(ctx) {
		return {};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props());
		switch_instance.$on("toggled", /*toggled_handler*/ ctx[21]);
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
			if (switch_value !== (switch_value = /*activeModal*/ ctx[10])) {
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
					switch_instance.$on("toggled", /*toggled_handler*/ ctx[21]);
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

// (133:12) {:else}
function create_else_block_4(ctx) {
	let t_value = /*col*/ ctx[39].title + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*columns*/ 16 && t_value !== (t_value = /*col*/ ctx[39].title + "")) set_data(t, t_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (127:12) {#if col.titleComponent}
function create_if_block_9(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [/*col*/ ctx[39].titleComponent.props || {}, { col: /*col*/ ctx[39] }];
	var switch_value = /*col*/ ctx[39].titleComponent.component || /*col*/ ctx[39].titleComponent;

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
			const switch_instance_changes = (dirty[0] & /*columns*/ 16)
			? get_spread_update(switch_instance_spread_levels, [
					get_spread_object(/*col*/ ctx[39].titleComponent.props || {}),
					{ col: /*col*/ ctx[39] }
				])
			: {};

			if (switch_value !== (switch_value = /*col*/ ctx[39].titleComponent.component || /*col*/ ctx[39].titleComponent)) {
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

// (136:12) {#if col.sortable}
function create_if_block_7(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block_8, create_else_block_3];
	const if_blocks = [];

	function select_block_type_1(ctx, dirty) {
		if (/*sortBy*/ ctx[3] === /*col*/ ctx[39].key) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_1(ctx);
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
			current_block_type_index = select_block_type_1(ctx);

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

// (139:14) {:else}
function create_else_block_3(ctx) {
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

// (137:14) {#if sortBy === col.key}
function create_if_block_8(ctx) {
	let iconsorting;
	let current;

	iconsorting = new IconSorting({
			props: { sortOrder: /*sortOrder*/ ctx[0] }
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
			if (dirty[0] & /*sortOrder*/ 1) iconsorting_changes.sortOrder = /*sortOrder*/ ctx[0];
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

// (144:12) {#if col.helpModal}
function create_if_block_4(ctx) {
	let button;
	let icontooltip;
	let t0;
	let span;
	let t1;
	let button_class_value;
	let current;
	let mounted;
	let dispose;
	icontooltip = new IconTooltip({});
	let if_block = (/*col*/ ctx[39].title || /*col*/ ctx[39].titleComponent) && create_if_block_5(ctx);

	function click_handler() {
		return /*click_handler*/ ctx[22](/*col*/ ctx[39]);
	}

	return {
		c() {
			button = element("button");
			create_component(icontooltip.$$.fragment);
			t0 = space();
			span = element("span");
			t1 = text("Show tooltip\r\n                  ");
			if (if_block) if_block.c();
			attr(span, "class", "sr-only");
			attr(button, "class", button_class_value = /*styles*/ ctx[7].helpButton);
			attr(button, "type", "button");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			mount_component(icontooltip, button, null);
			append(button, t0);
			append(button, span);
			append(span, t1);
			if (if_block) if_block.m(span, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (/*col*/ ctx[39].title || /*col*/ ctx[39].titleComponent) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*columns*/ 16) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_5(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(span, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty[0] & /*styles*/ 128 && button_class_value !== (button_class_value = /*styles*/ ctx[7].helpButton)) {
				attr(button, "class", button_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(icontooltip.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(icontooltip.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(button);
			destroy_component(icontooltip);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};
}

// (153:18) {#if col.title || col.titleComponent}
function create_if_block_5(ctx) {
	let t;
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block_6, create_else_block_2];
	const if_blocks = [];

	function select_block_type_2(ctx, dirty) {
		if (/*col*/ ctx[39].titleComponent) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_2(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			t = text("for\r\n                    ");
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			insert(target, t, anchor);
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
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
			if (detaching) detach(t);
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (162:20) {:else}
function create_else_block_2(ctx) {
	let t_value = /*col*/ ctx[39].title + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*columns*/ 16 && t_value !== (t_value = /*col*/ ctx[39].title + "")) set_data(t, t_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (155:20) {#if col.titleComponent}
function create_if_block_6(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	const switch_instance_spread_levels = [/*col*/ ctx[39].titleComponent.props || {}, { col: /*col*/ ctx[39] }];
	var switch_value = /*col*/ ctx[39].titleComponent.component || /*col*/ ctx[39].titleComponent;

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
			const switch_instance_changes = (dirty[0] & /*columns*/ 16)
			? get_spread_update(switch_instance_spread_levels, [
					get_spread_object(/*col*/ ctx[39].titleComponent.props || {}),
					{ col: /*col*/ ctx[39] }
				])
			: {};

			if (switch_value !== (switch_value = /*col*/ ctx[39].titleComponent.component || /*col*/ ctx[39].titleComponent)) {
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

// (120:8) {#each columns as col, i}
function create_each_block_3(ctx) {
	let th;
	let current_block_type_index;
	let if_block0;
	let t0;
	let t1;
	let t2;
	let th_class_value;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block_9, create_else_block_4];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*col*/ ctx[39].titleComponent) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	let if_block1 = /*col*/ ctx[39].sortable && create_if_block_7(ctx);
	let if_block2 = /*col*/ ctx[39].helpModal && create_if_block_4(ctx);

	function click_handler_1(...args) {
		return /*click_handler_1*/ ctx[23](/*col*/ ctx[39], ...args);
	}

	return {
		c() {
			th = element("th");
			if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			attr(th, "class", th_class_value = `cursor-pointer ${/*styles*/ ctx[7].th} ${/*col*/ ctx[39].headerClass}`);
			toggle_class(th, "cursor-pointer", /*col*/ ctx[39].sortable);
			toggle_class(th, "pr-4", /*columns*/ ctx[4].length - 1 === /*i*/ ctx[43]);
		},
		m(target, anchor) {
			insert(target, th, anchor);
			if_blocks[current_block_type_index].m(th, null);
			append(th, t0);
			if (if_block1) if_block1.m(th, null);
			append(th, t1);
			if (if_block2) if_block2.m(th, null);
			append(th, t2);
			current = true;

			if (!mounted) {
				dispose = listen(th, "click", function () {
					if (is_function(/*col*/ ctx[39].sortable ? click_handler_1 : undefined)) (/*col*/ ctx[39].sortable ? click_handler_1 : undefined).apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
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
				if_block0 = if_blocks[current_block_type_index];

				if (!if_block0) {
					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block0.c();
				} else {
					if_block0.p(ctx, dirty);
				}

				transition_in(if_block0, 1);
				if_block0.m(th, t0);
			}

			if (/*col*/ ctx[39].sortable) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*columns*/ 16) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_7(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(th, t1);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (/*col*/ ctx[39].helpModal) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty[0] & /*columns*/ 16) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block_4(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(th, t2);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (!current || dirty[0] & /*styles, columns*/ 144 && th_class_value !== (th_class_value = `cursor-pointer ${/*styles*/ ctx[7].th} ${/*col*/ ctx[39].headerClass}`)) {
				attr(th, "class", th_class_value);
			}

			if (dirty[0] & /*styles, columns, columns*/ 144) {
				toggle_class(th, "cursor-pointer", /*col*/ ctx[39].sortable);
			}

			if (dirty[0] & /*styles, columns, columns*/ 144) {
				toggle_class(th, "pr-4", /*columns*/ ctx[4].length - 1 === /*i*/ ctx[43]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(th);
			if_blocks[current_block_type_index].d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			mounted = false;
			dispose();
		}
	};
}

// (118:45)         
function fallback_block_1(ctx) {
	let tr;
	let current;
	let each_value_3 = /*columns*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
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
			if (dirty[0] & /*styles, columns, handleClickCol, activeModal, sortOrder, sortBy*/ 17561) {
				each_value_3 = /*columns*/ ctx[4];
				let i;

				for (i = 0; i < each_value_3.length; i += 1) {
					const child_ctx = get_each_context_3(ctx, each_value_3, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_3(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tr, null);
					}
				}

				group_outros();

				for (i = each_value_3.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_3.length; i += 1) {
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

// (226:4) {:else}
function create_else_block_1(ctx) {
	let current;
	const empty_slot_template = /*#slots*/ ctx[20].empty;
	const empty_slot = create_slot(empty_slot_template, ctx, /*$$scope*/ ctx[19], get_empty_slot_context);

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
				if (empty_slot.p && (!current || dirty[0] & /*$$scope*/ 524288)) {
					update_slot(empty_slot, empty_slot_template, ctx, /*$$scope*/ ctx[19], dirty, get_empty_slot_changes, get_empty_slot_context);
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

// (175:4) {#if sortedRows.length}
function create_if_block_1(ctx) {
	let each_1_anchor;
	let current;
	let each_value = /*sortedRows*/ ctx[12];
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
			if (dirty[0] & /*columns, sortedRows, styles, handleClickRow, handleClickCell, $$scope*/ 626832) {
				each_value = /*sortedRows*/ ctx[12];
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

// (209:16) {:else}
function create_else_block(ctx) {
	let div;

	let raw_value = (/*col*/ ctx[39].renderValue
	? /*col*/ ctx[39].renderValue(/*row*/ ctx[36])
	: /*col*/ ctx[39].value(/*row*/ ctx[36]) || "") + "";

	let div_class_value;

	return {
		c() {
			div = element("div");
			attr(div, "class", div_class_value = /*styles*/ ctx[7].cell);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = raw_value;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*columns, sortedRows*/ 4112 && raw_value !== (raw_value = (/*col*/ ctx[39].renderValue
			? /*col*/ ctx[39].renderValue(/*row*/ ctx[36])
			: /*col*/ ctx[39].value(/*row*/ ctx[36]) || "") + "")) div.innerHTML = raw_value;
			if (dirty[0] & /*styles*/ 128 && div_class_value !== (div_class_value = /*styles*/ ctx[7].cell)) {
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

// (201:16) {#if col.component}
function create_if_block_3(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;

	const switch_instance_spread_levels = [
		{ class: /*styles*/ ctx[7].cell },
		/*col*/ ctx[39].component.props || {},
		{ row: /*row*/ ctx[36] },
		{ col: /*col*/ ctx[39] }
	];

	var switch_value = /*col*/ ctx[39].component.component || /*col*/ ctx[39].component;

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
			const switch_instance_changes = (dirty[0] & /*styles, columns, sortedRows*/ 4240)
			? get_spread_update(switch_instance_spread_levels, [
					dirty[0] & /*styles*/ 128 && { class: /*styles*/ ctx[7].cell },
					dirty[0] & /*columns*/ 16 && get_spread_object(/*col*/ ctx[39].component.props || {}),
					dirty[0] & /*sortedRows*/ 4096 && { row: /*row*/ ctx[36] },
					dirty[0] & /*columns*/ 16 && { col: /*col*/ ctx[39] }
				])
			: {};

			if (switch_value !== (switch_value = /*col*/ ctx[39].component.component || /*col*/ ctx[39].component)) {
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

// (193:12) {#each columns as col, i}
function create_each_block_2(ctx) {
	let td;
	let current_block_type_index;
	let if_block;
	let t;
	let td_class_value;
	let current;
	let mounted;
	let dispose;
	const if_block_creators = [create_if_block_3, create_else_block];
	const if_blocks = [];

	function select_block_type_4(ctx, dirty) {
		if (/*col*/ ctx[39].component) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_4(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	function click_handler_2(...args) {
		return /*click_handler_2*/ ctx[24](/*row*/ ctx[36], /*col*/ ctx[39], ...args);
	}

	return {
		c() {
			td = element("td");
			if_block.c();
			t = space();
			attr(td, "class", td_class_value = `${/*col*/ ctx[39].class} ${/*styles*/ ctx[7].td}`);
			toggle_class(td, "pr-4", /*columns*/ ctx[4].length - 1 === /*i*/ ctx[43]);
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
			current_block_type_index = select_block_type_4(ctx);

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

			if (!current || dirty[0] & /*columns, styles*/ 144 && td_class_value !== (td_class_value = `${/*col*/ ctx[39].class} ${/*styles*/ ctx[7].td}`)) {
				attr(td, "class", td_class_value);
			}

			if (dirty[0] & /*columns, styles, columns*/ 144) {
				toggle_class(td, "pr-4", /*columns*/ ctx[4].length - 1 === /*i*/ ctx[43]);
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

// (220:12) {#if col.expandedRowsComponent}
function create_if_block_2(ctx) {
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*col*/ ctx[39].expandedRowsComponent;

	function switch_props(ctx) {
		return {
			props: {
				row: /*row*/ ctx[36],
				col: /*col*/ ctx[39]
			}
		};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
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
			const switch_instance_changes = {};
			if (dirty[0] & /*sortedRows*/ 4096) switch_instance_changes.row = /*row*/ ctx[36];
			if (dirty[0] & /*columns*/ 16) switch_instance_changes.col = /*col*/ ctx[39];

			if (switch_value !== (switch_value = /*col*/ ctx[39].expandedRowsComponent)) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
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

// (219:10) {#each columns as col}
function create_each_block_1(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*col*/ ctx[39].expandedRowsComponent && create_if_block_2(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*col*/ ctx[39].expandedRowsComponent) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*columns*/ 16) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
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
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (177:35)             
function fallback_block(ctx) {
	let tr;
	let tr_class_value;
	let t0;
	let t1;
	let current;
	let mounted;
	let dispose;
	let each_value_2 = /*columns*/ ctx[4];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	function click_handler_3(...args) {
		return /*click_handler_3*/ ctx[25](/*row*/ ctx[36], ...args);
	}

	function keydown_handler(...args) {
		return /*keydown_handler*/ ctx[26](/*row*/ ctx[36], ...args);
	}

	let each_value_1 = /*columns*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			tr = element("tr");

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t0 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			attr(tr, "tabindex", "0");
			attr(tr, "class", tr_class_value = /*styles*/ ctx[7].tr);
			toggle_class(tr, "bg-gray-100", /*row*/ ctx[36]["expandRow"]?.show);
		},
		m(target, anchor) {
			insert(target, tr, anchor);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(tr, null);
			}

			insert(target, t0, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, t1, anchor);
			current = true;

			if (!mounted) {
				dispose = [
					listen(tr, "click", click_handler_3),
					listen(tr, "keydown", keydown_handler)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*columns, styles, handleClickCell, sortedRows*/ 69776) {
				each_value_2 = /*columns*/ ctx[4];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_2(child_ctx);
						each_blocks_1[i].c();
						transition_in(each_blocks_1[i], 1);
						each_blocks_1[i].m(tr, null);
					}
				}

				group_outros();

				for (i = each_value_2.length; i < each_blocks_1.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (!current || dirty[0] & /*styles*/ 128 && tr_class_value !== (tr_class_value = /*styles*/ ctx[7].tr)) {
				attr(tr, "class", tr_class_value);
			}

			if (dirty[0] & /*styles, sortedRows*/ 4224) {
				toggle_class(tr, "bg-gray-100", /*row*/ ctx[36]["expandRow"]?.show);
			}

			if (dirty[0] & /*columns, sortedRows*/ 4112) {
				each_value_1 = /*columns*/ ctx[4];
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
						each_blocks[i].m(t1.parentNode, t1);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
					out_1(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_2.length; i += 1) {
				transition_in(each_blocks_1[i]);
			}

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks_1 = each_blocks_1.filter(Boolean);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				transition_out(each_blocks_1[i]);
			}

			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(tr);
			destroy_each(each_blocks_1, detaching);
			if (detaching) detach(t0);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(t1);
			mounted = false;
			run_all(dispose);
		}
	};
}

// (176:6) {#each sortedRows as row, n}
function create_each_block(ctx) {
	let current;
	const row_slot_template = /*#slots*/ ctx[20].row;
	const row_slot = create_slot(row_slot_template, ctx, /*$$scope*/ ctx[19], get_row_slot_context);
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
				if (row_slot.p && (!current || dirty[0] & /*$$scope, sortedRows*/ 528384)) {
					update_slot(row_slot, row_slot_template, ctx, /*$$scope*/ ctx[19], dirty, get_row_slot_changes, get_row_slot_context);
				}
			} else {
				if (row_slot_or_fallback && row_slot_or_fallback.p && dirty[0] & /*columns, sortedRows, styles*/ 4240) {
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

// (231:0) {#if shouldPaginate}
function create_if_block(ctx) {
	let pagination;
	let updating_activePage;
	let updating_from;
	let updating_to;
	let current;

	function pagination_activePage_binding(value) {
		/*pagination_activePage_binding*/ ctx[27](value);
	}

	function pagination_from_binding(value) {
		/*pagination_from_binding*/ ctx[28](value);
	}

	function pagination_to_binding(value) {
		/*pagination_to_binding*/ ctx[29](value);
	}

	let pagination_props = {
		rowsPerPage: /*rowsPerPage*/ ctx[6],
		styles: /*styles*/ ctx[7],
		totalItems: /*totalItems*/ ctx[1],
		rows: /*rows*/ ctx[5]
	};

	if (/*activePage*/ ctx[2] !== void 0) {
		pagination_props.activePage = /*activePage*/ ctx[2];
	}

	if (/*from*/ ctx[8] !== void 0) {
		pagination_props.from = /*from*/ ctx[8];
	}

	if (/*to*/ ctx[9] !== void 0) {
		pagination_props.to = /*to*/ ctx[9];
	}

	pagination = new Pagination({ props: pagination_props });
	binding_callbacks.push(() => bind(pagination, "activePage", pagination_activePage_binding));
	binding_callbacks.push(() => bind(pagination, "from", pagination_from_binding));
	binding_callbacks.push(() => bind(pagination, "to", pagination_to_binding));

	return {
		c() {
			create_component(pagination.$$.fragment);
		},
		m(target, anchor) {
			mount_component(pagination, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const pagination_changes = {};
			if (dirty[0] & /*rowsPerPage*/ 64) pagination_changes.rowsPerPage = /*rowsPerPage*/ ctx[6];
			if (dirty[0] & /*styles*/ 128) pagination_changes.styles = /*styles*/ ctx[7];
			if (dirty[0] & /*totalItems*/ 2) pagination_changes.totalItems = /*totalItems*/ ctx[1];
			if (dirty[0] & /*rows*/ 32) pagination_changes.rows = /*rows*/ ctx[5];

			if (!updating_activePage && dirty[0] & /*activePage*/ 4) {
				updating_activePage = true;
				pagination_changes.activePage = /*activePage*/ ctx[2];
				add_flush_callback(() => updating_activePage = false);
			}

			if (!updating_from && dirty[0] & /*from*/ 256) {
				updating_from = true;
				pagination_changes.from = /*from*/ ctx[8];
				add_flush_callback(() => updating_from = false);
			}

			if (!updating_to && dirty[0] & /*to*/ 512) {
				updating_to = true;
				pagination_changes.to = /*to*/ ctx[9];
				add_flush_callback(() => updating_to = false);
			}

			pagination.$set(pagination_changes);
		},
		i(local) {
			if (current) return;
			transition_in(pagination.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(pagination.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(pagination, detaching);
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
	let t2;
	let if_block2_anchor;
	let current;
	let if_block0 = /*activeModal*/ ctx[10] && create_if_block_10(ctx);
	const header_slot_template = /*#slots*/ ctx[20].header;
	const header_slot = create_slot(header_slot_template, ctx, /*$$scope*/ ctx[19], get_header_slot_context);
	const header_slot_or_fallback = header_slot || fallback_block_1(ctx);
	const if_block_creators = [create_if_block_1, create_else_block_1];
	const if_blocks = [];

	function select_block_type_3(ctx, dirty) {
		if (/*sortedRows*/ ctx[12].length) return 0;
		return 1;
	}

	current_block_type_index = select_block_type_3(ctx);
	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	let if_block2 = /*shouldPaginate*/ ctx[11] && create_if_block(ctx);

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
			t2 = space();
			if (if_block2) if_block2.c();
			if_block2_anchor = empty();
			attr(thead, "class", thead_class_value = /*styles*/ ctx[7].thead);
			attr(tbody, "class", tbody_class_value = /*styles*/ ctx[7].tbody);
			attr(table, "class", table_class_value = /*styles*/ ctx[7].table);
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
			insert(target, t2, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, if_block2_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*activeModal*/ ctx[10]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*activeModal*/ 1024) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_10(ctx);
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
				if (header_slot.p && (!current || dirty[0] & /*$$scope, sortOrder, sortBy*/ 524297)) {
					update_slot(header_slot, header_slot_template, ctx, /*$$scope*/ ctx[19], dirty, get_header_slot_changes, get_header_slot_context);
				}
			} else {
				if (header_slot_or_fallback && header_slot_or_fallback.p && dirty[0] & /*columns, styles, activeModal, sortOrder, sortBy*/ 1177) {
					header_slot_or_fallback.p(ctx, dirty);
				}
			}

			if (!current || dirty[0] & /*styles*/ 128 && thead_class_value !== (thead_class_value = /*styles*/ ctx[7].thead)) {
				attr(thead, "class", thead_class_value);
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type_3(ctx);

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

			if (!current || dirty[0] & /*styles*/ 128 && tbody_class_value !== (tbody_class_value = /*styles*/ ctx[7].tbody)) {
				attr(tbody, "class", tbody_class_value);
			}

			if (!current || dirty[0] & /*styles*/ 128 && table_class_value !== (table_class_value = /*styles*/ ctx[7].table)) {
				attr(table, "class", table_class_value);
			}

			if (/*shouldPaginate*/ ctx[11]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty[0] & /*shouldPaginate*/ 2048) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(header_slot_or_fallback, local);
			transition_in(if_block1);
			transition_in(if_block2);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(header_slot_or_fallback, local);
			transition_out(if_block1);
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (if_block0) if_block0.d(detaching);
			if (detaching) detach(t0);
			if (detaching) detach(table);
			if (header_slot_or_fallback) header_slot_or_fallback.d(detaching);
			if_blocks[current_block_type_index].d();
			if (detaching) detach(t2);
			if (if_block2) if_block2.d(detaching);
			if (detaching) detach(if_block2_anchor);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let shouldPaginate;
	let sortedRows;
	let { $$slots: slots = {}, $$scope } = $$props;
	const dispatch = createEventDispatcher();
	let { columns } = $$props;
	let { rows } = $$props;
	let { sortBy = "" } = $$props;
	let { sortOrder = 0 } = $$props;
	let { rowsPerPage = 5 } = $$props;
	let { totalItems = 0 } = $$props;
	let { hasPagination = false } = $$props;
	let { isDynamicLoading = false } = $$props;
	let { activePage = 1 } = $$props;
	let activeModal = null;
	let from = 0;
	let to = 0;

	const removeModal = state => {
		if (!state) {
			$$invalidate(10, activeModal = null);
		}
	};

	let { styles = {
		table: "",
		thead: "",
		th: "",
		tbody: "",
		tr: "",
		td: "",
		cell: "",
		helpButton: "",
		paginationContainer: "",
		paginationInfo: "",
		paginationButtons: ""
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

	const sortRows = (rows, sortOrder, from, to) => {
		rows.sort((a, b) => {
			if (typeof a[sortBy] === "string" || typeof b[sortBy] === "string") return sortStrings(a[sortBy], b[sortBy]);

			if (a[sortBy] > b[sortBy]) {
				return sortOrder;
			} else if (a[sortBy] < b[sortBy]) {
				return -sortOrder;
			}

			return 0;
		});

		if (isDynamicLoading || !shouldPaginate) return rows;
		return rows.slice(from - (activePage && 1), to);
	};

	const updateSortOrder = colKey => colKey === sortBy
	? $$invalidate(0, sortOrder = sortOrder === 1 ? -1 : 1)
	: $$invalidate(0, sortOrder = 1);

	const handleClickCol = (event, col) => {
		updateSortOrder(col.key);
		$$invalidate(3, sortBy = col.key);
		dispatch("clickCol", { event, col, key: col.key });
	};

	const handleClickRow = (event, row) => {
		dispatch("clickRow", { event, row });
	};

	const handleClickCell = (event, row, key) => {
		dispatch("clickCell", { event, row, key });
	};

	const setTotalItems = (totalItems, rows) => {
		if (isDynamicLoading) {
			return totalItems !== 0 ? totalItems : rows.length;
		}

		return rows.length;
	};

	const toggled_handler = ({ isOpen }) => removeModal(isOpen);
	const click_handler = col => $$invalidate(10, activeModal = col.helpModal);
	const click_handler_1 = (col, e) => handleClickCol(e, col);

	const click_handler_2 = (row, col, e) => {
		handleClickCell(e, row, col.key);
	};

	const click_handler_3 = (row, e) => {
		handleClickRow(e, row);
		e.currentTarget.toggleAttribute("aria-expanded");
	};

	const keydown_handler = (row, e) => {
		if (e.code === "Enter" || e.code === "Space") {
			handleClickRow(e, row);
			e.currentTarget.toggleAttribute("aria-expanded");
		}
	};

	function pagination_activePage_binding(value) {
		activePage = value;
		$$invalidate(2, activePage);
	}

	function pagination_from_binding(value) {
		from = value;
		$$invalidate(8, from);
	}

	function pagination_to_binding(value) {
		to = value;
		$$invalidate(9, to);
	}

	$$self.$$set = $$props => {
		if ("columns" in $$props) $$invalidate(4, columns = $$props.columns);
		if ("rows" in $$props) $$invalidate(5, rows = $$props.rows);
		if ("sortBy" in $$props) $$invalidate(3, sortBy = $$props.sortBy);
		if ("sortOrder" in $$props) $$invalidate(0, sortOrder = $$props.sortOrder);
		if ("rowsPerPage" in $$props) $$invalidate(6, rowsPerPage = $$props.rowsPerPage);
		if ("totalItems" in $$props) $$invalidate(1, totalItems = $$props.totalItems);
		if ("hasPagination" in $$props) $$invalidate(17, hasPagination = $$props.hasPagination);
		if ("isDynamicLoading" in $$props) $$invalidate(18, isDynamicLoading = $$props.isDynamicLoading);
		if ("activePage" in $$props) $$invalidate(2, activePage = $$props.activePage);
		if ("styles" in $$props) $$invalidate(7, styles = $$props.styles);
		if ("$$scope" in $$props) $$invalidate(19, $$scope = $$props.$$scope);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*totalItems, rows*/ 34) {
			$$invalidate(1, totalItems = setTotalItems(totalItems, rows));
		}

		if ($$self.$$.dirty[0] & /*hasPagination, totalItems, rowsPerPage*/ 131138) {
			$$invalidate(11, shouldPaginate = hasPagination && totalItems > rowsPerPage);
		}

		if ($$self.$$.dirty[0] & /*rows, sortOrder, from, to*/ 801) {
			$$invalidate(12, sortedRows = sortRows(rows, sortOrder, from, to));
		}

		if ($$self.$$.dirty[0] & /*activePage*/ 4) {
			dispatch("changePage", { activePage });
		}
	};

	return [
		sortOrder,
		totalItems,
		activePage,
		sortBy,
		columns,
		rows,
		rowsPerPage,
		styles,
		from,
		to,
		activeModal,
		shouldPaginate,
		sortedRows,
		removeModal,
		handleClickCol,
		handleClickRow,
		handleClickCell,
		hasPagination,
		isDynamicLoading,
		$$scope,
		slots,
		toggled_handler,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		keydown_handler,
		pagination_activePage_binding,
		pagination_from_binding,
		pagination_to_binding
	];
}

class SvelteTable extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			safe_not_equal,
			{
				columns: 4,
				rows: 5,
				sortBy: 3,
				sortOrder: 0,
				rowsPerPage: 6,
				totalItems: 1,
				hasPagination: 17,
				isDynamicLoading: 18,
				activePage: 2,
				styles: 7
			},
			[-1, -1]
		);
	}
}

export { SvelteTable };
