define(function(require, exports, module) {
	var Util = require('../util');
	var Animate = require('../animate');
	var MIN_SCROLLBAR_SIZE = 60;
	var BAR_MIN_SIZE = 8;
	var transform = Util.prefixStyle("transform");
	var transformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";
	var transition = Util.prefixStyle("transition");
	var borderRadius = Util.prefixStyle("borderRadius");
	var transitionDuration = Util.prefixStyle("transitionDuration");

	var ScrollBar = function(cfg) {
		this.userConfig = cfg;
		this.init(cfg.xscroll);
	}

	Util.mix(ScrollBar.prototype, {
		init: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			self.type = self.userConfig.type;
			self.isY = self.type == "y" ? true : false;
			self.scrollTopOrLeft = self.isY ? "scrollTop" : "scrollLeft";
			var boundry = self.xscroll.boundry;
			self.containerSize = self.isY ? self.xscroll.containerHeight + boundry._xtop + boundry._xbottom : self.xscroll.containerWidth + boundry._xright + boundry._xleft;
			self.indicateSize = self.isY ? self.xscroll.height : self.xscroll.width;
			self.pos = self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft();
			self.render();
			self._bindEvt();
		},
		destroy: function() {
			var self = this;
			self.scrollbar && self.scrollbar.remove();
			self.xscroll.off("scroll", self._scrollHandler, self);
			self.xscroll.off("scrollend", self._scrollEndHandler, self);
			delete self;
		},
		render: function() {
			var self = this;
			if (self.__isRender) return;
			self.__isRender = true;
			var xscroll = self.xscroll;
			var translateZ = xscroll.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			var transform = translateZ ? transformStr + ":" + translateZ + ";" : "";
			var commonCss = "opacity:0;position:absolute;z-index:999;overflow:hidden;-webkit-border-radius:3px;-moz-border-radius:3px;-o-border-radius:3px;" + transform;
			var css = self.isY ?
				"width: 3px;bottom:5px;top:5px;right:3px;" + commonCss :
				"height:3px;left:5px;right:5px;bottom:3px;" + commonCss;
			self.scrollbar = document.createElement("div");
			self.scrollbar.style.cssText = css;
			xscroll.renderTo.appendChild(self.scrollbar);
			var size = self.isY ? "width:100%;" : "height:100%;";
			self.indicate = document.createElement("div");
			self.indicate.style.cssText = size + "position:absolute;background:rgba(0,0,0,0.3);-webkit-border-radius:3px;-moz-border-radius:3px;-o-border-radius:3px;"
			self.scrollbar.appendChild(self.indicate);
			self._update();
			self.hide(0);
		},
		_update: function(pos, duration, easing, callback) {
			var self = this;
			var pos = undefined === pos ? (self.isY ? self.xscroll.getScrollTop() : self.xscroll.getScrollLeft()) : pos;
			var barInfo = self.computeScrollBar(pos);
			var size = self.isY ? "height" : "width";
			self.indicate.style[size] = Math.round(barInfo.size) + "px";
			if (duration && easing) {
				self.scrollTo(barInfo.pos, duration, easing, callback);
			} else {
				self.moveTo(barInfo.pos);
			}
		},
		//compute the position and size of the scrollbar
		computeScrollBar: function(pos) {
			var self = this;
			var type = self.isY ? "y" : "x";
			var pos = Math.round(pos);
			var spacing = 10;
			var boundry = self.xscroll.boundry;
			self.containerSize = self.isY ? self.xscroll.containerHeight + boundry._xtop + boundry._xbottom : self.xscroll.containerWidth + boundry._xright + boundry._xleft;
			//viewport size
			self.size = self.isY ? self.xscroll.height : self.xscroll.width;
			self.indicateSize = self.isY ? self.xscroll.height - spacing : self.xscroll.width - spacing;
			//scrollbar size
			var indicateSize = self.indicateSize;
			var containerSize = self.containerSize;
			//pos bottom/right
			var posout = containerSize - self.size;
			var ratio = pos / containerSize;
			var barpos = indicateSize * ratio;
			var barSize = Math.round(indicateSize * self.size / containerSize);
			var _barpos = barpos * (indicateSize - MIN_SCROLLBAR_SIZE + barSize) / indicateSize;
			if (barSize < MIN_SCROLLBAR_SIZE) {
				barSize = MIN_SCROLLBAR_SIZE;
				barpos = _barpos;
			}
			if (barpos < 0) {
				if(Math.abs(pos) * barSize / MIN_SCROLLBAR_SIZE > barSize - BAR_MIN_SIZE){
					barpos = BAR_MIN_SIZE - barSize
				}else{
					barpos = pos * barSize / MIN_SCROLLBAR_SIZE;
				}
			} else if (barpos + barSize > indicateSize && pos - posout > 0) {
				var _pos = pos - containerSize + indicateSize ;
				if (_pos * barSize / MIN_SCROLLBAR_SIZE > barSize - BAR_MIN_SIZE) {
					barpos = indicateSize + spacing - BAR_MIN_SIZE;
				} else {
					barpos = indicateSize + spacing - barSize + _pos * barSize / MIN_SCROLLBAR_SIZE;
				}
			}
			self.barpos = Math.round(barpos);
			return result = {
				size: Math.round(barSize),
				pos: self.barpos
			};
		},
		scrollTo: function(pos, duration, easing, callback) {
			var self = this;
			self.show();
			var translateZ = self.xscroll.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			var config = {
				css: {
					transform: self.isY ? "translateY(" + pos + "px)" + translateZ : "translateX(" + pos + "px)" + translateZ
				},
				duration: duration,
				easing: easing,
				useTransition: self.xscroll.userConfig.useTransition,
				end: callback
			};
			self.__timer = self.__timer || new Animate(self.indicate, config);
			//run
			self.__timer.stop();
			self.__timer.reset(config);
			self.__timer.run();
		},
		moveTo: function(pos) {
			var self = this;
			self.show();
			var translateZ = self.xscroll.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			self.isY ? self.indicate.style[transform] = "translateY(" + pos + "px) " + translateZ : self.indicate.style[transform] = "translateX(" + pos + "px) " + translateZ
			self.indicate.style[transition] = "";
		},
		_scrollHandler: function(e) {
			var self = this;
			self._update(e[self.scrollTopOrLeft]);
			return self;
		},
		isBoundryOut: function() {
			var self = this;
			return !self.isY ? (self.xscroll.isBoundryOutLeft() || self.xscroll.isBoundryOutRight()) : (self.xscroll.isBoundryOutTop() || self.xscroll.isBoundryOutBottom());
		},
		_scrollEndHandler: function(e) {
			var self = this;
			if (!self.isBoundryOut()) {
				self._update(e[self.scrollTopOrLeft]);
				self.hide();
			}
			return self;
		},
		_bindEvt: function() {
			var self = this;
			if (self.__isEvtBind) return;
			self.__isEvtBind = true;
			self.xscroll.on("scroll", self._scrollHandler, self);
			self.xscroll.on("scrollend", self._scrollEndHandler, self);
		},
		reset: function() {
			var self = this;
			self.pos = 0;
			self._update();
		},
		hide: function(duration, easing, delay) {
			var self = this;
			var duration = duration >= 0 ? duration : 300;
			var easing = easing || "ease-out";
			var delay = delay >= 0 ? delay : 100;
			self.scrollbar.style.opacity = 0;
			self.scrollbar.style[transition] = ["opacity ", duration, "ms ", " ease-out ", delay, "ms"].join("");
		},
		show: function() {
			var self = this;
			self.scrollbar.style.opacity = 1;
			self.scrollbar.style[transition] = "";
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = ScrollBar;
	} else {
		return ScrollBar;
	}
});