"use strict";
var Util = require('../util');
var Base = require('../base');
var transform = Util.prefixStyle("transform");

var Fixed = function(cfg) {
  Fixed.superclass.constructor.call(this, cfg);
  this.userConfig = Util.mix({
    fixedRenderTo: undefined,
    fixedElements: ".xs-fixed",
    prefix: "xs-fixed-container",
    zoomType: "y"
  }, cfg);
  this.init();
}

Util.extend(Fixed, Base, {
  fixedElements: [],
  init: function() {
    var self = this,
      userConfig = self.userConfig,
      xscroll = self.xscroll = userConfig.xscroll,
      xscrollConfig = self.xscrollConfig = xscroll.userConfig;
    self.isY = !!(userConfig.zoomType == "y");
    self._ = self.isY ? {
      top: "top",
      height: "height",
      width: "width",
      offsetTop:"offsetTop"
    } : {
      top: "left",
      height: "width",
      width: "height",
      offsetTop:"offsetLeft"
    };
    self.fixedRenderTo = Util.getNode(userConfig.fixedRenderTo);
    return self;
  },
  render: function() {
    var self = this;
    var xscroll = self.xscroll;
    self.infinite = xscroll.getPlugin("infinite");
    if (!self.fixedRenderTo) {
      self.fixedRenderTo = document.createElement('div');
      xscroll.renderTo.appendChild(self.fixedRenderTo);
    }
    Util.addClass(self.fixedRenderTo, self.userConfig.prefix);
    var originalFixedElements = self.originalFixedElements = self.getFixedElements();
    for (var i = 0, l = originalFixedElements.length; i < l; i++) {
      self.renderFixedElement(originalFixedElements[i], i,self.fixedRenderTo);
    }
    return self;
  },
  getFixedElements: function() {
    var self = this;
    var infinite = self.infinite;
    var userConfig = self.userConfig;
    if (infinite) {
      var els = [];
      for (var i in infinite.__serializedData) {
        var data = infinite.__serializedData[i];
        if (data && data.style && data.style.position == "fixed") {
          els.push(data);
        }
      }
      return els;
    } else {
      return Util.getNodes(userConfig.fixedElements, self.xscroll.content);
    }
  },
  renderFixedElement: function(el, fixedIndex,fixedRenderTo) {
    var self = this;
    var isRender = true;
    var _ = self._;
    var xscroll = self.xscroll;
    var userConfig = self.userConfig;
    var xscrollConfig = self.xscrollConfig;
    var useOriginScroll = xscrollConfig.useOriginScroll;
    var infinite = self.infinite;
    var fixedElement = self.fixedElements[fixedIndex];
    if (!self.fixedElements[fixedIndex]) {
      isRender = false;
      if (useOriginScroll && !infinite) {
        //use original position:fixed stylesheet
        el.style.position = "fixed";
        el.style.display = "block";
      } else {
        //deep clone fixed nodes and hide original nodes
        fixedElement = document.createElement("div");
        if (infinite) {
          fixedElement.setAttribute("style", Util.stringifyStyle(Util.mix(el.style, {
            display: "block",
            width: "100%"
          })));
          fixedElement.style[_.top] = (el.style[_.top] >= 0 ? el.style[_.top] : el._top) + "px";
          if (el.style[_.height]) {
            fixedElement.style[_.height] = el.style[_.height] + "px";
          }
          infinite.userConfig.renderHook.call(self, fixedElement, el);
        } else {
          fixedElement.style.display = "block";
          fixedElement.style.position = "absolute";
          fixedElement.style[_.width] = "100%";
          fixedElement.innerHTML = el.innerHTML;
          fixedElement.className = el.className;
          fixedElement.setAttribute("style", el.getAttribute("style"));
          fixedElement.style[_.top] = el[_.offsetTop] + "px";
          el.style.display = "none";
        }
        fixedRenderTo.appendChild(fixedElement);
        self.fixedElements.push(fixedElement);
      }
    }
    xscroll.trigger("fixedchange", {
      fixedIndex: fixedIndex,
      fixedElement: useOriginScroll ? el : fixedElement,
      originalFixedElement: el,
      isRender: isRender
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
