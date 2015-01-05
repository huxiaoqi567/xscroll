define(function(require, exports, module) {
  var Util = require('./util'),
    Base = require('./base'),
    Core = require('./core'),
    Animate = require('./animate'),
    ScrollBar = require('./components/scrollbar');

  //reduced boundry pan distance
  var PAN_RATE = 0.36;
  //constant acceleration for scrolling
  var SROLL_ACCELERATION = 0.001;
  //boundry checked bounce effect
  var BOUNDRY_CHECK_DURATION = 500;
  var BOUNDRY_CHECK_EASING = "ease";
  var BOUNDRY_CHECK_ACCELERATION = 0.1;
  var PAN_END = "panend";
  var PAN_START = "panstart";
  var PAN = "pan";
  var BOUNDRY_OUT = "boundryout";
  var SCROLL_ANIMATE = "scrollanimate";
  var transformOrigin = Util.prefixStyle("transformOrigin");
  //transform
  var transform = Util.prefixStyle("transform");

  function SimuScroll(cfg) {
    SimuScroll.superclass.constructor.call(this, cfg);
  }

  Util.extend(SimuScroll, Core, {
    init: function() {
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
      this.x = x || this.x || 0;
      this.y = y || this.y || 0;
      this.content.style[transform] = "translate(" + (-this.x) + "px,0px) " + translateZ;
      this.container.style[transform] = "translate(0px," + (-this.y) + "px) " + translateZ;
      return this;
    },
    scrollX: function(x, duration, easing, callback) {
      var self = this;
      var x = -Math.round(x);
      if (self.userConfig.lockX) return;
      self._scroll("x", x, duration, easing, callback);
    },
    scrollY: function(y, duration, easing, callback) {
      var self = this;
      var y = -Math.round(y);
      if (self.userConfig.lockY) return;
      self._scroll("y", y, duration, easing, callback);
    },
    _scroll: function(type, offset, duration, easing, callback) {
      var self = this;
      var duration = duration || 0;
      var easing = easing || self.userConfig.easing;
      var el = type == "y" ? self.container:self.content;
      //set this.x or this.y to dest value.
      this[type] = offset;
      var config = {
        css: {
          transform: type == "y" ? "translateY(" + offset + "px)" : "translateX(" + offset + "px)"
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
        end: function(){
          callback && callback();
          self.trigger("scrollend",{
            offset:self.getOffset(),
            zoomType:type
          });
        }
      };
      var timer = self.__timers[type] = self.__timers[type] || new Animate(el, config);
      //run
      timer.stop();
      timer.reset(config);
      timer.run();
      self.trigger(SCROLL_ANIMATE, {
        offset: {
          x: -self.x,
          y: -self.y
        },
        type: SCROLL_ANIMATE,
        duration: duration,
        easing: easing,
        zoomType: type
      })

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
      var offset = self.getOffset();
      mc.add([tap, pan, pinch]);

      renderTo.addEventListener("touchstart", function(e) {
        self.stop();
      }, false)

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
        //over top
        y = y < boundry.top ? (y - boundry.top) * PAN_RATE + boundry.top : y;
        //over bottom
        y = y + boundry.bottom > containerHeight ? (y + boundry.bottom - containerHeight) * PAN_RATE - boundry.bottom + containerHeight : y;
        //over left
        x = x < boundry.left ? (x - boundry.left) * PAN_RATE + boundry.left : x;
        //over right
        x = x + boundry.right > containerWidth ? (x + boundry.right - containerWidth) * PAN_RATE - boundry.right + containerWidth : x;
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

        self.trigger("pan", Util.mix(e, {
          offset: {
            x: x,
            y: y
          },
          directionX: e.directionX,
          directionY: e.directionY,
          triggerType: PAN
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
        self._scrollEndHandler("x");
      });
      transY && self.scrollY(y, duration || transY.duration, transY.easing, function(e) {
        self._scrollEndHandler("y");
      });
      //judge the direction
      self.directionX = e.velocityX < 0 ? "left" : "right";
      self.directionY = e.velocityY < 0 ? "up" : "down";
    },
    isBoundryOut: function() {
      return this.isBoundryOutLeft() || this.isBoundryOutRight() || this.isBoundryOutTop() || this.isBoundryOutBottom();
    },
    isBoundryOutLeft: function() {
      return this.getOffsetLeft() < this.boundry.left;
    },
    isBoundryOutRight: function() {
      return this.containerWidth - this.getOffsetLeft() < this.boundry.right;
    },
    isBoundryOutTop: function() {
      return this.getOffsetTop() < this.boundry.top;
    },
    isBoundryOutBottom: function() {
      return this.containerHeight - this.getOffsetTop() < this.boundry.bottom;
    },

    _bounce: function(type, v) {
      var self = this;
      var userConfig = self.userConfig;
      var offset = self.getOffset()[type];
      var boundry = self.boundry;
      var boundryStart = type == "x" ? boundry.left : boundry.top;
      var boundryEnd = type == "x" ? boundry.right : boundry.bottom;
      var innerSize = type == "x" ? self.containerWidth : self.containerHeight;
      var maxSpeed = userConfig.maxSpeed > 0 && userConfig.maxSpeed < 6 ? userConfig.maxSpeed : 3;
      var size = boundryEnd - boundryStart;
      var isBoundryOut = function() {
        return type == "x" ? (self.isBoundryOutLeft() || self.isBoundryOutRight()) : (self.isBoundryOutTop() || self.isBoundryOutBottom());
      }
      var boundryCheck = function() {
        return type == "x" ? self.boundryCheckX() : self.boundryCheckY();
      }

      var transition = {};
      if (isBoundryOut()) {
        boundryCheck();
        return;
      }
      if (type == "x" && self.userConfig.lockX) return;
      if (type == "y" && self.userConfig.lockY) return;

      v = v > maxSpeed ? maxSpeed : v < -maxSpeed ? -maxSpeed : v;
      var a = self.SROLL_ACCELERATION * (v / Math.abs(v));
      var t = v / a;
      var s = Number(offset) + t * v / 2;
      //over top boundry check bounce
      if (s < boundryStart) {
        var _s = boundryStart - offset;
        var _t = (Math.sqrt(-2 * a * _s + v * v) + v) / a;
        transition.offset = -boundryStart;
        transition.duration = _t;
        transition.easing = "linear";
        self["_bounce" + type] = v - a * _t;
        //     self._prevSpeed = 0;
        //over bottom boundry check bounce
      } else if (s > innerSize - size) {
        var _s = (size - innerSize) - offset;
        var _t = (Math.sqrt(-2 * a * _s + v * v) - v) / a;
        transition.offset = innerSize - size;
        transition.duration = _t;
        transition.easing = "linear";
        self["_bounce" + type] = v - a * _t;
        // self._prevSpeed = v - a * _t;
        // normal
      } else {
        transition.offset = s;
        transition.duration = t;
        transition.easing = self.userConfig.easing;
        transition.status = "normal";
        self["_bounce" + type] = 0;
        // self._prevSpeed = 0;
      }
      self['isScrolling' + type.toUpperCase()] = true;
      return transition;

    },

    _scrollEndHandler: function(type) {
      var self = this;
      var TYPE = type.toUpperCase();
      var scrollFn = "scroll" + TYPE;
      var boundryCheckFn = "boundryCheck" + TYPE;
      var _bounce = "_bounce" + type;
      var boundry = self.boundry;
      var bounceSize = self.userConfig.bounceSize || 0;
      var v = self[_bounce];
      if (!v) return;
      var a = 0.01 * v / Math.abs(v);
      var t = v / a;
      var s = self.getOffset()[type] + t * v / 2;
      var param = {
        zoomType: type,
        velocityX: 0,
        velocityY: 0,
        type: BOUNDRY_OUT
      };
      param["velocity" + TYPE] = self[_bounce];
      self.trigger(BOUNDRY_OUT, param);
      if (self.userConfig.bounce) {
        self[scrollFn](s, t, "linear", function() {
          self[_bounce] = 0;
          self[boundryCheckFn]()
        });
      }
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
    stop: function() {
      for(var i in this.__timers){
        this.__timers[i] && this.__timers[i].stop();
      }
      var offset = this.getOffset();
      this.trigger("scrollend",{
        zoomType:"xy",
        offset:offset
      });
    },
    render: function() {
      var self = this;
      SimuScroll.superclass.render.call(this);
      self.renderScrollBars();
      return self;
    },
    renderScrollBars: function() {
      var self = this;
      if (self.userConfig.scrollbarX) {
        self.scrollbarX = self.scrollbarX || new ScrollBar({
          xscroll: self,
          type: "x"
        });
        self.scrollbarX._update();
        self.scrollbarX.hide();
      }
      if (self.userConfig.scrollbarY) {
        self.scrollbarY = self.scrollbarY || new ScrollBar({
          xscroll: self,
          type: "y"
        });
        self.scrollbarY._update();
        self.scrollbarY.hide();
      }
    }
  });


  if (typeof module == 'object' && module.exports) {
    module.exports = SimuScroll;
  } else {
    return window.XScroll = SimuScroll;
  }



});