require('jasmine-only');
describe('amdclean specs', function() {
  var amdclean = require('../../src/amdclean'),
    requirejs = require('requirejs'),
    _ = require('lodash'),
    fs = require('fs'),
    defaultOptions = {
      // We don't need the IIFE wrapper by default, since it makes the tests more verbose
      'wrap': {
        'start': '',
        'end': ''
      },
      // Makes sure the code output is on one line (easier to test)
      'escodegen': {
        'format': {
          'compact': true
        }
      }
    }

  describe('define() method conversions', function() {

    describe('functions', function() {

      it('should convert function return values to immediately invoked function declarations', function() {
        var AMDcode = "define('example', [], function() {});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions);
        standardJavaScript = "var example;example=undefined;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should preserve single line comments when converting function return values to immediately invoked function declarations', function() {
        var AMDcode = "define('example', [], function() {  // Answer\n var test = true; return test; });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example;example=function (){// Answer\nvar test=true;return test;}();";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should preserve multi-line comments when converting function return values to immediately invoked function declarations', function() {
        var AMDcode = "define('example', [], function() {  /* Answer */\nvar test = true; return test; });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example;example=function (){/* Answer */\nvar test=true;return test;}();";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should pass a file path instead of the code directly', function() {
        var options = _.merge(_.cloneDeep(defaultOptions), {
            'filePath': __dirname + '/../filePathTest.js'
          }),
          cleanedCode = amdclean.clean(options),
          standardJavaScript = "var example;example=undefined;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly set callback parameters to the callback function', function() {
        var AMDcode = "define('example', ['example1', 'example2'], function(one, two) {var test = true;});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example;example=function (one,two){var test=true;}(example1,example2);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not hoist and remove callback and IIFE parameters that are only used once', function() {
        var AMDcode = "define('example1', function() { var count = 0;return 'firstModule'; });define('example2', function() { var count = 0;return 'secondModule'; });define('example', ['example1', 'example2'], function(yo, yoyo) {var test = true;});define('blah', ['example2'], function(yoooo, comon) { return false; });",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'aggressiveOptimizations': true
          });
        cleanedCode = amdclean.clean(AMDcode, options),
        standardJavaScript = "var example1,example2,example,blah;example1=function (){var count=0;return'firstModule';}();example2=function (){var count=0;return'secondModule';}();example=function (yo,yoyo){var test=true;}(example1,example2);blah=function (yoooo,comon){return false;}(example2);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should hoist and remove callback and IIFE parameters that are used more than once', function() {
        var AMDcode = "define('example1', function() { var count = 0;return 'firstModule'; });define('example2', function() { var count = 0;return 'secondModule'; });define('example', ['example1', 'example2'], function(yo, yoyo) {var test = true;});define('blah', ['example1', 'example2'], function(yo, yoooo, comon) { var test; return false; });",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'aggressiveOptimizations': true
          });
        cleanedCode = amdclean.clean(AMDcode, options),
        standardJavaScript = "var example1,example2,example,blah,yo;example1=yo=function (){var count=0;return'firstModule';}();example2=function (){var count=0;return'secondModule';}();example=function (yoyo){var test=true;}(example2);blah=function (yoooo,comon){var test;return false;}(example2);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly normalize relative file paths', function() {
        var AMDcode = "define('./modules/example', ['example1', 'example2'], function(one, two) {var test = true;});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var modules_example;modules_example=function (one,two){var test=true;}(example1,example2);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly normalize relative file paths dependencies', function() {
        var AMDcode = "define('./modules/example', ['./example1', './example2', '../example3'], function(one, two, three) {var test = true;});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var modules_example;modules_example=function (one,two,three){var test=true;}(modules_example1,modules_example2,example3);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly normalize multi-level relative file paths dependencies', function() {
        var AMDcode = "define('./foo/prototype/subModule/myModule', ['example1','example2', '/anotherModule/example3', '../../example4','../anotherModule/example5'], function(one, two, three, four, five) { var test = true;});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var foo_prototype_subModule_myModule;foo_prototype_subModule_myModule=function (one,two,three,four,five){var test=true;}(example1,example2,anotherModule_example3,foo_example4,foo_prototype_anotherModule_example5);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly normalize multi-level relative file paths', function() {
        var AMDcode = "define('./foo/prototype/commonMethodName.js', ['example1', 'example2'], function(one, two) { var test = true;});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var foo_prototype_commonMethodNamejs;foo_prototype_commonMethodNamejs=function (one,two){var test=true;}(example1,example2);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly prefix reserved keywords with an underscore', function() {
        var AMDcode = "define('foo', ['./function'], function(fn){ fn.bar(); });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var foo;foo=function (fn){fn.bar();}(_function);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should allow underscores and dollar signs as module names', function() {
        var AMDcode = "define('fo.o', ['./function'], function(fn){ fn.bar(); });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var foo;foo=function (fn){fn.bar();}(_function);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not convert defines with an /*amdclean*/ comment before it', function() {
        var AMDcode = "/*amdclean*/define('./modules/example', ['example1', 'example2'], function(one, two) {});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "/*amdclean*/\ndefine('./modules/example',['example1','example2'],function(one,two){});";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not convert defines with a custom commentCleanName comment before it', function() {
        var AMDcode = "/*donotremove*/define('./modules/example', ['example1', 'example2'], function(one, two) {});",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'commentCleanName': 'donotremove'
          });
        cleanedCode = amdclean.clean(AMDcode, options),
        standardJavaScript = "/*donotremove*/\ndefine('./modules/example',['example1','example2'],function(one,two){});";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not convert defines that are added to the ignoreModules options array', function() {
        var AMDcode = "define('exampleModule', ['example1', 'example2'], function(one, two) {});",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'ignoreModules': ['exampleModule']
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "define('exampleModule',['example1','example2'],function(one,two){});";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should remove defines that are added to the removeModules options array', function() {
        var AMDcode = "define('exampleModule', ['example1', 'example2'], function(one, two) {});define('exampleModule2', function() {})",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'removeModules': ['exampleModule']
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var exampleModule,exampleModule2;exampleModule2=undefined;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support global modules', function() {
        var AMDcode = "define('foo', ['require', 'exports', './bar'], function(require, exports){exports.bar = require('./bar');});",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'globalModules': ['foo']
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var foo;foo=function (exports){exports.bar=bar;return exports;}({});window.foo=foo;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support converting shimmed modules that export a global object', function() {
        var AMDcode = "define('backbone', ['underscore', 'jquery'], (function (global) { return function () { var ret, fn; return ret || global.Backbone; }; }(this)));",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var backbone;backbone=window.Backbone;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support setting the module return value via the shimOverrides option', function() {
        var AMDcode = "define('backbone', ['underscore', 'jquery'], (function (global) { return {}; }(this)));",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'shimOverrides': {
              'backbone': 'window.Backbone'
            }
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var backbone;backbone=window.Backbone;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support specifying shimOverrides with module identifier', function() {
        var AMDcode = "define('bower_components/backbone/backbone', ['underscore', 'jquery'], (function (global) { return {}; }(this)));",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'shimOverrides': {
              'bower_components/backbone/backbone': 'window.Backbone'
            }
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var bower_components_backbone_backbone;bower_components_backbone_backbone=window.Backbone;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly rewrite shimmed functions', function() {
        var AMDcode = "define('browserglobal', (function (global) { return function () { var ret, fn; return ret || global.BrowserGlobal; }; }(this)));",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'shimOverrides': {
              'browserglobal': 'BrowserGlobal'
            }
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var browserglobal;browserglobal=BrowserGlobal;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support converting define() methods with identifiers', function() {
        var AMDcode = "define('esprima', ['exports'], factory);",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var esprima;esprima=function (){return typeof factory==='function'?factory():factory;}();";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not remove comments from the source code', function() {
        var AMDcode = "//Test comment\n define('example', [], function() {});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "//Test comment\nvar example;example=undefined;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not automatically convert conditional AMD checks that are using the appropriate commentCleanName', function() {
        var AMDcode = "//amdclean\n if(typeof define === 'function') {}",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "//amdclean\nif(typeof define==='function'){}";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not automatically convert conditional AMD checks, and the associated named AMD module, if the transformAMDChecks option is set to false', function() {
        var AMDcode = "if(typeof define === 'function') { define('example', [], function() {}); }",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'transformAMDChecks': false
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "if(typeof define==='function'){define('example',[],function(){});}";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not automatically convert conditional AMD checks, and the associated anonymous AMD module, if the transformAMDChecks option is set to false', function() {
        var AMDcode = "if(typeof define === 'function') { define([], function() {}); }",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'transformAMDChecks': false
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "if(typeof define==='function'){define([],function(){});}";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should create an anonymous AMD module, if the transformAMDChecks option is set to false and the createAnonymousAMDModule option is set to true', function() {
        var AMDcode = "if(typeof define === 'function') { define('test', [], function() {}); }",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'transformAMDChecks': false,
            'createAnonymousAMDModule': true
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "if(typeof define==='function'){define([],function(){});}";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      describe('optimized defines', function() {

        it('should optimize basic define() methods that return a function expression', function() {
          var AMDcode = "define('example', function () { return function ( thing ) {return !isNaN( parseFloat( thing ) ) && isFinite( thing );};});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example=function(thing){return!isNaN(parseFloat(thing))&&isFinite(thing);};";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should optimize basic define() methods that have an empty factory function', function() {
          var AMDcode = "define('example', function () {});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example=undefined;";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should support the start and end wrap options', function() {
          var AMDcode = "define('example', function () {});",
            options = _.merge(_.cloneDeep(defaultOptions), {
              'wrap': {
                'start': ';(function() {',
                'end': '}());'
              }
            }),
            cleanedCode = amdclean.clean(AMDcode, options),
            standardJavaScript = ";(function() {var example;example=undefined;}());";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should optimize more complex define() methods that return a function expression', function() {
          var AMDcode = "define('example', function () { return function ( thing ) { var anotherThing = true; return !isNaN( parseFloat( thing ) ) && isFinite( thing );};});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example=function(thing){var anotherThing=true;return!isNaN(parseFloat(thing))&&isFinite(thing);};";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should optimize more complex define() methods that have a "use strict" statement and return a function expression', function() {
          var AMDcode = "define('example', function () { 'use strict'; return function ( thing ) { return !isNaN( parseFloat( thing ) ) && isFinite( thing );};});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example=function(thing){return!isNaN(parseFloat(thing))&&isFinite(thing);};";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should not optimize more complex define() methods that have a "use strict" statement and return a function expression, but have also set the removeUseStricts option to false', function() {
          var AMDcode = "define('example', function () { 'use strict'; return function ( thing ) { return !isNaN( parseFloat( thing ) ) && isFinite( thing );};});",
            options = _.merge(_.cloneDeep(defaultOptions), {
              'removeUseStricts': false
            });
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var example;example=function (){'use strict';return function(thing){return!isNaN(parseFloat(thing))&&isFinite(thing);};}();";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should not optimize define() methods that have logic outside of the return statement', function() {
          var AMDcode = "define('example', [], function () { var test = true; return function ( thing ) { var anotherThing = true; return !isNaN( parseFloat( thing ) ) && isFinite( thing );};});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example=function (){var test=true;return function(thing){var anotherThing=true;return!isNaN(parseFloat(thing))&&isFinite(thing);};}();";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should optimize basic define() methods that return a literal value', function() {
          var AMDcode = "define('example', [], function() { return 'Convert AMD code to standard JavaScript';});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example='Convert AMD code to standard JavaScript';";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should not optimize basic define() methods that return a literal value and contain more than one code block', function() {
          var AMDcode = "define('example', [], function() { var example = true; return 'Convert AMD code to standard JavaScript';});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var _example_;_example_=function (){var example=true;return'Convert AMD code to standard JavaScript';}();";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should optimize basic define() methods that return a literal value that have one or more dependencies', function() {
          var AMDcode = "define('example', ['someDependency'], function() { return 'Convert AMD code to standard JavaScript';});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example='Convert AMD code to standard JavaScript';";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should optimize basic define() methods that return a nested object expression', function() {
          var AMDcode = "define('example', [], function() {return { 'example': 'Convert AMD code to standard JavaScript' };});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example={'example':'Convert AMD code to standard JavaScript'};";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should optimize basic define() methods that return a new expression', function() {
          var AMDcode = "define('example', [], function() { return new String('test');});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var example;example=new String('test');";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should not optimize basic define() methods that return an identifier', function() {
          var AMDcode = "define('jquery', [], function() {return jQuery;});",
            cleanedCode = amdclean.clean(AMDcode, defaultOptions),
            standardJavaScript = "var jquery;jquery=function (){return jQuery;}();";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        it('should correctly transform each module name when using the prefixTransform option', function() {
          var AMDcode = "var example = require('util/anotherModule');",
            options = _.merge(_.cloneDeep(defaultOptions), {
              'prefixTransform': function(moduleName, moduleId) {
                return moduleName.substring(moduleName.lastIndexOf('_') + 1, moduleName.length);
              },
              'wrap': {
                start: '',
                end: ''
              }
            }),
            cleanedCode = amdclean.clean(AMDcode, options),
            standardJavaScript = "var example=anotherModule;";

          expect(cleanedCode).toBe(standardJavaScript);
        });

        describe('aggressiveOptimizations option', function() {
          it('should correctly remove callback and IIFE parameters that directly match stored module names', function() {
            var AMDcode = "define('example1', function() {});define('example2', function() {});define('example', ['example1', 'example2'], function(example1, example2) {var test = true;});",
              options = _.merge(_.cloneDeep(defaultOptions), {
                'aggressiveOptimizations': true
              }),
              cleanedCode = amdclean.clean(AMDcode, options),
              standardJavaScript = "var example1,example2,example;example1=undefined;example2=undefined;example=function (){var test=true;}();";

            expect(cleanedCode).toBe(standardJavaScript);
          });

          it('should correctly preserve callback and IIFE parameters that do not directly match stored module names', function() {
            var AMDcode = "define('example1', function() {});define('example2', function() {});define('example', ['example1', 'example2'], function(example3, example2) {var test = true;});",
              options = _.merge(_.cloneDeep(defaultOptions), {
                'aggressiveOptimizations': true
              }),
              cleanedCode = amdclean.clean(AMDcode, options),
              standardJavaScript = "var example1,example2,example;example1=undefined;example2=undefined;example=function (example3){var test=true;}(example1);";

            expect(cleanedCode).toBe(standardJavaScript);
          });

          it('should correctly preserve callback and IIFE parameters that do not directly match stored module names 2', function() {
            var AMDcode = "define('example1', function() {});define('example2', function() {});define('example', ['example1', 'example2'], function() {var test = true;});",
              options = _.merge(_.cloneDeep(defaultOptions), {
                'aggressiveOptimizations': true
              }),
              cleanedCode = amdclean.clean(AMDcode, options),
              standardJavaScript = "var example1,example2,example;example1=undefined;example2=undefined;example=function (){var test=true;}();";

            expect(cleanedCode).toBe(standardJavaScript);
          });

          it('should handle extra parameters', function() {
            var AMDcode = "define('example1', function() {});define('example2', ['example1'], function(example1, test) {var test = true;});",
              options = _.merge(_.cloneDeep(defaultOptions), {
                'aggressiveOptimizations': true
              }),
              cleanedCode = amdclean.clean(AMDcode, options),
              standardJavaScript = "var example1,example2;example1=undefined;example2=function (test){var test=true;}();";

            expect(cleanedCode).toBe(standardJavaScript);
          });
        });

      });

    });

    describe('objects', function() {

      it('should convert object return values to variable declarations', function() {
        var AMDcode = "define('example', { exampleProp: 'This is an example' });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example;example={exampleProp:'This is an example'};";

        expect(cleanedCode).toBe(standardJavaScript);
      });

    });

    describe('CommonJS Support', function() {

      it('should convert CommonJS require() calls', function() {
        var AMDcode = "var example = require('anotherModule');",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example=anotherModule;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should convert CommonJS require() calls with file paths', function() {
        var AMDcode = "var example = require('./anotherModule');",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example=anotherModule;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should convert CommonJS require() calls with advanced file paths', function() {
        var AMDcode = "var example = require('./../anotherModule');",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example=anotherModule;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should convert CommonJS require() calls with single properties', function() {
        var AMDcode = "var example = require('./anotherModule').prop;",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example=anotherModule.prop;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should convert CommonJS require() calls with method calls', function() {
        var AMDcode = "var example = require('./anotherModule').prop();",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var example=anotherModule.prop();";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support the simplified CJS wrapper', function() {
        var AMDcode = "define('foo', ['require', 'exports', './bar'], function(require, exports, bar){exports.bar = require('./bar');});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var foo;foo=function (exports,bar){exports.bar=bar;return exports;}({},bar);";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support the plain simplified CJS wrapper', function() {
        var AMDcode = "define('foo',['require','exports','module','bar'],function(require, exports){exports.bar = require('bar');});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var foo;foo=function (exports){exports.bar=bar;return exports;}({});";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support the plain simplified CJS wrapper and not bomb when a variable is not initialized', function() {
        var AMDcode = "define('has',['require','exports','module'],function( require, exports, module ){exports.all = function( subject, properties ){if(subject === undefined || typeof subject != 'object'){return false;}var i = 0,len = properties.length,prop; //<--- error thrown because this isn't initialized\nfor(; i < len; i++){prop = properties[i];if(!(prop in subject)){return false;}}return true;};});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var has;has=function (exports){exports.all=function(subject,properties){if(subject===undefined||typeof subject!='object'){return false;}var i=0,len=properties.length,prop;//<--- error thrown because this isn't initialized\nfor(;i<len;i++){prop=properties[i];if(!(prop in subject)){return false;}}return true;};return exports;}({});";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support relative dependency paths for require expressions', function() {
        var AMDcode = "define('app/utils/test', [], function(){return function(){console.log('hello world!');}});define('app/utils/test2',[], function(){exports.test = require('./test');});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var app_utils_test,app_utils_test2;app_utils_test=function(){console.log('hello world!');};app_utils_test2=function (){exports.test=app_utils_test;}();";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should convert CommonJS require() calls and use the character prefix', function() {
        var AMDcode = "var example = require('bb_customs');",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'prefixMode': 'camelCase'
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var example=bbCustoms;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should convert CommonJS require() calls and use the character prefix', function() {
        var AMDcode = "var example = require('util/anotherModule');",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'prefixMode': 'camelCase'
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "var example=utilAnotherModule;";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should support the Require.js optimizer cjsTranslate option that converts CommonJS modules to AMD modules', function(done) {
        var cleanedCode,
          standardJavaScript = "var commonjs3,commonjs1,__commonjs2__,_commonjs4_;commonjs3=function (exports){exports.exampleFunc=function(){var test=true;return test;};return exports;}({});__commonjs2__=function (exports){exports={'exampleBool':true,'exampleFunc':commonjs3.exampleFunc};return exports;}({});_commonjs4_=function (exports){exports.test='this is a test';return exports;}({});commonjs1=function (exports){var commonjs2=__commonjs2__;var _commonjs2_='blah';var commonjs4=_commonjs4_;commonjs2.exampleFunc();return exports;}({});";

        requirejs.optimize({
          'baseUrl': './test/',
          'include': ['commonjs1'],
          'out': './test/commonjsoutput.js',
          'cjsTranslate': true,
          'optimize': 'none',
          'onModuleBundleComplete': function(data) {
            var outputFile = data.path,
              options = _.merge(_.cloneDeep(defaultOptions), {
                'filePath': outputFile
              }),
              cleanedCode = amdclean.clean(options);

            fs.writeFileSync(outputFile, cleanedCode);

            expect(cleanedCode).toBe(standardJavaScript);

            done();
          }
        });

      });

    });

  });

  describe('require() method conversions', function() {

    describe('functions', function() {

      it('should convert function return values to locally scoped IIFEs', function() {
        var AMDcode = "require([], function() { var example = true; });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "(function(){var example=true;}());";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should preserve single line comments when converting require methods', function() {
        var AMDcode = "require([], function() { // test comment\n var example = true; });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "(function(){// test comment\nvar example=true;}());";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should pass the correct parameters to the locally scoped IIFEs', function() {
        var AMDcode = "require(['anotherModule'], function(anotherModule) { var example = true; });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "(function(anotherModule){var example=true;}(anotherModule));";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly normalize relative file paths', function() {
        var AMDcode = "require(['./modules/anotherModule'], function(anotherModule) { var example = true; });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "(function(anotherModule){var example=true;}(modules_anotherModule));";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not convert requires with an /*amdclean*/ comment before it', function() {
        var AMDcode = "/*amdclean*/require(['./modules/anotherModule'], function(anotherModule) { var example = true; });",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "/*amdclean*/\nrequire(['./modules/anotherModule'],function(anotherModule){var example=true;});";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should remove require() calls with no callback functions', function() {
        var AMDcode = "require(['anotherModule']);",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should remove require() calls with an empty callback function', function() {
        var AMDcode = "require(['testModule'], function() {});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not remove require() calls with a non-empty callback function', function() {
        var AMDcode = "require(['testModule'], function() {var test=true;});",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "(function(){var test=true;}());";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should remove all require() calls when the removeAllRequires option is set to true', function() {
        var AMDcode = "require(['testModule'], function() {var test=true;});",
          options = _.merge(_.cloneDeep(defaultOptions), {
            'removeAllRequires': true
          }),
          cleanedCode = amdclean.clean(AMDcode, options),
          standardJavaScript = "";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should not bomb on extra parameters being passed to the require() method', function() {
        var AMDcode = "require(['blah'], function(blahParam) { var two = 1 + 1; }, undefined, true);",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "(function(blahParam){var two=1+1;}(blah));";

        expect(cleanedCode).toBe(standardJavaScript);
      });


      it('should correctly convert libraries with simple conditional AMD checks', function() {
        var AMDcode = "(function (root, factory) {" +
          "'use strict';" +
          "if (typeof define === 'function') {" +
          "define('esprima', ['exports'], factory);" +
          "} else if (typeof exports !== 'undefined') {" +
          "factory(exports);" +
          "} else {" +
          "factory((root.esprima = {}));" +
          "}" +
          "}(this, function (exports) {" +
          "var test = true;" +
          "}));",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var esprima;(function(root,factory){'use strict';if(true){esprima=function (exports){return typeof factory==='function'?factory(exports):factory;}({});}else if(typeof exports!=='undefined'){factory(exports);}else{factory(root.esprima={});}}(this,function(exports){exports=exports||{};var test=true;return exports;}));";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly convert libraries that use factory function parameters', function() {
        var AMDcode = "(function (factory) {" +
          "if (typeof exports === 'object') {" +
          "module.exports = factory(require('backbone'), require('underscore'));" +
          "} else if (typeof define === 'function' && define.amd) {" +
          "define('backbonevalidation', ['backbone', 'underscore'], factory);" +
          "}" +
          "}(function (Backbone, _) {" +
          "//= backbone-validation.js\n" +
          "return Backbone.Validation;" +
          "}));",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var backbonevalidation;(function(factory){if(typeof exports==='object'){module.exports=factory(backbone,underscore);}else if(true){backbonevalidation=function (backbone,underscore){return typeof factory==='function'?factory(backbone,underscore):factory;}(backbone,underscore);}}(function(Backbone,_){//= backbone-validation.js\nreturn Backbone.Validation;}));";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly convert libraries that return define methods', function() {
        var AMDcode = "(function(window, factory) {" +
          "if (typeof define === 'function' && define.amd) {" +
          "return define('backbonelayoutmanager', ['backbone', 'underscore', 'jquery'], function() {" +
          "return factory.apply(window, arguments);" +
          "});" +
          "}" +
          "}());",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions);
        standardJavaScript = "(function(window,factory){if(true){backbonelayoutmanager=function (backbone,underscore,jquery){return factory.apply(window,arguments);}(backbone,underscore,jquery);}}());";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly convert libraries that do define.amd checks in their AMD conditional', function() {
        var AMDcode = "  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {" +
          "root._ = _;" +
          "define(function() {" +
          "return _;" +
          "});" +
          "}",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "if(true){root._=_;define(function(){return _;});}";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly convert libraries that include an exports parameter', function() {
        var AMDcode = "(function(window, factory) {" +
          "if (typeof define === 'function' && define.amd) {" +
          "define('backbonerelational', ['exports', 'backbone', 'underscore'], factory)" +
          "}" +
          "}());",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions);
        standardJavaScript = "var backbonerelational;(function(window,factory){if(true){backbonerelational=function (exports,backbone,underscore){return typeof factory==='function'?factory(exports,backbone,underscore):factory;}({},backbone,underscore);}}());";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly convert libraries that include require, exports, and module parameters', function() {
        var AMDcode = "(function(window, factory) {" +
          "var moment;" +
          "if (typeof define === 'function' && define.amd) {" +
          "return define('moment', ['require', 'exports', 'module'], function(require, exports, module) {" +
          "return moment" +
          "});" +
          "}" +
          "}());",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions);
        standardJavaScript = "var _moment_;(function(window,factory){var moment;if(true){_moment_=function (require,exports,module){return moment;}({},{},{});}}());";

        expect(cleanedCode).toBe(standardJavaScript);
      });

      it('should correctly convert libraries with simple reversed conditional AMD checks', function() {
        var AMDcode = "(function (root, factory) {" +
          "'use strict';" +
          "if ('function' === typeof define) {" +
          "define('esprima', ['exports'], factory);" +
          "} else if (typeof exports !== 'undefined') {" +
          "factory(exports);" +
          "} else {" +
          "factory((root.esprima = {}));" +
          "}" +
          "}(this, function (exports) {" +
          "var test = true;" +
          "}));",
          cleanedCode = amdclean.clean(AMDcode, defaultOptions),
          standardJavaScript = "var esprima;(function(root,factory){'use strict';if(true){esprima=function (exports){return typeof factory==='function'?factory(exports):factory;}({});}else if(typeof exports!=='undefined'){factory(exports);}else{factory(root.esprima={});}}(this,function(exports){exports=exports||{};var test=true;return exports;}));";

        expect(cleanedCode).toBe(standardJavaScript);
      });

    });

  });

  describe('Require.js Compatibility', function() {
    it('should support the Require.js config option with the simplified CJS format', function() {
      var AMDcode = 'if (typeof define === "function" && define.amd) {' +
        'define("moment", function (require, exports, module) {' +
        'return moment;' +
        '});' +
        '}',
        options = _.merge(_.cloneDeep(defaultOptions), {
          'config': {
            'moment': {
              'noGlobal': true
            }
          }
        }),
        cleanedCode = amdclean.clean(AMDcode, options),
        standardJavaScript = "var moment,module={'moment':{'config':function(){return{'noGlobal':true};}}};if(true){moment=function (require,exports,module){return moment;}({},{},module.moment);}";

      expect(cleanedCode).toBe(standardJavaScript);
    });

    it('should support the Require.js config option when the special module ID, "module", is passed', function() {
      var AMDcode = 'if (typeof define === "function" && define.amd) {' +
        'define("moment", ["module"], function (module) {' +
        'return moment;' +
        '});' +
        '}',
        options = _.merge(_.cloneDeep(defaultOptions), {
          'config': {
            'moment': {
              'noGlobal': true
            }
          }
        }),
        cleanedCode = amdclean.clean(AMDcode, options),
        standardJavaScript = "var moment,module={'moment':{'config':function(){return{'noGlobal':true};}}};if(true){moment=function (module){return moment;}(module.moment);}";

      expect(cleanedCode).toBe(standardJavaScript);
    });

    it('should support the Require.js config option when the special module ID, "module", is passed with more than one argument', function() {
      var AMDcode = 'if (typeof define === "function" && define.amd) {' +
        'define("moment", ["test", "module"], function (test, module) {' +
        'return moment;' +
        '});' +
        '}',
        options = _.merge(_.cloneDeep(defaultOptions), {
          'config': {
            'moment': {
              'noGlobal': true
            }
          }
        }),
        cleanedCode = amdclean.clean(AMDcode, options),
        standardJavaScript = "var moment,module={'moment':{'config':function(){return{'noGlobal':true};}}};if(true){moment=function (test,module){return moment;}(test,module.moment);}";

      expect(cleanedCode).toBe(standardJavaScript);
    });
  });

});