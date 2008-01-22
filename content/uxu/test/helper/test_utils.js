// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib.require('package', 'utils');


var key = 'uxu-test-window-id';

this.constructor = function(aEnvironment)
{
	this.environment = aEnvironment || {};
    this.uniqueID = parseInt(Math.random() * 10000000000);
}


var WindowManager = Components.
	classes['@mozilla.org/appshell/window-mediator;1'].
	getService(Components.interfaces.nsIWindowMediator);

// テスト用のFirefoxウィンドウを取得する
this.getTestWindow = function() {
	var targets = WindowManager.getEnumerator('navigator:browser'),
		target;
	while (targets.hasMoreElements())
	{
		target = targets.getNext().
			QueryInterface(Components.interfaces.nsIDOMWindowInternal);
		if (target[key] == this.uniqueID ||
			target.document.documentElement.getAttribute(key) == this.uniqueID)
			return target;
	}

	return null;
};

// テスト用のFirefoxウィンドウを開き直す
this.reopenTestWindow = function(callback) {
	var win = this.getTestWindow();
	if (win) win.close();
	return this.openTestWindow(callback);
};

// テスト用のFirefoxウィンドウを開く
this.openTestWindow = function(callback) {
	var win = this.getTestWindow();
	if (win) {
		if (callback) callback(win);
	}
	else {
		win = window.openDialog('chrome://browser/content/browser.xul',
								'_blank', 'chrome,all,dialog=no',
								'about:blank');
		win[key] = this.uniqueID;
		var id = this.uniqueID;
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
this.closeTestWindow = function() {
	var win = this.getTestWindow();
	if (win) win.close();
};


this.setUpTestWindow = function(aContinuation) {
	var loadedFlag = { value : false };
	if (this.getTestWindow()) {
		if (aContinuation) aContinuation("ok");
		loadedFlag.value = true;
	}
	else {
		this.openTestWindow(function(win) {
			window.setTimeout(function() {
				if (aContinuation) aContinuation('ok');
				loadedFlag.value = true;
			}, 0);
		});
	}
	return loadedFlag;
};

this.tearDownTestWindow = this.closeTestWindow;



// テスト用のFirefoxウィンドウの現在のタブにURIを読み込む
this.loadURI = function(aURI) {
	var loadedFlag = { value : false };

	var win = this.getTestWindow();
	if (!win) return null;

	win.gBrowser.addEventListener('load', function() {
		loadedFlag.value = true;
		win.gBrowser.removeEventListener('load', arguments.callee, true);
	}, true);
	win.gBrowser.loadURI(aURI);

	return loadedFlag;
};

// テスト用のFirefoxウィンドウで新しいタブを開く
this.addTab = function(aURI) {
	var loadedFlag = { value : false, tab : null };

	var win = this.getTestWindow();
	if (!win) return null;

	var tab = win.gBrowser.addTab();
	tab.linkedBrowser.addEventListener('load', function() {
		loadedFlag.value = true;
		loadedFlag.tab = tab;
		tab.linkedBrowser.removeEventListener('load', arguments.callee, true);
	}, true);
	tab.linkedBrowser.loadURI(aURI);

	return loadedFlag;
};

this.getBrowser = function() {
	var win = this.getTestWindow();
	if (!win) return null;
	return win.gBrowser;
};

this.getTabs = function() {
	var win = this.getTestWindow();
	if (!win) return null;
	return win.gBrowser.mTabContainer.childNodes;
};




this.tempFiles = [];
this.makeTempFile = function(aOriginal) {
	var DirectoryService = Components.classes['@mozilla.org/file/directory_service;1']
				.getService(Components.interfaces.nsIProperties);
	var temp = DirectoryService.get('TmpD', Components.interfaces.nsIFile);
	var random = parseInt(Math.random() * 10000);

	if (aOriginal) {
		if (typeof aOriginal == 'string') {
			if (aOriginal.match(/^\w+:\/\//))
				aOriginal = this.makeURIFromSpec(aOriginal);
			else
				aOriginal = this.makeFileWithPath(aOriginal);
		}
		try {
			aOriginal = aOriginal.QueryInterface(Components.interfaces.nsILocalFile)
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

this.cleanUpTempFiles = function() {
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



var loader = Components.classes['@mozilla.org/moz/jssubscript-loader;1']
			.getService(Components.interfaces.mozIJSSubScriptLoader);

this.include = function(aSource, aEnvironment, aEncoding) {
	var script = this.readFrom(aSource, aEncoding || getPref('extensions.uxu.defaultEncoding'));
	loader.loadSubScript(
		'data:application/x-javascript,'+encodeURIComponent(script),
		aEnvironment || this.environment
	);
};





var _this = this;
<><![CDATA[
makeURIFromSpec
makeFileWithPath
getFileFromURLSpec
getFilePathFromURLSpec
getURLFromFilePath
getURLSpecFromFilePath
readFrom
writeTo
getPref
setPref
UTF8ToUnicode
UnicodeToUTF8
XToUnicode
UnicodeToX
]]></>.toString()
.replace(/^\s+|\s+$/g, '')
.split('\n')
.forEach(function(aFunc) {
	_this[aFunc] = utils[aFunc];
});

