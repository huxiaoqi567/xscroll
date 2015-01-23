/*
	滚动嵌套
*/
define(function(require, exports, module) {
	var Util = require('../util'),
		Base = require('../base');

	var MultiView = function(cfg) {
		MultiView.superclass.constructor.call(this, cfg);
		this.userConfig = Util.mix({

		}, cfg);
	}

	Util.extend(MultiView, Base, {
		pluginId: "multiview",
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
		module.exports = MultiView;
	} else {
		return MultiView;
	}
});