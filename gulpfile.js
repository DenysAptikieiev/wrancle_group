"use strict";
let project_folder = "dist";
let source_folder = "assets";
let fs = require('fs');

//========================== Объект с путями к файлам start ==============================
let path = {
    build: {
        html: project_folder + "/",
        css: project_folder + "/css/",
        js: project_folder + "/js/",
        img: project_folder + "/img/",
        fonts: project_folder + "/fonts/",
    },
    src: {
        html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder + "/scss/main.scss",
        js: source_folder + "/js/app.js",
        img: source_folder + "/img/**/*.{png,svg,jpg,gif,ico,webp}",
        fonts: source_folder + "/fonts/*.ttf",
    },
    watch: {
        html: source_folder + "/**/*.html",
        css: source_folder + "/scss/**/*.scss",
        js: source_folder + "/js/**/*.js",
        img: source_folder + "/img/**/*.{png,svg,jpg,gif,ico,webp}",
    },
    clean: "./" + project_folder + "/",
};
//========================== Объект с путями к файлам End =================================

//========================== Подключение Файлов Gulp Star =================================
let { src, dest } = require('gulp'),
    gulp = require('gulp'),
    browser_sync = require('browser-sync').create(),
    file_include = require('gulp-file-include'),
    del = require('del'),
    scss = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    groupe_media = require('gulp-group-css-media-queries'),
    clean_css = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    // uglify = require('gulp-uglify'),
    uglify_es = require('gulp-uglify-es').default(),
    babel = require('gulp-babel'),
    image_min = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webp_html = require('gulp-webp-html'),
    webp_css = require('gulp-webp-css'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter');
//========================== Подключение Файлов Gulp End ===================================

//========================== Перезагрузка Браузера после обнавления Файлов Star ============
function browserSync(params) {
    browser_sync.init({
        server: {
            baseDir: "./" + project_folder + "/",
        },
        port: 3000,
        notify: false,
    })
};
//========================== Перезагрузка Браузера после обнавления Файлов End ==============

//========================== обработка HTML Файлов Star =====================================
function html() {
    return src(path.src.html)
        .pipe(file_include())
        .pipe(webp_html())
        .pipe(dest(path.build.html))
        .pipe(browser_sync.stream())
};
//========================== обработка HTML Файлов End =======================================

//========================== обработка CSS Файлов Star =======================================
function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            }))
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true,
            }))
        .pipe(
            groupe_media()
        )
        .pipe(webp_css())
        .pipe(dest(path.build.css))
        .pipe(rename({
            extname: ".min.css"
        }))
        .pipe(
            clean_css()
        )
        .pipe(dest(path.build.css))
        .pipe(browser_sync.stream())
};
//========================== обработка CSS Файлов End ====================================

//========================== обработка JavaScript Файлов Star =====================================
function js() {
    return src(path.src.js)
        .pipe(file_include())
        .pipe(dest(path.build.js))
        .pipe(babel({
            presets: ['@babel/env']
        }))
        // .pipe(uglify())
        .pipe(uglify_es)
        .pipe(rename({ extname: ".min.js" }))
        .pipe(dest(path.build.js))
        .pipe(browser_sync.stream())
};
//========================== обработка JavaScript Файлов End =======================================

//========================== обработка img Файлов Star =====================================
function images() {
    return src(path.src.img)
    .pipe(webp({
        quality: 70,
    }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
        image_min({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false,
            }],
            interlaced: true,
            optimizationLevel: 5 //0 to 7 
        })
    )
    .pipe(dest(path.build.img))
    .pipe(browser_sync.stream())
};
//========================== обработка img Файлов End =======================================

//========================== Отслеживание Файлов Star ====================================
function watchFiles(params) {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], images)
}
//========================== Отслеживание Файлов End =====================================

//========================== обработка fonts otf Файлов Star ====================================
gulp.task('otf2ttf', function () {
    return src([source_folder + '/fonts/*.otf'])
    .pipe(fonter({
        formats: ['ttf']
    }))
    .pipe(dest([source_folder + '/fonts/']))
})
//========================== обработка fonts otf Файлов End =====================================

//========================== обработка fonts Файлов Star ====================================
function fonts(params) {
    src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
}
//========================== обработка fonts Файлов End ==================================

function fontsStyle() {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}


//========================== Удаление лишних Файлов Star==================================
function clean() {
    return del(path.clean);
};
//========================== Удаление лишних Файлов Star==================================

let build = gulp.series(clean, gulp.parallel(js, css, html, images, fonts), fontsStyle); //Порядок исполнения
let watch = gulp.parallel(build, watchFiles, browserSync); //Порядок исполнения

//========================== Експорт с перерменных и функций Start =======================
// exports.otf2ttf = otf2ttf;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;
//========================== Експорт с перерменных и функций End ==========================