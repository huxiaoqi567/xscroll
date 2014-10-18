define(function(require, exports, module) {
    var win = window;
    var Util = require('util');
    var Event = require('event');
    var Pan = require('pan');
    var Tap = require('tap');
    var Pinch = require('pinch');
    var ScrollBar = require('scrollbar');
    var PullDown = require('pulldown');
    var SwipeEdit = require('swipeedit');
    //global namespace
    var XScroll = function(cfg) {
        this.userConfig = cfg;
        this.init();
    };
    XScroll.PullDown = PullDown;
    XScroll.version = "1.0.0";
    //event names
    var SCROLL_END = "scrollend";
    var SCROLL = "scroll";
    var PAN_END = "panend";
    var PAN_START = "panstart";
    var PAN = "pan";
    var SCROLL_ANIMATE = "scrollanimate";
    var SCALE_ANIMATE = "scaleanimate";
    var SCALE = "scale";
    var AFTER_RENDER = "afterrender";
    var REFRESH = "refresh";
    //constant acceleration for scrolling
    var SROLL_ACCELERATION = 0.0005;
    //boundry checked bounce effect
    var BOUNDRY_CHECK_DURATION = 300;
    var BOUNDRY_CHECK_EASING = "ease-in-out";
    var BOUNDRY_CHECK_ACCELERATION = 0.1;
    //reduced boundry pan distance
    var PAN_RATE = 0.36;
    // reduced scale rate
    var SCALE_RATE = 0.7;

    var SCALE_TO_DURATION = 300;
    //transform
    var transform = Util.prefixStyle("transform");
    //transition webkitTransition MozTransition OTransition msTtransition
    var transition = Util.prefixStyle("transition");

    var transitionDuration = Util.prefixStyle("transitionDuration");

    var transformOrigin = Util.prefixStyle("transformOrigin");

    var transitionEnd = Util.vendor ? Util.prefixStyle("transitionEnd") : "transitionend";

    var transformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";

    var quadratic = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';

    var circular = 'cubic-bezier(0.1, 0.57, 0.1, 1)';

    function quadratic2cubicBezier(a, b) {
        return [
            [(a / 3 + (a + b) / 3 - a) / (b - a), (a * a / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)],
            [(b / 3 + (a + b) / 3 - a) / (b - a), (b * b / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)]
        ];
    }

    var RAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    var vendors = ['webkit', 'moz', 'ms', 'o'];
    var cancelRAF = window.cancelAnimationFrame;
    for (var i = 0; i < vendors.length; i++) {
        if (window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame']) {
            cancelRAF = window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
        }
    }
    cancelRAF = cancelRAF || window.clearTimeout;
    //simulateMouseEvent
    var simulateMouseEvent = function(event, type) {
        if (event.touches.length > 1) {
            return;
        }
        var touches = event.changedTouches,
            first = touches[0],
            simulatedEvent = document.createEvent('MouseEvent');
        simulatedEvent.initMouseEvent(type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0 /*left*/ , null);
        event.target.dispatchEvent(simulatedEvent);
    }
    /**
     *
     * @class Xscroll
     * @constructor
     * @extends Base
     */
    Util.mix(XScroll.prototype, {
        init: function() {
            var self = this;
            self.__events = {};
            var userConfig = self.userConfig = Util.mix({
                scalable: false,
                scrollbarX: true,
                scrollbarY:true,
                gpuAcceleration:true
            }, self.userConfig, undefined, undefined, true);
            self.renderTo = userConfig.renderTo.nodeType ? userConfig.renderTo : document.querySelector(userConfig.renderTo);
            self.scale = userConfig.scale || 1;
            self.boundryCheckEnabled = true;
            var clsPrefix = self.clsPrefix = userConfig.clsPrefix || "xs-";
            self.SROLL_ACCELERATION = userConfig.SROLL_ACCELERATION || SROLL_ACCELERATION;
            self.containerClsName = clsPrefix + "container";
            self.contentClsName = clsPrefix + "content";
        },
        /*
            render & scroll to top
        */
        refresh: function() {
            var self = this;
            self.render();
            self.scrollTo({
                x: 0,
                y: 0
            });
            self.fire(REFRESH)
        },
        render: function() {
            var self = this;
            var userConfig = self.userConfig;
            self._createContainer();
            var width = userConfig.width || self.renderTo.offsetWidth;
            var height = userConfig.height || self.renderTo.offsetHeight || 0;
            self.width = width;
            self.height = height;
            var containerWidth = userConfig.containerWidth || self.content.offsetWidth;
            var containerHeight = userConfig.containerHeight || self.content.offsetHeight;
            self.containerWidth = containerWidth < self.width ? self.width : containerWidth;
            self.containerHeight = containerHeight < self.height ? self.height : containerHeight;
            self.initialContainerWidth = self.containerWidth;
            self.initialContainerHeight = self.containerHeight;
            //最小缩放比
            var minScale = self.userConfig.minScale || Math.max(self.width / self.containerWidth, self.height / self.containerHeight);
            var maxScale = self.userConfig.maxScale || 1;
            self.minScale = minScale;
            self.maxScale = maxScale;

            self.boundry = {
                reset: function() {
                    this.resetTop();
                    this.resetLeft();
                    this.resetBottom();
                    this.resetRight();
                    return this;
                },
                resetTop:function(){
                    this.top = 0;
                    return this;
                },
                resetLeft:function(){
                    this.left = 0;
                    return this;
                },
                resetBottom:function(){
                    this.bottom = self.height;
                    return this;
                },
                resetRight:function(){
                    this.right = self.width;
                    return this;
                },
                expandTop: function(top) {
                    this.top += top || 0;
                    return this;
                },
                expandLeft: function(left) {
                    this.left += left || 0;
                    return this;
                },
                expandRight: function(right) {
                    this.right -= right || 0;
                    return this;
                },
                expandBottom: function(bottom) {
                    this.bottom -= bottom || 0;
                    return this;
                }
            };

            self.boundry.reset();
            self.fire(AFTER_RENDER);
            self.renderScrollBars();
            self._bindEvt();
        },
        renderScrollBars: function() {
            var self = this;
            if (self.userConfig.scrollbarX) {
                if(self.scrollbarX){
                    self.scrollbarX._update();
                }else{
                    self.scrollbarX = new ScrollBar({
                        xscroll: self,
                        type: "x"
                    });
                }
            }
            if (self.userConfig.scrollbarY) {
                if(self.scrollbarY){
                    self.scrollbarY._update();
                }else{
                    self.scrollbarY = new ScrollBar({
                        xscroll: self,
                        type: "y"
                    });
                }
            }
        },
        _createContainer: function() {
            var self = this;
            if (self.__isContainerCreated) return;
            var renderTo = self.renderTo;
            var container = self.container = self.renderTo.getElementsByClassName(self.containerClsName)[0];
            var content = self.content = self.renderTo.getElementsByClassName(self.contentClsName)[0];
            container.style.position = "absolute";
            container.style.height = "100%";
            container.style.width = "100%";
            container.style[transformOrigin] = "0 0";
            content.style.position = "absolute";
            content.style[transformOrigin] = "0 0";
            self.translate({
                x: 0,
                y: 0
            });
            self.__isContainerCreated = true;
        },
        //translate a element 
        translate: function(offset) {
            this.translateX(offset.x)
            this.translateY(offset.y)
            return;
        },
        _scale: function(scale, originX, originY, triggerEvent) {
            var self = this;
            if (!self.userConfig.scalable || self.scale == scale || !scale) return;

            if (!self.isScaling) {
                self.scaleBegin = self.scale;
                self.isScaling = true;
                self.scaleBeginX = self.x;
                self.scaleBeginY = self.y;
            }
            if (originX) {
                self.originX = originX;
            }
            if (originY) {
                self.originY = originY;
            }
            var boundry = self.boundry;
            var containerWidth = scale * self.initialContainerWidth;
            var containerHeight = scale * self.initialContainerHeight;
            self.containerWidth = Math.round(containerWidth > self.width ? containerWidth : self.width);

            self.containerHeight = Math.round(containerHeight > self.height ? containerHeight : self.height);
            self.scale = scale;
            var x = originX * (self.initialContainerWidth * self.scaleBegin - self.containerWidth) + self.scaleBeginX;
            var y = originY * (self.initialContainerHeight * self.scaleBegin - self.containerHeight) + self.scaleBeginY;
            if (x > boundry.left) {
                x = boundry.left;
            }
            if (y > boundry.top) {
                y = boundry.top;
            }
            if (x < boundry.right - self.containerWidth) {
                x = boundry.right - self.containerWidth;
            }
            if (y < boundry.bottom - self.containerHeight) {
                y = boundry.bottom - self.containerHeight
            }
            self.x = x;
            self.y = y;
            self._transform();
            self.fire(SCALE, {
                scale: scale,
                origin: {
                    x: originX,
                    y: originY
                },
                triggerEvent: triggerEvent
            })
        },
        /*
            scale(0.5,0.5,0.5,500,"ease-out")
            @param {Number} scale 缩放比
            @param {Float} 0~1之间的缩放中心值 水平方向
            @param {Fload} 0~1之间的缩放中心值 垂直方向
            @param {Number} 动画周期
            @param {String} 动画函数
        */
        scaleTo: function(scale, originX, originY, duration, easing, callback) {
            var self = this;
            //不可缩放
            if (!self.userConfig.scalable || self.scale == scale || !scale) return;
            var duration = duration || 1;
            var easing = easing || "ease-out",
                transitionStr = [transformStr, " ", duration / 1000, "s ", easing, " 0s"].join("");
            var start = Date.now();
            self.destTimeScale = start + duration;
            cancelRAF(self._rafScale);
            var scaleStart = self.scale;
            var step = 0;
            var run = function() {
                var now = Date.now();
                if (now > start + duration && now >= self.destTimeScale) {
                    self.isScaling = false;
                    return;
                }
                self._rafScale = RAF(run);
            }
            run();
            self.container.style[transition] = transitionStr;
            self.content.style[transition] = transitionStr;
            self._scale(scale, originX, originY, "scaleTo");
            self.fire(SCALE_ANIMATE, {
                scale: self.scale,
                duration: duration,
                easing: easing,
                offset: {
                    x: self.x,
                    y: self.y
                },
                origin: {
                    x: originX,
                    y: originY
                }
            });
        },
        translateX: function(x) {
            this.x = x;
            this._transform();
        },
        translateY: function(y) {
            this.y = y;
            this._transform();
        },
        _noTransition: function() {
            var self = this;
            if (Util.isBadAndroid) {
                self.content.style[transitionDuration] = "0.001s";
                self.container.style[transitionDuration] = "0.001s";
            } else {
                self.content.style[transition] = "none";
                self.container.style[transition] = "none";
            }
        },
        stop: function() {
            var self = this;
            if (self.isScaling) return;
            var boundry = self.boundry;
            var offset = self.getOffset();
            //outside of boundry 
            if (offset.y > boundry.top || offset.y + self.containerHeight < boundry.bottom || offset.x > boundry.left || offset.x + self.containerWidth < boundry.right) {
                return;
            } 
            self.translate(offset);
            self._noTransition();
            cancelRAF(self.rafX);
            cancelRAF(self.rafY);
            self.fire(SCROLL_END, {
                offset: offset,
                scale: self.scale,
                zoomType: "xy"
            });
        },
        enableGPUAcceleration:function(){
            this.userConfig.gpuAcceleration = true;
        },
        disableGPUAcceleration: function() {
            this.userConfig.gpuAcceleration = false;
        },
        _transform: function() {
            var translateZ = this.userConfig.gpuAcceleration ? " translateZ(0) " : "";
            this.content.style[transform] = "translate(" + this.x + "px,0px)  scaleX(" + this.scale + ") scaleY(" + this.scale + ") " + translateZ;
            this.container.style[transform] = "translate(0px," + this.y + "px) " + translateZ;
        },
        getOffset: function() {
            var self = this;
            return {
                x: self.getOffsetLeft(),
                y: self.getOffsetTop()
            }
        },
        getOffsetTop: function() {
            if (this.lockY) return 0;
            var transY = window.getComputedStyle(this.container)[transform].match(/[-\d\.*\d*]+/g);
            return transY ? Math.round(transY[5]) : 0;
        },
        getOffsetLeft: function() {
            if (this.lockX) return 0;
            var transX = window.getComputedStyle(this.content)[transform].match(/[-\d\.*\d*]+/g);
            return transX ? Math.round(transX[4]) : 0;
        },
        /**
         * scroll the root element with an animate
         * @param offset {Object} scrollTop
         * @param duration {Number} duration for animte
         * @param easing {Number} easing functio for animate : ease-in | ease-in-out | ease | bezier
         **/
        scrollTo: function(offset, duration, easing, callback) {
            var self = this;
            var _offset = self.getOffset();
            var x = (undefined === offset.x || isNaN(offset.x)) ? -_offset.x : offset.x;
            var y = (undefined === offset.y || isNaN(offset.y)) ? -_offset.y : offset.y;
            self.scrollX(x, duration, easing, callback);
            self.scrollY(y, duration, easing, callback);
        },
        scrollX: function(x, duration, easing, callback) {
            var self = this;
            var x = Math.round(x);
            if (self.userConfig.lockX) return;
            var duration = duration || 0;
            var easing = easing || "cubic-bezier(0.333333, 0.666667, 0.666667, 1)";
            var content = self.content;
            self.translateX(-x);
            var transitionStr = duration > 0 ? [transformStr, " ", duration / 1000, "s ", easing, " 0s"].join("") : "none";
            content.style[transition] = transitionStr;
            self._scrollHandler(-x, duration, callback, easing, transitionStr, "x");
            return content.style[transition] = transitionStr;
        },
        scrollY: function(y, duration, easing, callback) {
            var self = this;
            var y = Math.round(y);
            if (self.userConfig.lockY) return;
            var duration = duration || 0;
            var easing = easing || "cubic-bezier(0.333333, 0.666667, 0.666667, 1)";
            var container = self.container;
            self.translateY(-y);
            var transitionStr = duration > 0 ? [transformStr, " ", duration / 1000, "s ", easing, " 0s"].join("") : "none";
            container.style[transition] = transitionStr;
            self._scrollHandler(-y, duration, callback, easing, transitionStr, "y");
            return container.style[transition] = transitionStr;
        },
        _scrollHandler: function(dest, duration, callback, easing, transitionStr, type) {
            var self = this;
            var offset = self.getOffset();
            //目标值等于当前至 则不发生滚动
            if (duration <= 0) {
                self.fire(SCROLL, {
                    zoomType: type,
                    offset: offset
                });
                self.fire(SCROLL_END, {
                    zoomType: type,
                    offset: offset
                });
                return;
            }
            var Type = type.toUpperCase();

            self['isScrolling' + Type] = true;
            var start = Date.now();
            self['destTime' + Type] = start + duration;
            cancelRAF(self['raf' + Type]);
            //注册滚动结束事件  供transitionEnd进行精确回调
            self['__scrollEndCallback' + Type] = function(args) {
                self['isScrolling' + Type] = false;
                self.fire(SCROLL_END, {
                    offset: self.getOffset(),
                    zoomType: args.type
                })
                callback && callback(args);
            }
            var run = function() {
                var now = Date.now();
                if (self['isScrolling' + Type]) {
                    RAF(function() {
                        self.fire(SCROLL, {
                            zoomType: type,
                            offset: self.getOffset()
                        });
                    }, 0);
                }
                self['raf' + Type] = RAF(run);
            }
            run();

            self.fire(SCROLL_ANIMATE, {
                transition: transitionStr,
                offset: {
                    x: self.x,
                    y: self.y
                },
                duration: duration / 1000,
                easing: easing,
                zoomType: type
            })
        },
        boundryCheckX: function(callback) {
            var self = this;
            if (!self.boundryCheckEnabled || self.userConfig.lockX) return;
            var offset = self.getOffset();
            var containerWidth = self.containerWidth;
            var boundry = self.boundry;
            if (offset.x > boundry.left) {
                offset.x = boundry.left;
                self.scrollX(-offset.x, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
            } else if (offset.x + containerWidth < boundry.right) {
                offset.x = boundry.right - containerWidth;
                self.scrollX(-offset.x, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
            }
        },
        boundryCheckY: function(callback) {
            var self = this;
            if (!self.boundryCheckEnabled || self.userConfig.lockY) return;
            var offset = self.getOffset();
            var containerHeight = self.containerHeight;
            var boundry = self.boundry;
            if (offset.y > boundry.top) {
                offset.y = boundry.top;
                self.scrollY(-offset.y, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
            } else if (offset.y + containerHeight < boundry.bottom) {
                offset.y = boundry.bottom - containerHeight;
                self.scrollY(-offset.y, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
            }
        },
        //boundry back bounce
        boundryCheck: function(callback) {
            this.boundryCheckX(callback);
            this.boundryCheckY(callback);
        },
        /**
         * enable the switch for boundry back bounce
         **/
        bounce: function(isEnabled, callback) {
            this.boundryCheckEnabled = isEnabled;
            isEnabled ? this.boundryCheck(callback) : undefined;
            return;
        },
        _fireTouchStart:function(e){
            this.fire("touchstart",e);
        },
        _firePanStart:function(e){
            this.fire(PAN_START, e);
        },
        _firePan:function(e){
            this.fire(PAN, e);
        },
        _firePanEnd:function(e){
            this.fire(PAN_END, e);
        },
        _fireClick:function(eventName,e){
            this.fire(eventName,e);
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
            var offset = {
                x: 0,
                y: 0
            };
            var boundry = self.boundry;
            Event.on(renderTo, "touchstart", function(e) {
                e.preventDefault();
                self._fireTouchStart(e);
                self.stop();
            }).on(renderTo, Tap.TAP, function(e) {
                self.boundryCheck();
                if (!self.isScrollingX && !self.isScrollingY) {
                    simulateMouseEvent(e, "click");
                    self._fireClick("click",e);
                } else {
                    self.isScrollingX = false;
                    self.isScrollingY = false;
                    self.stop();
                }
            }).on(renderTo, Pan.PAN_START, function(e) {
                offset = self.getOffset();
                self.translate(offset);
                self._firePanStart(Util.mix(e,{
                    offset: offset
                }));
            }).on(renderTo, Pan.PAN, function(e) {
                var posY = self.userConfig.lockY ? Number(offset.y) : Number(offset.y) + e.deltaY;
                var posX = self.userConfig.lockX ? Number(offset.x) : Number(offset.x) + e.deltaX;
                containerWidth = self.containerWidth;
                containerHeight = self.containerHeight;
                if (posY > boundry.top) { //overtop 
                    posY = (posY - boundry.top) * PAN_RATE + boundry.top;
                }
                if (posY < boundry.bottom - containerHeight) { //overbottom 
                    posY = posY + (boundry.bottom - containerHeight - posY) * PAN_RATE;
                }
                if (posX > boundry.left) { //overleft
                    posX = (posX - boundry.left) * PAN_RATE + boundry.left;
                }
                if (posX < boundry.right - containerWidth) { //overright
                    posX = posX + (boundry.right - containerWidth - posX) * PAN_RATE;
                }
                self.translate({
                    x: posX,
                    y: posY
                });
                self._noTransition();
                self.isScrollingX = false;
                self.isScrollingY = false;
                self.directionX = e.directionX;
                self.directionY = e.directionY;
                var evt = Util.mix(e,{
                    offset: {
                        x: posX,
                        y: posY
                    },
                    directionX: self.directionX,
                    directionY: self.directionY
                });
                self.fire(SCROLL, evt);
                self._firePan(evt);

            }).on(renderTo, Pan.PAN_END, function(e) {
                self.panEndHandler(e);
                self._firePanEnd(e)
            })

            Event.on(container, transitionEnd, function(e) {
                if (e.target == content && !self.isScaling) {
                    self.__scrollEndCallbackX && self.__scrollEndCallbackX({
                        type: "x"
                    });
                }
                if (e.target == container && !self.isScaling) {
                    self.__scrollEndCallbackY && self.__scrollEndCallbackY({
                        type: "y"
                    });
                }
            }, false);
            //可缩放
            if (self.userConfig.scalable) {
                var originX, originY;
                Event.on(renderTo, Pinch.PINCH_START, function(e) {
                    scale = self.scale;
                    originX = (e.origin.pageX - self.x) / self.containerWidth;
                    originY = (e.origin.pageY - self.y) / self.containerHeight;
                });
                Event.on(renderTo, Pinch.PINCH, function(e) {
                    self._scale(scale * e.scale, originX, originY, "pinch");
                });
                Event.on(renderTo, Pinch.PINCH_END, function(e) {
                    self.isScaling = false;
                    if (self.scale < self.minScale) {
                        self.scaleTo(self.minScale, originX, originY, SCALE_TO_DURATION);
                    } else if (self.scale > self.maxScale) {
                        self.scaleTo(self.maxScale, originX, originY, SCALE_TO_DURATION);
                    }
                })
                Event.on(renderTo, Tap.DOUBLE_TAP, function(e) {
                    originX = (e.pageX - self.x) / self.containerWidth;
                    originY = (e.pageY - self.y) / self.containerHeight;
                    self.scale > self.minScale ? self.scaleTo(self.minScale, originX, originY, 200) : self.scaleTo(self.maxScale, originX, originY, 200);
                })
            }
            Event.on(win, "resize", function(e) {
                self.refresh();
            })
        },
        panEndHandler: function(e) {
            var self = this;
            var userConfig = self.userConfig;
            var offset = self.getOffset();
            var transX = self._bounce("x", offset.x, e.velocityX, self.width, self.containerWidth);
            var transY = self._bounce("y", offset.y, e.velocityY, self.height, self.containerHeight);
            var x = transX ? transX.offset : 0;
            var y = transY ? transY.offset : 0;
            var duration;
            if (transX && transY && transX.status && transY.status && transX.duration && transY.duration) {
                //保证常规滚动时间相同 x y方向不发生时间差
                duration = Math.max(transX.duration, transY.duration);
            }
            if(transX){
                if(transX.duration < 100){
                     self._scrollEndHandler("x");
                }else{
                    self.scrollX(x, duration || transX.duration, transX.easing, function(e) {
                        self._scrollEndHandler("x");
                    });
                }
            }
            
            if(transY){
                if(transY.duration < 100){
                    self._scrollEndHandler("y");
                }else{
                    self.scrollY(y, duration || transY.duration, transY.easing, function(e) {
                        self._scrollEndHandler("y");
                    });
                }
            }
            //judge the direction
            self.directionX = e.velocityX < 0 ? "left" : "right";
            self.directionY = e.velocityY < 0 ? "up" : "down";
        },
        _scrollEndHandler: function(type) {
            var self = this;
            var TYPE = type.toUpperCase();
            var scrollFn = "scroll"+TYPE;
            var boundryCheckFn = "boundryCheck"+TYPE;
            var _bounce = "_bounce"+type;
            if (self[_bounce]) {
                self.fire("outOfBoundry")
                var v = self[_bounce];
                var a = 0.04 * (v / Math.abs(v));
                var t = v / a;
                var s0 = self.getOffset()[type];
                var s = s0 + t * v / 2;
                self[scrollFn](-s, t, "cubic-bezier(" + quadratic2cubicBezier(-t, 0) + ")", function() {
                    self[_bounce] = 0;
                    self[boundryCheckFn]()
                });
            } else {
                 self[boundryCheckFn]();
            }
        },
        fire: function(evt) {
            var self = this;
            if (self.__events[evt] && self.__events[evt].length) {
                for (var i in self.__events[evt]) {
                    self.__events[evt][i].apply(this,[].slice.call(arguments, 1));
                }
            }
        },
        on: function(evt, fn) {
            if (!this.__events[evt]) {
                this.__events[evt] = [];
            }
            this.__events[evt].push(fn);
        },
        detach: function(evt, fn) {
            if (!evt || !this.__events[evt]) return;
            var index = this.__events[evt].indexOf(fn);
            if (index > -1) {
                this.__events[evt].splice(index, 1);
            }
        },
        _bounce: function(type, offset, v, size, innerSize) {
            var self = this;
            var boundry = self.boundry;
            var boundryStart = type == "x" ? boundry.left : boundry.top;
            var boundryEnd = type == "x" ? boundry.right : boundry.bottom;
            var size = boundryEnd - boundryStart; 
            var transition = {};
            if (v === 0) {
                type == "x" ? self.boundryCheckX() : self.boundryCheckY();
                return;
            }
            if (type == "x" && self.userConfig.lockX) return;
            if (type == "y" && self.userConfig.lockY) return;
            var userConfig = self.userConfig;
            var maxSpeed = userConfig.maxSpeed > 0 && userConfig.maxSpeed < 6 ? userConfig.maxSpeed : 3;
            if (v > maxSpeed) {
                v = maxSpeed;
            }
            if (v < -maxSpeed) {
                v = -maxSpeed;
            }
            if (offset > boundryStart || offset < size - innerSize) {
                var a = BOUNDRY_CHECK_ACCELERATION * (v / Math.abs(v));
                var t = v / a;
                var s = offset + t * v / 2;
                transition.offset = -s;
                transition.duration = t;
                transition.easing = "cubic-bezier(" + quadratic2cubicBezier(-t, 0) + ")";
                return transition;
            }

            var a = self.SROLL_ACCELERATION * (v / Math.abs(v));
            var t = v / a;
            var s = offset / 1 + t * v / 2;
            //over top boundry check bounce
            if (s > boundryStart) {
                var _s = boundryStart - offset;
                var _t = (v - Math.sqrt(-2 * a * _s + v * v)) / a;
                transition.offset = -boundryStart;
                transition.duration = _t;
                transition.easing = "cubic-bezier(" + quadratic2cubicBezier(-t, -t + _t) + ")";
                self["_bounce" + type] = v - a * _t;
                //over bottom boundry check bounce
            } else if (s < size - innerSize) {
                var _s = (size - innerSize) - offset;
                var _t = (v + Math.sqrt(-2 * a * _s + v * v)) / a;
                transition.offset = innerSize - size;
                transition.duration = _t;
                transition.easing = "cubic-bezier(" + quadratic2cubicBezier(-t, -t + _t) + ")";
                self["_bounce" + type] = v - a * _t;
                // normal
            } else {
                transition.offset = -s;
                transition.duration = t;
                transition.easing = "cubic-bezier(" + quadratic2cubicBezier(-t, 0) + ")";
                transition.status = "normal";
            }
            self['isScrolling' + type.toUpperCase()] = true;
            return transition;

        },
        plug:function(plugin){
            var self = this;
            if(!plugin || !plugin.pluginId) return;
            if(!self.__plugins){
                self.__plugins = [];
            }
            plugin.initializer(self);
            self.__plugins.push(plugin);
        },
        unplug:function(plugin){
            var self = this;
            if(!plugin) return;
            var _plugin = typeof plugin == "string" ? self.getPlugin(plugin) : plugin;
            for(var i in self.__plugins){
                if(self.__plugins[i] == _plugin){
                    return self.__plugins[i].splice(i,1);
                }
            }
        },
        getPlugin:function(pluginId){
            var self = this;
            var plugins = [];
            for(var i in self.__plugins){
                if(self.__plugins[i] && self.__plugins[i].pluginId == pluginId){
                    plugins.push(self.__plugins[i])
                }
            }
            return plugins.length > 1 ? plugins : plugins[0] || null;
        }
    });


   window.XScroll = XScroll;

    return XScroll;

});