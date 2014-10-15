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
			self.__events = {};
			self.userConfig = Util.mix({
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
		fire: function(evt) {
            var self = this;
            if (self.__events[evt] && self.__events[evt].length) {
                for (var i in self.__events[evt]) {
                    self.__events[evt][i].apply(this,[].slice.call(arguments, 1));
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
        },
        reset:function(callback){
        	var self = this;
        	var height = self.userConfig.height || 60;
        	var xscroll = self.xscroll;
        	xscroll.boundry.resetTop()
			xscroll.bounce(true, callback);
			self._expanded = false;
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
				}else{

				}
				
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