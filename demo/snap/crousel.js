import XScroll from '../../src/index';
import Snap from '../../src/plugins/snap';

var xscroll = new XScroll({
  renderTo: '#J_Scroll',
  preventDefault: false,
  preventTouchMove: false,
  touchAction: 'pan-y'
});

xscroll.on('panstart', function(e) {
  // pan-vertical  to lock scroll
  if (e.direction == 8 || e.direction == 16) {
    xscroll.userConfig.lockX = true;
  }
});
xscroll.on('panend', function(e) {
  xscroll._resetLockConfig();
});

var snap = new Snap({
  snapWidth: window.remFontSize * 16 + 2,
  snapColsNum: 5,
});
xscroll.plug(snap);
xscroll.render();
