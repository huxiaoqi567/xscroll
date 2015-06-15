/*2015-06-03 10:41:58*/ ! function() {
	function isStartWith(e, t) {
		return 0 == e.indexOf(t)
	}

	function isEndWith(e, t) {
		var a = e.length,
			r = t.length;
		return a >= r && e.indexOf(t) == a - r
	}

	function trim(e) {
		return isString(e) ? e.replace(/^\s+|\s+$/g, "") : ""
	}

	function tryToDecodeURIComponent(e, t) {
		var a = t || "";
		if (e) try {
			a = decodeURIComponent(e)
		} catch (r) {}
		return a
	}

	function obj2param(e) {
		var t, a, r = [];
		for (t in e) e.hasOwnProperty(t) && (a = "" + e[t], r.push(isStartWith(t, s_plain_obj) ? a : t + "=" + encodeURIComponent(a)));
		return r.join("&")
	}

	function param2arr(e) {
		for (var t, a = e.split("&"), r = 0, n = a.length, o = []; n > r; r++) t = a[r].split("="), o.push([t.shift(), t.join("=")]);
		return o
	}

	function arr2param(e) {
		var t, a, r, n = [],
			o = e.length;
		for (r = 0; o > r; r++) t = e[r][0], a = e[r][1], n.push(isStartWith(t, s_plain_obj) ? a : t + "=" + encodeURIComponent(a));
		return n.join("&")
	}

	function arr2obj(e) {
		var t, a, r, n = {},
			o = e.length;
		for (r = 0; o > r; r++) t = e[r][0], a = e[r][1], n[t] = a;
		return n
	}

	function objUpdate(e, t) {
		for (var a in t) t.hasOwnProperty(a) && (e[a] = t[a]);
		return e
	}

	function param2obj(e) {
		for (var t, a = e.split("&"), r = 0, n = a.length, o = {}; n > r; r++) t = a[r].split("="), o[t[0]] = tryToDecodeURIComponent(t[1]);
		return o
	}

	function isContain(e, t) {
		return e.indexOf(t) > -1
	}

	function isNumber(e) {
		return "number" == typeof e
	}

	function isUnDefined(e) {
		return "undefined" == typeof e
	}

	function isString(e) {
		return "string" == typeof e
	}

	function isArray(e) {
		return "[object Array]" === Object.prototype.toString.call(e)
	}

	function tryToGetAttribute(e, t) {
		return e && e.getAttribute ? e.getAttribute(t) || "" : ""
	}

	function tryToGetHref(e) {
		var t;
		try {
			t = trim(e.getAttribute("href", 2))
		} catch (a) {}
		return t || ""
	}

	function getExParams() {
		var e = doc.getElementById("tb-beacon-aplus");
		return tryToGetAttribute(e, "exparams").replace(/&amp;/g, "&").replace(/\buserid=/, "uidaplus=")
	}

	function getMetaTags() {
		return _head_node = _head_node || doc.getElementsByTagName("head")[0], _meta_nodes || (_head_node ? _meta_nodes = _head_node.getElementsByTagName("meta") : [])
	}

	function parseMetaContent(e, t) {
		var a, r, n, o = e.split(";"),
			i = o.length;
		for (a = 0; i > a; a++) r = o[a].split("="), n = trim(r[0]), n && (t[n] = tryToDecodeURIComponent(trim(r[1])))
	}

	function getCookie(e) {
		var t = doc.cookie.match(new RegExp("\\b" + e + "=([^;]+)"));
		return t ? t[1] : ""
	}

	function getSPMFromUrl(e) {
		var t, a = e.match(new RegExp("\\?.*spm=([\\w\\.\\-\\*]+)"));
		return a && (t = a[1]) && 4 == t.split(".").length ? t : null
	}

	function makeCacheNum() {
		return Math.floor(268435456 * Math.random()).toString(16)
	}

	function makePVId() {
		var e = "g_aplus_pv_id",
			t = "",
			a = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		if (!win[e]) {
			for (; t.length < 6;) t += a.substr(Math.floor(62 * Math.random()), 1);
			win[e] = t
		}
		return win[e]
	}

	function getMetaAtpData() {
		var e, t, a, r = getMetaTags(),
			n = r.length;
		for (e = 0; n > e; e++) t = r[e], "atp-beacon" == tryToGetAttribute(t, "name") && (a = tryToGetAttribute(t, "content"), parseMetaContent(a, _atp_beacon_data));
		_atp_beacon_data_params = obj2param(_atp_beacon_data)
	}

	function getMetaWaiting() {
		var e, t, a, r = getMetaTags(),
			n = r.length;
		for (e = 0; n > e; e++)
			if (t = r[e], "aplus-waiting" == tryToGetAttribute(t, "name")) {
				a = tryToGetAttribute(t, "content");
				break
			}
		return a
	}

	function isOnePage() {
		var e, t, a = getMetaTags(),
			r = a.length,
			n = "-1";
		for (e = 0; r > e; e++)
			if (t = a[e], "isonepage" == tryToGetAttribute(t, "name")) {
				n = tryToGetAttribute(t, "content");
				break
			}
		return n
	}

	function getMetaOffline() {
		var e, t, a, r = getMetaTags(),
			n = r.length;
		for (e = 0; n > e; e++)
			if (t = r[e], "aplus-offline" == tryToGetAttribute(t, "name")) {
				a = tryToGetAttribute(t, "content");
				break
			}
		return a
	}

	function getMetaForbidPost() {
		var e, t, a, r = getMetaTags(),
			n = r.length;
		for (e = 0; n > e; e++)
			if (t = r[e], "aplus-forbidpost" == tryToGetAttribute(t, "name")) {
				a = tryToGetAttribute(t, "content");
				break
			}
		return a
	}

	function makeChkSum(e) {
		e = (e || "").split("#")[0].split("?")[0];
		var t = e.length,
			a = function(e) {
				var t, a = e.length,
					r = 0;
				for (t = 0; a > t; t++) r = 31 * r + e.charCodeAt(t);
				return r
			};
		return t ? a(t + "#" + e.charCodeAt(t - 1)) : -1
	}

	function onDOMReady(e) {
		var t = win.KISSY;
		t ? t.ready(e) : win.jQuery ? jQuery(doc).ready(e) : "complete" === doc.readyState ? e() : addEventListener(win, "load", e)
	}

	function recordValInWindowName() {
		var e, t;
		!is_in_iframe && is_https && (is_login_page && page_referrer ? (e = page_referrer, t = nameStorage.getItem(KEY.NAME_STORAGE.REFERRER_PV_ID)) : (e = page_url, t = pvid), nameStorage.setItem(KEY.NAME_STORAGE.REFERRER, e), nameStorage.setItem(KEY.NAME_STORAGE.REFERRER_PV_ID, t))
	}

	function addEventListener(e, t, a) {
		e[onevent]((atta ? "on" : "") + t, function(e) {
			e = e || win.event;
			var t = e.target || e.srcElement;
			a(e, t)
		}, s_false)
	}

	function atp_inIframeException() {
		var e, t, a = [];
		for (e = 0, t = a.length; t > e; e++)
			if (-1 != pathname.indexOf(a[e])) return s_true;
		var r = /^https?:\/\/[\w\.]+\.(taobao|tmall|etao|tao123|juhuasuan)\.com/i;
		return !r.test(page_referrer)
	}

	function cleanParams(e) {
		var t, a, r, n, o = [],
			i = {};
		for (t = e.length - 1; t >= 0; t--) a = e[t], r = a[0], r != s_plain_obj && i.hasOwnProperty(r) || (n = a[1], ("aplus" == r || "" != n) && (o.unshift([r, n]), i[r] = 1));
		return o
	}

	function cleanParamsForWindvane(e) {
		var t, a, r, n, o = [],
			i = {
				logtype: !0,
				cache: !0,
				scr: !0,
				"spm-cnt": !0
			};
		for (t = e.length - 1; t >= 0; t--) a = e[t], r = a[0], n = a[1], isStartWith(r, s_plain_obj) || i[r] || o.unshift([r, n]);
		return o
	}

	function tblogSend(e, t) {
		var a, r, n;
		if (t) {
			if (t = cleanParams(t), isWindVane) {
				n = cleanParamsForWindvane(t);
				var o, i = {},
					s = (getSPMFromUrl(page_url), getSPMFromUrl(page_referrer)),
					l = isOnePage(),
					c = l.split("|"),
					_ = c[0],
					u = c[1] ? c[1] : "";
				try {
					var r = arr2obj(n);
					o = JSON.stringify(r), "{}" == o && (o = "")
				} catch (d) {
					o = ""
				}
				i.functype = "2001", i.urlpagename = u, i.url = loc.href, i.spmcnt = (spm_ab || "0.0") + ".0.0", i.spmpre = s || "", i.lzsid = "", i.cna = acookie_cna || "", i.extendargs = o, i.isonepage = _, WindVane.call("WVTBUserTrack", "toUT", i)
			}
			return a = goldlog.send(e, t)
		}
	}

	function mkPlainKey() {
		return s_plain_obj + Math.random()
	}

	function addScript(e, t) {
		var a = doc.createElement("script");
		a.type = "text/javascript", a.async = !0, a.src = is_https ? t : e, doc.getElementsByTagName("head")[0].appendChild(a)
	}

	function createIframe(e, t) {
		var a = document.createElement("iframe");
		a.style.width = "1px", a.style.height = "1px", a.style.position = "absolute", a.style.display = "none", a.src = e, t && (a.name = t);
		var r = document.getElementsByTagName("body")[0];
		return r.appendChild(a), a
	}

	function checkLS() {
		var e = !1;
		if ("localStorage" in win && null != win.localStorage) try {
			localStorage.setItem("test", "test"), localStorage.removeItem("test"), e = !0
		} catch (t) {}
		return e
	}

	function isUseLSProxy() {
		if (is_https) return !1;
		var e = ua.split(" Safari/");
		return 2 != e.length ? !1 : (e[1] = trim(e[1]), !isForbidPost && checkLS() && win.postMessage && !e[1].match(/[\d\.]+?\s+.+/) && ua.indexOf("AppleWebKit") > -1 && ua.match(/\bVersion\/\d+/) && !ua.match(/\bChrome\/\d+/) && !ua.match(/TencentTraveler|QQBrowser/) && !ua.match(/UCBrowser|UCWEB/))
	}

	function useLSProxy(e) {
		var t = "//mmstat.alicdn.com/aplus-proxy.html?v=20130115",
			a = createIframe(t, JSON.stringify(e));
		proxy_iframes.push(a)
	}

	function makeUrl(e, t) {
		var a = -1 == e.indexOf("?") ? "?" : "&",
			r = t ? isArray(t) ? arr2param(t) : obj2param(t) : "";
		return r ? e + a + r : e
	}

	function getSPMProtocolFromMeta() {
		var e, t, a, r, n = getMetaTags();
		for (e = 0, t = n.length; t > e; e++) a = n[e], r = tryToGetAttribute(a, "name"), r == s_SPM_ATTR_NAME && (spm_protocol = tryToGetAttribute(a, s_SPM_DATA_PROTOCOL))
	}

	function getMetaSPMData(e) {
		var t, a, r, n, o, i, s = getMetaTags();
		if (s)
			for (t = 0, a = s.length; a > t; t++)
				if (n = s[t], o = tryToGetAttribute(n, "name"), o == e) return page_global_spm_id_origin = tryToGetAttribute(n, "content"), page_global_spm_id_origin.indexOf(":") >= 0 && (r = page_global_spm_id_origin.split(":"), spm_protocol = "i" == r[0] ? "i" : "u", page_global_spm_id_origin = r[1]), i = tryToGetAttribute(n, s_SPM_DATA_PROTOCOL), i && (spm_protocol = "i" == i ? "i" : "u"), spm_ab = page_global_spm_id_origin, s_true;
		return s_false
	}

	function ifAdd(e, t) {
		var a, r, n, o, i = t.length;
		for (a = 0; i > a; a++) r = t[a], n = r[0], o = r[1], o && e.push([n, o])
	}

	function compareVersion(e, t) {
		e = e.toString().split("."), t = t.toString().split(".");
		for (var a = 0; a < e.length || a < t.length; a++) {
			var r = parseInt(e[a], 10),
				n = parseInt(t[a], 10);
			if (window.isNaN(r) && (r = 0), window.isNaN(n) && (n = 0), n > r) return -1;
			if (r > n) return 1
		}
		return 0
	}

	function callback(e, t) {
		isAndroid && compareVersion(osVersion, "2.4.0") < 0 ? setTimeout(function() {
			e && e(t)
		}, 1) : e && e(t)
	}

	function init_getGlobalSPMId() {
		if (!isUnDefined(spm_ab)) return spm_ab;
		if (spm_a && spm_b) return spm_a = spm_a.replace(/^{(\w+)}$/g, "$1"), spm_b = spm_b.replace(/^{(\w+)}$/g, "$1"), wh_in_page = s_true, spm_ab = spm_a + "." + spm_b, getSPMProtocolFromMeta(), goldlog.spm_ab = [spm_a, spm_b], spm_ab; {
			var e;
			doc.getElementsByTagName("head")[0]
		}
		if (getMetaSPMData(s_SPM_ATTR_NAME) || getMetaSPMData("spm-id"), spm_ab = spm_ab || default_ab, !spm_ab) return spm_ab;
		var t, a = doc.getElementsByTagName("body");
		return e = spm_ab.split("."), goldlog.spm_ab = e, a = a && a.length ? a[0] : null, a && (t = tryToGetAttribute(a, s_SPM_ATTR_NAME), t ? (spm_ab = e[0] + "." + t, goldlog.spm_ab = [e[0], t]) : 1 == e.length && (spm_ab = default_ab)), spm_ab
	}

	function init_loadScripts() {
		var e = "laiwang",
			t = "ilw/a/lwlog.js?v=140709";
		isContain(loc.href.split("?")[0], e) && addScript("//g.alicdn.com/" + t, "//g.alicdn.com/" + t), onDOMReady(function() {
			setTimeout(function() {
				addScript("//h5.m.taobao.com/app/lib/js/sd_sufei_aplus.1.4.3.js", "//h5.m.taobao.com/app/lib/js/sd_sufei_aplus.1.4.3.js")
			}, 1e3)
		})
	}

	function init_windVane() {
		var WV_Core = {
				call: function(e, t, a, r, n, o) {
					var i, s;
					return lib.promise && (s = lib.promise.deferred()), i = o > 0 ? setTimeout(function() {
						WV_Core.onFailure(i, {
							ret: "TIMEOUT"
						})
					}, o) : WV_Private.getSid(), a.sid = i, WV_Private.registerCall(i, r, n, s), isAndroid ? compareVersion(wvVersion, "2.7.0") >= 0 ? WV_Private.callMethodByPrompt(e, t, WV_Private.buildParam(a), i + "") : WindVane_Native && WindVane_Native.callMethod && WindVane_Native.callMethod(e, t, WV_Private.buildParam(a), i + "") : isIOS && WV_Private.callMethodByIframe(e, t, WV_Private.buildParam(a), i + ""), s ? s.promise() : void 0
				},
				fireEvent: function(e, t) {
					var a = doc.createEvent("HTMLEvents");
					a.initEvent(e, !1, !0), a.param = WV_Private.parseParam(t), doc.dispatchEvent(a)
				},
				getParam: function(e) {
					return WV_Private.params[PARAM_PREFIX + e] || ""
				},
				onSuccess: function(e, t) {
					clearTimeout(e);
					var a = WV_Private.unregisterCall(e),
						r = a.success,
						n = a.deferred,
						o = WV_Private.parseParam(t);
					callback(function(e) {
						r && r(e), n && n.resolve(e)
					}, o.value || o), WV_Private.onComplete(e)
				},
				onFailure: function(e, t) {
					clearTimeout(e);
					var a = WV_Private.unregisterCall(e),
						r = a.failure,
						n = a.deferred,
						o = WV_Private.parseParam(t);
					callback(function(e) {
						r && r(e), n && n.reject(e)
					}, o), WV_Private.onComplete(e)
				}
			},
			WV_Private = {
				params: {},
				buildParam: function(e) {
					return e && "object" == typeof e ? JSON.stringify(e) : e || ""
				},
				parseParam: function(str) {
					if (str && "string" == typeof str) try {
						obj = JSON.parse(str)
					} catch (e) {
						obj = eval("(" + str + ")")
					} else obj = str || {};
					return obj
				},
				getSid: function() {
					return Math.floor(Math.random() * (1 << 50)) + "" + inc++
				},
				registerCall: function(e, t, a, r) {
					t && (callbackMap[SUCCESS_PREFIX + e] = t), a && (callbackMap[FAILURE_PREFIX + e] = a), r && (callbackMap[DEFERRED_PREFIX + e] = r)
				},
				unregisterCall: function(e) {
					var t = SUCCESS_PREFIX + e,
						a = FAILURE_PREFIX + e,
						r = DEFERRED_PREFIX + e,
						n = {
							success: callbackMap[t],
							failure: callbackMap[a],
							deferred: callbackMap[r]
						};
					return delete callbackMap[t], delete callbackMap[a], n.deferred && delete callbackMap[r], n
				},
				useIframe: function(e, t) {
					var a = IFRAME_PREFIX + e,
						r = iframePool.pop();
					r || (r = doc.createElement("iframe"), r.setAttribute("frameborder", "0"), r.style.cssText = "width:0;height:0;border:0;display:none;"), r.setAttribute("id", a), r.setAttribute("src", t), r.parentNode || setTimeout(function() {
						doc.body.appendChild(r)
					}, 5)
				},
				retrieveIframe: function(e) {
					var t = IFRAME_PREFIX + e,
						a = doc.querySelector("#" + t);
					iframePool.length >= iframeLimit ? doc.body.removeChild(a) : iframePool.push(a)
				},
				callMethodByIframe: function(e, t, a, r) {
					var n = {
							"selfParam=1": 1,
							sid: this.parseParam(a).sid
						},
						n = this.buildParam(n),
						o = LOCAL_PROTOCOL + "://" + e + ":" + r + "/" + t + "?" + n;
					this.params[PARAM_PREFIX + r] = a, this.useIframe(r, o)
				},
				callMethodByPrompt: function(e, t, a, r) {
					var n = LOCAL_PROTOCOL + "://" + e + ":" + r + "/" + t + "?" + a,
						o = WV_PROTOCOL + ":";
					this.params[PARAM_PREFIX + r] = a, window.prompt(n, o)
				},
				onComplete: function(e) {
					isIOS && this.retrieveIframe(e), delete this.params[PARAM_PREFIX + e]
				}
			};
		for (var key in WV_Core) win[s_goldlog][key] = WindVane[key] = WV_Core[key]
	}

	function sendPV(e) {
		var t, a, r = getSPMFromUrl(page_url),
			n = getSPMFromUrl(page_referrer),
			o = getCookie("tracknick"),
			i = getExParams();
		if (is_use_LS_proxy = isUseLSProxy(), loc_hash = loc.hash, loc_hash && 0 == loc_hash.indexOf("#") && (loc_hash = loc_hash.substr(1)), (!is_in_iframe || atp_inIframeException()) && (a = 1 == waitingMeta ? 7 : VERSION, t = [
				[mkPlainKey(), "title=" + escape(doc.title)],
				["pre", page_referrer],
				["cache", makeCacheNum()],
				["scr", screen.width + "x" + screen.height],
				["isbeta", a]
			], acookie_cna && t.push([mkPlainKey(), "cna=" + acookie_cna]), o && t.push([mkPlainKey(), "nick=" + o]), t.push(["spm-cnt", (spm_ab || "0.0") + ".0.0"]), ifAdd(t, [
				["spm-url", r],
				["spm-pre", n]
			]), tblog_data = tblog_data.concat(t), 7 == a ? setTimeout(function() {
				goldlog.launch({
					isWait: !0
				})
			}, 6e3) : (tblog_data.push([mkPlainKey(), i ? i : "aplus"]), ifAdd(tblog_data, [
				["urlokey", loc_hash],
				["aunbid", cookie_unb]
			]), e || ifAdd(tblog_data, [
				["auto", "0"]
			]), win.g_aplus_pv_req = tblogSend(tblog_beacon_url, tblog_data))), is_in_iframe) {
			getMetaAtpData();
			var s, l = _atp_beacon_data.on,
				c = "1" == l ? "//ac.mmstat.com/y.gif" : tblog_beacon_url;
			"1" != l && "2" != l || !(s = _atp_beacon_data.chksum) || s !== makeChkSum(page_url).toString() || tblogSend(c, tblog_data)
		}
		addEventListener(win, "beforeunload", function() {
			recordValInWindowName()
		})
	}
	var win = window,
		doc = document,
		_k = "g_tb_aplus_loaded",
		_launch = "g_tb_aplus_launch";
	if (!doc.getElementsByTagName("body").length) return setTimeout(arguments.callee, 50), void 0;
	if (!win[_k]) {
		win[_k] = 1;
		var js_fdc_lsproxy = "//g.alicdn.com/alilog/wlog/0.2.2/lsproxy.js",
			KEY = {
				NAME_STORAGE: {
					REFERRER: "wm_referrer",
					REFERRER_PV_ID: "refer_pv_id"
				}
			},
			VERSION = "9",
			loc = location,
			is_https = "https:" == loc.protocol,
			is_in_iframe = parent !== self,
			pathname = loc.pathname,
			hostsname = loc.hostname,
			isOffline = getMetaOffline(),
			isForbidPost = getMetaForbidPost(),
			use_protocol = is_https ? "https://" : "http://",
			tblog_beacon_base = (isOffline ? "http://" : use_protocol) + "log.mmstat.com/",
			tblog_beacon_url = tblog_beacon_base + "m.gif",
			tblog_data = [
				["logtype", is_in_iframe ? 0 : 1]
			],
			page_url = loc.href,
			page_url_constant = page_url.replace(/[\?#].*/g, ""),
			pvid = makePVId(),
			loc_hash = loc.hash,
			ua = navigator.userAgent,
			lib = win.lib || (win.lib = {}),
			isIOS = /iPhone|iPad|iPod/i.test(ua),
			isAndroid = /Android/i.test(ua),
			isWindVane = /WindVane/i.test(ua),
			osVersion = ua.match(/(?:OS|Android)[\/\s](\d+[._]\d+(?:[._]\d+)?)/i),
			wvVersion = ua.match(/WindVane[\/\s](\d+[._]\d+[._]\d+)/),
			hasOwnProperty = Object.prototype.hasOwnProperty,
			WindVane = {},
			WindVane_Native = win.WindVane_Native,
			callbackMap = {},
			inc = 1,
			iframePool = [],
			iframeLimit = 3,
			LOCAL_PROTOCOL = "hybrid",
			WV_PROTOCOL = "wv_hybrid",
			IFRAME_PREFIX = "iframe_",
			SUCCESS_PREFIX = "suc_",
			FAILURE_PREFIX = "err_",
			DEFERRED_PREFIX = "defer_",
			PARAM_PREFIX = "param_",
			page_referrer = doc.referrer,
			is_login_page = is_https && (page_url.indexOf("login.m.taobao.com") >= 0 || page_url.indexOf("login.m.tmall.com") >= 0),
			atta = !!doc.attachEvent,
			s_attachEvent = "attachEvent",
			s_addEventListener = "addEventListener",
			onevent = atta ? s_attachEvent : s_addEventListener,
			s_false = !1,
			s_true = !0,
			is_launched = s_false,
			s_plain_obj = "::-plain-::",
			s_goldlog = "goldlog",
			refer_pv_id, _head_node, _meta_nodes, acookie_cna = getCookie("cna"),
			cookie_unb = getCookie("unb"),
			proxy_iframes = [],
			is_use_LS_proxy = s_false,
			s_SPM_ATTR_NAME = "data-spm",
			s_SPM_DATA_PROTOCOL = "data-spm-protocol",
			wh_in_page = s_false,
			default_ab = "0.0",
			page_global_spm_id_origin, spm_protocol, spm_a = win._SPM_a,
			spm_b = win._SPM_b,
			spm_ab, _microscope_data = {},
			_atp_beacon_data = {},
			_atp_beacon_data_params, waitingMeta = getMetaWaiting(),
			goldlog, nameStorage = function() {
				function e() {
					var e, t = [],
						o = !0;
					for (var _ in u) u.hasOwnProperty(_) && (o = !1, e = u[_] || "", t.push(c(_) + s + c(e)));
					a.name = o ? r : n + c(r) + i + t.join(l)
				}

				function t(e, t, a) {
					e && (e.addEventListener ? e.addEventListener(t, a, !1) : e.attachEvent && e.attachEvent("on" + t, function(t) {
						a.call(e, t)
					}))
				}
				var a = window;
				if (a.nameStorage) return a.nameStorage;
				var r, n = "nameStorage:",
					o = /^([^=]+)(?:=(.*))?$/,
					i = "?",
					s = "=",
					l = "&",
					c = encodeURIComponent,
					_ = decodeURIComponent,
					u = {},
					d = {};
				return function(e) {
					if (e && 0 === e.indexOf(n)) {
						var t = e.split(/[:?]/);
						t.shift(), r = _(t.shift()) || "";
						for (var a, i, s, c = t.join(""), d = c.split(l), p = 0, m = d.length; m > p; p++) a = d[p].match(o), a && a[1] && (i = _(a[1]), s = _(a[2]) || "", u[i] = s)
					} else r = e || ""
				}(a.name), d.setItem = function(t, a) {
					t && "undefined" != typeof a && (u[t] = String(a), e())
				}, d.getItem = function(e) {
					return u.hasOwnProperty(e) ? u[e] : null
				}, d.removeItem = function(t) {
					u.hasOwnProperty(t) && (u[t] = null, delete u[t], e())
				}, d.clear = function() {
					u = {}, e()
				}, d.valueOf = function() {
					return u
				}, d.toString = function() {
					var e = a.name;
					return 0 === e.indexOf(n) ? e : n + e
				}, t(a, "beforeunload", function() {
					e()
				}), d
			}();
		page_referrer = doc.referrer || nameStorage.getItem(KEY.NAME_STORAGE.REFERRER) || "", osVersion = osVersion ? (osVersion[1] || "0.0.0").replace(/\_/g, ".") : "0.0.0", wvVersion = wvVersion ? (wvVersion[1] || "0.0.0").replace(/\_/g, ".") : "0.0.0", goldlog = {
			version: VERSION,
			referrer: page_referrer,
			_d: {},
			_microscope_data: _microscope_data,
			getCookie: getCookie,
			tryToGetAttribute: tryToGetAttribute,
			tryToGetHref: tryToGetHref,
			isNumber: isNumber,
			nameStorage: nameStorage,
			launch: function(e) {
				if (!win[_launch]) {
					win[_launch] = s_true;
					var t, a, r, n = getExParams(),
						o = 1 == waitingMeta;
					e && e.isWait && o ? (r = 7, delete e.isWait) : o ? r = 8 : o || (r = 5);
					for (t in e) e.hasOwnProperty(t) && (a = e[t]) && tblog_data.push([t, a]);
					tblog_data.push(["isbeta", r]), tblog_data.push([mkPlainKey(), n ? n : "aplus"]), ifAdd(tblog_data, [
						["urlokey", loc_hash],
						["aunbid", cookie_unb]
					]), win.g_aplus_pv_req = tblogSend(tblog_beacon_url, tblog_data)
				}
			},
			send: function(e, t) {
				var a, r = new Image,
					n = "_img_" + Math.random(),
					o = -1 == e.indexOf("?") ? "?" : "&",
					i = t ? isArray(t) ? arr2param(t) : obj2param(t) : "";
				return win[n] = r, r.onload = r.onerror = function() {
					win[n] = null
				}, r.src = a = i ? e + o + i : e, r = null, a
			},
			record: function(e, t, a, r) {
				r = arguments[3] || "";
				var n, o, i = "?",
					s = s_false,
					l = "//wgo.mmstat.com/",
					c = "//wgm.mmstat.com/",
					_ = makeCacheNum(),
					u = "",
					d = (spm_ab || "0.0") + ".0.0";
				if ("ac" == e) n = "//ac.mmstat.com/1.gif", s = isStartWith(r, "A") && r.substring(1) == makeChkSum(t);
				else if (isStartWith(e, "/")) s = isStartWith(r, "H") && r.substring(1) == makeChkSum(e), n = l + e.substring(1), o = 2, u += "&spm-cnt=" + d;
				else if (isEndWith(e, ".gif")) n = tblog_beacon_base + e;
				else {
					if ("aplus" != e) return s_false;
					n = c + "mx.gif", o = 1
				}
				if (!s && "%" != r && makeChkSum(page_url_constant) != r) return s_false;
				if (a = (a || "") + (loc_hash ? "&urlokey=" + encodeURIComponent(loc_hash) : "") + (cookie_unb ? "&aunbid=" + encodeURIComponent(cookie_unb) : ""), 0 == a.indexOf("&") && (a = a.substr(1)), n += i + "cache=" + _ + "&gmkey=" + encodeURIComponent(t) + "&gokey=" + encodeURIComponent(a) + "&cna=" + acookie_cna + "&isbeta=" + VERSION + u, o && (n += "&logtype=" + o), isWindVane) {
					var p, m = {},
						g = {
							gmkey: t,
							gokey: a,
							isbeta: VERSION
						},
						f = isOnePage(),
						b = f.split("|"),
						h = b[0],
						v = b[1] ? b[1] : "";
					try {
						p = JSON.stringify(g), "{}" == p && (p = "")
					} catch (P) {
						p = ""
					}
					m.functype = "2101", m.logkey = e, m.logkeyargs = p, m.urlpagename = v, m.url = loc.href, m.cna = acookie_cna || "", m.extendargs = "", m.isonepage = h, WindVane.call("WVTBUserTrack", "toUT", m)
				}
				return goldlog.send(n)
			},
			sendPV: function() {
				tblog_data = [
					["logtype", is_in_iframe ? 0 : 1]
				], spm_ab = void 0, spm_ab = init_getGlobalSPMId(), sendPV(!1)
			}
		}, win[s_goldlog] = goldlog, init_getGlobalSPMId(), init_loadScripts(), isWindVane && init_windVane(), sendPV(!0)
	}
}(); /*2015-06-03 10:41:58*/
! function() {
	function t(t) {
		var e, n;
		try {
			return e = [].slice.call(t)
		} catch (r) {
			e = [], n = t.length;
			for (var a = 0; n > a; a++) e.push(t[a]);
			return e
		}
	}

	function e(t, e) {
		return t && t.getAttribute ? t.getAttribute(e) || "" : ""
	}

	function n(t, e, n) {
		if (t && t.setAttribute) try {
			t.setAttribute(e, n)
		} catch (r) {}
	}

	function r(t, e) {
		if (t && t.removeAttribute) try {
			t.removeAttribute(e)
		} catch (r) {
			n(t, e, "")
		}
	}

	function a(t, e) {
		return 0 == t.indexOf(e)
	}

	function i(t) {
		for (var e = ["javascript:", "tel:", "sms:", "mailto:", "tmall://"], n = 0, r = e.length; r > n; n++)
			if (a(t, e[n])) return !0
	}

	function o(t) {
		return "string" == typeof t
	}

	function c(t) {
		return "[object Array]" === Object.prototype.toString.call(t)
	}

	function u(t, e) {
		return t.indexOf(e) >= 0
	}

	function f(t, e) {
		return t.indexOf(e) > -1
	}

	function s(t, e) {
		for (var n = 0, r = e.length; r > n; n++)
			if (f(t, e[n])) return he;
		return ve
	}

	function m(t) {
		return o(t) ? t.replace(/^\s+|\s+$/g, "") : ""
	}

	function l(t) {
		return "undefined" == typeof t
	}

	function p(t, e) {
		var n = e || "";
		if (t) try {
			n = decodeURIComponent(t)
		} catch (r) {}
		return n
	}

	function d() {
		return fe = fe || de.getElementsByTagName("head")[0], se || (fe ? se = fe.getElementsByTagName("meta") : [])
	}

	function g(t, e) {
		var n, r, a = t.split(";"),
			i = a.length;
		for (n = 0; i > n; n++) r = a[n].split("="), e[m(r[0]) || Me] = p(m(r.slice(1).join("=")))
	}

	function h() {
		var t, n, r, a, i = d();
		for (t = 0, n = i.length; n > t; t++) r = i[t], a = e(r, "name"), a == De && (me = e(r, ze))
	}

	function v(t) {
		var n, r, i, o, c, u, f = d();
		if (f)
			for (n = 0, r = f.length; r > n; n++)
				if (o = f[n], c = e(o, "name"), c == t) return oe = e(o, "content"), oe.indexOf(":") >= 0 && (i = oe.split(":"), me = "i" == i[0] ? "i" : "u", oe = i[1]), u = e(o, ze), u && (me = "i" == u ? "i" : "u"), ce = a(oe, "110"), ie = ce ? Oe : oe, he;
		return ve
	}

	function b() {
		var t, n, r, a = d(),
			i = a.length;
		for (t = 0; i > t; t++)
			if (n = a[t], "aplus-offline" == e(n, "name")) {
				r = e(n, "content");
				break
			}
		return r
	}

	function y() {
		var t, n, r, a = d(),
			i = a.length;
		for (t = 0; i > t; t++)
			if (n = a[t], "aplus-touch" == e(n, "name")) {
				r = e(n, "content");
				break
			}
		return r
	}

	function w() {
		return Math.floor(268435456 * Math.random()).toString(16)
	}

	function N(t) {
		var e, n, r = [];
		for (e in t) t.hasOwnProperty(e) && (n = "" + t[e], r.push(a(e, Me) ? n : e + "=" + encodeURIComponent(n)));
		return r.join("&")
	}

	function A(t) {
		var e, n, r, i = [],
			o = t.length;
		for (r = 0; o > r; r++) e = t[r][0], n = t[r][1], i.push(a(e, Me) ? n : e + "=" + encodeURIComponent(n));
		return i.join("&")
	}

	function x(t) {
		var e;
		try {
			e = m(t.getAttribute("href", 2))
		} catch (n) {}
		return e || ""
	}

	function j(t, e, n) {
		return "tap" == e ? (_(t, n), void 0) : (t[Ie](($e ? "on" : "") + e, function(t) {
			t = t || pe.event;
			var e = t.target || t.srcElement;
			n(e)
		}, ve), void 0)
	}

	function _(t, e) {
		var n = "ontouchend" in document.createElement("div"),
			r = n ? "touchstart" : "mousedown";
		j(t, r, function(t) {
			e && e(t)
		})
	}

	function k(t) {
		var e = pe.KISSY;
		e ? e.ready(t) : pe.jQuery ? jQuery(de).ready(t) : "complete" === de.readyState ? t() : j(pe, "load", t)
	}

	function E(t, e) {
		var n, r = new Image,
			a = "_img_" + Math.random(),
			i = -1 == t.indexOf("?") ? "?" : "&",
			o = e ? c(e) ? A(e) : N(e) : "";
		return pe[a] = r, r.onload = r.onerror = function() {
			pe[a] = null
		}, r.src = n = o ? t + i + o : t, r = null, n
	}

	function O() {
		var t;
		if (ke && !Ye && (t = be.match(/^[^?]+\?[^?]*spm=([^&?]+)/), t && (Ye = t[1] + "_")), !l(ie)) return ie;
		if (pe._SPM_a && pe._SPM_b) return re = pe._SPM_a.replace(/^{(\w+)}$/g, "$1"), ae = pe._SPM_b.replace(/^{(\w+)}$/g, "$1"), Le = he, ie = re + "." + ae, h(), ie;
		if (v(De) || v("spm-id"), !ie) return Te = !0, ie = Oe, Oe;
		var n, r, a = de.getElementsByTagName("body");
		return a = a && a.length ? a[0] : null, a && (n = e(a, De), n && (r = ie.split("."), ie = r[0] + "." + n)), f(ie, ".") || (Te = !0, ie = Oe), ie
	}

	function T(t) {
		var e, n, r, a, i, o, c = de.getElementsByTagName("*");
		for (e = []; t && 1 == t.nodeType; t = t.parentNode)
			if (o = t.id) {
				for (a = 0, n = 0; n < c.length; n++)
					if (i = c[n], i.id == o) {
						a++;
						break
					}
				if (e.unshift(t.tagName.toLowerCase() + '[@id="' + o + '"]'), 1 == a) return e.unshift("/"), e.join("/")
			} else {
				for (n = 1, r = t.previousSibling; r; r = r.previousSibling) r.tagName == t.tagName && n++;
				e.unshift(t.tagName.toLowerCase() + "[" + n + "]")
			}
		return e.length ? "/" + e.join("/") : null
	}

	function M(t) {
		var e = Re[T(t)];
		return e ? e.spmc : ""
	}

	function S(n) {
		var r, a, i, o, c, u, f, s, m = [];
		for (r = t(n.getElementsByTagName("a")), a = t(n.getElementsByTagName("area")), o = r.concat(a), f = 0, s = o.length; s > f; f++) {
			for (u = !1, c = i = o[f];
				(c = c.parentNode) && c != n;)
				if (e(c, De)) {
					u = !0;
					break
				}
			u || m.push(i)
		}
		return m
	}

	function B(t, n, r) {
		var i, c, f, s, m, l, p, d, g, h, v, b, y, w;
		if (e(t, "data-spm-delay")) return t.setAttribute("data-spm-delay", ""), void 0;
		if (n = n || t.getAttribute(De) || "") {
			if (i = S(t), f = n.split("."), b = a(n, "110") && 3 == f.length, b && (y = f[2], f[2] = "w" + (y || "0"), n = f.join(".")), o(d = O()) && d.match(/^[\w\-\*]+(\.[\w\-\*]+)?$/))
				if (u(n, ".")) {
					if (!a(n, d)) {
						for (s = d.split("."), f = n.split("."), h = 0, g = s.length; g > h; h++) f[h] = s[h];
						n = f.join(".")
					}
				} else u(d, ".") || (d += ".0"), n = d + "." + n;
			if (n.match && n.match(/^[\w\-\*]+\.[\w\-\*]+\.[\w\-\*]+$/)) {
				for (w = parseInt(e(t, "data-spm-max-idx")) || 0, v = 0, m = w, g = i.length; g > v; v++) c = i[v], l = x(c), l && (b && c.setAttribute(Ke, y), (p = c.getAttribute(qe)) ? U(c, p, r) : (m++, p = n + "." + (z(c) || m), U(c, p, r)));
				t.setAttribute("data-spm-max-idx", m)
			}
		}
	}

	function $(t) {
		var e, n = ["mclick.simba.taobao.com", "click.simba.taobao.com", "click.tanx.com", "click.mz.simba.taobao.com", "click.tz.simba.taobao.com", "redirect.simba.taobao.com", "rdstat.tanx.com", "stat.simba.taobao.com", "s.click.taobao.com"],
			r = n.length;
		for (e = 0; r > e; e++)
			if (-1 != t.indexOf(n[e])) return !0;
		return !1
	}

	function C(t) {
		return t ? !!t.match(/^[^\?]*\balipay\.(?:com|net)\b/i) : ve
	}

	function P(t) {
		return t ? !!t.match(/^[^\?]*\balipay\.(?:com|net)\/.*\?.*\bsign=.*/i) : ve
	}

	function I(t) {
		for (var n;
			(t = t.parentNode) && t.tagName != Be;)
			if (n = e(t, ze)) return n;
		return ""
	}

	function L(t, e) {
		if (t && /&?\bspm=[^&#]*/.test(t) && (t = t.replace(/&?\bspm=[^&#]*/g, "").replace(/&{2,}/g, "&").replace(/\?&/, "?").replace(/\?$/, "")), !e) return t;
		var n, r, a, i, o, c, u, s = "&";
		if (-1 != t.indexOf("#") && (a = t.split("#"), t = a.shift(), r = a.join("#")), i = t.split("?"), o = i.length - 1, a = i[0].split("//"), a = a[a.length - 1].split("/"), c = a.length > 1 ? a.pop() : "", o > 0 && (n = i.pop(), t = i.join("?")), n && o > 1 && -1 == n.indexOf("&") && -1 != n.indexOf("%") && (s = "%26"), t = t + "?spm=" + Ye + e + (n ? s + n : "") + (r ? "#" + r : ""), u = f(c, ".") ? c.split(".").pop().toLowerCase() : "") {
			if ({
					png: 1,
					jpg: 1,
					jpeg: 1,
					gif: 1,
					bmp: 1,
					swf: 1
				}.hasOwnProperty(u)) return 0;
			!n && 1 >= o && (r || {
				htm: 1,
				html: 1,
				php: 1
			}.hasOwnProperty(u) || (t += "&file=" + c))
		}
		return t
	}

	function R(t) {
		return t && be.split("#")[0] == t.split("#")[0]
	}

	function U(t, n, r) {
		if (t.setAttribute(qe, n), !r && !e(t, Qe)) {
			var o = x(t),
				c = "i" == (e(t, ze) || I(t) || me),
				u = je + "tbspm.1.1?logtype=2&spm=";
			o && !$(o) && (c || !(a(o, "#") || R(o) || i(o.toLowerCase()) || C(o) || P(o))) && (c ? (u += n + "&url=" + encodeURIComponent(o) + "&cache=" + w(), le == t && E(u)) : r || (o = L(o, n)) && D(t, o))
		}
	}

	function D(t, e) {
		var n, r = t.innerHTML;
		r && -1 == r.indexOf("<") && (n = de.createElement("b"), n.style.display = "none", t.appendChild(n)), t.href = e, n && t.removeChild(n)
	}

	function z(t) {
		var n, r, a;
		return Te ? n = "0" : Le ? (r = T(t), a = Re[r], a && (n = a.spmd)) : (n = e(t, De), n && n.match(/^d\w+$/) || (n = "")), n
	}

	function H(t) {
		for (var e, n, r = t; t && t.tagName != Se && t.tagName != Be && t.getAttribute;) {
			if (n = Le ? M(t) : t.getAttribute(De)) {
				e = n, r = t;
				break
			}
			if (!(t = t.parentNode)) break
		}
		return e && !/^[\w\-\.]+$/.test(e) && (e = "0"), {
			spm_c: e,
			el: r
		}
	}

	function Q(t) {
		var e;
		return t && (e = t.match(/&?\bspm=([^&#]*)/)) ? e[1] : ""
	}

	function Y(t, e) {
		var n = x(t),
			r = Q(n),
			a = null,
			i = ie && 2 == ie.split(".").length;
		return i ? (a = [ie, 0, z(t) || 0], U(t, a.join("."), e), void 0) : (n && r && (n = n.replace(/&?\bspm=[^&#]*/g, "").replace(/&{2,}/g, "&").replace(/\?&/, "?").replace(/\?$/, "").replace(/\?#/, "#"), D(t, n)), void 0)
	}

	function K(t, n) {
		le = t;
		var r, a, i = e(t, qe);
		if (i) U(t, i, n);
		else {
			if (r = H(t.parentNode), a = r.spm_c, !a) return Y(t, n), void 0;
			Te && (a = "0"), B(r.el, a, n)
		}
	}

	function q(e) {
		if (e && 1 == e.nodeType) {
			r(e, "data-spm-max-idx");
			var n, a = t(e.getElementsByTagName("a")),
				i = t(e.getElementsByTagName("area")),
				o = a.concat(i),
				c = o.length;
			for (n = 0; c > n; n++) r(o[n], qe)
		}
	}

	function F(t) {
		var e = t.parentNode;
		if (!e) return "";
		var n = t.getAttribute(De),
			r = H(e),
			a = r.spm_c || 0;
		a && -1 != a.indexOf(".") && (a = a.split("."), a = a[a.length - 1]);
		var i = ie + "." + a,
			o = Ee[i] || 0;
		return o++, Ee[i] = o, n = n || o, i + ".i" + n
	}

	function G(t) {
		var n, r = t.tagName;
		return ue = pe.g_aplus_pv_id, "A" != r && "AREA" != r ? n = F(t) : (K(t, he), n = e(t, qe)), n = (n || "0.0.0.0").split("."), {
			a: n[0],
			b: n[1],
			c: n[2],
			d: n[3]
		}
	}

	function J(t) {
		var e = G(t);
		return e.a + "." + e.b + "." + e.c + "." + e.d
	}

	function V() {
		if (!Ue) {
			if (!pe.spmData) return _e || setTimeout(arguments.callee, 100), void 0;
			Ue = he;
			var t, e, n, r, a = pe.spmData.data;
			if (a && c(a))
				for (t = 0, e = a.length; e > t; t++) n = a[t], r = n.xpath, Re[r] = {
					spmc: n.spmc,
					spmd: n.spmd
				}
		}
	}

	function W() {
		var t, n, r, a, i = de.getElementsByTagName("iframe"),
			o = i.length;
		for (n = 0; o > n; n++) t = i[n], !t.src && (r = e(t, He)) && (a = G(t), a ? (a = [a.a, a.b, a.c, a.d, a.e].join("."), t.src = L(r, a)) : t.src = r)
	}

	function X() {
		function t() {
			e++, e > 10 && (n = 3e3), W(), setTimeout(t, n)
		}
		var e = 0,
			n = 500;
		t()
	}

	function Z(t, e) {
		var n, r, i = "gostr",
			o = "locaid",
			c = {};
		if (g(e, c), n = c[i], r = c[o], n && r) {
			a(n, "/") && (n = n.substr(1));
			var u, f = G(t),
				s = [f.a, f.b, f.c, r].join("."),
				m = n + "." + s,
				l = ["logtype=2", "cache=" + Math.random(), "autosend=1"];
			for (u in c) c.hasOwnProperty(u) && u != i && u != o && l.push(u + "=" + c[u]);
			l.length > 0 && (m += "?" + l.join("&")), E(je + m), t.setAttribute(qe, s)
		}
	}

	function te(t) {
		for (var n; t && t.tagName != Se;) {
			n = e(t, Qe); {
				if (n) {
					Z(t, n);
					break
				}
				t = t.parentNode
			}
		}
	}

	function ee() {
		Ae ? j(de, "tap", te) : j(de, "mousedown", te)
	}

	function ne(t) {
		for (var e; t && (e = t.tagName);) {
			if ("A" == e || "AREA" == e) {
				K(t, ve);
				break
			}
			if (e == Be || e == Se) break;
			t = t.parentNode
		}
	}
	var re, ae, ie, oe, ce, ue, fe, se, me, le, pe = window,
		de = document,
		ge = location,
		he = !0,
		ve = !1,
		be = ge.href,
		ye = ge.protocol,
		we = "https:" == ye,
		Ne = b(),
		Ae = y(),
		xe = we ? "https:" : "http:",
		je = (Ne ? "http:" : xe) + "//wgo.mmstat.com/",
		_e = ve,
		ke = parent !== self,
		Ee = {},
		Oe = "0.0",
		Te = !1,
		Me = "::-plain-::",
		Se = "HTML",
		Be = "BODY",
		$e = !!de.attachEvent,
		Ce = "attachEvent",
		Pe = "addEventListener",
		Ie = $e ? Ce : Pe,
		Le = ve,
		Re = {},
		Ue = ve,
		De = "data-spm",
		ze = "data-spm-protocol",
		He = "data-spm-src",
		Qe = "data-spm-click",
		Ye = "",
		Ke = "data-spm-wangpu-module-id",
		qe = "data-spm-anchor-id";
	s(be, ["xiaobai.com", "admin.taobao.org"]) || (k(function() {
		_e = he
	}), O(), V(), X(), ee(), Ae ? j(de, "tap", ne) : (j(de, "mousedown", ne), j(de, "keydown", ne)), pe.g_SPM = {
		resetModule: q,
		anchorBeacon: K,
		getParam: G,
		spm: J
	})
}(); /*2015-06-03 10:41:58*/
! function() {
	function t(t, e, r) {
		t[j]((v ? "on" : "") + e, function(t) {
			t = t || m.event;
			var e = t.target || t.srcElement;
			r(t, e)
		}, !1)
	}

	function e() {
		return /&?\bspm=[^&#]*/.test(location.href) ? location.href.match(/&?\bspm=[^&#]*/gi)[0].split("=")[1] : ""
	}

	function r(t, e) {
		if (t && /&?\bspm=[^&#]*/.test(t) && (t = t.replace(/&?\bspm=[^&#]*/g, "").replace(/&{2,}/g, "&").replace(/\?&/, "?").replace(/\?$/, "")), !e) return t;
		var r, a, i, n, o, c, p, m = "&";
		if (-1 != t.indexOf("#") && (i = t.split("#"), t = i.shift(), a = i.join("#")), n = t.split("?"), o = n.length - 1, i = n[0].split("//"), i = i[i.length - 1].split("/"), c = i.length > 1 ? i.pop() : "", o > 0 && (r = n.pop(), t = n.join("?")), r && o > 1 && -1 == r.indexOf("&") && -1 != r.indexOf("%") && (m = "%26"), t = t + "?spm=" + e + (r ? m + r : "") + (a ? "#" + a : ""), p = c.indexOf(".") > -1 ? c.split(".").pop().toLowerCase() : "") {
			if ({
					png: 1,
					jpg: 1,
					jpeg: 1,
					gif: 1,
					bmp: 1,
					swf: 1
				}.hasOwnProperty(p)) return 0;
			!r && 1 >= o && (a || {
				htm: 1,
				html: 1,
				php: 1
			}.hasOwnProperty(p) || (t += "&file=" + c))
		}
		return t
	}

	function a(t) {
		function e(t) {
			return t = t.replace(/refpos[=(%3D)]\w*/gi, c).replace(n, "%3D" + a + "%26" + i.replace("=", "%3D")).replace(o, a), i.length > 0 && (t += "&" + i), t
		}
		var r = window.location.href,
			a = r.match(/mm_\d{0,24}_\d{0,24}_\d{0,24}/i),
			i = r.match(/[&\?](pvid=[^&]*)/i),
			n = new RegExp("%3Dmm_\\d+_\\d+_\\d+", "ig"),
			o = new RegExp("mm_\\d+_\\d+_\\d+", "ig");
		i = i && i[1] ? i[1] : "";
		var c = r.match(/(refpos=(\d{0,24}_\d{0,24}_\d{0,24})?(,[a-z]+)?)(,[a-z]+)?/i);
		return c = c && c[0] ? c[0] : "", a ? (a = a[0], e(t)) : t
	}

	function i(e) {
		var r = m.KISSY;
		r ? r.ready(e) : m.jQuery ? jQuery(f).ready(e) : "complete" === f.readyState ? e() : t(m, "load", e)
	}

	function n(t, e) {
		return t && t.getAttribute ? t.getAttribute(e) || "" : ""
	}

	function o(t) {
		if (t) {
			var e, r = b.length;
			for (e = 0; r > e; e++)
				if (t.indexOf(b[e]) > -1) return !0;
			return !1
		}
	}

	function c(t, e) {
		if (t && /&?\bspm=[^&#]*/.test(t) && (t = t.replace(/&?\bspm=[^&#]*/g, "").replace(/&{2,}/g, "&").replace(/\?&/, "?").replace(/\?$/, "")), !e) return t;
		var r, a, i, n, o, c, p, m = "&";
		if (-1 != t.indexOf("#") && (i = t.split("#"), t = i.shift(), a = i.join("#")), n = t.split("?"), o = n.length - 1, i = n[0].split("//"), i = i[i.length - 1].split("/"), c = i.length > 1 ? i.pop() : "", o > 0 && (r = n.pop(), t = n.join("?")), r && o > 1 && -1 == r.indexOf("&") && -1 != r.indexOf("%") && (m = "%26"), t = t + "?spm=" + e + (r ? m + r : "") + (a ? "#" + a : ""), p = c.indexOf(".") > -1 ? c.split(".").pop().toLowerCase() : "") {
			if ({
					png: 1,
					jpg: 1,
					jpeg: 1,
					gif: 1,
					bmp: 1,
					swf: 1
				}.hasOwnProperty(p)) return 0;
			!r && 1 >= o && (a || {
				htm: 1,
				html: 1,
				php: 1
			}.hasOwnProperty(p) || (t += "&__file=" + c))
		}
		return t
	}

	function p(t) {
		if (o(t.href)) {
			var r = n(t, g);
			if (!r) {
				if (!d) return;
				var a = d(t),
					i = [a.a, a.b, a.c, a.d, a.e].join(".");
				h && (i = [a.a || "0", a.b || "0", a.c || "0", a.d || "0"].join("."), i = (e() || "0.0.0.0.0") + "_" + i);
				var p = c(t.href, i);
				t.href = p, t.setAttribute(g, i)
			}
		}
		t = void 0
	}
	var m = window,
		f = document,
		s = location,
		l = (s.href, m._alimm_spmact_on_);
	if ("undefined" == typeof l && (l = 1), 1 == l && (l = 1), 0 == l && (l = 0), l) {
		try {
			var d = m.g_SPM.getParam
		} catch (u) {
			d = function() {
				return {
					a: 0,
					b: 0,
					c: 0,
					d: 0,
					e: 0
				}
			}
		}
		var h = !0;
		try {
			h = self.location != top.location
		} catch (u) {}
		var g = "data-spm-act-id",
			b = ["mclick.simba.taobao.com", "click.simba.taobao.com", "click.tanx.com", "click.mz.simba.taobao.com", "click.tz.simba.taobao.com", "redirect.simba.taobao.com", "rdstat.tanx.com", "stat.simba.taobao.com", "s.click.taobao.com"],
			v = !!f.attachEvent,
			_ = "attachEvent",
			w = "addEventListener",
			j = v ? _ : w;
		t(f, "mousedown", function(t, e) {
			for (var r, a = 0; e && (r = e.tagName) && 5 > a;) {
				if ("A" == r || "AREA" == r) {
					p(e);
					break
				}
				if ("BODY" == r || "HTML" == r) break;
				e = e.parentNode, a++
			}
		}), i(function() {
			for (var t, i, o = document.getElementsByTagName("iframe"), c = 0; c < o.length; c++) {
				t = n(o[c], "mmsrc"), i = n(o[c], "mmworked");
				var p = d(o[c]),
					m = [p.a || "0", p.b || "0", p.c || "0", p.d || "0", p.e || "0"].join(".");
				t && !i ? (h && (m = [p.a || "0", p.b || "0", p.c || "0", p.d || "0"].join("."), m = e() + "_" + m), o[c].src = r(a(t), m), o[c].setAttribute("mmworked", "mmworked")) : o[c].setAttribute(g, m)
			}
		})
	}
}();