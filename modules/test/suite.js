// -*- indent-tabs-mode: t; tab-width: 4 -*- 
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is UxU - UnitTest.XUL.
 *
 * The Initial Developer of the Original Code is YUKI "Piro" Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2010-2016
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): YUKI "Piro" Hiroshi <shimoda@clear-code.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['TestSuite'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/inherit.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/jstimer.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/jsdeferred.js', ns);
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/assertions.js', ns);
Components.utils.import('resource://uxu-modules/test/mock.js', ns);
Components.utils.import('resource://uxu-modules/test/action.js', ns);
Components.utils.import('resource://uxu-modules/test/greasemonkey.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);
Components.utils.import('resource://uxu-modules/server/utils.js', ns);
Components.utils.import('resource://uxu-modules/mail/utils.js', ns);
Components.utils.import('resource://gre/modules/Promise.jsm');

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher);

var key = 'uxu-test-window-id'; 
var defaultURI, defaultType, defaultFeatures, defaultName, defaultArguments; 
	
function TestSuite(aOptions) 
{
	this.init(aOptions);
}

TestSuite.prototype = ns.inherit(ns.EventTarget.prototype, {
	
init : function(aOptions) 
{
	aOptions = aOptions || {};
	var aURI        = aOptions.uri;
	var aEnvCreator = aOptions.envCreator;
	var aBrowser    = aOptions.browser;

	let global = aBrowser ? aBrowser.ownerDocument.defaultView : null ;
	let utils = aEnvCreator ? aEnvCreator() :
								global ? new global.Object() :
								{};
	this.environment = ns.inherit(utils, { utils : utils });

	var baseURL = aURI.replace(/[^/]*$/, '');

	this.initListeners();

	this._utils = new ns.Utils();
	this._utils.fileURL = this.fileURL = aURI;
	this._utils.baseURL = this.baseURL = baseURL;
	this._utils.export(this, false);

	this.windowWatcherListeners = [];

    this.uniqueID = parseInt(Math.random() * 10000000000);
    this.testFrame = aBrowser;

	switch (this._utils.product)
	{
		case 'Firefox':
			defaultURI       = 'chrome://browser/content/browser.xul';
			defaultType      = 'navigator:browser';
			defaultFeatures  = 'chrome,all,dialog=no';
			defaultName      = '_blank';
			defaultArguments = ['about:blank'];
			this.attachGMUtils();
			break;

		case 'Thunderbird':
			defaultURI       = 'chrome://messenger/content/messenger.xul';
			defaultType      = null;
			defaultFeatures  = 'chrome,all,dialog=no';
			defaultName      = '_blank';
			defaultArguments = [];
			this.attachMailUtils();
			break;

		default:
			break;
	}

	this.attachAssertions();
	this.attachMock();
	this.attachActions();
	this.attachServerUtils();
	this.attachDeferred();

	this._utils.export(this.environment.utils, false, this, this.__proto__);
	this._utils.export(this.environment.utils, false, this, this);

	this.initVariables();
},
 
destroy : function() 
{
	if (this.greasemonkey) this.greasemonkey.destroy();
	this.fireEvent('Destroy', null);
	this.removeAllListeners();
	this.assert.removeListener(this);
	this.windowWatcherListeners.forEach(function(aWatcher) {
		this.removeWindowWatcher(aWatcher);
	}, this);
},
	
onFinish : function() 
{
	this.destroy();
},
 
onAssertionWarning : function(aEvent) 
{
	this.fireEvent('Warning', aEvent.data);
},
  
initVariables : function() 
{
	// __proto__で定義されたゲッタと同名の変数を定義できなくなってしまうため
	// ゲッタとセッタを自動設定するようにして問題を回避
	var _this = this;
	'gBrowser,contentWindow,content,contentDocument'.split(',')
		.forEach(function(aProperty) {
			_this.environment.__defineGetter__(aProperty, function() {
				return _this[aProperty];
			});
			_this.environment.__defineSetter__(aProperty, function setter(aValue) {
				this.__defineGetter__(aProperty, function() {
					return aValue;
				});
				this.__defineSetter__(aProperty, setter);
				return aValue;
			});
		});

	this.environment.Cc = Cc;
	this.environment.Ci = Ci;
	this.environment.Cr = Cr;

	this.environment.Application = '@mozilla.org/fuel/application;1' in Cc ?
									Cc['@mozilla.org/fuel/application;1'].getService(Ci.fuelIApplication) :
								'@mozilla.org/steel/application;1' in Cc ?
									Cc['@mozilla.org/steel/application;1'].getService(Ci.steelIApplication) :
									null ;

	/* backward compatibility for MozLab/MozUnit testcases */
	this.environment.TestCase      = ns.TestCase;
	this.environment.Specification = ns.TestCase;
	this.environment.mozlab = {
		mozunit : {
			TestCase      : ns.TestCase,
			Specification : ns.TestCase,
			assertions    : this.environment.assert
		}
	};
},
 
get utils() { return this; }, 
get gBrowser() { return this.getTestFrameOwner(); },
get contentWindow() { return this.getTestFrameOwner().contentWindow; },
get content() { return this.getTestFrameOwner().contentWindow; },
get contentDocument() { return this.getTestFrameOwner().contentDocument; },
 
attachAssertions : function() 
{
	var assert = new ns.Assertions();
	assert.export(this);
	assert.addListener(this);
},
 
attachActions : function() 
{
	var action = new ns.Action(this);
	action.export(this);
},
 
attachGMUtils : function() 
{
	var greasemonkey = new ns.GreasemonkeyUtils(this);
	greasemonkey.export(this);
},
 
attachMailUtils : function() 
{
	var mail = new ns.MailUtils(this);
	this.__defineGetter__('mail', function() {
		return mail;
	});
	this.__defineSetter__('mail', function(aValue) {
		return aValue;
	});
	this.addListener(mail);
},
 
attachServerUtils : function() 
{
	var serverUtils = new ns.ServerUtils(this.mockManager);
	this.__defineGetter__('serverUtils', function() {
		return serverUtils;
	});
	this.__defineSetter__('serverUtils', function(aValue) {
		return aValue;
	});

	this.sendMessage = ns.utils.bind(serverUtils.sendMessage, serverUtils);
	this.startListen = ns.utils.bind(serverUtils.startListen, serverUtils);

	this.getHttpServer =
		this.getHTTPServer =
			ns.utils.bind(serverUtils.getHttpServer, serverUtils);
	this.setUpHttpServer =
		this.setUpHTTPServer =
			function(aPort, aBasePath) {
				return serverUtils.setUpHttpServer(aPort, this.normalizeToFile(aBasePath));
			};
	this.tearDownHttpServer =
		this.tearDownHTTPServer =
			ns.utils.bind(serverUtils.tearDownHttpServer, serverUtils);
	this.tearDownAllHttpServers = this.tearDownAllHTTPServers =
		this.tearDownHttpServers = this.tearDownHTTPServers =
			ns.utils.bind(serverUtils.tearDownAllHttpServers, serverUtils);
	this.isHttpServerRunning =
		this.isHTTPServerRunning =
			ns.utils.bind(serverUtils.isHttpServerRunning, serverUtils);
},
 
attachMock : function() 
{
	this.mockManager = new ns.MockManager(this.assert);
	this.mockManager.export(this);
},
 
attachDeferred : function() 
{
	this.__defineGetter__('Deferred', function() {
		return ns.Deferred;
	});
},
 
// window management 
	
normalizeTestWindowOption : function(aOptions) 
{
	if (!aOptions) aOptions = {};
	if (!aOptions.uri && !aOptions.type) {
		aOptions.uri       = defaultURI || null;
		aOptions.type      = defaultType || null;
		aOptions.features  = defaultFeatures || 'chrome,all';
		aOptions.name      = defaultName || '_blank';
		aOptions.arguments = defaultArguments || [];
		if (!aOptions.uri)
			throw new Error('you must specify URI of the new chrome window!');
	}
	else {
		aOptions.type      = aOptions.type || null;
		aOptions.features  = aOptions.features || aOptions.flags || 'chrome,all';
		aOptions.name      = aOptions.name || '_blank';;
		aOptions.arguments = aOptions.arguments || [];
	}

	if (/(?:left|screenX)=([^,]+)/i.test(aOptions.features))
		aOptions.screenX = parseInt(RegExp.$1);
	if (/(?:top|screenY)=([^,]+)/i.test(aOptions.features))
		aOptions.screenY = parseInt(RegExp.$1);
	if (/width=([^,]+)/i.test(aOptions.features))
		aOptions.width = parseInt(RegExp.$1);
	if (/height=([^,]+)/i.test(aOptions.features))
		aOptions.height = parseInt(RegExp.$1);

	if (/^(jar:)?(https?|ftp|file|chrome|resource):/.test(aOptions.uri))
		while (aOptions.uri != (aOptions.uri = aOptions.uri.replace(/[^\/]+\/\.\.\//, ''))) {}

	return aOptions;
},
 
// テスト用のFirefoxウィンドウを取得する 
getTestWindow : function(aOptions)
{
	var info = this.normalizeTestWindowOption(aOptions);
	var targets = WindowManager.getEnumerator(info.type),
		target;
	while (targets.hasMoreElements())
	{
		target = targets.getNext().
			QueryInterface(Ci.nsIDOMWindow);
		if ('nsIDOMWindowInternal' in Ci) // for Firefox 7 or olders
			target = target.QueryInterface(Ci.nsIDOMWindowInternal);
		if (target[key] == target.location.href+'?'+this.uniqueID ||
			target.document.documentElement.getAttribute(key) == target.location.href+'?'+this.uniqueID)
			return target;
	}

	return null;
},
 
// テスト用のFirefoxウィンドウを開き直す 
reopenTestWindow : function(aOptions)
{
	var win = this.getTestWindow(aOptions);
	if (win) win.close();
	return this.openTestWindow(aOptions);
},
 
// テスト用のFirefoxウィンドウを開く 
openTestWindow : function(aOptions)
{
	var win = this.getTestWindow(aOptions);
	if (win) {
		win.focus();
		if (aCallback)
			aCallback(win);
		return Promise.resolve(win);
	}

	var info = this.normalizeTestWindowOption(aOptions);
	var args = info.arguments.length ? this._utils.toSupportsArray(info.arguments) : null ;
	win = WindowWatcher.openWindow(null, info.uri, info.name, info.features, args);
	var suiteID = this.uniqueID;
	var id = info.uri+'?'+suiteID;
	return new Promise(function(aResolve, aReject) {
		win.addEventListener('load', function onLoad() {
			win.removeEventListener('load', onLoad, false);
			win[key] = suiteID;
			win.document.documentElement.setAttribute(key, id);
			win.setTimeout(function() {
				if (aOptions) {
					if ('width' in aOptions || 'height' in aOptions) {
						win.resizeTo(aOptions.width || 10, aOptions.height || 10);
					}
					if ('screenX' in aOptions || 'x' in aOptions ||
				    	'screenY' in aOptions || 'y' in aOptions) {
						win.moveTo(aOptions.screenX || aOptions.x || 0,
						           aOptions.screenY || aOptions.y || 0);
					}
				}
				win.focus();
				aResolve(win);
			}, 0);
		}, false);
	});
},
 
// テスト用のFirefoxウィンドウを閉じる 
closeTestWindow : function(aOptions)
{
	var win = this.getTestWindow(aOptions);
	if (win) {
		win.close();
		return this._utils.wait(function() {
			return win.closed;
		});
	}
	return Promise.resolve();
},
 
setUpTestWindow : function(...aArgs)
{
	var continuation, options;
	if (aArgs.length > 1 &&
		typeof aArgs[0] == 'function') {
		continuation = aArgs[0];
		options = aArgs[1];
	}
	else {
		options = aArgs[0];
	}

	var win = this.getTestWindow(options);
	if (win) {
		if (continuation)
			continuation('ok');
		return Promise.resolve(win);
	}

	return this.openTestWindow(options)
			.then(function(aWindow) {
				if (continuation)
					continuation('ok');
				return aWindow;
			});
},
  
tearDownTestWindow : function(...aArgs) { return this.closeTestWindow.apply(this, aArgs); }, 
 
getChromeWindow : function(aOptions) 
{
	var windows = this.getChromeWindows(aOptions);
	return windows.length ? windows[0] : null ;
},
 
getChromeWindows : function(aOptions) 
{
	var info = this.normalizeTestWindowOption(aOptions);
	var targets = WindowManager.getEnumerator(info.type);
	var result = [];
	while (targets.hasMoreElements())
	{
		let target = targets.getNext().
			QueryInterface(Ci.nsIDOMWindow);
		if ('nsIDOMWindowInternal' in Ci) // for Firefox 7 or olders
			target = target.QueryInterface(Ci.nsIDOMWindowInternal);
		if (info.type)
			result.push(target);
		else if (info.uri == target.location.href)
			result.push(target);
	}

	return result;
},
  
// window watcher 
	
addWindowWatcher : function(aListener, aTargets) 
{
	if (!aListener) return;
	aListener = new WindowWatcherListener(aListener, aTargets, this);

	this.windowWatcherListeners.push(aListener);
	WindowWatcher.registerNotification(aListener);
},
 
removeWindowWatcher : function(aListener) 
{
	aListener = WindowWatcherListener.find(aListener, this.windowWatcherListeners);
	if (!aListener) return;
	try {
		WindowWatcher.unregisterNotification(aListener);
	}
	catch(e) {
		this.log(e);
	}
},
  
// load page 
	
_waitBrowserLoad : function(aTab, aBrowser) 
{
	if (aBrowser.localName == 'tabbrowser') {
		aTab = aBrowser.selectedTab;
		aBrowser = aTab.linkedBrowser;
	}
	var listener = {
		started : false,
		finished : false,
		timeoutTimer : null,
		stopTimer : function()
		{
			if (this.timeoutTimer) {
				ns.clearInterval(this.timeoutTimer);
				this.timeoutTimer = null;
			}
		},
		onProgressChange : function() {},
		onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
		{
			if (aStateFlags & Ci.nsIWebProgressListener.STATE_START &&
				aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) {
				this.started = true;
			}
			if (this.started &&
				aStateFlags & Ci.nsIWebProgressListener.STATE_STOP &&
				aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) {
				this.onFinish();
			}
		},
		onLocationChange : function() {},
		onStatusChange : function() {},
		onSecurityChange : function() {},
		QueryInterface : function(aIID)
		{
			if (aIID.equals(Ci.nsIWebProgressListener) ||
				aIID.equals(Ci.nsISupportsWeakReference) ||
				aIID.equals(Ci.nsISupports)) {
				return this;
			}
			throw Components.results.NS_NOINTERFACE;
		},
		onFinish : function()
		{
			if (this.finished) return;
			this.finished = true;

			this.stopTimer();

			aBrowser.removeProgressListener(listener);
			this.resolver();
		}
	};
	aBrowser.addProgressListener(listener);
	return new Promise((function(aResolve, aReject) {
		listener.resolver = aResolve;
		listener.rejector = aReject;
		listener.timeoutTimer = ns.setInterval((function() {
			if (!listener.started) {
				listener.onFinish();
			}
			else if (aBrowser.docShell.busyFlags == Ci.nsIDocShell.BUSY_FLAGS_NONE) {
				listener.stopTimer();
				this._utils.waitDOMEvent(
					aBrowser.contentWindow, 'load',
					100
				).then(function() {
					try {
						listener.onFinish();
					}
					catch(e) {
						throw e;
					}
					finally {
						listener.resolver = aResolve;
						listener.rejector = aReject;
					}
				});
			}
		}).bind(this), 100, this);
	}).bind(this));
},
 
// テスト用のFirefoxウィンドウの現在のタブにURIを読み込む 
loadURI : function(aURI, aOptions)
{
	if (!aOptions) aOptions = {};

	if (!aURI) aURI = 'about:blank';
	aURI = this.fixupIncompleteURI(aURI);

	var b = this.testFrame;
	if (!aOptions.inFrame) {
		let win = this.getTestWindow(aOptions);
		if (win) b = win.gBrowser;
	}
	if (!b)
		return Promise.resolve();

	return new Promise((function(aResolve, aReject) {
		b.stop();
		ns.setTimeout((function() {
			this._waitBrowserLoad(null, b)
				.then(aResolve)
				.catch(aReject);
			b.loadURI(aURI, aOptions.referrer || null);
		}).bind(this), 0);
	}).bind(this));
},
  
loadURIInTestFrame : function(aURI, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.inFrame = true;
	return this.loadURI(aURI, aOptions);
},
 
loadXULAsChrome : function(aURI, aOptions) 
{
	if (!aOptions) aOptions = {};
	aURI = this.fixupIncompleteURI(aURI);

	return this.loadURI(
		'chrome://uxu/content/lib/base.xul?'+encodeURIComponent(aURI),
		aOptions
	)
	.then((function() {
		var b = this.testFrame;
		if (!aOptions.inFrame) {
			let win = this.getTestWindow(aOptions);
			if (win) b = win.gBrowser;
		}
		if (!b)
			return win;

		return this._utils.deferredReplaceXULDocument(aURI, b.contentDocument);
	}).bind(this));
},
 
// テスト用のFirefoxウィンドウで新しいタブを開く 
addTab : function(aURI, aOptions)
{
	if (!aOptions) aOptions = {};

	if (this._utils.product != 'Firefox')
		return Promise.resolve(null);

	if (!aURI) aURI = 'about:blank';
	aURI = this.fixupIncompleteURI(aURI);

	var win = this.getTestWindow(aOptions);
	if (!win)
		return Promise.resolve(null);

	var tab = win.gBrowser.addTab();
	tab.linkedBrowser.stop();
	return new Promise((function(aResolve, aReject) {
		ns.setTimeout((function() {
			this._waitBrowserLoad(tab, tab.linkedBrowser)
				.then(function() {
					if (aOptions.selected)
						win.gBrowser.selectedTab = tab;
					aResolve(tab);
				})
				.catch(aReject);
			tab.linkedBrowser.loadURI(aURI, aOptions.referrer || null);
		}).bind(this), 0);
	}).bind(this));
},
  
getBrowser : function(aOptions) 
{
	if (this._utils.product != 'Firefox') return null;
	return this.getTestFrameOwner(aOptions);
},
 
getTestFrameOwner : function(aOptions) 
{
	var win = this.getTestWindow(aOptions);
	if (!win || !win.gBrowser) return this.testFrame;
	return win.gBrowser;
},
 
getTabs : function(aOptions) 
{
	if (this._utils.product != 'Firefox') return [];
	var win = this.getTestWindow(aOptions);
	if (!win) return [];
	return this._utils.$X('descendant::*[local-name()="tab"]', win.gBrowser.mTabContainer);
},
  
// override some functions of utils 
	
include : function(aSource, aEncoding, aNamespace) 
{
	var allowOverrideConstants = false;

	if (aSource &&
		aEncoding === void(0) &&
		aNamespace === void(0) &&
		typeof aSource == 'object') { // hash style options
		let options = aSource;
		aSource = options.source || options.uri || options.url ;
		aEncoding = options.encoding || options.charset;
		aNamespace = options.scope || options.namespace || options.nameSpace || options.ns;
		allowOverrideConstants = options.allowOverrideConstants;
	}
	else if (typeof aEncoding == 'object') { // for backward compatibility
		let scope = aEncoding;
		aEncoding = aNamespace;
		aNamespace = scope;
	}

	return this._utils.include({
			uri : aSource,
			encoding : aEncoding,
			namespace : (aNamespace || this.environment),
			allowOverrideConstants : allowOverrideConstants
		});
},
 
import : function(aSource, aNamespace) 
{
	return this._utils.import.call(this, aSource, aNamespace);
},
 
createDatabaseFromSQLFile : function(aFile, aEncoding, aNamespace) 
{
	if (aEncoding === void(0)) aEncoding = this._utils.getPref('extensions.uxu.defaultEncoding');
	return this._utils.createDatabaseFromSQLFile.call(this, aFile, aEncoding);
},
 
processTemplate : function(aCode, aNamespace) 
{
	var env = ns.inherit(this.environment, {});
	if (aNamespace) {
		for (var i in aNamespace)
		{
			if (aNamespace.hasOwnProperty(i))
				env[i] = aNamespace[i];
		}
	}
	var result = this._utils.processTemplate(aCode, env);
	env = null;
	return result;
},
parseTemplate : function(...aArgs) { return this.processTemplate.apply(this, aArgs); }, // for backward compatibility
 
$ : function(aNodeOrID, aOwner) 
{
	return this._utils.$(aNodeOrID, aOwner || this.getTestWindow() || this.content);
},
 
getBoxObjectFor : function(aNode) 
{
	if ('getBoxObjectFor' in aNode.ownerDocument)
		return aNode.ownerDocument.getBoxObjectFor(aNode);

	if (!('boxObject' in ns)) {
		Components.utils.import(
			'resource://uxu-modules/lib/boxObject.js',
			ns
		);
	}
	return ns
				.boxObject
				.getBoxObjectFor(aNode);
},
 
log : function(...aArgs) 
{
	var message = aArgs.join('\n');
	this._utils.log(message);
	this.fireEvent('Notify', message);
}
  
}); 
  
function WindowWatcherListener(aListener, aTargets, aSuite) 
{
	this.listener = aListener;
	this.targets = aTargets || this.defaultTargets;
	if (typeof this.targets == 'string')
		this.targets = [this.targets];
	this.suite = aSuite;
}

WindowWatcherListener.prototype = {
	observe : function(aSubject, aTopic, aData)
	{
		if (aSubject != '[object ChromeWindow]')
			return;

		aSubject = aSubject.QueryInterface(Ci.nsIDOMWindow);
		switch (aTopic)
		{
			case 'domwindowopened':
				aSubject.addEventListener('DOMContentLoaded', this, false);
				aSubject.addEventListener('load', this, false);
				return this.onListen(aSubject, aTopic, aData);

			case 'domwindowclosed':
				aSubject.removeEventListener('DOMContentLoaded', this, false);
				aSubject.removeEventListener('load', this, false);
				return this.onListen(aSubject, aTopic, aData);

			default:
				return;
		}
	},
	handleEvent : function(aEvent)
	{
		aEvent.currentTarget.removeEventListener(aEvent.type, this, false);
		this.onListen(aEvent.target.defaultView, aEvent.type, null, aEvent);
	},
	onListen : function(aWindow, aTopic, aData, aEvent)
	{
		if (this.targets.indexOf(aTopic) < 0)
			return;

		try {
			if (typeof this.listener == 'function')
				this.listener.call(this.suite, aWindow, aTopic);
			else if ('observe' in this.listener)
				this.listener.observe(aWindow, aTopic, aData);
			else if ('handleEvent' in this.listener)
				this.listener.handleEvent(
					aEvent ||
					{ type : aTopic,
					  target : aWindow,
					  originalTarget : aWindow,
					  currentTarget : aWindow }
				);
			else if ('on'+aTopic in this.listener)
				this.listener['on'+aTopic](aWindow);
		}
		catch(e) {
			this.suite.log(e);
		}
	},
	defaultTargets : ['load', 'domwindowclosed']
};
	
WindowWatcherListener.find = function(aListener, aListeners) { 
	for (var i in aListeners)
	{
		if (aListeners[i] == aListener ||
			aListeners[i].listener == aListener)
			return aListeners[i];
	}
	return null;
};
   
