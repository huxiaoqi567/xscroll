	var Util = require('./util');
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
		this.userConfig = Util.mix({
			labelSelector: clsPrefix + "label",
			renderHook: function(el) {
				el.innerHTML = tpl;
			}
		}, cfg);
	};
	Util.mix(SwipeEdit.prototype, {
		pluginId: "xlist/plugin/swipeedit",
		initializer: function(xlist) {
			var self = this;
			self.xlist = xlist;
			self._bindEvt();
		},
		getTransformX: function(el) {
			var trans = getComputedStyle(el)[transform].match(/[-\d\.*\d*]+/g);
			return trans ? trans[4] / 1 : 0;
		},
		_bindEvt: function() {
			var self = this;
			var xlist = self.xlist;
			var lbl = null;
			xlist.on("panstart", function(e) {
				hasSlided = false;
				lbl = e.cell.element.querySelector(self.userConfig.labelSelector);
				startX = self.getTransformX(lbl);
				lbl.style[transition] = "none";
				if (Math.abs(startX) > 0 && !isSliding) {
					self.slideRight(e)
				}
			})

			xlist.on("pan", function(e) {
				if (e.touch.directionX == "left") {
					self.slideAllExceptRow(e.cell._row);
				}
				/*
		            1.水平位移大于垂直位移
		            2.大于20px （参考值可自定） buffer
		            3.向左
		            */
				if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) / Math.abs(e.deltaY) > 4 && Math.abs(e.deltaX) > buffer ) {
					isLocked = true;
					xlist.userConfig.lockY = true;
					var left = startX + e.deltaX + buffer;
					if (left > 0) {
						return;
					}
					lbl.style[transition] = "none";
					lbl.style[transform] = "translateX(" + left + "px) translateZ(0)"
				} else if (!isLocked) {
					xlist.userConfig.lockY = false;
				}
			})

			xlist.on("panend", function(e) {
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



			 document.body.addEventListener("webkitTransitionEnd",function(e){
	           if(new RegExp(self.userConfig.labelSelector.replace(/\./,"")).test(e.target.className)){
	               isSliding = false;
	           }
	       })

		},
		slideLeft: function(row) {
			var self = this;
			var cell = xlist.getCellByRow(row);
			if (!cell || !cell.element) return;
			var el = cell.element.querySelector(self.userConfig.labelSelector);
			if (!el || !el.style) return;
			el.style[transform] = "translateX(-" + self.userConfig.width + "px) translateZ(0)";
			el.style[transition] = transformStr+" 0.15s ease";
			xlist.getData(0, row).data.status = "delete";
		},
		slideRight: function(row) {
			var self = this;
			var cell = xlist.getCellByRow(row);
			if (!cell || !cell.element) return;
			var el = cell.element.querySelector(self.userConfig.labelSelector);
			if (!el || !el.style) return;
			el.style[transform] = "translateX(0) translateZ(0)";
			el.style[transition] = transformStr+" 0.5s ease";
			xlist.getData(0, row).data.status = "";
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
			for (var i in xlist.infiniteElementsCache) {
				if (row != xlist.infiniteElementsCache[i]._row || undefined === row) {
					self.slideRight(xlist.infiniteElementsCache[i]._row);
				}
			}
		}
	});

	if(typeof module == 'object' && module.exports){
		module.exports = SwipeEdit;
	}else{
		return SwipeEdit;
	}

	
