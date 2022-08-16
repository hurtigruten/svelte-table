(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.window = global.window || {}));
})(this, (function (exports) { 'use strict';

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
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function compute_slots(slots) {
        const result = {};
        for (const key in slots) {
            result[key] = true;
        }
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function append_styles(target, style_sheet_id, styles) {
        const append_styles_to = get_root_for_style(target);
        if (!append_styles_to.getElementById(style_sheet_id)) {
            const style = element('style');
            style.id = style_sheet_id;
            style.textContent = styles;
            append_stylesheet(append_styles_to, style);
        }
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
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
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
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
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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

    /* src/Pagination.svelte generated by Svelte v3.49.0 */

    function create_fragment$1(ctx) {
    	let nav;
    	let button0;
    	let t0;
    	let button0_class_value;
    	let button0_disabled_value;
    	let button0_aria_disabled_value;
    	let t1;
    	let button1;
    	let t2;
    	let button1_class_value;
    	let button1_disabled_value;
    	let button1_aria_disabled_value;
    	let t3;
    	let p;
    	let t4_value = `${/*from*/ ctx[2]}-${/*to*/ ctx[1]} of ${/*totalItems*/ ctx[7]}` + "";
    	let t4;
    	let p_class_value;
    	let t5;
    	let button2;
    	let t6;
    	let button2_class_value;
    	let button2_disabled_value;
    	let button2_aria_disabled_value;
    	let t7;
    	let button3;
    	let t8;
    	let button3_class_value;
    	let button3_disabled_value;
    	let button3_aria_disabled_value;
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
    			attr(button0, "class", button0_class_value = /*classes*/ ctx[0].paginationButtons);
    			attr(button0, "type", "button");
    			button0.disabled = button0_disabled_value = !/*enabled*/ ctx[8].firstPage;
    			attr(button0, "aria-disabled", button0_aria_disabled_value = !/*enabled*/ ctx[8].firstPage);
    			attr(button0, "aria-label", "First page");
    			attr(button1, "class", button1_class_value = /*classes*/ ctx[0].paginationButtons);
    			attr(button1, "type", "button");
    			button1.disabled = button1_disabled_value = !/*enabled*/ ctx[8].prevPage;
    			attr(button1, "aria-disabled", button1_aria_disabled_value = !/*enabled*/ ctx[8].prevPage);
    			attr(button1, "aria-label", "Previous page");
    			attr(button1, "data-testid", "previous-button");
    			attr(p, "class", p_class_value = /*classes*/ ctx[0].paginationInfo);
    			attr(p, "aria-hidden", "true");
    			attr(button2, "class", button2_class_value = /*classes*/ ctx[0].paginationButtons);
    			attr(button2, "type", "button");
    			button2.disabled = button2_disabled_value = !/*enabled*/ ctx[8].nextPage;
    			attr(button2, "aria-disabled", button2_aria_disabled_value = !/*enabled*/ ctx[8].nextPage);
    			attr(button2, "aria-label", "Next page");
    			attr(button2, "data-testid", "next-button");
    			attr(button3, "class", button3_class_value = /*classes*/ ctx[0].paginationButtons);
    			attr(button3, "type", "button");
    			button3.disabled = button3_disabled_value = !/*enabled*/ ctx[8].lastPage;
    			attr(button3, "aria-disabled", button3_aria_disabled_value = !/*enabled*/ ctx[8].lastPage);
    			attr(button3, "aria-label", "Last page");
    			attr(nav, "class", nav_class_value = /*classes*/ ctx[0].paginationContainer);
    			attr(nav, "aria-label", nav_aria_label_value = `Navigation pagination, showing items ${/*from*/ ctx[2]} to ${/*to*/ ctx[1]} of total ${/*totalItems*/ ctx[7]} items`);
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
    					listen(button0, "click", function () {
    						if (is_function(/*firstPage*/ ctx[5])) /*firstPage*/ ctx[5].apply(this, arguments);
    					}),
    					listen(button1, "click", function () {
    						if (is_function(/*prevPage*/ ctx[4])) /*prevPage*/ ctx[4].apply(this, arguments);
    					}),
    					listen(button2, "click", function () {
    						if (is_function(/*nextPage*/ ctx[3])) /*nextPage*/ ctx[3].apply(this, arguments);
    					}),
    					listen(button3, "click", function () {
    						if (is_function(/*lastPage*/ ctx[6])) /*lastPage*/ ctx[6].apply(this, arguments);
    					})
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*classes*/ 1 && button0_class_value !== (button0_class_value = /*classes*/ ctx[0].paginationButtons)) {
    				attr(button0, "class", button0_class_value);
    			}

    			if (dirty & /*enabled*/ 256 && button0_disabled_value !== (button0_disabled_value = !/*enabled*/ ctx[8].firstPage)) {
    				button0.disabled = button0_disabled_value;
    			}

    			if (dirty & /*enabled*/ 256 && button0_aria_disabled_value !== (button0_aria_disabled_value = !/*enabled*/ ctx[8].firstPage)) {
    				attr(button0, "aria-disabled", button0_aria_disabled_value);
    			}

    			if (dirty & /*classes*/ 1 && button1_class_value !== (button1_class_value = /*classes*/ ctx[0].paginationButtons)) {
    				attr(button1, "class", button1_class_value);
    			}

    			if (dirty & /*enabled*/ 256 && button1_disabled_value !== (button1_disabled_value = !/*enabled*/ ctx[8].prevPage)) {
    				button1.disabled = button1_disabled_value;
    			}

    			if (dirty & /*enabled*/ 256 && button1_aria_disabled_value !== (button1_aria_disabled_value = !/*enabled*/ ctx[8].prevPage)) {
    				attr(button1, "aria-disabled", button1_aria_disabled_value);
    			}

    			if (dirty & /*from, to, totalItems*/ 134 && t4_value !== (t4_value = `${/*from*/ ctx[2]}-${/*to*/ ctx[1]} of ${/*totalItems*/ ctx[7]}` + "")) set_data(t4, t4_value);

    			if (dirty & /*classes*/ 1 && p_class_value !== (p_class_value = /*classes*/ ctx[0].paginationInfo)) {
    				attr(p, "class", p_class_value);
    			}

    			if (dirty & /*classes*/ 1 && button2_class_value !== (button2_class_value = /*classes*/ ctx[0].paginationButtons)) {
    				attr(button2, "class", button2_class_value);
    			}

    			if (dirty & /*enabled*/ 256 && button2_disabled_value !== (button2_disabled_value = !/*enabled*/ ctx[8].nextPage)) {
    				button2.disabled = button2_disabled_value;
    			}

    			if (dirty & /*enabled*/ 256 && button2_aria_disabled_value !== (button2_aria_disabled_value = !/*enabled*/ ctx[8].nextPage)) {
    				attr(button2, "aria-disabled", button2_aria_disabled_value);
    			}

    			if (dirty & /*classes*/ 1 && button3_class_value !== (button3_class_value = /*classes*/ ctx[0].paginationButtons)) {
    				attr(button3, "class", button3_class_value);
    			}

    			if (dirty & /*enabled*/ 256 && button3_disabled_value !== (button3_disabled_value = !/*enabled*/ ctx[8].lastPage)) {
    				button3.disabled = button3_disabled_value;
    			}

    			if (dirty & /*enabled*/ 256 && button3_aria_disabled_value !== (button3_aria_disabled_value = !/*enabled*/ ctx[8].lastPage)) {
    				attr(button3, "aria-disabled", button3_aria_disabled_value);
    			}

    			if (dirty & /*classes*/ 1 && nav_class_value !== (nav_class_value = /*classes*/ ctx[0].paginationContainer)) {
    				attr(nav, "class", nav_class_value);
    			}

    			if (dirty & /*from, to, totalItems*/ 134 && nav_aria_label_value !== (nav_aria_label_value = `Navigation pagination, showing items ${/*from*/ ctx[2]} to ${/*to*/ ctx[1]} of total ${/*totalItems*/ ctx[7]} items`)) {
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
    	let { classes = {
    		paginationContainer: '',
    		paginationInfo: '',
    		paginationButtons: ''
    	} } = $$props;

    	let { to } = $$props;
    	let { from } = $$props;
    	let { nextPage } = $$props;
    	let { prevPage } = $$props;
    	let { firstPage } = $$props;
    	let { lastPage } = $$props;
    	let { totalItems } = $$props;
    	let { enabled } = $$props;

    	$$self.$$set = $$props => {
    		if ('classes' in $$props) $$invalidate(0, classes = $$props.classes);
    		if ('to' in $$props) $$invalidate(1, to = $$props.to);
    		if ('from' in $$props) $$invalidate(2, from = $$props.from);
    		if ('nextPage' in $$props) $$invalidate(3, nextPage = $$props.nextPage);
    		if ('prevPage' in $$props) $$invalidate(4, prevPage = $$props.prevPage);
    		if ('firstPage' in $$props) $$invalidate(5, firstPage = $$props.firstPage);
    		if ('lastPage' in $$props) $$invalidate(6, lastPage = $$props.lastPage);
    		if ('totalItems' in $$props) $$invalidate(7, totalItems = $$props.totalItems);
    		if ('enabled' in $$props) $$invalidate(8, enabled = $$props.enabled);
    	};

    	return [
    		classes,
    		to,
    		from,
    		nextPage,
    		prevPage,
    		firstPage,
    		lastPage,
    		totalItems,
    		enabled
    	];
    }

    class Pagination extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			classes: 0,
    			to: 1,
    			from: 2,
    			nextPage: 3,
    			prevPage: 4,
    			firstPage: 5,
    			lastPage: 6,
    			totalItems: 7,
    			enabled: 8
    		});
    	}
    }

    /* src/SvelteTable.svelte generated by Svelte v3.49.0 */

    function add_css(target) {
    	append_styles(target, "svelte-u2gknh", ".svelte-u2gknh,.svelte-u2gknh::after,.svelte-u2gknh::before{border-spacing:0;border-collapse:collapse}");
    }

    const get_pagination_slot_changes = dirty => ({
    	rows: dirty[0] & /*rows*/ 1,
    	enabled: dirty[0] & /*enabled*/ 4096,
    	totalPages: dirty[0] & /*totalPages*/ 32,
    	currentPage: dirty[0] & /*currentPage*/ 2,
    	totalItems: dirty[0] & /*totalItems*/ 4,
    	from: dirty[0] & /*from*/ 8,
    	to: dirty[0] & /*to*/ 16
    });

    const get_pagination_slot_context = ctx => ({
    	rows: /*rows*/ ctx[0],
    	firstPage: /*firstPage*/ ctx[20],
    	lastPage: /*lastPage*/ ctx[21],
    	prevPage: /*prevPage*/ ctx[19],
    	nextPage: /*nextPage*/ ctx[18],
    	enabled: /*enabled*/ ctx[12],
    	totalPages: /*totalPages*/ ctx[5],
    	currentPage: /*currentPage*/ ctx[1],
    	totalItems: /*totalItems*/ ctx[2],
    	from: /*from*/ ctx[3],
    	to: /*to*/ ctx[4],
    	goTo: /*goTo*/ ctx[17]
    });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];

    	child_ctx[50] = function func() {
    		return /*func*/ child_ctx[31](/*row*/ child_ctx[40], /*each_value*/ child_ctx[43], /*rowIndex*/ child_ctx[44]);
    	};

    	child_ctx[51] = function func_1(...args) {
    		return /*func_1*/ child_ctx[35](/*row*/ child_ctx[40], ...args);
    	};

    	child_ctx[43] = list;
    	child_ctx[44] = i;

    	const constants_0 = /*row*/ child_ctx[40].isExpanded
    	? /*assignedClasses*/ child_ctx[15]['tr-expanded']
    	: '';

    	child_ctx[41] = constants_0;

    	const constants_1 = /*rowIndex*/ child_ctx[44] % 2
    	? /*assignedClasses*/ child_ctx[15]['tr-even']
    	: /*assignedClasses*/ child_ctx[15]['tr-odd'];

    	child_ctx[42] = constants_1;
    	return child_ctx;
    }

    const get_empty_slot_changes = dirty => ({});
    const get_empty_slot_context = ctx => ({});

    const get_expanded_slot_changes = dirty => ({
    	classes: dirty[0] & /*assignedClasses*/ 32768,
    	handleClick: dirty[0] & /*filteredRows*/ 2048,
    	row: dirty[0] & /*filteredRows*/ 2048
    });

    const get_expanded_slot_context = ctx => ({
    	classes: /*assignedClasses*/ ctx[15],
    	handleClick: /*func_1_func*/ ctx[51],
    	row: /*row*/ ctx[40]
    });

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[45] = list[i];
    	child_ctx[47] = i;
    	return child_ctx;
    }

    const get_cell_slot_changes = dirty => ({
    	row: dirty[0] & /*filteredRows*/ 2048,
    	column: dirty[0] & /*columns*/ 64,
    	handleExpand: dirty[0] & /*filteredRows*/ 2048,
    	cell: dirty[0] & /*filteredRows, columns*/ 2112,
    	isRowHovered: dirty[0] & /*hoverRow*/ 16384,
    	isColumnHovered: dirty[0] & /*hoverColumn*/ 8192
    });

    const get_cell_slot_context = ctx => ({
    	row: /*row*/ ctx[40],
    	column: /*column*/ ctx[45],
    	handleExpand: /*func_func*/ ctx[50],
    	cell: /*row*/ ctx[40][/*column*/ ctx[45].key],
    	isRowHovered: /*hoverRow*/ ctx[14] === /*rowIndex*/ ctx[44],
    	isColumnHovered: /*hoverColumn*/ ctx[13] === /*columnIndex*/ ctx[47]
    });

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[45] = list[i];
    	child_ctx[49] = i;
    	return child_ctx;
    }

    const get_head_slot_changes = dirty => ({
    	column: dirty[0] & /*columns*/ 64,
    	isColumnHovered: dirty[0] & /*hoverColumn*/ 8192,
    	isSorted: dirty[0] & /*lastSortedKey, columns*/ 576,
    	sortDescending: dirty[0] & /*sortDescending*/ 1024,
    	sortable: dirty[0] & /*isSortable, columns*/ 192
    });

    const get_head_slot_context = ctx => ({
    	column: /*column*/ ctx[45],
    	isColumnHovered: /*hoverColumn*/ ctx[13] === /*colIdx*/ ctx[49],
    	isSorted: /*lastSortedKey*/ ctx[9] === /*column*/ ctx[45].key,
    	sortDescending: /*sortDescending*/ ctx[10],
    	sortable: /*isSortable*/ ctx[7] && /*column*/ ctx[45].sortable !== false
    });

    // (175:12) {:else}
    function create_else_block_3(ctx) {
    	let span;
    	let t_value = /*column*/ ctx[45].title + "";
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(t_value);
    			attr(span, "class", "svelte-u2gknh");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*columns*/ 64 && t_value !== (t_value = /*column*/ ctx[45].title + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (166:12) {#if $$slots.head}
    function create_if_block_4(ctx) {
    	let current;
    	const head_slot_template = /*#slots*/ ctx[28].head;
    	const head_slot = create_slot(head_slot_template, ctx, /*$$scope*/ ctx[27], get_head_slot_context);

    	return {
    		c() {
    			if (head_slot) head_slot.c();
    		},
    		m(target, anchor) {
    			if (head_slot) {
    				head_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (head_slot) {
    				if (head_slot.p && (!current || dirty[0] & /*$$scope, columns, hoverColumn, lastSortedKey, sortDescending, isSortable*/ 134227648)) {
    					update_slot_base(
    						head_slot,
    						head_slot_template,
    						ctx,
    						/*$$scope*/ ctx[27],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
    						: get_slot_changes(head_slot_template, /*$$scope*/ ctx[27], dirty, get_head_slot_changes),
    						get_head_slot_context
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(head_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(head_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (head_slot) head_slot.d(detaching);
    		}
    	};
    }

    // (156:8) {#each columns as column, colIdx}
    function create_each_block_2(ctx) {
    	let th;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let th_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_4, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$$slots*/ ctx[24].head) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[29](/*column*/ ctx[45], ...args);
    	}

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[30](/*colIdx*/ ctx[49]);
    	}

    	return {
    		c() {
    			th = element("th");
    			if_block.c();
    			t = space();
    			attr(th, "scope", "col");
    			attr(th, "class", th_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].th) + " svelte-u2gknh"));
    		},
    		m(target, anchor) {
    			insert(target, th, anchor);
    			if_blocks[current_block_type_index].m(th, null);
    			append(th, t);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(th, "click", click_handler),
    					listen(th, "mouseenter", mouseenter_handler)
    				];

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
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(th, t);
    			}

    			if (!current || dirty[0] & /*assignedClasses*/ 32768 && th_class_value !== (th_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].th) + " svelte-u2gknh"))) {
    				attr(th, "class", th_class_value);
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
    			if (detaching) detach(th);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (232:6) {:else}
    function create_else_block_2(ctx) {
    	let current;
    	const empty_slot_template = /*#slots*/ ctx[28].empty;
    	const empty_slot = create_slot(empty_slot_template, ctx, /*$$scope*/ ctx[27], get_empty_slot_context);

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
    				if (empty_slot.p && (!current || dirty[0] & /*$$scope*/ 134217728)) {
    					update_slot_base(
    						empty_slot,
    						empty_slot_template,
    						ctx,
    						/*$$scope*/ ctx[27],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
    						: get_slot_changes(empty_slot_template, /*$$scope*/ ctx[27], dirty, get_empty_slot_changes),
    						get_empty_slot_context
    					);
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

    // (218:14) {:else}
    function create_else_block_1(ctx) {
    	let span;
    	let t_value = /*row*/ ctx[40][/*column*/ ctx[45].key] + "";
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(t_value);
    			attr(span, "class", "svelte-u2gknh");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*filteredRows, columns*/ 2112 && t_value !== (t_value = /*row*/ ctx[40][/*column*/ ctx[45].key] + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (207:14) {#if $$slots.cell}
    function create_if_block_3(ctx) {
    	let current;
    	const cell_slot_template = /*#slots*/ ctx[28].cell;
    	const cell_slot = create_slot(cell_slot_template, ctx, /*$$scope*/ ctx[27], get_cell_slot_context);

    	return {
    		c() {
    			if (cell_slot) cell_slot.c();
    		},
    		m(target, anchor) {
    			if (cell_slot) {
    				cell_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (cell_slot) {
    				if (cell_slot.p && (!current || dirty[0] & /*$$scope, filteredRows, columns, hoverRow, hoverColumn*/ 134244416)) {
    					update_slot_base(
    						cell_slot,
    						cell_slot_template,
    						ctx,
    						/*$$scope*/ ctx[27],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
    						: get_slot_changes(cell_slot_template, /*$$scope*/ ctx[27], dirty, get_cell_slot_changes),
    						get_cell_slot_context
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(cell_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(cell_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (cell_slot) cell_slot.d(detaching);
    		}
    	};
    }

    // (193:10) {#each columns as column, columnIndex}
    function create_each_block_1(ctx) {
    	let td;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let td_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_3, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*$$slots*/ ctx[24].cell) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[32](/*column*/ ctx[45], /*row*/ ctx[40], ...args);
    	}

    	function mouseenter_handler_1() {
    		return /*mouseenter_handler_1*/ ctx[33](/*columnIndex*/ ctx[47], /*rowIndex*/ ctx[44]);
    	}

    	return {
    		c() {
    			td = element("td");
    			if_block.c();
    			t = space();
    			attr(td, "class", td_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].td) + " svelte-u2gknh"));
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			if_blocks[current_block_type_index].m(td, null);
    			append(td, t);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(td, "click", click_handler_1),
    					listen(td, "mouseenter", mouseenter_handler_1)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
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
    				if_block.m(td, t);
    			}

    			if (!current || dirty[0] & /*assignedClasses*/ 32768 && td_class_value !== (td_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].td) + " svelte-u2gknh"))) {
    				attr(td, "class", td_class_value);
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
    			run_all(dispose);
    		}
    	};
    }

    // (224:8) {#if row.isExpanded}
    function create_if_block_2(ctx) {
    	let current;
    	const expanded_slot_template = /*#slots*/ ctx[28].expanded;
    	const expanded_slot = create_slot(expanded_slot_template, ctx, /*$$scope*/ ctx[27], get_expanded_slot_context);

    	return {
    		c() {
    			if (expanded_slot) expanded_slot.c();
    		},
    		m(target, anchor) {
    			if (expanded_slot) {
    				expanded_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (expanded_slot) {
    				if (expanded_slot.p && (!current || dirty[0] & /*$$scope, assignedClasses, filteredRows*/ 134252544)) {
    					update_slot_base(
    						expanded_slot,
    						expanded_slot_template,
    						ctx,
    						/*$$scope*/ ctx[27],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
    						: get_slot_changes(expanded_slot_template, /*$$scope*/ ctx[27], dirty, get_expanded_slot_changes),
    						get_expanded_slot_context
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(expanded_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(expanded_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (expanded_slot) expanded_slot.d(detaching);
    		}
    	};
    }

    // (183:6) {#each filteredRows as row, rowIndex}
    function create_each_block(ctx) {
    	let tr;
    	let tr_class_value;
    	let t;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*columns*/ ctx[6];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[34](/*row*/ ctx[40], ...args);
    	}

    	let if_block = /*row*/ ctx[40].isExpanded && create_if_block_2(ctx);

    	return {
    		c() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr(tr, "class", tr_class_value = "" + (null_to_empty(`${/*assignedClasses*/ ctx[15].tr} ${/*isExpanded*/ ctx[41]} ${/*isEvenOrOdd*/ ctx[42]}`) + " svelte-u2gknh"));
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			insert(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(tr, "click", click_handler_2);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*assignedClasses, dispatch, columns, filteredRows, setHovered, $$scope, hoverRow, hoverColumn, $$slots*/ 155314240) {
    				each_value_1 = /*columns*/ ctx[6];
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

    			if (!current || dirty[0] & /*assignedClasses, filteredRows*/ 34816 && tr_class_value !== (tr_class_value = "" + (null_to_empty(`${/*assignedClasses*/ ctx[15].tr} ${/*isExpanded*/ ctx[41]} ${/*isEvenOrOdd*/ ctx[42]}`) + " svelte-u2gknh"))) {
    				attr(tr, "class", tr_class_value);
    			}

    			if (/*row*/ ctx[40].isExpanded) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*filteredRows*/ 2048) {
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

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (237:2) {#if rowsPerPage && totalPages > 1}
    function create_if_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*$$slots*/ ctx[24].pagination) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
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
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (254:4) {:else}
    function create_else_block(ctx) {
    	let pagination;
    	let current;

    	pagination = new Pagination({
    			props: {
    				classes: /*assignedClasses*/ ctx[15],
    				firstPage: /*firstPage*/ ctx[20],
    				lastPage: /*lastPage*/ ctx[21],
    				prevPage: /*prevPage*/ ctx[19],
    				nextPage: /*nextPage*/ ctx[18],
    				enabled: /*enabled*/ ctx[12],
    				totalItems: /*totalItems*/ ctx[2],
    				from: /*from*/ ctx[3],
    				to: /*to*/ ctx[4]
    			}
    		});

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
    			if (dirty[0] & /*assignedClasses*/ 32768) pagination_changes.classes = /*assignedClasses*/ ctx[15];
    			if (dirty[0] & /*enabled*/ 4096) pagination_changes.enabled = /*enabled*/ ctx[12];
    			if (dirty[0] & /*totalItems*/ 4) pagination_changes.totalItems = /*totalItems*/ ctx[2];
    			if (dirty[0] & /*from*/ 8) pagination_changes.from = /*from*/ ctx[3];
    			if (dirty[0] & /*to*/ 16) pagination_changes.to = /*to*/ ctx[4];
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

    // (238:4) {#if $$slots.pagination}
    function create_if_block_1(ctx) {
    	let current;
    	const pagination_slot_template = /*#slots*/ ctx[28].pagination;
    	const pagination_slot = create_slot(pagination_slot_template, ctx, /*$$scope*/ ctx[27], get_pagination_slot_context);

    	return {
    		c() {
    			if (pagination_slot) pagination_slot.c();
    		},
    		m(target, anchor) {
    			if (pagination_slot) {
    				pagination_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (pagination_slot) {
    				if (pagination_slot.p && (!current || dirty[0] & /*$$scope, rows, enabled, totalPages, currentPage, totalItems, from, to*/ 134221887)) {
    					update_slot_base(
    						pagination_slot,
    						pagination_slot_template,
    						ctx,
    						/*$$scope*/ ctx[27],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
    						: get_slot_changes(pagination_slot_template, /*$$scope*/ ctx[27], dirty, get_pagination_slot_changes),
    						get_pagination_slot_context
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(pagination_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(pagination_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (pagination_slot) pagination_slot.d(detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let div;
    	let table;
    	let thead;
    	let tr;
    	let tr_class_value;
    	let thead_class_value;
    	let t0;
    	let tbody;
    	let tbody_class_value;
    	let table_class_value;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*columns*/ ctx[6];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*filteredRows*/ ctx[11];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out_1 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each1_else = null;

    	if (!each_value.length) {
    		each1_else = create_else_block_2(ctx);
    	}

    	let if_block = /*rowsPerPage*/ ctx[8] && /*totalPages*/ ctx[5] > 1 && create_if_block(ctx);

    	return {
    		c() {
    			div = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each1_else) {
    				each1_else.c();
    			}

    			t1 = space();
    			if (if_block) if_block.c();
    			attr(tr, "class", tr_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].headtr) + " svelte-u2gknh"));
    			attr(thead, "class", thead_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].thead) + " svelte-u2gknh"));
    			attr(tbody, "class", tbody_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].tbody) + " svelte-u2gknh"));
    			attr(table, "class", table_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].table) + " svelte-u2gknh"));
    			attr(table, "cellspacing", "0");
    			attr(div, "class", "wrapper svelte-u2gknh");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, table);
    			append(table, thead);
    			append(thead, tr);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tr, null);
    			}

    			append(table, t0);
    			append(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (each1_else) {
    				each1_else.m(tbody, null);
    			}

    			append(div, t1);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen(table, "mouseleave", /*mouseleave_handler*/ ctx[36]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*assignedClasses, dispatch, columns, sortRowsBy, setHovered, $$scope, hoverColumn, lastSortedKey, sortDescending, isSortable, $$slots*/ 163686080) {
    				each_value_2 = /*columns*/ ctx[6];
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

    			if (!current || dirty[0] & /*assignedClasses*/ 32768 && tr_class_value !== (tr_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].headtr) + " svelte-u2gknh"))) {
    				attr(tr, "class", tr_class_value);
    			}

    			if (!current || dirty[0] & /*assignedClasses*/ 32768 && thead_class_value !== (thead_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].thead) + " svelte-u2gknh"))) {
    				attr(thead, "class", thead_class_value);
    			}

    			if (dirty[0] & /*$$scope, assignedClasses, dispatch, filteredRows, columns, setHovered, hoverRow, hoverColumn, $$slots*/ 155314240) {
    				each_value = /*filteredRows*/ ctx[11];
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
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();

    				if (!each_value.length && each1_else) {
    					each1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each1_else = create_else_block_2(ctx);
    					each1_else.c();
    					transition_in(each1_else, 1);
    					each1_else.m(tbody, null);
    				} else if (each1_else) {
    					group_outros();

    					transition_out(each1_else, 1, 1, () => {
    						each1_else = null;
    					});

    					check_outros();
    				}
    			}

    			if (!current || dirty[0] & /*assignedClasses*/ 32768 && tbody_class_value !== (tbody_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].tbody) + " svelte-u2gknh"))) {
    				attr(tbody, "class", tbody_class_value);
    			}

    			if (!current || dirty[0] & /*assignedClasses*/ 32768 && table_class_value !== (table_class_value = "" + (null_to_empty(/*assignedClasses*/ ctx[15].table) + " svelte-u2gknh"))) {
    				attr(table, "class", table_class_value);
    			}

    			if (/*rowsPerPage*/ ctx[8] && /*totalPages*/ ctx[5] > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*rowsPerPage, totalPages*/ 288) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
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

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
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

    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (each1_else) each1_else.d();
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let filteredRows;
    	let assignedClasses;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const $$slots = compute_slots(slots);
    	const dispatch = createEventDispatcher();
    	let { columns = [] } = $$props;
    	let { rows = [] } = $$props;

    	const defaultClasses = {
    		table: '',
    		headtr: '',
    		thead: '',
    		tbody: '',
    		tr: '',
    		'tr-expanded': '',
    		'tr-odd': '',
    		'tr-even': '',
    		th: '',
    		td: ''
    	};

    	let { classes = defaultClasses } = $$props;
    	let { isSortable = true } = $$props;
    	let { asyncPagination = false } = $$props;
    	let { rowsPerPage = rows.length } = $$props;
    	let { currentPage = 1 } = $$props;
    	let { from = 1 } = $$props;
    	let { to = rowsPerPage } = $$props;
    	let { totalItems = 0 } = $$props;
    	let { totalPages = Math.ceil(totalItems / rowsPerPage) } = $$props;

    	let enabled = {
    		nextPage: false,
    		lastPage: false,
    		firstPage: false,
    		prevPage: false
    	};

    	let lastSortedKey = '';
    	let sortDescending = false;
    	let hoverColumn = -1;
    	let hoverRow = -1;

    	const goTo = id => {
    		$$invalidate(1, currentPage = id);
    		updateFromToValues();
    	};

    	const nextPage = () => {
    		if (!enabled.nextPage) return;
    		$$invalidate(1, currentPage += 1);
    		updateFromToValues();
    	};

    	const prevPage = () => {
    		if (!enabled.prevPage) return;
    		$$invalidate(1, currentPage -= 1);
    		updateFromToValues();
    	};

    	const firstPage = () => {
    		if (!enabled.firstPage) return;
    		$$invalidate(1, currentPage = 1);
    		updateFromToValues();
    	};

    	const lastPage = () => {
    		if (!enabled.lastPage) return;
    		$$invalidate(1, currentPage = totalPages);
    		updateFromToValues();
    	};

    	const updateFromToValues = () => {
    		$$invalidate(3, from = (currentPage - 1) * rowsPerPage + 1);
    		$$invalidate(4, to = Math.min(from + rowsPerPage - 1, totalItems));
    		$$invalidate(12, enabled.nextPage = currentPage < totalPages, enabled);
    		$$invalidate(12, enabled.prevPage = currentPage > 1, enabled);
    		$$invalidate(12, enabled.firstPage = currentPage > 1, enabled);
    		$$invalidate(12, enabled.lastPage = currentPage < totalPages, enabled);
    	};

    	const setHovered = (colIdx, rowIdx) => {
    		$$invalidate(13, hoverColumn = colIdx);
    		$$invalidate(14, hoverRow = rowIdx);
    	};

    	const sortRowsBy = (key, descendingOverride) => {
    		if (!isSortable) return;
    		const columnData = columns.find(column => column.key === key);
    		if (columnData.sortable === false) return;

    		if (typeof descendingOverride === 'undefined' && lastSortedKey === key) {
    			$$invalidate(10, sortDescending = !sortDescending);
    		} else if (typeof descendingOverride !== 'undefined') {
    			$$invalidate(10, sortDescending = descendingOverride);
    		} else {
    			$$invalidate(10, sortDescending = false);
    		}

    		$$invalidate(9, lastSortedKey = key);

    		if (columnData.sortBy) {
    			$$invalidate(0, rows = [...rows].sort((a, b) => {
    				[a, b] = sortDescending ? [a, b] : [b, a];
    				return columnData.sortBy(a, b);
    			}));

    			slicePaginated();
    			return;
    		}

    		$$invalidate(0, rows = [...rows].sort((a, b) => {
    			[a, b] = [a[key], b[key]];
    			if (sortDescending) [b, a] = [a, b];
    			if (typeof a === 'number') return a - b;
    			if (typeof a === 'boolean') return a ? -1 : 1;
    			return a?.localeCompare(b);
    		}));

    		slicePaginated();
    	};

    	const slicePaginated = () => {
    		$$invalidate(11, filteredRows = asyncPagination ? [...rows] : rows.slice(from - 1, to));
    	};

    	const click_handler = (column, event) => {
    		dispatch('clickCol', { event, column });
    		sortRowsBy(column.key);
    	};

    	const mouseenter_handler = colIdx => setHovered(colIdx, -1);
    	const func = (row, each_value, rowIndex) => $$invalidate(11, each_value[rowIndex].isExpanded = row.isExpanded ? !row.isExpanded : true, filteredRows);

    	const click_handler_1 = (column, row, event) => {
    		dispatch('clickCol', { event, column });

    		dispatch('clickCell', {
    			event,
    			column,
    			row,
    			cell: row[column.key]
    		});
    	};

    	const mouseenter_handler_1 = (columnIndex, rowIndex) => setHovered(columnIndex, rowIndex);
    	const click_handler_2 = (row, event) => dispatch('clickRow', { event, row });
    	const func_1 = (row, event) => dispatch('clickRow', { event, row });
    	const mouseleave_handler = () => setHovered(-1, -1);

    	$$self.$$set = $$props => {
    		if ('columns' in $$props) $$invalidate(6, columns = $$props.columns);
    		if ('rows' in $$props) $$invalidate(0, rows = $$props.rows);
    		if ('classes' in $$props) $$invalidate(25, classes = $$props.classes);
    		if ('isSortable' in $$props) $$invalidate(7, isSortable = $$props.isSortable);
    		if ('asyncPagination' in $$props) $$invalidate(26, asyncPagination = $$props.asyncPagination);
    		if ('rowsPerPage' in $$props) $$invalidate(8, rowsPerPage = $$props.rowsPerPage);
    		if ('currentPage' in $$props) $$invalidate(1, currentPage = $$props.currentPage);
    		if ('from' in $$props) $$invalidate(3, from = $$props.from);
    		if ('to' in $$props) $$invalidate(4, to = $$props.to);
    		if ('totalItems' in $$props) $$invalidate(2, totalItems = $$props.totalItems);
    		if ('totalPages' in $$props) $$invalidate(5, totalPages = $$props.totalPages);
    		if ('$$scope' in $$props) $$invalidate(27, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*lastSortedKey, sortDescending, rows*/ 1537) {
    			$$invalidate(11, filteredRows = (() => {
    				lastSortedKey
    				? sortRowsBy(lastSortedKey, sortDescending)
    				: undefined;

    				return [...rows];
    			})());
    		}

    		if ($$self.$$.dirty[0] & /*classes*/ 33554432) {
    			$$invalidate(15, assignedClasses = { ...defaultClasses, ...classes });
    		}

    		if ($$self.$$.dirty[0] & /*rows, rowsPerPage, totalItems*/ 261) {
    			if (rows || rowsPerPage) {
    				$$invalidate(2, totalItems = totalItems || rows.length);
    				$$invalidate(5, totalPages = Math.ceil(totalItems / rowsPerPage));
    			}
    		}

    		if ($$self.$$.dirty[0] & /*rows, filteredRows, currentPage, rowsPerPage*/ 2307) {
    			if (rows && filteredRows && currentPage && rowsPerPage) {
    				updateFromToValues();
    				slicePaginated();
    			}
    		}
    	};

    	return [
    		rows,
    		currentPage,
    		totalItems,
    		from,
    		to,
    		totalPages,
    		columns,
    		isSortable,
    		rowsPerPage,
    		lastSortedKey,
    		sortDescending,
    		filteredRows,
    		enabled,
    		hoverColumn,
    		hoverRow,
    		assignedClasses,
    		dispatch,
    		goTo,
    		nextPage,
    		prevPage,
    		firstPage,
    		lastPage,
    		setHovered,
    		sortRowsBy,
    		$$slots,
    		classes,
    		asyncPagination,
    		$$scope,
    		slots,
    		click_handler,
    		mouseenter_handler,
    		func,
    		click_handler_1,
    		mouseenter_handler_1,
    		click_handler_2,
    		func_1,
    		mouseleave_handler
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
    				columns: 6,
    				rows: 0,
    				classes: 25,
    				isSortable: 7,
    				asyncPagination: 26,
    				rowsPerPage: 8,
    				currentPage: 1,
    				from: 3,
    				to: 4,
    				totalItems: 2,
    				totalPages: 5
    			},
    			add_css,
    			[-1, -1]
    		);
    	}
    }

    exports.SvelteTable = SvelteTable;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
