// -*- indent-tabs-mode: t; tab-width: 4 -*- 

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle     = lib_module.require('package', 'bundle');
var utils      = lib_module.require('package', 'utils');

var inherits = lib_module.require('class', 'event_target');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var action      = test_module.require('package', 'action');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var mail_module = new ModuleManager(['chrome://uxu/content/mail']);
var ServerUtils = server_module.require('class', 'utils');
	
var key = 'uxu-test-window-id'; 
 
var defaultURI, defaultType, defaultFeatures, defaultName; 
 
function constructor(aEnvironment, aURI, aBrowser) 
{
	this.tempFiles = [];

	this.__defineGetter__('utils', function() {
		return this;
	});

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
			defaultURI      = 'chrome://browser/content/browser.xul';
			defaultType     = 'navigator:browser';
			defaultFeatures = 'chrome,all,dialog=no';
			defaultName     = '_blank';
			this.attachGMUtils();
			break;

		case 'Thunderbird':
			defaultURI      = 'chrome://messenger/content/messenger.xul';
			defaultType     = null;
			defaultFeatures = 'chrome,all,dialog=no';
			defaultName     = '_blank';
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
	if (this.greasemonkey) this.greasemonkey.destroy();
	this.fireEvent('Destroy', null);
	this.removeAllListeners();
	this.assert.removeListener(this);
}
	
function onFinish() 
{
	this.destroy();
}
 
function onAssertionWarning(aEvent) 
{
	this.fireEvent('Warning', aEvent.data);
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
	var Assertions  = test_module.require('class', 'assertions');
	var assert = {};
	assert.__proto__ = new Assertions();
	this.__defineGetter__('assert', function() {
		return assert;
	});
	this.__defineSetter__('assert', function(aValue) {
		return aValue;
	});
	assert.addListener(this);
	for (var aMethod in assert)
	{
		if (typeof assert[aMethod] != 'function') continue;
		(function(aMethod, aSelf, aObj, aPrefix) {
			var func = function() {
					return aObj[aMethod].apply(aObj, arguments);
				};
			aSelf[aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)] = func;
			if (aMethod.indexOf('is') == 0 && aMethod.substring(2))
				aSelf[aPrefix+aMethod.substring(2)] = func;
		})(aMethod, this, assert, 'assert');
	}
	this.ok = function() { assert.ok.apply(this, arguments); };
	this.is = function() { assert.is.apply(this, arguments); };
}
 
function attachActions() 
{
	var actionInstance = {};
	actionInstance.__proto__ = action;
	this.__defineGetter__('action', function() {
		return actionInstance;
	});
	this.__defineSetter__('action', function(aValue) {
		return aValue;
	});
	for (var aMethod in actionInstance)
	{
		if (typeof actionInstance[aMethod] != 'function') continue;
		(function(aMethod, aSelf, aObj, aPrefix) {
			var func = function() {
					return aObj[aMethod].apply(aObj, arguments);
				};
			aSelf[aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)] = func;
		})(aMethod, this, actionInstance, 'action');
	}
}
 
function attachGMUtils() 
{
	var GMUtils = test_module.require('class', 'greasemonkey');
	var greasemonkey = {};
	greasemonkey.__proto__ = new GMUtils(this);
	this.__defineGetter__('greasemonkey', function() {
		return greasemonkey;
	});
	this.__defineSetter__('greasemonkey', function(aValue) {
		return aValue;
	});
	for (var aMethod in greasemonkey)
	{
		if (typeof greasemonkey[aMethod] != 'function')
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
		})(aMethod, this, greasemonkey, 'greasemonkey');
	}
}
 
function attachMailUtils() 
{
	var MailUtils = mail_module.require('class', 'utils');
	var mail = {};
	mail.__proto__ = new MailUtils(this);
	this.__defineGetter__('mail', function() {
		return mail;
	});
	this.__defineSetter__('mail', function(aValue) {
		return aValue;
	});
	this.addListener(mail);
}
 
function attachServerUtils() 
{
	var serverUtils = {};
	serverUtils.__proto__ = new ServerUtils();
	this.__defineGetter__('serverUtils', function() {
		return serverUtils;
	});
	this.__defineSetter__('serverUtils', function(aValue) {
		return aValue;
	});

	this.sendMessage = function() {
		return serverUtils.sendMessage.apply(serverUtils, arguments);
	};
	this.startListen = function() {
		return serverUtils.startListen.apply(serverUtils, arguments);
	};

	this.setUpHttpServer = function(aPort, aBasePath) {
		return serverUtils.setUpHttpServer(aPort, this.normalizeToFile(aBasePath));
	};
	this.tearDownHttpServer = function(aPort) {
		return serverUtils.tearDownHttpServer(aPort);
	};
	this.tearDownAllHttpServers = function(aPort) {
		return serverUtils.tearDownAllHttpServers();
	};
}
  
// window management 
	
var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1'] 
		.getService(Ci.nsIWindowMediator);
 
function normalizeTestWindowOption(aOptions) 
{
	if (!aOptions) aOptions = {};
	if (!aOptions.uri && !aOptions.type) {
		aOptions.uri       = defaultURI;
		aOptions.type      = defaultType;
		aOptions.features  = defaultFeatures;
		aOptions.name      = defaultName;
		aOptions.arguments = [];
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
function reopenTestWindow(aOptions, aCallback)
{
	var win = this.getTestWindow(aOptions);
	if (win) win.close();
	return this.openTestWindow(aOptions, aCallback);
};
 
// テスト用のFirefoxウィンドウを開く 
function openTestWindow(aOptions, aCallback)
{
	var win = this.getTestWindow(aOptions);
	if (win) {
		win.focus();
		if (aCallback) aCallback(win);
	}
	else {
		var info = this.normalizeTestWindowOption(aOptions);
		win = window.openDialog.apply(window, [info.uri, info.name, info.features].concat(info.arguments));
		win[key] = this.uniqueID;
		var id = info.uri+'?'+this.uniqueID;
		win.addEventListener('load', function() {
			win.removeEventListener('load', arguments.callee, false);
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
				if (aCallback) {
					aCallback(win);
				}
			}, 0);
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
	
function _waitBrowserLoad(aTab, aBrowser, aLoadedFlag, aOnComplete) 
{
	if (aBrowser.localName == 'tabbrowser') {
		aTab = aBrowser.selectedTab;
		aBrowser = aTab.linkedBrowser;
	}
	var listener = {
		started : false,
		finished : false,
		isTabComplete : function() {
			return (aTab && aTab.getAttribuet('busy') != 'true');
		},
		onProgressChange : function() {
			if (this.isTabComplete())
				this.onFinish()
		},
		onStateChange : function(aWebProgress, aRequest, aStateFlags, aStatus)
		{
			if (aStateFlags & Ci.nsIWebProgressListener.STATE_START &&
				aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK) {
				this.started = true;
			}
			if (
				(
					this.started &&
					aStateFlags & Ci.nsIWebProgressListener.STATE_STOP &&
					aStateFlags & Ci.nsIWebProgressListener.STATE_IS_NETWORK
				) ||
				this.isTabComplete()
				) {
				this.onFinish();
			}
		},
		onLocationChange : function() {
			if (this.isTabComplete())
				this.onFinish()
		},
		onStatusChange : function() {
			if (this.isTabComplete())
				this.onFinish()
		},
		onSecurityChange : function() {
			if (this.isTabComplete())
				this.onFinish()
		},
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
			aBrowser.removeProgressListener(listener);
			aLoadedFlag.value = true;
			if (aOnComplete && typeof aOnComplete == 'function')
				aOnComplete();
		}
	};
	aBrowser.addProgressListener(listener);
	var checkFinish = function() {
		if (!listener.started || listener.isTabComplete())
			listener.onFinish();
	};
	window.setTimeout(checkFinish, 0);
	window.setTimeout(checkFinish, 500); // 0ミリ秒だと検出できない場合があるので念のため
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
		_waitBrowserLoad(null, b, loadedFlag);
		b.loadURI(aURI, aOptions.referrer || null);
	}, 0);

	return loadedFlag;
};
 
function loadURIInTestFrame(aURI, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.inFrame = true;
	return this.loadURI(aURI, aOptions);
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
		_waitBrowserLoad(tab, tab.linkedBrowser, loadedFlag, function() {
			loadedFlag.tab = tab;
			if (aOptions.selected) {
				win.gBrowser.selectedTab = tab;
			}
		});
		tab.linkedBrowser.loadURI(aURI, aOptions.referrer || null);
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
	
function include(aSource, aEncoding, aScope) 
{
	if (typeof aEncoding == 'object') { // for backward compatibility
		var scope = aEncoding;
		aEncoding = aScope;
		aScope = scope;
	}
	return utils.include.call(this, aSource, aEncoding, (aScope || this.environment));
};
 
function createDatabaseFromSQLFile(aFile, aEncoding, aScope) 
{
	if (aEncoding === void(0)) aEncoding = utils.getPref('extensions.uxu.defaultEncoding');
	return utils.createDatabaseFromSQLFile.call(this, aFile, aEncoding);
};
 
function processTemplate(aCode, aScope) 
{
	var env = {};
	if (aScope) {
		for (var i in aScope)
		{
			if (aScope.hasOwnProperty(i))
				env[i] = aScope[i];
		}
	}
	env.__proto__ = this.environment;
	var result = utils.processTemplate(aCode, env);
	env.__proto__ = void(0);
	env = null;
	return result;
}
var parseTemplate = processTemplate; // for backward compatibility
 
function $(aNodeOrID, aOwner) 
{
	return utils.$(aNodeOrID, aOwner || this.getTestWindow() || this.content);
}
 
function getBoxObjectFor(aNode) 
{
	if ('getBoxObjectFor' in aNode.ownerDocument)
		return aNode.ownerDocument.getBoxObjectFor(aNode);

	if (!('window' in _boxObjectModule)) {
		Components.utils.import(
			'resource://uxu-modules/boxObject.js',
			_boxObjectModule
		);
	}
	return _boxObjectModule
				.window['piro.sakura.ne.jp']
				.boxObject
				.getBoxObjectFor(aNode);
}
var _boxObjectModule = {};
 
function log() 
{
	var message = Array.slice(arguments).join('\n');
	utils.log(message);
	this.fireEvent('Notify', message);
}
  
var _this = this; 
<><![CDATA[
$X
checkApplicationVersion
checkAppVersion
cleanUpTempFiles
clearPref
clearWindowsRegistry
compareVersions
computeHash
computeHashFromFile
cosmeticClone
createDatabase
createDatabaseFromSQL
createTempDir
createTempDirectory
createTempFile
createTempFolder
Do
doIteration
dump
evalInSandbox
fixupIncompleteURI
getClipBoard
getFileFromKeyword
getFileFromPath
getFileFromURL
getFileFromURLSpec
getFilePathFromKeyword
getFilePathFromURL
getFilePathFromURLSpec
getInstalledLocationOfProduct
getPref
getStackTrace
getURLFromFile
getURLFromFilePath
getURLSpecFromFile
getURLSpecFromFilePath
getWindowsRegistry
inspect
inspectDOMNode
loadPrefs
makeFileWithPath
makeTempDir
makeTempDirectory
makeTempFile
makeTempFolder
makeURIFromSpec
md2
md2FromFile
md5
md5FromFile
normalizeToFile
notify
openDatabase
p
parseCSV
parseTSV
product
productExecutable
productVersion
readCSV
readTSV
readFrom
readJSON
readParamFromCSV
readParamFromTSV
readParamsFromCSV
readParamsFromTSV
readParameterFromCSV
readParameterFromTSV
readParametersFromCSV
readParametersFromTSV
scheduleToRemove
setClipBoard
setPref
setWindowsRegistry
sha1
sha1FromFile
sha256
sha256FromFile
sha384
sha384FromFile
sha512
sha512FromFile
sleep
startScheduledRemove
stopScheduledRemove
UCS2ToUTF8
UCS2ToX
UnicodeToUTF8
UnicodeToX
UTF8ToUCS2
UTF8ToUnicode
writeTo
XToUCS2
XToUnicode
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
  
