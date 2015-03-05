define(function(require, exports, module) {
	var Util = require('../util'),
		Base = require('../base'),
		Animate = require('../animate');

	require('../hammer');

	var SCALE_ANIMATE = "scaleanimate";
	var SCALE = "scale";
	var SCALE_END = "scaleend";
	// reduced scale rate
	var SCALE_RATE = 0.7;
	var SCALE_TO_DURATION = 300;

	var Scale = function(cfg) {
		Scale.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({
			minScale: 1,
			maxScale: 2,
			duration: SCALE_TO_DURATION
		}, cfg);
	}

	Util.extend(Scale, Base, {
		pluginId: "scale",

		pluginInitializer: function(xscroll) {
			var self = this;
			self.scale = 1;
			self.xscroll = xscroll;
			self.initialContainerWidth = xscroll.containerWidth;
			self.initialContainerHeight = xscroll.containerHeight;
			self.minScale = self.userConfig.minScale || Math.max(xscroll.width / xscroll.containerWidth, xscroll.height / xscroll.containerHeight);
			self.maxScale = self.userConfig.maxScale || 1;
			self._bindEvt();
		},

		_bindEvt: function() {
			var self = this;
			var xscroll = self.xscroll;
			var mc = xscroll.mc;
			var pan = mc.get("pan");
			var minScale = self.userConfig.minScale;
			var maxScale = self.userConfig.maxScale;
			var originX, originY,scale;
			mc.on("tap", function(e) {
				//double tap
				if (e.tapCount == 2) {
					originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
					originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
					xscroll.scale > self.minScale ? self.scaleTo(minScale, originX, originY, 200) : self.scaleTo(maxScale, originX, originY, 200);
					xscroll.trigger("doubletap",e);
				}
			});

			mc.on("pinchstart", function(e) {
				//disable pan gesture
				pan.set({enable:false});
				// xscroll.stop();
				self.isScaling = false;
		        scale = xscroll.scale;
		        originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
		        originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
		        xscroll.trigger("pinchstart", {
		          scale: scale,
		          origin: {
		            x: originX,
		            y: originY
		          }
		        });
		      });

			mc.on("pinch", function(e) {
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
				xscroll.translate(xscroll.x,xscroll.y,__scale);
				xscroll.trigger("pinch", {
					scale: __scale,
					origin: {
						x: originX,
						y: originY
					}
				});
			});


			mc.on("pinchend", function(e) {
		        if (xscroll.scale < self.minScale) {
		          self.scaleTo(self.minScale, originX, originY,SCALE_TO_DURATION,"ease-out");
		        } else if (xscroll.scale > self.maxScale) {
		          self.scaleTo(self.maxScale, originX, originY,SCALE_TO_DURATION,"ease-out");
		        }else{
		        	pan.set({enable:true});
		        }

		        xscroll.trigger("pinchend", {
		          scale: scale,
		          origin: {
		            x: originX,
		            y: originY
		          }
		        });
		      })

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
			var xscroll = self.xscroll;
			//unscalable
			if (xscroll.scale == scale || !scale) return;
			var duration = duration || SCALE_TO_DURATION;
			var easing = easing || "ease-out";
			// transitionStr = [transformStr, " ", duration , "s ", easing, " 0s"].join("");
			var scaleStart = xscroll.scale;
			self._scale(scale, originX, originY);
			xscroll._animate("x", "translateX(" + xscroll.x + "px) scale(" + scale + ")", duration, easing, callback);
			xscroll._animate("y", "translateY(" + xscroll.y + "px)", duration, easing, callback);

			self.scaleHandler = self.scaleHandler || function(e) {
				var _scale = (scale - scaleStart) * e.percent + scaleStart;
				//trigger scroll event
				xscroll.trigger("scale", {
					scale: _scale,
					origin: {
						x: originX,
						y: originY
					}
				});
			};

			self.scaleendHandler = self.scaleendHandler || function(e) {
				self.isScaling = false;
				//enable pan gesture
				xscroll.mc.get("pan").set({enable:true});
				xscroll.trigger(SCALE_END, {
					type: SCALE_END,
					scale: self.scale,
					origin: {
						x: originX,
						y: originY
					}
				})
			}

			xscroll.__timers.x.timer.off("run", self.scaleHandler);
			xscroll.__timers.x.timer.on("run", self.scaleHandler);
			xscroll.__timers.x.timer.off("stop", self.scaleendHandler);
			xscroll.__timers.x.timer.on("stop", self.scaleendHandler);
			xscroll.trigger(SCALE_ANIMATE, {
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

		},
		pluginDestructor: function() {

		}
	});


	if (typeof module == 'object' && module.exports) {
		module.exports = Scale;
	} else {
		return Scale;
	}

});