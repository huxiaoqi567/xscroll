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
      container.style.minHeight = "100%";
      container.style.minWidth = "100%";
      container.style[transformOrigin] = "0 0";
      content.style.position = "absolute";
      content.style.minHeight = "100%";
      content.style.minWidth = "100%";
      content.style[transformOrigin] = "0 0";
      self.translate(0, 0);
      self.__isContainerInited = true;
      return self;
    },

    getScrollTop: function() {
      if (this.lockY) return 0;
      var transY = window.getComputedStyle(this.container)[transform].match(/[-\d\.*\d*]+/g);
      return transY ? Math.round(transY[5]) === 0 ? 0 : -Math.round(transY[5]) : 0;
    },
    getScrollLeft: function() {
      if (this.lockX) return 0;
      var transX = window.getComputedStyle(this.content)[transform].match(/[-\d\.*\d*]+/g);
      return transX ? Math.round(transX[4]) === 0 ? 0 : -Math.round(transX[4]) : 0;
    },
    scrollLeft: function(x, duration, easing, callback) {
      if (this.userConfig.lockX) return;
      this.x = (undefined === x || isNaN(x) || 0 === x) ? 0 : -Math.round(x);
      this._animate("x", "translateX(" + this.x + "px) scale(" + this.scale + ")", duration, easing, callback);
      return this;
    },
    scrollTop: function(y, duration, easing, callback) {
      if (this.userConfig.lockY) return;
      this.y = (undefined === y || isNaN(y) || 0 === y) ? 0 : -Math.round(y);
      this._animate("y", "translateY(" + this.y + "px)", duration, easing, callback);
      return this;
    },
    //translate a element 
    translate: function(x, y, scale) {
      var translateZ = this.userConfig.gpuAcceleration ? " translateZ(0) " : "";
      this.x = x || this.x || 0;
      this.y = y || this.y || 0;
      this.scale = scale || this.scale || 1;
      this.content.style[transform] = "translate(" + this.x + "px,0px) scale(" + this.scale + ") " + translateZ;
      this.container.style[transform] = "translate(0px," + this.y + "px) " + translateZ;
      return this;
    },
    _animate: function(type, transform, duration, easing, callback) {
      var self = this;
      var duration = duration || 0;
      var easing = easing || self.userConfig.easing;
      var el = type == "y" ? self.container : self.content;
      var config = {
        css: {
          transform: transform
        },
        duration: duration,
        easing: easing,
        run: function(e) {
          self.trigger("scroll", {
            scrollTop: self.getScrollTop(),
            scrollLeft: self.getScrollLeft(),
            type: "scroll"
          });
        },
        useTransition: self.userConfig.useTransition,
        end: function() {
          callback && callback();
          self['isScrolling' + type.toUpperCase()] = false;
          self.trigger("scrollend", {
            type: "scrollend",
            scrollTop: self.getScrollTop(),
            scrollLeft: self.getScrollLeft(),
            zoomType: type
          });
        }
      };
      var timer = self.__timers[type] = self.__timers[type] || new Animate(el, config);
      timer.stop();
      timer.reset(config);
      timer.run();
      self.trigger(SCROLL_ANIMATE, {
        scrollTop: -self.y,
        scrollLeft: -self.x,
        type: SCROLL_ANIMATE,
        duration: duration,
        easing: easing,
        zoomType: type
      })
      return this;
    },

    _bindEvt: function() {
      var self = this;
      if (self.__isEvtBind) return;
      self.__isEvtBind = true;
      var renderTo = self.renderTo;
      var mc = self.mc = new Hammer.Manager(renderTo);
      var tap = new Hammer.Tap();
      var pan = new Hammer.Pan();
      var pinch = new Hammer.Pinch();

      mc.add([tap, pan, pinch]);
      renderTo.addEventListener("touchstart", function(e) {
        self.stop();
      }, false);

      mc.on("panstart", function(e) {
        self._onpanstart(e);
      });

      mc.on("pan", function(e) {
        self._onpan(e);
      });

      mc.on("panend", function(e) {
        if(self.getPlugin("snap")) {
          self.__topstart = null;
          self.__leftstart = null;
          return;
        }
        self._onpanend(e);
      });

      self.trigger("aftereventbind",{mc:mc});
      //window resize
      window.addEventListener("resize",function(e){
        setTimeout(function(){
          self.boundryCheck(0);
          self.render();
        },100);
      },self);

      return this;
    },

    _onpanstart: function(e) {
      var self = this;
      var scrollLeft = self.getScrollLeft();
      var scrollTop = self.getScrollTop();
      self.stop();
      self.translate(-scrollLeft, -scrollTop);
      self.trigger("panstart", Util.mix(e, {
        scrollTop: scrollTop,
        scrollLeft: scrollLeft
      }));
      return self;
    },

    _onpan: function(e) {
      var self = this;
      var boundry = self.boundry;
      var scrollTop = self.__topstart || (self.__topstart = -self.getScrollTop());
      var scrollLeft = self.__leftstart || (self.__leftstart = -self.getScrollLeft());
      var threshold = self.mc.get("pan").options.threshold || 0;
      var y = self.userConfig.lockY ? Number(scrollTop) : Number(scrollTop) + e.deltaY;
      var x = self.userConfig.lockX ? Number(scrollLeft) : Number(scrollLeft) + e.deltaX;
      var containerWidth = self.containerWidth;
      var containerHeight = self.containerHeight;
      //over top
      y = y > boundry.top ? (y - boundry.top) * PAN_RATE + boundry.top : y;
      //over bottom
      y = y < boundry.bottom - containerHeight ? y + (boundry.bottom - containerHeight - y) * PAN_RATE : y;
      //over left
      x = x > boundry.left ? (x - boundry.left) * PAN_RATE + boundry.left : x;
      //over right
      x = x < boundry.right - containerWidth ? x + (boundry.right - containerWidth - x) * PAN_RATE : x;
      self.translate(x, y);
      //pan trigger the opposite direction
      self.directionX = e.type == 'panleft' ? 'right' : e.type == 'panright' ? 'left' : '';
      self.directionY = e.type == 'panup' ? 'down' : e.type == 'pandown' ? 'up' : '';
      self.trigger("scroll", Util.mix(e, {
        scrollTop: -y,
        scrollLeft: -x,
        triggerType: "pan",
        type: "scroll"
      }));

      self.trigger("pan", Util.mix(e, {
        scrollTop: -y,
        scrollLeft: -x,
        type: "pan"
      }));

    },

    _onpanend: function(e) {
      var self = this;
      var userConfig = self.userConfig;
      var transX = self._bounce("x", e.velocityX);
      var transY = self._bounce("y", e.velocityY);
      var scrollLeft = transX ? transX.pos : 0;
      var scrollTop = transY ? transY.pos : 0;
      var duration;
      if (transX && transY && transX.status && transY.status && transX.duration && transY.duration) {
        //ensure the same duration
        duration = Math.max(transX.duration, transY.duration);
      }
      transX && self.scrollLeft(scrollLeft, duration || transX.duration, transX.easing, function(e) {
        self._scrollEndHandler("x");
      });
      transY && self.scrollTop(scrollTop, duration || transY.duration, transY.easing, function(e) {
        self._scrollEndHandler("y");
      });
      //judge the direction
      self.directionX = e.velocityX < 0 ? "left" : "right";
      self.directionY = e.velocityY < 0 ? "up" : "down";
      //clear start
      self.__topstart = null;
      self.__leftstart = null;

      self.trigger("panend", Util.mix(e, {
        scrollTop: self.getScrollTop(),
        scrollLeft: self.getScrollLeft(),
        type: "panend"
      }));
    },
    isBoundryOut: function() {
      return this.isBoundryOutLeft() || this.isBoundryOutRight() || this.isBoundryOutTop() || this.isBoundryOutBottom();
    },
    isBoundryOutLeft: function() {
      return this.getBoundryOutLeft() > 0 ? true : false;
    },
    isBoundryOutRight: function() {
      return this.getBoundryOutRight() > 0 ? true : false;
    },
    isBoundryOutTop: function() {
      return this.getBoundryOutTop() > 0 ? true : false;
    },
    isBoundryOutBottom: function() {
      return this.getBoundryOutBottom() > 0 ? true : false;
    },
    getBoundryOutTop: function() {
      return this.boundry.top - this.getScrollTop();
    },
    getBoundryOutLeft: function() {
      return this.boundry.left - this.getScrollLeft();
    },
    getBoundryOutBottom: function() {
      return this.boundry.bottom - this.containerHeight + this.getScrollTop();
    },
    getBoundryOutRight: function() {
      return this.boundry.right - this.containerWidth + this.getScrollLeft();
    },
    _bounce: function(type, v) {
      var self = this;
      var userConfig = self.userConfig;
      var pos = type == "x" ? self.getScrollLeft() : self.getScrollTop();
      var boundry = self.boundry;
      var boundryStart = type == "x" ? boundry.left : boundry.top;
      var boundryEnd = type == "x" ? boundry.right : boundry.bottom;
      var innerSize = type == "x" ? self.containerWidth : self.containerHeight;
      var maxSpeed = userConfig.maxSpeed > 0 && userConfig.maxSpeed < 6 ? userConfig.maxSpeed : 3;
      var size = boundryEnd - boundryStart;
      var transition = {};

      if (type == "x" && (self.isBoundryOutLeft() || self.isBoundryOutRight())) {
        self.boundryCheckX();
        return;
      } else if (type == "y" && (self.isBoundryOutTop() || self.isBoundryOutBottom())) {
        self.boundryCheckY();
        return;
      }

      if (type == "x" && self.userConfig.lockX) return;
      if (type == "y" && self.userConfig.lockY) return;

      v = v > maxSpeed ? maxSpeed : v < -maxSpeed ? -maxSpeed : v;
      var a = self.SROLL_ACCELERATION * (v / (Math.abs(v) || 1));
      var t = isNaN(v / a) ? 0 : v / a;


      var s = Number(pos) + t * v / 2;
      //over top boundry check bounce
      if (s < boundryStart) {
        var _s = boundryStart - pos;
        var _t = (Math.sqrt(-2 * a * _s + v * v) + v) / a;
        transition.pos = -boundryStart;
        transition.duration = _t;
        transition.easing = "linear";
        self["_bounce" + type] = v - a * _t;
        //over bottom boundry check bounce
      } else if (s > innerSize - boundryEnd) {
        var _s = (boundryEnd - innerSize) + pos;
        var _t = (Math.sqrt(-2 * a * _s + v * v) - v) / a;
        transition.pos = innerSize - size;
        transition.duration = _t;
        transition.easing = "linear";
        self["_bounce" + type] = v - a * _t;
        // normal
      } else {
        transition.pos = s;
        transition.duration = t;
        transition.easing = self.userConfig.easing;
        transition.status = "normal";
        self["_bounce" + type] = 0;
      }
      self['isScrolling' + type.toUpperCase()] = true;
      return transition;

    },

    _scrollEndHandler: function(type) {
      var self = this;
      var TYPE = type.toUpperCase();
      var scrollFn = type == "x" ? "scrollLeft" : "scrollTop";
      var boundryCheckFn = "boundryCheck" + TYPE;
      var _bounce = "_bounce" + type;
      var v = self[_bounce];
      if (!v) return;
      var a = 0.01 * v / Math.abs(v);
      var t = v / a;
      var pos = type == "x" ? self.getScrollLeft() : self.getScrollTop();
      var s = pos + t * v / 2;
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
    boundryCheckX: function(duration,easing,callback) {
      var self = this,
          duration = duration === 0 ? 0 : self.userConfig.BOUNDRY_CHECK_DURATION,
          easing = easing || self.userConfig.BOUNDRY_CHECK_EASING;
      if (!self.boundryCheckEnabled || self.userConfig.lockX) return;
      var pos = self.getScrollLeft();
      var containerWidth = self.containerWidth;
      var boundry = self.boundry;
      if (pos < boundry.left) {
        self.scrollLeft(-boundry.left, duration, easing, callback);
      } else if (pos > containerWidth - boundry.right) {
        self.scrollLeft(containerWidth - boundry.right, duration, easing, callback);
      }
    },
    boundryCheckY: function(duration,easing,callback) {
      var self = this,
          duration = duration === 0 ? 0 : self.userConfig.BOUNDRY_CHECK_DURATION,
          easing = easing || self.userConfig.BOUNDRY_CHECK_EASING;
      if (!self.boundryCheckEnabled || self.userConfig.lockY) return;
      var pos = self.getScrollTop();
      var containerHeight = self.containerHeight;
      var boundry = self.boundry;
      if (pos < boundry.top) {
        self.scrollTop(-boundry.top, duration, easing, callback);
      } else if (pos > containerHeight - boundry.bottom) {
        self.scrollTop(containerHeight - boundry.bottom, duration, easing, callback);
      }
    },
    //boundry back bounce
    boundryCheck: function(duration,easing,callback) {
      this.boundryCheckX(duration,easing,callback);
      this.boundryCheckY(duration,easing,callback);
    },
    stop: function() {
      var self = this;
      self.__timers.x && self.__timers.x.stop();
      self.__timers.y && self.__timers.y.stop();
      if (self.isScrollingX || self.isScrollingY) {
        self.trigger("scrollend", {
          type: "scrollend",
          scrollTop: self.getScrollTop(),
          scrollLeft: self.getScrollLeft()
        });
        self.isScrollingX = false;
        self.isScrollingY = false;
      }
    },
    render: function() {
      console.log("render")
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