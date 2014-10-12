define(function(require, exports, module) {
	var Util = {
		mix: function(to, from) {
			for (var i in from) {
				to[i] = from[i];
			}
			return to;
		},
		extend:function(superClass,subClass,attrs){
			this.mix(subClass.prototype,superClass.prototype);
			subClass.prototype.super = superClass;
			this.mix(subClass.prototype,attrs)
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
		}
	}
	module.exports = Util;
})