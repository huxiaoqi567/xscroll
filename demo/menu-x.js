 function menuX(renderTo) {
     var xscroll = new XScroll({
         renderTo: renderTo,
         scrollbarY: false,
         scrollbarX: false,
         lockY: true
     });
     xscroll.render();
     var menuWidth = document.querySelector(renderTo + " li").offsetWidth;
     var curIndex = 0;
     //click to move
     xscroll.renderTo.addEventListener("click", function(e) {
         var offsetX = xscroll.getOffsetLeft();
         var index = Math.floor((e.pageX + Math.abs(offsetX)) / menuWidth);
         switchTo(index);
     });

     var prev = document.querySelector(".prev");
     var next = document.querySelector(".next");
     prev.addEventListener("touchstart", prevTo);
     next.addEventListener("touchstart", nextTo);

     var menus = document.querySelectorAll(renderTo + " li");
     switchTo(0)

     function switchTo(index) {
         if (index < 0 || index > menus.length - 1) return;
         if (index == 0) {
             prev.className = !/disable/.test(prev.className) ? prev.className + " disable" : prev.className;
             next.className = next.className.replace(/disable/, "");
         } else if (index == menus.length - 1) {
             next.className = !/disable/.test(next.className) ? next.className + " disable" : next.className;
             prev.className = prev.className.replace(/disable/, "");
         }
         for (var i in menus) {
             menus[i].className = "";
         }
         menus[index].className = "cur";
         var offset = index * menuWidth - xscroll.width/2 +  menuWidth/2 ;
         if (offset < 0) {
             offset = 0;
         } else if (offset > xscroll.containerWidth - xscroll.width) {
             offset = xscroll.containerWidth - xscroll.width
         }
         xscroll.scrollX(offset, 200)
         curIndex = index;
     }

     function prevTo() {
         if (curIndex <= 0) {
             switchTo(curIndex);
             return;
         }
         curIndex--;
         switchTo(curIndex);
     }

     function nextTo() {
         if (curIndex >= menus.length - 1) {
             switchTo(curIndex);
             return;
         }
         curIndex++;
         switchTo(curIndex);
     }
 }