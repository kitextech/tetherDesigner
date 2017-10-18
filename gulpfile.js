var gulp = require("gulp");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var watchify = require("watchify");
var tsify = require("tsify");
var gutil = require("gulp-util");
var paths = {
    pages: ['src/*.html'],
    css: ['src/css/*.css']
};

var watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: ['src/main.ts'],
    cache: {},
    packageCache: {}
})
// .ignore('d3')
.plugin(tsify));

gulp.task("copy-html", function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest("docs"));
});

gulp.task("copy-css", function () {
    return gulp.src(paths.css)
        .pipe(gulp.dest("docs/css"));
});

function bundle() {
    return watchedBrowserify
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest("docs"));
}

gulp.task("default", ["copy-html", "copy-css"], () => {
    gulp.watch(paths.pages, ['copy-html'])
    gulp.watch(paths.css, ['copy-css'])
    bundle()
} )

watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);