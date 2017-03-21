
# xscroll

Xscroll - A Javascript Scrolling Framework For Mobile Web

## Install

```
npm install xscroll

```
## HomePage

[http://xscroll.github.io/](http://xscroll.github.io/)


## Document

[http://xscroll.github.io/node_modules/xscroll/doc/XScroll.html](http://xscroll.github.io/node_modules/xscroll/doc/XScroll.html)

## Demo

[http://xscroll.github.io/demo.html](http://xscroll.github.io/demo.html)

![construct](http://gtms04.alicdn.com/tps/i4/TB13LoRGVXXXXXmXpXX7yy27VXX-1414-1128.png_600x600.jpg)



 - Email：<huxiaoqi567@gmail.com>


## ChangeLog    

### v2.1.1
- pinch缩放优化
- 滚动条计算问题
- 去除mouse事件

### v2.2.0
- 优化边界反弹动画效果
- 支持水平方向无尽滚动
- 修复滚动停止时重绘、闪烁的问题
- 新增useTransition配置，支持帧动画
- 新增easing配置 如：ease ease-out easeq-in
- API调整 
    - getCellByRow -> getCellByRowOrCol
    - getCellByOffsetTop -> getCellByOffset
    - getCellByPageY -> getCellByPagePos


### v2.3.0
- 新增snap功能
- 新增多个xscroll相互嵌套的管理机制

### v2.3.1
- DataSet guid重复问题
- 修复部分安卓设备无法点停的问题
- 修复执行stop()后定时器仍然执行的问题
- 滚动条默认隐藏
- 新增boundryout api
- scrollanimate和panend触发顺序调整

### v2.3.2
- 修复bounce为false后报错的问题

### v3.0.0
- 大版本升级，xlist插件化

### v3.1.2
- 修复点击 触发2次的问题