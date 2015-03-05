define(function(require, exports, module) {
    var Util = require('./util'),
        Base = require('./base'),
        Animate = require('./animate');

    require('./hammer');

    function Boundry(cfg) {
        this.cfg = Util.mix({
            width: 0,
            height: 0
        }, cfg)
        this.init();
    }
    Util.mix(Boundry.prototype, {
        init: function() {
            var self = this;
            self._xtop = 0;
            self._xright = 0;
            self._xleft = 0;
            self._xbottom = 0;
            self.refresh({
                width: self.cfg.width,
                height: self.cfg.height
            });
        },
        reset: function() {
            this.resetTop();
            this.resetLeft();
            this.resetBottom();
            this.resetRight();
            return this;
        },
        resetTop: function() {
            this._xtop = 0;
            this.refresh();
            return this;
        },
        resetLeft: function() {
            this._xleft = 0;
            this.refresh();
            return this;
        },
        resetBottom: function() {
            this._xbottom = 0;
            this.refresh();
            return this;
        },
        resetRight: function() {
            this._xright = 0;
            this.refresh();
            return this;
        },
        expandTop: function(top) {
            this._xtop = top;
            this.refresh();
            return this;
        },
        expandLeft: function(left) {
            this._xleft = left;
            this.refresh();
            return this;
        },
        expandRight: function(right) {
            this._xright = right;
            this.refresh();
            return this;
        },
        expandBottom: function(bottom) {
            this._xbottom = bottom;
            this.refresh();
            return this;
        },
        refresh: function(cfg) {
            Util.mix(this.cfg, cfg);
            this.top = this._xtop;
            this.left = this._xleft;
            this.bottom = (cfg && cfg.height || this.cfg.height || 0) - this._xbottom;
            this.right = (cfg && cfg.width || this.cfg.width || 0) - this._xright;
            return this;
        }
    });



    function XScroll(cfg) {
        XScroll.superclass.constructor.call(this);
        this.userConfig = cfg;
        this.init();
    }

    XScroll.Util = Util;
    //namespace for plugins
    XScroll.Plugin = {};
    //event names
    var AFTER_RENDER = "afterrender";
    // constant acceleration for scrolling
    var SROLL_ACCELERATION = 0.001;
    // boundry checked bounce effect
    var BOUNDRY_CHECK_DURATION = 500;
    var BOUNDRY_CHECK_EASING = "ease";
    var BOUNDRY_CHECK_ACCELERATION = 0.1;
    //transform
    var transform = Util.prefixStyle("transform");
    //transition webkitTransition MozTransition OTransition msTtransition
    var transition = Util.prefixStyle("transition");

    var transformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";

    Util.extend(XScroll, Base, {
        version: "3.0.0",
        init: function() {
            var self = this;
            var defaultCfg = {
                preventDefault: true, //prevent touchstart 
                bounce: true,
                useTransition: false,
                gpuAcceleration: true,
                BOUNDRY_CHECK_EASING: BOUNDRY_CHECK_EASING,
                BOUNDRY_CHECK_DURATION: BOUNDRY_CHECK_DURATION,
                BOUNDRY_CHECK_ACCELERATION: BOUNDRY_CHECK_ACCELERATION,
                clsPrefix: "xs-",
                simulateScroll: false
            };
            //generate guid
            self.guid = Util.guid();
            self.renderTo = self.userConfig.renderTo.nodeType ? self.userConfig.renderTo : document.querySelector(self.userConfig.renderTo);
            //timer for animtion
            self.__timers = {};
            //config attributes on element
            var elCfg = JSON.parse(self.renderTo.getAttribute('xs-cfg'));
            var userConfig = self.userConfig = Util.mix(Util.mix(defaultCfg, elCfg), self.userConfig);
            self.containerClsName = userConfig.clsPrefix + "container";
            self.contentClsName = userConfig.clsPrefix + "content";
            self.container = self.renderTo.querySelector("." + self.containerClsName);
            self.content = self.renderTo.querySelector("." + self.contentClsName);
            self.boundry = new Boundry();
            self.boundry.refresh();
            return self;
        },
        _initContainer: function() {},
        enableGPUAcceleration: function() {
            this.userConfig.gpuAcceleration = true;
            return this;
        },
        disableGPUAcceleration: function() {
            this.userConfig.gpuAcceleration = false;
            return this;
        },
        getScrollPos: function() {
            var self = this;
            return {
                scrollLeft: self.getScrollLeft(),
                scrollTop: self.getScrollTop()
            }
        },
        getScrollTop: function() {},
        getScrollLeft: function() {},
        /**
         * scroll the root element with an animate
         * @param scrollLeft {Object} scrollLeft
         * @param scrollTop {Object} scrollTop
         * @param duration {Number} duration for animte
         * @param easing {Number} easing functio for animate : ease-in | ease-in-out | ease | bezier
         **/
        scrollTo: function(scrollLeft, scrollTop, duration, easing, callback) {
            var self = this;
            var scrollLeft = (undefined === scrollLeft || isNaN(scrollLeft)) ? -self.getScrollLeft() : scrollLeft;
            var scrollTop = (undefined === scrollTop || isNaN(scrollTop)) ? -self.getScrollTop() : scrollTop;
            self.scrollLeft(scrollLeft, duration, easing, callback);
            self.scrollTop(scrollTop, duration, easing, callback);
        },
        scrollBy: function(scrollLeft, scrollTop, duration, easing, callback) {
            this.scrollByX(scrollLeft, duration, easing, callback);
            this.scrollByY(scrollTop, duration, easing, callback);
        },
        scrollLeftBy: function(scrollLeft, duration, easing, callback) {
            this.scrollLeft(Number(scrollLeft) + Number(this.getScrollLeft()), duration, easing, callback);
        },
        scrollTopBy: function(scrollTop, duration, easing, callback) {
            this.scrollTop(Number(scrollTop) + Number(this.getScrollTop()), duration, easing, callback);
        },
        scrollLeft: function(scrollLeft, duration, easing, callback) {},
        scrollTop: function(scrollTop, duration, easing, callback) {},
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
        render: function() {
            var self = this;
            self.trigger(AFTER_RENDER);
            self._bindEvt();
            return self;
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
        },
        boundryCheck:function(){return this;},
        boundryCheckX:function(){return this;},
        boundryCheckY:function(){return this;},
        _bindEvt: function() {return this;}
    });



    if (typeof module == 'object' && module.exports) {
        module.exports = XScroll;
    } else {
        return XScroll;
    }
});