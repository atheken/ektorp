module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      scripts: {
        files: ['./lib/**/*.js','./spec/*.js'],
        tasks: ['jshint','jasmine_node'],
        options: {
          spawn: true,
        },
      },
    },
    jasmine_node: {
      specNameMatcher: '.', // load only specs containing specNameMatcher
      projectRoot: './spec',
      requirejs: false,
      forceExit: true
    },
    jshint: {
      all: ['lib/*.js','spec/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', 'watch');
};
