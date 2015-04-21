module.exports = function(grunt) {

  var dir = "doc/code/";

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsdoc: {
      dist: {
        src: [
        dir+'**/animate.js'
        ,dir+'**/base.js'
        ,dir+'**/core.js'
        ,dir+'**/xscroll.js'
        ,dir+'**/origin-scroll.js'
        ,dir+'**/simulate-scroll.js'
        ,dir+'**/xscroll-master.js'
        ,dir+'**/util.js'
        ,dir+'plugins/*.js'
        ,dir+'components/*.js'
        ],
        options: {
          closure:false,
          // 'private': true
          destination: 'doc',
          template: 'node_modules/jaguarjs-jsdoc/'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('doc', ['jsdoc']);

};