define(function(require, exports, module) {
"use strict";
var Util = require('../util');
var Base = require('../base');
var Sticky = function(cfg) {
  Sticky.superclass.constructor.call(this, cfg);
  this.userConfig = Util.mix({

  }, cfg);
}

Util.extend(Sticky, Base, {
  init: function(xscroll) {
    var self = this;
    self.xscroll = xscroll.render();
    console.log(self.pluginId," plugged!")
  },
  destroy: function() {
    var self = this;
    var xscroll = self.xscroll;
  }
});

if (typeof module == 'object' && module.exports) {
  module.exports = Sticky;
}
/** ignored by jsdoc **/
else if (window.XScroll && window.XScroll.Plugins) {
  return XScroll.Plugins.Sticky = Sticky;
}
});