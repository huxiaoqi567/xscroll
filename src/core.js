    var Util = require('./util'),
        Base = require('./base'),
        Animate = require('./animate'),
        Boundry = require('./boundry');

    require('./hammer');
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
     * @param {number} cfg.SROLL_ACCELERATION  acceleration for scroll, min value make the scrolling smoothly
     * @param {number} cfg.BOUNDRY_CHECK_DURATION duration for boundry bounce
     * @param {number} cfg.BOUNDRY_CHECK_EASING easing for boundry bounce
     * @param {number} cfg.BOUNDRY_CHECK_ACCELERATION acceleration for boundry bounce
     * @param {boolean} cfg.lockX just like overflow-x:hidden
     * @param {boolean} cfg.lockY just like overflow-y:hidden
     * @param {boolean} cfg.scrollbarX config if the scrollbar-x is visible
     * @param {boolean} cfg.scrollbarY config if the scrollbar-y is visible
     * @param {boolean} cfg.useTransition config if use css3 transition or raf for scroll animation
     * @param {boolean} cfg.simulateScroll config if use animation or origin scroll
     * @param {string}  cfg.clsPrefix config the class prefix which default value is "xs-"
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

    XScroll.Util = Util;

    XScroll.Plugin = {};

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
                preventDefault: true, //prevent touchstart 
                bounce: true,
                useTransition: true,
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
            self.trigger("afterrender");
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
            if(self.___isEvtBind) return;
            self.___isEvtBind = true;
            var mc = self.mc = new Hammer.Manager(self.renderTo);
            var tap = new Hammer.Tap();
            var pan = new Hammer.Pan();
            mc.add([tap, pan]);
            //trigger all events 
            self.mc.on("panstart pan panend pinchstart pinch pinchend", function(e) {
                self.trigger(e.type, e);
            });
            self.mc.on("tap",function(e){
                if(e.tapCount == 1){
                    e.type = "tap";
                    self.trigger(e.type,e);
                }else if(e.tapCount == 2){
                    e.type = "doubletap";
                    self.trigger("doubletap",e);
                }
            });
            return self;
        }
    });

    if (typeof module == 'object' && module.exports) {
        module.exports = XScroll;
    }else{
        return XScroll;
    }