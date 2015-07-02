"use strict";
var Util = require('../util'),
	Base = require('../base');
// reduced scale rate
var SCALE_RATE = 0.7;
var SCALE_TO_DURATION = 300;
/**
 * A scalable plugin for xscroll.
 * @constructor
 * @param {object} cfg
 * @param {number} cfg.minScale min value for scale
 * @param {number} cfg.maxScale max value for scale
 * @param {number} cfg.duration duration for scale animation
 * @extends {Base}
 */
var Scale = function(cfg) {
	Scale.superclass.constructor.call(this, cfg);
	this.userConfig = Util.mix({
		minScale: 1,
		maxScale: 2,
		duration: SCALE_TO_DURATION
	}, cfg);
}

Util.extend(Scale, Base, {
	/**
	 * a pluginId
	 * @memberOf Scale
	 * @type {string}
	 */
	pluginId: "scale",
	/**
	 * plugin initializer
	 * @memberOf Scale
	 * @override Scale
	 * @return {Infinite}
	 */
	pluginInitializer: function(xscroll) {
		var self = this;
		self.scale = 1;
		self.xscroll = xscroll.render();
		self.initialContainerWidth = xscroll.containerWidth;
		self.initialContainerHeight = xscroll.containerHeight;
		self.minScale = self.userConfig.minScale || Math.max(xscroll.width / xscroll.containerWidth, xscroll.height / xscroll.containerHeight);
		self.maxScale = self.userConfig.maxScale || 1;
		self._bindEvt();
		return self;
	},
	/**
	 * detroy the plugin
	 * @memberOf Scale
	 * @override Base
	 * @return {Scale}
	 */
	pluginDestructor: function() {
		var self = this;
		var xscroll = self.xscroll;
		xscroll.off("doubletap", self._doubleTapHandler, self);
		xscroll.off("pinchstart", self._pinchStartHandler, self);
		xscroll.off("pinchmove", self._pinchHandler, self);
		xscroll.off("pinchend pinchcancel", self._pinchEndHandler, self);
		return self;
	},
	_doubleTapHandler: function(e) {
		var self = this;
		var xscroll = self.xscroll;
		var minScale = self.userConfig.minScale;
		var maxScale = self.userConfig.maxScale;
		var duration = self.userConfig.duration;
		self.originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
		self.originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
		xscroll.scale > self.minScale ? self.scaleTo(minScale, self.originX, self.originY, duration) : self.scaleTo(maxScale, self.originX, self.originY, duration);
		return self;
	},
	_pinchStartHandler: function(e) {
		var self = this;
		var xscroll = self.xscroll;
		//disable pan gesture
		self.disablePan();
		xscroll.stop();
		self.isScaling = false;
		self.scale = xscroll.scale;
		self.originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
		self.originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
	},
	_pinchHandler: function(e) {
		var self = this;
		var scale = self.scale;
		var xscroll = self.xscroll;
		var originX = self.originX;
		var originY = self.originY;
		var __scale = scale * e.scale;
		if (__scale <= self.userConfig.minScale) {
			// s = 1/2 * a * 2^(s/a)
			__scale = 0.5 * self.userConfig.minScale * Math.pow(2, __scale / self.userConfig.minScale);
		}
		if (__scale >= self.userConfig.maxScale) {
			// s = 2 * a * 1/2^(a/s)
			__scale = 2 * self.userConfig.maxScale * Math.pow(0.5, self.userConfig.maxScale / __scale);
		}
		self._scale(__scale, originX, originY);
		self.xscroll.translate(xscroll.x, xscroll.y, __scale, 'e.scale', e.scale);
	},
	disablePan: function() {
		this.xscroll.mc.get("pan").set({
			enable: false
		});
		return this;
	},
	enablePan: function() {
		this.xscroll.mc.get("pan").set({
			enable: true
		});
		return this;
	},
	_pinchEndHandler: function(e) {
		var self = this;
		var originX = self.originX;
		var originY = self.originY;
		var xscroll = self.xscroll;
		if (xscroll.scale < self.minScale) {
			self.scaleTo(self.minScale, originX, originY, SCALE_TO_DURATION, "ease-out", self.enablePan);
		} else if (xscroll.scale > self.maxScale) {
			self.scaleTo(self.maxScale, originX, originY, SCALE_TO_DURATION, "ease-out", self.enablePan);
		} else {
			self.enablePan();
		}
	},
	_bindEvt: function() {
		var self = this;
		var xscroll = self.xscroll;
		xscroll.on("doubletap", self._doubleTapHandler, self);
		xscroll.on("pinchstart", self._pinchStartHandler, self);
		xscroll.on("pinchmove", self._pinchHandler, self);
		xscroll.on("pinchend pinchcancel", self._pinchEndHandler, self);
		return self;
	},
	_scale: function(scale, originX, originY) {
		var self = this;
		var xscroll = self.xscroll;
		var boundry = self.xscroll.boundry;
		if (xscroll.scale == scale || !scale) return;
		if (!self.isScaling) {
			self.scaleBegin = xscroll.scale;
			self.isScaling = true;
			self.scaleBeginX = xscroll.x;
			self.scaleBeginY = xscroll.y;
		}
		if (originX) {
			self.originX = originX;
		}
		if (originY) {
			self.originY = originY;
		}
		var containerWidth = scale * self.initialContainerWidth;
		var containerHeight = scale * self.initialContainerHeight;
		xscroll.containerWidth = Math.round(containerWidth > xscroll.width ? containerWidth : xscroll.width);
		xscroll.containerHeight = Math.round(containerHeight > xscroll.height ? containerHeight : xscroll.height);
		xscroll.scale = scale;
		var x = originX * (self.initialContainerWidth * self.scaleBegin - xscroll.containerWidth) + self.scaleBeginX;
		var y = originY * (self.initialContainerHeight * self.scaleBegin - xscroll.containerHeight) + self.scaleBeginY;
		if (x > boundry.left) {
			x = boundry.left;
		}
		if (y > boundry.top) {
			y = boundry.top;
		}
		if (x < boundry.right - xscroll.containerWidth) {
			x = boundry.right - xscroll.containerWidth;
		}
		if (y < boundry.bottom - xscroll.containerHeight) {
			y = boundry.bottom - xscroll.containerHeight;
		}
		xscroll.x = x;
		xscroll.y = y;
	},
	/**
	 * scale with an animation
	 * @memberOf Scale
	 * @param {number} scale
	 * @param {number} originX 0~1
	 * @param {number} originY 0~1
	 * @param {number} duration
	 * @param {string} easing
	 * @param {function} callback
	 */
	scaleTo: function(scale, originX, originY, duration, easing, callback) {
		var self = this;
		var xscroll = self.xscroll;
		//unscalable
		if (xscroll.scale == scale || !scale) return;
		var duration = duration || SCALE_TO_DURATION;
		var easing = easing || "ease-out";
		self.scaleStart = xscroll.scale || 1;
		// transitionStr = [transformStr, " ", duration , "s ", easing, " 0s"].join("");
		self._scale(scale, originX, originY);
		xscroll._animate("x", "translateX(" + xscroll.x + "px) scale(" + scale + ")", duration, easing, function(e) {
			callback && callback.call(self, e);
		});
		xscroll._animate("y", "translateY(" + xscroll.y + "px)", duration, easing, function(e) {
			callback && callback.call(self, e);
		});
		xscroll.__timers.x.timer.off("run", self.scaleHandler, self);
		xscroll.__timers.x.timer.off("stop", self.scaleendHandler, self);
		self.scaleHandler = function(e) {
			var _scale = (scale - self.scaleStart) * e.percent + self.scaleStart;
			//trigger scroll event
			self.trigger("scale", {
				scale: _scale,
				origin: {
					x: originX,
					y: originY
				}
			});
		};

		self.scaleendHandler = function(e) {
			self.isScaling = false;
			//enable pan gesture
			self.enablePan();
			self.trigger("scaleend", {
				type: "scaleend",
				scale: self.scale,
				origin: {
					x: originX,
					y: originY
				}
			})
		}
		
		xscroll.__timers.x.timer.on("run", self.scaleHandler, self);
		xscroll.__timers.x.timer.on("stop", self.scaleendHandler, self);
		self.trigger("scaleanimate", {
			type:"scaleanimate",
			scale: xscroll.scale,
			duration: duration,
			easing: easing,
			offset: {
				x: xscroll.x,
				y: xscroll.y
			},
			origin: {
				x: originX,
				y: originY
			}
		});
	}
});

if (typeof module == 'object' && module.exports) {
	module.exports = Scale;
}
/** ignored by jsdoc **/
else if (window.XScroll && window.XScroll.Plugins) {
	return XScroll.Plugins.Scale = Scale;
}