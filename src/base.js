var Util = require('./util');

var Base = function() {
	this.__events = {};
}

Util.mix(Base.prototype, {
	plug: function(plugin) {
		var self = this;
		if (!plugin || !plugin.pluginId) return;
		if (!self.__plugins) {
			self.__plugins = [];
		}
		plugin.pluginInitializer(self);
		self.__plugins.push(plugin);
	},
	unplug: function(plugin) {
		var self = this;
		if (!plugin) return;
		var _plugin = typeof plugin == "string" ? self.getPlugin(plugin) : plugin;
		_plugin.pluginDestructor(self);
		for (var i in self.__plugins) {
			if (self.__plugins[i] == _plugin) {
				return self.__plugins.splice(i, 1);
			}
		}
	},
	getPlugin: function(pluginId) {
		var self = this;
		var plugins = [];
		for (var i in self.__plugins) {
			if (self.__plugins[i] && self.__plugins[i].pluginId == pluginId) {
				plugins.push(self.__plugins[i])
			}
		}
		return plugins.length > 1 ? plugins : plugins[0] || null;
	},
	fire: function(evt) {
		var self = this;
		if (self.__events[evt] && self.__events[evt].length) {
			for (var i in self.__events[evt]) {
				self.__events[evt][i].apply(this, [].slice.call(arguments, 1));
			}
		}
	},
	on: function(evt, fn) {
		if (!this.__events[evt]) {
			this.__events[evt] = [];
		}
		this.__events[evt].push(fn);
	},
	detach: function(evt, fn) {
		if (!evt || !this.__events[evt]) return;
		var index = this.__events[evt].indexOf(fn);
		if (index > -1) {
			this.__events[evt].splice(index, 1);
		}
	}
});

if (typeof module == 'object' && module.exports) {
	module.exports = Base;
} else {
	return Base;
}