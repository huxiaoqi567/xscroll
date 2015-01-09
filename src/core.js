define(function(require, exports, module) {
    var Util = require('./util'),
        Base = require('./base'),
        Animate = require('./animate'),
        Hammer = require('./hammer');

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
    var SCROLL_END = "scrollend";
    var SCROLL = "scroll";
    var PAN_END = "panend";
    var PAN_START = "panstart";
    var PAN = "pan";
    // var PINCH_START = "pinchstart";
    // var PINCH = "pinch";
    // var PINCH_END = "pinchend";
    var SCROLL_ANIMATE = "scrollanimate";
    // var SCALE_ANIMATE = "scaleanimate";
    // var SCALE = "scale";
    // var SCALE_END = "scaleend";
    // var SNAP_START = "snapstart";
    // var SNAP = "snap";
    // var SNAP_END = "snapend";
    var AFTER_RENDER = "afterrender";
    var BOUNDRY_OUT = "boundryout";
    // constant acceleration for scrolling
    var SROLL_ACCELERATION = 0.001;
    // boundry checked bounce effect
    var BOUNDRY_CHECK_DURATION = 500;
    var BOUNDRY_CHECK_EASING = "ease";
    var BOUNDRY_CHECK_ACCELERATION = 0.1;
    //reduced boundry pan distance
    // var PAN_RATE = 0.36;
    // reduced scale rate
    // var SCALE_RATE = 0.7;

    // var SCALE_TO_DURATION = 300;
    //transform
    var transform = Util.prefixStyle("transform");
    //transition webkitTransition MozTransition OTransition msTtransition
    var transition = Util.prefixStyle("transition");

    var transformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";

    Util.extend(XScroll, Base, {
        version: "3.0.0",
        init: function() {
            var self = this;
            var userConfig = self.userConfig = Util.mix({
                preventDefault: true,
                // snap: false,
                // snapWidth: 100,
                // snapHeight: 100,
                // snapRowIndex: 0,
                // snapColIndex: 0,
                // snapEasing: "ease",
                // snapDuration: 500,
                // snapColsNum: 1,
                // snapRowsNum: 1,
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
                easing: "quadratic",
                clsPrefix: "xs-",
                simulateScroll: false
            }, self.userConfig, undefined, undefined, true);
            //generate guid
            self.guid = Util.guid();
            self.renderTo = userConfig.renderTo.nodeType ? userConfig.renderTo : document.querySelector(userConfig.renderTo);
            // self.scale = userConfig.scale || 1;
            //timer for animtion
            self.__timers = {};
            // self.boundryCheckEnabled = true;
            self.SROLL_ACCELERATION = userConfig.SROLL_ACCELERATION || SROLL_ACCELERATION;
            self.containerClsName = userConfig.clsPrefix + "container";
            self.contentClsName = userConfig.clsPrefix + "content";
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
        getOffset: function() {
            var self = this;
            return {
                x: self.getOffsetLeft(),
                y: self.getOffsetTop()
            }
        },
        getOffsetTop: function() {},
        getOffsetLeft: function() {},
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
            var left = self.getOffsetLeft();
            self.scrollX(Number(x) + Number(left), duration, easing, callback);
        },
        scrollByY: function(y, duration, easing, callback) {
            var self = this;
            var top = self.getOffsetTop();
            self.scrollY(Number(y) + Number(top), duration, easing, callback);
        },
        scrollX: function(x, duration, easing, callback) {},
        scrollY: function(y, duration, easing, callback) {},
        render: function() {
            var self = this;
            var userConfig = self.userConfig;
            self._initContainer();
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
            // var minScale = self.userConfig.minScale || Math.max(self.width / self.containerWidth, self.height / self.containerHeight);
            // var maxScale = self.userConfig.maxScale || 1;
            // self.minScale = minScale;
            // self.maxScale = maxScale;
            self.boundry.refresh({
                width: self.width,
                height: self.height
            });
            self.trigger(AFTER_RENDER);
            // self.renderScrollBars();
            // self.userConfig.snap && self.initSnap();
            self._bindEvt();
            return self;
        },
        _bindEvt: function() {}
    });



    if (typeof module == 'object' && module.exports) {
        module.exports = XScroll;
    } else {
        return  window.XScroll = XScroll;
    }
});