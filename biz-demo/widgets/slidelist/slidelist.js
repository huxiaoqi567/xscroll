define(function(require, exports, module) {
	var XScroll = require('build/cmd/xscroll');
	var Base = require('build/cmd/base');
	var Util = require('build/cmd/util');
	var Infinite = require('build/cmd/plugins/infinite');
	var Snap = require('build/cmd/plugins/snap');
	var LazyLoad = require('build/cmd/plugins/lazyload');

	function SlideList(userConfig) {
		var self = this;
		if (!userConfig || !userConfig.renderTo) return;
		SlideList.superclass.constructor.call(this)
		self.userConfig = Util.mix({
			preload:true,
			clsItems: ".slidelist-item",
			clsItemCell: ".slidelist-itemcell",
			useOriginScroll:false
		}, userConfig);
		self.init();
	}

	function getEl(el) {
		if (!el) return;
		return typeof el === "string" ? document.querySelector(el) : el;
	}


	Util.extend(SlideList, Base, {
		pages: [],
		init: function() {
			var self = this;
			var userConfig = self.userConfig;
			self.renderTo = getEl(userConfig.renderTo);
		},
		render: function() {
			var self = this;
			self.renderWrapper();
			self.initItems();
			self._bindEvt();
		},
		getInfiniteElsHtml: function(num, clsName, wrapper) {
			var html = '';
			var tagName = tagName || 'div';
			var clsName = clsName ? clsName.replace(/\./, "") : 'xs-row';
			wrapper = wrapper || '';
			for (var i = 0; i < num; i++) {
				html += "<" + tagName + " class='" + clsName + "'>" + wrapper + "</" + tagName + ">";
			}
			return html;
		},
		renderWrapper: function() {
			var self = this;
			var data = self.userConfig.data;
			var itemWidth = self.itemWidth = self.renderTo.offsetWidth;
			var itemNum = self.itemNum = data.length;

			self.scroller = self.scroller || new XScroll({
				renderTo: self.renderTo,
				lockX: false,
				lockY: true,
				scrollbarX: false,
				preventDefault: false
			});
			var infinite = self.scroller.getPlugin("infinite") || new Infinite({
				transition: 'none'
			});

			var tpl = "";
			self.scroller.content.innerHTML = self.getInfiniteElsHtml(10, self.userConfig.clsItems, '<div class="xs-container"><div class="xs-content"></div></div>');
			self.items = self.renderTo.querySelectorAll(self.userConfig.clsItems);
			infinite.userConfig = Util.mix(infinite.userConfig, {
				zoomType: "x",
				infiniteElements: self.userConfig.clsItems,
				threshold: itemWidth * 2,
				renderHook: function(el, row) {
					el.querySelector(".xs-content").innerHTML = row.data.html;
				}
			});
			if (!self.scroller.getPlugin("infinite")) {
				self.scroller.plug(infinite);
			}
			var snap = self.scroller.getPlugin("snap") || new Snap();
			snap.userConfig = Util.mix(snap.userConfig, {
				snapColsNum: itemNum,
				snapWidth: itemWidth
			})
			if (!self.scroller.getPlugin("snap")) {
				self.scroller.plug(snap);
			}
			var wrapperData = [];
			for (var i = 0; i < itemNum; i++) {
				wrapperData.push({
					data: {
						html: self.getInfiniteElsHtml(20, self.userConfig.clsItemCell)
					},
					style: {
						width: itemWidth,
						height: "100%"
					}
				});
			}
			//remove all data
			infinite.sections = {};
			infinite.append(0, wrapperData);
			self.scroller.render();
			//set default threshold
			self.scroller.mc.get("pan").set({
				threshold: 50
			});
		},
		xscrolls: {},
		initItems: function() {
			var self = this;
			self.pages = [];
			for (var i = 0; i < self.itemNum; i++) {
				//page info
				self.pages.push({
					isRender:false,
					scrollTop:0,
					infinite: new Infinite({
						transition: 'none',
						infiniteElements: self.userConfig.clsItemCell
					}),
					lazyload: new LazyLoad()
				});
			}

			for (var i = 0; i < self.items.length; i++) {
				if (null === self.items[i].getAttribute("data-xscroll-index")) {
					self.items[i].setAttribute("data-xscroll-index", i);
					var xscroll = new XScroll({
						renderTo: self.items[i],
						useOriginScroll:self.userConfig.useOriginScroll,
						lockX: true,
						lockY: false
					});
					self.scroller.controller.add(xscroll)
					self.xscrolls[i] = xscroll;
				}
			}

		},
		renderItem: function(index) {
			var self = this;
			index = index || 0;
			if(!self.pages[index] || self.pages[index].isRender) return;
			var data = self.userConfig.data[index];
			var visibleEls = self.scroller.getPlugin("infinite").getVisibleElements();
			var xscrollIndex;
			for (var i in visibleEls) {
				if (visibleEls[i]._left == index * self.itemWidth) {
					xscrollIndex = visibleEls[i].__infiniteIndex;
				}
			}
			var xscroll = self.curScroller = self.xscrolls[xscrollIndex];
			var curpage = self.pages[index];
			var lazyload = curpage.lazyload;
			var infinite = curpage.infinite;
			xscroll.unplug(infinite);
			xscroll.plug(infinite);
			xscroll.unplug(lazyload);
			xscroll.plug(lazyload);
			infinite.userConfig.renderHook = self.userConfig.renderHook || function(el, row) {
				el.innerHTML = 'NULL';
			}
			//remove all data
			infinite.sections = {};
			infinite.append(0, data);
			xscroll.render();
			xscroll.mc.set({
				"touchAction": "pan-y"
			});
			xscroll.off("scroll",self._scrollHandler,self);
			xscroll.on("scroll",self._scrollHandler,self);
			xscroll.scrollTop(curpage.scrollTop);
			curpage.scrollTop = xscroll.getScrollTop();
			//set render status
			curpage.isRender = true;
			xscroll.render();
		},
		destroyItem:function(index){
			var self = this;
			// var visibleEls = self.scroller.getPlugin("infinite").getVisibleElements();
			self.pages[index].isRender = false;

		},
		switchTo: function(index, trigger) {
			var self = this;
			index = index || 0;
			for (var i in self.xscrolls) {
				self.xscrolls[i].stop && self.xscrolls[i].stop();
			}
			self.scroller.getPlugin("snap").snapTo(index);
		},
		renderItems:function(index){
			var self = this;
			var renderedIndexes = {};
			if(self.pages[index]){
				renderedIndexes[index] = true;
			}

			if(self.userConfig.preload){
				if(self.pages[index - 1]){
					renderedIndexes[index - 1] = true;
				}
				if(self.pages[index + 1]){
					renderedIndexes[index + 1] = true;
				}
			}

			for(var i in self.pages){
				if(!(i in renderedIndexes)){
					//destroy page
					self.destroyItem(i);
				}
			}

			for(var i in renderedIndexes){
				self.renderItem(i);
			}
		},	
		_bindEvt: function() {
			var self = this;
			var snap = self.scroller.getPlugin("snap");
			self.scroller.on("scrollend", function(e) {
				if (self.curIndex != snap.snapColIndex) {
					self.curIndex = Number(snap.snapColIndex);
					self.trigger("switchchange", {
						index: self.curIndex
					});
					self.renderItems(self.curIndex);
				}
			});
		},
		_scrollHandler:function(e){
			var self = this;
			//record scrollTop
			self.pages[self.curIndex].scrollTop = e.scrollTop;
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = SlideList;
	}

});