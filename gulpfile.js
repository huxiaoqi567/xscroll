var gulp    = require('gulp');
var concat = require('gulp-concat-util');
var requirejs = require('requirejs');
var clean = require('gulp-clean');
 var fs = require('fs');
var amdclean = require('amdclean');

gulp.task('clean',function(){
   gulp.src('./build').pipe(clean());
})
gulp.task('cmd',function() {
  var stream = gulp.src('src/**/*.js')
 .pipe(concat.header('define(function(require, exports, module) {\n'))
  .pipe(concat.footer('\n});'))
  .pipe(gulp.dest("./build/cmd/"))
  return stream;

});

function cleanModule(pathName){
  requirejs.optimize({
    'findNestedDependencies': true,
    'baseUrl': './build/cmd/',
    'optimize': 'none',
    'include': [pathName],
    'out': './build/standalone/'+pathName+'.js',
    'onModuleBundleComplete': function(data) {
      fs.writeFileSync(data.path, amdclean.clean({
        'filePath': data.path
      }));
    }
  });
}

var cleanModules = ['xscroll','plugins/infinite','plugins/lazyload','plugins/pulldown','plugins/pullup','plugins/scale','plugins/snap'];

gulp.task('amd-clean',['cmd'],function(){
   cleanModule('xscroll');
    for(var i in cleanModules){
      cleanModule(cleanModules[i]);
    }
})


gulp.task('default',['amd-clean']);

gulp.task('watch',function(){
  gulp.watch('src/**/*.js', ['default'])
})




