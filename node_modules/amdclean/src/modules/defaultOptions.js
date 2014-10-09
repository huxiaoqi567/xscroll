// defaultOptions.js
// =================
// AMDclean default options

define({
  // The source code you would like to be 'cleaned'
  'code': '',
  // The relative file path of the file to be cleaned.  Use this option if you are not using the code option.
  // Hint: Use the __dirname trick
  'filePath': '',
  // The modules that you would like to set as window properties
  // An array of strings (module names)
  'globalModules': [],
  // All esprima API options are supported: http://esprima.org/doc/
  'esprima': {
    'comment': true,
    'loc': true,
    'range': true,
    'tokens': true
  },
  // All escodegen API options are supported: https://github.com/Constellation/escodegen/wiki/API
  'escodegen': {
    'comment': true,
    'format': {
      'indent': {
        'style': '  ',
        'adjustMultilineComment': true
      }
    }
  },
  // If there is a comment (that contains the following text) on the same line or one line above a specific module, the module will not be removed
  'commentCleanName': 'amdclean',
  // The ids of all of the modules that you would not like to be 'cleaned'
  'ignoreModules': [],
  // Determines which modules will be removed from the cleaned code
  'removeModules': [],
  // Determines if all of the require() method calls will be removed
  'removeAllRequires': false,
  // Determines if all of the 'use strict' statements will be removed
  'removeUseStricts': true,
  // Determines if conditional AMD checks are transformed
  // e.g. if(typeof define == 'function') {} -> if(true) {}
  'transformAMDChecks': true,
  // Determines if a named or anonymous AMD module will be created inside of your conditional AMD check
  // Note: This is only applicable to JavaScript libraries, do not change this for web apps
  // If set to true: e.g. define('example', [], function() {}) -> define([], function() {})
  'createAnonymousAMDModule': false,
  // Allows you to pass an expression that will override shimmed modules return values
  // e.g. { 'backbone': 'window.Backbone' }
  'shimOverrides': {},
  // Determines how to prefix a module name with when a non-JavaScript compatible character is found 
  // 'standard' or 'camelCase'
  // 'standard' example: 'utils/example' -> 'utils_example'
  // 'camelCase' example: 'utils/example' -> 'utilsExample'
  'prefixMode': 'standard',
  // A function hook that allows you add your own custom logic to how each module name is prefixed/normalized
  'prefixTransform': function(postNormalizedModuleName, preNormalizedModuleName) {
    return postNormalizedModuleName;
  },
  // Wrap any build bundle in a start and end text specified by wrap
  // This should only be used when using the onModuleBundleComplete RequireJS Optimizer build hook
  // If it is used with the onBuildWrite RequireJS Optimizer build hook, each module will get wrapped
  'wrap': {
    'start': ';(function() {\n',
    'end': '\n}());'
  },
  // Determines if certain aggressive file size optimization techniques will be used to transform the soure code
  'aggressiveOptimizations': false,
  // Configuration info for modules
  // Note: Further info can be found here - http://requirejs.org/docs/api.html#config-moduleconfig
  'config': {}
});