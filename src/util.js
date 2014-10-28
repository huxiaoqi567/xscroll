
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

	var Util = {
		mix: function(to, from) {
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
			return el && el.className && el.className.indexOf(className) != -1;
		},
		addClass: function(el, className) {
			if (el && !this.hasClass(el, className)) {
				el.className += " " + className;
			}
		},
		removeClass: function(el, className) {
			if (el && el.className) {
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
		}
	}

	if (typeof module == 'object' && module.exports) {
		module.exports = Util;
	} else {
		return Util;
	}