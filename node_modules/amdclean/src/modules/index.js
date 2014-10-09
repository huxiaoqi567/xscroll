// index.js
// ========
// Wraps AMDclean in the UMD pattern to support being loaded in multiple environments,
// Sets all of the third-party dependencies
// And exposes the public API

require([
  'defaultOptions',
  'errorMsgs',
  'clean'
], function(
  defaultOptions,
  errorMsgs,
  clean
) {
  (function(root, factory, undefined) {
    'use strict';
    // Universal Module Definition (UMD) to support AMD, CommonJS/Node.js, and plain browser loading
    if (typeof define === 'function' && define.amd) {
      factory.amd = true;
      define(['esprima', 'estraverse', 'escodegen', 'underscore'], function(esprima, estraverse, escodegen, underscore) {
        return factory({
          'esprima': esprima,
          'estraverse': estraverse,
          'escodegen': escodegen,
          'underscore': underscore
        }, root);
      });
    } else if (typeof exports !== 'undefined') {
      factory.commonjs = true;
      module.exports = factory(null, root);
    } else {
      root.amdclean = factory(null, root);
    }
  }(this, function cleanamd(amdDependencies, context) {
    'use strict';

    // Third-Party Dependencies
    // Note: These dependencies are hoisted to the top (as local variables) at build time (Look in the gulpfile.js file and the AMDclean wrap option for more details)
    esprima = (function() {
      if (cleanamd.amd && amdDependencies && amdDependencies.esprima && amdDependencies.esprima.parse) {
        return amdDependencies.esprima;
      } else if (cleanamd.commonjs) {
        return require('esprima');
      } else if (context && context.esprima && context.esprima.parse) {
        return context.esprima;
      }
    }());

    estraverse = (function() {
      if (cleanamd.amd && amdDependencies && amdDependencies.estraverse && amdDependencies.estraverse.traverse) {
        return amdDependencies.estraverse;
      } else if (cleanamd.commonjs) {
        return require('estraverse');
      } else if (context && context.estraverse && context.estraverse.traverse) {
        return context.estraverse;
      }
    }());

    escodegen = (function() {
      if (cleanamd.amd && amdDependencies && amdDependencies.escodegen && amdDependencies.escodegen.generate) {
        return amdDependencies.escodegen;
      } else if (cleanamd.commonjs) {
        return require('escodegen');
      } else if (context && context.escodegen && context.escodegen.generate) {
        return context.escodegen;
      }
    }());

    _ = (function() {
      if (cleanamd.amd && amdDependencies && (amdDependencies.underscore || amdDependencies.lodash || amdDependencies._)) {
        return amdDependencies.underscore || amdDependencies.lodash || amdDependencies._;
      } else if (cleanamd.commonjs) {
        return require('lodash');
      } else if (context && context._) {
        return context._;
      }
    }());

    // AMDclean constructor function
    var AMDclean = function(options, overloadedOptions) {
        if (!esprima) {
          throw new Error(errorMsgs.esprima);
        } else if (!estraverse) {
          throw new Error(errorMsgs.estraverse);
        } else if (!escodegen) {
          throw new Error(errorMsgs.escodegen);
        } else if (!_) {
          throw new Error(errorMsgs.lodash);
        }

        var defaultOptions = _.cloneDeep(this.defaultOptions || {}),
          userOptions = options || overloadedOptions || {};


        if (!_.isPlainObject(options) && _.isString(options)) {
          userOptions = _.merge({
            'code': options
          }, _.isObject(overloadedOptions) ? overloadedOptions : {});
        }

        // storedModules
        // -------------
        // An object that will store all of the user module names
        this.storedModules = {};

        // variablesStore
        // --------------
        // An object that will store all of the local variables that are declared
        this.variablesStore = {};

        // originalAst
        // -----------
        // The original AST (Abstract Syntax Tree) before it is transformed
        this.originalAst = {};

        // callbackParameterMap
        // --------------------
        // An object that will store all of the user module callback parameters (that are used and also do not match the exact name of the dependencies they are representing) and the dependencies that they map to
        this.callbackParameterMap = {};

        // conditionalModulesToIgnore
        // --------------------------
        // An object that will store any modules that should be ignored (not cleaned)
        this.conditionalModulesToIgnore = {};

        // conditionalModulesToNotOptimize
        // -------------------------------
        // An object that will store any modules that should not be optimized (but still cleaned)
        this.conditionalModulesToNotOptimize = {};

        // matchingCommentLineNumbers
        // --------------------------
        // An object that stores any comments that match the commentCleanName option
        this.matchingCommentLineNumbers = {};

        // comments
        // --------
        // All of the stored program comments
        this.comments = [];

        // options
        // -------
        // Merged user options and default options
        this.options = _.merge(defaultOptions, userOptions);
      },
      // The object that is publicly accessible
      publicAPI = {
        // Current project version number
        'VERSION': '2.3.0',
        'clean': function(options, overloadedOptions) {
          // Creates a new AMDclean instance
          var amdclean = new AMDclean(options, overloadedOptions),
            cleanedCode = amdclean.clean();

          // returns the cleaned code
          return cleanedCode;
        }
      };

    // AMDclean prototype object
    AMDclean.prototype = {
      // clean
      // -----
      // Creates an AST using Esprima, traverse and updates the AST using Estraverse, and generates standard JavaScript using Escodegen.
      'clean': clean,

      // defaultOptions
      // --------------
      // Environment - either node or web
      'defaultOptions': defaultOptions
    };

    return publicAPI;
  }));
});