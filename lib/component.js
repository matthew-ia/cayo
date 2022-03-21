import { hash } from './utils.js';

export class Component {
  constructor(code, sourcePath, modulePath, dependencies, config) {
    this._config = config;
    this._name = sourcePath.replace(config.components, '');
    this._dependencies = dependencies || new Set();
    this._source = sourcePath;
    this._module = null;
    this._modulePath = modulePath;
    this._code = code;
  }

  async load() {
    this._module = (await import(`${this._modulePath}?v=${hash()}`)).default;
    return this._module;
  }

  async render(load = false) {
    if (this._module === null || load === true) {
      return await this.load().then(() => {
        return this._module.render();
      });
    } else {
      return this._module.render();
    }
  }

  get name() {
    return this._name;
  }

  get dependencies() {
    return this._dependencies;
  }

  get code() {
    return this._code;
  }

  get source() {
    return this._source;
  }

}