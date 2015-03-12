define(function(require, exports, module) {
	var Util = require('./util'),
		Base = require('./base'),
		XScroll = require('./xscroll');
	/** 
	 * A master for multi-scrollers. 
	 * @constructor
	 * @param {object} cfg - config for master.
	 * @extends Base
	 */
	var XScrollMaster = function(cfg) {
		XScrollMaster.superclass.constructor.call(this, cfg);
		this.init(cfg);
	}

	Util.extend(XScrollMaster, Base, {
		/**
		 * init the master
		 * @param {object} cfg config for master
		 * @param {string} selector xscroll root elements,it will be set to xscroll.renderTo
		 * @return {[type]}
		 */
		init: function(cfg) {
			var self = this;
			self.userConfig = Util.mix({
				selector: ".xscroll"
			}, cfg)
		},
		/**
		 * find xscroll instance
		 * @param {string} id element id for xscroll instance
		 * @return {XScroll} xscroll instance
		 */
		get: function(id) {
			var self = this;
			if (!id) return;
			for (var i = 0, l = self.__xscrolls.length; i < l; i++) {
				if (self.__xscrolls[i].renderTo.id === id) {
					return self.__xscrolls[i];
				}
			}
			return;
		},
		getAll: function() {
			return this.__xscrolls;
		},
		getElPos: function() {
			var self = this;
			var elpos = [];
			var els = document.querySelectorAll(self.userConfig.selector);
			for (var i = 0; i < els.length; i++) {
				var content = els[i].querySelector('.xs-content');
				elpos.push({
					el: els[i],
					containerWidth: content.offsetWidth,
					containerHeight: content.offsetHeight,
					width: els[i].offsetWidth,
					height: els[i].offsetHeight
				})
			}
			console.log(elpos[0])
			return elpos;
		},
		render: function() {
			var self = this;
			var findByEl = function(el, xscrolls) {
				if (!el || !xscrolls) return;
				for (var i = 0, l = xscrolls.length; i < l; i++) {
					if (xscrolls[i].renderTo === el) {
						return xscrolls[i];
					}
				}
			}
			var els = document.querySelectorAll(self.userConfig.selector);
			var elpos = self.getElPos();
			self.__xscrolls = [];
			for (var i = 0; i < els.length; i++) {
				self.__xscrolls.push(new XScroll({
					renderTo: els[i],
					containerWidth: elpos[i].containerWidth,
					containerHeight: elpos[i].containerHeight,
					width: elpos[i].width,
					height: elpos[i].height
				}).render());
			}
			for (var i = 0, l = self.__xscrolls.length; i < l; i++) {
				var innerEls = self.__xscrolls[i].renderTo.querySelectorAll(self.userConfig.selector);
				for (var j = 0; j < innerEls.length; j++) {
					var xscroll = findByEl(innerEls[j], self.__xscrolls);
					if (xscroll && self.__xscrolls[i].controller) {
						self.__xscrolls[i].controller.add(xscroll);
					}
				}
			}
			self._bindEvt();
		},
		_bindEvt: function() {
			var self = this;
			//window resize
			window.addEventListener("resize", function(e) {
				setTimeout(function() {
					var elpos = self.getElPos();
					for (var i = 0, l = self.__xscrolls.length; i < l; i++) {
						var xscroll = self.__xscrolls[i];
						xscroll.userConfig.containerWidth = elpos[i].containerWidth;
						xscroll.userConfig.containerHeight = elpos[i].containerHeight;
						xscroll.userConfig.width = elpos[i].width;
						xscroll.userConfig.height = elpos[i].height;
						xscroll.boundry.refresh({
			                width: xscroll.userConfig.width,
			                height: xscroll.userConfig.height
			            });
						xscroll.boundryCheck(0);
						xscroll.render();
						console.log(elpos[i].containerHeight,xscroll.userConfig.containerHeight)
					}
				}, 0);
			}, self);
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = XScrollMaster;
	}else{
		return window.XScrollMaster = XScrollMaster;
	}
});