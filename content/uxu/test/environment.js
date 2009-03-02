// -*- indent-tabs-mode: t; tab-width: 4 -*- 

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle     = lib_module.require('package', 'bundle');
var utils      = lib_module.require('package', 'utils');

var inherits = lib_module.require('class', 'event_target');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var assertions  = test_module.require('package', 'assertions');
var action      = test_module.require('package', 'action');

var server_module = new ModuleManager(['chrome://uxu/content/server']);

var mail_module = new ModuleManager(['chrome://uxu/content/mail']);
	
var key = 'uxu-test-window-id'; 
 
var defaultURI, defaultType, defaultFlags, defaultName; 
 
function constructor(aEnvironment, aURI, aBrowser) 
{
	this.initListeners();

	this.utils = this;

	this.__defineGetter__('fileURL', function() {
		return aURI;
	});
	var baseURL = aURI.replace(/[^/]*$/, '');
	this.__defineGetter__('baseURL', function() {
		return baseURL;
	});

	this.environment = aEnvironment || {};
    this.uniqueID = parseInt(Math.random() * 10000000000);

	this.__defineGetter__('_testFrame', function() {
		return aBrowser;
	});

	switch (utils.product)
	{
		case 'Firefox':
			defaultURI = 'chrome://browser/content/browser.xul';
			defaultType = 'navigator:browser';
			defaultFlags = 'chrome,all,dialog=no';
			defaultName = '_blank';
			this.attachGMUtils();
			break;

		case 'Thunderbird':
			defaultURI = 'chrome://messenger/content/messenger.xul';
			defaultType = null;
			defaultFlags = 'chrome,all,dialog=no';
			defaultName = '_blank';
			this.attachMailUtils();
			break;

		default:
			break;
	}

	this.tempFiles = [];
	this.backupPrefs = {};

	this.initVariables();
	this.attachFrames();
	this.attachAssertions();
	this.attachActions();
	this.attachServerUtils();
}
	
function destroy() 
{
	this.fireEvent('Destroy', null);
	this.removeAllListeners();
}
	
function onFinish() 
{
	this.destroy();
}
  
function initVariables() 
{
	// __proto__で定義されたゲッタと同名の変数を定義できなくなってしまうため
	// ゲッタとセッタを自動設定するようにして問題を回避
	var _this = this;
	'gBrowser,contentWindow,content,contentDocument'.split(',')
		.forEach(function(aProperty) {
			_this.environment.__defineGetter__(aProperty, function() {
				return _this[aProperty];
			});
			_this.environment.__defineSetter__(aProperty, function(aValue) {
				this.__defineGetter__(aProperty, function() {
					return aValue;
				});
				this.__defineSetter__(aProperty, arguments.callee);
				return aValue;
			});
		});

	this.environment.Cc = Cc;
	this.environment.Ci = Ci;
}
 
function attachFrames() 
{
	this.__defineGetter__('gBrowser', function() {
		return this.getTestFrameOwner();
	});
	this.__defineGetter__('contentWindow', function() {
		return this.getTestFrameOwner().contentWindow;
	});
	this.__defineGetter__('content', function() {
		return this.getTestFrameOwner().contentWindow;
	});
	this.__defineGetter__('contentDocument', function() {
		return this.getTestFrameOwner().contentDocument;
	});
}
 
function attachAssertions() 
{
	this.assert = {};
	this.assert.__proto__ = assertions;
	for (var aMethod in this.assert)
	{
		if (typeof this.assert[aMethod] != 'function') continue;
		(function(aMethod, aSelf, aObj, aPrefix) {
			var func = function() {
					return aObj[aMethod].apply(aObj, arguments);
				};
			aSelf[aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)] = func;
			if (aMethod.indexOf('is') == 0 && aMethod.substring(2))
				aSelf[aPrefix+aMethod.substring(2)] = func;
		})(aMethod, this, this.assert, 'assert');
	}
	this.ok = function() { this.assert.ok.apply(this, arguments); };
	this.is = function() { this.assert.is.apply(this, arguments); };
}
 
function attachActions() 
{
	this.action = {};
	this.action.__proto__ = action;
	for (var aMethod in this.action)
	{
		if (typeof this.assert[aMethod] != 'function') continue;
		(function(aMethod, aSelf, aObj, aPrefix) {
			var func = function() {
					return aObj[aMethod].apply(aObj, arguments);
				};
			aSelf[aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)] = func;
		})(aMethod, this, this.action, 'action');
	}
}
 
function attachGMUtils() 
{
	var GMUtils = test_module.require('class', 'greasemonkey');
	this.greasemonkey = {};
	this.greasemonkey.__proto__ = new GMUtils(this);
	for (var aMethod in this.greasemonkey)
	{
		if (typeof this.greasemonkey[aMethod] != 'function')
			continue;
		(function(aMethod, aSelf, aObj, aPrefix) {
			var func = function() {
					return aObj[aMethod].apply(aObj, arguments);
				};
			aSelf[
				aMethod.indexOf('GM_') == 0 ?
					aMethod :
					aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)
			] = func;
		})(aMethod, this, this.greasemonkey, 'greasemonkey');
	}
}
 
function attachMailUtils() 
{
	var MailUtils = mail_module.require('class', 'utils');
	this.mail = new MailUtils(this);
	this.addListener(this.mail);
}
 
function attachServerUtils() 
{
	var serverUtils = server_module.require('package', 'utils');
	this.sendMessage = function() {
		return serverUtils.sendMessage.apply(serverUtils, arguments);
	};
	this.startListen = function() {
		return serverUtils.startListen.apply(serverUtils, arguments);
	};
}
  
// window management 
	
var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1'] 
		.getService(Ci.nsIWindowMediator);
 
function normalizeTestWindowOption(aOptions) 
{
	if (!aOptions) aOptions = {};
	if (!aOptions.uri && !aOptions.type) {
		aOptions.uri   = defaultURI;
		aOptions.type  = defaultType;
		aOptions.flags = defaultFlags;
		aOptions.name  = defaultName;
		aOptions.arguments = [];
	}
	else {
		aOptions.type  = aOptions.type || null;
		aOptions.flags = aOptions.flags || 'chrome,all';
		aOptions.name  = aOptions.name || '_blank';;
		aOptions.arguments = aOptions.arguments || [];
	}
	return aOptions;
};
 
// テスト用のFirefoxウィンドウを取得する 
function getTestWindow(aOptions)
{
	var info = this.normalizeTestWindowOption(aOptions);
	var targets = WindowManager.getEnumerator(info.type),
		target;
	while (targets.hasMoreElements())
	{
		target = targets.getNext().
			QueryInterface(Ci.nsIDOMWindowInternal);
		if (target[key] == target.location.href+'?'+this.uniqueID ||
			target.document.documentElement.getAttribute(key) == target.location.href+'?'+this.uniqueID)
			return target;
	}

	return null;
};
 
// テスト用のFirefoxウィンドウを開き直す 
function reopenTestWindow(aOptions, callback)
{
	var win = this.getTestWindow(aOptions);
	if (win) win.close();
	return this.openTestWindow(aOptions, callback);
};
 
// テスト用のFirefoxウィンドウを開く 
function openTestWindow(aOptions, callback)
{
	var win = this.getTestWindow(aOptions);
	if (win) {
		if (callback) callback(win);
	}
	else {
		var info = this.normalizeTestWindowOption(aOptions);
		win = window.openDialog.apply(window, [info.uri, info.name, info.flags].concat(info.arguments));
		win[key] = this.uniqueID;
		var id = info.uri+'?'+this.uniqueID;
		win.addEventListener('load', function() {
			win.removeEventListener('load', arguments.callee, false);
			win.document.documentElement.setAttribute(key, id);
			if ('width' in aOptions || 'height' in aOptions) {
				win.resizeTo(aOptions.width || 10, aOptions.height || 10);
			}
			if ('screenX' in aOptions || 'x' in aOptions ||
			    'screenY' in aOptions || 'y' in aOptions) {
				win.moveTo(aOptions.screenX || aOptions.x || 0,
				           aOptions.screenY || aOptions.y || 0);
			}
			if (callback) {
				callback(win);
			}
		}, false);
	}
	return win;
};
 
// テスト用のFirefoxウィンドウを閉じる 
function closeTestWindow(aOptions)
{
	var win = this.getTestWindow(aOptions);
	if (win) win.close();
};
 
function setUpTestWindow(aContinuation, aOptions) 
{
	if (!aOptions) aOptions = {};
	if (aContinuation && typeof aContinuation != 'function') {
		for (var i in aContinuation)
		{
			aOptions[i] = aContinuation[i];
		}
		aContinuation = void(0);
	}
	var loadedFlag = { value : false };
	if (this.getTestWindow(aOptions)) {
		if (aContinuation) aContinuation("ok");
		loadedFlag.value = true;
	}
	else {
		this.openTestWindow(
			aOptions,
			function(win) {
				window.setTimeout(function() {
					if (aContinuation) aContinuation('ok');
					loadedFlag.value = true;
				}, 0);
			}
		);
	}
	return loadedFlag;
};
 
var tearDownTestWindow = closeTestWindow; 
 
function getChromeWindow(aOptions) 
{
	var windows = this.getChromeWindows(aOptions);
	return windows.length ? windows[0] : null ;
};
 
function getChromeWindows(aOptions) 
{
	var info = this.normalizeTestWindowOption(aOptions);
	var targets = WindowManager.getEnumerator(info.type);
	var result = [];
	while (targets.hasMoreElements())
	{
		let target = targets.getNext().
			QueryInterface(Ci.nsIDOMWindowInternal);
		if (info.type)
			result.push(target);
		else if (info.uri == target.location.href)
			result.push(target);
	}

	return result;
};
  
// load page 
	
function _waitBrowserLoad(aBrowser, aLoadedFlag, aOnComplete) 
{
	if (aBrowser.localName == 'tabbrowser') {
		aBrowser = aBrowser.selectedTab.linkedBrowser;
	}
	var listener = {
		started : false,
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
			aBrowser.removeProgressListener(listener);
			aLoadedFlag.value = true;
			if (aOnComplete && typeof aOnComplete == 'function')
				aOnComplete();
		}
	};
	aBrowser.addProgressListener(listener);
	window.setTimeout(function() {
		if (!listener.started) listener.onFinish();
	}, 0);
}
 
// テスト用のFirefoxウィンドウの現在のタブにURIを読み込む 
function loadURI(aURI, aOptions)
{
	if (!aOptions) aOptions = {};

	if (!aURI) aURI = 'about:blank';
	aURI = this.fixupIncompleteURI(aURI);

	var loadedFlag = { value : false };

	var b = this._testFrame;
	if (!aOptions.inFrame) {
		var win = this.getTestWindow(aOptions);
		if (win) b = win.gBrowser;
	}
	if (!b) return { value : true };
	b.stop();
	window.setTimeout(function() {
		_waitBrowserLoad(b, loadedFlag);
		b.loadURI(aURI);
	}, 0);

	return loadedFlag;
};
 
function loadURIInTestFrame(aURI) 
{
	return this.loadURI(aURI, { inFrame : true });
}
 
// テスト用のFirefoxウィンドウで新しいタブを開く 
function addTab(aURI, aOptions)
{
	if (!aOptions) aOptions = {};

	if (utils.product != 'Firefox') return { value : true, tab : null };

	if (!aURI) aURI = 'about:blank';
	aURI = this.fixupIncompleteURI(aURI);

	var loadedFlag = { value : false, tab : null };

	var win = this.getTestWindow(aOptions);
	if (!win) return null;

	var tab = win.gBrowser.addTab();
	tab.linkedBrowser.stop();
	window.setTimeout(function() {
		_waitBrowserLoad(tab.linkedBrowser, loadedFlag, function() {
			loadedFlag.tab = tab;
			if (aOptions.selected) {
				win.gBrowser.selectedTab = tab;
			}
		});
		tab.linkedBrowser.loadURI(aURI);
	}, 0);

	return loadedFlag;
};
 
function getBrowser(aOptions) 
{
	if (utils.product != 'Firefox') return null;
	return this.getTestFrameOwner(aOptions);
};
 
function getTestFrameOwner(aOptions) 
{
	var win = this.getTestWindow(aOptions);
	if (!win || !win.gBrowser) return this._testFrame;
	return win.gBrowser;
};
 
function getTabs(aOptions) 
{
	if (utils.product != 'Firefox') return [];
	var win = this.getTestWindow(aOptions);
	if (!win) return [];
	return utils.$X('descendant::*[local-name()="tab"]', win.gBrowser.mTabContainer);
};
  
// file operations 
	
function makeTempFile(aOriginal, aCosmetic) 
{
	var temp = utils.getFileFromKeyword('TmpD');
	if (aOriginal) {
		if (typeof aOriginal == 'string') {
			aOriginal = this.fixupIncompleteURI(aOriginal);
			if (aOriginal.match(/^\w+:\/\//))
				aOriginal = this.makeURIFromSpec(aOriginal);
			else
				aOriginal = this.makeFileWithPath(aOriginal);
		}
		try {
			aOriginal = aOriginal.QueryInterface(Ci.nsILocalFile)
		}
		catch(e) {
			aOriginal = this.getFileFromURLSpec(aOriginal.spec);
		}
		temp.append(aOriginal.leafName + '.tmp');
		temp.createUnique(
			(aOriginal.isDirectory() ? temp.DIRECTORY_TYPE : temp.NORMAL_FILE_TYPE ),
			(aOriginal.isDirectory() ? 0777 : 0666)
		);
		temp.remove(true);

		if (aCosmetic)
			utils.cosmeticClone(aOriginal, temp.parent, temp.leafName);
		else
			aOriginal.copyTo(temp.parent, temp.leafName);

		this.tempFiles.push(temp);
		return temp;
	}
	else {
		temp.append('uxu.tmp');
		temp.createUnique(temp.NORMAL_FILE_TYPE, 0666);
		this.tempFiles.push(temp);
		return temp;
	}
};
 
function cleanUpTempFiles() 
{
	this.tempFiles.forEach(function(aFile) {
		try {
			aFile.remove(true);
		}
		catch(e) {
			dump(e+'\n');
		}
	});
	this.tempFiles = [];
};
  
// prefs 
	
function cleanUpModifiedPrefs() 
{
	for (var i in this.backupPrefs)
	{
		if (this.backupPrefs[i] === null)
			this.clearPref(i);
		else
			this.setPref(i, this.backupPrefs[i]);
	}
	this.backupPrefs = {};
};
  
// utils 
	
function include(aSource, aEnvironment, aEncoding) 
{
	return utils.include.call(this, aSource, (aEnvironment || this.environment), aEncoding);
};
 
function $(aNodeOrID, aOwner) 
{
	return utils.$(aNodeOrID, aOwner || this.getTestWindow() || this.content);
}
  
var _this = this; 
<><![CDATA[
$X
makeURIFromSpec
makeFileWithPath
normalizeToFile
getFileFromURL
getFileFromURLSpec
getFileFromKeyword
getFilePathFromURL
getFilePathFromURLSpec
getFilePathFromKeyword
getURLFromFile
getURLFromFilePath
getURLSpecFromFile
getURLSpecFromFilePath
readFrom
writeTo
cosmeticClone
scheduleToRemove
startScheduledRemove
stopScheduledRemove
getPref
setPref
clearPref
loadPrefs
getClipBoard
setClipBoard
UTF8ToUnicode
UnicodeToUTF8
UTF8ToUCS2
UCS2ToUTF8
XToUnicode
UnicodeToX
XToUCS2
UCS2ToX
fixupIncompleteURI
doIteration
Do
inspect
inspectDOMNode
p
product
productExecutable
getInstalledLocationOfProduct
log
dump
notify
]]></>.toString()
.replace(/^\s+|\s+$/g, '')
.split('\n')
.forEach(function(aFunc) {
	if (typeof utils[aFunc] == 'function') {
		_this[aFunc] = utils[aFunc];
	}
	else {
		_this.__defineGetter__(aFunc, function() {
			return utils[aFunc];
		});
	}
});
  
