﻿module.exports = function () {
    var source = './src/';
    var temp = './.tmp/';
    var root = './';

    var config = {
        /**
         * Files paths
         */
        alljs: [
            source + '**/*.js',
            './*.js'
        ],
        source: source,
        temp: temp,
        root: root,

        build: './wwwroot/',
        css: [ 
            source + 'css/**/*.*',
            source + 'lib/css/*.*'
        ],
        fonts: './bower_components/font-awesome-bower/fonts/**/*.*',
        index: source + 'index.html',
        images: source + 'images/**/*.*',
        js: [
            source + '**/*.js',
            '!' + source + '**/*.spec.js'
        ],
        less: source + 'less/app.less',


        packages: [
            './package.json',
            './bower.json'
        ],

        /**
         * Bower and NPM locations
         */
        bower: {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: new RegExp('.+?(?=/b)|.+?(?=../b)')
        }
    };

    config.getWiredepDefaultOptions = function () {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };

    return config;
};