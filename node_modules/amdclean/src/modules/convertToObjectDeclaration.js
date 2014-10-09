// convertToObjectDeclaration.js
// =============================
// Returns an object variable declaration
// e.g. var example = { exampleProp: true }

define([
  'defaultValues'
], function(
  defaultValues
) {
  return function(obj, type) {
    var node = obj.node,
      defaultRange = defaultValues.defaultRange,
      defaultLOC = defaultValues.defaultLOC,
      range = (node.range || defaultRange),
      loc = (node.loc || defaultLOC),
      moduleName = obj.moduleName,
      moduleReturnValue = (function() {
        var modReturnValue,
          callee,
          params,
          returnStatement,
          nestedReturnStatement,
          internalFunctionExpression;

        if (type === 'functionCallExpression') {
          modReturnValue = obj.moduleReturnValue;
          callee = modReturnValue.callee;
          params = callee.params;

          if (params && params.length && _.isArray(params) && _.where(params, {
            'name': 'global'
          })) {

            if (_.isObject(callee.body) && _.isArray(callee.body.body)) {
              returnStatement = _.where(callee.body.body, {
                'type': 'ReturnStatement'
              })[0];

              if (_.isObject(returnStatement) && _.isObject(returnStatement.argument) && returnStatement.argument.type === 'FunctionExpression') {
                internalFunctionExpression = returnStatement.argument;

                if (_.isObject(internalFunctionExpression.body) && _.isArray(internalFunctionExpression.body.body)) {
                  nestedReturnStatement = _.where(internalFunctionExpression.body.body, {
                    'type': 'ReturnStatement'
                  })[0];

                  if (_.isObject(nestedReturnStatement.argument) && _.isObject(nestedReturnStatement.argument.right) && _.isObject(nestedReturnStatement.argument.right.property)) {

                    if (nestedReturnStatement.argument.right.property.name) {
                      modReturnValue = {
                        'type': 'MemberExpression',
                        'computed': false,
                        'object': {
                          'type': 'Identifier',
                          'name': 'window',
                          'range': range,
                          'loc': loc
                        },
                        'property': {
                          'type': 'Identifier',
                          'name': nestedReturnStatement.argument.right.property.name,
                          'range': range,
                          'loc': loc
                        },
                        'range': range,
                        'loc': loc
                      };
                    }
                  }
                }
              }
            }
          }
        }
        modReturnValue = modReturnValue || obj.moduleReturnValue;
        return modReturnValue;
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
          'right': moduleReturnValue,
          'range': range,
          'loc': loc
        },
        'range': range,
        'loc': loc
      };
    return updatedNode;
  };
});