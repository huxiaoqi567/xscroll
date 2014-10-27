define(function(require, exports, module) {

	var Util = require('./util');
	//最短滚动条高度
	var MIN_SCROLLBAR_SIZE = 60;
	//滚动条被卷去剩下的最小高度
	var BAR_MIN_SIZE = 25;
	//transform
    var transform = Util.prefixStyle("transform");

    var transformStr = Util.vendor ? ["-",Util.vendor,"-transform"].join("") : "transform";
    //transition webkitTransition MozTransition OTransition msTtransition
    var transition = Util.prefixStyle("transition");

    var borderRadius = Util.prefixStyle("borderRadius");

	var ScrollBar = function(cfg){
		this.userConfig = cfg;
    	this.init(cfg.xscroll);
	}

	Util.mix(ScrollBar.prototype,{
		init:function(xscroll){
			var self = this;
			self.xscroll = xscroll;
				self.type = self.userConfig.type;
				self.isY = self.type == "y" ? true : false;
				var boundry = self.xscroll.boundry;
				self.containerSize = self.isY ? self.xscroll.containerHeight + boundry._xtop + boundry._xbottom:self.xscroll.containerWidth + boundry._xright + boundry._xleft;
				self.indicateSize= self.isY ? self.xscroll.height:self.xscroll.width;
				self.offset = self.xscroll.getOffset();
				self.render();
				self._bindEvt();
		},
    	destroy:function(){
    		var self = this;
    		self.scrollbar && self.scrollbar.remove();
    		self.xscroll.detach("scaleanimate",self._update,self);
			self.xscroll.detach("scrollend",self._update,self);
			self.xscroll.detach("scrollanimate",self._update,self);
    		for(var i in events){
				self.xscroll.detach(events[i],self._update,self)
			}
    		delete self;
    	},
		render: function() {
			var self = this;
			if (self.__isRender) return;
			self.__isRender = true;
			var xscroll = self.xscroll;
			var css = self.isY ? "width: 3px;position:absolute;bottom:5px;top:5px;right:2px;z-index:999;overflow:hidden;-webkit-border-radius:2px;-moz-border-radius:2px;-o-border-radius:2px;" : 
								"height:3px;position:absolute;left:5px;right:5px;bottom:2px;z-index:999;overflow:hidden;-webkit-border-radius:2px;-moz-border-radius:2px;-o-border-radius:2px;";
			self.scrollbar = document.createElement("div");
			self.scrollbar.style.cssText = css;
			xscroll.renderTo.appendChild(self.scrollbar);
			var size = self.isY ? "width:100%;":"height:100%;";
			self.indicate = document.createElement("div");
			self.indicate.style.cssText = size+"position:absolute;background:rgba(0,0,0,0.3);-webkit-border-radius:2px;-moz-border-radius:2px;-o-border-radius:2px;"
			self.scrollbar.appendChild(self.indicate);
			self._update();
		},
		_update: function(offset,duration,easing) {
			var self = this;
			var offset = offset || self.xscroll.getOffset();
			var barInfo = self.computeScrollBar(offset);
			var size = self.isY ? "height":"width";
			self.indicate.style[size] = Math.round(barInfo.size) + "px";
			if(duration && easing){
				self.scrollTo(barInfo.offset,duration,easing);
			}else{
				self.moveTo(barInfo.offset);
			}
		},
		//计算边界碰撞时的弹性
		computeScrollBar: function(offset) {
			var self = this;
			var type = self.isY ? "y" : "x";
			var offset = Math.round(offset && -offset[type]);
			var spacing = 10;
			var boundry = self.xscroll.boundry;
			self.containerSize = self.isY ? self.xscroll.containerHeight + boundry._xtop + boundry._xbottom:self.xscroll.containerWidth + boundry._xright + boundry._xleft;
			//视区尺寸
			self.size = self.isY ? self.xscroll.height : self.xscroll.width;
			self.indicateSize = self.isY ? self.xscroll.height - spacing:self.xscroll.width - spacing;
			//滚动条容器高度
			var indicateSize = self.indicateSize;
			var containerSize = self.containerSize;
			//offset bottom/right
			var offsetout = self.containerSize - self.size;
			var ratio = offset / containerSize;
			var barOffset = Math.round(indicateSize * ratio);
			var barSize = Math.round(indicateSize * indicateSize / containerSize);
			var _barOffset = Math.round(barOffset * (indicateSize - MIN_SCROLLBAR_SIZE + barSize) / indicateSize);
			if (barSize < MIN_SCROLLBAR_SIZE) {
				barSize = MIN_SCROLLBAR_SIZE;
				barOffset = _barOffset;
			}
			if (barOffset < 0) {
				barOffset = Math.abs(offset) * barSize/ MIN_SCROLLBAR_SIZE > barSize - BAR_MIN_SIZE ? BAR_MIN_SIZE - barSize : offset * barSize / MIN_SCROLLBAR_SIZE;
			} else if (barOffset + barSize > indicateSize && offset - offsetout > 0) {
				var _offset = offset - containerSize + indicateSize + spacing;
				if (_offset * barSize / MIN_SCROLLBAR_SIZE > barSize - BAR_MIN_SIZE ) {
					barOffset = indicateSize + spacing - BAR_MIN_SIZE ;
				} else {
					barOffset = indicateSize + spacing - barSize + _offset * barSize / MIN_SCROLLBAR_SIZE ;
				}

			}
			self.barOffset =Math.round(barOffset);
			var result = {size: Math.round(barSize)};
			var _offset = {};
			_offset[type] = self.barOffset;
			result.offset = _offset;
			return result;
		},

		scrollTo: function(offset, duration, easing) {
			var self = this;
			self.isY ? self.indicate.style[transform] = "translateY(" + offset.y + "px) translateZ(0)" : self.indicate.style[transform] = "translateX(" + offset.x + "px)  translateZ(0)"
			self.indicate.style[transition] = ["all ",duration, "s ", easing, " 0"].join("");
		},
		moveTo: function(offset) {
			var self = this;
			self.show();
			self.isY ? self.indicate.style[transform] = "translateY(" + offset.y + "px)  translateZ(0)" : self.indicate.style[transform] = "translateX(" + offset.x + "px)  translateZ(0)"
			self.indicate.style[transition] = "";
		},
		_bindEvt: function() {
			var self = this;
			if (self.__isEvtBind) return;
			self.__isEvtBind = true;
			var type = self.isY ? "y" : "x";
			self.xscroll.on("scaleanimate",function(e){self._update(e.offset);})
			self.xscroll.on("pan",function(e){self._update(e.offset);})
			self.xscroll.on("scrollend",function(e){
				if(e.zoomType.indexOf(type) > -1){
					self._update(e.offset);
				}
			})
			self.xscroll.on("scrollanimate",function(e){
				if(e.zoomType != type) return;
				self._update(e.offset,e.duration,e.easing);
			})
		},
		reset:function(){
			var self = this;
			self.offset = {x:0,y:0};
			self._update();
		},
		hide: function() {
			var self = this;
			self.scrollbar.style.opacity= 0;
			self.scrollbar.style[transition] = "opacity 0.3s ease-out"
		},
		show: function() {
			var self = this;
			self.scrollbar.style.opacity=1;
		}
	});

	if(typeof module == 'object' && module.exports){
		module.exports = ScrollBar;
	}else{
		return ScrollBar;
	}

});