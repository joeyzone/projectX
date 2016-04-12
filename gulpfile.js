var gulp = require('gulp'),
    _ = require("underscore"),
    crypto = require('crypto'),
    md5 = crypto.createHash('md5'),
    fs = require('fs'),
    through = require('through2'),
    replace = require('gulp-replace'),
    amdOptimize = require('amd-optimize'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    less = require('gulp-less'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    ejs=require('ejs');

var basePath = 'static/src/biz/',
    devPath = 'static/dev/',
    buildPath = 'static/build/',
    commonjsPath = 'static/src/common/*.js',
    commonlessPath = 'static/src/common/*.less',
    demoHtml = 'application/demo/**/*.html'
    mainDirArr = [],
    taskList = [];


function gulpjs(path,modName){
    var jspath = [path + '/*.js' , commonjsPath];

    return gulp.src(jspath)
        .pipe(amdOptimize('index'))
        .pipe(concat('index.js'))
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'))
        .pipe(rename(modName + '.js'))
        .pipe(gulp.dest(devPath))
        .pipe(uglify())
        .pipe(gulp.dest(buildPath));
}

function gulpcss(path,modName){
    return gulp.src(path + '/*.less')
    .pipe(less())
    .pipe(rename(modName + '.css'))
    .pipe(gulp.dest(devPath))
    .pipe(cleanCSS())
    .pipe(gulp.dest(buildPath));
}

(function(){
    mainDirArr = fs.readdirSync(basePath);
    _.each(mainDirArr, function(mainDir,k){
        var fullMaindir = basePath + mainDir;

        if(fs.statSync(fullMaindir).isDirectory()){

            var pageDirArr = fs.readdirSync(fullMaindir.toString());
            _.each(pageDirArr, function(pagedir){
                var fullPagedir = fullMaindir + '/' + pagedir;
                if(fs.statSync(fullPagedir).isDirectory()){

                    var jscssId = mainDir + '_' + pagedir;

                    taskList.push([fullPagedir,jscssId,mainDir,pagedir]);

                    gulp.task('js:' + jscssId, function(){
                        gulpjs(fullPagedir,jscssId);
                    });

                    gulp.task('css:' + jscssId, function(){
                        gulpcss(fullPagedir,jscssId);
                    });
                }
            });

        }
    })
})();

gulp.task('default', function(){
    console.error('plz input your task!!!')
});

gulp.task('all',['html'],function(){
    _.each(taskList,function(taskParam) {
        gulpjs(taskParam[0],taskParam[1]);
        gulpcss(taskParam[0],taskParam[1]);
    });
});

// ejs -> gulp
var getEjsStream=function(){
    return through.obj(function(file,env,callback){
        
        var content=file.contents.toString('utf8');
        
        try{
            
            var ejsResult=ejs.render(content,{
                filename:file.path
            });

            file.contents=new Buffer(ejsResult,'utf8');
            callback(null,file);    
        }catch(e){
            // 错误就停止编译
            
            callback(e,file);

            // ejs解析出错 先不停止 改造时需要
            // callback(null,file);

        }

    });
};


var getHtmlTask=function(dir,name,pageId){
    var htmlPath = 'application/demo/' + dir + '/' + name + '.html',
        cssPath = 'static/build/' + pageId + '.css',
        jsPath = 'static/build/' + pageId + '.js';

    return gulp.src(htmlPath)

    // ejs解析
    .pipe(getEjsStream())
    // 更新css,js,pageId
    .pipe(replace('@cssPath',cssPath))
    .pipe(replace('@jsPath',jsPath))
    .pipe(replace('@pageId',pageId))
    // 复制到html目录下
    .pipe(gulp.dest('application/html/' + dir))

};

gulp.task('html', function(){
    _.each(taskList,function(taskParam) {
        getHtmlTask(taskParam[2],taskParam[3],taskParam[1]);
    });
});

gulp.task('task', function(){
    console.log(taskList);
});

gulp.task('watch', function(){
    gulp.watch([basePath + '**/**/*',commonjsPath,commonlessPath,demoHtml],function(e){
        var start = e.path.indexOf('/biz') + 5,
            end = e.path.lastIndexOf('/'),
            patharr = e.path.slice(start,end).split('/'),
            path = patharr.join('/');
            modename = patharr.join('_');

        if(e.path.indexOf('.js') >= 0){
            gulpjs(basePath + path,modename);
        }else if(e.path.indexOf('.less') >= 0){
            gulpcss(basePath + path,modename);
        }else if(e.path.indexOf('.html') >= 0){
            var start = e.path.indexOf('/demo') + 6,
                end = e.path.lastIndexOf('.html'),
                patharr = e.path.slice(start,end).split('/'),
                path = patharr.join('/');
                modename = patharr.join('_');
            
            getHtmlTask(patharr[0],patharr[1],modename);
        }
        
    });
})

