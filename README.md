# XScroll

> A Javascript Scrolling Framework For Mobile Web

## HomePage

[http://huxiaoqi567.github.io/](http://huxiaoqi567.github.io/)

## Vision

2.1.0

## Build

```
npm install bower -g
bower install xscroll

```

## Doc

### XScroll

* `config`：
    * `renderTo` 渲染节点，内部需要包含class为xs-container，xs-content两个容器
    * `height` 外容器视窗高度
	* `width` 外容器视窗宽度
	* `containerHeight` 内容器高度
	* `containerWidth` 内容器宽度
    * `scrollbarX` 是否开启横向滚动条
    * `scrollbarY` 是否开启纵向滚动条
	* `lockX` 是否锁定横向滚动
	* `lockY` 是否锁定纵向滚动
	* `gpuAcceleration` 是否开启GPU硬件加速（在性能提升的同时需要注意内存控制）
* `enableGPUAcceleration()` 开启硬件加速
* `disableGPUAcceleration()` 开启硬件加速
* `getOffset()` 获取水平和垂直偏移量，如:{x:0,y:100}
* `getOffsetTop()` 获取垂直偏移量
* `getOffsetLeft()` 获取水平偏移量
* `scrollTo(offset, duration, easing, callback)` 滚动到某处 offset必须为{x:a,y:b}格式。
* `scrollX(x, duration, easing, callback)` 水平滚动到某处
* `scrollY(y, duration, easing, callback)` 垂直滚动到某处
* `bounce(enable,callback)` 手动触发边缘回弹
* `on(event,handler)` 监听某个事件
* `fire(event)` 触发某个事件
* `detach(event,[handler])` 移除某个事件
* `plug(plugin)` 绑定插件
* `unplug(pluginId|plugin)` 移除某插件
* `getPlugin(pluginId)` 获取某个插件

### XList

- extand XScroll

* `config`：
    * `renderHook` 逐行渲染的function，和传入的data相关联
    * `itemHeight` 默认每行行高,如果data中有定义，则该属性被覆盖
    * `data` 页面的数据，为一个Array,数组中每个对象必须为{data:{},style:{},recycled:false} 的格式，其中data代表真实数据，style代表样式，recycled代表当前行dom是否需要回收

* `appendDataSet(dataset)` 添加一个数据集合
* `removeDataSet(datasetId)` 移除一个数据集合 
* `getDataSets()` 获取所有数据集合
* `getDataSetById(datasetId)` 根据集合ID获取数据集合
* `getCellByPageY(pageY)` 根据视图坐标位置获取当前行单元 
* `getCellByRow(row)` 根据行号获取当前单元 
* `getCellByOffsetY(offsetY)` 根据当前滚动容器的offsetTop值获取当前单元 
* `insertData(datasetIndex,rowIndex,data)` 插入某组数据，插入位置为第datasetIndex组，第rowIndex行
* `getData(datasetIndex,rowIndex)`
* `updateData(datasetIndex,rowIndex,data)`
* `removeData(datasetIndex,rowIndex)`


#### Private Methods

* `_getDomInfo()` 获取当前xlist文档流内所有元素的位置、样式、数据信息

### XList.DataSet

#####Example:

```
var xlist = new XList({
   //set configs here
})

var dataset = new XList.DataSet({
    id:"section1",
    data:[
    {
        data:{
            name:"Jack"
        }
    },
    {
        data:{
            name:"Tom"
        }
    }
    ]
});

//appendTo Xlist
xlist.appendDataSet(dataset);

//reflow
xlist.render();

```

* `config`
    * `id` 唯一ID，可省略 
    * `data` 传入数据
* `appendData(data)` 追加数据
* `insertData(index,data)` 插入数据至某处
* `removeData(index)` 删除数据
* `getData(index)` 获取数据，参数为空则所有数据
* `setId(datasetId)` 设置ID
* `getId()` 获取ID




## Questions?

 - Email：<huxiaoqi567@gmail.com>

