class Dependency {
  constructor({ path }) {
    this.type = 'module';
    this.path = path;
    this.dependencies = [];
  }

  add(dep) {
    const { dependencies } = this;
    dependencies.push(dep);
  }

  has(filepath) {
    const { dependencies, path } = this;
    if (path === filepath) return true;
    return dependencies.some(dependency => dependency.has(filepath));
  }

  remove() {
    this.dependencies = [];
  }
}

class EntryDependency extends Dependency {
  constructor(props) {
    super(props);
    this.type = 'entry';
    this.name = props.name;
  }
}

module.exports = class Tree {
  constructor() {
    this.dependencies = [];
    this.cache = new Map();
  }

  toJson() {
    return JSON.parse(JSON.stringify(this.dependencies));
  }

  // 尾递归优化
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
    const { cache, dependencies } = this;
    if (cache.get(issuer) === filepath) return;
    cache.set(issuer, filepath);
    this.setDependency(dependencies, issuer, filepath);
  }

  findEntry(filepath) {
    if (typeof filepath !== 'string') {
      throw new Error('It must be an string');
    }
    const { dependencies } = this;
    const result = dependencies.filter(dependency => dependency.has(filepath));
    return result;
  }

  findAllEntry(files) {
    if (!Array.isArray(files)) {
      throw new Error('It must be an array！');
    }

    const result = [];
    const cache = new Set();
    const { dependencies } = this;

    files.forEach(file => {
      for (const dependency of dependencies) {
        const { name } = dependency;
        if (cache.has(name)) continue;
        const has = dependency.has(file);
        if (!has) continue;
        result.push(dependency);
        cache.add(name);
      }
    });

    return result;
  }
};
