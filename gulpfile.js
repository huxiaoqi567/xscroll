var gulp = require('gulp');
var concat = require('gulp-concat-util');
var requirejs = require('requirejs');
var clean = require('gulp-clean');
var uglify = require('gulp-uglify');
var fs = require('fs');
var amdclean = require('amdclean');
var rename = require('gulp-rename');
var replace = require('gulp-replace');


gulp.task('clean', function() {
  gulp.src('./build').pipe(clean());
})
gulp.task('cmd', function() {
  var stream = gulp.src('src/**/*.js')
    .pipe(concat.header('define(function(require, exports, module) {\n'))
    .pipe(concat.footer('\n});'))
    .pipe(gulp.dest("./build/cmd/"))
  return stream;

});

gulp.task('cmd-clean-suffix',function(){
  var stream = gulp.src('src/**/*.js')
  .pipe(replace(/\/\*\* ignored by jsdoc \*\*\/\s*[^]*/g,''))
  .pipe(gulp.dest("./dist/"))
});

function cleanModule(pathName) {
  requirejs.optimize({
    'findNestedDependencies': true,
    'baseUrl': './build/cmd/',
    'optimize': 'none',
    'include': [pathName],
    'out': './build/standalone/' + pathName + '.js',
    'onModuleBundleComplete': function(data) {
      fs.writeFileSync(data.path, amdclean.clean({
        'filePath': data.path
      }));
    }
  });
}

var cleanModules = [
  'xscroll', 'xscroll-master', 'plugins/infinite', 'plugins/lazyload', 'plugins/pulldown', 'plugins/pullup', 'plugins/scale', 'plugins/snap'
];

gulp.task('amd-clean', ['cmd'], function() {
  cleanModule('xscroll');
  for (var i in cleanModules) {
    cleanModule(cleanModules[i]);
  }
})

gulp.task('compress', ['amd-clean','cmd-clean-suffix','clearsuffix'], function() {
  gulp.src(['./build/**/*.js', '!./build/**/*.min.js'])
    .pipe(uglify())
    .pipe(rename({
      suffix: ".min",
    }))
    .pipe(gulp.dest('./build/'))
});
//prepare for jsdoc generator
gulp.task('clearsuffix',function(){
   gulp.src(['src/**/*.js'])
   .pipe(replace(/\/\*\* ignored by jsdoc \*\*\/\s*[^]*/g,''))
   .pipe(gulp.dest('./doc/code/'));
})


gulp.task('default', ['compress']);



gulp.task('watch', function() {
  gulp.watch('src/**/*.js', ['cmd'])
})