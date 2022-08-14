import { hash } from './utils.js';

export class Component {
  constructor(name, code, sourcePath, modulePath, dependencies, config) {
    this._config = config;
    this._name = name;
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

  async render(_cayo, options = {}) {
    const { load = false } = options;
    if (load) await this.load();

    try {
      this._result = this._module.render();
    } catch (err) {
      throw new Error(`Could not render component ${this._name}`, { cause: err })
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

  get code() {
    return this._code;
  }

  get source() {
    return this._source;
  }

  get result() {
    return this._result;
  }

}