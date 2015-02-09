define(function(require, exports, module) {
	var Util = require('../util'),
		Base = require('../base');

	var LazyLoad = function(cfg) {
		LazyLoad.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({

		}, cfg);
	}


	Util.extend(LazyLoad, Base, {
		pluginId: "lazyload",
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
		module.exports = LazyLoad;
	} else {
		return LazyLoad;
	}
});