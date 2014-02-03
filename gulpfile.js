var gulp = require('gulp');
var jasmine = require('gulp-jasmine');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

var paths = {
  scripts: ['./lib/*.js'],
  tests : ['./spec/*.js']
};

gulp.task('test', function(){
	return gulp.src(paths.tests)
			.pipe(jasmine())
});

gulp.task('jshint', function(){
	return gulp
			.src(paths.scripts
				.concat(paths.tests))
			.pipe(jshint())
			.pipe(jshint.reporter(stylish))
});

gulp.task('watch', function () {
	gulp.watch(paths.scripts, ['jshint','test']);
	gulp.watch(paths.tests, ['jshint', 'test']);
});

gulp.task('default', ['jshint', 'test']);
