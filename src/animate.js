define(function(require, exports, module) {
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
	var animAttrs = ['transform', 'opacity', 'scrollTop', 'scrollLeft'];

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


	function Animate(el, cfg) {
		if (!el || !cfg || !cfg.css) return;
		var self = this;
		this.cfg = cfg;
		this.el = el;
		var duration = cfg.duration || 0,
			easing = cfg.easing || "ease",
			delay = cfg.delay || 0;

		this.transitionEndHandler = function(e) {
			if (self.__isTransitionEnd) return;
			self.__isTransitionEnd = true;
			if (e.currentTarget == el) {
				self.__handlers.stop.call(self);
			}
		};

		//trigger run
		if (cfg.run) {
			//frame animate
			this.timer = this.timer || new Timer({
				duration: Math.round(duration),
				easing: easing,
			});
			this.timer.on("run", cfg.run);
		}
		return this;
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
		run: function() {
			var self = this;
			self.__isTransitionEnd = false;
			var cfg = self.cfg,
				el = self.el,
				duration = cfg.duration || 0,
				easing = cfg.easing || "ease",
				delay = cfg.delay || 0;
			self.stop();
			self.timer && self.timer.run();
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
				el.removeEventListener(vendorTransitionEnd, self.transitionEndHandler);
				el.addEventListener(vendorTransitionEnd, self.transitionEndHandler, false);
			} else {
				var computeStyle = window.getComputedStyle(el);
				//transform
				if (cfg.css.transform) {
					var transmap = self.transmap = computeTransform(computeStyle[vendorTransform], cfg.css.transform);
					self.timer.off("run", self.__handlers.transRun);
					self.timer.on("run", self.__handlers.transRun, self);
				}
				var cssRun = function(e) {
					for (var i in cfg.css) {
						if (!/transform/.test(i)) {
							setStyle(el, i, computeStyle[i], cfg.css[i], e.percent);
						}
					}
				};

				self.timer.off("run", cssRun);
				self.timer.on("run", cssRun);

				self.timer.off("stop", self.__handlers.stop);
				self.timer.on("stop", self.__handlers.stop, self);
			}

			return self;
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
			cssRun: function(e) {
				var self = this;
				var cfg = self.cfg;
				for (var i in cfg.css) {
					if (!/transform/.test(i)) {
						setStyle(el, i, computeStyle[i], cfg.css[i], e.percent);
					}
				}
			},
			stop: function(e) {
				var self = this;
				var cfg = self.cfg;
				cfg.end && cfg.end({
					percent: 1
				});
			}
		},
		stop: function() {
			var self = this;
			if (self.cfg.useTransition) {
				var computeStyle = window.getComputedStyle(this.el);
				for (var i in animAttrs)
					if (self.cfg.css[animAttrs[i]]) {
						var value = /transform/.test(animAttrs[i]) ? computeStyle[vendorTransform] : computeStyle[animAttrs[i]];
						css(self.el, animAttrs[i], value);
					}
				if (Util.isBadAndroid()) {
					//can't stop by "none" or "" property
					self.el.style[vendorTransitionDuration] = "1ms";
				} else {
					self.el.style[vendorTransition] = "none";
				}
			}
			self.timer && self.timer.stop() && self.timer.reset();
			return self;
		},
		reset: function(cfg) {
			var self = this;
			Util.mix(self.cfg, cfg);
			this.timer && self.timer.reset({
				duration: Math.round(self.cfg.duration),
				easing: self.cfg.easing
			});
		}
	});


	if (typeof module == 'object' && module.exports) {
		module.exports = Animate;
	} else {
		return Animate;
	}


});