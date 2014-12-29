define(function(require, exports, module) {
	var Util = require('./util');
	var XScroll = require('./core');
	var DataSet = require('./dataset');
	var SwipeEdit = require('./swipeedit');
	var PullUp = require('./pullup');
	var PullDown = require('./pulldown');
	var transform = Util.prefixStyle("transform");
	var PAN_END = "panend";
    var PAN_START = "panstart";
    var PAN = "pan";
	var XList = function(cfg) {
		XList.superclass.constructor.call(this, cfg);
	}
	XList.Util = Util;
	//namespace for plugins
	XList.Plugin = {
		SwipeEdit:SwipeEdit,
		PullUp:PullUp,
		PullDown:PullDown
	};
	XList.DataSet = DataSet;

	Util.extend( XList, XScroll,{
		init: function() {
			var self = this;
			XList.superclass.init.call(this);
			self.userConfig = Util.mix({
				data: [],
				itemWidth:40,
				zoomType:"y",
				itemHeight:40
			}, self.userConfig);

			if(self.userConfig.zoomType == "x"){
				self.userConfig.lockY = true;
				self.userConfig.scrollbarY = false;
			}else{
				self.userConfig.lockX = true;
				self.userConfig.scrollbarX = false;
			}

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
			self._initInfinite();
		},
		/**
		 * get all element posInfo such as top,height,template,html
		 * @return {Array}
		 **/
		_getDomInfo: function() {
			var self = this;
			var pos = 0,domInfo = [],size = 0,
				data = self._formatData(),
				itemSize = self.isY ? self.userConfig.itemHeight:self.userConfig.itemWidth;

			self.hasSticky = false;
			//f = v/itemSize*1000 < 60 => v = 0.06 * itemSize
			self.userConfig.maxSpeed = 0.06 * itemSize;
			for (var i = 0, l = data.length; i < l; i++) {
				var item = data[i];
				size = item.style && item.style.height >= 0 ? item.style.height : itemSize;
				item[self._nameRow] = i;
				item[self._nameTop] = pos;
				item[self._nameHeight] = size;
				item.recycled = item.recycled === false ? false : true;
				domInfo.push(item);
				pos += size;
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
			var self = this;
			var cell = this.getCellByPagePos(self.isY ? e.touches[0].pageY : e.touches[0].pageX);
			e.cell = cell;
			self._curTouchedCell = cell;
			XList.superclass._fireTouchStart.call(self,e);
		},
		_firePanStart:function(e){
			var self = this;
			var cell = this.getCellByPagePos(self.isY ? e.touch.startY : e.touch.startX);
			e.cell = cell;
			self._curTouchedCell = cell;
			XList.superclass._firePanStart.call(self,e);
		},
		_firePan:function(e){
			if(this._curTouchedCell){
				e.cell = this._curTouchedCell;
			}
			XList.superclass._firePan.call(this,e);
		},
		_firePanEnd:function(e){
			if(this._curTouchedCell){
				e.cell = this._curTouchedCell;
			}
			XList.superclass._firePanEnd.call(this,e);
			this._curTouchedCell = null;
		},
		_fireClick:function(eventName,e){
			var self =this;
			var cell = self.getCellByPagePos(self.isY ? e.pageY:e.pageX);
			e.cell = cell;
			XList.superclass._fireClick.call(self,eventName,e);
		},
		getCellByPagePos:function(pos){
			var self = this;
			var offset = self.isY ? pos - Util.getOffsetTop(self.renderTo) + Math.abs(self.getOffsetTop()) : pos - Util.getOffsetLeft(self.renderTo) + Math.abs(self.getOffsetLeft());
			return self.getCellByOffset(offset);
		},
		getCellByRowOrCol:function(row){
			var self = this,cell;
			if(typeof row == "number" && row < self.domInfo.length){
				for(var i = 0;i<self.infiniteLength;i++){
					if(row == self.infiniteElementsCache[i][self._nameRow]){
						cell = self.domInfo[self.infiniteElementsCache[i][self._nameRow]];
						cell.element = self.infiniteElements[i];
						return cell;
					}
				}
			}
		},
		getCellByOffset:function(offset){
			var self = this;
			var len = self.domInfo.length;
			var cell;
			if(offset < 0) return;
			for(var i = 0;i<len;i++){
				cell = self.domInfo[i];
				if(cell[self._nameTop] < offset && cell[self._nameTop] + cell[self._nameHeight] > offset){
					return self.getCellByRowOrCol(i);
				}
			}
		},
		insertData:function(datasetIndex,rowIndex,data){
			var self = this;
			if(data && datasetIndex >= 0 && self.datasets[datasetIndex] && rowIndex >= 0){
				return self.datasets[datasetIndex].data = self.datasets[datasetIndex].data.slice(0,rowIndex).concat(data).concat(self.datasets[datasetIndex].data.slice(rowIndex))
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
		_getElementsPos: function(offset) {
			var self = this;
			var data = self.domInfo;
			var offset = -(offset || (self.isY ? self.getOffsetTop() : self.getOffsetLeft()));
			var itemSize = self.isY ? self.userConfig.itemHeight : self.userConfig.itemWidth;
			var elementsPerPage = self.isY ? Math.ceil(self.height / itemSize) : Math.ceil(self.width / itemSize);
			var maxBufferedNum = self.userConfig.maxBufferedNum === undefined ? Math.max(Math.ceil(elementsPerPage / 3), 1) : self.userConfig.maxBufferedNum;
			var pos = Math.max(offset - maxBufferedNum * itemSize, 0);
			var tmp = {},
				item;
			for (var i = 0, len = data.length; i < len; i++) {
				item = data[i];
				if (item[self._nameTop] >= pos - itemSize && item[self._nameTop] <= pos + 2 * maxBufferedNum * itemSize + (self.isY ? self.height:self.width)) {
					tmp[item[self._nameRow]] = item;
				}
			}
			return tmp
		},
		render: function() {
			var self = this;
			XList.superclass.render.call(this);
			self._getDomInfo();
			self._initSticky();
			var size = self[self.nameHeight];
			var lastItem = self.domInfo[self.domInfo.length - 1];
			var containerSize = (lastItem && lastItem[self._nameTop] !== undefined) ? lastItem[self._nameTop] + lastItem[self._nameHeight] : self[self.nameHeight];
			if (containerSize < size) {
				containerSize = size;
			}
			self[self.nameContainerHeight] = containerSize;
			self.container.style[self.nameHeight] = containerSize + "px";
			self.renderScrollBars();
			//渲染非回收元素
			self._renderNoRecycledEl();
			//强制刷新
			self._update(self.isY ? self.getOffsetTop() : self.getOffsetLeft(), true);
		},
		_update: function(offset, force) {
			var self = this;
			var translateZ = self.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			var offset = offset === undefined ? ( self.isY ? self.getOffsetTop() : self.getOffsetLeft()) : offset;
			var elementsPos = self._getElementsPos(offset);
			var changedRows = self._getChangedRows(elementsPos, force);
			var el = null;
			//若强制刷新 则重新初始化dom
			if (force) {
				for (var i = 0; i < self.infiniteLength; i++) {
					self.infiniteElementsCache[i]._visible = false;
					self.infiniteElements[i].style.visibility = "hidden";
					delete self.infiniteElementsCache[i][self._nameRow];
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
					if (self.infiniteElementsCache[i][self._nameRow] == row) {
						self.infiniteElementsCache[i]._visible = false;
						self.infiniteElements[i].style.visibility = "hidden";
						delete self.infiniteElementsCache[i][self._nameRow];
					}
				}
			}

			for (var i in changedRows) {
				if (changedRows[i] == "delete") {
					setEl(i);
				}
				if (changedRows[i] == "add") {
					var index = getElIndex(elementsPos[i][self._nameRow]);
					el = self.infiniteElements[index];
					if (el) {
						self.infiniteElementsCache[index][self._nameRow] = elementsPos[i][self._nameRow];
						for (var attrName in elementsPos[i].style) {
							if (attrName != self.nameHeight && attrName != "display" && attrName != "position") {
								el.style[attrName] = elementsPos[i].style[attrName];
							}
						}
						el.style.visibility = "visible";
						el.style[self.nameHeight] = elementsPos[i][self._nameHeight] + "px";
						el.style[transform] = self.nameTranslate +"(" + elementsPos[i][self._nameTop] + "px) " + translateZ;
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
					var randomId = "xs-row-" + Date.now()
					el.id = self.domInfo[i].id || randomId;
					self.domInfo[i].id = el.id;
					self.content.appendChild(el);
					for (var attrName in self.domInfo[i].style) {
						if (attrName != self.nameHeight && attrName != "display" && attrName != "position") {
							el.style[attrName] = self.domInfo[i].style[attrName];
						}
					}
					el.style[self.nameTop] = 0;
					el.style.position = "absolute";
					el.style.display = "block";
					el.style[self.nameHeight] = self.domInfo[i][self._nameHeight] + "px";
					el.style[transform] = self.nameTranslate +"(" + self.domInfo[i][self._nameTop] + "px) " + translateZ;
					if (self.domInfo[i].className) {
						el.className = self.domInfo[i].className;
					}
					self.userConfig.renderHook.call(self, el, self.domInfo[i]);
				}
			}
		},
		_initSticky: function() {
			var self = this;
			if (!self.hasSticky) return;
			//create sticky element
			if(!self._isStickyRendered){
				var sticky = document.createElement("div");
				sticky.style.position = "absolute";
				sticky.style[self.nameTop] = "0";
				sticky.style.display = "none";
				self.renderTo.appendChild(sticky);
				self.stickyElement = sticky;
				self._isStickyRendered = true;
			}
			self.stickyDomInfo = [];
			for (var i = 0, l = self.domInfo.length; i < l; i++) {
				if (self.domInfo[i] && self.domInfo[i].style && "sticky" == self.domInfo[i].style.position) {
					self.stickyDomInfo.push(self.domInfo[i]);
				}
			}
			self.stickyDomInfoLength = self.stickyDomInfo.length;
		},
		_stickyHandler: function(_offset) {
			var self = this;

			if (!self.stickyDomInfoLength) return;
			var offset = Math.abs(_offset);
			//视区上方的sticky索引
			var index = [];
			//所有sticky的top值
			var allTops = [];
			for (var i = 0; i < self.stickyDomInfoLength; i++) {
				allTops.push(self.stickyDomInfo[i][self._nameTop]);
				if (offset >= self.stickyDomInfo[i][self._nameTop]) {
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

			//如果超过第一个sticky则隐藏
			if (-_offset < Math.min.apply(null, allTops)) {
				self.stickyElement.style.display = "none";
				self.curStickyIndex = undefined;
				return;
			}

		},
		enableGPUAcceleration: function() {
			var self = this;
			XList.superclass.enableGPUAcceleration.call(self);
			for (var i = 0; i < self.infiniteLength; i++) {
				if (!/translateZ/.test(self.infiniteElements[i].style[transform])) {
					self.infiniteElements[i].style[transform] += " translateZ(0)";
				}
			}
		},
		disableGPUAcceleration: function() {
			var self = this;
			XList.superclass.disableGPUAcceleration.call(self);
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
					self.infiniteElements[i].style.position = "absolute";
					self.infiniteElements[i].style[self.nameTop] = 0;
					self.infiniteElements[i].style.visibility = "hidden";
					self.infiniteElements[i].style.display = "block";
				}
				return tmp;
			})()
			self.elementsPos = {};
			self.on("scroll", function(e) {
				self._update(e.offset[self.nameY]);
				self._stickyHandler(e.offset[self.nameY]);
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
	}});