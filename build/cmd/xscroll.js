define(function(require, exports, module) {
	var Util = require('./util'),
		SimuScroll = require('./simulate-scroll'),
		OriginScroll = require('./origin-scroll');
	
	var XScroll = function(cfg) {
		var _ = cfg && cfg.useOriginScroll ? OriginScroll : SimuScroll;
		return new _(cfg);
	}
	/**
	 * util
	 * @namespace Util
	 * @type {Object}
	 */
	XScroll.Util = Util;
	/**
	 * plugins
	 * @namespace Plugins
	 * @type {Object}
	 */
	XScroll.Plugins = {};

	if (typeof module == 'object' && module.exports) {
		module.exports = XScroll;
	} else {
		return window.XScroll = XScroll;
	}

});