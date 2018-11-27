import XScroll from '../../src/index';
import Infinite from '../../src/plugins/infinite';


var data = (function() {
  var tmp = [];
  for (var i = 1; i <= 100; i++) {
    tmp.push({data: {num: i}, style: {width: 100, background: '#fff', fontSize: '12px', color: '#000'}});
  }
  return tmp;
})();

var xscroll = new XScroll({
  renderTo: '#J_Scroll',
  zoomType: 'x',
});

var infinite = new Infinite({
  infiniteElements: '#J_Scroll .xs-row',
  renderHook: function(el, row) {
    el.innerText = row.data.num;
  }
});


xscroll.plug(infinite);

infinite.append(0, data);

xscroll.render();

window.xscroll = xscroll;
window.infinite = infinite;

setTimeout(function() {
  infinite.get(0, 0).style.width = 200;
  xscroll.render();
}, 1000);


setTimeout(function() {
  infinite.get(0, 0).style.width = 100;
  xscroll.render();
}, 2000);


setTimeout(function() {
  infinite.get(0, 0).style.background = '#000';
  xscroll.render();
}, 3000);


setTimeout(function() {
  infinite.remove(0, 0);
  xscroll.render();
}, 4000);

setTimeout(function() {
  infinite.get(0, 0).data.num = 'scale';
  infinite.get(0, 0).style.fontSize = '24px';
  infinite.get(0, 0).style.color = '#fff';
  infinite.get(0, 0).style.background = 'red';
  infinite.get(0, 0).style.width = 100;
  xscroll.render();
}, 5000);

setTimeout(function() {
  infinite.remove(0, 0);
  xscroll.render();
}, 6000);
