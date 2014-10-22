;(function() {
var util, pan, tap, pinch, scrollbar, swipeedit, core, _event_, _pulldown_;
util = function (exports) {
  var Util = {
    mix: function (to, from) {
      for (var i in from) {
        to[i] = from[i];
      }
      return to;
    },
    extend: function (superClass, subClass, attrs) {
      this.mix(subClass.prototype, superClass.prototype);
      subClass.prototype.super = superClass;
      this.mix(subClass.prototype, attrs);
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
      return el && el.className && el.className.indexOf(className) != -1;
    },
    addClass: function (el, className) {
      if (el && !this.hasClass(el, className)) {
        el.className += ' ' + className;
      }
    },
    removeClass: function (el, className) {
      if (el && el.className) {
        el.className = el.className.replace(className, '');
      }
    }
  };
  if (typeof module == 'object' && module.exports) {
    exports = Util;
  } else {
    return Util;
  }
  return exports;
}({});
_event_ = function (exports) {
  var Util = util;
  var gestures = {};
  var Gesture = {
    on: function (el, type, handler) {
      el.addEventListener(type, handler);
      this.target = el;
      return this;
    },
    detach: function (el, type, handler) {
      this.target = null;
      el.removeEventListener(type, handler);
      return this;
    },
    dispatchEvent: function (tgt, type, args) {
      var event = document.createEvent('Event');
      event.initEvent(type, true, true);
      Util.mix(event, args);
      tgt.dispatchEvent(event);
    },
    GESTURE_PREFIX: 'xs',
    prefix: function (evt) {
      return this.GESTURE_PREFIX + evt[0].toUpperCase() + evt.slice(1);
    }
  };
  if (typeof module == 'object' && module.exports) {
    exports = Gesture;
  } else {
    return Gesture;
  }
  return exports;
}({});
pan = function (exports) {
  var Util = util;
  var Event = _event_;
  var doc = window.document;
  var PAN_START = Event.prefix('panstart'), PAN_END = Event.prefix('panend'), PAN = Event.prefix('pan'), MIN_SPEED = 0.35, MAX_SPEED = 8;
  var touch = {}, record = [];
  var startX = 0;
  var startY = 0;
  function touchMoveHandler(e) {
    if (e.touches.length > 1)
      return;
    if (this.gestureType && this.gestureType != 'pan')
      return;
    if (this.gestureType == '') {
      record = [];
    }
    if (!record.length) {
      touch = {};
      touch.startX = e.touches[0].clientX;
      touch.startY = e.touches[0].clientY;
      touch.deltaX = 0;
      touch.deltaY = 0;
      e.touch = touch;
      touch.prevX = touch.startX;
      touch.prevY = touch.startY;
      record.push({
        deltaX: touch.deltaX,
        deltaY: touch.deltaY,
        timeStamp: e.timeStamp
      });
      //be same to kissy
      e.deltaX = touch.deltaX;
      e.deltaY = touch.deltaY;
      this.gestureType = 'pan';
      Event.dispatchEvent(e.target, PAN_START, e);
    } else {
      if (this.gestureType != 'pan')
        return;
      touch.deltaX = e.touches[0].clientX - touch.startX;
      touch.deltaY = e.touches[0].clientY - touch.startY;
      touch.directionX = e.touches[0].clientX - touch.prevX > 0 ? 'right' : 'left';
      touch.directionY = e.touches[0].clientY - touch.prevY > 0 ? 'bottom' : 'top';
      touch.prevX = e.touches[0].clientX;
      touch.prevY = e.touches[0].clientY;
      e.touch = touch;
      record.push({
        deltaX: touch.deltaX,
        deltaY: touch.deltaY,
        timeStamp: e.timeStamp
      });
      //be same to kissy
      e.deltaX = touch.deltaX;
      e.deltaY = touch.deltaY;
      e.velocityX = 0;
      e.velocityY = 0;
      e.directionX = touch.directionX;
      e.directionY = touch.directionY;
      // if (!e.isPropagationStopped()) {
      Event.dispatchEvent(e.target, PAN, e);
    }
  }
  function touchEndHandler(e) {
    var flickStartIndex = 0, flickStartYIndex = 0, flickStartXIndex = 0;
    if (e.touches.length > 1)
      return;
    touch.deltaX = e.changedTouches[0].clientX - touch.startX;
    touch.deltaY = e.changedTouches[0].clientY - touch.startY;
    //be same to kissy
    e.deltaX = touch.deltaX;
    e.deltaY = touch.deltaY;
    e.touch = touch;
    e.touch.record = record;
    var startX = e.touch.startX;
    var startY = e.touch.startY;
    var len = record.length;
    var startTime = record[0] && record[0]['timeStamp'];
    if (len < 2 || !startTime)
      return;
    var duration = record[len - 1]['timeStamp'] - record[0]['timeStamp'];
    for (var i in record) {
      if (i > 0) {
        //速度 标量
        record[i]['velocity'] = distance(record[i]['deltaX'], record[i]['deltaY'], record[i - 1]['deltaX'], record[i - 1]['deltaY']) / (record[i]['timeStamp'] - record[i - 1]['timeStamp']);
        //水平速度 矢量
        record[i]['velocityX'] = (record[i]['deltaX'] - record[i - 1]['deltaX']) / (record[i]['timeStamp'] - record[i - 1]['timeStamp']);
        //垂直速度 矢量
        record[i]['velocityY'] = (record[i]['deltaY'] - record[i - 1]['deltaY']) / (record[i]['timeStamp'] - record[i - 1]['timeStamp']);
      } else {
        record[i]['velocity'] = 0;
        record[i]['velocityX'] = 0;
        record[i]['velocityY'] = 0;
      }
    }
    //第一个速度的矢量方向
    var flagX = record[0]['velocityX'] / Math.abs(record[0]['velocityX']);
    for (var i in record) {
      //计算正负极性
      if (record[i]['velocityX'] / Math.abs(record[i]['velocityX']) != flagX) {
        flagX = record[i]['velocityX'] / Math.abs(record[i]['velocityX']);
        //如果方向发生变化 则新起点
        flickStartXIndex = i;
      }
    }
    //第一个速度的矢量方向
    var flagY = record[0]['velocityY'] / Math.abs(record[0]['velocityY']);
    for (var i in record) {
      //计算正负极性
      if (record[i]['velocityY'] / Math.abs(record[i]['velocityY']) != flagY) {
        flagY = record[i]['velocityY'] / Math.abs(record[i]['velocityY']);
        //如果方向发生变化 则新起点
        flickStartYIndex = i;
      }
    }
    flickStartIndex = Math.max(flickStartXIndex, flickStartYIndex);
    //起点
    var flickStartRecord = record[flickStartIndex];
    //移除前面没有用的点
    e.touch.record = e.touch.record.splice(flickStartIndex - 1);
    var velocityObj = getSpeed(e.touch.record);
    e.velocityX = Math.abs(velocityObj.velocityX) > MAX_SPEED ? velocityObj.velocityX / Math.abs(velocityObj.velocityX) * MAX_SPEED : velocityObj.velocityX;
    e.velocityY = Math.abs(velocityObj.velocityY) > MAX_SPEED ? velocityObj.velocityY / Math.abs(velocityObj.velocityY) * MAX_SPEED : velocityObj.velocityY;
    e.velocity = Math.sqrt(Math.pow(e.velocityX, 2) + Math.pow(e.velocityY, 2));
    touch = {};
    record = [];
    if (this.gestureType == 'pan') {
      Event.dispatchEvent(e.target, PAN_END, e);
      this.gestureType = '';
    }
  }
  function distance(x, y, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2));
  }
  function getSpeed(record) {
    var velocityY = 0;
    var velocityX = 0;
    var len = record.length;
    for (var i = 0; i < len; i++) {
      velocityY += record[i]['velocityY'];
      velocityX += record[i]['velocityX'];
    }
    velocityY /= len;
    velocityX /= len;
    //手指反弹的误差处理
    return {
      velocityY: Math.abs(record[len - 1]['velocityY']) > MIN_SPEED ? velocityY : 0,
      velocityX: Math.abs(record[len - 1]['velocityX']) > MIN_SPEED ? velocityX : 0
    };
  }
  document.addEventListener('touchmove', touchMoveHandler);
  document.addEventListener('touchend', touchEndHandler);
  var Pan = {
    PAN_START: PAN_START,
    PAN_END: PAN_END,
    PAN: PAN
  };
  if (typeof module == 'object' && module.exports) {
    exports = Pan;
  } else {
    return Pan;
  }
  return exports;
}({});
tap = function (exports) {
  var Util = util;
  var Event = _event_;
  var TAP = Event.prefix('tap');
  var TAP_HOLD = Event.prefix('tapHold');
  var SINGLE_TAP = Event.prefix('singleTap');
  var DOUBLE_TAP = Event.prefix('doubleTap');
  var tap_max_touchtime = 250, tap_max_distance = 10, tap_hold_delay = 750, single_tap_delay = 200;
  var touches = [];
  var singleTouching = false;
  var tapHoldTimer = null;
  var doubleTapTimmer = null;
  function clearTouchArray() {
    if (touches.length > 2) {
      var tmpArray = [];
      for (var i = 1; i < touches.length; i++) {
        tmpArray[i - 1] = touches[i];
      }
      touches = tmpArray;
    }
  }
  /*排除多次绑定中的单次点击的多次记录*/
  function shouldExcludeTouches(touch) {
    clearTouchArray();
    if (touches.length == 0) {
      return false;
    }
    var duration = touch.startTime - touches[touches.length - 1].startTime;
    /*判断是同一次点击*/
    if (duration < 10) {
      return true;
    } else {
      return false;
    }
  }
  function checkDoubleTap() {
    clearTouchArray();
    if (touches.length == 1) {
      return false;
    }
    var duration = touches[1].startTime - touches[0].startTime;
    if (duration < single_tap_delay) {
      return true;
    } else {
      return false;
    }
  }
  function touchStart(e) {
    if (e.touches.length > 1) {
      singleTouching = false;
      return;
    }
    var currentTarget = e.currentTarget;
    var target = e.target;
    var startX = e.changedTouches[0].clientX;
    var startY = e.changedTouches[0].clientY;
    singleTouching = {
      startX: startX,
      startY: startY,
      startTime: Number(new Date()),
      e: e
    };
    /*tapHold*/
    if (tapHoldTimer) {
      clearTimeout(tapHoldTimer);
    }
    var target = e.target;
    tapHoldTimer = setTimeout(function () {
      if (singleTouching) {
        var eProxy = {};
        Util.mix(eProxy, e);
        Util.mix(eProxy, {
          type: TAP_HOLD,
          pageX: startX,
          pageY: startY,
          originalEvent: e
        });
        Event.dispatchEvent(e.target, TAP_HOLD, eProxy);
      }
      clearTimeout(tapHoldTimer);
    }, tap_hold_delay);
  }
  function touchEnd(e) {
    if (!singleTouching) {
      return;
    }
    var endX = e.changedTouches[0].clientX;
    var endY = e.changedTouches[0].clientY;
    var deltaX = Math.abs(endX - singleTouching.startX);
    //滑过的距离
    var deltaY = Math.abs(endY - singleTouching.startY);
    //滑过的距离
    Util.mix(singleTouching, {
      endX: endX,
      endY: endY,
      distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
      timeSpan: Number(Number(new Date()) - singleTouching.startTime)
    });
    // console.log
    if (singleTouching.timeSpan > tap_max_touchtime) {
      singleTouching = false;
      return;
    }
    if (singleTouching.distance > tap_max_distance) {
      singleTouching = false;
      return;
    }
    /*
    同时绑定singleTap和doubleTap时，
    一次点击push了两次singleTouching，应该只push一次
    */
    if (!shouldExcludeTouches(singleTouching)) {
      touches.push(singleTouching);
    } else {
      return;
    }
    clearTouchArray();
    var eProxy = {};
    Util.mix(eProxy, e);
    Util.mix(eProxy, {
      type: TAP,
      pageX: endX,
      pageY: endY,
      originalEvent: e
    });
    var target = e.target;
    /*先触发tap，再触发doubleTap*/
    Event.dispatchEvent(target, TAP, eProxy);
    /*doubleTap 和 singleTap 互斥*/
    if (doubleTapTimmer) {
      if (checkDoubleTap()) {
        Util.mix(eProxy, { type: DOUBLE_TAP });
        Event.dispatchEvent(target, DOUBLE_TAP, eProxy);
      }
      clearTimeout(doubleTapTimmer);
      doubleTapTimmer = null;
      return;
    }
    doubleTapTimmer = setTimeout(function () {
      clearTimeout(doubleTapTimmer);
      doubleTapTimmer = null;
      Util.mix(eProxy, { type: SINGLE_TAP });
      Event.dispatchEvent(target, SINGLE_TAP, eProxy);
    }, single_tap_delay);
  }
  document.addEventListener('touchstart', touchStart);
  document.addEventListener('touchend', touchEnd);
  var Tap = {
    TAP: TAP,
    TAP_HOLD: TAP_HOLD,
    SINGLE_TAP: SINGLE_TAP,
    DOUBLE_TAP: DOUBLE_TAP
  };
  if (typeof module == 'object' && module.exports) {
    exports = Tap;
  } else {
    return Tap;
  }
  return exports;
}({});
pinch = function (exports) {
  var Util = util;
  var Event = _event_;
  var doc = window.document;
  var PINCH_START = Event.prefix('pinchStart'), PINCH_END = Event.prefix('pinchEnd'), PINCH = Event.prefix('pinch');
  function getDistance(p1, p2) {
    var deltaX = p1.pageX - p2.pageX, deltaY = p1.pageY - p2.pageY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }
  function getOrigin(p1, p2) {
    return {
      pageX: p1.pageX / 2 + p2.pageX / 2,
      pageY: p1.pageY / 2 + p2.pageY / 2
    };
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
    if (!this.isStart) {
      this.isStart = 1;
      this.startDistance = distance;
      this.gestureType = 'pinch';
      Event.dispatchEvent(e.target, PINCH_START, e);
    } else {
      if (this.gestureType != 'pinch')
        return;
      //pinchmove
      e.distance = distance;
      e.scale = distance / this.startDistance;
      e.origin = origin;
      Event.dispatchEvent(e.target, PINCH, e);
    }
  }
  function pinchEndHandler(e) {
    this.isStart = 0;
    if (this.gestureType != 'pinch')
      return;
    if (e.touches.length == 0) {
      Event.dispatchEvent(e.target, PINCH_END, e);
      this.gestureType = '';
    }
  }
  document.addEventListener('touchmove', pinchMoveHandler);
  document.addEventListener('touchend', pinchEndHandler);
  //枚举
  var Pinch = {
    PINCH_START: PINCH_START,
    PINCH: PINCH,
    PINCH_END: PINCH_END
  };
  if (typeof module == 'object' && module.exports) {
    exports = Pinch;
  } else {
    return Pinch;
  }
  return exports;
}({});
scrollbar = function (exports) {
  var Util = util;
  //最短滚动条高度
  var MIN_SCROLLBAR_SIZE = 60;
  //滚动条被卷去剩下的最小高度
  var BAR_MIN_SIZE = 5;
  //transform
  var transform = Util.prefixStyle('transform');
  var transformStr = Util.vendor ? [
    '-',
    Util.vendor,
    '-transform'
  ].join('') : 'transform';
  //transition webkitTransition MozTransition OTransition msTtransition
  var transition = Util.prefixStyle('transition');
  var borderRadius = Util.prefixStyle('borderRadius');
  var events = [];
  var ScrollBar = function (cfg) {
    this.userConfig = cfg;
    this.init(cfg.xscroll);
  };
  Util.mix(ScrollBar.prototype, {
    init: function (xscroll) {
      var self = this;
      // "offsetTop": {
      // },
      // "containerSize": {
      // 	value: 0
      // },
      // "indicateSize": {
      // 	value: 0
      // },
      // "barSize": {
      // 	value: 0
      // },
      // "barOffset": {
      // 	value: 0
      // }
      // self.userConfig = S.merge({
      // 	type:"y"
      // }, self.userConfig);
      self.xscroll = xscroll;
      self.type = self.userConfig.type;
      self.isY = self.type == 'y' ? true : false;
      self.containerSize = self.isY ? self.xscroll.containerHeight : self.xscroll.containerWidth;
      self.indicateSize = self.isY ? self.xscroll.height : self.xscroll.width;
      self.offset = self.xscroll.getOffset();
      self.render();
      self._bindEvt();
    },
    destroy: function () {
      var self = this;
      self.scrollbar && self.scrollbar.remove();
      self.xscroll.detach('scaleanimate', self._update, self);
      self.xscroll.detach('scrollend', self._update, self);
      self.xscroll.detach('scrollanimate', self._update, self);
      for (var i in events) {
        self.xscroll.detach(events[i], self._update, self);
      }
      delete self;
    },
    render: function () {
      var self = this;
      if (self.__isRender)
        return;
      self.__isRender = true;
      var xscroll = self.xscroll;
      var css = self.isY ? 'width: 3px;position:absolute;bottom:5px;top:5px;right:2px;z-index:999;overflow:hidden;-webkit-border-radius:2px;-moz-border-radius:2px;-o-border-radius:2px;' : 'height:3px;position:absolute;left:5px;right:5px;bottom:2px;z-index:999;overflow:hidden;-webkit-border-radius:2px;-moz-border-radius:2px;-o-border-radius:2px;';
      self.scrollbar = document.createElement('div');
      self.scrollbar.style.cssText = css;
      xscroll.renderTo.appendChild(self.scrollbar);
      var size = self.isY ? 'width:100%;' : 'height:100%;';
      self.indicate = document.createElement('div');
      self.indicate.style.cssText = size + 'position:absolute;background:rgba(0,0,0,0.3);-webkit-border-radius:1.5px;-moz-border-radius:1.5px;-o-border-radius:1.5px;';
      self.scrollbar.appendChild(self.indicate);
      self._update();
    },
    _update: function (offset, duration, easing) {
      var self = this;
      var offset = offset || self.xscroll.getOffset();
      var barInfo = self.computeScrollBar(offset);
      var size = self.isY ? 'height' : 'width';
      self.indicate.style[size] = barInfo.size + 'px';
      if (duration && easing) {
        self.scrollTo(barInfo.offset, duration, easing);
      } else {
        self.moveTo(barInfo.offset);
      }
    },
    //计算边界碰撞时的弹性
    computeScrollBar: function (offset) {
      var self = this;
      var type = self.isY ? 'y' : 'x';
      var offset = offset && -offset[type];
      self.containerSize = self.isY ? self.xscroll.containerHeight : self.xscroll.containerWidth;
      self.indicateSize = self.isY ? self.xscroll.height : self.xscroll.width;
      //滚动条容器高度
      var indicateSize = self.indicateSize;
      var containerSize = self.containerSize;
      var ratio = offset / containerSize;
      var barOffset = indicateSize * ratio;
      var barSize = indicateSize * indicateSize / containerSize;
      var _barOffset = barOffset * (indicateSize - MIN_SCROLLBAR_SIZE + barSize) / indicateSize;
      if (barSize < MIN_SCROLLBAR_SIZE) {
        barSize = MIN_SCROLLBAR_SIZE;
        barOffset = _barOffset;
      }
      //顶部回弹
      if (barOffset < 0) {
        barOffset = Math.abs(offset) * barSize / MIN_SCROLLBAR_SIZE > barSize - BAR_MIN_SIZE ? BAR_MIN_SIZE - barSize : offset * barSize / MIN_SCROLLBAR_SIZE;
      } else if (barOffset + barSize > indicateSize) {
        //底部回弹
        var _offset = offset - containerSize + indicateSize;
        if (_offset * barSize / MIN_SCROLLBAR_SIZE > barSize - BAR_MIN_SIZE) {
          barOffset = indicateSize - BAR_MIN_SIZE;
        } else {
          barOffset = indicateSize - barSize + _offset * barSize / MIN_SCROLLBAR_SIZE;
        }
      }
      self.barOffset = barOffset;
      var result = { size: barSize };
      var _offset = {};
      _offset[type] = barOffset;
      result.offset = _offset;
      return result;
    },
    scrollTo: function (offset, duration, easing) {
      var self = this;
      self.isY ? self.indicate.style[transform] = 'translateY(' + offset.y + 'px) translateZ(0)' : self.indicate.style[transform] = 'translateX(' + offset.x + 'px)  translateZ(0)';
      self.indicate.style[transition] = [
        'all ',
        duration,
        's ',
        easing,
        ' 0'
      ].join('');
    },
    moveTo: function (offset) {
      var self = this;
      self.show();
      self.isY ? self.indicate.style[transform] = 'translateY(' + offset.y + 'px)  translateZ(0)' : self.indicate.style[transform] = 'translateX(' + offset.x + 'px)  translateZ(0)';
      self.indicate.style[transition] = '';
    },
    _bindEvt: function () {
      var self = this;
      if (self.__isEvtBind)
        return;
      self.__isEvtBind = true;
      var type = self.isY ? 'y' : 'x';
      self.xscroll.on('scaleanimate', function (e) {
        self._update(e.offset);
      });
      self.xscroll.on('pan', function (e) {
        self._update(e.offset);
      });
      self.xscroll.on('scrollend', function (e) {
        if (e.zoomType.indexOf(type) > -1) {
          self._update(e.offset);
        }
      });
      self.xscroll.on('scrollanimate', function (e) {
        if (e.zoomType != type)
          return;
        self._update(e.offset, e.duration, e.easing);
      });
    },
    reset: function () {
      var self = this;
      self.offset = {
        x: 0,
        y: 0
      };
      self._update();
    },
    hide: function () {
      var self = this;
      self.scrollbar.style.opacity = 0;
      self.scrollbar.style[transition] = 'opacity 0.3s ease-out';
    },
    show: function () {
      var self = this;
      self.scrollbar.style.opacity = 1;
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = ScrollBar;
  } else {
    return ScrollBar;
  }
  return exports;
}({});
_pulldown_ = function (exports) {
  var Util = util;
  var prefix;
  var containerCls;
  var content = 'Pull Down To Refresh';
  var loadingContent = 'Loading...';
  var PullDown = function (cfg) {
    this.init(cfg);
  };
  Util.mix(PullDown.prototype, {
    init: function (cfg) {
      var self = this;
      self.__events = {};
      self.userConfig = Util.mix({
        content: content,
        height: 60,
        autoRefresh: true,
        //是否自动刷新页面
        downContent: 'Pull Down To Refresh',
        upContent: 'Release To Refresh',
        loadingContent: loadingContent,
        prefix: 'xs-plugin-pulldown-'
      }, cfg);
      self.xscroll = self.userConfig.xscroll;
      prefix = self.userConfig.prefix;
      if (self.xscroll) {
        self.xscroll.on('afterrender', function () {
          self.render();
        });
      }
    },
    destroy: function () {
      var self = this;
      //remove element
      self.pulldown && self.pulldown.remove();
      // self.detach("afterStatusChange");
      self.xscroll.detach('panstart', self._panStartHandler, self);
      self.xscroll.detach('pan', self._panHandler, self);
      self.xscroll.detach('panend', self._panEndHandler, self);
      delete self;
    },
    render: function () {
      var self = this;
      if (self.__isRender)
        return;
      self.__isRender = true;
      var containerCls = prefix + 'container';
      var height = self.userConfig.height || 60;
      var pulldown = self.pulldown = document.createElement('div');
      pulldown.className = containerCls;
      pulldown.style.position = 'absolute';
      pulldown.style.width = '100%';
      pulldown.style.height = height + 'px';
      pulldown.style.top = -height + 'px';
      self.xscroll.container.appendChild(pulldown);
      Util.addClass(pulldown, prefix + self.status);
      pulldown.innerHTML = self.userConfig[self.status + 'Content'] || self.userConfig.content;
      self._bindEvt();
    },
    _bindEvt: function () {
      var self = this;
      if (self._evtBinded)
        return;
      self._evtBinded = true;
      var pulldown = self.pulldown;
      var xscroll = self.xscroll;
      xscroll.on('pan', function (e) {
        self._panHandler(e);
      });
      xscroll.on('panstart', function (e) {
        self._panStartHandler(e);
      });
      xscroll.on('panend', function (e) {
        self._panEndHandler(e);
      });
    },
    _changeStatus: function (status) {
      var prevVal = this.status;
      this.status = status;
      Util.removeClass(this.pulldown, prefix + prevVal);
      Util.addClass(this.pulldown, prefix + status);
      this.setContent(this.userConfig[status + 'Content']);
      if (prevVal != status) {
        this.fire('statuschange', {
          prevVal: prevVal,
          newVal: status
        });
        if (status == 'loading') {
          this.fire('loading');
        }
      }
    },
    fire: function (evt) {
      var self = this;
      if (self.__events[evt] && self.__events[evt].length) {
        for (var i in self.__events[evt]) {
          self.__events[evt][i].apply(this, [].slice.call(arguments, 1));
        }
      }
    },
    on: function (evt, fn) {
      if (!this.__events[evt]) {
        this.__events[evt] = [];
      }
      this.__events[evt].push(fn);
    },
    detach: function (evt, fn) {
      if (!evt || !this.__events[evt])
        return;
      var index = this.__events[evt].indexOf(fn);
      if (index > -1) {
        this.__events[evt].splice(index, 1);
      }
    },
    reset: function (callback) {
      var self = this;
      var height = self.userConfig.height || 60;
      var xscroll = self.xscroll;
      xscroll.boundry.resetTop();
      xscroll.bounce(true, callback);
      self._expanded = false;
    },
    _panStartHandler: function (e) {
      clearTimeout(this.loadingItv);
    },
    _panHandler: function (e) {
      var self = this;
      var offsetTop = e.offset.y;
      var height = self.userConfig.height || 60;
      if (offsetTop < 0)
        return;
      self._changeStatus(Math.abs(offsetTop) < height ? 'down' : 'up');
    },
    _panEndHandler: function (e) {
      var self = this;
      var xscroll = self.xscroll;
      var top = xscroll.boundry.top;
      var height = self.userConfig.height || 60;
      var offsetTop = xscroll.getOffsetTop();
      if (offsetTop > height) {
        xscroll.boundry.top = top;
        !self._expanded && xscroll.boundry.expandTop(height);
        self._expanded = true;
        xscroll.bounce(true, function () {
          self._changeStatus('loading');
        });
        if (self.userConfig.autoRefresh) {
          clearTimeout(self.loadingItv);
          self.loadingItv = setTimeout(function () {
            xscroll.boundry.expandTop(-height);
            xscroll.bounce(true, function () {
              window.location.reload();
            });
          }, 800);
        } else {
        }
      }
    },
    setContent: function (content) {
      var self = this;
      if (content) {
        self.pulldown.innerHTML = content;
      }
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = PullDown;
  } else {
    return PullDown;
  }
  return exports;
}({});
swipeedit = function (exports) {
  var Util = util;
  //transform
  var transform = Util.prefixStyle('transform');
  //transition webkitTransition MozTransition OTransition msTtransition
  var transition = Util.prefixStyle('transition');
  var clsPrefix = 'xs-plugin-swipeedit-';
  var isLocked = false;
  var buffer = 20;
  var isSliding = false;
  var hasSlided = false;
  var transformStr = Util.vendor ? [
    '-',
    Util.vendor,
    '-transform'
  ].join('') : 'transform';
  //acceration 
  var acc = 1;
  var startX;
  var SwipeEdit = function (cfg) {
    this.userConfig = Util.mix({
      labelSelector: clsPrefix + 'label',
      renderHook: function (el) {
        el.innerHTML = tpl;
      }
    }, cfg);
  };
  Util.mix(SwipeEdit.prototype, {
    pluginId: 'xlist/plugin/swipeedit',
    initializer: function (xlist) {
      var self = this;
      self.xlist = xlist;
      self._bindEvt();
    },
    getTransformX: function (el) {
      var trans = getComputedStyle(el)[transform].match(/[-\d\.*\d*]+/g);
      return trans ? trans[4] / 1 : 0;
    },
    _bindEvt: function () {
      var self = this;
      var xlist = self.xlist;
      var lbl = null;
      xlist.on('panstart', function (e) {
        hasSlided = false;
        lbl = e.cell.element.querySelector(self.userConfig.labelSelector);
        startX = self.getTransformX(lbl);
        lbl.style[transition] = 'none';
        if (Math.abs(startX) > 0 && !isSliding) {
          self.slideRight(e);
        }
      });
      xlist.on('pan', function (e) {
        if (e.touch.directionX == 'left') {
          self.slideAllExceptRow(e.cell._row);
        }
        /*
        1.水平位移大于垂直位移
        2.大于20px （参考值可自定） buffer
        3.向左
        */
        if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) / Math.abs(e.deltaY) > 4 && Math.abs(e.deltaX) > buffer) {
          isLocked = true;
          xlist.userConfig.lockY = true;
          var left = startX + e.deltaX + buffer;
          if (left > 0) {
            return;
          }
          lbl.style[transition] = 'none';
          lbl.style[transform] = 'translateX(' + left + 'px) translateZ(0)';
        } else if (!isLocked) {
          xlist.userConfig.lockY = false;
        }
      });
      xlist.on('panend', function (e) {
        isLocked = false;
        var cpt = self.getTransformX(lbl);
        if (e.touch.directionX == 'left' && Math.abs(e.velocityX) > acc) {
          self.slideLeftHandler(e);
        } else if (Math.abs(cpt) < self.userConfig.width / 2) {
          self.slideRightHandler(e);
        } else if (Math.abs(cpt) >= self.userConfig.width / 2) {
          self.slideLeftHandler(e);
        }
      });
      document.body.addEventListener('webkitTransitionEnd', function (e) {
        if (new RegExp(self.userConfig.labelSelector.replace(/\./, '')).test(e.target.className)) {
          isSliding = false;
        }
      });
    },
    slideLeft: function (row) {
      var self = this;
      var cell = xlist.getCellByRow(row);
      if (!cell || !cell.element)
        return;
      var el = cell.element.querySelector(self.userConfig.labelSelector);
      if (!el || !el.style)
        return;
      el.style[transform] = 'translateX(-' + self.userConfig.width + 'px) translateZ(0)';
      el.style[transition] = transformStr + ' 0.15s ease';
      xlist.getData(0, row).data.status = 'delete';
    },
    slideRight: function (row) {
      var self = this;
      var cell = xlist.getCellByRow(row);
      if (!cell || !cell.element)
        return;
      var el = cell.element.querySelector(self.userConfig.labelSelector);
      if (!el || !el.style)
        return;
      el.style[transform] = 'translateX(0) translateZ(0)';
      el.style[transition] = transformStr + ' 0.5s ease';
      xlist.getData(0, row).data.status = '';
    },
    slideLeftHandler: function (e) {
      var self = this;
      isSliding = true;
      self.slideLeft(e.cell._row);
    },
    slideRightHandler: function (e) {
      var self = this;
      hasSlided = true;
      isSliding = true;
      self.slideRight(e.cell._row);
    },
    slideAllExceptRow: function (row) {
      var self = this;
      for (var i in xlist.infiniteElementsCache) {
        if (row != xlist.infiniteElementsCache[i]._row || undefined === row) {
          self.slideRight(xlist.infiniteElementsCache[i]._row);
        }
      }
    }
  });
  if (typeof module == 'object' && module.exports) {
    exports = SwipeEdit;
  } else {
    return SwipeEdit;
  }
  return exports;
}({});
core = function (exports) {
  var Util = util;
  var Event = _event_;
  var Pan = pan;
  var Tap = tap;
  var Pinch = pinch;
  var ScrollBar = scrollbar;
  var PullDown = _pulldown_;
  var SwipeEdit = swipeedit;
  //global namespace
  var XScroll = function (cfg) {
    this.userConfig = cfg;
    this.init();
  };
  XScroll.PullDown = PullDown;
  XScroll.version = '2.0.0';
  //event names
  var SCROLL_END = 'scrollend';
  var SCROLL = 'scroll';
  var PAN_END = 'panend';
  var PAN_START = 'panstart';
  var PAN = 'pan';
  var SCROLL_ANIMATE = 'scrollanimate';
  var SCALE_ANIMATE = 'scaleanimate';
  var SCALE = 'scale';
  var AFTER_RENDER = 'afterrender';
  var REFRESH = 'refresh';
  //constant acceleration for scrolling
  var SROLL_ACCELERATION = 0.0005;
  //boundry checked bounce effect
  var BOUNDRY_CHECK_DURATION = 300;
  var BOUNDRY_CHECK_EASING = 'ease-in-out';
  var BOUNDRY_CHECK_ACCELERATION = 0.1;
  //reduced boundry pan distance
  var PAN_RATE = 0.36;
  // reduced scale rate
  var SCALE_RATE = 0.7;
  var SCALE_TO_DURATION = 300;
  //transform
  var transform = Util.prefixStyle('transform');
  //transition webkitTransition MozTransition OTransition msTtransition
  var transition = Util.prefixStyle('transition');
  var transitionDuration = Util.prefixStyle('transitionDuration');
  var transformOrigin = Util.prefixStyle('transformOrigin');
  var transitionEnd = Util.vendor ? Util.prefixStyle('transitionEnd') : 'transitionend';
  var transformStr = Util.vendor ? [
    '-',
    Util.vendor,
    '-transform'
  ].join('') : 'transform';
  var quadratic = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  var circular = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
  function quadratic2cubicBezier(a, b) {
    return [
      [
        (a / 3 + (a + b) / 3 - a) / (b - a),
        (a * a / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)
      ],
      [
        (b / 3 + (a + b) / 3 - a) / (b - a),
        (b * b / 3 + a * b * 2 / 3 - a * a) / (b * b - a * a)
      ]
    ];
  }
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
  //simulateMouseEvent
  var simulateMouseEvent = function (event, type) {
    if (event.touches.length > 1) {
      return;
    }
    var touches = event.changedTouches, first = touches[0], simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
    event.target.dispatchEvent(simulatedEvent);
  };
  /**
   *
   * @class Xscroll
   * @constructor
   * @extends Base
   */
  Util.mix(XScroll.prototype, {
    init: function () {
      var self = this;
      self.__events = {};
      var userConfig = self.userConfig = Util.mix({
        scalable: false,
        scrollbarX: true,
        scrollbarY: true,
        gpuAcceleration: true
      }, self.userConfig, undefined, undefined, true);
      self.renderTo = userConfig.renderTo.nodeType ? userConfig.renderTo : document.querySelector(userConfig.renderTo);
      self.scale = userConfig.scale || 1;
      self.boundryCheckEnabled = true;
      var clsPrefix = self.clsPrefix = userConfig.clsPrefix || 'xs-';
      self.SROLL_ACCELERATION = userConfig.SROLL_ACCELERATION || SROLL_ACCELERATION;
      self.containerClsName = clsPrefix + 'container';
      self.contentClsName = clsPrefix + 'content';
    },
    /*
        render & scroll to top
    */
    refresh: function () {
      var self = this;
      self.render();
      self.scrollTo({
        x: 0,
        y: 0
      });
      self.fire(REFRESH);
    },
    render: function () {
      var self = this;
      var userConfig = self.userConfig;
      self._createContainer();
      var width = userConfig.width || self.renderTo.offsetWidth;
      var height = userConfig.height || self.renderTo.offsetHeight || 0;
      self.width = width;
      self.height = height;
      var containerWidth = userConfig.containerWidth || self.content.offsetWidth;
      var containerHeight = userConfig.containerHeight || self.content.offsetHeight;
      self.containerWidth = containerWidth < self.width ? self.width : containerWidth;
      self.containerHeight = containerHeight < self.height ? self.height : containerHeight;
      self.initialContainerWidth = self.containerWidth;
      self.initialContainerHeight = self.containerHeight;
      //最小缩放比
      var minScale = self.userConfig.minScale || Math.max(self.width / self.containerWidth, self.height / self.containerHeight);
      var maxScale = self.userConfig.maxScale || 1;
      self.minScale = minScale;
      self.maxScale = maxScale;
      self.boundry = {
        reset: function () {
          this.resetTop();
          this.resetLeft();
          this.resetBottom();
          this.resetRight();
          return this;
        },
        resetTop: function () {
          this.top = 0;
          return this;
        },
        resetLeft: function () {
          this.left = 0;
          return this;
        },
        resetBottom: function () {
          this.bottom = self.height;
          return this;
        },
        resetRight: function () {
          this.right = self.width;
          return this;
        },
        expandTop: function (top) {
          this.top += top || 0;
          return this;
        },
        expandLeft: function (left) {
          this.left += left || 0;
          return this;
        },
        expandRight: function (right) {
          this.right -= right || 0;
          return this;
        },
        expandBottom: function (bottom) {
          this.bottom -= bottom || 0;
          return this;
        }
      };
      self.boundry.reset();
      self.fire(AFTER_RENDER);
      self.renderScrollBars();
      self._bindEvt();
    },
    renderScrollBars: function () {
      var self = this;
      if (self.userConfig.scrollbarX) {
        if (self.scrollbarX) {
          self.scrollbarX._update();
        } else {
          self.scrollbarX = new ScrollBar({
            xscroll: self,
            type: 'x'
          });
        }
      }
      if (self.userConfig.scrollbarY) {
        if (self.scrollbarY) {
          self.scrollbarY._update();
        } else {
          self.scrollbarY = new ScrollBar({
            xscroll: self,
            type: 'y'
          });
        }
      }
    },
    _createContainer: function () {
      var self = this;
      if (self.__isContainerCreated)
        return;
      var renderTo = self.renderTo;
      var container = self.container = self.renderTo.getElementsByClassName(self.containerClsName)[0];
      var content = self.content = self.renderTo.getElementsByClassName(self.contentClsName)[0];
      container.style.position = 'absolute';
      container.style.height = '100%';
      container.style.width = '100%';
      container.style[transformOrigin] = '0 0';
      content.style.position = 'absolute';
      content.style[transformOrigin] = '0 0';
      self.translate({
        x: 0,
        y: 0
      });
      self.__isContainerCreated = true;
    },
    //translate a element 
    translate: function (offset) {
      this.translateX(offset.x);
      this.translateY(offset.y);
      return;
    },
    _scale: function (scale, originX, originY, triggerEvent) {
      var self = this;
      if (!self.userConfig.scalable || self.scale == scale || !scale)
        return;
      if (!self.isScaling) {
        self.scaleBegin = self.scale;
        self.isScaling = true;
        self.scaleBeginX = self.x;
        self.scaleBeginY = self.y;
      }
      if (originX) {
        self.originX = originX;
      }
      if (originY) {
        self.originY = originY;
      }
      var boundry = self.boundry;
      var containerWidth = scale * self.initialContainerWidth;
      var containerHeight = scale * self.initialContainerHeight;
      self.containerWidth = Math.round(containerWidth > self.width ? containerWidth : self.width);
      self.containerHeight = Math.round(containerHeight > self.height ? containerHeight : self.height);
      self.scale = scale;
      var x = originX * (self.initialContainerWidth * self.scaleBegin - self.containerWidth) + self.scaleBeginX;
      var y = originY * (self.initialContainerHeight * self.scaleBegin - self.containerHeight) + self.scaleBeginY;
      if (x > boundry.left) {
        x = boundry.left;
      }
      if (y > boundry.top) {
        y = boundry.top;
      }
      if (x < boundry.right - self.containerWidth) {
        x = boundry.right - self.containerWidth;
      }
      if (y < boundry.bottom - self.containerHeight) {
        y = boundry.bottom - self.containerHeight;
      }
      self.x = x;
      self.y = y;
      self._transform();
      self.fire(SCALE, {
        scale: scale,
        origin: {
          x: originX,
          y: originY
        },
        triggerEvent: triggerEvent
      });
    },
    /*
        scale(0.5,0.5,0.5,500,"ease-out")
        @param {Number} scale 缩放比
        @param {Float} 0~1之间的缩放中心值 水平方向
        @param {Fload} 0~1之间的缩放中心值 垂直方向
        @param {Number} 动画周期
        @param {String} 动画函数
    */
    scaleTo: function (scale, originX, originY, duration, easing, callback) {
      var self = this;
      //不可缩放
      if (!self.userConfig.scalable || self.scale == scale || !scale)
        return;
      var duration = duration || 1;
      var easing = easing || 'ease-out', transitionStr = [
          transformStr,
          ' ',
          duration / 1000,
          's ',
          easing,
          ' 0s'
        ].join('');
      var start = Date.now();
      self.destTimeScale = start + duration;
      cancelRAF(self._rafScale);
      var scaleStart = self.scale;
      var step = 0;
      var run = function () {
        var now = Date.now();
        if (now > start + duration && now >= self.destTimeScale) {
          self.isScaling = false;
          return;
        }
        self._rafScale = RAF(run);
      };
      run();
      self.container.style[transition] = transitionStr;
      self.content.style[transition] = transitionStr;
      self._scale(scale, originX, originY, 'scaleTo');
      self.fire(SCALE_ANIMATE, {
        scale: self.scale,
        duration: duration,
        easing: easing,
        offset: {
          x: self.x,
          y: self.y
        },
        origin: {
          x: originX,
          y: originY
        }
      });
    },
    translateX: function (x) {
      this.x = x;
      this._transform();
    },
    translateY: function (y) {
      this.y = y;
      this._transform();
    },
    _noTransition: function () {
      var self = this;
      if (Util.isBadAndroid) {
        self.content.style[transitionDuration] = '0.001s';
        self.container.style[transitionDuration] = '0.001s';
      } else {
        self.content.style[transition] = 'none';
        self.container.style[transition] = 'none';
      }
    },
    stop: function () {
      var self = this;
      if (self.isScaling)
        return;
      var boundry = self.boundry;
      var offset = self.getOffset();
      //outside of boundry 
      if (offset.y > boundry.top || offset.y + self.containerHeight < boundry.bottom || offset.x > boundry.left || offset.x + self.containerWidth < boundry.right) {
        return;
      }
      self.translate(offset);
      self._noTransition();
      cancelRAF(self.rafX);
      cancelRAF(self.rafY);
      self.fire(SCROLL_END, {
        offset: offset,
        scale: self.scale,
        zoomType: 'xy'
      });
    },
    enableGPUAcceleration: function () {
      this.userConfig.gpuAcceleration = true;
    },
    disableGPUAcceleration: function () {
      this.userConfig.gpuAcceleration = false;
    },
    _transform: function () {
      var translateZ = this.userConfig.gpuAcceleration ? ' translateZ(0) ' : '';
      this.content.style[transform] = 'translate(' + this.x + 'px,0px)  scaleX(' + this.scale + ') scaleY(' + this.scale + ') ' + translateZ;
      this.container.style[transform] = 'translate(0px,' + this.y + 'px) ' + translateZ;
    },
    getOffset: function () {
      var self = this;
      return {
        x: self.getOffsetLeft(),
        y: self.getOffsetTop()
      };
    },
    getOffsetTop: function () {
      if (this.lockY)
        return 0;
      var transY = window.getComputedStyle(this.container)[transform].match(/[-\d\.*\d*]+/g);
      return transY ? Math.round(transY[5]) : 0;
    },
    getOffsetLeft: function () {
      if (this.lockX)
        return 0;
      var transX = window.getComputedStyle(this.content)[transform].match(/[-\d\.*\d*]+/g);
      return transX ? Math.round(transX[4]) : 0;
    },
    /**
     * scroll the root element with an animate
     * @param offset {Object} scrollTop
     * @param duration {Number} duration for animte
     * @param easing {Number} easing functio for animate : ease-in | ease-in-out | ease | bezier
     **/
    scrollTo: function (offset, duration, easing, callback) {
      var self = this;
      var _offset = self.getOffset();
      var x = undefined === offset.x || isNaN(offset.x) ? -_offset.x : offset.x;
      var y = undefined === offset.y || isNaN(offset.y) ? -_offset.y : offset.y;
      self.scrollX(x, duration, easing, callback);
      self.scrollY(y, duration, easing, callback);
    },
    scrollX: function (x, duration, easing, callback) {
      var self = this;
      var x = Math.round(x);
      if (self.userConfig.lockX)
        return;
      var duration = duration || 0;
      var easing = easing || 'cubic-bezier(0.333333, 0.666667, 0.666667, 1)';
      var content = self.content;
      self.translateX(-x);
      var transitionStr = duration > 0 ? [
        transformStr,
        ' ',
        duration / 1000,
        's ',
        easing,
        ' 0s'
      ].join('') : 'none';
      content.style[transition] = transitionStr;
      self._scrollHandler(-x, duration, callback, easing, transitionStr, 'x');
      return content.style[transition] = transitionStr;
    },
    scrollY: function (y, duration, easing, callback) {
      var self = this;
      var y = Math.round(y);
      if (self.userConfig.lockY)
        return;
      var duration = duration || 0;
      var easing = easing || 'cubic-bezier(0.333333, 0.666667, 0.666667, 1)';
      var container = self.container;
      self.translateY(-y);
      var transitionStr = duration > 0 ? [
        transformStr,
        ' ',
        duration / 1000,
        's ',
        easing,
        ' 0s'
      ].join('') : 'none';
      container.style[transition] = transitionStr;
      self._scrollHandler(-y, duration, callback, easing, transitionStr, 'y');
      return container.style[transition] = transitionStr;
    },
    _scrollHandler: function (dest, duration, callback, easing, transitionStr, type) {
      var self = this;
      var offset = self.getOffset();
      //目标值等于当前至 则不发生滚动
      if (duration <= 0) {
        self.fire(SCROLL, {
          zoomType: type,
          offset: offset
        });
        self.fire(SCROLL_END, {
          zoomType: type,
          offset: offset
        });
        return;
      }
      var Type = type.toUpperCase();
      self['isScrolling' + Type] = true;
      var start = Date.now();
      self['destTime' + Type] = start + duration;
      cancelRAF(self['raf' + Type]);
      //注册滚动结束事件  供transitionEnd进行精确回调
      self['__scrollEndCallback' + Type] = function (args) {
        self['isScrolling' + Type] = false;
        self.fire(SCROLL_END, {
          offset: self.getOffset(),
          zoomType: args.type
        });
        callback && callback(args);
      };
      var run = function () {
        var now = Date.now();
        if (self['isScrolling' + Type]) {
          RAF(function () {
            self.fire(SCROLL, {
              zoomType: type,
              offset: self.getOffset()
            });
          }, 0);
        }
        self['raf' + Type] = RAF(run);
      };
      run();
      self.fire(SCROLL_ANIMATE, {
        transition: transitionStr,
        offset: {
          x: self.x,
          y: self.y
        },
        duration: duration / 1000,
        easing: easing,
        zoomType: type
      });
    },
    boundryCheckX: function (callback) {
      var self = this;
      if (!self.boundryCheckEnabled || self.userConfig.lockX)
        return;
      var offset = self.getOffset();
      var containerWidth = self.containerWidth;
      var boundry = self.boundry;
      if (offset.x > boundry.left) {
        offset.x = boundry.left;
        self.scrollX(-offset.x, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
      } else if (offset.x + containerWidth < boundry.right) {
        offset.x = boundry.right - containerWidth;
        self.scrollX(-offset.x, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
      }
    },
    boundryCheckY: function (callback) {
      var self = this;
      if (!self.boundryCheckEnabled || self.userConfig.lockY)
        return;
      var offset = self.getOffset();
      var containerHeight = self.containerHeight;
      var boundry = self.boundry;
      if (offset.y > boundry.top) {
        offset.y = boundry.top;
        self.scrollY(-offset.y, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
      } else if (offset.y + containerHeight < boundry.bottom) {
        offset.y = boundry.bottom - containerHeight;
        self.scrollY(-offset.y, BOUNDRY_CHECK_DURATION, BOUNDRY_CHECK_EASING, callback);
      }
    },
    //boundry back bounce
    boundryCheck: function (callback) {
      this.boundryCheckX(callback);
      this.boundryCheckY(callback);
    },
    /**
     * enable the switch for boundry back bounce
     **/
    bounce: function (isEnabled, callback) {
      this.boundryCheckEnabled = isEnabled;
      isEnabled ? this.boundryCheck(callback) : undefined;
      return;
    },
    _fireTouchStart: function (e) {
      this.fire('touchstart', e);
    },
    _firePanStart: function (e) {
      this.fire(PAN_START, e);
    },
    _firePan: function (e) {
      this.fire(PAN, e);
    },
    _firePanEnd: function (e) {
      this.fire(PAN_END, e);
    },
    _fireClick: function (eventName, e) {
      this.fire(eventName, e);
    },
    _bindEvt: function () {
      var self = this;
      if (self.__isEvtBind)
        return;
      self.__isEvtBind = true;
      var renderTo = self.renderTo;
      var container = self.container;
      var content = self.content;
      var containerWidth = self.containerWidth;
      var containerHeight = self.containerHeight;
      var offset = {
        x: 0,
        y: 0
      };
      var boundry = self.boundry;
      Event.on(renderTo, 'touchstart', function (e) {
        e.preventDefault();
        self._fireTouchStart(e);
        self.stop();
      }).on(renderTo, Tap.TAP, function (e) {
        self.boundryCheck();
        if (!self.isScrollingX && !self.isScrollingY) {
          simulateMouseEvent(e, 'click');
          self._fireClick('click', e);
        } else {
          self.isScrollingX = false;
          self.isScrollingY = false;
          self.stop();
        }
      }).on(renderTo, Pan.PAN_START, function (e) {
        offset = self.getOffset();
        self.translate(offset);
        self._firePanStart(Util.mix(e, { offset: offset }));
      }).on(renderTo, Pan.PAN, function (e) {
        var posY = self.userConfig.lockY ? Number(offset.y) : Number(offset.y) + e.deltaY;
        var posX = self.userConfig.lockX ? Number(offset.x) : Number(offset.x) + e.deltaX;
        containerWidth = self.containerWidth;
        containerHeight = self.containerHeight;
        if (posY > boundry.top) {
          //overtop 
          posY = (posY - boundry.top) * PAN_RATE + boundry.top;
        }
        if (posY < boundry.bottom - containerHeight) {
          //overbottom 
          posY = posY + (boundry.bottom - containerHeight - posY) * PAN_RATE;
        }
        if (posX > boundry.left) {
          //overleft
          posX = (posX - boundry.left) * PAN_RATE + boundry.left;
        }
        if (posX < boundry.right - containerWidth) {
          //overright
          posX = posX + (boundry.right - containerWidth - posX) * PAN_RATE;
        }
        self.translate({
          x: posX,
          y: posY
        });
        self._noTransition();
        self.isScrollingX = false;
        self.isScrollingY = false;
        self.directionX = e.directionX;
        self.directionY = e.directionY;
        var evt = Util.mix(e, {
          offset: {
            x: posX,
            y: posY
          },
          directionX: self.directionX,
          directionY: self.directionY
        });
        self.fire(SCROLL, evt);
        self._firePan(evt);
      }).on(renderTo, Pan.PAN_END, function (e) {
        self.panEndHandler(e);
        self._firePanEnd(e);
      });
      Event.on(container, transitionEnd, function (e) {
        if (e.target == content && !self.isScaling) {
          self.__scrollEndCallbackX && self.__scrollEndCallbackX({ type: 'x' });
        }
        if (e.target == container && !self.isScaling) {
          self.__scrollEndCallbackY && self.__scrollEndCallbackY({ type: 'y' });
        }
      }, false);
      //可缩放
      if (self.userConfig.scalable) {
        var originX, originY;
        Event.on(renderTo, Pinch.PINCH_START, function (e) {
          scale = self.scale;
          originX = (e.origin.pageX - self.x) / self.containerWidth;
          originY = (e.origin.pageY - self.y) / self.containerHeight;
        });
        Event.on(renderTo, Pinch.PINCH, function (e) {
          self._scale(scale * e.scale, originX, originY, 'pinch');
        });
        Event.on(renderTo, Pinch.PINCH_END, function (e) {
          self.isScaling = false;
          if (self.scale < self.minScale) {
            self.scaleTo(self.minScale, originX, originY, SCALE_TO_DURATION);
          } else if (self.scale > self.maxScale) {
            self.scaleTo(self.maxScale, originX, originY, SCALE_TO_DURATION);
          }
        });
        Event.on(renderTo, Tap.DOUBLE_TAP, function (e) {
          originX = (e.pageX - self.x) / self.containerWidth;
          originY = (e.pageY - self.y) / self.containerHeight;
          self.scale > self.minScale ? self.scaleTo(self.minScale, originX, originY, 200) : self.scaleTo(self.maxScale, originX, originY, 200);
        });
      }
      Event.on(window, 'resize', function (e) {
        self.refresh();
      });
    },
    panEndHandler: function (e) {
      var self = this;
      var userConfig = self.userConfig;
      var offset = self.getOffset();
      var transX = self._bounce('x', offset.x, e.velocityX, self.width, self.containerWidth);
      var transY = self._bounce('y', offset.y, e.velocityY, self.height, self.containerHeight);
      var x = transX ? transX.offset : 0;
      var y = transY ? transY.offset : 0;
      var duration;
      if (transX && transY && transX.status && transY.status && transX.duration && transY.duration) {
        //保证常规滚动时间相同 x y方向不发生时间差
        duration = Math.max(transX.duration, transY.duration);
      }
      if (transX) {
        self.scrollX(x, duration || transX.duration, transX.easing, function (e) {
          self._scrollEndHandler('x');
        });
      }
      if (transY) {
        self.scrollY(y, duration || transY.duration, transY.easing, function (e) {
          self._scrollEndHandler('y');
        });
      }
      //judge the direction
      self.directionX = e.velocityX < 0 ? 'left' : 'right';
      self.directionY = e.velocityY < 0 ? 'up' : 'down';
    },
    _scrollEndHandler: function (type) {
      var self = this;
      var TYPE = type.toUpperCase();
      var scrollFn = 'scroll' + TYPE;
      var boundryCheckFn = 'boundryCheck' + TYPE;
      var _bounce = '_bounce' + type;
      if (self[_bounce]) {
        self.fire('outOfBoundry');
        var v = self[_bounce];
        var a = 0.04 * (v / Math.abs(v));
        var t = v / a;
        var s0 = self.getOffset()[type];
        var s = s0 + t * v / 2;
        self[scrollFn](-s, t, 'cubic-bezier(' + quadratic2cubicBezier(-t, 0) + ')', function () {
          self[_bounce] = 0;
          self[boundryCheckFn]();
        });
      } else {
        self[boundryCheckFn]();
      }
    },
    fire: function (evt) {
      var self = this;
      if (self.__events[evt] && self.__events[evt].length) {
        for (var i in self.__events[evt]) {
          self.__events[evt][i].apply(this, [].slice.call(arguments, 1));
        }
      }
    },
    on: function (evt, fn) {
      if (!this.__events[evt]) {
        this.__events[evt] = [];
      }
      this.__events[evt].push(fn);
    },
    detach: function (evt, fn) {
      if (!evt || !this.__events[evt])
        return;
      var index = this.__events[evt].indexOf(fn);
      if (index > -1) {
        this.__events[evt].splice(index, 1);
      }
    },
    _bounce: function (type, offset, v, size, innerSize) {
      var self = this;
      var boundry = self.boundry;
      var boundryStart = type == 'x' ? boundry.left : boundry.top;
      var boundryEnd = type == 'x' ? boundry.right : boundry.bottom;
      var size = boundryEnd - boundryStart;
      var transition = {};
      if (v === 0) {
        type == 'x' ? self.boundryCheckX() : self.boundryCheckY();
        return;
      }
      if (type == 'x' && self.userConfig.lockX)
        return;
      if (type == 'y' && self.userConfig.lockY)
        return;
      var userConfig = self.userConfig;
      var maxSpeed = userConfig.maxSpeed > 0 && userConfig.maxSpeed < 6 ? userConfig.maxSpeed : 3;
      if (v > maxSpeed) {
        v = maxSpeed;
      }
      if (v < -maxSpeed) {
        v = -maxSpeed;
      }
      if (offset > boundryStart || offset < size - innerSize) {
        var a = BOUNDRY_CHECK_ACCELERATION * (v / Math.abs(v));
        var t = v / a;
        var s = offset + t * v / 2;
        transition.offset = -s;
        transition.duration = t;
        transition.easing = 'cubic-bezier(' + quadratic2cubicBezier(-t, 0) + ')';
        return transition;
      }
      var a = self.SROLL_ACCELERATION * (v / Math.abs(v));
      var t = v / a;
      var s = offset / 1 + t * v / 2;
      //over top boundry check bounce
      if (s > boundryStart) {
        var _s = boundryStart - offset;
        var _t = (v - Math.sqrt(-2 * a * _s + v * v)) / a;
        transition.offset = -boundryStart;
        transition.duration = _t;
        transition.easing = 'cubic-bezier(' + quadratic2cubicBezier(-t, -t + _t) + ')';
        self['_bounce' + type] = v - a * _t;
      } else if (s < size - innerSize) {
        var _s = size - innerSize - offset;
        var _t = (v + Math.sqrt(-2 * a * _s + v * v)) / a;
        transition.offset = innerSize - size;
        transition.duration = _t;
        transition.easing = 'cubic-bezier(' + quadratic2cubicBezier(-t, -t + _t) + ')';
        self['_bounce' + type] = v - a * _t;
      } else {
        transition.offset = -s;
        transition.duration = t;
        transition.easing = 'cubic-bezier(' + quadratic2cubicBezier(-t, 0) + ')';
        transition.status = 'normal';
      }
      self['isScrolling' + type.toUpperCase()] = true;
      return transition;
    },
    plug: function (plugin) {
      var self = this;
      if (!plugin || !plugin.pluginId)
        return;
      if (!self.__plugins) {
        self.__plugins = [];
      }
      plugin.initializer(self);
      self.__plugins.push(plugin);
    },
    unplug: function (plugin) {
      var self = this;
      if (!plugin)
        return;
      var _plugin = typeof plugin == 'string' ? self.getPlugin(plugin) : plugin;
      for (var i in self.__plugins) {
        if (self.__plugins[i] == _plugin) {
          return self.__plugins[i].splice(i, 1);
        }
      }
    },
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
    exports = XScroll;
  } else {
    return window.XScroll = XScroll;
  }
  return exports;
}({});
}());