var autoprefixer = require('gulp-autoprefixer');
var bower        = require('main-bower-files');
var browserSync  = require('browser-sync').create();
var sass         = require('gulp-sass');
var sassdoc      = require('sassdoc');
var concat       = require('gulp-concat');
var cssnano      = require('gulp-cssnano');
var gulp         = require('gulp');
var modernizr    = require('gulp-modernizr');
var pug          = require('gulp-pug');
var sourcemaps   = require('gulp-sourcemaps');
var uglify       = require('gulp-uglify');
var htmlmin      = require('gulp-htmlmin');

var susy = require.resolve('susy');
var breakpoint = require.resolve('breakpoint-sass');

function getDirectoryPath(filepath) {
    var dirname = filepath.match(/(.*)[\/\\]/)[1]||'';
    return dirname;
}

gulp.task('modernizr', function() {
    var modernizrOptions =
    {
        // Added all options available, this should be "trimmed" to use only
        // what's really required.
        options:
        [
            // "domPrefixes",
            // "prefixes",
            // "addTest",
            // "atRule",
            // "hasEvent",
            // "mq",
            // "prefixed",
            // "prefixedCSS",
            // "prefixedCSSValue",
            // "testAllProps",
            // "testProp",
            // "testStyles",
            "html5shiv",
            "setClasses"
        ],
        tests : [],         // Will include tests that were not automatically added.
        excludeTests: [],   // Will remove tests that are auto added by mistake or just unwanted.
        customeTests: [],   // Currently unavailable @see https://github.com/Modernizr/customizr/issues/22
        crawl: true,        // Enables this plugin to automatically add feature tests by checking JS and SASS files.
        useBuffers: true,
        files:
        {
            src: ['app/scripts/**/*.js', 'app/scripts/sass/**/*.scss']
        }
    }
    return gulp.src('app/scripts/**/*.js')
        .pipe(modernizr(modernizrOptions))
        .pipe(gulp.dest("app/tmp/js/"));
});

//
// concat *.js to vendor.js
//
gulp.task('bower-js', function() {
    return gulp.src(bower(['**/*.js']))
        .pipe(sourcemaps.init())
            .pipe(concat('vendor.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('app/tmp/js/'));
});

//
// concat *.css to vendor.css
//
gulp.task('bower-css', function() {
    return gulp.src(bower('**/*.css'))
        .pipe(sourcemaps.init())
            .pipe(concat('vendor.css'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('app/tmp/css/'));
});

gulp.task('bower', ['bower-css', 'bower-js']);

// process JS files and return the stream.
gulp.task('js', ['modernizr'], function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe(sourcemaps.init())
            .pipe(concat('main.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('app/tmp/js/'));
});

// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('js-watch', ['js'], function() {
    browserSync.reload();
});


// SASS tasks
gulp.task('sass', function() {
  gulp.src('app/sass/**/*.scss')
    .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: [
                getDirectoryPath(breakpoint),
                getDirectoryPath(susy)
            ]
        })
        .on('error', sass.logError))
        .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('app/tmp/css'))
    // .pipe(sassdoc())
    .pipe(browserSync.stream());
});


// PUG tasks
gulp.task('pug', function() {
    var pugOptions = {
        filename : '',
        compileDebug : true,
        pretty : true
    }
    return gulp.src('app/views/**.pug')
        .pipe(pug(pugOptions))
        .pipe(gulp.dest('app/tmp/'));
});

gulp.task('pug-watch', ['pug'], function() {
    browserSync.reload();
});

gulp.task('clean', function () {
  return del([
    'app/tmp/**/*'
  ]);
});

// Static Server + watching scss/html files
gulp.task('serve', ['pug', 'sass', 'bower', 'js'], function() {

    browserSync.init({
        server : {
            baseDir: 'app/tmp'
        },
        open: false
    });

    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
    // gulp.watch("app/scripts/modernizrCustomTests/*.js", ['js-watch']);
    gulp.watch("app/scripts/**/*.js", ['js-watch']);
    gulp.watch("app/sass/**/*.scss", ['sass']);
    gulp.watch("app/views/*.pug", ['pug-watch']);
});

gulp.task('minify-css', ['bower-css', 'sass'], function() {
    return gulp.src('app/tmp/css/*.css')
        .pipe(cssnano())
        .pipe(gulp.dest('docs/css/'));
});

gulp.task('minify-js', ['bower-js', 'js'], function() {
    return gulp.src('app/tmp/js/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('docs/js/'));
});

gulp.task('minify-html', ['pug'], function() {
    return gulp.src('app/tmp/*.html')
        .pipe(htmlmin({
            collapseBooleanAttributes: true,
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('docs/'));
});

// Prevent from running unexpected gulp task. I'll have them explicit.
gulp.task('default', []);

// Builds the app and serves it on development mode on a temp file. Changes are
// watched and browser windows are updated accordingly.
gulp.task('watch', ['serve']);

// Build the app and deploys to the docs folder.
gulp.task('deploy', ['minify-css', 'minify-js', 'minify-html']);
