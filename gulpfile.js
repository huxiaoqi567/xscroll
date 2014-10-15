var gulp    = require('gulp');
gulp.task('build', function() {
  var requirejs = require('requirejs');

  requirejs.optimize({
    'findNestedDependencies': true,
    'baseUrl': './src/',
    'optimize': 'none',
    'include': ['core'],
    'out': './build/xscroll.js',
    'onModuleBundleComplete': function(data) {
      var fs = require('fs'),
        amdclean = require('amdclean'),
        outputFile = data.path;

      fs.writeFileSync(outputFile, amdclean.clean({
        'filePath': outputFile
      }));
    }
  });

  requirejs.optimize({
    'findNestedDependencies': true,
    'baseUrl': './src/',
    'optimize': 'none',
    'include': ['xlist'],
    'out': './build/xlist.js',
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

gulp.task('watch',function(){
  gulp.watch('src/**/*.js', ['build'])
})

// gulp.task('debug',['watch','build'])


