
##xscroll 3.0 升级计划

###概要：

#####手势 gesture
直接基于目前成熟的hammer.js，包含 Pan(平移)、Pinch(缩放)、Press(按下)、Rotate(旋转)、Swipe(轻滑)、Tap(点触)。
hammerjs http://hammerjs.github.io/

#####核心 core
拆分core-origin/core-simulate两个模块，分别处理原生和模拟滚动方式，支持无缝切换。该种切换支持手动、自动两种方式，且部分功能 （如 scale） 可能会不可用。

#####工具类 util
常用工具方法封装。

#####基类 base 
类似于kissy.base 支持自定义事件(event)、插件(plugin)可拔插机制。event可参考
Backbone.Events

#####核心组件 components
将常用的非核心部分组件，作为components的方式集成至core。

#####插件 plugins
可拔插、按需加载的插件体系。

如：

pulldown 下拉刷新

pullup 上拉加载

infinite 无尽列表

snap 截断式滚动

zoom 缩放

multiview 多个滚动嵌套控制

xlist变更：

插件化infinite，拓展xscroll原型链关于数据操作的接口。

计划安排

core优先进行开发，主要通过xscroll对原生和模拟滚动的进行接口统一。
util   

    base 基类
    
event

    plugin 
    
hammer 手势接入 pan tap

core-simulate   模拟滚动

animate
timer
bezier
core-origin 原生滚动
plugin开发
scrollbar
pull 上下左右的Pull都可以基于这个类开发
pulldown  继承pull
pullup  继承pull
multiview 多个滚动嵌套
applications上层应用型组件
tab
slider
tablist
sliderview
navigationview
indicatorview
官网建设
首页
demo
文档













![结构图](http://gtms04.alicdn.com/tps/i4/TB13LoRGVXXXXXmXpXX7yy27VXX-1414-1128.png_600x600.jpg)


