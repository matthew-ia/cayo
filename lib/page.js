import { Component } from "./component.js";
import { prerender } from "./prerender.js";

export class Page extends Component {
  constructor(layout, sourcePath, cayoPath, dependencies, config) {
    super(sourcePath, cayoPath, dependencies, config);
    this._url = sourcePath.replace(config.pages, '').replace('.svelte', '');
    this._name = sourcePath.split('/').pop().replace('.svelte', '');
    this._layout = layout;

    if (this._url === 'index') this._url = '/';
  }

  async render(load = false, cayoComponents) {
    if (this._module === null || load === true) {
      this.load();
    }
    this._result = await prerender(
      this,
      cayoComponents,
      this._config,
    );
    return this._result;
  }

  get layout() {
    return this._layout;
  }

  // get title() {
  //   return this._title;
  // }

  get url() {
    return this._url;
  }

}