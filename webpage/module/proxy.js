/**
 * Created by weijianli on 16/9/2.
 */
const http = require('http');
const util = require('util');
const url = require('url');
const thunkify = require('thunkify');

function proxy(ctx, cb){
  util.log(`${ctx.req.method}:${ctx.req.url}`);
  var serverData;
  var opt = {
    host:     '127.0.0.1',
    port:       5000,
    agent:    false,
    path:     getPath(ctx.req),
    method:   ctx.req.method,
    headers:  getHeader(ctx.req)
  };
  if(opt.method != "GET"){
    cb(null,{err:1000});
  }else{
    var req2 = http.request(opt, function (res2) {
      if(res2.statusCode != 200) {
        cb(null, {res: res2});
      }else{
        serverData = '';
        res2.on('data',  (chunk) => {
          serverData += chunk;
        });
        res2.on('end', () => {
          delete res2.headers['content-length'];
          delete res2.headers['content-type'];
          delete res2.headers['connection'];
          cb(null,{data:serverData,header:res2.headers});
        })
      }
    });
    req2.on('error', function (err) {
      util.log(ctx.req.path+':'+err.stack);
    });
    req2.end();
    //ctx.req.pipe(req2);
  }

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
  var urlObj = url.parse(req.url);
  return urlObj.path+(urlObj.hash || '');
}


module.exports = thunkify(proxy);