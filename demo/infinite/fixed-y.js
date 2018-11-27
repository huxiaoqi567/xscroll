import XScroll from '../../src/index';
import Infinite from '../../src/plugins/infinite';
import PullDown from '../../src/plugins/pulldown';

var bgcolors = ['red', 'green', 'blue'];
var data = (function() {
  var tmp = [];
  for (var i = 1; i <= 100; i++) {
    if (i == 2 || i == 4 || i == 7) {
      tmp.push({
        style: {position: 'fixed', background: bgcolors[i % 3], width: '100%', height: 50 + i * 5},
        data: {num: i}
      });
    } else {
      tmp.push({
        style: {background: '#fff', height: 100},
        data: {num: i}
      });
    }

  }
  return tmp;
})();
var xscroll = new XScroll({
  renderTo: '#J_Scroll',
  scrollbarY: false,
  // useOriginScroll:true
});

xscroll.on('fixedchange', function(e) {

});

xscroll.plug(new PullDown());

var infinite = new Infinite({
  infiniteElements: '#J_Scroll .xs-row',
  renderHook: function(el, row) {
    if (row.style.position == 'fixed') {
      el.innerHTML = '<div class="container"><div class="content">' + row.data.num + '</div></div>';
      // renderScroll(el);
    } else {
      el.innerHTML = row.data.num;
    }
  }
});
xscroll.render();
xscroll.plug(infinite);
infinite.append(0, data);
xscroll.render();



function renderScroll(el, background) {
  var scroll = new XScroll({
    renderTo: el,
    lockX: false,
    lockY: true,
    container: '.container',
    content: '.content'
  });
  scroll.render();
  scroll.content.style.background = background || 'none';
  // xscroll.controller.add(scroll)
  scroll.on('tap', function(e) {
    console.log('tap');
  });
  return scroll;
}

