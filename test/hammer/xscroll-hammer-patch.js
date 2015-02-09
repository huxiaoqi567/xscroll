;
(function() {
  XScroll.prototype.panEndHandler = function(e) {
    var self = this;
    var userConfig = self.userConfig;
    e.velocityX = -(Math.abs(e.velocityX) < 0.35 ? 0 : e.velocityX)
    e.velocityY = -(Math.abs(e.velocityY) < 0.35 ? 0 : e.velocityY)
    var transX = self._bounce('x', e.velocityX);
    var transY = self._bounce('y', e.velocityY);
    var x = transX ? transX.offset : 0;
    var y = transY ? transY.offset : 0;
    var duration;
    if (transX && transY && transX.status && transY.status && transX.duration && transY.duration) {
      //ensure the same duration
      duration = Math.max(transX.duration, transY.duration);
    }
    if (transX) {
      self.scrollX(x, duration || transX.duration, transX.easing, function(e) {
        self._scrollEndHandler('x');
      });
    }
    if (transY) {
      self.scrollY(y, duration || transY.duration, transY.easing, function(e) {
        self._scrollEndHandler('y');
      });
    }
    //judge the direction
    self.directionX = e.velocityX < 0 ? 'left' : 'right';
    self.directionY = e.velocityY < 0 ? 'up' : 'down';
  }

  XScroll.prototype._bindEvt = function() {
    var self = this;
    if (self.__isEvtBind)
      return;
    var PAN_RATE = 0.36;
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
    var mc = new Hammer.Manager(renderTo);
    var pinch = new Hammer.Pinch();
    var pan = new Hammer.Pan();
    var tap = new Hammer.Tap();
    mc.add([tap, pan, pinch]);
    mc.on("panstart", function(e) {
      if(self.isScaling) return;
      self._prevSpeed = 0;
      offset = self.getOffset();
      self.translate(offset);
      console.log(e.deltaX)
      self._firePanStart(XScroll.Util.mix(e, {
        offset: offset
      }));
    });

    mc.on("pan", function(e) {
      if(self.isScaling) return;
      var posY = self.userConfig.lockY ? Number(offset.y) : Number(offset.y) + e.deltaY;
      var posX = self.userConfig.lockX ? Number(offset.x) : Number(offset.x) + e.deltaX;
      containerWidth = self.containerWidth;
      containerHeight = self.containerHeight;
      console.log(e.deltaX)
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
      //pan trigger the opposite direction
      self.directionX = e.type == 'panleft' ? 'right' : e.type == 'panright' ? 'left' : '';
      self.directionY = e.type == 'panup' ? 'bottom' : e.type == 'pandown' ? 'top' : '';
      self._firePan(XScroll.Util.mix(e, {
        offset: {
          x: posX,
          y: posY
        },
        directionX: e.directionX,
        directionY: e.directionY,
        triggerType: "pan"
      }));
      self.fire("scroll", XScroll.Util.mix(e, {
        offset: {
          x: posX,
          y: posY
        },
        directionX: self.directionX,
        directionY: self.directionY,
        triggerType: "pan"
      }));

    });

    mc.on("panend", function(e) {
      if(self.isScaling) return;
      self.panEndHandler(e);
      self._firePanEnd(e);
    })


    if (self.userConfig.useTransition) {
      container.addEventListener("webkitTransitionEnd", function(e) {
        if (e.target == content && !self.isScaling) {
          self.__scrollEndCallbackX && self.__scrollEndCallbackX({
            type: 'x'
          });
        }
        if (e.target == container && !self.isScaling) {
          self.__scrollEndCallbackY && self.__scrollEndCallbackY({
            type: 'y'
          });
        }
      }, false)
    }


    document.addEventListener("touchstart", function(e) {
      // e.preventDefault();
      // self._fireTouchStart(e);
      // if (self.isScrollingX || self.isScrollingY) {
      //   self.stop();
      // }
    }, false)



    //scalable
    if (self.userConfig.scalable) {
      var originX, originY;
      //init pinch gesture
      mc.on("pinchstart", function(e) {
        scale = self.scale;
        originX = (e.center.x - self.x) / self.containerWidth;
        originY = (e.center.y - self.y) / self.containerHeight;
        self.fire("pinchstart", {
          scale: scale,
          origin: {
            x: originX,
            y: originY
          }
        });
      })


      mc.on("pinch", function(e) {
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
        self.fire("pinch", {
          scale: __scale,
          origin: {
            x: originX,
            y: originY
          }
        });
      })


      mc.on("pinchend", function(e) {
        var SCALE_TO_DURATION = 300;
        self.isScaling = false;
        if (self.scale < self.minScale) {
          self.scaleTo(self.minScale, originX, originY, SCALE_TO_DURATION);
        } else if (self.scale > self.maxScale) {
          self.scaleTo(self.maxScale, originX, originY, SCALE_TO_DURATION);
        }
        console.log("pinchend")
        self.fire("pinchend", {
          scale: scale,
          origin: {
            x: originX,
            y: originY
          }
        });
      })

      mc.on("tap", function(e) {
        console.log(mc.get("tap").options)
        if (e.tapCount == 1) {
          if (!self.isScrollingX && !self.isScrollingY) {
            // simulateMouseEvent(e, 'click');
            self._fireClick('click', e);
          } else {
            self.isScrollingX = false;
            self.isScrollingY = false;
          }
        }

        if (e.tapCount == 2) {
          originX = (e.center.x - self.x) / self.containerWidth;
          originY = (e.center.y - self.y) / self.containerHeight;
          self.scale > self.minScale ? self.scaleTo(self.minScale, originX, originY, 200) : self.scaleTo(self.maxScale, originX, originY, 200);
        }
      })


    }
  }
})()