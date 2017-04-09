var gulp = require('gulp');
var args = require('yargs').argv;
var config = require('./gulp.config')();
var browserSync = require('browser-sync');
var del = require('del');
var project = require('./project.json');
var plugins = require('gulp-load-plugins')({ lazy: true });
var port = process.env.PORT || config.defaultPort;

var paths = {
    webroot: './' + project.webroot + '/',
    bower: './bower_components/'
};

gulp.task('check', function () {
    log('Analyzing javascript source code with JSHint and JSCS');

    return gulp
        .src(config.alljs)
        .pipe(plugins.if(args.verbose, plugins.print()))
        .pipe(plugins.jscs())
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish', { verbose: true }))
        .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('clean-css-app', function (done) {
    var files = [].concat(config.temp + '*.css', config.build + 'css/app.*');
    return clean(files, done);
});

gulp.task('clean-css-lib', function (done) {
    var files = [].concat(config.temp + '*.css', config.build + 'css/lib.*');
    return clean(files, done);
});

gulp.task('clean-css', function (done) {
    var files = [].concat(config.temp + '*.css', config.build + 'css/**/*.*');
    return clean(files, done);
});

gulp.task('clean-fonts', function (done) {
    clean(config.build + 'fonts/**/*.*', done);
});

gulp.task('clean-images', function (done) {
    clean(config.build + 'images/**/*', done);
});

gulp.task('clean-js-app', function (done) {
    clean(config.build + 'js/app.js', done);
});

gulp.task('clean-js-lib', function (done) {
    clean(config.build + 'js/lib.js', done);
});

gulp.task('clean-js', function (done) {
    clean(config.build + 'js/**/*.js', done);
});

gulp.task('clean-html', function (done) {
    clean(config.build + '**/*.html', done);
});

gulp.task('css', gulp.series(
    'clean-css-app',
    function () {
        log('Compiling Less to CSS and joining it with other app specific css');

        var lessStream;
        var cssStream;
        var merge = require('merge-stream');

        //compile less
        lessStream = gulp.src(config.less)
            .pipe(plugins.less())
            .pipe(plugins.autoprefixer({ browsers: ['last 2 version', '> 5%'] }));

        //select additional css files
        cssStream = gulp.src(config.css);

        //merge the two streams and concatenate their contents into a single file
        return merge(lessStream, cssStream)
            .pipe(plugins.concat('app.css'))
            .pipe(gulp.dest(config.build + '/css'));
    }
));

gulp.task('css-min', gulp.series(
    'clean-css-app',
    function () {
        log('Compiling Less to CSS and joining it with other app specific css');

        var lessStream;
        var cssStream;
        var merge = require('merge-stream');

        //compile less
        lessStream = gulp.src(config.less)
            .pipe(plugins.less())
            .pipe(plugins.autoprefixer({ browsers: ['last 2 version', '> 5%'] }));

        //select additional css files
        cssStream = gulp.src(config.css);

        //merge the two streams and concatenate their contents into a single file
        return merge(lessStream, cssStream)
            .pipe(plugins.concat('app.css'))
            .pipe(plugins.csso())
            .pipe(gulp.dest(config.temp));
    }
));

gulp.task('fonts', gulp.series('clean-fonts', function () {
    log('Copying fonts');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
}));

gulp.task('images', gulp.series('clean-images', function () {
    log('Copying the images to build folder');

    return gulp
        .src(config.images)
        .pipe(gulp.dest(config.build + 'images'));
}));

gulp.task('images-min', gulp.series('clean-images', function () {
    log('Copying and compressing the images');

    return gulp
        .src(config.images)
        .pipe(plugins.imagemin({ optimizationLevel: 4 }))
        .pipe(gulp.dest(config.build + 'images'));
}));

gulp.task('injectBower', function () {
    log('Wire up the bower css and javascript into index.html');
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;

    return gulp
        .src(config.index)
        .pipe(plugins.convertEncoding({ from: 'iso-8859-1', to: 'utf8' }))
        .pipe(wiredep(options))
        .pipe(plugins.convertEncoding({ from: 'utf8', to: 'iso-8859-1' }))
        .pipe(gulp.dest(config.source));
});

gulp.task('injectJs', gulp.series(function () {
    log('Inject our app js into index.html');

    return gulp
        .src(config.index)
        .pipe(plugins.convertEncoding({ from: 'iso-8859-1', to: 'utf8' }))
        .pipe(plugins.inject(gulp.src(config.js), { read: false }), { relative: false })
        .pipe(plugins.convertEncoding({ from: 'utf8', to: 'iso-8859-1' }))
        .pipe(gulp.dest(config.source));
}));


gulp.task('injectCss', gulp.series('css', function () {
    log('Wire up the app css into index.html');

    return gulp
        .src(config.index)
        .pipe(plugins.convertEncoding({ from: 'iso-8859-1', to: 'utf8' }))
        .pipe(plugins.inject(gulp.src(config.css), { read: false }), { relative: true })
        .pipe(plugins.convertEncoding({ from: 'utf8', to: 'iso-8859-1' }))
        .pipe(gulp.dest(config.source));
}));

gulp.task('injectAll', gulp.series('injectBower', 'injectJs', 'injectCss'));

gulp.task('html', gulp.series(
        'clean-html',
        function () {
            log('Copy html to build folder');

            return gulp
                .src(config.index)
                ///.pipe(plugins.header('\ufeff'))
                .pipe(plugins.convertEncoding({ from: 'iso-8859-1', to: 'utf8' }))
                .pipe(plugins.useref({ searchPath: './' }))
                .pipe(plugins.convertEncoding({from: 'utf8', to: 'iso-8859-1' }))
                .pipe(gulp.dest(config.build));
        }
    )
);

gulp.task('html-min', gulp.series(
    'clean-html',
    function () {
        log('Copy and minify html to build folder');

        return gulp
            .src(config.index)
            .pipe(plugins.convertEncoding({ from: 'iso-8859-1', to: 'utf8' }))
            .pipe(plugins.useref({ searchPath: './' }))
            .pipe(plugins.minifyHtml({ empty: true }))
            .pipe(plugins.convertEncoding({ from: 'utf8', to: 'iso-8859-1' }))
            .pipe(gulp.dest(config.build));
    }
));

gulp.task('js', gulp.series(
    'clean-js-app',
    function () {
        log('Copy javascript to build folder');

        return gulp
            .src(config.js)
            .pipe(gulp.dest(config.build));
}));

gulp.task('js-min', gulp.series(
    'clean-js',
    function () {
        log('Copy and minify javascript to build folder');

        return gulp
            .src(config.js)
            .pipe(plugins.stripComments())
            .pipe(plugins.uglify({ mangle: true }))
            .pipe(gulp.dest(config.build));
    }
));

gulp.task('clean', gulp.series('clean-fonts', 'clean-css', 'clean-html', 'clean-js', function (done) {
    var delconfig = [].concat(config.build + '*.*', config.temp, '!' + config.build + 'favicon.ico');
    clean(delconfig, done);
}));

gulp.task('build-dev', gulp.series('clean', 'css', 'js', 'fonts', 'injectAll', 'html'));

gulp.task('serve-dev', gulp.parallel(
    'build-dev',
    function () {
        return gulp.watch(config.index, gulp.series('html'));
    },
    function () {
        return gulp.watch(config.js, gulp.series('js'));
    },
    function () {
        return gulp.watch(config.css, gulp.series('css'));
    }
));

gulp.task('build-prod', gulp.series('clean', 'injectBower', 'injectJs', 'fonts', 'injectCss', 'images-min', function () {
    log('Concatenize the javascript and css, then minify javascript, css and html and optimizes images');

    return gulp
        .src(config.index)
        .pipe(plugins.convertEncoding({ from: 'iso-8859-1', to: 'utf8' }))
        .pipe(plugins.plumber())
        .pipe(plugins.useref({ searchPath: './' }))
        .pipe(plugins.if('*.js', plugins.uglify({ mangle: true })))
        .pipe(plugins.if('*.css', plugins.csso()))
        .pipe(plugins.if('*.html', plugins.minifyHtml({ empty: true })))
        .pipe(plugins.if('*.js', plugins.rev()))
        .pipe(plugins.if('*.css', plugins.rev()))
        .pipe(plugins.revReplace())
        .pipe(plugins.convertEncoding({ from: 'utf8', to: 'iso-8859-1' }))
        .pipe(gulp.dest(config.build));
}));

gulp.task('serve-prod', gulp.parallel(
    'build-prod',
    function () {
        return gulp.watch(config.index, gulp.series('html-min'));
    },
    function () {
        return gulp.watch(config.js, gulp.series('js-min'));
    },
    function () {
        return gulp.watch(config.css, gulp.series('css-min'));
    }
));

/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*-x
 * --type=patch or no flag will bump the patch version *.*.x
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --version=1.2.3 will bump to a specific version and ignore other flags
 */
gulp.task('bump', function () {
    var msg = 'Bumping versions';
    var type = args.type;
    var version = args.version;
    var options = {};
    if (version) {
        options.version = version;
        msg += ' to ' + version;
    } else {
        options.type = type;
        msg += ' for a ' + type;
    }
    log(msg);

    return gulp
        .src(config.packages)
        .pipe(plugins.print())
        .pipe(plugins.bump(options))
        .pipe(gulp.dest(config.root));
});
////////////

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync() {
    if (browserSync.active) {
        return;
    }

    log('Starting browser-sync on port ' + port);

    gulp.watch([config.less], ['css'])
        .on('change', function (event) { changeEvent(event); });

    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 0 //1000
    };

    browserSync(options);
}

function clean(path, done) {
    log('Cleaning: ' + plugins.util.colors.blue(path));
    del(path, done());
}

function log(msg) {
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                plugins.util.log(plugins.util.colors.blue(msg[item]));
            }
        }
    } else {
        plugins.util.log(plugins.util.colors.blue(msg));
    }
}
