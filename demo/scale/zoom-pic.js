import XScroll from '../../src/index';
import Scale from '../../src/plugins/scale';

var xscroll = new XScroll({
  renderTo: '#J_Scroll',
  // lockX:true,
  useTransition: true
});

var scale = new Scale({
  minScale: 1,
  maxScale: 2
});

xscroll.plug(scale);

xscroll.render();
