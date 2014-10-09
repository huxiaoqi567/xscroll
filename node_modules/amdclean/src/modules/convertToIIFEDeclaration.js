// convertToIIFEDeclaration.js
// ===========================
// Returns a function expression that is executed immediately
// e.g. var example = function(){}()

define([
  'utils',
  'defaultValues'
], function(
  utils,
  defaultValues
) {
  return function convertToIIFEDeclaration(obj) {
    var amdclean = this,
      options = amdclean.options,
      moduleId = obj.moduleId,
      moduleName = obj.moduleName,
      hasModuleParam = obj.hasModuleParam,
      hasExportsParam = obj.hasExportsParam,
      callbackFuncParams = obj.callbackFuncParams,
      isOptimized = obj.isOptimized,
      callback = obj.callbackFunc,
      node = obj.node,
      name = callback.name,
      type = callback.type,
      range = (node.range || defaultValues.defaultRange),
      loc = (node.loc || defaultValues.defaultLOC),
      callbackFunc = (function() {
        var cbFunc = obj.callbackFunc;

        if (type === 'Identifier' && name !== 'undefined') {
          cbFunc = {
            'type': 'FunctionExpression',
            'id': null,
            'params': [],
            'defaults': [],
            'body': {
              'type': 'BlockStatement',
              'body': [{
                'type': 'ReturnStatement',
                'argument': {
                  'type': 'ConditionalExpression',
                  'test': {
                    'type': 'BinaryExpression',
                    'operator': '===',
                    'left': {
                      'type': 'UnaryExpression',
                      'operator': 'typeof',
                      'argument': {
                        'type': 'Identifier',
                        'name': name,
                        'range': range,
                        'loc': loc
                      },
                      'prefix': true,
                      'range': range,
                      'loc': loc
                    },
                    'right': {
                      'type': 'Literal',
                      'value': 'function',
                      'raw': "'function'",
                      'range': range,
                      'loc': loc
                    },
                    'range': range,
                    'loc': loc
                  },
                  'consequent': {
                    'type': 'CallExpression',
                    'callee': {
                      'type': 'Identifier',
                      'name': name,
                      'range': range,
                      'loc': loc
                    },
                    'arguments': callbackFuncParams,
                    'range': range,
                    'loc': loc
                  },
                  'alternate': {
                    'type': 'Identifier',
                    'name': name,
                    'range': range,
                    'loc': loc
                  },
                  'range': range,
                  'loc': loc
                },
                'range': range,
                'loc': loc
              }],
              'range': range,
              'loc': loc
            },
            'rest': null,
            'generator': false,
            'expression': false,
            'range': range,
            'loc': loc
          };
        }
        return cbFunc;
      }()),
      dependencyNames = (function() {
        var depNames = obj.dependencyNames,
          objExpression = {
            'type': 'ObjectExpression',
            'properties': [],
            'range': range,
            'loc': loc
          },
          configMemberExpression = {
            'type': 'MemberExpression',
            'computed': false,
            'object': {
              'type': 'Identifier',
              'name': 'module'
            },
            'property': {
              'type': 'Identifier',
              'name': moduleId
            }
          },
          moduleDepIndex;

        if (options.config && options.config[moduleId]) {
          if (hasExportsParam && hasModuleParam) {
            return [objExpression, objExpression, configMemberExpression];
          } else if (hasModuleParam) {
            moduleDepIndex = _.findIndex(depNames, function(currentDep) {
              return currentDep.name === '{}';
            });
            depNames[moduleDepIndex] = configMemberExpression;
          }
        }

        return depNames;
      }()),
      cb = (function() {
        if (callbackFunc.type === 'Literal' || (callbackFunc.type === 'Identifier' && callbackFunc.name === 'undefined') || isOptimized === true) {
          return callbackFunc;
        } else {
          return {
            'type': 'CallExpression',
            'callee': {
              'type': 'FunctionExpression',
              'id': {
                'type': 'Identifier',
                'name': '',
                'range': range,
                'loc': loc
              },
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
          };
        }
      }()),
      updatedNode = {
        'type': 'ExpressionStatement',
        'expression': {
          'type': 'AssignmentExpression',
          'operator': '=',
          'left': {
            'type': 'Identifier',
            'name': moduleName,
            'range': range,
            'loc': loc
          },
          'right': cb,
          'range': range,
          'loc': loc
        },
        'range': range,
        'loc': loc
      };

    estraverse.replace(callbackFunc, {
      'enter': function(node) {
        if (utils.isModuleExports(node)) {
          return {
            'type': 'AssignmentExpression',
            'operator': '=',
            'left': {
              'type': 'Identifier',
              'name': 'exports'
            },
            'right': node.right
          };
        } else {
          return node;
        }
      }
    });

    return updatedNode;
  };
});