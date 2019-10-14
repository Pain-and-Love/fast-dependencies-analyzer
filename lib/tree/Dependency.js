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

module.exports = Dependency
