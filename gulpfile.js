'use strict';

var fs = require('fs');
var gulp = require('gulp-help')(require('gulp'));
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var del = require('del');
var coveralls = require('gulp-coveralls');

require('jshint-stylish');

var paths = {
    lint: [
        './*.js',
        'lib/**/*.js',
        'test/**/*.js'
    ],
    coverage: [
        './*.js',
        'lib/**/*.js'
    ],
    clean: ['./coverage'],
    test: ['test/**/*.js']
};

gulp.task('lint', 'Checks for style issues and possible code errors.', function() {
    return gulp.src(paths.lint)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('test', 'Runs all tests.', function(cb) {
    gulp.src(paths.coverage)
        .pipe(istanbul()) // Covering files
        .pipe(istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function() {
            gulp.src(paths.test)
                .pipe(mocha({
                    reporter: 'spec',
                    timeout: 10000
                }))
                .pipe(istanbul.writeReports({
                    reporters: ['lcov', 'json', 'text', 'text-summary']
                }))
                .on('end', cb);
        });
});

gulp.task('coveralls', 'Pushes coverage data to coveralls.io', ['clean', 'test'], function() {
    return gulp.src('coverage/lcov.info')
        .pipe(coveralls());
});

gulp.task('clean', 'Removes temporary directories.', function (cb) {
  del(paths.clean, cb);
});

gulp.task('build', 'Runs lint and test tasks.', ['lint', 'test']);
gulp.task('ci', 'Runs CI server tasks.', ['lint', 'coveralls']);
gulp.task('default', 'Runs lint and test tasks.', ['build']);
