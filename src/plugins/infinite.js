define(function(require, exports, module) {
	var Util = require('../util'),
		Base = require('../base');

	var transform = Util.prefixStyle("transform");

	var DataSet = function(cfg) {
		this.data = cfg && cfg.data || [];
		this.id = cfg && cfg.id || "_ds_" + Util.guid();
	}

	Util.mix(DataSet.prototype, {
		appendData: function(data) {
			this.data = this.data.concat(data)
		},
		insertData: function(index, data) {
			if (typeof index == "number") {
				this.data.splice(index, 0, data);
			}
		},
		removeData: function() {
			if (typeof index == "number" && this.data[index]) {
				this.data.splice(index, 1);
			} else {
				this.data = [];
			}
		},
		getData: function(index) {
			if (typeof index == "number") {
				return this.data[index];
			}
			return this.data;
		},
		setId: function(id) {
			if (!id) return;
			this.id = id;
			return this.id;
		},
		getId: function() {
			return this.id;
		}
	});


	var Infinite = function(cfg) {
		Infinite.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({
			data: [],
			zoomType: "y",
			itemHeight: 40,
			itemWidth: 40
		}, cfg);

	}

	Infinite.DataSet = DataSet;

	Util.extend(Infinite, Base, {
		pluginId: "infinite",
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			if (self.userConfig.zoomType == "x") {
				xscroll.userConfig.lockY = true;
				xscroll.userConfig.scrollbarY = false;
			} else {
				xscroll.userConfig.lockX = true;
				xscroll.userConfig.scrollbarX = false;
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
			self.nameScrollTop = self.isY ? "scrollTop":"scrollLeft";
			self._initInfinite();
			xscroll.on("afterrender", function() {
				self.render();
				self._bindEvt();
			})
		},
		_initInfinite: function() {
			var self = this;
			var xscroll = self.xscroll;
			var el = self.userConfig.infiniteElements;
			self.datasets = self.datasets || [];
			if (self.userConfig.data && self.userConfig.data.length) {
				self.datasets.push(new DataSet({
					data: self.userConfig.data
				}));
			}
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
			if (!self.hasSticky) return;
			//create sticky element
			if (!self._isStickyRendered) {
				var sticky = document.createElement("div");
				sticky.style.position = "absolute";
				sticky.style[self.nameTop] = "0";
				sticky.style.display = "none";
				self.xscroll.renderTo.appendChild(sticky);
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
		_formatData: function() {
			var self = this;
			var data = [];
			for (var i in self.datasets) {
				data = data.concat(self.datasets[i].getData());
			}
			return data;
		},
		//非可回收元素渲染
		_renderNoRecycledEl: function() {
			var self = this;
			var translateZ = self.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			for (var i in self.domInfo) {
				if (self.domInfo[i]['recycled'] === false) {
					var el = self.domInfo[i].id && document.getElementById(self.domInfo[i].id.replace("#", "")) || document.createElement("div");
					var randomId = Util.guid("xs-row-");
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
					el.style[transform] = self.nameTranslate + "(" + self.domInfo[i][self._nameTop] + "px) " + translateZ;
					if (self.domInfo[i].className) {
						el.className = self.domInfo[i].className;
					}
					self.userConfig.renderHook.call(self, el, self.domInfo[i]);
				}
			}
		},
		render: function() {
			var self = this;
			var xscroll = self.xscroll;
			self._getDomInfo();
			self._initSticky();
			var size = xscroll[self.nameHeight];
			var lastItem = self.domInfo[self.domInfo.length - 1];
			var containerSize = (lastItem && lastItem[self._nameTop] !== undefined) ? lastItem[self._nameTop] + lastItem[self._nameHeight] : xscroll[self.nameHeight];
			if (containerSize < size) {
				containerSize = size;
			}
			xscroll[self.nameContainerHeight] = containerSize;
			xscroll.container.style[self.nameHeight] = containerSize + "px";
			// self.renderScrollBars();
			//渲染非回收元素
			self._renderNoRecycledEl();
			//强制刷新
			self._update(self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft(), true);
		},
		_stickyHandler: function(_pos) {
			var self = this;

			if (!self.stickyDomInfoLength) return;
			var pos = Math.abs(_pos);
			//视区上方的sticky索引
			var index = [];
			//所有sticky的top值
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

			//如果超过第一个sticky则隐藏
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
				domInfo = [],
				size = 0,
				data = self._formatData(),
				itemSize = self.isY ? self.userConfig.itemHeight : self.userConfig.itemWidth;
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
		_getElementsPos: function(pos) {
			var self = this;
			var xscroll = self.xscroll;
			var data = self.domInfo;
			var pos = -(pos || (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()));
			var itemSize = self.isY ? self.userConfig.itemHeight : self.userConfig.itemWidth;
			var elementsPerPage = self.isY ? Math.ceil(xscroll.height / itemSize) : Math.ceil(xscroll.width / itemSize);
			var maxBufferedNum = self.userConfig.maxBufferedNum === undefined ? Math.max(Math.ceil(elementsPerPage / 3), 1) : self.userConfig.maxBufferedNum;
			var pos = Math.max(pos - maxBufferedNum * itemSize, 0);
			var tmp = {},
				item;
			for (var i = 0, len = data.length; i < len; i++) {
				item = data[i];
				if (item[self._nameTop] >= pos - itemSize && item[self._nameTop] <= pos + 2 * maxBufferedNum * itemSize + (self.isY ? xscroll.height : xscroll.width)) {
					tmp[item[self._nameRow]] = item;
				}
			}
			return tmp
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
		_update: function(pos, force) {
			var self = this;
			var xscroll = self.xscroll;
			var translateZ = xscroll.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			var pos = pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : pos;
			var elementsPos = self._getElementsPos(pos);
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
						el.style[transform] = self.nameTranslate + "(" + elementsPos[i][self._nameTop] + "px) " + translateZ;
						self.userConfig.renderHook.call(self, el, elementsPos[i]);
					}
				}
			}
		},
		appendDataSet: function(ds) {
			var self = this;
			if (!ds instanceof DataSet) return;
			if(!self.datasets){
				self.datasets = [];
			}
			self.datasets.push(ds);
		},
		removeDataSet: function(id) {
			var self = this;
			if (!id || !self.datasets) return;
			var index;
			for (var i = 0, l = self.datasets.length; i < l; i++) {
				if (id == self.datasets[i].getId()) {
					index = i;
				}
			}
			self.datasets.splice(index, 1);
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
		insertData:function(datasetIndex,rowIndex,data){
			var self = this;
			if(data && datasetIndex >= 0 && self.datasets[datasetIndex] && rowIndex >= 0){
				return self.datasets[datasetIndex].data = self.datasets[datasetIndex].data.slice(0,rowIndex).concat(data).concat(self.datasets[datasetIndex].data.slice(rowIndex))
			}
			return;
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
		pluginDestructor: function() {

		},
		_bindEvt:function(){
			var self = this;
			if(self._isEvtBinded) return;
			self._isEvtBinded = true;

			self.xscroll.on("panstart",function(e){
				// console.log(e)
				
			})

		}
	});


	if (typeof module == 'object' && module.exports) {
		module.exports = Infinite;
	} else {
		return Infinite;
	}
});