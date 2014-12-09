seajs-2.3.0-code-analysis
=========================

seajs 2.3.0 源码解析



##说明
从这里下载的最新版本：http://seajs.org/docs/#downloads (2014-06-10 发布 Sea.js 2.3.0)

现在[seajs github](https://github.com/seajs/seajs)上已经是 3.0.0 了。（更新好快啊）

[@玉伯](https://github.com/lifesinger/) 本来是要写seajs源码解析的，好像难产了，估计太忙了。
这里可以看到几篇：https://github.com/lifesinger/lifesinger.github.com/issues

我这里的解析主要是自己学习，仅供参考，如果有不对的或理解错的，欢迎 Issues 和 Fork

##一些讲解（我的个人理解）

1. `_waitings` 与 `_remain` 的技巧说明
	```
    // 假设 mod_A 依赖 mod_B 和 mod_C
    // mod_D 依赖 mod_A
    
    // -------------------------------------------------
    // Module.prototype.load 函数：
    // mod_A 依赖模块的个数 (mod_A._remain = 2)
    var len = mod._remain = uris.length
    
    // 如果 mod_B 和 mod_C 都还没有加载完毕
    if (m.status < STATUS.LOADED) {
      // Maybe duplicate: When module has dupliate dependency, it should be it's count, not 1  
      // +1 应该是因为并发加载的情况（1个页面，至少2个地方，同时加载 mod_A）
      // mod_B._waitings[mod_A] = 1; mod_C._waitings[mod_A] = 1;
      m._waitings[mod.uri] = (m._waitings[mod.uri] || 0) + 1
    }
    
    // -------------------------------------------------
	// Module.prototype.onload 函数：
    
    // 假如  mod_B 触发了 onload
    var waitings = mod._waitings
    
    for (uri in waitings) {
        if (waitings.hasOwnProperty(uri)) {
          // m 是 mod_A
          m = cachedMods[uri]
		  
          // m._remain =  m._remain - waitings[uri] =>
          // m._remain = 2 - mod_B[mod_A] =>
          // m._remain = 2 - 1 => m._remain = 1
          // 当 mod_C onload 时， m._remain = 1 - mod_C[mod_A] => m._remain = 1 - 1
          // 当 mod_A._remain = 0，说明 mod_A的依赖都加载完毕了，所以触发 mod_A.onload();
          // 这样，mod_D 也可以触发 onload()了！
          m._remain -= waitings[uri]
          if (m._remain === 0) {
            m.onload()
          }
        }
  	}
    ```

##Changelog

#####1.0
解析的基本上差不多了。

seajs不管是从结构性、低耦合，还是代码精简，技巧，命名等等，我个人觉得是非常非常棒的，是我学习的目标！！（咳咳，有点激动了~）

[seajs-2.3.0 源码解析地址](https://paper.github.io/seajs-2.3.0-code-analysis/seajs-2.3.0/docs/sea-debug.html)

英文基本上都是原来代码里面有的，应该很好区分。

#####0.3
1. 使用 https://github.com/jashkenas/docco 来美化阅读，等我写的差不多了，出1.0版本的时候，再放出 demo 吧。