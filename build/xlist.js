;(function() {
var util, pan, tap, pinch, scrollbar, core, dataset, xlist, _event_, _pulldown_;
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
  exports = Util;
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
    }
  };
  return Gesture;
}({});
pan = function (exports) {
  var Util = util;
  var Event = _event_;
  var doc = window.document;
  var PAN_START = 'panstart', PAN_END = 'panend', PAN = 'pan', MIN_SPEED = 0.35, MAX_SPEED = 8;
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
  document.body.addEventListener('touchmove', touchMoveHandler);
  document.body.addEventListener('touchend', touchEndHandler);
  return {
    PAN_START: PAN_START,
    PAN_END: PAN_END,
    PAN: PAN
  };
}({});
tap = function (exports) {
  var Util = util;
  var Event = _event_;
  var TAP = 'tap';
  var TAP_HOLD = 'tapHold';
  var SINGLE_TAP = 'singleTap';
  var DOUBLE_TAP = 'doubleTap';
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
  document.body.addEventListener('touchstart', touchStart);
  document.body.addEventListener('touchend', touchEnd);
  return {
    TAP: TAP,
    TAP_HOLD: TAP_HOLD,
    SINGLE_TAP: SINGLE_TAP,
    DOUBLE_TAP: DOUBLE_TAP
  };
}({});
pinch = function (exports) {
  var Util = util;
  var Event = _event_;
  var doc = window.document;
  var PINCH_START = 'gesturePinchStart', PINCH_END = 'gesturePinchEnd', PINCH = 'gesturePinch';
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
  document.body.addEventListener('touchmove', pinchMoveHandler);
  document.body.addEventListener('touchend', pinchEndHandler);
  //枚举
  return {
    PINCH_START: PINCH_START,
    PINCH: PINCH,
    PINCH_END: PINCH_END
  };
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
  return ScrollBar;
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
      self.userConfig = Util.mix({
        onRefresh: function () {
          window.location.reload();
        },
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
    _panStartHandler: function (e) {
      clearTimeout(this.loadingItv);
    },
    _changeStatus: function (status) {
      var prevVal = this.status;
      this.status = status;
      Util.removeClass(this.pulldown, prefix + prevVal);
      Util.addClass(this.pulldown, prefix + status);
      this.setContent(this.userConfig[status + 'Content']);
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
        xscroll.bounce(true);
        self._changeStatus('loading');
        clearTimeout(self.loadingItv);
        self.loadingItv = setTimeout(function () {
          xscroll.boundry.expandTop(-height);
          xscroll.bounce(true, function () {
            self.userConfig.onRefresh && self.userConfig.onRefresh();
          });
        }, 800);
      }
    },
    setContent: function (content) {
      var self = this;
      if (content) {
        self.pulldown.innerHTML = content;
      }
    }
  });
  return PullDown;
}({});
core = function (exports) {
  var win = window;
  var Util = util;
  var Event = _event_;
  var Pan = pan;
  var Tap = tap;
  var Pinch = pinch;
  var ScrollBar = scrollbar;
  var PullDown = _pulldown_;
  //global namespace
  var XScroll = function (cfg) {
    this.userConfig = cfg;
    this.init();
  };
  XScroll.PullDown = PullDown;
  XScroll.version = '1.0.0';
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
        scrollbarY: true
      }, self.userConfig, undefined, undefined, true);
      self.renderTo = document.getElementById(userConfig.renderTo.replace('#', ''));
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
      self.scale = userConfig.scale || 1;
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
          this.left = 0;
          this.top = 0;
          this.right = self.width;
          this.bottom = self.height;
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
    _transform: function () {
      var translateZ = this.gpuAcceleration ? ' translateZ(0) ' : '';
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
      if (offset[type] == dest)
        return;
      if (duration <= 0) {
        self.fire(SCROLL, {
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
        self.stop();
      }).on(renderTo, Tap.TAP, function (e) {
        self.boundryCheck();
        if (!self.isScrollingX && !self.isScrollingY) {
          simulateMouseEvent(e, 'click');
        } else {
          self.isScrollingX = false;
          self.isScrollingY = false;
          self.stop();
        }
      }).on(renderTo, Pan.PAN_START, function (e) {
        offset = self.getOffset();
        self.translate(offset);
        self.fire(PAN_START, { offset: offset });
      }).on(renderTo, Pan.PAN, function (e) {
        var posY = self.userConfig.lockY ? Number(offset.y) : Number(offset.y) + e.deltaY;
        var posX = self.userConfig.lockX ? Number(offset.x) : Number(offset.x) + e.deltaX;
        boundry = self.boundry;
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
        self.fire(SCROLL, {
          offset: {
            x: posX,
            y: posY
          },
          directionX: self.directionX,
          directionY: self.directionY
        });
        self.fire(PAN, {
          offset: {
            x: posX,
            y: posY
          },
          deltaX: e.deltaX,
          deltaY: e.deltaY,
          directionX: self.directionX,
          directionY: self.directionY
        });
      }).on(renderTo, Pan.PAN_END, function (e) {
        self.panEndHandler(e);
        self.fire(PAN_END, {
          velocity: e.velocity,
          velocityX: e.velocityX,
          velocityY: e.velocityY
        });
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
      Event.on(win, 'resize', function (e) {
        self.refresh();
      });
    },
    panEndHandler: function (e) {
      var self = this;
      var userConfig = self.userConfig;
      var offset = self.getOffset();
      var transX = self._bounce('x', offset.x, e.velocityX, self.width, self.containerWidth);
      var transY = self._bounce('y', offset.y, e.velocityY, self.height, self.containerHeight);
      var x = transX ? transX['offset'] : 0;
      var y = transY ? transY['offset'] : 0;
      var duration;
      if (transX && transY && transX.status && transY.status && transX.duration && transY.duration) {
        //保证常规滚动时间相同 x y方向不发生时间差
        duration = Math.max(transX.duration, transY.duration);
      }
      if (transX) {
        if (transX['duration'] < 100) {
          self._scrollEndHandler('x');
        } else {
          self.scrollX(x, duration || transX['duration'], transX['easing'], function (e) {
            self._scrollEndHandler('x');
          });
        }
      }
      if (transY) {
        if (transY['duration'] < 100) {
          self._scrollEndHandler('y');
        } else {
          self.scrollY(y, duration || transY['duration'], transY['easing'], function (e) {
            self._scrollEndHandler('y');
          });
        }
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
      console.log(maxSpeed);
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
        transition['offset'] = -s;
        transition['duration'] = t;
        transition['easing'] = 'cubic-bezier(' + quadratic2cubicBezier(-t, 0) + ')';
        return transition;
      }
      var a = self.SROLL_ACCELERATION * (v / Math.abs(v));
      var t = v / a;
      var s = offset / 1 + t * v / 2;
      //over top boundry check bounce
      if (s > boundryStart) {
        var _s = boundryStart - offset;
        var _t = (v - Math.sqrt(-2 * a * _s + v * v)) / a;
        transition['offset'] = -boundryStart;
        transition['duration'] = _t;
        transition['easing'] = 'cubic-bezier(' + quadratic2cubicBezier(-t, -t + _t) + ')';
        self['_bounce' + type] = v - a * _t;
      } else if (s < size - innerSize) {
        var _s = size - innerSize - offset;
        var _t = (v + Math.sqrt(-2 * a * _s + v * v)) / a;
        transition['offset'] = innerSize - size;
        transition['duration'] = _t;
        transition['easing'] = 'cubic-bezier(' + quadratic2cubicBezier(-t, -t + _t) + ')';
        self['_bounce' + type] = v - a * _t;
      } else {
        transition['offset'] = -s;
        transition['duration'] = t;
        transition['easing'] = 'cubic-bezier(' + quadratic2cubicBezier(-t, 0) + ')';
        transition['status'] = 'normal';
      }
      self['isScrolling' + type.toUpperCase()] = true;
      return transition;
    }
  });
  // commonjs export
  if (typeof module == 'object' && module.exports) {
    exports = XScroll;
  } else {
    window.XScroll = XScroll;
  }
  return XScroll;
}({});
dataset = function (exports) {
  var DataSet = function (cfg) {
    this.data = cfg && cfg.data || [];
    this.id = cfg && cfg.id || '_ds_' + Date.now();
  };
  DataSet.prototype.appendData = function (data) {
    this.data = this.data.concat(data);
  };
  DataSet.prototype.removeData = function () {
    this.data = [];
  };
  DataSet.prototype.getData = function () {
    return this.data;
  };
  DataSet.prototype.setId = function (id) {
    if (!id)
      return;
    this.id = id;
    return this.id;
  };
  DataSet.prototype.getId = function () {
    return this.id;
  };
  return DataSet;
}({});
xlist = function (exports) {
  var Util = util;
  var XScroll = core;
  var DataSet = dataset;
  var transform = Util.prefixStyle('transform');
  var XList = function (cfg) {
    this.super.call(this, cfg);
  };
  XList.DataSet = DataSet;
  Util.extend(XScroll, XList, {
    init: function () {
      var self = this;
      var userConfig = self.userConfig = Util.mix({
        data: [],
        gpuAcceleration: true,
        lockX: true,
        scrollbarX: false,
        itemHeight: 30
      }, self.userConfig);
      this.super.prototype.init.call(this);
      self._initInfinite();
    },
    /**
     * get all element posInfo such as top,height,template,html
     * @return {Array}
     **/
    _getDomInfo: function () {
      var self = this;
      var data = self._formatData();
      var itemHeight = self.userConfig.itemHeight;
      var top = 0;
      var domInfo = [];
      var height = 0;
      self.hasSticky = false;
      //f = v/itemHeight*1000 < 60 => v = 0.06 * itemHeight
      self.userConfig.maxSpeed = 0.06 * itemHeight;
      for (var i = 0, l = data.length; i < l; i++) {
        var item = data[i];
        height = item.style && item.style.height >= 0 ? item.style.height : itemHeight;
        item._row = i;
        item._top = top;
        item._height = height;
        item.recycled = item.recycled === false ? false : true;
        domInfo.push(item);
        top += height;
        if (!self.hasSticky && item.style && item.style.position == 'sticky') {
          self.hasSticky = true;
        }
      }
      self.domInfo = domInfo;
      return domInfo;
    },
    appendDataSet: function (ds) {
      var self = this;
      if (!ds instanceof DataSet)
        return;
      self.datasets.push(ds);
    },
    removeDataSet: function (id) {
      var self = this;
      if (!id)
        return;
      var index;
      for (var i = 0, l = self.datasets.length; i < l; i++) {
        if (id == self.datasets[i].getId()) {
          index = i;
        }
      }
      self.datasets.splice(index, 1);
    },
    getDataSets: function () {
      var self = this;
      return self.datasets;
    },
    getDataSetById: function (id) {
      var self = this;
      if (!id)
        return;
      for (var i = 0, l = self.datasets.length; i < l; i++) {
        if (self.datasets[i].getId() == id) {
          return self.datasets[i];
        }
      }
    },
    _formatData: function () {
      var self = this;
      var data = [];
      for (var i in self.datasets) {
        data = data.concat(self.datasets[i].getData());
      }
      return data;
    },
    _getChangedRows: function (newElementsPos, force) {
      var self = this;
      var changedRows = {};
      for (var i in self.elementsPos) {
        if (!newElementsPos.hasOwnProperty(i)) {
          changedRows[i] = 'delete';
        }
      }
      for (var i in newElementsPos) {
        if (newElementsPos[i].recycled && (!self.elementsPos.hasOwnProperty(i) || force)) {
          changedRows[i] = 'add';
        }
      }
      self.elementsPos = newElementsPos;
      return changedRows;
    },
    _getElementsPos: function (offsetTop) {
      var self = this;
      var offsetTop = -(offsetTop || self.getOffsetTop());
      var data = self.domInfo;
      var itemHeight = self.userConfig.itemHeight;
      var elementsPerPage = Math.ceil(self.height / itemHeight);
      var maxBufferedNum = Math.max(Math.ceil(elementsPerPage / 3), 0);
      var posTop = Math.max(offsetTop - maxBufferedNum * itemHeight, 0);
      var tmp = {}, item;
      for (var i = 0, len = data.length; i < len; i++) {
        item = data[i];
        if (item._top >= posTop - itemHeight && item._top <= posTop + 2 * maxBufferedNum * itemHeight + self.height) {
          tmp[item._row] = item;
        }
      }
      return tmp;
    },
    render: function () {
      var self = this;
      this.super.prototype.render.call(this);
      self._getDomInfo();
      self._initSticky();
      var height = self.height;
      var lastItem = self.domInfo[self.domInfo.length - 1];
      var containerHeight = lastItem && lastItem._top ? lastItem._top + lastItem._height : self.height;
      if (containerHeight < height) {
        containerHeight = height;
      }
      self.containerHeight = containerHeight;
      self.container.style.height = containerHeight;
      self.renderScrollBars();
      //渲染非回收元素
      self._renderNoRecycledEl();
      //强制刷新
      self._update(self.getOffsetTop(), true);
    },
    _update: function (offset, force) {
      var self = this;
      var translateZ = self.userConfig.gpuAcceleration ? ' translateZ(0) ' : '';
      var offset = offset === undefined ? self.getOffsetTop() : offset;
      var elementsPos = self._getElementsPos(offset);
      var changedRows = self._getChangedRows(elementsPos, force);
      var el = null;
      //若强制刷新 则重新初始化dom
      if (force) {
        for (var i = 0; i < self.infiniteLength; i++) {
          self.infiniteElementsCache[i]._visible = false;
          self.infiniteElements[i].style.visibility = 'hidden';
          delete self.infiniteElementsCache[i]._row;
        }
      }
      //获取可用的节点
      var getElIndex = function () {
        for (var i = 0; i < self.infiniteLength; i++) {
          if (!self.infiniteElementsCache[i]._visible) {
            self.infiniteElementsCache[i]._visible = true;
            return i;
          }
        }
      };
      //回收已使用的节点
      var setEl = function (row) {
        for (var i = 0; i < self.infiniteLength; i++) {
          if (self.infiniteElementsCache[i]._row == row) {
            self.infiniteElementsCache[i]._visible = false;
            self.infiniteElements[i].style.visibility = 'hidden';
            delete self.infiniteElementsCache[i]._row;
          }
        }
      };
      for (var i in changedRows) {
        if (changedRows[i] == 'delete') {
          setEl(i);
        }
        if (changedRows[i] == 'add') {
          var index = getElIndex(elementsPos[i]._row);
          el = self.infiniteElements[index];
          if (el) {
            self.infiniteElementsCache[index]._row = elementsPos[i]._row;
            for (var attrName in elementsPos[i].style) {
              if (attrName != 'height' && attrName != 'display' && attrName != 'position') {
                el.style[attrName] = elementsPos[i].style[attrName];
              }
            }
            //performance
            el.style.visibility = 'visible';
            //performance
            el.style.height = elementsPos[i]._height + 'px';
            el.style[transform] = 'translateY(' + elementsPos[i]._top + 'px) ' + translateZ;
            self.userConfig.renderHook.call(self, el, elementsPos[i]);
          }
        }
      }
    },
    //非可回收元素渲染
    _renderNoRecycledEl: function () {
      var self = this;
      var translateZ = self.userConfig.gpuAcceleration ? ' translateZ(0) ' : '';
      for (var i in self.domInfo) {
        if (self.domInfo[i]['recycled'] === false) {
          var el = self.domInfo[i].id && document.getElementById(self.domInfo[i].id.replace('#', '')) || document.createElement('div');
          var randomId = 'ks-xlist-row-' + Date.now();
          el.id = self.domInfo[i].id || randomId;
          self.domInfo[i].id = el.id;
          self.content.appendChild(el);
          for (var attrName in self.domInfo[i].style) {
            if (attrName != 'height' && attrName != 'display' && attrName != 'position') {
              el.style[attrName] = self.domInfo[i].style[attrName];
            }
          }
          el.style.top = 0;
          el.style.position = 'absolute';
          el.style.display = 'block';
          el.style.height = self.domInfo[i]._height + 'px';
          el.style[transform] = 'translateY(' + self.domInfo[i]._top + 'px) ' + translateZ;
          if (self.domInfo[i].className) {
            el.className = self.domInfo[i].className;
          }
          self.userConfig.renderHook.call(self, el, self.domInfo[i]);
        }
      }
    },
    _initSticky: function () {
      var self = this;
      if (!self.hasSticky || self._isStickyRendered)
        return;
      self._isStickyRendered = true;
      var sticky = document.createElement('div');
      sticky.style.position = 'absolute';
      sticky.style.top = '0';
      sticky.style.display = 'none';
      self.renderTo.appendChild(sticky);
      self.stickyElement = sticky;
      self.stickyDomInfo = [];
      for (var i = 0, l = self.domInfo.length; i < l; i++) {
        if (self.domInfo[i] && self.domInfo[i].style && 'sticky' == self.domInfo[i].style.position) {
          self.stickyDomInfo.push(self.domInfo[i]);
        }
      }
      self.stickyDomInfoLength = self.stickyDomInfo.length;
    },
    _stickyHandler: function (_offsetTop) {
      var self = this;
      if (!self.stickyDomInfoLength)
        return;
      var offsetTop = Math.abs(_offsetTop);
      //视区上方的sticky索引
      var index = [];
      //所有sticky的top值
      var allTops = [];
      for (var i = 0; i < self.stickyDomInfoLength; i++) {
        allTops.push(self.stickyDomInfo[i]._top);
        if (offsetTop >= self.stickyDomInfo[i]._top) {
          index.push(i);
        }
      }
      if (!index.length) {
        self.stickyElement.style.display = 'none';
        self.curStickyIndex = undefined;
        return;
      }
      var curStickyIndex = Math.max.apply(null, index);
      if (self.curStickyIndex !== curStickyIndex) {
        self.curStickyIndex = curStickyIndex;
        self.userConfig.renderHook.call(self, self.stickyElement, self.stickyDomInfo[self.curStickyIndex]);
        self.stickyElement.style.display = 'block';
        self.stickyElement.style.height = self.stickyDomInfo[self.curStickyIndex].style.height + 'px';
        self.stickyElement.className = self.stickyDomInfo[self.curStickyIndex].className || '';
        for (var attrName in self.stickyDomInfo[self.curStickyIndex].style) {
          if (attrName != 'height' && attrName != 'display' && attrName != 'position') {
            self.stickyElement.style[attrName] = self.stickyDomInfo[self.curStickyIndex].style[attrName];
          }
        }
      }
      //如果超过第一个sticky则隐藏
      if (-_offsetTop < Math.min.apply(null, allTops)) {
        self.stickyElement.style.display = 'none';
        self.curStickyIndex = undefined;
        return;
      }
    },
    enableGPUAcceleration: function () {
      var self = this;
      self.userConfig.gpuAcceleration = true;
      for (var i = 0; i < self.infiniteLength; i++) {
        if (!/translateZ/.test(self.infiniteElements[i].style[transform])) {
          self.infiniteElements[i].style[transform] += ' translateZ(0)';
        }
      }
    },
    disableGPUAcceleration: function () {
      var self = this;
      self.userConfig.gpuAcceleration = false;
      for (var i = 0; i < self.infiniteLength; i++) {
        self.infiniteElements[i].style[transform] = self.infiniteElements[i].style[transform].replace(/translateZ\(0px\)/, '');
      }
    },
    _initInfinite: function () {
      var self = this;
      var el = self.userConfig.infiniteElements;
      self.datasets = [];
      if (self.userConfig.data && self.userConfig.data.length) {
        self.datasets.push(new DataSet({ data: self.userConfig.data }));
      }
      self.infiniteElements = self.renderTo.querySelectorAll(el);
      self.infiniteLength = self.infiniteElements.length;
      self.infiniteElementsCache = function () {
        var tmp = [];
        for (var i = 0; i < self.infiniteLength; i++) {
          tmp.push({});
          //performance
          self.infiniteElements[i].style.position = 'absolute';
          self.infiniteElements[i].style.top = 0;
          self.infiniteElements[i].style.visibility = 'hidden';
          self.infiniteElements[i].style.display = 'block';
        }
        return tmp;
      }();
      self.elementsPos = {};
      self.on('scroll', function (e) {
        self._update(e.offset.y);
        self._stickyHandler(e.offset.y);
      });
    }
  });
  // commonjs export
  if (typeof module == 'object' && module.exports) {
    exports = XList;
  } else {
    window.XList = XList;
  }
  return XList;
}({});
}());