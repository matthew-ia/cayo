import { Component } from "./component.js";
import { prerender } from "./render/prerender.js";
import { hash } from './utils.js';


export class Page extends Component {
  constructor(code, layout, sourcePath, modulePath, dependencies, config) {
    super(null, code, sourcePath, modulePath, dependencies, config);
    this._url = sourcePath.replace(config.pages, '').replace('.svelte', '');
    // TODO: Is this a good name value?
    this._name = sourcePath.split('/').pop().replace('.svelte', '');
    this._modulePath = modulePath;
    this._sourcePath = sourcePath;
    this._layout = layout;
    // this._module;
    this._result;

    if (this._url === 'index') this._url = '/';
  }

  // async load() {
  //   this._module = (await import(`${this._modulePath}?v=${hash()}`)).default;
  //   return this._module;
  // }

  async render(_cayo, options = {}) {
    const { load = false } = options;
    if (load) await this.load();
    try {
      this._result = await prerender(
        this,
        _cayo,
        this._config,
      );  
    } catch (err) {
      console.error(err);
      throw new Error(`Could not prerender page ${this._name}`, { cause: err })
    }

    return this;
  }

  get layout() {
    return this._layout;
  }

  get url() {
    return this._url;
  }

  get result() {
    return this._result;
  }

  get sourcePath() {
    return this._sourcePath;
  }

}