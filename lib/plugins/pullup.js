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
/******/ 	return __webpack_require__(__webpack_require__.s = 20);
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

/***/ 20:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var Util = __webpack_require__(0);
var Base = __webpack_require__(1);
var clsPrefix;
var containerCls;
var loadingContent = 'Loading...';
var upContent = 'Pull Up To Refresh';
var downContent = 'Release To Refresh';
var PULL_UP_HEIGHT = 60;
var HEIGHT = 40;
/**
 * A pullup to load plugin for xscroll.
 * @constructor
 * @param {object} cfg
 * @param {number} cfg.height
 * @param {string} cfg.downContent
 * @param {string} cfg.upContent
 * @param {string} cfg.loadingContent
 * @param {string} cfg.clsPrefix  class prefix which default value is "xs-plugin-pullup-"
 * @param {number} cfg.bufferHeight preload data before scrolling to the bottom of the boundry
 * @extends {Base}
 */
var PullUp = function PullUp(cfg) {
  PullUp.superclass.constructor.call(this);
  this.userConfig = Util.mix({
    upContent: upContent,
    downContent: downContent,
    pullUpHeight: PULL_UP_HEIGHT,
    height: HEIGHT,
    loadingContent: loadingContent,
    bufferHeight: 0,
    clsPrefix: 'xs-plugin-pullup-'
  }, cfg);
};
Util.extend(PullUp, Base, {
  /**
   * a pluginId
   * @memberOf PullUp
   * @type {string}
   */
  pluginId: 'pullup',
  /**
   * plugin initializer
   * @memberOf PullUp
   * @override Base
   * @return {PullUp}
   */
  pluginInitializer: function pluginInitializer(xscroll) {
    var self = this;
    self.xscroll = xscroll.render();
    clsPrefix = self.userConfig.clsPrefix;
    self.render();
    return self;
  },
  /**
   * detroy the plugin
   * @memberOf PullUp
   * @override Base
   * @return {PullUp}
   */
  pluginDestructor: function pluginDestructor() {
    var self = this;
    Util.remove(self.pullup);
    self.xscroll.off('scrollend', self._scrollEndHandler, self);
    self.xscroll.off('scroll', self._scrollHandler, self);
    self.xscroll.off('pan', self._panHandler, self);
    self.xscroll.boundry.resetBottom();
    self.__isRender = false;
    self._evtBinded = false;
  },
  /**
   * render pullup plugin
   * @memberOf PullUp
   * @return {PullUp}
   */
  render: function render() {
    var self = this;
    if (self.__isRender) return;
    self.__isRender = true;
    var containerCls = clsPrefix + 'container';
    var height = self.userConfig.height;
    var pullup = self.pullup = document.createElement('div');
    pullup.className = containerCls;
    pullup.style.position = 'absolute';
    pullup.style.width = '100%';
    pullup.style.height = height + 'px';
    pullup.style.bottom = -height + 'px';
    self.xscroll.container.appendChild(pullup);
    self.xscroll.boundry.expandBottom(self.userConfig.height);
    self.status = 'up';
    Util.addClass(pullup, clsPrefix + self.status);
    pullup.innerHTML = self.userConfig[self.status + 'Content'] || self.userConfig.content;
    self._bindEvt();
    return self;
  },
  _bindEvt: function _bindEvt() {
    var self = this;
    if (self._evtBinded) return;
    self._evtBinded = true;
    var pullup = self.pullup;
    var xscroll = self.xscroll;
    xscroll.on('pan', self._panHandler, self);
    // load width a buffer
    if (self.userConfig.bufferHeight > 0) {
      xscroll.on('scroll', self._scrollHandler, self);
    }
    // bounce bottom
    xscroll.on('scrollend', self._scrollEndHandler, self);
    return self;
  },
  _scrollEndHandler: function _scrollEndHandler(e) {
    var self = this,
        xscroll = self.xscroll,
        scrollTop = xscroll.getScrollTop();
    if (Math.abs(scrollTop - (xscroll.containerHeight - xscroll.height + self.userConfig.height)) < 1) {
      self._changeStatus('loading');
    }
    return self;
  },
  _scrollHandler: function _scrollHandler(e) {
    var self = this,
        xscroll = self.xscroll;
    if (!self.isLoading && Math.abs(e.scrollTop) + xscroll.height + self.userConfig.height + self.userConfig.bufferHeight >= xscroll.containerHeight + xscroll.boundry._xtop + xscroll.boundry._xbottom) {
      self._changeStatus('loading');
    }
    return self;
  },
  _panHandler: function _panHandler(e) {
    var self = this;
    var xscroll = self.xscroll;
    var offsetTop = -xscroll.getScrollTop();
    if (offsetTop < xscroll.height - xscroll.containerHeight - self.userConfig.pullUpHeight) {
      self._changeStatus('down');
    } else {
      self._changeStatus('up');
    }
    return self;
  },
  _changeStatus: function _changeStatus(status) {
    if (status != 'loading' && this.isLoading) return;
    var prevVal = this.status;
    this.status = status;
    Util.removeClass(this.pullup, clsPrefix + prevVal);
    Util.addClass(this.pullup, clsPrefix + status);
    this.pullup.innerHTML = this.userConfig[status + 'Content'];
    if (prevVal != status) {
      this.trigger('statuschange', {
        prevVal: prevVal,
        newVal: status
      });
      if (status == 'loading') {
        this.isLoading = true;
        this.trigger('loading');
      }
    }
    return this;
  },
  /**
   * notify pullup plugin to complete state after a remote data request
   * @memberOf PullUp
   * @return {PullUp}
   */
  complete: function complete() {
    var self = this;
    var xscroll = self.xscroll;
    self.isLoading = false;
    self._changeStatus('up');
    return self;
  }
});

module.exports = PullUp;

/***/ })

/******/ });
});