## 前后端分离

前言：
弄这个其实并不是有什么高大上的想法，只是觉得现在前端工作做得不太爽。遇到Python要怼Python模板，遇到PHP要怼PHP模板，遇到JAVA要怼JAVA模板。
一个公司里面搞这么多种后台？是的~
所以web前端就成了部门中的劳务输出，，今天跟phper玩儿，明天跟jsper玩儿，eclipse,phpstorm,PyCharm会完了，好牛逼，就是个切图滴~

咳咳。那些都是开玩笑的，咱们真正目的是前后端开发解耦，职责分离，这种高大尚的目的。
顺便把咱前端从劳务输出提升为业务承包的角色。

#### 一、要解决的问题
1. 套模板的忧桑，套各种模板，套各种后端下的模板。上线时常依赖后端（其实也有办法）。后端同学也觉得麻烦。
2. 调试，套完模板要调试。最好的办法就是吧后台环境也搭载自己的机器上，喝喝。后端同学改了点啥，你不懂一刷就报错，只有求人家后端同学，帮你一次还行，帮你一百次啊？
3. 代码复用问题，敢问a项目的模板你能拿到b项目来用吗？可以！copy过来：）a项目是php,b项目是JAVA，来呀，copy呀。小样~
4. 今天我跟后端的同学说，这个，这个，和这个页面，在后端渲染。其他的在前端渲染。后端同学心中默念，人丑多做怪，，，然后我说，要不你帮我做个bigpipe。后端同学：要啥？
要啥派？咱能不能好好把业务怼上去。别搞些有的没的~
5. 。。。。。。

#### 二、解决方案

上图：

![Alt 图片](img/liucheng.png)

为什么用nodejs,因为~我只会nodejs.
其实到这里，我要表达的差不多表达完了。

策略就是这么个策略，主要看怎么实现。
该解决方案，session，登录态什么的仍然是后端管理;
前端仍然只管理模板，只不过起了后台来管理模板；对后端来说，除了nginx配置改变几乎没有任何新的东西。


1、nginx配置：

```shell

#转发配置
  server {
    listen 80;
    server_name  proxy.xiaoying.com;
    #server_name _;

    #root   /Users/weijianli/Work/proxy-test/laravel/public;
    #index  index.php index.html index.htm;
    access_log  /usr/local/var/log/nginx/proxy.xiaoying.log  main;

    location ^~ / {
        #proxy_redirect off;
        proxy_pass_header X-CSRF-TOKEN;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_pass_header Set-Cookie;
        proxy_pass http://localhost:4000/;
        proxy_set_header X-Forwarded-Proto $scheme;
        #proxy_redirect http:// https://;
    }
    location /api/ {
        #proxy_redirect off;
        proxy_pass_header X-CSRF-TOKEN;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_pass_header Set-Cookie;
        proxy_pass http://localhost:5000/api/;
        proxy_set_header X-Forwarded-Proto $scheme;
        #proxy_redirect http:// https://;
    }

    location ^~ /api2/ {
        proxy_pass_header X-CSRF-TOKEN;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_pass_header Set-Cookie;
        proxy_pass http://proxy.xiaoying.com:10001/api2/;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
#laravel服务
server {
    listen 10001;
    server_name  proxy.xiaoying.com;

    root   /Users/weijianli/Work/proxy-test/laravel/public;
    index  index.php index.html index.htm;
    access_log  /usr/local/var/log/nginx/proxy10001.xiaoying.log  main;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php {
        fastcgi_pass 127.0.0.1:9000;
        try_files $uri /index.php = 404;
        fastcgi_param SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

2、web端的处理
思路：
![Alt 图片](img/webliucheng.png)

//这是在，web与server在同一台机器上的解决办法。

```javascript

//关键之处就是我们要正确合适的传递header内容，做一个nice的proxy
function proxy(ctx, cb){//ctx是http请求中的上下文，主要为获得其中的req
    var opt = {
        host:     127.0.0.1,
        port:     serverPort,
        agent:    false,
        path:     getPath(ctx.req),
        method:   ctx.req.method,
        headers:  getHeader(ctx.req)
    };
    log('#%d\t%s http://%s%s', num, ctx.req.method, opt.host, opt.path);
    var req2 = http.request(opt, function (res2) {
        //console.log(res2);
        var serverData = '';
        res2.on('data', function (chunk) {
            //console.log('BODY: ' + chunk);
            serverData += chunk;
        });
        res2.on('end', function() {
            //回调函数，拿到server端传来的数据，选染成你想要的样子，或是直接转发给浏览器，记得setHeader
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

```

//这是在，web与server可能不在同一台机器上时。

```javascript

//关键之处就是我们要正确合适的传递header内容，做一个nice的proxy
const template = require('art-template');
const http = require("http");
const url = require("url");
const util = require('util');
const buffertools = require('buffertools');
const proxyCfg = require('./proxyCfg');
template.config('cache', false);

/**
 * 模板代理方法
 * params:
 * sreq:服务请求实例
 * sres:服务返回实例
 *
 * */
function proxyFun(sreq, sres) {
  if(sreq.method == 'GET'){
    var url_parts = url.parse(sreq.url);
    var opts = {
      host: proxyCfg.server.host,
      port: proxyCfg.server.port,
      path: url_parts.path + (url_parts.hash || ''),
      headers: sreq.headers
    };
    var chunkBuffers = [];
    var re;
    var creq = http.get(opts, (cres) => {
      if (cres.statusCode != 200) {
        sres.writeHead(cres.statusCode, cres.headers);
        cres.pipe(sres);
      } else {
        cres.on('data', (chunk) => {
            chunkBuffers.push(chunk);
          })
          .on("end", function () {
            if(chunkBuffers.length ==0){
              re = '';
            } else if(chunkBuffers.length>1){
              re = buffertools.concat(...chunkBuffers).toString();
            }else {
              re = chunkBuffers[0].toString()
            }
            try{
              re = JSON.parse(re)
            }catch (e){
              util.log('data can`t be parsed:'+re);
              re = {err:1,str:'data can`t be parsed'};
            }
            delete cres.headers['connection'];
            delete cres.headers['content-type'];
            delete cres.headers['content-length'];
            sres.writeHead(cres.statusCode, cres.headers);
            if(re){
              sres.end(template(__dirname + proxyCfg.proxyView[url_parts.pathname],re));
            }else{
              sres.end('');
            }
          });
      }
    }).on('error', (e) => {
      util.log(`Got error: ${e.message}`);
      sres.writeHead(502, {'Content-Type': 'text/plain'});
      sres.end(JSON.stringify(e));
    });
    sreq.pipe(creq);
  }else {
    var err = `error request method: ${JSON.stringify(sreq)}`;
    util.log(err);
    sres.writeHead(405, {'Content-Type': 'text/plain'});
    sres.end(err);
  }
}

module.exports = proxyFun
```

3、server端的处理：
+ 不用套模板了；
+ 不用管理模板了；
+ 什么都是接口了。
+ 爽！！！


#### 三、实践样例
+ proxy.conf是nginx配置
+ /server为Server端项目
+ /webpage为web端项目

配置好nginx

```
    cd server
    npm install
    node index.js

    cd webpage2
    npm install
    ndoe index.js
```

浏览器访问http://proxy.test.com/webpage/

#### 四、未实践但是可以想象的，
我们这里测试的是一对一，即一个Server一个web(因为太穷只有一台电脑，硬盘有是有128G,装不起虚拟机~),其实「一对多」或是「多对一」或是「多对多」都是可以实现的，或者是一个web集群支持所有项目web页面。
例如多个重业务逻辑的Server可以公用一个web,web根据域名做vhost；
又或是业务集中型Server，面对不同对象想使用不同web。用这种『类代理』的方式感觉可以比较好的分离前后端工作流程，解前后端工作耦合。
##### 缺点：
- 多一层的性能损耗
- 对前端要求更高了
- 不适用于业务不大或不多的情况（因为根本没人愿意配合你搞）

#### 五、balabala

以上观点，是在阅读「midway 前后端分离的思考与实践」相关文章后结合自身的不爽的自我总结与部分实践。是比较初级的实践与想法。
欢迎大家来吐槽填坑:)，有新方案的一定要联系我QQ:550281353;招聘记得发红包至微信:weivea

#### ps:现已增加php-laravel作为服务端，请使用webpage2