	var Util = require('./util');
	var gestures = {};
	var Gesture = {
		on:function(el,type,handler){
			el.addEventListener(type,handler);
			this.target = el;
			return this;
		},
		detach:function(el,type,handler){
			this.target = null;
			el.removeEventListener(type,handler);
			return this;
		},
		dispatchEvent: function(tgt, type, args) {
			var event = document.createEvent('Event');
			event.initEvent(type, true, true);
			Util.mix(event, args);
			tgt.dispatchEvent(event);
		},
		GESTURE_PREFIX:"xs",
		prefix:function(evt){
			return this.GESTURE_PREFIX + evt[0].toUpperCase() + evt.slice(1);
		}
	};

	if(typeof module == 'object' && module.exports){
		module.exports = Gesture;
	}else{
		return Gesture;
	}
	