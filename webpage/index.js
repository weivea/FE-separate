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
var http = require('http');
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

var proxyThunk = thunkify(proxy);

route.get('/webpage', function *(){
    //this.body = yield render('index');
    //var this_ = this;
    var re = yield proxyThunk(this);
    delete re.header['content-length'];
    delete re.header['content-type'];
    delete re.header['connection'];
    this.set(re.header);

    if(re.header.location){
        this.redirect(re.header.location);
    }
    else {
        var data = JSON.parse(re.data);
        this.body = yield render('index', data);
    }

});

route.get('/webpage/redirect', function *(){
    //this.body = yield render('index');
    //var this_ = this;
    var re = yield proxyThunk(this);
    delete re.header['content-length'];
    delete re.header['content-type'];
    delete re.header['connection'];
    this.set(re.header);

    if(re.header.location){
        this.redirect(re.header.location);
    }
    else{
        var data = JSON.parse(re.data);
        this.body = "哈哈啊哈，呵呵呵";
    }

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
app.listen('4000');

console.log('listening on port :4000');

var counter = 0;
var serverData ='';
function proxy(ctx, cb){
    counter++;
    var num = counter;
    var opt = {
        host:     '127.0.0.1',
        port:       5000,
        agent:    false,
        path:     getPath(ctx.req),
        method:   ctx.req.method,
        headers:  getHeader(ctx.req)
    };
    log('#%d\t%s http://%s%s', num, ctx.req.method, opt.host, opt.path);
    var req2 = http.request(opt, function (res2) {
        //console.log(res2);
        serverData = '';
        res2.on('data', function (chunk) {
            //console.log('BODY: ' + chunk);
            serverData += chunk;
        });
        res2.on('end', function() {
            cb(null,{data:serverData,header:res2.headers});
        })

    });
    if (/POST|PUT/i.test(ctx.req.method)) {
        ctx.req.pipe(req2);
    } else {
        req2.end();
    }
    req2.on('error', function (err) {
        log('#%d\tERROR: %s', num, err.stack);
        //res.end(err.stack);
    });
}



// 获取请求的headers，去掉host和connection
function getHeader (req) {
    var ret = {};
    for (var i in req.headers) {
        if (!/connection/i.test(i)) {
            ret[i] = req.headers[i];
        }
    }
    return ret;
}

// 获取请求的路径
function getPath(req) {
    var url = req.url;
    if (url.substr(0, 7).toLowerCase() === 'http://') {
        var i = url.indexOf('/', 7);
        if (i !== -1) {
            url = url.substr(i);
        }
    }
    return url;
}

// 记录日志
function log() {
    var now = new Date().toISOString();
    arguments[0] = '[' + now + '] ' + arguments[0];
    console.log.apply(console, arguments);
}