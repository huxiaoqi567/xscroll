define(function(require, exports, module) {
	var Util = require('util');
	var XScroll = require('core');
	var DataSet = require('dataset');
	var SwipeEdit = require('swipeedit');
	var transform = Util.prefixStyle("transform");
	var PAN_END = "panend";
    var PAN_START = "panstart";
    var PAN = "pan";
	var XList = function(cfg) {
		this.super.call(this, cfg)
	}
	XList.DataSet = DataSet;
	XList.SwipeEdit = SwipeEdit;
	Util.extend(XScroll, XList, {
		init: function() {
			var self = this;
			var userConfig = self.userConfig = Util.mix({
				data: [],
				gpuAcceleration: true,
				lockX: true,
				scrollbarX: false,
				itemHeight: 30
			}, self.userConfig);
			this.super.prototype.init.call(this)
			self._initInfinite();
		},
		/**
		 * get all element posInfo such as top,height,template,html
		 * @return {Array}
		 **/
		_getDomInfo: function() {
			var self = this;
			var data = self._formatData();
			var itemHeight = self.userConfig.itemHeight;
			var top = 0;
			var domInfo = [];
			var height = 0;
			self.hasSticky = false;
			//f = v/itemHeight*1000 < 60 => v = 0.06 * itemHeight
			self.userConfig.maxSpeed = 0.06 * itemHeight;
			for (var i = 0, l = data.length; i < l; i++) {
				var item = data[i];
				height = item.style && item.style.height >= 0 ? item.style.height : itemHeight;
				item._row = i;
				item._top = top;
				item._height = height;
				item.recycled = item.recycled === false ? false : true;
				domInfo.push(item);
				top += height;
				if (!self.hasSticky && item.style && item.style.position == "sticky") {
					self.hasSticky = true;
				}
			}
			self.domInfo = domInfo;
			return domInfo;
		},
		appendDataSet: function(ds) {
			var self = this;
			if (!ds instanceof DataSet) return;
			self.datasets.push(ds);
		},
		removeDataSet: function(id) {
			var self = this;
			if (!id) return;
			var index;
			for (var i = 0, l = self.datasets.length; i < l; i++) {
				if (id == self.datasets[i].getId()) {
					index = i;
				}
			}
			self.datasets.splice(index, 1);
		},
		_fireTouchStart:function(e){
			var cell = this.getCellByPageY(e.touches[0].pageY);
			e.cell = cell;
			this._curTouchedCell = cell;
			this.super.prototype._fireTouchStart.call(this,e);
		},
		_firePanStart:function(e){
			var cell = this.getCellByPageY(e.touch.startY);
			e.cell = cell;
			this._curTouchedCell = cell;
			this.super.prototype._firePanStart.call(this,e);
		},
		_firePan:function(e){
			if(this._curTouchedCell){
				e.cell = this._curTouchedCell;
			}
			this.super.prototype._firePan.call(this,e);
		},
		_firePanEnd:function(e){
			if(this._curTouchedCell){
				e.cell = this._curTouchedCell;
			}
			this.super.prototype._firePanEnd.call(this,e);
			this._curTouchedCell = null;
		},
		_fireClick:function(eventName,e){
			var cell = this.getCellByPageY(e.pageY);
			e.cell = cell;
			this.super.prototype._fireClick.call(this,eventName,e);
		},
		getCellByPageY:function(pageY){
			var self = this;
			var offsetY = pageY - self.renderTo.offsetTop + Math.abs(self.getOffsetTop());
			return self.getCellByOffsetY(offsetY);
		},
		getCellByRow:function(row){
			var self = this,cell;
			if(typeof row == "number" && row < self.domInfo.length){
				for(var i = 0;i<self.infiniteLength;i++){
					if(row == self.infiniteElementsCache[i]._row){
						cell = self.domInfo[self.infiniteElementsCache[i]._row];
						cell.element = self.infiniteElements[i];
						return cell;
					}
				}
			}
		},
		getCellByOffsetY:function(offsetY){
			var self = this;
			var len = self.domInfo.length;
			var cell;
			if(offsetY < 0) return;
			for(var i = 0;i<len;i++){
				cell = self.domInfo[i];
				if(cell._top < offsetY && cell._top + cell._height > offsetY){
					return self.getCellByRow(i);
				}
			}
		},
		insertData:function(datasetIndex,rowIndex,data){
			var self = this;
			if(data && datasetIndex >= 0 && self.datasets[datasetIndex] && rowIndex >= 0){
				// return self.datasets
			}
			return;
		},
		getData:function(datasetIndex,rowIndex){
			var self = this;
			if(datasetIndex >= 0 && self.datasets[datasetIndex] && rowIndex >= 0){
				return self.datasets[datasetIndex].getData(rowIndex);
			}
		},
		updateData:function(datasetIndex,rowIndex,data){
			var self = this;
			var d = self.getData(datasetIndex,rowIndex);
			return d.data = data;
		},
		removeData:function(datasetIndex,rowIndex){
			var self = this;
			if(datasetIndex >= 0 && self.datasets[datasetIndex] && rowIndex >= 0){
				return self.datasets[datasetIndex].removeData(rowIndex);
			}
			return;
		},
		getDataSets: function() {
			var self = this;
			return self.datasets;
		},
		getDataSetById: function(id) {
			var self = this;
			if (!id) return;
			for (var i = 0, l = self.datasets.length; i < l; i++) {
				if (self.datasets[i].getId() == id) {
					return self.datasets[i];
				}
			}
		},
		_formatData: function() {
			var self = this;
			var data = [];
			for (var i in self.datasets) {
				data = data.concat(self.datasets[i].getData());
			}
			return data;
		},
		_getChangedRows: function(newElementsPos, force) {
			var self = this;
			var changedRows = {};
			for (var i in self.elementsPos) {
				if (!newElementsPos.hasOwnProperty(i)) {
					changedRows[i] = "delete";
				}
			}
			for (var i in newElementsPos) {
				if (newElementsPos[i].recycled && (!self.elementsPos.hasOwnProperty(i) || force)) {
					changedRows[i] = "add";
				}
			}

			self.elementsPos = newElementsPos;
			return changedRows;
		},
		_getElementsPos: function(offsetTop) {
			var self = this;
			var offsetTop = -(offsetTop || self.getOffsetTop());
			var data = self.domInfo;
			var itemHeight = self.userConfig.itemHeight;
			var elementsPerPage = Math.ceil(self.height / itemHeight);
			var maxBufferedNum = Math.max(Math.ceil(elementsPerPage / 3), 1);
			var posTop = Math.max(offsetTop - maxBufferedNum * itemHeight, 0);
			var tmp = {},
				item;
			for (var i = 0, len = data.length; i < len; i++) {
				item = data[i];
				if (item._top >= posTop - itemHeight && item._top <= posTop + 2 * maxBufferedNum * itemHeight + self.height) {
					tmp[item._row] = item;
				}
			}
			return tmp
		},
		render: function() {
			var self = this;
			this.super.prototype.render.call(this);
			self._getDomInfo();
			self._initSticky();
			var height = self.height;
			var lastItem = self.domInfo[self.domInfo.length - 1];
			var containerHeight = (lastItem && lastItem._top) ? lastItem._top + lastItem._height : self.height;
			if (containerHeight < height) {
				containerHeight = height;
			}
			self.containerHeight = containerHeight;
			self.container.style.height = containerHeight;
			self.renderScrollBars();
			//渲染非回收元素
			self._renderNoRecycledEl();
			//强制刷新
			self._update(self.getOffsetTop(), true);
		},
		_update: function(offset, force) {
			var self = this;
			var translateZ = self.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			var offset = offset === undefined ? self.getOffsetTop() : offset;
			var elementsPos = self._getElementsPos(offset);
			var changedRows = self._getChangedRows(elementsPos, force);
			var el = null;
			//若强制刷新 则重新初始化dom
			if (force) {
				for (var i = 0; i < self.infiniteLength; i++) {
					self.infiniteElementsCache[i]._visible = false;
					self.infiniteElements[i].style.visibility = "hidden";
					delete self.infiniteElementsCache[i]._row;
				}
			}
			//获取可用的节点
			var getElIndex = function() {
					for (var i = 0; i < self.infiniteLength; i++) {
						if (!self.infiniteElementsCache[i]._visible) {
							self.infiniteElementsCache[i]._visible = true;
							return i;
						}
					}
				}
				//回收已使用的节点
			var setEl = function(row) {
				for (var i = 0; i < self.infiniteLength; i++) {
					if (self.infiniteElementsCache[i]._row == row) {
						self.infiniteElementsCache[i]._visible = false;
						self.infiniteElements[i].style.visibility = "hidden";
						delete self.infiniteElementsCache[i]._row;
					}
				}
			}

			for (var i in changedRows) {
				if (changedRows[i] == "delete") {
					setEl(i);
				}
				if (changedRows[i] == "add") {
					var index = getElIndex(elementsPos[i]._row);
					el = self.infiniteElements[index];
					if (el) {
						self.infiniteElementsCache[index]._row = elementsPos[i]._row;
						for (var attrName in elementsPos[i].style) {
							if (attrName != "height" && attrName != "display" && attrName != "position") {
								el.style[attrName] = elementsPos[i].style[attrName];
							}
						}
						//performance
						el.style.visibility = "visible";
						//performance
						el.style.height = elementsPos[i]._height + "px";
						el.style[transform] = "translateY(" + elementsPos[i]._top + "px) " + translateZ;
						self.userConfig.renderHook.call(self, el, elementsPos[i]);
					}
				}
			}
		},
		//非可回收元素渲染
		_renderNoRecycledEl: function() {
			var self = this;
			var translateZ = self.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			for (var i in self.domInfo) {
				if (self.domInfo[i]['recycled'] === false) {
					var el = self.domInfo[i].id && document.getElementById(self.domInfo[i].id.replace("#", "")) || document.createElement("div");
					var randomId = "ks-xlist-row-" + Date.now()
					el.id = self.domInfo[i].id || randomId;
					self.domInfo[i].id = el.id;
					self.content.appendChild(el);
					for (var attrName in self.domInfo[i].style) {
						if (attrName != "height" && attrName != "display" && attrName != "position") {
							el.style[attrName] = self.domInfo[i].style[attrName];
						}
					}
					el.style.top = 0;
					el.style.position = "absolute";
					el.style.display = "block";
					el.style.height = self.domInfo[i]._height + "px";
					el.style[transform] = "translateY(" + self.domInfo[i]._top + "px) " + translateZ;
					if (self.domInfo[i].className) {
						el.className = self.domInfo[i].className;
					}
					self.userConfig.renderHook.call(self, el, self.domInfo[i]);
				}
			}
		},
		_initSticky: function() {
			var self = this;
			if (!self.hasSticky || self._isStickyRendered) return;
			self._isStickyRendered = true;
			var sticky = document.createElement("div");
			sticky.style.position = "absolute";
			sticky.style.top = "0";
			sticky.style.display = "none";
			self.renderTo.appendChild(sticky);
			self.stickyElement = sticky;
			self.stickyDomInfo = [];
			for (var i = 0, l = self.domInfo.length; i < l; i++) {
				if (self.domInfo[i] && self.domInfo[i].style && "sticky" == self.domInfo[i].style.position) {
					self.stickyDomInfo.push(self.domInfo[i]);
				}
			}
			self.stickyDomInfoLength = self.stickyDomInfo.length;
		},
		_stickyHandler: function(_offsetTop) {
			var self = this;
			if (!self.stickyDomInfoLength) return;
			var offsetTop = Math.abs(_offsetTop);
			//视区上方的sticky索引
			var index = [];
			//所有sticky的top值
			var allTops = [];
			for (var i = 0; i < self.stickyDomInfoLength; i++) {
				allTops.push(self.stickyDomInfo[i]._top);
				if (offsetTop >= self.stickyDomInfo[i]._top) {
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
				self.stickyElement.style.height = self.stickyDomInfo[self.curStickyIndex].style.height + "px";
				self.stickyElement.className = self.stickyDomInfo[self.curStickyIndex].className || "";
				for (var attrName in self.stickyDomInfo[self.curStickyIndex].style) {
					if (attrName != "height" && attrName != "display" && attrName != "position") {
						self.stickyElement.style[attrName] = self.stickyDomInfo[self.curStickyIndex].style[attrName];
					}
				}
			}

			//如果超过第一个sticky则隐藏
			if (-_offsetTop < Math.min.apply(null, allTops)) {
				self.stickyElement.style.display = "none";
				self.curStickyIndex = undefined;
				return;
			}

		},
		enableGPUAcceleration: function() {
			var self = this;
			self.super.prototype.enableGPUAcceleration.call(self);
			for (var i = 0; i < self.infiniteLength; i++) {
				if (!/translateZ/.test(self.infiniteElements[i].style[transform])) {
					self.infiniteElements[i].style[transform] += " translateZ(0)";
				}
			}
		},
		disableGPUAcceleration: function() {
			var self = this;
			self.super.prototype.disableGPUAcceleration.call(self);
			for (var i = 0; i < self.infiniteLength; i++) {
				self.infiniteElements[i].style[transform] = self.infiniteElements[i].style[transform].replace(/translateZ\(0px\)/, "");
			}
		},
		_initInfinite: function() {
			var self = this;
			var el = self.userConfig.infiniteElements;
			self.datasets = [];
			if (self.userConfig.data && self.userConfig.data.length) {
				self.datasets.push(new DataSet({
					data: self.userConfig.data
				}));
			}
			self.infiniteElements = self.renderTo.querySelectorAll(el);
			self.infiniteLength = self.infiniteElements.length;
			self.infiniteElementsCache = (function() {
				var tmp = []
				for (var i = 0; i < self.infiniteLength; i++) {
					tmp.push({});
					//performance
					self.infiniteElements[i].style.position = "absolute";
					self.infiniteElements[i].style.top = 0;
					self.infiniteElements[i].style.visibility = "hidden";
					self.infiniteElements[i].style.display = "block";
					//performance
				}
				return tmp;
			})()
			self.elementsPos = {};
			self.on("scroll", function(e) {
				self._update(e.offset.y);
				self._stickyHandler(e.offset.y);
			})
		}
	});

	// commonjs export
	if (typeof module == 'object' && module.exports) {
		module.exports = XList;
	}
	// browser export
	else {
		window.XList = XList;
	}
	return XList;

});