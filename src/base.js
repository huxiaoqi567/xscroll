"use strict";
var Util = require('./util');
var Events = require('./events');
/** 
      @constructor 
      @mixes Events
      */
var Base = function() {}

Util.mix(Base.prototype, Events);

Util.mix(Base.prototype, {
	/**
	 * @memberof Base
	 * @param  {object} plugin plug a plugin
	 */
	plug: function(plugin) {
		var self = this;
		if (!plugin || !plugin.pluginId) return;
		if (!self.__plugins) {
			self.__plugins = [];
		}
		var __plugin = self.getPlugin(plugin.pluginId);
		__plugin && self.unplug(plugin.pluginId);
		plugin.pluginInitializer(self);
		self.__plugins.push(plugin);
		return self;
	},
	/**
	 * @memberof Base
	 * @param  {object|string} plugin unplug a plugin by pluginId or plugin instance
	 */
	unplug: function(plugin) {
		var self = this;
		if (!plugin || !self.__plugins) return;
		var _plugin = typeof plugin == "string" ? self.getPlugin(plugin) : plugin;
		_plugin.pluginDestructor(self);
		for (var i = 0, l = self.__plugins.length;i < l;i++) {
			if (self.__plugins[i] == _plugin) {
				return self.__plugins.splice(i, 1);
			}
		}
	},
	/**
	 * @memberof Base
	 * @param  {object|string} plugin get plugin by pluginId
	 */
	getPlugin: function(pluginId) {
		var self = this;
		var plugins = [];
		if(!self.__plugins) return;
		for (var i = 0, l = self.__plugins.length;i < l;i++) {
			if (self.__plugins[i] && self.__plugins[i].pluginId == pluginId) {
				plugins.push(self.__plugins[i])
			}
		}
		return plugins.length > 1 ? plugins : plugins[0] || null;
	}
});

if (typeof module == 'object' && module.exports) {
	module.exports = Base;
}
/** ignored by jsdoc **/
else {
	return Base;
}