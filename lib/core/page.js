import { Component } from "./component.js";
import { prerender } from "./render/prerender.js";
import { hash } from './utils.js';


export class Page extends Component {
  constructor(code, layout, sourcePath, modulePath, dependencies, config) {
    super(code, sourcePath, modulePath, dependencies, config);
    this._url = sourcePath.replace(config.pages, '').replace('.svelte', '');
    this._name = sourcePath.split('/').pop().replace('.svelte', '');
    this._modulePath = modulePath;
    this._sourcePath = sourcePath;
    this._layout = layout;
    this._bundle = {};
    this._result;

    if (this._url === 'index') this._url = '/';
  }

  async loadModule() {
    this._bundle.module = (await import(`${this._modulePath}?v=${hash()}`)).default;
    return this._bundle.module;
  }

  async render(load = false, cayoComponents) {
    if (load) await this.loadModule();

    this._result = await prerender(
      this,
      cayoComponents,
      this._config,
    );

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