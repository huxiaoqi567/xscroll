"use strict";
var Util = require('./util'),
    Base = require('./base'),
    Animate = require('./animate'),
    Boundry = require('./boundry'),
    Hammer = require('./hammer');
// boundry checked bounce effect
var BOUNDRY_CHECK_DURATION = 500;
var BOUNDRY_CHECK_EASING = "ease";
var BOUNDRY_CHECK_ACCELERATION = 0.1;
//transform
var transform = Util.prefixStyle("transform");
//transition webkitTransition MozTransition OTransition msTtransition
var transition = Util.prefixStyle("transition");
var transformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";
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
 * @param {boolean} cfg.useOriginScroll config if use simulate or origin scroll
 * @param {boolean} cfg.bounce config if use has the bounce effect when scrolling outside of the boundry
 * @param {boolean} cfg.boundryCheck config if scrolling inside of the boundry
 * @param {boolean} cfg.preventDefault config if prevent the browser default behavior
 * @param {string|HTMLElement}  cfg.container config for scroller's container which default value is ".xs-container"
 * @param {string|HTMLElement}  cfg.content config for scroller's content which default value is ".xs-content"
 * @param {object}  cfg.indicatorInsets  config scrollbars position {top: number, left: number, bottom: number, right: number}
 * @param {string}  cfg.stickyElements config for sticky-positioned elements
 * @param {string}  cfg.fixedElements config for fixed-positioned elements
 * @param {string}  cfg.touchAction config for touchAction of the scroller
 * @extends XScroll
 * @example
 * var xscroll = new XScroll({
 *    renderTo:"#scroll",
 *    lockX:false,
 *    scrollbarX:true
 * });
 * xscroll.render();
 */
function XScroll(cfg) {
    XScroll.superclass.constructor.call(this);
    this.userConfig = cfg;
    this.init();
}

Util.extend(XScroll, Base, {
    /**
     * version
     * @memberof XScroll
     * @type {string}
     */
    version: "3.0.0",
    /**
     * init scroll
     * @memberof XScroll
     * @return {XScroll}
     */
    init: function() {
        var self = this;
        var defaultCfg = {
            preventDefault: true,
            bounce: true,
            boundryCheck: true,
            useTransition: true,
            gpuAcceleration: true,
            BOUNDRY_CHECK_EASING: BOUNDRY_CHECK_EASING,
            BOUNDRY_CHECK_DURATION: BOUNDRY_CHECK_DURATION,
            BOUNDRY_CHECK_ACCELERATION: BOUNDRY_CHECK_ACCELERATION,
            useOriginScroll: false,
            zoomType: "y",
            indicatorInsets: {
                top: 3,
                bottom: 3,
                left: 3,
                right: 3,
                width: 3,
                spacing: 5
            },
            container:".xs-container",
            content:".xs-content",
            stickyElements: ".xs-sticky",
            fixedElements:".xs-fixed",
            touchAction:"auto"
        };
        //generate guid
        self.guid = Util.guid();
        self.renderTo = self.userConfig.renderTo.nodeType ? self.userConfig.renderTo : document.querySelector(self.userConfig.renderTo);
        //timer for animtion
        self.__timers = {};
        //config attributes on element
        var elCfg = JSON.parse(self.renderTo.getAttribute('xs-cfg'));
        var userConfig = self.userConfig = Util.mix(Util.mix(defaultCfg, elCfg), self.userConfig);
        self.container = userConfig.container.nodeType ? userConfig.container : self.renderTo.querySelector(userConfig.container);
        self.content = userConfig.content.nodeType ? userConfig.content : self.renderTo.querySelector(userConfig.content);
        self.boundry = new Boundry();
        self.boundry.refresh();
        return self;
    },
    /**
     * destroy scroll
     * @memberof XScroll
     * @return {XScroll}
     */
    destroy: function() {
        var self = this;
        self._unBindEvt();
    },
    _initContainer: function() {},
    /**
     * @memberof XScroll
     * @return {XScroll}
     */
    enableGPUAcceleration: function() {
        this.userConfig.gpuAcceleration = true;
        return this;
    },
    /**
     * @memberof XScroll
     * @return {XScroll}
     */
    disableGPUAcceleration: function() {
        this.userConfig.gpuAcceleration = false;
        return this;
    },
    /**
     * get scroll offset
     * @memberof XScroll
     * @return {Object} {scrollTop:scrollTop,scrollLeft:scrollLeft}
     */
    getScrollPos: function() {
        var self = this;
        return {
            scrollLeft: self.getScrollLeft(),
            scrollTop: self.getScrollTop()
        }
    },
    /**
     * get scroll top value
     * @memberof XScroll
     * @return {number} scrollTop
     */
    getScrollTop: function() {},
    /**
     * get scroll left value
     * @memberof XScroll
     * @return {number} scrollLeft
     */
    getScrollLeft: function() {},
    /**
     * scroll absolute to the destination
     * @memberof XScroll
     * @param scrollLeft {number} scrollLeft
     * @param scrollTop {number} scrollTop
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollTo: function(scrollLeft, scrollTop, duration, easing, callback) {
        var self = this;
        var scrollLeft = (undefined === scrollLeft || isNaN(scrollLeft)) ? -self.getScrollLeft() : scrollLeft;
        var scrollTop = (undefined === scrollTop || isNaN(scrollTop)) ? -self.getScrollTop() : scrollTop;
        self.scrollLeft(scrollLeft, duration, easing, callback);
        self.scrollTop(scrollTop, duration, easing, callback);
    },
    /**
     * scroll relative to the destination
     * @memberof XScroll
     * @param scrollLeft {number} scrollLeft
     * @param scrollTop {number} scrollTop
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollBy: function(scrollLeft, scrollTop, duration, easing, callback) {
        this.scrollByX(scrollLeft, duration, easing, callback);
        this.scrollByY(scrollTop, duration, easing, callback);
    },
    /**
     * horizontal scroll relative to the destination
     * @memberof XScroll
     * @param scrollLeft {number} scrollLeft
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollLeftBy: function(scrollLeft, duration, easing, callback) {
        this.scrollLeft(Number(scrollLeft) + Number(this.getScrollLeft()), duration, easing, callback);
    },
    /**
     * vertical scroll relative to the destination
     * @memberof XScroll
     * @param scrollTop {number} scrollTop
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollTopBy: function(scrollTop, duration, easing, callback) {
        this.scrollTop(Number(scrollTop) + Number(this.getScrollTop()), duration, easing, callback);
    },
    /**
     * horizontal scroll absolute to the destination
     * @memberof XScroll
     * @param scrollLeft {number} scrollLeft
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollLeft: function(scrollLeft, duration, easing, callback) {},
    /**
     * vertical scroll absolute to the destination
     * @memberof XScroll
     * @param scrollTop {number} scrollTop
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollTop: function(scrollTop, duration, easing, callback) {},
    /**
     * reset the boundry size
     * @memberof XScroll
     * @return {XScroll}
     **/
    resetSize: function() {
        var self = this;
        var userConfig = self.userConfig;
        var renderToStyle = getComputedStyle(self.renderTo);
        var width = self.width = (userConfig.width || self.renderTo.offsetWidth) - Util.px2Num(renderToStyle['padding-left']) - Util.px2Num(renderToStyle['padding-right']);
        var height = self.height = (userConfig.height || self.renderTo.offsetHeight) - Util.px2Num(renderToStyle['padding-top']) - Util.px2Num(renderToStyle['padding-bottom']);;
        var containerWidth = userConfig.containerWidth || self.content.offsetWidth;
        var containerHeight = userConfig.containerHeight || self.content.offsetHeight;
        self.containerWidth = containerWidth < self.width ? self.width : containerWidth;
        self.containerHeight = containerHeight < self.height ? self.height : containerHeight;
        self.boundry.refresh({
            width: self.width,
            height: self.height
        });
        return self;
    },
    /**
     * render scroll
     * @memberof XScroll
     * @return {XScroll}
     **/
    render: function() {
        var self = this;
        self.resetSize();
        self.trigger("afterrender", {
            type: "afterrender"
        });
        self._bindEvt();
        //update touch-action 
        self.initTouchAction();
        //init stickies
        self.initStickies();

        return self;
    },
    /**
     * init touch action
     * @memberof XScroll
     * @return {XScroll}
     */
    initTouchAction: function() {
        var self = this;
        self.mc.set({
            touchAction: self.userConfig.touchAction
        });
        return self;
    },
    initStickies: function() {
        var self = this,
            sticky;
        var stickyElements = self.userConfig.stickyElements;
        self.isY = !!(self.userConfig.zoomType == "y");
        self.nameTop = self.isY ? "top" : "left";
        self.nameHeight = self.isY ? "height" : "width";
        self.nameWidth = self.isY ? "width" : "height";
        self._stickies = typeof stickyElements == "string" ? self.content.querySelectorAll(stickyElements) : stickyElements;
        self._stickiesNum = self._stickies.length;
        self._stickiesPos = [];
        for (var i = 0; i < self._stickiesNum; i++) {
            sticky = self._stickies[i];
            var pos = {};
            pos[self.nameTop] = self.isY ? Util.getOffsetTop(sticky) : Util.getOffsetLeft(sticky);
            pos[self.nameHeight] = self.isY ? sticky.offsetHeight : sticky.offsetWidth;
            self._stickiesPos.push(pos);
        }
        if (self._stickiesNum > 0 && !self.stickyElement) {
            self.stickyElement = document.createElement('div');
            self.stickyElement.style.display = "none";
            Util.addClass(self.stickyElement,"_xs_sticky_");
            self.renderTo.appendChild(self.stickyElement);
        }
        self.stickyHandler();
        return self;
    },
    stickyHandler: function() {
        var self = this;
        var zoomType = self.userConfig.zoomType;
        var pos = self.isY ? self.getScrollTop() : self.getScrollLeft();
        var stickiesPos = self._stickiesPos;
        var indexes = [];
        for (var i = 0, l = stickiesPos.length; i < l; i++) {
            var top = stickiesPos[i][self.nameTop];
            if (pos > top) {
                indexes.push(i);
            }
        }
        if (!indexes.length) {
            if (self.stickyElement) {
                self.stickyElement.style.display = "none";
            }
            self.curStickyIndex = undefined;
            return;
        }
        var curStickyIndex = Math.max.apply(null, indexes);
        if (self.curStickyIndex != curStickyIndex) {
            self.curStickyIndex = curStickyIndex;
            self.renderStickyElement();
            self.trigger("stickychange",{
                stickyElement:self.stickyElement,
                curStickyIndex:self.curStickyIndex
            });
        }

        var trans = 0;
        if (self._stickiesPos[self.curStickyIndex + 1]) {
            var cur = self._stickiesPos[self.curStickyIndex];
            var next = self._stickiesPos[self.curStickyIndex + 1];
            if (pos + cur[self.nameHeight] > next[self.nameTop] && pos + cur[self.nameHeight] < next[self.nameTop] + cur[self.nameHeight]) {
                trans = cur[self.nameHeight] + pos - next[self.nameTop];
            } else {
                trans = 0;
            }
        }
        self.stickyElement.style[transform] = self.isY ? "translateY(-" + (trans) + "px) translateZ(0)" : "translateX(-" + (trans) + "px) translateZ(0)";

    },
    renderStickyElement: function() {
        var self = this;
        var stickyElement = self.stickyElement;
        var curStickyIndex = self.curStickyIndex;
        var curSticky = self._stickies[curStickyIndex];
        stickyElement.style.display = "block";
        stickyElement.innerHTML = curSticky.innerHTML;
        stickyElement.className = curSticky.className;
        stickyElement.setAttribute("style",curSticky.getAttribute("style"));
        stickyElement.style.position = "fixed";
        stickyElement.style[self.nameWidth] = "100%";
        stickyElement.style[self.nameTop] = 0;
        stickyElement.id = curSticky.id;
        return self;
    },
    /**
     * bounce to the boundry vertical and horizontal
     * @memberof XScroll
     * @return {XScroll}
     **/
    boundryCheck: function() {
        return this;
    },
    /**
     * bounce to the boundry horizontal
     * @memberof XScroll
     * @return {XScroll}
     **/
    boundryCheckX: function() {
        return this;
    },
    /**
     * bounce to the boundry vertical
     * @memberof XScroll
     * @return {XScroll}
     **/
    boundryCheckY: function() {
        return this;
    },
    _bindEvt: function() {
        var self = this;
        if (self.___isEvtBind) return;
        self.___isEvtBind = true;
        var mc = self.mc = new Hammer.Manager(self.renderTo);
        var tap = new Hammer.Tap();
        var pan = new Hammer.Pan();
        var pinch = new Hammer.Pinch();
        mc.add([tap, pan]);
        //trigger all events 
        self.mc.on("panstart pan panend pancancel pinchstart pinchmove pinchend pinchcancel pinchin pinchout", function(e) {
            self.trigger(e.type, e);
        });
        //trigger touch events
        var touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
        for (var i = 0, l = touchEvents.length; i < l; i++) {
            self.renderTo.addEventListener(touchEvents[i], function(e) {
                self.trigger(e.type, e);
            });
        }

        self.mc.on("tap", function(e) {
            if (e.tapCount == 1) {
                e.type = "tap";
                self.trigger(e.type, e);
            } else if (e.tapCount == 2) {
                e.type = "doubletap";
                self.trigger("doubletap", e);
            }
        });
        self.on("scroll", self.stickyHandler, self);

        return self;
    },
    _unBindEvt: function() {
        var self = this;
        self.mc && self.mc.destroy();
    },
    _resetLockConfig: function() {},
    stop: function() {}
});

if (typeof module == 'object' && module.exports) {
    module.exports = XScroll;
}
