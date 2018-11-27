import XScroll from '../../src/index';
import PullDown from '../../src/plugins/pulldown';

var xscroll = new XScroll({
  renderTo:"#scroll",
  lockX:true,
  scrollbarX:false
})

var pulldown = new PullDown({
  downContent:'',
  upContent:'',
  loadingContent:'',
  content:'<div class="sample-content">pulldown to refresh</div>'
}) ;

xscroll.plug(pulldown);

pulldown.on('statuschange',function(e){
  pulldown.pulldown.querySelector(".sample-content").innerHTML = JSON.stringify(e);
})


xscroll.render();
