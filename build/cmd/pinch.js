define(function(require, exports, module) {
	var Util = require('./util');
	var Event = require("./event");
	var doc = window.document;
	var PINCH_START = Event.prefix('pinchStart'),
		PINCH_END = Event.prefix('pinchEnd'),
		PINCH = Event.prefix('pinch');

	function getDistance(p1, p2) {
		var deltaX = p1.pageX - p2.pageX,
			deltaY = p1.pageY - p2.pageY;
		return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
	}

	function getOrigin(p1,p2){
		return {pageX:p1.pageX/2 + p2.pageX/2,pageY:p1.pageY/2 + p2.pageY/2};
	}

	function pinchMoveHandler(e) {
		if (e.touches.length < 2 || e.changedTouches.length < 1) {
			return;
		}
		e.preventDefault();
		var distance = getDistance(e.touches[0], e.touches[1]);
		var origin = getOrigin(e.touches[0], e.touches[1]);
		e.origin = origin;
		//pinchstart
		if(!this.isStart){
			this.isStart = 1;
			this.startDistance = distance;
			this.gestureType = "pinch";
			Event.dispatchEvent(e.target,PINCH_START,e);
		}else{
			if(this.gestureType != "pinch") return;
			//pinchmove
			e.distance = distance;
			e.scale = distance/this.startDistance;
			e.origin = origin;
			Event.dispatchEvent(e.target,PINCH,e);
		}
	}

	function pinchEndHandler(e) {
		this.isStart = 0;
		if(this.gestureType != "pinch") return;
		if(e.touches.length == 0){
			Event.dispatchEvent(e.target,PINCH_END,e);
			this.gestureType = "";
		}
	}



	
	//枚举
	var Pinch = {
		init:function(){
			document.addEventListener("touchmove",pinchMoveHandler);
			document.addEventListener("touchend",pinchEndHandler);	
		},
		PINCH_START: PINCH_START,
		PINCH: PINCH,
		PINCH_END: PINCH_END
	};

	if(typeof module == 'object' && module.exports){
		module.exports = Pinch;
	}else{
		return Pinch;
	}});