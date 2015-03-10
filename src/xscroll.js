	var Util = require('./util'),
		SimuScroll = require('./simulate-scroll'),
		OriginScroll = require('./origin-scroll');

	var XScrollFactory = function(cfg) {
		var XScroll = cfg && cfg.useOriginScroll ? OriginScroll : SimuScroll;
		return new XScroll(cfg);
	}
	if (typeof module == 'object' && module.exports) {
		module.exports = XScrollFactory;
	} else {
		window.XScroll = XScrollFactory;
	}
