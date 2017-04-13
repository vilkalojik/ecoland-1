var gulp = require('gulp');
var del = require('del');
var connect = require('gulp-connect');
var less = require('gulp-less');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-clean-css');
var pug = require('gulp-pug');
var haml = require('gulp-haml');

var LessAutoprefix = require('less-plugin-autoprefix');
var autoprefix = new LessAutoprefix({ browsers: ['last 2 versions'] });
var lessOptions = {
    plugins: [autoprefix]
};

var vendor = './bower_components';
var destination = './dist/';
var app = './app/';
var path = {
    copy: [
        app + 'index.html',
        app + 'assets/**/*.*'
    ],
    watch: [
        app + 'index.html',
        app + 'js/**/*.js',
        app + './less/**/*.less'
    ],
    vendor:{
        js:[
            vendor + '/jquery/dist/jquery.min.js',
            vendor + '/bootstrap/dist/js/bootstrap.min.js',
            vendor + '/jquery-ui/jquery-ui.min.js',
            vendor + '/jquery-circle-progress/dist/circle-progress.min.js'
        ],
        css:[
            vendor + '/bootstrap/dist/css/bootstrap.min.css',
            vendor + '/bootstrap/dist/css/bootstrap-theme.min.css',
            vendor + '/font-awesome/css/font-awesome.min.css',
            vendor + '/jquery-ui/themes/ui-darkness/jquery-ui.min.css'
        ],
        fonts:[
            vendor + '/bootstrap/dist/fonts/**.**',
            vendor + '/font-awesome/fonts/**.**'
        ]
    }
};

//utils
gulp.task('clean', function () {
    del.sync([destination]);
});

//vendor
gulp.task('vendorjs', function () {
    gulp.src(path.vendor.js)
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(destination + 'vendor/js'))
});
gulp.task('vendorcss', function () {
    gulp.src(path.vendor.css)
        .pipe(concat('vendor.css'))
        .pipe(gulp.dest(destination + 'vendor/css'))
});
gulp.task('vendorFonts', function(){
    gulp.src(path.vendor.fonts/*, {base: vendor + '/bootstrap/dist/fonts/'}*/)
        .pipe(gulp.dest(destination + 'vendor/fonts'));
});

//fe
gulp.task('copy', function() {
    gulp.src(path.copy, {base: app})
        .pipe(gulp.dest(destination));
});
gulp.task('pug', function(){
    gulp.src(app + 'index.pug')
        .pipe(pug({
            doctype: 'html'
        }))
        .pipe(gulp.dest(destination));
})
gulp.task('haml', function(){
    gulp.src(app + 'index.haml')
        .pipe(haml())
        .pipe(gulp.dest(destination));
})
gulp.task('js', function(){
	gulp.src(app + 'js/**/*.js')
        .pipe(concat({ path: 'app.js'}))
        .pipe(gulp.dest(destination + 'js'));
});
gulp.task('less', function () {
  	gulp.src(app + 'less/**/*.less')
        .pipe(plumber())
        .pipe(less(lessOptions))
        .pipe(concat('app.css'))
        // .pipe(minifyCSS())
        .pipe(gulp.dest(destination + 'css'));
});

gulp.task('sass', function () {
    gulp.src(app + 'sass/**/*.scss')
        .pipe(plumber())
        .pipe(sass())
        // .pipe(concat('app.css'))
        // .pipe(minifyCSS())
        .pipe(gulp.dest(destination + 'css'));
});

//server
gulp.task('reload', function () {
  gulp.src(path.watch)
    .pipe(connect.reload());
});
gulp.task('connect', function() {
  connect.server({ root: 'dist', livereload: true });
});
gulp.task('watch', function () {
  gulp.watch([app + 'index.html'], ['copy', 'less', 'reload']);
  gulp.watch([app + 'less/**/*.less'], ['less', 'reload']);
  gulp.watch([app + 'sass/**/*.scss'], ['sass', 'reload']);
  gulp.watch([app + 'js/**/*.js'], ['js', 'reload']);
});


gulp.task('init', ['clean', 'copy']);
gulp.task('vendor', ['vendorjs', 'vendorcss', 'vendorFonts']);
gulp.task('app', ['js', 'less']);
gulp.task('server', ['connect', 'watch']);

//default task
gulp.task('up', [
    'init',
    'vendor',
    'app',
    'server'
]);
