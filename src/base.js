define(function(require, exports, module) {
	var Util = require('./util');
	var Events = require('./events');
	var Base = function() {}

	Util.mix(Base.prototype, Events);

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
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = Base;
	} else {
		return Base;
	}
});