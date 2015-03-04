define(function(require, exports, module) {

	var Util = require('./util'),
		SimuScroll = require('./simulate-scroll'),
		OriginScroll = require('./origin-scroll');

	var XScrollFactory = function(cfg) {
		var XScroll = Util.isAndroid()? OriginScroll: SimuScroll;
		return new XScroll(cfg);
	}

	if (typeof module == 'object' && module.exports) {
		module.exports = XScrollFactory;
	} else {
		return XScrollFactory;
	}
});