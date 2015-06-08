var _ =  require('lodash');

module.exports = function(grunt) {

    var meta = {
        banner: '/*\n  <%= pkg.title || pkg.name %> <%= pkg.version %>' +
            '<%= pkg.homepage ? " <" + pkg.homepage + ">" : "" %>' + '\n' +
            '  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
            '\n\n */\n',
        pre: '\n(function(window, $){\n\n',
        post: '\n}).call({}, window, window.$ || (window.angular || {}).element);'
    };

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                src: [
                    'src/*.js'
                ],
                nonull: true,
                dest: 'dist/<%= pkg.name %>.js',
                options:{
                    banner: meta.banner + meta.pre,
                    footer: meta.post
                }
            }
        },
        uglify: {
            dist: {
                src: ['<%= concat.dist.dest %>'],
                dest: 'dist/<%= pkg.name %>.min.js'
            },
            options: {
                banner: meta.banner
            }
        },
        jshint: {
            all: ['src/*.js'],
            options: grunt.file.readJSON('./.jshintrc')
        },
        fixmyjs: {
            options: {
              config: '.jshintrc',
              indentpref: 'spaces',
              dry: true
            },
            test: {
              files: [
                    {expand: true, cwd: 'src', src: ['*.js'], dest: 'actual/', ext: '.js'}
                ]
            }
          },
              // The actual grunt server settings
            connect: {
              options: {
                port: 9009,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: 'localhost',
                livereload: 35729
              },
              livereload: {
                options: {
                  open: true,
                  base: [
                    '.'
                  ]
                }
              }
            },
                // Watches files for changes and runs tasks based on the changed files
            watch: {
              js: {
                files: ['src/*.js'],
                tasks: ['build'],
                options: {
                  reload: true
                }
              },
              livereload: {
                  options: {
                      livereload: '<%= connect.options.livereload %>'
                  },
                  files: [
                      'dist/*.js'
                  ]
              }

            },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-fixmyjs');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('build', ['concat', 'uglify']);
    
    grunt.registerTask('lint', ['fixmyjs']);
    
    grunt.registerTask('serve', ['build', 'connect:livereload', 'watch']);

};
