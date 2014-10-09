/*
  AMDClean Build File
*/
var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  jshint = require('gulp-jshint'),
  jasmine = require('gulp-jasmine'),
  rename = require('gulp-rename'),
  insert = require('gulp-insert'),
  requirejs = require('requirejs'),
  fs = require('fs'),
  amdclean = require('./build/amdclean'),
  packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8')),
  licenseText = '\n\n/*' + fs.readFileSync('./LICENSE.txt', 'utf8') + '\n*/\n\n',
  currentDate = (function() {
    var today = new Date(),
      dd = today.getDate(),
      mm = today.getMonth() + 1,
      yyyy = today.getFullYear();

    if (dd < 10) {
      dd = '0' + dd
    }

    if (mm < 10) {
      mm = '0' + mm
    }

    today = yyyy + '-' + mm + '-' + dd;
    return today;
  }()),
  currentYear = (function() {
    var today = new Date(),
      yyyy = today.getFullYear();

    return yyyy;
  }()),
  headerText = '/*! amdclean - v' + packageJson.version + ' - ' + currentDate +
  '\n* http://gregfranko.com/amdclean' +
  '\n* Copyright (c) ' + currentYear + ' Greg Franko */\n',
  error = false,
  cachedBuiltLibText = fs.readFileSync('./src/amdclean.js', 'utf8');
  revertFile = function() {
    fs.writeFileSync('./src/amdclean.js', cachedBuiltLibText);
  };

gulp.task('build', function(cb) {
  requirejs.optimize({
    'findNestedDependencies': false,
    'baseUrl': './src/modules/',
    'optimize': 'none',
    'paths': {
      'amdclean': 'index'
    },
    'include': ['amdclean'],
    'out': './src/amdclean.js',
    'onModuleBundleComplete': function(data) {
      var outputFile = data.path,
        cleanedCode = (function() {
          try {
            return amdclean.clean({
              'filePath': outputFile,
              'transformAMDChecks': false,
              'aggressiveOptimizations': true,
              'ignoreModules': ['esprima', 'estraverse', 'escodegen', 'lodash', 'fs'],
              'removeUseStricts': false,
              'wrap': {
                // All of the third party dependencies are hoisted here
                // It's a hack, but it's not too painful
                'start': ';(function() {\n// Third-party dependencies that are hoisted\nvar esprima, estraverse, escodegen, _;\n'
              },
              'createAnonymousAMDModule': true
            });
          } catch (e) {
            error = true;
            revertFile();
            return '' + e;
          }
        }()),
        fullCode = headerText + licenseText + cleanedCode;

      if (error) {
        revertFile();
        console.log('Looks like there was an error building, stopping the build... ' + cleanedCode);
        return;
      }
      fs.writeFileSync(outputFile, fullCode);
    }
  }, function() {
    if (!error) {
      cb();
    }
  }, function(err) {
    revertFile();
    console.log('Looks like there was an error building, stopping the build... ');
    return cb(err); // return error
  });
});

gulp.task('lint', ['build'], function() {
  gulp.src('src/amdclean.js')
    .pipe(jshint({
      'evil': true
    }))
    .pipe(jshint.reporter('default'));
});

gulp.task('test', ['build', 'lint'], function() {
  gulp.src('test/specs/convert.js')
    .pipe(jasmine());
});

gulp.task('test-only', function() {
  gulp.src('test/specs/convert.js')
    .pipe(jasmine());
});

gulp.task('minify', ['build', 'lint', 'test'], function() {
  gulp.src(['src/amdclean.js'])
    .pipe(gulp.dest('build/'))
    .pipe(uglify())
    .pipe(insert.prepend(headerText + licenseText))
    .pipe(rename('amdclean.min.js'))
    .pipe(gulp.dest('build/'));
});

// The default task (called when you run `gulp`)
gulp.task('default', ['build', 'lint', 'test', 'minify']);

// The watch task that runs the default task on any AMDclean module file changes
gulp.task('watch', function() {
  var watcher = gulp.watch('src/modules/*.js', ['default']);

  watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});