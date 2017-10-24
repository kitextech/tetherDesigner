var gulp = require("gulp");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var watchify = require("watchify");
var tsify = require("tsify");
var gutil = require("gulp-util");
var paths = {
    pages: ['src/*.html'],
    css: ['src/css/*.css'],
    lib: ['src/lib/*.js'],    
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

gulp.task("copy-lib", function () {
    return gulp.src(paths.lib)
        .pipe(gulp.dest("docs/lib"));
});

function bundle() {
    return watchedBrowserify
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest("docs"));
}

gulp.task("default", ["copy-html", "copy-css", "copy-lib"], () => {
    gulp.watch(paths.pages, ['copy-html'])
    gulp.watch(paths.css, ['copy-css'])
    gulp.watch(paths.lib, ['copy-lib'])    
    bundle()
} )

watchedBrowserify.on("update", bundle);
watchedBrowserify.on("log", gutil.log);