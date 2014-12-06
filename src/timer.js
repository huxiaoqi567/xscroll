var Util = require('./util');
var Base = require('./base');
var Easing = require('./easing');
var Bezier = require('./bezier');

var RAF = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback) {
		window.setTimeout(callback, 1000 / 60);
	};

var vendors = ['webkit', 'moz', 'ms', 'o'];
var cancelRAF = window.cancelAnimationFrame;
for (var i = 0; i < vendors.length; i++) {
	if (window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame']) {
		cancelRAF = window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
	}
}
cancelRAF = cancelRAF || window.clearTimeout;

function Timer(cfg) {
	var self = this;
	self.cfg = Util.mix({
		easing:"linear"
	},cfg)

}

Util.extend(Timer, Base, {
	reset:function(cfg){
		var self = this;
		Util.mix(self.cfg,cfg);
		self.isfinished = false;
		self.percent = 0;
		delete self._stop;
	},
	run: function() {
		var self = this;
		var duration = self.cfg.duration;
		if (duration <= 0 || self.isfinished) return;
		self._hasFinishedPercent = self._stop && self._stop.percent || 0;
		delete self._stop;
		self.start = Date.now();
		self.percent = 0;
		// epsilon determines the precision of the solved values
		var epsilon = (1000 / 60 / duration) / 4;
		var b = Easing[self.cfg.easing];
		self.easingFn = Bezier(b[0], b[1], b[2], b[3], epsilon);

		self._run();
	},
	_run: function() {
		var self = this;
		cancelRAF(self._raf);
		self._raf = RAF(function() {
			self.now = Date.now();
			self.duration = self.now - self.start;
			// self.progress = easingFn(self.duration / self.cfg.duration,Easing[self.cfg.easing]);
			self.progress = self.easingFn(self.duration / self.cfg.duration);
			self.percent = self.duration / self.cfg.duration+ self._hasFinishedPercent;
			if (self.percent >= 1 || self._stop) {
				self.percent = self._stop && self._stop.percent ? self._stop.percent : 1;
				self.duration = self._stop && self._stop.duration ? self._stop.duration : self.duration;
				var param = {
					percent: self.percent,
					duration: self.duration
				};
				self.fire("run",param);
				self.fire("stop",param);
				if(self.percent >= 1){
					self.isfinished = true;
					//end
					self.fire("end", {
						percent: 1,
						duration: self.duration
					});
				}
				return;
			}
			self.fire("run", {
				percent: self.progress,
				duration: self.duration
			})
			self._run();
		})
	},
	stop: function() {
		var self = this;
		self._stop = {
			percent: self.percent,
			duration: self.duration,
			now: self.now
		};
		cancelRAF(self._raf)
	}
});


if (typeof module == 'object' && module.exports) {
	module.exports = Timer;
} else {
	return Timer;
}