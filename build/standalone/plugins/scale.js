;(function() {
var util, base, timer, animate, plugins_scale, _events_, _easing_;
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
_easing_ = function (exports) {
  //easing
  var Easing = {
    'linear': [
      0,
      0,
      1,
      1
    ],
    'ease': [
      0.25,
      0.1,
      0.25,
      1
    ],
    'ease-out': [
      0,
      0,
      0.58,
      1
    ],
    'ease-in-out': [
      0.42,
      0,
      0.58,
      1
    ],
    'quadratic': [
      0.33,
      0.66,
      0.66,
      1
    ],
    'circular': [
      0.1,
      0.57,
      0.1,
      1
    ],
    'bounce': [
      0.71,
      1.35,
      0.47,
      1.41
    ],
    format: function (easing) {
      if (!easing)
        return;
      if (typeof easing === 'string' && this[easing]) {
        return this[easing] instanceof Array ? [
          ' cubic-bezier(',
          this[easing],
          ') '
        ].join('') : this[easing];
      }
      if (easing instanceof Array) {
        return [
          ' cubic-bezier(',
          easing,
          ') '
        ].join('');
      }
      return easing;
    }
  };
  if (typeof module == 'object' && module.exports) {
    exports = Easing;
  } else {
    return Easing;
  }
  return exports;
}({});
timer = function (exports) {
  var Util = util;
  var Base = base;
  var Easing = _easing_;
  var RAF = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
  var vendors = [
    'webkit',
    'moz',
    'ms',
    'o'
  ];
  var cancelRAF = window.cancelAnimationFrame;
  for (var i = 0; i < vendors.length; i++) {
    if (window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame']) {
      cancelRAF = window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
    }
  }
  cancelRAF = cancelRAF || window.clearTimeout;
  function Bezier(x1, y1, x2, y2, epsilon) {
    var curveX = function (t) {
      var v = 1 - t;
      return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
    };
    var curveY = function (t) {
      var v = 1 - t;
      return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
    };
    var derivativeCurveX = function (t) {
      var v = 1 - t;
      return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (-t * t * t + 2 * v * t) * x2;
    };
    return function (t) {
      var x = t, t0, t1, t2, x2, d2, i;
      // First try a few iterations of Newton's method -- normally very fast.
      for (t2 = x, i = 0; i < 8; i++) {
        x2 = curveX(t2) - x;
        if (Math.abs(x2) < epsilon)
          return curveY(t2);
        d2 = derivativeCurveX(t2);
        if (Math.abs(d2) < 0.000001)
          break;
        t2 = t2 - x2 / d2;
      }
      t0 = 0, t1 = 1, t2 = x;
      if (t2 < t0)
        return curveY(t0);
      if (t2 > t1)
        return curveY(t1);
      // Fallback to the bisection method for reliability.
      while (t0 < t1) {
        x2 = curveX(t2);
        if (Math.abs(x2 - x) < epsilon)
          return curveY(t2);
        if (x > x2)
          t0 = t2;
        else
          t1 = t2;
        t2 = (t1 - t0) * 0.5 + t0;
      }
      // Failure
      return curveY(t2);
    };
  }
  function Timer(cfg) {
    var self = this;
    self.cfg = Util.mix({ easing: 'linear' }, cfg);
  }
  Timer.MIN_DURATION = 1;
  Util.extend(Timer, Base, {
    reset: function (cfg) {
      var self = this;
      Util.mix(self.cfg, cfg);
      self.isfinished = false;
      self.percent = 0;
      delete self._stop;
    },
    run: function () {
      var self = this;
      var duration = self.cfg.duration;
      if (duration <= Timer.MIN_DURATION) {
        self.isfinished = true;
        self.trigger('run', { percent: 1 });
        self.trigger('end', { percent: 1 });
      }
      if (self.isfinished)
        return;
      self._hasFinishedPercent = self._stop && self._stop.percent || 0;
      delete self._stop;
      self.start = Date.now();
      self.percent = 0;
      // epsilon determines the precision of the solved values
      var epsilon = 1000 / 60 / duration / 4;
      var b = Easing[self.cfg.easing];
      self.easingFn = Bezier(b[0], b[1], b[2], b[3], epsilon);
      self._run();
    },
    _run: function () {
      var self = this;
      cancelRAF(self._raf);
      self._raf = RAF(function () {
        self.now = Date.now();
        self.duration = self.now - self.start >= self.cfg.duration ? self.cfg.duration : self.now - self.start;
        self.progress = self.easingFn(self.duration / self.cfg.duration);
        self.percent = self.duration / self.cfg.duration + self._hasFinishedPercent;
        if (self.percent >= 1 || self._stop) {
          self.percent = self._stop && self._stop.percent ? self._stop.percent : 1;
          self.duration = self._stop && self._stop.duration ? self._stop.duration : self.duration;
          var param = { percent: self.percent };
          self.trigger('stop', param);
          if (self.percent >= 1) {
            self.isfinished = true;
            self.trigger('end', { percent: 1 });
          }
          return;
        }
        self.trigger('run', { percent: self.progress });
        self._run();
      });
    },
    stop: function () {
      var self = this;
      self._stop = {
        percent: self.percent,
        now: self.now
      };
      cancelRAF(self._raf);
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = Timer;
  } else {
    return Timer;
  }
  return exports;
}({});
animate = function (exports) {
  var Util = util;
  var Timer = timer;
  var Easing = _easing_;
  var Base = base;
  //transform
  var vendorTransform = Util.prefixStyle('transform');
  //transition webkitTransition MozTransition OTransition msTtransition
  var vendorTransition = Util.prefixStyle('transition');
  var vendorTransitionDuration = Util.prefixStyle('transitionDuration');
  var vendorTransformOrigin = Util.prefixStyle('transformOrigin');
  var vendorTransitionEnd = Util.vendor ? Util.prefixStyle('transitionEnd') : 'transitionend';
  var vendorTransformStr = Util.vendor ? [
    '-',
    Util.vendor,
    '-transform'
  ].join('') : 'transform';
  var translateTpl = 'translateX({translateX}px) translateY({translateY}px) translateZ(0)';
  //limit attrs
  var animAttrs = {
    'transform': true,
    'opacity': true,
    'scrollTop': true,
    'scrollLeft': true
  };
  function myParse(v) {
    return Math.round(parseFloat(v) * 100000) / 100000;
  }
  function defaultDecompose() {
    return {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      skewX: 0,
      skewY: 0,
      scaleX: 1,
      scaleY: 1
    };
  }
  function toMatrixArray(matrix) {
    matrix = matrix.split(/,/);
    matrix = Array.prototype.map.call(matrix, function (v) {
      return myParse(v);
    });
    return matrix;
  }
  function decomposeMatrix(matrix) {
    matrix = toMatrixArray(matrix);
    var scaleX, scaleY, skew, A = matrix[0], B = matrix[1], C = matrix[2], D = matrix[3];
    // Make sure matrix is not singular
    if (A * D - B * C) {
      scaleX = Math.sqrt(A * A + B * B);
      skew = (A * C + B * D) / (A * D - C * B);
      scaleY = (A * D - B * C) / scaleX;
      // step (6)
      if (A * D < B * C) {
        skew = -skew;
        scaleX = -scaleX;
      }
    } else {
      // In this case the elem shouldn't be rendered, hence scale == 0
      scaleX = scaleY = skew = 0;
    }
    // The recomposition order is very important
    // see http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp#l971
    return {
      translateX: myParse(matrix[4]),
      translateY: myParse(matrix[5]),
      rotate: myParse(Math.atan2(B, A) * 180 / Math.PI),
      skewX: myParse(Math.atan(skew) * 180 / Math.PI),
      skewY: 0,
      scaleX: myParse(scaleX),
      scaleY: myParse(scaleY)
    };
  }
  function getTransformInfo(transform) {
    transform = transform.split(')');
    var trim = Util.trim, i = -1, l = transform.length - 1, split, prop, val, ret = defaultDecompose();
    // Loop through the transform properties, parse and multiply them
    while (++i < l) {
      split = transform[i].split('(');
      prop = trim(split[0]);
      val = split[1];
      switch (prop) {
      case 'translateX':
      case 'translateY':
      case 'scaleX':
      case 'scaleY':
        ret[prop] = myParse(val);
        break;
      case 'translate':
      case 'translate3d':
        val = val.split(',');
        ret.translateX = myParse(val[0]);
        ret.translateY = myParse(val[1] || 0);
        break;
      case 'scale':
        val = val.split(',');
        ret.scaleX = myParse(val[0]);
        ret.scaleY = myParse(val[1] || val[0]);
        break;
      case 'matrix':
        return decomposeMatrix(val);
      }
    }
    return ret;
  }
  /**
  * animate function
  * @constructor
  * @param {HTMLElement} el element to animate
  * @param {object} config config for animate
  * @extends {Base}
  */
  function Animate(el, cfg) {
    if (!el || !cfg || !cfg.css)
      return;
    var self = this;
    self.cfg = cfg;
    self.el = el;
    var duration = cfg.duration || 0, easing = cfg.easing || 'ease', delay = cfg.delay || 0;
    //trigger run
    if (cfg.run) {
      //frame animate
      self.timer = self.timer || new Timer({
        duration: Math.round(duration),
        easing: easing
      });
      self.timer.on('run', cfg.run);
    }
    self._bindEvt();
    return self;
  }
  function computeTransform(prevTransform, destTransform) {
    var transform = getTransformInfo(prevTransform);
    var dest = getTransformInfo(destTransform);
    var trans = {};
    for (var i in dest) {
      trans[i] = {
        prevVal: transform[i],
        newVal: dest[i]
      };
    }
    return trans;
  }
  //for scroll only
  function setStyle(el, styleName, prevVal, newVal, percent) {
    prevVal = isNaN(Number(prevVal)) ? 0 : Number(prevVal);
    var curVal = (newVal - prevVal) * percent + prevVal;
    css(el, styleName, curVal);
  }
  function css(el, styleName, val) {
    switch (styleName) {
    case 'scrollTop':
    case 'scrollLeft':
      el[styleName] = val;
      break;
    case 'transform':
      el.style[vendorTransform] = val;
    case 'opacity':
      el.style[styleName] = val;
      break;
    }
  }
  Util.extend(Animate, Base, {
    /**
     * to start the animation
     * @memberof Animate
     * @return {Animate}
     */
    run: function () {
      var self = this;
      var cfg = self.cfg, el = self.el, duration = cfg.duration || 0, easing = cfg.easing || 'ease', delay = cfg.delay || 0;
      self.__isTransitionEnd = false;
      clearTimeout(self.__itv);
      self.timer && self.timer.run();
      if (duration <= Timer.MIN_DURATION) {
        for (var i in cfg.css) {
          css(el, i, cfg.css[i]);
        }
        self.stop();
        self.__handlers.stop.call(self);
        return;
      }
      if (cfg.useTransition) {
        //transition
        el.style[vendorTransition] = Util.substitute('all {duration}ms {easing} {delay}ms', {
          duration: Math.round(duration),
          easing: Easing.format(easing),
          delay: delay
        });
        for (var i in cfg.css) {
          //set css
          css(el, i, cfg.css[i]);
        }
        self.__itv = setTimeout(function () {
          if (!self.__isTransitionEnd) {
            self.__isTransitionEnd = true;
            self.trigger('transitionend');
          }
        }, Number(duration) + 60);
      } else {
        var computeStyle = window.getComputedStyle(el);
        //transform
        if (cfg.css.transform) {
          var transmap = self.transmap = computeTransform(computeStyle[vendorTransform], cfg.css.transform);
          self.timer && self.timer.off('run', self.__handlers.transRun);
          self.timer && self.timer.on('run', self.__handlers.transRun, self);
        }
      }
      return self;
    },
    _transitionEndHandler: function (e) {
      var self = this;
      self.stop();
      self.__handlers.stop.call(self);
    },
    __handlers: {
      transRun: function (e) {
        var self = this;
        var transmap = self.transmap;
        var el = self.el;
        var newTrans = {};
        for (var i in transmap) {
          newTrans[i] = (transmap[i].newVal - transmap[i].prevVal) * e.percent + transmap[i].prevVal;
        }
        var ret = Util.substitute(translateTpl + ' ' + 'scale({scaleX},{scaleY})', newTrans);
        el.style[vendorTransform] = ret;
      },
      stop: function (e) {
        var self = this;
        var cfg = self.cfg;
        cfg.end && cfg.end({ percent: 1 });
      }
    },
    _bindEvt: function () {
      var self = this;
      var cfg = self.cfg;
      self.el.addEventListener(vendorTransitionEnd, function (e) {
        self.__isTransitionEnd = true;
        if (e.target !== e.currentTarget)
          return;
        self.trigger('transitionend', e);
      });
      self.on('transitionend', self._transitionEndHandler, self);
      var cssRun = function (e) {
        for (var i in cfg.css) {
          if (!/transform/.test(i)) {
            setStyle(el, i, computeStyle[i], cfg.css[i], e.percent);
          }
        }
      };
      self.timer && self.timer.on('run', cssRun);
      self.timer && self.timer.on('stop', self.__handlers.stop, self);
    },
    /**
     * to stop the animation
     * @memberof Animate
     * @return {Animate}
     */
    stop: function () {
      var self = this;
      if (self.cfg.useTransition && self.cfg.duration > Timer.MIN_DURATION) {
        var computeStyle = window.getComputedStyle(this.el);
        for (var i in self.cfg.css) {
          if (animAttrs[i]) {
            var value = /transform/.test(i) ? computeStyle[vendorTransform] : computeStyle[i];
            css(self.el, i, Util.substitute(translateTpl + ' ' + 'scale({scaleX},{scaleY})', getTransformInfo(value)));
          }
        }
        self.el.style[vendorTransition] = 'none';
      }
      self.timer && self.timer.stop() && self.timer.reset();
      return self;
    },
    /**
     * to reset the animation to a new state
     * @memberof Animate
     * @param {object} cfg cfg for new animation
     * @return {Animate}
     */
    reset: function (cfg) {
      var self = this;
      Util.mix(self.cfg, cfg);
      this.timer && self.timer.reset({
        duration: Math.round(self.cfg.duration),
        easing: self.cfg.easing
      });
      return self;
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = Animate;
  } else {
    return Animate;
  }
  return exports;
}({});
plugins_scale = function (exports) {
  var Util = util, Base = base, Animate = animate;
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
  var Scale = function (cfg) {
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
    pluginInitializer: function (xscroll) {
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
    pluginDestructor: function () {
      var self = this;
      var xscroll = self.xscroll;
      xscroll.off('doubletap', self._doubleTapHandler, self);
      xscroll.off('pinchstart', self._pinchStartHandler, self);
      xscroll.off('pinch', self._pinchHandler, self);
      xscroll.off('pinchend', self._pinchEndHandler, self);
      return self;
    },
    _doubleTapHandler: function (e) {
      var self = this;
      var xscroll = self.xscroll;
      var minScale = self.userConfig.minScale;
      var maxScale = self.userConfig.maxScale;
      self.originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
      self.originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
      xscroll.scale > self.minScale ? self.scaleTo(minScale, self.originX, self.originY, 200) : self.scaleTo(maxScale, self.originX, self.originY, 200);
      return self;
    },
    _pinchStartHandler: function (e) {
      var self = this;
      var xscroll = self.xscroll;
      //disable pan gesture
      xscroll.mc.get('pan').set({ enable: false });
      xscroll.stop();
      self.isScaling = false;
      self.scale = xscroll.scale;
      self.originX = (e.center.x - xscroll.x) / xscroll.containerWidth;
      self.originY = (e.center.y - xscroll.y) / xscroll.containerHeight;
    },
    _pinchHandler: function (e) {
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
      self.xscroll.translate(xscroll.x, xscroll.y, __scale);
    },
    _pinchEndHandler: function (e) {
      var self = this;
      var originX = self.originX;
      var originY = self.originY;
      var xscroll = self.xscroll;
      if (xscroll.scale < self.minScale) {
        self.scaleTo(self.minScale, originX, originY, SCALE_TO_DURATION, 'ease-out');
      } else if (xscroll.scale > self.maxScale) {
        self.scaleTo(self.maxScale, originX, originY, SCALE_TO_DURATION, 'ease-out');
      } else {
        xscroll.mc.get('pan').set({ enable: true });
      }
    },
    _bindEvt: function () {
      var self = this;
      var xscroll = self.xscroll;
      xscroll.on('doubletap', self._doubleTapHandler, self);
      xscroll.on('pinchstart', self._pinchStartHandler, self);
      xscroll.on('pinch', self._pinchHandler, self);
      xscroll.on('pinchend', self._pinchEndHandler, self);
      return self;
    },
    _scale: function (scale, originX, originY) {
      var self = this;
      var xscroll = self.xscroll;
      var boundry = self.xscroll.boundry;
      if (xscroll.scale == scale || !scale)
        return;
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
    scaleTo: function (scale, originX, originY, duration, easing, callback) {
      var self = this;
      var xscroll = self.xscroll;
      //unscalable
      if (xscroll.scale == scale || !scale)
        return;
      var duration = duration || SCALE_TO_DURATION;
      var easing = easing || 'ease-out';
      // transitionStr = [transformStr, " ", duration , "s ", easing, " 0s"].join("");
      self._scale(scale, originX, originY);
      xscroll._animate('x', 'translateX(' + xscroll.x + 'px) scale(' + scale + ')', duration, easing, callback);
      xscroll._animate('y', 'translateY(' + xscroll.y + 'px)', duration, easing, callback);
      self.scaleHandler = self.scaleHandler || function (e) {
        var _scale = (scale - scaleStart) * e.percent + scaleStart;
        //trigger scroll event
        self.trigger('scale', {
          scale: _scale,
          origin: {
            x: originX,
            y: originY
          }
        });
      };
      self.scaleendHandler = self.scaleendHandler || function (e) {
        self.isScaling = false;
        //enable pan gesture
        xscroll.mc.get('pan').set({ enable: true });
        self.trigger('scaleend', {
          type: 'scaleend',
          scale: self.scale,
          origin: {
            x: originX,
            y: originY
          }
        });
      };
      xscroll.__timers.x.timer.off('run', self._scaleHandler, self);
      xscroll.__timers.x.timer.on('run', self._scaleHandler, self);
      xscroll.__timers.x.timer.off('stop', self.scaleendHandler, self);
      xscroll.__timers.x.timer.on('stop', self.scaleendHandler, self);
      self.trigger('scaleanimate', {
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
  if (typeof module == 'object' && module.exports) {
    exports = Scale;
  } else if (window.XScroll && window.XScroll.Plugins) {
    return XScroll.Plugins.Scale = Scale;
  }
  return exports;
}({});
}());