const webpack = require('webpack');
const merge = require('webpack-merge');
const FastDependenciesAnalyzerPlugin = require('./plugin');

function startAnalyze({ webpackOptions, ignoreDependencies, callback }) {
  const plugin = new FastDependenciesAnalyzerPlugin({ ignoreDependencies });
  webpack(
    merge(webpackOptions, {
      mode: 'development',
      devtool: '',
      plugins: [plugin],
    }),
  ).run(() => {
    callback(plugin.tree);
  });
}

module.exports = { startAnalyze, plugin: FastDependenciesAnalyzePlugin };
