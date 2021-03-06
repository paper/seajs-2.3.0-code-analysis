/**
 * Sea.js 2.3.0 | seajs.org/LICENSE.md
 */
(function(global, undefined) {

// Avoid conflicting when `sea.js` is loaded multiple times
if (global.seajs) {
  return
}

var seajs = global.seajs = {
  // The current version of Sea.js being used
  version: "2.3.0"
}

var data = seajs.data = {}

// ---
/**
 * util-lang.js - The minimal language enhancement
 */

 
function isType(type) {
  return function(obj) {
    return {}.toString.call(obj) == "[object " + type + "]"
  }
}

var isObject = isType("Object")
var isString = isType("String")
// `Array.isArray` 原生判断，更快
var isArray = Array.isArray || isType("Array")
var isFunction = isType("Function")

// 自增id
var _cid = 0
function cid() {
  return _cid++
}

// ---
/**
 * util-events.js - The minimal events support
 */

var events = data.events = {}

// Bind event  
// 每一个事件名，都是一个数组，可以“绑定” 多个函数  
// 有点“中间件”的概念  
// example:
// ```
// seajs.on("paper", function(){ console.log("hello paper"); });
// =>
// events = {
//  "paper" : [ function(){ console.log("hello paper"); } ]
// }
// ```
seajs.on = function(name, callback) {
  var list = events[name] || (events[name] = [])
  list.push(callback)
  return seajs
}

// ---
// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
// 
// ```
// seajs.off("paper"); //移除 paper  里面的所有函数
// seajs.off();        //移除 events 里面所有的名称和对应的函数（清空）
// ```
seajs.off = function(name, callback) {
  // Remove *all* events  
  // 或许 这样更好理解  
  // ```
  // if (!name && !callback){} //If `event` and `callback` are both undefined
  // ```
  if (!(name || callback)) {
    events = data.events = {}
    return seajs
  }

  var list = events[name]
  if (list) {
    if (callback) {
    
    // 从 list 后面开始一一核对 callback
    // 这里比较有趣~~
    //   
    // 大家可以先考虑一下传统写法：
    // ```
    // for (var i = 0, len = list.length; i < len; i++) {
    //  if (list[i] === callback) {
    //    list.splice(i, 1)
    //  }
    // }
    // ```
    // 这样写可不可以？？
    //  
    // 是不可以的，因为 splice 会改变list的长度。举个例子，就明白了。
    //   
    // example:
    // ```
    // list = ['a','b','c','d','e'];
    // callback = "c";
    // ```
    //  
    // 1. 从前面开始，当 i=2 时，移除 "c"，list 变为 ['a','b','d','e'];  
    // i++ 后，变成 3，跳过 "d"，直接判断 "e"了。
    // 2. 从后面开始，当 i=2 时，移除 "c"，list 变为 ['a','b','d','e'];  
    // i-- 后，变成 1，继续判断 "b"。
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i] === callback) {
          list.splice(i, 1)
        }
      }
    }
    else {
      delete events[name]
    }
  }

  return seajs
}

// ---
// Emit event, firing all bound callbacks. Callbacks receive the same  
// arguments as `emit` does, apart from the event name  
// 运行 events[name] 列表里面的每一个函数  
// data 作为每一个函数的参数(一般都是对象)
var emit = seajs.emit = function(name, data) {
	// 这个 `fn` 干嘛的？github上3.0.0 去掉了，估计是笔误
  var list = events[name], fn

  if (list) {
    // Copy callback lists to prevent modification
    list = list.slice()

    // Execute event callbacks, use index because it's the faster.
    /* use index because it's the faster ??? */
    for(var i = 0, len = list.length; i < len; i++) {
      list[i](data)
    }
  }

  return seajs
}

// ---
/**
 * util-path.js - The utilities for operating path such as id, uri
 */


// 除了问号和hash的任何字符 连接 `/`    
// 比如：`abc/` 或者 `/`
var DIRNAME_RE = /[^?#]*\//

// `/./`   
// `realpath`函数会用 `/` 替换它
var DOT_RE = /\/\.\//g

// `/` 连接 除了`/`的任何字符 连接 `/../`   
// 比如：`/abc/../`    
// 其实就是 `/` 。因为进入abc又出来了，看后面`realpath`函数就知道了要替换掉
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//

// 除了`:`和`/` 的任何字符(捕获) 连接 1个或多个`/` 连接 `/`
// 比如：`a///`       
// `realpath` 函数会把它变成 `a/`
var MULTI_SLASH_RE = /([^:/])\/+\//g

// ---
// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
function dirname(path) {
  return path.match(DIRNAME_RE)[0]
}

// ---
// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
function realpath(path) {
  // `/a/b/./c/./d` ==> `/a/b/c/d`
  path = path.replace(DOT_RE, "/")

  /*
    @author wh1100717
    a//b/c ==> a/b/c
    a///b/////c ==> a/b/c
    DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
  */
  path = path.replace(MULTI_SLASH_RE, "$1/")

  // `a/b/c/../../d`  =>  `a/b/../d`  =>  `a/d`  
  // 循环替换 `/c/../` 这种结构，直到 `match` 找不到
  while (path.match(DOUBLE_DOT_RE)) {
    path = path.replace(DOUBLE_DOT_RE, "/")
  }

  return path
}

// ---
// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// NOTICE: substring is faster than negative slice and RegExp
function normalize(path) {
  var last = path.length - 1
  var lastC = path.charAt(last)

  // If the uri ends with `#`, just return it without '#'
  if (lastC === "#") {
    return path.substring(0, last)
  }

  return (path.substring(last - 2) === ".js" ||
      path.indexOf("?") > 0 ||
      lastC === "/") ? path : path + ".js"
}

// 匹配(捕获) 开头 除了`/` `:` 的字符 连接 `/` 和任意字符 结束  
// 比如：`abc/d`
var PATHS_RE = /^([^/:]+)(\/.+)$/

// 匹配(捕获) `{}` 里面的除了 `{` 的任意字符
var VARS_RE = /{([^{]+)}/g

// ---
// 解析别名  
// @id 如果在 `data.alias[id]` 里面 就返回对应的数据，否者返回 `id`  
// 下面 parse的几个函数 具体请搜索 `id2Uri` 是如何调用的  
function parseAlias(id) {
  var alias = data.alias
  return alias && isString(alias[id]) ? alias[id] : id
}

// ---
// 前提：这里的 @id 是经过 `parseAlias` 先解析过一遍的  
// example: 
// ```
// seajs.config({   
//    paths: {  
//      'arale': 'https://a.alipayobjects.com/arale'  
//    },  
//    alias: {  
//      'class': 'arale/class/1.0.0/class'  
//    }  
// });  
// id = 'class'  
// id = parseAlias(id)  
// => id = 'arale/class/1.0.0/class'  
// m = id.match(PATHS_RE)  
// => m = ["arale/class/1.0.0/class", "arale", "/class/1.0.0/class"]  
// id = paths[m[1]] + m[2]  
// => 'https://a.alipayobjects.com/arale' + '/class/1.0.0/class'  
// => 'https://a.alipayobjects.com/arale/class/1.0.0/class'
// ```
function parsePaths(id) {
  var paths = data.paths
  var m

  if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
    id = paths[m[1]] + m[2]
  }

  return id
}

// ---
// 前提：这里的 @id 是经过 parsePaths 先解析过一遍的 
// ```
// seajs.config({
//  vars: {
//    'locale': 'zh-cn'
//  }
// });
// ```
// 把字符串里面的大括号里面的数据替换
// 比如：
// ```
// lang = require('./i18n/{locale}.js'); => 
// lang = require('./i18n/zh-cn.js');
// ```
// 怎么来的呢？
// parseVars => id2Uri => seajs.resolve => Module.resolve => seajs.require
function parseVars(id) {
  var vars = data.vars

  if (vars && id.indexOf("{") > -1) {
    id = id.replace(VARS_RE, function(m, key) {
      return isString(vars[key]) ? vars[key] : m
    })
  }

  return id
}


// 正则解析： 开头为 `//` 连接 任意字符 或者 `:/`  
// 也就是说 在 `uri` 里面找到了 `//` 开头的，或者 `:/` ，就可以判断是绝对路径了。  
// 比如：`//abc.com/` 或者 `http://abc.com/`

var ABSOLUTE_RE = /^\/\/.|:\//


// 正则解析： 开头是任何一个字符(0个或多个，而且可有可无) 连接 // 连接 任何一个字符(0个或多个，而且可有可无) 连接 /  
// 取出 `uri` 的根目录，比如 ：
// ```
// "https://github.com/seajs/seajs/issues/262".match(ROOT_DIR_RE)
// =>
// ["https://github.com/"]
// ```

var ROOT_DIR_RE = /^.*?\/\/.*?\//

// ---
// 前提：这里的 @id 是经过 normalize 先解析过一遍的  
// 官方说（https://github.com/seajs/seajs/issues/262）  
// Sea.js 在解析顶级标识时，会相对 base 路径来解析。详情请参阅 模块标识  
// 注意：一般请不要配置 base 路径，把 sea.js 放在合适的路径往往更简单一致。  
function addBase(id, refUri) {
  var ret
  var first = id.charAt(0)

  // Absolute（绝对路径）   
  // 那么就不存在添加什么 base 路径了  
  if (ABSOLUTE_RE.test(id)) {
    ret = id
  }
  // Relative（相对路径）    
  // 如果引入了 refUri，使用 refUri 的 dirname(refUri) 添加到 id 的前面，并使用 realpath 过滤一下  
  // 如果没有引入 refUri ，就使用 cwd 添加到 id 的前面，并使用 realpath 过滤一下  
  else if (first === ".") {
    ret = realpath((refUri ? dirname(refUri) : data.cwd) + id)
  }
  
  // Root（根目录）  
  // 首先得到 cwd 的根目录  
  // 如果有，就 和 id 连接，  
  // 如果没有(因为cwd有可能为空字符串)，就直接返回id  
  else if (first === "/") {
    var m = data.cwd.match(ROOT_DIR_RE)
    ret = m ? m[0] + id.substring(1) : id
  }
  // Top-level  
  // 除了前面的各种情况，才会用到你定义的 base，看来 base 要用上还挺不容易的  
  else {
    ret = data.base + id
  }

  // Add default protocol when uri begins with "//"
  if (ret.indexOf("//") === 0) {
    ret = location.protocol + ret
  }

  return ret
}

// ---
// 说明：@uri 之前先运行的是 addBase 返回的  
// 该配置可对模块路径进行映射修改，可用于路径转换、在线调试等  
// (https://github.com/seajs/seajs/issues/262)  
// 看了源码之后，发现rule原来还可以写函数。  
// 比如：
// ```
// seajs.config({
//  map: [
//    function(uri){
//      return '/test/' + uri;
//    }
//  ]
// });
// ```
function parseMap(uri) {
  var map = data.map
  var ret = uri

  if (map) {
    for (var i = 0, len = map.length; i < len; i++) {
      var rule = map[i]

      ret = isFunction(rule) ?
          (rule(uri) || uri) :
          uri.replace(rule[0], rule[1])

      // Only apply the first matched rule
      // 只要发现 uri 变化了，立即退出
      if (ret !== uri) break
    }
  }

  return ret
}

function id2Uri(id, refUri) {
  if (!id) return ""

  id = parseAlias(id)
  id = parsePaths(id)
  id = parseVars(id)
  id = normalize(id)

  var uri = addBase(id, refUri)
  uri = parseMap(uri)

  return uri
}


var doc = document


// 当前的工作目录，说明一下 `cwd` 为 "" 的情况：  
// 
// `!location.href` 为 `true`
// 说明 `location.href` 取不到，不是浏览器环境。直接跳出，不会判断后面的，`cwd = ""`  
//  
// `!location.href` 为 `false`，判断后面的  
// `location.href.indexOf('about:') === 0` 为 `true`  
// 说明 `location.href` 极有可能进入了 空页面（about:blank），`cwd = ""`  
//  
// PS：吐槽一下，进入了about:开头的页面，还有可能引入得了 seajs？？
var cwd = (!location.href || location.href.indexOf('about:') === 0) ? '' : dirname(location.href)

// 运行到 seajs 时，获取当前的 “全部” 脚本，也就是说，最后一个肯定是 seajs  
// 这个技巧 在 loaderScript 获取上有体现  
// 所以 玉伯 推荐 给引入 seajs 的 script 加上 "seajsnode" id  
var scripts = doc.scripts

// Recommend to add `seajsnode` id for the `sea.js` script element
// ref : https://github.com/seajs/seajs/issues/260
var loaderScript = doc.getElementById("seajsnode") ||
    scripts[scripts.length - 1]

// When `sea.js` is inline, set loaderDir to current working directory
var loaderDir = dirname(getScriptAbsoluteSrc(loaderScript) || cwd)

function getScriptAbsoluteSrc(node) {
  return node.hasAttribute ? // non-IE6/7
      node.src :
    // see http://msdn.microsoft.com/en-us/library/ms536429(VS.85).aspx
      node.getAttribute("src", 4)
}


// For Developers
// 暴露出去 :D
seajs.resolve = id2Uri

// ---
/**
 * util-request.js - The utilities for requesting script and style files
 * ref: tests/research/load-js-css/test.html
 */

var head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement
var baseElement = head.getElementsByTagName("base")[0]

var currentlyAddingScript
var interactiveScript

function request(url, callback, charset) {
  var node = doc.createElement("script")

  if (charset) {
    var cs = isFunction(charset) ? charset(url) : charset
    if (cs) {
      node.charset = cs
    }
  }

  addOnload(node, callback, url)
  
  // async，HTML5中的script属性  
  // 脚本会相对于文档的其余部分异步执行，这样脚本会可以在页面继续解析的过程中来执行
  node.async = true
  node.src = url

  // For some cache cases in IE 6-8, the script executes IMMEDIATELY after
  // the end of the insert execution, so use `currentlyAddingScript` to
  // hold current node, for deriving url in `define` call
  currentlyAddingScript = node

  // ref: #185 & http://dev.jquery.com/ticket/2709  
  // IE6的一个bug :(
  baseElement ?
      head.insertBefore(node, baseElement) :
      head.appendChild(node)

  currentlyAddingScript = null
}

// 动态加载脚本，加载完毕后，触发 `@callback`
function addOnload(node, callback, url) {
  var supportOnload = "onload" in node

  if (supportOnload) {
    node.onload = onload
    node.onerror = function() {
      emit("error", { uri: url, node: node })
      onload()
    }
  }
  else {
    node.onreadystatechange = function() {
      if (/loaded|complete/.test(node.readyState)) {
        onload()
      }
    }
  }

  function onload() {
    // Ensure only run once and handle memory leak in IE  
    // 确保只允许一次，处理IE的内存泄漏
    node.onload = node.onerror = node.onreadystatechange = null

    // Remove the script to reduce memory leak  
    // 如果 debug 设置为 true ，就不会删除 动态插入的script标签  
    // https://github.com/seajs/seajs/issues/262  
    if (!data.debug) {
      head.removeChild(node)
    }

    // Dereference the node
    node = null

    callback()
  }
}

// 获取当前，正在请求的脚本
function getCurrentScript() {
  if (currentlyAddingScript) {
    return currentlyAddingScript
  }

  // For IE6-9 browsers, the script onload event may not fire right
  // after the script is evaluated. Kris Zyp found that it
  // could query the script nodes and the one that is in "interactive"
  // mode indicates the current script
  // ref: http://goo.gl/JHfFW
  if (interactiveScript && interactiveScript.readyState === "interactive") {
    return interactiveScript
  }

  var scripts = head.getElementsByTagName("script")

  for (var i = scripts.length - 1; i >= 0; i--) {
    var script = scripts[i]
    if (script.readyState === "interactive") {
      interactiveScript = script
      return interactiveScript
    }
  }
}


// For Developers
seajs.request = request

// ---
/**
 * util-deps.js - The parser for dependencies
 * ref: tests/research/parse-dependencies/test.html
 */

// `"(?:\\"|[^"])*"`    
// (非捕获) 获取 双引号 里面的内容
//  
// `'(?:\\'|[^'])*'`    
// (非捕获) 获取 单引号 里面的内容
//  
// `\/\*[\S\s]*?\*\/`    
// 获取 多行注释	里面的内容
//  
// `\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])`   
// (非捕获) 获取正则表达式里面的内容
//  
// `\/\/.*`    
// 获取单行注释 内容
//  
// `\.\s*require`  
// 获取  .require
//   
// `(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)`  
// (捕获) 获取  require("任何字符") 或者 require('任何字符')
var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g


// 双斜杠
var SLASH_RE = /\\\\/g


// 解析依赖  
// 通过解析 `code` 源码，找出 `require` 的内容，然后存到 `deps` 里面。
// module.dependencies
function parseDependencies(code) {
  var ret = []

  code.replace(SLASH_RE, "")
      .replace(REQUIRE_RE, function(m, m1, m2) {
        
        /*-------------------------------------------------------
          console.log(m);
          console.log(m1);
          console.log(m2);
          大家通过这样查看，可以知道这个函数做了什么
        ---------------------------------------------------------*/
        
        if (m2) {
          ret.push(m2)
        }
      })

  return ret
}

// ---
// seajs 最复杂的地方
/**
 * module.js - The core of module loader
 */

var cachedMods = seajs.cache = {}
var anonymousMeta

var fetchingList = {}
var fetchedList = {}
var callbackList = {}

// 模块状态码
var STATUS = Module.STATUS = {
  // 1 - The `module.uri` is being fetched
  // 正在获取中。。。
  FETCHING: 1,
  
  // 2 - The meta data has been saved to cachedMods
  // 基本数据已经保存到 缓存模块里面了
  SAVED: 2,
  
  // 3 - The `module.dependencies` are being loaded
  // 模块依赖 正在加载中。。。
  LOADING: 3,
  
  // 4 - The module are ready to execute
  // 模块解析完毕
  LOADED: 4,
  
  // 5 - The module is being executed
  // 模块正在执行中
  EXECUTING: 5,
  
  // 6 - The `module.exports` is available
  // module.exports 是可用的
  EXECUTED: 6
}

// 模块对象  
// `@uri` 模块的路径，唯一标识符  
// `@deps` 模块的依赖
function Module(uri, deps) {
  this.uri = uri
  this.dependencies = deps || []
  this.exports = null
  this.status = 0

  // Who depends on me  
  // 有多少个依赖模块需要等“我”（应该是本mod）加载完毕
  // 比如 "A" 模块 依赖 "$"，如果 "A"没有加载完毕， 那么 $._waitings["A"] = 1
  this._waitings = {}

  // The number of unloaded dependencies  
  // 没有加载依赖的个数
  this._remain = 0
}

// Resolve module.dependencies  
// 把依赖的简称( 代码里面require里面的字符串 ) 变成 真实的js路径
Module.prototype.resolve = function() {
  var mod = this
  var ids = mod.dependencies
  var uris = []

  for (var i = 0, len = ids.length; i < len; i++) {
    uris[i] = Module.resolve(ids[i], mod.uri)
  }
  return uris
}

// Load module.dependencies and fire onload when all done  
// 模块加载阶段，只有当模块里面的依赖全部加载完毕了，才能触发onload事件
//   
// 当一个模块A里面含有 require("b"); require("c");  
// 肯定是要等加载完 b 和 c 这两个模块，才能做A的事情
Module.prototype.load = function() {
  var mod = this

  // If the module is being loaded, just wait it onload call
  if (mod.status >= STATUS.LOADING) {
    return
  }

  mod.status = STATUS.LOADING

  // Emit `load` event for plugins such as combo plugin  
  // 为开发插件做准备。插件可以自定义 seajs.on("load", callback);  
  // 比如 combo 插件，把uri拼在一起，节省http请求  
  //  
  // 当使用 `seajs.use` 时，`uris` 包括前面的 `ids` 
  // 所以即使 `use` 一个模块，而且模块不依赖任何其他模块时，`_remain` 也为 1
  var uris = mod.resolve()
  emit("load", uris)
  
  // 依赖模块的个数（包括它自己的uri）
  var len = mod._remain = uris.length
  var m

  // Initialize modules and register waitings
  for (var i = 0; i < len; i++) {
    // 得到需要依赖的 `uris[i]` 对应的模块，如果`cachedMods`缓存里面有，就拿缓存的  
    // 如果没有，就调用 `new Module(uri, deps)` 来获取，并存入`cachedMods`中
    m = Module.get(uris[i])
    
    // 如果 m 模块没有加载完毕
    if (m.status < STATUS.LOADED) {
      // Maybe duplicate: When module has dupliate dependency, it should be it's count, not 1  
      // 如果 mod.uri 等待数已经存在(说明并发了)，那么再加 1
      m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
    }
    // 加载完毕了，剩余依赖模块减 1
    else {
      mod._remain--
    }
  }
  
  // 如果依赖全部加载解析完毕，就调用onload事件
  if (mod._remain === 0) {
    mod.onload()
    return
  }

  // Begin parallel loading  
  // 开始并行加载模块
  var requestCache = {}

  for (i = 0; i < len; i++) {
    m = cachedMods[uris[i]]

    if (m.status < STATUS.FETCHING) {
      // requestCache 对象引用传入 fetch
      m.fetch(requestCache)
    }
    else if (m.status === STATUS.SAVED) {
      m.load()
    }
  }

  // Send all requests at last to avoid cache bug in IE6-9. Issues#808  
  // 通过 `fetch` 函数，把请求函数 `sendRequest` 放入到对应的 `requestCache[requestUri]` 中  
  // 然后运行，进行脚本获取（就是运行 seajs.request）
  for (var requestUri in requestCache) {
    if (requestCache.hasOwnProperty(requestUri)) {
      requestCache[requestUri]()
    }
  }
}

// Call this method when module is loaded   
// 当模块完全加载完毕时，会调用这个方法  
// 就是楼上的 `if (mod._remain === 0)`
Module.prototype.onload = function() {
  var mod = this
  mod.status = STATUS.LOADED
  
  // 为 `Module.use` 准备的  
  // 模块加载完毕后，就可以调用 `callback` 函数，进行回调了
  if (mod.callback) {
    mod.callback()
  }

  // Notify waiting modules to fire onload
  // 通知等待的模块（依赖mod模块的模块）
  var waitings = mod._waitings
  var uri, m

  for (uri in waitings) {
    if (waitings.hasOwnProperty(uri)) {
      m = cachedMods[uri]
      
      // 1. mod 是 m 的全部依赖模块之一（或唯一）
      // 2. mod._waitings[m] 的种类（就是说 mod 是各种各样 m 依赖的模块），应该和 m._remain 的值一样 
      // 3. mod 加载完毕后，通知 m，我加载完毕了，你的 _remain 可以减去 mod._waitings[m] 的 waitings 值
      // 4. 如果发现 _remain == 0，说明 m 的依赖就全部加载完毕了。
      // 5. 那么 m 也可以说算是真正的 onload 的了。就可以执行了（exec）
      m._remain -= waitings[uri]
      if (m._remain === 0) {
        m.onload()
      }
    }
  }

  // Reduce memory taken  
  // 删除不必要的属性，减少内存
  delete mod._waitings
  delete mod._remain
}

// Fetch a module (获取一个模块)  
// 吐槽：获取这个函数，怎么不放在第一位？应该按照 status 的顺序来写函数啊
Module.prototype.fetch = function(requestCache) {
  var mod = this
  var uri = mod.uri

  mod.status = STATUS.FETCHING

  // Emit `fetch` event for plugins such as combo plugin
  var emitData = { uri: uri }
  emit("fetch", emitData)
  // 如果插件使用了 `requestUri` ，那么就覆盖原来的 `uri`
  var requestUri = emitData.requestUri || uri

  // Empty uri or a non-CMD module  
  // 错误的 `requestUri` 或者这个 `requestUri` 已经获取成功了
  if (!requestUri || fetchedList[requestUri]) {
    mod.load()
    return
  }
  
  // 如果已经获取过了这个 requestUri  
  // 就直接
  if (fetchingList[requestUri]) {
    callbackList[requestUri].push(mod)
    return
  }

  fetchingList[requestUri] = true
  callbackList[requestUri] = [mod]

  // Emit `request` event for plugins such as text plugin
  emit("request", emitData = {
    uri: uri,
    requestUri: requestUri,
    onRequest: onRequest,
    charset: data.charset
  })
  
  // 如果插件设置 `requested` 属性为 `true` ，就pass
  if (!emitData.requested) {
    // 就目前来看 `requestCache` 永远为 `true`
    requestCache ?
        requestCache[emitData.requestUri] = sendRequest :
        sendRequest()
  }
  
  // 发送请求
  function sendRequest() {
    seajs.request(emitData.requestUri, emitData.onRequest, emitData.charset)
  }
  
  // 发送完请求，动态加载完脚本后，就会运行这个函数
  function onRequest() {
    delete fetchingList[requestUri]
    fetchedList[requestUri] = true

    // Save meta data of anonymous module  
    // 把 `define` 函数里面的 `anonymousMeta`数据（如果有）就save起来
    if (anonymousMeta) {
      Module.save(uri, anonymousMeta)
      anonymousMeta = null
    }

    // Call callbacks  
    // 逐个运行放入请求列表里面的模块的load方法
    var m, mods = callbackList[requestUri]
    delete callbackList[requestUri]
    while ((m = mods.shift())) m.load()
  }
}

// Execute a module (执行一个模块)
Module.prototype.exec = function () {
  var mod = this

  // When module is executed, DO NOT execute it again. When module
  // is being executed, just return `module.exports` too, for avoiding
  // circularly calling
  if (mod.status >= STATUS.EXECUTING) {
    return mod.exports
  }
  
  // 设置 状态 ： 正在解析中。。。  
  // 避免重复运行 exec，导致循环调用
  mod.status = STATUS.EXECUTING

  // Create require
  var uri = mod.uri
  
  // define 里面 factory 的参数 require 有哪些功能  
  // 看这里就知道了
  function require(id) {
    return Module.get(require.resolve(id)).exec()
  }

  require.resolve = function(id) {
    return Module.resolve(id, uri)
  }

  require.async = function(ids, callback) {
    Module.use(ids, callback, uri + "_async_" + cid())
    return require
  }

  // Exec factory
  // 
  // `mod.factory`    
  // 这里的 `factory` 是来自 `Module.define` 里面定义的 `factory`，  
  // 经过 `Module.save` 存储起来的
  var factory = mod.factory
  
  // 运行`factory`，把运行结果给 `exports`  
  // 第二个参数 `exports` 是一个对象，并且 `mod.exports` 是另外一个引用  
  var exports = isFunction(factory) ?
      factory(require, mod.exports = {}, mod) :
      factory
  
  
  // 如果 `factory` 没有使用`return` ，用的是 `module.expotrs = fn`;  
  // 因为 `mod.exports` 是 `factory`第2个参数`exports`的一个引用，  
  // 所以可以得到 `module.expotrs` 的值  
  // 那么也就相当于 `return fn;`
  if (exports === undefined) {
    exports = mod.exports
  }

  // Reduce memory leak  
  // 得到结果后，就可以删除函数了，免得占内存
  delete mod.factory

  mod.exports = exports
  mod.status = STATUS.EXECUTED

  // Emit `exec` event
  emit("exec", mod)

  return exports
}

// Resolve id to uri
Module.resolve = function(id, refUri) {
  // Emit `resolve` event for plugins such as text plugin
  var emitData = { id: id, refUri: refUri }
  emit("resolve", emitData)
  
  return emitData.uri || seajs.resolve(emitData.id, refUri)
}

// Define a module (定义一个模块)
Module.define = function (id, deps, factory) {
  var argsLen = arguments.length

  // define(factory)  
  // 大部分是这种情况
  if (argsLen === 1) {
    factory = id
    id = undefined
  }
  else if (argsLen === 2) {
    factory = deps

    // define(deps, factory)
    if (isArray(id)) {
      deps = id
      id = undefined
    }
    // define(id, factory)
    else {
      deps = undefined
    }
  }

  // Parse dependencies according to the module factory code  
  // 函数 经过 `toString()` ，变成字符串，通过`parseDependencies`解析字符串，得到依赖
  if (!isArray(deps) && isFunction(factory)) {
    deps = parseDependencies(factory.toString())
  }
  
  // 得到基本元数据
  var meta = {
    id: id,
    uri: Module.resolve(id),
    deps: deps,
    factory: factory
  }

  // Try to derive uri in IE6-9 for anonymous modul es
  if (!meta.uri && doc.attachEvent) {
    var script = getCurrentScript()

    if (script) {
      meta.uri = script.src
    }

    // NOTE: If the id-deriving methods above is failed, then falls back
    // to use onload event to get the uri
  }

  // Emit `define` event, used in nocache plugin, seajs node version etc
  emit("define", meta)
  
  // save 
  meta.uri ? Module.save(meta.uri, meta) :
      // Save information for "saving" work in the script onload event
      anonymousMeta = meta
}

// Save meta data to cachedMods (存储 元数据 到 缓存模块)
Module.save = function(uri, meta) {
  var mod = Module.get(uri)

  // Do NOT override already saved modules  
  // 不覆盖已经被存储的 模块  
  // 如果 `mod` 是新的，就存储数据。如果发现`mod`已经存在，就pass
  if (mod.status < STATUS.SAVED) {
    mod.id = meta.id || uri
    mod.dependencies = meta.deps || []
    mod.factory = meta.factory
    mod.status = STATUS.SAVED

    emit("save", mod)
  }
}

// Get an existed module or create a new one  
// 如果 uri 已经在缓存里面，就取缓存  
// 如果没有，就创建新的  
Module.get = function(uri, deps) {
  return cachedMods[uri] || (cachedMods[uri] = new Module(uri, deps))
}

// Use function is equal to load a anonymous module  
// use 方法，其实就是加载一个匿名模块  
// ```
// seajs.use("jq", function($){
//  // $ 就是 jq
// });
// ```
// 1. 先把 "jq" 变成 ["jq"]; 如果本身就是数组，就不变
// 2. 得到依赖后，逐个执行（exec）
// 3. `callback` 里面的参数 `exports` 就变成了真正的模块
Module.use = function (ids, callback, uri) {
  // 当 `seajs.use` 或者 `require.async` 运行时，`mod` 永远都是最新的模块  
  // 因为 `uri` 是自增的，永不重复的地址
  var mod = Module.get(uri, isArray(ids) ? ids : [ids])
  
  /*
    Module.prototype.onload 里面有一段：
    
    if (mod.callback) {
      mod.callback()
    }
  */
  mod.callback = function() {
    var exports = []
    var uris = mod.resolve()

    for (var i = 0, len = uris.length; i < len; i++) {
      exports[i] = cachedMods[uris[i]].exec()
    }

    if (callback) {
      callback.apply(global, exports)
    }

    delete mod.callback
  }
  
  // 等用户 `use` 的时候，才开始按需加载模块
  mod.load()
}


// Public API  
seajs.use = function(ids, callback) {
  // `uri` 是自增长的地址，而且不是脚本，所以把 `ids` 作为依赖进行加载
  Module.use(ids, callback, data.cwd + "_use_" + cid())
  return seajs
}

// 这个 cmd 有什么用处？仅仅为了让 define.cmd 为 true？
Module.define.cmd = {}
global.define = Module.define


// For Developers

seajs.Module = Module
data.fetchedList = fetchedList

data.cid = cid

// 和 `define` 里面的 `require` 方法差不多
seajs.require = function(id) {
  var mod = Module.get(Module.resolve(id))
  if (mod.status < STATUS.EXECUTING) {
    mod.onload()
    mod.exec()
  }
  return mod.exports
}

// ---
/**
 * config.js - The configuration for the loader
 */

// The root path to use for id2uri parsing
data.base = loaderDir

// The loader directory
data.dir = loaderDir

// The current working directory
data.cwd = cwd

// The charset for requesting files
data.charset = "utf-8"

// data.alias - An object containing shorthands of module id
// data.paths - An object containing path shorthands in module id
// data.vars - The {xxx} variables in module id
// data.map - An array containing rules to map module uri
// data.debug - Debug mode. The default value is false

seajs.config = function(configData) {

  for (var key in configData) {
    var curr = configData[key]
    var prev = data[key]

    // Merge object config such as alias, vars  
    // configData 覆盖 data 里面相同key的值
    if (prev && isObject(prev)) {
      for (var k in curr) {
        prev[k] = curr[k]
      }
    }
    else {
      // Concat array config such as map
      if (isArray(prev)) {
        curr = prev.concat(curr)
      }
      // Make sure that `data.base` is an absolute path
      else if (key === "base") {
        // Make sure end with "/"  
        // 确保 base 路径后面带了 "/"
        if (curr.slice(-1) !== "/") {
          curr += "/"
        }
        curr = addBase(curr)
      }

      // Set config
      data[key] = curr
    }
  }

  emit("config", configData)
  return seajs
}

})(this);
