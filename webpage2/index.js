/**
 * Created by weijianli on 16/9/5.
 */
const http = require("http");
const util = require('util');
const proxyFun = require("./proxyFun");

const server = http.createServer((sreq, sres)=> {
  util.log(sreq.method +':' + sreq.url);
  proxyFun(sreq, sres);
});
server.listen(4000, "127.0.0.1", function () {
  console.log("开始监听" + server.address().port + "......");
});