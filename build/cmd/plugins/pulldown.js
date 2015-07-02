define(function(require, exports, module) {
"use strict";
var Util = require('../util');
var Base = require('../base');
var clsPrefix;
var containerCls;
var content = "Pull Down To Refresh";
var loadingContent = "Loading...";
/**
 * A pulldown to refresh plugin for xscroll.
 * @constructor
 * @param {object} cfg
 * @param {number} cfg.height
 * @param {string} cfg.content default html for pulldown
 * @param {string} cfg.downContent html for pulldown when scrollTop is smaller than cfg.height
 * @param {string} cfg.upContent html for pulldown when scrollTop is larger than cfg.height
 * @param {string} cfg.loadingContent html for pulldown when released
 * @param {string} cfg.clsPrefix  class prefix which default value is "xs-plugin-pulldown-"
 * @extends {Base}
 */
var PullDown = function(cfg) {
	PullDown.superclass.constructor.call(this, cfg);
	this.userConfig = Util.mix({
		content: content,
		height: 60,
		autoRefresh: true,
		downContent: "Pull Down To Refresh",
		upContent: "Release To Refresh",
		loadingContent: loadingContent,
		clsPrefix: "xs-plugin-pulldown-"
	}, cfg);
}
Util.extend(PullDown, Base, {
	/**
	 * a pluginId
	 * @memberOf PullDown
	 * @type {string}
	 */
	pluginId: "pulldown",
	/**
	 * plugin initializer
	 * @memberOf PullDown
	 * @override Base
	 * @return {PullDown}
	 */
	pluginInitializer: function(xscroll) {
		var self = this;
		self.xscroll = xscroll.render();
		clsPrefix = self.userConfig.clsPrefix;
		self.render();
		return self;
	},
	/**
	 * detroy the plugin
	 * @memberOf PullDown
	 * @override Base
	 * @return {PullDown}
	 */
	pluginDestructor: function() {
		var self = this;
		Util.remove(self.pulldown);
		self.xscroll.off("panstart", self._panStartHandler, self);
		self.xscroll.off("pan", self._panHandler, self);
		self.xscroll.off("panend", self._panEndHandler, self);
		self.__isRender = false;
		self._evtBinded = false;
	},
	/**
	 * render pulldown plugin
	 * @memberOf PullDown
	 * @return {PullDown}
	 */
	render: function() {
		var self = this;
		if (self.__isRender) return;
		self.__isRender = true;
		var containerCls = clsPrefix + "container";
		var height = self.userConfig.height || 60;
		var pulldown = self.pulldown = document.createElement("div");
		pulldown.className = containerCls;
		pulldown.style.position = "absolute";
		pulldown.style.width = "100%";
		pulldown.style.height = height + "px";
		pulldown.style.lineHeight = height + "px";
		pulldown.style.top = -height + "px";
		pulldown.style.textAlign = "center";
		self.xscroll.container.appendChild(pulldown);
		self.status = 'up';
		Util.addClass(pulldown, clsPrefix + self.status);
		pulldown.innerHTML = self.userConfig[self.status + "Content"] || self.userConfig.content;
		self._bindEvt();
		return self;
	},
	_bindEvt: function() {
		var self = this;
		if (self._evtBinded) return;
		self._evtBinded = true;
		var pulldown = self.pulldown;
		var xscroll = self.xscroll;
		xscroll.on("pan", self._panHandler, self);
		xscroll.on("panstart", self._panStartHandler, self);
		xscroll.on("panend", self._panEndHandler, self);
	},
	_changeStatus: function(status) {
		var prevVal = this.status;
		this.status = status;
		Util.removeClass(this.pulldown, clsPrefix + prevVal)
		Util.addClass(this.pulldown, clsPrefix + status);
		if (this.userConfig[status + "Content"]) {
			this.pulldown.innerHTML = this.userConfig[status + "Content"];
		}
		if (prevVal != status) {
			this.trigger("statuschange", {
				prevVal: prevVal,
				newVal: status
			});
			if (status == "loading") {
				this.trigger("loading");
			}
		}
	},
	/**
	 * reset the pulldown plugin
	 * @memberOf PullDown
	 * @param {function} callback
	 * @return {PullDown}
	 */
	reset: function(callback) {
		this.xscroll.boundry.resetTop()
		this.xscroll.boundryCheckY(callback);
		this._expanded = false;
		return this;
	},
	_panStartHandler: function(e) {
		clearTimeout(this.loadingItv);
	},
	_panHandler: function(e) {
		var self = this;
		var scrollTop = self.xscroll.getScrollTop();
		if (scrollTop > 0) return;
		self._changeStatus(Math.abs(scrollTop) < self.userConfig.height ? "down" : "up");
	},
	_panEndHandler: function(e) {
		var self = this;
		var xscroll = self.xscroll;
		var height = self.userConfig.height || 60;
		var scrollTop = xscroll.getScrollTop();
		if (scrollTop < -height) {
			//prevent default bounce
			e.preventDefault();
			xscroll.boundry.resetTop();
			xscroll.boundry.expandTop(height);
			xscroll.boundryCheckY(function() {
				self._changeStatus("loading");
			});
			if (self.userConfig.autoRefresh) {
				clearTimeout(self.loadingItv);
				self.loadingItv = setTimeout(function() {
					xscroll.boundry.resetTop();
					xscroll.boundryCheckY(function() {
						window.location.reload();
					})
				}, 800);
			}
		}
	}
});

if (typeof module == 'object' && module.exports) {
	module.exports = PullDown;
}
/** ignored by jsdoc **/
else if (window.XScroll && window.XScroll.Plugins) {
	return XScroll.Plugins.PullDown = PullDown;
}
});