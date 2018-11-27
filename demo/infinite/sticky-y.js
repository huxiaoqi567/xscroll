import XScroll from '../../src/index';
import Infinite from '../../src/plugins/infinite';

var bgcolors = ['red', 'green', 'blue'];
var data = (function() {
  var tmp = [];
  for (var i = 1; i <= 1000; i++) {
    if (i == 2 || i == 10 || i == 20) {
      tmp.push({
        style: {position: 'sticky', background: bgcolors[i % 3], width: '100%', height: 50 + i * 5},
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
var xscroll = window.xscroll = new XScroll({
  renderTo: '#J_Scroll'
});

xscroll.on('stickychange', function(e) {
  if (!e.isRender) {
    console.log('render');
  }
});

var infinite = new Infinite({
  infiniteElements: '#J_Scroll .xs-row',
  renderHook: function(el, row) {
    if (row.style.position == 'sticky') {
      el.innerHTML = '<div class="scroller"><div class="container"><div class="content">' + row.data.num + '</div></div></div>';
      renderScroll(el.querySelector('.scroller'));
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
  xscroll.controller.add(scroll);
  scroll.on('tap', function(e) {
    console.log('tap');
  });
  return scroll;
}

infinite.on('tap', function(e) {
  var cell = e.cell;
  infinite.get(cell.sectionId, cell.index).style.background = 'red';
  xscroll.render();
});
