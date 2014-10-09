// errorMsgs.js
// ============
// AMDclean error messages

define({
  // The user has not supplied the cliean method with any code
  'emptyCode': 'There is no code to generate the AST with',

  // An AST has not been correctly returned by Esprima
  'emptyAst': function(methodName) {
    return 'An AST is not being passed to the ' + methodName + '() method';
  },

  // A parameter is not an object literal (which is expected)
  'invalidObject': function(methodName) {
    return 'An object is not being passed as the first parameter to the ' + methodName + '() method';
  },

  // Third-party dependencies have not been included on the page
  'lodash': 'Make sure you have included lodash (https://github.com/lodash/lodash).',

  'esprima': 'Make sure you have included esprima (https://github.com/ariya/esprima).',

  'estraverse': 'Make sure you have included estraverse (https://github.com/Constellation/estraverse).',

  'escodegen': 'Make sure you have included escodegen (https://github.com/Constellation/escodegen).'
});