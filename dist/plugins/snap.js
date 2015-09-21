"use strict";
var Util = require('../util');
var Base = require('../base');
/**
 * a snap plugin for xscroll,wich support vertical and horizontal snap.
 * @constructor
 * @param {object} cfg
 * @param {number} cfg.snapColIndex initial col index
 * @param {number} cfg.snapRowIndex initial row index
 * @param {number} cfg.snapDuration duration for snap animation
 * @param {string} cfg.snapEasing easing for snap animation
 * @param {number} cfg.snapOffsetLeft an offset from left boundry for snap wich default value is 0
 * @param {number} cfg.snapOffsetTop an offset from top boundry for snap wich default value is 0
 * @param {boolean} cfg.autoStep which step is based on scroll velocity
 * @extends {Base}
 */
var Snap = function(cfg) {
  Snap.superclass.constructor.call(this, cfg);
  this.userConfig = Util.mix({
    snapColIndex: 0,
    snapRowIndex: 0,
    snapDuration: 500,
    snapEasing: "ease",
    snapOffsetLeft: 0,
    snapOffsetTop: 0,
    autoStep: false //autostep
  }, cfg);
}

Util.extend(Snap, Base, {
  /**
   * a pluginId
   * @memberOf Snap
   * @type {string}
   */
  pluginId: "snap",
  /**
   * plugin initializer
   * @memberOf Snap
   * @override Base
   * @return {Snap}
   */
  pluginInitializer: function(xscroll) {
    var self = this;
    self.xscroll = xscroll.render();
    self.snapColIndex = self.userConfig.snapColIndex;
    self.snapRowIndex = self.userConfig.snapRowIndex;
    self.render();
  },
  /**
   * detroy the plugin
   * @memberOf Snap
   * @override Base
   */
  pluginDestructor: function() {
    var self = this;
    var xscroll = self.xscroll;
    xscroll.on("panend", xscroll._onpanend, xscroll);
    xscroll.off("panend", self._snapAnimate, self);
  },
  /**
   * scroll to a col and row with animation
   * @memberOf Snap
   * @param {number} col col-index
   * @param {number} row row-index
   * @param {number} duration duration for animation ms
   * @param {string} easing easing for animation
   * @param {function} callback callback function after animation
   * @return {Snap}
   */
  snapTo: function(col, row, duration, easing, callback) {
    this.snapToCol(col, duration, easing, callback);
    this.snapToRow(row, duration, easing, callback);
    return this;
  },
  /**
   * scroll to a col with animation
   * @memberOf Snap
   * @param {number} col col-index
   * @param {number} duration duration for animation ms
   * @param {string} easing easing for animation
   * @param {function} callback callback function after animation
   * @return {Snap}
   */
  snapToCol: function(col, duration, easing, callback) {
    var self = this;
    var xscroll = self.xscroll;
    var userConfig = self.userConfig;
    var duration = duration || userConfig.snapDuration;
    var easing = easing || userConfig.snapEasing;
    var snapWidth = userConfig.snapWidth;
    var snapColsNum = userConfig.snapColsNum;
    var snapOffsetLeft = userConfig.snapOffsetLeft;
    col = col >= snapColsNum ? snapColsNum - 1 : col < 0 ? 0 : col;
    self.prevColIndex = self.snapColIndex;
    self.snapColIndex = col;
    var left = self.snapColIndex * snapWidth + snapOffsetLeft;
    if(left > xscroll.containerWidth - xscroll.boundry.width){
      left = xscroll.containerWidth - xscroll.boundry.width;
    }
    xscroll.scrollLeft(left, duration, easing, callback);
    return self;
  },
  _colChange: function(e) {
    var self = this;
    if (self.prevColIndex != self.snapColIndex) {
      self.trigger('colchange',Util.mix(e,{
        type:'colchange',
        curColIndex: self.snapColIndex,
        prevColIndex: self.prevColIndex
      }));
    }
    return self;
  },
  /**
   * scroll to a row with animation
   * @memberOf Snap
   * @param {number} row row-index
   * @param {number} duration duration for animation ms
   * @param {string} easing easing for animation
   * @param {function} callback callback function after animation
   * @return {Snap}
   */
  snapToRow: function(row, duration, easing, callback) {
    var self = this;
    var xscroll = self.xscroll;
    var userConfig = self.userConfig;
    var duration = duration || userConfig.snapDuration;
    var easing = easing || userConfig.snapEasing;
    var snapHeight = userConfig.snapHeight;
    var snapRowsNum = userConfig.snapRowsNum;
    var snapOffsetTop = userConfig.snapOffsetTop;
    row = row >= snapRowsNum ? snapRowsNum - 1 : row < 0 ? 0 : row;
    self.prevRowIndex = self.snapRowIndex;
    self.snapRowIndex = row;
    var top = self.snapRowIndex * snapHeight + snapOffsetTop;
    if(top > xscroll.containerHeight - xscroll.boundry.height){
      top = xscroll.containerHeight - xscroll.boundry.height;
    }
    self.xscroll.scrollTop(top, duration, easing,callback);
    return self;
  },
  _rowChange: function(e) {
    var self = this;
    if (self.prevRowIndex != self.snapRowIndex) {
      self.trigger('rowchange', Util.mix(e,{
        type:'rowchange',
        curRowIndex: self.snapRowIndex,
        prevRowIndex: self.prevRowIndex,
      }));
    }
    return self;
  },
  /*
         left  => 2;
         right => 4;
         up    => 8;
         down  => 16;
  */
  _snapAnimate: function(e) {
    var self = this;
    var userConfig = self.userConfig;
    var snapWidth = userConfig.snapWidth;
    var snapHeight = userConfig.snapHeight;
    self.xscroll.__topstart = null;
    self.xscroll.__leftstart = null;
    var cx = snapWidth / 2;
    var cy = snapHeight / 2;
    var direction = e.direction;
    if (Math.abs(e.velocity) <= 0.2) {
      var left = self.xscroll.getScrollLeft();
      var top = self.xscroll.getScrollTop();
      var snapColIndex = Math.round(left / snapWidth);
      var snapRowIndex = Math.round(top / snapHeight);
      self.snapTo(snapColIndex, snapRowIndex);
    } else if (userConfig.autoStep) {
      var transX = self.xscroll.computeScroll("x", e.velocityX);
      var transY = self.xscroll.computeScroll("y", e.velocityY);
      var snapColIndex = transX && transX.pos ? Math.round(transX.pos / snapWidth) : self.snapColIndex;
      var snapRowIndex = transY && transY.pos ? Math.round(transY.pos / snapHeight) : self.snapRowIndex;
      var duration = Math.ceil(transX && transX.duration, transY && transY.duration);
      if (transX && transX.status == "inside") {
        self.snapToCol(snapColIndex, duration, transX && transX.easing, function() {
          self.xscroll.boundryCheckX();
        });
      } else if (transX) {
        self.xscroll.scrollLeft(transX.pos, transX.duration, transX.easing, function() {
          self.xscroll.boundryCheckX();
          self.prevColIndex = self.snapColIndex;
          self.snapColIndex = Math.round(Math.abs(self.xscroll.getScrollLeft()) / snapWidth);
        });
      }
      if (transY && transY.status == "inside") {
        self.snapToRow(snapRowIndex, duration, transY && transY.easing, function() {
          self.xscroll.boundryCheckY();
        });
      } else if (transY) {
        self.xscroll.scrollTop(transY.pos, transY.duration, transY.easing, function() {
          self.xscroll.boundryCheckY();
          self.prevRowIndex = self.snapRowIndex;
          self.snapRowIndex = Math.round(Math.abs(self.xscroll.getScrollTop()) / snapHeight);
        });
      }
    } else {
      direction == 2 ? self.snapColIndex++ : direction == 4 ? self.snapColIndex-- : undefined;
      direction == 8 ? self.snapRowIndex++ : direction == 16 ? self.snapRowIndex-- : undefined;
      self.snapTo(self.snapColIndex, self.snapRowIndex);
    }
  },
  /**
   * render snap plugin
   * @memberOf Snap
   * @return {Snap}
   */
  render: function() {
    var self = this;
    var xscroll = self.xscroll;
    self.userConfig.snapWidth = self.userConfig.snapWidth || xscroll.width || 100;
    self.userConfig.snapHeight = self.userConfig.snapHeight || xscroll.height || 100;
    self.userConfig.snapColsNum = self.userConfig.snapColsNum || Math.max(Math.round(xscroll.containerWidth / xscroll.width), 1);
    self.userConfig.snapRowsNum = self.userConfig.snapRowsNum || Math.max(Math.round(xscroll.containerHeight / xscroll.height), 1);
    //remove default listener
    xscroll.off("panend", xscroll._onpanend);
    xscroll.on("panend", self._snapAnimate, self);
    self._bindEvt();
    return self;
  },
  _bindEvt:function(){
    var self =this;
    var xscroll = self.xscroll;
    if(self._isEvtBinded) return;
    self._isEvtBinded = true;
    xscroll.on("scrollend",function(e){
      if(e.zoomType == 'y' && !xscroll.isBoundryOutTop() && !xscroll.isBoundryOutBottom()){
        self._rowChange(e);
      }
    })
    xscroll.on("scrollend",function(e){
      if(e.zoomType == 'x' && !xscroll.isBoundryOutLeft() && !xscroll.isBoundryOutRight()){
        self._colChange(e);
      }
    })
  }
});

if (typeof module == 'object' && module.exports) {
  module.exports = Snap;
}
