"use strict";
//easing
var Easing = {
	"linear": [0, 0, 1, 1],
	"ease": [.25, .1, .25, 1],
	"ease-in":[.42,0,1,1],
	"ease-out": [0, 0, .58, 1],
	"ease-in-out": [.42, 0, .58, 1],
	"quadratic": [0.33, 0.66, 0.66, 1],
	"circular": [0.1, 0.57, 0.1, 1],
	"bounce": [.71, 1.35, .47, 1.41],
	format: function(easing) {
		if (!easing) return;
		if (typeof easing === "string" && this[easing]) {
			return this[easing] instanceof Array ? [" cubic-bezier(", this[easing], ") "].join("") : this[easing];
		}
		if (easing instanceof Array) {
			return [" cubic-bezier(", easing, ") "].join("");
		}
		return easing;
	}
}
if (typeof module == 'object' && module.exports) {
	module.exports = Easing;
}
