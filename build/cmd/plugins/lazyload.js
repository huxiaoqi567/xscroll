define(function(require, exports, module) {
	var Util = require('../util'),
		Base = require('../base');
	/**
	 * A image lazyload plugin for xscroll.
	 * @constructor
	 * @param {object} cfg
	 * @extends {Base}
	 */
	var LazyLoad = function(cfg) {
		LazyLoad.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({
			imgsSelector: "img",
			delay: 200,
			formatter: function(src) {
				return src;
			}
		}, cfg);
	}

	Util.extend(LazyLoad, Base, {
		/**
		 * a pluginId
		 * @memberOf LazyLoad
		 * @type {string}
		 */
		pluginId: "lazyload",
		/**
		 * plugin initializer
		 * @memberOf LazyLoad
		 * @override Base
		 * @return {LazyLoad}
		 */
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			self.reset();
			self._bindEvt();
			return self;
		},
		pluginDestructor: function() {
			var self = this;
			self.xscroll.off("scroll", self._filterItem, self);
			self.xscroll.off("afterrender", self._filterItem, self);
			delete self;
		},
		_setImgSrc: function(img) {
			if (!img) return;
			var src = img.getAttribute("data-src");
			var formattedSrc = this.userConfig.formatter.call(self, src);
			formattedSrc && img.setAttribute("src", formattedSrc);
		},
		_filterItem: function(e) {
			var self = this,
				pos;
			var e = e || self.xscroll.getScrollPos();
			var __scrollTop = self.zoomType == "x" ? e.scrollLeft : e.scrollTop;
			var __offsetHeight = self.zoomType == "x" ? "offsetWidth" : "offsetHeight";
			var __top = self.zoomType == "x" ? "left" : "top";
			var __bottom = self.zoomType == "x" ? "right" : "bottom";
			for (var i in self.positions) {
				pos = self.positions[i];
				if ((pos[__top] >= __scrollTop && pos[__top] <= __scrollTop + self.xscroll.renderTo[__offsetHeight]) || (pos[__bottom] >= __scrollTop && pos[__bottom] <= __scrollTop + self.xscroll.renderTo[__offsetHeight])) {
					self._setImgSrc(self.imgs[i]);
				}
			}
		},
		_filterItemByInfinite: function() {
			var self = this,
				infinite = self.xscroll.getPlugin("infinite");
			clearTimeout(self._timeout);
			self._timeout = setTimeout(function() {
				if (self.xscroll['isScrolling' + self.zoomType.toUpperCase()]) return;
				for (var i = 0; i < infinite.infiniteLength; i++) {
					if (infinite.infiniteElementsCache[i]._visible && infinite.infiniteElements[i]) {
						var imgs = infinite.infiniteElements[i].querySelectorAll(self.userConfig.imgsSelector);
						for (var j = 0, l = imgs.length; j < l; j++) {
							self._setImgSrc(imgs[j]);
						}
					}
				}
			}, self.userConfig.delay);
		},
		/**
		 * reset the images
		 * @memberOf LazyLoad
		 * @override Base
		 * @return {LazyLoad}
		 */
		reset: function() {
			var self = this,
				img;
			self.zoomType = !self.xscroll.userConfig.lockX ? "x" : "y";
			self.imgs = self.xscroll.renderTo.querySelectorAll(self.userConfig.imgsSelector);
			self.positions = [];
			for (var i = 0, l = self.imgs.length; i < l; i++) {
				img = self.imgs[i];
				self.positions.push(img.getBoundingClientRect());
			}
			return self;
		},
		_bindEvt: function() {
			var self = this;
			if (self._isEvtBinded) return;
			self._isEvtBinded = true;
			self.xscroll.on("scroll", self._filterItem, self);
			self.xscroll.on("afterrender", self.xscroll.getPlugin("infinite") ? self._filterItemByInfinite : self._filterItem, self);
			//judge infinite mode
			if (self.xscroll.getPlugin("infinite")) {
				self.xscroll.on("scrollend", self._filterItemByInfinite, self);
			}
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = LazyLoad;
	} else if (window.XScroll && window.XScroll.Plugins) {
		return XScroll.Plugins.LazyLoad = LazyLoad;
	}
});