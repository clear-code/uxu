// -*- indent-tabs-mode: t; tab-width: 4 -*- 

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');
var prefread = lib_module.require('package', 'prefread');

var IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);
	
// ファイル操作 
	
function normalizeToFile(aFile) 
{
	if (typeof aFile == 'string') {
		aFile = this.fixupIncompleteURI(aFile);
		if (aFile.match(/^\w+:\/\//))
			aFile = makeURIFromSpec(aFile);
		else
			aFile = makeFileWithPath(aFile);
	}
	try {
		aFile = aFile.QueryInterface(Ci.nsILocalFile)
	}
	catch(e) {
		aFile = aFile.QueryInterface(Ci.nsIURI);
		aFile = getFileFromURLSpec(aFile.spec);
	}
	return aFile;
}
 
// URI文字列からnsIURIのオブジェクトを生成 
function makeURIFromSpec(aURI)
{
	try {
		var newURI;
		aURI = aURI || '';
		if (aURI && aURI.match(/^file:/)) {
			var fileHandler = IOService.getProtocolHandler('file')
								.QueryInterface(Ci.nsIFileProtocolHandler);
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
}
 
// ファイルのパスからnsIFileのオブジェクトを生成 
function makeFileWithPath(aPath)
{
	var newFile = Cc['@mozilla.org/file/local;1']
					.createInstance(Ci.nsILocalFile);
	newFile.initWithPath(aPath);
	return newFile;
}
 
// URL→ファイル 
	
function getFileFromURL(aURI) 
{
	return getFileFromURLSpec(aURI.spec);
}
 
function getFileFromURLSpec(aURI) 
{
	if (!aURI)
		aURI = '';

	if (aURI.indexOf('chrome://') == 0) {
		var ChromeRegistry = Cc["@mozilla.org/chrome/chrome-registry;1"]
			.getService(Ci.nsIChromeRegistry);
		aURI = ChromeRegistry.convertChromeURL(makeURIFromSpec(aURI)).spec;
	}

	if (aURI.indexOf('file://') != 0) return null;

	var fileHandler = IOService.getProtocolHandler('file')
						.QueryInterface(Ci.nsIFileProtocolHandler);
	return fileHandler.getFileFromURLSpec(aURI);
}
 
function getFilePathFromURL(aURI) 
{
	return getFileFromURLSpec(aURI.spec).path;
}
 
function getFilePathFromURLSpec(aURI) 
{
	return getFileFromURLSpec(aURI).path;
}
  
// キーワード→ファイル 
var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
		.getService(Ci.nsIProperties);
	
function getFileFromKeyword(aKeyword) 
{
	try {
		return DirectoryService.get(aKeyword, Ci.nsIFile);
	}
	catch(e) {
	}
	return null;
}
 
function getFilePathFromKeyword(aKeyword) 
{
	var file = getFileFromKeyword(aKeyword);
	return file ? file.path : null ;
}
  
// ファイル→URL 
	
function getURLFromFile(aFile) 
{
	return IOService.newFileURI(aFile);
}
 
function getURLFromFilePath(aPath) 
{
	var tempLocalFile = makeFileWithPath(aPath);
	return getURLFromFile(tempLocalFile);
}
 
function getURLSpecFromFile(aFile) 
{
	return IOService.newFileURI(aFile).spec;
}
 
function getURLSpecFromFilePath(aPath) 
{
	return getURLFromFilePath(aPath).spec;
}
  
// ファイルまたはURIで示された先のリソースを読み込み、文字列として返す 
function readFrom(aTarget, aEncoding)
{
	aTarget = this.normalizeToFile(aTarget);

	var stream;
	try {
		aTarget = aTarget.QueryInterface(Ci.nsIURI);
		var channel = IOService.newChannelFromURI(aTarget);
		stream = channel.open();
	}
	catch(e) {
		aTarget = aTarget.QueryInterface(Ci.nsILocalFile)
		stream = Cc['@mozilla.org/network/file-input-stream;1']
					.createInstance(Ci.nsIFileInputStream);
		try {
			stream.init(aTarget, 1, 0, false); // open as "read only"
		}
		catch(ex) {
			return null;
		}
	}

	var fileContents = null;
	try {
		if (aEncoding) {
			var converterStream = Cc['@mozilla.org/intl/converter-input-stream;1']
					.createInstance(Ci.nsIConverterInputStream);
			var buffer = stream.available();
			converterStream.init(stream, aEncoding, buffer,
				converterStream.DEFAULT_REPLACEMENT_CHARACTER);
			var out = { value : null };
			converterStream.readString(stream.available(), out);
			converterStream.close();
			fileContents = out.value;
		}
		else {
			var scriptableStream = Cc['@mozilla.org/scriptableinputstream;1']
					.createInstance(Ci.nsIScriptableInputStream);
			scriptableStream.init(stream);
			fileContents = scriptableStream.read(scriptableStream.available());
			scriptableStream.close();
		}
	}
	finally {
		stream.close();
	}

	return fileContents;
}
 
// ファイルパスまたはURLで示された先のテキストファイルに文字列を書き出す 
function writeTo(aContent, aTarget, aEncoding)
{
	aTarget = this.normalizeToFile(aTarget);

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

	var tempFile = getFileFromKeyword('TmpD');
	tempFile.append(aTarget.localName+'.writing');
	tempFile.createUnique(tempFile.NORMAL_FILE_TYPE, 0666);

	var stream = Cc['@mozilla.org/network/file-output-stream;1']
			.createInstance(Ci.nsIFileOutputStream);
	stream.init(tempFile, 2, 0x200, false); // open as "write only"

	if (aEncoding) {
		var converterStream = Cc['@mozilla.org/intl/converter-output-stream;1']
				.createInstance(Ci.nsIConverterOutputStream);
		var buffer = aContent.length;
		converterStream.init(stream, aEncoding, buffer, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
		converterStream.writeString(aContent);
		converterStream.close();
	}
	else {
		stream.write(aContent, aContent.length);
	}

	stream.close();

	if (aTarget.exists()) aTarget.remove(true);
	tempFile.moveTo(aTarget.parent, aTarget.leafName);

	return aTarget;
}
 
// Subversionが作る不可視のファイルなどを除外して、普通に目に見えるファイルだけを複製する 
function cosmeticClone(aOriginal, aDest, aName)
{
	aOriginal = normalizeToFile(aOriginal);
	aDest = normalizeToFile(aDest);

	if (aOriginal.isHidden() || aOriginal.leafName.indexOf('.') == 0)
		return null;

	if (aOriginal.isDirectory()) {
		var folder = aDest.clone();
		folder.append(aName);
		folder.create(folder.DIRECTORY_TYPE, 0777);

		var files = aOriginal.directoryEntries;
		var file;
		while (files.hasMoreElements())
		{
			file = files.getNext().QueryInterface(Ci.nsILocalFile);
			arguments.callee(file, folder, file.leafName);
		}
		return folder;
	}
	else {
		aOriginal.copyTo(aDest, aName);
		var cloned = aDest.clone();
		cloned.append(aName);
		return cloned;
	}
}
 
// 遅延削除 
	
function scheduleToRemove(aFile) 
{
	if (!this.scheduledFiles) this.scheduledFiles = {};
	aFile = normalizeToFile(aFile);
	if (aFile.path in this.scheduledFiles) return;

	this.scheduledFiles[aFile.path] = {
		file     : aFile,
		count    : 0
	};

	if (!this.scheduledRemoveTimer)
		this.startScheduledRemove(this);
}
 
function startScheduledRemove(aThis) 
{
	if (!aThis) aThis = this;
	if (aThis.scheduledRemoveTimer) aThis.stopScheduledRemove();
	aThis.scheduledRemoveTimer = window.setTimeout(function(aThis) {
		if (aThis.scheduledFiles) {
			var incomplete = false;
			var incompleted = {};
			for (var i in aThis.scheduledFiles)
			{
				schedule = aThis.scheduledFiles[i];
				try {
					if (schedule.count < 100)
						schedule.file.remove(true);
				}
				catch(e) {
					incomplete = true;
					incompleted[i] = schedule;
					schedule.count++;
				}
			}
			if (incomplete) {
				aThis.scheduledFiles = incompleted;
				aThis.scheduledRemoveTimer = window.setTimeout(arguments.callee, 500, aThis)
				return;
			}
			aThis.scheduledFiles = {};
		}
		aThis.stopScheduledRemove();
		// aThis.scheduledRemoveTimer = window.setTimeout(arguments.callee, 5000, aThis)
	}, 5000, aThis);
}
 
function stopScheduledRemove() 
{
	if (!this.scheduledRemoveTimer) return;
	window.clearTimeout(this.scheduledRemoveTimer);
	this.scheduledRemoveTimer = null;
}
  
var loader = Cc['@mozilla.org/moz/jssubscript-loader;1'] 
		.getService(Ci.mozIJSSubScriptLoader);

function include(aSource, aEnvironment, aEncoding)
{
	aSource = this.fixupIncompleteURI(aSource);
	var encoding = aEncoding || this.getPref('extensions.uxu.defaultEncoding')
	var script = this.readFrom(aSource, encoding) || '';
	var env = aEnvironment || {};
	env._lastEvaluatedScript = script;
	loader.loadSubScript(
		'chrome://uxu/content/lib/subScriptRunner.js?includeSource='+
			encodeURIComponent(aSource)+
			';encoding='+encoding,
		env
	);
	return script;
};
  
// エラー・スタックトレース整形 
	
function normalizeError(e) 
{
	switch (typeof e)
	{
		case 'number':
			var msg = bundle.getFormattedString('unknown_exception', [e]);
			for (var i in Components.results)
			{
				if (Components.results[i] != e) continue;
				msg = i+' ('+e+')';
				break;
			}
			e = new Error(msg);
			e.stack = getCurrentStacks();
			break;

		case 'string':
		case 'boolean':
			var msg = bundle.getFormattedString('unknown_exception', [e]);
			e = new Error(msg);
			e.stack = getCurrentStacks();
			break;
	}
	return e;
}
 
function formatError(e) 
{
	var options = { onlyFile : true, onlyExternal : true, onlyTraceLine : true};
	return e.toString() + '\n' + formatStackTrace(e, options);
}
 
function hasStackTrace(aException) 
{
	return aException.stack ||
		(aException.location && JSFrameLocationRegExp.test(aException.location));
}
 
function formatStackTraceForDisplay(aException) 
{
	var lines = formatStackTrace(aException, { onlyTraceLine : true, onlyExternal : true }).split('\n');
	if (!lines.length || utils.getPref('extensions.uxu.showInternalStacks'))
		lines = formatStackTrace(aException, { onlyTraceLine : true }).split('\n');
	lines = lines.filter(function(aLine) {
		return aLine;
	});
	return lines;
}
 
var lineRegExp = /@\w+:.+:\d+/; 
var JSFrameLocationRegExp = /JS frame :: (.+) :: .+ :: line (\d+)/;
var subScriptRegExp = /@chrome:\/\/uxu\/content\/lib\/subScriptRunner\.js(?:\?includeSource=([^;,:]+)(?:;encoding=[^;,:]+)?|\?code=([^;,:]+))?:(\d+)$/i;
function formatStackTrace(aException, aOptions)
{
	if (!aOptions) aOptions = {};
	function comesFromFramework(aLine)
	{
		return (/@chrome:\/\/uxu\/content\//.test(aLine) ||
				// Following is VERY kludgy
				/\(function \(aExitResult\) \{if \(aEventHandlers/.test(aLine))
	}

	var trace = '';
	var stackLines = [];

	if (aException.name == "SyntaxError") {
		var exceptionPosition;
		exceptionPosition = "@" + aException.fileName;
		exceptionPosition += ":" + aException.lineNumber;

		if (exceptionPosition.match(subScriptRegExp)) {
			var i;
			var lines = (aException.stack || "").split("\n");

			for (i = 0; i < lines.length; i++) {
				var line = lines[i];
				if (line.match(/^eval\("(.*)"\)@:0$/)) {
					var source, errorLine;

					source = eval('"\\\"' + RegExp.$1 + '\\\""');
					errorLine = source.split("\n")[aException.lineNumber - 1];
					exceptionPosition = errorLine + exceptionPosition;
					break;
				}
			}

			stackLines.push(exceptionPosition);
		}
	}

	if (aException.stack) {
		stackLines = stackLines.concat(aException.stack.split('\n'));
	}
	if (aException.location && JSFrameLocationRegExp.test(aException.location)) {
		stackLines = stackLines.concat(['()@' + RegExp.$1 + ':' + RegExp.$2]);
	}

	stackLines.forEach(function(aLine) {
		if (!aLine.length) return;

		aLine = String(aLine).replace(/\\n/g, '\n');

		if ('maxLength' in aOptions &&
			aLine.length > aOptions.maxLength)
			aLine = aLine.substr(0, aOptions.maxLength) + '[...]\n';

		if (aLine.match(subScriptRegExp)) {
			var lineNum = RegExp.$3;
			if (RegExp.$1) {
				var includeSource = decodeURIComponent(RegExp.$1);
				aLine = aLine.replace(subScriptRegExp, '@'+includeSource+':'+lineNum);
			}
			else if (RegExp.$2) {
				if (aOptions.onlyFile) return;
				var code = decodeURIComponent(RegExp.$2);
				aLine = '(eval):' +
					aLine.replace(subScriptRegExp, '') +
					lineNum + ':' + code;
			}
		}
		if (
			(aOptions.onlyExternal && comesFromFramework(aLine)) ||
			(aOptions.onlyTraceLine && !lineRegExp.test(aLine))
			)
			return;
		trace += aLine + '\n';
	});

	return trace;
}
	
function makeStackLine(aStack) 
{
	if (typeof aStack == 'string') return aStack;
	return '()@' + aStack.filename + ':' + aStack.lineNumber + '\n';
}
 
function getCurrentStacks() 
{
	var callerStack = '';
	var caller = Components.stack;
	while (caller)
	{
		callerStack += makeStackLine(caller);
		caller = caller.caller;
	}
	return callerStack;
}
 
function unformatStackLine(aLine) 
{
	/@(\w+:.*)?:(\d+)/.test(aLine);
	return {
		source : (RegExp.$1 || ''),
		line   : (RegExp.$2 || '')
	};
}
   
// 設定読み書き 
var Pref = Cc['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch)
		.QueryInterface(Ci.nsIPrefBranch2);

var backupPrefs = {};
	
function getPref(aKey) 
{
	try {
		switch (Pref.getPrefType(aKey))
		{
			case Pref.PREF_STRING:
				return UTF8ToUnicode(Pref.getCharPref(aKey));
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
}
 
function setPref(aKey, aValue) 
{
	var type;
	try {
		type = typeof aValue;
	}
	catch(e) {
		type = null;
	}

	if (!(aKey in this.backupPrefs))
		this.backupPrefs[aKey] = this.getPref(aKey);

	try {
		switch (type)
		{
			case 'string':
				Pref.setCharPref(aKey, UnicodeToUTF8(aValue));
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
}
 
function clearPref(aKey) 
{
	if (!(aKey in this.backupPrefs))
		this.backupPrefs[aKey] = this.getPref(aKey);
	try {
		Pref.clearUserPref(aKey);
	}
	catch(e) {
	}
}
 
function loadPrefs(aFile, aHash) 
{
	if (aHash && typeof aHash != 'object') aHash = null;

	var result = {};
	prefread.read(this.normalizeToFile(aFile)).forEach(
		(aHash ?
			function(aItem) {
				aHash[aItem.name] = aItem.value;
				result[aItem.name] = aItem.value;
			} :
			function(aItem) {
				this.setPref(aItem.name, aItem.value);
				result[aItem.name] = aItem.value;
			}),
		this
	);

	return result;
}
  
// クリップボード 
var Clipboard = Cc['@mozilla.org/widget/clipboard;1'].getService(Ci.nsIClipboard)
	
function getClipBoard()
{
	return _getClipBoard(false);
}
 
function getSelectionClipBoard()
{
	return _getClipBoard(true);
}
 
function _getClipBoard(aSelection) 
{
	var string = '';

	var trans = Cc['@mozilla.org/widget/transferable;1'].createInstance(Ci.nsITransferable);
	trans.addDataFlavor('text/unicode');
	try {
		if (aSelection)
			Clipboard.getData(trans, Clipboard.kSelectionClipboard);
		else
			Clipboard.getData(trans, Clipboard.kGlobalClipboard);
	}
	catch(ex) {
		return string;
	}

	var data       = {},
		dataLength = {};
	trans.getTransferData('text/unicode', data, dataLength);

	if (!data) return string;

	data = data.value.QueryInterface(Ci.nsISupportsString);
	string = data.data.substring(0, dataLength.value / 2);

	return string;
}
 
function setClipBoard(aString) 
{
	Cc['@mozilla.org/widget/clipboardhelper;1']
		.getService(Ci.nsIClipboardHelper)
		.copyString(aString);
}
  
// エンコーディング変換 
var UCONV = Cc['@mozilla.org/intl/scriptableunicodeconverter']
		.getService(Ci.nsIScriptableUnicodeConverter);
	
function UTF8ToUCS2(aInput) 
{
	return decodeURIComponent(escape(aInput));
}
	
function UTF8ToUnicode(aInput) 
{
	return UTF8ToUCS2(aInput);
}
  
function UCS2ToUTF8(aInput) 
{
	return unescape(encodeURIComponent(aInput));
}
	
function UnicodeToUTF8(aInput) 
{
	return UCS2ToUTF8(aInput);
}
  
function XToUCS2(aInput, aEncoding) 
{
	if (aEncoding == 'UTF-8') return UTF8ToUnicode(aInput);
	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertToUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}
	
function XToUnicode(aInput, aEncoding) 
{
	return XToUCS2(aInput, aEncoding);
}
  
function UCS2ToX(aInput, aEncoding) 
{
	if (aEncoding == 'UTF-8') return UnicodeToUTF8(aInput);

	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertFromUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}
	
function UnicodeToX(aInput, aEncoding) 
{
	return UCS2ToX(aInput, aEncoding);
}
   
function fixupIncompleteURI(aURIOrPart) 
{
	if (!this.baseURL ||
		/^(about|data|javascript|view-source|jar):/.test(aURIOrPart))
		return aURIOrPart;

	var uri = aURIOrPart;

	try {
		if (/^file:\/\//.test(uri))
			getFileFromURLSpec(uri);
		if (/^\w+:\/\//.test(uri))
			makeURIFromSpec(uri);
		else
			getURLSpecFromFilePath(uri);
	}
	catch(e) {
		uri = this.baseURL + uri;
		try {
			getFileFromURLSpec(uri);
		}
		catch(e) {
			throw new Error('utils.fixupIncompleteURI::['+aURIOrPart+'] is not a valid file path or URL!');
		}
	}
	return uri;
}
 
// イテレータ操作 
	
function isGeneratedIterator(aObject) 
{
	try {
		return (
			aObject &&
			'next' in aObject &&
			'send' in aObject &&
			'throw' in aObject &&
			'close' in aObject &&
			aObject == '[object Generator]'
		);
	}
	catch(e) {
	}
	return false;
}
 
function doIteration(aGenerator, aCallbacks) 
{
	if (!aGenerator)
		throw new Error('doIteration:: no generator!');

	var iterator = aGenerator;
	if (typeof aGenerator == 'function')
		iterator = aGenerator();
	if (!isGeneratedIterator(iterator))
		throw new Error('doIteration:: ['+aGenerator+'] is not a generator!');

	var callerStack = getCurrentStacks();

	var retVal = { value : false };
	var lastRun = (new Date()).getTime();
	var timeout = Math.max(0, getPref('extensions.uxu.run.timeout'));
	(function(aObject) {
		try {
			if ((new Date()).getTime() - lastRun >= timeout)
				throw new Error(bundle.getFormattedString('error_generator_timeout', [parseInt(timeout / 1000)]));

			if (aObject) {
				var continueAfterDelay = false;
				if (aObject instanceof Error) {
					throw returnedValue;
				}
				else if (typeof aObject == 'object') {
					if (isGeneratedIterator(aObject))
						return window.setTimeout(arguments.callee, 0, doIteration(aObject));
					else if ('error' in aObject && aObject.error instanceof Error)
						throw aObject.error;
					else if (!aObject.value)
						continueAfterDelay = true;
				}
				else if (typeof aObject == 'function') {
					var val;
					try {
						val = aObject();
					}
					catch(e) {
						e.stack += callerStack;
						throw e;
					}
					if (!val)
						continueAfterDelay = true;
					else if (val instanceof Error)
						throw val;
					else if (isGeneratedIterator(val))
						return window.setTimeout(arguments.callee, 0, doIteration(val));
				}
				if (continueAfterDelay)
					return window.setTimeout(arguments.callee, 10, aObject);
			}

			var returnedValue = iterator.next();
			lastRun = (new Date()).getTime();

			if (!returnedValue ? false :
				typeof returnedValue == 'object' ?
					('value' in returnedValue || isGeneratedIterator(returnedValue)) :
				typeof returnedValue == 'function'
				) {
				window.setTimeout(arguments.callee, 10, returnedValue);
			}
			else {
				var wait = returnedValue;
				if (isNaN(wait)) wait = 0;
				window.setTimeout(arguments.callee, wait, null);
			}
		}
		catch(e if e instanceof StopIteration) {
			try {
				e.stack += callerStack;
			}
			catch(e) {
			}
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			try {
				if (aCallbacks.onEnd)
					aCallbacks.onEnd(e);
			}
			catch(e) {
				retVal.error = e;
			}
		}
		catch(e if e.name == 'AssertionFailed') {
			try {
				e.stack += callerStack;
			}
			catch(e) {
			}
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			try {
				if (aCallbacks.onFail)
					aCallbacks.onFail(e);
				else if (aCallbacks.onError)
					aCallbacks.onError(e);
				else if (aCallbacks.onEnd)
					aCallbacks.onEnd(e);
			}
			catch(e) {
				retVal.error = e;
			}
		}
		catch(e) {
			e = normalizeError(e);
			try {
				e.stack += callerStack;
			}
			catch(e) {
			}
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			try {
				if (aCallbacks.onError)
					aCallbacks.onError(e);
				else if (aCallbacks.onEnd)
					aCallbacks.onEnd(e);
			}
			catch(e) {
				retVal.error = e;
			}
		}
	})(null);

	return retVal;
}
 
function Do(aObject) 
{
	if (!aObject)
		return aObject;
	if (isGeneratedIterator(aObject))
		return doIteration(aObject);
	if (typeof aObject != 'function')
		return aObject;

	var retVal = aObject();
	return (isGeneratedIterator(retVal)) ?
				doIteration(retVal) :
				retVal;
}
  
// データベース操作 
var _db = null;
	
var dbFile = (function() { 
		var file = getFileFromKeyword('ProfD');
		file.append('uxu.sqlite');
		return file;
	})();
 
function getDB() 
{
	if (_db) return _db;

	const StorageService = Cc['@mozilla.org/storage/service;1']
		.getService(Ci.mozIStorageService);
	_db = StorageService.openDatabase(dbFile);

	return _db;
}
  
// 解析 
	
function inspect(aObject) 
{
	var inspectedObjects = [];
	var inspectedResults = {};
	var inaccessible = {
			objects    : [],
			properties : [],
			values     : [],
			count      : 0
		};
	return (function (aTarget) {
		var index;

		if (aTarget === null)
			return 'null';
		if (aTarget === undefined)
			return 'undefined';

		index = inspectedObjects.indexOf(aTarget);
		if (index != -1)
			return inspectedResults[index];

		if (!aTarget.__proto__)
			return aTarget.toString();

		if (aTarget instanceof eval('Array', aTarget)) {
			index = inspectedObjects.length;
			inspectedObjects.push(aTarget);
			inspectedResults[index] = aTarget.toString();

			var values = aTarget.map(arguments.callee);
			inspectedResults[index] = "[" + values.join(", ") + "]";
			return inspectedResults[index];
		} else if (typeof aTarget == 'string' ||
		           aTarget instanceof eval('String', aTarget)) {
			return '"' + aTarget.replace(/\"/g, '\\"') + '"';
		} else if (aTarget.__proto__.toString == eval('Object.prototype.toString', aTarget)) {
			index = inspectedObjects.length;
			inspectedObjects.push(aTarget);
			inspectedResults[index] = aTarget.toString();

			var names = [];
			for (var name in aTarget) {
				names.push(name);
			}
			var values = names.sort().map(function(aName) {
					var value;
					try {
						value = this(aTarget[aName]);
					}
					catch(e) {
						var objIndex = inaccessible.objects.indexOf(aTarget);
						if (objIndex < 0) {
							inaccessible.objects.push(aTarget);
							inaccessible.properties.push([]);
							inaccessible.values.push([]);
							objIndex++;
						}
						var props = inaccessible.properties[objIndex];
						var propIndex = props.indexOf(aName);
						if (propIndex < 0) {
							props.push(aName);
							value = '(INACCESSIBLE #'+(++inaccessible.count)+', REASON: '+e+')';
							inaccessible.values[objIndex].push(value);
						}
						else {
							value = inaccessible.values[objIndex][propIndex];
						}
					}
					return aName.quote() + ': ' + value;
				}, arguments.callee);
			inspectedResults[index] = "{" + values.join(", ") + "}";
			return inspectedResults[index];
		} else {
			return aTarget.toString();
		}
	})(aObject);
}
 
function inspectType(aObject) 
{
	var type = typeof aObject;

	if (type != "object")
		return type;

	var objectType = Object.prototype.toString.apply(aObject);
	return objectType.substring("[object ".length,
								objectType.length - "]".length);
}
 
function inspectDOMNode(aNode) 
{
	var self = arguments.callee;
	var result;
	switch (aNode.nodeType)
	{
		case Node.ELEMENT_NODE:
		case Node.DOCUMENT_NODE:
		case Node.DOCUMENT_FRAGMENT_NODE:
			result = Array.slice(aNode.childNodes).map(function(aNode) {
					return self(aNode);
				}).join('');
			break;

		case Node.TEXT_NODE:
			result = aNode.nodeValue
						.replace(/&/g, '&ampt;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;');
			break;

		case Node.CDATA_SECTION_NODE:
			result = '<![CDATA['+aNode.nodeValue+']]>';
			break;

		case Node.COMMENT_NODE:
			result = '<!--'+aNode.nodeValue+'-->';
			break;

		case Node.ATTRIBUTE_NODE:
			result = aNode.name+'="'+
						aNode.value
							.replace(/&/g, '&ampt;')
							.replace(/</g, '&lt;')
							.replace(/>/g, '&gt;')
							.replace(/"/g, '&quot;')+
						'"';
			break;

		case Node.PROCESSING_INSTRUCTION_NODE:
			result = '<?'+aNode.target+' '+aNode.data+'?>';
			break;

		case Node.DOCUMENT_TYPE_NODE:
			result = '<!DOCTYPE'+aNode.name+
						(aNode.publicId ? ' '+aNode.publicId : '' )+
						(aNode.systemId ? ' '+aNode.systemId : '' )+
						'>';
			break;

		case Node.ENTITY_NODE:
		case Node.ENTITY_REFERENCE_NODE:
		case Node.NOTATION_NODE:
		default:
			return '';
	}

	if (aNode.nodeType == Node.ELEMENT_NODE) {
		result = '<'+
			aNode.localName+
			(aNode.namespaceURI ? ' xmlns="'+aNode.namespaceURI+'"' : '' )+
			Array.slice(aNode.attributes).map(function(aAttr) {
				return ' '+self(aAttr);
			}).sort().join('')+
			(result ? '>' : '/>' )+
			(result ? result+'</'+aNode.localName+'>' : '' );
	}
	return result;
}
 
function p() 
{
	var i;
	for (i = 0; i < arguments.length; i++) {
		var inspected = inspect(arguments[i]);
		if (!/\n$/.test(inspected))
			inspected += "\n";
		dump(inspected);
	}
}
 
function isArray(aObject) 
{
    return aObject && aObject instanceof eval('Array', aObject);
}
 
function isDate(aObject) 
{
    return aObject && aObject instanceof eval('Date', aObject);
}
 
function isObject(aObject) 
{
	return (aObject &&
			typeof aObject == "object" &&
			aObject == '[object Object]');
}
  
// 比較 
	
function _equals(aCompare, aObject1, aObject2, aStrict, aAltTable) 
{
	if (aCompare(aObject1, aObject2))
		return true;

	aAltTable = _createAltTable(aAltTable);
	aObject1 = _getAltTextForCircularReference(aObject1, aStrict, aAltTable);
	aObject2 = _getAltTextForCircularReference(aObject2, aStrict, aAltTable);

	if (isArray(aObject1) && isArray(aObject2)) {
		var length = aObject1.length;
		if (length != aObject2.length)
			return false;
		for (var i = 0; i < length; i++) {
			if (!_equals(aCompare, aObject1[i], aObject2[i], aStrict, aAltTable))
				return false;
		}
		return true;
	}

	if (isDate(aObject1) && isDate(aObject2)) {
		return _equals(aCompare, aObject1.getTime(), aObject2.getTime(), aStrict, aAltTable);
	}

	if (isObject(aObject1) && isObject(aObject2)) {
		return _equalObject(aCompare, aObject1, aObject2, aStrict, aAltTable);
	}

	return false;
}
 
function _equalObject(aCompare, aObject1, aObject2, aStrict, aAltTable) 
{
	if (!aCompare(aObject1.__proto__, aObject2.__proto__))

	aAltTable = _createAltTable(aAltTable);
	aObject1 = _getAltTextForCircularReference(aObject1, aStrict, aAltTable);
	aObject2 = _getAltTextForCircularReference(aObject2, aStrict, aAltTable);
	if (typeof aObject1 == 'string' || typeof aObject2 == 'string') {
		return _equals(aCompare, aObject1, aObject2, aStrict, aAltTable);
	}

	var name;
	var names1 = [], names2 = [];
	for (name in aObject1) {
		names1.push(name);
		if (!(name in aObject2))
			return false;
		if (!_equals(aCompare, aObject1[name], aObject2[name], aStrict, aAltTable))
			return false;
	}
	for (name in aObject2) {
		names2.push(name);
	}
	names1.sort();
	names2.sort();
	return _equals(aCompare, names1, names2, aStrict, aAltTable);
}
 
function equals(aObject1, aObject2) 
{
	return _equals(function (aObj1, aObj2) {return aObj1 == aObj2},
				   aObject1, aObject2,
				   false);
}
 
function strictlyEquals(aObject1, aObject2) 
{
	return _equals(function (aObj1, aObj2) {return aObj1 === aObj2},
				   aObject1, aObject2,
				   true);
}
 
function _createAltTable(aAltTable) 
{
	return aAltTable || { objects : [], alt : [], count : [] };
}
 
var CIRCULAR_REFERENCE_MAX_COUNT = 500; 
 
function _getAltTextForCircularReference(aObject, aStrict, aAltTable) 
{
	if (CIRCULAR_REFERENCE_MAX_COUNT < 0 ||
		typeof aObject != 'object') {
		return aObject;
	}

	var index = aAltTable.objects.indexOf(aObject);
	if (index < 0) {
		aAltTable.objects.push(aObject);
		aAltTable.alt.push(
			aStrict ?
				String(aObject)+'(#'+(aAltTable.alt.length+1)+')' :
				inspect(aObject)
		);
		aAltTable.count.push(0);
	}
	else if (aAltTable.count[index]++ > CIRCULAR_REFERENCE_MAX_COUNT) {
		aObject = aAltTable.alt[index];
	}
	return aObject;
}
  
// DOMノード調査 
	
function isTargetInRange(aTarget, aRange) 
{
	var targetRangeCreated = false;
	if (aTarget instanceof Ci.nsIDOMNode) {
		try {
			var range = aTarget.ownerDocument.createRange();
			range.selectNode(aTarget);
			aTarget = range;
			targetRangeCreated = true;
		}
		catch(e) {
		}
	}
	if (aTarget instanceof Ci.nsIDOMRange) {
		try {
			var inRange = (
					aTarget.compareBoundaryPoints(Range.START_TO_START, aRange) >= 0 &&
					aTarget.compareBoundaryPoints(Range.END_TO_END, aRange) <= 0
				);
			if (targetRangeCreated) aTarget.detach();
			return inRange;
		}
		catch(e) {
		}
		return false;
	}
	return aRange.toString().indexOf(aTarget.toString()) > -1;
}
 
function isTargetInSelection(aTarget, aSelection) 
{
	for (var i = 0, maxi = aSelection.rangeCount; i < maxi; i++)
	{
		if (isTargetInRange(aTarget, aSelection.getRangeAt(i)))
			return true;
	}
	return false;
}
 
function isTargetInSubTree(aTarget, aNode) 
{
	try {
		var range = aNode.ownerDocument.createRange();
		range.selectNode(aNode);
		var result = isTargetInRange(aTarget, range);
		range.detach();
		return result;
	}
	catch(e) {
	}
	return false;
}
  
// アプリケーション 
	
var product = (function() { 
	var XULAppInfo = Cc['@mozilla.org/xre/app-info;1']
			.getService(Ci.nsIXULAppInfo);
	switch (XULAppInfo.ID)
	{
		case '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}':
			return 'Firefox';
		case '{3550f703-e582-4d05-9a08-453d09bdfdc6}':
			return 'Thunderbird';
		case '{86c18b42-e466-45a9-ae7a-9b95ba6f5640}':
			return 'Seamonkey';
		default:
			return '';
	}
})();
 
var productExecutable = getFileFromKeyword('XREExeF'); 
 
function restartApplication(aForce) 
{
	_quitApplication(aForce, Ci.nsIAppStartup.eRestart);
}
 
function quitApplication(aForce) 
{
	_quitApplication(aForce);
}
 
function _quitApplication(aForce, aOption) 
{
	var quitSeverity;
	if (aForce) {
		quitSeverity = Ci.nsIAppStartup.eForceQuit;
	}
	else {
		var cancelQuit = Cc['@mozilla.org/supports-PRBool;1']
					.createInstance(Ci.nsISupportsPRBool);
		this.notify(cancelQuit, 'quit-application-requested', null);

		if (!cancelQuit.data) {
			this.notify(null, 'quit-application-granted', null);
			var windows = Cc['@mozilla.org/appshell/window-mediator;1']
						.getService(Ci.nsIWindowMediator)
						.getEnumerator(null);
			while (windows.hasMoreElements())
			{
				var target = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
				if (('tryToClose' in target) && !target.tryToClose()) {
					return;
				}
			}
		}
		quitSeverity = Ci.nsIAppStartup.eAttemptQuit;
	}

	if (aOption) quitSeverity |= aOption;

	const startup = Cc['@mozilla.org/toolkit/app-startup;1']
					.getService(Ci.nsIAppStartup);
	startup.quit(quitSeverity);
}
 
var installedUXU = Cc['@mozilla.org/extensions/manager;1'] 
		.getService(Ci.nsIExtensionManager)
		.getInstallLocation('uxu@clear-code.com')
		.getItemLocation('uxu@clear-code.com');
 
function getInstalledLocationOfProduct(aProduct) 
{
	if (
		!aProduct ||
		navigator.platform.toLowerCase().indexOf('win32') < 0
		)
		return null;

	switch (String(aProduct).toLowerCase())
	{
		case 'firefox':
			return _getInstalledLocationOfMozillaProduct('Firefox') ||
					_getInstalledLocationOfMozillaProduct('Minefield');
		case 'thunderbird':
			return _getInstalledLocationOfMozillaProduct('Thunderbird') ||
					_getInstalledLocationOfMozillaProduct('Shredder');
		default:
			return null;
	}
}
	
function _getInstalledLocationOfMozillaProduct(aProduct) 
{
	if (
		!aProduct ||
		navigator.platform.toLowerCase().indexOf('win32') < 0
		)
		return null;

	var key;
	switch (String(aProduct).toLowerCase())
	{
		case 'firefox':
			key = 'Mozilla\\Mozilla Firefox';
			break;
		case 'thunderbird':
			key = 'Mozilla\\Mozilla Thunderbird';
			break;
		case 'minefield':
			key = 'Mozilla\\Minefield';
			break;
		case 'shredder':
			key = 'Mozilla\\Shredder';
			break;
		default:
			return null;
	}

	try {
		var productKey = Cc['@mozilla.org/windows-registry-key;1']
				.createInstance(Ci.nsIWindowsRegKey);
		productKey.open(
			productKey.ROOT_KEY_LOCAL_MACHINE,
			'SOFTWARE\\'+key,
			productKey.ACCESS_READ
		);
		var version = productKey.readStringValue('CurrentVersion');
		var curVerKey = productKey.openChild(version+'\\Main', productKey.ACCESS_READ);
		var path = curVerKey.readStringValue('PathToExe');
		curVerKey.close();
		productKey.close();

		return getFileFromPath(path);
	}
	catch(e) {
	}
	return null;
}
   
// デバッグ 
var _console = Cc['@mozilla.org/consoleservice;1']
		.getService(Ci.nsIConsoleService);
	
function log() 
{
	_console.logStringMessage(Array.slice(arguments).join('\n'));
}
 
function dump() 
{
	this.log.apply(this, arguments);
}
  
const ObserverService = Cc['@mozilla.org/observer-service;1'] 
			.getService(Ci.nsIObserverService);
function notify(aSubject, aTopic, aData)
{
	ObserverService.notifyObservers(aSubject, aTopic, aData);
}
  
