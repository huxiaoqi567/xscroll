#AMDclean

A build tool that converts AMD code to standard JavaScript.

[![Build Status](https://travis-ci.org/gfranko/amdclean.png?branch=master)](https://travis-ci.org/gfranko/amdclean)
[![NPM version](https://badge.fury.io/js/amdclean.png)](http://badge.fury.io/js/amdclean)

`npm install amdclean --save-dev`

[Getting Started Video](http://www.youtube.com/watch?v=wbEloOLU3wM)


## Use Case

**Single file** client-side JavaScript libraries or web apps that want to use AMD and/or CommonJS modules to structure and build their code, but don't want any additional footprint.


## Used By

* [AMDclean](https://github.com/gfranko/amdclean) - A build tool that converts AMD code to standard JavaScript (this is not a typo)

* [Backbone-Require-Boilerplate](https://github.com/BoilerplateMVC/Backbone-Require-Boilerplate) - A Rad Backbone.js and Require.js Boilerplate Project

* [Ractive.js](http://www.ractivejs.org/) - Next-generation DOM manipulation

* [Mod.js](http://madscript.com/modjs/) - JavaScript Workflow Tooling 

* [Formatter.js](http://firstopinion.github.io/formatter.js/) - Format user input to match a specified pattern

* [AddThis Smart Layers](https://www.addthis.com/get/smart-layers) - Third-party social widgets suite


## Why

Many developers like to use the AMD and/or CommonJS (CJS) module APIs to write modular JavaScript, but do not want to include a full AMD or CJS loader (e.g. [require.js](https://github.com/jrburke/requirejs)), or shim (e.g. [almond.js](https://github.com/jrburke/almond), [browserify](http://browserify.org/)) because of file size/source code readability concerns.

By incorporating AMDclean.js into the build process, you no longer need to include Require.js or Almond.js in production, or use Browserify.

Since AMDclean rewrites your source code into standard JavaScript, it is a great
fit for JavaScript library/web app authors who want a tiny download in one file after using the
[RequireJS Optimizer](http://requirejs.org/docs/optimization.html).  AMDclean uses multiple different optimization algorithms to create the smallest file possible, while still making your code readable.


## Restrictions

**Note:** Same restrictions as almond.js.

It is best used for libraries or apps that use AMD or CommonJS (using the [cjsTranslate](https://github.com/jrburke/r.js/blob/master/build/example.build.js#L574) Require.js optimizer option) and optimize all modules into one file or multiple bundles.  If you do not include Require.js or a similar loader, you cannot dynamically load code.


##What is Supported

* Can be used for both full-fledged web apps and/or individual JavaScript libraries.

  - If you are using AMDclean to build a JavaScript library, make sure the `transformAMDChecks` option is set to `false`.  Like this:    
```javascript
    {
      // Will not transform conditional AMD checks - Libraries use this to provide optional AMD support
      'transformAMDChecks': false
    }
```

* `define()` and `require()` calls.

* [Shimmed modules](http://requirejs.org/docs/api.html#config-shim)

* [Simplified CJS wrapper](https://github.com/jrburke/requirejs/wiki/Differences-between-the-simplified-CommonJS-wrapper-and-standard-AMD-define#wiki-cjs)

- full-fledged CommonJS files using the [cjsTranslate](https://github.com/jrburke/r.js/blob/master/build/example.build.js#L584) Require.js option.

* Exporting global modules to the global `window` object

## Download

Node - `npm install amdclean --save-dev`

Web - [Latest release](https://github.com/gfranko/amdclean/blob/master/build/amdclean.js)


## Usage

There are a few different ways that AMDclean can be used including:

* With the RequireJS Optimizer (plain node, Grunt, Gulp, etc)

* As a standalone node module

* As a client-side library

**Note:** AMDclean does not have any module ordering logic, so if you do not use the RequireJS optimizer then you need to find another solution for resolving module dependencies before your files can be "cleaned".


###AMDclean with the RequireJS Optimizer

* [Download the RequireJS optimizer](http://requirejs.org/docs/download.html#rjs).

* `npm install amdclean --save-dev`

* Add a `onModuleBundleComplete` config property to your RequireJS build configuration file instead.  Like this:

```javascript
onModuleBundleComplete: function (data) {
  var fs = module.require('fs'),
    amdclean = module.require('amdclean'),
    outputFile = data.path,
    cleanedCode = amdclean.clean({
      'filePath': outputFile
    });

  fs.writeFileSync(outputFile, cleanedCode);
}
```

* Run the optimizer using [Node](http://nodejs.org) (also [works in Java](https://github.com/jrburke/r.js/blob/master/README.md)).  More details can be found in the the [r.js](https://github.com/jrburke/r.js/) repo.

* If you are using the RequireJS optimizer [Grunt task](https://github.com/gruntjs/grunt-contrib-requirejs), then it is very easy to integrate AMDclean using the `onModuleBundleComplete` config option. Here is an example Grunt file that includes the RequireJS optimizer plugin with AMDclean support:

```javascript
module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    requirejs: {
      js: {
        options: {
          'findNestedDependencies': true,
          'baseUrl': 'src/js/app/modules',
          'optimize': 'none',
          'mainConfigFile': 'src/js/app/config/config.js',
          'include': ['first'],
          'out': 'src/js/app/exampleLib.js',
          'onModuleBundleComplete': function (data) {
            var fs = require('fs'),
              amdclean = require('amdclean'),
              outputFile = data.path;

            fs.writeFileSync(outputFile, amdclean.clean({
              'filePath': outputFile
            }));
          }
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.registerTask('build', ['requirejs:js']);
  grunt.registerTask('default', ['build']);
};
```

* If you are using the RequireJS node module with [Gulp](http://gulpjs.com/), then it is very easy to integrate AMDclean using the `onModuleBundleComplete` config option. Here is an example Gulp task that includes the RequireJS optimizer node module with AMDclean support:

```javascript
gulp.task('build', function() {
  var requirejs = require('requirejs');

  requirejs.optimize({
    'findNestedDependencies': true,
    'baseUrl': './src/',
    'optimize': 'none',
    'include': ['first'],
    'out': './build/example.js',
    'onModuleBundleComplete': function(data) {
      var fs = require('fs'),
        amdclean = require('amdclean'),
        outputFile = data.path;

      fs.writeFileSync(outputFile, amdclean.clean({
        'filePath': outputFile
      }));
    }
  });
});
```

###AMDclean as a Node Module

* `npm install amdclean --save-dev`

* Require the module

```javascript
var amdclean = require('amdclean');
```

* Call the clean method

```javascript
var code = 'define("exampleModule", function() {});'
var cleanedCode = amdclean.clean(code);
```


###AMDclean as a Client-side Library

* Include all dependencies

```html
<script src="http://esprima.org/esprima.js"></script>
<script src="http://constellation.github.io/escodegen/escodegen.browser.js"></script>
<script src="https://rawgithub.com/Constellation/estraverse/master/estraverse.js"></script>
<script src="http://cdnjs.cloudflare.com/ajax/libs/lodash.js/2.2.1/lodash.js"></script>
<script src="https://rawgithub.com/gfranko/amdclean/master/src/amdclean.js"></script>
```

* Use the global `amdclean` object and `clean()` method

```javascript
var cleanedCode = amdclean.clean('define("example", [], function() { var a = true; });');
```

## Requirements

* [Esprima](https://github.com/ariya/esprima) 1.0+

* [Lodash](https://github.com/lodash/lodash) 2.2.1+

* [Estraverse](https://github.com/Constellation/estraverse) 1.3.1+

* [Escodegen](https://github.com/Constellation/escodegen) 0.0.27+

## Optional Dependencies

* [r.js](https://github.com/jrburke/r.js/) 2.1.0+


## How it works

AMDclean uses Esprima to generate an AST (Abstract Syntax Tree) from the provided source code, estraverse to traverse and update the AST, and escodegen to generate the new standard JavaScript code.

**Note:** If you are interested in how this works, watch this [presentation](https://www.youtube.com/watch?v=XA8_hZfVecI) about building Static Code Analysis Tools.

Here are a few different techniques that AMDclean uses to convert AMD to standard JavaScript code:


###Define Calls

_AMD_

```javascript
define('example', [], function() {

});
```

_Standard_

```javascript
var example;
example = undefined;
```

---

_AMD_

```javascript
define('example', [], function() {
  var test = true;
});
```

_Standard_

```javascript
var example;
example = function () {
    var test = true;
}();
```

---

_AMD_

```javascript
define('example', [], function() {
  return function(name) {
    return 'Hello ' + name;
  };
});
```

_Standard_

```javascript
var example;
example = function (name) {
  return 'Hello ' + name;
};
```

---

_AMD_

```javascript
define('example', [], function() {
  return 'I love AMDclean';
});
```

_Standard_

```javascript
var example;
example = 'I love AMDclean';
```

---

_AMD_

```javascript
define('example', ['example1', 'example2'], function(one, two) {
  var test = true;
});
```


_Standard_

```javascript
var example;
example = function (one, two) {
  var test = true; 
}(example1, example2);
```

---

_AMD_

```javascript
define("backbone", ["underscore","jquery"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Backbone;
    };
}(this)));
```


_Standard_

```javascript
var backbone;
backbone = window.Backbone;
```

---

_AMD_

```javascript
define('third',{
  exampleProp: 'This is an example'
});
```

_Standard_

```javascript
var third;
third = {
  exampleProp: 'This is an example'
};
```

---

###Require Calls

**Note:** `require(['someModule'])` calls, with no callback function, are removed from the built source code

_AMD_

```javascript
require([], function() {
  var example = true;
});
```

_Standard_

```javascript
(function () {
    var example = true;
}());
```

---

_AMD_

```javascript
require(['anotherModule'], function(someModule) {
  var example = true;
});
```

_Standard_

```javascript
(function (someModule) {
    var example = true;
}(anotherModule));
```


##Optimization Algorithms

AMDclean uses a few different strategies to decrease file size:

**Remove Unused Dependencies/Parameters**

_AMD_

```javascript
define('example', ['example1', 'example2'], function() {
  var test = true;
});
```

_Standard_

```javascript
// Since no callback parameters were provided in the AMD code,
// the 'example1' and 'example2' dependencies/parameters were not added
var example;
example = function() {
  var test = true;
}();
```

**Remove Exact Matching Dependencies/Parameters**

_AMD_

```javascript
define('example', ['example1', 'example2'], function(example1, anotherExample) {
  var test = true;
});
```

_Standard_

```javascript
// Since the `example1` callback function parameter exactly matched
// the name of the `example1 dependency, it's `example1` dependency/parameter was removed
var example;
example = function(anotherExample) {
  var test = true;
}(example2);
```

**Hoist Common Non-Matching Dependencies**

 - **Note** - For this behavior, you must set the `aggressiveOptimizations` option to `true`

_AMD_

```javascript
define('example', ['example1'], function(firstExample) {
  var test = true;
});
define('anotherExample', ['example1'], function(firstExample) {
  var test = true;
});
```

_Standard_

```javascript
// Since the `firstExample` callback function parameter was used more
// than once between modules, it was hoisted up and reused
var example, firstExample;
firstExample = example1;
example = function() {
  var test = true;
};
anotherExample = function() {
  var test = true;
};
```


##Options

The amdclean `clean()` method accepts a string or an object.  Below is an example object with all of the available configuration options:

```javascript
amdclean.clean({
  // The source code you would like to be 'cleaned'
  'code': '',
  // Determines if certain aggressive file size optimization techniques
  // will be used to transform the soure code
  'aggressiveOptimizations': false,
  // The relative file path of the file to be cleaned.  Use this option if you
  // are not using the code option.
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
  // If there is a comment (that contains the following text) on the same line
  // or one line above a specific module, the module will not be removed
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
  // Allows you to pass an expression that will override shimmed modules return
  // values e.g. { 'backbone': 'window.Backbone' }
  'shimOverrides': {},
  // Determines how to prefix a module name with when a non-JavaScript
  // compatible character is found 
  // 'standard' or 'camelCase'
  // 'standard' example: 'utils/example' -> 'utils_example'
  // 'camelCase' example: 'utils/example' -> 'utilsExample'
  'prefixMode': 'standard',
  // A hook that allows you add your own custom logic to how each moduleName is
  // prefixed/normalized
  'prefixTransform': function(postNormalizedModuleName, preNormalizedModuleName) { return postNormalizedModuleName; },
  // Wrap any build bundle in a start and end text specified by wrap
  // This should only be used when using the onModuleBundleComplete RequireJS
  // Optimizer build hook
  // If it is used with the onBuildWrite RequireJS Optimizer build hook, each
  // module will get wrapped
  'wrap': {
    // This string is prepended to the file
    'start': ';(function() {\n',
    // This string is appended to the file
    'end': '\n}());'
  },
  // Configuration info for modules
  // Note: Further info can be found here - http://requirejs.org/docs/api.html#config-moduleconfig
  'config': {}
})
```


## Unit Tests

All unit tests are written using the [jasmine-node](https://github.com/mhevery/jasmine-node) library and can be found in the `test/specs/` folder.  You can run the unit tests by typing: `npm test` or `gulp test`.

## Contributing

Please send all PR's to the `dev` branch.

If your PR is a code change:

1.  Update the appropriate module inside of the `src/modules` directory.
2.  Add a Jasmine unit test to `convert.js` inside of the `test/specs` folder
3.  Install all node.js dev dependencies: `npm install`
4.  Install gulp.js globally: `sudo npm install gulp -g`
5.  Lint, Minify, and Run all unit tests with Gulp: `gulp`
6.  Verify that the minified output file has been updated in `build/amdclean.min.js`
7.  Send the PR!

**Note:** There is a gulp `watch` task that will automatically lint, minify, unit test, and build AMDclean whenever a module inside of the `src/modules` directory is changed.  I recommend using it.


## FAQ

__After I build with AMDclean, I am getting JavaScript errors.  What gives?__

- There could be a couple of reasons:

  * If you are **NOT** using the Require.js `shim` configuration, then make sure to set the Require.js `skipModuleInsertion` option to `true`. By default, Require.js creates a `define()` wrapper for files that are not wrapped in a `define()`. This can cause issues with AMDclean.

  * Make sure you are not pointing to minified files when building with AMDclean. This will definitely cause issues.

  * There may be a bug with AMDclean (I doubt it, but it is possible). Please report any issues and they will be fixed as soon as possible.


__Why should I use AMDclean instead of Browserify?__

 - This is a loaded question. Here is a short list of pros/cons when using each library:

 **Browserify Pros**

  * Uses the node.js style `node_modules` file lookup algorithm, which allows you to `npm install` an npm module and automatically use it

 **Browserify Cons**

  * Requires a development build step
  * Does not support AMD modules out of the box
  * Does not support dynamic module loading out of the box
  * Adds boilerplate code to files (increasing file size and decreasing code readability)

  **AMDclean Pros**

  * Does not require a build step in development when used with Require.js
  * Supports both AMD and CommonJS modules when used with the Require.js optimizer
  * Does not add boilerplate code to files and uses advanced file optimizations to decrease file size and increase code readability

 **AMDclean Cons**

  * Does not use the node.js style `node_modules` file lookup algorithm, which means that you can not automatically use `npm` to install modules without having to set up configuration first


__Why should I use AMDclean instead of Almond.js?__

 - Although Almond is very small (~1k gzipped and minified), most JavaScript library authors do not want to have to include it in their library's source code.  AMDclean allows you to use AMD without increasing your library's file size. AMDclean also implements multiple different optimization algorithms to make your source code even smaller.

__Do I have to use the onModuleBundleComplete Require.js hook?__

 - Yes, you should be using it.  In `< 2.0` versions of AMDclean, the `onBuildWrite` Require.js hook was used instead, but the `onBuildWrite` hook has been deprecated.  Use the `onModuleBundleComplete` Require.js hook like this:

  ```javascript
onModuleBundleComplete: function (data) {
  var fs = require('fs'),
    amdclean = require('amdclean'),
    outputFile = data.path;
  fs.writeFileSync(outputFile, amdclean.clean({
    'filePath': outputFile,
    'globalObject': true
  }));
}
 ```

 __Does AMDclean use AMDclean to build itself?__

  - Yes, it does!  With the `2.1.0` release, AMDclean was refactored into AMD modules and builds itself to create a library that can be used in node.js or the browser (AMD environment and web environment).

 
__Is AMDclean only for libraries, or can I use it for my web app?__

 - You can use it for both!  The [0.6.0](https://github.com/gfranko/amdclean/releases/tag/0.6.0) release provided support for web apps.

 - By default, AMDclean is set up for use within a web app.  If you are developing a JavaScript library with AMDclean, here are the things you should be aware of:

  * Make sure to set the `transformAMDChecks` option to `false` if you don't want your conditional UMD (Universal Module Definition) pattern affected.

  * If your JavaScript library depends on one or external libraries (libraries that will not be included in your library's source code), then you need to do a little hackery and make sure to hoist the local variables, that will hold the external library values, using the AMDclean `wrap` option.  For more details, take a look at how AMDclean itself handles this situation, or create a Github issue


__My comments seem to be getting removed when I use AMDclean.  What am I doing wrong?__

 - Before the `2.1.0` release, this was the default behavior.  If you update to `2.1.0` or later, you should see your comments still there after the cleaning process.  Also, if you would like your comments to be removed, then you can set the `comment` **escodegen** option to `false`.


__What if I don't want all define() and require() method calls to be removed?__

 - If you don't want one or more define() and require() methods to be removed by AMDclean, you have a few options.  If the module has a named module id associated with it, then you can add the associated module id to the `ignoreModules` option array.  Like this:

 ```javascript
var amdclean = require('amdclean');
amdclean.clean({
    'code': 'define("randomExample", function() { console.log("I am a random example"); });',
    'ignoreModules': ['randomExample']
});
 ```

 If there is not an associated module id, then you must put a comment with only the words _amdclean_ on the same line or one line above the method in question.  For example, `amdclean` would not remove the `define()` method below:

 ```javascript
// amdclean
define('example', [], function() {});
 ```

If you want to use different text than `amdclean`, you can customize the comment name by using the `commentCleanName` option.


__Why are define() method placeholder functions inserted into my source?__

- This is the default behavior of r.js when a module(s) is not wrapped in a define() method.  Luckily,  this behavior can be overridden by setting the `skipModuleInsertion` option to `true` in your build configuration.


__How would I expose one or more modules as a global window property?__

- You can use the `globalModules` option to list all of the modules that you would like to expose as a `window` property


__I replaced Almond.js with AMDclean and my file is bigger.  Why Is This?__

- There could be a couple of reasons:

  * Unneccessary files are still being included with your build. Make sure that both Almond.js and the RequireJS text! plugin are not still being included, since they are not needed.  You can use the `removeModules` option to make sure certain modules are not included (e.g. text plugin).

  * You are using an old version of AMDclean (`0.6.0` or earlier).  The latest versions of AMDclean do an amazing job of optimizing modules.


__I am building a JavaScript library and want to provide conditional AMD support, but AMDclean seems to be wiping away my if statement.  How do I fix this?__

- You have two options:

  1.  Set the `transformAMDChecks` option to `false`

  2.  Make sure that you have a comment (that matches your AMDclean `commentCleanName` option) one line above your conditional AMD if statement

__I am building a JavaScript library and want to create a conditional anonymous AMD module, but Require.js and AMDclean seems to always setting a module ID.  How do I fix this?__

- It's easy, just make sure to set the `createAnonymousAMDModule` option to `true`,


__I don't like the way AMDclean normalizes the names of my modules with underscores.  Can I change this?__

- You sure can.  You can either use the `prefixMode` and change it to camelCase, or you can override all of the logic with your own logic by using the `prefixTransform` option hook.

__Require.js supports passing module information, to one or more modules, with the `config` option.  Does AMDclean support this?__

- Yes!  Make sure to set the AMDclean `config` option with whatever module information you would like available to you in your modules.  Check the Require.js website for more details: http://requirejs.org/docs/api.html#config-moduleconfig


__I can't seem to get AMDclean 2.0 to work.  What gives?__

- Please make sure you are using the `onModuleBundleComplete` Require.js hook and **NOT** the `onBuildWrite` Require.js hook.  The `onBuildWrite` hook has been deprecated for AMDclean versions `>= 2.0`.


## License

Copyright (c) 2014 Greg Franko Licensed under the MIT license.
