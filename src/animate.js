define(function(require, exports, module) {
	var Util = require('./util');
	var Timer = require('./timer');
	var Easing = require('./easing');
	//transform
	var vendorTransform = Util.prefixStyle("transform");
	//transition webkitTransition MozTransition OTransition msTtransition
	var vendorTransition = Util.prefixStyle("transition");

	var venderTransitionDuration = Util.prefixStyle("transitionDuration");

	var venderTransformOrigin = Util.prefixStyle("transformOrigin");

	var venderTransitionEnd = Util.vendor ? Util.prefixStyle("transitionEnd") : "transitionend";

	var venderTransformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";

	var translateTpl = 'translate3d({translateX}px,{translateY}px,0)';

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
			}
		}

		return ret;
	}


	function Animate(el, cfg) {
		if (!el || !cfg || !cfg.css) return;
		var self = this;
		this.cfg = cfg;
		this.el = el;
		var duration = cfg.duration || 1000,
			easing = cfg.easing || "ease",
			delay = cfg.delay || 0;
		this.transitionEndHandler = function(e) {
			if(self.__isend) return;
			self.__isend = true;
			if (e.currentTarget == el) {
				self.stop();
				cfg.end && cfg.end();
			}
		};
		//trigger run
		if (cfg.run) {
			//frame animate
			this.timer = this.timer || new Timer({
				duration: duration,
				easing: easing,
			});
			this.timer.on("run", cfg.run);
			!cfg.useTransition && this.timer.on("stop", cfg.end);
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
			case "opacity":
				el.style[styleName] = val;
				break;
		}
	}


	Util.mix(Animate.prototype, {
		run: function() {
			this.__isend = false;
			var cfg = this.cfg,
				el = this.el,
				duration = cfg.duration || 1000,
				easing = cfg.easing || "ease",
				delay = cfg.delay || 0;
			this.stop();
			this.timer && this.timer.run();
			if (cfg.useTransition) {
				//transition
				el.style[vendorTransition] = Util.substitute('all {duration}ms {easing} {delay}ms', {
					duration: cfg.duration || 100,
					easing: Easing.format(easing),
					delay: delay
				});

				for (var i in cfg.css) {
					//set css
					css(el, i, cfg.css[i]);
				}
				el.removeEventListener(venderTransitionEnd, this.transitionEndHandler);
				el.addEventListener(venderTransitionEnd, this.transitionEndHandler, false);
			} else {
				var computeStyle = window.getComputedStyle(el);
				//transform
				if (cfg.css.transform) {
					var transmap = computeTransform(computeStyle[vendorTransform], cfg.css.transform);
					var newTrans = {};
					this.timer.on("run", function(e) {
						for (var i in transmap) {
							newTrans[i] = (transmap[i].newVal - transmap[i].prevVal) * e.percent + transmap[i].prevVal
						}
						var ret = Util.substitute(translateTpl + ' ' +
							'scale({scaleX},{scaleY})', newTrans);
						el.style[vendorTransform] = ret;
					});
				}

				this.timer.on("run", function(e) {
					for (var i in cfg.css) {
						if (!/transform/.test(i)) {
							setStyle(el, i, computeStyle[i], cfg.css[i], e.percent);
						}
					}
				});
			}


			return this;
		},
		stop: function() {
			if(this.cfg.useTransition){
				var transform = window.getComputedStyle(this.el)[vendorTransform];
	            this.el.style[vendorTransform] = transform;
				if (Util.isBadAndroid()) {
					//can't stop by "none" or "" property
	                this.el.style[transitionDuration] = "0.001s";
	            } else {
	                this.el.style[vendorTransition] = "none";
	            }
			}
			this.timer && this.timer.stop() && this.timer.reset();
			return this;
		},
		reset: function(cfg) {
			Util.mix(this.cfg,cfg);
			this.timer && this.timer.reset({
				duration:this.cfg.duration,
				easing:this.cfg.easing
			});
		}
	});


	if (typeof module == 'object' && module.exports) {
		module.exports = Animate;
	} else {
		return Animate;
	}


});