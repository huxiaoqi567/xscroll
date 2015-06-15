define(function(require, exports, module) {
"use strict";
var Util = require('./util');
var Timer = require('./timer');
var Easing = require('./easing');
var Base = require('./base');
//transform
var vendorTransform = Util.prefixStyle("transform");
//transition webkitTransition MozTransition OTransition msTtransition
var vendorTransition = Util.prefixStyle("transition");

var vendorTransitionDuration = Util.prefixStyle("transitionDuration");

var vendorTransformOrigin = Util.prefixStyle("transformOrigin");

var vendorTransitionEnd = Util.vendor ? Util.prefixStyle("transitionEnd") : "transitionend";

var vendorTransformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";

var translateTpl = 'translateX({translateX}px) translateY({translateY}px) translateZ(0)';
//limit attrs
var animAttrs = {
	'transform': true,
	'opacity': true,
	'scrollTop': true,
	'scrollLeft': true
};

function myParse(v) {
	return Math.round(parseFloat(v) * 1e5) / 1e5;
}

function defaultDecompose() {
	return {
		translateX: 0,
		translateY: 0,
		rotate: 0,
		skewX: 0,
		skewY: 0,
		scaleX: 1,
		scaleY: 1
	};
}

function toMatrixArray(matrix) {
	matrix = matrix.split(/,/);
	matrix = Array.prototype.map.call(matrix, function(v) {
		return myParse(v);
	});
	return matrix;
}

function decomposeMatrix(matrix) {
	matrix = toMatrixArray(matrix);
	var scaleX, scaleY, skew,
		A = matrix[0],
		B = matrix[1],
		C = matrix[2],
		D = matrix[3];

	// Make sure matrix is not singular
	if (A * D - B * C) {
		scaleX = Math.sqrt(A * A + B * B);
		skew = (A * C + B * D) / (A * D - C * B);
		scaleY = (A * D - B * C) / scaleX;
		// step (6)
		if (A * D < B * C) {
			skew = -skew;
			scaleX = -scaleX;
		}
		// matrix is singular and cannot be interpolated
	} else {
		// In this case the elem shouldn't be rendered, hence scale == 0
		scaleX = scaleY = skew = 0;
	}

	// The recomposition order is very important
	// see http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp#l971
	return {
		translateX: myParse(matrix[4]),
		translateY: myParse(matrix[5]),
		rotate: myParse(Math.atan2(B, A) * 180 / Math.PI),
		skewX: myParse(Math.atan(skew) * 180 / Math.PI),
		skewY: 0,
		scaleX: myParse(scaleX),
		scaleY: myParse(scaleY)
	};
}

function getTransformInfo(transform) {
	transform = transform.split(')');
	var trim = Util.trim,
		i = -1,
		l = transform.length - 1,
		split, prop, val,
		ret = defaultDecompose();

	// Loop through the transform properties, parse and multiply them
	while (++i < l) {
		split = transform[i].split('(');
		prop = trim(split[0]);
		val = split[1];
		switch (prop) {
			case 'translateX':
			case 'translateY':
			case 'scaleX':
			case 'scaleY':
				ret[prop] = myParse(val);
				break;
			case 'translate':
			case 'translate3d':
				val = val.split(',');
				ret.translateX = myParse(val[0]);
				ret.translateY = myParse(val[1] || 0);
				break;
			case 'scale':
				val = val.split(',');
				ret.scaleX = myParse(val[0]);
				ret.scaleY = myParse(val[1] || val[0]);
				break;
			case 'matrix':
				return decomposeMatrix(val);
		}
	}

	return ret;
}

/**
 * animate function
 * @constructor
 * @param {HTMLElement} el element to animate
 * @param {Object} config config for animate
 * @param {Object} config.css
 * @param {Number} config.duration
 * @param {String} config.easing
 * @extends {Base}
 */
function Animate(el, cfg) {
	if (!el || !cfg || !cfg.css) return;
	var self = this;
	self.cfg = cfg;
	self.el = el;
	var duration = cfg.duration || 0,
		easing = cfg.easing || "ease",
		delay = cfg.delay || 0;
	//trigger run
	if (cfg.run) {
		//frame animate
		self.timer = self.timer || new Timer({
			duration: Math.round(duration),
			easing: easing,
		});
		self.timer.on("run", cfg.run);
	}
	self._bindEvt();
	return self;
}

function computeTransform(prevTransform, destTransform) {
	var transform = getTransformInfo(prevTransform);
	var dest = getTransformInfo(destTransform);
	var trans = {};
	for (var i in dest) {
		trans[i] = {
			prevVal: transform[i],
			newVal: dest[i]
		}
	}
	return trans;
}

//for scroll only
function setStyle(el, styleName, prevVal, newVal, percent) {
	prevVal = isNaN(Number(prevVal)) ? 0 : Number(prevVal);
	var curVal = ((newVal - prevVal) * percent + prevVal);
	css(el, styleName, curVal);
}

function css(el, styleName, val) {
	switch (styleName) {
		case "scrollTop":
		case "scrollLeft":
			el[styleName] = val;
			break;
		case "transform":
			el.style[vendorTransform] = val;
		case "opacity":
			el.style[styleName] = val;
			break;

	}
}

Util.extend(Animate, Base, {
	/**
	 * to start the animation
	 * @memberof Animate
	 * @return {Animate}
	 */
	run: function() {
		var self = this;
		var cfg = self.cfg,
			el = self.el,
			duration = cfg.duration || 0,
			easing = cfg.easing || "ease",
			delay = cfg.delay || 0;
		self.__isTransitionEnd = false;
		clearTimeout(self.__itv)
		self.timer && self.timer.run();
		if (duration <= Timer.MIN_DURATION) {
			for (var i in cfg.css) {
				css(el, i, cfg.css[i]);
			}
			self.stop()
			self.__handlers.stop.call(self);
			return;
		}

		if(Util.isBadAndroid()){
			//use frame animate on bad android device
			cfg.useTransition = false;
		}

		if (cfg.useTransition) {
			//transition
			el.style[vendorTransition] = Util.substitute('all {duration}ms {easing} {delay}ms', {
				duration: Math.round(duration),
				easing: Easing.format(easing),
				delay: delay
			});
			for (var i in cfg.css) {
				//set css
				css(el, i, cfg.css[i]);
			}
			self.__itv = setTimeout(function() {
				if (!self.__isTransitionEnd) {
					self.__isTransitionEnd = true;
					self.trigger("transitionend");
				}
			}, Number(duration) + 60);
		} else {
			self.computeStyle = self.computeStyle || window.getComputedStyle(el);
			//transform
			if (cfg.css.transform && self.timer) {
				var transmap = self.transmap = computeTransform(self.computeStyle[vendorTransform], cfg.css.transform);
				self.timer.off("run", self.__handlers.transRun);
				self.timer.on("run", self.__handlers.transRun, self);
				self.timer.off("end",self.__handlers.transRun);
				self.timer.on("end", self.__handlers.transRun, self);
			}
		}
		return self;
	},
	_transitionEndHandler: function(e) {
		var self = this;
		self.stop();
		self.__handlers.stop.call(self);
	},
	__handlers: {
		transRun: function(e) {
			var self = this;
			var transmap = self.transmap;
			var el = self.el;
			var newTrans = {};
			for (var i in transmap) {
				newTrans[i] = (transmap[i].newVal - transmap[i].prevVal) * e.percent + transmap[i].prevVal
			}
			var ret = Util.substitute(translateTpl + ' ' +
				'scale({scaleX},{scaleY})', newTrans);
			el.style[vendorTransform] = ret;
		},
		stop: function(e) {
			var self = this;
			var cfg = self.cfg;
			cfg.end && cfg.end({
				percent: 1
			});
		}
	},
	_bindEvt: function() {
		var self = this;
		var cfg = self.cfg;
		var el = self.el;
		self.el.addEventListener(vendorTransitionEnd, function(e) {
			self.__isTransitionEnd = true;
			if (e.target !== e.currentTarget) return;
			self.trigger("transitionend", e);
		})
		self.on("transitionend", self._transitionEndHandler, self);
		var cssRun = function(e) {
			self.computeStyle = self.computeStyle || window.getComputedStyle(el);
			for (var i in cfg.css) {
				if (!/transform/.test(i)) {
					setStyle(self.el, i, self.computeStyle[i], cfg.css[i], e.percent);
				}
			}
		};
		self.timer && self.timer.on("run", cssRun);
		self.timer && self.timer.on("stop", self.__handlers.stop, self);
	},
	/**
	 * to stop the animation
	 * @memberof Animate
	 * @return {Animate}
	 */
	stop: function() {
		var self = this;
		if (self.cfg.useTransition && self.cfg.duration > Timer.MIN_DURATION) {
			var computeStyle = window.getComputedStyle(this.el);
			for (var i in self.cfg.css) {
				if (animAttrs[i]) {
					var value = /transform/.test(i) ? computeStyle[vendorTransform] : computeStyle[i];
					css(self.el, i, Util.substitute(translateTpl + ' ' + 'scale({scaleX},{scaleY})', getTransformInfo(value)));
				}
			}
			self.el.style[vendorTransition] = "none";
		}
		self.timer && self.timer.stop() && self.timer.reset();
		self.computeStyle = null;
		return self;
	},
	/**
	 * to reset the animation to a new state
	 * @memberof Animate
	 * @param {object} cfg cfg for new animation
	 * @return {Animate}
	 */
	reset: function(cfg) {
		var self = this;
		self.computeStyle = null;
		Util.mix(self.cfg, cfg);
		this.timer && self.timer.reset({
			duration: Math.round(self.cfg.duration),
			easing: self.cfg.easing
		});
		return self;
	}
});


if (typeof module == 'object' && module.exports) {
	module.exports = Animate;
}
/** ignored by jsdoc **/
else {
	return Animate;
}
});