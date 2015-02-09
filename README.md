
## xscroll 3.0 升级计划

### 概要：

##### 手势 gesture

直接基于目前成熟的hammer.js，包含 Pan(平移)、Pinch(缩放)、Press(按下)、Rotate(旋转)、Swipe(轻滑)、Tap(点触)。
hammerjs http://hammerjs.github.io/

##### 核心 core

拆分core-origin/core-simulate两个模块，分别处理原生和模拟滚动方式，支持无缝切换。该种切换支持手动、自动两种方式，且部分功能 （如 scale） 可能会不可用。

##### 工具类 util

常用工具方法封装。

##### 基类 base 

类似于kissy.base 支持自定义事件(event)、插件(plugin)可拔插机制。event可参考
Backbone.Events

##### 非核心组件 components

将常用的非核心部分组件，作为components的方式集成至core。

##### 插件 plugins

可拔插、按需加载的插件体系。


##### xlist变更：

- 插件化infinite
- 废弃dataset，新接口拟为：
    - finite.insertBefore(section,index,data);
    - infinite.insertAfter(section,index,data);
    - infinite.replace(section,index,data);  // update
    - inifinite.append(section,data);
    - infinite.delete(section,from,[number]);
- 支持局部更新渲染，dom重排可带动画

### 计划安排

##### core优先进行开发，主要通过xscroll对原生和模拟滚动的进行接口统一。

- util 工具
- base 基类
- event 事件 移植Backbone.Events
- hammer 手势接入 pan tap pinch
- core 作为滚动核心基类
- core-simulate   模拟滚动
- core-origin 原生滚动
- xscroll 作为一个router实例化simulate/origin
- animate 
- timer
- controller 滚动嵌套控制器
- xscrollmaster 掌管页面上多个xscroll实例的事件交互

##### plugin开发

- pulldown  下拉刷新
- pullup  继承pull
- infinite 无尽列表
- snap 带有截断效果的滚动，可直接用作非旋转木马的slider
- lazyload 图片懒加载
- scale 缩放插件
- indicator 缩略图
- swipeedit 侧滑编辑
- fastscroll 滚动加速

##### applications上层应用型组件

- tab   
- slider
- tablist
- slider
- navigationview


##### 官网建设

##### 首页

##### demo

##### 文档






![结构图](http://gtms04.alicdn.com/tps/i4/TB13LoRGVXXXXXmXpXX7yy27VXX-1414-1128.png_600x600.jpg)


