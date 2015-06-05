module.exports = function(grunt) {

    var meta = {
        banner: '/*\n  <%= pkg.title || pkg.name %> <%= pkg.version %>' +
            '<%= pkg.homepage ? " <" + pkg.homepage + ">" : "" %>' + '\n' +
            '  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>' +
            '\n\n  Released under <%= _.pluck(pkg.licenses, "type").join(", ") %> License\n*/\n',
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
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('build', ['concat', 'uglify']);

};
