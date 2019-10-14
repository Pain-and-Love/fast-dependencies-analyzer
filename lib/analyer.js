const webpack = require('webpack');
const merge = require('webpack-merge');
const FastDependenciesAnalyzerPlugin = require('./plugin');

function startAnalyze({ webpackOptions, ignoreDependencies, callback }) {
  return new Promise(reslove => {
    webpackOptions = merge(webpackOptions, {
      mode: 'development',
      devtool: '',
      plugins: [new FastDependenciesAnalyzerPlugin({ ignoreDependencies })],
    });
    webpack(webpackOptions).run(() => {
      const result = FastDependenciesAnalyzerPlugin.tree;
      if (callback && typeof callback === 'function') callback(result);
      reslove(result);
    });
  });
}

module.exports = { startAnalyze, plugin: FastDependenciesAnalyzePlugin };
