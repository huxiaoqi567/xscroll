define(function(require, exports, module) {
	var Util = require('../util'),
		Base = require('../base');

	var transform = Util.prefixStyle("transform");

	var Infinite = function(cfg) {
		Infinite.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({
			zoomType: "y"
		}, cfg);
	}

	Util.extend(Infinite, Base, {
		pluginId: "infinite",
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			self.isY = !!(self.userConfig.zoomType == "y");
			self._nameTop = self.isY ? "_top" : "_left";
			self._nameHeight = self.isY ? "_height" : "_width";
			self._nameRow = self.isY ? "_row" : "_col";
			self.nameTop = self.isY ? "top" : "left";
			self.nameHeight = self.isY ? "height" : "width";
			self.nameRow = self.isY ? "row" : "col";
			self.nameY = self.isY ? "y" : "x";
			self.nameTranslate = self.isY ? "translateY" : "translateX";
			self.nameContainerHeight = self.isY ? "containerHeight" : "containerWidth";
			self.nameScrollTop = self.isY ? "scrollTop" : "scrollLeft";
			self._initInfinite();
			xscroll.on("afterrender", function() {
				self.render();
				self._bindEvt();
			});
		},
		_initInfinite: function() {
			var self = this;
			var xscroll = self.xscroll;
			var el = self.userConfig.infiniteElements;
			self.sections = {};
			self.infiniteElements = xscroll.renderTo.querySelectorAll(el);
			self.infiniteLength = self.infiniteElements.length;
			self.infiniteElementsCache = (function() {
				var tmp = []
				for (var i = 0; i < self.infiniteLength; i++) {
					tmp.push({});
					self.infiniteElements[i].style.position = "absolute";
					self.infiniteElements[i].style[self.nameTop] = 0;
					self.infiniteElements[i].style.visibility = "hidden";
					self.infiniteElements[i].style.display = "block";
				}
				return tmp;
			})();
			self.elementsPos = {};
			xscroll.on("scroll", function(e) {
				self._update(-e[self.nameScrollTop]);
				self._stickyHandler(-e[self.nameScrollTop]);
			});
		},
		_initSticky: function() {
			var self = this;
			self.stickyDomInfo = [];
			self.stickyDomInfoLength = 0;
			if (!self.hasSticky) {
				return;
			}
			//create sticky element
			if (!self._isStickyRendered) {
				var sticky = document.createElement("div");
				sticky.style.position = "fixed";
				sticky.style[self.nameTop] = "0";
				sticky.style.display = "none";
				self.xscroll.renderTo.appendChild(sticky);
				self.stickyElement = sticky;
				self._isStickyRendered = true;
			}
			for (var i in self.__serializedData) {
				var sticky = self.__serializedData[i];
				if (sticky && sticky.style && "sticky" == sticky.style.position) {
					self.stickyDomInfo.push(sticky);
				}
			}
			self.stickyDomInfoLength = self.stickyDomInfo.length;
			console.log(self.stickyDomInfo)
		},
		_formatData: function() {
			var self = this;
			var data = [];
			for (var i in self.datasets) {
				data = data.concat(self.datasets[i].getData());
			}
			return data;
		},
		_renderUnRecycledEl: function() {
			var self = this;
			var translateZ = self.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			for (var i in self.__serializedData) {
				var  unrecycledEl = self.__serializedData[i];
				if (self.__serializedData[i]['recycled'] === false) {
					var el = unrecycledEl.id && document.getElementById(unrecycledEl.id.replace("#", "")) || document.createElement("div");
					var randomId = Util.guid("xs-row-");
					el.id = unrecycledEl.id || randomId;
					unrecycledEl.id = el.id;
					self.xscroll.content.appendChild(el);
					for (var attrName in unrecycledEl.style) {
						if (attrName != self.nameHeight && attrName != "display" && attrName != "position") {
							el.style[attrName] = unrecycledEl.style[attrName];
						}
					}
					el.style[self.nameTop] = 0;
					el.style.position = "absolute";
					el.style.display = "block";
					el.style[self.nameHeight] = unrecycledEl[self._nameHeight] + "px";
					el.style[transform] = self.nameTranslate + "(" + unrecycledEl[self._nameTop] + "px) " + translateZ;
					if (unrecycledEl.className) {
						el.className = unrecycledEl.className;
					}
					self.userConfig.renderHook.call(self, el, unrecycledEl);
				}
			}
		},
		render: function() {
			var self = this;
			var xscroll = self.xscroll;
			var offset = self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft();
			self._getDomInfo();
			self._initSticky();
			var size = xscroll[self.nameHeight];
			var sectionsLength = Object.keys(self.sections).length;
			if(!sectionsLength) return;
			var lastSection = self.sections[sectionsLength - 1];
			var lastItem = lastSection[lastSection.length - 1];
			var containerSize = (lastItem && lastItem[self._nameTop] !== undefined) ? lastItem[self._nameTop] + lastItem[self._nameHeight] : xscroll[self.nameHeight];
			if (containerSize < size) {
				containerSize = size;
			}
			xscroll[self.nameContainerHeight] = containerSize;
			xscroll.container.style[self.nameHeight] = containerSize + "px";
			self._renderUnRecycledEl();
			self._update(offset);
			self.update(offset);
		},

		_stickyHandler: function(_pos) {
			var self = this;
			if (!self.stickyDomInfoLength) return;
			var pos = Math.abs(_pos);
			var index = [];
			var allTops = [];
			for (var i = 0; i < self.stickyDomInfoLength; i++) {
				allTops.push(self.stickyDomInfo[i][self._nameTop]);
				if (pos >= self.stickyDomInfo[i][self._nameTop]) {
					index.push(i);
				}
			}
			if (!index.length) {
				self.stickyElement.style.display = "none";
				self.curStickyIndex = undefined;
				return;
			}
			var curStickyIndex = Math.max.apply(null, index);
			if (self.curStickyIndex !== curStickyIndex) {
				self.curStickyIndex = curStickyIndex;
				self.userConfig.renderHook.call(self, self.stickyElement, self.stickyDomInfo[self.curStickyIndex]);
				self.stickyElement.style.display = "block";
				self.stickyElement.style[self.nameHeight] = self.stickyDomInfo[self.curStickyIndex].style[self.nameHeight] + "px";
				self.stickyElement.className = self.stickyDomInfo[self.curStickyIndex].className || "";
				for (var attrName in self.stickyDomInfo[self.curStickyIndex].style) {
					if (attrName != self.nameHeight && attrName != "display" && attrName != "position") {
						self.stickyElement.style[attrName] = self.stickyDomInfo[self.curStickyIndex].style[attrName];
					}
				}
			}

			if (-_pos < Math.min.apply(null, allTops)) {
				self.stickyElement.style.display = "none";
				self.curStickyIndex = undefined;
				return;
			}

		},
		/**
		 * get all element posInfo such as top,height,template,html
		 * @return {Array}
		 **/
		_getDomInfo: function() {
			var self = this;
			var pos = 0,
				size = 0,
				sections = self.sections;
			self.hasSticky = false;
			var data = [];
			self.__serializedData = {};
			for (var i in sections) {
				for (var j = 0, len = sections[i].length; j < len; j++) {
					data.push(sections[i][j]);
				}
			}
			//f = v/itemSize*1000 < 60 => v = 0.06 * itemSize
			self.userConfig.maxSpeed = 0.06 * 50;
			for (var i = 0, l = data.length; i < l; i++) {
				var item = data[i];
				size = item.style && item.style.height >= 0 ? item.style.height : 100;
				item.guid = item.guid || Util.guid();
				item[self._nameRow] = i;
				item[self._nameTop] = pos;
				item[self._nameHeight] = size;
				item.recycled = item.recycled === false ? false : true;
				pos += size;
				if (!self.hasSticky && item.style && item.style.position == "sticky") {
					self.hasSticky = true;
				}
				self.__serializedData[item.guid] = item;
			}
			return sections;
		},
		getVisibleElements: function(pos) {
			var self = this;
			var xscroll = self.xscroll;
			var pos = -(pos || (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()));
			var itemSize = 50;
			var elementsPerPage = self.isY ? Math.ceil(xscroll.height / itemSize) : Math.ceil(xscroll.width / itemSize);
			var maxBufferedNum = self.userConfig.maxBufferedNum === undefined ? Math.max(Math.ceil(elementsPerPage / 3), 1) : self.userConfig.maxBufferedNum;
			var maxBufferedNum = 0;
			var pos = Math.max(pos - maxBufferedNum * itemSize, 0);
			var tmp = {},
				item;

			for (var i in self.__serializedData) {
				item = self.__serializedData[i];
				if (item[self._nameTop] >= pos - itemSize && item[self._nameTop] <= pos + 2 * maxBufferedNum * itemSize + (self.isY ? xscroll.height : xscroll.width)) {
					tmp[item[self._nameRow]] = item;
				}
			}
			return JSON.parse(JSON.stringify(tmp));
		},
		_getChangedRows: function(newElementsPos) {
			var self = this;
			var changedRows = {};
			for (var i in self.elementsPos) {
				if (!newElementsPos.hasOwnProperty(i)) {
					changedRows[i] = "delete";
				}
			}
			for (var i in newElementsPos) {
				if (newElementsPos[i].recycled && !self.elementsPos.hasOwnProperty(i)) {
					changedRows[i] = "add";
				}
			}
			self.elementsPos = newElementsPos;
			return changedRows;
		},
		update: function(pos) {
			var self = this;
			var xscroll = self.xscroll;
			var pos = pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : pos;
			var prevElementsPos = self.visibleElements;
			var newElementsPos = self.getVisibleElements(pos);
			var isMissing = function(guid){
				for(var i in newElementsPos){
					if(newElementsPos[i].guid === guid){
						return false;
					}
				}
				return true;
			}
			//delete 
			for(var i in prevElementsPos){
				if(isMissing(prevElementsPos[i].guid)){
					var index = prevElementsPos[i].__infiniteIndex;
					self.infiniteElementsCache[index]._visible = false;
					self.infiniteElements[index].style.visibility = "hidden";
					delete self.infiniteElementsCache[index][self._nameRow];
				}
			}
			//repaint
			for (var i in newElementsPos) {
				for (var j in prevElementsPos) {
					var prevEl = prevElementsPos[j],
						newEl = newElementsPos[i];
					if (prevEl.guid === newEl.guid) {
						console.log(prevEl._top, '->', newEl._top, " guid:", newEl.guid, "data:", JSON.stringify(newEl.data), "row:", prevEl._row, "->", newEl._row)
						if (newEl.style != prevEl.style || newEl._top != prevEl._top || newEl._height != prevEl._height) {
							self.renderStyle(self.infiniteElements[newEl.__infiniteIndex],newEl);
						}
						if (newEl.data != prevEl.data) {
							self.renderData(self.infiniteElements[newEl.__infiniteIndex],newEl);
						}
					}else{
						//paint
						if(self.__serializedData[newEl.guid].__infiniteIndex === undefined){
							var elObj = self._popEl();
							self.__serializedData[newEl.guid].__infiniteIndex = elObj.index;
							self.renderData(elObj.el,newEl);
							self.renderStyle(elObj.el,newEl);
						}
					}
				}
			}
			self.visibleElements = newElementsPos;
		},
		_popEl:function(){
			var self = this;
			for (var i = 0; i < self.infiniteLength; i++) {
					if (!self.infiniteElementsCache[i]._visible) {
						self.infiniteElementsCache[i]._visible = true;
						return {
							index: i,
							el: self.infiniteElements[i]
						}
					}
				}
		},
		_pushEl:function(row){
			var self = this;
				for (var i = 0; i < self.infiniteLength; i++) {
					if (self.infiniteElementsCache[i][self._nameRow] == row) {
						self.infiniteElementsCache[i]._visible = false;
						self.infiniteElements[i].style.visibility = "hidden";
						delete self.infiniteElementsCache[i][self._nameRow];
					}
				}
		},
		_update: function(pos) {
			var self = this;
			var xscroll = self.xscroll;
			var pos = pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : pos;
			var elementsPos = self.getVisibleElements(pos);
			var changedRows = self._getChangedRows(elementsPos);
			for (var i in changedRows) {
				if (changedRows[i] == "delete") {
					self._pushEl(i);
				}
				if (changedRows[i] == "add") {
					var elObj = self._popEl(elementsPos[i][self._nameRow]);
					var index = elObj.index;
					var el = elObj.el;
					if (el) {
						self.infiniteElementsCache[index][self._nameRow] = elementsPos[i][self._nameRow];
						self.__serializedData[elementsPos[i].guid].__infiniteIndex = index;
						self.renderData(el, elementsPos[i]);
						self.renderStyle(el, elementsPos[i]);
					}
				}
			}
		},
		renderData: function(el, elementObj) {
			var self = this;
			// console.log( self.__serializedData[elementObj.guid].__)
			// self.__serializedData[elementObj[guid]]
			self.userConfig.renderHook.call(self, el, elementObj);
		},
		renderStyle: function(el, elementObj) {
			var self = this;
			var translateZ = self.xscroll.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			for (var attrName in elementObj.style) {
				//update style
				if (attrName != self.nameHeight && attrName != "display" && attrName != "position") {
					el.style[attrName] = elementObj.style[attrName];
				}
			}
			el.style.visibility = "visible";
			el.style[self.nameHeight] = elementObj[self._nameHeight] + "px";
			el.style[transform] = self.nameTranslate + "(" + elementObj[self._nameTop] + "px) " + translateZ;
		},
		// getCellByPagePos:function(pos){
		// 	var self = this;
		// 	var offset = self.isY ? pos - Util.getOffsetTop(self.renderTo) + Math.abs(self.getOffsetTop()) : pos - Util.getOffsetLeft(self.renderTo) + Math.abs(self.getOffsetLeft());
		// 	return self.getCellByOffset(offset);
		// },
		// getCellByRowOrCol:function(row){
		// 	var self = this,cell;
		// 	if(typeof row == "number" && row < self.domInfo.length){
		// 		for(var i = 0;i<self.infiniteLength;i++){
		// 			if(row == self.infiniteElementsCache[i][self._nameRow]){
		// 				cell = self.domInfo[self.infiniteElementsCache[i][self._nameRow]];
		// 				cell.element = self.infiniteElements[i];
		// 				return cell;
		// 			}
		// 		}
		// 	}
		// },
		// getCellByOffset:function(offset){
		// 	var self = this;
		// 	var len = self.domInfo.length;
		// 	var cell;
		// 	if(offset < 0) return;
		// 	for(var i = 0;i<len;i++){
		// 		cell = self.domInfo[i];
		// 		if(cell[self._nameTop] < offset && cell[self._nameTop] + cell[self._nameHeight] > offset){
		// 			return self.getCellByRowOrCol(i);
		// 		}
		// 	}
		// },
		pluginDestructor: function() {
			var self = this;


		},
		_bindEvt: function() {
			var self = this;
			if (self._isEvtBinded) return;
			self._isEvtBinded = true;
			return self;
		},
		insertBefore: function(sectionId, index, data) {
			var self = this;
			if(sectionId === undefined || index === undefined || data === undefined) return self;
			if (!self.sections[sectionId]) {
				self.sections[sectionId] = [];
			}
			self.sections[sectionId].splice(index,0,data);
			return self;
		},
		insertAfter: function(sectionId, index, data) {
			var self = this;
			if(sectionId === undefined || index === undefined || data === undefined) return self;
			if (!self.sections[sectionId]) {
				self.sections[sectionId] = [];
			}
			self.sections[sectionId].splice(Number(index)+1,0,data);
			return self;
		},
		append: function(sectionId, data) {
			var self = this;
			if (!self.sections[sectionId]) {
				self.sections[sectionId] = [];
			}
			self.sections[sectionId] = self.sections[sectionId].concat(data);
			return self;
		},
		remove: function(sectionId, from, number) {
			var self = this;
			if (undefined === sectionId || !self.sections[sectionId]) return self;
			if (undefined === from) {
				delete self.sections[sectionId];
				return self;
			}
			if (self.sections[sectionId] && self.sections[sectionId][from]) {
				self.sections[sectionId].splice(from, number);
				return self;
			}
			return self;
		},
		replace: function(sectionId, index, data) {
			var self = this;
			if (undefined === sectionId || !self.sections[sectionId]) return self;
			self.sections[sectionId][index] = data;
			return self;
		}
	});


	if (typeof module == 'object' && module.exports) {
		module.exports = Infinite;
	} else {
		return Infinite;
	}
});