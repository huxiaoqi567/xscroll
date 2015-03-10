     var Util = require('../util');
     var Base = require('../base');

     /**
     * a snap plugin for xscroll,wich support vertical and horizontal snap.
     * @constructor
     * @param {object} cfg
     * @extends {Base}
     */
     var Snap = function(cfg) {
         Snap.superclass.constructor.call(this, cfg);
         this.userConfig = Util.mix({
             snapColIndex: 0,
             snapRowIndex: 0,
             snapDuration: 500,
             snapEasing: "ease",
             snapOffsetLeft:0,
             snapOffsetTop:0,
             autoStep:false //autostep
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

         snapTo: function(col, row, duration, easing, callback) {
             this.snapToCol(col, duration, easing, callback);
             this.snapToRow(row, duration, easing, callback);
         },
         snapToCol: function(col, duration, easing, callback) {
             var self = this;
             var userConfig = self.userConfig;
             var duration = duration || userConfig.snapDuration;
             var easing = easing || userConfig.snapEasing;
             var snapWidth = userConfig.snapWidth;
             var snapColsNum = userConfig.snapColsNum;
             var snapOffsetLeft = userConfig.snapOffsetLeft;
             col = col >= snapColsNum ? snapColsNum - 1 : col < 0 ? 0 : col;
             self.snapColIndex = col;
             var left = self.snapColIndex * snapWidth + snapOffsetLeft;
             self.xscroll.scrollLeft(left, duration, easing, callback);
         },
         snapToRow: function(row, duration, easing, callback) {
             var self = this;
             var userConfig = self.userConfig;
             var duration = duration || userConfig.snapDuration;
             var easing = easing || userConfig.snapEasing;
             var snapHeight = userConfig.snapHeight;
             var snapRowsNum = userConfig.snapRowsNum;
             var snapOffsetTop = userConfig.snapOffsetTop;
             row = row >= snapRowsNum ? snapRowsNum - 1 : row < 0 ? 0 : row;
             self.snapRowIndex = row;
             var top = self.snapRowIndex * snapHeight + snapOffsetTop;
             self.xscroll.scrollTop(top, duration, easing, callback);
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
             var cx = snapWidth / 2;
             var cy = snapHeight / 2;
             var direction = e.direction;
             if (Math.abs(e.velocity) <= 0.2) {
                 var left = Math.abs(self.xscroll.getScrollLeft());
                 var top = Math.abs(self.xscroll.getScrollTop());
                 self.snapColIndex = Math.round(left / snapWidth);
                 self.snapRowIndex = Math.round(top / snapHeight);
                 self.snapTo(self.snapColIndex, self.snapRowIndex);
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
                 } else if(transX){
                     self.xscroll.scrollLeft(transX.pos, transX.duration, transX.easing, function() {
                         self.xscroll.boundryCheckX();
                         self.snapColIndex = Math.round(Math.abs(self.xscroll.getScrollLeft()) / snapWidth);
                     });
                 }
                 if (transY && transY.status == "inside") {
                     self.snapToRow(snapRowIndex, duration, transY && transY.easing, function() {
                         self.xscroll.boundryCheckY();
                     });
                 } else if(transY){
                     self.xscroll.scrollTop(transY.pos, transY.duration, transY.easing, function() {
                         self.xscroll.boundryCheckY();
                         self.snapRowIndex = Math.round(Math.abs(self.xscroll.getScrollTop()) / snapHeight);
                     });
                 }
             } else {
                 direction == 2 ? self.snapColIndex++ : direction == 4 ? self.snapColIndex-- : undefined;
                 direction == 8 ? self.snapRowIndex++ : direction == 16 ? self.snapRowIndex-- : undefined;
                 self.snapTo(self.snapColIndex, self.snapRowIndex);
             }
         },
         render: function() {
             var self = this;
             var xscroll = self.xscroll;
             self.userConfig.snapWidth = self.userConfig.snapWidth || xscroll.width || 100;
             self.userConfig.snapHeight = self.userConfig.snapHeight || xscroll.height || 100;
             self.userConfig.snapColsNum = self.userConfig.snapColsNum || Math.max(Math.round(xscroll.containerWidth / xscroll.width), 1);
             self.userConfig.snapRowsNum = self.userConfig.snapRowsNum || Math.max(Math.round(xscroll.containerHeight / xscroll.height), 1);
             //remove default listener
             self.xscroll.mc.off("panend")
             self.xscroll.mc && self.xscroll.mc.on("panend", function(e) {
                 self.xscroll.__topstart = null;
                 self.xscroll.__leftstart = null;
                 self._snapAnimate(e);
             });
         }
     });

     if (typeof module == 'object' && module.exports) {
         module.exports = Snap;
     } 