define(function(require, exports, module) {
	var Util = require('util');
	var prefix;
	var containerCls;
	var content = "Pull Down To Refresh";
	var loadingContent = "Loading...";
	var PullDown = function(cfg) {
		this.init(cfg);
	}
	Util.mix(PullDown.prototype, {
		init: function(cfg) {
			var self = this;
			self.userConfig = Util.mix({
				onRefresh: function() {
					window.location.reload();
				},
				content: content,
				height: 60,
				autoRefresh: true, //是否自动刷新页面
				downContent: "Pull Down To Refresh",
				upContent: "Release To Refresh",
				loadingContent: loadingContent,
				prefix: "xs-plugin-pulldown-"
			}, cfg);

			self.xscroll = self.userConfig.xscroll;

			prefix = self.userConfig.prefix;

			if (self.xscroll) {
				self.xscroll.on("afterrender", function() {
					self.render()
				})
			}
		},
		destroy: function() {
			var self = this;
			//remove element
			self.pulldown && self.pulldown.remove();
			// self.detach("afterStatusChange");
			self.xscroll.detach("panstart", self._panStartHandler, self);
			self.xscroll.detach("pan", self._panHandler, self);
			self.xscroll.detach("panend", self._panEndHandler, self);
			delete self;
		},
		render: function() {
			var self = this;
			if (self.__isRender) return;
			self.__isRender = true;
			var containerCls = prefix + "container";
			var height = self.userConfig.height || 60;
			var pulldown = self.pulldown = document.createElement("div");
			pulldown.className = containerCls;
			pulldown.style.position = "absolute";
			pulldown.style.width = "100%";
			pulldown.style.height = height + "px";
			pulldown.style.top = -height + "px";
			self.xscroll.container.appendChild(pulldown);
			Util.addClass(pulldown, prefix + self.status);
			pulldown.innerHTML = self.userConfig[self.status + "Content"] || self.userConfig.content;
			self._bindEvt();
		},
		_bindEvt: function() {
			var self = this;
			if (self._evtBinded) return;
			self._evtBinded = true;
			var pulldown = self.pulldown;
			var xscroll = self.xscroll;
			xscroll.on("pan", function(e) {
				self._panHandler(e);
			})

			xscroll.on("panstart", function(e) {
				self._panStartHandler(e);
			})
			xscroll.on("panend", function(e) {
				self._panEndHandler(e)
			})

		},
		_panStartHandler: function(e) {
			clearTimeout(this.loadingItv);
		},
		_changeStatus: function(status) {
			var prevVal = this.status;
			this.status = status;
			Util.removeClass(this.pulldown, prefix + prevVal)
			Util.addClass(this.pulldown, prefix + status);
			this.setContent(this.userConfig[status + "Content"]);
		},
		_panHandler: function(e) {
			var self = this;
			var offsetTop = e.offset.y;
			var height = self.userConfig.height || 60;
			if (offsetTop < 0) return;
			self._changeStatus(Math.abs(offsetTop) < height ? "down" : "up");
		},
		_panEndHandler: function(e) {
			var self = this;
			var xscroll = self.xscroll;
			var top = xscroll.boundry.top;
			var height = self.userConfig.height || 60;
			var offsetTop = xscroll.getOffsetTop();
			if (offsetTop > height) {
				xscroll.boundry.top = top;
				!self._expanded && xscroll.boundry.expandTop(height);
				self._expanded = true;
				xscroll.bounce(true);
				self._changeStatus("loading");
				clearTimeout(self.loadingItv);
				self.loadingItv = setTimeout(function() {
					xscroll.boundry.expandTop(-height);
					xscroll.bounce(true, function() {
						self.userConfig.onRefresh && self.userConfig.onRefresh();
					})
				}, 800);
			}
		},
		setContent: function(content) {
			var self = this;
			if (content) {
				self.pulldown.innerHTML = content;
			}
		}
	})

	return PullDown;

});