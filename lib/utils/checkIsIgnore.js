module.exports = ignoreDependencies => {
  const ignoreDependenciesArr = Object.keys(ignoreDependencies);
  const cache = new Set();

  return function checkIgnore(request, execFn) {
    if (cache.has(request)) {
      return true;
    }

    const ignore =
      ignoreDependenciesArr.some(item => request.startsWith(item)) && execFn();

    if (ignore) cache.add(request);
    return ignore;
  };
};
