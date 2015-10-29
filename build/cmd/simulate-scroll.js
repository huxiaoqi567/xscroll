define(function(require, exports, module) {
"use strict";
var Util = require('./util'),
  Base = require('./base'),
  Core = require('./core'),
  Animate = require('./animate'),
  Hammer = require('./hammer'),
  ScrollBar = require('./components/scrollbar'),
  Controller = require('./components/controller');
//reduced boundry pan distance
var PAN_RATE = 1 - 0.618;
//constant for scrolling acceleration
var SCROLL_ACCELERATION = 0.0005;
//constant for outside of boundry acceleration
var BOUNDRY_ACCELERATION = 0.03;
//transform-origin
var transformOrigin = Util.prefixStyle("transformOrigin");
//transform
var transform = Util.prefixStyle("transform");
/** 
 * @constructor
 * @param {object} cfg config for scroll
 * @param {number} cfg.SCROLL_ACCELERATION  acceleration for scroll, min value make the scrolling smoothly
 * @param {number} cfg.BOUNDRY_CHECK_DURATION duration for boundry bounce
 * @param {number} cfg.BOUNDRY_CHECK_EASING easing for boundry bounce
 * @param {number} cfg.BOUNDRY_CHECK_ACCELERATION acceleration for boundry bounce
 * @param {boolean} cfg.lockX just like overflow-x:hidden
 * @param {boolean} cfg.lockY just like overflow-y:hidden
 * @param {boolean} cfg.scrollbarX config if the scrollbar-x is visible
 * @param {boolean} cfg.scrollbarY config if the scrollbar-y is visible
 * @param {boolean} cfg.useTransition config if use css3 transition or raf for scroll animation
 * @param {boolean} cfg.bounce config if use has the bounce effect when scrolling outside of the boundry
 * @param {boolean} cfg.boundryCheck config if scrolling inside of the boundry
 * @param {boolean} cfg.preventDefault prevent touchstart
 * @param {boolean} cfg.preventTouchMove prevent touchmove
 * @param {string|HTMLElement}  cfg.container config for scroller's container which default value is ".xs-container"
 * @param {string|HTMLElement}  cfg.content config for scroller's content which default value is ".xs-content"
 * @param {object}  cfg.indicatorInsets  config scrollbars position {top: number, left: number, bottom: number, right: number}
 * @param {string}  cfg.stickyElements config for sticky-positioned elements
 * @param {string}  cfg.fixedElements config for fixed-positioned elements
 * @param {string}  cfg.touchAction config for touchAction of the scroller
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
    var defaultCfg = {
      preventDefault: true,
      preventTouchMove: true
    };
    SimuScroll.superclass.init.call(this);
    self.userConfig = Util.mix(defaultCfg, self.userConfig);
    self.SCROLL_ACCELERATION = self.userConfig.SCROLL_ACCELERATION || SCROLL_ACCELERATION;
    self.BOUNDRY_ACCELERATION = self.userConfig.BOUNDRY_ACCELERATION || BOUNDRY_ACCELERATION;
    self._initContainer();
    self.resetSize();
    //set overflow behaviors
    self._setOverflowBehavior();
    self.defaltConfig = {
      lockY: self.userConfig.lockY,
      lockX: self.userConfig.lockX
    }
    return self;
  },
  destroy: function() {
    var self = this;
    SimuScroll.superclass.destroy.call(this);
    self.renderTo.style.overflow = "";
    self.renderTo.style.touchAction = "";
    self.container.style.transform = "";
    self.container.style.transformOrigin = "";
    self.content.style.transform = "";
    self.content.style.transformOrigin = "";
    self.off("touchstart mousedown", self._ontouchstart);
    self.off("touchmove", self._ontouchmove);
    self.destroyScrollBars();
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
    if (self.__isContainerInited || !self.container || !self.content) return;
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
          type: "scroll"
        });
      },
      useTransition: self.userConfig.useTransition,
      end: function(e) {
        callback && callback();
        if ((self["_bounce" + type] === 0 || self["_bounce" + type] === undefined) && easing != "linear") {
          self['isScrolling' + type.toUpperCase()] = false;
          self['isRealScrolling' + type.toUpperCase()] = false;
          self.trigger("scrollend", {
            type: "scrollend",
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
      type: "scrollanimate",
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
    self.boundryCheck();
    self._unPreventHref(e);
    if (!self.isRealScrollingX && !self.isRealScrollingY) {
      self._triggerClick(e);
    }
    self._preventHref(e);
    self.isRealScrollingY = false;
    self.isRealScrollingY = false;
  },
  _bindEvt: function() {
    SimuScroll.superclass._bindEvt.call(this);
    var self = this;
    if (self.__isEvtBind) return;
    self.__isEvtBind = true;
    var pinch = new Hammer.Pinch();
    self.mc.add(pinch);
    self.on("touchstart mousedown", self._ontouchstart, self);
    self.on("touchmove", self._ontouchmove, self);
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
  _ontouchstart: function(e) {
    var self = this;
    if (!(/(SELECT|INPUT|TEXTAREA)/i).test(e.target.tagName) && self.userConfig.preventDefault) {
      e.preventDefault();
    }
    self.stop();
  },
  _ontouchmove: function(e) {
    this.userConfig.preventTouchMove && e.preventDefault();
  },
  _onpanstart: function(e) {
    this.userConfig.preventTouchMove && e.preventDefault();
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
    this.userConfig.preventTouchMove && e.preventDefault();
    var self = this;
    var boundry = self.boundry;
    var userConfig = self.userConfig;
    var boundryCheck = userConfig.boundryCheck;
    var bounce = userConfig.bounce;
    var scrollTop = self.__topstart || (self.__topstart = -self.getScrollTop());
    var scrollLeft = self.__leftstart || (self.__leftstart = -self.getScrollLeft());
    var y = userConfig.lockY ? Number(scrollTop) : Number(scrollTop) + (e.deltaY + self.thresholdY);
    var x = userConfig.lockX ? Number(scrollLeft) : Number(scrollLeft) + (e.deltaX + self.thresholdX);
    var containerWidth = self.containerWidth;
    var containerHeight = self.containerHeight;
    if (boundryCheck) {
      //over top
      y = y > boundry.top ? bounce ? (y - boundry.top) * PAN_RATE + boundry.top : boundry.top : y;
      //over bottom
      y = y < boundry.bottom - containerHeight ? bounce ? y + (boundry.bottom - containerHeight - y) * PAN_RATE : boundry.bottom - containerHeight : y;
      //over left
      x = x > boundry.left ? bounce ? (x - boundry.left) * PAN_RATE + boundry.left : boundry.left : x;
      //over right
      x = x < boundry.right - containerWidth ? bounce ? x + (boundry.right - containerWidth - x) * PAN_RATE : boundry.right - containerWidth : x;
    }
    //move to x,y
    self.translate(x, y);
    //pan trigger the opposite direction
    self.directionX = e.type == 'panleft' ? 'right' : e.type == 'panright' ? 'left' : '';
    self.directionY = e.type == 'panup' ? 'down' : e.type == 'pandown' ? 'up' : '';
    self.trigger("scroll", {
      scrollTop: -y,
      scrollLeft: -x,
      triggerType: "pan",
      type: "scroll"
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
    return -this.boundry.top - this.getScrollTop();
  },
  /**
   * get the offset value outsideof left
   * @memberof SimuScroll
   * @return {number} offset
   **/
  getBoundryOutLeft: function() {
    return -this.boundry.left - this.getScrollLeft();
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
    var boundry = self.boundry;
    var pos = type == "x" ? self.getScrollLeft() : self.getScrollTop();
    var boundryStart = type == "x" ? boundry.left : boundry.top;
    var boundryEnd = type == "x" ? boundry.right : boundry.bottom;
    var innerSize = type == "x" ? self.containerWidth : self.containerHeight;
    var maxSpeed = userConfig.maxSpeed || 2;
    var boundryCheck = userConfig.boundryCheck;
    var bounce = userConfig.bounce;
    var transition = {};
    var status = "inside";
    if (boundryCheck) {
      if (type == "x" && (self.isBoundryOutLeft() || self.isBoundryOutRight())) {
        self.boundryCheckX();
        return;
      } else if (type == "y" && (self.isBoundryOutTop() || self.isBoundryOutBottom())) {
        self.boundryCheckY();
        return;
      }
    }
    if (type == "x" && self.userConfig.lockX) return;
    if (type == "y" && self.userConfig.lockY) return;
    v = v > maxSpeed ? maxSpeed : v < -maxSpeed ? -maxSpeed : v;
    var a = self.SCROLL_ACCELERATION * (v / (Math.abs(v) || 1));
    var a2 = self.BOUNDRY_ACCELERATION;
    var t = isNaN(v / a) ? 0 : v / a;
    var s = Number(pos) + t * v / 2;
    //over top boundry check bounce
    if (s < -boundryStart && boundryCheck) {
      var _s = -boundryStart - pos;
      var _t = (Math.sqrt(-2 * a * _s + v * v) + v) / a;
      var v0 = v - a * _t;
      var _t2 = Math.abs(v0 / a2);
      var s2 = v0 / 2 * _t2;
      t = _t + _t2;
      s = bounce ? -boundryStart + s2 : -boundryStart;
      status = "outside";
    } else if (s > innerSize - boundryEnd && boundryCheck) {
      var _s = (boundryEnd - innerSize) + pos;
      var _t = (Math.sqrt(-2 * a * _s + v * v) - v) / a;
      var v0 = v - a * _t;
      var _t2 = Math.abs(v0 / a2);
      var s2 = v0 / 2 * _t2;
      t = _t + _t2;
      s = bounce ? innerSize - boundryEnd + s2 : innerSize - boundryEnd;
      status = "outside";
    }
    if (isNaN(s) || isNaN(t)) return;
    transition.pos = s;
    transition.duration = t;
    transition.easing = Math.abs(v) > 2 ? "circular" : "quadratic";
    transition.status = status;
    var Type = type.toUpperCase();
    self['isScrolling' + Type] = true;
    self['isRealScrolling' + Type] = true;
    return transition;
  },
  /**
   * bounce to the boundry horizontal
   * @memberof SimuScroll
   * @return {SimuScroll}
   **/
  boundryCheckX: function(duration, easing, callback) {
    var self = this;
    if (!self.userConfig.boundryCheck) return;
    if (typeof arguments[0] == "function") {
      callback = arguments[0];
      duration = self.userConfig.BOUNDRY_CHECK_DURATION;
      easing = self.userConfig.BOUNDRY_CHECK_EASING;
    } else {
      duration = duration === 0 ? 0 : self.userConfig.BOUNDRY_CHECK_DURATION,
        easing = easing || self.userConfig.BOUNDRY_CHECK_EASING;
    }
    if (!self.userConfig.bounce || self.userConfig.lockX) return;
    var boundry = self.boundry;
    if (self.isBoundryOutLeft()) {
      self.scrollLeft(-boundry.left, duration, easing, callback);
    } else if (self.isBoundryOutRight()) {
      self.scrollLeft(self.containerWidth - boundry.right, duration, easing, callback);
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
    if (!self.userConfig.boundryCheck) return;
    if (typeof arguments[0] == "function") {
      callback = arguments[0];
      duration = self.userConfig.BOUNDRY_CHECK_DURATION;
      easing = self.userConfig.BOUNDRY_CHECK_EASING;
    } else {
      duration = duration === 0 ? 0 : self.userConfig.BOUNDRY_CHECK_DURATION,
        easing = easing || self.userConfig.BOUNDRY_CHECK_EASING;
    }
    if (!self.userConfig.boundryCheck || self.userConfig.lockY) return;
    var boundry = self.boundry;
    if (self.isBoundryOutTop()) {
      self.scrollTop(-boundry.top, duration, easing, callback);
    } else if (self.isBoundryOutBottom()) {
      self.scrollTop(self.containerHeight - boundry.bottom, duration, easing, callback);
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
    return self;
  },
  /**
   * init scrollbars
   * @memberof SimuScroll
   * @return {SimuScroll}
   */
  initScrollBars: function() {
    var self = this;
    if (!self.userConfig.boundryCheck) return;
    var indicatorInsets = self.userConfig.indicatorInsets;
    if (self.userConfig.scrollbarX) {
      self.scrollbarX = self.scrollbarX || new ScrollBar({
        xscroll: self,
        type: "x",
        spacing: indicatorInsets.spacing
      });
      self.scrollbarX.render();
      self.scrollbarX._update();
      self.scrollbarX.hide();
    }
    if (self.userConfig.scrollbarY) {
      self.scrollbarY = self.scrollbarY || new ScrollBar({
        xscroll: self,
        type: "y",
        spacing: indicatorInsets.spacing
      });
      self.scrollbarY.render();
      self.scrollbarY._update();
      self.scrollbarY.hide();
    }
    return self;
  },
  /**
   * destroy scrollbars
   * @memberof SimuScroll
   * @return {SimuScroll}
   */
  destroyScrollBars: function() {
    this.scrollbarX && this.scrollbarX.destroy();
    this.scrollbarY && this.scrollbarY.destroy();
    return this;
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
  },
  _unPreventHref: function(e) {
    var target = Util.findParentEl(e.target,'a',this.renderTo);
    if(!target) return;
    if (target.tagName.toLowerCase() == "a") {
      var href = target.getAttribute("data-xs-href");
      if (href) {
        target.setAttribute("href", href);
      }
    }
  },
  _preventHref: function(e) {
    var target = Util.findParentEl(e.target,'a',this.renderTo);
    if(!target) return;
    if (target.tagName.toLowerCase() == "a") {
      var href = target.getAttribute("href");
      href && target.setAttribute("href", "javascript:void(0)");
      href && target.setAttribute("data-xs-href", href);
    }
  },
  _triggerClick: function(e) {
    var target = e.target;
    if (!(/(SELECT|INPUT|TEXTAREA)/i).test(target.tagName)) {
      var ev = document.createEvent('MouseEvents');
      ev.initMouseEvent('click', true, true, e.view, 1,
        target.screenX, target.screenY, target.clientX, target.clientY,
        e.ctrlKey, e.altKey, e.shiftKey, e.metaKey,
        0, null);
      target.dispatchEvent(ev);
    }
  }
});

if (typeof module == 'object' && module.exports) {
  module.exports = SimuScroll;
}
/** ignored by jsdoc **/
else {
  return SimuScroll;
}
});