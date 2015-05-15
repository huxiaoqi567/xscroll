define(function(require, exports, module) {
"use strict";
var Util = require('../util');
var Base = require('../base');
//transform
var transform = Util.prefixStyle("transform");
//transition webkitTransition MozTransition OTransition msTtransition
var transition = Util.prefixStyle("transition");
var clsPrefix = "xs-plugin-swipeedit-";
var isLocked = false;
var threshold = 20;
var isSliding = false;
var hasSlided = false;
var transformStr = Util.vendor ? ["-", Util.vendor, "-transform"].join("") : "transform";
//acceration 
var acc = 1;
var startX;
var SwipeEdit = function(cfg) {
	SwipeEdit.superclass.constructor.call(this);
	this.userConfig = Util.mix({
		labelSelector: clsPrefix + "label"
	}, cfg);
};
Util.extend(SwipeEdit, Base, {
	pluginId: "swipeedit",
	pluginInitializer: function(xscroll) {
		var self = this;
		self.xscroll = xscroll;
		self.infinite = self.xscroll.getPlugin("infinite");
		if(!self.infinite) return;
		self._bindEvt();
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
		var infinite = self.infinite;
		var lbl = null;
		infinite.on("panstart", function(e) {
			hasSlided = false;
			if (!e.cell) return;
			lbl = Util.findParentEl(e.target,"._xs_infinite_elements_",xscroll.renderTo);
			console.log(e.target)
			if (!lbl) return;
			startX = self.getTransformX(lbl);
			console.log(startX)
			lbl.style[transition] = "none";
			if (Math.abs(startX) > 0 && !isSliding) {
				self.slideRight(e)
			}
		})

		xscroll.on("pan", function(e) {
			if (!lbl) return;
			// slide left
			if (e.direction == 2) {
				self.slideAllExceptRow(e.cell._row);
			}
			/*
		            1.水平位移大于垂直位移
		            2.大于20px （参考值可自定） threshold
		            3.向左
		            */
			if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) / Math.abs(e.deltaY) > 4 && Math.abs(e.deltaX) > threshold) {
				isLocked = true;
				xscroll.userConfig.lockY = true;
				var left = startX + e.deltaX + threshold;
				if (left > 0) {
					return;
				}
				lbl.style[transition] = "none";
				lbl.style[transform] = "translateX(" + left + "px)"
			} else if (!isLocked) {
				xscroll.userConfig.lockY = false;
			}
		});

		xscroll.on("panend", function(e) {
			console.log(e)
			if (!lbl) return;
			isLocked = false;
			var cpt = self.getTransformX(lbl);
			if (e.direction == 2 && Math.abs(e.velocityX) > acc) {
				self.slideLeftHandler(e)
			} else if (Math.abs(cpt) < self.userConfig.width / 2) {
				self.slideRightHandler(e)
			} else if (Math.abs(cpt) >= self.userConfig.width / 2) {
				self.slideLeftHandler(e)
			}
		})

		// document.body.addEventListener("webkitTransitionEnd", function(e) {
		// 	if (new RegExp(self.userConfig.labelSelector.replace(/\./, "")).test(e.target.className)) {
		// 		isSliding = false;
		// 	}
		// })

	},
	slideLeft: function(row) {
		var self = this;
		var xscroll = self.xscroll;
		console.log("row:",row)
		// var cell = xscroll.getCellByRowOrCol(row);
		// if (!cell || !cell.element) return;
		// var el = cell.element.querySelector(self.userConfig.labelSelector);
		// if (!el || !el.style) return;
		// el.style[transform] = "translateX(-" + self.userConfig.width + "px) ";
		// el.style[transition] = transformStr + " 0.15s ease";
		// xscroll.getData(0, row).data.status = "delete";
	},
	slideRight: function(row) {
		console.log("slideRight",row)
		// var self = this;
		// var xscroll = self.xscroll;
		// var cell = xscroll.getCellByRowOrCol(row);
		// if (!cell || !cell.element) return;
		// var el = cell.element.querySelector(self.userConfig.labelSelector);
		// if (!el || !el.style) return;
		// var matrix = window.getComputedStyle(el)[transform].match(/[-\d\.*\d*]+/g);
		// var transX = matrix ? Math.round(matrix[4]) : 0;
		// if (transX == 0) return;
		// el.style[transform] = "translateX(0)";
		// el.style[transition] = transformStr + " 0.5s ease";
		// xscroll.getData(0, row).data.status = "";
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
}
/** ignored by jsdoc **/
else if (window.XScroll && window.XScroll.Plugins) {
	return XScroll.Plugins.SwipeEdit = SwipeEdit;
}
});