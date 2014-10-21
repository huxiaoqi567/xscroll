![XScroll结构图](http://gtms01.alicdn.com/tps/i1/TB1Pmu9FVXXXXaZXFXXEBpbZpXX-1720-1162.png_600x600.jpg)

XScroll
=======

移动端的模拟滚动方案

弹性动画、滚动动画、手势无限接近IOS的native滚动体验

### Plugin

* 滚动条 scrollbar

### Event

* 拖拽 pan
* 点击 tap/tapHold
* 缩放 pinch

### Demo

* [xscroll](../demo/xscroll.html)

* [2d-scroll](../demo/2d.html)

* [xlist-xscroll](../demo/xlist-xscroll.html)
	

## API说明

### Config

#### renderTo 

渲染节点

#### width 

外容器视窗宽度

#### height 

外容器视窗高度

#### containerWidth 

内容器宽度

#### containerHeight 

内容器高度

### Method

#### render() 

渲染

#### translate(offset) 

移动 offset.x offset.y

#### translateX(x) 

水平移动

#### translateY(y) 

垂直移动

#### getOffset() 

获取滚动距离对象，包含x,y两个方向

#### getOffsetTop()

获取顶部滚动卷去的距离

#### getOffsetLeft()

获取左边滚动卷去的距离

#### scrollTo(offset, duration, easing, callback) 

滚动至

#### scrollX(x, duration, easing,callback) 

横向滚动

#### scrollY(y, duration, easing,callback) 

纵向滚动

#### bounce(isEnabled) 

是否允许边缘回弹

#### boundry.expandTop(pixel)

拓展上边界

#### boundry.expandLeft(pixel)

拓展左边界

#### boundry.expandRight(pixel)

拓展右边界

#### boundry.expandBottom(pixel)

拓展下边界

#### boundry.reset()

边界复位、复位拓展项，初始化为滚动容器的位置尺寸


### ATTRS

- width  滚动区域宽度

- height  滚动区域高度

- containerWidth  内容器宽度

- containerHeight  内容器高度

- scale  缩放比

- minScale 最小缩放比

- maxScale 最大缩放比

- x 水平偏移量

- y 垂直偏移量

- lockX 是否锁定水平滚动（默认false）

- lockY 是否锁定垂直滚动（默认false）




### Event

#### scrollend 

滚动结束触发

#### scroll

滚动时触发

#### panstart 

手指开始滑动时触发

#### pan 

手指滑动时触发

#### panend 

手指滑动结束后触发

#### scrollanimate

调用scrollTo,scrollX,scrollY发生滚动动画时触发，返回offset、duration、easing等信息

#### scaleanimate

调用scaleTo发生缩放时触发，返回scale、duration、easing等信息

#### afterrender 

渲染后触发
