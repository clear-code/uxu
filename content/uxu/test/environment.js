// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle     = lib_module.require('package', 'bundle');
var utils      = lib_module.require('package', 'utils');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var assertions  = test_module.require('package', 'assertions');
var action      = test_module.require('package', 'action');
var GMUtils     = test_module.require('class', 'greasemonkey');


var key = 'uxu-test-window-id';

function constructor(aEnvironment, aURI, aBrowser)
{
	this.utils = this;

	this.fileURL = aURI;
	this.baseURL = this.fileURL.replace(/[^/]*$/, '');

	this.environment = aEnvironment || {};
    this.uniqueID = parseInt(Math.random() * 10000000000);

	this.__defineGetter__('_testFrame', function() {
		return aBrowser;
	});
	this.__defineGetter__('gBrowser', function() {
		return this.getBrowser();
	});
	this.__defineGetter__('contentWindow', function() {
		return this.getBrowser().contentWindow;
	});
	this.__defineGetter__('content', function() {
		return this.getBrowser().contentWindow;
	});
	this.__defineGetter__('contentDocument', function() {
		return this.getBrowser().contentDocument;
	});

	this.tempFiles = [];
	this.backupPrefs = {};

	this.initVariables();
	this.attachAssertions();
	this.attachActions();
	this.attachGMUtils();
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
			if (aMethod.indexOf('is') == 0)
				aSelf[aPrefix+aMethod.substring(2)] = func;
		})(aMethod, this, this.assert, 'assert');
	}
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




var XULAppInfo = Cc['@mozilla.org/xre/app-info;1']
	.getService(Ci.nsIXULAppInfo);
var defaultURI, defaultType, defaultFlags, defaultName;
switch (XULAppInfo.ID)
{
	default:
	case '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}':
		defaultURI = 'chrome://browser/content/browser.xul';
		defaultType = 'navigator:browser';
		defaultFlags = 'chrome,all,dialog=no';
		defaultName = '_blank';
		break;

	case '{3550f703-e582-4d05-9a08-453d09bdfdc6}':
		defaultURI = 'chrome://messenger/content/messenger.xul';
		defaultType = null;
		defaultFlags = 'chrome,all,dialog=no';
		defaultName = '_blank';
		break;
}


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
		if (callback) {
			win.addEventListener('load', function() {
				win.removeEventListener('load', arguments.callee, false);
				win.document.documentElement.setAttribute(key, id);
				callback(win);
			}, false);
		}
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



// テスト用のFirefoxウィンドウの現在のタブにURIを読み込む
function loadURI(aURI, aOptions)
{
	if (!aURI) aURI = 'about:blank';
	aURI = this.fixupIncompleteURI(aURI);

	var loadedFlag = { value : false };

	var b = this._testFrame;
	if (!aOptions || !aOptions.inFrame) {
		var win = this.getTestWindow(aOptions);
		if (win) b = win.gBrowser;
	}
	b.addEventListener('load', function() {
		b.removeEventListener('load', arguments.callee, true);
		loadedFlag.value = true;
	}, true);
	b.loadURI(aURI);

	return loadedFlag;
};

function loadURIInTestFrame(aURI)
{
	return this.loadURI(aURI, { inFrame : true });
}


// テスト用のFirefoxウィンドウで新しいタブを開く
function addTab(aURI, aOptions)
{
	if (!aURI) aURI = 'about:blank';
	aURI = this.fixupIncompleteURI(aURI);

	var loadedFlag = { value : false, tab : null };

	var win = this.getTestWindow(aOptions);
	if (!win) return null;

	var tab = win.gBrowser.addTab();
	tab.linkedBrowser.addEventListener('load', function() {
		tab.linkedBrowser.removeEventListener('load', arguments.callee, true);
		loadedFlag.value = true;
		loadedFlag.tab = tab;
	}, true);
	tab.linkedBrowser.loadURI(aURI);

	return loadedFlag;
};

function getBrowser(aOptions)
{
	var win = this.getTestWindow(aOptions);
	if (!win) return this._testFrame;
	return win.gBrowser;
};

function getTabs(aOptions)
{
	var win = this.getTestWindow(aOptions);
	if (!win) return null;
	return win.gBrowser.mTabContainer.childNodes;
};



function getChromeWindows(aOptions)
{
	var info = this.normalizeTestWindowOption(aOptions);
	var targets = WindowManager.getEnumerator(info.type),
		target;
	var result = [];
	while (targets.hasMoreElements())
	{
		target = targets.getNext().
			QueryInterface(Ci.nsIDOMWindowInternal);
		if (info.type)
			result.push(target);
		else if (info.uri == target.location.href)
			result.push(target);
	}

	return result;
};



function makeTempFile(aOriginal)
{
	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	var temp = DirectoryService.get('TmpD', Ci.nsIFile);
	var random = parseInt(Math.random() * 10000);

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
		temp.append(aOriginal.leafName + '.' + random + '.tmp');
		if (temp.exists()) temp.remove(true);
		aOriginal.copyTo(temp.parent, temp.leafName);
		this.tempFiles.push(temp);
		return temp;
	}
	else {
		temp.append('uxutemp' + parseInt(Math.random() * 10000) + '.tmp');
		if (temp.exists()) temp.remove(true);
		temp.create(temp.NORMAL_FILE_TYPE, 0666);
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



var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
		.getService(Ci.mozIJSSubScriptLoader);

function include(aSource, aEnvironment, aEncoding)
{
	aSource = this.fixupIncompleteURI(aSource);
	var encoding = aEncoding || this.getPref('extensions.uxu.defaultEncoding')
	var script = this.readFrom(aSource, encoding) || '';
	var env = aEnvironment || this.environment;
	env._lastEvaluatedScript = script;
	loader.loadSubScript(
		'chrome://uxu/content/lib/subScriptRunner.js?includeSource='+
			encodeURIComponent(aSource)+
			';encoding='+encoding,
		env
	);
};




var _this = this;
<><![CDATA[
makeURIFromSpec
makeFileWithPath
getFileFromURLSpec
getFilePathFromURLSpec
normalizeToFile
getURLFromFilePath
getURLSpecFromFilePath
readFrom
writeTo
getPref
setPref
clearPref
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
p
scheduleToRemove
startScheduledRemove
stopScheduledRemove
log
dump
]]></>.toString()
.replace(/^\s+|\s+$/g, '')
.split('\n')
.forEach(function(aFunc) {
	_this[aFunc] = utils[aFunc];
});
