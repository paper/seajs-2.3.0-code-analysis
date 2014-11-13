;(function (root, factory) {
  if (typeof define === 'function' && define.cmd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.p = factory();
  }
})(this, function (require, exports, module) {
  var p = { name: "paper" };

  console.log(module);


  exports.v = p;

  return p;
});
