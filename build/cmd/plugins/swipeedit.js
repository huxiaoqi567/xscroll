define(function(require, exports, module) {
	var Util = require('../util');
	var Base = require('../base');
	//transform
	var transform = Util.prefixStyle("transform");
	//transition webkitTransition MozTransition OTransition msTtransition
	var transition = Util.prefixStyle("transition");
	var clsPrefix = "xs-plugin-swipeedit-";
	var isLocked = false;
	var buffer = 20;
	var isSliding = false;
	var hasSlided = false;
	var transformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";
	//acceration 
	var acc = 1;
	var startX;
	var SwipeEdit = function(cfg) {
		SwipeEdit.superclass.constructor.call(this);
		this.userConfig = Util.mix({
			labelSelector: clsPrefix + "label",
			renderHook: function(el) {
				el.innerHTML = tpl;
			}
		}, cfg);
	};
	Util.extend(SwipeEdit, Base, {
		pluginId: "swipeedit",
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			self.xscroll.on("aftereventbind",function(){
				self._bindEvt();
			})
		},
		pluginDestructor: function(xscroll) {

		},
		getTransformX: function(el) {
			if (!el) return '';
			var trans = getComputedStyle(el)[transform].match(/[-\d\.*\d*]+/g);
			return trans ? trans[4] / 1 : 0;
		},
		_bindEvt: function() {
			var self = this;
			var xscroll = self.xscroll;
			var mc = self.xscroll.mc;
			var lbl = null;
			mc.on("panstart", function(e) {
				hasSlided = false;
				if (!e.cell || !e.cell.element) return;
				lbl = e.cell.element.querySelector(self.userConfig.labelSelector);
				if (!lbl) return;
				startX = self.getTransformX(lbl);
				lbl.style[transition] = "none";
				if (Math.abs(startX) > 0 && !isSliding) {
					self.slideRight(e)
				}
			})

			mc.on("pan", function(e) {
				if (!lbl) return;

				if (e.touch.directionX == "left") {
					self.slideAllExceptRow(e.cell._row);
				}
				/*
		            1.水平位移大于垂直位移
		            2.大于20px （参考值可自定） buffer
		            3.向左
		            */
				if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) / Math.abs(e.deltaY) > 4 && Math.abs(e.deltaX) > buffer) {
					isLocked = true;
					xscroll.userConfig.lockY = true;
					var left = startX + e.deltaX + buffer;
					if (left > 0) {
						return;
					}
					lbl.style[transition] = "none";
					lbl.style[transform] = "translateX(" + left + "px)"
				} else if (!isLocked) {
					xscroll.userConfig.lockY = false;
				}
			})

			mc.on("panend", function(e) {
				if (!lbl) return;
				isLocked = false;
				var cpt = self.getTransformX(lbl);
				if (e.touch.directionX == "left" && Math.abs(e.velocityX) > acc) {
					self.slideLeftHandler(e)
				} else if (Math.abs(cpt) < self.userConfig.width / 2) {
					self.slideRightHandler(e)
				} else if (Math.abs(cpt) >= self.userConfig.width / 2) {
					self.slideLeftHandler(e)
				}
			})

			document.body.addEventListener("webkitTransitionEnd", function(e) {
				if (new RegExp(self.userConfig.labelSelector.replace(/\./, "")).test(e.target.className)) {
					isSliding = false;
				}
			})

		},
		slideLeft: function(row) {
			var self = this;
			var xscroll = self.xscroll;
			var cell = xscroll.getCellByRowOrCol(row);
			if (!cell || !cell.element) return;
			var el = cell.element.querySelector(self.userConfig.labelSelector);
			if (!el || !el.style) return;
			el.style[transform] = "translateX(-" + self.userConfig.width + "px) ";
			el.style[transition] = transformStr + " 0.15s ease";
			xscroll.getData(0, row).data.status = "delete";
		},
		slideRight: function(row) {
			var self = this;
			var xscroll = self.xscroll;
			var cell = xscroll.getCellByRowOrCol(row);
			if (!cell || !cell.element) return;
			var el = cell.element.querySelector(self.userConfig.labelSelector);
			if (!el || !el.style) return;
			var matrix = window.getComputedStyle(el)[transform].match(/[-\d\.*\d*]+/g);
			var transX = matrix ? Math.round(matrix[4]) : 0;
			if (transX == 0) return;
			el.style[transform] = "translateX(0)";
			el.style[transition] = transformStr + " 0.5s ease";
			xscroll.getData(0, row).data.status = "";
		},
		slideLeftHandler: function(e) {
			var self = this;
			isSliding = true;
			self.slideLeft(e.cell._row);
		},
		slideRightHandler: function(e) {
			var self = this;
			hasSlided = true;
			isSliding = true;
			self.slideRight(e.cell._row);
		},
		slideAllExceptRow: function(row) {
			var self = this;
			var xscroll = self.xscroll;
			for (var i in xscroll.infiniteElementsCache) {
				if (row != xscroll.infiniteElementsCache[i]._row || undefined === row) {
					self.slideRight(xscroll.infiniteElementsCache[i]._row);
				}
			}
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = SwipeEdit;
	} else if (window.XScroll && window.XScroll.Plugins) {
       return XScroll.Plugins.SwipeEdit = SwipeEdit;
     }
});