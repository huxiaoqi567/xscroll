// getNormalizedModuleName.js
// ==========================
// Retrieves the module id if the current node is a define() method

define([
  'utils',
  'normalizeModuleName'
], function(
  utils,
  normalizeModuleName
) {
  return function getNormalizedModuleName(node) {
    if (!utils.isDefine(node)) {
      return;
    }

    var amdclean = this,
      moduleId = node.expression['arguments'][0].value,
      moduleName = normalizeModuleName.call(amdclean, moduleId);

    return moduleName;
  };
});