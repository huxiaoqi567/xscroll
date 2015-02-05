define(function(require, exports, module) {
	var Util = require('./util'),
		Base = require('./base'),
		XScroll = require('./xscroll');

	var XScrollMaster = function(cfg) {
		XScrollMaster.superclass.constructor.call(this, cfg);
		this.init(cfg);
	}

	Util.extend(XScrollMaster, Base, {
		init: function(cfg) {
			var self = this;
			self.userConfig = Util.mix({
				selector:".xscroll"
			},cfg)
		},
		//find xscroll instance
		get:function(id){
			var self = this;
			if(!id) return;
			for(var i =0,l = self.__xscrolls.length;i<l;i++){
				if(self.__xscrolls[i].renderTo.id === id){
					return self.__xscrolls[i];
				}
			}
			return;
		},
		getAll:function(){
			return this.__xscrolls;
		},
		render: function() {
			var self = this;
			var findByEl = function(el,xscrolls){
				if(!el || !xscrolls) return;
				for(var i =0,l = xscrolls.length;i<l;i++){
					if(xscrolls[i].renderTo === el){
						return xscrolls[i];
					}
				}
			}
			var els = document.querySelectorAll(self.userConfig.selector);
			self.__xscrolls = [];
			for (var i = 0; i < els.length; i++) {
				self.__xscrolls.push(new XScroll({
					renderTo: els[i]
				}).render());
			}
			for (var i = 0, l = self.__xscrolls.length; i < l; i++) {
				var innerEls = self.__xscrolls[i].renderTo.querySelectorAll(self.userConfig.selector);
				for(var j =0;j<innerEls.length;j++){
					var xscroll = findByEl(innerEls[j],self.__xscrolls);
					if(xscroll){
						self.__xscrolls[i].controller.add(xscroll);
					}
				}
			}
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = XScrollMaster;
	} else {
		return XScrollMaster;
	}
});