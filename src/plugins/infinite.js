	var Util = require('../util'),
		Base = require('../base');

	var transform = Util.prefixStyle("transform");
	var transition = Util.prefixStyle("transition");

	/**
	 * An infinity dom-recycled list plugin for xscroll.
	 * @constructor
	 * @param {object} cfg
	 * @param {string} cfg.zoomType choose scroll vertically or horizontally
	 * @param {string} cfg.transition recomposition cell with a transition
	 * @param {string} cfg.infiniteElements dom-selector for reused elements
	 * @param {function} cfg.renderHook render function for cell by per col or per row duration scrolling
	 * @extends {Base}
	 */
	var Infinite = function(cfg) {
		Infinite.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({
			zoomType: "y",
			transition: 'all 0.5s ease'
		}, cfg);
	}

	Util.extend(Infinite, Base, {
		/**
		 * a pluginId
		 * @memberOf Infinite
		 * @type {string}
		 */
		pluginId: "infinite",
		/**
		 * store the visible elements inside of view.
		 * @memberOf Infinite
		 * @type {object}
		 */
		visibleElements: {},
		/**
		 * store all elements data.
		 * @memberOf Infinite
		 * @type {object}
		 */
		sections:{},
		/**
		 * plugin initializer
		 * @memberOf Infinite
		 * @override Base
		 * @return {Infinite}
		 */
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			self.isY = !!(self.userConfig.zoomType == "y");
			self._nameTop = self.isY ? "_top" : "_left";
			self._nameHeight = self.isY ? "_height" : "_width";
			self.nameTop = self.isY ? "top" : "left";
			self.nameHeight = self.isY ? "height" : "width";
			self.nameWidth = self.isY ? "width" : "height";
			self.nameY = self.isY ? "y" : "x";
			self.nameTranslate = self.isY ? "translateY" : "translateX";
			self.nameContainerHeight = self.isY ? "containerHeight" : "containerWidth";
			self.nameScrollTop = self.isY ? "scrollTop" : "scrollLeft";
			self._initInfinite();
			xscroll.on("afterrender", function() {
				self.render();
				self._bindEvt();
			});
			return self;
		},
		/**
		 * detroy the plugin
		 * @memberOf Infinite
		 * @override Base
		 * @return {Infinite}
		 */
		pluginDestructor: function() {
			var self = this;
			self.xscroll.off("scroll", self._updateByScroll, self);
			for (var i = 0; i < self.infiniteLength; i++) {
				self.infiniteElements[i].style.position = "inherit";
				self.infiniteElements[i].style.visibility = "inherit";
				self.infiniteElements[i].style.display = "inherit";
				self.infiniteElements[i].style[self.nameTop] = "auto";
				self.infiniteElements[i].style[transform] = "none";
			}
			self.xscroll.off("tap panstart pan panend", self._cellEventsHandler, self);
			self._destroySticky();
			return self;
		},
		_initInfinite: function() {
			var self = this;
			var xscroll = self.xscroll;
			self.sections = {};
			self.infiniteElements = xscroll.renderTo.querySelectorAll(self.userConfig.infiniteElements);
			self.infiniteLength = self.infiniteElements.length;
			self.infiniteElementsCache = (function() {
				var tmp = []
				for (var i = 0; i < self.infiniteLength; i++) {
					tmp.push({});
					self.infiniteElements[i].style.position = "absolute";
					self.infiniteElements[i].style[self.nameTop] = 0;
					self.infiniteElements[i].style.visibility = "hidden";
					self.infiniteElements[i].style.display = "block";
					Util.addClass(self.infiniteElements[i], "_xs_infinite_elements_");
				}
				return tmp;
			})();
			self.elementsPos = {};
			xscroll.on("scroll", self._updateByScroll, self);
			return self;
		},
		_initSticky: function() {
			var self = this;
			self.stickyDomInfo = [];
			if (!self.hasSticky) {
				return;
			}
			//create sticky element
			if (!self._isStickyRendered) {
				var sticky = document.createElement("div");
				sticky.style.position = "fixed";
				sticky.style.left = 0;
				sticky.style.top = 0;
				sticky.style.display = "none";
				Util.addClass(sticky, "_xs_infinite_elements_");
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
			return self;
		},
		_destroySticky: function() {
			var self = this;
			self.hasSticky = false;
			self.stickyElement && self.stickyElement.remove();
			self._isStickyRendered = false;
			return self;
		},
		_renderUnRecycledEl: function() {
			var self = this;
			var translateZ = self.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			for (var i in self.__serializedData) {
				var unrecycledEl = self.__serializedData[i];
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
					Util.addClass(el, unrecycledEl.className);
					self.userConfig.renderHook.call(self, el, unrecycledEl);
				}
			}
		},
		/**
		 * render or update the scroll contents
		 * @memberOf Infinite
		 * @return {Infinite}
		 */
		render: function() {
			var self = this;
			var xscroll = self.xscroll;
			var offset = self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft();
			self.visibleElements = self.getVisibleElements(offset);
			self.__serializedData = self._computeDomPositions();
			self._initSticky();
			var size = xscroll[self.nameHeight];
			var containerSize = self._containerSize;
			if (containerSize < size) {
				containerSize = size;
			}
			xscroll[self.nameContainerHeight] = containerSize;
			xscroll.container.style[self.nameHeight] = containerSize + "px";
			xscroll.content.style[self.nameHeight] = containerSize + "px";
			self.curStickyIndex = undefined;
			self._renderUnRecycledEl();
			self._updateByScroll();
			self._updateByRender(offset);
			self.xscroll.boundryCheck();
			return self;
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
		_updateByScroll: function(e) {
			var self = this;
			var xscroll = self.xscroll;
			var _pos = e && e[self.nameScrollTop];
			var pos = _pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : _pos;
			var elementsPos = self.getVisibleElements(pos);
			var changedRows = self._getChangedRows(elementsPos);
			for (var i in changedRows) {
				if (changedRows[i] == "delete") {
					self._pushEl(i);
				}
				if (changedRows[i] == "add") {
					var elObj = self._popEl(elementsPos[i][self.guid]);
					var index = elObj.index;
					var el = elObj.el;
					if (el) {
						self.infiniteElementsCache[index].guid = elementsPos[i].guid;
						self.__serializedData[elementsPos[i].guid].__infiniteIndex = index;
						self._renderData(el, elementsPos[i]);
						self._renderStyle(el, elementsPos[i]);
					}
				}
			}
			self._stickyHandler(pos);
			return self;
		},
		_updateByRender: function(pos) {
			var self = this;
			var xscroll = self.xscroll;
			var pos = pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : pos;
			var prevElementsPos = self.visibleElements;
			var newElementsPos = self.getVisibleElements(pos);
			var prevEl, newEl;
			//repaint
			for (var i in newElementsPos) {
				newEl = newElementsPos[i];
				for (var j in prevElementsPos) {
					prevEl = prevElementsPos[j];
					if (prevEl.guid === newEl.guid) {
						if (newEl.style != prevEl.style || newEl[self._nameTop] != prevEl[self._nameTop] || newEl[self._nameHeight] != prevEl[self._nameHeight]) {
							// console.log( "data:", JSON.stringify(newEl.data),prevEl[self._nameTop], '->', newEl[self._nameTop])
							self._renderStyle(self.infiniteElements[newEl.__infiniteIndex], newEl, true);
						}
						if (JSON.stringify(newEl.data) != JSON.stringify(prevEl.data)) {
							self._renderData(self.infiniteElements[newEl.__infiniteIndex], newEl);
						}
					} else {
						// paint
						if (self.__serializedData[newEl.guid].__infiniteIndex === undefined) {
							var elObj = self._popEl();
							self.__serializedData[newEl.guid].__infiniteIndex = elObj.index;
							self._renderData(elObj.el, newEl);
							self._renderStyle(elObj.el, newEl);
						}
					}
				}
			}
			self.visibleElements = newElementsPos;
		},
		_stickyHandler: function(_pos) {
			var self = this;
			_pos = undefined === _pos ? (self.isY ?
				self.xscroll.getScrollTop() : self.xscroll.getScrollLeft()) : _pos;
			var pos = Math.abs(_pos);
			var index = [];
			var allTops = [];
			for (var i = 0; i < self.stickyDomInfo.length; i++) {
				allTops.push(self.stickyDomInfo[i][self._nameTop]);
				if (pos >= self.stickyDomInfo[i][self._nameTop]) {
					index.push(i);
				}
			}
			if (!index.length) {
				if (self.stickyElement) {
					self.stickyElement.style.display = "none";
				}
				self.curStickyIndex = undefined;
				return;
			}
			var curStickyIndex = Math.max.apply(null, index);
			if (self.curStickyIndex !== curStickyIndex) {
				self.curStickyIndex = curStickyIndex;
				self.userConfig.renderHook.call(self, self.stickyElement, self.stickyDomInfo[self.curStickyIndex]);
				self.stickyElement.style.display = "block";
				self.stickyElement.style[self.nameWidth] = "100%";
				self.stickyElement.style[self.nameHeight] = self.stickyDomInfo[self.curStickyIndex].style[self.nameHeight] + "px";
				self.stickyElement.setAttribute("xs-guid", self.stickyDomInfo[self.curStickyIndex].guid);
				Util.addClass(self.stickyElement, self.stickyDomInfo[self.curStickyIndex].className);
				for (var attrName in self.stickyDomInfo[self.curStickyIndex].style) {
					if (attrName != self.nameHeight && attrName != "display" && attrName != "position") {
						self.stickyElement.style[attrName] = self.stickyDomInfo[self.curStickyIndex].style[attrName];
					}
				}
			}
			var trans = 0;
			if (self.stickyDomInfo[self.curStickyIndex + 1]) {
				var cur = self.stickyDomInfo[self.curStickyIndex];
				var next = self.stickyDomInfo[self.curStickyIndex + 1];
				if (_pos + cur[self._nameHeight] > next[self._nameTop] && _pos + cur[self._nameHeight] < next[self._nameTop] + cur[self._nameHeight]) {
					trans = cur[self._nameHeight] + pos - next[self._nameTop];
				} else {
					trans = 0;
				}
			}
			self.stickyElement.style[transform] = self.isY ? "translateY(-" + (trans) + "px) translateZ(0)" : "translateX(-" + (trans) + "px) translateZ(0)";
			//top
			if (_pos < Math.min.apply(null, allTops)) {
				self.stickyElement.style.display = "none";
				self.curStickyIndex = undefined;
				return;
			}
		},
		/**
		 * get all element posInfo such as top,height,template,html
		 * @return {Array}
		 **/
		_computeDomPositions: function() {
			var self = this;
			var pos = 0,
				size = 0,
				sections = self.sections,
				section;
			self.hasSticky = false;
			var data = [];
			var serializedData = {};
			for (var i in sections) {
				for (var j = 0, len = sections[i].length; j < len; j++) {
					section = sections[i][j];
					section.sectionId = i;
					section.index = j;
					data.push(section);
				}
			}

			//f = v/itemSize*1000 < 60 => v = 0.06 * itemSize
			self.userConfig.maxSpeed = 0.06 * 50;
			for (var i = 0, l = data.length; i < l; i++) {
				var item = data[i];
				size = item.style && item.style[self.nameHeight] >= 0 ? item.style[self.nameHeight] : 100;
				item.guid = item.guid || Util.guid();
				item[self._nameTop] = pos;
				item[self._nameHeight] = size;
				item.recycled = item.recycled === false ? false : true;
				pos += size;
				if (!self.hasSticky && item.style && item.style.position == "sticky") {
					self.hasSticky = true;
				}
				serializedData[item.guid] = item;
			}
			self._containerSize = pos;
			return serializedData;
		},
		/**
		 * get all elements inside of the view.
		 * @memberOf Infinite
		 * @param {number} pos scrollLeft or scrollTop
		 * @return {object} visibleElements
		 */
		getVisibleElements: function(pos) {
			var self = this;
			var xscroll = self.xscroll;
			var pos = pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : pos;
			var threshold = self.userConfig.threshold >= 0 ? self.userConfig.threshold : xscroll[self.nameHeight] / 3;
			var tmp = {},
				item;
			var data = self.__serializedData;
			for (var i in data) {
				item = data[i];
				if (item[self._nameTop] >= pos - threshold && item[self._nameTop] <= pos + xscroll[self.nameHeight] + threshold) {
					tmp[item.guid] = item;
				}
			}
			return JSON.parse(JSON.stringify(tmp));
		},
		_popEl: function() {
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
		_pushEl: function(guid) {
			var self = this;
			for (var i = 0; i < self.infiniteLength; i++) {
				if (self.infiniteElementsCache[i].guid == guid) {
					self.infiniteElementsCache[i]._visible = false;
					self.infiniteElements[i].style.visibility = "hidden";
					delete self.infiniteElementsCache[i].guid;
				}
			}
		},
		_renderData: function(el, elementObj) {
			var self = this;
			if (!el) return;
			self.userConfig.renderHook.call(self, el, elementObj);
		},
		_renderStyle: function(el, elementObj, useTransition) {
			var self = this;
			if (!el) return;
			var translateZ = self.xscroll.userConfig.gpuAcceleration ? " translateZ(0) " : "";
			//default style
			var defaultStyle = {
				color: "inherit",
				background: "inherit",
				margin: "inherit",
				padding: "inherit",
				opacity: "inherit",
				textIndent: "inherit",
				overflow: "inherit"
			};

			for (var attrName in defaultStyle) {
				el.style[attrName] = defaultStyle[attrName];
			}
			//update style
			for (var attrName in elementObj.style) {
				if (attrName != self.nameHeight && attrName != "display" && attrName != "position") {
					el.style[attrName] = elementObj.style[attrName];
				}
			}
			el.setAttribute("xs-index", elementObj.index);
			el.setAttribute("xs-sectionid", elementObj.sectionId);
			el.setAttribute("xs-guid", elementObj.guid);
			el.style.visibility = "visible";
			el.style[self.nameHeight] = elementObj[self._nameHeight] + "px";
			el.style[transform] = self.nameTranslate + "(" + elementObj[self._nameTop] + "px) " + translateZ;
			el.style[transition] = useTransition ? self.userConfig.transition : "none";
		},
		getCell: function(e) {
			var self = this,
				cell;
			var el = Util.findParentEl(e.target, "._xs_infinite_elements_", self.xscroll.renderTo);
			var guid = el.getAttribute("xs-guid");
			if (undefined === guid) return;
			return self.__serializedData[guid];
		},

		_bindEvt: function() {
			var self = this;
			if (self._isEvtBinded) return;
			self._isEvtBinded = true;
			self.xscroll.renderTo.addEventListener("webkitTransitionEnd", function(e) {
				if (e.target.className.match(/xs-row/)) {
					e.target.style.webkitTransition = "";
				}
			});
			self.xscroll.on("tap panstart pan panend", self._cellEventsHandler, self);
			return self;
		},
		_cellEventsHandler: function(e) {
			var self = this;
			e.cell = self.getCell(e);
			e.cell && self[e.type].call(self, e);
		},
		/**
		 * tap event
		 * @memberOf Infinite
		 * @param {object} e events data include cell object
		 * @event
		 */
		tap: function(e) {
			this.trigger("tap", e);
			return this;
		},
		/**
		 * panstart event
		 * @memberOf Infinite
		 * @param {object} e events data include cell object
		 * @event
		 */
		panstart: function(e) {
			this.trigger("panstart", e);
			return this;
		},
		/**
		 * pan event
		 * @memberOf Infinite
		 * @param {object} e events data include cell object
		 * @event
		 */
		pan: function(e) {
			this.trigger("pan", e);
			return this;
		},
		/**
		 * panend event
		 * @memberOf Infinite
		 * @param {object} e events data include cell object
		 * @event
		 */
		panend: function(e) {
			this.trigger("panend", e);
			return this;
		},
		/**
		 * insert data before a position
		 * @memberOf Infinite
		 * @param {string} sectionId sectionId of the target cell
		 * @param {number} index index of the target cell
		 * @param {object} data data to insert
		 * @return {Infinite}
		 */
		insertBefore: function(sectionId, index, data) {
			var self = this;
			if (sectionId === undefined || index === undefined || data === undefined) return self;
			if (!self.sections[sectionId]) {
				self.sections[sectionId] = [];
			}
			self.sections[sectionId].splice(index, 0, data);
			return self;
		},
		/**
		 * insert data after a position
		 * @memberOf Infinite
		 * @param {string} sectionId sectionId of the target cell
		 * @param {number} index index of the target cell
		 * @param {object} data data to insert
		 * @return {Infinite}
		 */
		insertAfter: function(sectionId, index, data) {
			var self = this;
			if (sectionId === undefined || index === undefined || data === undefined) return self;
			if (!self.sections[sectionId]) {
				self.sections[sectionId] = [];
			}
			self.sections[sectionId].splice(Number(index) + 1, 0, data);
			return self;
		},
		/**
		 * append data after a section
		 * @memberOf Infinite
		 * @param {string} sectionId sectionId for the append cell
		 * @param {object} data data to append
		 * @return {Infinite}
		 */
		append: function(sectionId, data) {
			var self = this;
			if (!self.sections[sectionId]) {
				self.sections[sectionId] = [];
			}
			self.sections[sectionId] = self.sections[sectionId].concat(data);
			return self;
		},
		/**
		 * remove some data by sectionId,from,number
		 * @memberOf Infinite
		 * @param {string} sectionId sectionId for the append cell
		 * @param {number} from removed index from
		 * @param {number} number removed data number
		 * @return {Infinite}
		 */
		remove: function(sectionId, from, number) {
			var self = this;
			var number = number || 1;
			if (undefined === sectionId || !self.sections[sectionId]) return self;
			//remove a section
			if (undefined === from) {
				delete self.sections[sectionId];
				return self;
			}
			//remove some data in section
			if (self.sections[sectionId] && self.sections[sectionId][from]) {
				self.sections[sectionId].splice(from, number);
				return self;
			}
			return self;
		},
		/**
		 * replace some data by sectionId and index
		 * @memberOf Infinite
		 * @param {string} sectionId sectionId to replace
		 * @param {number} index removed index from
		 * @param {object} data new data to replace
		 * @return {Infinite}
		 */
		replace: function(sectionId, index, data) {
			var self = this;
			if (undefined === sectionId || !self.sections[sectionId]) return self;
			self.sections[sectionId][index] = data;
			return self;
		},
		/**
		 * get data by sectionId and index
		 * @memberOf Infinite
		 * @param {string} sectionId sectionId
		 * @param {number} index index in the section
		 * @return {object} data data
		 */
		get: function(sectionId, index) {
			if (undefined === sectionId) return;
			if (undefined === index) return this.sections[sectionId];
			return this.sections[sectionId][index];
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = Infinite;
	} else if (window.XScroll && window.XScroll.Plugins) {
		return XScroll.Plugins.Infinite = Infinite;
	}