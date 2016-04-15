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
    demoHtml = 'application/demo/**/*.html',
    commonFile = 'static/src/common/*',
    layoutFile = 'application/layout/*.html',   
    mainDirArr = [],
    pageIds = [],
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

                    pageIds.push(jscssId);

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
    gulp.watch([basePath + '**/**/*',commonjsPath,commonlessPath,demoHtml,commonFile,layoutFile],function(e){
        console.log(e.path + ' has changed');
        var start = e.path.indexOf('/biz') + 5,
            end = e.path.lastIndexOf('/'),
            patharr = e.path.slice(start,end).split('/'),
            path = patharr.join('/');
            modename = patharr.join('_');

        if(e.path.indexOf('/common/') >= 0 || e.path.indexOf('application/layout/') >= 0 ){
            _.each(taskList,function(taskParam) {
                getHtmlTask(taskParam[2],taskParam[3],taskParam[1]);
                gulpjs(taskParam[0],taskParam[1]);
                gulpcss(taskParam[0],taskParam[1]);
            });
            return;
        }
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
});


gulp.task('init-widget', function(){
    var conf = JSON.parse(fs.readFileSync('./widget-cf.json').toString());

    pageIds.map(function(pageId){
        var jsconcatfiles = [],
            cssconcatfiles = [];

        if(!conf[pageId]){
            return;
        }
        if(conf[pageId].widgets.js){
            conf[pageId].widgets.js.map(function(v){
                jsconcatfiles.push('static/widget/src/' + v);
            });
            gulp.src(jsconcatfiles)
            .pipe(concat(pageId + '.widget.js'))
            .pipe(gulp.dest('static/widget/build/'));
        }

        if(conf[pageId].widgets.css){
            conf[pageId].widgets.css.map(function(v){
                cssconcatfiles.push('static/widget/src/' + v);
            });

            gulp.src(cssconcatfiles)
            .pipe(concat(pageId + '.widget.css'))
            .pipe(gulp.dest('static/widget/build/'));
        }

    });

});


function widget(type){
    var inquirer = require('inquirer');

    var widgetPath = 'static/widget/src/',
        startdiv = new inquirer.Separator('= The Start ='),
        enddiv = new inquirer.Separator('= The End = \n'),
        pageIdsCh = [];

    pageIdsCh.push(startdiv);
    pageIdsCh = pageIdsCh.concat(pageIds);
    pageIdsCh.push(enddiv);
    inquirer.prompt([
        {
            type: 'list',
            message: 'Select pageId 选择要操作的pageId',
            name: 'pageId',
            choices: pageIdsCh,
            validate: function (answer) {
              if (answer.length < 1) {
                return '请选择一个pageId，或者按Crtl+C放弃执行';
              }
              return true;
            }
        }
    ])
    .then(function (answers) {
        chooseWidget(answers.pageId)
    });

    function chooseWidget(pageId){
        var files,
            hasConf = false,
            choicesW = [],
            conf;


        choicesW.push(startdiv);
        files = fs.readdirSync(widgetPath).filter(function(file){
            return file.indexOf('.' + type) >= 0;
        });

        conf = JSON.parse(fs.readFileSync('widget-cf.json').toString());
        files.map(function(v){
            if(!conf[pageId]){
                //没有配置
                var filesobj = {};
                filesobj.name = v;
                choicesW.push(filesobj);
                hasConf = false;
            }else{
                //有配置
                var widgets = conf[pageId].widgets,
                    ischecked;

                ischecked = _.indexOf(widgets[type],v) >= 0? true : false;
                var filesobj = {};
                filesobj.name = v;
                filesobj.checked = ischecked;
                choicesW.push(filesobj);
                hasConf = true;

            }
            
        });
        choicesW.push(enddiv);

        inquirer.prompt([
            {
                type: 'checkbox',
                message: 'Select widget 选择要为' + pageId + '打包的组件',
                name: type,
                choices: choicesW,
                validate: function (answer) {
                  if (answer.length < 1) {
                    return '请至少选择一个组件，或者按Crtl+C放弃执行';
                  }
                  return true;
                }
            }
        ])
        .then(function (answers) {
            var concatfiles = [];
            
            if(!conf[pageId]){
                conf[pageId] = {};
                conf[pageId].widgets = {};
            }

            conf[pageId].widgets[type] = answers[type];

            answers[type].map(function(v){
                concatfiles.push(widgetPath + v);

            });
            fs.writeFileSync('widget-cf.json' , JSON.stringify(conf, null, '  '));

            gulp.src(concatfiles)
            .pipe(concat(pageId + '.widget.' + type))
            .pipe(gulp.dest('static/widget/build/'));

        });
    }
}

gulp.task('js:widget',function(){
    widget('js');
});

gulp.task('css:widget',function(){
    widget('css');
});


