const Koa = require('koa') // koa v2.x
const route = require('koa-route');
const app = new Koa();

var fs = require('fs'),
    ejs=require('ejs');

// 注册一个路由 get 方法 访问根目录下的任何一个文件
app.use(route.get('/application/html/:dir/:name', function*(dir,name) {
    this.body = fs.readFileSync(__dirname+'/application/html/' + dir+'/' + name).toString();

}));
 // 所有没有命中的路由
app.use(function *() {
    this.body = '404';
});


var server = app.listen(3000, function() {
    console.log('Koa is listening to http://localhost:3000');
});