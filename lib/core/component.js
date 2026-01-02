import { hash } from './utils.js';
import { render } from 'svelte/server';

export class Component {
  constructor(
    name, 
    output = { js: { code: '' }, css: { code: '' } }, 
    sourcePath, 
    modulePath, 
    dependencies, 
    config
  ) {
    this._config = config;
    this._name = name;
    this._dependencies = dependencies || new Set();
    this._source = sourcePath;
    this._module = null;
    this._modulePath = modulePath;
    this._output = output;
  }

  async load() {
    this._module = (await import(`${this._modulePath}?v=${hash()}`)).default;
    return this._module;
  }

  async render(_cayo, options = {}) {
    const { load = false } = options;
    if (load) await this.load();

    try {
      const svelteResult = render(this._module);
      // Svelte 5 returns { body, head } instead of { html, css, head }
      // CSS is now extracted during compilation and stored in this._output
      this._result = {
        html: svelteResult.body || '',
        head: svelteResult.head || '',
        css: this._output.css // Use the CSS extracted during compilation
      };
    } catch (err) {
      throw new Error(`Could not render component: ${this._name} at ${this._source}`, { cause: err })
    }
    return this._result;
  }

  get name() {
    return this._name;
  }

  get dependencies() {
    return this._dependencies;
  }

  set dependencies(deps) {
    this._dependencies = deps;
  }

  get output() {
    return this._output;
  }

  get source() {
    return this._source;
  }

  get result() {
    return this._result;
  }

}