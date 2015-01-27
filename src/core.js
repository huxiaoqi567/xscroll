    var Base = require('./base');
    var Util = require('./util');
    var Event = require('./event');
    var Pan = require('./pan');
    var Tap = require('./tap');
    var Pinch = require('./pinch');
    var Timer = require('./timer');
    var ScrollBar = require('./scrollbar');
    var PullDown = require('./pulldown');
    var PullUp = require('./pullup');
    var Boundry = require('./boundry');
    var Easing = require('./easing');
    var XScroll = function(cfg) {
        XScroll.superclass.constructor.call(this);
        this.userConfig = cfg;
        this.init();
    };
    XScroll.Util = Util;
    //namespace for plugins
    XScroll.Plugin = {
        PullDown: PullDown,
        PullUp: PullUp
    };
    //namespace for gesture
    XScroll.Gesture = {
            Pan: Pan,
            Tap: Tap,
            Pinch: Pinch
        }
        //event names
    var SCROLL_END = "scrollend";
    var SCROLL = "scroll";
    var PAN_END = "panend";
    var PAN_START = "panstart";
    var PAN = "pan";
    var PINCH_START = "pinchstart";
    var PINCH = "pinch";
    var PINCH_END = "pinchend";
    var SCROLL_ANIMATE = "scrollanimate";
    var SCALE_ANIMATE = "scaleanimate";
    var SCALE = "scale";
    var SCALE_END = "scaleend";
    var SNAP_START = "snapstart";
    var SNAP = "snap";
    var SNAP_END = "snapend";
    var AFTER_RENDER = "afterrender";
    var BOUNDRY_OUT = "boundryout";
    //constant acceleration for scrolling
    var SROLL_ACCELERATION = 0.001;
    //boundry checked bounce effect
    var BOUNDRY_CHECK_DURATION = 500;
    var BOUNDRY_CHECK_EASING = "ease";
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

    Util.extend(XScroll, Base, {
        version: "2.3.2",
        init: function() {
            var self = this;
            var userConfig = self.userConfig = Util.mix({
                preventDefault: true,
                snap: false,
                snapWidth: 100,
                snapHeight: 100,
                snapRowIndex: 0,
                snapColIndex: 0,
                snapEasing: "ease",
                snapDuration: 500,
                snapColsNum: 1,
                snapRowsNum: 1,
                bounce: true,
                bounceDirections: ["top", "right", "bottom", "left"],
                scalable: false,
                scrollbarX: true,
                scrollbarY: true,
                bounceSize: 100,
                useTransition: true,
                gpuAcceleration: true,
                BOUNDRY_CHECK_EASING: BOUNDRY_CHECK_EASING,
                BOUNDRY_CHECK_DURATION: BOUNDRY_CHECK_DURATION,
                BOUNDRY_CHECK_ACCELERATION: BOUNDRY_CHECK_ACCELERATION,
                easing: "quadratic"
            }, self.userConfig, undefined, undefined, true);
            //generate guid
            self.guid = Util.guid();
            self.renderTo = userConfig.renderTo.nodeType ? userConfig.renderTo : document.querySelector(userConfig.renderTo);
            self.scale = userConfig.scale || 1;
            //timer for animtion
            self.timer = {};
            self.boundryCheckEnabled = true;
            var clsPrefix = self.clsPrefix = userConfig.clsPrefix || "xs-";
            self.SROLL_ACCELERATION = userConfig.SROLL_ACCELERATION || SROLL_ACCELERATION;
            self.containerClsName = clsPrefix + "container";
            self.contentClsName = clsPrefix + "content";
            self.boundry = new Boundry();
            self.boundry.refresh();
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
            var minScale = self.userConfig.minScale || Math.max(self.width / self.containerWidth, self.height / self.containerHeight);
            var maxScale = self.userConfig.maxScale || 1;
            self.minScale = minScale;
            self.maxScale = maxScale;
            self.boundry.refresh({
                width: self.scale * self.width,
                height: self.scale * self.height
            });
            self.fire(AFTER_RENDER);
            self.renderScrollBars();
            self.userConfig.snap && self.initSnap();
            self._bindEvt();
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
            this.translateX(offset.x);
            this.translateY(offset.y);
            return;
        },
        _scale: function(scale, originX, originY) {
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
            self._noTransition();
        },
        /*
            scale(0.5,0.5,0.5,500,"ease-out")
            @param {Number} scale 
            @param {Float} 0~1 originX
            @param {Fload} 0~1 originY
            @param {Number} duration
            @param {String} callback
        */
        scaleTo: function(scale, originX, originY, duration, easing, callback) {
            var self = this;
            //unscalable
            if (!self.userConfig.scalable || self.scale == scale || !scale) return;
            var duration = duration || 1;
            var easing = easing || "ease-out",
                transitionStr = [transformStr, " ", duration / 1000, "s ", easing, " 0s"].join("");
            var scaleStart = self.scale;
            self.timer.scale = self.timer.scale || new Timer();
            self.timer.scale.reset({
                duration: duration
            });
            self.timer.scale.detach("run");
            self.timer.scale.on("run", function(e) {
                var _scale = (scale - scaleStart) * e.percent + scaleStart;
                self.fire(SCALE, {
                    type: SCALE,
                    scale: _scale,
                    origin: {
                        x: originX,
                        y: originY
                    }
                });
                if (!self.userConfig.useTransition) {
                    self._scale(_scale, originX, originY);
                }
            })
            self.timer.scale.detach("end");
            self.timer.scale.on("end", function() {
                self.isScaling = false;
                self.fire(SCALE_END, {
                    type: SCALE_END,
                    scale: self.scale,
                    origin: {
                        x: originX,
                        y: originY
                    }
                })
            })

            if (self.userConfig.useTransition) {
                self._scale(scale, originX, originY);
                self.container.style[transition] = transitionStr;
                self.content.style[transition] = transitionStr;
            }
            self.timer.scale.run();

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
            if (Util.isBadAndroid()) {
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
            if (self.userConfig.useTransition) {
                self.translate(offset);
                self._noTransition();
            }
            for (var i in self.timer) {
                self.timer[i].stop()
            }
            //clear the bounce
            self._bouncex = 0;
            self._bouncey = 0;
            self.fire(SCROLL_END, {
                type: SCROLL_END,
                offset: offset,
                scale: self.scale,
                zoomType: "xy"
            });
        },
        enableGPUAcceleration: function() {
            this.userConfig.gpuAcceleration = true;
        },
        disableGPUAcceleration: function() {
            this.userConfig.gpuAcceleration = false;
        },
        _transform: function() {
            var scale = this.userConfig.scalable ? " scale(" + this.scale + ") " : "";
            var translateZ = this.userConfig.gpuAcceleration ? " translateZ(0) " : "";
            this.content.style[transform] = "translate(" + this.x + "px,0px) " + scale + translateZ;
            if (!this.userConfig.lockY) {
                this.container.style[transform] = "translate(0px," + this.y + "px) " + translateZ;
            }
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
        scrollBy: function(offset, duration, easing, callback) {
            var self = this;
            self.scrollByX(offset.x, duration, easing, callback);
            self.scrollByY(offset.y, duration, easing, callback);
        },
        scrollByX: function(x, duration, easing, callback) {
            var self = this;
            var left = -self.getOffsetLeft();
            self.scrollX(Number(x) + Number(left), duration, easing, callback);
        },
        scrollByY: function(y, duration, easing, callback) {
            var self = this;
            var top = -self.getOffsetTop();
            self.scrollY(Number(y) + Number(top), duration, easing, callback);
        },
        scrollX: function(x, duration, easing, callback) {
            var self = this;
            var x = Math.round(x);
            if (self.userConfig.lockX) return;
            var duration = duration || 0;
            var easing = easing || self.userConfig.easing;
            self._scrollHandler(-x, duration, callback, easing, "x");
        },
        scrollY: function(y, duration, easing, callback) {
            var self = this;
            var y = Math.round(y);
            if (self.userConfig.lockY) return;
            var duration = duration || 0;
            var easing = easing || self.userConfig.easing;
            self._scrollHandler(-y, duration, callback, easing, "y");
        },
        boundryCheckX: function(callback) {
            var self = this;
            if (!self.boundryCheckEnabled || self.userConfig.lockX) return;
            var offset = self.getOffset();
            var containerWidth = self.containerWidth;
            var boundry = self.boundry;
            if (offset.x > boundry.left) {
                offset.x = boundry.left;
                self.scrollX(-offset.x, self.userConfig.BOUNDRY_CHECK_DURATION, self.userConfig.BOUNDRY_CHECK_EASING, callback);
            } else if (offset.x + containerWidth < boundry.right) {
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
        _fireTouchStart: function(e) {
            this.fire("touchstart", e);
        },
        _firePanStart: function(e) {
            this.fire(PAN_START, e);
        },
        _firePan: function(e) {
            this.fire(PAN, e);
        },
        _firePanEnd: function(e) {
            this.fire(PAN_END, e);
        },
        _fireClick: function(eventName, e) {
            this.fire(eventName, e);
        },
        __handlers: {
            touchstart: function(e) {
                var self = this;
                if (self.userConfig.preventDefault) {
                    e.preventDefault();
                }
                self._fireTouchStart(e);
                if (self.isScrollingX || self.isScrollingY) {
                    self.stop();
                }
            },
            tap: function(e) {
                var self = this;
                self._fireClick("click", e);
                if (!self.isScrollingX && !self.isScrollingY) {
                    if (Util.isBadAndroid() && e.target.tagName.toLowerCase() == "a") {
                        var href = e.target.getAttribute("href");
                        if (href) {
                            location.href = href;
                        }
                    } else {
                        simulateMouseEvent(e, "click");
                    }
                } else {
                    self.isScrollingX = false;
                    self.isScrollingY = false;
                }
            },
            panstart: function(e) {
                var self = this;
                self._prevSpeed = 0;
                var offset = self.offset = self.getOffset();
                var boundry = self.boundry;
                var containerWidth = self.containerWidth;
                var containerHeight = self.containerHeight;
                var boundry = self.boundry;
                self.translate(offset);
                self.__panstarted = true;
                self._firePanStart(Util.mix(e, {
                    offset: offset
                }));
                return offset;
            },
            pan: function(e) {
                var self = this;
                if (!self.__panstarted) {
                    //reset pan gesture
                    Pan.reset();
                    return;
                }
                var boundry = self.boundry;
                self.offset = self.offset || self.getOffset();
                var posY = self.userConfig.lockY ? Number(self.offset.y) : Number(self.offset.y) + e.deltaY;
                var posX = self.userConfig.lockX ? Number(self.offset.x) : Number(self.offset.x) + e.deltaX;
                //enable bounce
                var bounce = self.userConfig.bounce;
                var containerWidth = self.containerWidth;
                var containerHeight = self.containerHeight;
                if (posY > boundry.top) { //overtop 
                    posY = bounce || self.getPlugin("xscroll/plugin/pulldown") ? (posY - boundry.top) * PAN_RATE + boundry.top : boundry.top;
                }
                if (posY < boundry.bottom - containerHeight) { //overbottom 
                    posY = bounce ? posY + (boundry.bottom - containerHeight - posY) * PAN_RATE : boundry.bottom - containerHeight;
                }
                if (posX > boundry.left) { //overleft
                    posX = bounce ? (posX - boundry.left) * PAN_RATE + boundry.left : boundry.left;
                }
                if (posX < boundry.right - containerWidth) { //overright
                    posX = bounce ? posX + (boundry.right - containerWidth - posX) * PAN_RATE : boundry.right - containerWidth;
                }

                self.translate({
                    x: posX,
                    y: posY
                });
                self._noTransition();
                self.isScrollingX = false;
                self.isScrollingY = false;
                //pan trigger the opposite direction
                self.directionX = e.directionX == "left" ? "right" : e.directionX == "right" ? "left" : "";
                self.directionY = e.directionY == "top" ? "bottom" : e.directionY == "bottom" ? "top" : "";
                self._firePan(Util.mix(e, {
                    offset: {
                        x: posX,
                        y: posY
                    },
                    directionX: e.directionX,
                    directionY: e.directionY,
                    triggerType: PAN
                }));
                self.fire(SCROLL, Util.mix(e, {
                    offset: {
                        x: posX,
                        y: posY
                    },
                    directionX: self.directionX,
                    directionY: self.directionY,
                    triggerType: PAN
                }));
            },
            panend: function(e) {
                var self = this;
                var offset = self.getOffset();
                var boundry = self.boundry;
                self.__panstarted = false;
                self._firePanEnd(e);
                if (e.defaultPrevented) return;
                self.userConfig.snap ? self._snapAnimate(e) : self._scrollAnimate(e);
                delete self.offset;
            }
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
            // touchstart can't prevent click
            if (Util.isBadAndroid()) {
                Event.on(renderTo, "click", function(e) {
                    if (e.target.tagName.toLowerCase() == "a") {
                        e.preventDefault();
                    }
                });
            }
            Event.on(renderTo, "touchstart", function(e) {
                self.__handlers.touchstart.call(self, e);
            }).on(renderTo, Tap.TAP, function(e) {
                self.__handlers.tap.call(self, e);
            }).on(renderTo, Pan.PAN_START, function(e) {
                self.__handlers.panstart.call(self, e);
            }).on(renderTo, Pan.PAN, function(e) {
                self.__handlers.pan.call(self, e);
            }).on(renderTo, Pan.PAN_END, function(e) {
                self.__handlers.panend.call(self, e);
            });

            if (self.userConfig.useTransition) {
                Event.on(container, transitionEnd, function(e) {
                    //prevent callback in bad android
                    if (e.elapsedTime.toFixed(3) <= 0.001) return;
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
            }
            //scalable
            if (self.userConfig.scalable) {
                var originX, originY;
                //init pinch gesture
                Pinch.init();
                Event.on(renderTo, Pinch.PINCH_START, function(e) {
                    scale = self.scale;
                    originX = (e.origin.pageX - self.x) / self.containerWidth;
                    originY = (e.origin.pageY - self.y) / self.containerHeight;
                    self.fire(PINCH_START, {
                        scale: scale,
                        origin: {
                            x: originX,
                            y: originY
                        }
                    })
                });
                Event.on(renderTo, Pinch.PINCH, function(e) {
                    var __scale = scale * e.scale;
                    if (__scale <= self.userConfig.minScale) {
                        __scale = 0.5 * self.userConfig.minScale * Math.pow(2, __scale / self.userConfig.minScale);
                    }
                    if (__scale >= self.userConfig.maxScale) {
                        __scale = 2 * self.userConfig.maxScale * Math.pow(0.5, self.userConfig.maxScale / __scale);
                    }
                    self._scale(__scale, originX, originY);
                    self.fire(PINCH, {
                        scale: __scale,
                        origin: {
                            x: originX,
                            y: originY
                        }
                    })
                });
                Event.on(renderTo, Pinch.PINCH_END, function(e) {
                    self.isScaling = false;
                    if (self.scale < self.minScale) {
                        self.scaleTo(self.minScale, originX, originY, SCALE_TO_DURATION);
                    } else if (self.scale > self.maxScale) {
                        self.scaleTo(self.maxScale, originX, originY, SCALE_TO_DURATION);
                    }
                    self.fire(PINCH_END, {
                        scale: scale,
                        origin: {
                            x: originX,
                            y: originY
                        }
                    })
                });
                Event.on(renderTo, Tap.DOUBLE_TAP, function(e) {
                    originX = (e.pageX - self.x) / self.containerWidth;
                    originY = (e.pageY - self.y) / self.containerHeight;
                    self.scale > self.minScale ? self.scaleTo(self.minScale, originX, originY, 200) : self.scaleTo(self.maxScale, originX, originY, 200);
                });
            }
            Event.on(window, "resize", function(e) {
                setTimeout(function() {
                    self.render();
                    self.boundryCheck()
                }, 100)
            })
        },
        initSnap: function() {
            var self = this;
            self.snapRowIndex = self.userConfig.snapRowIndex;
            self.snapColIndex = self.userConfig.snapColIndex;
        },
        snapTo: function(col, row, callback) {
            var self = this;
            var userConfig = self.userConfig;
            var snapWidth = userConfig.snapWidth;
            var snapHeight = userConfig.snapHeight;
            var snapColsNum = userConfig.snapColsNum;
            var snapRowsNum = userConfig.snapRowsNum;
            col = col >= snapColsNum ? snapColsNum - 1 : col < 0 ? 0 : col;
            row = row >= snapRowsNum ? snapRowsNum - 1 : row < 0 ? 0 : row;
            self.snapRowIndex = row;
            self.snapColIndex = col;
            var top = self.snapRowIndex * snapHeight;
            var left = self.snapColIndex * snapWidth;
            self.scrollTo({
                x: left,
                y: top
            }, userConfig.snapDuration, userConfig.snapEasing, callback);
        },
        //snap
        _snapAnimate: function(e) {
            var self = this;
            var userConfig = self.userConfig;
            var snapWidth = userConfig.snapWidth;
            var snapHeight = userConfig.snapHeight;
            var cx = snapWidth / 2;
            var cy = snapHeight / 2;
            var direction = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.touch.directionX : e.touch.directionY;
            if (e.velocity > 0.5) {
                direction == "left" ? self.snapColIndex++ : direction == "right" ? self.snapColIndex-- : undefined;
                direction == "top" ? self.snapRowIndex++ : direction == "bottom" ? self.snapRowIndex-- : undefined;
            } else {
                var offset = self.getOffset();
                var left = Math.abs(offset.x);
                var top = Math.abs(offset.y);
                self.snapColIndex = Math.round(left / snapWidth);
                self.snapRowIndex = Math.round(top / snapHeight);
            }
            self.snapTo(self.snapColIndex, self.snapRowIndex)
        },
        _scrollAnimate: function(e) {
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
        _scrollEndHandler: function(type) {
            var self = this;
            var TYPE = type.toUpperCase();
            var scrollFn = "scroll" + TYPE;
            var boundryCheckFn = "boundryCheck" + TYPE;
            var _bounce = "_bounce" + type;
            var boundry = self.boundry;
            var bounceSize = self.userConfig.bounceSize || 0;
            if (self[_bounce]) {
                var minsize = type == "x" ? boundry.left : boundry.top;
                var maxsize = type == "x" ? boundry.right : boundry.bottom;
                var containerSize = type == "x" ? self.containerWidth : self.containerHeight;
                var param = {
                    zoomType: type,
                    velocityX: 0,
                    velocityY: 0,
                    type: BOUNDRY_OUT
                };
                param["velocity" + TYPE] = self[_bounce];
                self.fire(BOUNDRY_OUT, param);
                if (self.userConfig.bounce) {
                    var v = self[_bounce];
                    var a = 0.01 * v / Math.abs(v);
                    var t = v / a;
                    var s = self.getOffset()[type] + t * v / 2;
                    var tmin = 100;
                    var tmax = 150;
                    var oversize = 0;
                    //limit bounce
                    if (s > minsize) {
                        if (s > minsize + bounceSize) {
                            s = minsize + bounceSize;
                        }
                        oversize = Math.abs(s - minsize);
                    } else if (s < maxsize - containerSize) {
                        if (s < maxsize - containerSize - bounceSize) {
                            s = maxsize - containerSize - bounceSize
                        }
                        oversize = Math.abs(maxsize - containerSize - s);
                    }
                    t = oversize / bounceSize * (tmax - tmin) + tmin;
                    //bounce
                    self[scrollFn](-s, t, "linear", function() {
                        self[_bounce] = 0;
                        self[boundryCheckFn]()
                    });
                }
            } else {
                self[boundryCheckFn]();
            }
        },
        isBoundryOut: function() {
            return this.isBoundryOutLeft() || this.isBoundryOutRight() || this.isBoundryOutTop() || this.isBoundryOutBottom();
        },
        isBoundryOutLeft: function() {
            return -this.getOffsetLeft() < this.boundry.left;
        },
        isBoundryOutRight: function() {
            return this.containerWidth + this.getOffsetLeft() < this.boundry.right;
        },
        isBoundryOutTop: function() {
            return -this.getOffsetTop() < this.boundry.top;
        },
        isBoundryOutBottom: function() {
            return this.containerHeight + this.getOffsetTop() < this.boundry.bottom;
        },
        _bounce: function(type, v) {
            var self = this;
            var offset = self.getOffset()[type];
            var boundry = self.boundry;
            var boundryStart = type == "x" ? boundry.left : boundry.top;
            var boundryEnd = type == "x" ? boundry.right : boundry.bottom;
            var innerSize = type == "x" ? self.containerWidth : self.containerHeight;
            var size = boundryEnd - boundryStart;
            var userConfig = self.userConfig;
            var transition = {};
            if (v === 0) {
                type == "x" ? self.boundryCheckX() : self.boundryCheckY();
                return;
            }
            if (type == "x" && self.userConfig.lockX) return;
            if (type == "y" && self.userConfig.lockY) return;

            var maxSpeed = userConfig.maxSpeed > 0 && userConfig.maxSpeed < 6 ? userConfig.maxSpeed : 3;
            if (v > maxSpeed) {
                v = maxSpeed;
            }
            if (v < -maxSpeed) {
                v = -maxSpeed;
            }
            if (offset > boundryStart || offset < size - innerSize) {
                var a = userConfig.BOUNDRY_CHECK_ACCELERATION * (v / Math.abs(v));
                var t = v / a;
                var s = offset + t * v / 2;
                transition.offset = -s;
                transition.duration = t;
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
                transition.easing = "linear";
                self["_bounce" + type] = v - a * _t;
                self._prevSpeed = 0;
                //over bottom boundry check bounce
            } else if (s < size - innerSize) {
                var _s = (size - innerSize) - offset;
                var _t = (v + Math.sqrt(-2 * a * _s + v * v)) / a;
                transition.offset = innerSize - size;
                transition.duration = _t;
                transition.easing = "linear";
                self["_bounce" + type] = v - a * _t;
                self._prevSpeed = v - a * _t;
                // normal
            } else {
                transition.offset = -s;
                transition.duration = t;
                transition.easing = self.userConfig.easing;
                transition.status = "normal";
                self["_bounce" + type] = 0;
                self._prevSpeed = 0;
            }
            self['isScrolling' + type.toUpperCase()] = true;
            return transition;

        },
        _scrollHandler: function(dest, duration, callback, easing, type) {
            var self = this;
            var offset = self.getOffset();
            var directions = type == "x" ? ["left", "right"] : ["top", "bottom"];
            var Type = type.toUpperCase();
            var el = type == "x" ? self.content : self.container;
            var transitionStr = "none";
            var __scrollEndCallbackFn = function(e) {
                self['isScrolling' + Type] = false;
                var _offset = self.getOffset();
                var boundryout;
                if (_offset[e.type] == self.boundry.top && Math.abs(self['_bounce' + type]) > 0) {
                    boundryout = type == "x" ? "left" : "top";
                } else if (_offset[e.type] + self.containerHeight == self.boundry.bottom && Math.abs(self['_bounce' + type]) > 0) {
                    boundryout = type == "x" ? "right" : "bottom";
                }
                var params = {
                    offset: _offset,
                    zoomType: e.type,
                    type: SCROLL_END
                };
                if (boundryout) {
                    params.boundryout = boundryout;
                }
                params['direction' + e.type.toUpperCase()] = dest - offset[e.type] < 0 ? directions[1] : directions[0];
                self.fire(SCROLL_END, params);
                callback && callback(e);
            }

            if (self.userConfig.useTransition) {
                //transition
                transitionStr = duration > 0 ? [transformStr, " ", duration / 1000, "s ", Easing.format(easing), " 0s"].join("") : "none";
                el.style[transition] = transitionStr;
                type == "x" ? self.translateX(dest) : self.translateY(dest);
            }

            self.timer[type] = self.timer[type] || new Timer();
            self.timer[type].reset({
                duration: duration,
                easing: easing
            });
            self.timer[type].detach("run");
            self.timer[type].on("run", function(e) {
                var params = {
                    zoomType: type,
                    offset: self.getOffset(),
                    type: SCROLL
                };
                params['direction' + type.toUpperCase()] = dest - offset[type] < 0 ? directions[1] : directions[0];
                if (!self.userConfig.useTransition) {
                    type == "x" ? self.translateX(e.percent * (dest - offset[type]) + offset[type]) : self.translateY(e.percent * (dest - offset[type]) + offset[type]);
                }
                self.fire(SCROLL, params);
            });
            self.timer[type].detach("end");
            self.timer[type].on("end", function(e) {
                if (!self.userConfig.useTransition) {
                    __scrollEndCallbackFn({
                        type: type
                    });
                }
            })
            self.timer[type].stop();
            self.timer[type].run();
            //if dest value is equal to current value then return.
            if (duration <= 0 || dest == offset[type]) {
                self.fire(SCROLL, {
                    zoomType: type,
                    offset: offset,
                    type: SCROLL
                });
                self.fire(SCROLL_END, {
                    zoomType: type,
                    offset: offset,
                    type: SCROLL_END
                });
                return;
            }
            self['isScrolling' + Type] = true;
            //regist transitionEnd callback function
            if (self.userConfig.useTransition) {
                self['__scrollEndCallback' + Type] = __scrollEndCallbackFn;
            }

            self.fire(SCROLL_ANIMATE, {
                transition: transitionStr,
                offset: {
                    x: self.x,
                    y: self.y
                },
                type: SCROLL_ANIMATE,
                duration: duration / 1000,
                easing: Easing.format(easing),
                zoomType: type
            })
        },
        addView: function(view, viewCfg) {
            var self = this;
            //config for view
            viewCfg = Util.mix({
                captureBounce: false,
                stopPropagation: true
            }, viewCfg)
            if (!view || !view instanceof XScroll) return;
            if (!self.__subViews) {
                self.__subViews = {};
            }
            if (view.guid && !self.__subViews[view.guid]) {
                view.__viewControllers = view.__viewControllers || {};
                //set parent scrollview
                view.parentView = {
                    instance: self
                };
                view.__viewControllers.boundryout = function(e) {
                    self._scrollAnimate(e);
                }
                viewCfg.captureBounce && view.on("boundryout", view.__viewControllers.boundryout);
                return self.__subViews[view.guid] = view;
            }
            return;
        },
        removeView: function(view) {
            var self = this;
            if (!view || !view.guid) return;
            var subview = self.__subViews[view.guid];
            if (subview) {
                delete subview.parentView;
                for (var i in subview.__viewControllers) {
                    //remove events
                    subview.detach(i, subview.__viewControllers[i]);
                }
                //clear
                subview.__viewControllers = {};
                delete subview;
            }
        },
        getViews: function(guid) {
            if (guid) {
                return this.__subViews[guid];
            }
            return this.__subViews;
        }
    });

    if (typeof module == 'object' && module.exports) {
        module.exports = XScroll;
    } else {
        return window.XScroll = XScroll;
    }