import { hash } from './utils.js';

export class Component {
  constructor(sourcePath, cayoPath, dependencies, config) {
    this._config = config;
    this._module = null;
    this._name = sourcePath.replace(config.components, '');
    this._dependencies = dependencies || new Set();
    this._sourcePath = sourcePath;
    this._modulePath = cayoPath;
    this._result = null;
  }

  async load() {
    console.log(`${this._modulePath}?v=${hash()}`);
    this._module = (await import(`${this._modulePath}?v=${hash()}`)).default;
    console.log('loaded', new Date(), this._module.render());
    return this._module;
  }

  async render(load = false) {
    if (this._module === null || load === true) {
      return await this.load().then(() => {
        this._result = this._module.render();
        return this._result;
      });
    } else {
      this._result = this._module.render();
      return this._result;
    }
  }

  get module() {
    return this._module;
  }

  get name() {
    return this._name;
  }

  get dependencies() {
    return this._dependencies;
  }

  get sourcePath() {
    return this._sourcePath;
  }

  get modulePath() {
    return this._modulePath;
  }

  get result() {
    return this._result;
  }

}