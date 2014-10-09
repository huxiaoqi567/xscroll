// clean.js
// ========
// Removes any AMD and/or CommonJS trace from the provided source code

define([
  'utils',
  'defaultValues',
  'traverseAndUpdateAst',
  'findAndStoreAllModuleIds',
  'createAst',
  'generateCode',
  'normalizeModuleName'
], function(
  utils,
  defaultValues,
  traverseAndUpdateAst,
  findAndStoreAllModuleIds,
  createAst,
  generateCode,
  normalizeModuleName
) {
  // clean
  // -----
  //  Creates an AST using Esprima, traverse and updates the AST using Estraverse, and generates standard JavaScript using Escodegen.
  return function clean() {
    var amdclean = this,
      options = amdclean.options,
      ignoreModules = options.ignoreModules,
      originalAst = {},
      ast = {},
      configAst = {},
      generatedCode,
      declarations = [],
      hoistedVariables = {},
      hoistedCallbackParameters = {},
      defaultRange = defaultValues.defaultRange,
      defaultLOC = defaultValues.defaultLOC;

    // Creates and stores an AST representation of the code
    originalAst = createAst.call(amdclean);

    // Loops through the AST, finds all module ids, and stores them in the current instance storedModules property
    findAndStoreAllModuleIds.call(amdclean, originalAst);

    // Traverses the AST and removes any AMD trace
    ast = traverseAndUpdateAst.call(amdclean, {
      ast: originalAst
    });

    // Post Clean Up
    // Removes all empty statements from the source so that there are no single semicolons and
    // Makes sure that all require() CommonJS calls are converted
    // And all aggressive optimizations (if the option is turned on) are handled
    if (ast && _.isArray(ast.body)) {
      estraverse.replace(ast, {
        enter: function(node, parent) {
          var normalizedModuleName,
            assignmentName = node && node.left && node.left.name ? node.left.name : '',
            cb = node.right,
            assignmentNodes = [],
            assignments = {},
            mappedParameters = _.filter(amdclean.callbackParameterMap[assignmentName], function(currentParameter) {
              return currentParameter && currentParameter.count > 1;
            }),
            mappedCbDependencyNames,
            mappedCbParameterNames,
            paramsToRemove = [];

          if (node === undefined || node.type === 'EmptyStatement') {
            _.each(parent.body, function(currentNode, iterator) {
              if (currentNode === undefined || currentNode.type === 'EmptyStatement') {
                parent.body.splice(iterator, 1);
              }
            });
          } else if (utils.isRequireExpression(node)) {

            if (node['arguments'] && node['arguments'][0] && node['arguments'][0].value) {
              normalizedModuleName = normalizeModuleName.call(amdclean, node['arguments'][0].value);

              if (ignoreModules.indexOf(normalizedModuleName) === -1) {
                return {
                  'type': 'Identifier',
                  'name': normalizedModuleName,
                  'range': (node.range || defaultRange),
                  'loc': (node.loc || defaultLOC)
                };
              } else {
                return node;
              }
            } else {
              return node;
            }
          } else if (options.aggressiveOptimizations === true && node.type === 'AssignmentExpression' && assignmentName) {

            // The names of all of the current callback function parameters
            mappedCbParameterNames = _.map((cb && cb.callee && cb.callee.params ? cb.callee.params : []), function(currentParam) {
              return currentParam.name;
            });

            // The names of all of the current callback function dependencies
            mappedCbDependencyNames = _.map(cb.arguments, function(currentArg) {
              return currentArg.name;
            });

            // Loop through the dependency names
            _.each(mappedCbDependencyNames, function(currentDependencyName) {

              // Nested loop to see if any of the dependency names map to a callback parameter
              _.each(amdclean.callbackParameterMap[currentDependencyName], function(currentMapping) {
                var mappedName = currentMapping.name,
                  mappedCount = currentMapping.count;

                // Loops through all of the callback function parameter names to see if any of the parameters should be removed
                _.each(mappedCbParameterNames, function(currentParameterName, iterator) {
                  if (mappedCount > 1 && mappedName === currentParameterName) {
                    paramsToRemove.push(iterator);
                  }
                });
              });
            });

            _.each(paramsToRemove, function(currentParam) {
              cb.arguments.splice(currentParam, currentParam + 1);
              cb.callee.params.splice(currentParam, currentParam + 1);
            });

            // If the current Assignment Expression is a mapped callback parameter
            if (amdclean.callbackParameterMap[assignmentName]) {
              node.right = (function() {

                // If aggressive optimizations are turned on, the mapped parameter is used more than once, and there are mapped dependencies to be removed
                if (options.aggressiveOptimizations === true && mappedParameters.length) {

                  // All of the necessary assignment nodes
                  assignmentNodes = _.map(mappedParameters, function(currentDependency, iterator) {
                    return {
                      'type': 'AssignmentExpression',
                      'operator': '=',
                      'left': {
                        'type': 'Identifier',
                        'name': currentDependency.name,
                        'range': defaultRange,
                        'loc': defaultLOC
                      },
                      'right': (iterator < mappedParameters.length - 1) ? {
                        'range': defaultRange,
                        'loc': defaultLOC
                      } : cb,
                      'range': defaultRange,
                      'loc': defaultLOC
                    };
                  });

                  // Creates an object containing all of the assignment expressions
                  assignments = _.reduce(assignmentNodes, function(result, assignment) {
                    result.right = assignment;
                    return result;
                  });

                  // The constructed assignment object node
                  return assignmentNodes.length ? assignments : cb;
                } else {
                  return cb;
                }
              }());
              return node;
            }
          }
        }
      });
    }

    // Makes any necessary modules global by appending a global instantiation to the code
    // eg: window.exampleModule = exampleModule;
    if (_.isArray(options.globalModules)) {

      _.each(options.globalModules, function(currentModule) {

        if (_.isString(currentModule) && currentModule.length) {
          ast.body.push({
            'type': 'ExpressionStatement',
            'expression': {
              'type': 'AssignmentExpression',
              'operator': '=',
              'left': {
                'type': 'MemberExpression',
                'computed': false,
                'object': {
                  'type': 'Identifier',
                  'name': 'window',
                  'range': defaultRange,
                  'loc': defaultLOC
                },
                'property': {
                  'type': 'Identifier',
                  'name': currentModule,
                  'range': defaultRange,
                  'loc': defaultLOC
                },
                'range': defaultRange,
                'loc': defaultLOC
              },
              'right': {
                'type': 'Identifier',
                'name': currentModule,
                'range': defaultRange,
                'loc': defaultLOC
              },
              'range': defaultRange,
              'loc': defaultLOC
            },
            'range': defaultRange,
            'loc': defaultLOC
          });
        }
      });
    }

    hoistedCallbackParameters = (function() {
      var obj = {},
        callbackParameterMap = amdclean.callbackParameterMap,
        currentParameterName;

      _.each(callbackParameterMap, function(mappedParameters) {

        _.each(mappedParameters, function(currentParameter) {
          if (currentParameter.count > 1) {
            currentParameterName = currentParameter.name;
            obj[currentParameterName] = true;
          }
        });
      });
      return obj;
    }());

    // Hoists all modules and necessary callback parameters
    hoistedVariables = _.merge(_.cloneDeep(_.reduce(amdclean.storedModules, function(storedModules, key, val) {
      if (key !== false) {
        storedModules[val] = true;
      }
      return storedModules;
    }, {})), hoistedCallbackParameters);

    // Creates variable declarations for each AMD module/callback parameter that needs to be hoisted
    _.each(hoistedVariables, function(moduleValue, moduleName) {
      if (!_.contains(options.ignoreModules, moduleName)) {
        declarations.push({
          'type': 'VariableDeclarator',
          'id': {
            'type': 'Identifier',
            'name': moduleName,
            'range': defaultRange,
            'loc': defaultLOC
          },
          'init': null,
          'range': defaultRange,
          'loc': defaultLOC
        });
      }
    });

    // Adds a local module variable if a user wants local module information available to them
    if (_.isObject(options.config) && !_.isEmpty(options.config)) {
      configAst = (function() {
        var props = [];

        _.each(options.config, function(val, key) {
          var currentModuleConfig = options.config[key];

          props.push({
            'type': 'Property',
            'key': {
              'type': 'Literal',
              'value': key
            },
            'value': {
              'type': 'ObjectExpression',
              'properties': [{
                'type': 'Property',
                'key': {
                  'type': 'Literal',
                  'value': 'config'
                },
                'value': {
                  'type': 'FunctionExpression',
                  'id': null,
                  'params': [],
                  'defaults': [],
                  'body': {
                    'type': 'BlockStatement',
                    'body': [{
                      'type': 'ReturnStatement',
                      'argument': createAst.call(amdclean, 'var x =' + JSON.stringify(currentModuleConfig)).body[0].declarations[0].init
                    }]
                  }
                },
                'kind': 'init'
              }]
            }
          });
        });

        return {
          'type': 'VariableDeclarator',
          'id': {
            'type': 'Identifier',
            'name': 'module'
          },
          'init': {
            'type': 'ObjectExpression',
            'properties': props
          }
        };
      }());

      declarations.push(configAst);
    }

    // If there are declarations, the declarations are preprended to the beginning of the code block
    if (declarations.length) {
      ast.body.unshift({
        'type': 'VariableDeclaration',
        'declarations': declarations,
        'kind': 'var',
        'range': defaultRange,
        'loc': defaultLOC
      });
    }

    // Converts the updated AST to a string of code
    generatedCode = generateCode.call(amdclean, ast);

    // If there is a wrap option specified
    if (_.isObject(options.wrap)) {
      if (_.isString(options.wrap.start) && options.wrap.start.length) {
        generatedCode = options.wrap.start + generatedCode;
      }
      if (_.isString(options.wrap.end) && options.wrap.end.length) {
        generatedCode = generatedCode + options.wrap.end;
      }
    }

    return generatedCode;
  };
});