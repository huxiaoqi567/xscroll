define(function(require, exports, module) {

	var Util = require('./util'),
		Base = require('./base'),
		Core = require('./core'),
		Animate = require('./animate');

	var transformOrigin = Util.prefixStyle("transformOrigin");

	function OriginScroll(cfg){
		OriginScroll.superclass.constructor.call(this,cfg);
	}

	Util.extend(OriginScroll, Core, {
		_initContainer: function() {
            var self = this;
            if (self.__isContainerInited) return;
            var renderTo = self.renderTo;
            var container = self.container = self.renderTo.querySelector("."+self.containerClsName);
            var content = self.content = self.renderTo.querySelector("."+self.contentClsName);
            self.__isContainerInited = true;
            return self;
        },
		getOffsetTop: function() {
			return this.renderTo.scrollTop;
        },
        getOffsetLeft: function() {
        	return this.renderTo.scrollLeft;
        },
		scrollY:function(y, duration, easing, callback){
			var self = this;
            var y = Math.round(y);
            if (self.userConfig.lockY) return;
            var duration = duration || 0;
            var easing = easing || self.userConfig.easing;
            var config = {
               css:{
                scrollTop:y
               },
               duration:duration,
               easing:easing,
               run:function(e){
                    //trigger scroll event
                    self.trigger("scroll",{
                        offset:self.getOffset()
                    });
               },
               useTransition:false, //scrollTop 
               end:callback
            };
            self.__timers.y = self.__timers.y || new Animate(self.renderTo,config);
            //run
            self.__timers.y.stop();
            self.__timers.y.reset(config);
            self.__timers.y.run();
		},
		_bindEvt:function(){
            var self = this;
            if (self.__isEvtBind) return;
            self.__isEvtBind = true;
            var renderTo = self.renderTo;
            var container = self.container;
            var content = self.content;
            var containerWidth = self.containerWidth;
            var containerHeight = self.containerHeight;

            // self.

            // var boundry = self.boundry;
            // var mc = new Hammer.Manager(renderTo);
            renderTo.addEventListener("scroll",function(e){
                self.trigger("scroll",{
                    offset:self.getOffset()
                })
            },false)

            renderTo.addEventListener("scrollend",function(e){
               console.log("end")
            },false)



        }
	});


	if (typeof module == 'object' && module.exports) {
		module.exports = OriginScroll;
	} else {
		return window.XScroll = OriginScroll;
	}



});


