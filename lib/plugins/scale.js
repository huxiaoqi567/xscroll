(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 21);
/******/ })
/************************************************************************/
/******/ ({

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var SUBSTITUTE_REG = /\\?\{([^{}]+)\}/g,
    EMPTY = '';

var RE_TRIM = /^[\s\xa0]+|[\s\xa0]+$/g,
    trim = String.prototype.trim;

var _trim = trim ? function (str) {
  return str == null ? EMPTY : trim.call(str);
} : function (str) {
  return str == null ? EMPTY : (str + '').replace(RE_TRIM, EMPTY);
};

function upperCase() {
  return arguments[1].toUpperCase();
}

function Empty() {}

function createObject(proto, constructor) {
  var newProto;
  if (Object.create) {
    newProto = Object.create(proto);
  } else {
    Empty.prototype = proto;
    newProto = new Empty();
  }
  newProto.constructor = constructor;
  return newProto;
}

function getNodes(node, rootNode) {
  if (!node) return;
  if (node.nodeType) return [node];
  var rootNode = rootNode && rootNode.nodeType ? rootNode : document;
  if (node && typeof node === 'string') {
    return rootNode.querySelectorAll(node);
  }
  return;
}

// Useful for temporary DOM ids.
var idCounter = 0;

var getOffsetTop = function getOffsetTop(el) {
  var offset = el.offsetTop;
  if (el.offsetParent != null) offset += getOffsetTop(el.offsetParent);
  return offset;
};
var getOffsetLeft = function getOffsetLeft(el) {
  var offset = el.offsetLeft;
  if (el.offsetParent != null) offset += getOffsetLeft(el.offsetParent);
  return offset;
};

var Util = {
  // Is a given variable an object?
  isObject: function isObject(obj) {
    return obj === Object(obj);
  },
  isArray: Array.isArray || function (obj) {
    return toString.call(obj) == '[object Array]';
  },
  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  isEmpty: function isEmpty(obj) {
    if (obj == null) return true;
    if (this.isArray(obj) || this.isString(obj)) return obj.length === 0;
    for (var key in obj) {
      if (this.has(obj, key)) return false;
    }return true;
  },
  mix: function mix(to, from, deep) {
    for (var i in from) {
      to[i] = from[i];
    }
    return to;
  },
  extend: function extend(r, s, px, sx) {
    if (!s || !r) {
      return r;
    }
    var sp = s.prototype,
        rp;
    // add prototype chain
    rp = createObject(sp, r);
    r.prototype = this.mix(rp, r.prototype);
    r.superclass = createObject(sp, s);
    // add prototype overrides
    if (px) {
      this.mix(rp, px);
    }
    // add object overrides
    if (sx) {
      this.mix(r, sx);
    }
    return r;
  },
  /**
   * test whether a string start with a specified substring
   * @param {String} str the whole string
   * @param {String} prefix a specified substring
   * @return {Boolean} whether str start with prefix
   * @member util
   */
  startsWith: function startsWith(str, prefix) {
    return str.lastIndexOf(prefix, 0) === 0;
  },

  /**
   * test whether a string end with a specified substring
   * @param {String} str the whole string
   * @param {String} suffix a specified substring
   * @return {Boolean} whether str end with suffix
   * @member util
   */
  endsWith: function endsWith(str, suffix) {
    var ind = str.length - suffix.length;
    return ind >= 0 && str.indexOf(suffix, ind) === ind;
  },
  /**
   * Removes the whitespace from the beginning and end of a string.
   * @method
   * @member util
   */
  trim: _trim,
  /**
   * Substitutes keywords in a string using an object/array.
   * Removes undef keywords and ignores escaped keywords.
   * @param {String} str template string
   * @param {Object} o json data
   * @member util
   * @param {RegExp} [regexp] to match a piece of template string
   */
  substitute: function substitute(str, o, regexp) {
    if (typeof str !== 'string' || !o) {
      return str;
    }

    return str.replace(regexp || SUBSTITUTE_REG, function (match, name) {
      if (match.charAt(0) === '\\') {
        return match.slice(1);
      }
      return o[name] === undefined ? EMPTY : o[name];
    });
  },
  /**
   * vendors
   * @return { String } webkit|moz|ms|o
   * @memberOf Util
   */
  vendor: function () {
    var el = document.createElement('div').style;
    var vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'],
        transform,
        i = 0,
        l = vendors.length;
    for (; i < l; i++) {
      transform = vendors[i] + 'ransform';
      if (transform in el) return vendors[i].substr(0, vendors[i].length - 1);
    }
    return false;
  }(),
  /**
   *  add vendor to attribute
   *  @memberOf Util
   *  @param {String} attrName name of attribute
   *  @return { String }
   **/
  prefixStyle: function prefixStyle(attrName) {
    if (this.vendor === false) return false;
    if (this.vendor === '') return attrName;
    return this.vendor + attrName.charAt(0).toUpperCase() + attrName.substr(1);
  },
  /**
   * judge if has class
   * @memberOf Util
   * @param  {HTMLElement}  el
   * @param  {String}  className
   * @return {Boolean}
   */
  hasClass: function hasClass(el, className) {
    return el && el.className && className && el.className.indexOf(className) != -1;
  },
  /**
   * add className for the element
   * @memberOf Util
   * @param  {HTMLElement}  el
   * @param  {String}  className
   */
  addClass: function addClass(el, className) {
    if (el && className && !this.hasClass(el, className)) {
      el.className += ' ' + className;
    }
  },
  /**
   * remove className for the element
   * @memberOf Util
   * @param  {HTMLElement}  el
   * @param  {String}  className
   */
  removeClass: function removeClass(el, className) {
    if (el && el.className && className) {
      el.className = el.className.replace(className, '');
    }
  },
  /**
   * remove an element
   * @memberOf Util
   * @param  {HTMLElement}  el
   */
  remove: function remove(el) {
    if (!el || !el.parentNode) return;
    el.parentNode.removeChild(el);
  },
  /**
   * get offset top
   * @memberOf Util
   * @param  {HTMLElement}   el
   * @return {Number} offsetTop
   */
  getOffsetTop: getOffsetTop,
  /**
   * get offset left
   * @memberOf Util
   * @param  {HTMLElement}  el
   * @return {Number} offsetLeft
   */
  getOffsetLeft: getOffsetLeft,
  /**
   * get offset left
   * @memberOf Util
   * @param  {HTMLElement} el
   * @param  {String} selector
   * @param  {HTMLElement} rootNode
   * @return {HTMLElement} parent element
   */
  findParentEl: function findParentEl(el, selector, rootNode) {
    var rs = null,
        parent = null;
    var type = /^#/.test(selector) ? 'id' : /^\./.test(selector) ? 'class' : 'tag';
    var sel = selector.replace(/\.|#/g, '');
    if (rootNode && typeof rootNode === 'string') {
      rootNode = document.querySelector(rootNode);
    }
    rootNode = rootNode || document.body;
    if (!el || !selector) return;
    if (type == 'class' && el.className && el.className.match(sel)) {
      return el;
    } else if (type == 'id' && el.id && _trim(el.id) == sel) {
      return el;
    } else if (type == 'tag' && el.tagName.toLowerCase() == sel) {
      return el;
    }
    while (!rs) {
      if (parent == rootNode) break;
      parent = el.parentNode;
      if (!parent) break;
      if (type == 'class' && parent.className && parent.className.match(sel) || type == 'id' && parent.id && _trim(parent.id) == sel || type == 'tag' && parent.tagName && parent.tagName.toLowerCase() == sel) {
        rs = parent;
        return rs;
        break;
      } else {
        el = parent;
      }
    }
    return null;
  },
  /**
   * Generate a unique integer id (unique within the entire client session).
   * @param  {String} prefix
   * @return {String} guid
   */
  guid: function guid(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  },
  /**
   * judge if is an android os
   * @return {Boolean} [description]
   */
  isAndroid: function isAndroid() {
    return (/Android /.test(window.navigator.appVersion)
    );
  },
  /**
   * judge if is an android device with low  performance
   * @return {Boolean}
   */
  isBadAndroid: function isBadAndroid() {
    return (/Android /.test(window.navigator.appVersion) && !/Chrome\/\d/.test(window.navigator.appVersion)
    );
  },
  px2Num: function px2Num(px) {
    return Number(px.replace(/px/, ''));
  },
  getNodes: getNodes,
  getNode: function getNode(node, rootNode) {
    var nodes = getNodes(node, rootNode);
    return nodes && nodes[0];
  },
  stringifyStyle: function stringifyStyle(style) {
    var styleStr = '';
    for (var i in style) {
      styleStr += [i, ':', style[i], ';'].join('');
    }
    return styleStr;
  }
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
var names = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'];
for (var i = 0; i < names.length; i++) {
  Util['is' + names[i]] = function (obj) {
    return toString.call(obj) == '[object ' + names[i] + ']';
  };
}

module.exports = Util;

/***/ }),

/***/ 1:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Util = __webpack_require__(0);
var Events = __webpack_require__(2);
/**
      @constructor
      @mixes Events
      */
var Base = function Base() {};

Util.mix(Base.prototype, Events);

Util.mix(Base.prototype, {
  /**
   * @memberof Base
   * @param  {object} plugin plug a plugin
   */
  plug: function plug(plugin) {
    var self = this;
    if (!plugin || !plugin.pluginId) return;
    if (!self.__plugins) {
      self.__plugins = [];
    }
    var __plugin = self.getPlugin(plugin.pluginId);
    __plugin && self.unplug(plugin.pluginId);
    plugin.pluginInitializer(self);
    self.__plugins.push(plugin);
    return self;
  },
  /**
   * @memberof Base
   * @param  {object|string} plugin unplug a plugin by pluginId or plugin instance
   */
  unplug: function unplug(plugin) {
    var self = this;
    if (!plugin || !self.__plugins) return;
    var _plugin = typeof plugin == 'string' ? self.getPlugin(plugin) : plugin;
    _plugin.pluginDestructor(self);
    for (var i = 0, l = self.__plugins.length; i < l; i++) {
      if (self.__plugins[i] == _plugin) {
        return self.__plugins.splice(i, 1);
      }
    }
  },
  /**
   * @memberof Base
   * @param  {object|string} plugin get plugin by pluginId
   */
  getPlugin: function getPlugin(pluginId) {
    var self = this;
    var plugins = [];
    if (!self.__plugins) return;
    for (var i = 0, l = self.__plugins.length; i < l; i++) {
      if (self.__plugins[i] && self.__plugins[i].pluginId == pluginId) {
        plugins.push(self.__plugins[i]);
      }
    }
    return plugins.length > 1 ? plugins : plugins[0] || null;
  }
});

module.exports = Base;

/***/ }),

/***/ 2:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var Util = __webpack_require__(0);
// Returns a function that will be executed at most one time, no matter how
// often you call it. Useful for lazy initialization.
var _once = function _once(func) {
  var ran = false,
      memo;
  return function () {
    if (ran) return memo;
    ran = true;
    memo = func.apply(this, arguments);
    func = null;
    return memo;
  };
};

/**
 * @discription events
 * @mixin
 */
var Events = {
  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  on: function on(name, callback, context) {
    if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
    this._events || (this._events = {});
    var events = this._events[name] || (this._events[name] = []);
    events.push({
      callback: callback,
      context: context,
      ctx: context || this
    });
    return this;
  },

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, it will be removed.
  once: function once(name, callback, context) {
    if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
    var self = this;
    var once = _once(function () {
      self.off(name, once);
      callback.apply(this, arguments);
    });
    once._callback = callback;
    return this.on(name, once, context);
  },

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  off: function off(name, callback, context) {
    if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;

    // Remove all callbacks for all events.
    if (!name && !callback && !context) {
      this._events = void 0;
      return this;
    }

    var names = name ? [name] : Object.keys(this._events);
    for (var i = 0, length = names.length; i < length; i++) {
      name = names[i];

      // Bail out if there are no events stored.
      var events = this._events[name];
      if (!events) continue;

      // Remove all callbacks for this event.
      if (!callback && !context) {
        delete this._events[name];
        continue;
      }

      // Find any remaining events.
      var remaining = [];
      for (var j = 0, k = events.length; j < k; j++) {
        var event = events[j];
        if (callback && callback !== event.callback && callback !== event.callback._callback || context && context !== event.context) {
          remaining.push(event);
        }
      }

      // Replace events if there are any remaining.  Otherwise, clean up.
      if (remaining.length) {
        this._events[name] = remaining;
      } else {
        delete this._events[name];
      }
    }

    return this;
  },

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  trigger: function trigger(name) {
    if (!this._events) return this;
    var args = Array.prototype.slice.call(arguments, 1);
    if (!eventsApi(this, 'trigger', name, args)) return this;
    var events = this._events[name];
    var allEvents = this._events.all;
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, arguments);
    return this;
  },

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  listenTo: function listenTo(obj, name, callback) {
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var id = obj._listenId || (obj._listenId = Util.guid('l'));
    listeningTo[id] = obj;
    if (!callback && (typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') callback = this;
    obj.on(name, callback, this);
    return this;
  },

  listenToOnce: function listenToOnce(obj, name, callback) {
    if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
      for (var event in name) {
        this.listenToOnce(obj, event, name[event]);
      }return this;
    }
    var cb = _once(function () {
      this.stopListening(obj, name, cb);
      callback.apply(this, arguments);
    });
    cb._callback = callback;
    return this.listenTo(obj, name, cb);
  },

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  stopListening: function stopListening(obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) return this;
    var remove = !name && !callback;
    if (!callback && (typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') callback = this;
    if (obj) (listeningTo = {})[obj._listenId] = obj;
    for (var id in listeningTo) {
      obj = listeningTo[id];
      obj.off(name, callback, this);
      if (remove || Util.isEmpty(obj._events)) delete this._listeningTo[id];
    }
    return this;
  }

};

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
var eventsApi = function eventsApi(obj, action, name, rest) {
  if (!name) return true;

  // Handle event maps.
  if ((typeof name === 'undefined' ? 'undefined' : _typeof(name)) === 'object') {
    for (var key in name) {
      obj[action].apply(obj, [key, name[key]].concat(rest));
    }
    return false;
  }

  // Handle space separated event names.
  if (eventSplitter.test(name)) {
    var names = name.split(eventSplitter);
    for (var i = 0, length = names.length; i < length; i++) {
      obj[action].apply(obj, [names[i]].concat(rest));
    }
    return false;
  }

  return true;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
var triggerEvents = function triggerEvents(events, args) {
  var ev,
      i = -1,
      l = events.length,
      a1 = args[0],
      a2 = args[1],
      a3 = args[2];
  switch (args.length) {
    case 0:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx);
      }return;
    case 1:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1);
      }return;
    case 2:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2);
      }return;
    case 3:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
      }return;
    default:
      while (++i < l) {
        (ev = events[i]).callback.apply(ev.ctx, args);
      }return;
  }
};

// Aliases for backwards compatibility.
Events.bind = Events.on;
Events.unbind = Events.off;

module.exports = Events;

/***/ }),

/***/ 21:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Util = __webpack_require__(0),
    Base = __webpack_require__(1);
// reduced scale rate
var SCALE_RATE = 0.7;
var SCALE_TO_DURATION = 300;
/**
 * A scalable plugin for xscroll.
 * @constructor
 * @param {object} cfg
 * @param {number} cfg.minScale min value for scale
 * @param {number} cfg.maxScale max value for scale
 * @param {number} cfg.duration duration for scale animation
 * @extends {Base}
 */
var Scale = function Scale(cfg) {
  Scale.superclass.constructor.call(this, cfg);
  this.userConfig = Util.mix({
    minScale: 1,
    maxScale: 2,
    duration: SCALE_TO_DURATION
  }, cfg);
};

Util.extend(Scale, Base, {
  /**
   * a pluginId
   * @memberOf Scale
   * @type {string}
   */
  pluginId: 'scale',
  /**
   * plugin initializer
   * @memberOf Scale
   * @override Scale
   * @return {Infinite}
   */
  pluginInitializer: function pluginInitializer(xscroll) {
    var self = this;
    self.scale = 1;
    self.xscroll = xscroll.render();
    self.initialContainerWidth = xscroll.containerWidth;
    self.initialContainerHeight = xscroll.containerHeight;
    self.minScale = self.userConfig.minScale || Math.max(xscroll.width / xscroll.containerWidth, xscroll.height / xscroll.containerHeight);
    self.maxScale = self.userConfig.maxScale || 1;
    self._bindEvt();
    return self;
  },
  /**
   * detroy the plugin
   * @memberOf Scale
   * @override Base
   * @return {Scale}
   */
  pluginDestructor: function pluginDestructor() {
    var self = this;
    var xscroll = self.xscroll;
    xscroll.off('doubletap', self._doubleTapHandler, self);
    xscroll.off('pinchstart', self._pinchStartHandler, self);
    xscroll.off('pinchmove', self._pinchHandler, self);
    xscroll.off('pinchend pinchcancel', self._pinchEndHandler, self);
    return self;
  },
  _doubleTapHandler: function _doubleTapHandler(e) {
    var self = this;
    var xscroll = self.xscroll;
    var minScale = self.userConfig.minScale;
    var maxScale = self.userConfig.maxScale;
    var duration = self.userConfig.duration;
    self.originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
    self.originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
    xscroll.scale > self.minScale ? self.scaleTo(minScale, self.originX, self.originY, duration) : self.scaleTo(maxScale, self.originX, self.originY, duration);
    return self;
  },
  _pinchStartHandler: function _pinchStartHandler(e) {
    var self = this;
    var xscroll = self.xscroll;
    // disable pan gesture
    self.disablePan();
    xscroll.stop();
    self.isScaling = false;
    self.scale = xscroll.scale;
    self.originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
    self.originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
  },
  _pinchHandler: function _pinchHandler(e) {
    var self = this;
    var scale = self.scale;
    var xscroll = self.xscroll;
    var originX = self.originX;
    var originY = self.originY;
    var __scale = scale * e.scale;
    if (__scale <= self.userConfig.minScale) {
      // s = 1/2 * a * 2^(s/a)
      __scale = 0.5 * self.userConfig.minScale * Math.pow(2, __scale / self.userConfig.minScale);
    }
    if (__scale >= self.userConfig.maxScale) {
      // s = 2 * a * 1/2^(a/s)
      __scale = 2 * self.userConfig.maxScale * Math.pow(0.5, self.userConfig.maxScale / __scale);
    }
    self._scale(__scale, originX, originY);
    self.xscroll.translate(xscroll.x, xscroll.y, __scale, 'e.scale', e.scale);
  },
  disablePan: function disablePan() {
    this.xscroll.mc.get('pan').set({
      enable: false
    });
    return this;
  },
  enablePan: function enablePan() {
    this.xscroll.mc.get('pan').set({
      enable: true
    });
    return this;
  },
  _pinchEndHandler: function _pinchEndHandler(e) {
    var self = this;
    var originX = self.originX;
    var originY = self.originY;
    var xscroll = self.xscroll;
    if (xscroll.scale < self.minScale) {
      self.scaleTo(self.minScale, originX, originY, SCALE_TO_DURATION, 'ease-out', self.enablePan);
    } else if (xscroll.scale > self.maxScale) {
      self.scaleTo(self.maxScale, originX, originY, SCALE_TO_DURATION, 'ease-out', self.enablePan);
    } else {
      self.enablePan();
    }
  },
  _bindEvt: function _bindEvt() {
    var self = this;
    var xscroll = self.xscroll;
    xscroll.on('doubletap', self._doubleTapHandler, self);
    xscroll.on('pinchstart', self._pinchStartHandler, self);
    xscroll.on('pinchmove', self._pinchHandler, self);
    xscroll.on('pinchend pinchcancel', self._pinchEndHandler, self);
    return self;
  },
  _scale: function _scale(scale, originX, originY) {
    var self = this;
    var xscroll = self.xscroll;
    var boundry = self.xscroll.boundry;
    if (xscroll.scale == scale || !scale) return;
    if (!self.isScaling) {
      self.scaleBegin = xscroll.scale;
      self.isScaling = true;
      self.scaleBeginX = xscroll.x;
      self.scaleBeginY = xscroll.y;
    }
    if (originX) {
      self.originX = originX;
    }
    if (originY) {
      self.originY = originY;
    }
    var containerWidth = scale * self.initialContainerWidth;
    var containerHeight = scale * self.initialContainerHeight;
    xscroll.containerWidth = Math.round(containerWidth > xscroll.width ? containerWidth : xscroll.width);
    xscroll.containerHeight = Math.round(containerHeight > xscroll.height ? containerHeight : xscroll.height);
    xscroll.scale = scale;
    var x = originX * (self.initialContainerWidth * self.scaleBegin - xscroll.containerWidth) + self.scaleBeginX;
    var y = originY * (self.initialContainerHeight * self.scaleBegin - xscroll.containerHeight) + self.scaleBeginY;
    if (x > boundry.left) {
      x = boundry.left;
    }
    if (y > boundry.top) {
      y = boundry.top;
    }
    if (x < boundry.right - xscroll.containerWidth) {
      x = boundry.right - xscroll.containerWidth;
    }
    if (y < boundry.bottom - xscroll.containerHeight) {
      y = boundry.bottom - xscroll.containerHeight;
    }
    xscroll.x = x;
    xscroll.y = y;
  },
  /**
   * scale with an animation
   * @memberOf Scale
   * @param {number} scale
   * @param {number} originX 0~1
   * @param {number} originY 0~1
   * @param {number} duration
   * @param {string} easing
   * @param {function} callback
   */
  scaleTo: function scaleTo(scale, originX, originY, duration, easing, callback) {
    var self = this;
    var xscroll = self.xscroll;
    // unscalable
    if (xscroll.scale == scale || !scale) return;
    var duration = duration || SCALE_TO_DURATION;
    var easing = easing || 'ease-out';
    self.scaleStart = xscroll.scale || 1;
    // transitionStr = [transformStr, " ", duration , "s ", easing, " 0s"].join("");
    self._scale(scale, originX, originY);
    xscroll._animate('x', 'translateX(' + xscroll.x + 'px) scale(' + scale + ')', duration, easing, function (e) {
      callback && callback.call(self, e);
    });
    xscroll._animate('y', 'translateY(' + xscroll.y + 'px)', duration, easing, function (e) {
      callback && callback.call(self, e);
    });
    xscroll.__timers.x.timer.off('run', self.scaleHandler, self);
    xscroll.__timers.x.timer.off('stop', self.scaleendHandler, self);
    self.scaleHandler = function (e) {
      var _scale = (scale - self.scaleStart) * e.percent + self.scaleStart;
      // trigger scroll event
      self.trigger('scale', {
        scale: _scale,
        origin: {
          x: originX,
          y: originY
        }
      });
    };

    self.scaleendHandler = function (e) {
      self.isScaling = false;
      // enable pan gesture
      self.enablePan();
      self.trigger('scaleend', {
        type: 'scaleend',
        scale: self.scale,
        origin: {
          x: originX,
          y: originY
        }
      });
    };

    xscroll.__timers.x.timer.on('run', self.scaleHandler, self);
    xscroll.__timers.x.timer.on('stop', self.scaleendHandler, self);
    self.trigger('scaleanimate', {
      type: 'scaleanimate',
      scale: xscroll.scale,
      duration: duration,
      easing: easing,
      offset: {
        x: xscroll.x,
        y: xscroll.y
      },
      origin: {
        x: originX,
        y: originY
      }
    });
  }
});

module.exports = Scale;

/***/ })

/******/ });
});