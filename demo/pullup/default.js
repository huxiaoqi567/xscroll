import XScroll from '../../src/index';
import Infinite from '../../src/plugins/infinite';
import PullUp from '../../src/plugins/pullup';
import mock from './mock';

var page = 1;

var totalPage = 2;

var pageCache = {};

var xscroll = new XScroll({
  renderTo: '#J_Scroll'
});


var infinite = new Infinite({
  infiniteElements: '#J_Scroll .xs-row',
  renderHook: function(el, row) {
    el.innerText = row.data.num;
  }
});

var pullup = new PullUp({
  upContent: '上拉加载更多',
  downContent: '释放加载更多',
  loadingContent: '加载中...',
  bufferHeight: 0
});

xscroll.plug(pullup);

pullup.on('loading', function() {
  getData();
});

getData();



function getData() {
  if (!pageCache[page]) {
    pageCache[page] = 1;

    setTimeout(() => {
      if (page > totalPage) {
        // destroy plugin
        xscroll.unplug(pullup);
        xscroll.boundryCheck();
        return;
      };
      infinite.append(0, JSON.parse(JSON.stringify(mock)));
      xscroll.render();
      // loading complete
      pullup.complete();
      page++;
    }, 500);

  }
}



xscroll.plug(infinite);


xscroll.render();
