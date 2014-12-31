define(function(require, exports, module) {

  var Util = require('./util'),
    Base = require('./base'),
    Core = require('./core'),
    Animate = require('./animate');

  //reduced boundry pan distance
  var PAN_RATE = 0.36;
  //constant acceleration for scrolling
  var SROLL_ACCELERATION = 0.001;
  //boundry checked bounce effect
  var BOUNDRY_CHECK_DURATION = 500;
  var BOUNDRY_CHECK_EASING = "ease";
  var BOUNDRY_CHECK_ACCELERATION = 0.1;

  var transformOrigin = Util.prefixStyle("transformOrigin");
  //transform
  var transform = Util.prefixStyle("transform");

  function SimuScroll(cfg) {
    SimuScroll.superclass.constructor.call(this, cfg);
  }

  Util.extend(SimuScroll, Core, {
    init:function(){
      var self = this;
      SimuScroll.superclass.init.call(this);
      self.boundryCheckEnabled = true;
    },
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
      content.style.minHeight = "100%";
      content.style.minWidth = "100%";
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
          transform: "translateX(-" + x + "px)"
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
      return transY ? Math.round(transY[5]) === 0 ? 0 : -Math.round(transY[5]) : 0;
    },
    getOffsetLeft: function() {
      if (this.lockX) return 0;
      var transX = window.getComputedStyle(this.content)[transform].match(/[-\d\.*\d*]+/g);
      return transX ? Math.round(transX[4]) === 0 ? 0 : -Math.round(transX[4]) : 0;
    },
    //translate a element 
    translate: function(x, y) {
      var translateZ = this.userConfig.gpuAcceleration ? " translateZ(0) " : "";
      this.x = -x || this.x || 0;
      this.y = -y || this.y || 0;
      this.content.style[transform] = "translate(" + this.x + "px,0px) " + translateZ;
      this.container.style[transform] = "translate(0px," + this.y + "px) " + translateZ;
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
    },
    _bindEvt: function() {
      var self = this;
      if (self.__isEvtBind) return;
      self.__isEvtBind = true;
      var renderTo = self.renderTo;
      var container = self.container;
      var content = self.content;
      var containerWidth = self.containerWidth;
      var containerHeight = self.containerHeight;
      var boundry = self.boundry;
      var mc = new Hammer.Manager(renderTo);
      var pinch = new Hammer.Pinch();
      var pan = new Hammer.Pan();
      var tap = new Hammer.Tap();
      mc.add([tap, pan, pinch]);
      mc.on("panstart", function(e) {
        self._prevSpeed = 0;
        offset = self.getOffset();
        self.translate(offset.x, offset.y);
      });

      mc.on("pan", function(e) {
        var y = self.userConfig.lockY ? Number(offset.y) : Number(offset.y) - e.deltaY;
        var x = self.userConfig.lockX ? Number(offset.x) : Number(offset.x) - e.deltaX;
        containerWidth = self.containerWidth;
        containerHeight = self.containerHeight;
        if (y < boundry.top) {
          y = (y - boundry.top) * PAN_RATE + boundry.top;
        }
        if (y +  boundry.bottom > containerHeight) {
          y = (y + boundry.bottom - containerHeight) * PAN_RATE  - boundry.bottom + containerHeight;
        }
        if (x < boundry.left) {
          x = (x - boundry.left) * PAN_RATE + boundry.left;
        }
        if (x + boundry.right > containerWidth) {
          x = (x + boundry.right - containerWidth) * PAN_RATE - boundry.right + containerWidth;
        }
        self.translate(x, y);
        // self._noTransition();
        self.isScrollingX = false;
        self.isScrollingY = false;
        //pan trigger the opposite direction
        self.directionX = e.type == 'panleft' ? 'right' : e.type == 'panright' ? 'left' : '';
        self.directionY = e.type == 'panup' ? 'bottom' : e.type == 'pandown' ? 'top' : '';
        self.trigger("scroll", Util.mix(e, {
          offset: {
            x: x,
            y: y
          },
          directionX: self.directionX,
          directionY: self.directionY,
          triggerType: "pan"
        }));

      });

      mc.on("panend", function(e) {
        self.panEndHandler(e);
      });
    },

    panEndHandler: function(e) {
      var self = this;
      var userConfig = self.userConfig;
      var transX = self._bounce("x", e.velocityX);
      var transY = self._bounce("y", e.velocityY);
      var x = transX ? transX.offset : 0;
      var y = transY ? transY.offset : 0;
      var duration;
      if (transX && transY && transX.status && transY.status && transX.duration && transY.duration) {
        //ensure the same duration
        duration = Math.max(transX.duration, transY.duration);
      }
      transX && self.scrollX(x, duration || transX.duration, transX.easing, function(e) {
        // self._scrollEndHandler("x");
      });
      transY && self.scrollY(y, duration || transY.duration, transY.easing, function(e) {
        // self._scrollEndHandler("y");
      });
      //judge the direction
      self.directionX = e.velocityX < 0 ? "left" : "right";
      self.directionY = e.velocityY < 0 ? "up" : "down";
    },

    boundryCheckX: function(callback) {
      var self = this;
      if (!self.boundryCheckEnabled || self.userConfig.lockX) return;
      var offset = self.getOffset();
      var containerWidth = self.containerWidth;
      var boundry = self.boundry;
      if (offset.x < boundry.left) {
        offset.x = boundry.left;
        self.scrollX(-offset.x, self.userConfig.BOUNDRY_CHECK_DURATION, self.userConfig.BOUNDRY_CHECK_EASING, callback);
      } else if (offset.x + boundry.right > containerWidth) {
        offset.x = boundry.right - containerWidth;
        self.scrollX(-offset.x, self.userConfig.BOUNDRY_CHECK_DURATION, self.userConfig.BOUNDRY_CHECK_EASING, callback);
      }
    },
    boundryCheckY: function(callback) {
      var self = this;
      if (!self.boundryCheckEnabled || self.userConfig.lockY) return;
      var offset = self.getOffset();
      var containerHeight = self.containerHeight;
      var boundry = self.boundry;
      if (offset.y < boundry.top) {
        offset.y = boundry.top;
        self.scrollY(-offset.y, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
      } else if (offset.y + boundry.bottom > containerHeight) {
        offset.y = boundry.bottom - containerHeight;
        self.scrollY(-offset.y, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
      }
    },
    //boundry back bounce
    boundryCheck: function(callback) {
      this.boundryCheckX(callback);
      this.boundryCheckY(callback);
    },
    stop:function(){

    }
  });


  if (typeof module == 'object' && module.exports) {
    module.exports = SimuScroll;
  } else {
    return window.XScroll = SimuScroll;
  }



});