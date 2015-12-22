/**
 * Created by weijianli on 15/12/11.
 */

"use strict";
var serve = require('koa-static');
var koa = require('koa');
var app = koa();
var route = require('koa-router')();
var parse = require('co-body');
var views = require('co-views');
var session = require('koa-session-store');
var thunkify = require('thunkify');
//var ursa = require('ursa');
var post = thunkify(require('request').post);

var fs = require('fs');
//var crt = ursa.createPublicKey(fs.readFileSync('./rsa-server.pub'));

//模板。静态资源
var render = views('views', {
    map: { html: 'ejs' }
});
app.use(serve('public'));

app.keys = ['some secret key'];
app.use(session());

//app.use(function *(next){
//    var n = this.session.views || 0;
//    this.session.views = ++n;
//    console.log(this.originalUrl);
//    this.body = {views:n};//n + ' views';
//    //this.body = n + ' views';
//});
route.get('/webpage', function *(){
    var n = this.session.views || 0;
    this.session.views = ++n;
    console.log(this.originalUrl);
    this.body = {views:n};//n + ' views';
    //this.body = n + ' views';
});

route.post('/api/test', function *(){
    this.body = {err:0,msg:'我是Server端，有个web端来请求我，我给了他个'+this.session.views+",你收到没？你刷新后该是"+(this.session.views+1)+"了！"};//n + ' views';
    //this.body = n + ' views';
});

//route.post('/api/getUpToken', function *(){
//    //this.body = yield render('index');
//    var params = yield parse(this);
//    var pageData = params.pageData;
//    var bucketName = 'weivea';
//    var folderName = 'thirdTest';
//    var formData = {pageData:pageData,bucketName:bucketName,folderName:folderName};
//    formData = crt.encrypt(JSON.stringify(formData), 'utf8', 'base64');
//    var re = yield post({url:"http://localhost:3000/thirdApi/ThirdInterface",form:{data:formData}})
//    this.body = JSON.parse(re[1]);
//
//});

app.use(route.routes())
    .use(route.allowedMethods());
app.listen('5000');

console.log('listening on port :5000');