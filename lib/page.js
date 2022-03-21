import { Component } from "./component.js";
import { prerender } from "./prerender.js";
import { default as fse } from 'fs-extra';

export class Page extends Component {
  constructor(code, layout, sourcePath, modulePath, dependencies, config) {
    super(code, sourcePath, modulePath, dependencies, config);
    this._url = sourcePath.replace(config.pages, '').replace('.svelte', '');
    this._name = sourcePath.split('/').pop().replace('.svelte', '');
    this._modulePath = modulePath;
    this._layout = layout;
    this._bundle = code;

    if (this._url === 'index') this._url = '/';
    console.log('====== page:', this._name, this._dependencies, '\n================================');
  }

  async writeModule() {
    for (const dependency of this._dependencies) {
      this._bundle += dependency
    }
    await fse.outputFile(this._modulePath, this._code);
  }

  async render(load = false, cayoComponents) {
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

}