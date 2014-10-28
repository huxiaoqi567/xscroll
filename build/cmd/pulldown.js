define(function(require, exports, module) {
	var Util = require('./util');
	var Base = require('./base');
	var prefix;
	var containerCls;
	var content = "Pull Down To Refresh";
	var loadingContent = "Loading...";
	var PullDown = function(cfg) {
		PullDown.superclass.constructor.call(this);
		this.userConfig = Util.mix({
			content: content,
			height: 60,
			autoRefresh: true, //是否自动刷新页面
			downContent: "Pull Down To Refresh",
			upContent: "Release To Refresh",
			loadingContent: loadingContent,
			prefix: "xs-plugin-pulldown-"
		}, cfg);
	}
	Util.extend(PullDown,Base, {
		pluginId: "xscroll/plugin/pulldown",
		pluginInitializer: function(xscroll) {
			var self = this;
			self.xscroll = xscroll;
			prefix = self.userConfig.prefix;
			if (self.xscroll) {
				self.xscroll.on("afterrender", function() {
					self.render()
				})
			}
		},
		pluginDestructor: function() {
			var self = this;
			self.pulldown && self.pulldown.remove();
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
		_changeStatus: function(status) {
			var prevVal = this.status;
			this.status = status;
			Util.removeClass(this.pulldown, prefix + prevVal)
			Util.addClass(this.pulldown, prefix + status);
			this.setContent(this.userConfig[status + "Content"]);
			if(prevVal != status){
				this.fire("statuschange",{
					prevVal:prevVal,
					newVal:status
				});
				if(status == "loading"){
					this.fire("loading");
				}
			}
		},
        reset:function(callback){
        	this.xscroll.boundry.resetTop()
			this.xscroll.bounce(true, callback);
			this._expanded = false;
        },
		_panStartHandler: function(e) {
			clearTimeout(this.loadingItv);
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
				xscroll.bounce(true,function(){
					self._changeStatus("loading");
				});
				if(self.userConfig.autoRefresh){
					clearTimeout(self.loadingItv);
					self.loadingItv = setTimeout(function() {
						xscroll.boundry.expandTop(-height);
						xscroll.bounce(true, function() {
							window.location.reload();
						})
					}, 800);
				}
			}
		},
		setContent: function(content) {
			var self = this;
			if (content) {
				self.pulldown.innerHTML = content;
			}
		}
	});

	if(typeof module == 'object' && module.exports){
		module.exports = PullDown;
	}else{
		return PullDown;
	}
	
});