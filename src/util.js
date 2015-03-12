	var SUBSTITUTE_REG = /\\?\{([^{}]+)\}/g,
		EMPTY = '';

	var RE_TRIM = /^[\s\xa0]+|[\s\xa0]+$/g,
		trim = String.prototype.trim;

	var RE_DASH = /-([a-z])/ig;

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

	// Generate a unique integer id (unique within the entire client session).
	// Useful for temporary DOM ids.
	var idCounter = 0;
	var guid = function(prefix) {
		var id = ++idCounter + '';
		return prefix ? prefix + id : id;
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
		trim: trim ?
			function(str) {
				return str == null ? EMPTY : trim.call(str);
			} : function(str) {
				return str == null ? EMPTY : (str + '').replace(RE_TRIM, EMPTY);
			},
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

		/*
        vendors
        @example webkit|moz|ms|O 
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
		 *  attrs with vendor
		 *  @return { String }
		 **/
		prefixStyle: function(style) {
			if (this.vendor === false) return false;
			if (this.vendor === '') return style;
			return this.vendor + style.charAt(0).toUpperCase() + style.substr(1);
		},
		hasClass: function(el, className) {
			return el && el.className && className && el.className.indexOf(className) != -1;
		},
		addClass: function(el, className) {
			if (el && className && !this.hasClass(el, className)) {
				el.className += " " + className;
			}
		},
		removeClass: function(el, className) {
			if (el && el.className && className) {
				el.className = el.className.replace(className, "");
			}
		},
		getOffsetTop: function(e) {
			var offset = e.offsetTop;
			if (e.offsetParent != null) offset += this.getOffsetTop(e.offsetParent);
			return offset;
		},
		getOffsetLeft: function(e) {
			var offset = e.offsetLeft;
			if (e.offsetParent != null) offset += this.getOffsetLeft(e.offsetParent);
			return offset;
		},
		findParentEl: function(el, selector, rootNode) {
			var rs = null;
			rootNode = rootNode || document.body;
			if (!el || !selector) return;
			if (el.className.match(selector.replace(/\.|#/g, ""))) {
				return el;
			}
			while (!rs) {
				rs = el.parentNode;
				if (el == rootNode) break;
				if (rs) {
					return rs;
					break;
				} else {
					el = el.parentNode;
				}
			}
			return null;
		},
		guid: guid,
		isAndroid: function() {
			return /Android /.test(window.navigator.appVersion);
		},
		isBadAndroid: function() {
			return /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion))
		},
		px2Num:function(px){
			return Number(px.replace(/px/,''));
		}
	}

	// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
	var names = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'];
	for(var i = 0 ;i < names.length;i++ ){
		Util['is' + names[i]] = function(obj) {
			return toString.call(obj) == '[object ' + names[i] + ']';
		};
	}
	
	if (typeof module == 'object' && module.exports) {
		module.exports = Util;
	} else{
		return Util;
	}