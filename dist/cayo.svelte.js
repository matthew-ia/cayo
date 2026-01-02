const HYDRATION_START = '[';
const HYDRATION_END = ']';

const ELEMENT_IS_NAMESPACED = 1;
const ELEMENT_PRESERVE_ATTRIBUTE_CASE = 1 << 1;
const ELEMENT_IS_INPUT = 1 << 2;

const ATTR_REGEX = /[&"<]/g;
const CONTENT_REGEX = /[&<]/g;

/**
 * @template V
 * @param {V} value
 * @param {boolean} [is_attr]
 */
function escape_html(value, is_attr) {
	const str = String(value ?? '');

	const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
	pattern.lastIndex = 0;

	let escaped = '';
	let last = 0;

	while (pattern.test(str)) {
		const i = pattern.lastIndex - 1;
		const ch = str[i];
		escaped += str.substring(last, i) + (ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : '&lt;');
		last = i + 1;
	}

	return escaped + str.substring(last);
}

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx$1(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

/**
 * `<div translate={false}>` should be rendered as `<div translate="no">` and _not_
 * `<div translate="false">`, which is equivalent to `<div translate="yes">`. There
 * may be other odd cases that need to be added to this list in future
 * @type {Record<string, Map<any, string>>}
 */
const replacements = {
	translate: new Map([
		[true, 'yes'],
		[false, 'no']
	])
};

/**
 * @template V
 * @param {string} name
 * @param {V} value
 * @param {boolean} [is_boolean]
 * @returns {string}
 */
function attr(name, value, is_boolean = false) {
	// attribute hidden for values other than "until-found" behaves like a boolean attribute
	if (name === 'hidden' && value !== 'until-found') {
		is_boolean = true;
	}
	if (value == null || (!value && is_boolean)) return '';
	const normalized = (name in replacements && replacements[name].get(value)) || value;
	const assignment = is_boolean ? '' : `="${escape_html(normalized, true)}"`;
	return ` ${name}${assignment}`;
}

/**
 * Small wrapper around clsx to preserve Svelte's (weird) handling of falsy values.
 * TODO Svelte 6 revisit this, and likely turn all falsy values into the empty string (what clsx also does)
 * @param  {any} value
 */
function clsx(value) {
	if (typeof value === 'object') {
		return clsx$1(value);
	} else {
		return value ?? '';
	}
}

const whitespace = [...' \t\n\r\f\u00a0\u000b\ufeff'];

/**
 * @param {any} value
 * @param {string | null} [hash]
 * @param {Record<string, boolean>} [directives]
 * @returns {string | null}
 */
function to_class(value, hash, directives) {
	var classname = value == null ? '' : '' + value;

	if (hash) {
		classname = classname ? classname + ' ' + hash : hash;
	}

	if (directives) {
		for (var key in directives) {
			if (directives[key]) {
				classname = classname ? classname + ' ' + key : key;
			} else if (classname.length) {
				var len = key.length;
				var a = 0;

				while ((a = classname.indexOf(key, a)) >= 0) {
					var b = a + len;

					if (
						(a === 0 || whitespace.includes(classname[a - 1])) &&
						(b === classname.length || whitespace.includes(classname[b]))
					) {
						classname = (a === 0 ? '' : classname.substring(0, a)) + classname.substring(b + 1);
					} else {
						a = b;
					}
				}
			}
		}
	}

	return classname === '' ? null : classname;
}

/**
 *
 * @param {Record<string,any>} styles
 * @param {boolean} important
 */
function append_styles(styles, important = false) {
	var separator = important ? ' !important;' : ';';
	var css = '';

	for (var key in styles) {
		var value = styles[key];
		if (value != null && value !== '') {
			css += ' ' + key + ': ' + value + separator;
		}
	}

	return css;
}

/**
 * @param {string} name
 * @returns {string}
 */
function to_css_name(name) {
	if (name[0] !== '-' || name[1] !== '-') {
		return name.toLowerCase();
	}
	return name;
}

/**
 * @param {any} value
 * @param {Record<string, any> | [Record<string, any>, Record<string, any>]} [styles]
 * @returns {string | null}
 */
function to_style(value, styles) {
	if (styles) {
		var new_style = '';

		/** @type {Record<string,any> | undefined} */
		var normal_styles;

		/** @type {Record<string,any> | undefined} */
		var important_styles;

		if (Array.isArray(styles)) {
			normal_styles = styles[0];
			important_styles = styles[1];
		} else {
			normal_styles = styles;
		}

		if (value) {
			value = String(value)
				.replaceAll(/\s*\/\*.*?\*\/\s*/g, '')
				.trim();

			/** @type {boolean | '"' | "'"} */
			var in_str = false;
			var in_apo = 0;
			var in_comment = false;

			var reserved_names = [];

			if (normal_styles) {
				reserved_names.push(...Object.keys(normal_styles).map(to_css_name));
			}
			if (important_styles) {
				reserved_names.push(...Object.keys(important_styles).map(to_css_name));
			}

			var start_index = 0;
			var name_index = -1;

			const len = value.length;
			for (var i = 0; i < len; i++) {
				var c = value[i];

				if (in_comment) {
					if (c === '/' && value[i - 1] === '*') {
						in_comment = false;
					}
				} else if (in_str) {
					if (in_str === c) {
						in_str = false;
					}
				} else if (c === '/' && value[i + 1] === '*') {
					in_comment = true;
				} else if (c === '"' || c === "'") {
					in_str = c;
				} else if (c === '(') {
					in_apo++;
				} else if (c === ')') {
					in_apo--;
				}

				if (!in_comment && in_str === false && in_apo === 0) {
					if (c === ':' && name_index === -1) {
						name_index = i;
					} else if (c === ';' || i === len - 1) {
						if (name_index !== -1) {
							var name = to_css_name(value.substring(start_index, name_index).trim());

							if (!reserved_names.includes(name)) {
								if (c !== ';') {
									i++;
								}

								var property = value.substring(start_index, i).trim();
								new_style += ' ' + property + ';';
							}
						}

						start_index = i + 1;
						name_index = -1;
					}
				}
			}
		}

		if (normal_styles) {
			new_style += append_styles(normal_styles);
		}

		if (important_styles) {
			new_style += append_styles(important_styles, true);
		}

		new_style = new_style.trim();
		return new_style === '' ? null : new_style;
	}

	return value == null ? null : String(value);
}

// General flags

/** allow users to ignore aborted signal errors if `reason.name === 'StaleReactionError` */
const STALE_REACTION = new (class StaleReactionError extends Error {
	name = 'StaleReactionError';
	message = 'The reaction that called `getAbortSignal()` was re-run or destroyed';
})();

/**
 * Attributes that are boolean, i.e. they are present or not present.
 */
const DOM_BOOLEAN_ATTRIBUTES = [
	'allowfullscreen',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'disabled',
	'formnovalidate',
	'indeterminate',
	'inert',
	'ismap',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'seamless',
	'selected',
	'webkitdirectory',
	'defer',
	'disablepictureinpicture',
	'disableremoteplayback'
];

/**
 * Returns `true` if `name` is a boolean attribute
 * @param {string} name
 */
function is_boolean_attribute(name) {
	return DOM_BOOLEAN_ATTRIBUTES.includes(name);
}

const BLOCK_OPEN = `<!--${HYDRATION_START}-->`;
const BLOCK_CLOSE = `<!--${HYDRATION_END}-->`;

/** @type {AbortController | null} */
let controller = null;

function abort() {
	controller?.abort(STALE_REACTION);
	controller = null;
}

/* This file is generated by scripts/process-messages/index.js. Do not edit! */

/**
 * Encountered asynchronous work while rendering synchronously.
 * @returns {never}
 */
function await_invalid() {
	const error = new Error(`await_invalid\nEncountered asynchronous work while rendering synchronously.\nhttps://svelte.dev/e/await_invalid`);

	error.name = 'Svelte error';

	throw error;
}

/**
 * `csp.nonce` was set while `csp.hash` was `true`. These options cannot be used simultaneously.
 * @returns {never}
 */
function invalid_csp() {
	const error = new Error(`invalid_csp\n\`csp.nonce\` was set while \`csp.hash\` was \`true\`. These options cannot be used simultaneously.\nhttps://svelte.dev/e/invalid_csp`);

	error.name = 'Svelte error';

	throw error;
}

/**
 * Could not resolve `render` context.
 * @returns {never}
 */
function server_context_required() {
	const error = new Error(`server_context_required\nCould not resolve \`render\` context.\nhttps://svelte.dev/e/server_context_required`);

	error.name = 'Svelte error';

	throw error;
}

/** @import { SSRContext } from '#server' */

/** @type {SSRContext | null} */
var ssr_context = null;

/** @param {SSRContext | null} v */
function set_ssr_context(v) {
	ssr_context = v;
}

/**
 * @param {Function} [fn]
 */
function push(fn) {
	ssr_context = { p: ssr_context, c: null, r: null };
}

function pop() {
	ssr_context = /** @type {SSRContext} */ (ssr_context).p;
}

/* This file is generated by scripts/process-messages/index.js. Do not edit! */

/**
 * A `hydratable` value with key `%key%` was created, but at least part of it was not used during the render.
 * 
 * The `hydratable` was initialized in:
 * %stack%
 * @param {string} key
 * @param {string} stack
 */
function unresolved_hydratable(key, stack) {
	{
		console.warn(`https://svelte.dev/e/unresolved_hydratable`);
	}
}

// @ts-ignore -- we don't include node types in the production build

/** @returns {RenderContext} */
function get_render_context() {
	const store = als?.getStore();

	if (!store) {
		server_context_required();
	}

	return store;
}

/** @type {AsyncLocalStorage<RenderContext | null> | null} */
let als = null;

let text_encoder;
// TODO - remove this and use global `crypto` when we drop Node 18
let crypto;

/** @param {string} data */
async function sha256(data) {
	text_encoder ??= new TextEncoder();

	// @ts-expect-error
	crypto ??= globalThis.crypto?.subtle?.digest
		? globalThis.crypto
		: // @ts-ignore - we don't install node types in the prod build
			(await import('node:crypto')).webcrypto;

	const hash_buffer = await crypto.subtle.digest('SHA-256', text_encoder.encode(data));

	return base64_encode(hash_buffer);
}

/**
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function base64_encode(bytes) {
	// Using `Buffer` is faster than iterating
	// @ts-ignore
	if (globalThis.Buffer) {
		// @ts-ignore
		return globalThis.Buffer.from(bytes).toString('base64');
	}

	let binary = '';

	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}

	return btoa(binary);
}

/** @import { Component } from 'svelte' */

/** @typedef {'head' | 'body'} RendererType */
/** @typedef {{ [key in RendererType]: string }} AccumulatedContent */

/**
 * @typedef {string | Renderer} RendererItem
 */

/**
 * Renderers are basically a tree of `string | Renderer`s, where each `Renderer` in the tree represents
 * work that may or may not have completed. A renderer can be {@link collect}ed to aggregate the
 * content from itself and all of its children, but this will throw if any of the children are
 * performing asynchronous work. To asynchronously collect a renderer, just `await` it.
 *
 * The `string` values within a renderer are always associated with the {@link type} of that renderer. To switch types,
 * call {@link child} with a different `type` argument.
 */
class Renderer {
	/**
	 * The contents of the renderer.
	 * @type {RendererItem[]}
	 */
	#out = [];

	/**
	 * Any `onDestroy` callbacks registered during execution of this renderer.
	 * @type {(() => void)[] | undefined}
	 */
	#on_destroy = undefined;

	/**
	 * Whether this renderer is a component body.
	 * @type {boolean}
	 */
	#is_component_body = false;

	/**
	 * The type of string content that this renderer is accumulating.
	 * @type {RendererType}
	 */
	type;

	/** @type {Renderer | undefined} */
	#parent;

	/**
	 * Asynchronous work associated with this renderer
	 * @type {Promise<void> | undefined}
	 */
	promise = undefined;

	/**
	 * State which is associated with the content tree as a whole.
	 * It will be re-exposed, uncopied, on all children.
	 * @type {SSRState}
	 * @readonly
	 */
	global;

	/**
	 * State that is local to the branch it is declared in.
	 * It will be shallow-copied to all children.
	 *
	 * @type {{ select_value: string | undefined }}
	 */
	local;

	/**
	 * @param {SSRState} global
	 * @param {Renderer | undefined} [parent]
	 */
	constructor(global, parent) {
		this.#parent = parent;

		this.global = global;
		this.local = parent ? { ...parent.local } : { select_value: undefined };
		this.type = parent ? parent.type : 'body';
	}

	/**
	 * @param {(renderer: Renderer) => void} fn
	 */
	head(fn) {
		const head = new Renderer(this.global, this);
		head.type = 'head';

		this.#out.push(head);
		head.child(fn);
	}

	/**
	 * @param {Array<Promise<void>>} blockers
	 * @param {(renderer: Renderer) => void} fn
	 */
	async_block(blockers, fn) {
		this.#out.push(BLOCK_OPEN);
		this.async(blockers, fn);
		this.#out.push(BLOCK_CLOSE);
	}

	/**
	 * @param {Array<Promise<void>>} blockers
	 * @param {(renderer: Renderer) => void} fn
	 */
	async(blockers, fn) {
		let callback = fn;

		if (blockers.length > 0) {
			const context = ssr_context;

			callback = (renderer) => {
				return Promise.all(blockers).then(() => {
					const previous_context = ssr_context;

					try {
						set_ssr_context(context);
						return fn(renderer);
					} finally {
						set_ssr_context(previous_context);
					}
				});
			};
		}

		this.child(callback);
	}

	/**
	 * @param {Array<() => void>} thunks
	 */
	run(thunks) {
		const context = ssr_context;

		let promise = Promise.resolve(thunks[0]());
		const promises = [promise];

		for (const fn of thunks.slice(1)) {
			promise = promise.then(() => {
				const previous_context = ssr_context;
				set_ssr_context(context);

				try {
					return fn();
				} finally {
					set_ssr_context(previous_context);
				}
			});

			promises.push(promise);
		}

		return promises;
	}

	/**
	 * Create a child renderer. The child renderer inherits the state from the parent,
	 * but has its own content.
	 * @param {(renderer: Renderer) => MaybePromise<void>} fn
	 */
	child(fn) {
		const child = new Renderer(this.global, this);
		this.#out.push(child);

		const parent = ssr_context;

		set_ssr_context({
			...ssr_context,
			p: parent,
			c: null,
			r: child
		});

		const result = fn(child);

		set_ssr_context(parent);

		if (result instanceof Promise) {
			if (child.global.mode === 'sync') {
				await_invalid();
			}
			// just to avoid unhandled promise rejections -- we'll end up throwing in `collect_async` if something fails
			result.catch(() => {});
			child.promise = result;
		}

		return child;
	}

	/**
	 * Create a component renderer. The component renderer inherits the state from the parent,
	 * but has its own content. It is treated as an ordering boundary for ondestroy callbacks.
	 * @param {(renderer: Renderer) => MaybePromise<void>} fn
	 * @param {Function} [component_fn]
	 * @returns {void}
	 */
	component(fn, component_fn) {
		push();
		const child = this.child(fn);
		child.#is_component_body = true;
		pop();
	}

	/**
	 * @param {Record<string, any>} attrs
	 * @param {(renderer: Renderer) => void} fn
	 * @param {string | undefined} [css_hash]
	 * @param {Record<string, boolean> | undefined} [classes]
	 * @param {Record<string, string> | undefined} [styles]
	 * @param {number | undefined} [flags]
	 * @returns {void}
	 */
	select(attrs, fn, css_hash, classes, styles, flags) {
		const { value, ...select_attrs } = attrs;

		this.push(`<select${attributes(select_attrs, css_hash, classes, styles, flags)}>`);
		this.child((renderer) => {
			renderer.local.select_value = value;
			fn(renderer);
		});
		this.push('</select>');
	}

	/**
	 * @param {Record<string, any>} attrs
	 * @param {string | number | boolean | ((renderer: Renderer) => void)} body
	 * @param {string | undefined} [css_hash]
	 * @param {Record<string, boolean> | undefined} [classes]
	 * @param {Record<string, string> | undefined} [styles]
	 * @param {number | undefined} [flags]
	 */
	option(attrs, body, css_hash, classes, styles, flags) {
		this.#out.push(`<option${attributes(attrs, css_hash, classes, styles, flags)}`);

		/**
		 * @param {Renderer} renderer
		 * @param {any} value
		 * @param {{ head?: string, body: any }} content
		 */
		const close = (renderer, value, { head, body }) => {
			if ('value' in attrs) {
				value = attrs.value;
			}

			if (value === this.local.select_value) {
				renderer.#out.push(' selected');
			}

			renderer.#out.push(`>${body}</option>`);

			// super edge case, but may as well handle it
			if (head) {
				renderer.head((child) => child.push(head));
			}
		};

		if (typeof body === 'function') {
			this.child((renderer) => {
				const r = new Renderer(this.global, this);
				body(r);

				if (this.global.mode === 'async') {
					return r.#collect_content_async().then((content) => {
						close(renderer, content.body.replaceAll('<!---->', ''), content);
					});
				} else {
					const content = r.#collect_content();
					close(renderer, content.body.replaceAll('<!---->', ''), content);
				}
			});
		} else {
			close(this, body, { body });
		}
	}

	/**
	 * @param {(renderer: Renderer) => void} fn
	 */
	title(fn) {
		const path = this.get_path();

		/** @param {string} head */
		const close = (head) => {
			this.global.set_title(head, path);
		};

		this.child((renderer) => {
			const r = new Renderer(renderer.global, renderer);
			fn(r);

			if (renderer.global.mode === 'async') {
				return r.#collect_content_async().then((content) => {
					close(content.head);
				});
			} else {
				const content = r.#collect_content();
				close(content.head);
			}
		});
	}

	/**
	 * @param {string | (() => Promise<string>)} content
	 */
	push(content) {
		if (typeof content === 'function') {
			this.child(async (renderer) => renderer.push(await content()));
		} else {
			this.#out.push(content);
		}
	}

	/**
	 * @param {() => void} fn
	 */
	on_destroy(fn) {
		(this.#on_destroy ??= []).push(fn);
	}

	/**
	 * @returns {number[]}
	 */
	get_path() {
		return this.#parent ? [...this.#parent.get_path(), this.#parent.#out.indexOf(this)] : [];
	}

	/**
	 * @deprecated this is needed for legacy component bindings
	 */
	copy() {
		const copy = new Renderer(this.global, this.#parent);
		copy.#out = this.#out.map((item) => (item instanceof Renderer ? item.copy() : item));
		copy.promise = this.promise;
		return copy;
	}

	/**
	 * @param {Renderer} other
	 * @deprecated this is needed for legacy component bindings
	 */
	subsume(other) {
		if (this.global.mode !== other.global.mode) {
			throw new Error(
				"invariant: A renderer cannot switch modes. If you're seeing this, there's a compiler bug. File an issue!"
			);
		}

		this.local = other.local;
		this.#out = other.#out.map((item) => {
			if (item instanceof Renderer) {
				item.subsume(item);
			}
			return item;
		});
		this.promise = other.promise;
		this.type = other.type;
	}

	get length() {
		return this.#out.length;
	}

	/**
	 * Only available on the server and when compiling with the `server` option.
	 * Takes a component and returns an object with `body` and `head` properties on it, which you can use to populate the HTML when server-rendering your app.
	 * @template {Record<string, any>} Props
	 * @param {Component<Props>} component
	 * @param {{ props?: Omit<Props, '$$slots' | '$$events'>; context?: Map<any, any>; idPrefix?: string; csp?: Csp }} [options]
	 * @returns {RenderOutput}
	 */
	static render(component, options = {}) {
		/** @type {AccumulatedContent | undefined} */
		let sync;

		const result = /** @type {RenderOutput} */ ({});
		// making these properties non-enumerable so that console.logging
		// doesn't trigger a sync render
		Object.defineProperties(result, {
			html: {
				get: () => {
					return (sync ??= Renderer.#render(component, options)).body;
				}
			},
			head: {
				get: () => {
					return (sync ??= Renderer.#render(component, options)).head;
				}
			},
			body: {
				get: () => {
					return (sync ??= Renderer.#render(component, options)).body;
				}
			},
			hashes: {
				value: {
					script: ''
				}
			},
			then: {
				value:
					/**
					 * this is not type-safe, but honestly it's the best I can do right now, and it's a straightforward function.
					 *
					 * @template TResult1
					 * @template [TResult2=never]
					 * @param { (value: SyncRenderOutput) => TResult1 } onfulfilled
					 * @param { (reason: unknown) => TResult2 } onrejected
					 */
					(onfulfilled, onrejected) => {
						{
							const result = (sync ??= Renderer.#render(component, options));
							const user_result = onfulfilled({
								head: result.head,
								body: result.body,
								html: result.body,
								hashes: { script: [] }
							});
							return Promise.resolve(user_result);
						}
					}
			}
		});

		return result;
	}

	/**
	 * Collect all of the `onDestroy` callbacks registered during rendering. In an async context, this is only safe to call
	 * after awaiting `collect_async`.
	 *
	 * Child renderers are "porous" and don't affect execution order, but component body renderers
	 * create ordering boundaries. Within a renderer, callbacks run in order until hitting a component boundary.
	 * @returns {Iterable<() => void>}
	 */
	*#collect_on_destroy() {
		for (const component of this.#traverse_components()) {
			yield* component.#collect_ondestroy();
		}
	}

	/**
	 * Performs a depth-first search of renderers, yielding the deepest components first, then additional components as we backtrack up the tree.
	 * @returns {Iterable<Renderer>}
	 */
	*#traverse_components() {
		for (const child of this.#out) {
			if (typeof child !== 'string') {
				yield* child.#traverse_components();
			}
		}
		if (this.#is_component_body) {
			yield this;
		}
	}

	/**
	 * @returns {Iterable<() => void>}
	 */
	*#collect_ondestroy() {
		if (this.#on_destroy) {
			for (const fn of this.#on_destroy) {
				yield fn;
			}
		}
		for (const child of this.#out) {
			if (child instanceof Renderer && !child.#is_component_body) {
				yield* child.#collect_ondestroy();
			}
		}
	}

	/**
	 * Render a component. Throws if any of the children are performing asynchronous work.
	 *
	 * @template {Record<string, any>} Props
	 * @param {Component<Props>} component
	 * @param {{ props?: Omit<Props, '$$slots' | '$$events'>; context?: Map<any, any>; idPrefix?: string }} options
	 * @returns {AccumulatedContent}
	 */
	static #render(component, options) {
		var previous_context = ssr_context;
		try {
			const renderer = Renderer.#open_render('sync', component, options);

			const content = renderer.#collect_content();
			return Renderer.#close_render(content, renderer);
		} finally {
			abort();
			set_ssr_context(previous_context);
		}
	}

	/**
	 * Render a component.
	 *
	 * @template {Record<string, any>} Props
	 * @param {Component<Props>} component
	 * @param {{ props?: Omit<Props, '$$slots' | '$$events'>; context?: Map<any, any>; idPrefix?: string; csp?: Csp }} options
	 * @returns {Promise<AccumulatedContent & { hashes: { script: Sha256Source[] } }>}
	 */
	static async #render_async(component, options) {
		const previous_context = ssr_context;

		try {
			const renderer = Renderer.#open_render('async', component, options);
			const content = await renderer.#collect_content_async();
			const hydratables = await renderer.#collect_hydratables();
			if (hydratables !== null) {
				content.head = hydratables + content.head;
			}
			return Renderer.#close_render(content, renderer);
		} finally {
			set_ssr_context(previous_context);
			abort();
		}
	}

	/**
	 * Collect all of the code from the `out` array and return it as a string, or a promise resolving to a string.
	 * @param {AccumulatedContent} content
	 * @returns {AccumulatedContent}
	 */
	#collect_content(content = { head: '', body: '' }) {
		for (const item of this.#out) {
			if (typeof item === 'string') {
				content[this.type] += item;
			} else if (item instanceof Renderer) {
				item.#collect_content(content);
			}
		}

		return content;
	}

	/**
	 * Collect all of the code from the `out` array and return it as a string.
	 * @param {AccumulatedContent} content
	 * @returns {Promise<AccumulatedContent>}
	 */
	async #collect_content_async(content = { head: '', body: '' }) {
		await this.promise;

		// no danger to sequentially awaiting stuff in here; all of the work is already kicked off
		for (const item of this.#out) {
			if (typeof item === 'string') {
				content[this.type] += item;
			} else if (item instanceof Renderer) {
				await item.#collect_content_async(content);
			}
		}

		return content;
	}

	async #collect_hydratables() {
		const ctx = get_render_context().hydratable;

		for (const [_, key] of ctx.unresolved_promises) {
			// this is a problem -- it means we've finished the render but we're still waiting on a promise to resolve so we can
			// serialize it, so we're blocking the response on useless content.
			unresolved_hydratable(key, ctx.lookup.get(key)?.stack ?? '<missing stack trace>');
		}

		for (const comparison of ctx.comparisons) {
			// these reject if there's a mismatch
			await comparison;
		}

		return await this.#hydratable_block(ctx);
	}

	/**
	 * @template {Record<string, any>} Props
	 * @param {'sync' | 'async'} mode
	 * @param {import('svelte').Component<Props>} component
	 * @param {{ props?: Omit<Props, '$$slots' | '$$events'>; context?: Map<any, any>; idPrefix?: string; csp?: Csp }} options
	 * @returns {Renderer}
	 */
	static #open_render(mode, component, options) {
		const renderer = new Renderer(
			new SSRState(mode, options.idPrefix ? options.idPrefix + '-' : '', options.csp)
		);

		renderer.push(BLOCK_OPEN);

		if (options.context) {
			push();
			/** @type {SSRContext} */ (ssr_context).c = options.context;
			/** @type {SSRContext} */ (ssr_context).r = renderer;
		}

		// @ts-expect-error
		component(renderer, options.props ?? {});

		if (options.context) {
			pop();
		}

		renderer.push(BLOCK_CLOSE);

		return renderer;
	}

	/**
	 * @param {AccumulatedContent} content
	 * @param {Renderer} renderer
	 * @returns {AccumulatedContent & { hashes: { script: Sha256Source[] } }}
	 */
	static #close_render(content, renderer) {
		for (const cleanup of renderer.#collect_on_destroy()) {
			cleanup();
		}

		let head = content.head + renderer.global.get_title();
		let body = content.body;

		for (const { hash, code } of renderer.global.css) {
			head += `<style id="${hash}">${code}</style>`;
		}

		return {
			head,
			body,
			hashes: {
				script: renderer.global.csp.script_hashes
			}
		};
	}

	/**
	 * @param {HydratableContext} ctx
	 */
	async #hydratable_block(ctx) {
		if (ctx.lookup.size === 0) {
			return null;
		}

		let entries = [];
		let has_promises = false;

		for (const [k, v] of ctx.lookup) {
			if (v.promises) {
				has_promises = true;
				for (const p of v.promises) await p;
			}

			entries.push(`[${JSON.stringify(k)},${v.serialized}]`);
		}

		let prelude = `const h = (window.__svelte ??= {}).h ??= new Map();`;

		if (has_promises) {
			prelude = `const r = (v) => Promise.resolve(v);
				${prelude}`;
		}

		const body = `
			{
				${prelude}

				for (const [k, v] of [
					${entries.join(',\n\t\t\t\t\t')}
				]) {
					h.set(k, v);
				}
			}
		`;

		let csp_attr = '';
		if (this.global.csp.nonce) {
			csp_attr = ` nonce="${this.global.csp.nonce}"`;
		} else if (this.global.csp.hash) {
			// note to future selves: this doesn't need to be optimized with a Map<body, hash>
			// because the it's impossible for identical data to occur multiple times in a single render
			// (this would require the same hydratable key:value pair to be serialized multiple times)
			const hash = await sha256(body);
			this.global.csp.script_hashes.push(`sha256-${hash}`);
		}

		return `\n\t\t<script${csp_attr}>${body}</script>`;
	}
}

class SSRState {
	/** @readonly @type {Csp & { script_hashes: Sha256Source[] }} */
	csp;

	/** @readonly @type {'sync' | 'async'} */
	mode;

	/** @readonly @type {() => string} */
	uid;

	/** @readonly @type {Set<{ hash: string; code: string }>} */
	css = new Set();

	/** @type {{ path: number[], value: string }} */
	#title = { path: [], value: '' };

	/**
	 * @param {'sync' | 'async'} mode
	 * @param {string} id_prefix
	 * @param {Csp} csp
	 */
	constructor(mode, id_prefix = '', csp = { hash: false }) {
		this.mode = mode;
		this.csp = { ...csp, script_hashes: [] };

		let uid = 1;
		this.uid = () => `${id_prefix}s${uid++}`;
	}

	get_title() {
		return this.#title.value;
	}

	/**
	 * Performs a depth-first (lexicographic) comparison using the path. Rejects sets
	 * from earlier than or equal to the current value.
	 * @param {string} value
	 * @param {number[]} path
	 */
	set_title(value, path) {
		const current = this.#title.path;

		let i = 0;
		let l = Math.min(path.length, current.length);

		// skip identical prefixes - [1, 2, 3, ...] === [1, 2, 3, ...]
		while (i < l && path[i] === current[i]) i += 1;

		if (path[i] === undefined) return;

		// replace title if
		// - incoming path is longer - [7, 8, 9] > [7, 8]
		// - incoming path is later  - [7, 8, 9] > [7, 8, 8]
		if (current[i] === undefined || path[i] > current[i]) {
			this.#title.path = path;
			this.#title.value = value;
		}
	}
}

/**
 * @param {string} value
 */
function html(value) {
	var html = String(value ?? '');
	var open = '<!---->';
	return open + html + '<!---->';
}

/** @import { ComponentType, SvelteComponent, Component } from 'svelte' */

// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
// https://infra.spec.whatwg.org/#noncharacter
const INVALID_ATTR_NAME_CHAR_REGEX =
	/[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;

/**
 * Only available on the server and when compiling with the `server` option.
 * Takes a component and returns an object with `body` and `head` properties on it, which you can use to populate the HTML when server-rendering your app.
 * @template {Record<string, any>} Props
 * @param {Component<Props> | ComponentType<SvelteComponent<Props>>} component
 * @param {{ props?: Omit<Props, '$$slots' | '$$events'>; context?: Map<any, any>; idPrefix?: string; csp?: Csp }} [options]
 * @returns {RenderOutput}
 */
function render(component, options = {}) {
	if (options.csp?.hash && options.csp.nonce) {
		invalid_csp();
	}
	return Renderer.render(/** @type {Component<Props>} */ (component), options);
}

/**
 * @param {Record<string, unknown>} attrs
 * @param {string} [css_hash]
 * @param {Record<string, boolean>} [classes]
 * @param {Record<string, string>} [styles]
 * @param {number} [flags]
 * @returns {string}
 */
function attributes(attrs, css_hash, classes, styles, flags = 0) {
	if (styles) {
		attrs.style = to_style(attrs.style, styles);
	}

	if (attrs.class) {
		attrs.class = clsx(attrs.class);
	}

	if (css_hash || classes) {
		attrs.class = to_class(attrs.class, css_hash, classes);
	}

	let attr_str = '';
	let name;

	const is_html = (flags & ELEMENT_IS_NAMESPACED) === 0;
	const lowercase = (flags & ELEMENT_PRESERVE_ATTRIBUTE_CASE) === 0;
	const is_input = (flags & ELEMENT_IS_INPUT) !== 0;

	for (name in attrs) {
		// omit functions, internal svelte properties and invalid attribute names
		if (typeof attrs[name] === 'function') continue;
		if (name[0] === '$' && name[1] === '$') continue; // faster than name.startsWith('$$')
		if (INVALID_ATTR_NAME_CHAR_REGEX.test(name)) continue;

		var value = attrs[name];

		if (lowercase) {
			name = name.toLowerCase();
		}

		if (is_input) {
			if (name === 'defaultvalue' || name === 'defaultchecked') {
				name = name === 'defaultvalue' ? 'value' : 'checked';
				if (attrs[name]) continue;
			}
		}

		attr_str += attr(name, value, is_html && is_boolean_attribute(name));
	}

	return attr_str;
}

/**
 * @param {Renderer} renderer
 * @param {Record<string, any>} $$props
 * @param {string} name
 * @param {Record<string, unknown>} slot_props
 * @param {null | (() => void)} fallback_fn
 * @returns {void}
 */
function slot(renderer, $$props, name, slot_props, fallback_fn) {
	var slot_fn = $$props.$$slots?.[name];
	// Interop: Can use snippets to fill slots
	if (slot_fn === true) {
		slot_fn = $$props[name === 'default' ? 'children' : name];
	}

	if (slot_fn !== undefined) {
		slot_fn(renderer, slot_props);
	} else {
		fallback_fn?.();
	}
}

/**
 * @param {Record<string, unknown>} props
 * @param {string[]} rest
 * @returns {Record<string, unknown>}
 */
function rest_props(props, rest) {
	/** @type {Record<string, unknown>} */
	const rest_props = {};
	let key;
	for (key in props) {
		if (!rest.includes(key)) {
			rest_props[key] = props[key];
		}
	}
	return rest_props;
}

/**
 * @param {Record<string, unknown>} props
 * @returns {Record<string, unknown>}
 */
function sanitize_props(props) {
	const { children, $$slots, ...sanitized } = props;
	return sanitized;
}

/**
 * Legacy mode: If the prop has a fallback and is bound in the
 * parent component, propagate the fallback value upwards.
 * @param {Record<string, unknown>} props_parent
 * @param {Record<string, unknown>} props_now
 */
function bind_props(props_parent, props_now) {
	for (const key in props_now) {
		const initial_value = props_parent[key];
		const value = props_now[key];
		if (
			initial_value === undefined &&
			value !== undefined &&
			Object.getOwnPropertyDescriptor(props_parent, key)?.set
		) {
			props_parent[key] = value;
		}
	}
}

function getWarnings(src, badProps) {
  const warnings = {};
  checkInvalidSrc(warnings, src);
  checkBadProps(warnings, src, badProps);
  return warnings;
}

// Warning: invalid src prop')
function checkInvalidSrc(warnings, src) {
  if (!src || typeof src !== 'string') {
    warnings.invalidSrc = {
      title: `Invalid src prop`,
      src: !src ? 'undefined' : typeof src,
      message: `The src prop is required and must be a string.`,
      log: `Use of <Cayo> without a src prop found. No cayo instance will be rendered.`,
    };
  }
}

// Warning: unserializable props
function checkBadProps(warnings, src, keys) {
  if (keys.length > 0) {
    let propsStr = '';
    for (let i = 0; i < keys.length; i++) {
      propsStr += `'${keys[i]}'`;
      if (i+1 < keys.length) {
        propsStr += `, `;
      }
    }
    warnings.badProps = {
      title: `Bad props`,
      src,
      message: `Unserializable props found: ${propsStr}. Cayo component props must be serializable in order to be used for hydration.`,
      log: `Unserializable instance props found: ${propsStr}.`,
    };
  }
}

function Cayo($$renderer, $$props) {
	const $$sanitized_props = sanitize_props($$props);
	const $$restProps = rest_props($$sanitized_props, ['src', 'attributes', 'children']);

	$$renderer.component(($$renderer) => {
		let src = $$props['src'];
		let attributes$1 = $$props['attributes'];
		let children = $$props['children']; // Svelte 5 children prop instead of slots

		// Save unserializable prop keys (during stringification)
		// so we can report them later
		const badProps = [];

		function replacer(key, value) {
			const type = typeof value;

			if (type === 'function' || type === 'undefined' || type === 'symbol') {
				badProps.push(key);
			}

			return value;
		}

		// Use legacy $$restProps for compatibility with SSR compilation
		const props = JSON.stringify({ ...$$restProps }, replacer);

		const warnings = getWarnings(src, badProps);

		const cayoInstanceData = {
			'data-cayo-src': !warnings.invalidSrc ? `${src}` : '',
			'data-cayo-id': '' // will get set during prerender process based on the src
		};

		if (warnings) {
			cayoInstanceData['data-cayo-warn'] = JSON.stringify(warnings);
		}

		$$renderer.push(`<!---->

<div${attributes({
			...attributes$1,
			'data-cayo-id': cayoInstanceData['data-cayo-id'],
			'data-cayo-src': cayoInstanceData['data-cayo-src'],
			'data-cayo-warn': cayoInstanceData['data-cayo-warn']
		})}>
  ${html(`<script data-cayo-props type="application/json">${props}</script>`)}
  <!--[-->`);

		slot($$renderer, $$props, 'default', {}, null);

		$$renderer.push(`<!--]-->
</div>`);

		bind_props($$props, { src, attributes: attributes$1, children });
	});
}

Cayo.render = function ($$props, $$opts) {
	return render(Cayo, { props: $$props, context: $$opts?.context });
};

export { Cayo as default };
