/**
 * Created by weijianli on 16/9/6.
 */
//服务端请求配置
var server = {
    host:"127.0.0.1",
    port:10001
};

/**
 * 模板代理路由配置
 * key:path
 * value:html paht
 */
var proxyView = {
  "/laravel":"/views/laravel"
};

module.exports = {
  server,
  proxyView
};