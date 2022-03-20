export class Component {
  constructor(sourcePath, cayoPath, dependencies, config) {
    this._config = config;
    this._module = null;
    this._name = sourcePath.replace(config.components, '');
    this._dependencies = dependencies || [];
    this._sourcePath = sourcePath;
    this._modulePath = cayoPath;
    this._result = null;
  }

  async load() {
    this._module = (await import(this._modulePath)).default;
    return this._module;
  }

  render(load = false) {
    if (this._module === null || load === true) {
      this.load();
    }
    this._result = this._module.render();
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