# projectX

### 写在Elon Musk 的 SpaceX 火箭实现海上回收

整个工程并不复杂，主要由gulp控制打包。生成静态html。

并且有koa实现静态访问（今后html的ejs模板将由koa打包。而不是gulp）。用的requirejs作为前端模块化工具。less做css的预编译。

项目自动化程度很高，基于AMD的打包效果很不错，整个项目没有使用AMD依赖配置文件。

先安装node 

进入项目，执行

    npm intall

    gulp watch //监听html,js,css文件变化,暂不支持新增,新增请重新gulp watch或者使用其他命令

    node server.js

其他命令

    gulp js:pageId //pageId请在控制台查 举例：welcome_home

    gulp css:pageId //同上

    gulp html //打包html

    gulp all //打包所有


