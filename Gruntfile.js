module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // uglify: {
    //   options: {
    //     banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
    //   },
    //   build: {
    //     src: 'src/<%= pkg.name %>.js',
    //     dest: 'build/<%= pkg.name %>.min.js'
    //   }
    // }
    jsdoc: {
      dist: {
        src: [
        'src/**/animate.js'
        ,'src/**/base.js'
        ,'src/**/core.js'
        ,'src/**/xscroll.js'
        ,'src/**/origin-scroll.js'
        ,'src/**/simulate-scroll.js'
        ,'src/**/xscroll-master.js'
        ,'src/**/util.js'
        ,'src/plugins/*.js'
        ,'src/components/*.js'
        ],
        options: {
          // 'private': true
          destination: 'doc',
          template: 'node_modules/jaguarjs-jsdoc/'
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  // grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  // grunt.registerTask('default', ['uglify']);


  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('doc', ['jsdoc']);



};