'use strict';

import XScroll from '../src/index';

let xscroll = new XScroll({
  renderTo: '#scroll',
  preventDefault: true,
  // SCROLL_ACCELERATION:0.0025
  // useTransition:true,
  // gpuAcceleration:false,
  // useOriginScroll:true
});

xscroll.render();
