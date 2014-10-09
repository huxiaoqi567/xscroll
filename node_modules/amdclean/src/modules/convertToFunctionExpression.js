// convertToFunctionExpression.js
// ==============================
// Returns either an IIFE or variable declaration.
// Internally calls either convertToIIFE() or convertToIIFEDeclaration()

define([
  'utils',
  'convertToIIFE',
  'convertToIIFEDeclaration',
  'defaultValues',
  'normalizeModuleName',
  'defaultValues'
], function(
  utils,
  convertToIIFE,
  convertToIIFEDeclaration,
  defaultValues,
  normalizeModuleName,
  defaultValues
) {
  return function convertToFunctionExpression(obj) {
    var amdclean = this,
      options = amdclean.options,
      ignoreModules = options.ignoreModules,
      node = obj.node,
      isDefine = obj.isDefine,
      isRequire = obj.isRequire,
      isOptimized = false,
      moduleName = obj.moduleName,
      moduleId = obj.moduleId,
      dependencies = obj.dependencies,
      depLength = dependencies.length,
      aggressiveOptimizations = options.aggressiveOptimizations,
      exportsExpressions = [],
      moduleExportsExpressions = [],
      defaultRange = defaultValues.defaultRange,
      defaultLOC = defaultValues.defaultLOC,
      range = obj.range || defaultRange,
      loc = obj.loc || defaultLOC,
      shouldOptimize = obj.shouldOptimize,
      dependencyBlacklist = defaultValues.dependencyBlacklist,
      hasNonMatchingParameter = false,
      callbackFunc = (function() {
        var callbackFunc = obj.moduleReturnValue,
          body,
          returnStatements,
          firstReturnStatement,
          returnStatementArg;

        // If the module callback function is not empty
        if (callbackFunc && callbackFunc.type === 'FunctionExpression' && callbackFunc.body && _.isArray(callbackFunc.body.body) && callbackFunc.body.body.length) {

          // Filter 'use strict' statements
          body = _.filter(callbackFunc.body.body, function(node) {
            if (options.removeUseStricts === true) {
              return !utils.isUseStrict(node.expression);
            } else {
              return node;
            }
          });

          // Returns an array of all return statements
          returnStatements = _.where(body, {
            'type': 'ReturnStatement'
          });

          exportsExpressions = _.where(body, {
            'left': {
              'type': 'Identifier',
              'name': 'exports'
            }
          });

          moduleExportsExpressions = _.where(body, {
            'left': {
              'type': 'MemberExpression',
              'object': {
                'type': 'Identifier',
                'name': 'module'
              },
              'property': {
                'type': 'Identifier',
                'name': 'exports'
              }
            }
          });

          // If there is a return statement
          if (returnStatements.length) {
            firstReturnStatement = returnStatements[0];
            returnStatementArg = firstReturnStatement.argument;

            hasNonMatchingParameter = function() {
              var nonMatchingParameter = false;
              _.each(callbackFunc.params, function(currentParam) {
                var currentParamName = currentParam.name;
                if (!amdclean.storedModules[currentParamName] && !dependencyBlacklist[currentParamName]) {
                  nonMatchingParameter = true;
                }
              });
              return nonMatchingParameter;
            }();

            // If something other than a function expression is getting returned
            // and there is more than one AST child node in the factory function
            // return early
            if (hasNonMatchingParameter || !shouldOptimize || (!utils.isFunctionExpression(firstReturnStatement) && body.length > 1) || (returnStatementArg && returnStatementArg.type === 'Identifier')) {
              return callbackFunc;
            } else {
              // Optimize the AMD module by setting the callback function to the return statement argument
              callbackFunc = returnStatementArg;
              isOptimized = true;

              if (callbackFunc.params) {
                depLength = callbackFunc.params.length;
              }
            }
          }
        } else if (callbackFunc && callbackFunc.type === 'FunctionExpression' && callbackFunc.body && _.isArray(callbackFunc.body.body) && callbackFunc.body.body.length === 0) {
          callbackFunc = {
            'type': 'Identifier',
            'name': 'undefined',
            'range': range,
            'loc': loc
          };
          depLength = 0;
        }
        return callbackFunc;
      }()),
      hasReturnStatement = (function() {
        var returns = [];

        if (callbackFunc && callbackFunc.body && _.isArray(callbackFunc.body.body)) {
          returns = _.where(callbackFunc.body.body, {
            'type': 'ReturnStatement'
          });
          if (returns.length) {
            return true;
          }
        }
        return false;
      }()),
      originalCallbackFuncParams,
      hasExportsParam = (function() {
        var cbParams = callbackFunc.params || [];

        return _.where(cbParams, {
          'name': 'exports'
        }).length;
      }()),
      hasModuleParam = (function() {
        var cbParams = callbackFunc.params || [];

        return _.where(cbParams, {
          'name': 'module'
        }).length;
      }()),
      normalizeDependencyNames = {},
      dependencyNames = (function() {
        var deps = [],
          currentName;

        _.each(dependencies, function(currentDependency) {
          currentName = normalizeModuleName.call(amdclean, utils.normalizeDependencyName(moduleId, currentDependency), moduleId);
          normalizeDependencyNames[currentName] = true;
          deps.push({
            'type': 'Identifier',
            'name': currentName,
            'range': defaultRange,
            'loc': defaultLOC
          });
        });
        return deps;
      }()),
      // Makes sure the new name is not an existing callback function dependency and/or existing local variable
      findNewParamName = function findNewParamName(name) {
        name = '_' + name + '_';
        var containsLocalVariable = (function() {
          var containsVariable = false;

          if (normalizeDependencyNames[name]) {
            containsVariable = true;
          } else {
            estraverse.traverse(callbackFunc, {
              'enter': function(node) {
                if (node.type === 'VariableDeclarator' &&
                  node.id &&
                  node.id.type === 'Identifier' &&
                  node.id.name === name) {
                  containsVariable = true;
                }
              }
            });
          }
          return containsVariable;
        }());
        // If there is not a local variable declaration with the passed name, return the name and surround it with underscores
        // Else if there is already a local variable declaration with the passed name, recursively add more underscores surrounding it
        if (!containsLocalVariable) {
          return name;
        } else {
          return findNewParamName(name);
        }
      },
      matchingRequireExpressionNames = (function() {
        var matchingNames = [];

        if (hasExportsParam) {
          estraverse.traverse(callbackFunc, {
            'enter': function(node) {
              var variableName,
                expressionName;

              if (node.type === 'VariableDeclarator' && utils.isRequireExpression(node.init)) {

                // If both variable name and expression names are there
                if (node.id && node.id.name && node.init && node.init['arguments'] && node.init['arguments'][0] && node.init['arguments'][0].value) {
                  variableName = node.id.name;
                  expressionName = normalizeModuleName.call(amdclean, utils.normalizeDependencyName(moduleId, node.init['arguments'][0].value, moduleId));

                  if (!_.contains(ignoreModules, expressionName) && (variableName === expressionName)) {
                    matchingNames.push({
                      'originalName': expressionName,
                      'newName': findNewParamName(expressionName),
                      'range': (node.range || defaultRange),
                      'loc': (node.loc || defaultLOC)
                    });
                  }
                }
              }
            }
          });
        }
        return matchingNames;
      }()),
      matchingRequireExpressionParams = (function() {
        var params = [];

        _.each(matchingRequireExpressionNames, function(currentParam) {
          params.push({
            'type': 'Identifier',
            'name': currentParam.newName ? currentParam.newName : currentParam,
            'range': currentParam.range,
            'loc': currentParam.loc
          });
        });

        return params;
      }()),
      callbackFuncParams = (function() {
        var deps = [],
          currentName,
          cbParams = _.union((callbackFunc.params && callbackFunc.params.length ? callbackFunc.params : !shouldOptimize && dependencyNames && dependencyNames.length ? dependencyNames : []), matchingRequireExpressionParams),
          mappedParameter = {};

        _.each(cbParams, function(currentParam, iterator) {
          if (currentParam) {
            currentName = currentParam.name;
          } else {
            currentName = dependencyNames[iterator].name;
          }

          if (!shouldOptimize && currentName !== '{}') {
            deps.push({
              'type': 'Identifier',
              'name': currentName,
              'range': defaultRange,
              'loc': defaultLOC
            });
          } else if (currentName !== '{}' && (!hasExportsParam || defaultValues.dependencyBlacklist[currentName] !== 'remove')) {
            deps.push({
              'type': 'Identifier',
              'name': currentName,
              'range': defaultRange,
              'loc': defaultLOC
            });

            // If a callback parameter is not the exact name of a stored module and there is a dependency that matches the current callback parameter
            if (!isOptimized && aggressiveOptimizations === true && !amdclean.storedModules[currentName] && dependencyNames[iterator]) {

              // If the current dependency has not been stored
              if (!amdclean.callbackParameterMap[dependencyNames[iterator].name]) {
                amdclean.callbackParameterMap[dependencyNames[iterator].name] = [{
                  'name': currentName,
                  'count': 1
                }];
              } else {
                mappedParameter = _.where(amdclean.callbackParameterMap[dependencyNames[iterator].name], {
                  'name': currentName
                });

                if (mappedParameter.length) {
                  mappedParameter = mappedParameter[0];
                  mappedParameter.count += 1;
                } else {
                  amdclean.callbackParameterMap[dependencyNames[iterator].name].push({
                    'name': currentName,
                    'count': 1
                  });
                }
              }
            }
          }
        });

        originalCallbackFuncParams = deps;

        // Only return callback function parameters that do not directly match the name of existing stored modules
        return _.filter(deps || [], function(currentParam) {
          return aggressiveOptimizations === true && shouldOptimize ? !amdclean.storedModules[currentParam.name] : true;
        });
      }()),
      isCommonJS = !hasReturnStatement && hasExportsParam,
      hasExportsAssignment = exportsExpressions.length || moduleExportsExpressions.length,
      dependencyNameLength,
      callbackFuncParamsLength;

    // Only return dependency names that do not directly match the name of existing stored modules
    dependencyNames = _.filter(dependencyNames || [], function(currentDep, iterator) {
      var mappedCallbackParameter = originalCallbackFuncParams[iterator],
        currentDepName = currentDep.name;

      // If the matching callback parameter matches the name of a stored module, then do not return it
      // Else if the matching callback parameter does not match the name of a stored module, return the dependency
      return aggressiveOptimizations === true && shouldOptimize ? (!mappedCallbackParameter || amdclean.storedModules[mappedCallbackParameter.name] && mappedCallbackParameter.name === currentDepName ? !amdclean.storedModules[currentDepName] : !amdclean.storedModules[mappedCallbackParameter.name]) : true;
    });

    dependencyNames = _.map(dependencyNames || [], function(currentDep, iterator) {
      if (dependencyBlacklist[currentDep.name]) {
        currentDep.name = '{}';
      }
      return currentDep;
    });

    dependencyNameLength = dependencyNames.length;
    callbackFuncParamsLength = callbackFuncParams.length;

    // If the module dependencies passed into the current module are greater than the used callback function parameters, do not pass the dependencies
    if (dependencyNameLength > callbackFuncParamsLength) {
      dependencyNames.splice(callbackFuncParamsLength, dependencyNameLength - callbackFuncParamsLength);
    }

    // If it is a CommonJS module and there is an exports assignment, make sure to return the exports object
    if (isCommonJS && hasExportsAssignment) {
      callbackFunc.body.body.push({
        'type': 'ReturnStatement',
        'argument': {
          'type': 'Identifier',
          'name': 'exports',
          'range': defaultRange,
          'loc': defaultLOC
        },
        'range': defaultRange,
        'loc': defaultLOC
      });
    }

    // Makes sure to update all the local variable require expressions to any updated names
    estraverse.replace(callbackFunc, {
      'enter': function(node) {
        var normalizedModuleName,
          newName;

        if (utils.isRequireExpression(node)) {

          if (node['arguments'] && node['arguments'][0] && node['arguments'][0].value) {

            normalizedModuleName = normalizeModuleName.call(amdclean, utils.normalizeDependencyName(moduleId, node['arguments'][0].value, moduleId));

            if (_.contains(ignoreModules, normalizedModuleName)) {
              return node;
            }

            if (_.where(matchingRequireExpressionNames, {
              'originalName': normalizedModuleName
            }).length) {
              newName = _.where(matchingRequireExpressionNames, {
                'originalName': normalizedModuleName
              })[0].newName;
            }
            return {
              'type': 'Identifier',
              'name': newName ? newName : normalizedModuleName,
              'range': (node.range || defaultRange),
              'loc': (node.loc || defaultLOC)
            };
          } else {
            return node;
          }
        }
      }
    });

    if (isDefine) {
      return convertToIIFEDeclaration.call(amdclean, {
        'moduleId': moduleId,
        'moduleName': moduleName,
        'dependencyNames': dependencyNames,
        'callbackFuncParams': callbackFuncParams,
        'hasModuleParam': hasModuleParam,
        'hasExportsParam': hasExportsParam,
        'callbackFunc': callbackFunc,
        'isOptimized': isOptimized,
        'node': node
      });
    } else if (isRequire) {
      return convertToIIFE.call(amdclean, {
        'dependencyNames': dependencyNames,
        'callbackFuncParams': callbackFuncParams,
        'callbackFunc': callbackFunc,
        'node': node
      });
    }
  };
});