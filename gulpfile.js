var gulp    = require('gulp');
var concat = require('gulp-concat-util');
var requirejs = require('requirejs');
gulp.task('concat', function() {
  var stream = gulp.src('src/**/*.js')
 .pipe(concat.header('define(function(require, exports, module) {\n'))
  .pipe(concat.footer('});'))
  .pipe(gulp.dest("./build/cmd/"))
  return stream;

});

gulp.task('amd-clean',['concat'],function(){
    requirejs.optimize({
    'findNestedDependencies': true,
    'baseUrl': './build/cmd/',
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
    'baseUrl': './build/cmd/',
    'optimize': 'none',
    'include': ['infinite'],
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

})

gulp.task('build',['amd-clean'])

gulp.task('watch',function(){
  gulp.watch('src/**/*.js', ['build'])
})




