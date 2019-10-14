function ignoreNoedModules() {
  const cache = new Set();

  return ({ ignoreDependencies, request, issuer }) => {
    if (cache.has(request)) return true;

    const ignore =
      Object.keys(ignoreDependencies).some(dependency =>
        request.startsWith(dependency),
      ) && !issuer.includes('node_modules');

    if (ignore) cache.add(request);
    return ignore;
  };
}

module.exports = ignoreNoedModules();
