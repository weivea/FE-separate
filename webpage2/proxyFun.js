/**
 * Created by weijianli on 16/9/6.
 */
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