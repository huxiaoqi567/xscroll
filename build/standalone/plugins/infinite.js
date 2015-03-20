;(function() {
var util, base, plugins_infinite, _events_;
util = function (exports) {
  var SUBSTITUTE_REG = /\\?\{([^{}]+)\}/g, EMPTY = '';
  var RE_TRIM = /^[\s\xa0]+|[\s\xa0]+$/g, trim = String.prototype.trim;
  var RE_DASH = /-([a-z])/gi;
  function upperCase() {
    return arguments[1].toUpperCase();
  }
  function Empty() {
  }
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
  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  var guid = function (prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };
  var Util = {
    // Is a given variable an object?
    isObject: function (obj) {
      return obj === Object(obj);
    },
    isArray: Array.isArray || function (obj) {
      return toString.call(obj) == '[object Array]';
    },
    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    isEmpty: function (obj) {
      if (obj == null)
        return true;
      if (this.isArray(obj) || this.isString(obj))
        return obj.length === 0;
      for (var key in obj)
        if (this.has(obj, key))
          return false;
      return true;
    },
    mix: function (to, from, deep) {
      for (var i in from) {
        to[i] = from[i];
      }
      return to;
    },
    extend: function (r, s, px, sx) {
      if (!s || !r) {
        return r;
      }
      var sp = s.prototype, rp;
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
    startsWith: function (str, prefix) {
      return str.lastIndexOf(prefix, 0) === 0;
    },
    /**
     * test whether a string end with a specified substring
     * @param {String} str the whole string
     * @param {String} suffix a specified substring
     * @return {Boolean} whether str end with suffix
     * @member util
     */
    endsWith: function (str, suffix) {
      var ind = str.length - suffix.length;
      return ind >= 0 && str.indexOf(suffix, ind) === ind;
    },
    /**
     * Removes the whitespace from the beginning and end of a string.
     * @method
     * @member util
     */
    trim: trim ? function (str) {
      return str == null ? EMPTY : trim.call(str);
    } : function (str) {
      return str == null ? EMPTY : (str + '').replace(RE_TRIM, EMPTY);
    },
    /**
     * Substitutes keywords in a string using an object/array.
     * Removes undef keywords and ignores escaped keywords.
     * @param {String} str template string
     * @param {Object} o json data
     * @member util
     * @param {RegExp} [regexp] to match a piece of template string
     */
    substitute: function (str, o, regexp) {
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
    /*
        vendors
        @example webkit|moz|ms|O 
    	*/
    vendor: function () {
      var el = document.createElement('div').style;
      var vendors = [
          't',
          'webkitT',
          'MozT',
          'msT',
          'OT'
        ], transform, i = 0, l = vendors.length;
      for (; i < l; i++) {
        transform = vendors[i] + 'ransform';
        if (transform in el)
          return vendors[i].substr(0, vendors[i].length - 1);
      }
      return false;
    }(),
    /**
     *  attrs with vendor
     *  @return { String }
     **/
    prefixStyle: function (style) {
      if (this.vendor === false)
        return false;
      if (this.vendor === '')
        return style;
      return this.vendor + style.charAt(0).toUpperCase() + style.substr(1);
    },
    hasClass: function (el, className) {
      return el && el.className && className && el.className.indexOf(className) != -1;
    },
    addClass: function (el, className) {
      if (el && className && !this.hasClass(el, className)) {
        el.className += ' ' + className;
      }
    },
    removeClass: function (el, className) {
      if (el && el.className && className) {
        el.className = el.className.replace(className, '');
      }
    },
    getOffsetTop: function (e) {
      var offset = e.offsetTop;
      if (e.offsetParent != null)
        offset += this.getOffsetTop(e.offsetParent);
      return offset;
    },
    getOffsetLeft: function (e) {
      var offset = e.offsetLeft;
      if (e.offsetParent != null)
        offset += this.getOffsetLeft(e.offsetParent);
      return offset;
    },
    findParentEl: function (el, selector, rootNode) {
      var rs = null;
      rootNode = rootNode || document.body;
      if (!el || !selector)
        return;
      if (el.className.match(selector.replace(/\.|#/g, ''))) {
        return el;
      }
      while (!rs) {
        rs = el.parentNode;
        if (el == rootNode)
          break;
        if (rs) {
          return rs;
          break;
        } else {
          el = el.parentNode;
        }
      }
      return null;
    },
    guid: guid,
    isAndroid: function () {
      return /Android /.test(window.navigator.appVersion);
    },
    isBadAndroid: function () {
      return /Android /.test(window.navigator.appVersion) && !/Chrome\/\d/.test(window.navigator.appVersion);
    },
    px2Num: function (px) {
      return Number(px.replace(/px/, ''));
    }
  };
  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  var names = [
    'Arguments',
    'Function',
    'String',
    'Number',
    'Date',
    'RegExp'
  ];
  for (var i = 0; i < names.length; i++) {
    Util['is' + names[i]] = function (obj) {
      return toString.call(obj) == '[object ' + names[i] + ']';
    };
  }
  if (typeof module == 'object' && module.exports) {
    exports = Util;
  } else {
    return Util;
  }
  return exports;
}({});
_events_ = function (exports) {
  var Util = util;
  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  var _once = function (func) {
    var ran = false, memo;
    return function () {
      if (ran)
        return memo;
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
    on: function (name, callback, context) {
      if (!eventsApi(this, 'on', name, [
          callback,
          context
        ]) || !callback)
        return this;
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
    once: function (name, callback, context) {
      if (!eventsApi(this, 'once', name, [
          callback,
          context
        ]) || !callback)
        return this;
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
    off: function (name, callback, context) {
      if (!this._events || !eventsApi(this, 'off', name, [
          callback,
          context
        ]))
        return this;
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
        if (!events)
          continue;
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
    trigger: function (name) {
      if (!this._events)
        return this;
      var args = Array.prototype.slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args))
        return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events)
        triggerEvents(events, args);
      if (allEvents)
        triggerEvents(allEvents, arguments);
      return this;
    },
    // Inversion-of-control versions of `on` and `once`. Tell *this* object to
    // listen to an event in another object ... keeping track of what it's
    // listening to.
    listenTo: function (obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = Util.guid('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object')
        callback = this;
      obj.on(name, callback, this);
      return this;
    },
    listenToOnce: function (obj, name, callback) {
      if (typeof name === 'object') {
        for (var event in name)
          this.listenToOnce(obj, event, name[event]);
        return this;
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
    stopListening: function (obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo)
        return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object')
        callback = this;
      if (obj)
        (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || Util.isEmpty(obj._events))
          delete this._listeningTo[id];
      }
      return this;
    }
  };
  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;
  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function (obj, action, name, rest) {
    if (!name)
      return true;
    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [
          key,
          name[key]
        ].concat(rest));
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
  var triggerEvents = function (events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
    case 0:
      while (++i < l)
        (ev = events[i]).callback.call(ev.ctx);
      return;
    case 1:
      while (++i < l)
        (ev = events[i]).callback.call(ev.ctx, a1);
      return;
    case 2:
      while (++i < l)
        (ev = events[i]).callback.call(ev.ctx, a1, a2);
      return;
    case 3:
      while (++i < l)
        (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
      return;
    default:
      while (++i < l)
        (ev = events[i]).callback.apply(ev.ctx, args);
      return;
    }
  };
  // Aliases for backwards compatibility.
  Events.bind = Events.on;
  Events.unbind = Events.off;
  if (typeof module == 'object' && module.exports) {
    exports = Events;
  } else {
    return Events;
  }
  return exports;
}({});
base = function (exports) {
  var Util = util;
  var Events = _events_;
  /** 
  @constructor 
  @mixes Events
  */
  var Base = function () {
  };
  Util.mix(Base.prototype, Events);
  Util.mix(Base.prototype, {
    /**
     * @memberof Base
     * @param  {object} plugin plug a plugin
     */
    plug: function (plugin) {
      var self = this;
      if (!plugin || !plugin.pluginId)
        return;
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
    unplug: function (plugin) {
      var self = this;
      if (!plugin)
        return;
      var _plugin = typeof plugin == 'string' ? self.getPlugin(plugin) : plugin;
      _plugin.pluginDestructor(self);
      for (var i in self.__plugins) {
        if (self.__plugins[i] == _plugin) {
          return self.__plugins.splice(i, 1);
        }
      }
    },
    /**
     * @memberof Base
     * @param  {object|string} plugin get plugin by pluginId
     */
    getPlugin: function (pluginId) {
      var self = this;
      var plugins = [];
      for (var i in self.__plugins) {
        if (self.__plugins[i] && self.__plugins[i].pluginId == pluginId) {
          plugins.push(self.__plugins[i]);
        }
      }
      return plugins.length > 1 ? plugins : plugins[0] || null;
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = Base;
  } else {
    return Base;
  }
  return exports;
}({});
plugins_infinite = function (exports) {
  var Util = util, Base = base;
  var transform = Util.prefixStyle('transform');
  var transition = Util.prefixStyle('transition');
  /**
  * An infinity dom-recycled list plugin for xscroll.
  * @constructor
  * @param {object} cfg
  * @param {string} cfg.zoomType choose scroll vertically or horizontally
  * @param {string} cfg.transition recomposition cell with a transition
  * @param {string} cfg.infiniteElements dom-selector for reused elements
  * @param {function} cfg.renderHook render function for cell by per col or per row duration scrolling
  * @extends {Base}
  */
  var Infinite = function (cfg) {
    Infinite.superclass.constructor.call(this, cfg);
    this.userConfig = Util.mix({
      zoomType: 'y',
      transition: 'all 0.5s ease'
    }, cfg);
  };
  Util.extend(Infinite, Base, {
    /**
     * a pluginId
     * @memberOf Infinite
     * @type {string}
     */
    pluginId: 'infinite',
    /**
     * store the visible elements inside of view.
     * @memberOf Infinite
     * @type {object}
     */
    visibleElements: {},
    /**
     * store all elements data.
     * @memberOf Infinite
     * @type {object}
     */
    sections: {},
    /**
     * plugin initializer
     * @memberOf Infinite
     * @override Base
     * @return {Infinite}
     */
    pluginInitializer: function (xscroll) {
      var self = this;
      self.xscroll = xscroll;
      self.isY = !!(self.userConfig.zoomType == 'y');
      self._nameTop = self.isY ? '_top' : '_left';
      self._nameHeight = self.isY ? '_height' : '_width';
      self.nameTop = self.isY ? 'top' : 'left';
      self.nameHeight = self.isY ? 'height' : 'width';
      self.nameWidth = self.isY ? 'width' : 'height';
      self.nameY = self.isY ? 'y' : 'x';
      self.nameTranslate = self.isY ? 'translateY' : 'translateX';
      self.nameContainerHeight = self.isY ? 'containerHeight' : 'containerWidth';
      self.nameScrollTop = self.isY ? 'scrollTop' : 'scrollLeft';
      self._initInfinite();
      xscroll.on('afterrender', function () {
        self.render();
        self._bindEvt();
      });
      return self;
    },
    /**
     * detroy the plugin
     * @memberOf Infinite
     * @override Base
     * @return {Infinite}
     */
    pluginDestructor: function () {
      var self = this;
      self.xscroll.off('scroll', self._updateByScroll, self);
      for (var i = 0; i < self.infiniteLength; i++) {
        self.infiniteElements[i].style.position = 'inherit';
        self.infiniteElements[i].style.visibility = 'inherit';
        self.infiniteElements[i].style.display = 'inherit';
        self.infiniteElements[i].style[self.nameTop] = 'auto';
        self.infiniteElements[i].style[transform] = 'none';
      }
      self.xscroll.off('tap panstart pan panend', self._cellEventsHandler, self);
      self._destroySticky();
      return self;
    },
    _initInfinite: function () {
      var self = this;
      var xscroll = self.xscroll;
      self.sections = {};
      self.infiniteElements = xscroll.renderTo.querySelectorAll(self.userConfig.infiniteElements);
      self.infiniteLength = self.infiniteElements.length;
      self.infiniteElementsCache = function () {
        var tmp = [];
        for (var i = 0; i < self.infiniteLength; i++) {
          tmp.push({});
          self.infiniteElements[i].style.position = 'absolute';
          self.infiniteElements[i].style[self.nameTop] = 0;
          self.infiniteElements[i].style.visibility = 'hidden';
          self.infiniteElements[i].style.display = 'block';
          Util.addClass(self.infiniteElements[i], '_xs_infinite_elements_');
        }
        return tmp;
      }();
      self.elementsPos = {};
      xscroll.on('scroll', self._updateByScroll, self);
      return self;
    },
    _initSticky: function () {
      var self = this;
      self.stickyDomInfo = [];
      if (!self.hasSticky) {
        return;
      }
      //create sticky element
      if (!self._isStickyRendered) {
        var sticky = document.createElement('div');
        sticky.style.position = 'fixed';
        sticky.style.left = 0;
        sticky.style.top = 0;
        sticky.style.display = 'none';
        Util.addClass(sticky, '_xs_infinite_elements_');
        self.xscroll.renderTo.appendChild(sticky);
        self.stickyElement = sticky;
        self._isStickyRendered = true;
      }
      for (var i in self.__serializedData) {
        var sticky = self.__serializedData[i];
        if (sticky && sticky.style && 'sticky' == sticky.style.position) {
          self.stickyDomInfo.push(sticky);
        }
      }
      return self;
    },
    _destroySticky: function () {
      var self = this;
      self.hasSticky = false;
      self.stickyElement && self.stickyElement.remove();
      self._isStickyRendered = false;
      return self;
    },
    _renderUnRecycledEl: function () {
      var self = this;
      var translateZ = self.userConfig.gpuAcceleration ? ' translateZ(0) ' : '';
      for (var i in self.__serializedData) {
        var unrecycledEl = self.__serializedData[i];
        if (self.__serializedData[i]['recycled'] === false) {
          var el = unrecycledEl.id && document.getElementById(unrecycledEl.id.replace('#', '')) || document.createElement('div');
          var randomId = Util.guid('xs-row-');
          el.id = unrecycledEl.id || randomId;
          unrecycledEl.id = el.id;
          self.xscroll.content.appendChild(el);
          for (var attrName in unrecycledEl.style) {
            if (attrName != self.nameHeight && attrName != 'display' && attrName != 'position') {
              el.style[attrName] = unrecycledEl.style[attrName];
            }
          }
          el.style[self.nameTop] = 0;
          el.style.position = 'absolute';
          el.style.display = 'block';
          el.style[self.nameHeight] = unrecycledEl[self._nameHeight] + 'px';
          el.style[transform] = self.nameTranslate + '(' + unrecycledEl[self._nameTop] + 'px) ' + translateZ;
          Util.addClass(el, unrecycledEl.className);
          self.userConfig.renderHook.call(self, el, unrecycledEl);
        }
      }
    },
    /**
     * render or update the scroll contents
     * @memberOf Infinite
     * @return {Infinite}
     */
    render: function () {
      var self = this;
      var xscroll = self.xscroll;
      var offset = self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft();
      self.visibleElements = self.getVisibleElements(offset);
      self.__serializedData = self._computeDomPositions();
      self._initSticky();
      var size = xscroll[self.nameHeight];
      var containerSize = self._containerSize;
      if (containerSize < size) {
        containerSize = size;
      }
      xscroll[self.nameContainerHeight] = containerSize;
      xscroll.container.style[self.nameHeight] = containerSize + 'px';
      xscroll.content.style[self.nameHeight] = containerSize + 'px';
      self.curStickyIndex = undefined;
      self._renderUnRecycledEl();
      self._updateByScroll();
      self._updateByRender(offset);
      self.xscroll.boundryCheck();
      return self;
    },
    _getChangedRows: function (newElementsPos) {
      var self = this;
      var changedRows = {};
      for (var i in self.elementsPos) {
        if (!newElementsPos.hasOwnProperty(i)) {
          changedRows[i] = 'delete';
        }
      }
      for (var i in newElementsPos) {
        if (newElementsPos[i].recycled && !self.elementsPos.hasOwnProperty(i)) {
          changedRows[i] = 'add';
        }
      }
      self.elementsPos = newElementsPos;
      return changedRows;
    },
    _updateByScroll: function (e) {
      var self = this;
      var xscroll = self.xscroll;
      var _pos = e && e[self.nameScrollTop];
      var pos = _pos === undefined ? self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft() : _pos;
      var elementsPos = self.getVisibleElements(pos);
      var changedRows = self._getChangedRows(elementsPos);
      for (var i in changedRows) {
        if (changedRows[i] == 'delete') {
          self._pushEl(i);
        }
        if (changedRows[i] == 'add') {
          var elObj = self._popEl(elementsPos[i][self.guid]);
          var index = elObj.index;
          var el = elObj.el;
          if (el) {
            self.infiniteElementsCache[index].guid = elementsPos[i].guid;
            self.__serializedData[elementsPos[i].guid].__infiniteIndex = index;
            self._renderData(el, elementsPos[i]);
            self._renderStyle(el, elementsPos[i]);
          }
        }
      }
      self._stickyHandler(pos);
      return self;
    },
    _updateByRender: function (pos) {
      var self = this;
      var xscroll = self.xscroll;
      var pos = pos === undefined ? self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft() : pos;
      var prevElementsPos = self.visibleElements;
      var newElementsPos = self.getVisibleElements(pos);
      var prevEl, newEl;
      //repaint
      for (var i in newElementsPos) {
        newEl = newElementsPos[i];
        for (var j in prevElementsPos) {
          prevEl = prevElementsPos[j];
          if (prevEl.guid === newEl.guid) {
            if (newEl.style != prevEl.style || newEl[self._nameTop] != prevEl[self._nameTop] || newEl[self._nameHeight] != prevEl[self._nameHeight]) {
              // console.log( "data:", JSON.stringify(newEl.data),prevEl[self._nameTop], '->', newEl[self._nameTop])
              self._renderStyle(self.infiniteElements[newEl.__infiniteIndex], newEl, true);
            }
            if (JSON.stringify(newEl.data) != JSON.stringify(prevEl.data)) {
              self._renderData(self.infiniteElements[newEl.__infiniteIndex], newEl);
            }
          } else {
            // paint
            if (self.__serializedData[newEl.guid].__infiniteIndex === undefined) {
              var elObj = self._popEl();
              self.__serializedData[newEl.guid].__infiniteIndex = elObj.index;
              self._renderData(elObj.el, newEl);
              self._renderStyle(elObj.el, newEl);
            }
          }
        }
      }
      self.visibleElements = newElementsPos;
    },
    _stickyHandler: function (_pos) {
      var self = this;
      _pos = undefined === _pos ? self.isY ? self.xscroll.getScrollTop() : self.xscroll.getScrollLeft() : _pos;
      var pos = Math.abs(_pos);
      var index = [];
      var allTops = [];
      for (var i = 0; i < self.stickyDomInfo.length; i++) {
        allTops.push(self.stickyDomInfo[i][self._nameTop]);
        if (pos >= self.stickyDomInfo[i][self._nameTop]) {
          index.push(i);
        }
      }
      if (!index.length) {
        if (self.stickyElement) {
          self.stickyElement.style.display = 'none';
        }
        self.curStickyIndex = undefined;
        return;
      }
      var curStickyIndex = Math.max.apply(null, index);
      if (self.curStickyIndex !== curStickyIndex) {
        self.curStickyIndex = curStickyIndex;
        self.userConfig.renderHook.call(self, self.stickyElement, self.stickyDomInfo[self.curStickyIndex]);
        self.stickyElement.style.display = 'block';
        self.stickyElement.style[self.nameWidth] = '100%';
        self.stickyElement.style[self.nameHeight] = self.stickyDomInfo[self.curStickyIndex].style[self.nameHeight] + 'px';
        self.stickyElement.setAttribute('xs-guid', self.stickyDomInfo[self.curStickyIndex].guid);
        Util.addClass(self.stickyElement, self.stickyDomInfo[self.curStickyIndex].className);
        for (var attrName in self.stickyDomInfo[self.curStickyIndex].style) {
          if (attrName != self.nameHeight && attrName != 'display' && attrName != 'position') {
            self.stickyElement.style[attrName] = self.stickyDomInfo[self.curStickyIndex].style[attrName];
          }
        }
      }
      var trans = 0;
      if (self.stickyDomInfo[self.curStickyIndex + 1]) {
        var cur = self.stickyDomInfo[self.curStickyIndex];
        var next = self.stickyDomInfo[self.curStickyIndex + 1];
        if (_pos + cur[self._nameHeight] > next[self._nameTop] && _pos + cur[self._nameHeight] < next[self._nameTop] + cur[self._nameHeight]) {
          trans = cur[self._nameHeight] + pos - next[self._nameTop];
        } else {
          trans = 0;
        }
      }
      self.stickyElement.style[transform] = self.isY ? 'translateY(-' + trans + 'px) translateZ(0)' : 'translateX(-' + trans + 'px) translateZ(0)';
      //top
      if (_pos < Math.min.apply(null, allTops)) {
        self.stickyElement.style.display = 'none';
        self.curStickyIndex = undefined;
        return;
      }
    },
    /**
     * get all element posInfo such as top,height,template,html
     * @return {Array}
     **/
    _computeDomPositions: function () {
      var self = this;
      var pos = 0, size = 0, sections = self.sections, section;
      self.hasSticky = false;
      var data = [];
      var serializedData = {};
      for (var i in sections) {
        for (var j = 0, len = sections[i].length; j < len; j++) {
          section = sections[i][j];
          section.sectionId = i;
          section.index = j;
          data.push(section);
        }
      }
      //f = v/itemSize*1000 < 60 => v = 0.06 * itemSize
      self.userConfig.maxSpeed = 0.06 * 50;
      for (var i = 0, l = data.length; i < l; i++) {
        var item = data[i];
        size = item.style && item.style[self.nameHeight] >= 0 ? item.style[self.nameHeight] : 100;
        item.guid = item.guid || Util.guid();
        item[self._nameTop] = pos;
        item[self._nameHeight] = size;
        item.recycled = item.recycled === false ? false : true;
        pos += size;
        if (!self.hasSticky && item.style && item.style.position == 'sticky') {
          self.hasSticky = true;
        }
        serializedData[item.guid] = item;
      }
      self._containerSize = pos;
      return serializedData;
    },
    /**
     * get all elements inside of the view.
     * @memberOf Infinite
     * @param {number} pos scrollLeft or scrollTop
     * @return {object} visibleElements
     */
    getVisibleElements: function (pos) {
      var self = this;
      var xscroll = self.xscroll;
      var pos = pos === undefined ? self.isY ? xscroll.getScrollTop() : xscroll.getScrollLeft() : pos;
      var threshold = self.userConfig.threshold >= 0 ? self.userConfig.threshold : xscroll[self.nameHeight] / 3;
      var tmp = {}, item;
      var data = self.__serializedData;
      for (var i in data) {
        item = data[i];
        if (item[self._nameTop] >= pos - threshold && item[self._nameTop] <= pos + xscroll[self.nameHeight] + threshold) {
          tmp[item.guid] = item;
        }
      }
      return JSON.parse(JSON.stringify(tmp));
    },
    _popEl: function () {
      var self = this;
      for (var i = 0; i < self.infiniteLength; i++) {
        if (!self.infiniteElementsCache[i]._visible) {
          self.infiniteElementsCache[i]._visible = true;
          return {
            index: i,
            el: self.infiniteElements[i]
          };
        }
      }
    },
    _pushEl: function (guid) {
      var self = this;
      for (var i = 0; i < self.infiniteLength; i++) {
        if (self.infiniteElementsCache[i].guid == guid) {
          self.infiniteElementsCache[i]._visible = false;
          self.infiniteElements[i].style.visibility = 'hidden';
          delete self.infiniteElementsCache[i].guid;
        }
      }
    },
    _renderData: function (el, elementObj) {
      var self = this;
      if (!el)
        return;
      self.userConfig.renderHook.call(self, el, elementObj);
    },
    _renderStyle: function (el, elementObj, useTransition) {
      var self = this;
      if (!el)
        return;
      var translateZ = self.xscroll.userConfig.gpuAcceleration ? ' translateZ(0) ' : '';
      //default style
      var defaultStyle = {
        color: 'inherit',
        background: 'inherit',
        margin: 'inherit',
        padding: 'inherit',
        opacity: 'inherit',
        textIndent: 'inherit',
        overflow: 'inherit'
      };
      for (var attrName in defaultStyle) {
        el.style[attrName] = defaultStyle[attrName];
      }
      //update style
      for (var attrName in elementObj.style) {
        if (attrName != self.nameHeight && attrName != 'display' && attrName != 'position') {
          el.style[attrName] = elementObj.style[attrName];
        }
      }
      el.setAttribute('xs-index', elementObj.index);
      el.setAttribute('xs-sectionid', elementObj.sectionId);
      el.setAttribute('xs-guid', elementObj.guid);
      el.style.visibility = 'visible';
      el.style[self.nameHeight] = elementObj[self._nameHeight] + 'px';
      el.style[transform] = self.nameTranslate + '(' + elementObj[self._nameTop] + 'px) ' + translateZ;
      el.style[transition] = useTransition ? self.userConfig.transition : 'none';
    },
    getCell: function (e) {
      var self = this, cell;
      var el = Util.findParentEl(e.target, '._xs_infinite_elements_', self.xscroll.renderTo);
      var guid = el.getAttribute('xs-guid');
      if (undefined === guid)
        return;
      return self.__serializedData[guid];
    },
    _bindEvt: function () {
      var self = this;
      if (self._isEvtBinded)
        return;
      self._isEvtBinded = true;
      self.xscroll.renderTo.addEventListener('webkitTransitionEnd', function (e) {
        if (e.target.className.match(/xs-row/)) {
          e.target.style.webkitTransition = '';
        }
      });
      self.xscroll.on('tap panstart pan panend', self._cellEventsHandler, self);
      return self;
    },
    _cellEventsHandler: function (e) {
      var self = this;
      e.cell = self.getCell(e);
      e.cell && self[e.type].call(self, e);
    },
    /**
     * tap event
     * @memberOf Infinite
     * @param {object} e events data include cell object
     * @event
     */
    tap: function (e) {
      this.trigger('tap', e);
      return this;
    },
    /**
     * panstart event
     * @memberOf Infinite
     * @param {object} e events data include cell object
     * @event
     */
    panstart: function (e) {
      this.trigger('panstart', e);
      return this;
    },
    /**
     * pan event
     * @memberOf Infinite
     * @param {object} e events data include cell object
     * @event
     */
    pan: function (e) {
      this.trigger('pan', e);
      return this;
    },
    /**
     * panend event
     * @memberOf Infinite
     * @param {object} e events data include cell object
     * @event
     */
    panend: function (e) {
      this.trigger('panend', e);
      return this;
    },
    /**
     * insert data before a position
     * @memberOf Infinite
     * @param {string} sectionId sectionId of the target cell
     * @param {number} index index of the target cell
     * @param {object} data data to insert
     * @return {Infinite}
     */
    insertBefore: function (sectionId, index, data) {
      var self = this;
      if (sectionId === undefined || index === undefined || data === undefined)
        return self;
      if (!self.sections[sectionId]) {
        self.sections[sectionId] = [];
      }
      self.sections[sectionId].splice(index, 0, data);
      return self;
    },
    /**
     * insert data after a position
     * @memberOf Infinite
     * @param {string} sectionId sectionId of the target cell
     * @param {number} index index of the target cell
     * @param {object} data data to insert
     * @return {Infinite}
     */
    insertAfter: function (sectionId, index, data) {
      var self = this;
      if (sectionId === undefined || index === undefined || data === undefined)
        return self;
      if (!self.sections[sectionId]) {
        self.sections[sectionId] = [];
      }
      self.sections[sectionId].splice(Number(index) + 1, 0, data);
      return self;
    },
    /**
     * append data after a section
     * @memberOf Infinite
     * @param {string} sectionId sectionId for the append cell
     * @param {object} data data to append
     * @return {Infinite}
     */
    append: function (sectionId, data) {
      var self = this;
      if (!self.sections[sectionId]) {
        self.sections[sectionId] = [];
      }
      self.sections[sectionId] = self.sections[sectionId].concat(data);
      return self;
    },
    /**
     * remove some data by sectionId,from,number
     * @memberOf Infinite
     * @param {string} sectionId sectionId for the append cell
     * @param {number} from removed index from
     * @param {number} number removed data number
     * @return {Infinite}
     */
    remove: function (sectionId, from, number) {
      var self = this;
      var number = number || 1;
      if (undefined === sectionId || !self.sections[sectionId])
        return self;
      //remove a section
      if (undefined === from) {
        delete self.sections[sectionId];
        return self;
      }
      //remove some data in section
      if (self.sections[sectionId] && self.sections[sectionId][from]) {
        self.sections[sectionId].splice(from, number);
        return self;
      }
      return self;
    },
    /**
     * replace some data by sectionId and index
     * @memberOf Infinite
     * @param {string} sectionId sectionId to replace
     * @param {number} index removed index from
     * @param {object} data new data to replace
     * @return {Infinite}
     */
    replace: function (sectionId, index, data) {
      var self = this;
      if (undefined === sectionId || !self.sections[sectionId])
        return self;
      self.sections[sectionId][index] = data;
      return self;
    },
    /**
     * get data by sectionId and index
     * @memberOf Infinite
     * @param {string} sectionId sectionId
     * @param {number} index index in the section
     * @return {object} data data
     */
    get: function (sectionId, index) {
      if (undefined === sectionId)
        return;
      if (undefined === index)
        return this.sections[sectionId];
      return this.sections[sectionId][index];
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = Infinite;
  } else if (window.XScroll && window.XScroll.Plugins) {
    return XScroll.Plugins.Infinite = Infinite;
  }
  return exports;
}({});
}());