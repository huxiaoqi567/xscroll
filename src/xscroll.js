'use strict';

var Util = require('./util'),
  Base = require('./base'),
  Timer = require('./timer'),
  Animate = require('./animate'),
  Hammer = require('hammerjs'),
  SimuScroll = require('./simulate-scroll'),
  OriginScroll = require('./origin-scroll');
var XScroll = function(cfg) {
  var _ = cfg && cfg.useOriginScroll ? OriginScroll : SimuScroll;
  return new _(cfg);
};
/**
 * Util
 * @namespace Util
 * @type {Object}
 */
XScroll.Util = Util;
/**
 * Base
 * @namespace Base
 * @type {Base}
 */
XScroll.Base = Base;
/**
 * Timer
 * @namespace Timer
 * @type {Timer}
 */
XScroll.Timer = Timer;
/**
 * Animate
 * @namespace Animate
 * @type {Animate}
 */
XScroll.Animate = Animate;
/**
 * Hammer
 * @namespace Hammer
 * @type {Hammer}
 */
XScroll.Hammer = Hammer;
/**
 * plugins
 * @namespace Plugins
 * @type {Object}
 */
XScroll.Plugins = {};

module.exports = XScroll;
