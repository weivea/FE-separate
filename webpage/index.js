/**
 * Created by weijianli on 15/12/11.
 */

"use strict";
var serve = require('koa-static');
var koa = require('koa');
var app = koa();
var route = require('koa-router')();
var views = require('co-views');
var proxy = require('./module/proxy');



var fs = require('fs');
//var crt = ursa.createPublicKey(fs.readFileSync('./rsa-server.pub'));

//模板。静态资源
var render = views('views', {
    map: { html: 'ejs' }
});
app.use(serve('public'));

route.get('/**', function *(){
    var re = yield proxy(this);
    if(re.err == 1000){
        this.throw(405);
    }else if(re.res){
        //this.status = re.res.statusCode;
        re.res.pipe(this.response);
    }else {
        this.set(re.header);
        if(re.header.location){
            this.redirect(re.header.location);
        }
        else {
            var data = JSON.parse(re.data);
            this.body = yield render('index', data);
        }
    }
});


app.use(route.routes())
    .use(route.allowedMethods());
app.listen('4000');

console.log('listening on port :4000');

