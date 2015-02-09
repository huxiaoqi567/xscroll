/*
	滚动加速
*/
define(function(require, exports, module) {
	var Util = require('../util'),
		Base = require('../base');

	var FastScroll = function(cfg) {
		FastScroll.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({

		}, cfg);
	}


	Util.extend(FastScroll, Base, {
		pluginId: "fastscroll",
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			self._bindEvt();
		},
		pluginDestructor: function() {

		},
		_bindEvt:function(){}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = FastScroll;
	} else {
		return FastScroll;
	}
});