# koa-session-store

[![Build Status](https://secure.travis-ci.org/hiddentao/koa-session-store.png)](http://travis-ci.org/hiddentao/koa-session-store) [![NPM module](https://badge.fury.io/js/koa-session-store.png)](https://npmjs.org/package/koa-session-store)

Session middleware for [Koa](https://github.com/koajs/koa) with a pluggable storage layer (for use with Mongo, Redis, etc.).
Based on [koa-session](https://github.com/koajs/session).

## Installation

```bash
npm install koa-session-store
```

## Usage

```js
var session = require('koa-session-store');
var koa = require('koa');

var app = koa();

app.keys = ['some secret key'];  // needed for cookie-signing

// cookie will be named "koa:sess" and session data will be stored in the cookie itself
app.use(session());

app.use(function(next){
  return function *(){
    var n = this.session.views || 0;
    this.session.views = ++n;
    this.body = n + ' views';
  }
})

app.listen(3000);
console.log('listening on port 3000');
```

To delete an existing session:

```js
this.session = null;
```

The following configuration options are available:

```js
app.use(session({
  name: 'mysite'    // cookie name
  store: <object instance> or "cookie"   // session storage layer - see below
  cookie: {
    // cookie configuration options - see below
  }
}));
```

The default cookie configuration options are set to:

```js
signed: true      // cookie is signed using KeyGrip
httpOnly: true    // cookie is not accessible via client-side JS
overwrite: true   // overwrite existing cookie datawhen setting cookie
```

For a full list of options see [the cookies module](https://github.com/jed/cookies#cookiesset-name--value---options--).

## Session storage layer

The `store` configuration option specifies where the session data is stored. If omitted or set to `"cookie"` then
session data will be stored in the cookie itself.

If you wish to store session data elsewhere (e.g. in Mongo, Redis, etc.) then you must set this to an object which
exposes the following API:

 * **load(sid)** - load session data for given session id
   * `sid` - _{String}_ session identifier.
   * returns a Promise, Thunk or generator which returns a JSON string of the session object data.

 * **save(sid, data)** - save session data for given session id
   * `sid` - _{String}_ session identifier.
   * `data` - _{String} session data converted to JSON string.
   * returns a Promise, Thunk or generator which returns once data is saved.

 * **remove(sid)** - remove session data for given session id
   * `sid` - _{String}_ session identifier.
   * returns a Promise, Thunk or generator which returns once removal is complete.


The following storage layers are currently available:

  * MongoDB - [koa-session-mongo](https://npmjs.org/package/koa-session-mongo)


## License

Copyright (c) 2013-2014 [Ramesh Nair](http://hiddentao.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
