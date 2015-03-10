var gulp    = require('gulp');
var concat = require('gulp-concat-util');
var requirejs = require('requirejs');
var jsdoc = require('gulp-jsdoc');
var clean = require('gulp-clean');

gulp.task('clean',function(){
   gulp.src('./build').pipe(clean());
})
gulp.task('cmd',function() {
  var stream = gulp.src('src/**/*.js')
 .pipe(concat.header('define(function(require, exports, module) {\n'))
  .pipe(concat.footer('\n});'))
  .pipe(gulp.dest("./build/"))
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

// gulp.task('doc',function(){
//   // gulp.clean('doc');
//   gulp.src(['src/**/*.js','!src/hammer.js'])
//   .pipe(jsdoc('./doc'))
//   // .pipe(jsdoc.parser({name:'animate',version:'3.0'},'animate'))
//   // .dest('./doc')
// })


gulp.task('build',['cmd'])

gulp.task('watch',function(){
  gulp.watch('src/**/*.js', ['build'])
})




