import XScroll from '../../src/index';
import Infinite from '../../src/plugins/infinite';

var xscroll = new XScroll({
  renderTo: '#J_Scroll',
  // useOriginScroll:true
});

var infinite = new Infinite({
  infiniteElements: '#J_Scroll .xs-row',
  renderHook: function(el, row) {
    el.innerHTML = row.data.html;
  }
});

xscroll.plug(infinite);



for (var k = 1; k <= 5; k++) {

  infinite.append(k, {
    data: {
      html: '<div class="title">Section ' + k + '</div>'
    },
    style: {
      height: 50,
      'line-height': '50px',
      'text-indent': '10px',
      'color': '#fff',
      'background': '#f60',
      'position': 'sticky',
      'width': '100%'
    }
  });

  for (var i = 1; i <= 5; i++) {
    infinite.append(k, {
      data: {
        html: '<div class="item">' + i + '</div>'
      },
      style: {
        height: 150,
        'color': '#000',
        'background': '#fff'
      }
    });
  }
}

xscroll.render();
