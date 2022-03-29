import { Component } from "./component.js";
import { prerender } from "./render/prerender.js";
import { default as fse } from 'fs-extra';
import { build } from './bundle.js'
import { hash } from './utils.js';


export class Page extends Component {
  constructor(code, layout, sourcePath, modulePath, dependencies, config) {
    super(code, sourcePath, modulePath, dependencies, config);
    this._url = sourcePath.replace(config.pages, '').replace('.svelte', '');
    this._name = sourcePath.split('/').pop().replace('.svelte', '');
    this._modulePath = modulePath;
    this._layout = layout;
    this._bundle = {};
    this._result;

    if (this._url === 'index') this._url = '/';
    // console.log('====== page:', this._name, this._dependencies, '\n================================');
    // this.writeModule();
  }

  async writeModule() {
    // for (const dependency of this._dependencies) {
    //   this._bundle += dependency
    // }
    // console.log(this._modulePath);
    this._bundle.output = await build(this._modulePath, this._config);
    this._bundle.modulePath = this._modulePath.replace('.js', '.bundle.js');
    // FIXME: add try catch; else it errors if there's exits if there's errors during build
    await fse.outputFile(this._bundle.modulePath, this._bundle.output.code);

    // console.log(this._bundle.output);
    // await fse.outputFile(this._modulePath.replace('.js', '.bundle.js'), this._bundle.output.code);
  }

  async loadModule() {
    this._bundle.module = (await import(`${this._bundle.modulePath}?v=${hash()}`)).default;
    return this._bundle.module;
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

  get result() {
    return this._result;
  }

}