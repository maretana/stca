var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var bower       = require('main-bower-files');
var compass     = require('gulp-compass');
var uglify      = require('gulp-uglify');
var cssmin      = require('gulp-cssnano');
var concat      = require('gulp-concat');
var rename      = require('gulp-rename');
var sourcemaps  = require('gulp-sourcemaps');
var modernizr   = require('gulp-modernizr');

var devFolder  = 'app/';
var distFolder = 'dist/';

var dev = {
    css  : [devFolder + 'styles'],
    sass : [devFolder + 'sass'],
    scripts : [devFolder + 'scripts']
}

var html5shiv = '**/html5shiv.js';

gulp.task('modernizr', function() {
    var modernizrOptions = 
    {
        options:
        [
            "addTest",
            "atRule",
            "domPrefixes",
            "hasEvent",
            "load",
            "mq",
            "prefixed",
            "prefixes",
            "prefixedCSS",
            "setClasses",
            "testAllProps",
            "testProp",
            "testStyles"
        ],
        // tests : ['Force added tests'],
        // excludeTests: ['Ignore tests that may be otherwise auto added'],
        // customeTests: ['Add custom feature tests'], Currently unavailable @see https://github.com/Modernizr/customizr/issues/22
        crawl: true,
        useBuffers: true,
        files:
        {
            src: ['app/scripts/custom/**/*.js', 'app/scripts/sass/**/*.scss']
        }
    }
    return gulp.src('app/scripts/custom/**/*.js')
        .pipe(modernizr(modernizrOptions))
        .pipe(gulp.dest("app/scripts/"));
});

gulp.task('bower-shiv', function() {
    return gulp.src(bower(html5shiv))
        .pipe(gulp.dest('app/scripts/'));
})

//
// concat *.js to vendor.js
//
gulp.task('bower-js', ['bower-shiv'], function() {
    return gulp.src(bower(['**/*.js', '!' + html5shiv]))
        .pipe(sourcemaps.init())
            .pipe(concat('vendor.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/scripts/'));
});

//
// concat *.css to vendor.css
//
gulp.task('bower-css', function() {
    return gulp.src(bower('**/*.css'))
        .pipe(sourcemaps.init())
            .pipe(concat('vendor.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/styles/'));
});

gulp.task('bower', ['bower-css', 'bower-js']);

// process JS files and return the stream.
gulp.task('js', ['modernizr'], function () {
    return gulp.src('app/scripts/custom/**/*.js')
        .pipe(sourcemaps.init())
            .pipe(concat('main.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('app/scripts/'));
});

// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('js-watch', ['js'], browserSync.reload);

gulp.task('compass', function() {
  gulp.src('app/sass/*.scss')
    .pipe(compass({
      config_file: './config.rb',
      sass: 'app/sass',
      css: 'app/styles',
      fonts: 'app/fonts'
    }))
    // .pipe(gulp.dest('dist/styles'))
    .pipe(browserSync.stream());
});

// Static Server + watching scss/html files
gulp.task('serve', ['compass', 'bower', 'js'], function() {

    browserSync.init({
        server : {
            baseDir: 'app'
        }
    });

    // add browserSync.reload to the tasks array to make
    // all browsers reload after tasks are complete.
    // gulp.watch("app/scripts/modernizrCustomTests/*.js", ['js-watch']);
    gulp.watch("app/scripts/custom/**/*.js", ['js-watch']);
    gulp.watch("app/sass/**/*.scss", ['compass']);
    gulp.watch("app/*.html").on('change', browserSync.reload);
});

gulp.task('default', ['serve']);
