const checkIgnore = require('./isNodeModules');
const { ignoreNpms } = require('./constants');
const Tree = require('./tree');

const pluginName = 'fast-dependencies-analyzer-plugin';

// 判断路径中是否包含某些被排除的包
function includesIgnoreNpm(request) {
  return ignoreNpms.some(npm => request.includes(npm));
}

class FastDependenciesAnalyzerPlugin {
  constructor({ ignoreDependencies }) {
    this.entry = {};
    this.checkIgnoreFn = checkIgnore(ignoreDependencies);
  }

  static tree = new Tree();

  handleFilePath(issuer, path) {
    const { tree } = FastDependenciesAnalyzerPlugin;
    if (issuer && issuer !== path) {
      return tree.addDependency(issuer, path);
    } else if (!issuer) {
      for (const name of Object.keys(this.entry)) {
        const entry = this.entry[name];
        const equal = path === entry;
        const includes = Array.isArray(entry) && entry.includes(path);
        if (equal || includes) {
          return tree.addEntry({ name, path });
        }
      }
    }
  }

  checkIsSkip(issuer, request) {
    if (['!!', '!', '-!'].some(item => request.startsWith(item))) return false;

    if (this.checkIgnoreFn({ ignoreDependencies, request, issuer }))
      return true;

    return [issuer, request].some(path => includesIgnoreNpm(path));
  }

  beforeResolve(resolveData, callback) {
    const {
      contextInfo: { issuer },
      request,
    } = resolveData;

    const isSkip = issuer ? this.checkIsSkip(issuer, request) : false;
    callback(null, isSkip ? null : resolveData);
  }

  afterResolve(result, callback) {
    callback(null, result);

    const {
      resourceResolveData: {
        context: { issuer, compiler },
        path,
      },
    } = result;

    // 存在子 compiler 要去 handleSucceedModule 里处理
    if (compiler) return;

    this.handleFilePath(issuer, path);
  }

  handleSucceedModule(module) {
    const {
      buildInfo: { fileDependencies },
      rawRequest,
    } = module;

    // !!开头的为使用 scss 或者 css 的
    if (rawRequest && !rawRequest.startsWith('!!')) return true;

    if (fileDependencies && fileDependencies.size > 1) {
      const [issuer, ...dependencies] = fileDependencies;
      dependencies.forEach(dep => this.handleFilePath(issuer, dep));
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
        this.beforeResolve.bind(this),
      );
      nmf.hooks.afterResolve.tapAsync(pluginName, this.afterResolve.bind(this));
    });

    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.finishModules.tapAsync(
        pluginName,
        this.handleFinishModules.bind(this),
      );
      compilation.hooks.succeedModule.tap(
        pluginName,
        this.handleSucceedModule.bind(this),
      );
    });
  }
}

module.exports = FastDependenciesAnalyzerPlugin;
