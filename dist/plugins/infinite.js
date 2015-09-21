"use strict";
var Util = require('../util'),
	Base = require('../base');

var transform = Util.prefixStyle("transform");
var transition = Util.prefixStyle("transition");

/**
 * An infinity dom-recycled list plugin for xscroll.
 * @constructor
 * @param {object} cfg
 * @param {string} cfg.transition recomposition cell with a transition
 * @param {string} cfg.infiniteElements dom-selector for reused elements
 * @param {function} cfg.renderHook render function for cell by per col or per row duration scrolling
 * @extends {Base}
 */
var Infinite = function(cfg) {
	Infinite.superclass.constructor.call(this, cfg);
	this.userConfig = Util.mix({
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
	sections: {},
	/**
	 * plugin initializer
	 * @memberOf Infinite
	 * @override Base
	 * @return {Infinite}
	 */
	pluginInitializer: function(xscroll) {
		var self = this;
		self.xscroll = xscroll;
		self.isY = !!(xscroll.userConfig.zoomType == "y");
		self._ = {
			_top:self.isY ? "_top" : "_left",
			_height:self.isY ? "_height" : "_width",
			top:self.isY ? "top" : "left",
			height:self.isY ? "height" : "width",
			width:self.isY ? "width" : "height",
			y:self.isY ? "y" : "x",
			translate:self.isY ? "translateY" : "translateX",
			containerHeight:self.isY ? "containerHeight" : "containerWidth",
			scrollTop:self.isY ? "scrollTop" : "scrollLeft",
		}
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
		var _ = self._;
		for (var i = 0; i < self.infiniteLength; i++) {
			self.infiniteElements[i].style[_.top] = "auto";
			self.infiniteElements[i].style[transform] = "none";
			self.infiniteElements[i].style.visibility = "hidden";
		}
		self.xscroll && self.xscroll.off("scroll", self._updateByScroll, self);
		self.xscroll && self.xscroll.off("tap panstart pan panend", self._cellEventsHandler, self);
		return self;
	},
	_initInfinite: function() {
		var self = this;
		var xscroll = self.xscroll;
		var _ = self._;
		self.sections = {};
		self.infiniteElements = xscroll.renderTo.querySelectorAll(self.userConfig.infiniteElements);
		self.infiniteLength = self.infiniteElements.length;
		self.infiniteElementsCache = (function() {
			var tmp = []
			for (var i = 0; i < self.infiniteLength; i++) {
				tmp.push({});
				self.infiniteElements[i].style.position = "absolute";
				self.infiniteElements[i].style[_.top] = 0;
				self.infiniteElements[i].style.visibility = "hidden";
				self.infiniteElements[i].style.display = "block";
				Util.addClass(self.infiniteElements[i], "_xs_infinite_elements_");
			}
			return tmp;
		})();
		self.elementsPos = {};
		return self;
	},
	_renderUnRecycledEl: function() {
		var self = this;
		var _ = self._;
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
					if (attrName != _.height && attrName != "display" && attrName != "position") {
						el.style[attrName] = unrecycledEl.style[attrName];
					}
				}
				el.style[_.top] = 0;
				el.style.position = "absolute";
				el.style.display = "block";
				el.style[_.height] = unrecycledEl[_._height] + "px";
				el.style[transform] = _.translate + "(" + unrecycledEl[_._top] + "px) " + translateZ;
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
		var _  = self._;
		var xscroll = self.xscroll;
		var offset = self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft();
		self.visibleElements = self.getVisibleElements(offset);
		self.__serializedData = self._computeDomPositions();
		xscroll.sticky && xscroll.sticky.render(true); //force render
		xscroll.fixed && xscroll.fixed.render();
		var size = xscroll[_.height];
		var containerSize = self._containerSize;
		if (containerSize < size) {
			containerSize = size;
		}
		xscroll[_.containerHeight] = containerSize;
		xscroll.container.style[_.height] = containerSize + "px";
		xscroll.content.style[_.height] = containerSize + "px";
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
		var _ = self._;
		var _pos = e && e[_.scrollTop];
		var pos = _pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : _pos;
		var elementsPos = self.getVisibleElements(pos);
		var changedRows = self.changedRows = self._getChangedRows(elementsPos);
		try{
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
		}catch(e){
			console.warn('Not enough infiniteElements setted!');
		}
		return self;
	},
	_updateByRender: function(pos) {
		var self = this;
		var _ = self._;
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
					if (newEl.style != prevEl.style || newEl[_._top] != prevEl[_._top] || newEl[_._height] != prevEl[_._height]) {
						self._renderStyle(self.infiniteElements[newEl.__infiniteIndex], newEl, true);
					}
					if (JSON.stringify(newEl.data) != JSON.stringify(prevEl.data)) {
						self._renderData(self.infiniteElements[newEl.__infiniteIndex], newEl);
					}
				} else {
					// paint
					if (self.__serializedData[newEl.guid].recycled && self.__serializedData[newEl.guid].__infiniteIndex === undefined) {
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
	/**
	 * get all element posInfo such as top,height,template,html
	 * @return {Array}
	 **/
	_computeDomPositions: function() {
		var self = this;
		var _ = self._;
		var pos = 0,
			size = 0,
			sections = self.sections,
			section;
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
			size = item.style && item.style[_.height] >= 0 && item.style.position != "fixed" ? item.style[_.height] : 0;
			item.guid = item.guid || Util.guid();
			item[_._top] = pos;
			item[_._height] = size;
			item.recycled = item.recycled === false ? false : true;
			pos += size;
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
		var _ = self._;
		var pos = pos === undefined ? (self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft()) : pos;
		var threshold = self.userConfig.threshold >= 0 ? self.userConfig.threshold : xscroll[_.height] / 3;
		var tmp = {},
			item;
		var data = self.__serializedData;
		for (var i in data) {
			item = data[i];
			if (item[_._top] >= pos - threshold && item[_._top] <= pos + xscroll[_.height] + threshold) {
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
				self.infiniteElementsCache[i].guid = null;
			}
		}
	},
	_renderData: function(el, elementObj) {
		var self = this;
		if (!el || !elementObj || elementObj.style.position == "fixed") return;
		self.userConfig.renderHook.call(self, el, elementObj);
	},
	_renderStyle: function(el, elementObj, useTransition) {
		var self = this;
		var _ = self._;
		if (!el) return;
		var translateZ = self.xscroll.userConfig.gpuAcceleration ? " translateZ(0) " : "";
		//update style
		for (var attrName in elementObj.style) {
			if (attrName != _.height && attrName != "display" && attrName != "position") {
				el.style[attrName] = elementObj.style[attrName];
			}
		}
		el.setAttribute("xs-index", elementObj.index);
		el.setAttribute("xs-sectionid", elementObj.sectionId);
		el.setAttribute("xs-guid", elementObj.guid);
		el.style.visibility = "visible";
		el.style[_.height] = elementObj[_._height] + "px";
		el.style[transform] = _.translate + "(" + elementObj[_._top] + "px) " + translateZ;
		el.style[transition] = useTransition ? self.userConfig.transition : "none";
	},
	getCell: function(e) {
		var self = this,
			cell;
		var el = Util.findParentEl(e.target, "._xs_infinite_elements_", self.xscroll.renderTo);
		if(!el){
			el = Util.findParentEl(e.target, ".xs-sticky-handler", self.xscroll.renderTo);
		}
		var guid = el && el.getAttribute("xs-guid");
		if (undefined === guid) return;
		return {
			data:self.__serializedData[guid],
			el:el
		};
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
		self.xscroll.on("scroll", self._updateByScroll, self);
		self.xscroll.on("tap panstart pan panend", self._cellEventsHandler, self);
		return self;
	},
	_cellEventsHandler: function(e) {
		var self = this;
		var cell = self.getCell(e);
		e.cell = cell.data;
		e.cellEl = cell.el;
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
			self.sections[sectionId] = null;
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
}
