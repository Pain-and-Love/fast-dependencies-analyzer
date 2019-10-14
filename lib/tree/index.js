const EntryDependency = require('./EntryDependency');
const Dependency = require('./Dependency');

class Tree {
  constructor() {
    this.dependencies = [];
    this.cache = new Map();
  }

  toJson() {
    return JSON.parse(JSON.stringify(this.dependencies));
  }

  setDependency(dependencies, issuer, filepath) {
    for (const dependency of dependencies) {
      const { dependencies: subDependencies, path } = dependency;
      if (path === issuer) {
        return dependency.add(new Dependency({ path: filepath }));
      }
      this.setDependency(subDependencies, issuer, filepath);
    }
  }

  addEntry({ name, path }) {
    this.dependencies.push(new EntryDependency({ path, name }));
  }

  addDependency(issuer, filepath) {
    if (filepath.includes('node_modules')) return;
    const { cache, dependencies } = this;
    if (cache.get(issuer) === filepath) return;
    cache.set(issuer, filepath);
    this.setDependency(dependencies, issuer, filepath);
  }

  findEntry(filepath) {
    if (typeof filepath !== 'string') {
      throw new Error('Arguments must be an string');
    }
    const { dependencies } = this;
    const result = dependencies.filter(dependency => dependency.has(filepath));
    return result;
  }

  findAllEntry(files) {
    if (!Array.isArray(files)) {
      throw new Error('Arguments must be an array！');
    }

    const result = [];
    const cache = new Set();
    const { dependencies } = this;

    for (const file of files) {
      for (const dependency of dependencies) {
        const { name } = dependency;
        if (cache.has(name)) continue;
        const has = dependency.has(file);
        if (!has) continue;
        result.push(dependency);
        cache.add(name);
      }
    }
    return result;
  }
}

module.exports = Tree;
