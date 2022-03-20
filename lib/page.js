import { Component } from "./component.js";
import { prerender } from "./prerender.js";

export class Page extends Component {
  constructor(layout, sourcePath, cayoPath, dependencies, config) {
    super(sourcePath, cayoPath, dependencies, config);
    this._url = sourcePath.replace(config.pages, '').replace('.svelte', '');
    this._title = sourcePath.split('/').pop().replace('.svelte', '');
    this._layout = layout;
  }

  async render(load = false, cayoComponentList) {
    if (this._module === null || load === true) {
      this.load();
    }
    this._result = await prerender(
      this,
      cayoComponentList,
      this._config,
    );
  }

  get layout() {
    return this._layout;
  }

  get title() {
    return this._title;
  }

  get url() {
    return this._urlName;
  }

}