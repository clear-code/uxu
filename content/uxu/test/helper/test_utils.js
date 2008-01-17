// -*- indent-tabs-mode: t; tab-width: 4 -*-

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
		if (target.mozLabTestWindow)
			return target;
	}

	return null;
};

// テスト用のFirefoxウィンドウを開き直す
this.reopenTestWindow = function(callback) {
	var win = getTestWindow();
	if (win) win.close();
	return openTestWindow(callback);
};

// テスト用のFirefoxウィンドウを開く
this.openTestWindow = function(callback) {
	var win = getTestWindow();
	if (win) {
		if (callback) callback(win);
	} else {
		win = window.openDialog('chrome://browser/content/browser.xul',
								'_blank', 'chrome,all,dialog=no',
								'about:blank');
		win.mozLabTestWindow = true;
		if (callback) {
			win.addEventListener('load', function() {
				win.removeEventListener('load', arguments.callee, false);
				callback(win);
			}, false);
		}
	}
	return win;
};

// テスト用のFirefoxウィンドウを閉じる
this.closeTestWindow = function() {
	var win = getTestWindow();
	if (win) win.close();
};


this.setUpTestWindow = function(aContinuation) {
	if (this.getTestWindow()) {
		aContinuation("ok");
	}
	else {
		this.openTestWindow(function(win) {
			window.setTimeout(function() {aContinuation('ok')}, 0);
		});
	}
};

this.tearDownTestWindow = this.closeTestWindow;



// テスト用のFirefoxウィンドウの現在のタブにURIを読み込む
this.loadURI = function(aURI, aLoadedFlag) {
	var win = getTestWindow();
	if (!win) return false;

	win.gBrowser.addEventListener('load', function() {
		aLoadedFlag.value = true;
		win.gBrowser.removeEventListener('load', arguments.callee, true);
	}, true);
	win.gBrowser.loadURI(aURI);

	return true;
};

// テスト用のFirefoxウィンドウで新しいタブを開く
this.addTab = function(aURI, aLoadedFlag) {
	var win = getTestWindow();
	if (!win) return false;

	var tab = win.gBrowser.addTab();
	tab.linkedBrowser.addEventListener('load', function() {
		aLoadedFlag.value = true;
		aLoadedFlag.tab = tab;
		tab.linkedBrowser.removeEventListener('load', arguments.callee, true);
	}, true);
	tab.linkedBrowser.loadURI(aURI);

	return true;
};




var IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);

// URI文字列からnsIURIのオブジェクトを生成
this.makeURIFromSpec = function(aURI) {
	try {
		var newURI;
		aURI = aURI || '';
		if (aURI && aURI.match(/^file:/)) {
			var fileHandler = IOService.getProtocolHandler('file')
								.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
			var tempLocalFile = fileHandler.getFileFromURLSpec(aURI);

			newURI = IOService.newFileURI(tempLocalFile);
		}
		else {
			newURI = IOService.newURI(aURI, null, null);
		}

		return newURI;
	}
	catch(e){
	}
	return null;
};

// ファイルのパスからnsIFileのオブジェクトを生成
this.makeFileWithPath = function(aPath) {
	var newFile = Components.classes['@mozilla.org/file/local;1']
					.createInstance(Components.interfaces.nsILocalFile);
	newFile.initWithPath(aPath);
	return newFile;
};


// URL文字列→nsIFile
this.getFileFromURLSpec = function(aURI) {
	if ((aURI || '').indexOf('file://') != 0) return '';

	var fileHandler = IOService.getProtocolHandler('file')
						.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
	return fileHandler.getFileFromURLSpec(aURI);
};

// URL文字列→ファイルのパス
this.getFilePathFromURLSpec = function(aURI) {
	return this.getFileFromURLSpec(aURI).path;
};
 
// ファイルのパス→nsIURI
this.getURLFromFilePath = function(aPath) {
	var tempLocalFile = this.makeFileWithPath(aPath);
	return IOService.newFileURI(tempLocalFile);
};

// ファイルのパス→URL文字列
this.getURLSpecFromFilePath = function(aPath) {
	return this.getURLFromFilePath(aPath).spec;
};



// ファイルまたはURIで示された先のリソースを読み込み、文字列として返す
this.readFrom = function(aTarget) {
	if (typeof aTarget == 'string') {
		if (aTarget.match(/^\w+:\/\//))
			aTarget = this.makeURIFromSpec(aTarget);
		else
			aTarget = this.makeFileWithPath(aTarget);
	}

	var stream;
	try {
		aTarget = aTarget.QueryInterface(Components.interfaces.nsIURI);
		var channel = IOService.newChannelFromURI(aTarget);
		stream = channel.open();
	}
	catch(e) {
		aTarget = aTarget.QueryInterface(Components.interfaces.nsILocalFile)
		stream = Components.classes['@mozilla.org/network/file-input-stream;1']
					.createInstance(Components.interfaces.nsIFileInputStream);
		try {
			stream.init(aTarget, 1, 0, false); // open as "read only"
		}
		catch(ex) {
			return null;
		}
	}

	try {
		var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1']
				.createInstance(Components.interfaces.nsIScriptableInputStream);
		scriptableStream.init(stream);

		var fileContents = scriptableStream.read(scriptableStream.available());

		scriptableStream.close();
		stream.close();

		return fileContents;
	}
	catch(e) {
	}

	return null;
};

// ファイルパスまたはURLで示された先のテキストファイルに文字列を書き出す
this.writeTo = function(aContent, aTarget) {
	if (typeof aTarget == 'string') {
		if (aTarget.match(/^\w+:\/\//))
			aTarget = this.makeURIFromSpec(aTarget);
		else
			aTarget = this.makeFileWithPath(aTarget);
	}

	try {
		aTarget = aTarget.QueryInterface(Components.interfaces.nsILocalFile)
	}
	catch(e) {
		aTarget = aTarget.QueryInterface(Components.interfaces.nsIURI);
		aTarget = this.getFileFromURLSpec(aTarget.spec);
	}


	// create directories
	var current = aTarget;
	var dirs    = [];
	while (current.parent && !current.parent.exists())
	{
		dirs.push(current.parent);
		current = current.parent;
	}

	if (dirs.length) {
		for (var i = dirs.length-1; i > -1; i--)
			dirs[i].create(dirs[i].DIRECTORY_TYPE, 0644);
	}


	aTarget.create(aTarget.NORMAL_FILE_TYPE, 0666);

	var stream = Components.classes['@mozilla.org/network/file-output-stream;1']
			.createInstance(Components.interfaces.nsIFileOutputStream);
	stream.init(aTarget, 2, 0x200, false); // open as "write only"

	stream.write(aContent, aContent.length);

	stream.close();

	return aTarget;
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



var Pref = Components.classes['@mozilla.org/preferences;1'] 
		.getService(Components.interfaces.nsIPrefBranch)
		.QueryInterface(Components.interfaces.nsIPrefBranch2);

this.getPref = function(aKey) {
	try {
		switch (Pref.getPrefType(aKey))
		{
			case Pref.PREF_STRING:
				return this.UTF8ToUnicode(Pref.getCharPref(aKey));
				break;
			case Pref.PREF_INT:
				return Pref.getIntPref(aKey);
				break;
			default:
				return Pref.getBoolPref(aKey);
				break;
		}
	}
	catch(e) {
	}
	return null;
};

this.setPref = function(aKey, aValue) {
	var type;
	try {
		type = typeof aValue;
	}
	catch(e) {
		type = null;
	}

	try {
		switch (type)
		{
			case 'string':
				Pref.setCharPref(aKey, this.UnicodeToUTF8(aValue));
				break;
			case 'number':
				Pref.setIntPref(aKey, parseInt(aValue));
				break;
			default:
				Pref.setBoolPref(aKey, aValue);
				break;
		}
	}
	catch(e) {
		dump('Fail to set pref.\n'+e+'\n');
	}
	return aValue;
};



this.include = function(aSource, aEnvironment) {
	(aEnvironment || {}).eval(this.readFrom(aSource));
};


this.UTF8ToUnicode = function(aInput) {
	return decodeURIComponent(escape(aInput));
};
this.UnicodeToUTF8 = function(aInput) {
	return unescape(encodeURIComponent(aInput));
};

this.convertFromDefaultEncoding = function(aInput) {
	switch (this.getPref('extensions.uxu.defaultEncoding'))
	{
		case 'UTF-8':
			return this.UTF8ToUnicode(aInput);

		default:
			return aInput;
	}
};
