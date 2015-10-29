define(function(require, exports, module) {
"use strict";
var SUBSTITUTE_REG = /\\?\{([^{}]+)\}/g,
	EMPTY = '';

var RE_TRIM = /^[\s\xa0]+|[\s\xa0]+$/g,
	trim = String.prototype.trim;

var _trim = trim ?
	function(str) {
		return str == null ? EMPTY : trim.call(str);
	} : function(str) {
		return str == null ? EMPTY : (str + '').replace(RE_TRIM, EMPTY);
	};

function upperCase() {
	return arguments[1].toUpperCase();
}

function Empty() {}

function createObject(proto, constructor) {
	var newProto;
	if (Object.create) {
		newProto = Object.create(proto);
	} else {
		Empty.prototype = proto;
		newProto = new Empty();
	}
	newProto.constructor = constructor;
	return newProto;
}

function getNodes(node, rootNode) {
	if (!node) return;
	if (node.nodeType) return [node];
	var rootNode = rootNode && rootNode.nodeType ? rootNode : document;
	if (node && typeof node === "string") {
		return rootNode.querySelectorAll(node);
	}
	return;
}

// Useful for temporary DOM ids.
var idCounter = 0;

var getOffsetTop = function(el) {
	var offset = el.offsetTop;
	if (el.offsetParent != null) offset += getOffsetTop(el.offsetParent);
	return offset;
};
var getOffsetLeft = function(el) {
	var offset = el.offsetLeft;
	if (el.offsetParent != null) offset += getOffsetLeft(el.offsetParent);
	return offset;
};

var Util = {
	// Is a given variable an object?
	isObject: function(obj) {
		return obj === Object(obj);
	},
	isArray: Array.isArray || function(obj) {
		return toString.call(obj) == '[object Array]';
	},
	// Is a given array, string, or object empty?
	// An "empty" object has no enumerable own-properties.
	isEmpty: function(obj) {
		if (obj == null) return true;
		if (this.isArray(obj) || this.isString(obj)) return obj.length === 0;
		for (var key in obj)
			if (this.has(obj, key)) return false;
		return true;
	},
	mix: function(to, from, deep) {
		for (var i in from) {
			to[i] = from[i];
		}
		return to;
	},
	extend: function(r, s, px, sx) {
		if (!s || !r) {
			return r;
		}
		var sp = s.prototype,
			rp;
		// add prototype chain
		rp = createObject(sp, r);
		r.prototype = this.mix(rp, r.prototype);
		r.superclass = createObject(sp, s);
		// add prototype overrides
		if (px) {
			this.mix(rp, px);
		}
		// add object overrides
		if (sx) {
			this.mix(r, sx);
		}
		return r;
	},
	/**
	 * test whether a string start with a specified substring
	 * @param {String} str the whole string
	 * @param {String} prefix a specified substring
	 * @return {Boolean} whether str start with prefix
	 * @member util
	 */
	startsWith: function(str, prefix) {
		return str.lastIndexOf(prefix, 0) === 0;
	},

	/**
	 * test whether a string end with a specified substring
	 * @param {String} str the whole string
	 * @param {String} suffix a specified substring
	 * @return {Boolean} whether str end with suffix
	 * @member util
	 */
	endsWith: function(str, suffix) {
		var ind = str.length - suffix.length;
		return ind >= 0 && str.indexOf(suffix, ind) === ind;
	},
	/**
	 * Removes the whitespace from the beginning and end of a string.
	 * @method
	 * @member util
	 */
	trim: _trim,
	/**
	 * Substitutes keywords in a string using an object/array.
	 * Removes undef keywords and ignores escaped keywords.
	 * @param {String} str template string
	 * @param {Object} o json data
	 * @member util
	 * @param {RegExp} [regexp] to match a piece of template string
	 */
	substitute: function(str, o, regexp) {
		if (typeof str !== 'string' || !o) {
			return str;
		}

		return str.replace(regexp || SUBSTITUTE_REG, function(match, name) {
			if (match.charAt(0) === '\\') {
				return match.slice(1);
			}
			return (o[name] === undefined) ? EMPTY : o[name];
		});
	},
	/**
	 * vendors
	 * @return { String } webkit|moz|ms|o
	 * @memberOf Util
	 */
	vendor: (function() {
		var el = document.createElement('div').style;
		var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
			transform,
			i = 0,
			l = vendors.length;
		for (; i < l; i++) {
			transform = vendors[i] + 'ransform';
			if (transform in el) return vendors[i].substr(0, vendors[i].length - 1);
		}
		return false;
	})(),
	/**
	 *  add vendor to attribute
	 *  @memberOf Util
	 *  @param {String} attrName name of attribute
	 *  @return { String }
	 **/
	prefixStyle: function(attrName) {
		if (this.vendor === false) return false;
		if (this.vendor === '') return attrName;
		return this.vendor + attrName.charAt(0).toUpperCase() + attrName.substr(1);
	},
	/**
	 * judge if has class
	 * @memberOf Util
	 * @param  {HTMLElement}  el
	 * @param  {String}  className
	 * @return {Boolean}
	 */
	hasClass: function(el, className) {
		return el && el.className && className && el.className.indexOf(className) != -1;
	},
	/**
	 * add className for the element
	 * @memberOf Util
	 * @param  {HTMLElement}  el
	 * @param  {String}  className
	 */
	addClass: function(el, className) {
		if (el && className && !this.hasClass(el, className)) {
			el.className += " " + className;
		}
	},
	/**
	 * remove className for the element
	 * @memberOf Util
	 * @param  {HTMLElement}  el
	 * @param  {String}  className
	 */
	removeClass: function(el, className) {
		if (el && el.className && className) {
			el.className = el.className.replace(className, "");
		}
	},
	/**
	 * remove an element
	 * @memberOf Util
	 * @param  {HTMLElement}  el
	 */
	remove: function(el) {
		if (!el || !el.parentNode) return;
		el.parentNode.removeChild(el);
	},
	/**
	 * get offset top
	 * @memberOf Util
	 * @param  {HTMLElement}   el
	 * @return {Number} offsetTop
	 */
	getOffsetTop: getOffsetTop,
	/**
	 * get offset left
	 * @memberOf Util
	 * @param  {HTMLElement}  el
	 * @return {Number} offsetLeft
	 */
	getOffsetLeft: getOffsetLeft,
	/**
	 * get offset left
	 * @memberOf Util
	 * @param  {HTMLElement} el
	 * @param  {String} selector
	 * @param  {HTMLElement} rootNode
	 * @return {HTMLElement} parent element
	 */
	findParentEl: function(el, selector, rootNode) {
		var rs = null,
			parent = null;
		var type = /^#/.test(selector) ? "id" : /^\./.test(selector) ? "class" : "tag";
		var sel = selector.replace(/\.|#/g, "");
		if (rootNode && typeof rootNode === "string") {
			rootNode = document.querySelector(rootNode);
		}
		rootNode = rootNode || document.body;
		if (!el || !selector) return;
		if (type == "class" && el.className && el.className.match(sel)) {
			return el;
		} else if (type == "id" && el.id && _trim(el.id) == sel) {
			return el;
		} else if (type == "tag" && el.tagName.toLowerCase() == sel) {
			return el;
		}
		while (!rs) {
			if (parent == rootNode) break;
			parent = el.parentNode;
			if (!parent) break;
			if ((type == "class" && parent.className && parent.className.match(sel)) || (type == "id" && parent.id && _trim(parent.id) == sel) || (type == "tag" && parent.tagName && parent.tagName.toLowerCase() == sel)) {
				rs = parent
				return rs;
				break;
			} else {
				el = parent;
			}
		}
		return null;
	},
	/**
	 * Generate a unique integer id (unique within the entire client session).
	 * @param  {String} prefix
	 * @return {String} guid
	 */
	guid: function(prefix) {
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
	},
	/**
	 * judge if is an android os
	 * @return {Boolean} [description]
	 */
	isAndroid: function() {
		return /Android /.test(window.navigator.appVersion);
	},
	/**
	 * judge if is an android device with low  performance
	 * @return {Boolean}
	 */
	isBadAndroid: function() {
		return /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion))
	},
	px2Num: function(px) {
		return Number(px.replace(/px/, ''));
	},
	getNodes: getNodes,
	getNode: function(node, rootNode) {
		var nodes = getNodes(node, rootNode);
		return nodes && nodes[0];
	},
	stringifyStyle: function(style) {
		var styleStr = "";
		for (var i in style) {
			styleStr += [i, ":", style[i], ";"].join("");
		}
		return styleStr;
	}
}

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
var names = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'];
for (var i = 0; i < names.length; i++) {
	Util['is' + names[i]] = function(obj) {
		return toString.call(obj) == '[object ' + names[i] + ']';
	};
}

if (typeof module == 'object' && module.exports) {
	module.exports = Util;
}
/** ignored by jsdoc **/
else {
	return Util;
}
});