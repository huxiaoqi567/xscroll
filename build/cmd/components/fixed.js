define(function(require, exports, module) {
"use strict";
var Util = require('../util');
var Base = require('../base');
var transform = Util.prefixStyle("transform");

var Fixed = function(cfg) {
  Fixed.superclass.constructor.call(this, cfg);
  this.userConfig = Util.mix({
    renderTo: undefined,
    fixedElements: ".xs-fixed",
    zoomType: "y"
  }, cfg);
  this.init();
}

Util.extend(Fixed, Base, {
  fixedElements:[],
  init: function() {
    var self = this,
      userConfig = self.userConfig,
      xscroll = self.xscroll = userConfig.xscroll,
      xscrollConfig = self.xscrollConfig = xscroll.userConfig;
    self.isY = !!(userConfig.zoomType == "y");
    self._ = self.isY ? {
      top: "top",
      height: "height",
      width: "width"
    } : {
      top: "left",
      height: "width",
      width: "height"
    };
    self.renderTo = Util.getNode(userConfig.renderTo);
    return self;
  },
  render: function() {
    var self = this;
    var userConfig = self.userConfig;
    var xscroll = self.xscroll;
    var fixedElements = userConfig.fixedElements;
    var originalFixedElements = self.originalFixedElements = Util.getNodes(fixedElements,self.content);
    self.isInfinite = !!xscroll.getPlugin("infinite");
    for (var i = 0, l = originalFixedElements.length; i < l; i++) {
      self.renderFixedElement(originalFixedElements[i], i);
    }
    return self;
  },
  renderFixedElement: function(el, fixedIndex) {
    var self = this;
    var xscroll = self.xscroll;
    var userConfig = self.userConfig;
    var xscrollConfig = self.xscrollConfig;
    var useOriginScroll = xscrollConfig.useOriginScroll;
    if (useOriginScroll) {
      //use original position:fixed stylesheet
      el.style.position = "fixed";
      el.style.display = "block";
    } else {
      //deep clone fixed nodes and hide original nodes
      var fixedElement = document.createElement("div");
      fixedElement.innerHTML = el.innerHTML;
      fixedElement.style.display = "block";
      fixedElement.innerHTML = el.innerHTML;
      fixedElement.className = el.className;
      fixedElement.setAttribute("style", el.getAttribute("style"));
      fixedElement.style.position = "absolute";
      fixedElement.style.width = "100%";
      fixedElement.style.top = el.offsetTop + "px";
      xscroll.renderTo.appendChild(fixedElement);
      self.fixedElements.push(fixedElement);
      el.style.display = "none";
    }
    xscroll.trigger("fixedrender", {
      fixedIndex: fixedIndex,
      fixedElement: useOriginScroll ? el : fixedElement,
      originalFixedElement: el
    });
  },
  destroy: function() {
    var self = this;
    self.fixedElements = undefined;
  }
});

if (typeof module == 'object' && module.exports) {
  module.exports = Fixed;
}
/** ignored by jsdoc **/
else {
  return Fixed;
}
});