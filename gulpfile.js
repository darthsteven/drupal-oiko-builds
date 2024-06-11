// Import all the modules we need.
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var eyeglass = require("eyeglass");
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');
var webpack = require('webpack');
var gulpWebpack = require('webpack2-stream-watch');
var mergeStream = require('merge-stream');

gulp.task('compile:sass:medmus', function () {
  var sassOptions = {
    errLogToConsole: true,
    outputStyle: 'expanded',
    includePaths: [
      'node_modules/foundation-sites/scss',
    ],
    eyeglass: {
      enableImportOnce: false,
    }
  };

  return gulp
      .src('webroot/themes/custom/medmus/scss/**/*.scss')
      .pipe(sourcemaps.init())
      .pipe(sass(eyeglass(sassOptions)).on("error", sass.logError))
      .pipe(postcss([ autoprefixer({ browsers: ['last 2 versions', 'ie >= 9'] }) ]))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('webroot/themes/custom/medmus/css'));
});

gulp.task('compile:sass:oiko', function () {
  var sassOptions = {
    errLogToConsole: true,
    outputStyle: 'expanded',
    includePaths: [
      'node_modules/foundation-sites/scss',
    ],
    eyeglass: {
      enableImportOnce: false,
    }
  };

  return gulp
    .src('webroot/themes/custom/oiko/scss/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass(eyeglass(sassOptions)).on("error", sass.logError))
    .pipe(postcss([ autoprefixer({ browsers: ['last 2 versions', 'ie >= 9'] }) ]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('webroot/themes/custom/oiko/css'));
});

gulp.task('compile:sass', ['compile:sass:oiko', 'compile:sass:medmus']);

gulp.task('compile:js', function () {
  // For now, just copy a file out of the node modules folder.
  var files = [
    'node_modules/foundation-sites/dist/foundation.min.js',
    'node_modules/iframe-resizer/js/iframeResizer.contentWindow.min.js',
    'node_modules/iframe-resizer/js/iframeResizer.min.js',
    'node_modules/localforage/dist/localforage.nopromises.min.js'
  ];
  return gulp
    .src(files)
    .pipe(gulp.dest('webroot/themes/custom/oiko/scripts/vendor'));
});

gulp.task('compile:webpack', function () {
  // For now, just copy a file out of the node modules folder.
  var files = [
    'webroot/modules/custom/oiko_app/js/main.js',
  ];
  return gulp
    .src(files)
    .pipe(gulpWebpack( require('./webpack.config.js') , webpack))
    .pipe(gulp.dest('webroot/modules/custom/oiko_app/dist/'));
});

gulp.task('watch:js', ['compile:js']);

// Main compile task.
gulp.task('compile', ['compile:sass', 'compile:js', 'compile:webpack']);
