var gulp   = require('gulp');
var jshint = require('gulp-jshint');
var jsonlint = require("gulp-jsonlint");

var paths = {
  js: ['./*.js', './lib/*.js']
};

gulp.task('lint', function() {
  gulp.src(paths.js)
    .pipe( jshint() )
    .pipe( jshint.reporter('jshint-stylish') );
});

gulp.task('jsonLint', function() {
  gulp.src("./*.json")
      .pipe(jsonlint())
      .pipe(jsonlint.reporter());
});

gulp.task('watch', function() {

  gulp.watch(paths.js, ['lint']);

  gulp.watch('./*.json', ['jsonLint']);

});

gulp.task('default', ['watch']);
