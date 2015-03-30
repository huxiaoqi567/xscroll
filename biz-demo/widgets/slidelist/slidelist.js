define(function(require, exports, module) {
	var XScroll = require('build/cmd/xscroll');
	var Base = require('build/cmd/base');
	var Util = require('build/cmd/util');
	var Infinite = require('build/cmd/plugins/infinite');
	var Snap = require('build/cmd/plugins/snap');
	function SlideList(cfg) {
		var self = this;
		if (!cfg || !cfg.renderTo) return;
		SlideList.superclass.constructor.call(this)
		self.cfg = Util.mix({
			clsItems:".slidelist-item",
			clsItemCell:".slidelist-itemcell"
		}, cfg);
		self.init();
	}

	function getEl(el) {
		if (!el) return;
		return typeof el === "string" ? document.querySelector(el) : el;
	}


	Util.extend(SlideList, Base, {
		init: function() {
			var self = this;
			var cfg = self.cfg;
			self.renderTo = getEl(cfg.renderTo);
		},
		render:function(){
			var self = this;
			self.renderWrapper();
			self.renderItems();
			self._bindEvt();
		},
		getInfiniteElsHtml:function(num,clsName,wrapper){
			var html = '';
			var tagName = tagName || 'div';
			var clsName = clsName ? clsName.replace(/\./,""): 'xs-row';
			wrapper = wrapper || '';
			for(var i = 0;i<num;i++){
				html += "<"+tagName+" class='"+clsName+"'>"+wrapper+"</"+tagName+">";
			}
			return html;
		},
		renderWrapper:function(){
			var self = this;
			var data = self.cfg.data;
			var itemWidth = self.itemWidth = self.renderTo.offsetWidth;
			var itemNum = self.itemNum = data.length;
			
			self.scroller = self.scroller || new XScroll({
				renderTo:self.renderTo,
				lockX:false,
				lockY:true,
				scrollbarX:false
			});
			var infinite = self.scroller.getPlugin("infinite") || new Infinite({transition:'none'});
			
			var tpl = "";
			self.scroller.content.innerHTML = self.getInfiniteElsHtml(5,self.cfg.clsItems,'<div class="xs-container"><div class="xs-content"></div></div>');
			self.items = self.renderTo.querySelectorAll(self.cfg.clsItems);
			infinite.userConfig = Util.mix(infinite.userConfig,{
				zoomType : "x",
				infiniteElements:self.cfg.clsItems,
				threshold:itemWidth,
				renderHook: function(el,row){
					el.querySelector(".xs-content").innerHTML = row.data.html;
				}
			});
			if(!self.scroller.getPlugin("infinite")){
				self.scroller.plug(infinite);
			}
			var snap = self.scroller.getPlugin("snap") || new Snap();
			snap.userConfig = Util.mix(snap.userConfig,{
				snapColsNum:itemNum,
				snapWidth:itemWidth
			})
			if(!self.scroller.getPlugin("snap")){
				self.scroller.plug(snap);
			}
			var wrapperData = [];
			for(var i = 0;i <itemNum;i++){
				wrapperData.push({
					data:{
						html:self.getInfiniteElsHtml(20,self.cfg.clsItemCell)
					},
					style:{
						width:itemWidth,
						height:"100%"
					}
				});
			}
			//remove all data
			infinite.sections = {};
			infinite.append(0,wrapperData);
			self.scroller.render();
		},
		xscrolls:{},
		renderItems:function(){
			var self = this;
			if(!self.pagesInfo){
				self.pagesInfo = [];
				for(var i = 0;i< self.itemNum;i++){
					self.pagesInfo.push({});
				}
			}
			for(var i = 0;i< self.items.length;i++){
				if(null === self.items[i].getAttribute("data-xscroll-index")){
					self.items[i].setAttribute("data-xscroll-index",i);
					var xscroll = new XScroll({
						renderTo:self.items[i],
						lockX:true,
						lockY:false
					});
					xscroll.plug(new Infinite({
						transition:'none',
						infiniteElements:self.cfg.clsItemCell
					}));
					self.scroller.controller.add(xscroll)
					self.xscrolls[i] = xscroll;
				}
			}	

		},
		renderItem:function(index){
			var self = this;
			index = index || 0;
			var data = self.cfg.data[index];
			var visibleEls = self.scroller.getPlugin("infinite").getVisibleElements();
			var xscrollIndex;
			for(var i in visibleEls){
				if(visibleEls[i]._left == index*self.itemWidth){
					xscrollIndex = visibleEls[i].__infiniteIndex;
				}
			}
			var xscroll = self.curScroller = self.xscrolls[xscrollIndex];
			var infinite = xscroll.getPlugin("infinite");
			xscroll.unplug(infinite);
			xscroll.plug(infinite);
			infinite.userConfig.renderHook = function(el,row){
				el.innerHTML = "sectionGroup:"+row.data.cat+" sectionId:"+row.data.num;
			}
			infinite.sections = {};
			infinite.append(0,data);
			xscroll.render();
		},
		switchTo: function(index, trigger) {
			var self = this;
			index = index || 0;
			for(var i in self.xscrolls){
				self.xscrolls[i].stop();
			}
			self.scroller.getPlugin("snap").snapTo(index);
		},
		_bindEvt:function(){
			var self = this;
			var snap = self.scroller.getPlugin("snap");
			self.scroller.on("scrollend",function(e){
				if(self.index != snap.snapColIndex){
					self.index = snap.snapColIndex;
					self.trigger("switchchange",{index:snap.snapColIndex});
					self.renderItem(self.index)
				}
			});
		}
	});

	if (typeof module == 'object' && module.exports) {
		module.exports = SlideList;
	}

});