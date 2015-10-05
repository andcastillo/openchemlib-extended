(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["openchemlibExtended"] = factory();
	else
		root["openchemlibExtended"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(1);

	module.exports = exports = __webpack_require__(4);
	exports.DB = __webpack_require__(5);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(clearImmediate, process) {(function (global, undefined) {
	    "use strict";

	    if (global.setImmediate) {
	        return;
	    }

	    var nextHandle = 1; // Spec says greater than zero
	    var tasksByHandle = {};
	    var currentlyRunningATask = false;
	    var doc = global.document;
	    var setImmediate;

	    function addFromSetImmediateArguments(args) {
	        tasksByHandle[nextHandle] = partiallyApplied.apply(undefined, args);
	        return nextHandle++;
	    }

	    // This function accepts the same arguments as setImmediate, but
	    // returns a function that requires no arguments.
	    function partiallyApplied(handler) {
	        var args = [].slice.call(arguments, 1);
	        return function() {
	            if (typeof handler === "function") {
	                handler.apply(undefined, args);
	            } else {
	                (new Function("" + handler))();
	            }
	        };
	    }

	    function runIfPresent(handle) {
	        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
	        // So if we're currently running a task, we'll need to delay this invocation.
	        if (currentlyRunningATask) {
	            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
	            // "too much recursion" error.
	            setTimeout(partiallyApplied(runIfPresent, handle), 0);
	        } else {
	            var task = tasksByHandle[handle];
	            if (task) {
	                currentlyRunningATask = true;
	                try {
	                    task();
	                } finally {
	                    clearImmediate(handle);
	                    currentlyRunningATask = false;
	                }
	            }
	        }
	    }

	    function clearImmediate(handle) {
	        delete tasksByHandle[handle];
	    }

	    function installNextTickImplementation() {
	        setImmediate = function() {
	            var handle = addFromSetImmediateArguments(arguments);
	            process.nextTick(partiallyApplied(runIfPresent, handle));
	            return handle;
	        };
	    }

	    function canUsePostMessage() {
	        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
	        // where `global.postMessage` means something completely different and can't be used for this purpose.
	        if (global.postMessage && !global.importScripts) {
	            var postMessageIsAsynchronous = true;
	            var oldOnMessage = global.onmessage;
	            global.onmessage = function() {
	                postMessageIsAsynchronous = false;
	            };
	            global.postMessage("", "*");
	            global.onmessage = oldOnMessage;
	            return postMessageIsAsynchronous;
	        }
	    }

	    function installPostMessageImplementation() {
	        // Installs an event handler on `global` for the `message` event: see
	        // * https://developer.mozilla.org/en/DOM/window.postMessage
	        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

	        var messagePrefix = "setImmediate$" + Math.random() + "$";
	        var onGlobalMessage = function(event) {
	            if (event.source === global &&
	                typeof event.data === "string" &&
	                event.data.indexOf(messagePrefix) === 0) {
	                runIfPresent(+event.data.slice(messagePrefix.length));
	            }
	        };

	        if (global.addEventListener) {
	            global.addEventListener("message", onGlobalMessage, false);
	        } else {
	            global.attachEvent("onmessage", onGlobalMessage);
	        }

	        setImmediate = function() {
	            var handle = addFromSetImmediateArguments(arguments);
	            global.postMessage(messagePrefix + handle, "*");
	            return handle;
	        };
	    }

	    function installMessageChannelImplementation() {
	        var channel = new MessageChannel();
	        channel.port1.onmessage = function(event) {
	            var handle = event.data;
	            runIfPresent(handle);
	        };

	        setImmediate = function() {
	            var handle = addFromSetImmediateArguments(arguments);
	            channel.port2.postMessage(handle);
	            return handle;
	        };
	    }

	    function installReadyStateChangeImplementation() {
	        var html = doc.documentElement;
	        setImmediate = function() {
	            var handle = addFromSetImmediateArguments(arguments);
	            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	            var script = doc.createElement("script");
	            script.onreadystatechange = function () {
	                runIfPresent(handle);
	                script.onreadystatechange = null;
	                html.removeChild(script);
	                script = null;
	            };
	            html.appendChild(script);
	            return handle;
	        };
	    }

	    function installSetTimeoutImplementation() {
	        setImmediate = function() {
	            var handle = addFromSetImmediateArguments(arguments);
	            setTimeout(partiallyApplied(runIfPresent, handle), 0);
	            return handle;
	        };
	    }

	    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
	    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
	    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

	    // Don't get fooled by e.g. browserify environments.
	    if ({}.toString.call(global.process) === "[object process]") {
	        // For Node.js before 0.9
	        installNextTickImplementation();

	    } else if (canUsePostMessage()) {
	        // For non-IE10 modern browsers
	        installPostMessageImplementation();

	    } else if (global.MessageChannel) {
	        // For web workers, where supported
	        installMessageChannelImplementation();

	    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
	        // For IE 6–8
	        installReadyStateChangeImplementation();

	    } else {
	        // For older browsers
	        installSetTimeoutImplementation();
	    }

	    attachTo.setImmediate = setImmediate;
	    attachTo.clearImmediate = clearImmediate;
	}(new Function("return this")()));

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).clearImmediate, __webpack_require__(3)))

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate, clearImmediate) {var nextTick = __webpack_require__(3).nextTick;
	var apply = Function.prototype.apply;
	var slice = Array.prototype.slice;
	var immediateIds = {};
	var nextImmediateId = 0;

	// DOM APIs, for completeness

	exports.setTimeout = function() {
	  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
	};
	exports.setInterval = function() {
	  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
	};
	exports.clearTimeout =
	exports.clearInterval = function(timeout) { timeout.close(); };

	function Timeout(id, clearFn) {
	  this._id = id;
	  this._clearFn = clearFn;
	}
	Timeout.prototype.unref = Timeout.prototype.ref = function() {};
	Timeout.prototype.close = function() {
	  this._clearFn.call(window, this._id);
	};

	// Does not start the time, just sets up the members needed.
	exports.enroll = function(item, msecs) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = msecs;
	};

	exports.unenroll = function(item) {
	  clearTimeout(item._idleTimeoutId);
	  item._idleTimeout = -1;
	};

	exports._unrefActive = exports.active = function(item) {
	  clearTimeout(item._idleTimeoutId);

	  var msecs = item._idleTimeout;
	  if (msecs >= 0) {
	    item._idleTimeoutId = setTimeout(function onTimeout() {
	      if (item._onTimeout)
	        item._onTimeout();
	    }, msecs);
	  }
	};

	// That's not how node.js implements it but the exposed api is the same.
	exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
	  var id = nextImmediateId++;
	  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

	  immediateIds[id] = true;

	  nextTick(function onNextTick() {
	    if (immediateIds[id]) {
	      // fn.call() is faster so we optimize for the common use-case
	      // @see http://jsperf.com/call-apply-segu
	      if (args) {
	        fn.apply(null, args);
	      } else {
	        fn.call(null);
	      }
	      // Prevent ids from leaking
	      exports.clearImmediate(id);
	    }
	  });

	  return id;
	};

	exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
	  delete immediateIds[id];
	};
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate, __webpack_require__(2).clearImmediate))

/***/ },
/* 3 */
/***/ function(module, exports) {

	// shim for using process in browser

	var process = module.exports = {};
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = setTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    clearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        setTimeout(drainQueue, 0);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(global) {/**
	 * openchemlib - Manipulate molecules
	 * @version v3.0.0
	 * @date 2015-09-28T11:22:02.570Z
	 * @link https://github.com/cheminfo/openchemlib-js
	 * @license BSD-3-Clause
	*/
	(function () {
	    'use strict';

	    function getExports($wnd) {

	        var $doc = $wnd.document;
	        var $gwt = {};
	        var navigator = {
	            userAgent: 'webkit'
	        };

	        function noop(){}

	        var __gwtModuleFunction = noop;
	        __gwtModuleFunction.__moduleStartupDone = noop;
	        var $sendStats = noop;
	        var $moduleName, $moduleBase;

	        // Start GWT code 
	function zt(){}
	function rt(){}
	function hc(){}
	function od(){}
	function Ve(){}
	function Xe(){}
	function Ze(){}
	function _e(){}
	function Bf(){}
	function Pf(){}
	function Nk(){}
	function Al(){}
	function gm(){}
	function pm(){}
	function Bo(){}
	function Bv(){}
	function hv(){}
	function qv(){}
	function kp(){}
	function tp(){}
	function Qp(){}
	function fq(){}
	function Zu(){}
	function sA(){}
	function YA(){}
	function Bp(){wp()}
	function Mg(){Jg(this)}
	function Mo(){Ho(this)}
	function qg(){this.g=1}
	function zl(){this.b=8}
	function $j(a){this.b=a}
	function co(){this.sb()}
	function jo(){this.tb()}
	function Iv(a){this.a=a}
	function Ov(a){this.a=a}
	function Nw(a){this.a=a}
	function $w(a){this.a=a}
	function Xy(a){this.a=a}
	function Gy(a){this.b=a}
	function az(a){this.a=a}
	function sz(a){this.a=a}
	function xz(a){this.a=a}
	function Cz(a){this.a=a}
	function Hi(a,b){a.K=b}
	function Ji(a,b){a.Q=b}
	function Mi(a,b){a.P=b}
	function Mt(a,b){a.h=b}
	function Nt(a,b){a.l=b}
	function Ot(a,b){a.m=b}
	function Yl(a,b){a.i=b}
	function pi(a,b,c){a.v[b]=c}
	function Ei(a,b){a.H[b]|=rC}
	function Ni(a,b){a.t[b]|=fC}
	function su(){return _o}
	function ko(a){return Kl(a)}
	function mo(a){return Ll(a)}
	function no(a){return Ml(a)}
	function Go(){this.a=new Mz}
	function wm(){this.a=new Mz}
	function oB(){this.a=new OA}
	function Po(){Po=rt;Oo=new hc}
	function hp(){hp=rt;gp=new kp}
	function Op(){Op=rt;Np=new Qp}
	function ny(){ny=rt;my=new Bv}
	function oo(){return Dl(),Bl}
	function Dx(a,b){return a===b}
	function di(a,b){a.p=b;a.R=0}
	function ei(a,b){a.q=b;a.R=0}
	function vi(a,b){a.t[b]|=512}
	function of(a,b){return a.e[b]}
	function fh(a,b){return a.r[b]}
	function ph(a,b){return a.w[b]}
	function rh(a,b){return a.A[b]}
	function th(a,b){return a.B[b]}
	function uh(a,b){return a.C[b]}
	function vh(a,b){return a.D[b]}
	function wh(a,b){return a.F[b]}
	function Jh(a,b){return a.I[b]}
	function Kh(a,b){return a.J[b]}
	function Yi(a,b){return a.c[b]}
	function $i(a,b){return a.k[b]}
	function fj(a,b){return a.g[b]}
	function Wk(a,b){return a.b[b]}
	function Xk(a,b){return a.c[b]}
	function _k(a,b){return a.e[b]}
	function cl(a,b){return a.f[b]}
	function GA(a){a.b=null;a.c=0}
	function uA(){Mo.call(this)}
	function Jw(){Mo.call(this)}
	function Lw(){Mo.call(this)}
	function vx(){Mo.call(this)}
	function ux(a){No.call(this,a)}
	function wx(a){No.call(this,a)}
	function Lv(a){No.call(this,a)}
	function Kw(a){No.call(this,a)}
	function Mw(a){No.call(this,a)}
	function No(a){Lo.call(this,a)}
	function py(a){No.call(this,a)}
	function ly(a){Iv.call(this,a)}
	function xx(a){Kw.call(this,a)}
	function WA(a){sz.call(this,a)}
	function cy(){Iv.call(this,'')}
	function jy(){Iv.call(this,'')}
	function ky(){Iv.call(this,'')}
	function qu(){ou==null&&(ou=[])}
	function qA(){qA=rt;pA=new sA}
	function dA(a){cA(a,a.length)}
	function _z(a){aA(a,a.length)}
	function Fm(a){xm(a,15);Re(a.b)}
	function LA(a){return !!a&&a.b}
	function ix(a){return a<0?-a:a}
	function yq(a){return a<<24>>24}
	function uu(a){return a.tM===zt}
	function Be(a){return Ce(a,a._)}
	function xh(a){return yh(a,a.q)}
	function po(a,b){return Nl(a,b)}
	function qo(a,b){return Ol(a,b)}
	function iq(a,b){return lw(a,b)}
	function mx(a,b){return a>b?a:b}
	function nx(a,b){return a>b?a:b}
	function ox(a,b){return a<b?a:b}
	function px(a,b){return a<b?a:b}
	function qx(a,b){return a<b?a:b}
	function qh(a,b){return a.t[b]&3}
	function Ih(a,b){return a.H[b]&3}
	function Rh(a,b){return a.v[b]<0}
	function Zt(a,b){return !Yt(a,b)}
	function pp(a,b){op();np.wb(a,b)}
	function Mu(a){Ku();this.b=dC|a}
	function iv(a){gv(this,0,0,a,0)}
	function Dv(a){this.b=a;this.a=0}
	function Lo(a){this.f=a;Ho(this)}
	function gq(a){return a[4]||a[1]}
	function hx(a){return a<=0?0-a:a}
	function Se(a,b){return a<b?a:a-b}
	function Kg(a,b){return b*a.c+a.a}
	function Lg(a,b){return b*a.c+a.b}
	function sh(a,b){return a.t[b]&48}
	function Zh(a,b){return a.w[b]==0}
	function cw(a){bw(a);return a.k}
	function by(a,b){a.a+=b;return a}
	function ey(a,b){a.a+=b;return a}
	function fy(a,b){a.a+=b;return a}
	function gy(a,b){a.a+=b;return a}
	function tj(a){xm(a,3);return a.n}
	function Em(a,b){return Fe(a.b,b)}
	function Yk(a,b){return Hz(a.i,b)}
	function Zk(a,b){return Hz(a.j,b)}
	function rl(a){return nl(a,a.b)>0}
	function gu(a){return a.l|a.m<<22}
	function Ev(a,b){return Cx(a.a,b)}
	function jx(a){return Math.cos(a)}
	function sx(a){return Math.sin(a)}
	function qy(a,b){return Wp(a.a,b)}
	function kz(a,b){return !!HA(a,b)}
	function vq(a){return uq(a)&&uu(a)}
	function gh(a,b){return a.t[b]&448}
	function lh(a,b){return Sg[a.F[b]]}
	function oh(a,b){return ix(a.v[b])}
	function Xh(a,b){return Si(a.F[b])}
	function ji(a,b){a.t[b]|=pC;a.R&=3}
	function ri(a,b,c){a.w[b]=c;a.R&=3}
	function xi(a,b,c){a.B[b]=c;a.R&=3}
	function yi(a,b,c){a.C[b]=c;a.R&=3}
	function zi(a,b,c){a.D[b]=c;a.R&=3}
	function hi(a,b,c){a.r[b]=c;a.R=0}
	function Gi(a,b,c){a.J[b]=c;a.R=0}
	function Tz(a,b,c){a.splice(b,c)}
	function Mn(a){this.a=a;this.jb()}
	function Av(a){this.b=a;this.a=-2}
	function dk(a,b){this.b=a;this.a=b}
	function dB(a,b){this.a=a;this.b=b}
	function _j(a,b){this.a=a;this.b=b}
	function $u(a,b){this.a=a;this.b=b}
	function Jg(a){a.a=0;a.b=0;a.c=1}
	function fp(){Vo!=0&&(Vo=0);Yo=-1}
	function Zx(){Zx=rt;Wx={};Yx={}}
	function OA(){PA.call(this,null)}
	function tx(a){return Math.sqrt(a)}
	function Ey(a){return a.a<a.b.Mb()}
	function rq(a){return !uq(a)&&uu(a)}
	function Zw(a,b){return _w(a.a,b.a)}
	function Ah(a,b,c){return a.G[b][c]}
	function ej(a,b,c){return a.f[b][c]}
	function gj(a,b,c){return a.i[b][c]}
	function hj(a,b,c){return a.j[b][c]}
	function lz(a,b){return Sy(HA(a,b))}
	function Fx(b,a){return b.indexOf(a)}
	function kx(a){return Math.floor(a)}
	function Sy(a){return !a?null:a.Xb()}
	function xq(a){return a==null?null:a}
	function Dw(a){Aw();return isNaN(a)}
	function ep(a){$wnd.clearTimeout(a)}
	function Fp(a){if(!a){throw new Jw}}
	function Uv(a){if(!a){throw new Jw}}
	function Hp(a){if(!a){throw new uA}}
	function rk(a){sk.call(this,a,new ky)}
	function hB(){dB.call(this,'Head',1)}
	function mB(){dB.call(this,'Tail',3)}
	function Jl(){Dl();this.g=new zl;Fl()}
	function Bm(a){xm(a,7);return De(a.b)}
	function Cm(a){xm(a,7);return Be(a.b)}
	function rx(a,b){return Math.pow(a,b)}
	function Ph(a,b){return (a.t[b]&4)!=0}
	function Vh(a,b){return (a.H[b]&4)!=0}
	function Pv(a,b){return a==b?0:a?1:-1}
	function wA(a){return a!=null?nc(a):0}
	function Ct(a){return Dt(a.l,a.m,a.h)}
	function uq(a){return Array.isArray(a)}
	function Dh(a,b){return (a.H[b]&48)>>4}
	function Nh(a,b){return (a.t[b]&fC)!=0}
	function Oh(a,b){return (a.t[b]&pC)!=0}
	function Qh(a,b){return (a.t[b]&qC)!=0}
	function Sh(a,b){return (a.H[b]&fC)!=0}
	function Th(a,b){return (a.I[b]&UB)!=0}
	function Uh(a,b){return (a.H[b]&WB)!=0}
	function Wh(a,b){return (a.H[b]&rC)!=0}
	function Yh(a,b){return (a.t[b]&WB)!=0}
	function zj(a,b){return (a.t[b]&HB)!=0}
	function Ej(a,b){return (a.t[b]&nC)!=0}
	function Fj(a,b){return (a.H[b]&64)!=0}
	function Ij(a,b){return (a.t[b]&NB)!=0}
	function Vz(a,b){Dp(b);return Yz(a,b)}
	function Wz(a,b){Dp(b);return Zz(a,b)}
	function dy(a,b){a.a+=qq(b);return a}
	function mA(a,b){iA(a,0,a.length,b)}
	function Mx(a){return Tx(a,0,a.length)}
	function Vx(a){return Ox(a,0,a.length)}
	function Ow(a,b){return a<b?-1:a>b?1:0}
	function Gv(a,b,c){Fv(a,b,b+1,Ux(c))}
	function Uz(a,b,c,d){a.splice(b,c,d)}
	function DA(a,b,c){a.a=b^1502;a.b=c^SC}
	function ue(a){a.r=new jy;a.q=6;a.s=0}
	function rn(a){on();this.hb();this.a=a}
	function cj(a){xm(a,1);return yh(a,a.e)}
	function pt(a){var b=ot;return xt(b[a])}
	function kh(a,b){return (a.t[b]&lC)>>19}
	function Fh(a,b){return (a.H[b]&nC)>>10}
	function Ch(a,b){return (a.I[b]&960)>>6}
	function $h(a,b){return (a.t[b]&512)!=0}
	function Cj(a,b){return (a.H[b]&512)!=0}
	function Hj(a,b){return (a.H[b]&128)!=0}
	function Aj(a,b){return (a.H[b]&256)!=0}
	function cp(a){return a.$H||(a.$H=++Wo)}
	function Pt(a){return a.l+a.m*NC+a.h*OC}
	function Dt(a,b,c){return {l:a,m:b,h:c}}
	function Nx(a,b,c){return a.substr(b,c)}
	function Jk(a,b,c){a.c=b;return Lk(a,c)}
	function Xz(a,b){Dp(b);return $z(a,0,b)}
	function bm(a,b){sc();am.call(this,a,b)}
	function dq(a){Rp();cq.call(this,a,true)}
	function jB(){dB.call(this,'Range',2)}
	function SA(a){TA.call(this,a,(cB(),$A))}
	function Rp(){Rp=rt;Pp((Op(),Op(),Np))}
	function ef(){this.d=jq(Fq,bC,0,3,6,1)}
	function Mz(){this.a=jq(xs,GB,1,0,3,1)}
	function Zv(a){return a>=56320&&a<=57343}
	function uc(a,b){return a==null?b:a+','+b}
	function Cc(a,b){return Kg(a.G,th(a.D,b))}
	function Dc(a,b){return Lg(a.G,uh(a.D,b))}
	function Gx(c,a,b){return c.indexOf(a,b)}
	function Hx(b,a){return b.lastIndexOf(a)}
	function Cx(b,a){return b.charCodeAt(a)}
	function Kx(a,b,c){return a.substr(b,c-b)}
	function Jx(a,b){return Nx(a,b,a.length-b)}
	function eh(a,b){return (a.t[b]&98304)>>15}
	function Fe(a,b){return a.e==null?-1:a.e[b]}
	function Kk(a){return a.length==0?0:xw(a)}
	function wq(a){return typeof a==='string'}
	function Ho(a){a.g=null;pp(a,a.f);return a}
	function bw(a){if(a.k!=null){return}pw(a)}
	function sp(a){op();return parseInt(a)||-1}
	function Vw(a,b){return (a>>>0).toString(b)}
	function ii(a,b){a.t[b]&=-449;a.t[b]|=448}
	function Bi(a,b,c){a.H[b]&=-49;a.H[b]|=c<<4}
	function ti(a,b,c){a.A[b]|=c;a.R=0;a.L=true}
	function Fi(a,b,c){a.I[b]|=c;a.R=0;a.L=true}
	function df(a,b){a.a=b;a.c=0;a.b=63;dA(a.d)}
	function af(a,b){a.d[a.c]=St(a.d[a.c],Wt(b))}
	function yu(a,b){this.e=b;this.f=a;Ho(this)}
	function Wu(a){this.a='Helvetica';this.b=a}
	function vo(a){!a.a&&(a.a=new qg);return a.a}
	function xo(a){!a.d&&(a.d=new Nk);return a.d}
	function yo(a){!a.e&&(a.e=new Jl);return a.e}
	function zo(a){!a.f&&(a.f=new gm);return a.f}
	function Ao(a){!a.g&&(a.g=new pm);return a.g}
	function dz(a,b){var c;c=a.d;a.d=b;return c}
	function dh(a,b){return ((a.t[b]&kC)>>>28)-1}
	function Zo(a,b,c){return a.apply(b,c);var d}
	function yc(a,b,c){Tl(a,b-a.K/2,c-a.K/2,a.K)}
	function Ix(c,a,b){return c.lastIndexOf(a,b)}
	function Ux(a){return String.fromCharCode(a)}
	function qq(a){return String.fromCharCode(a)}
	function tq(a){return a!=null&&!wq(a)&&!uu(a)}
	function tt(a,b){if(!b){return a}return fu(a)}
	function Ep(a,b){if(!a){throw new Lv(''+b)}}
	function on(){on=rt;nn=(!uo&&(uo=new Bo),uo)}
	function Yw(){Yw=rt;Xw=jq(rs,GB,23,256,0,1)}
	function gx(){gx=rt;fx=jq(ss,GB,39,256,0,1)}
	function wp(){wp=rt;Error.stackTraceLimit=64}
	function vu(){$wnd.setTimeout(sB(xu));wu()}
	function Kv(){No.call(this,'divide by zero')}
	function jn(a){kk();ok.call(this,a);this.db()}
	function nd(a,b,c){this.b=a;this.c=b;this.a=c}
	function Ul(a,b){var c;c=Uu(a.e,b).b;return c}
	function gw(a){var b;b=fw(a);tw(a,b);return b}
	function iw(){var a;a=fw(null);a.e=2;return a}
	function Pp(a){!a.a&&(a.a=new fq);return a.a}
	function Pm(a){a.c==null&&Mm(a,256);return a.c}
	function Qm(a,b){a.c==null&&Mm(a,b);return a.c}
	function _y(a){var b;b=Fy(a.a.a);return b.Xb()}
	function Bz(a){var b;b=Fy(a.a.a);return b.Wb()}
	function Gz(a,b){a.a[a.a.length]=b;return true}
	function lA(a){iA(a,0,a.length,(qA(),qA(),pA))}
	function qn(){on();rn.call(this,new Hm(32,32))}
	function Zi(a,b){return a.c[b]-a.g[b]+oj(a,b)}
	function lj(a,b){return Mh(a,b)+Lh(a,b)-pj(a,b)}
	function av(a,b){return dv(a,b.c,b.d,b.b,b.a)}
	function _w(a,b){return Zt(a,b)?-1:Xt(a,b)?1:0}
	function _h(a,b){return a.J[b]==17||a.J[b]==9}
	function ih(a,b){return a.s==null?null:a.s[b]}
	function mh(a,b){return a.u==null?null:a.u[b]}
	function Ny(a,b){return b===a?'(this Map)':''+b}
	function Lf(a,b){return b==1?a.a+a.f++:a.i+a.g++}
	function bj(a,b){return !!a.n&&b<a.d?Wk(a.n,b):0}
	function lx(a){return Math.log(a)*Math.LOG10E}
	function Hz(a,b){Ip(b,a.a.length);return a.a[b]}
	function Eo(a,b){var c;c=Fo(a,b);return c<0?-1:c}
	function bA(a,b){var c;for(c=0;c<b;++c){a[c]=0}}
	function aA(a,b){var c;for(c=0;c<b;++c){a[c]=-1}}
	function Hg(a,b){b.a=b.a*a.c+a.a;b.b=b.b*a.c+a.b}
	function gv(a,b,c,d,e){a.c=b;a.d=c;a.b=d;a.a=e}
	function ui(a,b,c){a.t[b]&=-49;a.t[b]|=c;a.R&=3}
	function gi(a,b,c){a.t[b]&=-98305;a.t[b]|=c<<15}
	function Fv(a,b,c,d){a.a=Kx(a.a,0,b)+d+Jx(a.a,c)}
	function kq(a,b,c,d,e,f){return lq(a,b,c,d,e,0,f)}
	function Fz(a,b,c){Lp(b,a.a.length);Uz(a.a,b,0,c)}
	function Kp(a,b){if(a==null){throw new wx(''+b)}}
	function Jp(a){if(a==null){throw new vx}return a}
	function lp(a,b){!a&&(a=[]);a[a.length]=b;return a}
	function jw(a){var b;b=fw(a);b.j=a;b.e=1;return b}
	function Zl(a,b){if(a.j!=b){a.j=b;a.e=new Wu(b)}}
	function Uu(a,b){var c;c=Vu(a,b);return new iv(c)}
	function kA(c){c.sort(function(a,b){return a-b})}
	function Px(a,b){if(a==b){return 0}return a<b?-1:1}
	function Sj(a,b){return rx(10,lx(2000)*a/(b-1)-1)}
	function Ut(a,b){return a.l==b.l&&a.m==b.m&&a.h==b.h}
	function au(a,b){return a.l!=b.l||a.m!=b.m||a.h!=b.h}
	function vt(a){return a instanceof Array?a[0]:null}
	function Cw(a){Aw();return !isFinite(a)&&!isNaN(a)}
	function dp(a){$wnd.setTimeout(function(){throw a},0)}
	function Fy(a){Hp(a.a<a.b.Mb());return a.b.Pb(a.a++)}
	function _l(a,b){by(a.c,'\t');by(a.c,b);by(a.c,'\n')}
	function qi(a,b,c){c?(a.t[b]|=WB):(a.t[b]&=-262145)}
	function wi(a,b,c){a.t[b]&=-134217729;c&&(a.t[b]|=qC)}
	function nf(a,b){return a.f[b]&&(a.o[b]==1||a.o[b]==2)}
	function Cv(a){return a.a==a.b.length?-1:Cx(a.b,a.a++)}
	function lc(a){return wq(a)?Cs:rq(a)?a.cZ:vq(a)?a.cZ:Er}
	function Tt(a,b){return {l:a.l&b.l,m:a.m&b.m,h:a.h&b.h}}
	function bu(a,b){return {l:a.l|b.l,m:a.m|b.m,h:a.h|b.h}}
	function iu(a,b){return {l:a.l^b.l,m:a.m^b.m,h:a.h^b.h}}
	function vA(a,b){return xq(a)===xq(b)||a!=null&&jc(a,b)}
	function Vn(a,b){this.rb();this.a=new Sm(new Dv(a),b)}
	function wd(a,b){this.d=a;this.c=b;xm(this.d,1);pd(this)}
	function Pg(a,b,c,d){this.b=a;this.a=b;this.c=c;this.d=d}
	function Uj(a,b,c){a.c=6;a.d=c;a.a=b;a.e=b[a.d]-64<<11}
	function iy(a,b,c){a.a=Kx(a.a,0,b)+c+Jx(a.a,b);return a}
	function hy(a,b,c){a.a=Kx(a.a,0,b)+''+Jx(a.a,c);return a}
	function Ce(a,b){if(a.f==null){ze(a);ve(a,b)}return a.f}
	function Om(a,b){if(a.b==null)return null;return a.b[b]}
	function Ye(a,b){if(a.c!=b.c)return a.c>b.c?1:-1;return 0}
	function hw(a,b){var c;c=fw(a);tw(a,c);c.e=b?8:0;return c}
	function Je(a){var b;b=0;while(a>0){a>>=1;++b}return b}
	function xe(a,b){if(!b){te(a,1,1);te(a,15,4)}return true}
	function Gp(a,b){if(!a){throw new Kw(Mp('%s > %s',b))}}
	function rA(a,b){Jp(a);Jp(b);return wq(a)?Px(a,b):a.bb(b)}
	function vk(a,b){var c;c=Ak(a,b+1);return c==-1?a.length:c}
	function cA(a,b){var c;for(c=0;c<b;++c){a[c]={l:0,m:0,h:0}}}
	function Qe(a){var b;for(b=0;b<a.L.d;b++){wi(a.L,b,a.I[b])}}
	function Wc(a){var b;b=a.a;a.a=a.b;a.b=b;b=a.c;a.c=a.d;a.d=b}
	function Gg(a,b){b.c*=a.c;b.a=b.a*a.c+a.a;b.b=b.b*a.c+a.b}
	function si(a,b,c,d){a.t[b]&=-8;a.t[b]|=c;d&&(a.t[b]|=4)}
	function zh(a,b,c){return Pi(a.B[b],a.C[b],a.B[c],a.C[c])}
	function gB(){cB();return mq(iq(ft,1),GB,28,0,[$A,_A,aB,bB])}
	function zq(a){return ~~Math.max(Math.min(a,tB),-2147483648)}
	function Bh(a,b){return ((a.I[b]&960)>>6)+((a.I[b]&15360)>>10)}
	function lw(a,b){var c=a.a=a.a||[];return c[b]||(c[b]=a.Eb(b))}
	function bd(a,b){var c;c=a.b;a.b=b.b;b.b=c;c=a.d;a.d=b.d;b.d=c}
	function rv(a,b,c,d){this.c=a;this.d=b;this.b=c;this.a=d}
	function yx(a,b,c){this.a='Unknown';this.d=a;this.b=b;this.c=c}
	function PA(a){this.b=null;!a&&(a=(qA(),qA(),pA));this.a=a}
	function Jy(a){Gy.call(this,a);Lp(0,a.a.length);this.a=0}
	function Nv(){Nv=rt;Mv=new Ov(false);new Ov(true)}
	function ay(){if(Xx==256){Wx=Yx;Yx={};Xx=0}++Xx}
	function xt(a){function b(){}
	;b.prototype=a||{};return new b}
	function Wy(a){var b;b=new SA((new WA(a.a)).a);return new az(b)}
	function wz(a){var b;b=new SA((new WA(a.a)).a);return new Cz(b)}
	function xu(){var a;a=Au();if(!Dx('safari',a)){throw new zu(a)}}
	function Dp(a){if(a<0){throw new ux('Negative array size: '+a)}}
	function ry(){this.a=(Rp(),new dq(['USD','US$',2,'US$','$']))}
	function ck(a){this.a=jq(Eq,uB,0,a,7,1);this.b=jq(Eq,uB,0,a,7,1)}
	function nc(a){return wq(a)?_x(a):rq(a)?a.hC():vq(a)?cp(a):cp(a)}
	function Xv(a){return null!=String.fromCharCode(a).match(/\d/)}
	function Yv(a){return null!=String.fromCharCode(a).match(/[A-Z]/i)}
	function sq(a,b){return a!=null&&(wq(a)&&!!pq[b]||a.cM&&!!a.cM[b])}
	function hh(a,b){return a.s==null?null:a.s[b]==null?null:Mx(a.s[b])}
	function ai(a,b,c){return (a.J[b]==17||a.J[b]==9)&&a.G[0][b]==c}
	function Di(a,b,c,d){a.H[b]&=-16777224;a.H[b]|=c;d&&(a.H[b]|=4)}
	function Hl(a,b,c){a.b=null;a.a=b;c==null?(a.c=El(a,b)):(a.c=c)}
	function Il(a,b,c){a.e=null;a.d=b;c==null?(a.f=El(a,b)):(a.f=c)}
	function wk(a,b){a.c=null;return Lk(a,new Av(new Dv(b)))?a.c:null}
	function ap(a,b,c){var d;d=$o();try{return Zo(a,b,c)}finally{bp(d)}}
	function _i(a,b){var c;c=a.t[b]&nC;return c==0?0:c==IB?2:c==RB?3:4}
	function Co(a,b){var c;c=a-b;c>=CB?(c-=BB):c<iC&&(c+=BB);return c}
	function Ig(a,b){b.c=b.c*a.c+a.a;b.d=b.d*a.c+a.b;b.b*=a.c;b.a*=a.c}
	function xl(a,b){if(b.p==0){a.q=null;return}a.q=b;a.u=false;xm(a.q,1)}
	function nw(a){if(a.Jb()){return null}var b=a.j;var c=ot[b];return c}
	function yv(a){var b;if(a.a!=-2){b=a.a;a.a=-2}else{b=Cv(a.b)}return b}
	function lg(a){var b,c;for(c=0;c<a.f.a.length;c++){b=Hz(a.f,c);Ag(b)}}
	function xk(a,b){var c;c=!a.a?null:lz(a.a,new Nw(b));return !c?b-1:c.a}
	function yk(a,b){var c;c=!a.b?null:lz(a.b,new Nw(b));return !c?b-1:c.a}
	function Xj(a,b,c){return b==null?null:Yj(a,Sx(b),c==null?null:Sx(c))}
	function jc(a,b){return wq(a)?Dx(a,b):rq(a)?a.eQ(b):vq(a)?a===b:a===b}
	function re(a,b){return qx(b-1,nx(0,zq(0.5+lx(a/0.1)/lx(2000)*(b-1))))}
	function _o(b){return function(){return ap(b,this,arguments);var a}}
	function bp(a){a&&jp((hp(),gp));--Vo;if(a){if(Yo!=-1){ep(Yo);Yo=-1}}}
	function Do(a,b){var c;c=Fo(a,b);if(c<0){c=-(c+1);Fz(a.a,c,b)}return c}
	function Zf(a,b){var c;c=a-b;while(c<iC)c+=BB;while(c>CB)c-=BB;return c}
	function Qi(a,b){var c;c=a-b;while(c<iC)c+=BB;while(c>CB)c-=BB;return c}
	function ae(a){var b,c;b=Td(a);do{c=b;Pd(a);b=Td(a)}while(c!=b);return b}
	function Ne(a,b){var c;c=jq(Eq,uB,0,b,7,1);oy(a,0,c,0,a.length);return c}
	function jq(a,b,c,d,e,f){var g;g=nq(e,d);mq(iq(a,f),b,c,e,g);return g}
	function Kz(a,b,c){var d;d=(Ip(b,a.a.length),a.a[b]);a.a[b]=c;return d}
	function Dg(a,b,c){var d;for(d=0;d<a.a.length;d++){a.c[d]+=b;a.d[d]+=c}}
	function jz(a,b){var c,d;c=b.Wb();d=HA(a,c);return !!d&&vA(d.d,b.Xb())}
	function Bt(a){var b,c,d;b=a&wC;c=a>>22&wC;d=a<0?KC:0;return Dt(b,c,d)}
	function Nu(a,b,c){Ku();this.b=dC|(a&255)<<16|(b&255)<<8|c&255;Ru(a,b,c)}
	function XA(a,b){this.c=a;this.d=b;this.a=jq(at,GB,55,2,0,1);this.b=true}
	function Ro(a){Po();this.e=null;this.f=null;this.a='';this.b=a;this.a=''}
	function cB(){cB=rt;$A=new dB('All',0);_A=new hB;aB=new jB;bB=new mB}
	function Sm(a,b){Km();this.c=b;this.g=new Av(a);this.f=new ky;this.a=new ky}
	function Ip(a,b){if(a<0||a>=b){throw new Mw('Index: '+a+', Size: '+b)}}
	function Lp(a,b){if(a<0||a>b){throw new Mw('Index: '+a+', Size: '+b)}}
	function Uo(){if(Date.now){return Date.now()}return (new Date).getTime()}
	function De(a){if(a.F==null){ze(a);Ie(a);Ke(a,1);Ke(a,2);He(a)}return a.F}
	function ut(a,b){if(!b){return a}if(typeof a=='number'){return Vt(a)}return a}
	function un(a){on();var b;b=new qn;Jk(xo(nn),b.a,new Av(new Dv(a)));return b}
	function Jz(a,b){var c;c=Iz(a,b,0);if(c==-1){return false}a.Yb(c);return true}
	function Jf(a,b){var c,d;d=a.j.k[b];c=a.j.j[b];return d==0?a.b:d==1?c:a.a+c}
	function cv(a,b,c){var d,e;d=a.c;e=a.d;return b>=d&&c>=e&&b<d+a.b&&c<e+a.a}
	function bi(a,b){var c;for(c=0;c<a.p;c++)ix(a.v[c])==(b<0?-b:b)&&(a.v[c]=0)}
	function yg(a,b){var c;for(c=0;c<a.a.length;c++)if(b==a.a[c])return c;return -1}
	function Iz(a,b,c){for(;c<a.a.length;++c){if(vA(b,a.a[c])){return c}}return -1}
	function pj(a,b){var c,d;a.cb(1);d=0;for(c=0;c<a.c[b];c++)d+=a.j[b][c];return d}
	function eA(a,b){var c;c=b-a;Gp(c>=0,mq(iq(xs,1),GB,1,3,[Ww(a),Ww(b)]));return c}
	function zm(a){var b,c;b=jq(Eq,uB,0,a.p,7,1);c=kj(a,b,false);return Am(a,b,c)}
	function iA(a,b,c,d){var e;!d&&(d=(qA(),qA(),pA));e=$z(a,b,c);jA(e,a,b,c,-b,d)}
	function he(a,b,c){if(a.a==null){a.a=jq(Aq,eC,0,a.L.d,7,1);_z(a.a)}a.a[b]=yq(c)}
	function Gj(a,b){return a.F[b]==1&&a.w[b]==0&&(a.s==null||a.s[b]==null)}
	function jh(a,b){return (a.t[b]&lC)>>19!=1&&(a.t[b]&lC)>>19!=2?-1:(a.t[b]&mC)>>21}
	function Eh(a,b){return (a.H[b]&nC)>>10!=1&&(a.H[b]&nC)>>10!=2?-1:(a.H[b]&oC)>>12}
	function _v(a){return String.fromCharCode(a).toLowerCase().charCodeAt(0)}
	function nu(){nu=rt;ju=Dt(wC,wC,524287);ku=Dt(0,0,_B);lu=Wt(1);Wt(2);mu=Wt(0)}
	function pk(a,b){var c,d;d=qy(a.a,b);for(c=d.length;c<10;c++)dy(a.b,32);gy(a.b,d)}
	function bq(a,b){var c;if(a.d>a.b+a.i&&Ev(b,a.b+a.i)>=53){c=a.b+a.i-1;aq(a,b,c)}}
	function Pj(a){var b,c;xm(a,3);for(b=0;b<a.d;b++)Nj(a,b);for(c=0;c<a.e;c++)Oj(a,c)}
	function lk(a){var b,c;c=a.a;for(b=0;b<a.b.length;b++)c+=a.b[b]*hk[a.c[b]];return c}
	function nk(a){var b,c;c=a.d;for(b=0;b<a.b.length;b++)c+=a.b[b]*jk[a.c[b]];return c}
	function _m(a){var b,c,d;b=bn(a);d=0;for(c=0;c<Zm.length;c++)d+=b[c]*Zm[c];return d}
	function sl(a,b){var c;for(c=0;c<b.length;c++)if(b[c]==a)return true;return false}
	function Ri(a){Vg();var b;for(b=1;b<Sg.length;b++)if(Ex(a,Sg[b]))return b;return 0}
	function $f(a,b,c){var d,e;d=0;for(e=0;e<a.e[c];e++){zg(b,ej(a.i,c,e))&&++d}return d}
	function Hf(a,b){var c,d;c=0;for(d=0;d<a.b;d++)a.e[d][b]&&a.c[d]==-3&&++c;return c}
	function $z(a,b,c){var d,e;e=eA(b,c);d=hq(a,e);oy(a,b,d,0,qx(a.length-b,e));return d}
	function el(a,b,c){var d;d=Hz(a.j,b).length;while(c>=d)c-=d;while(c<0)c+=d;return c}
	function zg(a,b){var c;for(c=0;c<a.a.length;c++)if(b==a.a[c])return true;return false}
	function tw(a,b){var c;if(!a){return}b.j=a;var d=nw(b);if(!d){ot[a]=[b];return}d.cZ=b}
	function ip(a){var b,c;if(a.a){c=null;do{b=a.a;a.a=null;c=mp(b,c)}while(a.a);a.a=c}}
	function jp(a){var b,c;if(a.b){c=null;do{b=a.b;a.b=null;c=mp(b,c)}while(a.b);a.b=c}}
	function TA(a,b){var c;c=new Mz;IA(a,c,b,a.b,null,false,null,false);this.a=new Jy(c)}
	function fw(a){var b;b=new dw;b.k='Class$'+(a?'S'+a:''+b.g);b.b=b.k;b.i=b.k;return b}
	function dj(a,b,c){var d;for(d=0;d<a.c[b];d++)if(a.f[b][d]==c)return a.i[b][d];return -1}
	function Xp(a,b,c,d){var e;if(d>0){for(e=d;e<a.b;e+=d+1){iy(b,a.b-e,Ux(c));++a.b;++a.d}}}
	function bv(a,b,c,d,e){var f;if(d<b){f=b;b=d;d=f}if(e<c){f=c;c=e;e=f}a.Db(b,c,d-b,e-c)}
	function ak(a,b,c,d){var e,f;this.a=bk(a,b,c,d);e=c-a;f=d-b;this.b=Math.sqrt(e*e+f*f)}
	function ni(a,b,c){a.u==null&&(a.u=jq(Eq,cC,5,a.N,0,2));kA(c);a.u[b]=c;a.R=0;a.L=true}
	function bh(a){a.p=0;a.q=0;a.L=false;a.M=false;a.K=0;a.u=null;a.s=null;a.P=null;a.R=0}
	function jd(a,b){a.w=-5;a.d='rgb('+(b.b>>16&255)+','+(b.b>>8&255)+','+(b.b&255)+')'}
	function Xl(a,b){a.d='rgb('+(b.b>>16&255)+','+(b.b>>8&255)+','+(b.b&255)+')'}
	function lt(b,c){if(b&&typeof b=='object'){try{b.__gwt$exception=c}catch(a){}}}
	function pu(){qu();var a=ou;for(var b=0;b<arguments.length;b++){a.push(arguments[b])}}
	function cn(a,b){var c;for(c=0;c<a.g[b];c++)if(fh(a,a.f[b][c])<0)return true;return false}
	function qd(a,b){var c;for(c=0;c<fj(a.d,b);c++)if(a.c[gj(a.d,b,c)])return true;return false}
	function Ok(a){var b,c;c=0;for(b=0;b<a.a.p;b++)(wh(a.a,b)==7||wh(a.a,b)==8)&&++c;return c}
	function Dm(a){var b,c;xm(a,15);c=0;for(b=0;b<a.d;b++)(a.t[b]&3)!=0&&(a.t[b]&4)==0&&++c;return c}
	function pf(a){var b,c;c=true;for(b=0;b<a.i.d;b++){if(a.o[b]!=0&&!a.e[b]){c=false;break}}return c}
	function NA(a,b){var c,d;c=1-b;d=a.a[c];a.a[c]=d.a[b];d.a[b]=a;a.b=true;d.b=false;return d}
	function Yz(a,b){var c,d;d=eA(0,b);c=jq(Dq,xB,0,d,7,1);oy(a,0,c,0,qx(a.length,d));return c}
	function Zz(a,b){var c,d;d=eA(0,b);c=jq(Eq,uB,0,d,7,1);oy(a,0,c,0,qx(a.length,d));return c}
	function Vj(a,b){var c,d,e,f;d=~~(b/2);e=a>=d;e&&(a-=d);f=b/100;c=f*a/(d-1-a);return e?-c:c}
	function we(a,b){var c,d,e,f;c=~~(b/2);e=a<0;a=hx(a);f=b/100;d=zq(0.5+a*(c-1)/(a+f));return e?c+d:d}
	function $c(a,b){var c;if(b>0)return (a[b]+a[b-1])/2;c=$B+(a[0]+a[a.length-1])/2;return c>CB?c-XB:c}
	function Tw(a){var b,c;if(a==0){return 32}else{c=0;for(b=1;(b&a)==0;b<<=1){++c}return c}}
	function bn(a){var b,c;c=jq(Eq,uB,0,Zm.length+2,7,1);xm(a,3);for(b=0;b<a.d;b++)++c[an(a,b)];return c}
	function nA(a){var b,c,d;d=0;for(c=a.Kb();c.Qb();){b=c.Rb();d=d+(b!=null?nc(b):0);d=~~d}return d}
	function ty(a,b){var c,d;Jp(b);for(d=b.Kb();d.Qb();){c=d.Rb();if(!a.Lb(c)){return false}}return true}
	function al(a,b,c){var d,e;e=Hz(a.i,b);for(d=0;d<e.length;d++)if(c==e[d])return true;return false}
	function bl(a,b,c){var d,e;e=Hz(a.j,b);for(d=0;d<e.length;d++)if(c==e[d])return true;return false}
	function Kf(a,b,c){var d;for(d=0;d<a.j.g.length;d++)if(a.e[b][d]&&a.e[c][d])return true;return false}
	function If(a,b){var c;for(c=0;c<a.b;c++)if(a.e[c][b]&&a.c[c]==-3)return c<a.a?1:c<a.b?2:0;return -1}
	function vd(a,b){var c,d;--a.a;for(d=0;d<fj(a.d,b);d++){c=gj(a.d,b,d);if(a.c[c]){a.c[c]=false;--a.b}}}
	function MA(a,b,c){var d,e;d=new XA(b,c);e=new YA;a.b=KA(a,a.b,d,e);e.b||++a.c;a.b.b=false;return e.d}
	function wo(a,b){if(b){!a.c&&(a.c=new $j(true));return a.c}else{!a.b&&(a.b=new $j(false));return a.b}}
	function fu(a){if(Ut(a,(nu(),ku))){return PC}if(!Yt(a,mu)){return -Pt(_t(a))}return a.l+a.m*NC+a.h*OC}
	function FA(a){AA();DA(this,gu(Tt(du(a,24),{l:wC,m:3,h:0})),gu(Tt(a,{l:wC,m:3,h:0})))}
	function Hv(a){var b;b=a.a.length;0<b?(a.a=Kx(a.a,0,0)):0>b&&(a.a+=Vx(jq(Bq,bC,0,-b,7,1)))}
	function Pk(a){var b,c;c=0;for(b=0;b<a.a.p;b++)(wh(a.a,b)==7||wh(a.a,b)==8)&&Zi(a.a,b)>0&&++c;return c}
	function _t(a){var b,c,d;b=~a.l+1&wC;c=~a.m+(b==0?1:0)&wC;d=~a.h+(b==0&&c==0?1:0)&KC;return Dt(b,c,d)}
	function St(a,b){var c,d,e;c=a.l+b.l;d=a.m+b.m+(c>>22);e=a.h+b.h+(d>>22);return {l:c&wC,m:d&wC,h:e&KC}}
	function eu(a,b){var c,d,e;c=a.l-b.l;d=a.m-b.m+(c>>22);e=a.h-b.h+(d>>22);return {l:c&wC,m:d&wC,h:e&KC}}
	function HA(a,b){var c,d,e;e=a.b;while(e){c=rA(b,e.c);if(c==0){return e}d=c<0?0:1;e=e.a[d]}return null}
	function hq(a,b){var c;c=nq(0,b);mq(lc(a),a.cM,a.__elementTypeId$,a.__elementTypeCategory$,c);return c}
	function mq(a,b,c,d,e){e.cZ=a;e.cM=b;e.tM=zt;e.__elementTypeId$=c;e.__elementTypeCategory$=d;return e}
	function Uc(a,b,c,d,e){Gz(a.O,new rv(b-a.K,c-a.K,2*a.K,2*a.K));e&&Gz(a.J,new nd(b,c,Jc(a,d)?-3:a.o[d]))}
	function Li(a,b){a.G[0]=Wz(a.G[0],b);a.G[1]=Wz(a.G[1],b);a.J=Wz(a.J,b);a.H=Wz(a.H,b);a.I=Wz(a.I,b);a.O=b}
	function te(a,b,c){while(c!=0){if(a.q==0){dy(a.r,a.s+64&gC);a.q=6;a.s=0}a.s<<=1;a.s|=b&1;b>>=1;--c;--a.q}}
	function vf(a,b,c){var d,e;for(e=0;e<a.g[b].length;e++){d=a.g[b][e];if(a.k[d]==2){a.k[d]=1;a.j[d]=yq(c)}}}
	function mf(a,b,c,d){var e,f;for(f=0;f<fj(a.i,c);f++){e=ej(a.i,c,f);if(!d[e]&&qf(a,b,e))return e}return -1}
	function Gt(a,b,c,d,e){var f;f=du(a,b);c&&Jt(f);if(e){a=It(a,b);d?(At=_t(a)):(At=Dt(a.l,a.m,a.h))}return f}
	function Gf(a,b){var c;for(c=0;c<a.b;c++)if(a.e[c][b]&&a.c[c]==-3)return c<a.a?c:c<a.b?c-a.a:-1;return -1}
	function gk(a,b){fk();var c,d;d=b-a;for(c=0;c<ek[a].length;c++)if(ek[a][c].b==d)return ek[a][c].a;return NaN}
	function Ol(a,b){Dl();var c,d,e;e=0;c=0;for(d=0;d<a.length;d++){e+=Kl(a[d]&b[d]);c+=Kl(a[d]|b[d])}return e/c}
	function fA(a){var b,c,d,e;e=1;for(c=0,d=a.length;c<d;++c){b=a[c];e=31*e+(b!=null?nc(b):0);e=~~e}return e}
	function Kt(a){var b,c;c=Sw(a.h);if(c==32){b=Sw(a.m);return b==32?Sw(a.l)+32:b+20-10}else{return c-12}}
	function mt(a){var b;if(sq(a,40)){b=a;if(xq(b.b)!==xq((Po(),Oo))){return xq(b.b)===xq(Oo)?null:b.b}}return a}
	function nt(a){var b;if(sq(a,11)){return a}b=a&&a.__gwt$exception;if(!b){b=new Ro(a);pp(b,a);lt(a,b)}return b}
	function Lc(a,b){var c;if(fj(a.D,b)!=2)return false;for(c=0;c<2;c++)if(hj(a.D,b,c)!=2)return false;return true}
	function ad(a,b,c,d){var e;if((a.B&1)!=0)return false;e=Hz(a.O,d);return b>e.c&&b<e.c+e.b&&c>e.d&&c<e.d+e.a}
	function Nd(a,b){if(Qg(a)==-1||Qg(b)==-1)return 3;if(((Qg(a)|Qg(b))&1)!=0)return 3;return Qg(a)==Qg(b)?1:2}
	function Hh(a,b){switch(a.J[b]&103){case 1:case 64:return 1;case 2:return 2;case 4:return 3;default:return 0;}}
	function Ak(a,b){var c;for(c=b;c<a.length;c++){if(a.charCodeAt(c)==32||a.charCodeAt(c)==9){return c}}return -1}
	function Gh(a,b){var c,d,e,f;c=a.G[0][b];d=a.G[1][b];e=a.B[d]-a.B[c];f=a.C[d]-a.C[c];return Math.sqrt(e*e+f*f)}
	function rp(a){var b=/function(?:\s+([\w$]+))?\s*\(/;var c=b.exec(a);return c&&c[1]||'anonymous'}
	function op(){op=rt;var a,b;b=!(!!Error.stackTraceLimit||'stack' in new Error);a=new Bp;np=b?new tp:a}
	function EA(){AA();var a,b,c;c=zA+++Uo();a=zq(Math.floor(c*TC))&16777215;b=zq(c-a*rC);this.a=a^1502;this.b=b^SC}
	function dw(){this.g=aw++;this.k=null;this.i=null;this.f=null;this.d=null;this.b=null;this.j=null;this.a=null}
	function _x(a){Zx();var b=':'+a;var c=Yx[b];if(c!=null){return c}c=Wx[b];c==null&&(c=$x(a));ay();return Yx[b]=c}
	function Ww(a){var b,c;if(a>-129&&a<128){b=a+128;c=(Yw(),Xw)[b];!c&&(c=Xw[b]=new Nw(a));return c}return new Nw(a)}
	function Jt(a){var b,c,d;b=~a.l+1&wC;c=~a.m+(b==0?1:0)&wC;d=~a.h+(b==0&&c==0?1:0)&KC;Nt(a,b);Ot(a,c);Mt(a,d)}
	function Kc(a){var b;a.p=jq(jt,yB,0,a.D.p,8,1);for(b=0;b<a.D.q;b++){a.p[Ah(a.D,0,b)]=true;a.p[Ah(a.D,1,b)]=true}}
	function Tp(a,b,c){if(a.d==0){b.a=Kx(b.a,0,0)+'0'+Jx(b.a,0);++a.b;++a.d}if(a.b<a.d||a.c){iy(b,a.b,Ux(c));++a.d}}
	function qm(a,b,c,d){if(a.b)return;if(a.g==4||a.g==3&&a.c!=-1){a.b=true;return}a.i[a.g]=d;a.f[a.g]=b;a.j[a.g]=c;++a.g}
	function Sp(a,b){var c,d;b.a+='E';if(a.e<0){a.e=-a.e;b.a+='-'}c=''+a.e;for(d=c.length;d<a.k;++d){b.a+='0'}b.a+=c}
	function Ym(){Wm();var a,b,c,d;if(!Vm){if(!Vm){Vm=new Go;for(b=Tm,c=0,d=b.length;c<d;++c){a=ex(b[c]);Do(Vm,a)}}}}
	function sm(a,b,c){var d,e,f;e=false;for(d=1;d<c;d++){for(f=0;f<d;f++){a[f]>a[d]&&(e=!e);b[f]>b[d]&&(e=!e)}}return e}
	function gA(a,b,c,d){var e,f,g;for(e=b+1;e<c;++e){for(f=e;f>b&&d.ab(a[f-1],a[f])>0;--f){g=a[f];a[f]=a[f-1];a[f-1]=g}}}
	function hA(a,b,c,d,e,f,g,h){var i;i=c;while(f<g){i>=d||b<c&&h.ab(a[b],a[i])<=0?(e[f++]=a[b++]):(e[f++]=a[i++])}}
	function tu(a,b){typeof window==='object'&&typeof window['$gwt']==='object'&&(window['$gwt'][a]=b)}
	function Km(){Km=rt;Jm=mq(iq(Cs,1),GB,2,4,['Actelion No','ID','IDNUMBER','COMPOUND_ID','NAME','COMPND'])}
	function Iw(a){var b;b=ww(a);if(b>vC){return Infinity}else if(b<-3.4028234663852886E38){return -Infinity}return b}
	function Wv(a){if(a>=48&&a<58){return a-48}if(a>=97&&a<97){return a-97+10}if(a>=65&&a<65){return a-65+10}return -1}
	function Ex(b,a){if(a==null){return false}if(b==a){return true}return b.length==a.length&&b.toLowerCase()==a.toLowerCase()}
	function wt(){!Array.isArray&&(Array.isArray=function(a){return Object.prototype.toString.call(a)==='[object Array]'})}
	function Qk(b){var c;try{return Xm((new Ym,b.a))}catch(a){a=nt(a);if(sq(a,10)){c=a;Io(c,ny());return -999}else throw mt(a)}}
	function sy(a,b){var c,d;for(d=a.Kb();d.Qb();){c=d.Rb();if(xq(b)===xq(c)||b!=null&&jc(b,c)){return true}}return false}
	function Jc(a,b){var c;if(Yi(a.D,b)==0)return false;for(c=0;c<Yi(a.D,b);c++)if(!Uh(a.D,gj(a.D,b,c)))return false;return true}
	function zf(a,b){var c,d;d=jq(Eq,uB,0,a==null?1:a.length+1,7,1);for(c=0;c<d.length-1;c++)d[c]=a[c];d[d.length-1]=b;return d}
	function Lz(a,b){var c,d;d=a.a.length;b.length<d&&(b=hq(b,d));for(c=0;c<d;++c){b[c]=a.a[c]}b.length>d&&(b[d]=null);return b}
	function mk(a){var b,c;b=new cy;for(c=0;c<a.b.length;c++){by(b,(Vg(),Sg)[a.c[c]]);a.b[c]>1&&by(b,''+a.b[c])}return b.a}
	function Td(a){var b,c;b=0;lA(a.c);for(c=0;c<a.c.length;c++){(c==0||cf(a.c[c],a.c[c-1])!=0)&&++b;a.d[a.c[c].a]=b}return b}
	function Oe(a){var b,c;if(a.R!=null)for(b=0;b<a.L.d;b++)gi(a.L,b,a.R[b]);if(a.g!=null)for(c=0;c<a.L.e;c++)Bi(a.L,c,a.g[c])}
	function Qc(a){var b,c;for(c=new Gy(a.J);c.a<c.b.Mb();){b=(Hp(c.a<c.b.Mb()),c.b.Pb(c.a++));hd(a,b.a);yc(a,b.b,b.c)}hd(a,a.A)}
	function Io(a){var b,c,d,e,f;for(e=a;e;e=e.e){for(b=(e.g==null&&(e.g=(op(),f=np.xb(e),qp(f))),e.g),c=0,d=b.length;c<d;++c);}}
	function vl(a,b){var c,d,e,f;e=0;f=0;while(e<a.length&&f<b.length){c=a[e];d=b[f];if(c==d)return true;c<d?++e:++f}return false}
	function bk(a,b,c,d){var e,f,g;f=c-a;g=d-b;if(g!=0){e=Math.atan(f/g);g<0&&(f<0?(e-=CB):(e+=CB))}else e=f>0?EB:TB;return e}
	function Tl(a,b,c,d){var e;e='<circle cx="'+zq(b)+'" '+'cy="'+zq(c)+'" '+'r="'+zq(d)+'" '+'fill="'+a.d+'" />';_l(a,e)}
	function rj(a,b,c,d){var e,f;xm(a,1);for(e=0;e<d;e++){for(f=0;f<a.g[b[e]];f++){if(a.f[b[e]][f]==b[e+1]){c[e]=a.i[b[e]][f];break}}}}
	function Le(a,b,c){var d,e;a.N=b;for(d=0;d<a.L.d;d++){a.d[d]=c[d];a.W[d]=0;a.$[d]=false}for(e=0;e<a.L.e;e++){a.n[e]=0;a.p[e]=false}}
	function Ai(a,b,c){if(c>=0&&c<=190){if(c==151||c==152){a.F[b]=1;a.w[b]=c-149}else{a.F[b]=c;a.w[b]=0}a.t[b]&=268435455;a.R=0}}
	function Ii(a,b){var c,d;a.L=b;if(!b){a.u=null;for(c=0;c<a.p;c++)a.A[c]=0;for(d=0;d<a.q;d++){a.I[d]=0;a.J[d]==64&&(a.J[d]=1)}}a.R=0}
	function zk(a,b){var c;if(b==-1){return -1}for(c=b+1;c<a.length;c++){if(a.charCodeAt(c)!=32&&a.charCodeAt(c)!=9){return c}}return -1}
	function My(a,b){var c,d,e;for(d=a.Ub().Kb();d.Qb();){c=d.Rb();e=c.Wb();if(xq(b)===xq(e)||b!=null&&jc(b,e)){return c}}return null}
	function Mh(a,b){var c,d;c=((a.t[b]&kC)>>>28)-1;if(c==-1){d=a.F[b]<Tg.length?Tg[a.F[b]]:null;c=d==null?6:d[d.length-1]}return c}
	function Tj(a,b){var c,d;c=b;d=0;while(b!=0){if(a.c==0){a.e=a.a[++a.d]-64<<11;a.c=6}d|=(aC&a.e)>>16-c+b;a.e<<=1;--b;--a.c}return d}
	function qp(a){var b,c,d;b='pp';d=qx(a.length,5);for(c=0;c<d;c++){if(Dx(a[c].d,b)){return a.length>=c+1&&a.splice(0,c+1),a}}return a}
	function Ox(a,b,c){var d='';for(var e=b;e<c;){var f=Math.min(e+10000,c);d+=String.fromCharCode.apply(null,a.slice(e,f));e=f}return d}
	function Vv(a,b,c){var d,e;d=Cx(a,b++);if(d>=55296&&d<=56319&&b<c&&Zv(e=a.charCodeAt(b))){return aC+((d&1023)<<10)+(e&1023)}return d}
	function dv(a,b,c,d,e){var f,g;if(a.b<=0||a.a<=0||d<=0||e<=0){return false}f=a.c;g=a.d;return b>=f&&c>=g&&b+d<=f+a.b&&c+e<=g+a.a}
	function Nc(a,b,c,d){var e;if(b==0){c<0?(d.a=a.I):(d.a=-a.I);d.b=0;return}e=Math.atan(c/b);b<0&&(e+=CB);d.a=-(a.I*sx(e));d.b=a.I*jx(e)}
	function Ft(a,b){if(a.h==_B&&a.m==0&&a.l==0){b&&(At=Dt(0,0,0));return Ct((nu(),lu))}b&&(At=Dt(a.l,a.m,a.h));return Dt(0,0,0)}
	function Lx(a){if(a.length==0||a[0]>' '&&a[a.length-1]>' '){return a}return a.replace(/^[\u0000-\u0020]*|[\u0000-\u0020]*$/g,'')}
	function Bk(a){if(a.indexOf('ATOMS=(')!=-1)return 'ATOMS';if(a.indexOf('BONDS=(')!=-1)return 'BONDS';tk&&(ny(),my);return null}
	function Si(a){switch(a){case 7:case 8:case 9:case 15:case 16:case 17:case 33:case 34:case 35:case 53:return true;}return false}
	function em(a){switch(a){case 5:case 6:case 7:case 8:case 9:case 15:case 16:case 17:case 36:case 53:return true;default:return false;}}
	function yf(a,b,c,d,e,f,g,h,i,j){this.i=a;this.a=b;this.f=c;this.o=d;this.c=e;this.k=f;this.j=g;this.p=h;this.d=i;this.n=j;lf(this)}
	function Fg(a,b,c){this.r=a;this.p=b;this.a=jq(Eq,uB,0,c,7,1);this.q=jq(Eq,uB,0,c,7,1);this.c=jq(Cq,bC,0,c,7,1);this.d=jq(Cq,bC,0,c,7,1)}
	function sw(a,b){var c=0;while(!b[c]||b[c]==''){c++}var d=b[c++];for(;c<b.length;c++){if(!b[c]||b[c]==''){continue}d+=a+b[c]}return d}
	function Vf(a,b){var c,d;d=0;iA(a,0,a.length,(qA(),qA(),pA));for(c=0;c<a.length;c++){(c==0||cf(a[c],a[c-1])!=0)&&++d;b[a[c].a]=d}return d}
	function uy(a,b){var c,d,e;e=a.a.c;b.length<e&&(b=hq(b,e));d=wz(new xz(a.a));for(c=0;c<e;++c){b[c]=Bz(d)}b.length>e&&(b[e]=null);return b}
	function jf(a,b){var c,d;for(d=0;d<a.g[b].length;d++){c=a.g[b][d];if(a.f[c]&&(a.o[c]==1||a.o[c]==2)&&a.k[c]==0)return true}return false}
	function Bc(a,b){var c,d;for(d=0;d<a.O.a.length;d++)a.t=pv(a.t,Hz(a.O,d));c=0.10000000149011612*b;a.t.c-=c;a.t.d-=c;a.t.b+=2*c;a.t.a+=2*c}
	function ng(a){var b,c;for(b=0;b<a.b;b++){if(a.e[b]==0){c=new Fg(a,a.i,1);a.a[b]=true;c.a[0]=b;c.c[0]=0;c.d[0]=0;c.q[0]=0;Gz(a.f,c)}}}
	function Re(a){var b,c;for(b=0;b<a.L.d;b++)!Oh(a.L,b)&&a.W[b]==3&&ji(a.L,b);for(c=0;c<a.L.e;c++){a.n[c]==3&&Hh(a.L,c)==2&&Gi(a.L,c,26)}}
	function xd(a,b){var c,d;c=0;for(d=0;d<a.g[b];d++)a.j[b][d]==2&&(wh(a,a.f[b][d])==7||wh(a,a.f[b][d])==8||wh(a,a.f[b][d])==16)&&++c;return c}
	function vj(a,b){var c,d,e;e=jq(Eq,uB,0,a.c[b],7,1);for(d=0;d<a.c[b];d++)e[d]=(a.f[b][d]<<16)+d;kA(e);for(c=0;c<a.c[b];c++)e[c]&=gC;return e}
	function kf(a,b,c){var d,e,f,g,h;e=0;g=0;for(h=0;h<a.g[b].length;h++){d=a.g[b][h];if(a.k[d]==c){f=1<<a.j[d];if((g&f)==0){g|=f;++e}}}return e}
	function Nl(a,b){Dl();var c,d,e,f;f=0;d=0;e=0;for(c=0;c<a.length;c++){f+=Kl(a[c]&b[c]);d+=Kl(a[c]);e+=Kl(b[c])}return f/Math.sqrt(d*e)}
	function Af(a,b){var c;if(a.length!=b.length)return a.length<b.length?-1:1;for(c=0;c<a.length;c++)if(a[c]!=b[c])return a[c]<b[c]?-1:1;return 0}
	function Fl(){var a,b;if(Cl==null){b=new $j(false);Cl=jq(rr,GB,30,Bl.length,0,1);for(a=0;a<Bl.length;a++){Cl[a]=Wj(b,Bl[a]);xm(Cl[a],1)}}}
	function $o(){var a;if(Vo!=0){a=Uo();if(a-Xo>2000){Xo=a;Yo=$wnd.setTimeout(fp,10)}}if(Vo++==0){ip((hp(),gp));return true}return false}
	function Wt(a){var b,c;if(a>-129&&a<128){b=a+128;Rt==null&&(Rt=jq(Rr,GB,182,256,0,1));c=Rt[b];!c&&(c=Rt[b]=Bt(a));return c}return Bt(a)}
	function oA(a){var b,c,d;d=1;for(c=new Gy(a);c.a<c.b.Mb();){b=(Hp(c.a<c.b.Mb()),c.b.Pb(c.a++));d=31*d+(b!=null?nc(b):0);d=~~d}return d}
	function BA(a,b){var c,d;Fp(b>0);if((b&-b)==b){return zq(b*CA(a)*4.6566128730773926E-10)}do{c=CA(a);d=c%b}while(c-d+(b-1)<0);return zq(d)}
	function li(a,b,c){c!=null&&c.length==0&&(c=null);if(c==null){a.s!=null&&(a.s[b]=null)}else{a.s==null&&(a.s=jq(Aq,GB,9,a.N,0,2));a.s[b]=c}}
	function gf(a,b,c,d){var e,f;this.a=jq(Eq,uB,0,b,7,1);this.b=jq(Eq,uB,0,d,7,1);for(e=0;e<b;e++)this.a[e]=a[e];for(f=0;f<d;f++)this.b[f]=c[f]}
	function Rf(a,b,c){var d,e,f;f=b.length;d=new Fg(a,a.i,f);d.c[0]=0;d.d[0]=0;for(e=0;e<f;e++){d.q[e]=128-f;d.a[e]=b[e]}f<8?Yf(d):Xf(a,d,c);Gz(a.f,d)}
	function Rx(a){var b,c;if(a>=aC){b=55296+(a-aC>>10&1023)&gC;c=56320+(a-aC&1023)&gC;return Ux(b)+Ux(c)}else{return String.fromCharCode(a&gC)}}
	function $v(a,b,c){Uv(a>=0&&a<=1114111);if(a>=aC){b[c++]=55296+(a-aC>>10&1023)&gC;b[c]=56320+(a-aC&1023)&gC;return 2}else{b[c]=a&gC;return 1}}
	function tl(a,b){var c,d,e;e=0;for(d=0;d<a.length;d++){c=a[d];while(b[e]<c){++e;if(e==b.length)return false}if(b[e]>c)return false}return true}
	function Ly(a,b){var c,d,e;for(d=new SA((new WA(a)).a);Ey(d.a);){c=Fy(d.a);e=c.Xb();if(xq(b)===xq(e)||b!=null&&jc(b,e)){return true}}return false}
	function vn(a,b){var e;on();b=b||{};var c=!b.noCoordinates;var d=!b.noStereo;return e=new qn,km(Ao(nn),e.a,Sx(a),d),c&&e.inventCoordinates(),e}
	function uf(a,b,c,d){var e,f;for(f=0;f<a.g[b].length;f++){e=a.g[b][f];if(a.f[e]&&(a.o[e]==1||a.o[e]==2)&&a.k[e]==0){a.k[e]=yq(d);a.j[e]=yq(c)}}}
	function ge(a){var b,c;for(b=0;b<a.L.d;b++)(!a.I[b]||a.W[b]==3)&&(a.U[b]=0);for(c=0;c<a.L.e;c++)(Kh(a.L,c)!=1||a.n[c]==0||a.n[c]==3)&&(a.k[c]=0)}
	function Wi(a,b){var c;if(a.g[b]==3&&(a.t[b]&HB)!=0&&(!!a.n&&b<a.d?Wk(a.n,b):0)>=6)for(c=0;c<a.g[b];c++)if(Bj(a,a.i[b][c]))return a.i[b][c];return -1}
	function Gk(a,b){var c,d,e;if(!a.c){if(Dx(b.substr(0,6),'COUNTS')){c=zk(b,Ak(b,7));d=xw(Kx(b,7,Ak(b,7)));e=xw(Kx(b,c,Ak(b,c)));a.c=new Hm(d,e)}}}
	function Rm(a){if(a.e)return a.e;a.e=wk(new Nk,a.f.a);!!a.e&&(a.e.P==null||a.e.P.length==0)&&Mi(a.e,a.d==-1||a.b==null?null:a.b[a.d]);return a.e}
	function lm(a,b){var c,d,e;Kh(a.b,b)==1&&Gi(a.b,b,2);for(d=0;d<2;d++){c=Ah(a.b,d,b);qi(a.b,c,false);for(e=0;e<fj(a.b,c);e++)a.a[gj(a.b,c,e)]=false}}
	function IA(a,b,c,d,e,f,g,h){var i,j;if(!d){return}i=d.a[0];!!i&&IA(a,b,c,i,e,f,g,h);JA(a,c,d.c,e,f,g,h)&&b.Ob(d);j=d.a[1];!!j&&IA(a,b,c,j,e,f,g,h)}
	function Xc(a,b,c){var d;d=b==0?XB+a[0]-a[a.length-1]:a[b]-a[b-1];c>-2.0943951023931953&&c<YB?(d-=2*Math.cos(c+ZB)):(d-=0.5*Math.cos(c+ZB));return d}
	function JA(a,b,c,d,e,f,g){var h,i;if(b.Zb()&&(h=rA(c,d),h<0||!e&&h==0)){return false}if(b.$b()&&(i=rA(c,f),i>0||!g&&i==0)){return false}return true}
	function Ky(a,b){var c,d,e;c=b.Wb();e=b.Xb();d=a.Vb(c);if(!(xq(e)===xq(d)||e!=null&&jc(e,d))){return false}if(d==null&&!a.Tb(c)){return false}return true}
	function Lu(a,b,c){Ku();Nu.call(this,zq(a*255+0.5),zq(b*255+0.5),zq(c*255+0.5));Qu(a,b,c);this.a=jq(Dq,xB,0,3,7,1);this.a[0]=a;this.a[1]=b;this.a[2]=c}
	function Yf(a){var b,c;b=CB-CB*(a.a.length-2)/a.a.length;for(c=1;c<a.a.length;c++){a.c[c]=a.c[c-1]+Math.sin(b*(c-1));a.d[c]=a.d[c-1]+Math.cos(b*(c-1))}}
	function Yj(a,b,c){var d,e,f,g,h;if(b==null)return null;Uj(a,b,0);d=Tj(a,4);g=Tj(a,4);d>8&&(d=g);e=Tj(a,d);f=Tj(a,g);h=new Hm(e,f);Zj(a,h,b,c);return h}
	function cq(a,b){if(!a){throw new Kw('Unknown currency code')}this.s='0.0000';this.a=a;Zp(this,this.s);if(!b&&this.g){this.n=this.a[2]&7;this.i=this.n}}
	function It(a,b){var c,d,e;if(b<=22){c=a.l&(1<<b)-1;d=e=0}else if(b<=44){c=a.l;d=a.m&(1<<b-22)-1;e=0}else{c=a.l;d=a.m;e=a.h&(1<<b-44)-1}return Dt(c,d,e)}
	function Vc(a,b,c,d,e,f){var g,h,i;if(f){g=Ul(a,d);h=g/2+~~(a.j/8);i=~~(a.j/2);(d=='+'||d=='-')&&(i=i*2/3);Gz(a.O,new rv(b-h,c-i,2*h,2*i))}e&&Sl(a,d,b,c)}
	function AA(){AA=rt;var a,b,c,d;xA=jq(Cq,bC,0,25,7,1);yA=jq(Cq,bC,0,33,7,1);d=QC;for(b=32;b>=0;b--){yA[b]=d;d*=0.5}c=1;for(a=24;a>=0;a--){xA[a]=c;c*=0.5}}
	function Yc(a){var b;b=new qv;if(a.a<=a.b){b.c=a.a;b.b=a.b-a.a}else{b.c=a.b;b.b=a.a-a.b}if(a.c<=a.d){b.d=a.c;b.a=a.d-a.c}else{b.d=a.d;b.a=a.c-a.d}return b}
	function Pi(a,b,c,d){var e,f,g;f=c-a;g=d-b;if(g!=0){e=Math.atan(f/g);g<0&&(f<0?(e-=CB):(e+=CB))}else e=f>0?1.5707963705062866:-1.5707963705062866;return e}
	function ex(a){var b,c;if(Xt(a,{l:4194175,m:wC,h:KC})&&Zt(a,{l:128,m:0,h:0})){b=gu(a)+128;c=(gx(),fx)[b];!c&&(c=fx[b]=new $w(a));return c}return new $w(a)}
	function dl(a,b,c){var d,e,f;f=b.length;for(e=0;e<f;e++)(a.b[b[e]]==0||a.b[b[e]]>f)&&(a.b[b[e]]=f);for(d=0;d<f;d++)(a.c[c[d]]==0||a.c[c[d]]>f)&&(a.c[c[d]]=f)}
	function pd(a){var b,c,d;a.e=0;d=jq(jt,yB,0,a.d.d,8,1);for(b=0;b<a.d.e;b++){if(a.c[b]){++a.b;for(c=0;c<2;c++){if(!d[Ah(a.d,c,b)]){d[Ah(a.d,c,b)]=true;++a.a}}}}}
	function Dd(a,b){var c,d,e;for(d=0;d<a.g[b];d++){if(a.j[b][d]!=1){c=a.f[b][d];for(e=0;e<a.g[c];e++)if(a.j[c][e]==1&&xd(a,a.f[c][e])!=0)return true}}return false}
	function Qt(a,b){var c,d,e;e=a.h-b.h;if(e<0){return false}c=a.l-b.l;d=a.m-b.m+(c>>22);e+=d>>22;if(e<0){return false}Nt(a,c&wC);Ot(a,d&wC);Mt(a,e&KC);return true}
	function vy(a){var b,c,d,e;e=new ly('[');b=false;for(d=a.Kb();d.Qb();){c=d.Rb();b?(e.a+=', ',e):(b=true);e.a+=c===a?'(this Collection)':''+c}e.a+=']';return e.a}
	function st(e,f,g){return function(){var a=[];for(var b=0;b<arguments.length;b++){var c=ut(arguments[b],g[b]);a.push(c)}var d=e.apply(this,a);return f?tt(d,f):d}}
	function El(a,b){var c,d;d=jq(Eq,uB,0,~~((Bl.length+31)/32),7,1);xl(a.g,b);for(c=0;c<Bl.length;c++){wl(a.g,Cl[c]);nl(a.g,4)>0&&(d[~~(c/32)]|=1<<31-c%32)}return d}
	function Xm(b){var c,d,e;d=0;Jj(b);xm(b,3);for(c=0;c<b.d;c++){try{e=Eo(Vm,ex(Hd(b,c,6241)));e!=-1&&(d+=Um[e])}catch(a){a=nt(a);if(!sq(a,10))throw mt(a)}}return d}
	function aq(a,b,c){var d,e;d=true;while(d&&c>=0){e=Cx(b.a,c);if(e==57){Gv(b,c--,48)}else{Gv(b,c,e+1&gC);d=false}}if(d){b.a=Kx(b.a,0,0)+'1'+Jx(b.a,0);++a.b;++a.d}}
	function lq(a,b,c,d,e,f,g){var h,i,j,k,l;k=e[f];j=f==g-1;h=j?d:0;l=nq(h,k);mq(iq(a,g-f),b[f],c[f],h,l);if(!j){++f;for(i=0;i<k;++i){l[i]=lq(a,b,c,d,e,f,g)}}return l}
	function Vu(e,a){var b=Tu;if(!b){b=$doc.createElement('canvas');Tu=b}var c=''+e.b+'px '+e.a;var d=b.getContext('2d');d.font=c;var a=d.measureText(a);return a.width}
	function ug(a,b,c){var d,e,f;for(f=0;f<a.a.length;f++){e=tx((a.c[f]-b)*(a.c[f]-b)+(a.d[f]-c)*(a.d[f]-c));d=0-bk(b,c,a.c[f],a.d[f]);a.c[f]=b+e*sx(d);a.d[f]=c+e*jx(d)}}
	function Cg(a,b,c,d){var e,f,g;for(g=0;g<a.a.length;g++){f=tx((a.c[g]-b)*(a.c[g]-b)+(a.d[g]-c)*(a.d[g]-c));e=bk(b,c,a.c[g],a.d[g])+d;a.c[g]=b+f*sx(e);a.d[g]=c+f*jx(e)}}
	function Up(a,b){var c,d;c=a.b+a.n;if(a.d<c){while(a.d<c){b.a+='0';++a.d}}else{d=a.b+a.i;d>a.d&&(d=a.d);while(d>c&&Cx(b.a,d-1)==48){--d}if(d<a.d){hy(b,d,a.d);a.d=d}}}
	function ru(b,c,d,e){qu();var f=ou;$moduleName=c;$moduleBase=d;kt=e;function g(){for(var a=0;a<f.length;a++){f[a]()}}
	if(b){try{sB(g)()}catch(a){b(c,a)}}else{sB(g)()}}
	function fi(a,b,c){if(a.F[b]==6){if(c==-1||c==0||c==2){a.t[b]&=268435407;a.t[b]|=1+c<<28;c==2&&(a.t[b]|=16)}}else{if(c>=-1&&c<=14){a.t[b]&=268435455;a.t[b]|=1+c<<28}}}
	function il(a){var b,c;a.a=null;for(b=0;b<a.c.e;b++){if(Th(a.c,b)){!a.a&&(a.a=new Mz);c=new Al;c.a=Ah(a.c,0,b);c.b=Ah(a.c,1,b);c.d=Ch(a.c,b);c.c=Bh(a.c,b);Gz(a.a,c)}}}
	function sd(a,b){var c,d,e,f;if(Kh(a.d,b)==1){Gi(a.d,b,2);a.e+=2}for(e=0;e<2;e++){c=Ah(a.d,e,b);for(f=0;f<fj(a.d,c);f++){d=gj(a.d,c,f);if(a.c[d]){a.c[d]=false;--a.b}}}}
	function nh(a,b){var c,d,e;if(a.u==null||a.u[b]==null)return (a.A[b]&1)!=0?'':Sg[a.F[b]];e='';for(d=0;d<a.u[b].length;d++){d>0&&(e=e+',');c=a.u[b][d];e=e+Sg[c]}return e}
	function Wj(a,b){var c;if(b==null||b.length==0)return null;c=Fx(b,Rx(32));return c>0&&c<b.length-1?Yj(a,Sx(b.substr(0,c)),Sx(Nx(b,c+1,b.length-(c+1)))):Yj(a,Sx(b),null)}
	function vc(a){var b;b=a.G.c*xh(a.D);a.M=b*0.05999999865889549;a.I=b*0.15000000596046448;a.H=b*0.75;a.L=zq(b*a.C*vB+0.5);a.K=b*0.11999999731779099;a.N=b*wB;a.v=b*0.5+0.5}
	function ld(a,b){var c,d;if(a.D.p==0)return null;kd(a);c=a.G.c*xh(a.D);d=new Ng(a.t,b,c);if(d.c==1&&d.a==0&&d.b==0){d=null}else{Gg(d,a.G);Ig(d,a.t)}gd(a,b,c,aC);return d}
	function zc(a,b,c,d){if(Uh(a.D,dj(a.D,c,d))){hd(a,-3);Ql(a,b);hd(a,a.A)}else if(a.o[c]!=a.o[d]){wc(a,b,c,d)}else if(a.o[c]!=0){hd(a,a.o[c]);Ql(a,b);hd(a,a.A)}else{Ql(a,b)}}
	function xj(a,b,c){if(Hh(a,b)!=1)return 0;return 16-a.c[c]+(a.F[c]==1?HB:0)+((a.J[b]&24)==0||a.G[0][b]!=c?RB:0)+((a.t[c]&3)==0?IB:0)+((a.H[b]&64)!=0?0:512)+(a.F[c]!=6?256:0)}
	function nq(a,b){var c=new Array(b);var d;switch(a){case 6:d={l:0,m:0,h:0};break;case 7:d=0;break;case 8:d=false;break;default:return c;}for(var e=0;e<b;++e){c[e]=d}return c}
	function Kl(a){Dl();a=(a&1431655765)+(a>>>1&1431655765);a=(a&858993459)+(a>>>2&858993459);a=(a&117901063)+(a>>>4&117901063);a=(a&983055)+(a>>>8&983055);return (a&31)+(a>>>16)}
	function pv(a,b){var c,d,e,f,g;sq(b,22)?(c=new qv):(c=new hv);d=ox(a.c,b.Bb());e=ox(a.d,b.Cb());f=mx(a.c+a.b,b.Bb()+b.Ab());g=mx(a.d+a.a,b.Cb()+b.zb());bv(c,d,e,f,g);return c}
	function ne(a,b,c,d,e,f,g,h){var i,j;for(j=1;j<h;j++){for(i=g[j];i<g[j+1];i++)c[i]=f[e[i]]+(c[d[i]]<<8);oe(a,b,c,d,e,g,j);if(c[1]!=c[2])return true;j>1&&le(c,d,g,j)}return false}
	function Gc(a,b){var c,d,e;e=-1;d=-1;if((a.B&128)!=0)return -1;if(Qh(a.D,b)){e=kh(a.D,b);d=jh(a.D,b)}c=Wi(a.D,b);if(c!=-1){e=Fh(a.D,c);d=Eh(a.D,c)}e!=-1&&e!=0&&(e|=d<<8);return e}
	function qk(a,b){var c,d,e;if(b<0||b>999){gy(a.b,'  ?');return}c=false;for(d=0;d<3;d++){e=~~(b/100);if(e==0){d==2||c?dy(a.b,48):dy(a.b,32)}else{dy(a.b,48+e&gC);c=true}b=10*(b%100)}}
	function kl(a,b){var c,d,e;if(a.a){for(d=new Gy(a.a);d.a<d.b.Mb();){c=(Hp(d.a<d.b.Mb()),d.b.Pb(d.a++));e=sj(a.q,a.p[c.a],a.p[c.b],c.c,b)-1;if(e<c.d||e>c.c)return false}}return true}
	function cf(a,b){var c;if(a.c!=b.c)return a.c<b.c?-1:1;for(c=0;c<a.c;c++)if(au(a.d[c],b.d[c]))return Zt(a.d[c],b.d[c])?-1:1;return Ut(a.d[a.c],b.d[a.c])?0:Zt(a.d[a.c],b.d[a.c])?-1:1}
	function Vl(a,b,c,d){var e;e='<circle id="'+(a.g!=null?a.g:'mol'+Pl)+':Atom:'+b+'" '+'class="event" '+'cx="'+zq(c)+'" '+'cy="'+zq(d)+'" '+'r="'+8+'" '+'fill-opacity="0"/>';Gz(a.a,e)}
	function Fc(a,b){var c,d;if((a.B&128)!=0)return a.o[b];c=Vi(a.D,b);c!=-1&&(b=c);d=Gc(a,b);if(d==-1)return a.o[b];switch(d&255){case 1:return 384;case 2:return 64;default:return 448;}}
	function Hc(a){var b,c;hd(a,-2);Yl(a,a.H);c=new od;for(b=0;b<a.D.q;b++){if(Sh(a.D,b)){c.a=Cc(a,Ah(a.D,0,b));c.c=Dc(a,Ah(a.D,0,b));c.b=Cc(a,Ah(a.D,1,b));c.d=Dc(a,Ah(a.D,1,b));Ql(a,c)}}}
	function Ng(a,b,c){var d,e,f,g;Jg(this);e=b.b/a.b;g=b.a/a.a;f=0;f==0&&(f=24);d=f/c;this.c=d<(e<g?e:g)?d:e<g?e:g;this.a=b.c+b.b/2-this.c*(a.c+a.b/2);this.b=b.d+b.a/2-this.c*(a.d+a.a/2)}
	function CA(a){var b,c,d,e,f,g;e=a.a*SC+a.b*1502;g=a.b*SC+11;b=Math.floor(g*TC);e+=b;g-=b*rC;e%=rC;a.a=e;a.b=g;d=a.a*128;f=kx(a.b*yA[31]);c=d+f;c>=2147483648&&(c-=4294967296);return c}
	function oq(a,b,c,d,e,f){if(a===c){a=a.slice(b,b+e);b=0}for(var g=b,h=b+e;g<h;){var i=Math.min(g+10000,h);e=i-g;Array.prototype.splice.apply(c,[d,f?e:0].concat(a.slice(g,i)));g=i;d+=e}}
	function Xt(a,b){var c,d;c=a.h>>19;d=b.h>>19;return c==0?d!=0||a.h>b.h||a.h==b.h&&a.m>b.m||a.h==b.h&&a.m==b.m&&a.l>b.l:!(d==0||a.h<b.h||a.h==b.h&&a.m<b.m||a.h==b.h&&a.m==b.m&&a.l<=b.l)}
	function Yt(a,b){var c,d;c=a.h>>19;d=b.h>>19;return c==0?d!=0||a.h>b.h||a.h==b.h&&a.m>b.m||a.h==b.h&&a.m==b.m&&a.l>=b.l:!(d==0||a.h<b.h||a.h==b.h&&a.m<b.m||a.h==b.h&&a.m==b.m&&a.l<b.l)}
	function pe(a){var b,c;c=kq(Eq,[GB,cC],[18,5],0,[2,32],2);for(b=0;b<a.L.d;b++){a.I[b]&&(a.U[b]==1?(c[0][a.T[b]]=zf(c[0][a.T[b]],b)):a.U[b]==2&&(c[1][a.T[b]]=zf(c[0][a.T[b]],b)))}return c}
	function $k(a,b){var c,d,e,f,g;f=b.length;g=jq(Eq,uB,0,f,7,1);for(d=0;d<f;d++){c=d==f-1?b[0]:b[d+1];for(e=0;e<fj(a.g,b[d]);e++){if(ej(a.g,b[d],e)==c){g[d]=gj(a.g,b[d],e);break}}}return g}
	function Sl(a,b,c,d){var e,f;f=Ul(a,b);e='<text x="'+zq(c-f/2)+'" '+'y="'+zq(d+~~(a.j/3))+'" '+'font-family=" '+a.e.a+'" '+'font-size="'+a.e.b+'" '+'fill="'+a.d+'">'+b+'<\/text>';_l(a,e)}
	function mp(b,c){var d,e,f,g;for(e=0,f=b.length;e<f;e++){g=b[e];try{g[1]?g[0]._b()&&(c=lp(c,g)):g[0]._b()}catch(a){a=nt(a);if(sq(a,11)){d=a;dp(sq(d,40)?d.vb():d)}else throw mt(a)}}return c}
	function ww(a){var b;if(!(b=vw,!b&&(b=vw=/^\s*[+-]?(NaN|Infinity|((\d+\.?\d*)|(\.\d+))([eE][+-]?\d+)?[dDfF]?)\s*$/),b.test(a))){throw new xx('For input string: "'+a+'"')}return parseFloat(a)}
	function rg(a,b){var c,d,e,f,g;g=0;c=0;for(d=0;d<b;d++){g+=a[d].b*sx(a[d].a);c+=a[d].b*jx(a[d].a)}if(c==0)f=g>0?EB:TB;else{f=Math.atan(g/c);c<0&&(f+=CB)}e=Math.sqrt(g*g+c*c)/b;return new _j(f,e)}
	function cu(a,b){var c,d,e;b&=63;if(b<22){c=a.l<<b;d=a.m<<b|a.l>>22-b;e=a.h<<b|a.m>>22-b}else if(b<44){c=0;d=a.l<<b-22;e=a.m<<b-22|a.l>>44-b}else{c=0;d=0;e=a.l<<b-44}return {l:c&wC,m:d&wC,h:e&KC}}
	function zv(a){var b,c,d;c=yv(a);if(c==-1)return null;d=new jy;b=false;while(!b){if(c==10){b=true}else if(c==13){b=true;c=yv(a);c!=10&&(a.a=c)}if(!b){if(c==-1){break}dy(d,c&gC);c=yv(a)}}return d.a}
	function Ql(a,b){var c,d,e,f,g;d=zq(b.a);e=zq(b.b);f=zq(b.c);g=zq(b.d);c='<line x1="'+d+'" '+'y1="'+f+'" '+'x2="'+e+'" '+'y2="'+g+'" '+'style="stroke:'+a.d+';'+'stroke-width:'+zq(a.i)+'"/>';_l(a,c)}
	function Gl(a){var b;for(b=0;b<a.f.length;b++)if((a.c[b]&~a.f[b])!=0)return false;!a.d&&(a.d=Yj(new $j(false),a.e,null));!a.a&&(a.a=Yj(new $j(false),a.b,null));xl(a.g,a.d);wl(a.g,a.a);return rl(a.g)}
	function wc(a,b,c,d){var e,f;e=new od;f=new od;e.a=b.a;e.c=b.c;e.b=(b.a+b.b)/2;e.d=(b.c+b.d)/2;f.a=e.b;f.c=e.d;f.b=b.b;f.d=b.d;if(dd(a,e)){hd(a,a.o[c]);Ql(a,e)}if(dd(a,f)){hd(a,a.o[d]);Ql(a,f)}hd(a,a.A)}
	function Ki(a,b){a.F=Wz(a.F,b);a.r=Wz(a.r,b);a.v=Wz(a.v,b);a.B=Vz(a.B,b);a.C=Vz(a.C,b);a.D=Vz(a.D,b);a.w=Wz(a.w,b);a.t=Wz(a.t,b);a.A=Wz(a.A,b);a.u!=null&&(a.u=Xz(a.u,b));a.s!=null&&(a.s=Xz(a.s,b));a.N=b}
	function Ll(a){Dl();var b,c,d,e,f;if(a==null)return null;b=jq(Aq,eC,0,a.length*8,7,1);for(d=0;d<a.length;d++){f=a[d];for(e=7;e>=0;e--){c=f&15;c>9&&(c+=7);b[d*8+e]=yq(48+c);f>>=4}}return Tx(b,0,b.length)}
	function Ml(a){Dl();var b,c,d,e;if(a.length==0||(a.length&7)!=0)return null;d=jq(Eq,uB,0,~~(a.length/8),7,1);for(c=0;c<a.length;c++){e=~~(c/8);b=a.charCodeAt(c)-48;b>16&&(b-=7);d[e]<<=4;d[e]+=b}return d}
	function Rl(a,b,c,d){var e,f;f=new ly('<polygon points="');for(e=0;e<d;e++){ey(f,zq(b[e]));f.a+=',';ey(f,zq(c[e]));f.a+=' '}gy(f,'" style="fill:'+a.d+';'+'stroke:'+a.d+';'+'stroke-width:1"/>');_l(a,f.a)}
	function tc(a){var b,c;if((a.B&32)!=0)return;c=ym(a.D);if(c!=null){if(a.u.a==0&&a.u.b==0){b=a.G.c*xh(a.D);kd(a);Bc(a,b);gd(a,null,b,0)}Zl(a,zq(a.v));hd(a,128);Sl(a,c,a.u.a,a.u.b+0.30000001192092896*a.v)}}
	function Vi(a,b){var c,d,e,f,g;c=-1;if(a.k[b]==1){for(f=0;f<a.g[b];f++){if(a.j[b][f]==2){d=a.f[b][f];if(a.g[d]==2&&a.k[d]==2){for(g=0;g<2;g++){e=a.f[d][g];if(e!=b&&a.k[e]==1){c=d;break}}}break}}}return c}
	function Qo(a){var b;if(a.c==null){b=xq(a.b)===xq(Oo)?null:a.b;a.d=b==null?'null':tq(b)?b==null?null:b.name:wq(b)?'String':cw(lc(b));a.a=a.a+': '+(tq(b)?b==null?null:b.message:b+'');a.c='('+a.d+') '+a.a}}
	function Qu(a,b,c){var d,e;e=false;d='';if(a<0||a>1){e=true;d=d+' Red'}if(b<0||b>1){e=true;d=d+' Green'}if(c<0||c>1){e=true;d=d+' Blue'}if(e){throw new Kw('Color parameter outside of expected range:'+d)}}
	function Ru(a,b,c){var d,e;e=false;d='';if(a<0||a>255){e=true;d=d+' Red'}if(b<0||b>255){e=true;d=d+' Green'}if(c<0||c>255){e=true;d=d+' Blue'}if(e){throw new Kw('Color parameter outside of expected range:'+d)}}
	function Wd(a,b){var c,d,e,f;e=false;for(d=0;d<a.L.e;d++)if(Md(a,d,false)){a.p[d]=a.H;b&&ie(a,d);e=true}f=false;for(c=0;c<a.L.d;c++)if(Qd(a,c,false)){a.$[c]=a.H;b&&je(a,c);f=true}f&&(a.H=!a.H);return e||f}
	function jA(a,b,c,d,e,f){var g,h,i,j;g=d-c;if(g<7){gA(b,c,d,f);return}i=c+e;h=d+e;j=i+(h-i>>1);jA(b,a,i,j,-e,f);jA(b,a,j,h,-e,f);if(f.ab(a[j-1],a[j])<=0){while(c<d){b[c++]=a[i++]}return}hA(a,i,j,h,b,c,d,f)}
	function yd(a,b){var c,d,e,f,g,h;if(a.r[b]==0){return false}h=true;c=a.r[b];f=a.g[b];g=0;for(d=0;d<f;d++){e=a.f[b][d];g+=a.r[e]}(c<0?-c:c)<=(g<0?-g:g)&&(c>0?1:c<0?-1:0)!=(g>0?1:g<0?-1:0)&&(h=false);return h}
	function Mm(a,b){var c,d,e,f;f=0;d=new oB;while(f<b){e=zv(a.g);if(e==null){break}Dx(e.substr(0,4),'$$$$')&&++f;if(Dx(e.substr(0,1),'>')){c=Nm(e);c!=null&&MA(d.a,c,(Nv(),Mv))==null}}a.c=uy(d,jq(Cs,GB,2,0,4,1))}
	function $x(a){var b,c,d,e;b=0;d=a.length;e=d-4;c=0;while(c<e){b=a.charCodeAt(c+3)+31*(a.charCodeAt(c+2)+31*(a.charCodeAt(c+1)+31*(a.charCodeAt(c)+31*b)));b=~~b;c+=4}while(c<d){b=b*31+Cx(a,c++)}b=~~b;return b}
	function wl(a,b){var c,d;if(b.p==0||!b.L){a.c=null;return}a.c=b;a.g=false;xm(a.c,1);a.v=3;for(c=0;c<a.c.d;c++)(rh(a.c,c)&8192)!=0&&(a.v=7);for(d=0;d<a.c.e;d++)(Jh(a.c,d)&fC)!=0&&(a.v=7);a.u&&a.v!=3&&xm(a.q,a.v)}
	function vm(a,b){var c,d,e,f;f=a.a.a.length;if(f==0)return -1;e=1;while(2*e<=f)e<<=1;d=e;--e;while(d!=0){d>>=1;if(e>=f){e-=d;continue}c=Px(b,Hz(a.a,e));if(c==0)return e;if(d==0)break;c<0?(e-=d):(e+=d)}return -1}
	function Xg(a,b){a.p>=a.N&&Ki(a,a.N*2);a.F[a.p]=0;Ai(a,a.p,b);a.r[a.p]=0;a.t[a.p]=0;a.A[a.p]=0;a.v[a.p]=0;a.B[a.p]=0;a.C[a.p]=0;a.D[a.p]=0;a.u!=null&&(a.u[a.p]=null);a.s!=null&&(a.s[a.p]=null);a.R=0;return a.p++}
	function Zc(a,b){var c,d,e,f,g,h,i;c=jq(Dq,xB,0,Yi(a.D,b),7,1);for(e=0;e<Yi(a.D,b);e++)c[e]=zh(a.D,b,ej(a.D,b,e));kA(c);f=$c(c,0);g=Xc(c,0,f);for(d=1;d<c.length;d++){h=$c(c,d);i=Xc(c,d,h);if(g<i){g=i;f=h}}return f}
	function qt(a,b,c){var d=ot;var e=pt;var f=vt;var g=d[a];var h=f(g);if(g&&!h){_=g}else{_=d[a]=!b?{}:e(b);_.cM=c;_.constructor=_;!b&&(_.tM=zt)}for(var i=3;i<arguments.length;++i){arguments[i].prototype=_}h&&(_.cZ=h)}
	function pl(a,b){var c;c=0;if((a.H[b]&512)!=0||a.J[b]==64)c|=8;else switch(Hh(a,b)){case 1:c|=1;break;case 2:c|=2;break;case 3:c|=4;}(a.H[b]&64)!=0?(c|=32):a.L||(c|=16);(a.H[b]&256)!=0?(c|=WB):a.L||(c|=_B);return c}
	function gn(b){var c,d,e,f;e=-0.5299999713897705;for(c=0;c<b.d;c++){f={l:wC,m:wC,h:KC};try{f=Hd(b,c,2144)}catch(a){a=nt(a);if(!sq(a,10))throw mt(a)}for(d=0;d<en.length;d++){if(Ut(dn[d],f)){e+=en[d];break}}}return e}
	function tn(a,b){on();var c;typeof b==='undefined'&&(b=true);if(typeof b==='boolean'){c=new rn(Wj(wo(nn,false),a));b===true&&c.inventCoordinates()}else typeof b==='string'&&(c=new rn(Xj(wo(nn,false),a,b)));return c}
	function Cd(a,b,c){var d,e,f;d=false;for(f=0;f<a.g[b];f++){if(!Aj(a,a.i[b][f])&&a.j[b][f]==1){e=a.f[b][f];if((a.t[e]&HB)==0&&(a.F[e]==6&&xd(a,e)==1||a.F[e]==16&&xd(a,e)==2)){if(d||!c)return true;d=true}}}return false}
	function ki(a,b,c){var d;if(c!=null){if(c.length==0)c=null;else{d=Ri(c);if(d!=0&&Dx(c,Sg[d])||Dx(c,'?')){Ai(a,b,d);c=null}}}if(c==null){a.s!=null&&(a.s[b]=null)}else{a.s==null&&(a.s=jq(Aq,GB,9,a.N,0,2));a.s[b]=Sx(c)}}
	function me(a,b){var c,d,e,f,g,h,i;g=Yi(a.L,b);h=jq(Eq,uB,0,g,7,1);for(e=0;e<g;e++)h[e]=ej(a.L,b,e);for(d=g;d>1;d--){c=false;for(f=1;f<d;f++){if(ke(a,b,h[f-1],h[f])){c=true;i=h[f-1];h[f-1]=h[f];h[f]=i}}if(!c)break}return h}
	function Of(a,b){var c,d;if(a==null)return b==null?0:1;if(b==null)return -1;c=qx(a.length,b.length);for(d=0;d<c;d++)if((a[d]&hC)!=(b[d]&hC))return (a[d]&hC)<(b[d]&hC)?-1:1;return a.length==b.length?0:a.length<b.length?-1:1}
	function Hk(a,b){var c,d,e,f,g,h;f=a.indexOf(b+'=(')+b.length+2;g=Gx(a,Rx(41),f);e=Ak(a,f);c=xw(a.substr(f,e-f));h=jq(Eq,uB,0,c,7,1);for(d=0;d<c;d++){f=zk(a,e);e=Ak(a,f);(e==-1||e>g)&&(e=g);h[d]=xw(a.substr(f,e-f))}return h}
	function Sw(a){var b,c,d;if(a<0){return 0}else if(a==0){return 32}else{d=-(a>>16);b=d>>16&16;c=16-b;a=a>>b;d=a-256;b=d>>16&8;c+=b;a<<=b;d=a-HB;b=d>>16&4;c+=b;a<<=b;d=a-NB;b=d>>16&2;c+=b;a<<=b;d=a>>14;b=d&~(d>>1);return c+2-b}}
	function oi(a,b,c,d){var e;if(c==null){a.u!=null&&(a.u[b]=null);return}if(c.length==1&&!d){e=c[0];a.F[b]!=e&&Zg(a,b,e,0);a.u!=null&&(a.u[b]=null);return}a.u==null&&(a.u=jq(Eq,cC,5,a.N,0,2));a.u[b]=c;d&&(a.A[b]|=1);a.R=0;a.L=true}
	function Ue(a,b){var c,d,e,f;if(a.d!=b.d)return a.d>b.d?1:-1;e=a.a.length;f=b.a.length;c=e<f?e:f;for(d=0;d<c;d++){--e;--f;if(a.a[e]!=b.a[f])return a.a[e]>b.a[f]?1:-1}if(e!=f)return e>f?1:-1;if(a.b!=b.b)return a.b>b.b?1:-1;return 0}
	function tm(a,b,c,d,e,f){this.k=a;if(d!=0&&d!=1){this.b=true}else{this.a=b;this.c=c;this.d=d;this.e=f;this.g=0;this.i=jq(jt,yB,0,4,8,1);this.f=jq(Eq,uB,0,4,7,1);this.j=jq(Eq,uB,0,4,7,1);if(c!=-1&&d==1){qm(this,tB,e,true);this.d=0}}}
	function Ge(a,b){var c,d,e,f,g,h,i;i=tj(a.L);for(c=0;c<i.i.a.length;c++){if(i.e[c]&&al(i,c,b)){for(e=Hz(i.i,c),f=0,g=e.length;f<g;++f){d=e[f];if(d!=b)for(h=0;h<fj(a.L,d);h++)if(Bj(a.L,gj(a.L,d,h)))return true}return false}}return false}
	function Ef(a,b,c){var d,e,f,g,h;h=false;g=1;b[c]=1;d=true;while(d){d=false;for(e=0;e<a.b;e++){if(b[e]==g){for(f=0;f<a.b;f++){if(b[f]==0&&Kf(a,e,f)){if(a.c[f]==-2){b[f]=g+1;d=true}else if(a.c[f]!=a.c[c]){b[f]=g+1;h=true}}}}}++g}return h}
	function du(a,b){var c,d,e,f,g;b&=63;c=a.h;d=(c&_B)!=0;d&&(c|=-1048576);if(b<22){g=c>>b;f=a.m>>b|c<<22-b;e=a.l>>b|a.m<<22-b}else if(b<44){g=d?KC:0;f=c>>b-22;e=a.m>>b-22|c<<44-b}else{g=d?KC:0;f=d?wC:0;e=c>>b-44}return {l:e&wC,m:f&wC,h:g&KC}}
	function Mj(a,b,c,d){var e,f,g,h,i;g=jq(Eq,uB,0,a.c[b],7,1);i=jj(a,b,c,d,g);if(i==3)return false;f=(a.t[b]&3)==i?17:9;for(h=0;h<a.c[b];h++){if((g[h]&1)==1){e=a.i[b][c[h]];a.J[e]=f;if(a.G[0][e]!=b){a.G[1][e]=a.G[0][e];a.G[0][e]=b}}}return true}
	function Wl(a,b,c,d,e,f,g){var h;h='<line id="'+(a.g!=null?a.g:'mol'+Pl)+':Bond:'+b+'-'+c+'" '+'class="event" '+'x1="'+zq(d)+'" '+'y1="'+zq(e)+'" '+'x2="'+zq(f)+'" '+'y2="'+zq(g)+'" '+'stroke-width="'+8+'" '+'stroke-opacity="0"'+'/>';Gz(a.b,h)}
	function Fo(a,b){var c,d,e,f;f=a.a.a.length;if(f==0){return -1}e=1;while(2*e<=f)e<<=1;d=e;--e;while(d!=0){d>>=1;if(e>=f){e-=d;continue}c=Zw(b,Hz(a.a,e));if(c==0)return e;if(d==0)break;c<0?(e-=d):(e+=d)}e<f&&Zw(b,Hz(a.a,e))>0&&++e;return -(e+1)}
	function pw(a){if(a.Ib()){var b=a.c;b.Jb()?(a.k='['+b.j):!b.Ib()?(a.k='[L'+b.Gb()+';'):(a.k='['+b.Gb());a.b=b.Fb()+'[]';a.i=b.Hb()+'[]';return}var c=a.f;var d=a.d;d=d.split('/');a.k=sw('.',[c,sw('$',d)]);a.b=sw('.',[c,sw('.',d)]);a.i=d[d.length-1]}
	function Ad(a,b){var c,d,e,f,g,h;c=false;if(a.F[b]!=8)return false;if(a.g[b]!=1)return false;g=a.f[b][0];if(a.F[g]==15){h=a.g[g];for(d=0;d<h;d++){e=a.f[g][d];if(e==b){continue}if(a.F[e]!=8){continue}f=dj(a,g,e);if(a.J[f]==2){c=true;break}}}return c}
	function Sx(a){var b,c,d,e,f,g,h;g=a.length;b=0;for(f=0;f<g;){d=Vv(a,f,a.length);f+=d>=aC?2:1;d<128?++b:d<RB?(b+=2):d<aC?(b+=3):d<2097152?(b+=4):d<pC&&(b+=5)}c=jq(Aq,eC,0,b,7,1);h=0;for(e=0;e<g;){d=Vv(a,e,a.length);e+=d>=aC?2:1;h+=Qx(c,h,d)}return c}
	function Vt(a){var b,c,d,e,f;if(Dw(a)){return nu(),mu}if(a<PC){return nu(),ku}if(a>=9223372036854775807){return nu(),ju}e=false;if(a<0){e=true;a=-a}d=0;if(a>=OC){d=zq(a/OC);a-=d*OC}c=0;if(a>=NC){c=zq(a/NC);a-=c*NC}b=zq(a);f=Dt(b,c,d);e&&Jt(f);return f}
	function ud(a){var b,c,d,e,f,g,h;do{h=false;for(c=0;c<a.d.e;c++){if(a.c[c]){f=false;for(e=0;e<2;e++){d=Ah(a.d,e,c);b=false;for(g=0;g<fj(a.d,d);g++){if(c!=gj(a.d,d,g)&&a.c[gj(a.d,d,g)]){b=true;break}}if(!b){f=true;break}}if(f){h=true;sd(a,c)}}}}while(h)}
	function mm(a){var b,c,d,e,f,g,h;do{h=false;for(c=0;c<a.b.e;c++){if(a.a[c]){f=false;for(e=0;e<2;e++){b=false;d=Ah(a.b,e,c);for(g=0;g<fj(a.b,d);g++){if(c!=gj(a.b,d,g)&&a.a[gj(a.b,d,g)]){b=true;break}}if(!b){f=true;break}}if(f){h=true;lm(a,c)}}}}while(h)}
	function Id(a,b,c,d,e,f,g){var h,i,j,k;j=0;for(i=0;i<a.L.d;i++)(rh(a.L,a.u[i])&e)!=0&&++j;if(j==0)return false;if(b>15){xe(a,c);b-=16}te(a,1,1);te(a,b,4);te(a,j,d);for(h=0;h<a.L.d;h++){k=rh(a.L,a.u[h])&e;if(k!=0){te(a,h,d);f!=1&&te(a,k>>g,f)}}return true}
	function Jd(a,b,c,d,e,f,g){var h,i,j,k;j=0;for(i=0;i<a.L.e;i++)(Jh(a.L,a.v[i])&e)!=0&&++j;if(j==0)return false;if(b>15){xe(a,c);b-=16}te(a,1,1);te(a,b,4);te(a,j,d);for(h=0;h<a.L.e;h++){k=Jh(a.L,a.v[h])&e;if(k!=0){te(a,h,d);f!=1&&te(a,k>>g,f)}}return true}
	function Wg(a,b,c,d){var e;e=(a.p>=a.N&&Ki(a,a.N*2),a.F[a.p]=0,Ai(a,a.p,6),a.r[a.p]=0,a.t[a.p]=0,a.A[a.p]=0,a.v[a.p]=0,a.B[a.p]=0,a.C[a.p]=0,a.D[a.p]=0,a.u!=null&&(a.u[a.p]=null),a.s!=null&&(a.s[a.p]=null),a.R=0,a.p++);a.B[e]=b;a.C[e]=c;a.D[e]=d;return e}
	function Zp(a,b){var c,d;d=0;c=new jy;d+=Yp(a,b,0,c,false);a.t=c.a;d+=$p(a,b,d,false);d+=Yp(a,b,d,c,false);a.u=c.a;if(d<b.length&&b.charCodeAt(d)==59){++d;d+=Yp(a,b,d,c,true);a.q=c.a;d+=$p(a,b,d,true);d+=Yp(a,b,d,c,true);a.r=c.a}else{a.q='-'+a.t;a.r=a.u}}
	function Yg(a,b,c,d){var e;if(b==c)return -1;for(e=0;e<a.q;e++){if(a.G[0][e]==b&&a.G[1][e]==c||a.G[0][e]==c&&a.G[1][e]==b){a.J[e]<d&&(a.J[e]=d);return e}}a.q>=a.O&&Li(a,a.O*2);a.G[0][a.q]=b;a.G[1][a.q]=c;a.J[a.q]=d;a.H[a.q]=0;a.I[a.q]=0;a.R=0;return a.q++}
	function wj(a,b){var c,d;xm(a,1);if(a.g[b]==2&&a.j[b][0]==2&&a.j[b][1]==2){for(c=0;c<2;c++)for(d=0;d<a.c[a.f[b][c]];d++)if(ai(a,a.i[a.f[b][c]][d],a.f[b][c]))return a.i[a.f[b][c]][d]}else{for(c=0;c<a.c[b];c++)if(ai(a,a.i[b][c],b))return a.i[b][c]}return -1}
	function eg(a,b,c,d){var e,f,g,h,i,j;g=jq(Eq,uB,0,a.b,7,1);h=jq(Eq,uB,0,a.b,7,1);g[0]=c;g[1]=b;h[c]=1;h[b]=2;f=1;i=1;while(f<=i){for(j=0;j<a.e[g[f]];j++){e=ej(a.i,g[f],j);if(e==d)return 1+h[g[f]];if(h[e]==0&&Ej(a.i,e)){g[++i]=e;h[e]=h[g[f]]+1}}++f}return 0}
	function Vp(a,b){var c,d;d=0;while(d<a.d-1&&Cx(b.a,d)==48){++d}if(d>0){b.a=Kx(b.a,0,0)+''+Jx(b.a,d);a.d-=d;a.e-=d}if(a.j>a.o&&a.j>0){a.e+=a.b-1;c=a.e%a.j;c<0&&(c+=a.j);a.b=c+1;a.e-=c}else{a.e+=a.b-a.o;a.b=a.o}if(a.d==1&&b.a.charCodeAt(0)==48){a.e=0;a.b=a.o}}
	function sf(a,b){var c,d,e,f,g,h;if(!a.b)return false;e=false;for(f=a.b.a.length-1;f>=0;f--){d=false;g=Hz(a.b,f);g.a==2?(d=rf(a,g.b,g.c,g.d,b)):g.a==1&&(d=wf(a,g.b,b));if(d){Jz(a.b,g);for(h=0;h<a.g[g.b].length;h++){c=a.g[g.b][h];a.n[c]=false}e=true}}return e}
	function wg(a){var b,c,d,e,f,g,h,i;a.f=0;c=new Mz;for(e=1;e<a.a.length;e++){for(f=0;f<e;f++){h=hx(a.c[e]-a.c[f]);i=hx(a.d[e]-a.d[f]);d=Math.sqrt(h*h+i*i);if(d<0.8){b=jq(Eq,uB,0,2,7,1);b[0]=a.a[e];b[1]=a.a[f];c.a[c.a.length]=b}g=1-(d<1?d:1);a.f+=g*g}}return c}
	function Lh(a,b){var c,d;if(a.F[b]>=171&&a.F[b]<=190)return 0;d=0;(a.t[b]&48)==32&&(d-=1);((a.t[b]&48)==16||(a.t[b]&48)==48)&&(d-=2);c=a.r[b];if(c==0&&a.L){(a.A[b]&JB)==LB&&(c=-1);(a.A[b]&JB)==KB&&(c=1)}a.F[b]==6?(d-=c<0?-c:c):Si(a.F[b])?(d+=c):(d-=c);return d}
	function um(a,b){var c,d,e,f;f=a.a.a.length;if(f==0){Fz(a.a,0,b);return 0}e=1;while(2*e<=f)e<<=1;d=e;--e;while(d!=0){d>>=1;if(e>=f){e-=d;continue}c=Px(b,Hz(a.a,e));if(c==0)return -1;if(d==0)break;c<0?(e-=d):(e+=d)}e<f&&Px(b,Hz(a.a,e))>0&&++e;Fz(a.a,e,b);return e}
	function Lt(a){var b,c,d;c=a.l;if((c&c-1)!=0){return -1}d=a.m;if((d&d-1)!=0){return -1}b=a.h;if((b&b-1)!=0){return -1}if(b==0&&d==0&&c==0){return -1}if(b==0&&d==0&&c!=0){return Tw(c)}if(b==0&&d!=0&&c==0){return Tw(d)+22}if(b!=0&&d==0&&c==0){return Tw(b)+44}return -1}
	function Uf(a){var b,c,d,e,f,g,h;c=jq(Oq,GB,41,a.b,0,1);for(b=0;b<a.b;b++){c[b]=new ef;df(c[b],b)}h=jq(Eq,uB,0,a.b,7,1);for(d=0;d<a.i.e;d++){e=Ih(a.i,d);if(e==1||e==2){af(c[Ah(a.i,0,d)],e);af(c[Ah(a.i,1,d)],e)}}f=Vf(c,h);do{g=f;Tf(a,c,h);f=Vf(c,h)}while(g!=f);return h}
	function Ee(a,b,c,d){var e,f,g;e=c==-1?hx(th(a.L,b)-th(a.L,a.u[0]))/8:hx(th(a.L,b)-th(a.L,c));d<e&&(d=e);f=c==-1?hx(uh(a.L,b)-uh(a.L,a.u[0]))/8:hx(uh(a.L,b)-uh(a.L,c));d<f&&(d=f);if(a._){g=c==-1?hx(vh(a.L,b)-vh(a.L,a.u[0]))/8:hx(vh(a.L,b)-vh(a.L,c));d<g&&(d=g)}return d}
	function se(a,b,c,d,e,f){var g,h,i;g=c==-1?(th(a.L,b)-th(a.L,a.u[0]))/8:th(a.L,b)-th(a.L,c);h=c==-1?(uh(a.L,b)-uh(a.L,a.u[0]))/8:uh(a.L,b)-uh(a.L,c);te(a,zq((d+g)/e),f);te(a,zq((d+h)/e),f);if(a._){i=c==-1?(vh(a.L,b)-vh(a.L,a.u[0]))/8:vh(a.L,b)-vh(a.L,c);te(a,zq((d+i)/e),f)}}
	function hl(a,b,c){var d,e,f,g;if((a.t[b]&~a.f[c])!=0)return false;g=(Jh(a.c,c)&MB)>>14;if(g!=0){if(a.q.L&&g==(Jh(a.q,c)&MB)>>14)return true;d=false;f=tj(a.q);for(e=0;e<f.i.a.length;e++){if(Hz(f.j,e).length==g){if(bl(f,e,b)){d=true;break}}}if(!d)return false}return true}
	function yt(a){var b=this;if(a=='$wnd'){return $wnd}else if(a===''){return b}if(a.substring(0,5)=='$wnd.'){b=$wnd;a=a.substring(5)}var c=a.split('.');!(c[0] in b)&&b.execScript&&b.execScript('var '+c[0]);for(var d;c.length&&(d=c.shift());){b[d]?(b=b[d]):(b=b[d]={})}return b}
	function im(a){var b,c,d,e;for(b=0;b<a.b.d;b++){if(wh(a.b,b)==7&&fh(a.b,b)==0&&pj(a.b,b)>3&&$i(a.b,b)>0){for(e=0;e<fj(a.b,b);e++){c=ej(a.b,b,e);d=gj(a.b,b,e);if(Hh(a.b,d)>1&&Xh(a.b,c)){Kh(a.b,d)==4?Gi(a.b,d,2):Gi(a.b,d,1);hi(a.b,b,fh(a.b,b)+1);hi(a.b,c,fh(a.b,c)-1);break}}}}}
	function ll(a){var b,c,d,e,f,g,h,i;for(d=0;d<a.c.e;d++){if((Jh(a.c,d)&fC)!=0){e=Ih(a.c,d);if(e==0)continue;b=Ah(a.c,0,d);c=Ah(a.c,1,d);f=a.p[b];g=a.p[c];h=dj(a.q,f,g);i=Ih(a.q,h);if(i==0)continue;if(e==3)continue;if(i==3)continue;if(ql(a,d,h)==(e==i))return false}}return true}
	function _p(a,b){var c,d,e;if(a.b>a.d){while(a.d<a.b){b.a+='0';++a.d}}if(!a.v){if(a.b<a.o){d=new jy;while(a.b<a.o){d.a+='0';++a.b;++a.d}iy(b,0,d.tS())}else if(a.b>a.o){e=a.b-a.o;for(c=0;c<e;++c){if(Cx(b.a,c)!=48){e=c;break}}if(e>0){b.a=Kx(b.a,0,0)+''+Jx(b.a,e);a.d-=e;a.b-=e}}}}
	function tg(a){var b,c;if(a.k)return;a.n=a.c[0];a.i=a.c[0];a.o=a.d[0];a.j=a.d[0];for(b=0;b<a.a.length;b++){c=rh(a.p,a.a[b])!=0?0.6:wh(a.p,a.a[b])!=6?0.25:0;a.n>a.c[b]-c&&(a.n=a.c[b]-c);a.i<a.c[b]+c&&(a.i=a.c[b]+c);a.o>a.d[b]-c&&(a.o=a.d[b]-c);a.j<a.d[b]+c&&(a.j=a.d[b]+c)}a.k=true}
	function Ku(){Ku=rt;Ju=new Nu(255,255,255);Bu=Ju;new Nu(192,192,192);Eu=new Nu(128,128,128);new Nu(64,64,64);Cu=new Nu(0,0,0);Iu=new Nu(255,0,0);new Nu(255,175,175);Hu=new Nu(255,200,0);new Nu(255,255,0);Fu=new Nu(0,255,0);Gu=new Nu(255,0,255);new Nu(0,255,255);Du=new Nu(0,0,255)}
	function Tf(a,b,c){var d,e,f,g,h,i,j,k;e=jq(Eq,uB,0,16,7,1);for(d=0;d<a.b;d++){for(g=0;g<a.e[d];g++){k=c[ej(a.i,d,g)];for(h=0;h<g;h++)if(k<e[h])break;for(i=g;i>h;i--)e[i]=e[i-1];e[h]=k}j=qx(6,a.e[d]);df(b[d],d);bf(b[d],16,c[d]);bf(b[d],(6-j)*17,0);for(f=0;f<j;f++)bf(b[d],17,e[f])}}
	function Df(a,b){var c,d,e,f,g,h;for(e=0;e<a.b;e++){if(a.e[e][b]&&a.c[e]!=-3){for(d=0;d<=a.j.g.length;d++){if(d!=b&&a.e[e][d]){a.e[e][b]=false;h=e<a.a?e:e<a.b?e-a.a:-1;g=Lf(a,e<a.a?1:e<a.b?2:0);for(f=0;f<a.j.g[b].length;f++){c=a.j.g[b][f];nf(a.j,c)&&a.j.j[c]==h&&(a.j.j[c]=yq(g))}}}}}}
	function sj(a,b,c,d,e){var f,g,h,i,j,k;if(b==c)return 0;xm(a,1);i=jq(Eq,uB,0,a.d,7,1);h=jq(Eq,uB,0,a.d,7,1);h[0]=b;i[b]=1;g=0;j=0;while(g<=j&&i[h[g]]<=d){for(k=0;k<a.g[h[g]];k++){f=a.f[h[g]][k];if(f==c)return i[h[g]];if(i[f]==0&&(e==null||!e[f])){h[++j]=f;i[f]=i[h[g]]+1}}++g}return -1}
	function nj(a,b,c){var d,e,f,g;e=pj(a,b)-Lh(a,b);c&&(e-=a.c[b]-a.g[b]);g=a.F[b]<Tg.length?Tg[a.F[b]]:null;f=g==null?6:g[0];if(e<=f)return -1;if(!c&&(g==null||g.length==1)){e-=a.c[b]-a.g[b];return e<=f?-1:e}if(g!=null)for(d=1;f<e&&d<g.length;d++)f=g[d];c||(e-=a.c[b]-a.g[b]);return f>e?f:e}
	function Me(a,b){var c,d,e;c=Ah(a.L,0,b);if(c>=a.L.d)return false;if(a.W[c]==1||a.W[c]==2)return true;if(a.W[c]==3)return false;d=Wi(a.L,c);if(d!=-1)return a.n[d]==1||a.n[d]==2;for(e=0;e<fj(a.L,c);e++){if(hj(a.L,c,e)==2){if(a.W[ej(a.L,c,e)]==1||a.W[ej(a.L,c,e)]==2)return true}}return false}
	function eq(a,b){var c,d,e,f,g;g=a.a.length;gy(a,b.toPrecision(20));f=0;e=Gx(a.a,'e',g);e<0&&(e=Gx(a.a,'E',g));if(e>=0){d=e+1;d<a.a.length&&Cx(a.a,d)==43&&++d;d<a.a.length&&(f=xw(Jx(a.a,d)));hy(a,e,a.a.length)}c=Gx(a.a,'.',g);if(c>=0){a.a=Kx(a.a,0,c)+''+Jx(a.a,c+1);f-=a.a.length-c}return f}
	function yy(a,b){var c,d,e,f,g;if(b===a){return true}if(!sq(b,71)){return false}g=b;if(a.Mb()!=g.Mb()){return false}f=g.Kb();for(d=new Gy(a);d.a<d.b.Mb();){c=(Hp(d.a<d.b.Mb()),d.b.Pb(d.a++));e=(Hp(f.a<f.b.Mb()),f.b.Pb(f.a++));if(!(xq(c)===xq(e)||c!=null&&jc(c,e))){return false}}return true}
	function bf(a,b,c){if(a.b==0){++a.c;a.b=63}if(a.b==63){a.d[a.c]=bu(a.d[a.c],Wt(c));a.b-=b}else{if(a.b>=b){a.d[a.c]=cu(a.d[a.c],b);a.d[a.c]=bu(a.d[a.c],Wt(c));a.b-=b}else{a.d[a.c]=cu(a.d[a.c],a.b);a.d[a.c]=bu(a.d[a.c],Wt(c>>b-a.b));b-=a.b;++a.c;a.b=63-b;a.d[a.c]=bu(a.d[a.c],Wt(c&(1<<b)-1))}}}
	function Mp(a,b){var c,d,e,f;a=''+a;c=new ky(a.length+16*b.length);f=0;d=0;while(d<b.length){e=a.indexOf('%s',f);if(e==-1){break}gy(c,a.substr(f,e-f));fy(c,b[d++]);f=e+2}gy(c,Nx(a,f,a.length-f));if(d<b.length){c.a+=' [';fy(c,b[d++]);while(d<b.length){c.a+=', ';fy(c,b[d++])}c.a+=']'}return c.a}
	function Ag(a){var b,c,d,e,f;b=0;for(d=0;d<a.a.length;d++)for(f=0;f<a.r.e[a.a[d]];f++)ej(a.p,a.a[d],f)>a.a[d]&&++b;a.e=jq(Eq,uB,0,b,7,1);a.b=jq(Eq,uB,0,a.r.b,7,1);b=0;for(c=0;c<a.a.length;c++){a.b[a.a[c]]=c;for(e=0;e<a.r.e[a.a[c]];e++){if(ej(a.p,a.a[c],e)>a.a[c]){a.e[b]=gj(a.p,a.a[c],e);++b}}}}
	function kj(a,b,c){var d,e,f,g,h,i,j,k;xm(a,1);for(e=0;e<a.p;e++)b[e]=-1;h=0;for(d=0;d<a.p;d++){if(b[d]==-1&&(!c||(a.t[d]&WB)!=0)){b[d]=h;i=jq(Eq,uB,0,a.p,7,1);i[0]=d;g=0;j=0;while(g<=j){for(k=0;k<a.c[i[g]];k++){f=a.f[i[g]][k];if(b[f]==-1&&(!c||(a.t[f]&WB)!=0)){i[++j]=f;b[f]=h}}++g}++h}}return h}
	function mj(a){var b,c,d,e,f,g;g=jq(Eq,uB,0,a.p,7,1);e=jq(jt,yB,0,a.p,8,1);for(c=0;c<a.q;c++)for(d=0;d<2;d++)Gj(a,a.G[d][c])&&!Gj(a,a.G[1-d][c])&&(e[a.G[d][c]]=true);f=a.p-1;while(f>=0&&e[f]){g[f]=f;--f}for(b=0;b<=f;b++){if(e[b]){g[b]=f;g[f]=b;--f;while(f>=0&&e[f]){g[f]=f;--f}}else{g[b]=b}}return g}
	function jj(a,b,c,d,e){var f,g,h,i,j,k,l;e==null&&(e=jq(Eq,uB,0,a.c[b],7,1));if(!ij(a,b,c,d,e))return 3;h=-1;for(i=0;i<a.c[b];i++){if((e[i]&1)==1){f=a.J[a.i[b][c[i]]];if(h!=-1&&h!=f)return 3;h=f}}j=ix(e[0]-e[1])==2?1:0;g=e[j]-e[j+1];l=(g<0?-g:g)==3^e[j]<e[j+1];k=a.c[b]==3||(e[3]&1)==1;return l^k^h==9?1:2}
	function Dk(a){var b,c,d,e,f,g,h,i;h=null;c=a.indexOf('[');d=a.indexOf(']',c);if(c>=0&&d>0){b=jq(Eq,uB,0,16,7,1);i=a.substr(c+1,d-(c+1));e=0;g=true;while(g&&e<16){c=i.indexOf(',');if(c==-1){f=i;g=false}else{f=i.substr(0,c);i=Nx(i,c+1,i.length-(c+1))}b[e++]=Ri(f)}h=jq(Eq,uB,0,e,7,1);oy(b,0,h,0,e)}return h}
	function ee(a){var b,c,d,e;a.H=true;a.R=jq(Aq,eC,0,a.L.d,7,1);a.g=jq(Aq,eC,0,a.L.e,7,1);e=Wd(a,true);while(a.N<a.L.d&&e){for(b=0;b<a.L.d;b++){df(a.c[b],b);bf(a.c[b],20,a.d[b]<<4|a.W[b]<<2)}for(c=0;c<a.L.e;c++){af(a.c[Ah(a.L,0,c)],a.n[c]);af(a.c[Ah(a.L,1,c)],a.n[c])}d=ae(a);if(a.N==d)break;a.N=d;e=Wd(a,true)}}
	function nm(a,b){var c;if(wh(a.b,b)==16&&fh(a.b,b)<=0||wh(a.b,b)==6&&fh(a.b,b)!=0||!Yh(a.b,b))return false;c=hh(a.b,b)==null?0:ih(a.b,b)[0];if(lj(a.b,b)-c<1)return false;if(wh(a.b,b)!=5&&wh(a.b,b)!=6&&wh(a.b,b)!=7&&wh(a.b,b)!=8&&wh(a.b,b)!=15&&wh(a.b,b)!=16&&wh(a.b,b)!=33&&wh(a.b,b)!=34)return false;return true}
	function gd(a,b,c,d){var e;e=c/2;switch(d&VB){case VB:if(b){a.u.a=b.c+b.b/2;a.u.b=b.d+b.a-e;break}case 0:a.u.a=a.t.c+a.t.b/2;a.u.b=a.t.d+a.t.a+e;!!b&&a.u.b>b.d+b.a-e&&(a.u.b=b.d+b.a-e);break;case _B:if(b){a.u.a=b.c+b.b/2;a.u.b=b.d+e;break}case WB:a.u.a=a.t.c+a.t.b/2;a.u.b=a.t.d-e;!!b&&a.u.b<b.d+e&&(a.u.b=b.d+e);}}
	function am(a,b){this.t=new qv;this.D=a;this.B=0;this.C=1;this.G=new Mg;this.O=new Mz;this.J=new Mz;this.q=jq(jt,yB,0,this.D.p,8,1);this.u=new Zu;this.A=0;this.w=-1;this.r=qc;this.s=rc;this.i=1;this.j=10;this.k=400;this.f=400;this.d='black';this.b=new Mz;this.a=new Mz;this.c=new cy;this.e=new Wu(12);this.g=b;++Pl}
	function le(a,b,c,d){var e,f,g,h,i,j,k,l,m;l=c[d];g=c[d+1]-l;m=jq(Mq,GB,69,g,0,1);for(i=0;i<g;i++){m[i]=new _e;m[i].c=a[i+l];m[i].b=b[i+l];m[i].a=i+l}e=new Ze;for(k=d;k>1;k--){for(j=0;j<g;j++){m[j].c+=a[m[j].b]<<16;m[j].b=b[m[j].b]}iA(m,0,m.length,e);f=1;for(h=0;h<g;h++){a[m[h].a]=f;h!=g-1&&Ye(m[h],m[h+1])!=0&&++f}}}
	function bg(a,b,c,d){var e,f,g,h,i;f=new Fg(a,a.i,b.a.length+c.a.length-d);e=0;for(h=0;h<b.a.length;h++){f.a[e]=b.a[h];f.q[e]=b.q[h];f.c[e]=b.c[h];f.d[e++]=b.d[h]}for(g=0;g<c.a.length;g++){i=yg(b,c.a[g]);if(i==-1){f.a[e]=c.a[g];f.q[e]=c.q[g];f.c[e]=c.c[g];f.d[e++]=c.d[g]}else{f.q[i]<c.q[g]&&(f.q[i]=c.q[g])}}return f}
	function Ic(a){var b,c,d,e;if(a.D.L){hd(a,320);if((a.B&8)!=0)for(b=0;b<a.D.d;b++)rh(a.D,b)!=0&&Tl(a,Kg(a.G,th(a.D,b))-a.N/2,Lg(a.G,uh(a.D,b))-a.N/2,a.N);for(e=0;e<a.D.e;e++){if(Jh(a.D,e)!=0){c=Ah(a.D,0,e);d=Ah(a.D,1,e);Tl(a,(Kg(a.G,th(a.D,c))+Kg(a.G,th(a.D,d))-a.N)/2,(Lg(a.G,uh(a.D,c))+Lg(a.G,uh(a.D,d))-a.N)/2,a.N)}}}}
	function KA(a,b,c,d){var e,f,g;if(!b){return c}else{e=rA(c.c,b.c);if(e==0){d.d=dz(b,c.d);d.b=true;return b}f=e<0?0:1;b.a[f]=KA(a,b.a[f],c,d);if(LA(b.a[f])){if(LA(b.a[1-f])){b.b=true;b.a[0].b=false;b.a[1].b=false}else{LA(b.a[f].a[f])?(b=NA(b,1-f)):LA(b.a[f].a[1-f])&&(b=(g=1-(1-f),b.a[g]=NA(b.a[g],g),NA(b,1-f)))}}}return b}
	function kd(a){var b,c,d,e,f;e=Kg(a.G,th(a.D,0));c=Kg(a.G,th(a.D,0));f=Lg(a.G,uh(a.D,0));d=Lg(a.G,uh(a.D,0));for(b=1;b<a.D.p;b++){Kg(a.G,th(a.D,b))<e&&(e=Kg(a.G,th(a.D,b)));Kg(a.G,th(a.D,b))>c&&(c=Kg(a.G,th(a.D,b)));Lg(a.G,uh(a.D,b))<f&&(f=Lg(a.G,uh(a.D,b)));Lg(a.G,uh(a.D,b))>d&&(d=Lg(a.G,uh(a.D,b)))}a.t=new rv(e,f,c-e,d-f)}
	function Aw(){Aw=rt;zw=mq(iq(Cq,1),bC,0,7,[1.3407807929942597E154,1.157920892373162E77,3.4028236692093846E38,1.8446744073709552E19,4294967296,aC,256,16,4,2]);yw=mq(iq(Cq,1),bC,0,7,[7.458340731200207E-155,8.636168555094445E-78,2.9387358770557188E-39,5.421010862427522E-20,2.3283064365386963E-10,QC,0.00390625,0.0625,0.25,0.5])}
	function hu(a){var b,c,d,e,f;if(a.l==0&&a.m==0&&a.h==0){return '0'}if(a.h==_B&&a.m==0&&a.l==0){return '-9223372036854775808'}if(a.h>>19!=0){return '-'+hu(_t(a))}c=a;d='';while(!(c.l==0&&c.m==0&&c.h==0)){e=Wt(1000000000);c=Et(c,e,true);b=''+gu(At);if(!(c.l==0&&c.m==0&&c.h==0)){f=9-b.length;for(;f>0;f--){b='0'+b}}d=b+d}return d}
	function xm(a,b){var c,d,e,f;Ui(a,b);if((b&~a.R)==0)return;a.a&&(b|=128);for(c=0;c<a.p;c++)a.t[c]&=-134447112;for(d=0;d<a.e;d++)a.H[d]&=-64;e=0;f=0;if((b&16)!=0){e=16;f=1}else if((b&32)!=0){e=32;f=3}else if((b&64)!=0){e=64;f=5}if((b&128)!=0){e|=128;f|=32}a.b=new Te(a,f);Pe(a.b);Qe(a.b);Oe(a.b);Gm(a)&&(a.b=new Te(a,f));a.R|=12|e}
	function xg(a,b){var c,d,e,f;e=9999;for(c=0;c<a.a.length;c++){f=rh(a.p,a.a[c])!=0?0.6:wh(a.p,a.a[c])!=6?0.25:0;d=0;switch(b){case 0:d=a.i-0.5*(a.i+a.o+a.c[c]-a.d[c]);break;case 1:d=a.i-0.5*(a.i-a.j+a.c[c]+a.d[c]);break;case 2:d=0.5*(a.n+a.j+a.c[c]-a.d[c])-a.n;break;case 3:d=0.5*(a.n-a.o+a.c[c]+a.d[c])-a.n;}e>d-f&&(e=d-f)}return e}
	function Ik(a){var b,c;if(a.indexOf('[')>=0){b=a.indexOf(' NOT[');c=a.indexOf(']',b);if(b>=0&&c>0){return -(c+1)}else{b=a.indexOf(' [');c=a.indexOf(']',b);if(b>=0&&c>0){return c+1}}b=a.indexOf(" 'NOT[");c=a.indexOf("]'",b);if(b>=0&&c>0){return -(c+2)}else{b=a.indexOf(" '[");c=a.indexOf("]'",b);if(b>=0&&c>0){return c+2}}ny()}return 0}
	function ul(a,b){var c,d,e,f,g,h,i,j;g=false;if($i(a.c,b)==0){for(f=1;f<fj(a.c,b);f++){for(h=0;h<f;h++){d=ej(a.c,b,f);e=ej(a.c,b,h);a.p[d]>a.p[e]^d>e&&(g=!g)}}}else{for(f=0;f<fj(a.c,b);f++){c=ej(a.c,b,f);j=0;i=jq(Eq,uB,0,3,7,1);for(h=0;h<fj(a.c,c);h++){i[j]=ej(a.c,c,h);i[j]!=b&&++j}j==2&&a.p[i[0]]>a.p[i[1]]^i[0]>i[1]&&(g=!g)}}return g}
	function Zg(a,b,c,d){if((c==1||c==151||c==152)&&pj(a,b)>1)return false;a.A[b]&=-2;a.u!=null&&(a.u[b]=null);a.s!=null&&(a.s[b]=null);if(c==a.F[b]&&d==a.w[b]&&-1==((a.t[b]&kC)>>>28)-1&&0==(a.t[b]&48))return false;if(c==151||c==152){d=c-149;c=1}a.t[b]&=960;a.F[b]=c;a.w[b]=d;a.r[b]=0;a.A[b]=0;fi(a,b,-1);ui(a,b,0);bi(a,a.v[b]);a.R=0;return true}
	function Pd(a){var b,c,d,e,f,g,h,i,j;d=jq(Eq,uB,0,16,7,1);for(b=0;b<a.L.d;b++){for(f=0;f<fj(a.L,b);f++){j=2*a.d[ej(a.L,b,f)];c=gj(a.L,b,f);Hh(a.L,c)==2&&(Aj(a.L,c)||++j);for(g=0;g<f;g++)if(j<d[g])break;for(h=f;h>g;h--)d[h]=d[h-1];d[g]=j}i=qx(6,fj(a.L,b));df(a.c[b],b);bf(a.c[b],16,a.d[b]);bf(a.c[b],(6-i)*17,0);for(e=0;e<i;e++)bf(a.c[b],17,d[e])}}
	function _c(a,b,c,d){var e,f,g,h;h=new od;if(b.a==b.b&&b.c==b.d)return;h.a=b.a;h.c=b.c;h.b=b.b;h.d=b.d;g=Yc(h);for(e=0;e<a.O.a.length;e++){f=Hz(a.O,e);if(f.c>g.c+g.b||f.d>g.d+g.a||g.c>f.c+f.b||g.d>f.d+f.a)continue;if(ad(a,h.a,h.c,e)){if(ad(a,h.b,h.d,e))return;ed(a,h,0,e);_c(a,h,c,d);return}if(ad(a,h.b,h.d,e)){ed(a,h,1,e);_c(a,h,c,d);return}}Ac(a,h,c,d)}
	function hf(a,b,c){var d,e,f,g,h,i,j,k,l;if(b==null)return;h=0;for(e=0;e<a.i.d;e++)b[e]&&++h;l=jq(Eq,uB,0,h,7,1);h=0;for(d=0;d<a.i.d;d++)b[d]&&(l[h++]=d);j=false;for(g=new Gy(c);g.a<g.b.Mb();){f=(Hp(g.a<g.b.Mb()),g.b.Pb(g.a++));if(f.length==l.length){i=false;for(k=0;k<f.length;k++){if(f[k]!=l[k]){i=true;break}}if(!i){j=true;break}}}j||(c.a[c.a.length]=l,true)}
	function ie(b,c){var d,e,f,g,h,i;if((b.n[c]==1||b.n[c]==2)&&!Hj(b.L,c)){h=false;try{for(g=0;g<2;g++){d=Ah(b.L,g,c);if(fj(b.L,d)==3){e=jq(Eq,uB,0,2,7,1);f=0;for(i=0;i<fj(b.L,d);i++)gj(b.L,d,i)!=c&&(e[f++]=ej(b.L,d,i));b.d[e[0]]>b.d[e[1]]^ke(b,d,e[0],e[1])&&(h=!h)}}}catch(a){a=nt(a);if(sq(a,10)){b.g[c]=3;return}else throw mt(a)}b.n[c]==1^h?(b.g[c]=1):(b.g[c]=2)}}
	function Nm(a){var b,c,d,e;if(a.length==0||a.charCodeAt(0)!=62)return null;d=1;e=0;b=0;while(d<a.length){if(a.charCodeAt(d)==60){if(e!=0)return null;e=d}else if(a.charCodeAt(d)==62){if(b!=0)return null;b=d}++d}if(e!=0&&e<b)return a.substr(e+1,b-(e+1));d=a.indexOf('DT',1);if(d==-1)return null;c=d+2;while(Xv(a.charCodeAt(c)))++c;return c==d+2?null:a.substr(d,c-d)}
	function xc(a,b,c,d){var e,f,g,h,i;h=(b.b-b.a)/10;i=(b.d-b.c)/10;e=new od;if(Uh(a.D,dj(a.D,c,d))){f=-3;g=-3}else{f=a.o[c];g=a.o[d]}hd(a,f);e.a=b.a;e.c=b.c;e.b=b.a+h*2;e.d=b.c+i*2;Ql(a,e);e.a=b.a+h*4;e.c=b.c+i*4;e.b=b.a+h*5;e.d=b.c+i*5;Ql(a,e);hd(a,g);e.a=b.a+h*5;e.c=b.c+i*5;e.b=b.a+h*6;e.d=b.c+i*6;Ql(a,e);e.a=b.a+h*8;e.c=b.c+i*8;e.b=b.b;e.d=b.d;Ql(a,e);hd(a,a.A)}
	function ym(a){var b;xm(a,15);b=a.K&gC;switch(a.K&hC){case aC:return null;case fC:return b==1?'meso':''+b+' meso diastereomers';case 0:return 'unknown chirality';case 196608:return 'racemate';case WB:return 'this enantiomer';case 327680:return 'this or other enantiomer';case OB:return 'two epimers';default:return b==1?'one stereo isomer':''+b+' stereo isomers';}}
	function xw(a){var b,c,d,e,f;if(a==null){throw new xx('null')}d=a.length;e=d>0&&(a.charCodeAt(0)==45||a.charCodeAt(0)==43)?1:0;for(b=e;b<d;b++){if(Wv(a.charCodeAt(b))==-1){throw new xx('For input string: "'+a+'"')}}f=parseInt(a,10);c=f<-2147483648;if(isNaN(f)){throw new xx('For input string: "'+a+'"')}else if(c||f>tB){throw new xx('For input string: "'+a+'"')}return f}
	function ig(a){var b,c,d,e,f,g,h;while(true){f=null;for(b=0;b<a.b;b++){h=0;for(e=0;e<a.e[b];e++)a.c[gj(a.i,b,e)]||++h;if(h==1){g=ag(a,b);(!f||g.a.length>f.a.length)&&(f=g)}}if(!f)break;c=new Fg(a,a.i,f.a.length);for(d=0;d<f.a.length;d++){a.a[f.a[d]]=true;d<f.a.length-1&&(a.c[f.b[d]]=true);c.a[d]=f.a[d];c.c[d]=jx(ZB)*d;c.d[d]=(d&1)==1?0:0.5;c.q[d]=128+f.a.length}Gz(a.f,c)}}
	function td(a){var b,c,d,e,f,g,h,i;for(c=0;c<a.d.e;c++){if(a.c[c]){for(e=0;e<2;e++){h=Ah(a.d,e,c);b=false;for(g=0;g<fj(a.d,h);g++){if(c!=gj(a.d,h,g)&&a.c[gj(a.d,h,g)]){b=true;break}}if(!b){i=c;d=Ah(a.d,1-e,c);while(i!=-1){a.c[i]=false;--a.b;Gi(a.d,i,64);i=-1;h=d;for(f=0;f<fj(a.d,h);f++){if(a.c[gj(a.d,h,f)]){if(i==-1){i=gj(a.d,h,f);d=ej(a.d,h,f)}else{i=-1;break}}}}break}}}}}
	function Rg(a,b,c,d){var e,f,g,h;this.e=a;this.g=c;this.a=d;g=-1;for(h=0;h<Yi(this.e,this.a);h++){e=ej(this.e,this.a,h);f=gj(this.e,this.a,h);if(e==this.g){Kh(this.e,f)==26&&(this.j=-1);continue}if(ai(this.e,f,this.a)){this.i&&(a.t[d]|=fC);this.i=true}if(g==b[e]){this.d=e;this.f=true;this.c=Fj(this.e,f);continue}else if(g<b[e]){g=b[e];this.d=this.b;this.b=e}else{this.d=e}}}
	function wf(a,b,c){var d,e,f,g,h,i,j,k;f=a.g[b];e=1;for(i=0;i<f.length;i++){d=f[i];if(a.f[d]&&a.k[d]==2){e=2;break}}g=jq(Eq,cC,5,32,0,2);for(j=0;j<f.length;j++){d=f[j];a.f[d]&&a.k[d]==e&&(g[a.j[d]]=zf(g[a.j[d]],(c[d]<<16)+d))}for(k=0;k<32;k++)g[k]!=null&&kA(g[k]);mA(g,new Pf);if(Of(g[0],g[1])==0)return false;for(h=0;h<g[0].length;h++){d=g[0][h]&gC;a.k[d]=0;a.j[d]=-1}return true}
	function qj(a,b,c,d,e,f){var g,h,i,j,k,l,m,n,o;if(c==d){b[0]=c;return 0}xm(a,1);j=jq(Eq,uB,0,a.d,7,1);i=jq(Eq,uB,0,a.d,7,1);o=jq(Eq,uB,0,a.d,7,1);i[0]=c;j[c]=1;h=0;k=0;while(h<=k&&j[i[h]]<=e){n=i[h];for(l=0;l<a.g[n];l++){if(!f[a.i[n][l]]){g=a.f[n][l];if(g==d){m=j[n];b[m]=g;b[--m]=n;while(m>0){b[m-1]=o[b[m]];--m}return j[n]}if(j[g]==0){i[++k]=g;j[g]=j[n]+1;o[g]=n}}}++h}return -1}
	function gg(a,b,c,d){var e,f,g,h,i,j,k,l,m;e=jq(Eq,uB,0,d,7,1);f=0;for(g=0;g<b.a.length;g++)for(h=0;h<c.a.length;h++)b.a[g]==c.a[h]&&(e[f++]=b.a[g]);d==1?Gz(a.f,(i=yg(b,e[0]),j=yg(c,e[0]),Dg(c,b.c[i]-c.c[j],b.d[i]-c.d[j]),k=pg(a,b,e[0]),l=pg(a,c,e[0]),m=0,$f(a,b,e[0])==1&&$f(a,c,e[0])==1&&(m=YB),Cg(c,c.c[j],c.d[j],k-l+m+CB),bg(a,b,c,1))):Gz(a.f,_f(a,b,c,e,d));Jz(a.f,b);Jz(a.f,c)}
	function ed(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o;if(c==0){l=b.a;n=b.c;m=b.b;o=b.d}else{l=b.b;n=b.d;m=b.a;o=b.c}k=Hz(a.O,d);i=m>l?k.c+k.b:k.c;j=o>n?k.d+k.a:k.d;e=m-l;f=o-n;if(hx(e)>hx(f)){if(n==o){g=i;h=n}else{g=l+e*(j-n)/f;if(m>l==i>g){h=j}else{g=i;h=n+f*(i-l)/e}}}else{if(l==m){g=l;h=j}else{h=n+f*(i-l)/e;if(o>n==j>h){g=i}else{g=l+e*(j-n)/f;h=j}}}if(c==0){b.a=g;b.c=h}else{b.b=g;b.d=h}}
	function $d(a){var b,c,d,e,f,g,h,i,j,k;f=0;for(c=0;c<a.L.d;c++)a.U[c]!=0&&++f;if(f==0)return;k=jq(Eq,uB,0,f,7,1);f=0;for(d=0;d<a.L.d;d++){if(a.U[d]!=0){k[f]=a.U[d]<<29|a.T[d]<<24|a.d[d]<<12|d;++f}}kA(k);g=0;j=0;h=k[0]&dC;while(true){++j;if(j==k.length||h!=(k[j]&dC)){e=jq(Eq,uB,0,j-g,7,1);for(i=g;i<j;i++){b=k[i]&4095;e[i-g]=b;a.Y[b]=true}Gz(a.Z,e);if(j==k.length)break;h=k[j]&dC;g=j}}}
	function ah(a,b,c,d){var e,f,g,h,i;f=b.q;f>=b.O&&Li(b,b.O*2);h=(a.H[c]&nC)>>10;g=-1;h==1&&(g=qx(32,(a.H[c]&nC)>>10!=1&&(a.H[c]&nC)>>10!=2?-1:(a.H[c]&oC)>>12));h==2&&(g=qx(32,(a.H[c]&nC)>>10!=1&&(a.H[c]&nC)>>10!=2?-1:(a.H[c]&oC)>>12));for(i=0;i<2;i++)b.G[i][f]=d[a.G[i][c]];e=a.J[c];b.J[f]=e;b.H[f]=a.H[c];b.I[f]=b.L?a.I[c]:0;if(g!=-1){b.H[f]&=-126977;b.H[f]|=g<<12}++b.q;b.R=0;return f}
	function Ht(a,b,c,d,e,f){var g,h,i,j,k,l,m;j=Kt(b)-Kt(a);g=cu(b,j);i=Dt(0,0,0);while(j>=0){h=Qt(a,g);if(h){j<22?(i.l|=1<<j,undefined):j<44?(i.m|=1<<j-22,undefined):(i.h|=1<<j-44,undefined);if(a.l==0&&a.m==0&&a.h==0){break}}k=g.m;l=g.h;m=g.l;Mt(g,l>>>1);g.m=k>>>1|(l&1)<<21;g.l=m>>>1|(k&1)<<21;--j}c&&Jt(i);if(f){if(d){At=_t(a);e&&(At=eu(At,(nu(),lu)))}else{At=Dt(a.l,a.m,a.h)}}return i}
	function md(a,b){var c,d,e,f;if(a.D.p==0)return null;e=(a.k=zq(b.b),a.f=zq(b.a),ld(a,b));xm(a.D,(a.B&256)!=0?31:(a.B&512)!=0?47:(a.B&IB)!=0?79:15);Kc(a);a.J.a=jq(xs,GB,1,0,3,1);a.O.a=jq(xs,GB,1,0,3,1);vc(a);Zl(a,a.L);for(d=0;d<a.D.p;d++)Rc(a,d,false);c=a.G.c*xh(a.D);Bc(a,c);gd(a,b,c,aC);if(av(b,a.t))return e;f=new Ng(a.t,b,c);Gg(f,a.G);Ig(f,a.t);Hg(f,a.u);if(!e)return f;Gg(f,e);return e}
	function Bj(a,b){var c,d,e,f,g,h;if(a.J[b]!=1||(a.H[b]&256)!=0||(a.H[b]&64)!=0&&(!!a.n&&b<a.e?Xk(a.n,b):0)<7)return false;c=a.G[0][b];if((a.t[c]&HB)==0||(!!a.n&&c<a.d?Wk(a.n,c):0)<6)return false;d=a.G[1][b];if((a.t[d]&HB)==0||(!!a.n&&d<a.d?Wk(a.n,d):0)<6)return false;h=0;for(g=0;g<a.g[c];g++){e=a.f[c][g];e!=d&&a.g[e]>2&&++h}for(f=0;f<a.g[d];f++){e=a.f[d][f];e!=c&&a.g[e]>2&&++h}return h>2}
	function dm(a,b){var c,d,e,f;f=false;a.b=b;xm(a.b,7);c=a.b.d;d=a.b.e;a.j=jq(jt,yB,0,d,8,1);for(e=0;e<d;++e)a.j[e]=false;a.g=jq(jt,yB,0,c,8,1);a.c=jq(Eq,uB,0,c,7,1);for(e=0;e<c;++e){a.g[e]=false;a.c[e]=-1}a.e=jq(Cs,GB,2,3*c,4,1);a.i=0;a.d=0;a.a=0;while(!f){for(e=0;e<c;++e){if(!a.g[e]){a.a>0&&(a.e[a.i++]='.');fm(a,e,-1);++a.a;break}}e==c&&(f=true)}a.f='';for(e=0;e<a.i;++e)a.f+=a.e[e];return a.f}
	function ij(a,b,c,d,e){var f,g,h;if(a.k[b]!=0||(a.t[b]&HB)!=0||a.g[b]<3||a.c[b]>4)return false;h=jq(jt,yB,0,4,8,1);for(g=0;g<a.c[b];g++){f=3.9269909262657166-d[g];if((tC-f%EB<=0?0-(tC-f%EB):tC-f%EB)>0.0872664675116539)return false;e[g]=3&zq(f/EB);if(h[e[g]])return false;h[e[g]]=true;if((e[g]&1)==0){if(a.J[a.i[b][c[g]]]!=1)return false}else{if(!ai(a,a.i[b][c[g]],b))return false}}return h[0]&&h[2]}
	function Rk(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p;m=b.length;j=a.g.N;k=0;for(e=0;e<m;e++){if(j>b[e]){j=b[e];k=e}}p=jq(Eq,uB,0,m,7,1);i=k>0?k-1:m-1;l=k<m-1?k+1:0;g=b[i]<b[l];for(f=0;f<m;f++){p[f]=b[k];g?--k<0&&(k=m-1):++k==m&&(k=0)}for(d=0;d<a.i.a.length;d++){o=Hz(a.i,d);if(o.length!=m)continue;c=true;for(h=0;h<m;h++){if(o[h]!=p[h]){c=false;break}}if(c)return}Gz(a.i,p);n=$k(a,p);Gz(a.j,n);dl(a,p,n)}
	function uk(a,b,c,d,e,f){var g,h,i,j;j=1;h=false;switch(e){case 1:j=17;break;case 3:j=26;break;case 4:j=17;h=true;break;case 6:j=9;break;default:switch(d){case 1:j=1;break;case 2:j=2;break;case 3:j=4;break;case 4:j=64;}}g=Yg(a.c,b,c,j);i=0;h&&mi(a.c,b,1,-1);if(d>4){switch(d){case 5:i|=3;break;case 6:i|=9;break;case 7:i|=10;break;case 8:i|=15;}}f==1&&(i|=32);f==2&&(i|=16);i!=0&&Fi(a.c,g,i);return g}
	function oe(a,b,c,d,e,f,g){var h,i,j,k,l,m,n,o,p,q,r;for(l=g;l>1;l--){p=f[l]-f[l-1];r=jq(Kq,GB,68,p,0,1);h=f[l];for(o=0;o<p;o++){q=f[l-1]+o;m=h;while(m<f[l+1]&&d[m]==q)++m;r[o]=new Xe;r[o].c=q;r[o].d=c[q];r[o].b=b[q]?0:Zi(a.L,e[q]);r[o].a=jq(Eq,uB,0,m-h,7,1);for(k=h;k<m;k++)r[o].a[k-h]=c[k];kA(r[o].a);h=m}i=new Ve;iA(r,0,r.length,i);j=1;for(n=0;n<p;n++){c[r[n].c]=j;n!=p-1&&Ue(r[n],r[n+1])!=0&&++j}}}
	function hd(a,b){if(b==a.w)return;a.w=b;switch(b){case -4:Xl(a,a.F);break;case -2:Xl(a,a.r);break;case -3:Xl(a,a.s);break;case 64:Xl(a,(Ku(),Du));break;case 128:Xl(a,(Ku(),Iu));break;case 256:Xl(a,(Ku(),Gu));break;case 192:Xl(a,(Ku(),Fu));break;case 320:Xl(a,(Ku(),Hu));break;case 384:Xl(a,new Nu(0,160,0));break;case 448:Xl(a,new Nu(160,0,0));break;case 1:Xl(a,(Ku(),Eu));break;default:Xl(a,(Ku(),Cu));}}
	function Gm(a){var b,c,d,e,f,g;g=false;for(c=0;c<a.d;c++)((a.t[c]&qC)==0||(a.t[c]&3)==3)&&(a.t[c]&=sC);if(a.M){if((a.K&hC)!=fC){f=jq(jt,yB,0,a.d,8,1);for(d=0;d<a.d;d++)(a.t[d]&qC)!=0&&(a.t[d]&3)!=3&&(a.t[d]&lC)>>19==1&&(f[d]=true);for(e=0;e<a.d;e++){if((a.t[e]&qC)!=0&&(a.t[e]&3)!=3){mi(a,e,1,0);g=true}}for(b=0;b<a.d;b++){if(f[b]){si(a,b,1,false);mi(a,b,1,-1);g=true}}}a.M=false}ci(a,1);ci(a,2);return g}
	function cg(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o;h=jq(Eq,uB,0,a.b,7,1);i=jq(Eq,uB,0,a.b,7,1);j=jq(Eq,uB,0,a.b,7,1);k=jq(Eq,uB,0,a.b,7,1);h[0]=c;j[c]=1;k[0]=-1;g=0;l=0;while(g<=l){for(m=0;m<a.e[h[g]];m++){e=ej(a.i,h[g],m);o=gj(a.i,h[g],m);if(e==b){f=j[h[g]];d=jq(Eq,uB,0,f,7,1);d[0]=o;for(n=1;n<f;n++){d[n]=i[g];g=k[g]}return d}if(j[e]==0){h[++l]=e;i[l]=o;j[e]=j[h[g]]+1;k[l]=g}}if(g==l)return null;++g}return null}
	function zd(a,b){var c,d,e,f,g,h,i,j;c=false;if(a.F[b]!=8)return false;if(a.g[b]!=1)return false;g=a.f[b][0];if(a.F[g]==6){h=a.g[g];for(d=0;d<h;d++){e=a.f[g][d];if(e==b){continue}if(a.F[e]!=8){continue}f=dj(a,g,e);if(a.J[f]==2){c=true;break}}}else if(a.F[g]==8){i=a.g[g];j=0;for(d=0;d<i;d++){e=a.f[g][d];if(e==b){continue}if(a.F[e]!=8){continue}f=dj(a,g,e);a.J[f]==2&&++j}j==2&&(c=true)}else Ad(a,b)&&(c=true);return c}
	function Vk(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o;e=Ah(a.g,0,b);f=Ah(a.g,1,b);i=jq(Eq,uB,0,a.g.d,7,1);j=jq(Eq,uB,0,a.g.d,7,1);k=jq(Eq,uB,0,a.g.d,7,1);i[0]=e;i[1]=f;j[e]=1;j[f]=2;k[e]=-1;k[f]=e;h=1;l=1;while(h<=l){for(m=0;m<fj(a.g,i[h]);m++){g=ej(a.g,i[h],m);if(h>1&&g==e){o=jq(Eq,uB,0,j[i[h]],7,1);d=i[h];for(n=0;n<o.length;n++){o[n]=d;d=k[d]}return o}if(j[g]==0&&!c[g]){i[++l]=g;j[g]=j[i[h]]+1;k[g]=i[h]}}++h}return null}
	function Sk(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o;e=Ah(a.g,0,b);f=Ah(a.g,1,b);i=jq(Eq,uB,0,a.g.d,7,1);j=jq(Eq,uB,0,a.g.d,7,1);k=jq(Eq,uB,0,a.g.d,7,1);i[0]=e;i[1]=f;j[e]=1;j[f]=2;k[e]=-1;k[f]=e;h=1;l=1;while(h<=l){if(j[i[h]]>7)return;for(m=0;m<fj(a.g,i[h]);m++){g=ej(a.g,i[h],m);if(h>1&&g==e){o=jq(Eq,uB,0,j[i[h]],7,1);d=i[h];for(n=0;n<o.length;n++){o[n]=d;d=k[d]}Rk(a,o);continue}if(j[g]==0&&!c[g]){i[++l]=g;j[g]=j[i[h]]+1;k[g]=i[h]}}++h}}
	function de(a){var b,c,d,e,f,g;a.H=true;f=Wd(a,false);while(a.N<a.L.d&&f){for(b=0;b<a.L.d;b++){df(a.c[b],b);bf(a.c[b],16,a.d[b]);g=a.W[b]<<7;if((a.W[b]==1||a.W[b]==2)&&a.U[b]!=0){g|=a.U[b]<<5;g|=a.T[b]}bf(a.c[b],18,g<<9)}for(c=0;c<a.L.e;c++){d=a.n[c]<<7;if((a.n[c]==1||a.n[c]==2)&&Kh(a.L,c)==1&&a.k[c]!=0){d|=a.k[c]<<5;d|=a.j[c]}af(a.c[Ah(a.L,0,c)],d);af(a.c[Ah(a.L,1,c)],d)}e=ae(a);if(a.N==e)break;a.N=e;f=Wd(a,false)}}
	function aj(a,b){var c,d,e,f,g,h,i,j,k,l,m,n;xm(a,3);e=jq(jt,yB,0,a.e,8,1);k=jq(jt,yB,0,a.e,8,1);n=jq(Eq,uB,0,a.d,7,1);f=0;for(g=1;g<a.g[b];g++){c=a.i[b][g];if((a.H[c]&64)!=0){for(i=0;i<g;i++){d=a.i[b][i];if((a.H[d]&64)!=0){k[c]=true;k[d]=true;m=qj(a,n,a.f[b][g],a.f[b][i],5,k);k[c]=false;k[d]=false;if(m!=-1){h=false;l=jq(Eq,uB,0,m,7,1);rj(a,n,l,m);for(j=0;j<m;j++){if(!e[l[j]]){e[l[j]]=true;h=true}}h&&++f}}}}}return f}
	function rf(a,b,c,d,e){var f,g,h,i,j,k;i=null;f=null;for(k=0;k<a.g[b].length;k++){g=a.g[b][k];a.f[g]&&(a.o[g]==1||a.o[g]==2)&&(a.k[g]==0?(f=zf(f,(e[g]<<16)+g)):a.k[g]==d&&a.j[g]==c&&(i=zf(i,(e[g]<<16)+g)))}h=Of(i,f);if(h==0)return false;if(h<0){for(j=0;j<a.g[b].length;j++){g=a.g[b][j];if(a.f[g]&&(a.o[g]==1||a.o[g]==2)){if(a.k[g]==0){a.k[g]=yq(d);a.j[g]=yq(c)}else if(a.k[g]==d&&a.j[g]==c){a.k[g]=0;a.j[g]=-1}}}}return true}
	function kg(a,b,c){var d,e,f,g,h,i,j,k,l,m;for(f=0;f<a.d;f++){d=Ah(a.i,0,f);e=Ah(a.i,1,f);if(Fj(a.i,f)||Hh(a.i,f)!=1||a.e[d]==1||a.e[e]==1)continue;if((a.g&2)!=0&&Yh(a.i,d)&&Yh(a.i,e))continue;l=false;for(j=0;j<2;j++){g=Ah(a.i,j,f);if(a.e[g]>2){m=true;i=-1;for(k=0;k<a.e[g];k++){h=ej(a.i,g,k);h!=Ah(a.i,1-j,f)&&(i==-1?(i=c[h]):i!=c[h]&&(m=false))}if(m){l=true;break}}}l||((a.g&4)!=0&&Yh(a.i,d)&&Yh(a.i,e)?(b[f]=1):(b[f]=2))}}
	function Mf(a,b){var c,d,e,f,g,h,i,j,k,l;k=tB;i=-1;l=-1;j=-1;for(d=0;d<a.j.i.d;d++){if(nf(a.j,d)&&a.j.k[d]!=0){for(h=0;h<b.length;h++){e=b[h]<a.a?b[h]:b[h]<a.b?b[h]-a.a:-1;f=b[h]<a.a?1:b[h]<a.b?2:0;if(a.j.k[d]==f&&a.j.j[d]==e){if(k>a.j.a[d]+(f==1?aC:0)){k=a.j.a[d]+(f==1?aC:0);i=e;l=f;j=b[h]}}}}}for(c=0;c<a.j.i.d;c++){if(nf(a.j,c)&&a.j.k[c]==l&&a.j.j[c]==i){a.j.k[c]=0;a.j.j[c]=-1}}for(g=0;g<a.j.g.length;g++)a.e[j][g]=false}
	function ag(a,b){var c,d,e,f,g,h,i,j,k,l,m,n;e=jq(Eq,uB,0,a.b,7,1);f=jq(Eq,uB,0,a.b,7,1);g=jq(Eq,uB,0,a.b,7,1);h=jq(Eq,uB,0,a.b,7,1);e[0]=b;g[b]=1;h[0]=-1;d=0;i=0;while(d<=i){if(d==0||!a.a[e[d]]){for(j=0;j<a.e[e[d]];j++){c=ej(a.i,e[d],j);m=gj(a.i,e[d],j);if(g[c]==0&&!a.c[m]){e[++i]=c;f[i]=m;g[c]=g[e[d]]+1;h[i]=d}}}if(d==i){n=new ck(g[e[d]]);k=d;for(l=0;l<n.a.length;l++){n.a[l]=e[k];n.b[l]=f[k];k=h[k]}return n}++d}return null}
	function Ec(a){var b,c,d,e,f,g,h,i,j;d=(Ku(),Bu);e=!d?1:(299*(d.b>>16&255)+587*(d.b>>8&255)+114*(d.b&255))/255000;h=new Mu(a);i=(299*(h.b>>16&255)+587*(h.b>>8&255)+114*(h.b&255))/255000;j=wB*(0.5+hx(0.5-e));b=e-j;c=e+j;f=b>0&&(c>=1||i<e);g=0.00392156862745098*(f?1-j*((1/(0.5+1.5*((e-i)/e>0?(e-i)/e:0))-0.5)/1.5):1+j*((1/(0.5+1.5*((i-e)/(1-e)>0?(i-e)/(1-e):0))-0.5)/1.5));return new Lu(g*(h.b>>16&255),g*(h.b>>8&255),g*(h.b&255))}
	function _d(a){var b,c,d,e,f,g,h,i,j,k,l;e=false;for(f=0;f<a.Z.a.length;f++){d=Hz(a.Z,f);b=true;l=-1;g=false;for(j=0;j<d.length;j++){c=d[j];if(a.W[c]==0){b=false;break}if(a.W[c]!=3){h=true;for(k=0;k<d.length;k++){if(k!=j&&a.d[c]==a.d[d[k]]){h=false;break}}if(h&&l<a.d[c]){l=a.d[c];g=a.W[c]==1}}}if(b&&l!=-1){for(i=0;i<d.length;i++){c=d[i];g&&(a.W[c]==1?(a.W[c]=2):a.W[c]==2&&(a.W[c]=1));a.Y[c]=false}Jz(a.Z,d);e=true;--f}}return e}
	function yh(a,b){var c,d,e,f,g,h,i,j,k,l;for(g=0;g<b;g++)(a.I[g]&UB)!=0&&--b;if(b==0){if(a.p<2)return a.o;l=0;h=0;for(c=1;c<a.p;c++){for(d=0;d<c;d++){i=a.B[c]-a.B[d];j=a.C[c]-a.C[d];k=a.D[c]-a.D[d];l+=Math.sqrt(i*i+j*j+k*k);++h}}return px(a.o,tx(a.p)*l/(2*h))}e=0;for(f=0;f<b;f++){if((a.I[f]&UB)==0){i=a.B[a.G[1][f]]-a.B[a.G[0][f]];j=a.C[a.G[1][f]]-a.C[a.G[0][f]];k=a.D[a.G[1][f]]-a.D[a.G[0][f]];e+=Math.sqrt(i*i+j*j+k*k)}}return e/b}
	function Kj(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q;c=jq(Dq,xB,0,a.c[b],7,1);for(k=0;k<a.c[b];k++)c[k]=zh(a,b,a.f[b][k]);for(l=1;l<a.c[b];l++){for(m=0;m<l;m++){if(q=hx(Qi(c[l],c[m])),q<0.08||q>3.061592653589793){d=0;e=0;for(n=0;n<a.c[b];n++){if(n!=l&&n!=m){d+=hx(Co(c[l],c[n]));e+=hx(Co(c[m],c[n]))}}g=d<e?a.i[b][l]:a.i[b][m];if(Hh(a,g)==1)return g}}}o=-1;f=0;for(j=0;j<a.c[b];j++){h=a.f[b][j];i=a.i[b][j];p=xj(a,i,h);if(f<p){f=p;o=i}}return o}
	function Xi(a){var b,c,d,e,f,g,h,i;a.n=new fl(a,7);c=jq(Eq,uB,0,a.d,7,1);for(d=0;d<a.e;d++){if(Xk(a.n,d)!=0){a.H[d]|=64;++c[a.G[0][d]];++c[a.G[1][d]]}}for(b=0;b<a.d;b++){c[b]==2?(a.t[b]|=IB):c[b]==3?(a.t[b]|=RB):c[b]>3&&(a.t[b]|=nC)}for(i=0;i<a.n.i.a.length;i++){f=Yk(a.n,i);h=Zk(a.n,i);g=f.length;for(e=0;e<g;e++){a.t[f[e]]|=8;a.H[h[e]]|=128;if(_k(a.n,i)){a.t[f[e]]|=HB;a.H[h[e]]|=256}cl(a.n,i)&&(a.H[h[e]]|=512);a.J[h[e]]==26&&(a.J[h[e]]=2)}}}
	function uj(a){var b,c,d,e,f,g,h,i,j;j=0;xm(a,3);for(d=0;d<a.e;d++){if(Hh(a,d)==3&&a.g[a.G[0][d]]>1&&a.g[a.G[1][d]]>1){++j;continue}if(Hh(a,d)!=1||(a.H[d]&64)!=0)continue;h=true;for(g=0;g<2;g++){b=a.G[g][d];if(a.g[b]==1){h=false;break}if(a.k[b]==2&&a.g[b]==2){h=false;break}if(a.F[b]==7&&(a.t[b]&HB)==0){c=a.G[1-g][d];for(i=0;i<a.g[c];i++){e=a.f[c][i];f=a.i[c][i];if(f!=d&&Hh(a,f)>1&&(a.t[e]&HB)==0&&Si(a.F[e])){h=false;break}}}}h&&++j}return j}
	function ql(a,b,c){var d,e,f,g,h,i,j,k,l,m;h=false;for(g=0;g<2;g++){d=Ah(a.c,g,b);k=a.p[d];if(fj(a.c,d)==2){if(fj(a.q,k)==2)continue;e=-1;for(j=0;j<2;j++)gj(a.c,d,j)!=b&&(e=ej(a.c,d,j));m=0;l=jq(Eq,uB,0,2,7,1);for(i=0;i<3;i++)gj(a.q,k,i)!=c&&(l[m++]=ej(a.q,k,i));a.p[e]!=l[0]&&(h=!h)}else if(fj(a.c,d)==3&&fj(a.q,k)==3){e=jq(Eq,uB,0,2,7,1);f=0;for(i=0;i<3;i++)gj(a.c,d,i)!=b&&(e[f++]=ej(a.c,d,i));a.p[e[0]]>a.p[e[1]]^e[0]>e[1]&&(h=!h)}}return h}
	function Au(){var a=navigator.userAgent.toLowerCase();var b=$doc.documentMode;if(function(){return a.indexOf('webkit')!=-1}())return 'safari';if(function(){return a.indexOf('msie')!=-1&&b>=10&&b<11}())return 'ie10';if(function(){return a.indexOf('msie')!=-1&&b>=9&&b<11}())return 'ie9';if(function(){return a.indexOf('msie')!=-1&&b>=8&&b<11}())return 'ie8';if(function(){return a.indexOf('gecko')!=-1||b>=11}())return 'gecko1_8';return 'unknown'}
	function jl(a){var b,c,d,e,f,g,h,i;g=a.c.e+12;a.i=jq(Eq,uB,0,g,7,1);a.k=jq(Eq,uB,0,g,7,1);a.n=jq(Eq,uB,0,g,7,1);a.j=jq(jt,yB,0,g+1,8,1);f=jq(jt,yB,0,a.c.d,8,1);e=0;for(b=0;b<a.c.d;b++){if(!f[b]){a.i[e]=b;a.n[e]=-1;a.k[e]=-1;h=e;while(e<=h){for(i=0;i<fj(a.c,a.i[e]);i++){c=ej(a.c,a.i[e],i);if(c!=a.k[e]&&(!f[c]||c>a.i[e])){d=gj(a.c,a.i[e],i);if(!Th(a.c,d)){a.i[++h]=c;a.k[h]=a.i[e];a.n[h]=d;f[c]?(a.j[h]=true):(f[c]=true)}}}while(a.j[++e]);}}}a.o=e}
	function Ac(a,b,c,d){var e,f,g,h,i,j,k,l;k=(b.c-b.d)/9;l=(b.b-b.a)/9;g=jq(Dq,xB,0,3,7,1);h=jq(Dq,xB,0,3,7,1);i=jq(Dq,xB,0,4,7,1);j=jq(Dq,xB,0,4,7,1);g[0]=b.a;h[0]=b.c;i[2]=b.b+k;j[2]=b.d+l;i[3]=b.b-k;j[3]=b.d-l;g[1]=(g[0]+i[2])/2;h[1]=(h[0]+j[2])/2;g[2]=(g[0]+i[3])/2;h[2]=(h[0]+j[3])/2;i[0]=g[2];j[0]=h[2];i[1]=g[1];j[1]=h[1];if(Uh(a.D,dj(a.D,c,d))){e=-3;f=-3}else{e=a.o[c];f=Fc(a,c);e==gh(a.D,c)&&(e=f)}hd(a,e);Rl(a,g,h,3);hd(a,f);Rl(a,i,j,4);hd(a,a.A)}
	function Ud(a){var b,c,d,e,f,g,h,i,j,k,l,m;if(a.t)return;a.t=new Mz;k=0;l=jq(Eq,uB,0,a.L.d,7,1);g=jq(Eq,uB,0,a.L.d,7,1);i=jq(Eq,uB,0,a.L.e,7,1);for(b=0;b<a.L.d;b++){if(l[b]==0&&(Ej(a.L,b)||$i(a.L,b)==1)){g[0]=b;h=1;j=0;l[b]=++k;c=jq(jt,yB,0,a.L.e,8,1);for(f=0;f<h;f++){for(m=0;m<fj(a.L,g[f]);m++){e=gj(a.L,g[f],m);if(Fj(a.L,e)||Hh(a.L,e)==2||Bj(a.L,e)){d=ej(a.L,g[f],m);if(!c[e]){i[j++]=e;c[e]=true}if(l[d]==0){g[h++]=d;l[d]=k}}}}Gz(a.t,new gf(g,h,i,j))}}}
	function Eg(a,b){var c,d;this.r=a;this.p=b.p;this.a=jq(Eq,uB,0,b.a.length,7,1);this.q=jq(Eq,uB,0,b.a.length,7,1);this.c=jq(Cq,bC,0,b.a.length,7,1);this.d=jq(Cq,bC,0,b.a.length,7,1);for(d=0;d<b.a.length;d++){this.a[d]=b.a[d];this.q[d]=b.q[d];this.c[d]=b.c[d];this.d[d]=b.d[d]}if(b.e!=null){this.e=jq(Eq,uB,0,b.e.length,7,1);for(c=0;c<b.e.length;c++)this.e[c]=b.e[c]}if(b.b!=null){this.b=jq(Eq,uB,0,b.b.length,7,1);for(c=0;c<b.b.length;c++)this.b[c]=b.b[c]}}
	function Qg(a){var b,c,d,e,f,g;if(a.j!=0)return a.j;if(a.i&&wh(a.e,a.a)!=15&&wh(a.e,a.a)!=16){for(g=0;g<Yi(a.e,a.a);g++){f=gj(a.e,a.a,g);if(ai(a.e,f,a.a)){ej(a.e,a.a,g)==a.b?(a.j=Kh(a.e,f)==17?3:1):(a.j=Kh(a.e,f)==17?1:3);return a.j}}}b=zh(a.e,a.a,a.g);d=zh(a.e,a.a,a.b);d<b&&(d+=BB);if(Yi(a.e,a.a)==2){c=d-b;if(c>3.0915926535897933&&c<3.191592653589793){a.j=-1;return a.j}a.j=c<CB?4:2;return a.j}else{e=zh(a.e,a.a,a.d);e<b&&(e+=BB);a.j=e<d?2:4;return a.j}}
	function Wp(a,b){var c,d,e,f,g,h;if(Dw(b)){return 'NaN'}d=b<0||b==0&&1/b<0;d&&(b=-b);c=new jy;if(Cw(b)){gy(c,d?a.q:a.t);c.a+='\u221E';gy(c,d?a.r:a.u);return c.a}b*=a.p;f=eq(c,b);e=c.a.length+f+a.i+3;if(e>0&&e<c.a.length&&Cx(c.a,e)==57){aq(a,c,e-1);f+=c.a.length-e;hy(c,e,c.a.length)}a.e=0;a.d=c.a.length;a.b=a.d+f;g=a.v;h=a.f;a.b>IB&&(g=true);g&&Vp(a,c);_p(a,c);bq(a,c);Xp(a,c,44,h);Up(a,c);Tp(a,c,46);g&&Sp(a,c);iy(c,0,d?a.q:a.t);gy(c,d?a.r:a.u);return c.a}
	function hm(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o;j=jq(Eq,uB,0,a.b.d,7,1);h=jq(Eq,uB,0,a.b.d,7,1);i=jq(Eq,uB,0,a.b.d,7,1);k=jq(Eq,uB,0,a.b.d,7,1);c=Ah(a.b,0,b);d=Ah(a.b,1,b);h[0]=c;h[1]=d;i[0]=-1;i[1]=b;j[c]=1;j[d]=2;k[c]=-1;k[d]=c;g=1;l=1;while(g<=l&&j[h[g]]<15){o=h[g];for(m=0;m<fj(a.b,o);m++){e=ej(a.b,o,m);if(e!=k[o]){f=gj(a.b,o,m);if(e==c){i[0]=f;for(n=0;n<=l;n++)a.a[i[m]]=true;return}if(Yh(a.b,e)&&j[e]==0){++l;h[l]=e;i[l]=f;j[e]=j[o]+1;k[e]=o}}}++g}return}
	function dd(a,b){var c,d,e,f,g,h;if(b.a==b.b&&b.c==b.d){for(e=0;e<a.O.a.length;e++){g=Hz(a.O,e);if(cv(g,b.a,b.c))return false}return true}h=Yc(b);c=false;if(b.a>b.b){Wc(b);c=true}for(d=0;d<a.O.a.length;d++){g=Hz(a.O,d);if(g.c>h.c+h.b||g.d>h.d+h.a||h.c>g.c+g.b||h.d>g.d+g.a)continue;if(ad(a,b.a,b.c,d)){if(ad(a,b.b,b.d,d)){c&&Wc(b);return false}ed(a,b,0,d);f=dd(a,b);c&&Wc(b);return f}if(ad(a,b.b,b.d,d)){ed(a,b,1,d);f=dd(a,b);c&&Wc(b);return f}}c&&Wc(b);return true}
	function oy(a,b,c,d,e){ny();var f,g,h,i,j,k,l,m,n;Kp(a,'src');Kp(c,'dest');m=lc(a);i=lc(c);Ep((m.e&4)!=0,'srcType is not an array');Ep((i.e&4)!=0,'destType is not an array');l=m.c;g=i.c;Ep((l.e&1)!=0?l==g:(g.e&1)==0,"Array types don't match");n=a.length;j=c.length;if(b<0||d<0||e<0||b+e>n||d+e>j){throw new Lw}if(((l.e&1)==0||(l.e&4)!=0)&&m!=i){k=a;f=c;if(xq(a)===xq(c)&&b<d){b+=e;for(h=d+e;h-->d;){f[h]=k[--b]}}else{for(h=d+e;d<h;){f[d++]=k[b++]}}}else e>0&&oq(a,b,c,d,e,true)}
	function Yd(a,b){var c,d,e,f,g,h,i,j,k,l,m;f=kq(Eq,[cC,uB],[5,0],7,[2,32],2);for(g=0;g<2;g++){c=jq(Eq,cC,5,32,0,2);m=0;for(e=0;e<32;e++){if(b[g][e]!=null){k=b[g][e].length;c[e]=jq(Eq,uB,0,k,7,1);for(h=0;h<k;h++)c[e][h]=a.d[b[g][e][h]];kA(c[e]);++m}}for(l=m;l>0;l--){j=0;i=null;for(d=0;d<32;d++){if(c[d]!=null){if(i==null||i.length<c[d].length){i=c[d];j=d}else if(i.length==c[d].length){for(h=i.length-1;h>=0;h--){if(i[h]<c[d][h]){i=c[d];j=d;break}}}}}f[g][j]=l;c[j]=null}}return f}
	function fe(a){var b,c,d,e,f,g;a.H=true;d=pe(a);!!a.J&&sf(a.J,a.d)&&(d=pe(a));Wd(a,false)&&_d(a);g=true;while(a.N<a.L.d&&g){e=Yd(a,d);for(b=0;b<a.L.d;b++){df(a.c[b],b);bf(a.c[b],16,a.d[b]);bf(a.c[b],20,0);!a.V[b]&&a.U[b]!=0&&af(a.c[b],(a.U[b]<<18)+(e[a.U[b]==1?0:1][a.T[b]]<<8));af(a.c[b],a.W[b]<<4)}for(c=0;c<a.L.e;c++){af(a.c[Ah(a.L,0,c)],a.n[c]);af(a.c[Ah(a.L,1,c)],a.n[c])}f=ae(a);if(a.N==f)break;a.N=f;g=false;if(!!a.J&&sf(a.J,a.d)){g=true;d=pe(a)}if(Wd(a,false)){g=true;_d(a)}}}
	function Mc(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o;m=false;e.a=0;e.b=0;d>0?(f=zB):(f=AB);o=zh(a.D,b,c);for(k=0;k<fj(a.D,b);k++){g=gj(a.D,b,k);h=o;Ah(a.D,0,g)==b?(l=Ah(a.D,1,g)):(l=Ah(a.D,0,g));if(l==c)continue;n=zh(a.D,b,l);o<n&&(h+=BB);i=h-n;if(d>0){i<CB&&(m=true);i>zB&&(i=zB);i<DB&&(i=DB);if(i<=f){f=i;j=a.I*Math.tan(i-EB)/2;e.a=-(j*sx(h));e.b=-(j*jx(h))}}else{i>=CB&&(m=true);i<AB&&(i=AB);i>FB&&(i=FB);if(i>=f){f=i;j=a.I*Math.tan(4.712388981-i)/2;e.a=-(j*sx(h));e.b=-(j*jx(h))}}}return m}
	function dg(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o;c=Ah(a.i,0,b);d=Ah(a.i,1,b);g=jq(Eq,uB,0,a.b,7,1);h=jq(Eq,uB,0,a.b,7,1);i=jq(Eq,uB,0,a.b,7,1);j=jq(Eq,uB,0,a.b,7,1);g[0]=c;g[1]=d;h[1]=b;i[c]=1;i[d]=2;j[0]=-1;j[1]=0;f=1;k=1;while(f<=k){for(l=0;l<a.e[g[f]];l++){e=ej(a.i,g[f],l);if(f>1&&e==c){o=new ck(i[g[f]]);h[0]=gj(a.i,g[f],l);m=f;for(n=0;n<o.a.length;n++){o.a[n]=g[m];o.b[n]=h[m];m=j[m]}return o}if(i[e]==0&&Ej(a.i,e)){g[++k]=e;h[k]=gj(a.i,g[f],l);i[e]=i[g[f]]+1;j[k]=f}}++f}return null}
	function Hm(a,b){Vg();this.N=1>a?1:a;this.O=1>b?1:b;this.R=0;this.F=jq(Eq,uB,0,this.N,7,1);this.r=jq(Eq,uB,0,this.N,7,1);this.v=jq(Eq,uB,0,this.N,7,1);this.B=jq(Dq,xB,0,this.N,7,1);this.C=jq(Dq,xB,0,this.N,7,1);this.D=jq(Dq,xB,0,this.N,7,1);this.w=jq(Eq,uB,0,this.N,7,1);this.t=jq(Eq,uB,0,this.N,7,1);this.A=jq(Eq,uB,0,this.N,7,1);this.u=null;this.s=null;this.G=kq(Eq,[cC,uB],[5,0],7,[2,this.O],2);this.J=jq(Eq,uB,0,this.O,7,1);this.H=jq(Eq,uB,0,this.O,7,1);this.I=jq(Eq,uB,0,this.O,7,1)}
	function Ff(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o;for(i=d+1;i<a.j.g.length;i++){if(i!=d&&a.e[b][i]&&a.e[c][i]){g=jq(Eq,uB,0,2,7,1);g[0]=c;g[1]=b;return g}}o=jq(Eq,uB,0,a.b,7,1);k=jq(Eq,uB,0,a.b,7,1);j=jq(Eq,uB,0,a.b,7,1);f=0;l=0;j[0]=b;k[b]=1;while(f<=l){for(m=0;m<a.d[j[f]].length;m++){e=a.d[j[f]][m];if(e==c){if(f==0)continue;h=k[j[f]]+1;g=jq(Eq,uB,0,h,7,1);g[0]=e;g[1]=j[f];for(n=2;n<h;n++)g[n]=o[g[n-1]];return g}if(k[e]==0&&a.c[e]!=-3){k[e]=k[j[f]]+1;j[++l]=e;o[e]=j[f]}}++f}return null}
	function mi(a,b,c,d){var e,f,g;if(c==0){a.t[b]&=sC;a.t[b]|=0}else{if(d>=32)return;if(d==-1){g=-1;for(f=0;f<a.p;f++)f!=b&&c==(a.t[f]&lC)>>19&&g<((a.t[f]&lC)>>19!=1&&(a.t[f]&lC)>>19!=2?-1:(a.t[f]&mC)>>21)&&(g=(a.t[f]&lC)>>19!=1&&(a.t[f]&lC)>>19!=2?-1:(a.t[f]&mC)>>21);for(e=0;e<a.q;e++)c==(a.H[e]&nC)>>10&&g<((a.H[e]&nC)>>10!=1&&(a.H[e]&nC)>>10!=2?-1:(a.H[e]&oC)>>12)&&(g=(a.H[e]&nC)>>10!=1&&(a.H[e]&nC)>>10!=2?-1:(a.H[e]&oC)>>12);d=g+1;if(d>=32)return}a.t[b]&=sC;a.t[b]|=c<<19|d<<21}a.R&=3}
	function Ci(a,b,c,d){var e,f,g;if(c==0){a.H[b]&=-130049;a.H[b]|=0}else{if(d>=32)return;if(d==-1){g=-1;for(f=0;f<a.p;f++)c==(a.t[f]&lC)>>19&&g<((a.t[f]&lC)>>19!=1&&(a.t[f]&lC)>>19!=2?-1:(a.t[f]&mC)>>21)&&(g=(a.t[f]&lC)>>19!=1&&(a.t[f]&lC)>>19!=2?-1:(a.t[f]&mC)>>21);for(e=0;e<a.q;e++)e!=b&&c==(a.H[e]&nC)>>10&&g<((a.H[e]&nC)>>10!=1&&(a.H[e]&nC)>>10!=2?-1:(a.H[e]&oC)>>12)&&(g=(a.H[e]&nC)>>10!=1&&(a.H[e]&nC)>>10!=2?-1:(a.H[e]&oC)>>12);d=g+1;if(d>=32)return}a.H[b]&=-130049;a.H[b]|=c<<10|d<<12}a.R&=3}
	function Sf(a){var b,c,d,e,f,g,h,i,j;while(a.f.a.length>1){g=jq(Cq,bC,0,2,7,1);f=jq(Vq,GB,20,2,0,1);b=Hz(a.f,0);c=Hz(a.f,1);h=(tg(b),b.i-b.n+1+(tg(b),b.j-b.o+1));i=(tg(c),c.i-c.n+1+(tg(c),c.j-c.o+1));if(h>i){f[0]=b;g[0]=h;f[1]=c;g[1]=i}else{f[0]=c;g[0]=i;f[1]=b;g[1]=h}for(e=2;e<a.f.a.length;e++){d=Hz(a.f,e);j=(tg(d),d.i-d.n+1+(tg(d),d.j-d.o+1));if(g[0]<j){f[1]=f[0];f[0]=d;g[1]=g[0];g[0]=j}else if(g[1]<j){f[1]=d;g[1]=j}}sg(f[0],f[1]);Gz(a.f,bg(a,f[0],f[1],0));Jz(a.f,f[0]);Jz(a.f,f[1])}}
	function oj(a,b){var c,d,e,f,g,h,i;if(a.L&&(a.A[b]&RB)==0)return 0;c=a.F[b];if(c!=5&&c!=6&&c!=7&&c!=8&&c!=9&&c!=13&&c!=14&&c!=15&&c!=16&&c!=17&&c!=33&&c!=34&&c!=35&&c!=52&&c!=53)return 0;xm(a,1);h=0;for(f=0;f<a.c[b];f++)h+=a.j[b][f];if(a.L){d=1;for(e=0;e<a.g[b];e++)a.J[a.i[b][e]]==64&&++d;h+=d>>1}h-=Lh(a,b);g=((a.t[b]&kC)>>>28)-1;if(g==-1){if(a.F[b]>=171&&a.F[b]<=190){g=2}else{i=a.F[b]<Tg.length?Tg[a.F[b]]:null;if(i==null){g=6}else{g=i[0];for(e=1;g<h&&e<i.length;e++)g=i[e]}}}return 0>g-h?0:g-h}
	function Qx(a,b,c){if(c<128){a[b]=yq(c&127);return 1}else if(c<RB){a[b++]=yq(c>>6&31|192);a[b]=yq(c&63|128);return 2}else if(c<aC){a[b++]=yq(c>>12&15|224);a[b++]=yq(c>>6&63|128);a[b]=yq(c&63|128);return 3}else if(c<2097152){a[b++]=yq(c>>18&7|240);a[b++]=yq(c>>12&63|128);a[b++]=yq(c>>6&63|128);a[b]=yq(c&63|128);return 4}else if(c<pC){a[b++]=yq(c>>24&3|248);a[b++]=yq(c>>18&63|128);a[b++]=yq(c>>12&63|128);a[b++]=yq(c>>6&63|128);a[b]=yq(c&63|128);return 5}throw new Kw('Character out of range: '+c)}
	function cd(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o;k=jq(jt,yB,0,16,8,1);l=jq(jt,yB,0,16,8,1);c=jq(Dq,xB,0,16,7,1);f=jq(Dq,xB,0,2,7,1);d=0;for(j=0;j<2;j++){e=Ah(a.D,j,b);for(m=0;m<fj(a.D,e);m++){h=gj(a.D,e,m);if(h==b)continue;if(d==4)return 0;k[d]=Aj(a.D,h);l[d]=Fj(a.D,h);c[d++]=zh(a.D,e,ej(a.D,e,m))}}f[0]=zh(a.D,Ah(a.D,0,b),Ah(a.D,1,b));if(f[0]<0){f[1]=f[0]+$B;g=false}else{f[1]=f[0];f[0]=f[1]-$B;g=true}n=0;for(i=0;i<d;i++){k[i]?(o=20):l[i]?(o=17):(o=16);c[i]>f[0]&&c[i]<f[1]?(n-=o):(n+=o)}return g?-n:n}
	function Oi(a,b,c){var d,e,f,g,h;g=a.F[b];a.F[b]=a.F[c];a.F[c]=g;g=a.r[b];a.r[b]=a.r[c];a.r[c]=g;g=a.w[b];a.w[b]=a.w[c];a.w[c]=g;g=a.t[b];a.t[b]=a.t[c];a.t[c]=g;g=a.A[b];a.A[b]=a.A[c];a.A[c]=g;g=a.v[b];a.v[b]=a.v[c];a.v[c]=g;f=a.B[b];a.B[b]=a.B[c];a.B[c]=f;f=a.C[b];a.C[b]=a.C[c];a.C[c]=f;f=a.D[b];a.D[b]=a.D[c];a.D[c]=f;if(a.u!=null){h=a.u[b];a.u[b]=a.u[c];a.u[c]=h}if(a.s!=null){h=a.s[b];a.s[b]=a.s[c];a.s[c]=h}for(d=0;d<a.q;d++){for(e=0;e<2;e++){a.G[e][d]==b?(a.G[e][d]=c):a.G[e][d]==c&&(a.G[e][d]=b)}}a.R=0}
	function je(b,c){var d,e,f,g,h,i,j;if(b.W[c]==1||b.W[c]==2){i=false;if($i(b.L,c)==2){try{for(h=0;h<2;h++){d=ej(b.L,c,h);if(fj(b.L,d)==3){f=jq(Eq,uB,0,2,7,1);g=0;for(j=0;j<fj(b.L,d);j++)hj(b.L,d,j)==1&&(f[g++]=ej(b.L,d,j));b.d[f[0]]>b.d[f[1]]^ke(b,d,f[0],f[1])&&(i=!i)}}}catch(a){a=nt(a);if(sq(a,10)){b.R[c]=3;return}else throw mt(a)}}else{try{e=me(b,c)}catch(a){a=nt(a);if(sq(a,10)){b.R[c]=3;return}else throw mt(a)}for(h=1;h<e.length;h++)for(j=0;j<h;j++)b.d[e[h]]<b.d[e[j]]&&(i=!i)}b.W[c]==1^i?(b.R[c]=1):(b.R[c]=2)}}
	function tf(a){var b,c,d,e,f,g,h,i;if(a.g!=null){g=new Nf(a);a.b=new Mz;for(e=0;e<a.g.length;e++){d=Hf(g,e);if(d==0){Df(g,e);h=kf(a,e,2);b=kf(a,e,1);c=jf(a,e);if(h==1&&b==1&&!c){vf(a,e,g.a+g.f++);Gz(a.b,new Pg(e,1,-1,-1))}if(h>0){if(c){uf(a,e,g.i+g.g++,2);++h}Gz(a.b,new Pg(e,1,-1,-1))}else if(b>0){c&&uf(a,e,g.a+g.f++,1);Gz(a.b,new Pg(e,1,-1,-1))}else if(c){uf(a,e,g.a+g.f++,1);Gz(a.b,new Pg(e,1,-1,-1))}}else if(d==1){if(jf(a,e)){f=Gf(g,e);i=If(g,e);Gz(a.b,new Pg(e,2,f,i))}else{Df(g,e);Gz(a.b,new Pg(e,1,-1,-1))}}}}}
	function Ek(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o;k=vk(b,0);f=xw(b.substr(0,k));j=zk(b,k);k=vk(b,j);g=xw(b.substr(j,k-j));j=zk(b,k);k=vk(b,j);c=xk(a,xw(b.substr(j,k-j)));j=zk(b,k);k=vk(b,j);d=xk(a,xw(b.substr(j,k-j)));m=0;n=0;while((j=zk(b,k))!=-1){k=vk(b,j);l=b.substr(j,k-j);i=Fx(l,Rx(61));h=l.substr(0,i);o=xw(Nx(l,i+1,l.length-(i+1)));if(Dx(h,'CFG')){switch(o){case 1:m=1;break;case 2:m=g==2?3:4;break;case 3:m=6;}}else Dx(h,'TOPO')?(n=o):tk&&(ny(),my)}e=uk(a,c,d,g,m,n);e+1!=f&&(!a.b&&(a.b=new OA),MA(a.b,new Nw(f),new Nw(e)))}
	function Ae(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;h=null;n=tj(a.L);for(k=0;k<n.i.a.length;k++){if(n.f[k]){l=Hz(n.i,k);e=0;for(c=0,d=l.length;c<d;++c){b=l[c];$i(a.L,b)==2&&++e}if(e!=0){m=Hz(n.j,k);h==null&&(h=jq(jt,yB,0,a.L.e,8,1));if(e==l.length){i=-1;j=tB;for(f=0;f<l.length;f++){if(j>a.u[m[f]]){j=a.u[m[f]];i=f}}while(e>0){h[m[i]]=true;i=Se(i+2,l.length);e-=2}}else{g=0;while($i(a.L,l[g])==2)++g;while($i(a.L,l[g])!=2)g=Se(g+1,l.length);while(e>0){h[m[g]]=true;g=Se(g+2,l.length);e-=2;while($i(a.L,l[g])!=2)g=Se(g+1,l.length)}}}}}return h}
	function Tk(a){var b,c,d,e,f,g,h,i,j,k,l;b=jq(Eq,cC,5,a.i.a.length,0,2);for(e=0;e<a.i.a.length;e++){b[e]=jq(Eq,uB,0,Hz(a.i,e).length,7,1);for(f=0;f<Hz(a.i,e).length;f++)b[e][f]=-1}k=jq(Eq,uB,0,a.g.e,7,1);for(i=0;i<a.j.a.length;i++){j=Hz(a.j,i);if(j.length>=5&&j.length<=7){for(d=0;d<j.length;d++){c=j[d];if(fj(a.g,Ah(a.g,0,c))==3&&fj(a.g,Ah(a.g,1,c))==3){if(k[c]>0){b[k[c]>>>16][k[c]&32767]=i;b[i][d]=k[c]>>>16}else{k[c]=(i<<16)+32768+d}}}}}l=0;g=-1;while(l>g){g=l;for(h=0;h<a.i.a.length;h++){if(!a.a[h]){if(Uk(a,h,b)){a.a[h]=true;++l}}}}}
	function $l(a){var b,c,d,e,f,g;f='<svg id="'+(a.g!=null?a.g:'mol'+Pl)+'" '+'xmlns="http://www.w3.org/2000/svg" version="1.1" '+'width="'+a.k+'px" '+'height="'+a.f+'px" '+'viewBox="0 0 '+a.k+' '+a.f+'">\n';g='<style> #'+(a.g!=null?a.g:'mol'+Pl)+' {pointer-events:none; } '+' #'+(a.g!=null?a.g:'mol'+Pl)+' .event '+' { pointer-events:all;} '+' <\/style>\n';f+='\t';f+=g;for(e=new Gy(a.b);e.a<e.b.Mb();){d=(Hp(e.a<e.b.Mb()),e.b.Pb(e.a++));_l(a,d)}for(c=new Gy(a.a);c.a<c.b.Mb();){b=(Hp(c.a<c.b.Mb()),c.b.Pb(c.a++));_l(a,b)}return f+a.c.a+'<\/svg>'}
	function fg(a,b){var c,d,e,f;!a.j&&(a.j=new EA);a.i=b;xm(a.i,3);if((a.g&1)==0){a.b=a.i.p;a.d=a.i.q;a.e=jq(Eq,uB,0,a.b,7,1);for(c=0;c<a.b;c++)a.e[c]=Yi(a.i,c)}else{a.b=a.i.d;a.d=a.i.e;a.e=jq(Eq,uB,0,a.b,7,1);for(c=0;c<a.b;c++)a.e[c]=fj(a.i,c)}a.f=new Mz;a.a=jq(jt,yB,0,a.b,8,1);a.c=jq(jt,yB,0,a.d,8,1);(a.g&6)!=0&&jg(a);mg(a);hg(a);ig(a);hg(a);lg(a);Wf(a);og(a);ng(a);Sf(a);for(e=0;e<a.f.a.length;e++){d=Hz(a.f,e);for(f=0;f<d.a.length;f++){xi(a.i,d.a[f],d.c[f]);yi(a.i,d.a[f],d.d[f]);zi(a.i,d.a[f],0)}}if((a.g&1)!=0){if(a.b!=0){di(a.i,a.b);ei(a.i,a.d)}}}
	function Am(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q;p=jq(rr,GB,30,c,0,1);g=jq(Eq,uB,0,c,7,1);j=jq(Eq,uB,0,c,7,1);f=jq(Eq,uB,0,a.p,7,1);for(e=0;e<a.p;e++)b[e]!=-1&&(f[e]=g[b[e]]++);for(i=0;i<a.q;i++){n=b[a.G[0][i]];o=b[a.G[1][i]];n==o&&n!=-1&&++j[n]}for(q=0;q<c;q++){p[q]=new Hm(g[q],j[q]);p[q].L=a.L;p[q].M=a.M;p[q].Q=a.Q;p[q].K=a.K;p[q].P=a.P==null?null:a.P;p[q].R=a.R&12}for(d=0;d<a.p;d++)b[d]!=-1&&_g(a,p[b[d]],d);for(h=0;h<a.q;h++){n=b[a.G[0][h]];o=b[a.G[1][h]];n==o&&n!=-1&&ah(a,p[n],h,f)}for(l=0,m=p.length;l<m;++l){k=p[l];ci(k,1);ci(k,2)}return p}
	function $t(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G;c=a.l&8191;d=a.l>>13|(a.m&15)<<9;e=a.m>>4&8191;f=a.m>>17|(a.h&255)<<5;g=(a.h&1048320)>>8;h=b.l&8191;i=b.l>>13|(b.m&15)<<9;j=b.m>>4&8191;k=b.m>>17|(b.h&255)<<5;l=(b.h&1048320)>>8;B=c*h;C=d*h;D=e*h;F=f*h;G=g*h;if(i!=0){C+=c*i;D+=d*i;F+=e*i;G+=f*i}if(j!=0){D+=c*j;F+=d*j;G+=e*j}if(k!=0){F+=c*k;G+=d*k}l!=0&&(G+=c*l);n=B&wC;o=(C&511)<<13;m=n+o;q=B>>22;r=C>>9;s=(D&262143)<<4;t=(F&31)<<17;p=q+r+s+t;v=D>>18;w=F>>5;A=(G&4095)<<8;u=v+w+A;p+=m>>22;m&=wC;u+=p>>22;p&=wC;u&=KC;return Dt(m,p,u)}
	function ye(a){var b,c,d;for(b=0;b<a.L.d;b++){Oh(a.L,b)^a.W[b]==3&&Ni(a.L,b);(kh(a.L,b)==1||kh(a.L,b)==2)&&(!a.I[b]||a.W[b]==3)&&Ni(a.L,b)}for(d=0;d<a.L.q;d++)_h(a.L,d)&&!Me(a,d)&&Ni(a.L,Ah(a.L,0,d));for(c=0;c<a.L.e;c++){if(Hh(a.L,c)==2){if(Wh(a.L,c)&&(a.n[c]==1||a.n[c]==2)){a.n[c]=3;Gi(a.L,c,26)}if(a.n[c]==3&&!a.o[c]){if(Kh(a.L,c)!=26){Ni(a.L,Ah(a.L,0,c));Ni(a.L,Ah(a.L,1,c))}}}if(Kh(a.L,c)==1&&a.n[c]==3){Ni(a.L,Ah(a.L,0,c));Ni(a.L,Ah(a.L,1,c))}if((Fh(a.L,c)==1||Fh(a.L,c)==2)&&(Kh(a.L,c)!=1||a.n[c]!=1&&a.n[c]!=2)){Ni(a.L,Ah(a.L,0,c));Ni(a.L,Ah(a.L,1,c))}}}
	function zu(a){yu.call(this,''+('Possible problem with your *.gwt.xml module file.\nThe compile time user.agent value (safari) does not match the runtime user.agent value ('+a+').\n'+'Expect more errors.'),sq('Possible problem with your *.gwt.xml module file.\nThe compile time user.agent value (safari) does not match the runtime user.agent value ('+a+').\n'+'Expect more errors.',11)?'Possible problem with your *.gwt.xml module file.\nThe compile time user.agent value (safari) does not match the runtime user.agent value ('+a+').\n'+'Expect more errors.':null)}
	function Bw(a){Aw();var b,c,d,e,f,g;if(Dw(a)){return {l:0,m:0,h:524160}}g=false;if(a==0){return 1/a==-Infinity?{l:0,m:0,h:_B}:{l:0,m:0,h:0}}if(a<0){g=true;a=-a}if(Cw(a)){return g?{l:0,m:0,h:1048320}:{l:0,m:0,h:524032}}c=0;if(a<1){b=512;for(d=0;d<10;++d,b>>=1){if(a<yw[d]&&c-b>=-1023){a*=zw[d];c-=b}}if(a<1&&c-1>=-1023){a*=2;--c}}else if(a>=2){b=512;for(d=0;d<10;++d,b>>=1){if(a>=zw[d]){a*=yw[d];c+=b}}}c>-1023?(a-=1):(a*=0.5);e=Vt(a*1048576);a-=fu(e)*9.5367431640625E-7;f=Vt(a*4503599627370496);e=bu(e,Wt(c+1023<<20));g&&(e=bu(e,{l:0,m:512,h:0}));return bu(cu(e,32),f)}
	function Et(a,b,c){var d,e,f,g,h,i;if(b.l==0&&b.m==0&&b.h==0){throw new Kv}if(a.l==0&&a.m==0&&a.h==0){c&&(At=Dt(0,0,0));return Dt(0,0,0)}if(b.h==_B&&b.m==0&&b.l==0){return Ft(a,c)}i=false;if(b.h>>19!=0){b=_t(b);i=true}g=Lt(b);f=false;e=false;d=false;if(a.h==_B&&a.m==0&&a.l==0){e=true;f=true;if(g==-1){a=Ct((nu(),ju));d=true;i=!i}else{h=du(a,g);i&&Jt(h);c&&(At=Dt(0,0,0));return h}}else if(a.h>>19!=0){f=true;a=_t(a);d=true;i=!i}if(g!=-1){return Gt(a,g,i,f,c)}if(!Yt(a,b)){c&&(f?(At=_t(a)):(At=Dt(a.l,a.m,a.h)));return Dt(0,0,0)}return Ht(d?a:Dt(a.l,a.m,a.h),b,i,f,e,c)}
	function Sd(a,b,c){var d,e,f,g,h,i;d=jq(Eq,uB,0,4,7,1);for(h=0;h<Yi(a.L,b);h++)d[h]=ej(a.L,b,c[h]);Yi(a.L,b)==3&&(d[3]=b);e=kq(Dq,[GB,xB],[12,0],7,[3,3],2);for(g=0;g<3;g++){e[g][0]=th(a.L,d[g+1])-th(a.L,d[0]);e[g][1]=uh(a.L,d[g+1])-uh(a.L,d[0]);e[g][2]=vh(a.L,d[g+1])-vh(a.L,d[0])}i=jq(Dq,xB,0,3,7,1);i[0]=e[0][1]*e[1][2]-e[0][2]*e[1][1];i[1]=e[0][2]*e[1][0]-e[0][0]*e[1][2];i[2]=e[0][0]*e[1][1]-e[0][1]*e[1][0];f=(e[2][0]*i[0]+e[2][1]*i[1]+e[2][2]*i[2])/(Math.sqrt(e[2][0]*e[2][0]+e[2][1]*e[2][1]+e[2][2]*e[2][2])*Math.sqrt(i[0]*i[0]+i[1]*i[1]+i[2]*i[2]));return f>0?1:2}
	function om(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;xm(a.b,3);l=false;m=jq(Eq,uB,0,2,7,1);n=jq(Eq,uB,0,2,7,1);k=jq(Eq,uB,0,2,7,1);for(d=0;d<a.b.e;d++){if(!Hj(a.b,d)&&Kh(a.b,d)==2){for(g=0;g<2;g++){m[g]=-1;k[g]=-1;b=Ah(a.b,g,d);for(j=0;j<fj(a.b,b);j++){e=gj(a.b,b,j);if(e!=d){if(Kh(a.b,e)==17||Kh(a.b,e)==9){m[g]=ej(a.b,b,j);n[g]=e}else{k[g]=ej(a.b,b,j)}}}if(m[g]==-1)break}if(m[0]!=-1&&m[1]!=-1){i=Kh(a.b,n[0])!=Kh(a.b,n[1]);h=false;for(f=0;f<2;f++){k[f]!=-1&&k[f]<m[f]&&(h=!h)}Di(a.b,d,i^h?2:1,false);l=true}}}for(c=0;c<a.b.e;c++)(Kh(a.b,c)==17||Kh(a.b,c)==9)&&Gi(a.b,c,1);return l}
	function qf(a,b,c){var d,e,f,g;if(b==c)return false;if(a.a[b]!=a.a[c])return false;if(a.o[b]!=0){if(a.o[b]==3||a.o[c]==3)return false;if(a.p[b]^a.o[b]!=a.o[c])return false;if(a.k[b]!=a.k[c]||a.j[b]!=a.j[c])return false}if($i(a.i,b)==1&&!zj(a.i,b)){d=-1;for(g=0;g<fj(a.i,b);g++){if(hj(a.i,b,g)==1){d=gj(a.i,b,g);if(ej(a.i,b,g)==c&&a.c[d]!=0)return false;break}else if(hj(a.i,b,g)==2){d=gj(a.i,b,g);if(ej(a.i,b,g)==c&&a.c[d]==1)return false;break}}e=-1;for(f=0;f<fj(a.i,c);f++){if(hj(a.i,c,f)==2){e=gj(a.i,c,f);break}}if(a.c[d]!=0){if(a.d[d]^a.c[d]==a.c[e])return false}}return true}
	function Ti(a){var b,c,d,e,f,g,h,i;a.g=jq(Eq,uB,0,a.p,7,1);a.c=jq(Eq,uB,0,a.p,7,1);a.f=jq(Eq,cC,5,a.p,0,2);a.i=jq(Eq,cC,5,a.p,0,2);a.j=jq(Eq,cC,5,a.p,0,2);a.k=jq(Eq,uB,0,a.d,7,1);g=jq(Eq,uB,0,a.p,7,1);for(f=0;f<a.q;f++){++g[a.G[0][f]];++g[a.G[1][f]]}for(c=0;c<a.p;c++){a.f[c]=jq(Eq,uB,0,g[c],7,1);a.i[c]=jq(Eq,uB,0,g[c],7,1);a.j[c]=jq(Eq,uB,0,g[c],7,1)}for(e=0;e<a.q;e++){i=Hh(a,e);for(h=0;h<2;h++){d=a.G[h][e];a.j[d][a.c[d]]=i;a.f[d][a.c[d]]=a.G[1-h][e];a.i[d][a.c[d]]=e;++a.c[d];e<a.e&&++a.g[d];d<a.d&&(i>1?(a.k[d]+=i+i-2):a.J[e]==64&&(a.k[d]=2))}}for(b=0;b<a.d;b++)a.k[b]=~~(a.k[b]/2)}
	function Ke(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o;i=jq(Eq,uB,0,32,7,1);j=0;for(d=0;d<a.L.d;d++){if((a.S[d]==1||a.S[d]==2)&&a.U[d]==b){h=a.T[d];if(i[h]<a.d[d]){i[h]==0&&++j;i[h]=a.d[d]}}}for(f=0;f<a.L.e;f++){if((a.i[f]==1||a.i[f]==2)&&a.k[f]==b&&Kh(a.L,f)==1){h=a.j[f];o=nx(a.d[Ah(a.L,0,f)],a.d[Ah(a.L,1,f)]);if(i[h]<o){i[h]==0&&++j;i[h]=o}}}g=jq(Aq,eC,0,32,7,1);for(k=0;k<j;k++){m=-1;n=0;for(l=0;l<32;l++){if(n<i[l]){n=i[l];m=l}}i[m]=0;g[m]=yq(k)}for(c=0;c<a.L.d;c++)(a.S[c]==1||a.S[c]==2)&&a.U[c]==b&&(a.T[c]=g[a.T[c]]);for(e=0;e<a.L.e;e++)(a.i[e]==1||a.i[e]==2)&&a.k[e]==b&&Kh(a.L,e)==1&&(a.j[e]=g[a.j[e]])}
	function Qj(a){var b,c,d,e,f,g,h,i;if(!a.L)return false;for(d=0;d<a.e;d++)(a.I[d]&MB)!=0&&(a.I[d]|=32);for(c=0;c<a.p;c++)pj(a,c)>=Mh(a,c)+Lh(a,c)&&(a.A[c]&=-6145);f=false;for(b=0;b<a.d;b++){g=a.c[b]-a.g[b];if(!a.Q&&g>0){if((a.A[b]&RB)==0){if(Mh(a,b)+Lh(a,b)-pj(a,b)==0)a.A[b]|=RB;else{i=0;(a.A[b]&128)==128&&++i;(a.A[b]&1920)==384&&++i;a.A[b]&=-1921;Mh(a,b)+Lh(a,b)-pj(a,b)<=i?(a.A[b]|=RB):i==0?(a.A[b]|=128):(a.A[b]|=384)}}for(h=a.g[b];h<a.c[b];h++){e=a.i[b][h];if(a.J[e]==1){a.F[a.f[b][h]]=-1;a.J[e]=128;f=true}}}((a.A[b]&PB)!=0||(a.A[b]&2)!=0)&&(a.A[b]|=8);a.r[b]!=0&&(a.t[b]&=-234881025)}f&&$g(a);return f}
	function rm(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p;if(a.b)return 3;a.c!=-1&&(a.c=b[a.c]);for(g=0;g<a.g;g++)a.f[g]!=tB&&(a.f[g]=b[a.f[g]]);if(a.c==-1&&a.d==0){n=tB;m=-1;for(h=0;h<a.g;h++){if(n>a.j[h]){n=a.j[h];m=h}}a.c=a.f[m];for(i=m+1;i<a.g;i++){a.f[i-1]=a.f[i];a.j[i-1]=a.j[i];a.i[i-1]=a.i[i]}--a.g}p=(a.c==-1?0:1)+a.d+a.g;if(p>4||p<3)return 3;c=a.c==-1&&a.d==1||a.c!=-1&&Gj(a.k.b,a.c);e=-1;for(j=0;j<a.g;j++){if(a.i[j]){if(e!=-1||c)return 3;e=j}}l=false;if(e!=-1)for(k=0;k<a.g;k++)!a.i[k]&&a.f[e]<a.f[k]&&(l=!l);d=false;if(a.c!=-1&&!c)for(f=0;f<a.g;f++)a.c<a.f[f]&&(d=!d);o=a.e^sm(a.f,a.j,a.g)^d^l?2:1;return o}
	function yj(a){var b,c,d,e,f,g,h,i,j,k,l,m,n;j=jq(jt,yB,0,a.p,8,1);for(f=0;f<a.q;f++)for(h=0;h<2;h++)Gj(a,a.G[h][f])&&!Gj(a,a.G[1-h][f])&&(j[a.G[h][f]]=true);k=a.p;do --k;while(k>=0&&j[k]);for(b=0;b<k;b++){if(j[b]){Oi(a,b,k);m=j[b];j[b]=j[k];j[k]=m;do --k;while(j[k])}}a.d=k+1;if(a.p==a.d){a.e=a.q;return}i=jq(jt,yB,0,a.q,8,1);for(g=0;g<a.q;g++){c=a.G[0][g];d=a.G[1][g];(j[c]||j[d])&&(i[g]=true)}l=a.q;do --l;while(l>=0&&i[l]);for(e=0;e<l;e++){if(i[e]){n=a.G[0][e];a.G[0][e]=a.G[0][l];a.G[0][l]=n;n=a.G[1][e];a.G[1][e]=a.G[1][l];a.G[1][l]=n;n=a.J[e];a.J[e]=a.J[l];a.J[l]=n;i[e]=false;do --l;while(i[l])}}a.e=l+1}
	function fd(a){var b,c,d;if(a.D.p==0)return;xm(a.D,(a.B&256)!=0?31:(a.B&512)!=0?47:(a.B&IB)!=0?79:15);vc(a);c=false;a.o=jq(Eq,uB,0,a.D.p,7,1);for(b=0;b<a.D.p;b++){a.o[b]=gh(a.D,b);a.o[b]!=0&&(c=true);$h(a.D,b)&&(a.o[b]=128);Nh(a.D,b)&&(a.B&HB)==0&&(a.o[b]=256)}Hc(a);Ic(a);tc(a);Zl(a,a.L);Yl(a,a.M);hd(a,a.A);Kc(a);a.J.a=jq(xs,GB,1,0,3,1);a.O.a=jq(xs,GB,1,0,3,1);for(d=0;d<a.D.p;d++){if(Jc(a,d)){hd(a,-3);Rc(a,d,true);hd(a,a.A)}else if(a.o[d]!=0){hd(a,a.o[d]);Rc(a,d,true);hd(a,a.A)}else if(!c&&(a.B&RB)==0&&wh(a.D,d)<pc.length){jd(a,Ec(pc[wh(a.D,d)]));Rc(a,d,true);hd(a,a.A)}else{Rc(a,d,true)}}Qc(a);Tc(a);Pc(a)}
	function be(a){var b,c,d,e,f,g,h;a.P=jq(jt,yB,0,a.L.d,8,1);a.O=jq(jt,yB,0,a.L.e,8,1);if((a.K&6)!=0){for(b=0;b<a.L.d;b++){df(a.c[b],b);bf(a.c[b],20,a.d[b]<<12)}}if(a.N<a.L.d){f=0;for(b=0;b<a.L.d;b++)Qd(a,b,true)&&++f;for(e=0;e<a.L.e;e++)Md(a,e,true)&&++f}(a.K&6)!=0&&(a.N=ae(a));if((a.K&1)!=0){a.e=jq(Eq,uB,0,a.L.d,7,1);for(b=0;b<a.L.d;b++)a.e[b]=a.d[b]}while(a.N<a.L.d){for(c=0;c<a.L.d;c++){df(a.c[c],c);bf(a.c[c],17,2*a.d[c])}h=jq(Eq,uB,0,a.N+1,7,1);for(d=0;d<a.L.d;d++)++h[a.d[d]];g=1;while(h[g]==1)++g;for(b=0;b<a.L.d;b++){if(a.d[b]==g){af(a.c[b],1);break}}a.N=ae(a);_d(a);!!a.J&&sf(a.J,a.d)}_d(a);Xd(a);ye(a)}
	function lf(a){var b,c,d,e,f,g,h,i,j,k,l,m;k=new Mz;for(l=0;l<a.i.d;l++){if($i(a.i,l)<2||fj(a.i,l)>2){for(g=1;g<fj(a.i,l);g++){b=ej(a.i,l,g);for(j=0;j<g;j++){c=ej(a.i,l,j);qf(a,b,c)&&hf(a,xf(a,b,c),k)}}}}for(m=0;m<a.i.e;m++){if(a.c[m]!=0){if(Hh(a.i,m)!=2||a.c[m]!=2)continue}b=Ah(a.i,0,m);c=Ah(a.i,1,m);qf(a,b,c)&&hf(a,xf(a,b,c),k)}for(h=k.a.length-1;h>=0;h--){d=(Ip(h,k.a.length),k.a[h]);e=false;for(j=0;j<d.length;j++){if(a.f[d[j]]){e=true;break}}e||Jz(k,d)}a.g=Lz(k,kq(Eq,[cC,uB],[5,0],7,[0,0],2));mA(a.g,new Bf);a.e=jq(jt,yB,0,a.i.d,8,1);for(f=0;f<a.g.length;f++)for(i=0;i<a.g[f].length;i++)a.e[a.g[f][i]]=true}
	function Ld(a,b,c){var d,e,f,g,h,i,j;if(!Bj(a.L,b))return false;d=Ah(a.L,0,b);e=Ah(a.L,1,b);g=new Rg(a.L,a.d,d,e);if(g.f&&!c)return false;h=new Rg(a.L,a.d,e,d);if(h.f&&!c)return false;if(g.f&&h.f)return false;if(c){g.f&&(a.O[b]=Ge(a,e));h.f&&(a.O[b]=Ge(a,d))}i=Qg(g);j=Qg(h);if(i==-1||j==-1||(i+j&1)==0){c||(a.n[b]=3);return true}f=0;switch(i+j){case 3:case 7:f=1;break;case 5:f=2;}if(c){if(a.Q&&(a.K&2)!=0||!a.Q&&(a.K&4)!=0){if(g.f){if(f==2){af(a.c[g.b],4);af(a.c[g.d],1)}else{af(a.c[g.b],1);af(a.c[g.d],4)}}if(h.f){if(f==2){af(a.c[h.b],4);af(a.c[h.d],1)}else{af(a.c[h.b],1);af(a.c[h.d],4)}}}}else{a.n[b]=f}return true}
	function pg(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t;e=jq(Cq,bC,0,a.e[c]+1,7,1);g=jq(Eq,uB,0,a.e[c]+1,7,1);h=jq(Eq,uB,0,a.e[c]+1,7,1);q=yg(b,c);f=0;for(j=0;j<a.e[c];j++){g[f]=ej(a.i,c,j);h[f]=gj(a.i,c,j);l=yg(b,g[f]);l!=-1&&(e[f++]=bk(b.c[q],b.d[q],b.c[l],b.d[l]))}if(f==1)return e[0]+CB;for(k=f-1;k>0;k--){for(m=0;m<k;m++){if(e[m]>e[m+1]){r=e[m];e[m]=e[m+1];e[m+1]=r;s=g[m];g[m]=g[m+1];g[m+1]=s;t=h[m];h[m]=h[m+1];h[m+1]=t}}}e[f]=e[0]+BB;g[f]=g[0];h[f]=h[0];n=-100;o=0;for(i=0;i<f;i++){d=e[i+1]-e[i];if(f>2&&Fj(a.i,h[i])&&Fj(a.i,h[i+1])){p=eg(a,g[i],c,g[i+1]);p!=0&&(d-=100-p)}if(n<d){n=d;o=i}}return (e[o]+e[o+1])/2}
	function jg(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r;h=0;f=0;for(g=0;g<a.d;g++){if(Yh(a.i,Ah(a.i,0,g))&&Yh(a.i,Ah(a.i,1,g))){a.c[g]=true;f+=Gh(a.i,g);++h}}if(h==0||f==0)return;f/=h;for(c=0;c<a.b;c++){Yh(a.i,c)&&(a.a[c]=true)}p=jq(Eq,uB,0,a.b,7,1);i=kj(a.i,p,true);o=jq(Eq,uB,0,i,7,1);for(d=0;d<a.b;d++)p[d]!=-1&&++o[p[d]];n=jq(Vq,GB,20,i,0,1);for(k=0;k<i;k++)n[k]=new Fg(a,a.i,o[k]);e=jq(Eq,uB,0,i,7,1);for(b=0;b<a.b;b++){l=p[b];if(l!=-1){n[l].q[e[l]]=256;n[l].a[e[l]]=b;n[l].c[e[l]]=th(a.i,b)/f;n[l].d[e[l]]=uh(a.i,b)/f;++e[l]}}q=-1;r=0;for(m=0;m<i;m++){if(r<o[m]){r=o[m];q=m}}Gz(a.f,n[q]);for(j=0;j<i;j++)j!=q&&Gz(a.f,n[j])}
	function rd(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o;if(a.b==0)return true;o=new fl(a.d,1);a.d.L&&td(a);for(c=0;c<a.d.d;c++){qd(a,c)&&wh(a.d,c)==6&&(fh(a.d,c)==-1&&o.b[c]==5||fh(a.d,c)==1&&o.b[c]==7)&&vd(a,c)}ud(a);while(a.b!=0){g=false;for(e=0;e<a.d.e;e++){if(a.c[e]){b=0;for(k=0;k<2;k++){f=Ah(a.d,k,e);for(l=0;l<fj(a.d,f);l++)a.c[gj(a.d,f,l)]&&++b}if(b==4){sd(a,e);ud(a);g=true;break}}}if(!g){for(m=0;m<o.i.a.length;m++){if(Hz(o.j,m).length==6){j=true;n=Hz(o.j,m);for(i=0;i<6;i++){if(!a.c[n[i]]){j=false;break}}if(j){for(h=0;h<6;h+=2)sd(a,n[h]);g=true;break}}}}if(!g){for(d=0;d<a.d.e;d++){if(a.c[d]){sd(a,d);ud(a);break}}}}return a.a==a.e}
	function hg(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s;while(true){s=0;n=0;q=null;r=null;for(g=1;g<a.f.a.length;g++){d=Hz(a.f,g);for(h=0;h<g;h++){e=Hz(a.f,h);b=0;c=0;o=0;p=0;for(k=0;k<d.a.length;k++){for(m=0;m<e.a.length;m++){if(d.a[k]==e.a[m]){++c;b=d.a[k];o<d.q[k]&&(o=d.q[k]);p<e.q[m]&&(p=e.q[m])}}}if(c>0){f=c==1&&$f(a,d,b)==1&&$f(a,e,b)==1?0:1;o>p?(i=(f<<24)+(o<<16)+(p<<8)+c):(i=(f<<24)+(p<<16)+(o<<8)+c);if(s<i){s=i;n=c;o=0;p=0;for(l=0;l<d.a.length;l++)o<d.q[l]&&(o=d.q[l]);for(j=0;j<e.a.length;j++)p<e.q[j]&&(p=e.q[j]);if(o>p){q=d;r=e}else{q=e;r=d}}}}}if(s==0)break;n==q.a.length?Jz(a.f,q):n==r.a.length?Jz(a.f,r):gg(a,q,r,n)}}
	function ce(a){var b,c,d,e,f,g;g=a.N;f=jq(Eq,uB,0,a.L.d,7,1);for(c=0;c<a.L.d;c++)f[c]=a.d[c];if(!a.L.L){ee(a);Le(a,g,f)}a.U=jq(Aq,eC,0,a.L.d,7,1);a.T=jq(Aq,eC,0,a.L.d,7,1);for(d=0;d<a.L.d;d++){a.U[d]=yq(kh(a.L,d));a.T[d]=yq(jh(a.L,d))}a.k=jq(Aq,eC,0,a.L.e,7,1);a.j=jq(Aq,eC,0,a.L.e,7,1);for(e=0;e<a.L.e;e++){a.k[e]=yq(Fh(a.L,e));a.j[e]=yq(Eh(a.L,e))}de(a);a.Q=false;a.I=jq(jt,yB,0,a.L.d,8,1);for(b=0;b<a.L.d;b++){if(a.W[b]!=0){a.I[b]=true;a.Q=true}}ge(a);a.J=null;a.V=jq(jt,yB,0,a.L.d,8,1);if(a.Q){a.J=new yf(a.L,f,a.I,a.W,a.n,a.U,a.T,a.$,a.p,a.V);tf(a.J)}a.Y=jq(jt,yB,0,a.L.d,8,1);a.Z=new Mz;$d(a);Le(a,g,f);fe(a);!!a.J&&(a.G=pf(a.J));qe(a)}
	function sg(a,b){var c,d,e,f,g,h,i,j,k,l,m;h=0;g=0;for(e=0;e<4;e++){f=xg(a,e)+xg(b,e>=2?e-2:e+2);if(h<f){h=f;g=e}}k=(tg(a),a.j-a.o+1+(tg(b),b.j-b.o+1));l=(tg(a),0.75*(a.i-a.n+1+(tg(b),b.i-b.n+1)));i=mx((tg(a),a.j-a.o+1),(tg(b),b.j-b.o+1));j=0.75*mx((tg(a),a.i-a.n+1),(tg(b),b.i-b.n+1));d=Math.sqrt((k-h)*(k-h)+(l-0.75*h)*(l-0.75*h));m=j>k?j:k;c=i>l?i:l;if(d<m&&d<c){switch(g){case 0:Dg(b,a.i-b.n-h+1,a.o-b.j+h-1);break;case 1:Dg(b,a.i-b.n-h+1,a.j-b.o-h+1);break;case 2:Dg(b,a.n-b.i+h-1,a.j-b.o-h+1);break;case 3:Dg(b,a.n-b.i+h-1,a.o-b.j+h-1);}}else if(c<m){Dg(b,a.i-b.n+1,(a.j+a.o-b.j-b.o)/2)}else{Dg(b,(a.i+a.n-b.i-b.n)/2,a.j-b.o+1);return}}
	function xp(a,b){var c,d,e,f,g,h,i,j,k;if(!b.length){return a.yb('Unknown','anonymous',-1,-1)}k=Lx(b);Dx(k.substr(0,3),'at ')&&(k=Nx(k,3,k.length-3));k=k.replace(/\[.*?\]/g,'');g=k.indexOf('(');if(g==-1){g=k.indexOf('@');if(g==-1){j=k;k=''}else{j=Lx(Nx(k,g+1,k.length-(g+1)));k=Lx(k.substr(0,g))}}else{c=k.indexOf(')',g);j=k.substr(g+1,c-(g+1));k=Lx(k.substr(0,g))}g=Fx(k,Rx(46));g!=-1&&(k=Nx(k,g+1,k.length-(g+1)));(!k.length||Dx(k,'Anonymous function'))&&(k='anonymous');h=Hx(j,Rx(58));e=Ix(j,Rx(58),h-1);i=-1;d=-1;f='Unknown';if(h!=-1&&e!=-1){f=j.substr(0,e);i=sp(j.substr(e+1,h-(e+1)));d=sp(Nx(j,h+1,j.length-(h+1)))}return a.yb(f,k,i,d)}
	function $g(a){var b,c,d,e,f,g,h,i;for(g=0;g<a.q;g++){if(a.J[g]==128){c=a.G[0][g];d=a.G[1][g];if(a.F[c]==-1^a.F[d]==-1){if(a.r[c]!=0&&a.r[d]!=0){if(a.r[c]<0^a.r[d]<0){if(a.r[c]<0){++a.r[c];--a.r[d]}else{--a.r[c];++a.r[d]}}}}}}i=jq(Eq,uB,0,a.p,7,1);e=0;for(b=0;b<a.p;b++){if(a.F[b]==-1){i[b]=-1;continue}if(e<b){a.F[e]=a.F[b];a.r[e]=a.r[b];a.w[e]=a.w[b];a.t[e]=a.t[b];a.A[e]=a.A[b];a.v[e]=a.v[b];a.B[e]=a.B[b];a.C[e]=a.C[b];a.D[e]=a.D[b];a.u!=null&&(a.u[e]=a.u[b]);a.s!=null&&(a.s[e]=a.s[b])}i[b]=e;++e}a.p=e;h=0;for(f=0;f<a.q;f++){if(a.J[f]==128)continue;a.J[h]=a.J[f];a.H[h]=a.H[f];a.I[h]=a.I[f];a.G[0][h]=i[a.G[0][f]];a.G[1][h]=i[a.G[1][f]];++h}a.q=h;return i}
	function Wf(a){var b,c,d,e,f,g,h,i,j,k,l,m;for(i=0;i<a.f.a.length;i++){h=Hz(a.f,i);for(j=0;j<h.e.length;j++){d=h.e[j];if(Hh(a.i,d)==2){!Hj(a.i,d)&&Ih(a.i,d)==0&&Ei(a.i,d);if(!Fj(a.i,d)&&fj(a.i,Ah(a.i,0,d))>1&&fj(a.i,Ah(a.i,1,d))>1&&(Ih(a.i,d)==1||Ih(a.i,d)==2)){m=jq(Eq,uB,0,2,7,1);e=jq(Eq,uB,0,2,7,1);for(k=0;k<2;k++){m[k]=a.i.N;e[k]=Ah(a.i,k,d);for(l=0;l<a.e[e[k]];l++){f=ej(a.i,e[k],l);f!=Ah(a.i,1-k,d)&&m[k]>f&&(m[k]=f)}}g=bk(h.c[h.b[e[0]]],h.d[h.b[e[0]]],h.c[h.b[e[1]]],h.d[h.b[e[1]]]);b=bk(h.c[h.b[m[0]]],h.d[h.b[m[0]]],h.c[h.b[e[0]]],h.d[h.b[e[0]]]);c=bk(h.c[h.b[e[1]]],h.d[h.b[e[1]]],h.c[h.b[m[1]]],h.d[h.b[m[1]]]);Zf(g,b)<0^Zf(g,c)<0^Ih(a.i,d)==2&&vg(h,d)}}}}}
	function Tx(a,b,c){var d,e,f,g,h,i,j,k;f=0;for(j=0;j<c;){++f;e=a[b+j];if((e&192)==128){throw new Kw('Invalid UTF8 sequence')}else if((e&128)==0){++j}else if((e&224)==192){j+=2}else if((e&240)==224){j+=3}else if((e&248)==240){j+=4}else{throw new Kw('Invalid UTF8 sequence')}if(j>c){throw new Mw('Invalid UTF8 sequence')}}g=jq(Bq,bC,0,f,7,1);k=0;h=0;for(i=0;i<c;){e=a[b+i++];if((e&128)==0){h=1;e&=127}else if((e&224)==192){h=2;e&=31}else if((e&240)==224){h=3;e&=15}else if((e&248)==240){h=4;e&=7}else if((e&252)==248){h=5;e&=3}while(--h>0){d=a[b+i++];if((d&192)!=128){throw new Kw('Invalid UTF8 sequence at '+(b+i-1)+', byte='+Vw(d,16))}e=e<<6|d&63}k+=$v(e,g,k)}return Ox(g,0,g.length)}
	function Lm(a){var b,c,d,e,f,g,h,i,j;if(!a.g)return false;Hv(a.f);Hv(a.a);a.e=null;j=false;c=-1;a.b=a.c==null?null:jq(Cs,GB,2,a.c.length,4,1);a.d=-1;do{i=zv(a.g);if(i==null){Hv(a.f);return false}if(j){gy(a.a,i);dy(a.a,10)}else{if(Dx(i.substr(0,1),'>')){j=true;gy(a.f,'M  END');dy(a.f,10);gy(a.a,i);dy(a.a,10)}else{gy(a.f,i);dy(a.f,10);Dx(i.substr(0,6),'M  END')&&(j=true);continue}}if(a.c!=null){if(i.length==0){c=-1}else if(c==-1){d=Nm(i);if(d!=null){c=-1;for(b=0;b<a.c.length;b++){if(Dx(d,a.c[b])){c=b;break}}if(a.d==-1){for(f=Jm,g=0,h=f.length;g<h;++g){e=f[g];if(Dx(d,e)){a.d=c;break}}}}}else{a.b[c]==null?(a.b[c]=i):(a.b[c]=a.b[c]+'\n'+i)}}}while(!Dx(i.substr(0,4),'$$$$'));return true}
	function ci(a,b){var c,d,e,f,g,h,i,j,k;if(b==0)return 0;h=null;for(d=0;d<a.p;d++){if((a.t[d]&lC)>>19==b){h==null&&(h=jq(jt,yB,0,32,8,1));h[(a.t[d]&lC)>>19!=1&&(a.t[d]&lC)>>19!=2?-1:(a.t[d]&mC)>>21]=true}}for(f=0;f<a.q;f++){if((a.H[f]&nC)>>10==b){h==null&&(h=jq(jt,yB,0,32,8,1));h[(a.H[f]&nC)>>10!=1&&(a.H[f]&nC)>>10!=2?-1:(a.H[f]&oC)>>12]=true}}k=0;if(h!=null){j=jq(Eq,uB,0,32,7,1);for(i=0;i<32;i++)h[i]&&(j[i]=k++);for(c=0;c<a.p;c++){if((a.t[c]&lC)>>19==b){g=j[(a.t[c]&lC)>>19!=1&&(a.t[c]&lC)>>19!=2?-1:(a.t[c]&mC)>>21];a.t[c]&=-65011713;a.t[c]|=g<<21}}for(e=0;e<a.q;e++){if((a.H[e]&nC)>>10==b){g=j[(a.H[e]&nC)>>10!=1&&(a.H[e]&nC)>>10!=2?-1:(a.H[e]&oC)>>12];a.H[e]&=-126977;a.H[e]|=g<<12}}}return k}
	function Te(a,b){var c,d;if(a.p>gC)throw new Kw('Cannot canonize a molecule having more than 65535 atoms');if(a.q>gC)throw new Kw('Cannot canonize a molecule having more than 65535 bonds');this.L=a;this.K=b;xm(this.L,3);Vd(this);for(d=0;d<this.L.d;d++){if(vh(this.L,d)!=0){this._=true;break}}this.d=jq(Eq,uB,0,this.L.p,7,1);this.c=jq(Oq,GB,41,this.L.d,0,1);for(c=0;c<this.L.d;c++)this.c[c]=new ef;this.W=jq(Aq,eC,0,this.L.d,7,1);this.X=jq(jt,yB,0,this.L.d,8,1);this.$=jq(jt,yB,0,this.L.d,8,1);this.n=jq(Aq,eC,0,this.L.e,7,1);this.p=jq(jt,yB,0,this.L.e,8,1);this.o=jq(jt,yB,0,this.L.e,8,1);this.b=false;Zd(this);ce(this);be(this);this.b&&(ny(),'No distinction applying CIP rules: '+De(this)+' '+Ce(this,this._))}
	function Tc(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p;n=false;for(d=0;d<a.D.e;d++){j=null;if(Th(a.D,d)){l=Ch(a.D,d);k=Bh(a.D,d);j=l==k?'['+l+']':'['+l+':'+k+']'}else (Jh(a.D,d)&VB)!=0?(j=(Jh(a.D,d)&VB)==WB?'a':(Jh(a.D,d)&48)==32?'r!a':'!a'):(Jh(a.D,d)&48)!=0&&(j=(Jh(a.D,d)&48)==32?'r':'!r');m=(Jh(a.D,d)&MB)>>14;m!=0&&(j=(j==null?'':j)+m);if(j!=null){b=Ah(a.D,0,d);c=Ah(a.D,1,d);if(!n){Zl(a,~~((a.L*2+1)/3));n=true}o=(Kg(a.G,th(a.D,b))+Kg(a.G,th(a.D,c)))/2;p=(Lg(a.G,uh(a.D,b))+Lg(a.G,uh(a.D,c)))/2;f=Kg(a.G,th(a.D,c))-Kg(a.G,th(a.D,b));g=Lg(a.G,uh(a.D,c))-Lg(a.G,uh(a.D,b));e=Math.sqrt(f*f+g*g);i=vB*Ul(a,j);h=0.550000011920929*a.j;e!=0&&(f>0?Vc(a,o+i*g/e,p-h*f/e,j,true,true):Vc(a,o-i*g/e,p+h*f/e,j,true,true))}}n&&Zl(a,a.L)}
	function Jj(a){var b,c,d,e,f,g,h,i,j,k;xm(a,1);i=false;for(c=0;c<a.d;c++){if(a.F[c]==7&&a.r[c]==0){k=pj(a,c);if(k==4){for(j=0;j<a.g[c];j++){g=a.f[c][j];if(a.j[c][j]==1&&a.F[g]==8&&a.g[g]==1&&a.r[g]==0){i=true;++a.r[c];--a.r[g];break}}}else if(k==5){for(j=0;j<a.g[c];j++){g=a.f[c][j];h=a.i[c][j];if(a.j[c][j]==2&&a.F[g]==8){i=true;++a.r[c];--a.r[g];a.J[h]=1;break}if(a.j[c][j]==3&&a.F[g]==7){i=true;++a.r[c];--a.r[g];a.J[h]=2;break}}}}}f=false;for(e=0;e<a.e;e++){if(Hh(a,e)==1){for(j=0;j<2;j++){if(Xh(a,a.G[j][e])){b=a.G[1-j][e];d=a.F[b];if(d==3||d==11||d==12||d==19||d==20||d==37||d==38||d==55||d==56){++a.r[b];--a.r[a.G[j][e]];a.J[e]=128;f=true}break}}}else if(a.J[e]==32){a.J[e]=128;f=true}}if(f){$g(a);i=true}i&&(a.R=0);return i}
	function Md(a,b,c){var d,e,f,g,h;if(a.n[b]!=0)return false;if(Hh(a.L,b)==1)return Ld(a,b,c);if(Hh(a.L,b)!=2)return false;if(Aj(a.L,b))return false;e=Ah(a.L,0,b);f=Ah(a.L,1,b);if(fj(a.L,e)==1||fj(a.L,f)==1)return false;if(fj(a.L,e)>3||fj(a.L,f)>3)return false;if($i(a.L,e)==2||$i(a.L,f)==2)return false;g=new Rg(a.L,a.d,f,e);if(g.f&&!c)return false;h=new Rg(a.L,a.d,e,f);if(h.f&&!c)return false;if(g.f&&h.f)return false;if(c){g.f&&g.c&&(a.O[b]=true);h.f&&h.c&&(a.O[b]=true)}d=Wh(a.L,b)?3:a._?Od(a,g,h):Nd(g,h);if(c){if((a.K&2)!=0){if(g.f){if(d==1){af(a.c[g.b],4);af(a.c[g.d],1)}else if(d==2){af(a.c[g.b],1);af(a.c[g.d],4)}}if(h.f){if(d==1){af(a.c[h.b],4);af(a.c[h.d],1)}else if(d==2){af(a.c[h.b],1);af(a.c[h.d],4)}}}}else{a.n[b]=d}return true}
	function nl(a,b){var c,d,e,f,g,h;if(!a.q||!a.c)return 0;if(a.c.d>a.q.d||a.c.e>a.q.e)return 0;yl(a,b);c=jq(jt,yB,0,a.q.d,8,1);a.p=jq(Eq,uB,0,a.c.d,7,1);g=jq(Eq,uB,0,a.o,7,1);for(f=0;f<a.o;f++)g[f]=-1;e=0;while(true){++g[e];h=a.k[e]==-1?a.q.d:fj(a.q,a.p[a.k[e]]);if(g[e]==h){g[e]=-1;if(e==0)break;--e;a.j[e]||(c[a.p[a.i[e]]]=false);continue}if(a.k[e]==-1){if(!c[g[e]]){if(gl(a,g[e],a.i[e])){a.p[a.i[e]]=g[e];c[g[e]]=true;++e}}}else if(a.j[e]){d=ej(a.q,a.p[a.k[e]],g[e]);d==a.p[a.i[e]]&&hl(a,gj(a.q,a.p[a.k[e]],g[e]),a.n[e])&&++e}else{d=ej(a.q,a.p[a.k[e]],g[e]);if(!c[d]){if(gl(a,d,a.i[e])&&hl(a,gj(a.q,a.p[a.k[e]],g[e]),a.n[e])){c[d]=true;a.p[a.i[e]]=d;++e}}}if(e==a.o){if(ml(a)&&ll(a)&&kl(a,c)){return 1}--e;a.j[e]||(c[a.p[a.i[e]]]=false)}}return 0}
	function Yp(a,b,c,d,e){var f,g,h,i;hy(d,0,d.a.length);g=false;h=b.length;for(i=c;i<h;++i){f=b.charCodeAt(i);if(f==39){if(i+1<h&&b.charCodeAt(i+1)==39){++i;d.a+="'"}else{g=!g}continue}if(g){d.a+=qq(f)}else{switch(f){case 35:case 48:case 44:case 46:case 59:return i-c;case 164:a.g=true;if(i+1<h&&b.charCodeAt(i+1)==164){++i;if(i<h-2&&b.charCodeAt(i+1)==164&&b.charCodeAt(i+2)==164){i+=2;gy(d,gq(a.a))}else{gy(d,a.a[0])}}else{gy(d,a.a[1])}break;case 37:if(!e){if(a.p!=1){throw new Kw('Too many percent/per mille characters in pattern "'+b+'"')}a.p=100}d.a+='%';break;case 8240:if(!e){if(a.p!=1){throw new Kw('Too many percent/per mille characters in pattern "'+b+'"')}a.p=1000}d.a+='\u2030';break;case 45:d.a+='-';break;default:d.a+=qq(f);}}}return h-c}
	function yl(a,b){var c,d,e,f,g,h;if(!a.u){xm(a.q,a.v);g=a.q.d;a.s=jq(Eq,uB,0,g,7,1);a.r=jq(Eq,uB,0,g,7,1);for(c=0;c<g;c++){a.r[c]=(ol(a.q,c)|rh(a.q,c))&xC^xC;a.s[c]=wh(a.q,c);(b&1)!=0&&(a.s[c]+=fh(a.q,c)+16<<8);(b&2)!=0&&(a.s[c]+=ph(a.q,c)<<16)}h=a.q.e;a.t=jq(Eq,uB,0,h,7,1);for(d=0;d<h;d++)a.t[d]=(pl(a.q,d)|Jh(a.q,d))&802815^786480;a.u=true}if(!a.g){xm(a.c,a.v);e=a.c.d;a.d=jq(Eq,uB,0,e,7,1);a.e=jq(Eq,uB,0,e,7,1);for(c=0;c<e;c++){a.d[c]=(ol(a.c,c)|rh(a.c,c))&xC^xC;a.e[c]=wh(a.c,c);(b&1)!=0&&(a.e[c]+=fh(a.c,c)+16<<8);(b&2)!=0&&(a.e[c]+=ph(a.c,c)<<16)}f=a.c.e;a.f=jq(Eq,uB,0,f,7,1);for(d=0;d<f;d++){a.f[d]=(pl(a.c,d)|Jh(a.c,d))&786495^786480;(b&4)!=0?(a.f[d]&2)!=0&&(a.f[d]|=8):(b&8)!=0&&(a.f[d]&2)!=0&&Aj(a.c,d)&&(a.f[d]|=8)}jl(a);il(a);a.g=true}}
	function Mk(a,b){var c,d,e,f;!!a.a&&GA(a.a);!!a.b&&GA(a.b);e=0;d=zv(b);while(d!=null&&Dx(d.substr(0,7),'M  V30 ')){d=Lx(Nx(d,7,d.length-7));while(Dx(Nx(d,d.length-1,1),'-')){c=zv(b);if(!Dx(c.substr(0,7),'M  V30 ')){return false}d=Lx(Kx(d,0,d.length-1)+Nx(c,7,c.length-7))}if(Dx(d.substr(0,5),'BEGIN')){f=Lx(Nx(d,6,d.length-6));if(Dx(f.substr(0,4),'CTAB')){e=1}else if(Dx(f.substr(0,4),'ATOM')){e=2}else if(Dx(f.substr(0,4),'BOND')){e=3}else if(Dx(f.substr(0,10),'COLLECTION')){e=4}else{tk&&(ny(),my);return false}}else if(Dx(d.substr(0,3),'END')){e=0}else if(e==1){Gk(a,d)}else if(e==2){Ck(a,d)}else if(e==3){Ek(a,d)}else if(e==4){Fk(a,d)}else{tk&&(ny(),my);return false}d=zv(b)}while(d!=null&&!(Dx(d.substr(0,6),'M  END')||Dx(d,'$$$$'))){d=zv(b)}return true}
	function ve(a,b){var c,d,e,f,g,h,i,j,k,l,m,n;if(a.L.d==0){a.f='';return}i=false;if(a._&&a.L.p>a.L.d){i=true;for(f=0;f<a.L.d;f++){if(oj(a.L,f)!=0){i=false;break}}}n=a._?16:8;ue(a);dy(a.r,i?35:33);te(a,a._?1:0,1);te(a,b?1:0,1);te(a,~~(n/2),4);l=0;for(g=1;g<a.L.d;g++)l=Ee(a,a.u[g],a.A[g]==-1?-1:a.u[a.A[g]],l);if(i){for(f=0;f<a.L.d;f++){c=a.u[f];for(k=fj(a.L,c);k<Yi(a.L,c);k++)l=Ee(a,ej(a.L,c,k),c,l)}}if(l==0){a.f='';return}d=1<<n;j=l/(d/2-1);m=l+j/2;for(h=1;h<a.L.d;h++)se(a,a.u[h],a.A[h]==-1?-1:a.u[a.A[h]],m,j,n);if(i){for(e=0;e<a.L.d;e++){c=a.u[e];for(k=fj(a.L,c);k<Yi(a.L,c);k++)se(a,ej(a.L,c,k),c,m,j,n)}}if(b){te(a,re(cj(a.L),d),n);te(a,we(th(a.L,a.u[0]),d),n);te(a,we(uh(a.L,a.u[0]),d),n);a._&&te(a,we(vh(a.L,a.u[0]),d),n)}a.f=(a.s<<=a.q,dy(a.r,a.s+64&gC),a.r.a)}
	function ml(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o;f=0;for(h=0;h<a.c.d;h++){if((rh(a.c,h)&8192)!=0){l=a.p[h];k=qh(a.c,h);n=qh(a.q,l);if(k==0)continue;if(n==0)continue;if(k==3)continue;if(n==3)continue;if(kh(a.c,h)==1){++f;continue}if(kh(a.q,l)==1)return false;if(kh(a.c,h)==2){++f;continue}if(kh(a.q,l)==2)return false;if(ul(a,h)==(k==n))return false}}if(f!=0){d=jq(Eq,uB,0,f,7,1);e=0;for(i=0;i<a.c.d;i++){if((rh(a.c,i)&8192)!=0){k=qh(a.c,i);k!=0&&k!=3&&(d[e++]=jh(a.c,i)<<24|kh(a.c,i)<<22|i)}}kA(d);e=0;while(e<d.length){j=d[e]&wC;m=a.p[j];b=d[e]&-4194304;c=ul(a,j)^qh(a.c,j)==qh(a.q,m);for(++e;e<d.length&&(d[e]&-4194304)==b;e++){g=d[e]&wC;l=a.p[g];if(kh(a.q,l)!=kh(a.q,m)||jh(a.q,l)!=jh(a.q,m))return false;o=ul(a,g)^qh(a.c,g)==qh(a.q,l);if(o!=c)return false}}}return true}
	function Kd(a,b,c){var d,e,f,g,h,i,j;if(wh(a.L,b)!=6&&wh(a.L,b)!=7)return false;e=ej(a.L,b,0);f=ej(a.L,b,1);if($i(a.L,e)!=1||$i(a.L,f)!=1)return false;if(fj(a.L,e)==1||fj(a.L,f)==1)return false;if(Yi(a.L,e)>3||Yi(a.L,f)>3)return false;g=new Rg(a.L,a.d,b,e);if(g.f&&!c)return false;h=new Rg(a.L,a.d,b,f);if(h.f&&!c)return false;if(g.f&&h.f)return false;if(c){g.f&&g.c&&(a.P[b]=true);h.f&&h.c&&(a.P[b]=true)}i=Qg(g);j=Qg(h);if(i==-1||j==-1||(i+j&1)==0){c||(a.W[b]=3);return true}d=0;switch(i+j){case 3:case 7:d=2;break;case 5:d=1;}if(c){if(a.Q&&(a.K&2)!=0||!a.Q&&(a.K&4)!=0){if(g.f){if(d==1){af(a.c[g.b],64);af(a.c[g.d],16)}else{af(a.c[g.b],16);af(a.c[g.d],64)}}if(h.f){if(d==2){af(a.c[h.b],64);af(a.c[h.d],16)}else{af(a.c[h.b],16);af(a.c[h.d],64)}}}}else{a.W[b]=d}return true}
	function Oj(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A;if((a.H[b]&3)==0||(a.H[b]&3)==3||!Bj(a,b))return;v=-1;t=-1;u=-1;s=-1;e=0;for(l=0;l<2;l++){d=a.G[l][b];for(o=0;o<a.c[d];o++){h=a.i[d][o];if(h!=b&&Hh(a,h)==1){g=a.f[d][o];w=xj(a,h,g);if(e<w){e=w;t=g;v=h;u=d;s=a.G[1-l][b]}}}}if(t==-1)return;for(m=0;m<2;m++){for(o=0;o<a.c[a.G[m][b]];o++){h=a.i[a.G[m][b]][o];h!=b&&Hh(a,h)==1&&(a.J[h]=1)}}if(a.G[1][v]!=t){a.G[0][v]=a.G[1][v];a.G[1][v]=t}i=tB;for(n=0;n<a.g[u];n++){g=a.f[u][n];a.i[u][n]!=b&&i>g&&(i=g)}q=jq(Eq,uB,0,2,7,1);r=0;for(k=0;k<a.g[s];k++)a.i[s][k]!=b&&(q[r++]=a.f[s][k]);f=Pi(a.B[u],a.C[u],a.B[s],a.C[s]);if(r==2){if(q[0]>q[1]){A=q[0];q[0]=q[1];q[1]=A}j=Qi(f,zh(a,s,q[0]));p=Qi(f,zh(a,s,q[1]));c=j-p}else{c=Qi(f,zh(a,s,q[0]))}c<0^(a.H[b]&3)==2^i==t?(a.J[v]=17):(a.J[v]=9)}
	function ol(a,b){var c,d,e,f,g,h,i;h=0;if(a.L){(a.t[b]&HB)!=0&&(h|=2);i=_i(a,b);if(i!=0){h|=8;i>2&&(h|=16);i>3&&(h|=32)}c=a.r[b];c<0?(h|=LB):c>0&&(h|=KB);e=a.g[b];switch(e){case 0:break;case 1:h|=fC;break;case 2:h|=OB;break;case 3:h|=917504;break;default:h|=1966080;}}else{(a.t[b]&HB)!=0?(h|=2):(h|=4);i=_i(a,b);i==0?(h|=112):i==2?(h|=104):i==3?(h|=88):(h|=56);c=a.r[b];c==0?(h|=167772160):c<0?(h|=LB):c>0&&(h|=KB);d=a.c[b]-a.g[b]+oj(a,b);switch(d){case 0:h|=1792;break;case 1:h|=1664;break;case 2:h|=1408;break;default:h|=896;}e=a.g[b];switch(e){case 0:h|=3932160;break;case 1:h|=3801088;break;case 2:h|=3538944;break;case 3:h|=3014656;break;default:h|=1966080;}g=a.k[b];switch(g){case 0:h|=98304;break;case 1:h|=81920;break;default:h|=49152;}}f=a.k[b];f>0&&(h|=NB);f>1&&(h|=32768);return h}
	function _g(a,b,c){var d,e,f,g;d=b.p;d>=b.N&&Ki(b,b.N*2);f=(a.t[c]&lC)>>19;e=-1;f==1?(e=qx(32,(a.t[c]&lC)>>19!=1&&(a.t[c]&lC)>>19!=2?-1:(a.t[c]&mC)>>21)):f==2&&(e=qx(32,(a.t[c]&lC)>>19!=1&&(a.t[c]&lC)>>19!=2?-1:(a.t[c]&mC)>>21));b.F[d]=a.F[c];b.r[d]=a.r[c];b.w[d]=a.w[c];b.t[d]=a.t[c];b.A[d]=b.L?a.A[c]:0;b.B[d]=a.B[c];b.C[d]=a.C[c];b.D[d]=a.D[c];b.v[d]=a.v[c];b.u!=null&&(b.u[d]=null);if(a.u!=null&&a.u[c]!=null&&b.L){b.u==null&&(b.u=jq(Eq,cC,5,b.F.length,0,2));b.u[d]=jq(Eq,uB,0,a.u[c].length,7,1);for(g=0;g<a.u[c].length;g++)b.u[d][g]=a.u[c][g]}b.s!=null&&(b.s[d]=null);if(a.s!=null&&a.s[c]!=null){b.s==null&&(b.s=jq(Aq,GB,9,b.F.length,0,2));b.s[d]=jq(Aq,eC,0,a.s[c].length,7,1);for(g=0;g<a.s[c].length;g++)b.s[d][g]=a.s[c][g]}if(e!=-1){b.t[d]&=-65011713;b.t[d]|=e<<21}++b.p;b.R=0;return d}
	function $m(){$m=rt;Zm=mq(iq(Dq,1),xB,0,7,[3.240000009536743,12.359999656677246,23.790000915527344,11.680000305175781,13.600000381469727,GC,12.029999732971191,21.940000534057617,23.850000381469727,26.020000457763672,0,GC,4.360000133514404,4.440000057220459,13.970000267028809,16.610000610351562,25.59000015258789,27.639999389648438,12.890000343322754,4.409999847412109,4.929999828338623,8.390000343322754,15.789999961853027,4.099999904632568,3.880000114440918,14.140000343322754,9.229999542236328,12.529999732971191,17.06999969482422,20.229999542236328,23.059999465942383,13.140000343322754,25.299999237060547,32.09000015258789,19.209999084472656,8.380000114440918,38.79999923706055,28.239999771118164,21.700000762939453,13.59000015258789,34.13999938964844,9.8100004196167,23.469999313354492])}
	function Pe(a){var b,c,d,e,f,g,h,i,j,k,l;for(b=0;b<a.L.d;b++){if(a.W[b]==1||a.W[b]==2){i=false;if($i(a.L,b)!=0&&fj(a.L,b)==2&&hj(a.L,b,0)==2&&hj(a.L,b,1)==2){for(h=0;h<fj(a.L,b);h++){e=ej(a.L,b,h);l=0;k=jq(Eq,uB,0,3,7,1);for(j=0;j<fj(a.L,e);j++){k[l]=ej(a.L,e,j);k[l]!=b&&++l}l==2&&a.d[k[0]]>a.d[k[1]]^k[0]<k[1]&&(i=!i)}}else{for(h=1;h<fj(a.L,b);h++){for(j=0;j<h;j++){f=ej(a.L,b,h);g=ej(a.L,b,j);a.d[f]>a.d[g]&&(i=!i);f<g&&(i=!i)}}}si(a.L,b,a.W[b]==1^i?1:2,a.X[b])}else{si(a.L,b,a.W[b],a.X[b])}}for(c=0;c<a.L.e;c++){if(a.n[c]==1||a.n[c]==2){i=false;for(h=0;h<2;h++){d=Ah(a.L,h,c);if(fj(a.L,d)==3){k=jq(Eq,uB,0,2,7,1);l=0;for(j=0;j<3;j++)ej(a.L,d,j)!=Ah(a.L,1-h,c)&&(k[l++]=ej(a.L,d,j));a.d[k[0]]>a.d[k[1]]&&(i=!i);k[0]<k[1]&&(i=!i)}}Di(a.L,c,a.n[c]==1^i?1:2,a.o[c])}else{Di(a.L,c,a.n[c],a.o[c])}}}
	function og(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u;b=Uf(a);f=jq(Aq,eC,0,a.d,7,1);kg(a,f,b);for(e=0;e<a.d;e++)f[e]==2&&(Ej(a.i,Ah(a.i,0,e))||Ej(a.i,Ah(a.i,1,e)))&&(f[e]=3);for(n=0;n<a.f.a.length;n++){l=Hz(a.f,n);i=wg(l);r=l.f;q=new Eg(a,l);p=-1;for(m=0;m<224&&i.a.length!=0;m++){j=BA(a.j,i.a.length);h=(Ip(j,i.a.length),i.a[j]);g=cg(a,h[0],h[1]);c=jq(Eq,uB,0,g.length,7,1);d=0;if(m<32){for(o=1;o<g.length-1;o++)f[g[o]]==3&&(c[d++]=g[o])}else if(m<96){for(o=1;o<g.length-1;o++)f[g[o]]>=2&&(c[d++]=g[o])}else{for(o=1;o<g.length-1;o++)f[g[o]]>=1&&(c[d++]=g[o])}if(d!=0){t=c[0];if(d>1){do{t=c[BA(a.j,d)]}while(t==p)}if(t!=p){p=t;vg(l,t);i=wg(l);if(r>l.f){r=l.f;q=new Eg(a,l)}}}}Kz(a.f,n,q);l=q;k=1;do{s=9999;for(o=0;o<l.a.length;o++){u=b[l.a[o]];u==k?Bg(l,o):u>k&&u<s&&(s=u)}k=s}while(s!=9999)}}
	function Fk(a,b){var c,d,e,f,g,h;h=Bk(b);if(h!=null){g=Hk(b,h);if(Dx(b.substr(0,13),'MDLV30/STEABS')){if(Dx(h,'ATOMS'))for(f=0;f<g.length;f++)mi(a.c,xk(a,g[f]),0,-1);else for(e=0;e<g.length;e++)Ci(a.c,yk(a,g[e]),0,-1)}else if(Dx(b.substr(0,13),'MDLV30/STERAC')){d=xw(Kx(b,13,Ak(b,13)));if(Dx(h,'ATOMS'))for(f=0;f<g.length;f++)mi(a.c,xk(a,g[f]),1,d-1);else for(e=0;e<g.length;e++)Ci(a.c,yk(a,g[e]),1,d-1)}else if(Dx(b.substr(0,13),'MDLV30/STEREL')){d=xw(Kx(b,13,Ak(b,13)));if(Dx(h,'ATOMS'))for(f=0;f<g.length;f++)mi(a.c,xk(a,g[f]),2,d-1);else for(e=0;e<g.length;e++)Ci(a.c,yk(a,g[e]),2,d-1)}else if(Dx(b.substr(0,13),'MDLV30/HILITE')){if(Dx(h,'ATOMS')){for(e=0;e<g.length;e++)ii(a.c,xk(a,g[e]))}else{for(e=0;e<g.length;e++){c=yk(a,g[e]);ii(a.c,Ah(a.c,0,c));ii(a.c,Ah(a.c,1,c))}}}else{tk&&(ny(),my)}}}
	function Od(a,b,c){var d,e,f,g,h,i,j;f=jq(Dq,xB,0,3,7,1);f[0]=th(a.L,c.a)-th(a.L,b.a);f[1]=uh(a.L,c.a)-uh(a.L,b.a);f[2]=vh(a.L,c.a)-vh(a.L,b.a);i=jq(Dq,xB,0,3,7,1);i[0]=th(a.L,b.b)-th(a.L,b.a);i[1]=uh(a.L,b.b)-uh(a.L,b.a);i[2]=vh(a.L,b.b)-vh(a.L,b.a);j=jq(Dq,xB,0,3,7,1);j[0]=th(a.L,c.b)-th(a.L,c.a);j[1]=uh(a.L,c.b)-uh(a.L,c.a);j[2]=vh(a.L,c.b)-vh(a.L,c.a);g=jq(Dq,xB,0,3,7,1);g[0]=f[1]*i[2]-f[2]*i[1];g[1]=f[2]*i[0]-f[0]*i[2];g[2]=f[0]*i[1]-f[1]*i[0];h=jq(Dq,xB,0,3,7,1);h[0]=f[1]*g[2]-f[2]*g[1];h[1]=f[2]*g[0]-f[0]*g[2];h[2]=f[0]*g[1]-f[1]*g[0];d=(i[0]*h[0]+i[1]*h[1]+i[2]*h[2])/(Math.sqrt(i[0]*i[0]+i[1]*i[1]+i[2]*i[2])*Math.sqrt(h[0]*h[0]+h[1]*h[1]+h[2]*h[2]));e=(j[0]*h[0]+j[1]*h[1]+j[2]*h[2])/(Math.sqrt(j[0]*j[0]+j[1]*j[1]+j[2]*j[2])*Math.sqrt(h[0]*h[0]+h[1]*h[1]+h[2]*h[2]));return d<0^e<0?1:2}
	function Dj(a,b){var c,d,e,f,g,h,i,j,k,l,m;if(a.F[b]!=7)return false;if((a.t[b]&HB)!=0||a.k[b]!=0||(a.A[b]&QB)!=0)return true;if(a.r[b]==1)return false;f=0;for(h=0;h<a.g[b];h++){if(a.j[b][h]==1){c=a.F[a.f[b][h]];(c==8||c==9||c==17)&&++f}}if(f==0){for(g=0;g<a.g[b];g++){d=a.f[b][g];if(a.k[d]!=0){if((a.t[d]&HB)!=0){if((!!a.n&&d<a.d?Wk(a.n,d):0)>=5){m=0;for(k=0;k<a.g[d];k++){l=a.f[d][k];l!=b&&a.g[l]>=3&&++m}if(m==2||m==1&&a.g[b]==3)continue}return true}for(j=0;j<a.g[d];j++){if((a.j[d][j]==2||Aj(a,a.i[d][j]))&&Ij(a,a.f[d][j]))return true}}}}if(f<2){for(g=0;g<a.g[b];g++){d=a.f[b][g];i=false;e=false;for(j=0;j<a.g[d];j++){if(a.f[d][j]!=b){a.j[d][j]!=1&&(a.F[a.f[d][j]]==7||a.F[a.f[d][j]]==8||a.F[a.f[d][j]]==16)&&(i=true);a.j[d][j]==1&&a.F[a.f[d][j]]==7&&(e=true)}}if(i&&(!e||f==0))return true}}return false}
	function Ui(a,b){var c,d,e,f,g,h,i,j,k,l,m;if((b&~a.R)==0)return;if((a.R&1)==0){yj(a);Ti(a);a.R|=1;if(Qj(a)){yj(a);Ti(a)}}if((b&~a.R)==0)return;if((a.R&2)==0){for(d=0;d<a.d;d++)a.t[d]&=-31753;for(g=0;g<a.e;g++)a.H[g]&=-961;Xi(a);for(f=0;f<a.e;f++){if(a.J[f]==64){a.t[a.G[0][f]]|=HB;a.t[a.G[1][f]]|=HB;a.H[f]|=256;a.H[f]|=512}}for(e=0;e<a.d;e++){for(l=0;l<a.g[e];l++){j=a.i[e][l];if((a.H[j]&256)!=0)continue;i=a.f[e][l];for(m=0;m<a.g[i];m++){if(a.i[i][m]==j)continue;a.j[i][m]>1&&(a.F[a.f[i][m]]==6?(a.t[e]|=8192):!Aj(a,a.i[i][m])&&Xh(a,a.f[i][m])&&(a.t[e]|=NB))}}}while(true){k=false;for(c=0;c<a.d;c++){if(a.k[c]>0&&(20480&a.t[c])==NB){for(l=0;l<a.g[c];l++){if(a.j[c][l]>1){i=a.f[c][l];j=a.i[c][l];for(m=0;m<a.g[i];m++){if(a.i[i][m]!=j){h=a.f[i][m];if((a.t[h]&NB)==0){a.t[h]|=NB;k=true}}}}}}}if(!k)break}a.R|=2}}
	function Ie(a){var b,c,d,e,f,g,h,i,j,k,l;a.S=jq(Aq,eC,0,a.L.d,7,1);for(b=0;b<a.L.d;b++){if(a.W[b]==1||a.W[b]==2){i=false;if(fj(a.L,b)==2&&hj(a.L,b,0)==2&&hj(a.L,b,1)==2){for(h=0;h<fj(a.L,b);h++){e=ej(a.L,b,h);l=0;k=jq(Eq,uB,0,3,7,1);for(j=0;j<fj(a.L,e);j++){k[l]=ej(a.L,e,j);k[l]!=b&&++l}l==2&&a.d[k[0]]>a.d[k[1]]^a.C[k[0]]<a.C[k[1]]&&(i=!i)}}else{for(h=1;h<fj(a.L,b);h++){for(j=0;j<h;j++){f=ej(a.L,b,h);g=ej(a.L,b,j);a.d[f]>a.d[g]&&(i=!i);a.C[f]<a.C[g]&&(i=!i)}}}a.S[b]=a.W[b]==1^i?1:2}else{a.S[b]=a.W[b]}}a.i=jq(Aq,eC,0,a.L.e,7,1);for(c=0;c<a.L.e;c++){if(a.n[c]==1||a.n[c]==2){i=false;for(h=0;h<2;h++){d=Ah(a.L,h,c);if(fj(a.L,d)==3){k=jq(Eq,uB,0,2,7,1);l=0;for(j=0;j<3;j++)ej(a.L,d,j)!=Ah(a.L,1-h,c)&&(k[l++]=ej(a.L,d,j));a.d[k[0]]>a.d[k[1]]&&(i=!i);a.C[k[0]]<a.C[k[1]]&&(i=!i)}}a.i[c]=a.n[c]==1^i?1:2}else{a.i[c]=a.n[c]}}}
	function qe(a){var b,c,d,e,f,g,h,i,j,k,l,m;f=0;k=0;g=0;h=0;i=0;j=0;l=0;m=false;b=jq(jt,yB,0,32,8,1);for(c=0;c<a.L.d;c++){if(a.W[c]!=0){++f;if(a.W[c]==3){++k}else{if(a.U[c]==0){++g;!!a.J&&of(a.J,c)&&++h}else if(a.U[c]==2){a.T[c]==0&&++j}else if(a.U[c]==1){e=a.T[c];if(!b[e]){++l;b[e]=true}a.T[c]==0&&++i;!!a.J&&of(a.J,c)&&(m=true)}}}}for(d=0;d<a.L.e;d++){if(a.n[d]!=0&&Kh(a.L,d)==1){++f;if(a.n[d]==3){++k}else{if(a.k[d]==0){++g;!!a.J&&of(a.J,Ah(a.L,0,d))&&of(a.J,Ah(a.L,1,d))&&++h}else if(a.k[d]==2){a.j[d]==0&&++j}else if(a.k[d]==1){e=a.j[d];if(!b[e]){++l;b[e]=true}a.j[d]==0&&++i;!!a.J&&of(a.J,Ah(a.L,0,d))&&of(a.J,Ah(a.L,1,d))&&(m=true)}}}}if(f==0){Hi(a.L,aC);return}if(k!=0){Hi(a.L,0);return}if(a.G){Hi(a.L,fC+(1<<l));return}i+h==f&&!m?Hi(a.L,196608):g==f?Hi(a.L,WB):j==f?Hi(a.L,327680):g==f-1&&i==1?Hi(a.L,OB):Hi(a.L,458752+(1<<l))}
	function Lj(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B;if(a.g[b]!=2||a.j[b][0]!=2||a.j[b][1]!=2||a.g[a.f[b][0]]<2||a.g[a.f[b][1]]<2||a.k[a.f[b][0]]!=1||a.k[a.f[b][1]]!=1){si(a,b,0,false);return}w=-1;v=-1;u=-1;r=-1;f=0;for(l=0;l<2;l++){d=a.f[b][l];for(p=0;p<a.c[d];p++){g=a.f[d][p];if(g!=b){h=a.i[d][p];A=xj(a,h,g);if(f<A){f=A;v=g;w=h;u=d;r=a.f[b][1-l]}}}}if(v==-1)return;for(m=0;m<2;m++)for(o=0;o<a.c[a.f[b][m]];o++)a.f[a.f[b][m]][o]!=b&&(a.J[a.i[a.f[b][m]][o]]=1);if(a.G[1][w]!=v){a.G[0][w]=a.G[1][w];a.G[1][w]=v}i=tB;for(n=0;n<a.g[u];n++){g=a.f[u][n];g!=b&&i>g&&(i=g)}s=jq(Eq,uB,0,2,7,1);t=0;for(k=0;k<a.g[r];k++){g=a.f[r][k];g!=b&&(s[t++]=g)}c=Pi(a.B[b],a.C[b],a.B[r],a.C[r]);if(t==2){if(s[0]>s[1]){B=s[0];s[0]=s[1];s[1]=B}j=Qi(c,zh(a,r,s[0]));q=Qi(c,zh(a,r,s[1]));e=j-q}else{e=Qi(c,zh(a,r,s[0]))}e<0^(a.t[b]&3)==1^i==v?(a.J[w]=17):(a.J[w]=9)}
	function vg(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v;a.g==null&&(a.g=jq(Eq,cC,5,a.r.d,0,2));if(a.g[b]==null){m=jq(Eq,uB,0,a.a.length,7,1);s=jq(jt,yB,0,a.r.b,8,1);d=Ah(a.p,0,b);e=Ah(a.p,1,b);m[0]=d;s[d]=true;j=0;n=0;while(j<=n){for(p=0;p<a.r.e[m[j]];p++){f=ej(a.p,m[j],p);if(!s[f]&&f!=e){m[++n]=f;s[f]=true}}if(j==n)break;++j}l=n+1>~~(a.a.length/2);if((a.r.g&6)!=0){h=false;g=false;for(p=0;p<a.a.length;p++){Yh(a.p,a.a[p])&&(s[a.a[p]]?(h=true):(g=true))}h!=g&&(l=h)}i=2;a.g[b]=jq(Eq,uB,0,l?a.a.length-n:n+2,7,1);for(q=0;q<a.a.length;q++){a.a[q]==d?(a.g[b][l?0:1]=q):a.a[q]==e?(a.g[b][l?1:0]=q):l^s[a.a[q]]&&(a.g[b][i++]=q)}}u=a.c[a.g[b][0]];v=a.d[a.g[b][0]];t=bk(u,v,a.c[a.g[b][1]],a.d[a.g[b][1]]);for(o=2;o<a.g[b].length;o++){r=a.g[b][o];k=tx((a.c[r]-u)*(a.c[r]-u)+(a.d[r]-v)*(a.d[r]-v));c=2*t-bk(u,v,a.c[r],a.d[r]);a.c[r]=u+k*sx(c);a.d[r]=v+k*jx(c)}}
	function Pc(a){var b,c,d,e,f,g,h,i,j,k;a.n=jq(Wr,GB,27,a.D.p,0,1);for(g=0;g<a.D.q;g++)(Kh(a.D,g)==2||Kh(a.D,g)==26||Kh(a.D,g)==64)&&Sc(a,g);for(h=0;h<a.D.q;h++)Kh(a.D,h)!=2&&Kh(a.D,h)!=26&&Kh(a.D,h)!=64&&Sc(a,h);if((a.B&64)==0){for(f=0;f<a.D.q;f++){if(Dh(a.D,f)!=0){switch(Dh(a.D,f)){case 1:i=Hh(a.D,f)==2?'E':Vh(a.D,f)?'p':'P';break;case 2:i=Hh(a.D,f)==2?'Z':Vh(a.D,f)?'m':'M';break;default:i='?';}Zl(a,~~((a.L*2+1)/3));hd(a,Uh(a.D,f)?-3:128);b=Ah(a.D,0,f);c=Ah(a.D,1,f);j=(Kg(a.G,th(a.D,b))+Kg(a.G,th(a.D,c)))/2;k=(Lg(a.G,uh(a.D,b))+Lg(a.G,uh(a.D,c)))/2;d=(Kg(a.G,th(a.D,b))-Kg(a.G,th(a.D,c)))/3;e=(Lg(a.G,uh(a.D,b))-Lg(a.G,uh(a.D,c)))/3;Vc(a,j+e,k-d,i,true,true);hd(a,a.A);Zl(a,a.L)}}}if((a.B&4)!=0){Zl(a,~~((a.L*2+1)/3));hd(a,384);for(f=0;f<a.D.q;f++){b=Ah(a.D,0,f);c=Ah(a.D,1,f);j=(Kg(a.G,th(a.D,b))+Kg(a.G,th(a.D,c)))/2;k=(Lg(a.G,uh(a.D,b))+Lg(a.G,uh(a.D,c)))/2;Vc(a,j,k,''+f,true,true)}hd(a,a.A);Zl(a,a.L)}}
	function Bg(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v;o=a.c[b];s=a.d[b];f=jq(ar,GB,13,4,0,1);k=0;for(l=0;l<a.e.length;l++){if(k>=4)break;if(b==a.b[Ah(a.p,0,a.e[l])]||b==a.b[Ah(a.p,1,a.e[l])])continue;p=a.c[a.b[Ah(a.p,0,a.e[l])]];t=a.d[a.b[Ah(a.p,0,a.e[l])]];q=a.c[a.b[Ah(a.p,1,a.e[l])]];u=a.d[a.b[Ah(a.p,1,a.e[l])]];h=Math.sqrt((p-o)*(p-o)+(t-s)*(t-s));i=Math.sqrt((q-o)*(q-o)+(u-s)*(u-s));e=Math.sqrt((q-p)*(q-p)+(u-t)*(u-t));if(h<e&&i<e){if(p==q){g=o-p<=0?0-(o-p):o-p;g<0.5&&(f[k++]=new _j(bk(p,s,o,s),(0.5-g)/2))}else if(t==u){g=s-t<=0?0-(s-t):s-t;g<0.5&&(f[k++]=new _j(bk(o,t,o,s),(0.5-g)/2))}else{m=(u-t)/(q-p);n=-1/m;c=t-m*p;d=s-n*o;r=(d-c)/(m-n);v=m*r+c;g=Math.sqrt((r-o)*(r-o)+(v-s)*(v-s));g<0.5&&(f[k++]=new _j(bk(r,v,o,s),(0.5-g)/2))}continue}if(h<0.5){f[k++]=new _j(bk(p,t,o,s),(0.5-h)/2);continue}if(i<0.5){f[k++]=new _j(bk(q,u,o,s),(0.5-i)/2);continue}}if(k>0){j=rg(f,k);a.c[b]+=j.b*sx(j.a);a.d[b]+=j.b*jx(j.a)}}
	function fm(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p;d=true;i=0;p=0;m=a.i;a.c[b]=m;h=wh(a.b,b);g=lh(a.b,b);e=fh(a.b,b);f=ph(a.b,b);k=fj(a.b,b);e==0&&f==0&&em(h)&&(d=false);a.e[m]='';if(c!=-1){switch(Hh(a.b,c)){case 0:a.e[m]+='~';break;case 2:a.e[m]+='=';break;case 3:a.e[m]+='#';}}d&&(a.e[m]+='[');f!=0&&(a.e[m]+=''+f);a.e[m]+=g;if(d){if(0<(o=oj(a.b,b))){a.e[m]+='H';1<o&&(a.e[m]+=o)}}if(e!=0){e>0?(a.e[m]+='+'):(a.e[m]+='-');(e<0?-e:e)>1&&(a.e[m]+=''+(e<0?-e:e))}d&&(a.e[m]+=']');c!=-1&&(a.j[c]=true);a.g[b]=true;++a.i;for(n=0;n<k;++n)a.j[gj(a.b,b,n)]||++i;for(n=0;n<k;++n){j=ej(a.b,b,n);l=gj(a.b,b,n);if(a.j[l]){++p;continue}if(a.g[j]){++a.d;a.j[l]=true;switch(Hh(a.b,l)){case 0:a.e[a.c[j]]+='~';a.e[m]+='~';break;case 2:a.e[a.c[j]]+='=';a.e[m]+='=';break;case 3:a.e[a.c[j]]+='#';a.e[m]+='3';}if(a.d>9){a.e[a.c[j]]+='%';a.e[m]+='%'}a.e[a.c[j]]+=''+a.d;a.e[m]+=''+a.d;continue}n-p<i-1&&(a.e[a.i++]='(');fm(a,j,l);n-p<i-1&&(a.e[a.i++]=')')}}
	function $p(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o,p;f=-1;g=0;p=0;h=0;j=-1;k=b.length;n=c;l=true;for(;n<k&&l;++n){e=b.charCodeAt(n);switch(e){case 35:p>0?++h:++g;j>=0&&f<0&&++j;break;case 48:if(h>0){throw new Kw("Unexpected '0' in pattern \""+b+'"')}++p;j>=0&&f<0&&++j;break;case 44:j=0;break;case 46:if(f>=0){throw new Kw('Multiple decimal separators in pattern "'+b+'"')}f=g+p+h;break;case 69:if(!d){if(a.v){throw new Kw('Multiple exponential symbols in pattern "'+b+'"')}a.v=true;a.k=0}while(n+1<k&&b.charCodeAt(n+1)==48){++n;d||++a.k}if(!d&&g+p<1||a.k<1){throw new Kw('Malformed exponential pattern "'+b+'"')}l=false;break;default:--n;l=false;}}if(p==0&&g>0&&f>=0){m=f;f==0&&++m;h=g-m;g=m-1;p=1}if(f<0&&h>0||f>=0&&(f<g||f>g+p)||j==0){throw new Kw('Malformed pattern "'+b+'"')}if(d){return n-c}o=g+p+h;a.i=f>=0?o-f:0;if(f>=0){a.n=g+p-f;a.n<0&&(a.n=0)}i=f>=0?f:o;a.o=i-g;if(a.v){a.j=g+a.o;a.i==0&&a.o==0&&(a.o=1)}a.f=j>0?j:0;a.c=f==0||f==o;return n-c}
	function Uk(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p;m=Hz(a.i,b);n=Hz(a.j,b);o=n.length;f=0;e=0;p=false;for(l=0;l<o;l++){f<<=1;e<<=1;if(Hh(a.g,n[l])>1||Kh(a.g,n[l])==64)f|=1;else{d=c[b][l];if(d!=-1){if(a.a[d]){if(a.e[d]){f|=1;a.f[d]||(e|=1)}}else{p=true}}}}j=false;switch(o){case 5:g=mq(iq(Eq,1),uB,0,7,[10,5,18,9,20]);j=true;for(k=0;k<5;k++){if((f&g[k])==g[k]){switch(wh(a.g,m[k])){case 6:if(fh(a.g,m[k])==-1){a.e[b]=true;a.d[b]=k;(e&g[k])==0&&(j=false)}break;case 7:if(fh(a.g,m[k])<=0){a.e[b]=true;a.d[b]=k}break;case 8:a.e[b]=true;a.d[b]=k;break;case 16:if(fj(a.g,m[k])==2){a.e[b]=true;a.d[b]=k}}}}break;case 6:j=true;if((f&21)==21){a.e[b]=true;(e&21)==0&&(j=false)}if((f&42)==42){a.e[b]=true;(e&42)==0&&(j=false)}break;case 7:h=mq(iq(Eq,1),uB,0,7,[42,21,74,37,82,41,84]);j=true;for(i=0;i<7;i++){if((f&h[i])==h[i]){if(wh(a.g,m[i])==6&&fh(a.g,m[i])==1){a.e[b]=true;a.d[b]=i;(e&h[i])==0&&(j=false)}}}}a.e[b]&&!j&&(a.f[b]=true);if(a.e[b])return true;return !p}
	function gl(a,b,c){var d,e,f,g,h,i,j,k,l,m;i=fj(a.q,b);e=fj(a.c,c);if(e>i)return false;k=rh(a.q,b);g=rh(a.c,c);f=mh(a.c,c);j=mh(a.q,b);if((g&1)!=0){if(f!=null){if((k&1)!=0){if(j==null)return false;if(!tl(f,j))return false}else{if(j!=null){if(vl(j,f))return false}else{if(sl(wh(a.q,b),f))return false}}}}else{if((k&1)!=0)return false;if(f!=null){if(j!=null){if(!tl(j,f))return false}else{if(!sl(wh(a.q,b),f))return false}}else{if(j!=null)return false;if(a.s[b]!=a.e[c])return false}}if((k|g)!=0){if((g&RB)!=0){if(a.q.L&&(k&RB)==0)return false;else if(e!=i)return false}if((g&HB)!=0){if(e>=i&&(k&HB)==0)return false}}if((a.r[b]&~a.d[c])!=0)return false;if(fh(a.c,c)!=0&&fh(a.c,c)!=fh(a.q,b))return false;if(ph(a.c,c)!=0&&ph(a.c,c)!=ph(a.q,b))return false;m=(rh(a.c,c)&PB)>>22;if(m!=0){if(a.q.L&&m==(rh(a.q,c)&PB)>>22)return true;d=false;l=tj(a.q);for(h=0;h<l.i.a.length;h++){if(Hz(l.j,h).length==m){if(al(l,h,b)){d=true;break}}}if(!d)return false}return true}
	function Rd(a,b,c){var d,e,f,g,h,i,j,k,l,m;m=mq(iq(Eq,2),cC,5,0,[mq(iq(Eq,1),uB,0,7,[2,1,2,1]),mq(iq(Eq,1),uB,0,7,[1,2,2,1]),mq(iq(Eq,1),uB,0,7,[1,1,2,2]),mq(iq(Eq,1),uB,0,7,[2,1,1,2]),mq(iq(Eq,1),uB,0,7,[2,2,1,1]),mq(iq(Eq,1),uB,0,7,[1,2,1,2])]);d=jq(Dq,xB,0,Yi(a.L,b),7,1);for(g=0;g<Yi(a.L,b);g++)d[g]=zh(a.L,ej(a.L,b,c[g]),b);j=jj(a.L,b,c,d,null)<<24>>24;if(j!=3)return j;k=0;l=0;for(h=0;h<Yi(a.L,b);h++){e=gj(a.L,b,c[h]);if(Ah(a.L,0,e)==b){if(Kh(a.L,e)==9){l!=0&&Ni(a.L,b);k=h;l=1}if(Kh(a.L,e)==17){l!=0&&Ni(a.L,b);k=h;l=2}}}if(l==0)return 3;for(f=1;f<Yi(a.L,b);f++)d[f]<d[0]&&(d[f]+=BB);if(Yi(a.L,b)==3){switch(k){case 0:(d[1]<d[2]&&d[2]-d[1]<CB||d[1]>d[2]&&d[1]-d[2]>CB)&&(l=3-l);break;case 1:d[2]-d[0]>CB&&(l=3-l);break;case 2:d[1]-d[0]<CB&&(l=3-l);}return l==1?2:1}i=0;d[1]<=d[2]&&d[2]<=d[3]?(i=0):d[1]<=d[3]&&d[3]<=d[2]?(i=1):d[2]<=d[1]&&d[1]<=d[3]?(i=2):d[2]<=d[3]&&d[3]<=d[1]?(i=3):d[3]<=d[1]&&d[1]<=d[2]?(i=4):d[3]<=d[2]&&d[2]<=d[1]&&(i=5);return m[i][k]==l?2:1}
	function wu(){var a,b,c;b=$doc.compatMode;a=mq(iq(Cs,1),GB,2,4,['CSS1Compat']);for(c=0;c<a.length;c++){if(Dx(a[c],b)){return}}a.length==1&&Dx('CSS1Compat',a[0])&&Dx('BackCompat',b)?"GWT no longer supports Quirks Mode (document.compatMode=' BackCompat').<br>Make sure your application's host HTML page has a Standards Mode (document.compatMode=' CSS1Compat') doctype,<br>e.g. by using &lt;!doctype html&gt; at the start of your application's HTML page.<br><br>To continue using this unsupported rendering mode and risk layout problems, suppress this message by adding<br>the following line to your*.gwt.xml module file:<br>&nbsp;&nbsp;&lt;extend-configuration-property name=\"document.compatMode\" value=\""+b+'"/&gt;':"Your *.gwt.xml module configuration prohibits the use of the current document rendering mode (document.compatMode=' "+b+"').<br>Modify your application's host HTML page doctype, or update your custom "+"'document.compatMode' configuration property settings."}
	function ze(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v;if(a.L.d==0)return;if(a.B)return;a.D=0;v=0;for(c=1;c<a.L.d;c++)a.d[c]>a.d[v]&&(v=c);d=jq(jt,yB,0,a.L.d,8,1);g=jq(jt,yB,0,a.L.e,8,1);a.C=jq(Eq,uB,0,a.L.d,7,1);a.u=jq(Eq,uB,0,a.L.d,7,1);a.A=jq(Eq,uB,0,a.L.d,7,1);a.v=jq(Eq,uB,0,a.L.e,7,1);a.u[0]=v;a.C[v]=0;d[v]=true;e=1;i=0;j=1;k=0;while(i<a.L.d){if(i<j){while(true){o=0;p=0;m=-1;for(q=0;q<fj(a.L,a.u[i]);q++){h=ej(a.L,a.u[i],q);if(!d[h]&&a.d[h]>m){o=h;p=gj(a.L,a.u[i],q);m=a.d[h]}}if(m==-1)break;a.C[o]=j;a.A[j]=i;a.u[j++]=o;a.v[k++]=p;d[o]=true;g[p]=true}++i}else{n=0;m=-1;for(b=0;b<a.L.d;b++){if(!d[b]&&a.d[b]>m){n=b;m=a.d[b]}}++e;a.C[n]=j;a.A[j]=-1;a.u[j++]=n;d[n]=true}}a.w=jq(Eq,uB,0,2*(a.L.e-k),7,1);while(true){s=a.L.N;t=a.L.N;u=-1;for(f=0;f<a.L.e;f++){if(!g[f]){if(a.C[Ah(a.L,0,f)]<a.C[Ah(a.L,1,f)]){r=a.C[Ah(a.L,0,f)];l=a.C[Ah(a.L,1,f)]}else{r=a.C[Ah(a.L,1,f)];l=a.C[Ah(a.L,0,f)]}if(r<s||r==s&&l<t){s=r;t=l;u=f}}}if(u==-1)break;g[u]=true;a.v[k++]=u;a.w[2*a.D]=s;a.w[2*a.D+1]=t;++a.D}a.B=true}
	function fl(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r;this.g=a;this.i=new Mz;this.j=new Mz;this.b=jq(Eq,uB,0,this.g.d,7,1);this.c=jq(Eq,uB,0,this.g.e,7,1);this.g.cb(1);m=jq(jt,yB,0,this.g.d,8,1);n=jq(jt,yB,0,this.g.e,8,1);do{g=false;for(c=0;c<this.g.d;c++){if(!m[c]){p=0;for(l=0;l<fj(this.g,c);l++)m[ej(this.g,c,l)]||++p;if(p<2){m[c]=true;for(k=0;k<fj(this.g,c);k++)n[gj(this.g,c,k)]=true;g=true}}}}while(g);r=0;while(r<this.g.d&&m[r])++r;if(r==this.g.d)return;i=jq(Eq,uB,0,this.g.d,7,1);i[0]=r;h=jq(Eq,uB,0,this.g.d,7,1);h[r]=1;f=0;j=0;o=1;while(f<=j){for(k=0;k<fj(this.g,i[f]);k++){e=ej(this.g,i[f],k);if(h[e]!=0){Sk(this,gj(this.g,i[f],k),m);continue}if(!m[e]){h[e]=o;i[++j]=e}}++f;if(f>j){for(c=0;c<this.g.d;c++){if(h[c]==0&&!m[c]){h[c]=++o;i[++j]=c;break}}}}if((b&4)!=0){this.a=jq(jt,yB,0,this.i.a.length,8,1);this.e=jq(jt,yB,0,this.i.a.length,8,1);this.f=jq(jt,yB,0,this.i.a.length,8,1);this.d=jq(Eq,uB,0,this.i.a.length,7,1);Tk(this)}if((b&2)!=0){for(d=0;d<this.g.e;d++){if(!n[d]){q=Vk(this,d,m);q!=null&&dl(this,q,$k(this,q))}}}}
	function Qd(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o;if(a.W[b]!=0)return false;if(wh(a.L,b)!=6&&wh(a.L,b)!=7&&wh(a.L,b)!=14&&wh(a.L,b)!=15&&wh(a.L,b)!=16)return false;if($i(a.L,b)!=0){if(fj(a.L,b)==2&&hj(a.L,b,0)==2&&hj(a.L,b,1)==2)return Kd(a,b,c);if(wh(a.L,b)!=15&&wh(a.L,b)!=16)return false}if(fj(a.L,b)<3||Yi(a.L,b)>4)return false;if(wh(a.L,b)==7&&!a.M[b])return false;n=jq(Eq,uB,0,4,7,1);o=jq(Eq,uB,0,4,7,1);j=jq(jt,yB,0,4,8,1);for(h=0;h<Yi(a.L,b);h++){f=-1;e=0;for(i=0;i<Yi(a.L,b);i++){if(!j[i]){if(f<a.d[ej(a.L,b,i)]){f=a.d[ej(a.L,b,i)];e=i}}}n[h]=e;o[h]=f;j[e]=true}if(Yi(a.L,b)==4&&o[0]==o[1]&&o[2]==o[3])return false;if(Yi(a.L,b)==4&&(o[0]==o[2]||o[1]==o[3]))return false;if(Yi(a.L,b)==3&&o[0]==o[2])return false;k=0;l=0;m=false;for(g=1;g<Yi(a.L,b);g++){if(o[g-1]==o[g]){if(!c||o[g]==0)return false;k=ej(a.L,b,n[g-1]);l=ej(a.L,b,n[g]);Fj(a.L,gj(a.L,b,n[g]))&&(a.P[b]=true);m=true}}if(c&&!m)return false;d=a._?Sd(a,b,n):Rd(a,b,n);if(c){if(a.Q&&(a.K&2)!=0||!a.Q&&(a.K&4)!=0){if(d==1){af(a.c[k],IB);af(a.c[l],256)}else if(d==2){af(a.c[k],256);af(a.c[l],IB)}}}else{a.W[b]=d}return true}
	function Gd(){Gd=rt;Ed=mq(iq(it,1),bC,0,7,[-1,-1,-1,0,0,1,2,3,4,5,-1,0,0,0,6,7,8,9,-1,0,0,10,10,10,10,10,10,10,10,10,10,1,11,11,12,13,-1,0,0,10,10,10,10,10,10,10,10,10,10,0,0,0,11,14,-1,0,0,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,10,10,10,10,10,10,10,10,1,1,1,1,-1,-1,-1,-1,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]);Fd=mq(iq(it,1),bC,0,7,[-1,-1,-1,0,0,0,2,5,5,5,-1,0,0,0,0,9,9,9,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,9,-1,0,0,0,0,0,0,10,0,0,0,0,0,0,0,0,0,9,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,-1,-1,-1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1])}
	function _f(a,b,c,d,e){var f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L;t=jq(Eq,uB,0,e,7,1);u=jq(Eq,uB,0,e,7,1);for(p=0;p<e;p++){t[p]=yg(b,d[p]);u[p]=yg(c,d[p])}F=0;H=0;G=0;I=0;for(q=0;q<e;q++){F+=b.c[t[q]];H+=b.d[t[q]];G+=c.c[u[q]];I+=c.d[u[q]]}F/=e;H/=e;G/=e;I/=e;Dg(c,F-G,H-I);j=jq(ar,GB,13,e,0,1);l=jq(ar,GB,13,e,0,1);f=jq(ar,GB,13,e,0,1);g=jq(ar,GB,13,e,0,1);for(r=0;r<e;r++){j[r]=new ak(F,H,b.c[t[r]],b.d[t[r]]);l[r]=new ak(F,H,c.c[u[r]],c.d[u[r]]);f[r]=new _j(j[r].a-l[r].a,j[r].b*l[r].b);g[r]=new _j(j[r].a+l[r].a,j[r].b*l[r].b)}w=rg(f,e);A=rg(g,e);K=0;L=0;for(s=0;s<e;s++){for(v=0;v<a.e[d[s]];v++){h=ej(a.i,d[s],v);zg(b,h)&&!zg(c,h)&&++K;!zg(b,h)&&zg(c,h)&&++L}}k=jq(ar,GB,13,K,0,1);m=jq(ar,GB,13,L,0,1);n=jq(ar,GB,13,L,0,1);K=0;L=0;for(o=0;o<e;o++){for(v=0;v<a.e[d[o]];v++){h=ej(a.i,d[o],v);if(zg(b,h)&&!zg(c,h)){i=yg(b,h);k[K]=new ak(b.c[t[o]],b.d[t[o]],b.c[i],b.d[i]);++K}if(!zg(b,h)&&zg(c,h)){i=yg(c,h);J=new ak(c.c[u[o]],c.d[u[o]],c.c[i],c.d[i]);m[L]=new _j(w.a+J.a,J.b);n[L]=new _j(A.a-J.a,J.b);++L}}}B=rg(k,K);C=rg(m,L);D=rg(n,L);if(hx(Zf(B.a,C.a))>hx(Zf(B.a,D.a))){Cg(c,F,H,w.a)}else{ug(c,F,H);Cg(c,F,H,A.a)}return bg(a,b,c,e)}
	function Oc(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o,p;e=new od;i=new od;k=new Zu;j=new Zu;g=Ah(a.D,0,c);h=Ah(a.D,1,c);if(d){m=b.a;b.a=b.b;b.b=m;m=b.c;b.c=b.d;b.d=m;n=g;g=h;h=n}if(!dd(a,b))return;if(Fj(a.D,c)){e.a=b.a;e.c=b.c;e.b=b.b;e.d=b.d;l=d?-cd(a,c):cd(a,c);l==0&&(l=1);Nc(a,b.b-b.a,b.d-b.c,k);if(l>0){i.a=b.a+k.a;i.c=b.c+k.b;i.b=b.b+k.a;i.d=b.d+k.b;if(Mc(a,g,h,1,j)||fj(a.D,g)>1){i.a+=j.a+k.b;i.c+=j.b-k.a}}else{i.a=b.a-k.a;i.c=b.c-k.b;i.b=b.b-k.a;i.d=b.d-k.b;if(Mc(a,g,h,-1,j)||fj(a.D,g)>1){i.a+=j.a+k.b;i.c+=j.b-k.a}}Kh(a.D,c)==26&&bd(e,i);dd(a,e)&&zc(a,e,g,h);Kh(a.D,c)==64?dd(a,i)&&xc(a,i,g,h):dd(a,i)&&zc(a,i,g,h)}else{Nc(a,b.b-b.a,b.d-b.c,k);o=k.a/2;p=k.b/2;f=false;e.a=b.a+o;e.c=b.c+p;e.b=b.b+o;e.d=b.d+p;if(fj(a.D,g)>1){if(Mc(a,g,h,1,j)){e.a+=j.a;e.c+=j.b;if(fj(a.D,g)==2){if(j.a!=0||j.b!=0){e.a+=k.b;e.c-=k.a}}}else{a.n[g]=new $u(e.a,e.c)}}i.a=b.a-o;i.c=b.c-p;i.b=b.b-o;i.d=b.d-p;if(fj(a.D,g)>1){if(Mc(a,g,h,0,j)){i.a+=j.a;i.c+=j.b;if(fj(a.D,g)==2){if(j.a!=0||j.b!=0){i.a+=k.b;i.c-=k.a}}}else{a.n[g]=new $u(i.a,i.c);f=true}}Kh(a.D,c)==26&&bd(e,i);if(Kh(a.D,c)==64){if(f){xc(a,e,g,h);zc(a,i,g,h)}else{zc(a,e,g,h);xc(a,i,g,h)}}else{zc(a,e,g,h);zc(a,i,g,h)}}}
	function jm(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w;xm(a.b,1);a.a=jq(jt,yB,0,a.b.e,8,1);for(g=0;g<a.b.e;g++){if(Kh(a.b,g)==64){Gi(a.b,g,1);a.a[g]=true}}w=new fl(a.b,3);m=jq(jt,yB,0,w.i.a.length,8,1);for(s=0;s<w.i.a.length;s++){u=Hz(w.i,s);m[s]=true;for(l=0;l<u.length;l++){if(!Yh(a.b,u[l])){m[s]=false;break}}if(m[s]){v=Hz(w.j,s);for(k=0;k<v.length;k++)a.a[v[k]]=true}}for(h=0;h<a.b.e;h++){!a.a[h]&&w.c[h]!=0&&Yh(a.b,Ah(a.b,0,h))&&Yh(a.b,Ah(a.b,1,h))&&hm(a,h)}xm(a.b,3);for(t=0;t<w.i.a.length;t++){if(m[t]){u=Hz(w.i,t);for(k=0;k<u.length;k++){if(!nm(a,u[k])){qi(a.b,u[k],false);for(o=0;o<fj(a.b,u[k]);o++)a.a[gj(a.b,u[k],o)]=false}}}}mm(a);for(r=0;r<w.i.a.length;r++){if(m[r]&&Hz(w.j,r).length==6){v=Hz(w.j,r);n=true;for(e=0,f=v.length;e<f;++e){i=v[e];if(!a.a[i]){n=false;break}}if(n){lm(a,v[0]);lm(a,v[2]);lm(a,v[4]);mm(a)}}}for(q=5;q>=4;q--){do{p=false;for(i=0;i<a.b.e;i++){if(a.a[i]){b=0;for(k=0;k<2;k++){j=Ah(a.b,k,i);for(o=0;o<fj(a.b,j);o++)a.a[gj(a.b,j,o)]&&++b}if(b==q){lm(a,i);mm(a);p=true;break}}}}while(p)}for(d=0;d<a.b.e;d++)if(a.a[d])throw new Lo('Assignment of aromatic double bonds failed');for(c=0;c<a.b.d;c++)if(Yh(a.b,c))throw new Lo('Assignment of aromatic double bonds failed')}
	function Vd(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v;a.M=jq(jt,yB,0,a.L.d,8,1);for(b=0;b<a.L.d;b++){if(wh(a.L,b)==7){if(fj(a.L,b)==4){a.M[b]=true;continue}if(fj(a.L,b)==3){if(fh(a.L,b)==1){a.M[b]=true;continue}if(Dj(a.L,b))continue;if((a.K&32)!=0){a.M[b]=true;continue}if(_i(a.L,b)!=3)continue;v=bj(a.L,b);if(v>7)continue;t=tj(a.L);u=0;while(u<t.i.a.length){if(Hz(t.j,u).length==v&&al(t,u,b))break;++u}i=-1;j=-1;for(l=0;l<3;l++){h=gj(a.L,b,l);if(!bl(t,u,h)){i=ej(a.L,b,l);j=h;break}}n=jq(jt,yB,0,a.L.e,8,1);n[j]=true;o=jq(Eq,uB,0,11,7,1);p=qj(a.L,o,i,b,10,n);if(p==-1)continue;d=1;while(!al(t,u,o[d]))++d;c=p-d;e=o[d];if(v==6&&c==2&&d==3){if(_i(a.L,o[1])>=3){m=false;s=Hz(t.i,u);for(k=0;k<6;k++){if(b==s[k]){r=el(t,u,e==s[el(t,u,k+2)]?k-2:k+2);q=s[r];_i(a.L,q)>=3&&sj(a.L,o[1],q,2,null)==2&&(m=true);break}}if(m){a.M[b]=true;continue}}}f=$i(a.L,e)==1||zj(a.L,e)||Dj(a.L,e);g=!f&&wh(a.L,e)==7&&fh(a.L,e)!=1;if(c==1){!f&&!g&&v<=4&&d<=3&&(a.M[b]=true);continue}switch(v){case 4:!f&&!g&&d<=4&&(a.M[b]=true);break;case 5:g?d<=3&&(a.M[b]=true):f||d<=4&&(a.M[b]=true);break;case 6:c==2?f?d<=4&&(a.M[b]=true):g||d<=3&&(a.M[b]=true):c==3&&(f?d<=6&&(a.M[b]=true):d<=4&&(a.M[b]=true));break;case 7:c==3&&d<=3&&(a.M[b]=true);}}}}}
	function Nj(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p;if((a.t[b]&3)==0||(a.t[b]&3)==3)return;if(a.k[b]==2&&a.g[b]==2){Lj(a,b);return}if(a.g[b]<3||a.g[b]>4){si(a,b,0,false);return}o=vj(a,b);c=jq(Dq,xB,0,a.c[b],7,1);for(g=0;g<a.c[b];g++)c[g]=zh(a,a.f[b][o[g]],b);for(h=0;h<a.c[b];h++)a.G[0][a.i[b][h]]==b&&Hh(a,a.i[b][h])==1&&(a.J[a.i[b][h]]=1);if(Mj(a,b,o,c))return;m=-1;for(i=0;i<a.c[b];i++){e=a.i[b][i];if((a.J[e]==17||a.J[e]==9)&&a.G[0][e]==b){a.J[a.i[b][i]]=1;m==-1?(m=e):(m=-2)}}m<0&&(m=Kj(a,b));if(a.G[0][m]!=b){a.G[1][m]=a.G[0][m];a.G[0][m]=b}n=-1;for(j=0;j<a.c[b];j++){if(m==a.i[b][o[j]]){n=j;break}}p=mq(iq(Eq,2),cC,5,0,[mq(iq(Eq,1),uB,0,7,[2,1,2,1]),mq(iq(Eq,1),uB,0,7,[1,2,2,1]),mq(iq(Eq,1),uB,0,7,[1,1,2,2]),mq(iq(Eq,1),uB,0,7,[2,1,1,2]),mq(iq(Eq,1),uB,0,7,[2,2,1,1]),mq(iq(Eq,1),uB,0,7,[1,2,1,2])]);for(f=1;f<a.c[b];f++)c[f]<c[0]&&(c[f]+=BB);if(a.c[b]==3){k=false;switch(n){case 0:k=c[1]<c[2]&&c[2]-c[1]<CB||c[1]>c[2]&&c[1]-c[2]>CB;break;case 1:k=c[2]-c[0]>CB;break;case 2:k=c[1]-c[0]<CB;}d=(a.t[b]&3)==1^k?17:9}else{l=0;c[1]<=c[2]&&c[2]<=c[3]?(l=0):c[1]<=c[3]&&c[3]<=c[2]?(l=1):c[2]<=c[1]&&c[1]<=c[3]?(l=2):c[2]<=c[3]&&c[3]<=c[1]?(l=3):c[3]<=c[1]&&c[1]<=c[2]?(l=4):c[3]<=c[2]&&c[2]<=c[1]&&(l=5);d=(a.t[b]&3)==1^p[l][n]==1?9:17}a.J[m]=d}
	function sc(){sc=rt;pc=mq(iq(Eq,1),uB,0,7,[0,16777215,14286847,13402367,12779264,16758197,9474192,3166456,16715021,9494608,11789301,11230450,9109248,12560038,15780000,16744448,16777008,2093087,8442339,9388244,4062976,15132390,12567239,10921643,9083335,10255047,14706227,15765664,5296208,13140019,8224944,12750735,6721423,12419299,16752896,10889513,6076625,7351984,65280,9764863,9756896,7586505,5551541,3907230,2396047,687500,27013,12632256,16767375,10909043,6717568,10380213,13924864,9699476,4366000,5707663,51456,7394559,16777159,14286791,13107143,10747847,9437127,6422471,4587463,3211207,2097095,65436,58997,54354,48952,43812,5096191,5089023,2200790,2522539,2516630,1528967,13684960,16765219,12105936,10900557,5724513,10375093,11230208,7688005,4358806,4325478,32000,7384058,47871,41471,36863,33023,27647,5528818,7888099,9064419,10565332,11739092,11739066,11734438,12389767,13041766,13369433,13697103,14221381,14680120,15073326,15400998,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,13158600,1334015,56540,15075850,15132160,56540,15075850,15461355,8553170,1016335,1016335,1334015,15132160,3289770,14456450,16422400,16422400,11819700,3289770,1016335]);qc=new Nu(204,222,255);rc=new Nu(255,85,0)}
	function Nf(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q;this.j=a;for(d=0;d<a.i.d;d++){a.f[d]&&(a.o[d]==1||a.o[d]==2)&&(a.k[d]==1?this.a<=a.j[d]&&(this.a=1+a.j[d]):a.k[d]==2&&this.i<=a.j[d]&&(this.i=1+a.j[d]))}this.b=this.a+this.i;this.e=kq(jt,[GB,yB],[8,0],8,[this.b+1,a.g.length+1],2);for(e=0;e<a.i.d;e++)a.f[e]&&(a.o[e]==1||a.o[e]==2)&&!a.e[e]&&(this.e[Jf(this,e)][a.g.length]=true);for(i=0;i<a.g.length;i++){for(q=0;q<a.g[i].length;q++){c=a.g[i][q];a.f[c]&&(a.o[c]==1||a.o[c]==2)&&(this.e[Jf(this,c)][i]=true)}}this.d=jq(Eq,cC,5,this.b,0,2);for(j=0;j<a.g.length;j++){for(n=1;n<this.b;n++){if(this.e[n][j]){for(o=0;o<n;o++){if(this.e[o][j]){this.d[n]=zf(this.d[n],o);this.d[o]=zf(this.d[o],n)}}}}}this.c=jq(Eq,uB,0,this.b+1,7,1);for(m=0;m<this.b;m++){this.e[m][a.g.length]?(this.c[m]=-1):(this.c[m]=-2)}for(k=0;k<a.g.length;k++){if(this.e[this.b][k]){for(l=0;l<this.b;l++){this.e[l][k]&&this.c[l]!=k&&(this.c[l]==-2?(this.c[l]=k):(this.c[l]=-3))}}}for(b=0;b<this.b;b++){if(this.c[b]>=-1){f=jq(Eq,uB,0,this.b,7,1);if(Ef(this,f,b)){for(l=0;l<this.b;l++){f[l]!=0&&(this.c[l]=-3)}}}}for(h=0;h<a.g.length-1;h++){for(n=1;n<this.b;n++){if(this.e[n][h]&&this.c[n]!=-3){for(o=0;o<n;o++){if(this.e[o][h]&&this.c[o]!=-3){g=Ff(this,n,o,h);if(g!=null){for(p=0;p<g.length;p++)this.c[g[p]]=-3;Mf(this,g);break}}}}}}}
	function Zd(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r;f=false;for(c=0;c<a.L.d;c++){df(a.c[c],c);(rh(a.L,c)&1)!=0||mh(a.L,c)!=null?bf(a.c[c],8,6):bf(a.c[c],8,wh(a.L,c));bf(a.c[c],8,ph(a.L,c));bf(a.c[c],2,$i(a.L,c));bf(a.c[c],3,fj(a.L,c));(rh(a.L,c)&1)!=0?bf(a.c[c],4,8):bf(a.c[c],4,8+fh(a.L,c));bf(a.c[c],5,bj(a.L,c));bf(a.c[c],4,(o=dh(a.L,c),p=nj(a.L,c,false),q=nj(a.L,c,true),r=-1,p!=q?o!=-1&&o>p?(r=yq(o)):(r=yq(p)):o!=-1&&(o>q||o<q&&o>=pj(a.L,c))&&(r=yq(o)),he(a,c,r),r)+1);bf(a.c[c],2,sh(a.L,c)>>4);bf(a.c[c],29,rh(a.L,c));mh(a.L,c)!=null&&(f=true)}a.N=ae(a);if(f){for(b=0;b<a.L.d;b++){df(a.c[b],b);bf(a.c[b],16,a.d[b]);e=mh(a.L,b);m=e==null?0:e.length;bf(a.c[b],(6-m)*8,0);for(j=m-1;j>=0;j--)bf(a.c[b],8,e[j])}a.N=ae(a)}if(a.L.L){i=false;for(g=0;g<a.L.e;g++){if(Jh(a.L,g)!=0){i=true;break}}if(i){for(b=0;b<a.L.d;b++){df(a.c[b],b);bf(a.c[b],16,a.d[b]);h=jq(Eq,uB,0,fj(a.L,b),7,1);for(k=0;k<fj(a.L,b);k++)h[k]=Jh(a.L,gj(a.L,b,k));kA(h);bf(a.c[b],(6-h.length)*20,0);for(j=h.length-1;j>=0;j--)bf(a.c[b],20,h[j])}a.N=ae(a)}}if((a.K&8)!=0){l=new wm;for(d=0;d<a.L.d;d++)hh(a.L,d)!=null&&um(l,hh(a.L,d));for(b=0;b<a.L.d;b++){n=hh(a.L,b)==null?0:1+vm(l,hh(a.L,b));df(a.c[b],b);bf(a.c[b],16,a.d[b]);bf(a.c[b],16,n)}a.N=ae(a)}if((a.K&16)!=0){for(b=0;b<a.L.d;b++){df(a.c[b],b);bf(a.c[b],16,a.d[b]);bf(a.c[b],1,$h(a.L,b)?1:0)}a.N=ae(a)}}
	function Ck(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u;j=vk(b,0);d=xw(b.substr(0,j));i=zk(b,j);j=vk(b,i);l=b.substr(i,j-i);q=null;e=false;k=Ik(b);if(k!=0){q=Dk(b);k<0&&(e=true);j=k<0?-k:k}i=zk(b,j);j=vk(b,i);s=Iw(b.substr(i,j-i));i=zk(b,j);j=vk(b,i);t=Iw(b.substr(i,j-i));i=zk(b,j);j=vk(b,i);u=Iw(b.substr(i,j-i));i=zk(b,j);j=vk(b,i);n=xw(b.substr(i,j-i));c=Wg(a.c,s,-t,-u);c+1!=d&&(!a.a&&(a.a=new OA),MA(a.a,new Nw(d),new Nw(c)));q!=null&&oi(a.c,c,q,e);n!=0&&pi(a.c,c,n);if(Dx(l,'A')){ti(a.c,c,1)}else if(Dx(l,'Q')){m=jq(Eq,uB,0,1,7,1);m[0]=6;oi(a.c,c,m,true)}else{Ai(a.c,c,Ri(l))}while((i=zk(b,j))!=-1){j=vk(b,i);o=b.substr(i,j-i);h=Fx(o,Rx(61));g=o.substr(0,h);r=xw(Nx(o,h+1,o.length-(h+1)));if(Dx(g,'CHG')){hi(a.c,c,r)}else if(Dx(g,'RAD')){switch(r){case 1:ui(a.c,c,16);break;case 2:ui(a.c,c,32);break;case 3:ui(a.c,c,48);}}else if(Dx(g,'CFG'));else if(Dx(g,'MASS')){ri(a.c,c,r)}else if(Dx(g,'VAL')){fi(a.c,c,r==-1?0:r==0?-1:r)}else if(Dx(g,'HCOUNT')){switch(r){case 0:break;case -1:ti(a.c,c,1792);break;case 1:ti(a.c,c,128);break;case 2:ti(a.c,c,384);break;default:ti(a.c,c,896);}}else if(Dx(g,'SUBST')){if(r==-1){ti(a.c,c,RB)}else if(r>0){p=0;for(f=0;f<a.c.q;f++){(Ah(a.c,0,f)==c||Ah(a.c,1,f)==c)&&++p}r>p&&ti(a.c,c,HB)}}else if(Dx(g,'RBCNT')){switch(r){case 3:case -1:ti(a.c,c,112);break;case 1:ti(a.c,c,8);break;case 2:ti(a.c,c,104);break;case 4:ti(a.c,c,56);}}else{tk&&(ny(),my)}}}
	function Xd(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B;s=jq(jt,yB,0,a.L.d,8,1);t=jq(jt,yB,0,a.L.e,8,1);b=0;v=false;for(d=0;d<a.L.d;d++){if(a.P[d]){if(!a.X[d]){if(Qd(a,d,false)){a.X[d]=true;s[d]=true;++b}}}}for(f=0;f<a.L.e;f++){if(a.O[f]){if(!a.o[f]){if(Md(a,f,false)){a.o[f]=true;t[f]=true;++b}}}}if(b==1){for(c=0;c<a.L.d;c++){if(s[c]){a.W[c]=0;break}}for(e=0;e<a.L.e;e++){if(t[e]){a.n[e]=0;break}}}else if(b>1){Ud(a);for(h=new Gy(a.t);h.a<h.b.Mb();){g=(Hp(h.a<h.b.Mb()),h.b.Pb(h.a++));u=0;w=0;k=0;j=0;l=-1;i=-1;for(o=0;o<g.a.length;o++){if(s[g.a[o]]){++u;if(a.W[g.a[o]]==1||a.W[g.a[o]]==2){++w;v=true;if(l<a.d[g.a[o]]){l=a.d[g.a[o]];k=g.a[o]}}}}for(p=0;p<g.b.length;p++){if(t[g.b[p]]){++u;A=a.d[Ah(a.L,0,g.b[p])];B=a.d[Ah(a.L,1,g.b[p])];m=A>B?(A<<16)+B:(B<<16)+A;if(a.n[g.b[p]]==1||a.n[g.b[p]]==2){++w;v=true;if(i<m){i=m;j=g.b[p]}}}}if(u==0)continue;if(u==1){for(q=0;q<g.a.length;q++)s[g.a[q]]&&(a.W[g.a[q]]=0);for(n=0;n<g.b.length;n++)t[g.b[n]]&&(a.n[g.b[n]]=0)}else{if(w==1){for(q=0;q<g.a.length;q++)s[g.a[q]]&&(a.W[g.a[q]]=3);for(n=0;n<g.b.length;n++)t[g.b[n]]&&(a.n[g.b[n]]=3)}else{r=false;l!=-1?a.W[k]==2&&(r=true):a.n[j]==2&&(r=true);if(r){for(q=0;q<g.a.length;q++){if(s[g.a[q]]){switch(a.W[g.a[q]]){case 1:a.W[g.a[q]]=2;break;case 2:a.W[g.a[q]]=1;}}}for(n=0;n<g.b.length;n++){if(t[g.b[n]]){switch(a.n[g.b[n]]){case 1:a.n[g.b[n]]=2;break;case 2:a.n[g.b[n]]=1;}}}}}}}}return v}
	function xf(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v;i=jq(Eq,uB,0,a.i.d,7,1);s=jq(Eq,uB,0,a.i.d,7,1);o=jq(jt,yB,0,a.i.d,8,1);p=jq(jt,yB,0,a.i.d,8,1);j=jq(jt,yB,0,a.i.d,8,1);i[0]=b;s[b]=c;s[c]=-2;o[b]=true;o[c]=true;f=0;k=0;while(f<=k){g=i[f];if(s[g]==g){for(l=0;l<fj(a.i,g);l++){d=ej(a.i,g,l);if(!o[d]){if(hj(a.i,g,l)==2&&wh(a.i,d)<10){i[++k]=d;s[d]=d;j[d]=j[g]||$i(a.i,d)==2;p[d]=j[g]&&!p[g];o[d]=true}else if(j[g]&&p[g]){t=mf(a,d,s[g],o);if(t==-1)return null;i[++k]=d;s[d]=t;s[t]=-2;j[d]=false;o[d]=true;o[t]=true}else if(Fj(a.i,gj(a.i,g,l))){i[++k]=d;s[d]=d;j[d]=false;o[d]=true;if((wh(a.i,d)==6&&$i(a.i,d)==0||wh(a.i,d)==7&&fh(a.i,d)==1||wh(a.i,d)==14||wh(a.i,d)==15&&fj(a.i,d)>2||wh(a.i,d)==16&&fj(a.i,d)>2)&&fj(a.i,d)>2){h=false;for(q=1;q<fj(a.i,d);q++){u=ej(a.i,d,q);if(!o[u]){for(r=0;r<q;r++){v=ej(a.i,d,r);if(!o[v]){if(qf(a,u,v)){i[++k]=u;s[u]=v;s[v]=-2;j[u]=false;o[u]=true;o[v]=true;h=true}}}}}if(!h)return null}}}}}else{e=jq(jt,yB,0,fj(a.i,g),8,1);for(m=0;m<fj(a.i,g);m++){d=ej(a.i,g,m);if(o[d]){e[m]=s[d]==d}else{for(q=0;q<fj(a.i,d);q++){if(ej(a.i,d,q)==s[g]){e[m]=true;break}}}}for(n=0;n<fj(a.i,g);n++){if(e[n]){d=ej(a.i,g,n);if(o[d]){if(dj(a.i,d,s[g])==-1)return null}else{i[++k]=d;s[d]=d;p[d]=false;j[d]=true;o[d]=true}}}for(l=0;l<fj(a.i,g);l++){if(!e[l]){d=ej(a.i,g,l);if(!o[d]){t=mf(a,d,s[g],o);if(t==-1)return null;i[++k]=d;s[d]=t;s[t]=-2;j[d]=false;o[d]=true;o[t]=true}}}}++f}return o}
	function Hd(a,b,c){Gd();var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t;xm(a,3);p=jq(Fq,bC,0,a.g[b],6,1);for(l=0;l<a.g[b];l++){g={l:0,m:0,h:0};i={l:0,m:0,h:0};if((c&32)!=0){h=Wt(a.j[b][l]);Zt(h,{l:3,m:0,h:0})&&Aj(a,a.i[b][l])&&(h={l:0,m:0,h:0});i=St(i,h)}f=a.f[b][l];if((c&128)!=0){if(Ed[a.F[f]]==-1)throw new Lo('unsupported atomicNo:'+a.F[f]);g=St(g,Wt(Ed[a.F[f]]))}else if((c&64)!=0){if(Fd[a.F[f]]==-1)throw new Lo('unsupported atomicNo:'+a.F[f]);g=St(g,Wt(Fd[a.F[f]]))}if((c&256)!=0){r=a.g[f]-1;r>3&&(r=3);(c&512)==0&&r>1&&(r=1);g=St(g,Wt(r<<4))}(c&IB)!=0&&(a.t[f]&8)!=0&&(g=St(g,{l:64,m:0,h:0}));(c&RB)!=0&&(a.t[f]&HB)!=0&&(g=St(g,{l:128,m:0,h:0}));t=St(g,cu(i,8));n=0;while(!Yt(t,p[n]))++n;for(o=l;o>n;o--)p[o]=p[o-1];p[n]=t}q=a.g[b]<4?a.g[b]:4;e={l:0,m:0,h:0};for(m=0;m<q;m++){e=cu(e,10);e=St(e,p[m])}e=cu(e,10);if(Ed[a.F[b]]==-1)throw new Lo('unsupported atomicNo:'+a.F[b]);e=bu(e,Wt(Ed[a.F[b]]));if((c&2)!=0){s=!!a.n&&b<a.d?Wk(a.n,b):0;s>9&&(s=9);s>2&&(s-=2);e=bu(e,Wt(s<<4))}else (c&1)!=0&&(a.t[b]&8)!=0&&(e=bu(e,{l:64,m:0,h:0}));(c&4)!=0&&(a.t[b]&HB)!=0&&(e=St(e,{l:128,m:0,h:0}));(c&8)!=0&&(a.t[b]&8192)!=0&&(e=St(e,{l:256,m:0,h:0}));(c&16)!=0&&(a.t[b]&NB)!=0&&(e=St(e,{l:512,m:0,h:0}));if(au(Tt(e,{l:0,m:0,h:64}),{l:0,m:0,h:0})){j=new No('Bit already set!');Io(j,ny())}if(au(Tt(e,{l:0,m:0,h:128}),{l:0,m:0,h:0})){j=new No('Bit already set!');Io(j,ny())}if((c&HB)!=0){yd(a,b)&&(e=St(e,{l:0,m:0,h:64}));d=false;if(Bd(a,b)){for(k=0;k<a.d;k++){if(zd(a,k)){d=true;break}}}d&&(e=St(e,{l:0,m:0,h:128}))}return e}
	function Xf(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t;j=mq(iq(Eq,2),cC,5,0,[mq(iq(Eq,1),uB,0,7,[627]),null,mq(iq(Eq,1),uB,0,7,[2457]),null,mq(iq(Eq,1),uB,0,7,[2451,8643,2519]),null,mq(iq(Eq,1),uB,0,7,[34377,-2147448999]),null,mq(iq(Eq,1),uB,0,7,[37449,137313,95703,34371,37815,54891,132867,-2147309741,54857,55129,-2147449005,-2147449065]),null,mq(iq(Eq,1),uB,0,7,[530697,531819,899169,137289,694617,-2146951863,-2146952797,-2146939175,-2146929547,-2146929564,-2146625111,-2146931799,-2146940503,-2146931935]),null,mq(iq(Eq,1),uB,0,7,[542985,137283,2122017,530691,2206773,-2144711351,219209,2840841,137555,-2146871031,-2147264167,613705,-2145360543,-2146625271,694611,2454837,-2145356703,-2147345133,-2146928951,-2146931805,-2144641719,-2146951869,-2146625237,-2146624183,2841963,1074905,-2146625117,2799955,-2144723645,138583,859225,-2145264843,-2145216253,-2146624149,-2144700727,-2146928917,-2143905527,-2144045771,-2146789097,2288547,544407,2104323,-2146911977,-2144479405,3633737,-2146870089,-2146952169]),null,mq(iq(Eq,1),uB,0,7,[8487297,2172633,2116611,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8829813])]);q=b.a.length-10;if(b.a.length>=10&&b.a.length<=24&&j[q]!=null){o=1<<b.a.length;f=0;h=0;for(l=0;l<b.a.length;l++){if(Hh(a.i,c[l])==2){g=Ih(a.i,c[l]);g==1&&(f+=o);g==2&&(h+=o)}f>>>=1;h>>>=1}for(t=0;t<j[q].length;t++){n=(-2147483648&j[q][t])==0;i=tB&j[q][t];for(m=false;!m;m=!m){if(m){if(n)break;p=0;for(d=1;d!=o;d<<=1){p<<=1;(i&d)!=0&&(p|=1)}i=p}for(r=0;r<b.a.length;r++){if((i&f)==0&&(~i&h)==0){e=0;s=true;for(k=1;k<b.a.length;k++){b.c[k]=b.c[k-1]+sx(e);b.d[k]=b.d[k-1]+jx(e);(i&1)==0&&(s=!s);e+=s?YB:-1.0471975511965976;i>>>=1}return}(i&1)!=0&&(i|=o);i>>>=1}}}}Yf(b)}
	function ok(a){var b,c,d,e,f,g,h,i,j,k,l;xm(a,1);e=jq(Eq,uB,0,191,7,1);for(c=0;c<a.p;c++){switch(a.F[c]){case 171:e[1]+=5;e[6]+=3;e[7]+=1;e[8]+=1;break;case 172:e[1]+=12;e[6]+=6;e[7]+=4;e[8]+=1;break;case 173:e[1]+=6;e[6]+=4;e[7]+=2;e[8]+=2;break;case 174:e[1]+=5;e[6]+=4;e[7]+=1;e[8]+=3;break;case 175:e[1]+=5;e[6]+=3;e[7]+=1;e[8]+=1;e[16]+=1;break;case 176:e[1]+=8;e[6]+=5;e[7]+=2;e[8]+=2;break;case 177:e[1]+=7;e[6]+=5;e[7]+=1;e[8]+=3;break;case 178:e[1]+=3;e[6]+=2;e[7]+=1;e[8]+=1;break;case 179:e[1]+=7;e[6]+=6;e[7]+=3;e[8]+=1;break;case 181:case 180:e[1]+=11;e[6]+=6;e[7]+=1;e[8]+=1;break;case 182:e[1]+=12;e[6]+=6;e[7]+=2;e[8]+=1;break;case 183:e[1]+=9;e[6]+=5;e[7]+=1;e[8]+=1;e[16]+=1;break;case 184:e[1]+=9;e[6]+=9;e[7]+=1;e[8]+=1;break;case 185:e[1]+=7;e[6]+=5;e[7]+=1;e[8]+=1;break;case 186:e[1]+=5;e[6]+=3;e[7]+=1;e[8]+=2;break;case 187:e[1]+=7;e[6]+=4;e[7]+=1;e[8]+=2;break;case 188:e[1]+=10;e[6]+=11;e[7]+=2;e[8]+=1;break;case 189:e[1]+=9;e[6]+=9;e[7]+=1;e[8]+=2;break;case 190:e[1]+=9;e[6]+=5;e[7]+=1;e[8]+=1;break;case 1:switch(a.w[c]){case 0:case 1:++e[1];break;case 2:++e[151];break;case 3:++e[152];}break;default:++e[a.F[c]];}}for(d=0;d<a.p;d++)a.F[d]>=171&&a.F[d]<=190?(e[1]+=2-pj(a,d)):(e[1]+=oj(a,d));h=0;for(j=1;j<=190;j++)e[j]!=0&&++h;this.b=jq(Eq,uB,0,h,7,1);this.c=jq(Eq,uB,0,h,7,1);h=0;for(i=0;i<ik.length;i++){if(e[ik[i]]!=0){this.b[h]=e[ik[i]];this.c[h]=ik[i];++h;e[ik[i]]=0}}while(true){l='zzz';k=-1;for(g=1;g<=190;g++)if(e[g]>0&&Px(l,(Vg(),Sg)[g])>0){l=(Vg(),Sg)[g];k=g}if(k==-1)break;this.b[h]=e[k];this.c[h]=k;++h;e[k]=0}this.a=0;this.d=0;for(b=0;b<a.d;b++){if(a.F[b]!=1&&a.w[b]!=0){g=a.F[b];f=a.w[b];this.a+=gk(g,f)-hk[g];this.d+=gk(g,f)-jk[g]}}}
	function an(a,b){var c;switch(a.F[b]){case 7:if((a.t[b]&HB)!=0){if(a.r[b]==0){if(a.c[b]-a.g[b]+oj(a,b)==0){if(a.g[b]==2)return 18;else{for(c=0;c<a.g[b];c++)if(!Aj(a,a.i[b][c]))return 20;return 19}}else return 22}else if(a.r[b]==1){if(a.c[b]-a.g[b]+oj(a,b)==0){for(c=0;c<a.g[b];c++)if(!Aj(a,a.i[b][c]))return fh(a,a.f[b][c])<0?21:24;return 23}else return 25}}else{if(a.r[b]==0){switch(a.c[b]-a.g[b]+oj(a,b)){case 0:switch(a.k[b]){case 0:return (!!a.n&&b<a.d?Wk(a.n,b):0)==3?5:0;case 1:return 1;case 2:return 2;}break;case 1:switch(a.k[b]){case 0:return (!!a.n&&b<a.d?Wk(a.n,b):0)==3?7:6;case 1:return 8;}break;case 2:return 9;}}else if(a.r[b]==1){switch(a.c[b]-a.g[b]+oj(a,b)){case 0:switch(a.k[b]){case 0:return 10;case 1:return cn(a,b)?3:11;case 2:return a.j[b][0]==2?cn(a,b)?4:Zm.length+1:12;}break;case 1:switch(a.k[b]){case 0:return 13;case 1:return 14;}break;case 2:return a.k[b]==0?15:16;case 3:return 17;}}}return Zm.length+1;case 8:if((a.t[b]&HB)!=0){if(a.r[b]==0)return 31}else{if(a.r[b]==0){if(a.k[b]>0)return 28;if(a.g[b]==1)return 29;if((!!a.n&&b<a.d?Wk(a.n,b):0)==3)return 27;return 26}else if(a.r[b]==-1){if(a.g[b]==1&&fh(a,a.f[b][0])>0)return 28;return 30}}return Zm.length+1;case 15:if(a.r[b]==0){if(a.c[b]-a.g[b]+oj(a,b)==0){if(a.g[b]==3&&a.k[b]==0)return 39;if(a.g[b]==2&&a.k[b]==1)return 40;if(a.g[b]==4&&a.k[b]==1)return 41}else if(a.c[b]-a.g[b]+oj(a,b)==1){if(a.g[b]==3&&a.k[b]==1)return 42}}return Zm.length+1;case 16:if(a.r[b]==0){if((a.t[b]&HB)!=0){return a.g[b]==2?37:38}else{if(a.c[b]-a.g[b]+oj(a,b)==0){if(a.g[b]==2&&a.k[b]==0)return 32;if(a.g[b]==1&&a.k[b]==1)return 33;if(a.g[b]==3&&a.k[b]==1)return 34;if(a.g[b]==4&&a.k[b]==2)return 35}else if(a.c[b]-a.g[b]+oj(a,b)==1){if(a.g[b]==1)return 36}}}return Zm.length+1;}return Zm.length}
	function ke(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M;if(wh(a.L,c)!=wh(a.L,d))return wh(a.L,c)>wh(a.L,d);if(ph(a.L,c)!=ph(a.L,d)){H=Zh(a.L,c)?(Vg(),Ug)[wh(a.L,c)]:ph(a.L,c);I=Zh(a.L,d)?(Vg(),Ug)[wh(a.L,d)]:ph(a.L,d);return H>I}w=a.L.d;s=jq(Eq,uB,0,w,7,1);u=jq(Eq,uB,0,w,7,1);v=jq(Eq,uB,0,w,7,1);t=jq(jt,yB,0,w,8,1);i=jq(jt,yB,0,a.L.p,8,1);s[0]=b;s[1]=c;s[2]=d;u[0]=-1;u[1]=0;u[2]=0;i[b]=true;i[c]=true;i[d]=true;m=1;A=2;G=jq(Eq,uB,0,64,7,1);G[1]=1;G[2]=3;o=2;while(m<=A){while(m<G[o]){n=s[m];if(!t[m]){p=0;q=0;for(C=0;C<fj(a.L,n);C++){k=ej(a.L,n,C);if(A+hj(a.L,n,C)+1>=w){w+=a.L.d;s=Ne(s,w);u=Ne(u,w);v=Ne(v,w);t=(M=jq(jt,yB,0,w,8,1),oy(t,0,M,0,t.length),M)}if(Cj(a.L,gj(a.L,n,C))){++p;q+=wh(a.L,k)}else{for(F=1;F<hj(a.L,n,C);F++){++A;s[A]=k;u[A]=m;t[A]=true}}K=u[m];if(k==s[K])continue;h=false;if(i[k]){J=u[K];while(J!=-1){if(k==s[J]){h=true;break}J=u[J]}}if(h){++A;s[A]=k;u[A]=m;t[A]=true}else{++A;s[A]=k;u[A]=m;i[k]=true}}if(p!=0){++A;v[A]=~~((q<<2)/p);u[A]=m;t[A]=true}}++m;if(m==10000){throw new Lo('Emergency break in while loop.')}}G.length==o+1&&(G=Ne(G,G.length+64));G[o+1]=A+1;for(B=G[o];B<G[o+1];B++){v[B]==0&&(v[B]=(wh(a.L,s[B])==151?1:wh(a.L,s[B])==152?1:wh(a.L,s[B]))<<2);v[B]+=v[u[B]]<<16}oe(a,t,v,u,s,G,o);if(v[1]!=v[2])return v[1]>v[2];o>1&&le(v,u,G,o);++o}l=jq(Eq,uB,0,a.L.d,7,1);D=false;for(f=0;f<a.L.d;f++){if(i[f]&&!Zh(a.L,f)){D=true;break}}if(D){for(g=0;g<a.L.d;g++)l[g]=Zh(a.L,g)?(Vg(),Ug)[wh(a.L,g)]:ph(a.L,g);if(ne(a,t,v,u,s,l,G,o))return v[1]>v[2]}bA(l,l.length);r=false;for(j=0;j<a.L.e;j++){if(i[Ah(a.L,0,j)]||i[Ah(a.L,1,j)]){if(a.g[j]==1){l[Ah(a.L,0,j)]=1;l[Ah(a.L,1,j)]=1;r=true}else if(a.g[j]==2){l[Ah(a.L,0,j)]=2;l[Ah(a.L,1,j)]=2;r=true}}}if(r&&ne(a,t,v,u,s,l,G,o))return v[1]>v[2];bA(l,l.length);L=false;for(e=0;e<a.L.d;e++){if(i[e]){if(a.R[e]==2){l[e]=1;L=true}else if(a.R[e]==1){l[e]=2;L=true}}}if(L&&ne(a,t,v,u,s,l,G,o))return v[1]>v[2];a.b=true;throw new Lo('no distinction applying CIP rules')}
	function Bd(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A;if(a.F[b]!=7)return false;if(a.g[b]+a.k[b]>3)return false;if((a.t[b]&HB)!=0){if(a.k[b]!=1)return false;if(aj(a,b)!=1)return false;u=(xm(a,3),a.n);for(s=0;s<u.i.a.length;s++){if(al(u,s,b)){if(Hz(u.j,s).length==5||Hz(u.j,s).length==6){v=Hz(u.i,s);q=-1;for(i=0;i<v.length;i++){if(v[i]==b){q=i;break}}e=0;r=null;p=null;if(v.length==5){r=jq(Eq,uB,0,2,7,1);r[0]=v[q-1<0?q+4:q-1];r[1]=v[q-4<0?q+1:q-4];p=jq(Eq,uB,0,2,7,1);p[0]=v[q-2<0?q+3:q-2];p[1]=v[q-3<0?q+2:q-3]}if(v.length==6){r=jq(Eq,uB,0,3,7,1);r[0]=v[q-1<0?q+5:q-1];r[1]=v[q-3<0?q+3:q-3];r[2]=v[q-5<0?q+1:q-5];p=jq(Eq,uB,0,2,7,1);p[0]=v[q-2<0?q+4:q-2];p[1]=v[q-4<0?q+2:q-4]}for(j=0;j<v.length;j++)b!=v[j]&&a.F[v[j]]==7&&a.k[v[j]]==1&&--e;for(k=0;k<r.length;k++){f=-1;g=-1;for(o=0;o<a.g[r[k]];o++){if(!Aj(a,a.i[r[k]][o])){f=a.f[r[k]][o];g=a.i[r[k]][o];break}}if(f!=-1){if(a.F[f]==7&&a.k[f]==0&&a.g[f]+a.k[f]<=3&&!Cd(a,f,false)){++e;continue}if(a.F[f]==8&&a.g[f]==1){e+=2;continue}if((a.H[g]&256)!=0){for(w=0;w<u.i.a.length;w++){if(u.e[w]&&al(u,w,f)){t=Hz(u.i,w);for(n=0;n<t.length;n++){if(a.F[t[n]]==7&&a.k[t[n]]==1){--e;break}}break}}}}}for(l=0;l<p.length;l++){f=-1;for(n=0;n<a.g[p[l]];n++)Aj(a,a.i[p[l]][n])||(f=a.f[p[l]][n]);if(a.F[p[l]]==7){a.k[p[l]]==0&&(f==-1||xd(a,f)==0)&&++e;continue}if(f!=-1&&xd(a,f)!=0){--e;continue}}return e>0}break}}return false}if(a.k[b]>1)return false;if(a.k[b]==1){m=-1;A=0;for(i=0;i<a.g[b];i++){d=a.f[b][i];if(a.j[b][i]==2){if(a.F[d]!=6)return false;m=d;continue}if(a.F[d]==8)return false;if(a.F[d]==7){--A;Cd(a,d,false)&&--A;continue}(a.t[d]&HB)!=0&&--A}if(m==-1)return false;c=0;for(j=0;j<a.g[m];j++){if(a.j[m][j]==1){d=a.f[m][j];if(xd(a,d)!=0)return false;(a.t[d]&HB)!=0&&++c;a.F[d]==7&&!Cd(a,d,true)&&++A;(a.F[d]==8||a.F[d]==16)&&--A}}c==2&&--A;return A>=0}for(h=0;h<a.g[b];h++){d=a.f[b][h];if((a.t[d]&HB)!=0)return false;if(a.F[d]!=6)return false;if(xd(a,d)!=0)return false;if(a.k[d]!=0&&Dd(a,d))return false}return true}
	function Sc(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u;n=new od;c=new od;f=new od;l=new Zu;k=new Zu;d=Ah(a.D,0,b);e=Ah(a.D,1,b);Wl(a,d,e,Kg(a.G,th(a.D,d)),Lg(a.G,uh(a.D,d)),Kg(a.G,th(a.D,e)),Lg(a.G,uh(a.D,e)));if(!a.n[d]){n.a=Kg(a.G,th(a.D,d));n.c=Lg(a.G,uh(a.D,d))}else{n.a=a.n[d].a;n.c=a.n[d].b}if(!a.n[e]){n.b=Kg(a.G,th(a.D,e));n.d=Lg(a.G,uh(a.D,e))}else{n.b=a.n[e].a;n.d=a.n[e].b}if((Jh(a.D,b)&UB)!=0){dd(a,n)&&(q=zq(n.a),r=zq(n.b),s=zq(n.c),t=zq(n.d),u='<line stroke-dasharray="3, 3" x1="'+q+'" '+'y1="'+s+'" '+'x2="'+r+'" '+'y2="'+t+'" '+'stroke="'+a.d+'" '+'stroke-width:'+zq(a.i)+'"/>',_l(a,u),undefined);return}g=Kh(a.D,b)==64?0:Kh(a.D,b)==32?1:Hh(a.D,b);switch(g){case 1:switch(Kh(a.D,b)){case 1:dd(a,n)&&zc(a,n,d,e);break;case 17:_c(a,n,d,e);break;case 9:o=n.b-n.a;p=n.d-n.c;if(Uh(a.D,dj(a.D,d,e))){h=-3;i=-3}else{h=a.o[d];i=Fc(a,d);h==gh(a.D,d)&&(h=i)}for(j=2;j<17;j+=2){c.a=n.a+j*o/17-j*p/128;c.c=n.c+j*p/17+j*o/128;c.b=n.a+j*o/17+j*p/128;c.d=n.c+j*p/17-j*o/128;if(dd(a,c)){hd(a,j<9?h:i);Ql(a,c);hd(a,a.A)}}break;case 32:dd(a,n)&&xc(a,n,d,e);}break;case 0:case 2:if((a.q[d]||$i(a.D,d)==2)&&(a.q[e]||$i(a.D,e)==2)&&!Fj(a.D,b)&&g==2){if(!dd(a,n))break;Nc(a,n.b-n.a,n.d-n.c,l);o=l.a/2;p=l.b/2;c.a=n.a+o;c.c=n.c+p;c.b=n.b+o;c.d=n.d+p;f.a=n.a-o;f.c=n.c-p;f.b=n.b-o;f.d=n.d-p;Kh(a.D,b)==26&&bd(c,f);zc(a,c,d,e);zc(a,f,d,e)}else if((a.q[e]||$i(a.D,e)==2)&&g==2){Oc(a,n,b,false)}else if((a.q[d]||$i(a.D,d)==2)&&g==2){Oc(a,n,b,true)}else{m=cd(a,b);m==0&&(m=1);c.a=n.a;c.c=n.c;c.b=n.b;c.d=n.d;Nc(a,n.b-n.a,n.d-n.c,l);if(m>0){f.a=n.a+l.a;f.c=n.c+l.b;f.b=n.b+l.a;f.d=n.d+l.b;if(Mc(a,d,e,1,k)||fj(a.D,d)>1){f.a+=k.a+l.b;f.c+=k.b-l.a}if(Mc(a,e,d,-1,k)||fj(a.D,e)>1){f.b+=k.a-l.b;f.d+=k.b+l.a}}else{f.a=n.a-l.a;f.c=n.c-l.b;f.b=n.b-l.a;f.d=n.d-l.b;if(Mc(a,d,e,-1,k)||fj(a.D,d)>1){f.a+=k.a+l.b;f.c+=k.b-l.a}if(Mc(a,e,d,1,k)||fj(a.D,e)>1){f.b+=k.a-l.b;f.d+=k.b+l.a}}Kh(a.D,b)==26&&bd(c,f);dd(a,c)&&zc(a,c,d,e);g==2?dd(a,f)&&zc(a,f,d,e):dd(a,f)&&xc(a,f,d,e)}break;case 3:if(dd(a,n)){zc(a,n,d,e);Nc(a,n.b-n.a,n.d-n.c,l);c.a=n.a+l.a;c.c=n.c+l.b;c.b=n.b+l.a;c.d=n.d+l.b;zc(a,c,d,e);c.a=n.a-l.a;c.c=n.c-l.b;c.b=n.b-l.a;c.d=n.d-l.b;zc(a,c,d,e)}}}
	function kk(){kk=rt;jk=mq(iq(Cq,1),bC,0,7,[0,1.00794,4.0026,6.941,9.0122,10.811,12.011,14.007,15.999,18.998,20.18,22.99,24.305,26.982,28.086,30.974,32.066,35.453,39.948,39.098,40.078,44.956,47.867,50.942,51.996,54.938,55.845,58.933,58.693,63.546,65.39,69.723,72.61,74.922,78.96,79.904,83.8,85.468,87.62,88.906,91.224,92.906,95.94,98.906,101.07,102.91,106.42,107.87,112.41,114.82,118.71,121.76,127.6,126.9,131.29,132.91,137.33,138.91,140.12,140.91,144.24,146.92,150.36,151.96,157.25,158.93,162.5,164.93,167.26,168.93,173.04,174.97,178.49,180.95,183.84,186.21,190.23,192.22,195.08,196.97,200.59,204.38,207.2,208.98,209.98,209.99,222.02,223.02,226.03,227.03,232.04,231.04,238.03,237.05,239.05,241.06,244.06,249.08,252.08,252.08,257.1,258.1,259.1,262.11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2.0141,3.016,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);hk=mq(iq(Cq,1),bC,0,7,[0,1.007825,4.0026,7.016003,9.012182,11.009305,12,14.003074,15.994915,18.998403,19.992435,22.989767,23.985042,26.98153,27.976927,30.973762,31.97207,34.968852,39.962384,38.963707,39.962591,44.95591,47.947947,50.943962,51.940509,54.938047,55.934939,58.933198,57.935346,62.939598,63.929145,68.92558,73.921177,74.921594,79.91652,78.918336,83.911507,84.911794,87.905619,88.905849,89.904703,92.906377,97.905406,89.92381,101.904348,102.9055,105.903478,106.905092,113.903357,114.90388,119.9022,120.903821,129.906229,126.904473,131.904144,132.905429,137.905232,138.906346,139.905433,140.907647,141.907719,135.92398,151.919729,152.921225,157.924099,158.925342,163.929171,164.930319,165.93029,168.934212,173.938859,174.94077,179.946545,180.947992,183.950928,186.955744,191.961467,192.962917,194.964766,196.966543,201.970617,204.974401,207.976627,208.980374,193.98818,195.99573,199.9957,201.00411,206.0038,210.00923,232.038054,216.01896,238.050784,229.03623,232.041169,237.05005,238.05302,242.06194,240.06228,243.06947,243.07446,248.08275,251.08887,253.09515,257.10295,257.10777,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2.014,3.01605,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);ik=mq(iq(Eq,1),uB,0,7,[6,1,7,8])}
	function mg(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M;for(d=0;d<a.b;d++){if(a.e[d]>4){m=new Fg(a,a.i,1+a.e[d]);m.c[a.e[d]]=0;m.d[a.e[d]]=0;m.q[a.e[d]]=32;m.a[a.e[d]]=d;a.a[d]=true;for(o=0;o<a.e[d];o++){j=ej(a.i,d,o);m.c[o]=Math.sin(YB*o-jC);m.d[o]=Math.cos(YB*o-jC);m.q[o]=32;m.a[o]=j;a.a[j]=true;a.c[gj(a.i,d,o)]=true}Gz(a.f,m)}}I=tj(a.i);for(H=0;H<I.i.a.length;H++){J=Hz(I.j,H).length;F=Hz(I.i,H);K=false;if((a.g&6)!=0){K=true;for(o=0;o<J;o++){if(!Yh(a.i,F[o])){K=false;break}}}if(!K){r=false;for(p=0;p<J;p++){if(bj(a.i,F[p])==J){r=true;break}}if(r){G=Hz(I.j,H);Rf(a,F,G);for(o=0;o<J;o++){a.a[F[o]]=true;a.c[G[o]]=true}}}}for(h=0;h<a.d;h++){if(Fj(a.i,h)&&!a.c[h]){M=dg(a,h);F=M.a;G=M.b;Rf(a,F,G);for(o=0;o<M.a.length;o++){a.a[F[o]]=true;a.c[G[o]]=true}}}for(i=0;i<a.d;i++){if(!a.c[i]&&Hh(a.i,i)==3){e=Ah(a.i,0,i);f=Ah(a.i,1,i);w=a.e[e]+a.e[f];if(w>2){m=new Fg(a,a.i,w);k=0;for(p=0;p<a.e[e];p++){j=ej(a.i,e,p);if(j!=f){m.a[k++]=j;a.a[j]=true;a.c[gj(a.i,e,p)]=true}}m.a[k++]=e;m.a[k++]=f;for(q=0;q<a.e[f];q++){j=ej(a.i,f,q);if(j!=e){m.a[k++]=j;a.a[j]=true;a.c[gj(a.i,f,q)]=true}}for(o=0;o<w;o++){m.c[o]=o;m.d[o]=0;m.q[o]=1}a.a[e]=true;a.a[f]=true;a.c[i]=true;Gz(a.f,m)}}}for(g=0;g<a.d;g++){if(!a.c[g]&&Hh(a.i,g)==2){b=jq(Eq,uB,0,a.b,7,1);for(o=0;o<2;o++){b[0]=Ah(a.i,o,g);b[1]=Ah(a.i,1-o,g);if($i(a.i,b[0])==1&&$i(a.i,b[1])==2&&a.e[b[1]]==2){a.a[b[0]]=true;a.a[b[1]]=true;a.c[g]=true;v=1;do{A=ej(a.i,b[v],0)==b[v-1]?1:0;b[v+1]=ej(a.i,b[v],A);if($i(a.i,b[v+1])==2&&a.e[b[v+1]]>2)break;a.a[b[v+1]]=true;a.c[gj(a.i,b[v],A)]=true;++v}while($i(a.i,b[v])==2&&a.e[b[v]]==2);w=a.e[b[0]]+a.e[b[v]]+v-1;m=new Fg(a,a.i,w);for(t=0;t<=v;t++){m.c[t]=t;m.d[t]=0;m.q[t]=64;m.a[t]=b[t]}l=v+1;n=false;for(u=0;u<a.e[b[0]];u++){j=ej(a.i,b[0],u);if(j!=b[1]){m.c[l]=-0.5;m.d[l]=n?sx(YB):-sx(YB);m.q[l]=64;m.a[l]=j;++l;n=true}}n=false;for(s=0;s<a.e[b[v]];s++){j=ej(a.i,b[v],s);if(j!=b[v-1]){m.c[l]=v+0.5;m.d[l]=n?-sx(YB):sx(YB);m.q[l]=64;m.a[l]=j;++l;n=true}}Gz(a.f,m)}}}}for(c=0;c<a.b;c++){if(a.e[c]==4){B=jq(Eq,uB,0,4,7,1);C=jq(Eq,uB,0,4,7,1);D=0;for(p=0;p<4;p++){B[D]=ej(a.i,c,p);C[D]=gj(a.i,c,p);a.e[B[D]]==1&&!a.c[C[D]]&&++D}if(D==2){m=new Fg(a,a.i,3);for(o=0;o<2;o++){a.a[B[o]]=true;a.c[C[o]]=true;m.a[o]=B[o];m.q[o]=32}m.c[0]=-0.5;m.d[0]=0.866;m.c[1]=0.5;m.d[1]=0.866;m.c[2]=0;m.d[2]=0;m.q[2]=32;m.a[2]=c;Gz(a.f,m)}if(D==3){for(q=0;q<2;q++){if(Hh(a.i,C[q])==1){L=B[q];B[q]=B[2];B[2]=L;L=C[q];C[q]=C[2];C[2]=L}}m=new Fg(a,a.i,4);for(o=0;o<3;o++){a.a[B[o]]=true;a.c[C[o]]=true;m.a[o]=B[o];m.q[o]=32}m.c[0]=-1;m.d[0]=0;m.c[1]=1;m.d[1]=0;m.c[2]=0;m.d[2]=1;m.c[3]=0;m.d[3]=0;m.q[3]=32;m.a[3]=c;Gz(a.f,m)}}}}
	function Vg(){Vg=rt;Sg=mq(iq(Cs,1),GB,2,4,['?','H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','??','R4','R5','R6','R7','R8','R9','R10','R11','R12','R13','R14','R15','R16','R1','R2','R3','A','A1','A2','A3','??','??','D','T','X','R','H2','H+','Nnn','HYD','Pol','??','??','??','??','??','??','??','??','??','??','??','Ala','Arg','Asn','Asp','Cys','Gln','Glu','Gly','His','Ile','Leu','Lys','Met','Phe','Pro','Ser','Thr','Trp','Tyr','Val']);Ug=mq(iq(it,1),bC,0,7,[0,1,4,7,9,11,12,14,16,19,20,23,24,27,28,31,32,35,40,39,40,45,48,51,52,55,56,59,58,63,64,69,74,75,80,79,84,85,88,89,90,93,98,0,102,103,106,107,114,115,120,121,130,127,132,133,138,139,140,141,142,0,152,153,158,159,164,165,166,169,174,175,180,181,184,187,192,193,195,197,202,205,208,209,0,0,0,0,0,0,232,0,238,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,71,156,114,115,103,128,129,57,137,113,113,128,131,147,97,87,101,186,163,99]);Tg=mq(iq(Aq,2),GB,9,0,[null,mq(iq(Aq,1),eC,0,7,[1]),mq(iq(Aq,1),eC,0,7,[0]),mq(iq(Aq,1),eC,0,7,[1]),mq(iq(Aq,1),eC,0,7,[2]),mq(iq(Aq,1),eC,0,7,[3]),mq(iq(Aq,1),eC,0,7,[4]),mq(iq(Aq,1),eC,0,7,[3]),mq(iq(Aq,1),eC,0,7,[2]),mq(iq(Aq,1),eC,0,7,[1]),mq(iq(Aq,1),eC,0,7,[0]),mq(iq(Aq,1),eC,0,7,[1]),mq(iq(Aq,1),eC,0,7,[2]),mq(iq(Aq,1),eC,0,7,[3]),mq(iq(Aq,1),eC,0,7,[4]),mq(iq(Aq,1),eC,0,7,[3,5]),mq(iq(Aq,1),eC,0,7,[2,4,6]),mq(iq(Aq,1),eC,0,7,[1,3,5,7]),mq(iq(Aq,1),eC,0,7,[0]),mq(iq(Aq,1),eC,0,7,[1]),mq(iq(Aq,1),eC,0,7,[2]),null,null,null,null,null,null,null,null,null,null,mq(iq(Aq,1),eC,0,7,[2,3]),mq(iq(Aq,1),eC,0,7,[2,4]),mq(iq(Aq,1),eC,0,7,[3,5]),mq(iq(Aq,1),eC,0,7,[2,4,6]),mq(iq(Aq,1),eC,0,7,[1,3,5,7]),mq(iq(Aq,1),eC,0,7,[0,2]),mq(iq(Aq,1),eC,0,7,[1,2,3,4]),mq(iq(Aq,1),eC,0,7,[2]),null,null,null,null,null,null,null,null,null,null,mq(iq(Aq,1),eC,0,7,[1,2,3]),mq(iq(Aq,1),eC,0,7,[2,4]),mq(iq(Aq,1),eC,0,7,[3,5]),mq(iq(Aq,1),eC,0,7,[2,4,6]),mq(iq(Aq,1),eC,0,7,[1,3,5,7]),mq(iq(Aq,1),eC,0,7,[0,2,4,6]),mq(iq(Aq,1),eC,0,7,[1]),mq(iq(Aq,1),eC,0,7,[2])])}
	function km(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T;a.b=b;bh(a.b);G=null;i=jq(Eq,uB,0,64,7,1);i[0]=-1;J=jq(Eq,uB,0,64,7,1);K=jq(Eq,uB,0,64,7,1);for(s=0;s<64;s++)J[s]=-1;I=0;g=0;N=false;H=false;L=false;k=0;M=c.length;j=1;while(c[I]<=32)++I;while(I<M){O=c[I++]&gC;if(Yv(O)||O==42){h=0;p=-1;u=false;F=false;t=false;if(N){if(O==82&&Xv(c[I]&gC)){A=Xv(c[I+1]&gC)?2:1;h=Ri(Tx(c,I-1,1+A));I+=A}else{v=_v(c[I]&gC)==(c[I]&gC)&&Yv(c[I]&gC)?2:1;h=Ri(Tx(c,I-1,v));I+=v-1;p=0}if(c[I]==64){++I;if(c[I]==64){t=true;++I}F=true}if(c[I]==72){++I;p=1;if(Xv(c[I]&gC)){p=c[I]-48;++I}}}else if(O==42){h=6;u=true}else{switch(String.fromCharCode(O).toUpperCase().charCodeAt(0)){case 66:if(I<M&&c[I]==114){h=35;++I}else h=5;break;case 67:if(I<M&&c[I]==108){h=17;++I}else h=6;break;case 70:h=9;break;case 73:h=53;break;case 78:h=7;break;case 79:h=8;break;case 80:h=15;break;case 83:h=16;}}if(h==0)throw new Lo('SmilesParser: unknown element label found');f=Xg(a.b,h);if(u){L=true;ti(a.b,f,1)}else{qi(a.b,f,_v(O)==O&&Yv(O))}if(p!=-1&&h!=1){l=jq(Aq,eC,0,1,7,1);l[0]=yq(p);li(a.b,f,l)}q=i[k];i[k]!=-1&&j!=128&&Yg(a.b,f,i[k],j);j=1;i[k]=f;if(g!=0){ri(a.b,f,g);g=0}if(d){C=!G?null:lz(G,Ww(q));!!C&&qm(C,f,I,h==1);if(F){!G&&(G=new OA);MA(G,Ww(f),new tm(a,f,q,p,I,t))}}continue}if(O==46){j=128;continue}if(O==61){j=2;continue}if(O==35){j=4;continue}if(Xv(O)){B=O-48;if(N){while(I<M&&Xv(c[I]&gC)){B=10*B+c[I]-48;++I}g=B}else{if(H&&I<M&&Xv(c[I]&gC)){B=10*B+c[I]-48;++I}H=false;if(B>=64)throw new Lo('SmilesParser: ringClosureAtom number out of range');if(J[B]==-1){J[B]=i[k];K[B]=I-1}else{if(d&&!!G){C=lz(G,Ww(J[B]));!!C&&qm(C,i[k],K[B],false);C=lz(G,Ww(i[k]));!!C&&qm(C,J[B],I-1,false)}Yg(a.b,i[k],J[B],j);J[B]=-1}j=1}continue}if(O==43){if(!N)throw new Lo("SmilesParser: '+' found outside brackets");m=1;while(c[I]==43){++m;++I}if(m==1&&Xv(c[I]&gC)){m=c[I]-48;++I}hi(a.b,i[k],m);continue}if(O==45){if(!N)continue;m=-1;while(c[I]==45){--m;++I}if(m==-1&&Xv(c[I]&gC)){m=48-c[I];++I}hi(a.b,i[k],m);continue}if(O==40){if(i[k]==-1)throw new Lo('Smiles with leading parenthesis are not supported');i[k+1]=i[k];++k;continue}if(O==41){--k;continue}if(O==91){if(N)throw new Lo('SmilesParser: nested square brackets found');N=true;continue}if(O==93){if(!N)throw new Lo('SmilesParser: closing bracket without opening one');N=false;continue}if(O==37){H=true;continue}if(O==58){if(!N){j=64;continue}w=0;while(Xv(c[I]&gC)){w=10*w+c[I]-48;++I}pi(a.b,i[k],w);continue}if(O==47){d&&(j=17);continue}if(O==92){d&&(j=9);continue}throw new Lo("SmilesParser: unexpected character found: '"+qq(O)+"'")}r=mj(a.b);Ji(a.b,true);xm(a.b,1);for(e=0;e<a.b.p;e++){if((b.s==null?null:b.s[e]==null?null:Mx(b.s[e]))!=null){if(!Yh(a.b,e)){o=ih(a.b,e)[0];if(wh(a.b,e)<(Vg(),Tg).length&&Tg[wh(a.b,e)]!=null){n=false;P=pj(a.b,e)-Lh(a.b,e);for(R=Tg[wh(a.b,e)],S=0,T=R.length;S<T;++S){Q=R[S];if(P<=Q){n=true;Q!=P+o&&fi(a.b,e,P+o);break}}n||fi(a.b,e,P+o)}}}}im(a);jm(a);a.b.s=null;Ji(a.b,false);d&&om(a)&&(a.b.R|=4);if(d){fg(new qg,a.b);if(G){for(D=Wy(new Xy(G));Ey(D.a.a);){C=_y(D);si(a.b,C.a,rm(C,r),false)}a.b.R|=4}Pj(a.b);Fm(a.b)}L&&Ii(a.b,true)}
	function Lk(b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X;try{D=zv(c);if(null==D){tk&&(ny(),my);return false}if(null==zv(c)){tk&&(ny(),my);return false}if(null==zv(c)){tk&&(ny(),my);return false}if(null==(w=zv(c))){tk&&(ny(),my);return false}try{F=xw(Lx(w.substr(0,3)));G=xw(Lx(w.substr(3,3)));H=Kk(Lx(w.substr(6,3)));n=Kk(Lx(w.substr(12,3)));T=w.length>=39&&Dx(w.substr(34,5),'V3000')?3:2}catch(a){a=nt(a);if(sq(a,10)){tk&&(ny(),my);return false}else throw mt(a)}if(b.c){bh(b.c);Ii(b.c,false)}if(T==3){K=Mk(b,c);Mi(b.c,D);return K}!b.c&&(b.c=new Hm(F,G));Mi(b.c,D);n==0&&(b.c.M=true);if(0==F){while(w!=null&&!(Dx(w,'M  END')||Dx(w,'$$$$')||Dx(Nx(w,1,w.length-1),'$'))){w=zv(c)}return true}for(r=0;r<F;r++){if(null==(w=zv(c))){tk&&(ny(),my);return false}V=Iw(Lx(w.substr(0,10)));W=Iw(Lx(w.substr(10,10)));X=Iw(Lx(w.substr(20,10)));e=Wg(b.c,V,-W,-X);v=Lx(w.substr(31,3));h=Ri(v);Ai(b.c,e,h);Dx(v,'A')&&ti(b.c,e,1);C=Kk(Lx(w.substr(34,2)));C!=0&&ri(b.c,e,(Vg(),Ug)[h]+C);m=Kk(Lx(w.substr(36,3)));m!=0&&hi(b.c,e,4-m);A=w.length<63?0:Kk(Lx(w.substr(60,3)));pi(b.c,e,A);p=w.length<45?0:Kk(Lx(w.substr(42,3)));switch(p){case 0:break;case 1:ti(b.c,e,768);break;case 2:ti(b.c,e,128);break;case 3:ti(b.c,e,384);break;default:ti(b.c,e,896);}w.length>=48&&w.charCodeAt(47)==49&&ti(b.c,e,8192);S=w.length<51?0:Kk(Lx(w.substr(48,3)));switch(S){case 0:break;case 15:fi(b.c,e,0);break;default:fi(b.c,e,S);}}for(s=0;s<G;s++){if(null==(w=zv(c))){tk&&(ny(),my);return false}f=xw(Lx(w.substr(0,3)))-1;g=xw(Lx(w.substr(3,3)))-1;k=xw(Lx(w.substr(6,3)));M=w.length<12?0:Kk(Lx(w.substr(9,3)));Q=w.length<18?0:Kk(Lx(w.substr(15,3)));uk(b,f,g,k,M,Q)}for(q=0;q<H;q++){if(null==zv(c)){tk&&(ny(),my);return false}}if(null==(w=zv(c))){tk&&(ny(),my);n==0&&xm(b.c,7);return true}while(w!=null&&!(Dx(w,'M  END')||Dx(w,'$$$$'))){if(Dx(w.substr(0,6),'M  CHG')){t=xw(Lx(w.substr(6,3)));if(t>0){d=10;U=14;for(u=1;u<=t;++u,d+=8,U+=8){e=xw(Lx(w.substr(d,d+3-d)))-1;l=xw(Lx(w.substr(U,U+3-U)));hi(b.c,e,l)}}}if(Dx(w.substr(0,6),'M  ISO')){t=xw(Lx(w.substr(6,3)));if(t>0){d=10;U=14;for(u=1;u<=t;++u,d+=8,U+=8){e=xw(Lx(w.substr(d,d+3-d)))-1;B=xw(Lx(w.substr(U,U+3-U)));ri(b.c,e,B)}}}if(Dx(w.substr(0,6),'M  RAD')){t=xw(Lx(w.substr(6,3)));if(t>0){d=10;U=14;for(u=1;u<=t;++u,d+=8,U+=8){e=xw(Lx(w.substr(d,d+3-d)))-1;J=xw(Lx(w.substr(U,U+3-U)));switch(J){case 1:ui(b.c,e,16);break;case 2:ui(b.c,e,32);break;case 3:ui(b.c,e,48);}}}}if(Dx(w.substr(0,6),'M  RBD')){t=xw(Lx(w.substr(6,3)));if(t>0){d=10;U=14;for(u=1;u<=t;++u,d+=8,U+=8){e=xw(Lx(w.substr(d,d+3-d)))-1;L=xw(Lx(w.substr(U,U+3-U)));switch(L){case 3:case -1:ti(b.c,e,112);break;case 1:ti(b.c,e,8);break;case 2:ti(b.c,e,104);break;case 4:ti(b.c,e,56);}}}}if(Dx(w.substr(0,6),'M  ALS')){e=xw(Lx(w.substr(7,3)))-1;if(e>=0){I=xw(Lx(w.substr(10,3)));i=w.charCodeAt(14)==84;R=jq(Eq,uB,0,I,7,1);d=16;for(u=0;u<I;++u,d+=4){P=Lx(w.substr(d,d+4-d));R[u]=Ri(P)}oi(b.c,e,R,i)}}if(Dx(w.substr(0,6),'M  SUB')){t=xw(Lx(w.substr(6,3)));if(t>0){d=10;U=14;for(u=1;u<=t;++u,d+=8,U+=8){e=xw(Lx(w.substr(d,d+3-d)))-1;N=xw(Lx(w.substr(U,U+3-U)));if(N==-2){ti(b.c,e,RB)}else if(N>0){O=0;for(j=0;j<b.c.q;j++){(Ah(b.c,0,j)==e||Ah(b.c,1,j)==e)&&++O}N>O&&ti(b.c,e,HB)}}}}w=zv(c)}}catch(a){a=nt(a);if(sq(a,10)){o=a;Io(o,ny());return false}else throw mt(a)}xm(b.c,7);return true}
	function sk(a,b){var c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T;this.a=new ry;xm(a,7);H=true;for(d=0;d<a.d;d++){if((a.t[d]&3)!=0&&(a.t[d]&3)!=3&&(a.t[d]&lC)>>19!=1){H=false;break}}J=-1;if(H){A=jq(Eq,uB,0,32,7,1);for(e=0;e<a.d;e++){if((a.t[e]&3)!=0&&(a.t[e]&3)!=3&&(a.t[e]&lC)>>19==1){C=(a.t[e]&lC)>>19!=1&&(a.t[e]&lC)>>19!=2?-1:(a.t[e]&mC)>>21;++A[C];0<A[C]&&(J=C);break}}}this.b=b;L=a.P!=null?a.P:'';gy(this.b,L+'\n');gy(this.b,'Actelion Java MolfileCreator 1.0\n\n');qk(this,a.p);qk(this,a.q);gy(this.b,'  0  0');qk(this,H?0:1);gy(this.b,'  0  0  0  0  0999 V2000\n');D=a.p==1;for(g=1;g<a.p;g++){if(a.B[g]!=a.B[0]||a.C[g]!=a.C[0]||a.D[g]!=a.D[0]){D=true;break}}B=1;if(D){p=yh(a,a.q);if(p!=0){(p<1||p>3)&&(B=1.5/p)}else{K=vC;for(e=1;e<a.p;e++){for(f=0;f<e;f++){u=a.B[f]-a.B[e];v=a.C[f]-a.C[e];w=a.D[f]-a.D[e];t=u*u+v*v+w*w;K>t&&(K=t)}}B=3/K}}for(h=0;h<a.p;h++){if(D){pk(this,B*a.B[h]);pk(this,B*-a.C[h]);pk(this,B*-a.D[h])}else{gy(this.b,'    0.0000    0.0000    0.0000')}if((a.u==null?null:a.u[h])!=null)gy(this.b,' L  ');else if((a.A[h]&1)!=0)gy(this.b,' A  ');else{n=(Vg(),Sg)[a.F[h]];gy(this.b,' '+n);n.length==1?gy(this.b,'  '):n.length==2&&gy(this.b,' ')}gy(this.b,' 0  0  0');F=1920&a.A[h];F==0?gy(this.b,'  0'):F==384?gy(this.b,'  3'):F==128?gy(this.b,'  2'):F==1792?gy(this.b,'  1'):F==1664&&gy(this.b,'  2');gy(this.b,(a.A[h]&8192)!=0?'  1':'  0');T=((a.t[h]&kC)>>>28)-1;T==-1?gy(this.b,'  0'):T==0?gy(this.b,' 15'):qk(this,T);gy(this.b,'  0  0  0');qk(this,ix(a.v[h]));gy(this.b,'  0  0\n')}for(q=0;q<a.q;q++){switch(a.J[q]){case 1:N=1;Q=0;break;case 2:N=2;Q=0;break;case 4:N=3;Q=0;break;case 9:N=1;Q=6;break;case 17:N=1;Q=1;break;case 26:N=2;Q=3;break;case 64:N=4;Q=0;break;default:N=1;Q=0;}H&&(Q==1||Q==6)&&jh(a,a.G[0][q])!=J&&(Q=0);r=a.I[q]&15;r!=0&&(r==8?(N=4):r==3?(N=5):r==9?(N=6):r==10?(N=7):(N=8));P=a.I[q]&48;S=P==0?0:P==32?1:2;qk(this,1+a.G[0][q]);qk(this,1+a.G[1][q]);qk(this,N);qk(this,Q);gy(this.b,'  0');qk(this,S);gy(this.b,'  0\n')}M=0;for(i=0;i<a.p;i++)a.r[i]!=0&&++M;if(M!=0){gy(this.b,'M  CHG');qk(this,M);for(e=0;e<a.p;e++){if(a.r[e]!=0){gy(this.b,' ');qk(this,e+1);s=a.r[e];if(s<0){gy(this.b,'  -');s=-s}else gy(this.b,'   ');dy(this.b,48+s&gC)}}gy(this.b,'\n')}M=0;for(j=0;j<a.p;j++)a.w[j]==0||++M;if(M!=0){gy(this.b,'M  ISO');qk(this,M);for(e=0;e<a.p;e++){if(a.w[e]!=0){gy(this.b,' ');qk(this,e+1);gy(this.b,' ');qk(this,a.w[e])}}gy(this.b,'\n')}M=0;for(k=0;k<a.p;k++)(a.t[k]&48)!=0&&++M;if(M!=0){gy(this.b,'M  RAD');qk(this,M);for(c=0;c<a.p;c++){if((a.t[c]&48)!=0){gy(this.b,' ');qk(this,c+1);switch(a.t[c]&48){case 16:gy(this.b,'   1');break;case 32:gy(this.b,'   2');break;case 48:gy(this.b,'   3');}}}gy(this.b,'\n')}if(a.L){M=0;for(e=0;e<a.p;e++)(a.A[e]&120)!=0&&++M;if(M!=0){gy(this.b,'M  RBD');qk(this,M);for(f=0;f<a.p;f++){O=a.A[f]&120;if(O!=0){gy(this.b,' ');qk(this,f+1);switch(O){case 112:gy(this.b,'  -1');break;case 8:gy(this.b,'   1');break;case 104:gy(this.b,'   2');break;case 88:gy(this.b,'   3');break;case 56:gy(this.b,'   4');}}}gy(this.b,'\n')}for(l=0;l<a.p;l++){o=a.u==null?null:a.u[l];if(o!=null){gy(this.b,'M  ALS ');qk(this,l+1);qk(this,o.length);gy(this.b,(a.A[l]&1)!=0?' T ':' F ');for(G=0;G<o.length;G++){I=(Vg(),Sg)[o[G]];switch(I.length){case 1:gy(this.b,I+'   ');break;case 2:gy(this.b,I+'  ');break;case 3:gy(this.b,I+' ');break;default:gy(this.b,'   ?');}}gy(this.b,'\n')}}M=0;for(m=0;m<a.p;m++)(a.A[m]&6144)!=0&&++M;if(M!=0){gy(this.b,'M  SUB');qk(this,M);for(c=0;c<a.p;c++){R=a.A[c]&6144;if(R!=0){gy(this.b,' ');qk(this,c+1);(R&HB)!=0?gy(this.b,'   '+(a.c[c]+1)):gy(this.b,'  -2')}}gy(this.b,'\n')}}gy(this.b,'M  END\n')}
	function He(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W;ue(a);te(a,9,4);S=nx(Je(a.L.d),Je(a.L.e));te(a,S,4);if(S==0){te(a,a.L.L?1:0,1);te(a,0,1);a.F=(a.s<<=a.q,dy(a.r,a.s+64&gC),a.r.a);return}T=V=U=F=0;for(f=0;f<a.L.d;f++){if((rh(a.L,f)&1)==0){switch(wh(a.L,f)){case 6:break;case 7:++T;break;case 8:++V;break;default:++U;}fh(a.L,f)!=0&&++F}}te(a,a.L.d,S);te(a,a.L.e,S);te(a,T,S);te(a,V,S);te(a,U,S);te(a,F,S);for(g=0;g<a.L.d;g++)wh(a.L,a.u[g])==7&&(rh(a.L,a.u[g])&1)==0&&te(a,g,S);for(l=0;l<a.L.d;l++)wh(a.L,a.u[l])==8&&(rh(a.L,a.u[l])&1)==0&&te(a,l,S);for(m=0;m<a.L.d;m++)if(wh(a.L,a.u[m])!=6&&wh(a.L,a.u[m])!=7&&wh(a.L,a.u[m])!=8&&(rh(a.L,a.u[m])&1)==0){te(a,m,S);te(a,wh(a.L,a.u[m]),8)}for(n=0;n<a.L.d;n++)if(fh(a.L,a.u[n])!=0&&(rh(a.L,a.u[n])&1)==0){te(a,n,S);te(a,8+fh(a.L,a.u[n]),4)}R=0;u=0;for(o=1;o<a.L.d;o++){if(a.A[o]==-1){J=0}else{J=1+a.A[o]-u;u=a.A[o]}R<J&&(R=J)}I=Je(R);te(a,I,4);u=0;for(p=1;p<a.L.d;p++){if(a.A[p]==-1){J=0}else{J=1+a.A[p]-u;u=a.A[p]}te(a,J,I)}for(L=0;L<2*a.D;L++)te(a,a.w[L],S);for(w=0;w<a.L.e;w++){D=(Jh(a.L,w)&UB)!=0?1:Cj(a.L,a.v[w])?0:Hh(a.L,a.v[w]);te(a,D,2)}c=0;for(q=0;q<a.L.d;q++)a.S[a.u[q]]!=0&&a.S[a.u[q]]!=3&&++c;te(a,c,S);for(r=0;r<a.L.d;r++)if(a.S[a.u[r]]!=0&&a.S[a.u[r]]!=3){te(a,r,S);if(a.U[a.u[r]]==0){te(a,a.S[a.u[r]],3)}else{W=a.S[a.u[r]]==1?a.U[a.u[r]]==1?4:6:a.U[a.u[r]]==1?5:7;te(a,W,3);te(a,a.T[a.u[r]],3)}}b=0;for(A=0;A<a.L.e;A++)a.i[a.v[A]]!=0&&a.i[a.v[A]]!=3&&(!Hj(a.L,a.v[A])||Kh(a.L,a.v[A])==1)&&++b;te(a,b,S);for(B=0;B<a.L.e;B++)if(a.i[a.v[B]]!=0&&a.i[a.v[B]]!=3&&(!Hj(a.L,a.v[B])||Kh(a.L,a.v[B])==1)){te(a,B,S);if(Kh(a.L,a.v[B])==1){if(a.k[a.v[B]]==0){te(a,a.i[a.v[B]],3)}else{W=a.i[a.v[B]]==1?a.k[a.v[B]]==1?4:6:a.k[a.v[B]]==1?5:7;te(a,W,3);te(a,a.j[a.v[B]],3)}}else{te(a,a.i[a.v[B]],2)}}te(a,a.L.L?1:0,1);G=0;for(s=0;s<a.L.d;s++)ph(a.L,a.u[s])!=0&&++G;if(G!=0){te(a,1,1);te(a,1,4);te(a,G,S);for(h=0;h<a.L.d;h++){if(ph(a.L,a.u[h])!=0){te(a,h,S);te(a,ph(a.L,a.u[h]),8)}}}N=false;if(a.L.L){Id(a,0,false,S,RB,1,-1);Jd(a,2,false,S,64,1,-1);Id(a,3,false,S,HB,1,-1);Id(a,4,false,S,120,4,3);Id(a,5,false,S,6,2,1);Id(a,6,false,S,1,1,-1);Id(a,7,false,S,1920,4,7);G=0;for(h=0;h<a.L.d;h++)mh(a.L,a.u[h])!=null&&++G;if(G>0){te(a,1,1);te(a,8,4);te(a,G,S);for(i=0;i<a.L.d;i++){t=mh(a.L,a.u[i]);if(t!=null){te(a,i,S);te(a,t.length,4);for(K=0;K<t.length;K++)te(a,t[K],8)}}}Jd(a,9,false,S,48,2,4);Jd(a,10,false,S,15,4,0);Id(a,11,false,S,8192,1,-1);Jd(a,12,false,S,UB,8,6);Id(a,13,false,S,MB,3,14);Id(a,14,false,S,4063232,5,17);N=N|Id(a,16,false,S,PB,3,22)}G=0;for(j=0;j<a.L.d;j++)a.a!=null&&a.a[a.u[j]]!=-1&&++G;if(G!=0){N=xe(a,N);te(a,1,1);te(a,1,4);te(a,G,S);for(h=0;h<a.L.d;h++){if(a.a!=null&&a.a[a.u[h]]!=-1){te(a,h,S);te(a,a.a[a.u[h]],4)}}}if((a.K&8)!=0){G=0;Q=0;for(h=0;h<a.L.d;h++){O=hh(a.L,a.u[h]);if(O!=null){++G;Q=nx(Q,O.length)}}if(G!=0){N=xe(a,N);P=Je(Q);te(a,1,1);te(a,2,4);te(a,G,S);te(a,P,4);for(i=0;i<a.L.d;i++){H=hh(a.L,a.u[i]);if(H!=null){te(a,i,S);te(a,H.length,P);for(K=0;K<H.length;K++)te(a,H.charCodeAt(K),7)}}}}if(a.L.L){N=N|Id(a,19,N,S,JB,3,25);N=N|Jd(a,20,N,S,MB,3,14)}G=0;for(k=0;k<a.L.d;k++)sh(a.L,a.u[k])!=0&&++G;if(G!=0){N=xe(a,N);te(a,1,1);te(a,5,4);te(a,G,S);for(e=0;e<a.L.d;e++){if(sh(a.L,a.u[e])!=0){te(a,e,S);te(a,sh(a.L,a.u[e])>>4,2)}}}if(a.L.L){N=N|Id(a,22,N,S,QB,1,-1);N=N|Jd(a,23,N,S,fC,1,-1);N=N|Jd(a,24,N,S,VB,2,18)}if((a.K&16)!=0){for(e=0;e<a.L.d;e++){if($h(a.L,a.u[e])){N=xe(a,N);te(a,1,1);te(a,9,4);for(d=0;d<a.L.d;d++)te(a,$h(a.L,a.u[d])?1:0,1);break}}}M=Ae(a);if(M!=null){G=0;for(C=0;C<a.L.e;C++)M[a.v[C]]&&++G;xe(a,N);te(a,1,1);te(a,10,4);te(a,G,S);for(v=0;v<a.L.e;v++)M[a.v[v]]&&te(a,v,S)}te(a,0,1);a.F=(a.s<<=a.q,dy(a.r,a.s+64&gC),a.r.a)}
	function Rc(a,b,c){var d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T;c&&Vl(a,b,(lh(a.D,b),Kg(a.G,th(a.D,b))),Lg(a.G,uh(a.D,b)));J=null;if(fh(a.D,b)!=0){P=ix(fh(a.D,b))==1?'':''+ix(fh(a.D,b));J=fh(a.D,b)<0?P+'-':P+'+'}B=null;K=rh(a.D,b);if(K!=0){(K&2)!=0&&(B='a');(K&4)!=0&&(B=B==null?'!a':B+','+'!a');(K&HB)!=0&&(B=B==null?'s':B+','+'s');if((K&1920)!=0){t=K&1920;t==1792?(B=B==null?'h0':B+','+'h0'):t==1664?(B=B==null?'h1':B+','+'h1'):t==1408?(B=B==null?'h2':B+','+'h2'):t==128?(B=B==null?'h>0':B+','+'h>0'):t==384?(B=B==null?'h>1':B+','+'h>1'):t==IB?(B=B==null?'h<3':B+','+'h<3'):t==1536&&(B=B==null?'h<2':B+','+'h<2')}if((K&JB)!=0){i=K&JB;i==167772160?(B=B==null?'c0':B+','+'c0'):i==KB?(B=B==null?'c+':B+','+'c+'):i==LB&&(B=B==null?'c-':B+','+'c-')}if((K&MB)!=0){I=K&MB;I==98304?(B=B==null?'pi0':B+','+'pi0'):I==81920?(B=B==null?'pi1':B+','+'pi1'):I==49152?(B=B==null?'pi2':B+','+'pi2'):I==NB&&(B=B==null?'pi>0':B+','+'pi>0')}if((K&4063232)!=0){H=K&4063232;H==3801088?(B=B==null?'n1':B+','+'n1'):H==3538944?(B=B==null?'n2':B+','+'n2'):H==3014656?(B=B==null?'n3':B+','+'n3'):H==3145728?(B=B==null?'n<3':B+','+'n<3'):H==2097152?(B=B==null?'n<4':B+','+'n<4'):H==OB?(B=B==null?'n>1':B+','+'n>1'):H==917504?(B=B==null?'n>2':B+','+'n>2'):H==1966080&&(B=B==null?'n>3':B+','+'n>3')}if((K&120)!=0){L=K&120;L==112?(B=B==null?'c':B+','+'c'):L==8?(B=B==null?'r':B+','+'r'):L==104?(B=B==null?'rb2':B+','+'rb2'):L==88?(B=B==null?'rb3':B+','+'rb3'):L==56&&(B=B==null?'rb4':B+','+'rb4')}(K&PB)!=0&&(B=B==null?'rs'+((K&PB)>>22):B+','+('rs'+((K&PB)>>22)));(K&QB)!=0&&(B=B==null?'sp2':B+','+'sp2')}ph(a.D,b)!=0&&(B=uc(B,''+ph(a.D,b)));O=0;if(sh(a.D,b)!=0){switch(sh(a.D,b)){case 16:J=J==null?'|':J+','+'|';break;case 32:O=1;break;case 48:O=2;}}A=null;if((a.B&64)==0){if(Oh(a.D,b))A='?';else if(eh(a.D,b)!=0){if(fj(a.D,b)==2){switch(eh(a.D,b)){case 2:A=Ph(a.D,b)?'p':'P';break;case 1:A=Ph(a.D,b)?'m':'M';break;default:A='*';}}else{switch(eh(a.D,b)){case 1:A=Ph(a.D,b)?'r':'R';break;case 2:A=Ph(a.D,b)?'s':'S';break;default:A='*';}}}}(a.B&1792)!=0&&(A=uc(A,''+Em(a.D,b)));F=null;(a.B&16)!=0&&oh(a.D,b)!=0&&(F=''+oh(a.D,b));o=null;if(wj(a.D,b)!=-1){n=Gc(a,b);n!=-1&&(o=n==0?'abs':((n&255)==1?'&':'or')+(1+(n>>8)))}u=0;(wh(a.D,b)!=6||!a.p[b]||(rh(a.D,b)&RB)!=0||sh(a.D,b)!=0)&&(u=oj(a.D,b));f=hh(a.D,b);if(f!=null){u=0}else if(mh(a.D,b)!=null){e=(rh(a.D,b)&1)!=0?'[!':'[';f=e+nh(a.D,b)+']';f.length>5&&(f=e+mh(a.D,b).length+']');(rh(a.D,b)&RB)!=0&&(u=-1)}else if((rh(a.D,b)&1)!=0){f='?';(rh(a.D,b)&RB)!=0&&(u=-1)}else (wh(a.D,b)!=6||J!=null||B!=null||u>0||!a.p[b])&&(f=lh(a.D,b));D=0;if(f!=null){D=Ul(a,f);Vc(a,Kg(a.G,th(a.D,b)),Lg(a.G,uh(a.D,b)),f,c,true);a.q[b]=true}else Lc(a,b)&&Uc(a,Kg(a.G,th(a.D,b)),Lg(a.G,uh(a.D,b)),b,c);if(J!=null){Zl(a,~~((a.L*2+1)/3));Q=Kg(a.G,th(a.D,b))+((D+Ul(a,J))/2+1);S=Lg(a.G,uh(a.D,b))-~~((a.j*4-4)/8);Vc(a,Q,S,J,c,true);Zl(a,a.L)}(a.B&2)!=0&&(B=''+b);if(B!=null){Zl(a,~~((a.L*2+1)/3));Q=Kg(a.G,th(a.D,b))-(D+Ul(a,B))/2;S=Lg(a.G,uh(a.D,b))-~~((a.j*4-4)/8);Vc(a,Q,S,B,c,true);Zl(a,a.L)}if(A!=null){Zl(a,~~((a.L*2+1)/3));Q=Kg(a.G,th(a.D,b))-(D+Ul(a,A))/2;S=Lg(a.G,uh(a.D,b))+~~((a.j*4+4)/8);N=a.w;hd(a,128);Vc(a,Q,S,A,c,false);hd(a,N);Zl(a,a.L)}if(F!=null){Zl(a,~~((a.L*2+1)/3));Q=Kg(a.G,th(a.D,b))+((D+Ul(a,F))/2+1);S=Lg(a.G,uh(a.D,b))+~~((a.j*4+4)/8);N=a.w;hd(a,Rh(a.D,b)?384:448);Vc(a,Q,S,F,c,true);hd(a,N);Zl(a,a.L)}if(o!=null){d=Zc(a,b);Zl(a,~~((a.L*2+1)/3));Q=Kg(a.G,th(a.D,b))+a.j*SB*sx(d);S=Lg(a.G,uh(a.D,b))+a.j*SB*jx(d);N=a.w;hd(a,Fc(a,b));Vc(a,Q,S,o,c,false);hd(a,N);Zl(a,a.L)}if(u==0&&O==0)return;r=jq(Dq,xB,0,4,7,1);for(w=0;w<Yi(a.D,b);w++){h=gj(a.D,b,w);for(C=0;C<2;C++){if(Ah(a.D,C,h)==b){M=zh(a.D,Ah(a.D,C,h),Ah(a.D,1-C,h));if(M<TB){r[0]-=M+EB;r[3]+=M+CB}else if(M<0){r[2]+=M+EB;r[3]-=M}else if(M<EB){r[1]+=M;r[2]+=EB-M}else{r[0]+=M-EB;r[1]+=CB-M}}}}fj(a.D,b)==0?Xh(a.D,b)?(r[3]-=0.2):(r[1]-=0.2):(r[1]-=0.1);(J!=null||F!=null)&&(r[1]+=10);(B!=null||A!=null)&&(r[3]+=10);p='';if(u!=0){s=Ul(a,'H');q=0;if(u==-1){p='n';Zl(a,~~((a.L*2+1)/3));q=Ul(a,p)}else if(u>1){p=''+u;Zl(a,~~((a.L*2+1)/3));q=Ul(a,p)}if(r[1]<0.6||r[3]<0.6){k=Lg(a.G,uh(a.D,b));if(r[1]<=r[3]){r[1]+=10;j=Kg(a.G,th(a.D,b))+(D+s)/2}else{r[3]+=10;j=Kg(a.G,th(a.D,b))-(D+s)/2-q}}else{j=Kg(a.G,th(a.D,b));if(r[0]<r[2]){r[0]+=10;k=Lg(a.G,uh(a.D,b))-a.j}else{r[2]+=10;k=Lg(a.G,uh(a.D,b))+a.j}}if(q>0){Q=j+(s+q)/2;S=k+~~((a.j*4+4)/8);Vc(a,Q,S,p,c,true);Zl(a,a.L)}Vc(a,j,k,'H',c,true)}g=0;if(O!=0){G=50;l=0;for(v=0;v<4;v++){m=v>1?v-2:v+2;if(r[v]<G){g=v;G=r[v];l=r[m]}else if(r[v]==G){if(r[m]>l){g=v;l=r[m]}}}switch(g){case 0:j=Kg(a.G,th(a.D,b));k=Lg(a.G,uh(a.D,b))-a.K-D/2;break;case 1:j=Kg(a.G,th(a.D,b))+a.K+D/2;k=Lg(a.G,uh(a.D,b));break;case 2:j=Kg(a.G,th(a.D,b));k=Lg(a.G,uh(a.D,b))+a.K+D/2;break;default:j=Kg(a.G,th(a.D,b))-a.K-D/2;k=Lg(a.G,uh(a.D,b));}if(O==1){Gz(a.O,new rv(j-a.K,k-a.K,2*a.K,2*a.K));c&&Gz(a.J,new nd(j,k,Jc(a,b)?-3:a.o[b]));return}switch(g){case 2:case 0:R=2*a.K;T=0;j-=a.K;break;case 1:R=0;T=2*a.K;k-=a.K;break;default:R=0;T=2*a.K;k-=a.K;}Gz(a.O,new rv(j-a.K,k-a.K,2*a.K,2*a.K));c&&Gz(a.J,new nd(j,k,Jc(a,b)?-3:a.o[b]));Gz(a.O,new rv(j+R-a.K,k+T-a.K,2*a.K,2*a.K));c&&Gz(a.J,new nd(j+R,k+T,Jc(a,b)?-3:a.o[b]))}}
	function Zj(a,b,c,d){var e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,A,B,C,D,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,$,ab,bb,cb,db,eb,fb,gb,hb,ib,jb,kb,lb,mb,nb,ob,pb,qb,rb,sb,tb,ub,vb,wb,xb,yb,zb,Ab,Bb,Cb,Db,Eb,Fb,Gb,Hb,Ib,Jb,Kb,Lb,Mb,Nb,Ob,Pb,Qb,Rb,Sb,Tb,Ub,Vb,Wb,Xb,Yb,Zb,$b,_b,ac,bc,cc,dc,ec,fc,gc;ac=8;a.f=b;bh(a.f);if(c==null||c.length==0)return;d!=null&&d.length==0&&(d=null);Uj(a,c,0);g=Tj(a,4);v=Tj(a,4);if(g>8){ac=g;g=v}if(g==0){Ii(a.f,Tj(a,1)==1);return}h=Tj(a,g);i=Tj(a,v);Rb=Tj(a,g);Vb=Tj(a,g);Ub=Tj(a,g);J=Tj(a,g);for(m=0;m<h;m++)Xg(a.f,6);for(cb=0;cb<Rb;cb++)Ai(a.f,Tj(a,g),7);for(db=0;db<Vb;db++)Ai(a.f,Tj(a,g),8);for(ob=0;ob<Ub;ob++)Ai(a.f,Tj(a,g),Tj(a,8));for(zb=0;zb<J;zb++)hi(a.f,Tj(a,g),Tj(a,4)-8);K=1+i-h;Q=Tj(a,4);u=0;xi(a.f,0,0);yi(a.f,0,0);zi(a.f,0,0);R=d!=null&&d[0]>=39;_b=0;cc=0;ec=0;gc=0;M=false;N=false;if(R){if(d.length>2*h-2&&d[2*h-2]==39||d.length>3*h-3&&d[3*h-3]==39){N=true;M=d.length==3*h-3+9;Jb=M?3*h-3:2*h-2;t=86*(d[Jb+1]-40)+d[Jb+2]-40;_b=Math.pow(10,t/2000-1);Jb+=2;bc=86*(d[Jb+1]-40)+d[Jb+2]-40;cc=Math.pow(10,bc/1500-1);Jb+=2;dc=86*(d[Jb+1]-40)+d[Jb+2]-40;ec=Math.pow(10,dc/1500-1);if(M){Jb+=2;fc=86*(d[Jb+1]-40)+d[Jb+2]-40;gc=Math.pow(10,fc/1500-1)}}else{M=d.length==3*h-3}}if(a.b&&M){d=null;R=false}for(Db=1;Db<h;Db++){S=Tj(a,Q);if(S==0){if(R){xi(a.f,Db,a.f.B[0]+8*(d[Db*2-2]-83));yi(a.f,Db,a.f.C[0]+8*(d[Db*2-1]-83));M&&zi(a.f,Db,a.f.D[0]+8*(d[2*h-3+Db]-83))}++K;continue}u+=S-1;if(R){xi(a.f,Db,th(a.f,u)+d[Db*2-2]-83);yi(a.f,Db,uh(a.f,u)+d[Db*2-1]-83);M&&zi(a.f,Db,vh(a.f,u)+(d[2*h-3+Db]-83))}Yg(a.f,u,Db,1)}for(Eb=0;Eb<K;Eb++)Yg(a.f,Tj(a,g),Tj(a,g),1);Lb=jq(jt,yB,0,i,8,1);for(D=0;D<i;D++){F=Tj(a,2);switch(F){case 0:Lb[D]=true;break;case 2:Gi(a.f,D,2);break;case 3:Gi(a.f,D,4);}}f=Tj(a,g);for(Fb=0;Fb<f;Fb++){l=Tj(a,g);if(ac==8){Wb=Tj(a,2);if(Wb==3){mi(a.f,l,1,0);si(a.f,l,1,false)}else{si(a.f,l,Wb,false)}}else{Wb=Tj(a,3);switch(Wb){case 4:si(a.f,l,1,false);mi(a.f,l,1,Tj(a,3));break;case 5:si(a.f,l,2,false);mi(a.f,l,1,Tj(a,3));break;case 6:si(a.f,l,1,false);mi(a.f,l,2,Tj(a,3));break;case 7:si(a.f,l,2,false);mi(a.f,l,2,Tj(a,3));break;default:si(a.f,l,Wb,false);}}}ac==8&&Tj(a,1)==0&&(a.f.M=true);e=Tj(a,v);for(Gb=0;Gb<e;Gb++){A=Tj(a,v);if(Kh(a.f,A)==1){Wb=Tj(a,3);switch(Wb){case 4:Di(a.f,A,1,false);Ci(a.f,A,1,Tj(a,3));break;case 5:Di(a.f,A,2,false);Ci(a.f,A,1,Tj(a,3));break;case 6:Di(a.f,A,1,false);Ci(a.f,A,2,Tj(a,3));break;case 7:Di(a.f,A,2,false);Ci(a.f,A,2,Tj(a,3));break;default:Di(a.f,A,Wb,false);}}else{Di(a.f,A,Tj(a,2),false)}}Ii(a.f,Tj(a,1)==1);k=null;Tb=0;while(Tj(a,1)==1){P=Tb+Tj(a,4);switch(P){case 0:Sb=Tj(a,g);for(Hb=0;Hb<Sb;Hb++){l=Tj(a,g);ti(a.f,l,RB)}break;case 1:Sb=Tj(a,g);for(Ib=0;Ib<Sb;Ib++){l=Tj(a,g);Pb=Tj(a,8);ri(a.f,l,Pb)}break;case 2:Sb=Tj(a,v);for(eb=0;eb<Sb;eb++){A=Tj(a,v);Gi(a.f,A,64)}break;case 3:Sb=Tj(a,g);for(fb=0;fb<Sb;fb++){l=Tj(a,g);ti(a.f,l,HB)}break;case 4:Sb=Tj(a,g);for(gb=0;gb<Sb;gb++){l=Tj(a,g);$b=Tj(a,4)<<3;ti(a.f,l,$b)}break;case 5:Sb=Tj(a,g);for(hb=0;hb<Sb;hb++){l=Tj(a,g);j=Tj(a,2)<<1;ti(a.f,l,j)}break;case 6:Sb=Tj(a,g);for(ib=0;ib<Sb;ib++){l=Tj(a,g);ti(a.f,l,1)}break;case 7:Sb=Tj(a,g);for(jb=0;jb<Sb;jb++){l=Tj(a,g);$=Tj(a,4)<<7;ti(a.f,l,$)}break;case 8:Sb=Tj(a,g);for(kb=0;kb<Sb;kb++){l=Tj(a,g);r=Tj(a,4);p=jq(Eq,uB,0,r,7,1);for(Mb=0;Mb<r;Mb++){q=Tj(a,8);p[Mb]=q}ni(a.f,l,p)}break;case 9:Sb=Tj(a,v);for(lb=0;lb<Sb;lb++){A=Tj(a,v);$b=Tj(a,2)<<4;Fi(a.f,A,$b)}break;case 10:Sb=Tj(a,v);for(mb=0;mb<Sb;mb++){A=Tj(a,v);G=Tj(a,4);Fi(a.f,A,G)}break;case 11:Sb=Tj(a,g);for(nb=0;nb<Sb;nb++){l=Tj(a,g);ti(a.f,l,8192)}break;case 12:Sb=Tj(a,v);for(pb=0;pb<Sb;pb++){A=Tj(a,v);H=Tj(a,8)<<6;Fi(a.f,A,H)}break;case 13:Sb=Tj(a,g);for(qb=0;qb<Sb;qb++){l=Tj(a,g);Xb=Tj(a,3)<<14;ti(a.f,l,Xb)}break;case 14:Sb=Tj(a,g);for(rb=0;rb<Sb;rb++){l=Tj(a,g);Qb=Tj(a,5)<<17;ti(a.f,l,Qb)}break;case 15:Tb=16;break;case 16:Sb=Tj(a,g);for(sb=0;sb<Sb;sb++){l=Tj(a,g);Zb=Tj(a,3)<<22;ti(a.f,l,Zb)}break;case 17:Sb=Tj(a,g);for(tb=0;tb<Sb;tb++){l=Tj(a,g);fi(a.f,l,Tj(a,4))}break;case 18:Sb=Tj(a,g);Ob=Tj(a,4);for(ub=0;ub<Sb;ub++){l=Tj(a,g);O=Tj(a,Ob);Nb=jq(Aq,eC,0,O,7,1);for(Mb=0;Mb<O;Mb++)Nb[Mb]=yq(Tj(a,7));ki(a.f,l,Tx(Nb,0,Nb.length))}break;case 19:Sb=Tj(a,g);for(vb=0;vb<Sb;vb++){l=Tj(a,g);I=Tj(a,3)<<25;ti(a.f,l,I)}break;case 20:Sb=Tj(a,v);for(wb=0;wb<Sb;wb++){A=Tj(a,v);Zb=Tj(a,3)<<14;Fi(a.f,A,Zb)}break;case 21:Sb=Tj(a,g);for(xb=0;xb<Sb;xb++){l=Tj(a,g);ui(a.f,l,Tj(a,2)<<4)}break;case 22:Sb=Tj(a,g);for(yb=0;yb<Sb;yb++){l=Tj(a,g);ti(a.f,l,QB)}break;case 23:Sb=Tj(a,v);for(Ab=0;Ab<Sb;Ab++){A=Tj(a,v);Fi(a.f,A,fC)}break;case 24:Sb=Tj(a,v);for(Bb=0;Bb<Sb;Bb++){A=Tj(a,v);j=Tj(a,2)<<18;Fi(a.f,A,j)}break;case 25:for(Cb=0;Cb<h;Cb++)Tj(a,1)==1&&vi(a.f,Cb);break;case 26:Sb=Tj(a,v);k=jq(Eq,uB,0,Sb,7,1);for(bb=0;bb<Sb;bb++)k[bb]=Tj(a,v);}}rd(new wd(a.f,Lb));if(k!=null)for(B=0,C=k.length;B<C;++B){A=k[B];Gi(a.f,A,Kh(a.f,A)==2?4:2)}if(d!=null){if(d[0]==33||d[0]==35){Uj(a,d,1);M=Tj(a,1)==1;N=Tj(a,1)==1;Yb=2*Tj(a,4);w=1<<Yb;A=0;for(n=1;n<h;n++){if(A<i&&Ah(a.f,1,A)==n){Y=Ah(a.f,0,A++);X=1}else{Y=0;X=8}xi(a.f,n,th(a.f,Y)+X*(Tj(a,Yb)-~~(w/2)));yi(a.f,n,uh(a.f,Y)+X*(Tj(a,Yb)-~~(w/2)));M&&zi(a.f,n,vh(a.f,Y)+X*(Tj(a,Yb)-~~(w/2)))}if(d[0]==35){ab=0;Z=jq(Eq,uB,0,h,7,1);for(o=0;o<h;o++)ab+=Z[o]=oj(a.f,o);for(l=0;l<h;l++){for(bb=0;bb<Z[l];bb++){$=Xg(a.f,1);Yg(a.f,l,$,1);xi(a.f,$,th(a.f,l)+(Tj(a,Yb)-~~(w/2)));yi(a.f,$,uh(a.f,l)+(Tj(a,Yb)-~~(w/2)));M&&zi(a.f,$,vh(a.f,l)+(Tj(a,Yb)-~~(w/2)))}}h+=ab;i+=ab}if(N){_b=Sj(Tj(a,Yb),w);cc=Vj(Tj(a,Yb),w);ec=Vj(Tj(a,Yb),w);M&&(gc=Vj(Tj(a,Yb),w));X=_b/cj(a.f);for(l=0;l<h;l++){xi(a.f,l,cc+X*th(a.f,l));yi(a.f,l,ec+X*uh(a.f,l));M&&zi(a.f,l,gc+X*vh(a.f,l))}}else{X=1.5/cj(a.f);for(l=0;l<h;l++){xi(a.f,l,X*th(a.f,l));yi(a.f,l,X*uh(a.f,l));M&&zi(a.f,l,X*vh(a.f,l))}}}else{M&&!N&&_b==0&&(_b=1.5);if(_b!=0&&a.f.q!=0){s=0;for(A=0;A<a.f.q;A++){T=th(a.f,Ah(a.f,0,A))-th(a.f,Ah(a.f,1,A));U=uh(a.f,Ah(a.f,0,A))-uh(a.f,Ah(a.f,1,A));V=M?vh(a.f,Ah(a.f,0,A))-vh(a.f,Ah(a.f,1,A)):0;s+=Math.sqrt(T*T+U*U+V*V)}s/=a.f.q;W=_b/s;for(l=0;l<a.f.p;l++){xi(a.f,l,th(a.f,l)*W+cc);yi(a.f,l,uh(a.f,l)*W+ec);M&&zi(a.f,l,vh(a.f,l)*W+gc)}}}}L=d!=null&&!M;if(L||a.b){xm(a.f,3);for(A=0;A<a.f.e;A++)Hh(a.f,A)==2&&!Hj(a.f,A)&&Ih(a.f,A)==0&&Ei(a.f,A)}if(!L&&a.b){Kb=new qg;Kb.j=new FA({l:1472656,m:18641,h:0});fg(Kb,a.f);L=true}if(L){Pj(a.f);Fm(a.f)}else M||(a.f.R|=4)}
	function Dl(){Dl=rt;Bl=mq(iq(Cs,1),GB,2,4,['QM@HzAmdqjF@','RF@Q``','qC`@ISTAlQE`','`J@H','QM@HzAmdqbF@','qC`@ISTAlQEhqPp@','sJP@DiZhAmQEb','RF@QPvR@','QM@HzA@','qC`@ISTAlQEhpPp@','qC`@Qz`MbHl','sJP@DiZhAmQEcFZF@','RFPDXH','qC`@IVtAlQE`','QM@HvAmdqfF@','sGP@DiVj`FsDVM@','`L@H','sJP@DizhAmQEcFBF@','sJP@DjvhAmQEb','sFp@DiTt@@AlqEcP','sGP@LdbMU@MfHlZ','QMHAIhD','QM@HzAy@','sJP@DkVhAmQEb','sNp@DiUjj@[\\QXu`','sJP@DiZhAmQEcFBF@','sGP@DjVj`FsDVM@','RFPDTH','RG@DXOH@','sGP@Divj`FsDVMcAC@','sGP@Dj}j`FsDVM@','qC`@Qz`MbHmFRF@','sNp@LdbJjj@[\\QXu`','QMHAIhGe@','QM@HzAyd`','QM`AIhD','qC`@ISTA@','sGP@DkUj`FsDVM@','qC`@IVtAlQEhqPp@','sNp@DiUjj@[\\QXuqea`@','KAx@@IRjuUPAlHPfES\\','QM`BN`P','sJP@DjZhAmQEcFJF@','Hid@@DjU^nBBH@FtaBXUMp`','sNp@Diujj@[\\QXuq`a`@','sJP@DjvhAmQEcFZF@','sJP@DjZhAmQEcFFF@','sOp@DjWkB@@FwDVM\\YhX@','sNp@Dj}Zj@[\\QXu`','sNp@DiWjj@[\\QXuq`a`@','sOp@DjWkB@@D','KAx@@ITouUPAlHPfES\\','KAx@@YIDTjjh@vDHSBin@','sNp@DkUZj@[\\QXu`','RFPDXOH@','QM`BN`^L`','qC`@ISTAy@','sGP@LdbMU@MfHl[FVF@','qCb@AIZ`H','KAx@@IRjuUPAlHPfES]FFa`@','KAx@@ITnuUPAlHPfES\\','HiD@@DiUVjj`AmHPfES\\H','sNp@DjUjj@[\\QXu`','sJP@DkVhAmQEcFJF@','sGP@DjVj`FsDVMcCC@','qC`@Qz`MbHmFBF@','sJP@DkfhAmQEb','qC`@IVtAlQEhsPp@','sGP@Djuj`FsDVM@','sGP@Dj}j`FsDVMcMC@','sJP@DiZhA@','KAx@@ISjuUPAlHPfES]F@a`@','sJP@DjZhAmQEcFRF@','KAx@@IRnuUPAlHPfES]F@a`@','HiD@@DjWvjj`AmHPfES\\H','QMHAIhGd@','sNp@DiUjj@[\\QXuq`a`@','KAx@@IVjmUPAlHPfES\\','sGP@DjVj`FsDVMcMC@','QM`AIhGe@','HiD@@LdbJRjjh@[RDIaTwB','qCp@AIZ`H','sGP@LdbMU@MfHl[FFF@','QMDARVA@','sNp@LdbJjj@[\\QXuqba`@','sNp@LdbJjj@[\\QXuqca`@','sGP@Dkej`FsDVM@','qCb@AIZ`OI@','HaD@@DjUZxHH@AlHPfES]FLa`@','sGP@DkYj`FsDVM@','qCb@AIV`H','sNp@LdbJjj@[\\QXuqea`@','sGP@DkUj`FsDVMcEC@','sFp@DiTt@@Axa@','Hmt@@DjU_ZxHHj@AmhPfES\\Lj','QM`BN`^P','qCb@AIZ`OH`','sFp@DiTt@@AxaP','sGP@Djuj`FsDVMcEC@','sGP@Djuj`FsDVMcIC@','sGP@DkUj`FsDVMcKC@','sJP@DkfhAmQEcFRF@','sGP@DjVj`FsDVMcIC@','HaD@@DjUZxHH@AlHPfES]FFa`@','qC`@IRtDVqDV@','sNp@Dj}Zj@[\\QXuqfa`@','KAx@@ITnuUPAlHPfES]FFa`@','HiD@@DkUUjj`AmHPfES\\H','sJQ@@dkU@H','qC`@Qz`H','KAx@@IUkmUPAlHPfES\\','KAx@@ITouUPAlHPfES]FJa`@','sJP@H~j@[TQX`','sGP@DjZj`FsDVM@','sJP@DkVhAmQEcFFF@','sJX@@eKU@H','sJP@DizhAy@','QMHAIhGbP','KAx@@ITouUPAlHPfES]FNa`@','HaD@@DjUZxHD@AlHPfES\\','HaD@@DjUZxHH@A@','sNp@LdbJjj@[\\QXuqaa`@','Hed@@LdbRQUUUP@vTHSBinFP','KAx@@ITouUPAlHPfES]FLa`@','sNp@DkUZj@[\\QXuqba`@','KAx@@ITjuUPAlHPfES]FNa`@','KAx@@YIDTjjh@vDHSBincGPp@','HaD@@DjYvxH`@AlHPfES]FLa`@','RF@QP`','qCb@AIj`H','sNp@DjUjj@[\\QXuqaa`@','sNp@DkVZj@[\\QXu`','KAx@@YIDUJjh@vDHSBin@','sGP@DkYj`FsDVMcIC@','sGP@DjVj`FsDVMcAC@','sGP@DiVj`D','sJP@DkVhAmQEcFZF@','sNp@LdbLjj@[\\QXu`','QM@HvAmdqbF@','HaD@@DjWjXHB@AlHPfES\\','sNp@DjwZj@[\\QXuqba`@','sNp@LdbJjj@[\\QXuqda`@','sFp@DiTt@@Axa`','HiD@@Djuujj`AmHPfES\\H','sNp@DkUZj@[\\QXuqca`@','sJP@DiZhAy@','KAx@@YIDTjjh@vDHSBincCPp@','KAx@@IWNmUPAlHPfES\\','KAx@@IVkMUPAlHPfES\\','sJQ@@dju@H','qCb@AIZ`OH@','qC`@ISTAxa@','sNp@DjyZj@[\\QXu`','Hid@@DjUfaBB`@FtaBXUMp`','HiD@@DiUVjj`AmHPfES\\LXBF@','KAx@@IUjmUPAlHPfES\\','HiD@@DjWvjj`AmHPfES\\LXjF@','sJP@DjVhAmQEb','qCb@AIV`OH`','HiD@@LdbJRjjh@[RDIaTwCFDa`@','KAx@@YIDTjjh@vDHSBinc@Pp@','sNp@DjUjj@[\\QXuqda`@','qC`@Qz`OED','sJP@DkfhAmQEcFZF@','KAx@@YIDbjjh@vDHSBincDPp@','sGP@Djyj`FsDVMcMC@','KAx@@IVrmUPAlHPfES\\','qCp@AIZ`OI@','sJX@@dkU@H','sJQ@@dkU@OH`','sNp@Di]ZjBBvxbqk@','Hkl@@DjU_Uk``bj`@[VDIaTwCJzX','sGP@DjZj`FsDVMcEC@','Hid@@DjU^nBBH@FtaBXUMpqcHX@','sNp@DkeZj@[\\QXu`','sNp@DjYjj@[\\QXuqca`@','sGQ@@djuT@`','HiD@@LdbJTjjh@[RDIaTwB','sOp@DjWkB@@Gd`','HeT@@LdbbRKBDQD@CYPaLJfxY@','qCr@XIKTA@','HiD@@DjW^jj`AmHPfES\\LXJF@','HeT@@DjU]k``b`@[JDIaTwCH','sGP@Djuj`FsDVMcCC@','`IH`B','sOp@DjWkB@@GdX','sJQ@@eKU@H','KAx@@YIDUJjh@vDHSBincBPp@','sJX@@eKU@OH@','KAx@@YIDTjjh@vDHSBincAPp@','sOq@@drm\\@@@`','KAx@@IUkMUPAlHPfES\\','qCp@AIj`H','Hed@@DjUUjjj@FraBXUMpr','sGX@@eJuT@`','sGP@DkUj`FsDVMcCC@','HiD@@Dj}Ujj`AmHPfES\\LXrF@','KAx@@ITouUPAlHPfES]FHa`@','Hed@@DjWujjj@FraBXUMpsFIa`@','sGP@DiUj``mfHlZ','sFp@DiTvjhAlqEcP','Hid@@DjU^nBBH@FtaBXUMpq`XX@','sJP@DkVdAmQEb','qCp@AIZ`OH`','QMhDRVA@','qC`@ISJAlQE`','qCp@BOTAyhl','sJX@@eOU@ODB','sFp@DiTt@@AyaB','sGP@DkUj`FsDVMcMC@','Hid@@DjYUaBH`@FtaBXUMpqcHX@','qC`@Qz`OH@','HiD@@DjUVjj`AmHPfES\\LXZF@','sJP@H~j@[TQXqda`@','sJX@@eKU@OI@','sNp@Djejj@[\\QXu`','sJQ@@dsU@H','sJQ@@dkU@OI`','KAx@@YIMDVjh@vDHSBin@','Hid@@DjU^nBBD@FtaBXUMp`','sNp@DkgZj@[\\QXuqca`@','qC`@IRtDVqDVcEC@','Hed@@LdbRQeUUP@vTHSBinFP','sNp@DiUjj@P','qC`@IRtDT','sNp@DkYZj@[\\QXuqca`@','KAx@@IUkmUPAlHPfES]FDa`@','KAx@@IVjmUPAlHPfES]FNa`@','sOx@@drm\\@@@`','KAx@@ITjuUPAlHPfES]FBa`@','QMDARVAyH','sJP`@dfvhA@','HeT@@DjU_k``b`@[JDIaTwCLXfF@','KAx@@IToUUPAlHPfES]FJa`@','sGP@DkYj`FsDVMcEC@','qCb@AIZ`ODH','`I@`B','KAx@@IUzmUPAlHPfES]FFa`@','sNp@DkfZj@[\\QXu`','KAx@@ITnuUPAlHPfES]F@a`@','HiD@@LddURjjh@[RDIaTwB','sNp@Dj~Zj@[\\QXuqfa`@','Hed@@Dj{uZjj@FraBXUMpr','KAx@@ITsUUPAlHPfES\\','Hid@@LdbRQk``b@AmHPfES\\LXrF@','sOp@DjWkB@@GdH','sJQ@@dkU@OH@','Hid@@DjU^nBBH@FtaBXUMpqahX@','sGP@DiYj``mfHlZ','KAx@@IToUUPAlHPfES]FLa`@','qCp@AJZ`ODH','Hmt@@DjU]ZxHHj@AmhPfES\\Lj','sGP@DkUjPFsDVM@','qC`@IVtA@','Hed@@LdbJReUUP@vTHSBinFP','sNp@DjuZj@[\\QXuqea`@','KAx@@IUkmUPAlHPfES]FNa`@','HiD@@DkVUjj`AmHPfES\\H','Hed@@DkUeZjj@FraBXUMpr','sNp@DkVZj@[\\QXuqea`@','sJP@DiVhHKZbKFLLL@','HiD@@Djuyjj`AmHPfES\\H','sNp@DjUjj@[\\QXuq`a`@','HeT@@DjYUXPbH`@[JDIaTwCH','HiD@@DjwUjj`AmHPfES\\LXRF@','sNq@@djmUPB','KAx@@YIEEZjh@vDHSBincCPp@','sGP@Di^V`dmfHlZ','Hid@@DjYUaBHP@FtaBXUMp`','sNp@DjYjj@[\\QXuqba`@','sGP@Dkej`FsDVMcKC@','HeT@@DjU^k``b`@[JDIaTwCH','qC`@Qv`MbHmFBF@','sGQ@@djmT@`','qCr@XIKTAyH','qC`@IVtAlQEhpPp@','Hid@@LdbbQxXF@@AmHPfES\\LXjF@','sGP@DkYj`FsDVMcCC@','KAx@@IVsMUPAlHPfES\\','qCp@AIj`ODl','HiD@@DkeUjj`AmHPfES\\H','HeT@@DjU[kjjjh@ZLDXSSYPaLJfxY@','sJP@DkVdAmQEcFRF@','HiD@@LdbJTjjh@[RDIaTwCFDa`@','HiD@@DkYyjj`AmHPfES\\H','sJP@DjZhAyH','KAx@@IVkMUPAlHPfES]FDa`@','sJX@@dkU@OI@','Hed@@LdbRQUUUP@vTHSBinFXpLL@','Hed@@DjuUZjj@FraBXUMpr','sGP@Djfj`FsDVMcKC@','sNp@DkVZj@[\\QXuqba`@','sNp@DjyZj@[\\QXuqfa`@','qCb@AIj`OH@','sNp@DjUZj@[\\QXu`','KAx@@IWOMUPAlHPfES\\','Hid@@DjU^nBBH@D','Hed@@DjuvZjj@FraBXUMpr','sJP@DiVhHKZbKFLtL@','Hmt@@DjU_Zzjjj`AhpQaLmmBDpj[aeXplL@','sNp@DjuZj@[\\QXuqca`@','sJP@DkfhAmQEcFJF@','sNp@LdbJZj@[\\QXu`','HeT@@DjU_k``b`@[JDIaTwCLXFF@','KAx@@IVlmUPAlHPfES]FNa`@','HeT@@LdbbRKBDQD@CYPaLJfxYcEPp@','Hid@@DjUZnBBH@FtaBXUMpqcHX@','qCa@CIKTA@','HiD@@Dj~]jj`AmHPfES\\LXFF@','sKP@Di\\Zj@[TQX`','sGP@Djfj`FsDVMcEC@','HiD@@DkgYjj`AmHPfES\\H','sNp@DjuZj@[\\QXuqaa`@','KAx@@YIMDVjh@vDHSBincDPp@','sJP@DjVhHKZbKFLTL@','Hid@@LdbRQk``b@AmHPfES\\LXZF@','HiD@@Dj}Ujj`AmHPfES\\LXzF@','HeT@@DjU_k``bP@[JDIaTwCH','sNp@DkUZi@[\\QXu`','HiD@@DjYfjj`AmHPfES\\H','sGP@DjZj`FsDVMcAC@','Hmt@@DjU_jxHHj@AmhPfES\\Lj','Hid@@LdbRQk``R@AmHPfES\\H','KAx@@YIDUJjh@vDHSBincDPp@','qCr@XIKTAyD','sOq@@drm\\@@@|`@','Hed@@DjW^jjj@FraBXUMpsFBa`@','HeT@@DjY]zXFB@@[JDIaTwCH','Hkl@@DjU_Vk``bj`@[VDIaTwCJzX','Hid@@DjY}nBHH@FtaBXUMpqcHX@','sGX@@eKuT@|d@','sGP@Dj^Y`FsDVM@','HcL@@DjU_ZnBBJh@FqaBXUMprn`','sJP@DkVdAmQEcFJF@','sOq@@drm\\@@@|b@','sNp@DjyZj@[\\QXuqaa`@','HaD@@DjUZxHH@AyD@','qC`@Qv`H','Hmt@@DjU_Zzjjj`AhpQaLmmBDpj[aeXqdL@','sGP@Dkej`FsDVMcMC@','Hed@@DjUUjjj@FraBXUMpsFHa`@','HeT@@LdbbRkBDQD@CYPaLJfxY@','KAx@@IU{MUPAlHPfES]FLa`@','RG@DTH','sJY@DDeVhA@','KAx@@YIDUJjh@vDHSBinc@Pp@','sJX@@dkU@OI`','sJQ@@dju@OI`','HeT@@LdbbRKBDQD@CYPaLJfxYcFPp@','sFp@DiTvjhAlqEcXpPp@','HaD@@DjUZxHH@AyG@','sNx@@eJ}UPB','sNp@LddUjj@[\\QXuqca`@','HaDH@@RVU[j@@@D','sNp@DkgZi@[\\QXu`','sGY@LDeVj`D','sNp@LdbJfZBZvxbqk@','sJP`@dfvhAyL','sGX@AddQjhAxe`','Hmt@@DjU_ZxHHj@AmhPfES\\LkFIa`@','qCh@CIKTA@','sNp@LdbLjj@[\\QXuq`a`@','sOq@@drm\\@@@|a@','KAx@@IUzmUPAlHPfES]FJa`@','sNx@AddQUUPB','sGP@Di]jP`mfHlZ','sJP`@TeZhA@','KAx@@IRjmUPHKXPaLJfx','HeT@@LdbRTM\\DDT@CYPaLJfxY@','HaF@@@Rfu[j@@@D','Hid@@DjYUaBH`@FtaBXUMpqchX@','KAx@@IUjmTpAlHPfES\\','Hid@@DjU^nBBD@FtaBXUMpqcHX@','sGP@DiUj``mfHl[FFF@','KAx@@IUvmUPAlHPfES]FLa`@','Hed@@LdbQTUUUP@vTHSBinFXqDL@','sJP@DkVhA@','sOx@@drm\\@@@|b@','KAx@@IUkMUPAlHPfES]FDa`@','HeT@@LdbRQU\\DDT@CYPaLJfxY@','HiD@@Dj}Yjj`AmHPfES\\LXrF@','HiD@@Dj{ujj`AmHPfES\\LXFF@','KAx@@IWNmUPAlHPfES]FFa`@','KAx@@IRkMUPHKXPaLJfx','sJP@DjYdAmQEcFZF@','sJY@LDeZhAyL','HaDH@@RVU[f@@@D','sJP`@deVhAyB','HaD@@DjWjZjj`AlHPfES\\','sGP@DkYj`FsDVMcMC@','sNp@DkgZj@[\\QXuqea`@','sJQ@@dlu@H','HeT@@DjU]k``b`@[JDIaTwCLXrF@','sJX@@dkU@OH`','RFDDQFCr`','sJP@DiYXIKZbKFLLL@','KAx@@YIHjjjh@vDHSBincGPp@','Hk\\@@DjU^ukmLHH@@@AmXPfES\\Lki`','sGQ@@djmT@|b@','Hid@@DjUfaBB`@FtaBXUMpqahX@','sNx@@eRmUPB','Hmt@@LdbRVak``ah@FvaBXUMprh','qCr@XIJtA@','KAx@@IWMmUPAlHPfES]FNa`@','HeT@@DjYYZPbJ@@[JDIaTwCH','sNp@DkfZj@[\\QXuqea`@','Hid@@DjU^nBAHAEVtaBXUMp`','Hmt@@DjYU^Vjjj`AhtISRmmBDpj[aeP','sGP@DkejPFsDVM@','sNx@@eJmUPB','qCb@AIf`H','HcL@@DjU_VnBBJh@FqaBXUMprnqcXX@','Hid@@DjUZnBBH@FtaBXUMpqahX@','sNp@LdbQZjBBvxbqkcGC@','sOx@@drm\\@@@|c@','sJP@H~j@^R@','KAx@@YIDcFjhDElHPfES\\','Hid@@DjUZnBAH@FtaBXUMp`','sNp@LddUji@[\\QXu`','sGP@DjfjPFsDVM@','HeT@@DjYUXPbD`@[JDIaTwCH','KAx@@IUoMUPAlHPfES]FDa`@','sFp@DiTt@@AyaD','Hed@@DjuuZjj@FraBXUMpsFIa`@','HeT@@DjUghP`h`@[JDIaTwCLXfF@','sOp@DjWkjj`FwDVM\\YhX@','sGP@Djfj`FsDVMcIC@','KAx@@IRkmUPHKXPaLJfzL]C@','sNx@@djmUPB','QM`AIdD','sOp@DjWkB@@Gbe@','sNp@DjyZj@[\\QXuqca`@','QM@HuAmd`','sNp@LddUjj@[\\QXuqea`@','HaD@@DkeVyjj`AhrXUMuaBDpj[hpDL@','qCb@AIZPH','HiD@@LdbJTjjh@[RDIaTwCF@a`@','Hmt@@DjU_ZxHHi@AmhPfES\\Lj','HaDH@@RYWih@H@D','HiD@@LdbJTjjh@[RDIaTwCFHa`@','sGX@@djuT@|a@','sNp@DkfZj@[\\QXuqaa`@','Hid@@DjU^nBBH@GdL','KAx@@IVkMUPAlHPfES]FJa`@','qCr@XIKTAy@','HmT@@Dj{uVjjh@[ZDIaTwCJqaXX@','Hmt@@DjYWVFjjj`AhpQe\\mmBDpj[aeP','Hif@@@RUe^Fh@@@P','HaDH@@Rfu[j@@@GdH','KAx@@IVsMUPAlHPfES]FDa`@','sKP@Di\\Zj@[TQXq`a`@','sJX@@eMU@OH@','HeT@@DjU^k``b`@[JDIaTwCLXFF@','Hmt@@LdbbRJXPbHh@FvaBXUMprh','sJP@DjvhAmQEcFBF@','Hmt@@LdbbRNXZjjj@FcAFUrvtHSBinFUcBpp@','sJP`@dfvhAyD','sGP@Di^V`dmfHl[FVF@','KAx@@IVsmUPAlHPfES]FBa`@','sOq@@drm\\@@@|PP','sJY@BDeZhA@','HeT@@LdbRbmBDED@CYPaLJfxY@','Hed@@Djy[Zjj@FraBXUMpr','HeT@@DjU]k``b`@[JDIaTwCLXFF@','Hid@@DjUfaBB`@D','qCa@CIJtA@','QMPARVA@','Hid@@DjUfaBB`@FtaBXUMpqcHX@','sJY@BDfZhA@','HeT@@DjUghP`hP@[JDIaTwCH','Hed@@Dj{uZjj@FraBXUMpsFIa`@','Hmt@@LdbbRUXZjjj@FcAFUrvtHSBinFUcFPp@','sNp`@dfuZj@P','sJQ@@dmU@OH@','sJX@@dmU@H','HeT@@DjU]k``b`@[JDIaTwCLXZF@','HiD@@LdfbJZjh@[RDIaTwCFAa`@','sOx@@drm\\@@@|a@','HeT@@LdbbQgCUUU@CQhRfz[JDIaTwCH','Hmt@@DjU]Zzjjj`AhpQaLmmBDpj[aeXplL@','sOp@DjWkjj`FwDVM\\XHX@','HcL@@LdbbRNSBDQEP@McBDpj[ae]cFpp@','HiD@@Dj}Yji`AmHPfES\\H','HaDH@@RYe[hB@@D','Hid@@DjU^njjj@FtaBXUMpq`XX@','HeT@@DkYeFVjjh@ZMaUpsYPaLJfxY@','QMPARZA@','sOq@@drm\\@@@|QX','HaD@@DjYvxH`@A@','HcL@@LdbbRNcBDQEP@McBDpj[ae]@','QMhDRZA@','RG@DXLHmP','QM`BN`XQYd','RG@DTLHmP','QMHAIXFEVd','QMDARVAaH','RFPDXLHmP','RF@Q`vRbdLEC@','RF@QpvR@','QO@HyjAmd`','`II@B','`II@CFspqJp','`II@CF[@hM@prB`','`H@[T[|B`XN@PdM@p|@bHrBcDk@','RG@DXMj}F@','QM`BN`[L~b@','RG@DTMj}D@','QMHAIXFt~j@','QMDARVA}L@','RFPDXMj}D@','sKP@Di\\YZ@[TQXqaa`@','RG@DXMH'])}
	function fn(){fn=rt;en=mq(iq(Dq,1),xB,0,7,[-0.1899999976158142,1.2699999809265137,-0.7009999752044678,2.690999984741211,-0.22699999809265137,0.029999999329447746,0.10599999874830246,-0.47600001096725464,-0.44699999690055847,-0.19099999964237213,-0.3330000042915344,0.0860000029206276,0.24699999392032623,-0.06199999898672104,0.01600000075995922,0.3869999945163727,0.23499999940395355,-0.4320000112056732,-0.902999997138977,0.38999998569488525,0.5809999704360962,4.52400016784668,-0.6349999904632568,0.7919999957084656,0.5920000076293945,0.9639999866485596,CC,-0.6850000023841858,-0.3149999976158142,-0.4129999876022339,-0.5950000286102295,0.2199999988079071,-0.2800000011920929,0.7699999809265137,-0.05000000074505806,1.0870000123977661,0.19200000166893005,0.19599999487400055,-0.5199999809265137,0.5419999957084656,0.3630000054836273,HC,2.384000062942505,1.75,-1.6660000085830688,-1.065999984741211,1.3270000219345093,0.8029999732971191,-1.5049999952316284,-2.5369999408721924,IC,0.14900000393390656,0.5210000276565552,2.9049999713897705,-0.25200000405311584,-1.4320000410079956,-2.253999948501587,0.4399999976158142,-0.27000001072883606,-0.13300000131130219,-0.26899999380111694,0.2669999897480011,0.5720000267028809,-0.5680000185966492,0.17399999499320984,-0.1850000023841858,-0.23499999940395355,IC,HC,-0.34200000762939453,-0.3479999899864197,-0.43700000643730164,-0.8040000200271606,-0.41200000047683716,-0.2150000035762787,-0.625,-0.8309999704360962,0.4970000088214874,-0.4309999942779541,-1.3309999704360962,0.5070000290870667,-0.6320000290870667,-0.5989999771118164,0.8600000143051147,0.3610000014305115,0.40299999713897705,0.004999999888241291,1.1460000276565552,0.9359999895095825,-0.30000001192092896,0.20900000631809235,-0.5830000042915344,-0.024000000208616257,-0.009999999776482582,1.6469999551773071,0.843999981880188,0.125,0.1420000046491623,-0.17100000381469727,0.44200000166893005,0.08799999952316284,3.065999984741211,1.6519999504089355,-0.15600000321865082,-0.3529999852180481,-0.164000004529953,-0.4410000145435333,-0.4970000088214874,-1.059999942779541,0.6110000014305115,0.4860000014305115,0.11500000208616257,-0.22499999403953552,-0.15399999916553497,-0.03099999949336052,0.8619999885559082,-0.03500000014901161,-0.5960000157356262,-1.5740000009536743,-1.093000054359436,1.1610000133514404,FC,-0.44999998807907104,-0.5559999942779541,-0.621999979019165,2.121999979019165,-1.4019999504089355,2.072999954223633,-3.131999969482422,-2.119999885559082,0.34700000286102295,-1.2649999856948853,-1.3170000314712524,2.500999927520752,-2.2260000705718994,0.9129999876022339,-2.9570000171661377,0.29100000858306885,-0.7250000238418579,-1.4249999523162842,JC,-0.017999999225139618,-0.8489999771118164,-2.259000062942505,-3.4760000705718994,-0.296999990940094,-1.659999966621399,0.023000000044703484,0.0729999989271164,0.2540000081062317,0.5540000200271606,0.5950000286102295,EC,-1.25,1.3940000534057617,-2.7269999980926514,0.08299999684095383,-1.281999945640564,-0.4059999883174896,-0.6370000243186951,-0.17399999499320984,-0.10100000351667404,-0.5429999828338623,-2.4059998989105225,-3.2920000553131104,-0.6809999942779541,-1.2580000162124634,1.0700000524520874,-3.0959999561309814,-0.2280000001192093,0.718999981880188,0.1379999965429306,1.3020000457763672,0.859000027179718,1.3589999675750732,0.6589999794960022,-0.9399999976158142,0.8999999761581421,0.3190000057220459,-2.571000099182129,1.9329999685287476,0.11900000274181366,2.1080000400543213,0.11299999803304672,3.3359999656677246,0.7540000081062317,-0.4650000035762787,-0.05299999937415123,-0.19300000369548798,1.850000023841858,-1.2610000371932983,-0.656000018119812,-0.7300000190734863,-0.9380000233650208,1.1089999675750732,0.972000002861023,1.652999997138977,2.6019999980926514,1.628000020980835,-0.3970000147819519,0.12800000607967377,1.1540000438690186,0.24199999868869781,-0.5289999842643738,-0.27799999713897705,-0.8019999861717224,0.9120000004768372,-1.38100004196167,0.46299999952316284,1.0740000009536743,-0.628000020980835,-0.9620000123977661,0.7289999723434448,1.065999984741211,1.0670000314712524,-0.3109999895095825,0.03099999949336052,1.3079999685287476,0.07699999958276749,-0.4790000021457672,JC,-1.8320000171661377,-1.4989999532699585,-2.115999937057495,-2.2070000171661377,-0.15299999713897705,0.14100000262260437,2.134999990463257,0.23399999737739563,0.460999995470047,0.6700000166893005,-0.3610000014305115,-1.0390000343322754,-0.4830000102519989,0.13699999451637268,-0.7680000066757202,-0.5109999775886536,3.4240000247955322,-0.8550000190734863,-0.5849999785423279,-1.5670000314712524,0.6570000052452087,1.1150000095367432,1.9759999513626099,1.7860000133514404,-0.035999998450279236,-1.0499999523162842,2.5390000343322754,2.234999895095825,2.2899999618530273,3.121000051498413,3.931999921798706,2.75,3.3429999351501465,1.840000033378601,0.3889999985694885,1.121999979019165,1.6299999952316284,1.3350000381469727,0.3659999966621399,-0.5569999814033508,1.0449999570846558,0.4320000112056732,0.20399999618530273,0.8820000290870667,0.4659999907016754,-0.4580000042915344,0.04399999976158142,1.0329999923706055,-1.0800000429153442,0.40400001406669617]);dn=mq(iq(Fq,1),bC,0,6,[{l:262146,m:0,h:0},{l:262148,m:0,h:0},{l:262153,m:0,h:0},{l:262157,m:0,h:0},{l:264194,m:0,h:0},{l:264195,m:0,h:0},{l:264196,m:0,h:0},{l:264197,m:0,h:0},{l:264200,m:0,h:0},{l:264201,m:0,h:0},{l:264205,m:0,h:0},{l:264206,m:0,h:0},{l:267266,m:0,h:0},{l:267267,m:0,h:0},{l:267268,m:0,h:0},{l:267273,m:0,h:0},{l:267277,m:0,h:0},{l:271362,m:0,h:0},{l:271363,m:0,h:0},{l:271364,m:0,h:0},{l:271365,m:0,h:0},{l:271368,m:0,h:0},{l:271369,m:0,h:0},{l:395266,m:0,h:0},{l:395267,m:0,h:0},{l:395268,m:0,h:0},{l:395269,m:0,h:0},{l:395272,m:0,h:0},{l:395273,m:0,h:0},{l:395277,m:0,h:0},{l:395278,m:0,h:0},{l:398338,m:0,h:0},{l:526338,m:0,h:0},{l:526339,m:0,h:0},{l:526340,m:0,h:0},{l:526344,m:0,h:0},{l:529412,m:0,h:0},{l:533508,m:0,h:0},{l:533512,m:0,h:0},{l:788482,m:0,h:0},{l:788483,m:0,h:0},{l:2230274,m:32,h:0},{l:2230275,m:32,h:0},{l:2230276,m:32,h:0},{l:2230280,m:32,h:0},{l:1181698,m:33,h:0},{l:1181699,m:33,h:0},{l:1181700,m:33,h:0},{l:1181704,m:33,h:0},{l:1184770,m:33,h:0},{l:1184771,m:33,h:0},{l:1184772,m:33,h:0},{l:1181698,m:34,h:0},{l:1181699,m:34,h:0},{l:1184770,m:34,h:0},{l:262148,m:64,h:0},{l:2359298,m:64,h:0},{l:2359300,m:64,h:0},{l:2361346,m:64,h:0},{l:2361347,m:64,h:0},{l:2361348,m:64,h:0},{l:2361352,m:64,h:0},{l:2361356,m:64,h:0},{l:1310722,m:65,h:0},{l:1312770,m:65,h:0},{l:1312771,m:65,h:0},{l:1312772,m:65,h:0},{l:1312776,m:65,h:0},{l:1315842,m:65,h:0},{l:1315848,m:65,h:0},{l:1315852,m:65,h:0},{l:1312770,m:66,h:0},{l:1312771,m:66,h:0},{l:1312772,m:66,h:0},{l:1312776,m:66,h:0},{l:1312780,m:66,h:0},{l:1315842,m:66,h:0},{l:1315843,m:66,h:0},{l:1315844,m:66,h:0},{l:1319938,m:66,h:0},{l:1319939,m:66,h:0},{l:1319940,m:66,h:0},{l:1319944,m:66,h:0},{l:2361346,m:96,h:0},{l:2361347,m:96,h:0},{l:2361348,m:96,h:0},{l:2361352,m:96,h:0},{l:2364418,m:96,h:0},{l:2364419,m:96,h:0},{l:2364420,m:96,h:0},{l:2368514,m:96,h:0},{l:2368515,m:96,h:0},{l:2368516,m:96,h:0},{l:2368520,m:96,h:0},{l:2492418,m:96,h:0},{l:2492419,m:96,h:0},{l:2492420,m:96,h:0},{l:2492424,m:96,h:0},{l:1310722,m:97,h:0},{l:1312770,m:97,h:0},{l:1315842,m:97,h:0},{l:1319938,m:97,h:0},{l:1443842,m:97,h:0},{l:2361346,m:128,h:0},{l:2361347,m:128,h:0},{l:2364418,m:128,h:0},{l:2364419,m:128,h:0},{l:2368514,m:128,h:0},{l:2368515,m:128,h:0},{l:2492418,m:128,h:0},{l:2492419,m:128,h:0},{l:1312770,m:129,h:0},{l:1312771,m:129,h:0},{l:1315842,m:129,h:0},{l:1315843,m:129,h:0},{l:1443842,m:129,h:0},{l:1443843,m:129,h:0},{l:1443854,m:129,h:0},{l:1577986,m:130,h:0},{l:2361346,m:192,h:0},{l:2492418,m:192,h:0},{l:1312770,m:193,h:0},{l:1315842,m:193,h:0},{l:1319938,m:193,h:0},{l:2230274,m:33312,h:0},{l:2230275,m:33312,h:0},{l:2230274,m:34080,h:0},{l:2230275,m:34080,h:0},{l:1181698,m:34081,h:0},{l:1184770,m:34081,h:0},{l:2230274,m:35104,h:0},{l:1181698,m:35105,h:0},{l:2230274,m:66080,h:0},{l:2230275,m:66080,h:0},{l:1181698,m:66081,h:0},{l:1181699,m:66081,h:0},{l:1184770,m:66081,h:0},{l:1184771,m:66081,h:0},{l:1181698,m:66082,h:0},{l:1184770,m:66082,h:0},{l:2361346,m:66112,h:0},{l:2361347,m:66112,h:0},{l:2230274,m:66848,h:0},{l:1181698,m:66849,h:0},{l:1184770,m:66849,h:0},{l:1181698,m:66850,h:0},{l:1184770,m:66850,h:0},{l:2361346,m:66880,h:0},{l:2361347,m:66880,h:0},{l:1312770,m:66881,h:0},{l:1312771,m:66881,h:0},{l:1315842,m:66881,h:0},{l:2230274,m:67872,h:0},{l:1181698,m:67873,h:0},{l:1181699,m:67873,h:0},{l:1184770,m:67873,h:0},{l:1181698,m:67874,h:0},{l:1184770,m:67874,h:0},{l:2361346,m:67904,h:0},{l:2361347,m:67904,h:0},{l:1312770,m:67905,h:0},{l:1315842,m:67905,h:0},{l:1312770,m:67906,h:0},{l:1319938,m:67906,h:0},{l:1319939,m:67906,h:0},{l:2230274,m:98848,h:0},{l:1181698,m:98849,h:0},{l:1181699,m:98849,h:0},{l:1184770,m:98849,h:0},{l:1184771,m:98849,h:0},{l:2361346,m:98880,h:0},{l:2361347,m:98880,h:0},{l:1312770,m:98881,h:0},{l:1312771,m:98881,h:0},{l:1315842,m:98881,h:0},{l:1312770,m:98882,h:0},{l:1312771,m:98882,h:0},{l:1315842,m:98882,h:0},{l:1319938,m:98882,h:0},{l:1319939,m:98882,h:0},{l:2361346,m:98912,h:0},{l:2361347,m:98912,h:0},{l:2364418,m:98912,h:0},{l:2364419,m:98912,h:0},{l:2492418,m:98912,h:0},{l:2361346,m:99648,h:0},{l:1312770,m:99649,h:0},{l:2361346,m:131648,h:0},{l:1312770,m:131649,h:0},{l:1312771,m:131649,h:0},{l:1315842,m:131649,h:0},{l:1312770,m:131650,h:0},{l:1315842,m:131650,h:0},{l:1319938,m:131650,h:0},{l:2361346,m:131680,h:0},{l:2364418,m:131680,h:0},{l:2368514,m:131680,h:0},{l:2368520,m:131680,h:0},{l:2492418,m:131680,h:0},{l:1312770,m:131681,h:0},{l:2361346,m:132416,h:0},{l:2361352,m:132416,h:0},{l:1312770,m:132417,h:0},{l:1312771,m:132417,h:0},{l:1315842,m:132417,h:0},{l:1315843,m:132417,h:0},{l:1315847,m:132417,h:0},{l:1315848,m:132417,h:0},{l:1312770,m:132418,h:0},{l:1312776,m:132418,h:0},{l:1315842,m:132418,h:0},{l:1319938,m:132418,h:0},{l:2361346,m:132448,h:0},{l:2361352,m:132448,h:0},{l:2364418,m:132448,h:0},{l:2364423,m:132448,h:0},{l:2368514,m:132448,h:0},{l:2492418,m:132448,h:0},{l:1312770,m:132449,h:0},{l:1315842,m:132449,h:0},{l:1443854,m:132481,h:0},{l:1312770,m:133441,h:0},{l:1315842,m:133441,h:0},{l:1315842,m:133442,h:0},{l:1319938,m:133442,h:0},{l:2361346,m:590400,h:16},{l:2361346,m:1376832,h:16},{l:2361347,m:1376832,h:16},{l:2361346,m:1377600,h:16},{l:1312770,m:1377601,h:16},{l:1315842,m:1377601,h:16},{l:2361346,m:2425408,h:16},{l:2361346,m:2426176,h:16},{l:1312770,m:2426177,h:16},{l:1315842,m:2426177,h:16},{l:2361346,m:2427200,h:16},{l:1312770,m:2427201,h:16},{l:1315842,m:2427201,h:16},{l:1312770,m:2427202,h:16},{l:1315842,m:2427202,h:16},{l:1319938,m:2427202,h:16},{l:2361346,m:590400,h:24},{l:2361346,m:591168,h:24},{l:1312770,m:591169,h:24},{l:1315842,m:591169,h:24},{l:2361346,m:592192,h:24},{l:1319938,m:592194,h:24},{l:2361346,m:623168,h:24},{l:1312770,m:623169,h:24},{l:1315842,m:623169,h:24},{l:2361346,m:623200,h:24},{l:2364418,m:623200,h:24},{l:2368514,m:623200,h:24},{l:2361351,m:1376832,h:32},{l:2361351,m:1377600,h:32},{l:1312775,m:1377601,h:32},{l:1315847,m:1377601,h:32},{l:1312775,m:1378625,h:32},{l:1315847,m:1378625,h:32},{l:1315847,m:1378626,h:32},{l:1319943,m:1378626,h:32},{l:1315847,m:1409601,h:32},{l:2361352,m:1443136,h:32},{l:1312776,m:1443137,h:32},{l:1315848,m:1443137,h:32},{l:1312776,m:1443138,h:32},{l:1315848,m:1443138,h:32},{l:2361352,m:1443168,h:32},{l:2364424,m:1443168,h:32},{l:2368520,m:1443168,h:32},{l:1312775,m:2426177,h:32}])}
	function Wm(){Wm=rt;Tm=mq(iq(Fq,1),bC,0,6,[{l:262146,m:0,h:0},{l:262148,m:0,h:0},{l:264194,m:0,h:0},{l:264195,m:0,h:0},{l:264196,m:0,h:0},{l:264197,m:0,h:0},{l:264200,m:0,h:0},{l:264201,m:0,h:0},{l:264205,m:0,h:0},{l:264206,m:0,h:0},{l:267266,m:0,h:0},{l:267267,m:0,h:0},{l:267268,m:0,h:0},{l:267273,m:0,h:0},{l:267278,m:0,h:0},{l:271362,m:0,h:0},{l:271363,m:0,h:0},{l:271364,m:0,h:0},{l:271365,m:0,h:0},{l:271374,m:0,h:0},{l:395266,m:0,h:0},{l:395267,m:0,h:0},{l:395268,m:0,h:0},{l:395269,m:0,h:0},{l:395272,m:0,h:0},{l:395273,m:0,h:0},{l:395277,m:0,h:0},{l:395278,m:0,h:0},{l:398338,m:0,h:0},{l:398340,m:0,h:0},{l:398345,m:0,h:0},{l:524292,m:0,h:0},{l:526338,m:0,h:0},{l:526339,m:0,h:0},{l:526340,m:0,h:0},{l:526344,m:0,h:0},{l:529412,m:0,h:0},{l:533508,m:0,h:0},{l:533512,m:0,h:0},{l:788482,m:0,h:0},{l:788483,m:0,h:0},{l:2230338,m:32,h:0},{l:2230339,m:32,h:0},{l:2230340,m:32,h:0},{l:2230344,m:32,h:0},{l:1181762,m:33,h:0},{l:1181763,m:33,h:0},{l:1181764,m:33,h:0},{l:1181768,m:33,h:0},{l:1184834,m:33,h:0},{l:1184835,m:33,h:0},{l:1184836,m:33,h:0},{l:1184840,m:33,h:0},{l:1181762,m:34,h:0},{l:1181763,m:34,h:0},{l:1184834,m:34,h:0},{l:1184835,m:34,h:0},{l:1184836,m:34,h:0},{l:2359298,m:64,h:0},{l:2359304,m:64,h:0},{l:2359368,m:64,h:0},{l:2361346,m:64,h:0},{l:2361347,m:64,h:0},{l:2361348,m:64,h:0},{l:2361352,m:64,h:0},{l:2361356,m:64,h:0},{l:2361410,m:64,h:0},{l:2361411,m:64,h:0},{l:2361412,m:64,h:0},{l:2361416,m:64,h:0},{l:1312770,m:65,h:0},{l:1312771,m:65,h:0},{l:1312772,m:65,h:0},{l:1312776,m:65,h:0},{l:1312834,m:65,h:0},{l:1312835,m:65,h:0},{l:1312836,m:65,h:0},{l:1312840,m:65,h:0},{l:1315842,m:65,h:0},{l:1315848,m:65,h:0},{l:1315906,m:65,h:0},{l:1310724,m:66,h:0},{l:1312770,m:66,h:0},{l:1312771,m:66,h:0},{l:1312772,m:66,h:0},{l:1312776,m:66,h:0},{l:1312834,m:66,h:0},{l:1312835,m:66,h:0},{l:1312836,m:66,h:0},{l:1312840,m:66,h:0},{l:1315842,m:66,h:0},{l:1315843,m:66,h:0},{l:1315844,m:66,h:0},{l:1315906,m:66,h:0},{l:1319938,m:66,h:0},{l:1319944,m:66,h:0},{l:1319946,m:66,h:0},{l:1320002,m:66,h:0},{l:2361346,m:96,h:0},{l:2361347,m:96,h:0},{l:2361348,m:96,h:0},{l:2361352,m:96,h:0},{l:2361356,m:96,h:0},{l:2361410,m:96,h:0},{l:2361411,m:96,h:0},{l:2361412,m:96,h:0},{l:2361416,m:96,h:0},{l:2361420,m:96,h:0},{l:2364418,m:96,h:0},{l:2364419,m:96,h:0},{l:2364420,m:96,h:0},{l:2364482,m:96,h:0},{l:2364488,m:96,h:0},{l:2368514,m:96,h:0},{l:2368515,m:96,h:0},{l:2368516,m:96,h:0},{l:2368520,m:96,h:0},{l:2368578,m:96,h:0},{l:2368579,m:96,h:0},{l:2368580,m:96,h:0},{l:2368584,m:96,h:0},{l:2492418,m:96,h:0},{l:2492419,m:96,h:0},{l:2492420,m:96,h:0},{l:2492424,m:96,h:0},{l:2492482,m:96,h:0},{l:2492483,m:96,h:0},{l:2492484,m:96,h:0},{l:2492488,m:96,h:0},{l:1312770,m:97,h:0},{l:1312772,m:97,h:0},{l:1312834,m:97,h:0},{l:1315842,m:97,h:0},{l:1443842,m:97,h:0},{l:1443843,m:97,h:0},{l:2361346,m:128,h:0},{l:2361347,m:128,h:0},{l:2361410,m:128,h:0},{l:2361411,m:128,h:0},{l:2364418,m:128,h:0},{l:2364419,m:128,h:0},{l:2364482,m:128,h:0},{l:2364483,m:128,h:0},{l:2364484,m:128,h:0},{l:2368514,m:128,h:0},{l:2368515,m:128,h:0},{l:2368578,m:128,h:0},{l:2368579,m:128,h:0},{l:2492418,m:128,h:0},{l:2492419,m:128,h:0},{l:2492482,m:128,h:0},{l:2492483,m:128,h:0},{l:2495490,m:128,h:0},{l:1312770,m:129,h:0},{l:1312771,m:129,h:0},{l:1312834,m:129,h:0},{l:1312835,m:129,h:0},{l:1312836,m:129,h:0},{l:1312840,m:129,h:0},{l:1315842,m:129,h:0},{l:1315843,m:129,h:0},{l:1315906,m:129,h:0},{l:1315907,m:129,h:0},{l:1443842,m:129,h:0},{l:1443843,m:129,h:0},{l:1443907,m:129,h:0},{l:1446914,m:129,h:0},{l:1577986,m:130,h:0},{l:2361346,m:192,h:0},{l:2492418,m:192,h:0},{l:1312770,m:193,h:0},{l:1315842,m:193,h:0},{l:1319938,m:193,h:0},{l:1443842,m:193,h:0},{l:2230338,m:33312,h:0},{l:2230339,m:33312,h:0},{l:2230338,m:34080,h:0},{l:2230339,m:34080,h:0},{l:1181762,m:34081,h:0},{l:1181768,m:34081,h:0},{l:1184834,m:34081,h:0},{l:2230338,m:35104,h:0},{l:1181762,m:35105,h:0},{l:1181762,m:35106,h:0},{l:2230338,m:66080,h:0},{l:2230339,m:66080,h:0},{l:1181762,m:66081,h:0},{l:1181763,m:66081,h:0},{l:1184834,m:66081,h:0},{l:1184835,m:66081,h:0},{l:1181762,m:66082,h:0},{l:1184834,m:66082,h:0},{l:2359363,m:66112,h:0},{l:2361346,m:66112,h:0},{l:2361347,m:66112,h:0},{l:2361410,m:66112,h:0},{l:2361411,m:66112,h:0},{l:2230338,m:66848,h:0},{l:2230339,m:66848,h:0},{l:1181762,m:66849,h:0},{l:1181763,m:66849,h:0},{l:1184834,m:66849,h:0},{l:1181762,m:66850,h:0},{l:1184834,m:66850,h:0},{l:2361346,m:66880,h:0},{l:2361347,m:66880,h:0},{l:2361410,m:66880,h:0},{l:2361411,m:66880,h:0},{l:1312770,m:66881,h:0},{l:1312771,m:66881,h:0},{l:1312834,m:66881,h:0},{l:1315842,m:66881,h:0},{l:1315906,m:66881,h:0},{l:2230338,m:67872,h:0},{l:1181762,m:67873,h:0},{l:1184834,m:67873,h:0},{l:1181762,m:67874,h:0},{l:1184834,m:67874,h:0},{l:2361346,m:67904,h:0},{l:2361347,m:67904,h:0},{l:2361410,m:67904,h:0},{l:2361411,m:67904,h:0},{l:1312770,m:67905,h:0},{l:1312771,m:67905,h:0},{l:1312834,m:67905,h:0},{l:1315842,m:67905,h:0},{l:1312770,m:67906,h:0},{l:1319938,m:67906,h:0},{l:2230338,m:98848,h:0},{l:2230339,m:98848,h:0},{l:1181762,m:98849,h:0},{l:1181763,m:98849,h:0},{l:1184834,m:98849,h:0},{l:1184835,m:98849,h:0},{l:1181762,m:98850,h:0},{l:1184834,m:98850,h:0},{l:2361346,m:98880,h:0},{l:2361347,m:98880,h:0},{l:2361410,m:98880,h:0},{l:2361411,m:98880,h:0},{l:1312770,m:98881,h:0},{l:1312771,m:98881,h:0},{l:1312834,m:98881,h:0},{l:1312835,m:98881,h:0},{l:1315842,m:98881,h:0},{l:1315906,m:98881,h:0},{l:1312770,m:98882,h:0},{l:1312771,m:98882,h:0},{l:1312834,m:98882,h:0},{l:1312835,m:98882,h:0},{l:1315843,m:98882,h:0},{l:1315906,m:98882,h:0},{l:1319939,m:98882,h:0},{l:2361346,m:98912,h:0},{l:2361347,m:98912,h:0},{l:2361410,m:98912,h:0},{l:2361411,m:98912,h:0},{l:2364418,m:98912,h:0},{l:2364482,m:98912,h:0},{l:2492418,m:98912,h:0},{l:2230338,m:99616,h:0},{l:1181762,m:99617,h:0},{l:1184834,m:99617,h:0},{l:2361346,m:99648,h:0},{l:2361410,m:99648,h:0},{l:1312770,m:99649,h:0},{l:1312834,m:99649,h:0},{l:1312834,m:99650,h:0},{l:2361346,m:99680,h:0},{l:2492418,m:99680,h:0},{l:2361346,m:131648,h:0},{l:2361410,m:131648,h:0},{l:2361411,m:131648,h:0},{l:1312770,m:131649,h:0},{l:1312834,m:131649,h:0},{l:1312835,m:131649,h:0},{l:1315842,m:131649,h:0},{l:1315906,m:131649,h:0},{l:1312770,m:131650,h:0},{l:1312834,m:131650,h:0},{l:1315906,m:131650,h:0},{l:1319938,m:131650,h:0},{l:1320002,m:131650,h:0},{l:2361346,m:131680,h:0},{l:2361410,m:131680,h:0},{l:2364418,m:131680,h:0},{l:2364482,m:131680,h:0},{l:2368514,m:131680,h:0},{l:2368520,m:131680,h:0},{l:2368578,m:131680,h:0},{l:2492418,m:131680,h:0},{l:2492482,m:131680,h:0},{l:1443906,m:131681,h:0},{l:2361346,m:132416,h:0},{l:2361352,m:132416,h:0},{l:2361410,m:132416,h:0},{l:2361411,m:132416,h:0},{l:2361416,m:132416,h:0},{l:1312770,m:132417,h:0},{l:1312834,m:132417,h:0},{l:1315842,m:132417,h:0},{l:1315847,m:132417,h:0},{l:1315906,m:132417,h:0},{l:1315912,m:132417,h:0},{l:1312770,m:132418,h:0},{l:1312834,m:132418,h:0},{l:1315842,m:132418,h:0},{l:1315906,m:132418,h:0},{l:1320002,m:132418,h:0},{l:2361346,m:132448,h:0},{l:2361352,m:132448,h:0},{l:2361410,m:132448,h:0},{l:2361411,m:132448,h:0},{l:2361416,m:132448,h:0},{l:2364418,m:132448,h:0},{l:2364424,m:132448,h:0},{l:2364482,m:132448,h:0},{l:2368514,m:132448,h:0},{l:2368578,m:132448,h:0},{l:2492418,m:132448,h:0},{l:2492424,m:132448,h:0},{l:2492482,m:132448,h:0},{l:1312770,m:132449,h:0},{l:1315842,m:132449,h:0},{l:1443842,m:132449,h:0},{l:2361410,m:133440,h:0},{l:1312770,m:133441,h:0},{l:1312834,m:133441,h:0},{l:1315842,m:133441,h:0},{l:1315906,m:133441,h:0},{l:1312834,m:133442,h:0},{l:1315842,m:133442,h:0},{l:1315906,m:133442,h:0},{l:2364418,m:133472,h:0},{l:2364482,m:133472,h:0},{l:1315842,m:133473,h:0},{l:2359363,m:590400,h:16},{l:2361345,m:590400,h:16},{l:2361346,m:590400,h:16},{l:2361410,m:590400,h:16},{l:2361346,m:1376832,h:16},{l:2361410,m:1376832,h:16},{l:2361346,m:1377600,h:16},{l:2361410,m:1377600,h:16},{l:1312770,m:1377601,h:16},{l:1312834,m:1377601,h:16},{l:1315842,m:1377601,h:16},{l:2230339,m:2425376,h:16},{l:2361346,m:2425408,h:16},{l:2361347,m:2425408,h:16},{l:2361410,m:2425408,h:16},{l:2361411,m:2425408,h:16},{l:2361346,m:2426176,h:16},{l:1312770,m:2426177,h:16},{l:1315842,m:2426177,h:16},{l:2361346,m:2427200,h:16},{l:2361410,m:2427200,h:16},{l:1312770,m:2427201,h:16},{l:1312770,m:2427202,h:16},{l:1315842,m:2427202,h:16},{l:1319938,m:2427202,h:16},{l:2361346,m:590400,h:24},{l:2361410,m:590400,h:24},{l:2361346,m:591168,h:24},{l:2361410,m:591168,h:24},{l:1312770,m:591169,h:24},{l:1312834,m:591169,h:24},{l:1315842,m:591169,h:24},{l:1319938,m:592194,h:24},{l:2361346,m:623168,h:24},{l:2361410,m:623168,h:24},{l:1312770,m:623169,h:24},{l:1312834,m:623169,h:24},{l:2364418,m:623200,h:24},{l:2364482,m:623200,h:24},{l:2361346,m:1376832,h:24},{l:2361410,m:1376832,h:24},{l:2361347,m:592192,h:32},{l:2361351,m:1377600,h:32},{l:1312775,m:1377601,h:32},{l:1315847,m:1377601,h:32},{l:1315911,m:1377601,h:32},{l:1312775,m:1378625,h:32},{l:1315847,m:1378625,h:32},{l:1315847,m:1378626,h:32},{l:1315914,m:1378626,h:32},{l:1315847,m:1409601,h:32},{l:2361352,m:1443136,h:32},{l:2361416,m:1443136,h:32},{l:1312776,m:1443137,h:32},{l:1315848,m:1443137,h:32},{l:1315912,m:1443137,h:32},{l:2361352,m:1443168,h:32},{l:2361416,m:1443168,h:32},{l:2364424,m:1443168,h:32},{l:2364488,m:1443168,h:32},{l:2492424,m:1443168,h:32},{l:2492488,m:1443168,h:32},{l:1312775,m:2426177,h:32},{l:1315847,m:2426177,h:32},{l:1315847,m:2427201,h:32},{l:1315847,m:2458177,h:32},{l:264195,m:0,h:64},{l:264196,m:0,h:64},{l:264200,m:0,h:64},{l:267268,m:0,h:64},{l:271364,m:0,h:64},{l:395268,m:0,h:64},{l:398340,m:0,h:64},{l:529411,m:0,h:64},{l:2230339,m:32,h:64},{l:2361347,m:64,h:64},{l:1312771,m:65,h:64},{l:1574915,m:129,h:64},{l:1577987,m:129,h:64},{l:2364419,m:192,h:64},{l:2230339,m:66080,h:64},{l:1181763,m:66081,h:64},{l:2361347,m:66112,h:64},{l:2361411,m:66112,h:64},{l:2230339,m:66848,h:64},{l:1181763,m:66849,h:64},{l:1181763,m:98849,h:64},{l:2361347,m:131648,h:64},{l:1312771,m:131649,h:64},{l:1312835,m:131649,h:64},{l:2364419,m:131680,h:64},{l:1312771,m:132417,h:64},{l:1315843,m:132417,h:64},{l:2364419,m:132448,h:64},{l:2361347,m:590400,h:80},{l:2361411,m:590400,h:80},{l:2361347,m:1376832,h:80},{l:2361411,m:1376832,h:80},{l:2361347,m:590400,h:88},{l:264195,m:0,h:128},{l:2230339,m:32,h:128},{l:2361347,m:64,h:128},{l:2361411,m:64,h:128},{l:2368579,m:128,h:128},{l:2361347,m:66112,h:128},{l:2361411,m:66112,h:128}]);Um=mq(iq(Dq,1),xB,0,7,[0.6966999769210815,0,0.4885999858379364,-0.47269999980926514,-0.07490000128746033,yC,0.273499995470047,0.5699999928474426,0.7009999752044678,0.9534000158309937,-0.2809000015258789,-0.8259999752044678,-0.1784999966621399,-1.620300054550171,-1.0959999561309814,0.13950000703334808,-0.29750001430511475,-1.2907999753952026,1.0161999464035034,zC,0.5110999941825867,-0.435699999332428,-0.10409999638795853,0.3424000144004822,-0.061500001698732376,0.6035000085830688,0.7226999998092651,0.43459999561309814,-0.3310000002384186,-0.49799999594688416,AC,BC,0.4291999936103821,-0.5824000239372253,-0.1834000051021576,0.1306000053882599,-0.5015000104904175,-0.5257999897003174,0.4244000017642975,-0.16099999845027924,-0.2777999937534332,0.2766000032424927,0.35929998755455017,0.7714999914169312,0.3149999976158142,-0.2651999890804291,-0.09650000184774399,0.420199990272522,0.18709999322891235,-0.3684000074863434,-0.07779999822378159,0.8942999839782715,0.3693999946117401,0.28790000081062317,0.4489000141620636,-0.26010000705718994,0.4771000146865845,0.1923000067472458,0.45969998836517334,0.3384000062942505,0.6632999777793884,0.4544000029563904,0.15970000624656677,0.633899986743927,0.35040000081062317,0.04490000009536743,0.34200000762939453,0.26109999418258667,0.40459999442100525,0.5218999981880188,-0.36320000886917114,-0.4108000099658966,0.30570000410079956,-0.14560000598430634,-0.27129998803138733,-0.5192999839782715,0.45260000228881836,0.5539000034332275,-0.7070000171661377,-0.48809999227523804,-0.4099999964237213,0,0.14790000021457672,0.3447999954223633,0.42980000376701355,0.5579000115394592,-0.1264999955892563,-0.042500000447034836,0.07670000195503235,0.6635000109672546,-0.38119998574256897,-0.8367999792098999,1.0286999940872192,-0.10209999978542328,0.3587000072002411,-0.5945000052452087,0.16920000314712524,-0.121799997985363,0.43810001015663147,0.16949999332427979,0.45249998569488525,0.3352000117301941,0.1582999974489212,0.4036000072956085,-0.04800000041723251,0.5023000240325928,-0.26489999890327454,0.76910001039505,-0.35519999265670776,1.0300999879837036,-0.11410000175237656,-0.5932000279426575,0.17489999532699585,0.13130000233650208,-0.18039999902248383,0.399399995803833,0.22910000383853912,0.31690001487731934,0.35989999771118164,-0.0038999998942017555,-0.2955999970436096,0.49070000648498535,CC,0.219200000166893,0.15649999678134918,0.6934999823570251,0.3617999851703644,0.6735000014305115,0.5777999758720398,-0.5636000037193298,0.5569000244140625,0.30379998683929443,-0.32760000228881836,-0.4659000039100647,DC,0.32829999923706055,0.22390000522136688,0.20430000126361847,0.05900000035762787,-0.48350000381469727,0.6165000200271606,-0.4011000096797943,0.5577999949455261,-0.21639999747276306,-0.017500000074505806,0.29809999465942383,0.10999999940395355,0.27149999141693115,0.4408999979496002,-0.16089999675750732,0.3774999976158142,-0.13459999859333038,-0.6991999745368958,-0.46700000762939453,0.1565999984741211,0.046799998730421066,-0.13210000097751617,1.3686000108718872,0,-0.4115999937057495,1.0185999870300293,-0.3935000002384186,0.5223000049591064,0.2838999927043915,0.5128999948501587,0.1265999972820282,0.010300000198185444,1.5192999839782715,0.2705000042915344,0.4293999969959259,0.012000000104308128,-0.33970001339912415,0.14830000698566437,0.28060001134872437,0.3206000030040741,0.5662000179290771,-0.09870000183582306,-0.10050000250339508,-0.35760000348091125,0.09610000252723694,-0.6401000022888184,0.19210000336170197,-0.15330000221729279,-0.4169999957084656,0.10939999669790268,0.8230999708175659,-0.3783999979496002,0.4032000005245209,-0.6460999846458435,0.8034999966621399,0.2029000073671341,-0.37450000643730164,BC,0.18410000205039978,0.707099974155426,0.12269999831914902,0.7949000000953674,0.03500000014901161,DC,-0.15539999306201935,0.3785000145435333,-0.24050000309944153,0.23589999973773956,0.34630000591278076,-0.4925000071525574,-0.09290000051259995,-0.4352000057697296,-0.2206999957561493,-0.9959999918937683,-0.723800003528595,-0.5468999743461609,-1.2939000129699707,-0.01360000018030405,0.2791000008583069,-0.16529999673366547,-0.12380000203847885,0.4950999915599823,0.289900004863739,0.065700002014637,0.7189000248908997,0.05700000002980232,0.661899983882904,-0.6381000280380249,-0.8072999715805054,0.23549999296665192,0.30480000376701355,-0.019899999722838402,-0.07519999891519547,0.27639999985694885,0.8011000156402588,-0.17440000176429749,0.15809999406337738,-0.384799987077713,0.5993000268936157,0.5267999768257141,-0.04170000180602074,0.37700000405311584,0.6998000144958496,0.593999981880188,0.5911999940872192,-0.5570999979972839,0.023800000548362732,-0.2475000023841858,0.030700000002980232,-0.38749998807907104,-0.7437000274658203,0.5144000053405762,0.00570000009611249,0.765500009059906,0.1720000058412552,-2.5624001026153564,-0.30660000443458557,0.36469998955726624,0.4733000099658966,-0.3400999903678894,-0.14499999582767487,0.7088000178337097,-0.13179999589920044,0.04259999841451645,-0.12030000239610672,-0.36239999532699585,0.5357999801635742,-0.3700999915599823,-0.5648000240325928,-0.1972000002861023,-0.8769000172615051,-0.3675000071525574,-0.2003999948501587,0.13359999656677246,-0.16990000009536743,0.44609999656677246,0.1559000015258789,1.1167999505996704,0.23649999499320984,-0.22059999406337738,0.4480000138282776,-0.40529999136924744,-0.13609999418258667,0.2198999971151352,0.053599998354911804,-0.020999999716877937,0.6984999775886536,0.9642999768257141,0.17270000278949738,-0.03290000185370445,-0.18930000066757202,0.07020000368356705,0.14959999918937683,zC,0.4146000146865845,-0.5027999877929688,0.3831999897956848,0.9545000195503235,-0.41519999504089355,-1.0369000434875488,-0.18299999833106995,0.5882999897003174,-0.29179999232292175,-0.5293999910354614,-0.6541000008583069,-0.19059999287128448,-0.8483999967575073,-0.3456999957561493,0.9541000127792358,-0.7924000024795532,EC,0.07999999821186066,-0.2596000134944916,0.8381999731063843,-0.2667999863624573,-0.11060000211000443,0.03620000183582306,-0.3188999891281128,-0.7278000116348267,-0.08940000087022781,-0.22769999504089355,-0.2393999993801117,-0.2962000072002411,0.7775999903678894,-0.011800000444054604,-0.4357999861240387,0.3749000132083893,-0.6069999933242798,-0.18569999933242798,0.11389999836683273,-0.4415999948978424,-0.37040001153945923,-0.7487000226974487,-0.10790000110864639,-0.29919999837875366,-0.3276999890804291,0.025100000202655792,-0.9187999963760376,0.2944999933242798,-0.22339999675750732,0.3467999994754791,BC,0.2890999913215637,0.2612999975681305,-0.03440000116825104,-0.6004999876022339,-0.6258000135421753,-0.54339998960495,-0.7712000012397766,-0.9057000279426575,-0.16680000722408295,-0.9904999732971191,AC,-0.03720000013709068,-1.1638000011444092,0.12620000541210175,-0.5248000025749207,-0.15379999577999115,-0.36820000410079956,0.3249000012874603,0.06499999761581421,0.051100000739097595,-0.46070000529289246,0.22310000658035278,0.28220000863075256,0.1396999955177307,0.2833000123500824,-0.1225999966263771,-0.459199994802475,-0.3434999883174896,-0.6654000282287598,-0.5055999755859375,-0.863099992275238,0.15360000729560852,-0.4050999879837036,0.08910000324249268,-0.6972000002861023,-0.4699000120162964,-0.6773999929428101,-0.062199998646974564,-0.9300000071525574,0.13369999825954437,-0.49380001425743103,0.39480000734329224,-0.4074999988079071,-0.6410999894142151,-0.009100000374019146,-0.13330000638961792,-0.5192000269889832,-0.16609999537467957,BC,-0.6427000164985657,-0.07069999724626541,0.4805999994277954,0.38280001282691956,0.22290000319480896,0.6159999966621399,-0.08839999884366989,-0.0471000000834465,0.11060000211000443,0.382099986076355,0.09220000356435776,0.08060000091791153,0.33709999918937683,0.188400000333786,0.13809999823570251,-0.23919999599456787,-3.6435000896453857,-2.150899887084961,0.4975000023841858,-0.3619999885559082,-2.5383999347686768,-1.6821000576019287,-0.3650999963283539,yC,-1.618499994277954,-1.065000057220459,0.8374000191688538,0.3684999942779541,0.25769999623298645,0.3790999948978424,-3.233299970626831,-1.794800043106079,-0.6592000126838684,-1.3148000240325928,FC,0.05339999869465828,-1.7552000284194946,-1.8039000034332275,-1.1339999437332153,-0.5652999877929688,-1.2453999519348145,0.9473000168800354,1.4230999946594238,1.011199951171875,-1.9498000144958496,-2.024899959564209,-1.2348999977111816,0.328000009059906,-3.9189000129699707,-2.19950008392334,0.18889999389648438,-1.2314000129699707,-1.802299976348877,-0.2994999885559082,-0.4066999852657318,-0.1316000074148178])}
	function fk(){fk=rt;ek=mq(iq(cr,2),GB,7,0,[null,mq(iq(cr,1),uC,3,0,[new dk(0,1.007825032),new dk(1,2.014101778),new dk(2,3.016049268),new dk(3,4.027834627),new dk(4,5.039542911),new dk(5,6.044942608)]),mq(iq(cr,1),uC,3,0,[new dk(1,3.01602931),new dk(2,4.00260325),new dk(3,5.012223628),new dk(4,6.018888072),new dk(5,7.028030527),new dk(6,8.033921838),new dk(7,9.043820323),new dk(8,10.052399713)]),mq(iq(cr,1),uC,3,0,[new dk(1,4.027182329),new dk(2,5.012537796),new dk(3,6.015122281),new dk(4,7.016004049),new dk(5,8.02248667),new dk(6,9.026789122),new dk(7,10.035480884),new dk(8,11.043796166),new dk(9,12.05378)]),mq(iq(cr,1),uC,3,0,[new dk(1,5.04079),new dk(2,6.019725804),new dk(3,7.016929246),new dk(4,8.005305094),new dk(5,9.012182135),new dk(6,10.01353372),new dk(7,11.021657653),new dk(8,12.026920631),new dk(9,13.036133834),new dk(10,14.042815522)]),mq(iq(cr,1),uC,3,0,[new dk(2,7.029917389),new dk(3,8.024606713),new dk(4,9.013328806),new dk(5,10.012937027),new dk(6,11.009305466),new dk(7,12.014352109),new dk(8,13.017780267),new dk(9,14.025404064),new dk(10,15.031097291),new dk(11,16.039808836),new dk(12,17.046931399),new dk(13,18.05617),new dk(14,19.06373)]),mq(iq(cr,1),uC,3,0,[new dk(2,8.037675026),new dk(3,9.031040087),new dk(4,10.01685311),new dk(5,11.011433818),new dk(6,12),new dk(7,13.003354838),new dk(8,14.003241988),new dk(9,15.010599258),new dk(10,16.014701243),new dk(11,17.022583712),new dk(12,18.026757058),new dk(13,19.035248094),new dk(14,20.040322395),new dk(15,21.04934),new dk(16,22.05645)]),mq(iq(cr,1),uC,3,0,[new dk(3,10.042618),new dk(4,11.026796226),new dk(5,12.018613202),new dk(6,13.005738584),new dk(7,14.003074005),new dk(8,15.000108898),new dk(9,16.006101417),new dk(10,17.008449673),new dk(11,18.014081827),new dk(12,19.017026896),new dk(13,20.023367295),new dk(14,21.027087574),new dk(15,22.034440259),new dk(16,23.04051),new dk(17,24.0505)]),mq(iq(cr,1),uC,3,0,[new dk(4,12.034404776),new dk(5,13.0248104),new dk(6,14.008595285),new dk(7,15.003065386),new dk(8,15.994914622),new dk(9,16.999131501),new dk(10,17.999160419),new dk(11,19.00357873),new dk(12,20.00407615),new dk(13,21.008654631),new dk(14,22.009967157),new dk(15,23.015691325),new dk(16,24.020369922),new dk(17,25.02914),new dk(18,26.03775)]),mq(iq(cr,1),uC,3,0,[new dk(5,14.03608),new dk(6,15.018010856),new dk(7,16.01146573),new dk(8,17.002095238),new dk(9,18.000937667),new dk(10,18.998403205),new dk(11,19.999981324),new dk(12,20.999948921),new dk(13,22.00299925),new dk(14,23.003574385),new dk(15,24.008099371),new dk(16,25.012094963),new dk(17,26.019633157),new dk(18,27.026892316),new dk(19,28.03567),new dk(20,29.04326)]),mq(iq(cr,1),uC,3,0,[new dk(6,16.025756907),new dk(7,17.017697565),new dk(8,18.005697066),new dk(9,19.001879839),new dk(10,19.992440176),new dk(11,20.993846744),new dk(12,21.99138551),new dk(13,22.994467337),new dk(14,23.993615074),new dk(15,24.997789899),new dk(16,26.000461498),new dk(17,27.0076152),new dk(18,28.012108072),new dk(19,29.019345902),new dk(20,30.023872),new dk(21,31.03311),new dk(22,32.03991)]),mq(iq(cr,1),uC,3,0,[new dk(7,18.02718),new dk(8,19.01387945),new dk(9,20.00734826),new dk(10,20.997655099),new dk(11,21.994436782),new dk(12,22.989769675),new dk(13,23.990963332),new dk(14,24.989954352),new dk(15,25.992589898),new dk(16,26.994008702),new dk(17,27.99889041),new dk(18,29.002811301),new dk(19,30.009226487),new dk(20,31.013595108),new dk(21,32.019649792),new dk(22,33.027386),new dk(23,34.0349),new dk(24,35.04418)]),mq(iq(cr,1),uC,3,0,[new dk(8,20.018862744),new dk(9,21.011714174),new dk(10,21.999574055),new dk(11,22.99412485),new dk(12,23.985041898),new dk(13,24.985837023),new dk(14,25.98259304),new dk(15,26.984340742),new dk(16,27.983876703),new dk(17,28.988554743),new dk(18,29.990464529),new dk(19,30.996548459),new dk(20,31.999145889),new dk(21,33.005586975),new dk(22,34.00907244),new dk(23,35.018669),new dk(24,36.02245),new dk(25,37.03124)]),mq(iq(cr,1),uC,3,0,[new dk(8,21.02804),new dk(9,22.01952),new dk(10,23.0072649),new dk(11,23.999940911),new dk(12,24.990428555),new dk(13,25.986891659),new dk(14,26.981538441),new dk(15,27.981910184),new dk(16,28.980444848),new dk(17,29.982960304),new dk(18,30.983946023),new dk(19,31.988124379),new dk(20,32.990869587),new dk(21,33.996927255),new dk(22,34.99993765),new dk(23,36.006351501),new dk(24,37.01031),new dk(25,38.0169),new dk(26,39.0219)]),mq(iq(cr,1),uC,3,0,[new dk(8,22.03453),new dk(9,23.02552),new dk(10,24.011545711),new dk(11,25.00410664),new dk(12,25.992329935),new dk(13,26.986704764),new dk(14,27.976926533),new dk(15,28.976494719),new dk(16,29.973770218),new dk(17,30.975363275),new dk(18,31.974148129),new dk(19,32.97800052),new dk(20,33.978575745),new dk(21,34.984584158),new dk(22,35.986687363),new dk(23,36.99299599),new dk(24,37.99598),new dk(25,39.0023),new dk(26,40.0058),new dk(27,41.0127),new dk(28,42.0161)]),mq(iq(cr,1),uC,3,0,[new dk(9,24.03435),new dk(10,25.02026),new dk(11,26.01178),new dk(12,26.999191645),new dk(13,27.99231233),new dk(14,28.981801376),new dk(15,29.978313807),new dk(16,30.973761512),new dk(17,31.973907163),new dk(18,32.971725281),new dk(19,33.973636381),new dk(20,34.973314249),new dk(21,35.978259824),new dk(22,36.979608338),new dk(23,37.98447),new dk(24,38.98642),new dk(25,39.99105),new dk(26,40.9948),new dk(27,42.00009),new dk(28,43.00331),new dk(29,44.00988),new dk(30,45.01514),new dk(31,46.02383)]),mq(iq(cr,1),uC,3,0,[new dk(10,26.02788),new dk(11,27.018795),new dk(12,28.004372661),new dk(13,28.996608805),new dk(14,29.984902954),new dk(15,30.979554421),new dk(16,31.97207069),new dk(17,32.971458497),new dk(18,33.967866831),new dk(19,34.96903214),new dk(20,35.96708088),new dk(21,36.971125716),new dk(22,37.971163443),new dk(23,38.975135275),new dk(24,39.97547),new dk(25,40.98003),new dk(26,41.98149),new dk(27,42.9866),new dk(28,43.98832),new dk(29,44.99482),new dk(30,45.99957),new dk(31,47.00762),new dk(32,48.01299),new dk(33,49.02201)]),mq(iq(cr,1),uC,3,0,[new dk(11,28.02851),new dk(12,29.01411),new dk(13,30.00477),new dk(14,30.992416014),new dk(15,31.985688908),new dk(16,32.977451798),new dk(17,33.973761967),new dk(18,34.968852707),new dk(19,35.968306945),new dk(20,36.9659026),new dk(21,37.96801055),new dk(22,38.968007677),new dk(23,39.970415555),new dk(24,40.970650212),new dk(25,41.973174994),new dk(26,42.974203385),new dk(27,43.978538712),new dk(28,44.9797),new dk(29,45.98412),new dk(30,46.98795),new dk(31,47.99485),new dk(32,48.99989),new dk(33,50.00773),new dk(34,51.01353)]),mq(iq(cr,1),uC,3,0,[new dk(12,30.02156),new dk(13,31.012126),new dk(14,31.99766066),new dk(15,32.989928719),new dk(16,33.980270118),new dk(17,34.975256726),new dk(18,35.967546282),new dk(19,36.966775912),new dk(20,37.962732161),new dk(21,38.964313413),new dk(22,39.962383123),new dk(23,40.964500828),new dk(24,41.963046386),new dk(25,42.965670701),new dk(26,43.965365269),new dk(27,44.968094979),new dk(28,45.968093467),new dk(29,46.972186238),new dk(30,47.97507),new dk(31,48.98218),new dk(32,49.98594),new dk(33,50.99324),new dk(34,51.99817),new dk(35,53.006227)]),mq(iq(cr,1),uC,3,0,[new dk(13,32.02192),new dk(14,33.00726),new dk(15,33.99841),new dk(16,34.988011615),new dk(17,35.981293405),new dk(18,36.973376915),new dk(19,37.969080107),new dk(20,38.963706861),new dk(21,39.963998672),new dk(22,40.961825972),new dk(23,41.962403059),new dk(24,42.960715746),new dk(25,43.961556146),new dk(26,44.960699658),new dk(27,45.961976203),new dk(28,46.961677807),new dk(29,47.965512946),new dk(30,48.967450084),new dk(31,49.972782832),new dk(32,50.97638),new dk(33,51.98261),new dk(34,52.98712),new dk(35,53.99399),new dk(36,54.999388)]),mq(iq(cr,1),uC,3,0,[new dk(14,34.01412),new dk(15,35.004765),new dk(16,35.993087234),new dk(17,36.985871505),new dk(18,37.976318637),new dk(19,38.970717729),new dk(20,39.962591155),new dk(21,40.962278349),new dk(22,41.958618337),new dk(23,42.958766833),new dk(24,43.955481094),new dk(25,44.956185938),new dk(26,45.953692759),new dk(27,46.954546459),new dk(28,47.952533512),new dk(29,48.955673302),new dk(30,49.957518286),new dk(31,50.961474238),new dk(32,51.9651),new dk(33,52.97005),new dk(34,53.97468),new dk(35,54.98055),new dk(36,55.98579),new dk(37,56.992356)]),mq(iq(cr,1),uC,3,0,[new dk(15,36.01492),new dk(16,37.00305),new dk(17,37.9947),new dk(18,38.984790009),new dk(19,39.977964014),new dk(20,40.969251316),new dk(21,41.965516761),new dk(22,42.96115098),new dk(23,43.959403048),new dk(24,44.955910243),new dk(25,45.95517025),new dk(26,46.952408027),new dk(27,47.952234991),new dk(28,48.950024065),new dk(29,49.952187008),new dk(30,50.9536027),new dk(31,51.95665),new dk(32,52.95817),new dk(33,53.963),new dk(34,54.9694),new dk(35,55.97266),new dk(36,56.97704),new dk(37,57.98307),new dk(38,58.988041)]),mq(iq(cr,1),uC,3,0,[new dk(16,38.00977),new dk(17,39.001323),new dk(18,39.990498907),new dk(19,40.983131),new dk(20,41.973031622),new dk(21,42.968523342),new dk(22,43.959690235),new dk(23,44.958124349),new dk(24,45.952629491),new dk(25,46.951763792),new dk(26,47.947947053),new dk(27,48.947870789),new dk(28,49.944792069),new dk(29,50.946616017),new dk(30,51.946898175),new dk(31,52.949731709),new dk(32,53.95087),new dk(33,54.95512),new dk(34,55.95799),new dk(35,56.9643),new dk(36,57.96611),new dk(37,58.97196),new dk(38,59.97564),new dk(39,60.982018)]),mq(iq(cr,1),uC,3,0,[new dk(17,40.01109),new dk(18,40.99974),new dk(19,41.99123),new dk(20,42.98065),new dk(21,43.9744),new dk(22,44.965782286),new dk(23,45.960199491),new dk(24,46.954906918),new dk(25,47.95225448),new dk(26,48.948516914),new dk(27,49.947162792),new dk(28,50.943963675),new dk(29,51.944779658),new dk(30,52.944342517),new dk(31,53.946444381),new dk(32,54.947238194),new dk(33,55.95036),new dk(34,56.95236),new dk(35,57.95665),new dk(36,58.9593),new dk(37,59.9645),new dk(38,60.96741),new dk(39,61.97314),new dk(40,62.97675)]),mq(iq(cr,1),uC,3,0,[new dk(18,42.00643),new dk(19,42.997707),new dk(20,43.98547),new dk(21,44.97916),new dk(22,45.968361649),new dk(23,46.962906512),new dk(24,47.954035861),new dk(25,48.951341135),new dk(26,49.946049607),new dk(27,50.944771767),new dk(28,51.940511904),new dk(29,52.940653781),new dk(30,53.938884921),new dk(31,54.940844164),new dk(32,55.940645238),new dk(33,56.9437538),new dk(34,57.94425),new dk(35,58.94863),new dk(36,59.94973),new dk(37,60.95409),new dk(38,61.9558),new dk(39,62.96186),new dk(40,63.9642),new dk(41,64.97037)]),mq(iq(cr,1),uC,3,0,[new dk(19,44.00687),new dk(20,44.99451),new dk(21,45.98672),new dk(22,46.9761),new dk(23,47.96887),new dk(24,48.959623415),new dk(25,49.95424396),new dk(26,50.948215487),new dk(27,51.945570079),new dk(28,52.941294702),new dk(29,53.940363247),new dk(30,54.938049636),new dk(31,55.938909366),new dk(32,56.938287458),new dk(33,57.939986451),new dk(34,58.940447166),new dk(35,59.943193998),new dk(36,60.94446),new dk(37,61.94797),new dk(38,62.94981),new dk(39,63.95373),new dk(40,64.9561),new dk(41,65.96082),new dk(42,66.96382)]),mq(iq(cr,1),uC,3,0,[new dk(19,45.01456),new dk(20,46.00081),new dk(21,46.99289),new dk(22,47.98056),new dk(23,48.97361),new dk(24,49.962993316),new dk(25,50.956824936),new dk(26,51.948116526),new dk(27,52.945312282),new dk(28,53.939614836),new dk(29,54.938298029),new dk(30,55.934942133),new dk(31,56.935398707),new dk(32,57.933280458),new dk(33,58.934880493),new dk(34,59.934076943),new dk(35,60.936749461),new dk(36,61.936770495),new dk(37,62.940118442),new dk(38,63.94087),new dk(39,64.94494),new dk(40,65.94598),new dk(41,66.95),new dk(42,67.95251),new dk(43,68.9577)]),mq(iq(cr,1),uC,3,0,[new dk(21,48.00176),new dk(22,48.98972),new dk(23,49.98154),new dk(24,50.97072),new dk(25,51.96359),new dk(26,52.954224985),new dk(27,53.948464147),new dk(28,54.942003149),new dk(29,55.939843937),new dk(30,56.936296235),new dk(31,57.935757571),new dk(32,58.933200194),new dk(33,59.933822196),new dk(34,60.932479381),new dk(35,61.934054212),new dk(36,62.933615218),new dk(37,63.935813523),new dk(38,64.936484581),new dk(39,65.939825412),new dk(40,66.94061),new dk(41,67.94436),new dk(42,68.9452),new dk(43,69.94981),new dk(44,70.95173),new dk(45,71.95641)]),mq(iq(cr,1),uC,3,0,[new dk(22,49.99593),new dk(23,50.98772),new dk(24,51.97568),new dk(25,52.96846),new dk(26,53.957910508),new dk(27,54.951336329),new dk(28,55.942136339),new dk(29,56.939800489),new dk(30,57.935347922),new dk(31,58.934351553),new dk(32,59.930790633),new dk(33,60.931060442),new dk(34,61.928348763),new dk(35,62.929672948),new dk(36,63.927969574),new dk(37,64.930088013),new dk(38,65.929115232),new dk(39,66.931569638),new dk(40,67.931844932),new dk(41,68.935181837),new dk(42,69.93614),new dk(43,70.94),new dk(44,71.9413),new dk(45,72.94608),new dk(46,73.94791),new dk(47,74.95297),new dk(48,75.95533),new dk(49,76.96083),new dk(50,77.9638)]),mq(iq(cr,1),uC,3,0,[new dk(23,51.99718),new dk(24,52.98555),new dk(25,53.97671),new dk(26,54.96605),new dk(27,55.95856),new dk(28,56.949215695),new dk(29,57.944540734),new dk(30,58.939504114),new dk(31,59.937368123),new dk(32,60.933462181),new dk(33,61.932587299),new dk(34,62.929601079),new dk(35,63.929767865),new dk(36,64.927793707),new dk(37,65.928873041),new dk(38,66.927750294),new dk(39,67.929637875),new dk(40,68.929425281),new dk(41,69.932409287),new dk(42,70.932619818),new dk(43,71.93552),new dk(44,72.93649),new dk(45,73.9402),new dk(46,74.9417),new dk(47,75.94599),new dk(48,76.94795),new dk(49,77.95281),new dk(50,78.95528),new dk(51,79.96189)]),mq(iq(cr,1),uC,3,0,[new dk(24,53.99295),new dk(25,54.98398),new dk(26,55.97238),new dk(27,56.96491),new dk(28,57.954596465),new dk(29,58.949267074),new dk(30,59.941832031),new dk(31,60.939513907),new dk(32,61.934334132),new dk(33,62.933215563),new dk(34,63.929146578),new dk(35,64.929245079),new dk(36,65.926036763),new dk(37,66.927130859),new dk(38,67.924847566),new dk(39,68.926553538),new dk(40,69.92532487),new dk(41,70.927727195),new dk(42,71.926861122),new dk(43,72.929779469),new dk(44,73.929458261),new dk(45,74.932937379),new dk(46,75.933394207),new dk(47,76.937085857),new dk(48,77.938569576),new dk(49,78.942095175),new dk(50,79.944414722),new dk(51,80.95048),new dk(52,81.95484)]),mq(iq(cr,1),uC,3,0,[new dk(25,55.99491),new dk(26,56.98293),new dk(27,57.97425),new dk(28,58.96337),new dk(29,59.95706),new dk(30,60.94917),new dk(31,61.944179608),new dk(32,62.939141527),new dk(33,63.936838307),new dk(34,64.932739322),new dk(35,65.931592355),new dk(36,66.928204915),new dk(37,67.927983497),new dk(38,68.925580912),new dk(39,69.926027741),new dk(40,70.92470501),new dk(41,71.92636935),new dk(42,72.925169832),new dk(43,73.926940999),new dk(44,74.926500645),new dk(45,75.928928262),new dk(46,76.929281189),new dk(47,77.93165595),new dk(48,78.932916371),new dk(49,79.936588154),new dk(50,80.937752955),new dk(51,81.94316),new dk(52,82.94687),new dk(53,83.95234)]),mq(iq(cr,1),uC,3,0,[new dk(26,57.99101),new dk(27,58.98175),new dk(28,59.97019),new dk(29,60.96379),new dk(30,61.95465),new dk(31,62.94964),new dk(32,63.941572638),new dk(33,64.939440762),new dk(34,65.933846798),new dk(35,66.932738415),new dk(36,67.928097266),new dk(37,68.927972002),new dk(38,69.924250365),new dk(39,70.924953991),new dk(40,71.922076184),new dk(41,72.923459361),new dk(42,73.921178213),new dk(43,74.922859494),new dk(44,75.921402716),new dk(45,76.923548462),new dk(46,77.922852886),new dk(47,78.92540156),new dk(48,79.925444764),new dk(49,80.928821065),new dk(50,81.929550326),new dk(51,82.93451),new dk(52,83.93731),new dk(53,84.94269),new dk(54,85.94627)]),mq(iq(cr,1),uC,3,0,[new dk(27,59.99313),new dk(28,60.98062),new dk(29,61.9732),new dk(30,62.96369),new dk(31,63.957572),new dk(32,64.949484),new dk(33,65.944099147),new dk(34,66.939190417),new dk(35,67.936792976),new dk(36,68.932280154),new dk(37,69.930927811),new dk(38,70.927114724),new dk(39,71.926752647),new dk(40,72.923825288),new dk(41,73.923929076),new dk(42,74.921596417),new dk(43,75.922393933),new dk(44,76.920647703),new dk(45,77.921828577),new dk(46,78.920948498),new dk(47,79.922578162),new dk(48,80.922132884),new dk(49,81.924504668),new dk(50,82.924980625),new dk(51,83.92906),new dk(52,84.93181),new dk(53,85.93623),new dk(54,86.93958),new dk(55,87.94456),new dk(56,88.94923)]),mq(iq(cr,1),uC,3,0,[new dk(31,64.96466),new dk(32,65.95521),new dk(33,66.95009),new dk(34,67.94187),new dk(35,68.939562155),new dk(36,69.933504),new dk(37,70.931868378),new dk(38,71.927112313),new dk(39,72.9267668),new dk(40,73.922476561),new dk(41,74.922523571),new dk(42,75.919214107),new dk(43,76.91991461),new dk(44,77.917309522),new dk(45,78.918499802),new dk(46,79.916521828),new dk(47,80.917992931),new dk(48,81.9167),new dk(49,82.919119072),new dk(50,83.918464523),new dk(51,84.922244678),new dk(52,85.924271165),new dk(53,86.928520749),new dk(54,87.931423982),new dk(55,88.93602),new dk(56,89.93942),new dk(57,90.94537),new dk(58,91.94933)]),mq(iq(cr,1),uC,3,0,[new dk(32,66.96479),new dk(33,67.958248),new dk(34,68.950178),new dk(35,69.944208),new dk(36,70.939246),new dk(37,71.936496876),new dk(38,72.931794889),new dk(39,73.929891152),new dk(40,74.92577641),new dk(41,75.924541974),new dk(42,76.921380123),new dk(43,77.92114613),new dk(44,78.918337647),new dk(45,79.918529952),new dk(46,80.91629106),new dk(47,81.916804666),new dk(48,82.915180219),new dk(49,83.916503685),new dk(50,84.915608027),new dk(51,85.918797162),new dk(52,86.920710713),new dk(53,87.924065908),new dk(54,88.92638726),new dk(55,89.930634988),new dk(56,90.9339653),new dk(57,91.939255258),new dk(58,92.9431),new dk(59,93.94868)]),mq(iq(cr,1),uC,3,0,[new dk(33,68.96532),new dk(34,69.95601),new dk(35,70.95051),new dk(36,71.94190754),new dk(37,72.938931115),new dk(38,73.933258225),new dk(39,74.931033794),new dk(40,75.925948304),new dk(41,76.92466788),new dk(42,77.920386271),new dk(43,78.920082992),new dk(44,79.91637804),new dk(45,80.916592419),new dk(46,81.913484601),new dk(47,82.914135952),new dk(48,83.911506627),new dk(49,84.912526954),new dk(50,85.910610313),new dk(51,86.913354251),new dk(52,87.914446951),new dk(53,88.917632505),new dk(54,89.919523803),new dk(55,90.923442418),new dk(56,91.926152752),new dk(57,92.931265246),new dk(58,93.934362),new dk(59,94.93984),new dk(60,95.94307),new dk(61,96.94856)]),mq(iq(cr,1),uC,3,0,[new dk(34,70.96532),new dk(35,71.95908),new dk(36,72.950366),new dk(37,73.944470376),new dk(38,74.938569199),new dk(39,75.935071448),new dk(40,76.930406599),new dk(41,77.928141485),new dk(42,78.923996719),new dk(43,79.922519322),new dk(44,80.918994165),new dk(45,81.918207691),new dk(46,82.915111951),new dk(47,83.914384676),new dk(48,84.911789341),new dk(49,85.91116708),new dk(50,86.909183465),new dk(51,87.911318556),new dk(52,88.912279939),new dk(53,89.914808941),new dk(54,90.91653416),new dk(55,91.919725442),new dk(56,92.922032765),new dk(57,93.926407326),new dk(58,94.92931926),new dk(59,95.934283962),new dk(60,96.937342863),new dk(61,97.941703557),new dk(62,98.945420616),new dk(63,99.94987),new dk(64,100.953195994),new dk(65,101.95921)]),mq(iq(cr,1),uC,3,0,[new dk(35,72.96597),new dk(36,73.95631),new dk(37,74.94992),new dk(38,75.94161),new dk(39,76.937761511),new dk(40,77.932179362),new dk(41,78.929707076),new dk(42,79.924524588),new dk(43,80.923213095),new dk(44,81.918401258),new dk(45,82.917555029),new dk(46,83.913424778),new dk(47,84.912932689),new dk(48,85.909262351),new dk(49,86.908879316),new dk(50,87.905614339),new dk(51,88.907452906),new dk(52,89.907737596),new dk(53,90.910209845),new dk(54,91.911029895),new dk(55,92.91402241),new dk(56,93.915359856),new dk(57,94.919358213),new dk(58,95.921680473),new dk(59,96.926148757),new dk(60,97.928471177),new dk(61,98.933315038),new dk(62,99.935351729),new dk(63,100.940517434),new dk(64,101.943018795),new dk(65,102.94895),new dk(66,103.95233)]),mq(iq(cr,1),uC,3,0,[new dk(38,76.94962),new dk(39,77.9435),new dk(40,78.937350712),new dk(41,79.931982402),new dk(42,80.929128719),new dk(43,81.926792071),new dk(44,82.922352572),new dk(45,83.920387768),new dk(46,84.916427076),new dk(47,85.914887724),new dk(48,86.910877833),new dk(49,87.909503361),new dk(50,88.905847902),new dk(51,89.907151443),new dk(52,90.907303415),new dk(53,91.908946832),new dk(54,92.909581582),new dk(55,93.911594008),new dk(56,94.912823709),new dk(57,95.915897787),new dk(58,96.918131017),new dk(59,97.922219525),new dk(60,98.924634736),new dk(61,99.927756402),new dk(62,100.930313395),new dk(63,101.933555501),new dk(64,102.93694),new dk(65,103.94145),new dk(66,104.94509),new dk(67,105.95022)]),mq(iq(cr,1),uC,3,0,[new dk(39,78.94916),new dk(40,79.94055),new dk(41,80.936815296),new dk(42,81.931086249),new dk(43,82.92865213),new dk(44,83.92325),new dk(45,84.92146522),new dk(46,85.916472851),new dk(47,86.914816578),new dk(48,87.910226179),new dk(49,88.908888916),new dk(50,89.904703679),new dk(51,90.905644968),new dk(52,91.905040106),new dk(53,92.906475627),new dk(54,93.906315765),new dk(55,94.908042739),new dk(56,95.908275675),new dk(57,96.910950716),new dk(58,97.912746366),new dk(59,98.916511084),new dk(60,99.917761704),new dk(61,100.921139958),new dk(62,101.922981089),new dk(63,102.926597062),new dk(64,103.92878),new dk(65,104.93305),new dk(66,105.93591),new dk(67,106.94086),new dk(68,107.94428)]),mq(iq(cr,1),uC,3,0,[new dk(40,80.94905),new dk(41,81.94313),new dk(42,82.936703713),new dk(43,83.93357),new dk(44,84.927906486),new dk(45,85.925037588),new dk(46,86.920361435),new dk(47,87.91833144),new dk(48,88.913495503),new dk(49,89.911264109),new dk(50,90.906990538),new dk(51,91.907193214),new dk(52,92.906377543),new dk(53,93.907283457),new dk(54,94.906835178),new dk(55,95.908100076),new dk(56,96.908097144),new dk(57,97.91033069),new dk(58,98.911617864),new dk(59,99.914181434),new dk(60,100.915251567),new dk(61,101.918037417),new dk(62,102.919141297),new dk(63,103.922459464),new dk(64,104.923934023),new dk(65,105.92819),new dk(66,106.93031),new dk(67,107.93501),new dk(68,108.93763),new dk(69,109.94268)]),mq(iq(cr,1),uC,3,0,[new dk(41,82.94874),new dk(42,83.94009),new dk(43,84.93659),new dk(44,85.930695167),new dk(45,86.92732683),new dk(46,87.921952728),new dk(47,88.919480562),new dk(48,89.913936161),new dk(49,90.911750754),new dk(50,91.90681048),new dk(51,92.906812213),new dk(52,93.905087578),new dk(53,94.905841487),new dk(54,95.904678904),new dk(55,96.906021033),new dk(56,97.905407846),new dk(57,98.907711598),new dk(58,99.907477149),new dk(59,100.910346543),new dk(60,101.910297162),new dk(61,102.913204596),new dk(62,103.913758387),new dk(63,104.916972087),new dk(64,105.918134284),new dk(65,106.921694724),new dk(66,107.923973837),new dk(67,108.92781),new dk(68,109.92973),new dk(69,110.93451),new dk(70,111.93684),new dk(71,112.94203)]),mq(iq(cr,1),uC,3,0,[new dk(42,84.94894),new dk(43,85.94288),new dk(44,86.93653),new dk(45,87.93283),new dk(46,88.92754288),new dk(47,89.92355583),new dk(48,90.9184282),new dk(49,91.915259655),new dk(50,92.910248473),new dk(51,93.909656309),new dk(52,94.907656454),new dk(53,95.907870803),new dk(54,96.906364843),new dk(55,97.907215692),new dk(56,98.906254554),new dk(57,99.907657594),new dk(58,100.90731438),new dk(59,101.909212938),new dk(60,102.909178805),new dk(61,103.911444898),new dk(62,104.911658043),new dk(63,105.914355408),new dk(64,106.915081691),new dk(65,107.918479973),new dk(66,108.919980998),new dk(67,109.92339),new dk(68,110.92505),new dk(69,111.92924),new dk(70,112.93133),new dk(71,113.93588),new dk(72,114.93828)]),mq(iq(cr,1),uC,3,0,[new dk(43,86.94918),new dk(44,87.94042),new dk(45,88.93611),new dk(46,89.92978),new dk(47,90.926377434),new dk(48,91.92012),new dk(49,92.917051523),new dk(50,93.911359569),new dk(51,94.910412729),new dk(52,95.907597681),new dk(53,96.907554546),new dk(54,97.905287111),new dk(55,98.905939307),new dk(56,99.904219664),new dk(57,100.905582219),new dk(58,101.904349503),new dk(59,102.906323677),new dk(60,103.905430145),new dk(61,104.907750341),new dk(62,105.907326913),new dk(63,106.909907207),new dk(64,107.910192211),new dk(65,108.913201565),new dk(66,109.913966185),new dk(67,110.91756),new dk(68,111.918821673),new dk(69,112.92254),new dk(70,113.923891981),new dk(71,114.92831),new dk(72,115.93016),new dk(73,116.93479),new dk(74,117.93703)]),mq(iq(cr,1),uC,3,0,[new dk(44,88.94938),new dk(45,89.94287),new dk(46,90.93655),new dk(47,91.93198),new dk(48,92.92574),new dk(49,93.921698),new dk(50,94.915898541),new dk(51,95.914518212),new dk(52,96.911336643),new dk(53,97.910716431),new dk(54,98.908132101),new dk(55,99.90811663),new dk(56,100.906163526),new dk(57,101.906842845),new dk(58,102.905504182),new dk(59,103.906655315),new dk(60,104.905692444),new dk(61,105.907284615),new dk(62,106.90675054),new dk(63,107.908730768),new dk(64,108.908735621),new dk(65,109.910949525),new dk(66,110.91166),new dk(67,111.913969253),new dk(68,112.91542),new dk(69,113.91734336),new dk(70,114.920124676),new dk(71,115.922746643),new dk(72,116.92535),new dk(73,117.92943),new dk(74,118.93136),new dk(75,119.93578),new dk(76,120.93808)]),mq(iq(cr,1),uC,3,0,[new dk(45,90.94948),new dk(46,91.94042),new dk(47,92.93591),new dk(48,93.92877),new dk(49,94.92469),new dk(50,95.91822194),new dk(51,96.916478921),new dk(52,97.912720751),new dk(53,98.911767757),new dk(54,99.908504596),new dk(55,100.908289144),new dk(56,101.905607716),new dk(57,102.906087204),new dk(58,103.904034912),new dk(59,104.905084046),new dk(60,105.903483087),new dk(61,106.905128453),new dk(62,107.903894451),new dk(63,108.905953535),new dk(64,109.905152385),new dk(65,110.907643952),new dk(66,111.907313277),new dk(67,112.910151346),new dk(68,113.910365322),new dk(69,114.91368341),new dk(70,115.914158288),new dk(71,116.91784),new dk(72,117.918983915),new dk(73,118.92268),new dk(74,119.92403),new dk(75,120.92818),new dk(76,121.9298),new dk(77,122.93426)]),mq(iq(cr,1),uC,3,0,[new dk(47,93.94278),new dk(48,94.93548),new dk(49,95.93068),new dk(50,96.924),new dk(51,97.921759995),new dk(52,98.917597103),new dk(53,99.916069387),new dk(54,100.912802135),new dk(55,101.911999996),new dk(56,102.908972453),new dk(57,103.908628228),new dk(58,104.906528234),new dk(59,105.906666431),new dk(60,106.90509302),new dk(61,107.905953705),new dk(62,108.904755514),new dk(63,109.90611046),new dk(64,110.905294679),new dk(65,111.907004132),new dk(66,112.906565708),new dk(67,113.908807907),new dk(68,114.908762282),new dk(69,115.911359558),new dk(70,116.911684187),new dk(71,117.914582383),new dk(72,118.915666045),new dk(73,119.918788609),new dk(74,120.919851074),new dk(75,121.92332),new dk(76,122.9249),new dk(77,123.92853),new dk(78,124.93054),new dk(79,125.9345),new dk(80,126.93688)]),mq(iq(cr,1),uC,3,0,[new dk(48,95.93977),new dk(49,96.93494),new dk(50,97.927579),new dk(51,98.92501),new dk(52,99.920230232),new dk(53,100.918681442),new dk(54,101.914777255),new dk(55,102.913418952),new dk(56,103.909848091),new dk(57,104.909467818),new dk(58,105.906458007),new dk(59,106.906614232),new dk(60,107.904183403),new dk(61,108.904985569),new dk(62,109.903005578),new dk(63,110.904181628),new dk(64,111.902757226),new dk(65,112.904400947),new dk(66,113.903358121),new dk(67,114.905430553),new dk(68,115.904755434),new dk(69,116.907218242),new dk(70,117.906914144),new dk(71,118.909922582),new dk(72,119.909851352),new dk(73,120.91298039),new dk(74,121.9135),new dk(75,122.917003675),new dk(76,123.917648302),new dk(77,124.92124717),new dk(78,125.922353996),new dk(79,126.926434822),new dk(80,127.927760617),new dk(81,128.93226),new dk(82,129.93398)]),mq(iq(cr,1),uC,3,0,[new dk(49,97.94224),new dk(50,98.93461),new dk(51,99.931149033),new dk(52,100.92656),new dk(53,101.924707541),new dk(54,102.919913896),new dk(55,103.918338416),new dk(56,104.914673434),new dk(57,105.913461134),new dk(58,106.910292195),new dk(59,107.909719683),new dk(60,108.907154078),new dk(61,109.907168783),new dk(62,110.905110677),new dk(63,111.905533338),new dk(64,112.904061223),new dk(65,113.904916758),new dk(66,114.903878328),new dk(67,115.905259995),new dk(68,116.904515731),new dk(69,117.906354623),new dk(70,118.905846334),new dk(71,119.907961505),new dk(72,120.907848847),new dk(73,121.910277103),new dk(74,122.910438951),new dk(75,123.913175916),new dk(76,124.913601387),new dk(77,125.916464532),new dk(78,126.917344048),new dk(79,127.920170658),new dk(80,128.921657958),new dk(81,129.924854941),new dk(82,130.926767408),new dk(83,131.932919005),new dk(84,132.93834),new dk(85,133.94466)]),mq(iq(cr,1),uC,3,0,[new dk(50,99.938954),new dk(51,100.93606),new dk(52,101.93049),new dk(53,102.92813),new dk(54,103.923185469),new dk(55,104.921390409),new dk(56,105.916880472),new dk(57,106.915666702),new dk(58,107.911965339),new dk(59,108.911286879),new dk(60,109.907852688),new dk(61,110.907735404),new dk(62,111.90482081),new dk(63,112.905173373),new dk(64,113.902781816),new dk(65,114.903345973),new dk(66,115.901744149),new dk(67,116.902953765),new dk(68,117.901606328),new dk(69,118.90330888),new dk(70,119.902196571),new dk(71,120.904236867),new dk(72,121.903440138),new dk(73,122.905721901),new dk(74,123.90527463),new dk(75,124.907784924),new dk(76,125.907653953),new dk(77,126.91035098),new dk(78,127.910534953),new dk(79,128.913439976),new dk(80,129.913852185),new dk(81,130.916919144),new dk(82,131.917744455),new dk(83,132.923814085),new dk(84,133.928463576),new dk(85,134.93473),new dk(86,135.93934),new dk(87,136.94579)]),mq(iq(cr,1),uC,3,0,[new dk(52,102.94012),new dk(53,103.936287),new dk(54,104.931528593),new dk(55,105.928183134),new dk(56,106.92415),new dk(57,107.92216),new dk(58,108.918136092),new dk(59,109.917533911),new dk(60,110.912534147),new dk(61,111.91239464),new dk(62,112.909377941),new dk(63,113.909095876),new dk(64,114.906598812),new dk(65,115.906797235),new dk(66,116.90483959),new dk(67,117.905531885),new dk(68,118.90394646),new dk(69,119.905074315),new dk(70,120.903818044),new dk(71,121.905175415),new dk(72,122.904215696),new dk(73,123.905937525),new dk(74,124.905247804),new dk(75,125.907248153),new dk(76,126.906914564),new dk(77,127.90916733),new dk(78,128.909150092),new dk(79,129.911546459),new dk(80,130.911946487),new dk(81,131.914413247),new dk(82,132.915236466),new dk(83,133.920551554),new dk(84,134.925167962),new dk(85,135.93066),new dk(86,136.93531),new dk(87,137.94096),new dk(88,138.94571)]),mq(iq(cr,1),uC,3,0,[new dk(54,105.937702),new dk(55,106.935036),new dk(56,107.929486838),new dk(57,108.927456483),new dk(58,109.922407164),new dk(59,110.921120589),new dk(60,111.917061617),new dk(61,112.915452551),new dk(62,113.912498025),new dk(63,114.911578627),new dk(64,115.908420253),new dk(65,116.90863418),new dk(66,117.905825187),new dk(67,118.90640811),new dk(68,119.904019891),new dk(69,120.904929815),new dk(70,121.903047064),new dk(71,122.904272951),new dk(72,123.902819466),new dk(73,124.904424718),new dk(74,125.903305543),new dk(75,126.90521729),new dk(76,127.904461383),new dk(77,128.906595593),new dk(78,129.906222753),new dk(79,130.90852188),new dk(80,131.908523782),new dk(81,132.910939068),new dk(82,133.911540546),new dk(83,134.916450782),new dk(84,135.920103155),new dk(85,136.925324769),new dk(86,137.92922),new dk(87,138.93473),new dk(88,139.9387),new dk(89,140.94439),new dk(90,141.9485)]),mq(iq(cr,1),uC,3,0,[new dk(55,107.943291),new dk(56,108.938191658),new dk(57,109.934634181),new dk(58,110.930276),new dk(59,111.92797),new dk(60,112.923644245),new dk(61,113.92185),new dk(62,114.918272),new dk(63,115.916735014),new dk(64,116.913647692),new dk(65,117.91337523),new dk(66,118.910180837),new dk(67,119.910047843),new dk(68,120.907366063),new dk(69,121.907592451),new dk(70,122.905597944),new dk(71,123.906211423),new dk(72,124.90462415),new dk(73,125.905619387),new dk(74,126.90446842),new dk(75,127.905805254),new dk(76,128.904987487),new dk(77,129.906674018),new dk(78,130.906124168),new dk(79,131.907994525),new dk(80,132.907806465),new dk(81,133.909876552),new dk(82,134.91005031),new dk(83,135.914655105),new dk(84,136.917872653),new dk(85,137.922383666),new dk(86,138.926093402),new dk(87,139.93121),new dk(88,140.93483),new dk(89,141.94018),new dk(90,142.94407),new dk(91,143.94961)]),mq(iq(cr,1),uC,3,0,[new dk(56,109.944476),new dk(57,110.941632),new dk(58,111.93566535),new dk(59,112.933382836),new dk(60,113.928145),new dk(61,114.926979032),new dk(62,115.921394197),new dk(63,116.920564355),new dk(64,117.91657092),new dk(65,118.915554295),new dk(66,119.91215199),new dk(67,120.911386497),new dk(68,121.908548396),new dk(69,122.908470748),new dk(70,123.905895774),new dk(71,124.906398236),new dk(72,125.904268868),new dk(73,126.905179581),new dk(74,127.903530436),new dk(75,128.904779458),new dk(76,129.903507903),new dk(77,130.90508192),new dk(78,131.904154457),new dk(79,132.90590566),new dk(80,133.905394504),new dk(81,134.907207499),new dk(82,135.907219526),new dk(83,136.911562939),new dk(84,137.913988549),new dk(85,138.918786859),new dk(86,139.921635665),new dk(87,140.926646282),new dk(88,141.929702981),new dk(89,142.93489),new dk(90,143.93823),new dk(91,144.94367),new dk(92,145.9473),new dk(93,146.95301)]),mq(iq(cr,1),uC,3,0,[new dk(57,111.950331),new dk(58,112.944535512),new dk(59,113.940841319),new dk(60,114.935939),new dk(61,115.932914152),new dk(62,116.928639484),new dk(63,117.926554883),new dk(64,118.922370879),new dk(65,119.920678219),new dk(66,120.917183637),new dk(67,121.916121946),new dk(68,122.912990168),new dk(69,123.912245731),new dk(70,124.909724871),new dk(71,125.909447953),new dk(72,126.9074176),new dk(73,127.907747919),new dk(74,128.906063369),new dk(75,129.906706163),new dk(76,130.905460232),new dk(77,131.906429799),new dk(78,132.90544687),new dk(79,133.906713419),new dk(80,134.905971903),new dk(81,135.907305741),new dk(82,136.907083505),new dk(83,137.911010537),new dk(84,138.913357921),new dk(85,139.917277075),new dk(86,140.920043984),new dk(87,141.924292317),new dk(88,142.927330292),new dk(89,143.932027373),new dk(90,144.935388226),new dk(91,145.940162028),new dk(92,146.943864435),new dk(93,147.948899539),new dk(94,148.95272),new dk(95,149.95797),new dk(96,150.962)]),mq(iq(cr,1),uC,3,0,[new dk(58,113.950941),new dk(59,114.94771),new dk(60,115.94168),new dk(61,116.937700229),new dk(62,117.93344),new dk(63,118.931051927),new dk(64,119.926045941),new dk(65,120.924485908),new dk(66,121.92026),new dk(67,122.91885),new dk(68,123.915088437),new dk(69,124.914620234),new dk(70,125.911244146),new dk(71,126.911121328),new dk(72,127.90830887),new dk(73,128.908673749),new dk(74,129.906310478),new dk(75,130.906930798),new dk(76,131.905056152),new dk(77,132.906002368),new dk(78,133.904503347),new dk(79,134.905682749),new dk(80,135.904570109),new dk(81,136.905821414),new dk(82,137.905241273),new dk(83,138.908835384),new dk(84,139.910599485),new dk(85,140.914406439),new dk(86,141.916448175),new dk(87,142.920617184),new dk(88,143.922940468),new dk(89,144.926923807),new dk(90,145.930106645),new dk(91,146.933992519),new dk(92,147.937682377),new dk(93,148.94246),new dk(94,149.94562),new dk(95,150.9507),new dk(96,151.95416),new dk(97,152.95961)]),mq(iq(cr,1),uC,3,0,[new dk(60,116.95001),new dk(61,117.94657),new dk(62,118.94099),new dk(63,119.93807),new dk(64,120.93301),new dk(65,121.93071),new dk(66,122.92624),new dk(67,123.92453),new dk(68,124.92067),new dk(69,125.91937),new dk(70,126.91616),new dk(71,127.91544794),new dk(72,128.912667334),new dk(73,129.91232),new dk(74,130.910108489),new dk(75,131.910110399),new dk(76,132.908396372),new dk(77,133.908489607),new dk(78,134.906971003),new dk(79,135.907651181),new dk(80,136.906465656),new dk(81,137.907106826),new dk(82,138.90634816),new dk(83,139.909472552),new dk(84,140.910957016),new dk(85,141.914074489),new dk(86,142.916058646),new dk(87,143.919591666),new dk(88,144.92163837),new dk(89,145.925700146),new dk(90,146.927819639),new dk(91,147.932191197),new dk(92,148.93437),new dk(93,149.93857),new dk(94,150.94156),new dk(95,151.94611),new dk(96,152.94945),new dk(97,153.9544),new dk(98,154.95813)]),mq(iq(cr,1),uC,3,0,[new dk(61,118.95276),new dk(62,119.94664),new dk(63,120.94367),new dk(64,121.93801),new dk(65,122.93551),new dk(66,123.93052),new dk(67,124.92854),new dk(68,125.9241),new dk(69,126.92275),new dk(70,127.91887),new dk(71,128.918679183),new dk(72,129.914339361),new dk(73,130.914424137),new dk(74,131.91149),new dk(75,132.91155),new dk(76,133.909026379),new dk(77,134.909145555),new dk(78,135.907143574),new dk(79,136.907777634),new dk(80,137.905985574),new dk(81,138.906646605),new dk(82,139.905434035),new dk(83,140.908271103),new dk(84,141.909239733),new dk(85,142.912381158),new dk(86,143.913642686),new dk(87,144.917227871),new dk(88,145.918689722),new dk(89,146.922510962),new dk(90,147.924394738),new dk(91,148.928289207),new dk(92,149.930226399),new dk(93,150.93404),new dk(94,151.93638),new dk(95,152.94058),new dk(96,153.94332),new dk(97,154.94804),new dk(98,155.95126),new dk(99,156.95634)]),mq(iq(cr,1),uC,3,0,[new dk(62,120.955364),new dk(63,121.95165),new dk(64,122.94596),new dk(65,123.94296),new dk(66,124.93783),new dk(67,125.93531),new dk(68,126.93083),new dk(69,127.9288),new dk(70,128.92486),new dk(71,129.92338),new dk(72,130.920060245),new dk(73,131.91912),new dk(74,132.9162),new dk(75,133.915672),new dk(76,134.91313914),new dk(77,135.912646935),new dk(78,136.910678351),new dk(79,137.910748891),new dk(80,138.908932181),new dk(81,139.909071204),new dk(82,140.907647726),new dk(83,141.910039865),new dk(84,142.910812233),new dk(85,143.913300595),new dk(86,144.914506897),new dk(87,145.917588016),new dk(88,146.918979001),new dk(89,147.922183237),new dk(90,148.923791056),new dk(91,149.926995031),new dk(92,150.928227869),new dk(93,151.9316),new dk(94,152.93365),new dk(95,153.93739),new dk(96,154.93999),new dk(97,155.94412),new dk(98,156.94717),new dk(99,157.95178),new dk(100,158.95523)]),mq(iq(cr,1),uC,3,0,[new dk(66,125.94307),new dk(67,126.9405),new dk(68,127.93539),new dk(69,128.932385),new dk(70,129.92878),new dk(71,130.927102697),new dk(72,131.92312),new dk(73,132.92221),new dk(74,133.918645),new dk(75,134.91824),new dk(76,135.915020542),new dk(77,136.91463973),new dk(78,137.91291745),new dk(79,138.91192415),new dk(80,139.909309824),new dk(81,140.9096048),new dk(82,141.907718643),new dk(83,142.909809626),new dk(84,143.910082629),new dk(85,144.912568847),new dk(86,145.913112139),new dk(87,146.916095794),new dk(88,147.916888516),new dk(89,148.92014419),new dk(90,149.920886563),new dk(91,150.923824739),new dk(92,151.924682428),new dk(93,152.927694534),new dk(94,153.929483295),new dk(95,154.932629551),new dk(96,155.9352),new dk(97,156.93927),new dk(98,157.94187),new dk(99,158.94639),new dk(100,159.94939),new dk(101,160.95433)]),mq(iq(cr,1),uC,3,0,[new dk(67,127.94826),new dk(68,128.94316),new dk(69,129.94045),new dk(70,130.9358),new dk(71,131.93375),new dk(72,132.92972),new dk(73,133.92849),new dk(74,134.924617),new dk(75,135.923447865),new dk(76,136.920713),new dk(77,137.920432261),new dk(78,138.916759814),new dk(79,139.915801649),new dk(80,140.913606636),new dk(81,141.912950738),new dk(82,142.910927571),new dk(83,143.912585768),new dk(84,144.912743879),new dk(85,145.914692165),new dk(86,146.915133898),new dk(87,147.917467786),new dk(88,148.918329195),new dk(89,149.920979477),new dk(90,150.921202693),new dk(91,151.923490557),new dk(92,152.924113189),new dk(93,153.926547019),new dk(94,154.928097047),new dk(95,155.931060357),new dk(96,156.9332),new dk(97,157.93669),new dk(98,158.93913),new dk(99,159.94299),new dk(100,160.94586),new dk(101,161.95029),new dk(102,162.95352)]),mq(iq(cr,1),uC,3,0,[new dk(68,129.94863),new dk(69,130.94589),new dk(70,131.94082),new dk(71,132.93873),new dk(72,133.93402),new dk(73,134.93235),new dk(74,135.9283),new dk(75,136.927046709),new dk(76,137.92354),new dk(77,138.922302),new dk(78,139.918991),new dk(79,140.918468512),new dk(80,141.915193274),new dk(81,142.914623555),new dk(82,143.91199473),new dk(83,144.913405611),new dk(84,145.91303676),new dk(85,146.914893275),new dk(86,147.914817914),new dk(87,148.917179521),new dk(88,149.917271454),new dk(89,150.919928351),new dk(90,151.919728244),new dk(91,152.922093907),new dk(92,153.922205303),new dk(93,154.92463594),new dk(94,155.925526236),new dk(95,156.928354506),new dk(96,157.929987938),new dk(97,158.9332),new dk(98,159.93514),new dk(99,160.93883),new dk(100,161.94122),new dk(101,162.94536),new dk(102,163.94828),new dk(103,164.95298)]),mq(iq(cr,1),uC,3,0,[new dk(69,131.95416),new dk(70,132.9489),new dk(71,133.94632),new dk(72,134.94172),new dk(73,135.9395),new dk(74,136.93521),new dk(75,137.93345),new dk(76,138.92882915),new dk(77,139.928083921),new dk(78,140.924885867),new dk(79,141.923400033),new dk(80,142.920286634),new dk(81,143.918774116),new dk(82,144.916261285),new dk(83,145.917199714),new dk(84,146.916741206),new dk(85,147.918153775),new dk(86,148.917925922),new dk(87,149.919698294),new dk(88,150.919846022),new dk(89,151.921740399),new dk(90,152.921226219),new dk(91,153.922975386),new dk(92,154.922889429),new dk(93,155.924750855),new dk(94,156.925419435),new dk(95,157.927841923),new dk(96,158.9290845),new dk(97,159.931460406),new dk(98,160.93368),new dk(99,161.93704),new dk(100,162.93921),new dk(101,163.94299),new dk(102,164.94572),new dk(103,165.94997),new dk(104,166.95305)]),mq(iq(cr,1),uC,3,0,[new dk(72,135.94707),new dk(73,136.94465),new dk(74,137.93997),new dk(75,138.93808),new dk(76,139.933236934),new dk(77,140.93221),new dk(78,141.927908919),new dk(79,142.926738636),new dk(80,143.923390357),new dk(81,144.921687498),new dk(82,145.918305344),new dk(83,146.919089446),new dk(84,147.918109771),new dk(85,148.919336427),new dk(86,149.918655455),new dk(87,150.920344273),new dk(88,151.919787882),new dk(89,152.921746283),new dk(90,153.920862271),new dk(91,154.922618801),new dk(92,155.922119552),new dk(93,156.923956686),new dk(94,157.924100533),new dk(95,158.926385075),new dk(96,159.927050616),new dk(97,160.929665688),new dk(98,161.930981211),new dk(99,162.93399),new dk(100,163.93586),new dk(101,164.93938),new dk(102,165.9416),new dk(103,166.94557),new dk(104,167.94836),new dk(105,168.95287)]),mq(iq(cr,1),uC,3,0,[new dk(73,137.95287),new dk(74,138.94803),new dk(75,139.945367985),new dk(76,140.94116),new dk(77,141.939073781),new dk(78,142.93475),new dk(79,143.93253),new dk(80,144.92888),new dk(81,145.927180629),new dk(82,146.924037176),new dk(83,147.924298636),new dk(84,148.92324163),new dk(85,149.923654158),new dk(86,150.923098169),new dk(87,151.924071324),new dk(88,152.923430858),new dk(89,153.924686236),new dk(90,154.923500411),new dk(91,155.924743749),new dk(92,156.924021155),new dk(93,157.92541026),new dk(94,158.925343135),new dk(95,159.927164021),new dk(96,160.927566289),new dk(97,161.929484803),new dk(98,162.930643942),new dk(99,163.933347253),new dk(100,164.93488),new dk(101,165.93805),new dk(102,166.94005),new dk(103,167.94364),new dk(104,168.94622),new dk(105,169.95025),new dk(106,170.9533)]),mq(iq(cr,1),uC,3,0,[new dk(74,139.95379),new dk(75,140.95119),new dk(76,141.946695946),new dk(77,142.94383),new dk(78,143.93907),new dk(79,144.936717),new dk(80,145.932720118),new dk(81,146.930878496),new dk(82,147.927177882),new dk(83,148.927333981),new dk(84,149.925579728),new dk(85,150.92617963),new dk(86,151.924713874),new dk(87,152.925760865),new dk(88,153.924422046),new dk(89,154.92574895),new dk(90,155.924278273),new dk(91,156.925461256),new dk(92,157.924404637),new dk(93,158.92573566),new dk(94,159.925193718),new dk(95,160.926929595),new dk(96,161.926794731),new dk(97,162.928727532),new dk(98,163.929171165),new dk(99,164.931699828),new dk(100,165.932803241),new dk(101,166.935649025),new dk(102,167.93723),new dk(103,168.940303648),new dk(104,169.94267),new dk(105,170.94648),new dk(106,171.94911),new dk(107,172.95344)]),mq(iq(cr,1),uC,3,0,[new dk(75,141.95986),new dk(76,142.95469),new dk(77,143.95164),new dk(78,144.94688),new dk(79,145.9441),new dk(80,146.93984),new dk(81,147.937269),new dk(82,148.933789944),new dk(83,149.932760914),new dk(84,150.931680791),new dk(85,151.931740598),new dk(86,152.930194506),new dk(87,153.930596268),new dk(88,154.929079084),new dk(89,155.929001869),new dk(90,156.928188059),new dk(91,157.92894573),new dk(92,158.927708537),new dk(93,159.928725679),new dk(94,160.927851662),new dk(95,161.92909242),new dk(96,162.928730286),new dk(97,163.930230577),new dk(98,164.930319169),new dk(99,165.932281267),new dk(100,166.933126195),new dk(101,167.935496424),new dk(102,168.936868306),new dk(103,169.939614951),new dk(104,170.941461227),new dk(105,171.94482),new dk(106,172.94729),new dk(107,173.95115),new dk(108,174.95405)]),mq(iq(cr,1),uC,3,0,[new dk(76,143.96059),new dk(77,144.95746),new dk(78,145.95212),new dk(79,146.94931),new dk(80,147.94444),new dk(81,148.942780527),new dk(82,149.937171034),new dk(83,150.93746),new dk(84,151.935078452),new dk(85,152.935093125),new dk(86,153.932777294),new dk(87,154.933204273),new dk(88,155.931015001),new dk(89,156.931945517),new dk(90,157.929912),new dk(91,158.930680718),new dk(92,159.929078924),new dk(93,160.930001348),new dk(94,161.928774923),new dk(95,162.930029273),new dk(96,163.929196996),new dk(97,164.9307228),new dk(98,165.93028997),new dk(99,166.932045448),new dk(100,167.932367781),new dk(101,168.934588082),new dk(102,169.935460334),new dk(103,170.938025885),new dk(104,171.939352149),new dk(105,172.9424),new dk(106,173.94434),new dk(107,174.94793),new dk(108,175.95029),new dk(109,176.95437)]),mq(iq(cr,1),uC,3,0,[new dk(77,145.966495),new dk(78,146.961081),new dk(79,147.95755),new dk(80,148.95265),new dk(81,149.94967),new dk(82,150.944842),new dk(83,151.9443),new dk(84,152.942027631),new dk(85,153.940832325),new dk(86,154.939191562),new dk(87,155.939006895),new dk(88,156.936756069),new dk(89,157.936996),new dk(90,158.934808966),new dk(91,159.935090772),new dk(92,160.933398042),new dk(93,161.933970147),new dk(94,162.932647648),new dk(95,163.933450972),new dk(96,164.932432463),new dk(97,165.933553133),new dk(98,166.932848844),new dk(99,167.934170375),new dk(100,168.934211117),new dk(101,169.935797877),new dk(102,170.936425817),new dk(103,171.938396118),new dk(104,172.939600336),new dk(105,173.942164618),new dk(106,174.943832897),new dk(107,175.946991412),new dk(108,176.94904),new dk(109,177.95264),new dk(110,178.95534)]),mq(iq(cr,1),uC,3,0,[new dk(78,147.96676),new dk(79,148.96348),new dk(80,149.95799),new dk(81,150.954657965),new dk(82,151.950167),new dk(83,152.94921),new dk(84,153.945651145),new dk(85,154.945792),new dk(86,155.942847109),new dk(87,156.94265865),new dk(88,157.939857897),new dk(89,158.940153735),new dk(90,159.93756),new dk(91,160.937357719),new dk(92,161.93575),new dk(93,162.936265492),new dk(94,163.93452),new dk(95,164.935397592),new dk(96,165.933879623),new dk(97,166.934946862),new dk(98,167.933894465),new dk(99,168.93518712),new dk(100,169.934758652),new dk(101,170.936322297),new dk(102,171.936377696),new dk(103,172.938206756),new dk(104,173.938858101),new dk(105,174.941272494),new dk(106,175.942568409),new dk(107,176.945257126),new dk(108,177.946643396),new dk(109,178.95017),new dk(110,179.95233),new dk(111,180.95615)]),mq(iq(cr,1),uC,3,0,[new dk(79,149.972668),new dk(80,150.967147),new dk(81,151.96361),new dk(82,152.95869),new dk(83,153.9571),new dk(84,154.953641324),new dk(85,155.952907),new dk(86,156.950101536),new dk(87,157.948577981),new dk(88,158.946615113),new dk(89,159.945383),new dk(90,160.943047504),new dk(91,161.943222),new dk(92,162.941203796),new dk(93,163.941215),new dk(94,164.939605886),new dk(95,165.939762646),new dk(96,166.938307056),new dk(97,167.938698576),new dk(98,168.937648757),new dk(99,169.93847219),new dk(100,170.937909903),new dk(101,171.939082239),new dk(102,172.938926901),new dk(103,173.940333522),new dk(104,174.940767904),new dk(105,175.942682399),new dk(106,176.943754987),new dk(107,177.945951366),new dk(108,178.947324216),new dk(109,179.949879968),new dk(110,180.95197),new dk(111,181.95521),new dk(112,182.95757),new dk(113,183.96117)]),mq(iq(cr,1),uC,3,0,[new dk(82,153.96425),new dk(83,154.96276),new dk(84,155.959247),new dk(85,156.958127),new dk(86,157.95405528),new dk(87,158.954003),new dk(88,159.950713588),new dk(89,160.950330852),new dk(90,161.947202977),new dk(91,162.947057),new dk(92,163.944422),new dk(93,164.94454),new dk(94,165.94225),new dk(95,166.9426),new dk(96,167.94063),new dk(97,168.941158567),new dk(98,169.93965),new dk(99,170.94049),new dk(100,171.93945798),new dk(101,172.94065),new dk(102,173.940040159),new dk(103,174.941502991),new dk(104,175.941401828),new dk(105,176.943220013),new dk(106,177.943697732),new dk(107,178.945815073),new dk(108,179.94654876),new dk(109,180.949099124),new dk(110,181.950552893),new dk(111,182.953531012),new dk(112,183.95544788),new dk(113,184.95878),new dk(114,185.96092)]),mq(iq(cr,1),uC,3,0,[new dk(83,155.971689),new dk(84,156.968145),new dk(85,157.966368),new dk(86,158.96232309),new dk(87,159.961358),new dk(88,160.958372992),new dk(89,161.956556553),new dk(90,162.95431665),new dk(91,163.95357),new dk(92,164.950817),new dk(93,165.95047),new dk(94,166.948639),new dk(95,167.947787),new dk(96,168.94592),new dk(97,169.94609),new dk(98,170.94446),new dk(99,171.944739818),new dk(100,172.94459),new dk(101,173.944167937),new dk(102,174.94365),new dk(103,175.944740551),new dk(104,176.944471766),new dk(105,177.945750349),new dk(106,178.945934113),new dk(107,179.947465655),new dk(108,180.947996346),new dk(109,181.950152414),new dk(110,182.951373188),new dk(111,183.954009331),new dk(112,184.955559086),new dk(113,185.9585501),new dk(114,186.96041),new dk(115,187.96371)]),mq(iq(cr,1),uC,3,0,[new dk(84,157.973939),new dk(85,158.97228),new dk(86,159.968369),new dk(87,160.967089),new dk(88,161.962750303),new dk(89,162.962532),new dk(90,163.95898381),new dk(91,164.958335962),new dk(92,165.955019896),new dk(93,166.954672),new dk(94,167.951863),new dk(95,168.951759),new dk(96,169.948473988),new dk(97,170.94946),new dk(98,171.948228837),new dk(99,172.948884),new dk(100,173.94616),new dk(101,174.94677),new dk(102,175.94559),new dk(103,176.94662),new dk(104,177.945848364),new dk(105,178.947071733),new dk(106,179.946705734),new dk(107,180.948198054),new dk(108,181.948205519),new dk(109,182.950224458),new dk(110,183.950932553),new dk(111,184.953420586),new dk(112,185.954362204),new dk(113,186.957158365),new dk(114,187.958486954),new dk(115,188.96191222),new dk(116,189.963179541)]),mq(iq(cr,1),uC,3,0,[new dk(85,159.981485),new dk(86,160.977661),new dk(87,161.975707),new dk(88,162.971375872),new dk(89,163.970319),new dk(90,164.967050268),new dk(91,165.965211372),new dk(92,166.962564),new dk(93,167.961609),new dk(94,168.95883),new dk(95,169.958163),new dk(96,170.955547),new dk(97,171.955285),new dk(98,172.953062),new dk(99,173.952114),new dk(100,174.951393),new dk(101,175.95157),new dk(102,176.95027),new dk(103,177.950851081),new dk(104,178.949981038),new dk(105,179.95078768),new dk(106,180.950064596),new dk(107,181.951211444),new dk(108,182.950821349),new dk(109,183.952524289),new dk(110,184.952955747),new dk(111,185.954986529),new dk(112,186.955750787),new dk(113,187.958112287),new dk(114,188.959228359),new dk(115,189.961816139),new dk(116,190.963123592),new dk(117,191.96596)]),mq(iq(cr,1),uC,3,0,[new dk(86,161.983819),new dk(87,162.982048),new dk(88,163.977927),new dk(89,164.976475),new dk(90,165.971934911),new dk(91,166.971554),new dk(92,167.967832911),new dk(93,168.967076205),new dk(94,169.963569716),new dk(95,170.96304),new dk(96,171.960078),new dk(97,172.959791),new dk(98,173.956307704),new dk(99,174.95708),new dk(100,175.953757941),new dk(101,176.955045),new dk(102,177.953348225),new dk(103,178.953951),new dk(104,179.952308241),new dk(105,180.953274494),new dk(106,181.952186222),new dk(107,182.95311),new dk(108,183.952490808),new dk(109,184.954043023),new dk(110,185.953838355),new dk(111,186.955747928),new dk(112,187.955835993),new dk(113,188.958144866),new dk(114,189.95844521),new dk(115,190.960927951),new dk(116,191.961479047),new dk(117,192.964148083),new dk(118,193.965179314),new dk(119,194.968123889),new dk(120,195.96962255)]),mq(iq(cr,1),uC,3,0,[new dk(88,164.98758),new dk(89,165.985506),new dk(90,166.980951577),new dk(91,167.979966),new dk(92,168.976390868),new dk(93,169.974441697),new dk(94,170.971779),new dk(95,171.970643),new dk(96,172.967707),new dk(97,173.966804),new dk(98,174.964279),new dk(99,175.963511),new dk(100,176.96117),new dk(101,177.960084944),new dk(102,178.95915),new dk(103,179.958555615),new dk(104,180.957642156),new dk(105,181.958127689),new dk(106,182.956814),new dk(107,183.957388318),new dk(108,184.95659),new dk(109,185.957951104),new dk(110,186.95736083),new dk(111,187.958851962),new dk(112,188.958716473),new dk(113,189.960592299),new dk(114,190.960591191),new dk(115,191.962602198),new dk(116,192.9629237),new dk(117,193.96507561),new dk(118,194.9659768),new dk(119,195.968379906),new dk(120,196.969636496),new dk(121,197.97228),new dk(122,198.973787159)]),mq(iq(cr,1),uC,3,0,[new dk(90,167.988035),new dk(91,168.986421),new dk(92,169.981734918),new dk(93,170.981251),new dk(94,171.977376138),new dk(95,172.976499642),new dk(96,173.972811276),new dk(97,174.972276),new dk(98,175.969),new dk(99,176.968453),new dk(100,177.964894223),new dk(101,178.965475),new dk(102,179.962023729),new dk(103,180.963177),new dk(104,181.961267637),new dk(105,182.961729),new dk(106,183.959851685),new dk(107,184.960753782),new dk(108,185.959432346),new dk(109,186.960697),new dk(110,187.959395697),new dk(111,188.9608319),new dk(112,189.959930073),new dk(113,190.961684653),new dk(114,191.961035158),new dk(115,192.962984504),new dk(116,193.962663581),new dk(117,194.964774449),new dk(118,195.964934884),new dk(119,196.967323401),new dk(120,197.967876009),new dk(121,198.970576213),new dk(122,199.971423885),new dk(123,200.974496467),new dk(124,201.97574)]),mq(iq(cr,1),uC,3,0,[new dk(92,170.991183),new dk(93,171.990109),new dk(94,172.986398138),new dk(95,173.984325861),new dk(96,174.981552),new dk(97,175.980269),new dk(98,176.977215),new dk(99,177.975975),new dk(100,178.973412),new dk(101,179.972396),new dk(102,180.969948),new dk(103,181.968621416),new dk(104,182.96762),new dk(105,183.966776046),new dk(106,184.965806956),new dk(107,185.965997671),new dk(108,186.964562),new dk(109,187.965321662),new dk(110,188.9642243),new dk(111,189.964698757),new dk(112,190.963649239),new dk(113,191.964810107),new dk(114,192.964131745),new dk(115,193.96533889),new dk(116,194.965017928),new dk(117,195.966551315),new dk(118,196.966551609),new dk(119,197.968225244),new dk(120,198.968748016),new dk(121,199.970717886),new dk(122,200.971640839),new dk(123,201.973788431),new dk(124,202.975137256),new dk(125,203.977705),new dk(126,204.97961)]),mq(iq(cr,1),uC,3,0,[new dk(95,174.991411),new dk(96,175.987413248),new dk(97,176.986336874),new dk(98,177.982476325),new dk(99,178.981783),new dk(100,179.978322),new dk(101,180.977806),new dk(102,181.97393546),new dk(103,182.974561),new dk(104,183.970705219),new dk(105,184.971983),new dk(106,185.969460021),new dk(107,186.969785),new dk(108,187.967511693),new dk(109,188.968733187),new dk(110,189.966958568),new dk(111,190.96706311),new dk(112,191.965921572),new dk(113,192.966644169),new dk(114,193.965381832),new dk(115,194.966638981),new dk(116,195.965814846),new dk(117,196.967195333),new dk(118,197.96675183),new dk(119,198.968262489),new dk(120,199.968308726),new dk(121,200.970285275),new dk(122,201.970625604),new dk(123,202.972857096),new dk(124,203.97347564),new dk(125,204.976056104),new dk(126,205.977498672),new dk(127,206.982577025),new dk(128,207.98594)]),mq(iq(cr,1),uC,3,0,[new dk(96,176.996881),new dk(97,177.994637),new dk(98,178.991466),new dk(99,179.990194),new dk(100,180.986904),new dk(101,181.98561),new dk(102,182.982697),new dk(103,183.98176),new dk(104,184.9791),new dk(105,185.977549881),new dk(106,186.97617),new dk(107,187.97592),new dk(108,188.974290451),new dk(109,189.974473379),new dk(110,190.972261952),new dk(111,191.972770785),new dk(112,192.970548),new dk(113,193.971053),new dk(114,194.96965),new dk(115,195.970515),new dk(116,196.9695362),new dk(117,197.970466294),new dk(118,198.969813837),new dk(119,199.970945394),new dk(120,200.97080377),new dk(121,201.972090569),new dk(122,202.972329088),new dk(123,203.973848646),new dk(124,204.97441227),new dk(125,205.976095321),new dk(126,206.977407908),new dk(127,207.982004653),new dk(128,208.985349125),new dk(129,209.990065574)]),mq(iq(cr,1),uC,3,0,[new dk(99,180.996714),new dk(100,181.992676101),new dk(101,182.99193),new dk(102,183.988198),new dk(103,184.98758),new dk(104,185.983485388),new dk(105,186.98403),new dk(106,187.979869108),new dk(107,188.98088),new dk(108,189.978180008),new dk(109,190.9782),new dk(110,191.975719811),new dk(111,192.97608),new dk(112,193.974648056),new dk(113,194.975920279),new dk(114,195.97271),new dk(115,196.97338),new dk(116,197.97198),new dk(117,198.972909384),new dk(118,199.97181556),new dk(119,200.972846589),new dk(120,201.972143786),new dk(121,202.973375491),new dk(122,203.973028761),new dk(123,204.974467112),new dk(124,205.974449002),new dk(125,206.975880605),new dk(126,207.97663585),new dk(127,208.981074801),new dk(128,209.984173129),new dk(129,210.988731474),new dk(130,211.991887495),new dk(131,212.9965),new dk(132,213.999798147)]),mq(iq(cr,1),uC,3,0,[new dk(102,184.997708),new dk(103,185.99648),new dk(104,186.993458),new dk(105,187.992173),new dk(106,188.989505),new dk(107,189.987520007),new dk(108,190.986053),new dk(109,191.985368),new dk(110,192.983662229),new dk(111,193.983430186),new dk(112,194.98112697),new dk(113,195.981236107),new dk(114,196.978934287),new dk(115,197.979024396),new dk(116,198.977576953),new dk(117,199.978141983),new dk(118,200.976970721),new dk(119,201.977674504),new dk(120,202.976868118),new dk(121,203.977805161),new dk(122,204.977374688),new dk(123,205.978482854),new dk(124,206.978455217),new dk(125,207.979726699),new dk(126,208.980383241),new dk(127,209.984104944),new dk(128,210.987258139),new dk(129,211.991271542),new dk(130,212.994374836),new dk(131,213.998698664),new dk(132,215.001832349),new dk(133,216.006199)]),mq(iq(cr,1),uC,3,0,[new dk(106,189.994293888),new dk(107,190.994653),new dk(108,191.99033039),new dk(109,192.991102),new dk(110,193.988284107),new dk(111,194.988045),new dk(112,195.985469432),new dk(113,196.985567),new dk(114,197.984024384),new dk(115,198.985044507),new dk(116,199.981735),new dk(117,200.982209),new dk(118,201.980704),new dk(119,202.981412863),new dk(120,203.980307113),new dk(121,204.981165396),new dk(122,205.980465241),new dk(123,206.981578228),new dk(124,207.981231059),new dk(125,208.982415788),new dk(126,209.982857396),new dk(127,210.986636869),new dk(128,211.988851755),new dk(129,212.992842522),new dk(130,213.995185949),new dk(131,214.999414609),new dk(132,216.001905198),new dk(133,217.006253),new dk(134,218.008965773)]),mq(iq(cr,1),uC,3,0,[new dk(108,193.000188),new dk(109,193.997973),new dk(110,194.996554),new dk(111,195.995702),new dk(112,196.993891293),new dk(113,197.99343368),new dk(114,198.991008569),new dk(115,199.990920883),new dk(116,200.988486908),new dk(117,201.988448629),new dk(118,202.986847216),new dk(119,203.987261559),new dk(120,204.986036352),new dk(121,205.986599242),new dk(122,206.985775861),new dk(123,207.986582508),new dk(124,208.986158678),new dk(125,209.987131308),new dk(126,210.987480806),new dk(127,211.990734657),new dk(128,212.99292115),new dk(129,213.996356412),new dk(130,214.998641245),new dk(131,216.002408839),new dk(132,217.004709619),new dk(133,218.008681458),new dk(134,219.011296478),new dk(135,220.015301),new dk(136,221.01814),new dk(137,222.02233),new dk(138,223.02534)]),mq(iq(cr,1),uC,3,0,[new dk(110,196.001117268),new dk(111,197.001661),new dk(112,197.998779978),new dk(113,198.998309),new dk(114,199.995634148),new dk(115,200.995535),new dk(116,201.993899382),new dk(117,202.994765192),new dk(118,203.991365),new dk(119,204.991668),new dk(120,205.99016),new dk(121,206.990726826),new dk(122,207.989631237),new dk(123,208.990376634),new dk(124,209.989679862),new dk(125,210.99058541),new dk(126,211.990688899),new dk(127,212.993868354),new dk(128,213.995346275),new dk(129,214.998729195),new dk(130,216.000258153),new dk(131,217.003914555),new dk(132,218.005586315),new dk(133,219.009474831),new dk(134,220.011384149),new dk(135,221.015455),new dk(136,222.017570472),new dk(137,223.02179),new dk(138,224.02409),new dk(139,225.02844),new dk(140,226.03089),new dk(141,227.035407),new dk(142,228.038084)]),mq(iq(cr,1),uC,3,0,[new dk(113,200.006499),new dk(114,201.00458692),new dk(115,202.00396885),new dk(116,203.001423829),new dk(117,204.001221209),new dk(118,204.998663961),new dk(119,205.998486886),new dk(120,206.996859385),new dk(121,207.997133849),new dk(122,208.995915421),new dk(123,209.996398327),new dk(124,210.995529332),new dk(125,211.996194988),new dk(126,212.996174845),new dk(127,213.99895474),new dk(128,215.000326029),new dk(129,216.003187873),new dk(130,217.004616452),new dk(131,218.007563326),new dk(132,219.009240843),new dk(133,220.012312978),new dk(134,221.014245654),new dk(135,222.017543957),new dk(136,223.019730712),new dk(137,224.023235513),new dk(138,225.025606914),new dk(139,226.029343423),new dk(140,227.031833167),new dk(141,228.034776087),new dk(142,229.038426),new dk(143,230.04251),new dk(144,231.045407),new dk(145,232.049654)]),mq(iq(cr,1),uC,3,0,[new dk(115,203.00921),new dk(116,204.006434513),new dk(117,205.006187),new dk(118,206.004463814),new dk(119,207.005176607),new dk(120,208.001776),new dk(121,209.001944),new dk(122,210.000446),new dk(123,211.000893996),new dk(124,211.999783492),new dk(125,213.000345847),new dk(126,214.000091141),new dk(127,215.002704195),new dk(128,216.003518402),new dk(129,217.00630601),new dk(130,218.007123948),new dk(131,219.010068787),new dk(132,220.011014669),new dk(133,221.013907762),new dk(134,222.01536182),new dk(135,223.01849714),new dk(136,224.020202004),new dk(137,225.023604463),new dk(138,226.025402555),new dk(139,227.029170677),new dk(140,228.031064101),new dk(141,229.034820309),new dk(142,230.037084774),new dk(143,231.04122),new dk(144,232.043693),new dk(145,233.047995),new dk(146,234.050547)]),mq(iq(cr,1),uC,3,0,[new dk(118,207.012469754),new dk(119,208.012112949),new dk(120,209.009568736),new dk(121,210.009256802),new dk(122,211.007648196),new dk(123,212.007811441),new dk(124,213.006573689),new dk(125,214.006893072),new dk(126,215.006450832),new dk(127,216.008721268),new dk(128,217.009332676),new dk(129,218.011625045),new dk(130,219.012404918),new dk(131,220.014752105),new dk(132,221.015575746),new dk(133,222.017828852),new dk(134,223.01912603),new dk(135,224.021708435),new dk(136,225.023220576),new dk(137,226.026089848),new dk(138,227.027746979),new dk(139,228.031014825),new dk(140,229.032930871),new dk(141,230.036025144),new dk(142,231.038551503),new dk(143,232.042022474),new dk(144,233.04455),new dk(145,234.04842),new dk(146,235.051102),new dk(147,236.055178)]),mq(iq(cr,1),uC,3,0,[new dk(120,210.015711883),new dk(121,211.016306912),new dk(122,212.012916),new dk(123,213.012962),new dk(124,214.011451),new dk(125,215.011726597),new dk(126,216.011050963),new dk(127,217.013066169),new dk(128,218.013267744),new dk(129,219.015521253),new dk(130,220.015733126),new dk(131,221.018171499),new dk(132,222.018454131),new dk(133,223.020795153),new dk(134,224.02145925),new dk(135,225.023941441),new dk(136,226.024890681),new dk(137,227.027698859),new dk(138,228.028731348),new dk(139,229.03175534),new dk(140,230.033126574),new dk(141,231.03629706),new dk(142,232.03805036),new dk(143,233.041576923),new dk(144,234.043595497),new dk(145,235.04750442),new dk(146,236.04971),new dk(147,237.053894),new dk(148,238.056243)]),mq(iq(cr,1),uC,3,0,[new dk(122,213.021183209),new dk(123,214.02073923),new dk(124,215.019097612),new dk(125,216.019109649),new dk(126,217.018288571),new dk(127,218.020007906),new dk(128,219.019880348),new dk(129,220.021876493),new dk(130,221.021863742),new dk(131,222.023726),new dk(132,223.023963748),new dk(133,224.025614854),new dk(134,225.026115172),new dk(135,226.02793275),new dk(136,227.028793151),new dk(137,228.031036942),new dk(138,229.032088601),new dk(139,230.034532562),new dk(140,231.035878898),new dk(141,232.03858172),new dk(142,233.040240235),new dk(143,234.043302325),new dk(144,235.045436759),new dk(145,236.048675176),new dk(146,237.05113943),new dk(147,238.054497046),new dk(148,239.05713),new dk(149,240.06098)]),mq(iq(cr,1),uC,3,0,[new dk(126,218.023487),new dk(127,219.024915423),new dk(128,220.024712),new dk(129,221.026351),new dk(130,222.02607),new dk(131,223.027722956),new dk(132,224.027590139),new dk(133,225.029384369),new dk(134,226.02933975),new dk(135,227.031140069),new dk(136,228.031366357),new dk(137,229.033496137),new dk(138,230.033927392),new dk(139,231.036289158),new dk(140,232.03714628),new dk(141,233.039628196),new dk(142,234.040945606),new dk(143,235.043923062),new dk(144,236.045561897),new dk(145,237.048723955),new dk(146,238.050782583),new dk(147,239.054287777),new dk(148,240.056585734),new dk(149,241.06033),new dk(150,242.062925)]),mq(iq(cr,1),uC,3,0,[new dk(132,225.033899689),new dk(133,226.035129),new dk(134,227.034958261),new dk(135,228.03618),new dk(136,229.036246866),new dk(137,230.037812591),new dk(138,231.038233161),new dk(139,232.040099),new dk(140,233.04073235),new dk(141,234.042888556),new dk(142,235.044055876),new dk(143,236.046559724),new dk(144,237.048167253),new dk(145,238.050940464),new dk(146,239.052931399),new dk(147,240.056168828),new dk(148,241.058246266),new dk(149,242.061635),new dk(150,243.064273),new dk(151,244.06785)]),mq(iq(cr,1),uC,3,0,[new dk(134,228.038727686),new dk(135,229.040138934),new dk(136,230.039645603),new dk(137,231.041258),new dk(138,232.041179445),new dk(139,233.04298757),new dk(140,234.043304681),new dk(141,235.0452815),new dk(142,236.046048088),new dk(143,237.048403774),new dk(144,238.0495534),new dk(145,239.052156519),new dk(146,240.05380746),new dk(147,241.056845291),new dk(148,242.058736847),new dk(149,243.061997013),new dk(150,244.06419765),new dk(151,245.067738657),new dk(152,246.070198429),new dk(153,247.07407)]),mq(iq(cr,1),uC,3,0,[new dk(136,231.04556),new dk(137,232.04659),new dk(138,233.046472),new dk(139,234.047794),new dk(140,235.048029),new dk(141,236.049569),new dk(142,237.049970748),new dk(143,238.051977839),new dk(144,239.053018481),new dk(145,240.055287826),new dk(146,241.056822944),new dk(147,242.059543039),new dk(148,243.061372686),new dk(149,244.064279429),new dk(150,245.066445398),new dk(151,246.069768438),new dk(152,247.072086),new dk(153,248.075745),new dk(154,249.07848)]),mq(iq(cr,1),uC,3,0,[new dk(137,233.0508),new dk(138,234.05024),new dk(139,235.051591),new dk(140,236.051405),new dk(141,237.052891),new dk(142,238.053016298),new dk(143,239.054951),new dk(144,240.055519046),new dk(145,241.057646736),new dk(146,242.058829326),new dk(147,243.061382249),new dk(148,244.062746349),new dk(149,245.065485586),new dk(150,246.067217551),new dk(151,247.070346811),new dk(152,248.072342247),new dk(153,249.075947062),new dk(154,250.078350687),new dk(155,251.082277873),new dk(156,252.08487)]),mq(iq(cr,1),uC,3,0,[new dk(138,235.05658),new dk(139,236.05733),new dk(140,237.057127),new dk(141,238.058266),new dk(142,239.058362),new dk(143,240.059749),new dk(144,241.060223),new dk(145,242.06205),new dk(146,243.06300157),new dk(147,244.065167882),new dk(148,245.066355386),new dk(149,246.068666836),new dk(150,247.070298533),new dk(151,248.07308),new dk(152,249.074979937),new dk(153,250.078310529),new dk(154,251.08075344),new dk(155,252.084303),new dk(156,253.08688),new dk(157,254.0906)]),mq(iq(cr,1),uC,3,0,[new dk(139,237.06207),new dk(140,238.06141),new dk(141,239.062579),new dk(142,240.062295),new dk(143,241.063716),new dk(144,242.063688713),new dk(145,243.065421),new dk(146,244.06599039),new dk(147,245.068039),new dk(148,246.068798807),new dk(149,247.070992043),new dk(150,248.07217808),new dk(151,249.074846818),new dk(152,250.076399951),new dk(153,251.079580056),new dk(154,252.081619582),new dk(155,253.085126791),new dk(156,254.087316198),new dk(157,255.091039),new dk(158,256.09344)]),mq(iq(cr,1),uC,3,0,[new dk(141,240.06892),new dk(142,241.068662),new dk(143,242.069699),new dk(144,243.069631),new dk(145,244.070969),new dk(146,245.071317),new dk(147,246.072965),new dk(148,247.07365),new dk(149,248.075458),new dk(150,249.076405),new dk(151,250.078654),new dk(152,251.079983592),new dk(153,252.082972247),new dk(154,253.084817974),new dk(155,254.088016026),new dk(156,255.090266386),new dk(157,256.093592),new dk(158,257.095979)]),mq(iq(cr,1),uC,3,0,[new dk(142,242.07343),new dk(143,243.07451),new dk(144,244.074077),new dk(145,245.075375),new dk(146,246.075281634),new dk(147,247.076819),new dk(148,248.077184411),new dk(149,249.079024),new dk(150,250.079514759),new dk(151,251.081566467),new dk(152,252.082460071),new dk(153,253.085176259),new dk(154,254.086847795),new dk(155,255.089955466),new dk(156,256.091766522),new dk(157,257.095098635),new dk(158,258.097069),new dk(159,259.100588)]),mq(iq(cr,1),uC,3,0,[new dk(144,245.081017),new dk(145,246.081933),new dk(146,247.081804),new dk(147,248.082909),new dk(148,249.083002),new dk(149,250.084488),new dk(150,251.084919),new dk(151,252.08663),new dk(152,253.08728),new dk(153,254.089725),new dk(154,255.091075196),new dk(155,256.094052757),new dk(156,257.095534643),new dk(157,258.098425321),new dk(158,259.100503),new dk(159,260.103645)]),mq(iq(cr,1),uC,3,0,[new dk(147,249.087823),new dk(148,250.087493),new dk(149,251.08896),new dk(150,252.088965909),new dk(151,253.090649),new dk(152,254.090948746),new dk(153,255.093232449),new dk(154,256.094275879),new dk(155,257.096852778),new dk(156,258.0982),new dk(157,259.101024),new dk(158,260.102636),new dk(159,261.105743),new dk(160,262.10752)]),mq(iq(cr,1),uC,3,0,[new dk(148,251.09436),new dk(149,252.09533),new dk(150,253.095258),new dk(151,254.096587),new dk(152,255.096769),new dk(153,256.098763),new dk(154,257.099606),new dk(155,258.101883),new dk(156,259.10299),new dk(157,260.105572),new dk(158,261.106941),new dk(159,262.109692),new dk(160,263.111394)]),mq(iq(cr,1),uC,3,0,[new dk(149,253.100679),new dk(150,254.100166),new dk(151,255.101492),new dk(152,256.101179573),new dk(153,257.103072),new dk(154,258.103568),new dk(155,259.105628),new dk(156,260.106434),new dk(157,261.108752),new dk(158,262.109918),new dk(159,263.11254),new dk(160,264.113978)]),mq(iq(cr,1),uC,3,0,[new dk(150,255.107398),new dk(151,256.10811),new dk(152,257.107858),new dk(153,258.109438),new dk(154,259.109721),new dk(155,260.111427),new dk(156,261.112106),new dk(157,262.114153),new dk(158,263.115078),new dk(159,264.117473),new dk(160,265.118659)]),mq(iq(cr,1),uC,3,0,[new dk(152,258.113151),new dk(153,259.114652),new dk(154,260.114435447),new dk(155,261.116199),new dk(156,262.116477),new dk(157,263.118313),new dk(158,264.118924),new dk(159,265.121066),new dk(160,266.121928)]),mq(iq(cr,1),uC,3,0,[new dk(153,260.121803),new dk(154,261.1218),new dk(155,262.123009),new dk(156,263.123146),new dk(157,264.12473),new dk(158,265.125198),new dk(159,266.127009),new dk(160,267.12774)]),mq(iq(cr,1),uC,3,0,[new dk(155,263.12871),new dk(156,264.128408258),new dk(157,265.130001),new dk(158,266.130042),new dk(159,267.131774),new dk(160,268.132156),new dk(161,269.134114)]),mq(iq(cr,1),uC,3,0,[new dk(156,265.136567),new dk(157,266.13794),new dk(158,267.137526),new dk(159,268.138816),new dk(160,269.139106),new dk(161,270.140723),new dk(162,271.141229)])])}
	var tB=2147483647,uB={5:1,4:1},vB=0.6000000238418579,wB=0.4000000059604645,xB={12:1,4:1},yB={8:1,4:1},zB=2.6179938316345215,AB=3.665191411972046,BB=6.283185307179586,CB=3.141592653589793,DB=0.5235987901687622,EB=1.5707963267948966,FB=5.759586334228516,GB={4:1,6:1},HB=4096,IB=1024,JB=234881024,KB=100663296,LB=201326592,MB=114688,NB=16384,OB=393216,PB=29360128,QB=268435456,RB=2048,SB=0.699999988079071,TB=-1.5707963267948966,UB=16320,VB=786432,WB=262144,XB=6.2831854820251465,YB=1.0471975511965976,ZB=0.5235987755982988,$B=3.1415927410125732,_B=524288,aC=65536,bC={4:1},cC={18:1,4:1,6:1},dC=-16777216,eC={9:1,4:1},fC=131072,gC=65535,hC=-65536,iC=-3.141592653589793,jC=2.0943951023931953,kC=-268435456,lC=1572864,mC=65011712,nC=3072,oC=126976,pC=67108864,qC=134217728,rC=16777216,sC=-66584577,tC=0.7853981633974483,uC={7:1,4:1,6:1},vC=3.4028234663852886E38,wC=4194303,xC=239060990,yC=0.6262000203132629,zC=-1.3825000524520874,AC=-1.4915000200271606,BC=0.33169999718666077,CC=0.3540000021457672,DC=0.38179999589920044,EC=-0.6019999980926514,FC=-0.7379999756813049,GC=3.009999990463257,HC=-0.1809999942779541,IC=-0.17000000178813934,JC=-0.2029999941587448,KC=1048575,LC={4:1,11:1},MC={4:1,10:1,11:1},NC=4194304,OC=17592186044416,PC=-9223372036854775808,QC=1.52587890625E-5,RC={45:1},SC=15525485,TC=5.9604644775390625E-8,UC={4:1,29:1,34:1,28:1};var _,ou,ot={},kt=-1;qt(1,null,{},hc);_.eQ=function ic(a){return this===a};_.gC=function kc(){return this.cZ};_.hC=function mc(){return cp(this)};_.tS=function oc(){return cw(lc(this))+'@'+Vw(nc(this),16)};_.toString=function(){return this.tS()};pq={4:1,93:1,29:1,2:1};wt();var pq;qt(73,1,{},dw);_.Eb=function ew(a){var b;b=new dw;b.e=4;a>1?(b.c=lw(this,a-1)):(b.c=this);return b};_.Fb=function kw(){bw(this);return this.b};_.Gb=function mw(){return cw(this)};_.Hb=function ow(){bw(this);return this.i};_.Ib=function qw(){return (this.e&4)!=0};_.Jb=function rw(){return (this.e&1)!=0};_.tS=function uw(){return ((this.e&2)!=0?'interface ':(this.e&1)!=0?'':'class ')+(bw(this),this.k)};_.e=0;_.g=0;var aw=1;var xs=gw(1),Er=gw(0),ls=gw(73);qt(105,1,{});_.v=0;_.w=0;_.A=0;_.B=0;_.C=0;_.H=0;_.I=0;_.K=0;_.L=0;_.M=0;_.N=0;var pc,qc,rc;var Iq=gw(105);qt(50,1,{},nd);_.a=0;_.b=0;_.c=0;var Gq=gw(50);qt(25,1,{},od);_.a=0;_.b=0;_.c=0;_.d=0;var Hq=gw(25);qt(136,1,{},wd);_.a=0;_.b=0;_.e=0;var Jq=gw(136);var Ed,Fd;qt(75,1,{},Te);_.b=false;_.q=0;_.s=0;_.B=false;_.D=0;_.G=false;_.H=false;_.K=0;_.N=0;_.Q=false;_._=false;var Uq=gw(75);qt(116,1,{},Ve);_.ab=function We(a,b){return Ue(a,b)};var Lq=gw(116);qt(68,1,{68:1},Xe);_.b=0;_.c=0;_.d=0;var Kq=gw(68);qt(117,1,{},Ze);_.ab=function $e(a,b){return Ye(a,b)};var Nq=gw(117);qt(69,1,{69:1},_e);_.a=0;_.b=0;_.c=0;var Mq=gw(69);qt(41,1,{41:1,29:1},ef);_.bb=function ff(a){return cf(this,a)};_.a=0;_.b=0;_.c=0;var Oq=gw(41);qt(115,1,{},gf);var Pq=gw(115);qt(131,1,{},yf);var Sq=gw(131);qt(134,1,{},Bf);_.ab=function Cf(a,b){return Af(a,b)};var Qq=gw(134);qt(132,1,{},Nf);_.a=0;_.b=0;_.f=0;_.g=0;_.i=0;var Rq=gw(132);qt(133,1,{},Pf);_.ab=function Qf(a,b){return Of(a,b)};var Tq=gw(133);qt(63,1,{},qg);_.b=0;_.d=0;_.g=0;var Wq=gw(63);qt(20,1,{20:1},Eg,Fg);_.f=0;_.i=0;_.j=0;_.k=false;_.n=0;_.o=0;var Vq=gw(20);qt(67,1,{},Mg,Ng);_.tS=function Og(){return 'DepictorTransformation Offset: '+this.a+','+this.b+' Scaling: '+this.c};_.a=0;_.b=0;_.c=0;var Xq=gw(67);qt(36,1,{},Pg);_.a=0;_.b=0;_.c=0;_.d=0;var Yq=gw(36);qt(35,1,{},Rg);_.a=0;_.b=0;_.c=false;_.d=0;_.f=false;_.g=0;_.i=false;_.j=0;var Zq=gw(35);qt(47,1,{47:1,4:1});_.o=24;_.p=0;_.q=0;_.K=0;_.L=false;_.M=false;_.N=0;_.O=0;_.Q=false;_.R=0;var Sg,Tg,Ug;var er=gw(47);qt(58,47,{58:1,47:1,4:1});_.cb=function Rj(a){Ui(this,a)};_.d=0;_.e=0;var $q=gw(58);qt(37,1,{},$j);_.b=false;_.c=0;_.d=0;_.e=0;var _q=gw(37);qt(13,1,{13:1},_j,ak);_.a=0;_.b=0;var ar=gw(13);qt(80,1,{},ck);var br=gw(80);qt(3,1,{3:1},dk);_.a=0;_.b=0;var cr=gw(3);var ek;qt(91,1,{});_.a=0;_.d=0;var hk,ik,jk;var dr=gw(91);qt(61,1,{},rk);var fr=gw(61);qt(76,1,{},Nk);var tk=true;var gr=gw(76);qt(96,1,{});var hr=gw(96);qt(57,1,{},fl);var ir=gw(57);qt(78,1,{},zl);_.b=0;_.g=false;_.o=0;_.u=false;_.v=0;var lr=gw(78);qt(102,1,{},Al);_.a=0;_.b=0;_.c=0;_.d=0;var jr=gw(102);qt(77,1,{},Jl);var Bl,Cl;var kr=gw(77);qt(74,105,{},bm);_.tS=function cm(){return $l(this)};_.f=0;_.i=0;_.j=0;_.k=0;var Pl=0;var mr=gw(74);qt(99,1,{},gm);_.a=0;_.d=0;_.i=0;var nr=gw(99);qt(98,1,{},pm);var pr=gw(98);qt(106,1,{},tm);_.a=0;_.b=false;_.c=0;_.d=0;_.e=false;_.g=0;var or=gw(106);qt(130,1,bC,wm);var qr=gw(130);qt(30,58,{58:1,47:1,30:1,4:1},Hm);_.cb=function Im(a){xm(this,a)};_.a=false;var rr=gw(30);qt(150,1,{});var sr=gw(150);qt(100,150,{},Sm);_.d=0;var Jm;var tr=gw(100);qt(97,1,{},Ym);var Tm,Um,Vm;var ur=gw(97);var Zm;var dn,en;qt(92,91,{},jn);_.db=function hn(){kk()};_.eb=function kn(){return lk(this)};_.getAbsoluteWeight=st(_.eb,false,[]);_.fb=function ln(){return mk(this)};_.getFormula=st(_.fb,false,[]);_.gb=function mn(){return nk(this)};_.getRelativeWeight=st(_.gb,false,[]);var vr=gw(92);qt(26,1,{26:1},qn,rn);_.hb=function pn(){on()};_.ensureHelperArrays=function sn(a){xm(this.a,a)};_.getFragmentNumbers=function wn(){return kj(this.a,jq(Eq,uB,0,this.a.p,7,1),false)};_.getFragments=function xn(){var a,b,c;a=zm(this.a);c=jq(xr,GB,26,a.length,0,1);for(b=0;b<a.length;b++){c[b]=new rn(a[b])}return c};_.getIDCode=function yn(){return Bm(this.a)};_.getIDCodeAndCoordinates=function zn(){return {idCode:this.getIDCode(),coordinates:this.getIDCoordinates()}};_.getIDCoordinates=function An(){return Cm(this.a)};_.getIndex=function Bn(){return El(yo(nn),this.a)};_.getMolecularFormula=function Cn(){!this.b&&(this.b=new jn(this.a));return this.b};_.getProperties=function Dn(){!this.c&&(this.c=new Mn(this.a));return this.c};_.ib=function En(){return this.a};_.inventCoordinates=function Fn(){var a;a=vo(nn);a.j=new FA({l:0,m:0,h:0});fg(a,this.a);Pj(this.a)};_.isFragment=function Gn(){return this.a.L};_.setFragment=function Hn(a){Ii(this.a,a)};_.toMolfile=function In(){var a;a=new rk(this.a);return a.b.a};_.toSVG=function Jn(a,b,c){var d;d=new bm(this.a,c);md(d,new rv(0,0,a,b));fd(d);return $l(d)};_.toSmiles=function Kn(){return dm(zo(nn),this.a)};_.b=null;_.c=null;var nn;var xr=gw(26);qt(95,96,{},Mn);_.jb=function Ln(){};_.kb=function Nn(){return Ok(this)};_.getAcceptorCount=st(_.kb,false,[]);_.lb=function On(){return Pk(this)};_.getDonorCount=st(_.lb,false,[]);_.mb=function Pn(){return Qk(this)};_.getLogP=st(_.mb,false,[]);_.nb=function Qn(){return gn((fn(),this.a))};_.getLogS=st(_.nb,false,[]);_.ob=function Rn(){return _m(($m(),this.a))};_.getPolarSurfaceArea=st(_.ob,false,[]);_.pb=function Sn(){return uj(this.a)};_.getRotatableBondCount=st(_.pb,false,[]);_.qb=function Tn(){return Dm(this.a)};_.getStereoCenterCount=st(_.qb,false,[]);var wr=gw(95);qt(149,1,{},Vn);_.rb=function Un(){};_.getField=function Wn(a){var b,c;c=Pm(this.a);for(b=0;b<c.length;b++){if(Dx(c[b],a)){return Om(this.a,b)}}return null};_.getFieldData=function Xn(a){return Om(this.a,a)};_.getFieldNames=function Yn(a){return Qm(this.a,a)};_.getMolecule=function Zn(){return new rn(Rm(this.a))};_.getNextFieldData=function $n(){return this.a.a.a};_.getNextMolFile=function _n(){return this.a.f.a};_.next=function ao(){return Lm(this.a)};var yr=gw(149);qt(151,1,{},co);_.sb=function bo(){this.a=new zl};_.isFragmentInMolecule=function eo(){return rl(this.a)};_.setFragment=function fo(a){wl(this.a,a.a)};_.setMol=function go(a,b){this.setMolecule(b);this.setFragment(a)};_.setMolecule=function ho(a){xl(this.a,a.a)};var Ar=gw(151);qt(152,1,{},jo);_.tb=function io(){this.a=new Jl};_.createIndex=function lo(a){return El(this.a,a.a)};_.isFragmentInMolecule=function ro(){return Gl(this.a)};_.setFragment=function so(a,b){Hl(this.a,a.a,b)};_.setMolecule=function to(a,b){Il(this.a,a.a,b)};var zr=gw(152);qt(94,1,{},Bo);_.a=null;_.b=null;_.c=null;_.d=null;_.e=null;_.f=null;_.g=null;var uo=null;var Br=gw(94);qt(118,1,{},Go);var Cr=gw(118);qt(11,1,LC);_.ub=function Jo(){return this.f};_.tS=function Ko(){var a,b;a=cw(this.cZ);b=this.ub();return b!=null?a+': '+b:a};var Ds=gw(11);qt(10,11,MC,Lo);var os=gw(10);qt(17,10,MC,No);var ys=gw(17);qt(104,17,MC);var Gr=gw(104);qt(40,104,{40:1,4:1,10:1,11:1},Ro);_.ub=function So(){Qo(this);return this.c};_.vb=function To(){return xq(this.b)===xq(Oo)?null:this.b};var Oo;var Dr=gw(40);qt(153,1,{});var Fr=gw(153);var Vo=0,Wo=0,Xo=0,Yo=-1;qt(143,153,{},kp);var gp;var Hr=gw(143);var np;qt(166,1,{});var Lr=gw(166);qt(107,166,{},tp);_.wb=function up(a,b){var c={},j;a.fnStack=[];var d=arguments.callee.caller;while(d){var e=(op(),d.name||(d.name=rp(d.toString())));a.fnStack.push(e);var f=':'+e;var g=c[f];if(g){var h,i;for(h=0,i=g.length;h<i;h++){if(g[h]===d){return}}}(g||(c[f]=[])).push(d);d=d.caller}};_.xb=function vp(a){var b,c,d,e;d=(op(),a&&a.fnStack&&a.fnStack instanceof Array?a.fnStack:[]);c=d.length;e=jq(zs,GB,32,c,0,1);for(b=0;b<c;b++){e[b]=new yx(d[b],null,-1)}return e};var Ir=gw(107);qt(167,166,{});_.wb=function yp(c,d){function e(b){if(!('stack' in b)){try{throw b}catch(a){}}return b}
	var f;typeof d=='string'?(f=e(new Error(d))):d instanceof Object&&'stack' in d?(f=d):(f=e(new Error));c.__gwt$backingJsError=f};_.yb=function zp(a,b,c,d){return new yx(b,a+'@'+d,c<0?-1:c)};_.xb=function Ap(a){var b,c,d,e,f,g,h;e=(op(),h=a.__gwt$backingJsError,h&&h.stack?h.stack.split('\n'):[]);f=jq(zs,GB,32,0,0,1);b=0;d=e.length;if(d==0){return f}g=xp(this,e[0]);Dx(g.d,'anonymous')||(f[b++]=g);for(c=1;c<d;c++){f[b++]=xp(this,e[c])}return f};var Kr=gw(167);qt(108,167,{},Bp);_.yb=function Cp(a,b,c,d){return new yx(b,a,-1)};var Jr=gw(108);qt(145,1,{},Qp);var Np;var Mr=gw(145);qt(90,1,{},dq);_.b=0;_.c=false;_.d=0;_.e=0;_.f=3;_.g=false;_.i=3;_.j=40;_.k=0;_.n=0;_.o=1;_.p=1;_.q='-';_.r='';_.t='';_.u='';_.v=false;var Nr=gw(90);qt(148,1,{},fq);var Or=gw(148);var At;var Rt;var ju,ku,lu,mu;qt(64,11,LC);var ns=gw(64);qt(19,64,LC);var js=gw(19);qt(103,19,LC,zu);var Tr=gw(103);qt(14,1,{14:1},Lu,Mu,Nu);_.eQ=function Ou(a){return sq(a,14)&&a.b==this.b};_.hC=function Pu(){return this.b};_.tS=function Su(){return bw(Ur),Ur.k+'[r='+(this.b>>16&255)+',g='+(this.b>>8&255)+',b='+(this.b&255)+']'};_.a=null;_.b=0;var Bu,Cu,Du,Eu,Fu,Gu,Hu,Iu,Ju;var Ur=gw(14);qt(82,1,{},Wu);_.b=0;var Tu=null;var Vr=gw(82);qt(66,1,{66:1});_.eQ=function Xu(a){var b;if(sq(a,66)){b=a;return this.a==b.a&&this.b==b.b}return this===a};_.hC=function Yu(){var a;a=Bw(this.a);a=iu(a,$t(Bw(this.b),{l:31,m:0,h:0}));return gu(a)^gu(du(a,32))};var Xr=gw(66);qt(27,66,{66:1,27:1},Zu,$u);_.tS=function _u(){return 'Point2D.Float['+this.a+', '+this.b+']'};_.a=0;_.b=0;var Wr=gw(27);qt(164,1,{});var _r=gw(164);qt(51,164,{51:1});_.eQ=function ev(a){var b;if(a===this){return true}if(sq(a,51)){b=a;return this.Bb()==b.Bb()&&this.Cb()==b.Cb()&&this.Ab()==b.Ab()&&this.zb()==b.zb()}return false};_.hC=function fv(){var a;a=Bw(this.Bb());a=St(a,$t(Bw(this.Cb()),{l:37,m:0,h:0}));a=St(a,$t(Bw(this.Ab()),{l:43,m:0,h:0}));a=St(a,$t(Bw(this.zb()),{l:47,m:0,h:0}));return gu(a)^gu(du(a,32))};var $r=gw(51);qt(79,51,{51:1},hv,iv);_.zb=function jv(){return this.a};_.Ab=function kv(){return this.b};_.Bb=function lv(){return this.c};_.Cb=function mv(){return this.d};_.Db=function nv(a,b,c,d){gv(this,a,b,c,d)};_.tS=function ov(){return bw(Yr),Yr.k+'[x='+this.c+',y='+this.d+',w='+this.b+',h='+this.a+']'};_.a=0;_.b=0;_.c=0;_.d=0;var Yr=gw(79);qt(22,51,{51:1,22:1},qv,rv);_.zb=function sv(){return this.a};_.Ab=function tv(){return this.b};_.Bb=function uv(){return this.c};_.Cb=function vv(){return this.d};_.Db=function wv(a,b,c,d){this.c=a;this.d=b;this.b=c;this.a=d};_.tS=function xv(){return bw(Zr),Zr.k+'[x='+this.c+',y='+this.d+',w='+this.b+',h='+this.a+']'};_.a=0;_.b=0;_.c=0;_.d=0;var Zr=gw(22);qt(165,1,{});var es=gw(165);qt(60,165,{},Av);_.a=0;var as=gw(60);qt(172,1,{});var cs=gw(172);qt(173,172,{});var bs=gw(173);qt(119,173,{},Bv);var ds=gw(119);qt(59,165,{},Dv);_.a=0;var fs=gw(59);qt(49,1,{});_.tS=function Jv(){return this.a};var gs=gw(49);qt(125,17,MC,Kv);var hs=gw(125);qt(38,17,MC,Lv);var is=gw(38);qt(48,1,{4:1,48:1,29:1},Ov);_.bb=function Qv(a){return Pv(this.a,a.a)};_.eQ=function Rv(a){return sq(a,48)&&a.a==this.a};_.hC=function Sv(){return this.a?1231:1237};_.tS=function Tv(){return ''+this.a};_.a=false;var Mv;var ks=gw(48);qt(65,1,{4:1,65:1});var vw;var ws=gw(65);var yw,zw;qt(34,1,{4:1,29:1,34:1});_.bb=function Ew(a){return this.b-a.b};_.eQ=function Fw(a){return this===a};_.hC=function Gw(){return cp(this)};_.tS=function Hw(){return this.a!=null?this.a:''+this.b};_.b=0;var ms=gw(34);qt(15,17,MC,Jw,Kw);var ps=gw(15);qt(46,17,MC,Lw,Mw);var qs=gw(46);qt(23,65,{4:1,29:1,23:1,65:1},Nw);_.bb=function Pw(a){return Ow(this.a,a.a)};_.eQ=function Qw(a){return sq(a,23)&&a.a==this.a};_.hC=function Rw(){return this.a};_.tS=function Uw(){return ''+this.a};_.a=0;var rs=gw(23);var Xw;qt(39,65,{4:1,29:1,39:1,65:1},$w);_.bb=function ax(a){return Zw(this,a)};_.eQ=function bx(a){return sq(a,39)&&Ut(a.a,this.a)};_.hC=function cx(){return gu(this.a)};_.tS=function dx(){return ''+hu(this.a)};_.a={l:0,m:0,h:0};var ss=gw(39);var fx;qt(144,17,MC,ux);var ts=gw(144);qt(85,17,MC,vx,wx);var us=gw(85);qt(44,15,MC,xx);var vs=gw(44);qt(32,1,{4:1,32:1},yx);_.eQ=function zx(a){var b;if(sq(a,32)){b=a;return this.c==b.c&&vA(this.d,b.d)&&vA(this.a,b.a)&&vA(this.b,b.b)}return false};_.hC=function Ax(){return fA(mq(iq(xs,1),GB,1,3,[Ww(this.c),this.a,this.d,this.b]))};_.tS=function Bx(){return this.a+'.'+this.d+'('+(this.b!=null?this.b:'Unknown Source')+(this.c>=0?':'+this.c:'')+')'};_.c=0;var zs=gw(32);var Cs=gw(2);var Wx,Xx=0,Yx;qt(72,49,{93:1},cy);var As=gw(72);qt(21,49,{93:1},jy,ky,ly);var Bs=gw(21);var my;qt(86,17,MC,py);var Es=gw(86);qt(176,1,{});var Gs=gw(176);qt(89,176,{},ry);var Fs=gw(89);qt(169,1,{});_.Lb=function wy(a){return sy(this,a)};_.tS=function xy(){return vy(this)};var Hs=gw(169);qt(171,169,{71:1});_.Nb=function zy(a,b){throw new py('Add not supported on this list')};_.Ob=function Ay(a){this.Nb(this.Mb(),a);return true};_.eQ=function By(a){return yy(this,a)};_.hC=function Cy(){return oA(this)};_.Kb=function Dy(){return new Gy(this)};var Ks=gw(171);qt(24,1,{},Gy);_.Qb=function Hy(){return Ey(this)};_.Rb=function Iy(){return Fy(this)};_.a=0;var Is=gw(24);qt(114,24,{},Jy);var Js=gw(114);qt(168,1,{56:1});_.Sb=function Oy(a){return Ky(this,a)};_.Tb=function Py(a){return !!My(this,a)};_.eQ=function Qy(a){var b,c,d;if(a===this){return true}if(!sq(a,56)){return false}d=a;if(this.Mb()!=d.Mb()){return false}for(c=d.Ub().Kb();c.Qb();){b=c.Rb();if(!this.Sb(b)){return false}}return true};_.Vb=function Ry(a){return Sy(My(this,a))};_.hC=function Ty(){return nA(this.Ub())};_.Mb=function Uy(){return this.Ub().Mb()};_.tS=function Vy(){var a,b,c,d;d=new ly('{');a=false;for(c=this.Ub().Kb();c.Qb();){b=c.Rb();a?(d.a+=', ',d):(a=true);gy(d,Ny(this,b.Wb()));d.a+='=';gy(d,Ny(this,b.Xb()))}d.a+='}';return d.a};var Ps=gw(168);qt(112,169,{},Xy);_.Lb=function Yy(a){return Ly(this.a,a)};_.Kb=function Zy(){return Wy(this)};_.Mb=function $y(){return this.a.c};var Ms=gw(112);qt(113,1,{},az);_.Qb=function bz(){return Ey(this.a.a)};_.Rb=function cz(){return _y(this)};var Ls=gw(113);qt(52,1,{52:1,31:1});_.eQ=function ez(a){var b;if(!sq(a,31)){return false}b=a;return vA(this.c,b.Wb())&&vA(this.d,b.Xb())};_.Wb=function fz(){return this.c};_.Xb=function gz(){return this.d};_.hC=function hz(){return wA(this.c)^wA(this.d)};_.tS=function iz(){return this.c+'='+this.d};var Ns=gw(52);qt(53,52,{52:1,53:1,31:1});var Os=gw(53);qt(174,168,{56:1});_.Sb=function mz(a){return jz(this,a)};_.Tb=function nz(a){return kz(this,a)};_.Ub=function oz(){return new sz(this)};_.Vb=function pz(a){return lz(this,a)};var Ts=gw(174);qt(170,169,RC);_.eQ=function qz(a){var b;if(a===this){return true}if(!sq(a,45)){return false}b=a;if(b.Mb()!=this.Mb()){return false}return ty(this,b)};_.hC=function rz(){return nA(this)};var Us=gw(170);qt(83,170,RC,sz);_.Lb=function tz(a){return sq(a,31)&&jz(this.a,a)};_.Kb=function uz(){return new SA(this.a)};_.Mb=function vz(){return this.a.c};var Qs=gw(83);qt(84,170,RC,xz);_.Lb=function yz(a){return kz(this.a,a)};_.Kb=function zz(){return wz(this)};_.Mb=function Az(){return this.a.c};var Ss=gw(84);qt(124,1,{},Cz);_.Qb=function Dz(){return Ey(this.a.a)};_.Rb=function Ez(){return Bz(this)};var Rs=gw(124);qt(16,171,{4:1,71:1},Mz);_.Nb=function Nz(a,b){Fz(this,a,b)};_.Ob=function Oz(a){return Gz(this,a)};_.Lb=function Pz(a){return Iz(this,a,0)!=-1};_.Pb=function Qz(a){return Hz(this,a)};_.Yb=function Rz(a){var b;return b=(Ip(a,this.a.length),this.a[a]),Tz(this.a,a,1),b};_.Mb=function Sz(){return this.a.length};var Vs=gw(16);var pA;qt(135,1,{},sA);_.ab=function tA(a,b){return rA(a,b)};var Ws=gw(135);var Xs=iw();qt(146,17,MC,uA);var Ys=gw(146);qt(62,1,{},EA,FA);_.a=0;_.b=0;var xA,yA,zA=0;var Zs=gw(62);qt(42,174,{4:1,56:1},OA);_.Ub=function QA(){return new WA(this)};_.Mb=function RA(){return this.c};_.c=0;var gt=gw(42);qt(43,1,{},SA);_.Qb=function UA(){return Ey(this.a)};_.Rb=function VA(){return Fy(this.a)};var $s=gw(43);qt(54,83,RC,WA);var _s=gw(54);qt(55,53,{52:1,53:1,31:1,55:1},XA);_.b=false;var at=gw(55);qt(120,1,{},YA);_.tS=function ZA(){return 'State: mv='+this.c+' value='+this.d+' done='+this.a+' found='+this.b};_.a=false;_.b=false;_.c=false;var bt=gw(120);qt(28,34,UC,dB);_.Zb=function eB(){return false};_.$b=function fB(){return false};var $A,_A,aB,bB;var ft=hw(28,gB);qt(121,28,UC,hB);_.$b=function iB(){return true};var ct=hw(121,null);qt(122,28,UC,jB);_.Zb=function kB(){return true};_.$b=function lB(){return true};var dt=hw(122,null);qt(123,28,UC,mB);_.Zb=function nB(){return true};var et=hw(123,null);qt(101,170,{4:1,45:1},oB);_.Lb=function pB(a){return kz(this.a,a)};_.Kb=function qB(){return wz(new xz(this.a))};_.Mb=function rB(){return this.a.c};var ht=gw(101);var Cq=jw('D'),Eq=jw('I'),Aq=jw('B'),Bq=jw('C'),jt=jw('Z'),Dq=jw('F'),it=jw('S'),Pr=gw(155),Qr=gw(157),Rr=gw(null),Sr=gw(160),Fq=jw('J'),Xs=iw();on();_=yt('$wnd.OCL');_.Molecule=qn;_=yt('$wnd.OCL.Molecule');_.fromIDCode=tn;_.fromMolfile=un;_.fromSmiles=vn;_.services=nn;_=yt('$wnd.OCL');_.SDFileParser=Vn;_=yt('$wnd.OCL');_.SSSearcher=co;_=yt('$wnd.OCL');_.SSSearcherWithIndex=jo;_=yt('$wnd.OCL.SSSearcherWithIndex');_.bitCount=ko;_.getHexStringFromIndex=mo;_.getIndexFromHexString=no;_.getKeyIDCode=oo;_.getSimilarityAngleCosine=po;_.getSimilarityTanimoto=qo;var sB=su();var gwtOnLoad=gwtOnLoad=ru;pu(vu);tu('permProps',[[['locale','default'],['user.agent','safari']]]);$sendStats('moduleStartup', 'moduleEvalEnd');gwtOnLoad(__gwtModuleFunction.__errFn, __gwtModuleFunction.__moduleName, __gwtModuleFunction.__moduleBase, __gwtModuleFunction.__softPermutationId,__gwtModuleFunction.__computePropValue);$sendStats('moduleStartup', 'end');$gwt && $gwt.permProps && __gwtModuleFunction.__moduleStartupDone($gwt.permProps);
	//# sourceURL=actelionCore-0.js

	        // End GWT code

	        var toReturn = $wnd["OCL"];

	        toReturn.version = '3.0.0';

	        return toReturn;
	    }

	    var isBrowser, globalEnv;

	    if (typeof window !== 'undefined') { // usual browser window
	        isBrowser = true;
	        globalEnv = window;
	    } else if (typeof self !== 'undefined') { // Web Worker
	        isBrowser = true;
	        globalEnv = self;
	    } else { // Node.js
	        isBrowser = false;
	        globalEnv = global;
	    }

	    var fakeWindow;
	    if (isBrowser && !false) {
	        fakeWindow = globalEnv;
	    } else {
	        fakeWindow = {};
	        fakeWindow.setTimeout = globalEnv.setTimeout.bind(globalEnv);
	        fakeWindow.clearTimeout = globalEnv.clearTimeout.bind(globalEnv);
	        fakeWindow.setInterval = globalEnv.setInterval.bind(globalEnv);
	        fakeWindow.clearInterval = globalEnv.clearInterval.bind(globalEnv);
	    }

	    if (!isBrowser || !globalEnv.document) { // add document object for Node.js and Workers
	        fakeWindow.document = {};
	    }

	    if (typeof module !== 'undefined' && module.exports) { // NodeJS
	        module.exports = getExports(fakeWindow);
	    } else if (true) { // AMD
	        !(__WEBPACK_AMD_DEFINE_RESULT__ = function () {
	            return getExports(fakeWindow);
	        }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else { // Global
	        var path = ["OCL"];
	        var l = path.length - 1;
	        var obj = globalEnv;
	        for (var i = 0; i < l; i++) {
	            obj = obj[path[i]] || (obj[path[i]] = {});
	        }
	        obj[path[l]] = getExports(fakeWindow);
	    }

	})();

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(setImmediate) {'use strict';

	var OCL = __webpack_require__(4);
	var Molecule = OCL.Molecule;
	var parseSDF = __webpack_require__(6);
	var Papa = __webpack_require__(7);
	var extend = __webpack_require__(8);

	var moleculeCreator = __webpack_require__(9);

	var defaultDBOptions = {
	    length: 0,
	    computeProperties: false
	};

	function DB(options) {
	    options = extend({}, defaultDBOptions, options);
	    this.data = new Array(options.length);
	    this.molecules = new Array(options.length);
	    this.statistics = null;
	    this.length = 0;
	    this.computeProperties = !!options.computeProperties;
	    this.searcher = null;
	}

	var defaultSDFOptions = {
	    onStep: function (current, total) {}
	};

	DB.parseSDF = function (sdf, options) {
	    if (typeof sdf !== 'string') {
	        throw new TypeError('sdf must be a string');
	    }
	    options = extend({}, defaultSDFOptions, options);
	    return new Promise(function (resolve, reject) {
	        var parsed = parseSDF(sdf);
	        var molecules = parsed.molecules;
	        var db = new DB(options);
	        db.statistics = parsed.statistics;
	        var i = 0, l = molecules.length;
	        parseNext();
	        function parseNext() {
	            if (i === l) {
	                return resolve(db);
	            }
	            try {
	                db.push(Molecule.fromMolfile(molecules[i].molfile.value), molecules[i]);
	            } catch (e) {
	                return reject(e);
	            }
	            options.onStep(++i, l);
	            setImmediate(parseNext);
	        }
	    });
	};

	var defaultCSVOptions = {
	    header: true,
	    dynamicTyping: true,
	    skipEmptyLines: true,
	    onStep: function (current, total) {}
	};

	DB.parseCSV = function (csv, options) {
	    if (typeof csv !== 'string') {
	        throw new TypeError('csv must be a string');
	    }
	    options = extend({}, defaultCSVOptions, options);
	    return new Promise(function (resolve, reject) {
	        var parsed = Papa.parse(csv, options);
	        var fields = parsed.meta.fields;
	        var stats = new Array(fields.length);
	        var firstElement = parsed.data[0];
	        var datatype, datafield;
	        for (var i = 0; i < fields.length; i++) {
	            stats[i] = {
	                label: fields[i],
	                isNumeric: typeof firstElement[fields[i]] === 'number'
	            };
	            var lowerField = fields[i].toLowerCase();
	            if (moleculeCreator.has(lowerField)) {
	                datatype = moleculeCreator.get(lowerField);
	                datafield = fields[i];
	            }
	        }
	        if (!datatype) {
	            throw new Error('this document does not contain any molecule field');
	        }
	        var db = new DB(options);
	        db.statistics = stats;

	        var i = 0, l = parsed.data.length;
	        parseNext();
	        function parseNext() {
	            if (i === l) {
	                return resolve(db);
	            }
	            try {
	                db.push(datatype(parsed.data[i][datafield]), parsed.data[i]);
	            } catch (e) {
	                return reject(e);
	            }
	            options.onStep(++i, l);
	            setImmediate(parseNext);
	        }
	    });
	};

	DB.prototype.push = function (molecule, data) {
	    if (data === undefined) data = {};
	    this.molecules[this.length] = molecule;
	    var molecularFormula = molecule.getMolecularFormula();
	    if (!molecule.index) {
	        molecule.index = molecule.getIndex();
	        molecule.idcode = molecule.getIDCode();
	        molecule.mw = molecularFormula.getRelativeWeight();
	    }
	    this.data[this.length++] = data;
	    if (this.computeProperties) {
	        var properties = molecule.getProperties();
	        data.properties = {
	            absoluteWeight: molecularFormula.getAbsoluteWeight(),
	            relativeWeight: molecule.mw,
	            formula: molecularFormula.getFormula(),
	            acceptorCount: properties.getAcceptorCount(),
	            donorCount: properties.getDonorCount(),
	            logP: properties.getLogP(),
	            logS: properties.getLogS(),
	            polarSurfaceArea: properties.getPolarSurfaceArea(),
	            rotatableBondCount: properties.getRotatableBondCount(),
	            stereoCenterCount: properties.getStereoCenterCount()
	        };
	    }
	};

	var defaultSearchOptions = {
	    format: 'oclid',
	    mode: 'substructure',
	    limit: 0
	};

	DB.prototype.search = function (query, options) {
	    options = extend({}, defaultSearchOptions, options);

	    if (typeof query === 'string') {
	        query = moleculeCreator.get(options.format.toLowerCase())(query);
	    } else if (!(query instanceof Molecule)) {
	        throw new TypeError('toSearch must be a Molecule or string');
	    }

	    var result;
	    switch (options.mode.toLowerCase()) {
	        case 'exact':
	            result = this.exactSearch(query, options.limit);
	            break;
	        case 'substructure':
	            result = this.subStructureSearch(query, options.limit);
	            break;
	        case 'similarity':
	            result = this.similaritySearch(query, options.limit);
	            break;
	        default:
	            throw new Error('unknown search mode: ' + options.mode);
	    }
	    return result;
	};

	DB.prototype.exactSearch = function (query, limit) {
	    var queryIdcode = query.getIDCode();
	    var result = new DB();
	    limit = limit || Number.MAX_SAFE_INTEGER;
	    for (var i = 0; i < this.length; i++) {
	        if (this.molecules[i].idcode === queryIdcode) {
	            result.push(this.molecules[i], this.data[i]);
	            if (result.length >= limit) break;
	        }
	    }
	    return result;
	};

	DB.prototype.subStructureSearch = function (query, limit) {
	    var needReset = false;
	    if (!query.isFragment()) {
	        needReset = true;
	        query.setFragment(true);
	    }

	    var queryIndex = query.getIndex();
	    var queryMW = query.getMolecularFormula().getRelativeWeight();
	    var searcher = this.getSearcher();

	    searcher.setFragment(query, queryIndex);
	    var searchResult = [];
	    for (var i = 0; i < this.length; i++) {
	        searcher.setMolecule(this.molecules[i], this.molecules[i].index);
	        if (searcher.isFragmentInMolecule()) {
	            searchResult.push([this.molecules[i], i]);
	        }
	    }
	    searchResult.sort(function (a, b) {
	        return Math.abs(queryMW - a[0].mw) - Math.abs(queryMW - b[0].mw);
	    });

	    var length = limit || searchResult.length;
	    var result = new DB({length: length});
	    for (var i = 0; i < length; i++) {
	        result.push(this.molecules[searchResult[i][1]], this.data[searchResult[i][1]]);
	    }

	    if (needReset) {
	        query.setFragment(false);
	    }
	    return result;
	};

	DB.prototype.similaritySearch = function (query, limit) {
	    var queryIndex = query.getIndex();
	    var queryMW = query.getMolecularFormula().getRelativeWeight();
	    var queryIDCode = query.getIDCode();

	    var searchResult = new Array(this.length);
	    var similarity;
	    for (var i = 0; i < this.length; i++) {
	        if (this.molecules[i].idcode === queryIDCode) {
	            similarity = 1e10;
	        } else {
	            similarity = OCL.SSSearcherWithIndex.getSimilarityTanimoto(queryIndex, this.molecules[i].index)
	                * 100000 - Math.abs(queryMW - this.molecules[i].mw) / 1000;
	        }
	        searchResult[i] = [similarity, i];
	    }
	    searchResult.sort(function (a, b) {
	        return b[0] - a[0];
	    });

	    var length = limit || searchResult.length;
	    var result = new DB({length: length});
	    for (var i = 0; i < length; i++) {
	        result.push(this.molecules[searchResult[i][1]], this.data[searchResult[i][1]]);
	    }
	    return result;
	};

	DB.prototype.getSearcher = function () {
	    return this.searcher || (this.searcher = new OCL.SSSearcherWithIndex());
	};

	module.exports = DB;

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2).setImmediate))

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	// options: an object

	function parse(sdf, options) {
	    // we will find the delimiter in order to be much faster and not use regular expression
	    var header = sdf.substr(0, 1000);
	    var crlf = '\n';
	    if (header.indexOf('\r\n') > -1) {
	        crlf = '\r\n';
	    } else if (header.indexOf('\r') > -1) {
	        crlf = '\r';
	    }

	    var sdfParts = sdf.split(crlf + '$$$$' + crlf);
	    var molecules = [];
	    var labels = {};

	    var start = Date.now();

	    var i = 0, ii = sdfParts.length,
	        sdfPart, parts, molecule, j, jj,
	        lines, from, to, label, k, kk;
	    for (; i < ii; i++) {
	        sdfPart = sdfParts[i];
	        parts = sdfPart.split(crlf + '>');
	        if (parts.length > 0 && parts[0].length > 5) {
	            molecule = {};
	            molecules.push(molecule);
	            molecule.molfile = {type: 'mol2d', value: parts[0] + crlf};
	            jj = parts.length;
	            for (j = 1; j < jj; j++) {
	                lines = parts[j].split(crlf);
	                from = lines[0].indexOf('<');
	                to = lines[0].indexOf('>');
	                label = lines[0].substring(from + 1, to);
	                if (labels[label]) {
	                    labels[label].counter++;
	                } else {
	                    labels[label] = {counter: 1, isNumeric: true};
	                }
	                kk = lines.length - 1;
	                for (k = 1; k < kk; k++) {
	                    if (molecule[label]) {
	                        molecule[label] += crlf + lines[k];
	                    } else {
	                        molecule[label] = lines[k];
	                    }
	                }
	                if (labels[label].isNumeric) {
	                    if (!isFinite(molecule[label])) {
	                        labels[label].isNumeric = false;
	                    }
	                }
	            }
	        }
	    }

	    // all numeric fields should be converted to numbers
	    var numericFields=[];
	    for (var label in labels) {
	        var currentLabel=labels[label];
	        if (currentLabel.isNumeric) {
	            currentLabel.minValue=Number.MAX_VALUE;
	            currentLabel.maxValue=Number.MIN_VALUE;
	            for (var j=0; j < molecules.length; j++) {
	                if (molecules[j][label]) {
	                    var value=parseFloat(molecules[j][label]);
	                    molecules[j][label]=value;
	                    if (value>currentLabel.maxValue) currentLabel.maxValue=value;
	                    if (value<currentLabel.minValue) currentLabel.minValue=value;
	                }
	            }
	        }
	    }

	    // we check that a label is in all the records
	    for (var key in labels) {
	        if (labels[key].counter==molecules.length) {
	            labels[key].always=true;
	        } else {
	            labels[key].always=false;
	        }
	    }

	    var statistics = [];
	    for (var key in labels) {
	        var statistic=labels[key];
	        statistic.label=key;
	        statistics.push(statistic);
	    }

	    return {
	        time: Date.now() - start,
	        molecules: molecules,
	        labels: Object.keys(labels),
	        statistics: statistics
	    };

	}

	module.exports = parse;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*!
		Papa Parse
		v4.1.2
		https://github.com/mholt/PapaParse
	*/
	(function(global)
	{
		"use strict";

		var IS_WORKER = !global.document && !!global.postMessage,
			IS_PAPA_WORKER = IS_WORKER && /(\?|&)papaworker(=|&|$)/.test(global.location.search),
			LOADED_SYNC = false, AUTO_SCRIPT_PATH;
		var workers = {}, workerIdCounter = 0;

		var Papa = {};

		Papa.parse = CsvToJson;
		Papa.unparse = JsonToCsv;

		Papa.RECORD_SEP = String.fromCharCode(30);
		Papa.UNIT_SEP = String.fromCharCode(31);
		Papa.BYTE_ORDER_MARK = "\ufeff";
		Papa.BAD_DELIMITERS = ["\r", "\n", "\"", Papa.BYTE_ORDER_MARK];
		Papa.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
		Papa.SCRIPT_PATH = null;	// Must be set by your code if you use workers and this lib is loaded asynchronously

		// Configurable chunk sizes for local and remote files, respectively
		Papa.LocalChunkSize = 1024 * 1024 * 10;	// 10 MB
		Papa.RemoteChunkSize = 1024 * 1024 * 5;	// 5 MB
		Papa.DefaultDelimiter = ",";			// Used if not specified and detection fails

		// Exposed for testing and development only
		Papa.Parser = Parser;
		Papa.ParserHandle = ParserHandle;
		Papa.NetworkStreamer = NetworkStreamer;
		Papa.FileStreamer = FileStreamer;
		Papa.StringStreamer = StringStreamer;

		if (typeof module !== 'undefined' && module.exports)
		{
			// Export to Node...
			module.exports = Papa;
		}
		else if (isFunction(global.define) && global.define.amd)
		{
			// Wireup with RequireJS
			!(__WEBPACK_AMD_DEFINE_RESULT__ = function() { return Papa; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		}
		else
		{
			// ...or as browser global
			global.Papa = Papa;
		}

		if (global.jQuery)
		{
			var $ = global.jQuery;
			$.fn.parse = function(options)
			{
				var config = options.config || {};
				var queue = [];

				this.each(function(idx)
				{
					var supported = $(this).prop('tagName').toUpperCase() == "INPUT"
									&& $(this).attr('type').toLowerCase() == "file"
									&& global.FileReader;

					if (!supported || !this.files || this.files.length == 0)
						return true;	// continue to next input element

					for (var i = 0; i < this.files.length; i++)
					{
						queue.push({
							file: this.files[i],
							inputElem: this,
							instanceConfig: $.extend({}, config)
						});
					}
				});

				parseNextFile();	// begin parsing
				return this;		// maintains chainability


				function parseNextFile()
				{
					if (queue.length == 0)
					{
						if (isFunction(options.complete))
							options.complete();
						return;
					}

					var f = queue[0];

					if (isFunction(options.before))
					{
						var returned = options.before(f.file, f.inputElem);

						if (typeof returned === 'object')
						{
							if (returned.action == "abort")
							{
								error("AbortError", f.file, f.inputElem, returned.reason);
								return;	// Aborts all queued files immediately
							}
							else if (returned.action == "skip")
							{
								fileComplete();	// parse the next file in the queue, if any
								return;
							}
							else if (typeof returned.config === 'object')
								f.instanceConfig = $.extend(f.instanceConfig, returned.config);
						}
						else if (returned == "skip")
						{
							fileComplete();	// parse the next file in the queue, if any
							return;
						}
					}

					// Wrap up the user's complete callback, if any, so that ours also gets executed
					var userCompleteFunc = f.instanceConfig.complete;
					f.instanceConfig.complete = function(results)
					{
						if (isFunction(userCompleteFunc))
							userCompleteFunc(results, f.file, f.inputElem);
						fileComplete();
					};

					Papa.parse(f.file, f.instanceConfig);
				}

				function error(name, file, elem, reason)
				{
					if (isFunction(options.error))
						options.error({name: name}, file, elem, reason);
				}

				function fileComplete()
				{
					queue.splice(0, 1);
					parseNextFile();
				}
			}
		}


		if (IS_PAPA_WORKER)
		{
			global.onmessage = workerThreadReceivedMessage;
		}
		else if (Papa.WORKERS_SUPPORTED)
		{
			AUTO_SCRIPT_PATH = getScriptPath();

			// Check if the script was loaded synchronously
			if (!document.body)
			{
				// Body doesn't exist yet, must be synchronous
				LOADED_SYNC = true;
			}
			else
			{
				document.addEventListener('DOMContentLoaded', function () {
					LOADED_SYNC = true;
				}, true);
			}
		}




		function CsvToJson(_input, _config)
		{
			_config = _config || {};

			if (_config.worker && Papa.WORKERS_SUPPORTED)
			{
				var w = newWorker();

				w.userStep = _config.step;
				w.userChunk = _config.chunk;
				w.userComplete = _config.complete;
				w.userError = _config.error;

				_config.step = isFunction(_config.step);
				_config.chunk = isFunction(_config.chunk);
				_config.complete = isFunction(_config.complete);
				_config.error = isFunction(_config.error);
				delete _config.worker;	// prevent infinite loop

				w.postMessage({
					input: _input,
					config: _config,
					workerId: w.id
				});

				return;
			}

			var streamer = null;
			if (typeof _input === 'string')
			{
				if (_config.download)
					streamer = new NetworkStreamer(_config);
				else
					streamer = new StringStreamer(_config);
			}
			else if ((global.File && _input instanceof File) || _input instanceof Object)	// ...Safari. (see issue #106)
				streamer = new FileStreamer(_config);

			return streamer.stream(_input);
		}






		function JsonToCsv(_input, _config)
		{
			var _output = "";
			var _fields = [];

			// Default configuration

			/** whether to surround every datum with quotes */
			var _quotes = false;

			/** delimiting character */
			var _delimiter = ",";

			/** newline character(s) */
			var _newline = "\r\n";

			unpackConfig();

			if (typeof _input === 'string')
				_input = JSON.parse(_input);

			if (_input instanceof Array)
			{
				if (!_input.length || _input[0] instanceof Array)
					return serialize(null, _input);
				else if (typeof _input[0] === 'object')
					return serialize(objectKeys(_input[0]), _input);
			}
			else if (typeof _input === 'object')
			{
				if (typeof _input.data === 'string')
					_input.data = JSON.parse(_input.data);

				if (_input.data instanceof Array)
				{
					if (!_input.fields)
						_input.fields = _input.data[0] instanceof Array
										? _input.fields
										: objectKeys(_input.data[0]);

					if (!(_input.data[0] instanceof Array) && typeof _input.data[0] !== 'object')
						_input.data = [_input.data];	// handles input like [1,2,3] or ["asdf"]
				}

				return serialize(_input.fields || [], _input.data || []);
			}

			// Default (any valid paths should return before this)
			throw "exception: Unable to serialize unrecognized input";


			function unpackConfig()
			{
				if (typeof _config !== 'object')
					return;

				if (typeof _config.delimiter === 'string'
					&& _config.delimiter.length == 1
					&& Papa.BAD_DELIMITERS.indexOf(_config.delimiter) == -1)
				{
					_delimiter = _config.delimiter;
				}

				if (typeof _config.quotes === 'boolean'
					|| _config.quotes instanceof Array)
					_quotes = _config.quotes;

				if (typeof _config.newline === 'string')
					_newline = _config.newline;
			}


			/** Turns an object's keys into an array */
			function objectKeys(obj)
			{
				if (typeof obj !== 'object')
					return [];
				var keys = [];
				for (var key in obj)
					keys.push(key);
				return keys;
			}

			/** The double for loop that iterates the data and writes out a CSV string including header row */
			function serialize(fields, data)
			{
				var csv = "";

				if (typeof fields === 'string')
					fields = JSON.parse(fields);
				if (typeof data === 'string')
					data = JSON.parse(data);

				var hasHeader = fields instanceof Array && fields.length > 0;
				var dataKeyedByField = !(data[0] instanceof Array);

				// If there a header row, write it first
				if (hasHeader)
				{
					for (var i = 0; i < fields.length; i++)
					{
						if (i > 0)
							csv += _delimiter;
						csv += safe(fields[i], i);
					}
					if (data.length > 0)
						csv += _newline;
				}

				// Then write out the data
				for (var row = 0; row < data.length; row++)
				{
					var maxCol = hasHeader ? fields.length : data[row].length;

					for (var col = 0; col < maxCol; col++)
					{
						if (col > 0)
							csv += _delimiter;
						var colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
						csv += safe(data[row][colIdx], col);
					}

					if (row < data.length - 1)
						csv += _newline;
				}

				return csv;
			}

			/** Encloses a value around quotes if needed (makes a value safe for CSV insertion) */
			function safe(str, col)
			{
				if (typeof str === "undefined" || str === null)
					return "";

				str = str.toString().replace(/"/g, '""');

				var needsQuotes = (typeof _quotes === 'boolean' && _quotes)
								|| (_quotes instanceof Array && _quotes[col])
								|| hasAny(str, Papa.BAD_DELIMITERS)
								|| str.indexOf(_delimiter) > -1
								|| str.charAt(0) == ' '
								|| str.charAt(str.length - 1) == ' ';

				return needsQuotes ? '"' + str + '"' : str;
			}

			function hasAny(str, substrings)
			{
				for (var i = 0; i < substrings.length; i++)
					if (str.indexOf(substrings[i]) > -1)
						return true;
				return false;
			}
		}

		/** ChunkStreamer is the base prototype for various streamer implementations. */
		function ChunkStreamer(config)
		{
			this._handle = null;
			this._paused = false;
			this._finished = false;
			this._input = null;
			this._baseIndex = 0;
			this._partialLine = "";
			this._rowCount = 0;
			this._start = 0;
			this._nextChunk = null;
			this.isFirstChunk = true;
			this._completeResults = {
				data: [],
				errors: [],
				meta: {}
			};
			replaceConfig.call(this, config);

			this.parseChunk = function(chunk)
			{
				// First chunk pre-processing
				if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk))
				{
					var modifiedChunk = this._config.beforeFirstChunk(chunk);
					if (modifiedChunk !== undefined)
						chunk = modifiedChunk;
				}
				this.isFirstChunk = false;

				// Rejoin the line we likely just split in two by chunking the file
				var aggregate = this._partialLine + chunk;
				this._partialLine = "";

				var results = this._handle.parse(aggregate, this._baseIndex, !this._finished);
				
				if (this._handle.paused() || this._handle.aborted())
					return;
				
				var lastIndex = results.meta.cursor;
				
				if (!this._finished)
				{
					this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
					this._baseIndex = lastIndex;
				}

				if (results && results.data)
					this._rowCount += results.data.length;

				var finishedIncludingPreview = this._finished || (this._config.preview && this._rowCount >= this._config.preview);

				if (IS_PAPA_WORKER)
				{
					global.postMessage({
						results: results,
						workerId: Papa.WORKER_ID,
						finished: finishedIncludingPreview
					});
				}
				else if (isFunction(this._config.chunk))
				{
					this._config.chunk(results, this._handle);
					if (this._paused)
						return;
					results = undefined;
					this._completeResults = undefined;
				}

				if (!this._config.step && !this._config.chunk) {
					this._completeResults.data = this._completeResults.data.concat(results.data);
					this._completeResults.errors = this._completeResults.errors.concat(results.errors);
					this._completeResults.meta = results.meta;
				}

				if (finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted))
					this._config.complete(this._completeResults);

				if (!finishedIncludingPreview && (!results || !results.meta.paused))
					this._nextChunk();

				return results;
			};

			this._sendError = function(error)
			{
				if (isFunction(this._config.error))
					this._config.error(error);
				else if (IS_PAPA_WORKER && this._config.error)
				{
					global.postMessage({
						workerId: Papa.WORKER_ID,
						error: error,
						finished: false
					});
				}
			};

			function replaceConfig(config)
			{
				// Deep-copy the config so we can edit it
				var configCopy = copy(config);
				configCopy.chunkSize = parseInt(configCopy.chunkSize);	// parseInt VERY important so we don't concatenate strings!
				if (!config.step && !config.chunk)
					configCopy.chunkSize = null;  // disable Range header if not streaming; bad values break IIS - see issue #196
				this._handle = new ParserHandle(configCopy);
				this._handle.streamer = this;
				this._config = configCopy;	// persist the copy to the caller
			}
		}


		function NetworkStreamer(config)
		{
			config = config || {};
			if (!config.chunkSize)
				config.chunkSize = Papa.RemoteChunkSize;
			ChunkStreamer.call(this, config);

			var xhr;

			if (IS_WORKER)
			{
				this._nextChunk = function()
				{
					this._readChunk();
					this._chunkLoaded();
				};
			}
			else
			{
				this._nextChunk = function()
				{
					this._readChunk();
				};
			}

			this.stream = function(url)
			{
				this._input = url;
				this._nextChunk();	// Starts streaming
			};

			this._readChunk = function()
			{
				if (this._finished)
				{
					this._chunkLoaded();
					return;
				}

				xhr = new XMLHttpRequest();
				
				if (!IS_WORKER)
				{
					xhr.onload = bindFunction(this._chunkLoaded, this);
					xhr.onerror = bindFunction(this._chunkError, this);
				}

				xhr.open("GET", this._input, !IS_WORKER);
				
				if (this._config.chunkSize)
				{
					var end = this._start + this._config.chunkSize - 1;	// minus one because byte range is inclusive
					xhr.setRequestHeader("Range", "bytes="+this._start+"-"+end);
					xhr.setRequestHeader("If-None-Match", "webkit-no-cache"); // https://bugs.webkit.org/show_bug.cgi?id=82672
				}

				try {
					xhr.send();
				}
				catch (err) {
					this._chunkError(err.message);
				}

				if (IS_WORKER && xhr.status == 0)
					this._chunkError();
				else
					this._start += this._config.chunkSize;
			}

			this._chunkLoaded = function()
			{
				if (xhr.readyState != 4)
					return;

				if (xhr.status < 200 || xhr.status >= 400)
				{
					this._chunkError();
					return;
				}

				this._finished = !this._config.chunkSize || this._start > getFileSize(xhr);
				this.parseChunk(xhr.responseText);
			}

			this._chunkError = function(errorMessage)
			{
				var errorText = xhr.statusText || errorMessage;
				this._sendError(errorText);
			}

			function getFileSize(xhr)
			{
				var contentRange = xhr.getResponseHeader("Content-Range");
				return parseInt(contentRange.substr(contentRange.lastIndexOf("/") + 1));
			}
		}
		NetworkStreamer.prototype = Object.create(ChunkStreamer.prototype);
		NetworkStreamer.prototype.constructor = NetworkStreamer;


		function FileStreamer(config)
		{
			config = config || {};
			if (!config.chunkSize)
				config.chunkSize = Papa.LocalChunkSize;
			ChunkStreamer.call(this, config);

			var reader, slice;

			// FileReader is better than FileReaderSync (even in worker) - see http://stackoverflow.com/q/24708649/1048862
			// But Firefox is a pill, too - see issue #76: https://github.com/mholt/PapaParse/issues/76
			var usingAsyncReader = typeof FileReader !== 'undefined';	// Safari doesn't consider it a function - see issue #105

			this.stream = function(file)
			{
				this._input = file;
				slice = file.slice || file.webkitSlice || file.mozSlice;

				if (usingAsyncReader)
				{
					reader = new FileReader();		// Preferred method of reading files, even in workers
					reader.onload = bindFunction(this._chunkLoaded, this);
					reader.onerror = bindFunction(this._chunkError, this);
				}
				else
					reader = new FileReaderSync();	// Hack for running in a web worker in Firefox

				this._nextChunk();	// Starts streaming
			};

			this._nextChunk = function()
			{
				if (!this._finished && (!this._config.preview || this._rowCount < this._config.preview))
					this._readChunk();
			}

			this._readChunk = function()
			{
				var input = this._input;
				if (this._config.chunkSize)
				{
					var end = Math.min(this._start + this._config.chunkSize, this._input.size);
					input = slice.call(input, this._start, end);
				}
				var txt = reader.readAsText(input, this._config.encoding);
				if (!usingAsyncReader)
					this._chunkLoaded({ target: { result: txt } });	// mimic the async signature
			}

			this._chunkLoaded = function(event)
			{
				// Very important to increment start each time before handling results
				this._start += this._config.chunkSize;
				this._finished = !this._config.chunkSize || this._start >= this._input.size;
				this.parseChunk(event.target.result);
			}

			this._chunkError = function()
			{
				this._sendError(reader.error);
			}

		}
		FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
		FileStreamer.prototype.constructor = FileStreamer;


		function StringStreamer(config)
		{
			config = config || {};
			ChunkStreamer.call(this, config);

			var string;
			var remaining;
			this.stream = function(s)
			{
				string = s;
				remaining = s;
				return this._nextChunk();
			}
			this._nextChunk = function()
			{
				if (this._finished) return;
				var size = this._config.chunkSize;
				var chunk = size ? remaining.substr(0, size) : remaining;
				remaining = size ? remaining.substr(size) : '';
				this._finished = !remaining;
				return this.parseChunk(chunk);
			}
		}
		StringStreamer.prototype = Object.create(StringStreamer.prototype);
		StringStreamer.prototype.constructor = StringStreamer;



		// Use one ParserHandle per entire CSV file or string
		function ParserHandle(_config)
		{
			// One goal is to minimize the use of regular expressions...
			var FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;

			var self = this;
			var _stepCounter = 0;	// Number of times step was called (number of rows parsed)
			var _input;				// The input being parsed
			var _parser;			// The core parser being used
			var _paused = false;	// Whether we are paused or not
			var _aborted = false;   // Whether the parser has aborted or not
			var _delimiterError;	// Temporary state between delimiter detection and processing results
			var _fields = [];		// Fields are from the header row of the input, if there is one
			var _results = {		// The last results returned from the parser
				data: [],
				errors: [],
				meta: {}
			};

			if (isFunction(_config.step))
			{
				var userStep = _config.step;
				_config.step = function(results)
				{
					_results = results;

					if (needsHeaderRow())
						processResults();
					else	// only call user's step function after header row
					{
						processResults();

						// It's possbile that this line was empty and there's no row here after all
						if (_results.data.length == 0)
							return;

						_stepCounter += results.data.length;
						if (_config.preview && _stepCounter > _config.preview)
							_parser.abort();
						else
							userStep(_results, self);
					}
				};
			}

			/**
			 * Parses input. Most users won't need, and shouldn't mess with, the baseIndex
			 * and ignoreLastRow parameters. They are used by streamers (wrapper functions)
			 * when an input comes in multiple chunks, like from a file.
			 */
			this.parse = function(input, baseIndex, ignoreLastRow)
			{
				if (!_config.newline)
					_config.newline = guessLineEndings(input);

				_delimiterError = false;
				if (!_config.delimiter)
				{
					var delimGuess = guessDelimiter(input);
					if (delimGuess.successful)
						_config.delimiter = delimGuess.bestDelimiter;
					else
					{
						_delimiterError = true;	// add error after parsing (otherwise it would be overwritten)
						_config.delimiter = Papa.DefaultDelimiter;
					}
					_results.meta.delimiter = _config.delimiter;
				}

				var parserConfig = copy(_config);
				if (_config.preview && _config.header)
					parserConfig.preview++;	// to compensate for header row

				_input = input;
				_parser = new Parser(parserConfig);
				_results = _parser.parse(_input, baseIndex, ignoreLastRow);
				processResults();
				return _paused ? { meta: { paused: true } } : (_results || { meta: { paused: false } });
			};

			this.paused = function()
			{
				return _paused;
			};

			this.pause = function()
			{
				_paused = true;
				_parser.abort();
				_input = _input.substr(_parser.getCharIndex());
			};

			this.resume = function()
			{
				_paused = false;
				self.streamer.parseChunk(_input);
			};

			this.aborted = function () {
				return _aborted;
			}

			this.abort = function()
			{
				_aborted = true;
				_parser.abort();
				_results.meta.aborted = true;
				if (isFunction(_config.complete))
					_config.complete(_results);
				_input = "";
			};

			function processResults()
			{
				if (_results && _delimiterError)
				{
					addError("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '"+Papa.DefaultDelimiter+"'");
					_delimiterError = false;
				}

				if (_config.skipEmptyLines)
				{
					for (var i = 0; i < _results.data.length; i++)
						if (_results.data[i].length == 1 && _results.data[i][0] == "")
							_results.data.splice(i--, 1);
				}

				if (needsHeaderRow())
					fillHeaderFields();

				return applyHeaderAndDynamicTyping();
			}

			function needsHeaderRow()
			{
				return _config.header && _fields.length == 0;
			}

			function fillHeaderFields()
			{
				if (!_results)
					return;
				for (var i = 0; needsHeaderRow() && i < _results.data.length; i++)
					for (var j = 0; j < _results.data[i].length; j++)
						_fields.push(_results.data[i][j]);
				_results.data.splice(0, 1);
			}

			function applyHeaderAndDynamicTyping()
			{
				if (!_results || (!_config.header && !_config.dynamicTyping))
					return _results;

				for (var i = 0; i < _results.data.length; i++)
				{
					var row = {};

					for (var j = 0; j < _results.data[i].length; j++)
					{
						if (_config.dynamicTyping)
						{
							var value = _results.data[i][j];
							if (value == "true" || value == "TRUE")
								_results.data[i][j] = true;
							else if (value == "false" || value == "FALSE")
								_results.data[i][j] = false;
							else
								_results.data[i][j] = tryParseFloat(value);
						}

						if (_config.header)
						{
							if (j >= _fields.length)
							{
								if (!row["__parsed_extra"])
									row["__parsed_extra"] = [];
								row["__parsed_extra"].push(_results.data[i][j]);
							}
							else
								row[_fields[j]] = _results.data[i][j];
						}
					}

					if (_config.header)
					{
						_results.data[i] = row;
						if (j > _fields.length)
							addError("FieldMismatch", "TooManyFields", "Too many fields: expected " + _fields.length + " fields but parsed " + j, i);
						else if (j < _fields.length)
							addError("FieldMismatch", "TooFewFields", "Too few fields: expected " + _fields.length + " fields but parsed " + j, i);
					}
				}

				if (_config.header && _results.meta)
					_results.meta.fields = _fields;
				return _results;
			}

			function guessDelimiter(input)
			{
				var delimChoices = [",", "\t", "|", ";", Papa.RECORD_SEP, Papa.UNIT_SEP];
				var bestDelim, bestDelta, fieldCountPrevRow;

				for (var i = 0; i < delimChoices.length; i++)
				{
					var delim = delimChoices[i];
					var delta = 0, avgFieldCount = 0;
					fieldCountPrevRow = undefined;

					var preview = new Parser({
						delimiter: delim,
						preview: 10
					}).parse(input);

					for (var j = 0; j < preview.data.length; j++)
					{
						var fieldCount = preview.data[j].length;
						avgFieldCount += fieldCount;

						if (typeof fieldCountPrevRow === 'undefined')
						{
							fieldCountPrevRow = fieldCount;
							continue;
						}
						else if (fieldCount > 1)
						{
							delta += Math.abs(fieldCount - fieldCountPrevRow);
							fieldCountPrevRow = fieldCount;
						}
					}

					if (preview.data.length > 0)
						avgFieldCount /= preview.data.length;

					if ((typeof bestDelta === 'undefined' || delta < bestDelta)
						&& avgFieldCount > 1.99)
					{
						bestDelta = delta;
						bestDelim = delim;
					}
				}

				_config.delimiter = bestDelim;

				return {
					successful: !!bestDelim,
					bestDelimiter: bestDelim
				}
			}

			function guessLineEndings(input)
			{
				input = input.substr(0, 1024*1024);	// max length 1 MB

				var r = input.split('\r');

				if (r.length == 1)
					return '\n';

				var numWithN = 0;
				for (var i = 0; i < r.length; i++)
				{
					if (r[i][0] == '\n')
						numWithN++;
				}

				return numWithN >= r.length / 2 ? '\r\n' : '\r';
			}

			function tryParseFloat(val)
			{
				var isNumber = FLOAT.test(val);
				return isNumber ? parseFloat(val) : val;
			}

			function addError(type, code, msg, row)
			{
				_results.errors.push({
					type: type,
					code: code,
					message: msg,
					row: row
				});
			}
		}





		/** The core parser implements speedy and correct CSV parsing */
		function Parser(config)
		{
			// Unpack the config object
			config = config || {};
			var delim = config.delimiter;
			var newline = config.newline;
			var comments = config.comments;
			var step = config.step;
			var preview = config.preview;
			var fastMode = config.fastMode;

			// Delimiter must be valid
			if (typeof delim !== 'string'
				|| Papa.BAD_DELIMITERS.indexOf(delim) > -1)
				delim = ",";

			// Comment character must be valid
			if (comments === delim)
				throw "Comment character same as delimiter";
			else if (comments === true)
				comments = "#";
			else if (typeof comments !== 'string'
				|| Papa.BAD_DELIMITERS.indexOf(comments) > -1)
				comments = false;

			// Newline must be valid: \r, \n, or \r\n
			if (newline != '\n' && newline != '\r' && newline != '\r\n')
				newline = '\n';

			// We're gonna need these at the Parser scope
			var cursor = 0;
			var aborted = false;

			this.parse = function(input, baseIndex, ignoreLastRow)
			{
				// For some reason, in Chrome, this speeds things up (!?)
				if (typeof input !== 'string')
					throw "Input must be a string";

				// We don't need to compute some of these every time parse() is called,
				// but having them in a more local scope seems to perform better
				var inputLen = input.length,
					delimLen = delim.length,
					newlineLen = newline.length,
					commentsLen = comments.length;
				var stepIsFunction = typeof step === 'function';

				// Establish starting state
				cursor = 0;
				var data = [], errors = [], row = [], lastCursor = 0;

				if (!input)
					return returnable();

				if (fastMode || (fastMode !== false && input.indexOf('"') === -1))
				{
					var rows = input.split(newline);
					for (var i = 0; i < rows.length; i++)
					{
						var row = rows[i];
						cursor += row.length;
						if (i !== rows.length - 1)
							cursor += newline.length;
						else if (ignoreLastRow)
							return returnable();
						if (comments && row.substr(0, commentsLen) == comments)
							continue;
						if (stepIsFunction)
						{
							data = [];
							pushRow(row.split(delim));
							doStep();
							if (aborted)
								return returnable();
						}
						else
							pushRow(row.split(delim));
						if (preview && i >= preview)
						{
							data = data.slice(0, preview);
							return returnable(true);
						}
					}
					return returnable();
				}

				var nextDelim = input.indexOf(delim, cursor);
				var nextNewline = input.indexOf(newline, cursor);

				// Parser loop
				for (;;)
				{
					// Field has opening quote
					if (input[cursor] == '"')
					{
						// Start our search for the closing quote where the cursor is
						var quoteSearch = cursor;

						// Skip the opening quote
						cursor++;

						for (;;)
						{
							// Find closing quote
							var quoteSearch = input.indexOf('"', quoteSearch+1);

							if (quoteSearch === -1)
							{
								if (!ignoreLastRow) {
									// No closing quote... what a pity
									errors.push({
										type: "Quotes",
										code: "MissingQuotes",
										message: "Quoted field unterminated",
										row: data.length,	// row has yet to be inserted
										index: cursor
									});
								}
								return finish();
							}

							if (quoteSearch === inputLen-1)
							{
								// Closing quote at EOF
								var value = input.substring(cursor, quoteSearch).replace(/""/g, '"');
								return finish(value);
							}

							// If this quote is escaped, it's part of the data; skip it
							if (input[quoteSearch+1] == '"')
							{
								quoteSearch++;
								continue;
							}

							if (input[quoteSearch+1] == delim)
							{
								// Closing quote followed by delimiter
								row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
								cursor = quoteSearch + 1 + delimLen;
								nextDelim = input.indexOf(delim, cursor);
								nextNewline = input.indexOf(newline, cursor);
								break;
							}

							if (input.substr(quoteSearch+1, newlineLen) === newline)
							{
								// Closing quote followed by newline
								row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
								saveRow(quoteSearch + 1 + newlineLen);
								nextDelim = input.indexOf(delim, cursor);	// because we may have skipped the nextDelim in the quoted field

								if (stepIsFunction)
								{
									doStep();
									if (aborted)
										return returnable();
								}
								
								if (preview && data.length >= preview)
									return returnable(true);

								break;
							}
						}

						continue;
					}

					// Comment found at start of new line
					if (comments && row.length === 0 && input.substr(cursor, commentsLen) === comments)
					{
						if (nextNewline == -1)	// Comment ends at EOF
							return returnable();
						cursor = nextNewline + newlineLen;
						nextNewline = input.indexOf(newline, cursor);
						nextDelim = input.indexOf(delim, cursor);
						continue;
					}

					// Next delimiter comes before next newline, so we've reached end of field
					if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1))
					{
						row.push(input.substring(cursor, nextDelim));
						cursor = nextDelim + delimLen;
						nextDelim = input.indexOf(delim, cursor);
						continue;
					}

					// End of row
					if (nextNewline !== -1)
					{
						row.push(input.substring(cursor, nextNewline));
						saveRow(nextNewline + newlineLen);

						if (stepIsFunction)
						{
							doStep();
							if (aborted)
								return returnable();
						}

						if (preview && data.length >= preview)
							return returnable(true);

						continue;
					}

					break;
				}


				return finish();


				function pushRow(row)
				{
					data.push(row);
					lastCursor = cursor;
				}

				/**
				 * Appends the remaining input from cursor to the end into
				 * row, saves the row, calls step, and returns the results.
				 */
				function finish(value)
				{
					if (ignoreLastRow)
						return returnable();
					if (typeof value === 'undefined')
						value = input.substr(cursor);
					row.push(value);
					cursor = inputLen;	// important in case parsing is paused
					pushRow(row);
					if (stepIsFunction)
						doStep();
					return returnable();
				}

				/**
				 * Appends the current row to the results. It sets the cursor
				 * to newCursor and finds the nextNewline. The caller should
				 * take care to execute user's step function and check for
				 * preview and end parsing if necessary.
				 */
				function saveRow(newCursor)
				{
					cursor = newCursor;
					pushRow(row);
					row = [];
					nextNewline = input.indexOf(newline, cursor);
				}

				/** Returns an object with the results, errors, and meta. */
				function returnable(stopped)
				{
					return {
						data: data,
						errors: errors,
						meta: {
							delimiter: delim,
							linebreak: newline,
							aborted: aborted,
							truncated: !!stopped,
							cursor: lastCursor + (baseIndex || 0)
						}
					};
				}

				/** Executes the user's step function and resets data & errors. */
				function doStep()
				{
					step(returnable());
					data = [], errors = [];
				}
			};

			/** Sets the abort flag */
			this.abort = function()
			{
				aborted = true;
			};

			/** Gets the cursor position */
			this.getCharIndex = function()
			{
				return cursor;
			};
		}


		// If you need to load Papa Parse asynchronously and you also need worker threads, hard-code
		// the script path here. See: https://github.com/mholt/PapaParse/issues/87#issuecomment-57885358
		function getScriptPath()
		{
			var scripts = document.getElementsByTagName('script');
			return scripts.length ? scripts[scripts.length - 1].src : '';
		}

		function newWorker()
		{
			if (!Papa.WORKERS_SUPPORTED)
				return false;
			if (!LOADED_SYNC && Papa.SCRIPT_PATH === null)
				throw new Error(
					'Script path cannot be determined automatically when Papa Parse is loaded asynchronously. ' +
					'You need to set Papa.SCRIPT_PATH manually.'
				);
			var workerUrl = Papa.SCRIPT_PATH || AUTO_SCRIPT_PATH;
			// Append "papaworker" to the search string to tell papaparse that this is our worker.
			workerUrl += (workerUrl.indexOf('?') !== -1 ? '&' : '?') + 'papaworker';
			var w = new global.Worker(workerUrl);
			w.onmessage = mainThreadReceivedMessage;
			w.id = workerIdCounter++;
			workers[w.id] = w;
			return w;
		}

		/** Callback when main thread receives a message */
		function mainThreadReceivedMessage(e)
		{
			var msg = e.data;
			var worker = workers[msg.workerId];
			var aborted = false;

			if (msg.error)
				worker.userError(msg.error, msg.file);
			else if (msg.results && msg.results.data)
			{
				var abort = function() {
					aborted = true;
					completeWorker(msg.workerId, { data: [], errors: [], meta: { aborted: true } });
				};

				var handle = {
					abort: abort,
					pause: notImplemented,
					resume: notImplemented
				};

				if (isFunction(worker.userStep))
				{
					for (var i = 0; i < msg.results.data.length; i++)
					{
						worker.userStep({
							data: [msg.results.data[i]],
							errors: msg.results.errors,
							meta: msg.results.meta
						}, handle);
						if (aborted)
							break;
					}
					delete msg.results;	// free memory ASAP
				}
				else if (isFunction(worker.userChunk))
				{
					worker.userChunk(msg.results, handle, msg.file);
					delete msg.results;
				}
			}

			if (msg.finished && !aborted)
				completeWorker(msg.workerId, msg.results);
		}

		function completeWorker(workerId, results) {
			var worker = workers[workerId];
			if (isFunction(worker.userComplete))
				worker.userComplete(results);
			worker.terminate();
			delete workers[workerId];
		}

		function notImplemented() {
			throw "Not implemented.";
		}

		/** Callback when worker thread receives a message */
		function workerThreadReceivedMessage(e)
		{
			var msg = e.data;

			if (typeof Papa.WORKER_ID === 'undefined' && msg)
				Papa.WORKER_ID = msg.workerId;

			if (typeof msg.input === 'string')
			{
				global.postMessage({
					workerId: Papa.WORKER_ID,
					results: Papa.parse(msg.input, msg.config),
					finished: true
				});
			}
			else if ((global.File && msg.input instanceof File) || msg.input instanceof Object)	// thank you, Safari (see issue #106)
			{
				var results = Papa.parse(msg.input, msg.config);
				if (results)
					global.postMessage({
						workerId: Papa.WORKER_ID,
						results: results,
						finished: true
					});
			}
		}

		/** Makes a deep copy of an array or object (mostly) */
		function copy(obj)
		{
			if (typeof obj !== 'object')
				return obj;
			var cpy = obj instanceof Array ? [] : {};
			for (var key in obj)
				cpy[key] = copy(obj[key]);
			return cpy;
		}

		function bindFunction(f, self)
		{
			return function() { f.apply(self, arguments); };
		}

		function isFunction(func)
		{
			return typeof func === 'function';
		}
	})(typeof window !== 'undefined' ? window : this);


/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	var hasOwn = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;

	var isArray = function isArray(arr) {
		if (typeof Array.isArray === 'function') {
			return Array.isArray(arr);
		}

		return toStr.call(arr) === '[object Array]';
	};

	var isPlainObject = function isPlainObject(obj) {
		if (!obj || toStr.call(obj) !== '[object Object]') {
			return false;
		}

		var hasOwnConstructor = hasOwn.call(obj, 'constructor');
		var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
		// Not own constructor property must be Object
		if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		var key;
		for (key in obj) {/**/}

		return typeof key === 'undefined' || hasOwn.call(obj, key);
	};

	module.exports = function extend() {
		var options, name, src, copy, copyIsArray, clone,
			target = arguments[0],
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if (typeof target === 'boolean') {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
			target = {};
		}

		for (; i < length; ++i) {
			options = arguments[i];
			// Only deal with non-null/undefined values
			if (options != null) {
				// Extend the base object
				for (name in options) {
					src = target[name];
					copy = options[name];

					// Prevent never-ending loop
					if (target !== copy) {
						// Recurse if we're merging plain objects or arrays
						if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
							if (copyIsArray) {
								copyIsArray = false;
								clone = src && isArray(src) ? src : [];
							} else {
								clone = src && isPlainObject(src) ? src : {};
							}

							// Never move original objects, clone them
							target[name] = extend(deep, clone, copy);

						// Don't bring in undefined values
						} else if (typeof copy !== 'undefined') {
							target[name] = copy;
						}
					}
				}
			}
		}

		// Return the modified object
		return target;
	};



/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Molecule = __webpack_require__(4).Molecule;

	var fields = new Map();
	module.exports = fields;

	fields.set('oclid', Molecule.fromIDCode);
	fields.set('idcode', Molecule.fromIDCode);
	fields.set('smiles', Molecule.fromSmiles);
	fields.set('molfile', Molecule.fromMolfile);


/***/ }
/******/ ])
});
;