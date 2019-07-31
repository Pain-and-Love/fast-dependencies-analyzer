const checkIgnore = require('./utils/checkIsIgnore');
const includesIgnore = require('./utils/includesIgnore');
const Tree = require('./tree');

const pluginName = 'fast-dependencies-analyzer-plugin';

class FastDependenciesAnalyzerPlugin {
  constructor({ ignoreDependencies }) {
    this.resolver = {};
    this.entry = {};
    this.checkIgnoreFn = checkIgnore(ignoreDependencies);
    this.tree = new Tree();
  }

  addDependency(issuer, path) {
    if (path.includes('node_modules')) {
      return;
    }

    if (issuer && issuer !== path) {
      return this.tree.addDependency(issuer, path);
    }

    if (!issuer) {
      for (const name of Object.keys(this.entry)) {
        const entry = this.entry[name];
        const equal = path === entry;
        const includes = Array.isArray(entry) && entry.includes(path);
        if (equal || includes) {
          return this.tree.addEntry({ name, path });
        }
      }
    }
  }

  checkIsSkip(issuer, request) {
    if (['!!', '!', '-!'].some(item => request.startsWith(item))) {
      return false;
    }

    if (this.checkIgnoreFn(request, () => !issuer.includes('node_modules'))) {
      return true;
    }

    return includesIgnore([issuer, request]);
  }

  beforeResolve(resolveData, callback) {
    const {
      contextInfo: { issuer },
      request
    } = resolveData;

    const skip = issuer ? this.checkIsSkip(issuer, request) : false;
    callback(null, skip ? null : resolveData);
  }

  afterResolve(result, callback) {
    callback(null, result);

    const {
      resourceResolveData: {
        context: { issuer, compiler },
        path
      }
    } = result;

    if (compiler) return;

    this.addDependency(issuer, path);
  }

  handleSucceedModule(module) {
    const {
      buildInfo: { fileDependencies },
      rawRequest
    } = module;

    // !!开头的为使用 scss 或者 css 的
    if (rawRequest && !rawRequest.startsWith('!!')) {
      return true;
    }

    if (fileDependencies && fileDependencies.size > 1) {
      const dependencies = [...fileDependencies];
      const issuer = dependencies.shift();
      dependencies.forEach(dep => this.addDependency(issuer, dep));
    }

    return true;
  }

  handleFinishModules(modules, callback) {
    callback(`${pluginName}：finished`);
  }

  apply(compiler) {
    compiler.hooks.entryOption.tap(pluginName, (context, entry) => {
      if (typeof entry === 'string' || Array.isArray(entry)) {
        this.entry = { main: [entry] };
      } else if (typeof entry === 'object') {
        this.entry = entry;
      }
    });

    compiler.hooks.normalModuleFactory.tap(pluginName, nmf => {
      nmf.hooks.beforeResolve.tapAsync(
        pluginName,
        this.beforeResolve.bind(this)
      );
      nmf.hooks.afterResolve.tapAsync(pluginName, this.afterResolve.bind(this));
    });

    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.finishModules.tapAsync(
        pluginName,
        this.handleFinishModules.bind(this)
      );
      compilation.hooks.succeedModule.tap(
        pluginName,
        this.handleSucceedModule.bind(this)
      );
    });
  }
}

module.exports = FastDependenciesAnalyzePlugin;
