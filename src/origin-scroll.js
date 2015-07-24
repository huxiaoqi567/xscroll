"use strict";
var Util = require('./util'),
    Base = require('./base'),
    Core = require('./core'),
    Animate = require('./animate');

var transformOrigin = Util.prefixStyle("transformOrigin");
/** 
 * @constructor
 * @param {object} cfg config for scroll
 * @extends XScroll
 * @example
 * var xscroll = new OriginScroll({
 *    renderTo:"#scroll"
 * });
 * xscroll.render();
 */
function OriginScroll(cfg) {
    OriginScroll.superclass.constructor.call(this, cfg);
}

Util.extend(OriginScroll, Core, {
    init: function() {
        var self = this;
        OriginScroll.superclass.init.call(this);
        self.resetSize();
    },
    /**
     * get scroll top value
     * @memberof OriginScroll
     * @return {number} scrollTop
     */
    getScrollTop: function() {
        return this.renderTo.scrollTop;
    },
    /**
     * get scroll left value
     * @memberof OriginScroll
     * @return {number} scrollLeft
     */
    getScrollLeft: function() {
        return this.renderTo.scrollLeft;
    },
    /**
     * vertical scroll absolute to the destination
     * @memberof SimuScroll
     * @param scrollTop {number} scrollTop
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollTop: function(y, duration, easing, callback) {
        var self = this;
        var y = Math.round(y);
        if (self.userConfig.lockY) return;
        var duration = duration || 0;
        var easing = easing || "quadratic";
        var config = {
            css: {
                scrollTop: y
            },
            duration: duration,
            easing: easing,
            run: function(e) {
                //trigger scroll event
                self.trigger("scroll", {
                    scrollTop: self.getScrollTop(),
                    scrollLeft: self.getScrollLeft()
                });
            },
            useTransition: false, //scrollTop 
            end: callback
        };
        self.__timers.y = self.__timers.y || new Animate(self.renderTo, config);
        //run
        self.__timers.y.stop();
        self.__timers.y.reset(config);
        self.__timers.y.run();
    },
    /**
     * horizontal scroll absolute to the destination
     * @memberof SimuScroll
     * @param scrollLeft {number} scrollLeft
     * @param duration {number} duration for animte
     * @param easing {string} easing functio for animate : ease-in | ease-in-out | ease | bezier(n,n,n,n)
     **/
    scrollLeft: function(x, duration, easing, callback) {
        var self = this;
        var x = Math.round(x);
        if (self.userConfig.lockX) return;
        var duration = duration || 0;
        var easing = easing || "quadratic";
        var config = {
            css: {
                scrollLeft: x
            },
            duration: duration,
            easing: easing,
            run: function(e) {
                //trigger scroll event
                self.trigger("scroll", {
                    scrollTop: self.getScrollTop(),
                    scrollLeft: self.getScrollLeft()
                });
            },
            useTransition: false, //scrollTop 
            end: callback
        };
        self.__timers.x = self.__timers.x || new Animate(self.renderTo, config);
        //run
        self.__timers.x.stop();
        self.__timers.x.reset(config);
        self.__timers.x.run();
    },
    _bindEvt: function() {
        OriginScroll.superclass._bindEvt.call(this);
        var self = this;
        if (self.__isEvtBind) return;
        self.__isEvtBind = true;
        self.renderTo.addEventListener("scroll", function(e) {
            self.trigger("scroll", {
                type: "scroll",
                scrollTop: self.getScrollTop(),
                scrollLeft: self.getScrollLeft()
            })
        }, false)
    }
});

if (typeof module == 'object' && module.exports) {
    module.exports = OriginScroll;
}
/** ignored by jsdoc **/
else {
    return OriginScroll;
}