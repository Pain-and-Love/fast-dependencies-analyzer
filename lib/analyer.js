const webpack = require('webpack');
const merge = require('webpack-merge');
const FastDependenciesAnalyzePlugin = require('./plugin');

const startAnalye = function({ webpackOptions, ignoreDependencies, callback }) {
  const analyer = new FastDependenciesAnalyzePlugin({ ignoreDependencies });
  webpack(
    merge(webpackOptions, {
      mode: 'development',
      devtool: '',
      plugins: [analyer]
    })
  ).run(() => {
    callback(analyer.tree);
  });
};

module.exports = { startAnalye, plugin: FastDependenciesAnalyzePlugin };
