// convertToIIFE.js
// ================
// Returns an IIFE
//  e.g. (function() { }())

define([
  'defaultValues'
], function(
  defaultValues
) {
  return function convertToIIFE(obj) {
    var callbackFuncParams = obj.callbackFuncParams,
      callbackFunc = obj.callbackFunc,
      dependencyNames = obj.dependencyNames,
      node = obj.node,
      range = (node.range || defaultValues.defaultRange),
      loc = (node.loc || defaultValues.defaultLOC);

    return {
      'type': 'ExpressionStatement',
      'expression': {
        'type': 'CallExpression',
        'callee': {
          'type': 'FunctionExpression',
          'id': null,
          'params': callbackFuncParams,
          'defaults': [],
          'body': callbackFunc.body,
          'rest': callbackFunc.rest,
          'generator': callbackFunc.generator,
          'expression': callbackFunc.expression,
          'range': range,
          'loc': loc
        },
        'arguments': dependencyNames,
        'range': range,
        'loc': loc
      },
      'range': range,
      'loc': loc
    };
  };
});