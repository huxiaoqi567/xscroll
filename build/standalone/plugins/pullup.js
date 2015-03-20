;(function() {
var util, base, plugins_pullup, _events_;
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
plugins_pullup = function (exports) {
  var Util = util;
  var Base = base;
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
  var PullUp = function (cfg) {
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
    pluginInitializer: function (xscroll) {
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
    pluginDestructor: function () {
      var self = this;
      self.pullup && self.pullup.remove();
      self.xscroll.off('scrollend', self._scrollEndHandler, self);
      self.xscroll.off('scroll', self._scrollHandler, self);
      self.xscroll.off('pan', self._panHandler, self);
      self.xscroll.boundry.resetBottom();
      self.__isRender = false;
      self._evtBinded = false;
      delete self;
    },
    /**
     * render pullup plugin
     * @memberOf PullUp
     * @return {PullUp}
     */
    render: function () {
      var self = this;
      if (self.__isRender)
        return;
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
      Util.addClass(pullup, clsPrefix + self.status);
      pullup.innerHTML = self.userConfig[self.status + 'Content'] || self.userConfig.content;
      self._bindEvt();
      return self;
    },
    _bindEvt: function () {
      var self = this;
      if (self._evtBinded)
        return;
      self._evtBinded = true;
      var pullup = self.pullup;
      var xscroll = self.xscroll;
      xscroll.on('pan', self._panHandler, self);
      //load width a buffer
      if (self.userConfig.bufferHeight > 0) {
        xscroll.on('scroll', self._scrollHandler, self);
      }
      //bounce bottom
      xscroll.on('scrollend', self._scrollEndHandler, self);
      return self;
    },
    _scrollEndHandler: function (e) {
      var self = this, xscroll = self.xscroll;
      if (e.scrollTop == xscroll.containerHeight - xscroll.height + self.userConfig.height) {
        self._changeStatus('loading');
      }
      return self;
    },
    _scrollHandler: function (e) {
      var self = this, xscroll = self.xscroll;
      if (!self.isLoading && Math.abs(e.scrollTop) + xscroll.height + self.userConfig.height + self.userConfig.bufferHeight >= xscroll.containerHeight + xscroll.boundry._xtop + xscroll.boundry._xbottom) {
        self._changeStatus('loading');
      }
      return self;
    },
    _panHandler: function (e) {
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
    _changeStatus: function (status) {
      if (status != 'loading' && this.isLoading)
        return;
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
    complete: function () {
      var self = this;
      var xscroll = self.xscroll;
      self.isLoading = false;
      self._changeStatus('up');
      return self;
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = PullUp;
  } else if (window.XScroll && window.XScroll.Plugins) {
    return XScroll.Plugins.PullUp = PullUp;
  }
  return exports;
}({});
}());