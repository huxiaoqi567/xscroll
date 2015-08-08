(function(win) {
	var originLog = window.console.log;

	window.console.log = function(msg, clear) {
		var id = "element_for_console";
		var el = document.getElementById(id);
		if (!el) {
			el = document.createElement('div');
			el.id = id;
			el.style.position = "fixed";
			el.style.top = 0;
			el.style.right = 0;
			el.style['min-height'] = "100px";
			el.style.width = "100%";
			el.style.background = "#000";
			el.style.opacity = 0.6;
			el.style.color = "#fff";
			el.style.zIndex = 9999;
			document.body.appendChild(el);
		}
		if (!clear) {
			var row = document.createElement('div');
			row.innerHTML = JSON.stringify(msg);
			el.appendChild(row);
		} else {
			el.innerHTML = msg;
		}

	};

	window.console.originLog = originLog;


})(window)