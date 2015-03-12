define(function(require, exports, module) {
  var Util = require('./util'),
    Base = require('./base'),
    Core = require('./core'),
    Animate = require('./animate'),
    ScrollBar = require('./components/scrollbar'),
    Controller = require('./components/controller');
  //reduced boundry pan distance
  var PAN_RATE = 1 - 0.618;
  //constant for scrolling acceleration
  var SROLL_ACCELERATION = 0.0005;
  //constant for outside of boundry acceleration
  var BOUNDRY_ACCELERATION = 0.03;
  //transform-origin
  var transformOrigin = Util.prefixStyle("transformOrigin");
  //transform
  var transform = Util.prefixStyle("transform");
  /** 
   * @constructor
   * @param {object} cfg config for scroll
   * @param {number} cfg.SROLL_ACCELERATION  acceleration for scroll, min value make the scrolling smoothly
   * @param {number} cfg.BOUNDRY_CHECK_DURATION duration for boundry bounce
   * @param {number} cfg.BOUNDRY_CHECK_EASING easing for boundry bounce
   * @param {number} cfg.BOUNDRY_CHECK_ACCELERATION acceleration for boundry bounce
   * @param {boolean} cfg.lockX just like overflow-x:hidden
   * @param {boolean} cfg.lockY just like overflow-y:hidden
   * @param {boolean} cfg.scrollbarX config if the scrollbar-x is visible
   * @param {boolean} cfg.scrollbarY config if the scrollbar-y is visible
   * @param {boolean} cfg.useTransition config if use css3 transition or raf for scroll animation
   * @param {string}  cfg.clsPrefix config the class prefix which default value is "xs-"
   * @extends XScroll
   * @example
   * var xscroll = new SimuScroll({
   *    renderTo:"#scroll",
   *    lockX:false,
   *    scrollbarX:true
   * });
   * xscroll.render();
   */
  function SimuScroll(cfg) {
    SimuScroll.superclass.constructor.call(this, cfg);
  }

  Util.extend(SimuScroll, Core, {
    /** 
     * @memberof SimuScroll
     * @override
     */
    init: function() {
      var self = this;
      SimuScroll.superclass.init.call(this);
      self.SROLL_ACCELERATION = self.userConfig.SROLL_ACCELERATION || SROLL_ACCELERATION;
      self.BOUNDRY_ACCELERATION = self.userConfig.BOUNDRY_ACCELERATION || BOUNDRY_ACCELERATION;
      self._initContainer();
      self.resetSize();
      //set overflow behaviors
      self._setOverflowBehavior();
      self.defaltConfig = {
        lockY: self.userConfig.lockY,
        lockX: self.userConfig.lockX
      }
      self.boundryCheckEnabled = true;
      return self;
    },
    /**
     * set overflow behavior
     * @return {boolean} [description]
     */
    _setOverflowBehavior: function() {
      var self = this;
      var renderTo = self.renderTo;
      var computeStyle = getComputedStyle(renderTo);
      self.userConfig.lockX = undefined === self.userConfig.lockX ? ((computeStyle['overflow-x'] == "hidden" || self.width == self.containerWidth) ? true : false) : self.userConfig.lockX;
      self.userConfig.lockY = undefined === self.userConfig.lockY ? ((computeStyle['overflow-y'] == "hidden" || self.height == self.containerHeight) ? true : false) : self.userConfig.lockY;
      self.userConfig.scrollbarX = undefined === self.userConfig.scrollbarX ? (self.userConfig.lockX ? false : true) : self.userConfig.scrollbarX;
      self.userConfig.scrollbarY = undefined === self.userConfig.scrollbarY ? (self.userConfig.lockY ? false : true) : self.userConfig.scrollbarY;
      return self;
    },
    /**
     * reset lockX or lockY config to the default value
     */
    _resetLockConfig: function() {
      var self = this;
      self.userConfig.lockX = self.defaltConfig.lockX;
      self.userConfig.lockY = self.defaltConfig.lockY;
      return self;
    },
    /**
     * init container
     * @override
     * @return {SimuScroll}
     */
    _initContainer: function() {
      var self = this;
      SimuScroll.superclass._initContainer.call(self);
      if (self.__isContainerInited) return;
      self.container.style[transformOrigin] = "0 0";
      self.content.style[transformOrigin] = "0 0";
      self.translate(0, 0);
      self.__isContainerInited = true;
      return self;
    },
    /**
     * get scroll top value
     * @memberof SimuScroll
     * @return {number} scrollTop
     */
    getScrollTop: function() {
      var transY = window.getComputedStyle(this.container)[transform].match(/[-\d\.*\d*]+/g);
      return transY ? Math.round(transY[5]) === 0 ? 0 : -Math.round(transY[5]) : 0;
    },
    /**
     * get scroll left value
     * @memberof SimuScroll
     * @return {number} scrollLeft
     */
    getScrollLeft: function() {
      var transX = window.getComputedStyle(this.content)[transform].match(/[-\d\.*\d*]+/g);
      return transX ? Math.round(transX[4]) === 0 ? 0 : -Math.round(transX[4]) : 0;
    },
    /**
     * horizontal scroll absolute to the destination
     * @memberof SimuScroll
     * @param scrollLeft {number} scrollLeft
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollLeft: function(x, duration, easing, callback) {
      if (this.userConfig.lockX) return;
      var translateZ = this.userConfig.gpuAcceleration ? " translateZ(0) " : "";
      this.x = (undefined === x || isNaN(x) || 0 === x) ? 0 : -Math.round(x);
      this._animate("x", "translateX(" + this.x + "px) scale(" + this.scale + ")" + translateZ, duration, easing, callback);
      return this;
    },
    /**
     * vertical scroll absolute to the destination
     * @memberof SimuScroll
     * @param scrollTop {number} scrollTop
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollTop: function(y, duration, easing, callback) {
      if (this.userConfig.lockY) return;
      var translateZ = this.userConfig.gpuAcceleration ? " translateZ(0) " : "";
      this.y = (undefined === y || isNaN(y) || 0 === y) ? 0 : -Math.round(y);
      this._animate("y", "translateY(" + this.y + "px) " + translateZ, duration, easing, callback);
      return this;
    },
    /**
     * translate the scroller to a new destination includes x , y , scale
     * @memberof SimuScroll
     * @param x {number} x
     * @param y {number} y
     * @param scale {number} scale
     **/
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
      var easing = easing || "quadratic";
      var el = type == "y" ? self.container : self.content;
      var config = {
        css: {
          transform: transform
        },
        duration: duration,
        easing: easing,
        run: function(e) {
          /**
           * @event {@link SimuScroll#"scroll"}
           */
          self.trigger("scroll", {
            scrollTop: self.getScrollTop(),
            scrollLeft: self.getScrollLeft(),
            type:"scroll"
          });
        },
        useTransition: self.userConfig.useTransition,
        end: function(e) {
          callback && callback();
          if ((self["_bounce" + type] === 0 || self["_bounce" + type] === undefined) && easing != "linear") {
            self['isScrolling' + type.toUpperCase()] = false;
            self.trigger("scrollend", {
              type:"scrollend",
              scrollTop: self.getScrollTop(),
              scrollLeft: self.getScrollLeft(),
              zoomType: type,
              duration: duration,
              easing: easing
            });
          }
        }
      };
      var timer = self.__timers[type] = self.__timers[type] || new Animate(el, config);
      timer.stop();
      timer.reset(config);
      timer.run();
      self.trigger("scrollanimate", {
        type:"scrollanimate",
        scrollTop: -self.y,
        scrollLeft: -self.x,
        duration: duration,
        easing: easing,
        zoomType: type
      })
      return this;
    },
    _ontap: function(e) {
      var self = this;
      e.preventDefault();
      e.srcEvent.stopPropagation();
      self.boundryCheck();
      self._triggerClick(e);
    },
    _bindEvt: function() {
      SimuScroll.superclass._bindEvt.call(this);
      var self = this;
      if (self.__isEvtBind) return;
      self.__isEvtBind = true;
      var pinch = new Hammer.Pinch();
      self.mc.add(pinch);
      var renderTo = self.renderTo;
      renderTo.addEventListener("touchstart", function(e) {
        if (self.userConfig.preventDefault) {
          e.preventDefault();
        }
        self.stop();
      }, false);

      self.on("tap", self._ontap, self);
      self.on("panstart", self._onpanstart, self);
      self.on("pan", self._onpan, self);
      self.on("panend", self._onpanend, self);
      //window resize
      window.addEventListener("resize", function(e) {
        setTimeout(function() {
          self.resetSize();
          self.boundryCheck(0);
          self.render();
        }, 100);
      }, self);

      return this;
    },
    _onpanstart: function(e) {
      var self = this;
      var scrollLeft = self.getScrollLeft();
      var scrollTop = self.getScrollTop();
      self.stop();
      self.translate(-scrollLeft, -scrollTop);
      var threshold = self.mc.get("pan").options.threshold;
      self.thresholdY = e.direction == "8" ? threshold : e.direction == "16" ? -threshold : 0;
      self.thresholdX = e.direction == "2" ? threshold : e.direction == "4" ? -threshold : 0;
      return self;
    },
    _onpan: function(e) {
      var self = this;
      var boundry = self.boundry;
      var scrollTop = self.__topstart || (self.__topstart = -self.getScrollTop());
      var scrollLeft = self.__leftstart || (self.__leftstart = -self.getScrollLeft());
      var y = self.userConfig.lockY ? Number(scrollTop) : Number(scrollTop) + (e.deltaY + self.thresholdY);
      var x = self.userConfig.lockX ? Number(scrollLeft) : Number(scrollLeft) + (e.deltaX + self.thresholdX);
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
      //move to x,y
      self.translate(x, y);
      //pan trigger the opposite direction
      self.directionX = e.type == 'panleft' ? 'right' : e.type == 'panright' ? 'left' : '';
      self.directionY = e.type == 'panup' ? 'down' : e.type == 'pandown' ? 'up' : '';
      self.trigger("scroll",  {
        scrollTop: -y,
        scrollLeft: -x,
        triggerType: "pan",
        type:"scroll"
      });
      return self;
    },
    _onpanend: function(e) {
      var self = this;
      var userConfig = self.userConfig;
      var transX = self.computeScroll("x", e.velocityX);
      var transY = self.computeScroll("y", e.velocityY);
      var scrollLeft = transX ? transX.pos : 0;
      var scrollTop = transY ? transY.pos : 0;
      var duration;
      if (transX && transY && transX.status == "inside" && transY.status == "inside" && transX.duration && transY.duration) {
        //ensure the same duration
        duration = Math.max(transX.duration, transY.duration);
      }
      transX && self.scrollLeft(scrollLeft, duration || transX.duration, transX.easing, function(e) {
        self.boundryCheckX();
      });
      transY && self.scrollTop(scrollTop, duration || transY.duration, transY.easing, function(e) {
        self.boundryCheckY();
      });
      //judge the direction
      self.directionX = e.velocityX < 0 ? "left" : "right";
      self.directionY = e.velocityY < 0 ? "up" : "down";
      //clear start
      self.__topstart = null;
      self.__leftstart = null;
      return self;
    },
    /**
     * judge the scroller is out of boundry horizontally and vertically
     * @memberof SimuScroll
     * @return {boolean} isBoundryOut
     **/
    isBoundryOut: function() {
      return this.isBoundryOutLeft() || this.isBoundryOutRight() || this.isBoundryOutTop() || this.isBoundryOutBottom();
    },
    /**
     * judge if the scroller is outsideof left
     * @memberof SimuScroll
     * @return {boolean} isBoundryOut
     **/
    isBoundryOutLeft: function() {
      return this.getBoundryOutLeft() > 0 ? true : false;
    },
    /**
     * judge if the scroller is outsideof right
     * @memberof SimuScroll
     * @return {boolean} isBoundryOut
     **/
    isBoundryOutRight: function() {
      return this.getBoundryOutRight() > 0 ? true : false;
    },
    /**
     * judge if the scroller is outsideof top
     * @memberof SimuScroll
     * @return {boolean} isBoundryOut
     **/
    isBoundryOutTop: function() {
      return this.getBoundryOutTop() > 0 ? true : false;
    },
    /**
     * judge if the scroller is outsideof bottom
     * @memberof SimuScroll
     * @return {boolean} isBoundryOut
     **/
    isBoundryOutBottom: function() {
      return this.getBoundryOutBottom() > 0 ? true : false;
    },
    /**
     * get the offset value outsideof top
     * @memberof SimuScroll
     * @return {number} offset
     **/
    getBoundryOutTop: function() {
      return this.boundry.top - this.getScrollTop();
    },
    /**
     * get the offset value outsideof left
     * @memberof SimuScroll
     * @return {number} offset
     **/
    getBoundryOutLeft: function() {
      return this.boundry.left - this.getScrollLeft();
    },
    /**
     * get the offset value outsideof bottom
     * @memberof SimuScroll
     * @return {number} offset
     **/
    getBoundryOutBottom: function() {
      return this.boundry.bottom - this.containerHeight + this.getScrollTop();
    },
    /**
     * get the offset value outsideof right
     * @memberof SimuScroll
     * @return {number} offset
     **/
    getBoundryOutRight: function() {
      return this.boundry.right - this.containerWidth + this.getScrollLeft();
    },
    /**
     * compute scroll transition by zoomType and velocity
     * @memberof SimuScroll
     * @param {string} zoomType zoomType of scrolling
     * @param {number} velocity velocity after panend
     * @example
     * var info = xscroll.computeScroll("x",2);
     * // return {pos:90,easing:"easing",status:"inside",duration:500}
     * @return {Object}
     **/
    computeScroll: function(type, v) {
      var self = this;
      var userConfig = self.userConfig;
      var pos = type == "x" ? self.getScrollLeft() : self.getScrollTop();
      var boundry = self.boundry;
      var boundryStart = type == "x" ? boundry.left : boundry.top;
      var boundryEnd = type == "x" ? boundry.right : boundry.bottom;
      var innerSize = type == "x" ? self.containerWidth : self.containerHeight;
      var maxSpeed = userConfig.maxSpeed || 2;
      var size = boundryEnd - boundryStart;
      var transition = {};
      var status = "inside";
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
      var a2 = self.BOUNDRY_ACCELERATION;
      var t = isNaN(v / a) ? 0 : v / a;
      var s = Number(pos) + t * v / 2;
      //over top boundry check bounce
      if (s < boundryStart) {
        var _s = boundryStart - pos;
        var _t = (Math.sqrt(-2 * a * _s + v * v) + v) / a;
        var v0 = v - a * _t;
        var _t2 = Math.abs(v0 / a2);
        var s2 = v0 / 2 * _t2;
        t = _t + _t2;
        s = boundryStart + s2;
        status = "outside";
      } else if (s > innerSize - boundryEnd) {
        var _s = (boundryEnd - innerSize) + pos;
        var _t = (Math.sqrt(-2 * a * _s + v * v) - v) / a;
        var v0 = v - a * _t;
        var _t2 = Math.abs(v0 / a2);
        var s2 = v0 / 2 * _t2;
        t = _t + _t2;
        s = innerSize - boundryEnd + s2;
        status = "outside";
      }
      transition.pos = s;
      transition.duration = t;
      transition.easing = Math.abs(v) > 2 ? "circular" : "quadratic";
      transition.status = status;
      self['isScrolling' + type.toUpperCase()] = true;
      return transition;
    },
    /**
     * bounce to the boundry horizontal
     * @memberof SimuScroll
     * @return {SimuScroll}
     **/
    boundryCheckX: function(duration, easing, callback) {
      var self = this;
      if (typeof arguments[0] == "function") {
        callback = arguments[0];
        duration = self.userConfig.BOUNDRY_CHECK_DURATION;
        easing = self.userConfig.BOUNDRY_CHECK_EASING;
      } else {
        duration = duration === 0 ? 0 : self.userConfig.BOUNDRY_CHECK_DURATION,
          easing = easing || self.userConfig.BOUNDRY_CHECK_EASING;
      }
      if (!self.boundryCheckEnabled || self.userConfig.lockX) return;
      var pos = self.getScrollLeft();
      var containerWidth = self.containerWidth;
      var boundry = self.boundry;
      if (pos < boundry.left) {
        self.scrollLeft(-boundry.left, duration, easing, callback);
      } else if (pos > containerWidth - boundry.right) {
        self.scrollLeft(containerWidth - boundry.right, duration, easing, callback);
      }
      return self;
    },
    /**
     * bounce to the boundry vertical
     * @memberof SimuScroll
     * @return {SimuScroll}
     **/
    boundryCheckY: function(duration, easing, callback) {
      var self = this;
      if (typeof arguments[0] == "function") {
        callback = arguments[0];
        duration = self.userConfig.BOUNDRY_CHECK_DURATION;
        easing = self.userConfig.BOUNDRY_CHECK_EASING;
      } else {
        duration = duration === 0 ? 0 : self.userConfig.BOUNDRY_CHECK_DURATION,
          easing = easing || self.userConfig.BOUNDRY_CHECK_EASING;
      }
      if (!self.boundryCheckEnabled || self.userConfig.lockY) return;
      var pos = self.getScrollTop();
      var containerHeight = self.containerHeight;
      var boundry = self.boundry;
      if (pos < boundry.top) {
        self.scrollTop(-boundry.top, duration, easing, callback);
      } else if (pos > containerHeight - boundry.bottom) {
        self.scrollTop(containerHeight - boundry.bottom, duration, easing, callback);
      }
      return self;
    },
    /**
     * bounce to the boundry vertical and horizontal
     * @memberof SimuScroll
     * @return {SimuScroll}
     **/
    boundryCheck: function(duration, easing, callback) {
      this.boundryCheckX(duration, easing, callback);
      this.boundryCheckY(duration, easing, callback);
      return this;
    },
    /**
     * stop scrolling immediatelly
     * @memberof SimuScroll
     * @return {SimuScroll}
     **/
    stop: function() {
      var self = this;
      self.__timers.x && self.__timers.x.stop();
      self.__timers.y && self.__timers.y.stop();
      if (self.isScrollingX || self.isScrollingY) {
        var scrollTop = self.getScrollTop(),
          scrollLeft = self.getScrollLeft();
        self.trigger("scrollend", {
          scrollTop: scrollTop,
          scrollLeft: scrollLeft
        });
        self.trigger("stop", {
          scrollTop: scrollTop,
          scrollLeft: scrollLeft
        })
        self.isScrollingX = false;
        self.isScrollingY = false;
        //disable click
        self._isClickDisabled = true;
      } else {
        self._isClickDisabled = false;
      }
      return self;
    },
    /**
     * render scroll
     * @memberof SimuScroll
     * @return {SimuScroll}
     **/
    render: function() {
      var self = this;
      SimuScroll.superclass.render.call(this);
      //fixed for scrollbars
      if (getComputedStyle(self.renderTo).position == "static") {
        self.renderTo.style.position = "relative";
      }
      self.renderTo.style.overflow = "hidden";
      self.initScrollBars();
      self.initController();
      //update touch-action 
      self.initTouchAction();
      return self;
    },
    /**
     * init touch action
     * @memberof SimuScroll
     * @return {SimuScroll}
     */
    initTouchAction: function() {
      var self = this;
      var touchAction = 'none';
      if (!self.userConfig.lockX && self.userConfig.lockY) {
        touchAction = 'pan-y';
      } else if (!self.userConfig.lockY && self.userConfig.lockX) {
        touchAction = 'pan-x';
      } else if (self.userConfig.lockX && self.userConfig.lockY) {
        touchAction = 'auto';
      }
      self.mc.set({
        touchAction: touchAction
      });
      return self;
    },
    /**
     * init scrollbars
     * @memberof SimuScroll
     * @return {SimuScroll}
     */
    initScrollBars: function() {
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
      return self;
    },
    /**
     * init controller for multi-scrollers
     * @memberof SimuScroll
     * @return {SimuScroll}
     */
    initController: function() {
      var self = this;
      self.controller = self.controller || new Controller({
        xscroll: self
      });
      return self;
    }
  });

  if (typeof module == 'object' && module.exports) {
    module.exports = SimuScroll;
  }else{
    return SimuScroll;
  }
});