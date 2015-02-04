 // var SNAP_START = "snapstart";
 // var SNAP = "snap";
 // var SNAP_END = "snapend";

 define(function(require, exports, module) {
     var Util = require('../util');
     var Base = require('../base');

     var Snap = function(cfg) {
         Snap.superclass.constructor.call(this, cfg);
         this.userConfig = Util.mix({
             snapColIndex: 0,
             snapRowIndex: 0,
             snapDuration: 500,
             snapEasing: "ease"
         }, cfg);
     }

     Util.extend(Snap, Base, {
         pluginId: "snap",
         pluginInitializer: function(xscroll) {
             var self = this;
             self.xscroll = xscroll;
             self.snapColIndex = self.userConfig.snapColIndex;
             self.snapRowIndex = self.userConfig.snapRowIndex;
             prefix = self.userConfig.prefix;
                self.xscroll.render();
                self.render();
         },
         pluginDestructor: function() {
             var self = this;
             delete self;
         },

         snapTo: function(col, row, callback) {
             var self = this;
             var userConfig = self.userConfig;
             var snapWidth = userConfig.snapWidth;
             var snapHeight = userConfig.snapHeight;
             var snapColsNum = userConfig.snapColsNum;
             var snapRowsNum = userConfig.snapRowsNum;
             col = col >= snapColsNum ? snapColsNum - 1 : col < 0 ? 0 : col;
             row = row >= snapRowsNum ? snapRowsNum - 1 : row < 0 ? 0 : row;
             self.snapRowIndex = row;
             self.snapColIndex = col;
             var top = self.snapRowIndex * snapHeight;
             var left = self.snapColIndex * snapWidth;
             self.xscroll.scrollTo(left, top, userConfig.snapDuration, userConfig.snapEasing, callback);
         },
         //snap
         _snapAnimate: function(e) {
             var self = this;
             var userConfig = self.userConfig;
             var snapWidth = userConfig.snapWidth;
             var snapHeight = userConfig.snapHeight;
             var cx = snapWidth / 2;
             var cy = snapHeight / 2;
             var direction = e.direction;
             /*
                left  => 2;
                right => 4;
                up    => 8;
                down  => 16;
             */
             if (Math.abs(e.velocity) > 0.5) {
                 direction == 2 ? self.snapColIndex++ : direction == 4 ? self.snapColIndex-- : undefined;
                 direction == 8 ? self.snapRowIndex++ : direction == 16 ? self.snapRowIndex-- : undefined;
             } else {
                 var left = Math.abs(self.xscroll.getScrollLeft());
                 var top = Math.abs(self.xscroll.getScrollTop());
                 self.snapColIndex = Math.round(left / snapWidth);
                 self.snapRowIndex = Math.round(top / snapHeight);
             }
             self.snapTo(self.snapColIndex, self.snapRowIndex);
         },
         render: function() {
             var self = this;
             var xscroll = self.xscroll;
             self.userConfig.snapWidth = self.userConfig.snapWidth || xscroll.width || 100;
             self.userConfig.snapHeight = self.userConfig.snapHeight || xscroll.height || 100;
             self.userConfig.snapColsNum = self.userConfig.snapColsNum || Math.max(Math.round(xscroll.containerWidth / xscroll.width), 1);
             self.userConfig.snapRowsNum = self.userConfig.snapRowsNum || Math.max(Math.round(xscroll.containerHeight / xscroll.height), 1);
             self.xscroll.mc && self.xscroll.mc.on("panend", function(e) {
                 self._snapAnimate(e);
             });
         }
     });

     if (typeof module == 'object' && module.exports) {
         module.exports = Snap;
     } else {
         return Snap;
     }

 });