define(function(require, exports, module) {


  var Util = require('./util'),
    Base = require('./base'),
    Core = require('./core'),
    Animate = require('./animate');

  var transformOrigin = Util.prefixStyle("transformOrigin");

  //transform
  var transform = Util.prefixStyle("transform")


  function SimuScroll(cfg) {
    SimuScroll.superclass.constructor.call(this, cfg);
  }

  Util.extend(SimuScroll, Core, {
    _initContainer: function() {
      var self = this;
      if (self.__isContainerInited) return;
      var renderTo = self.renderTo;
      var container = self.container = self.renderTo.querySelector("." + self.containerClsName);
      var content = self.content = self.renderTo.querySelector("." + self.contentClsName);
      renderTo.style.overflow = "hidden";
      container.style.position = "absolute";
      container.style.height = "100%";
      container.style.width = "100%";
      container.style[transformOrigin] = "0 0";
      content.style.position = "absolute";
      content.style.height = "100%";
      content.style.width = "100%";
      content.style[transformOrigin] = "0 0";
      self.translate(0, 0);
      self.__isContainerInited = true;
      return self;
    },
    scrollX: function(x, duration, easing, callback) {
      var self = this;
      var x = Math.round(x);
      if (self.userConfig.lockX) return;
      var duration = duration || 0;
      var easing = easing || self.userConfig.easing;
      var config = {
        css: {
          transform: "translateX(" + x + "px)"
        },
        duration: duration,
        easing: easing,
        run: function(e) {
          //trigger scroll event
          self.trigger("scroll", {
            offset: self.getOffset()
          });
        },
        useTransition: self.userConfig.useTransition,
        end: callback
      };
      self.__timers.x = self.__timers.x || new Animate(self.content, config);
      //run
      self.__timers.x.stop();
      self.__timers.x.reset(config);
      self.__timers.x.run();
    },
    getOffsetTop: function() {
      if (this.lockY) return 0;
      var transY = window.getComputedStyle(this.container)[transform].match(/[-\d\.*\d*]+/g);
      return transY ? -Math.round(transY[5]) : 0;
    },
    getOffsetLeft: function() {
      if (this.lockX) return 0;
      var transX = window.getComputedStyle(this.content)[transform].match(/[-\d\.*\d*]+/g);
      return transX ? -Math.round(transX[4]) : 0;
    },
    _transform: function() {
      var scale = (!this.scale || this.scale == 1) ? "" : " scale(" + this.scale + ") ";
      var translateZ = this.userConfig.gpuAcceleration ? " translateZ(0) " : "";
      this.content.style[transform] = "translate(" + this.x + "px,0px) " + scale + translateZ;
      this.container.style[transform] = "translate(0px," + this.y + "px) " + translateZ;
    },
    //translate a element 
    translate: function(x, y) {
      this.x = x || this.x || 0;
      this.y = y || this.y || 0;
      this._transform();
      return this;
    },
    scrollY: function(y, duration, easing, callback) {
      var self = this;
      var y = Math.round(y);
      if (self.userConfig.lockY) return;
      var duration = duration || 0;
      var easing = easing || self.userConfig.easing;
      var config = {
        css: {
          transform: "translateY(-" + y + "px)"
        },
        duration: duration,
        easing: easing,
        run: function(e) {
          //trigger scroll event
          self.trigger("scroll", {
            offset: self.getOffset()
          });
        },
        useTransition: self.userConfig.useTransition,
        end: callback
      };
      self.__timers.y = self.__timers.y || new Animate(self.container, config);
      //run
      self.__timers.y.stop();
      self.__timers.y.reset(config);
      self.__timers.y.run();
      // self._scrollHandler(-y, duration, callback, easing, "y");
    },
    _bindEvt: function() {
      if (self.__isEvtBind) return;
      self.__isEvtBind = true;
      var renderTo = self.renderTo;
      var container = self.container;
      var content = self.content;
      var containerWidth = self.containerWidth;
      var containerHeight = self.containerHeight;

      // self.

      // var boundry = self.boundry;
      // var mc = new Hammer.Manager(renderTo);



    }
  });


  if (typeof module == 'object' && module.exports) {
    module.exports = SimuScroll;
  } else {
    return window.XScroll = SimuScroll;
  }



});