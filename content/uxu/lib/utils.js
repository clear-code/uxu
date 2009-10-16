// -*- indent-tabs-mode: t; tab-width: 4 -*- 

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');
var prefread = lib_module.require('package', 'prefread');

var IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);

const ERROR_INVALID_OWNER = new Error('invalid owner');
const ERROR_INVALID_XPATH_EXPRESSION = new Error('invalid expression');
const ERROR_SLEEP_IS_NOT_AVAILABLE = new Error('"speep()" is not available on Gecko 1.8.x');
const ERROR_PLATFORM_IS_NOT_WINDOWS = new Error('the platform is not Windows!');
const ERROR_FAILED_TO_WRITE_REGISTORY = new Error('failed to write a value to the registory');
	
// DOMノード取得 
	
function _getDocument(aOwner) 
{
	var doc = !aOwner ?
				document :
			aOwner instanceof Ci.nsIDOMDocument ?
				aOwner :
			aOwner instanceof Ci.nsIDOMNode ?
				aOwner.ownerDocument :
			aOwner instanceof Ci.nsIDOMWindow ?
				aOwner.document :
				null;
	if (!doc) throw ERROR_INVALID_OWNER;
	return doc;
}
 
function $(aNodeOrID, aOwner) 
{
	if (typeof aNodeOrID == 'string') {
		var doc = _getDocument(aOwner);
		return doc.getElementById(aNodeOrID);
	}
	return aNodeOrID;
}
 
// http://lowreal.net/logs/2006/03/16/1
function $X() 
{
	if (!arguments || !arguments.length) throw ERROR_INVALID_XPATH_EXPRESSION;

	var expression = null,
		context    = null,
		resolver   = null,
		type       = null;
	arguments = Array.slice(arguments);
	switch (arguments.length)
	{
		case 1:
			[expression] = arguments;
			break;
		case 2:
			[expression, context] = arguments;
			break;
		case 3:
			[expression, context, type] = arguments;
			break;
		default:
			[expression, context, resolver, type] = arguments;
			break;
	}

	if (!expression) throw ERROR_INVALID_XPATH_EXPRESSION;

	var doc = _getDocument(context);
	if (!context) context = doc;

	var result = doc.evaluate(
			expression,
			context,
			resolver,
			type || XPathResult.ANY_TYPE,
			null
		);
	switch (type || result.resultType)
	{
		case XPathResult.STRING_TYPE:
			return result.stringValue;
		case XPathResult.NUMBER_TYPE:
			return result.numberValue;
		case XPathResult.BOOLEAN_TYPE:
			return result.booleanValue;
		case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
		case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
		case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
			result = doc.evaluate(
				expression,
				context,
				resolver,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
		case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
			var nodes = [];
			for (let i = 0, maxi = result.snapshotLength; i < maxi; i++)
			{
				nodes.push(result.snapshotItem(i));
			}
			return nodes;
		case XPathResult.ANY_UNORDERED_NODE_TYPE:
		case XPathResult.FIRST_ORDERED_NODE_TYPE:
			return result.singleNodeValue;
	}
	return null;
}
  
// タイマー操作 
	
// http://d.hatena.ne.jp/fls/20090224/p1
const isSleepAvailable = '@mozilla.org/thread-manager;1' in Cc;
function sleep(aWait) 
{
	if (!isSleepAvailable) {
		throw ERROR_SLEEP_IS_NOT_AVAILABLE;
	}
	var timer = { timeup: false };
	var interval = window.setInterval(function() {
			timer.timeup = true;
		}, aWait);
	var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
	while (!timer.timeup)
	{
		thread.processNextEvent(true);
	}
	window.clearInterval(interval);
}
  
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
function getFileFromPath(aPath) // alias
{
	return makeFileWithPath(aPath);
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
	var target = this.normalizeToFile(aTarget);
	if (!target) throw new Error('Error: Utils::readFrom() requires a file path or a File URL. '+aTarget+' is invalid!');

	var stream;
	try {
		target = target.QueryInterface(Ci.nsIURI);
		var channel = IOService.newChannelFromURI(target);
		stream = channel.open();
	}
	catch(e) {
		target = target.QueryInterface(Ci.nsILocalFile)
		stream = Cc['@mozilla.org/network/file-input-stream;1']
					.createInstance(Ci.nsIFileInputStream);
		try {
			stream.init(target, 1, 0, false); // open as "read only"
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
	target = this.normalizeToFile(aTarget);
	if (!target) throw new Error('Error: Utils::writeTo() requires a file path or a File URL. '+aTarget+' is invalid!');

	// create directories
	(function(aDir) {
		try {
			if (aDir.parent) arguments.callee(aDir.parent);
			if (aDir.exists()) return;
			aDir.create(aDir.DIRECTORY_TYPE, 0755);
		}
		catch(e) {
		}
	})(target.parent);

	var tempFile = getFileFromKeyword('TmpD');
	tempFile.append(target.localName+'.writing');
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

	if (target.exists()) target.remove(true);
	tempFile.moveTo(target.parent, target.leafName);

	return target;
}
 
function readCSV(aTarget, aEncoding, aContext) 
{
	var input = this.readFrom(aTarget, aEncoding);
	if (aContext) input = this.parseTemplate(input, aContext);
	return this.parseCSV(input);
}
 
function readParametersFromCSV(aTarget, aEncoding, aContext) 
{
	return this.parseParametersFromCSV(this.readCSV(aTarget, aEncoding, aContext));
}
var readParameterFromCSV = readParametersFromCSV;
var readParamsFromCSV = readParametersFromCSV;
var readParamFromCSV = readParametersFromCSV;
 
function readJSON(aTarget, aEncoding, aContext) 
{
	var input = this.readFrom(aTarget, aEncoding);
	if (aContext) input = this.parseTemplate(input, aContext);
	eval('input = ('+input+')');
	return input;
}
 
// Subversionが作る不可視のファイルなどを除外して、普通に目に見えるファイルだけを複製する 
function cosmeticClone(aOriginal, aDest, aName)
{
	aOriginal = normalizeToFile(aOriginal);
	aDest = normalizeToFile(aDest);

	if (
		!aOriginal ||
		!aOriginal.exists() ||
		aOriginal.isHidden() ||
		aOriginal.leafName.indexOf('.') == 0
		)
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
	var encoding = aEncoding || this.getPref('extensions.uxu.defaultEncoding');
	var script;
	try {
		script = this.readFrom(aSource, encoding) || '';
	}
	catch(e) {
		throw new Error('Error: Utils::include() failed to read specified script.\n'+e);
	}
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
 
// テンポラリファイル 
var tempFiles = [];
	
function makeTempFile(aOriginal, aCosmetic) 
{
	var temp = this.getFileFromKeyword('TmpD');
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
			this.cosmeticClone(aOriginal, temp.parent, temp.leafName);
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
 
function cleanUpTempFiles(aDelayed) 
{
	_cleanUpTempFiles(aDelayed, null, this);
};
function _cleanUpTempFiles(aDelayed, aTempFiles, aSelf)
{
	if (!aSelf) aSelf = this;
	if (!aTempFiles) {
		aTempFiles = Array.slice(aSelf.tempFiles);
		aSelf.tempFiles.splice(0, aSelf.tempFiles.length);
	}
	if (aDelayed) {
		window.setTimeout(arguments.callee, 1000, false, aTempFiles, aSelf);
		return;
	}
	aTempFiles.forEach(function(aFile) {
		try {
			if (aFile.exists()) aFile.remove(true);
			return;
		}
		catch(e) {
			var message = 'failed to remove temporary file:\n'+aFile.path+'\n'+e;
			if ('Application' in window)
				Application.console.log(message);
			else
				window.dump(message+'\n');
			aSelf.scheduleToRemove(aFile);
		}
	});
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
			e.stack = getStackTrace();
			break;

		case 'string':
		case 'boolean':
			var msg = bundle.getFormattedString('unknown_exception', [e]);
			e = new Error(msg);
			e.stack = getStackTrace();
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
		stackLines = stackLines.concat(String(aException.stack).split('\n'));
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
 
function getStackTrace() 
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
  
// Windowsレジストリ読み書き 
	
function _splitRegistoryKey(aKey) 
{
	var root = -1, path = '', name = '';
	if (!('nsIWindowsRegKey' in Ci)) throw ERROR_PLATFORM_IS_NOT_WINDOWS;

	path = aKey.replace(/\\([^\\]+)$/, '');
	name = RegExp.$1;

	path = path.replace(/^([^\\]+)\\/, '');
	root = RegExp.$1.toUpperCase();
	switch (root)
	{
		case 'HKEY_CLASSES_ROOT':
		case 'HKCR':
			root = Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT;
			break;

		case 'HKEY_CURRENT_USER':
		case 'HKCU':
			root = Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER;
			break;

		case 'HKEY_LOCAL_MACHINE':
		case 'HKLM':
			root = Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE;
			break;

		default:
			root = -1;
			break;
	}

	return [root, path, name];
}
 
function getWindowsRegistory(aKey) 
{
	var value = null;

	var root, path, name;
	[root, path, name] = _splitRegistoryKey(aKey);
	if (root < 0 || !path || !name) return value;

	var regKey = Cc['@mozilla.org/windows-registry-key;1']
					.createInstance(Ci.nsIWindowsRegKey);
	try {
		regKey.open(root, path, Ci.nsIWindowsRegKey.ACCESS_READ);
	}
	catch(e) {
		regKey.close();
		return value;
	}

	if (regKey.hasValue(name)) {
		switch (regKey.getValueType(name))
		{
			case Ci.nsIWindowsRegKey.TYPE_NONE:
				value = true;
				break;
			case Ci.nsIWindowsRegKey.TYPE_STRING:
				value = regKey.readStringValue(name);
				break;
			case Ci.nsIWindowsRegKey.TYPE_BINARY:
				value = regKey.readBinaryValue(name);
				value = value.split('').map(function(aChar) {
					return aChar.charCodeAt(0);
				});
				break;
			case Ci.nsIWindowsRegKey.TYPE_INT:
				value = regKey.readIntValue(name);
				break;
			case Ci.nsIWindowsRegKey.TYPE_INT64:
				value = regKey.readInt64Value(name);
				break;
		}
	}

	regKey.close();
	return value;
}
 
function setWindowsRegistory(aKey, aValue) 
{
	var root, path, name;
	[root, path, name] = _splitRegistoryKey(aKey);
	if (root < 0 || !path || !name) throw ERROR_FAILED_TO_WRITE_REGISTORY;

	// create upper level items automatically
	var ancestors = [];
	var ancestor = path;
	do {
		ancestors.push(ancestor);
	}
	while (ancestor = ancestor.replace(/\\?[^\\]+$/, ''));
	ancestors.reverse().slice(1).forEach(function(aPath) {
		aPath = aPath.replace(/\\([^\\]+)$/, '');
		var name = RegExp.$1;
		var regKey = Cc['@mozilla.org/windows-registry-key;1']
						.createInstance(Ci.nsIWindowsRegKey);
		try {
			regKey.open(root, aPath, Ci.nsIWindowsRegKey.ACCESS_WRITE);
		}
		catch(e) {
			regKey.close();
			return;
		}
		try {
			if (!regKey.hasChild(name))
				regKey.createChild(name, Ci.nsIWindowsRegKey.ACCESS_WRITE);
		}
		catch(e) {
			regKey.close();
			throw e;
		}
		regKey.close();
	});

	var regKey = Cc['@mozilla.org/windows-registry-key;1']
					.createInstance(Ci.nsIWindowsRegKey);
	regKey.open(root, path, Ci.nsIWindowsRegKey.ACCESS_ALL);

	function closeAndThrowError(aError)
	{
		regKey.close();
		throw aError || ERROR_FAILED_TO_WRITE_REGISTORY;
	}

	try {
		var type;
		if (regKey.hasValue(name)) {
			type = regKey.getValueType(name);
		}
		else {
			switch (typeof aValue)
			{
				case 'string':
					type = Ci.nsIWindowsRegKey.TYPE_STRING;
					break;
				case 'boolean':
					type = Ci.nsIWindowsRegKey.TYPE_INT;
					break;
				case 'number':
					type = Ci.nsIWindowsRegKey.TYPE_INT;
					break;
				case 'object':
					if (isArray(aValue)) {
						type = Ci.nsIWindowsRegKey.TYPE_BINARY;
					}
					else {
						closeAndThrowError();
					}
					break;
			}
		}

		switch (type)
		{
			case Ci.nsIWindowsRegKey.TYPE_NONE:
				closeAndThrowError();
				break;
			case Ci.nsIWindowsRegKey.TYPE_STRING:
				regKey.writeStringValue(name, String(aValue));
				break;
			case Ci.nsIWindowsRegKey.TYPE_BINARY:
				switch (typeof aValue)
				{
					case 'boolean':
						aValue = String.fromCharCode(aValue ? 1 : 0 );
						break;
					case 'string':
						aValue = UCS2ToUTF8(aValue);
						break;
					case 'number':
						aValue = String.fromCharCode(parseInt(aValue));
						break;
					case 'object':
						if (isArray(aValue)) {
							aValue = aValue.map(function(aCode) {
								if (typeof aCode != 'number') closeAndThrowError();
								return String.fromCharCode(aCode);
							}).join('');
						}
						else {
							closeAndThrowError();
						}
						break;
				}
				regKey.writeBinaryValue(name, aValue);
				break;
			case Ci.nsIWindowsRegKey.TYPE_INT:
				switch (typeof aValue)
				{
					case 'boolean':
						aValue = aValue ? 1 : 0 ;
						break;
					case 'string':
					case 'number':
						aValue = parseInt(aValue);
						if (isNaN(aValue)) closeAndThrowError();
						break;
					case 'object':
						closeAndThrowError();
						break;
				}
				regKey.writeIntValue(name, aValue);
				break;
			case Ci.nsIWindowsRegKey.TYPE_INT64:
				switch (typeof aValue)
				{
					case 'boolean':
						aValue = aValue ? 1 : 0 ;
						break;
					case 'string':
					case 'number':
						aValue = parseInt(aValue);
						if (isNaN(aValue)) closeAndThrowError();
						break;
					case 'object':
						closeAndThrowError();
						break;
				}
				regKey.writeInt64Value(name, aValue);
				break;
		}
	}
	catch(e) {
		closeAndThrowError(e);
	}

	regKey.close();
	return aValue;
}
 
function clearWindowsRegistory(aKey) 
{
	var root, path, name;
	[root, path, name] = _splitRegistoryKey(aKey);
	if (root < 0 || !path || !name) throw ERROR_FAILED_TO_WRITE_REGISTORY;

	_clearWindowsRegistory(root, path+'\\'+name);
}
function _clearWindowsRegistory(aRoot, aPath)
{
	try {
		var regKey = Cc['@mozilla.org/windows-registry-key;1']
						.createInstance(Ci.nsIWindowsRegKey);
		regKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
		try {
			let values = [];
			for (let i = 0, maxi = regKey.valueCount; i < maxi; i++)
			{
				values.push(regKey.getValueName(i));
			}
			values.forEach(function(aName) {
				regKey.removeValue(aName);
			});
		}
		catch(e) {
		}
		try {
			let children = [];
			for (let i = 0, maxi = regKey.childCount; i < maxi; i++)
			{
				children.push(regKey.getChildName(i));
			}
			children.forEach(function(aName) {
				_clearWindowsRegistory(aRoot, aPath+'\\'+aName);
			});
		}
		catch(e) {
		}
		regKey.close();
	}
	catch(e) {
	}

	aPath = aPath.replace(/\\([^\\]+)$/, '');
	var name = RegExp.$1;
	var parentRegKey = Cc['@mozilla.org/windows-registry-key;1']
					.createInstance(Ci.nsIWindowsRegKey);
	try {
		parentRegKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
		try {
			if (parentRegKey.hasValue(name))
				parentRegKey.removeValue(name);
			if (parentRegKey.hasChild(name))
				parentRegKey.removeChild(name);
		}
		catch(e) {
			parentRegKey.close();
			throw e;
		}
		finally {
			parentRegKey.close();
		}
	}
	catch(e) {
	}
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

	var callerStack = getStackTrace();

	var retVal = { value : false };
	var lastRun = Date.now();
	var timeout = Math.max(0, getPref('extensions.uxu.run.timeout'));
	(function(aObject) {
		try {
			if (Date.now() - lastRun >= timeout)
				throw new Error(bundle.getFormattedString('error_generator_timeout', [parseInt(timeout / 1000)]));

			if (aObject !== void(0)) {
				var continueAfterDelay = false;
				if (aObject instanceof Error) {
					throw returnedValue;
				}
				else if (typeof aObject == 'number') {
					// TraceMonkeyのバグなのかなんなのか、指定時間経つ前にタイマーが発動することがあるようだ……
					continueAfterDelay = (Date.now() - lastRun < aObject);
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
			lastRun = Date.now();

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
				window.setTimeout(arguments.callee, wait, wait);
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
	})();

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
	_db = this.openDatabase(dbFile);
	return _db;
}
 
function openDatabase(aFile) 
{
	aFile = this.normalizeToFile(aFile);
	const StorageService = Cc['@mozilla.org/storage/service;1']
		.getService(Ci.mozIStorageService);
	return StorageService.openDatabase(aFile);
}
 
function createDatabase() 
{
	var file = this.makeTempFile();
	return this.openDatabase(file);
}
 
function createDatabaseFromSQL(aSQL) 
{
	var connection = this.createDatabase();
	if (aSQL) {
		if (connection.transactionInProgress)
			connection.commitTransaction();
		if (!connection.transactionInProgress)
			connection.beginTransaction();
		connection.executeSimpleSQL(aSQL);
		if (connection.transactionInProgress)
			connection.commitTransaction();
	}
	return connection;
}
 
function createDatabaseFromSQLFile(aSQLFile, aEncoding) 
{
	aSQLFile = this.normalizeToFile(aSQLFile);
	var sql;
	try {
		sql = this.readFrom(aSQLFile, aEncoding);
	}
	catch(e) {
		throw new Error('Error: Utils::createDatabaseFromSQLFile() failed to read specified file.\n'+e);
	}
	return this.createDatabaseFromSQL(sql);
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

		var ArrayClass, StringClass, toStringMethod;
		if (aTarget instanceof Ci.nsIDOMWindow) {
			ArrayClass     = aTarget.Array;
			StringClass    = aTarget.String;
			toStringMethod = aTarget.Object.prototype.toString;
		}
		else {
			ArrayClass     = eval('Array', aTarget);
			StringClass    = eval('String', aTarget);
			toStringMethod = eval('Object.prototype.toString', aTarget);
		}

		if (aTarget instanceof ArrayClass) {
			index = inspectedObjects.length;
			inspectedObjects.push(aTarget);
			inspectedResults[index] = aTarget.toString();

			var values = aTarget.map(arguments.callee);
			inspectedResults[index] = "[" + values.join(", ") + "]";
			return inspectedResults[index];
		}
		else if (typeof aTarget == 'string' ||
		           aTarget instanceof StringClass) {
			return '"' + aTarget.replace(/\"/g, '\\"') + '"';
		}
		else if (aTarget.__proto__.toString == toStringMethod) {
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
		}
		else {
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
	var root = _getRootScope(aObject);
	return aObject &&
		(root && root.Array ?
			(aObject instanceof root.Array) :
			(aObject instanceof eval('Array', aObject))
		);
}
 
function isDate(aObject) 
{
	var root = _getRootScope(aObject);
	return aObject &&
		(root && root.Date ?
			(aObject instanceof root.Date) :
			(aObject instanceof eval('Date', aObject))
		);
}
 
function isObject(aObject) 
{
	return (aObject &&
			typeof aObject == "object" &&
			aObject == '[object Object]');
}
 
function _getRootScope(aObject) 
{
	if (aObject === null || aObject === void(0)) {
		return aObject;
	}
	while (aObject.__parent__)
	{
		aObject = aObject.__parent__;
	}
	return aObject;
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
  
// 文字列処理 
	
function parseTemplate(aCode, aContext) 
{
	var __parseTemplate__codes = [];
	aCode.split('%>').forEach(function(aPart) {
		let strPart, codePart;
		[strPart, codePart] = aPart.split('<%');
		__parseTemplate__codes.push('__parseTemplate__results.push('+
		                            strPart.toSource()+
		                            ');');
		if (!codePart) return;
		if (codePart.charAt(0) == '=') {
			__parseTemplate__codes.push('__parseTemplate__results.push(('+
			                            codePart.substring(1)+
			                            ') || "");');
		}
		else {
			__parseTemplate__codes.push(codePart);
		}
	});
	var sandbox = new Components.utils.Sandbox(window);
	sandbox.__proto__ = { __parseTemplate__results : [] };
	if (aContext) sandbox.__proto__.__proto__ = aContext;
	Components.utils.evalInSandbox(__parseTemplate__codes.join('\n'), sandbox);
	return sandbox.__parseTemplate__results.join('');
}
 
var hasher = Cc['@mozilla.org/security/hash;1'] 
		.createInstance(Ci.nsICryptoHash);
 
function computeHash(aData, aHashAlgorithm) 
{
	var algorithm = String(aHashAlgorithm).toUpperCase().replace('-', '');
	if (algorithm in hasher) {
		hasher.init(hasher[algorithm])
	}
	else {
		throw new Error('unknown hash algorithm: '+aHashAlgorithm);
	}

	if (aData instanceof Ci.nsIFile) {
		var stream = Cc['@mozilla.org/network/file-input-stream;1']
						.createInstance(Ci.nsIFileInputStream);
		stream.init(aData, 0x01, 0444, 0);
		const PR_UINT32_MAX = 0xffffffff;
		hasher.updateFromStream(stream, PR_UINT32_MAX);
	}
	else {
		var array = aData.split('').map(function(aChar) {
						return aChar.charCodeAt(0);
					});
		hasher.update(array, array.length);
	}
	return hasher.finish(false)
		.split('')
		.map(function(aChar) {
			return ('0' + aChar.charCodeAt(0).toString(16)).slice(-2);
		}).join('').toUpperCase();
}
 
function md2(aData) { return computeHash(aData, 'md2'); } 
function md5(aData) { return computeHash(aData, 'md5'); }
function sha1(aData) { return computeHash(aData, 'sha1'); }
function sha256(aData) { return computeHash(aData, 'sha256'); }
function sha384(aData) { return computeHash(aData, 'sha384'); }
function sha512(aData) { return computeHash(aData, 'sha512'); }
 
function computeHashFromFile(aFile, aHashAlgorithm) 
{
	aFile = this.normalizeToFile(aFile);
	if (!aFile || !aFile.exists() || aFile.isDirectory())
		throw new Error('this is not a legal file');
	return computeHash(aFile, aHashAlgorithm);
}
 
function md2FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'md2'); } 
function md5FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'md5'); }
function sha1FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha1'); }
function sha256FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha256'); }
function sha384FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha384'); }
function sha512FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha512'); }
 
const ERROR_INVALID_REDIRECT_DEFINITION_ARRAY = new Error('definition array of redirection is invalid.');

function redirectURI(aURI, aRedirectDefinition) 
{
	if (!aRedirectDefinition) return aURI;

	var newURI;

	if (typeof aRedirectDefinition == 'function')
		return aRedirectDefinition(makeURIFromSpec(aURI));

	var matchers = [];
	var targets  = [];
	if (isArray(aRedirectDefinition)) {
		if (aRedirectDefinition.length % 2)
			throw ERROR_INVALID_REDIRECT_DEFINITION_ARRAY;
		for (var i = 0, maxi = aRedirectDefinition.length; i < maxi; i = i+2)
		{
			matchers.push(aRedirectDefinition[i]);
			targets.push(aRedirectDefinition[i+1]);
		}
	}
	else {
		for (var prop in aRedirectDefinition)
		{
			matchers.push(prop);
			targets.push(aRedirectDefinition[prop]);
		}
	}
	var regexp = new RegExp();
	matchers.some(function(aMatcher, aIndex) {
		var matcher = aMatcher instanceof RegExp ?
				aMatcher :
				regexp.compile(
					'^'+
					String(aMatcher).replace(/([^*?\w])/g, '\\$1')
						.replace(/\?/g, '(.)')
						.replace(/\*/g, '(.*)')+
					'$'
				);
		if (matcher.test(aURI)) {
			newURI = aURI.replace(matcher, targets[aIndex]);
			return true;
		}
		return false;
	});
	return newURI || aURI;
}
 
// http://liosk.blog103.fc2.com/blog-entry-75.html
// CSV parser based on RFC4180
var CSVTokenizer = /,|\r?\n|[^,"\r\n][^,\r\n]*|"(?:[^"]|"")*"/g;
function parseCSV(aInput) 
{
	var delimiter = ',';
	var record = 0,
		field = 0,
		data = [['']],
		qq = /""/g,
		longest = 0;
	aInput.replace(/\r?\n$/, '')
		.replace(CSVTokenizer, function(aToken) {
			switch (aToken) {
				case delimiter:
					data[record][field] = _normalizeCSVField(data[record][field]);
					data[record][++field] = '';
					if (field > longest) longest = field;
					break;

				case '\n':
				case '\r\n':
					data[record][field] = _normalizeCSVField(data[record][field]);
					data[++record] = [''];
					field = 0;
					break;

				default:
					data[record][field] = (aToken.charAt(0) != '"') ?
						aToken :
						aToken.slice(1, -1).replace(qq, '"') ;
			}
		});
	data[record][field] = _normalizeCSVField(data[record][field]);
	data.forEach(function(aRecord) {
		while (aRecord.length <= longest)
		{
			aRecord.push('');
		}
	});
	return data;
}
function _normalizeCSVField(aSource)
{
	return aSource.replace(/\r\n/g, '\n');
}
 
function parseParametersFromCSV(aCSV) 
{
	var data;
	eval('data = '+aCSV.toSource()); // duplicate object for safe
	var parameters;
	var columns = data.shift();
	var isHash = !columns[0];

	var types = [];
	if (isHash) columns.splice(0, 1);

	var typePattern = /.(\s*\[(string|number|boolean|object|json|auto)\]\s*)$/i;
	var columnNames = {};
	columns = columns.map(function(aColumn) {
		let match = aColumn.match(typePattern);
		if (match) {
			aColumn = aColumn.replace(match[1], '');
			types.push(match[2].toLowerCase());
		}
		else {
			types.push('auto');
		}
		return _ensureUniquieName(aColumn, columnNames);
	});

	if (isHash) {
		var parameters = {};
		var names = {};
		data.forEach(function(aRecord) {
			let name = aRecord.shift();
			let record = {};
			aRecord.forEach(function(aField, aIndex) {
				record[columns[aIndex]] = _convertParameterType(aField, types[aIndex]);
			});
			name = _ensureUniquieName(name, names);
			parameters[name] = record;
		});
		return parameters;
	}
	else {
		return data.map(function(aRecord) {
			let record = {};
			aRecord.forEach(function(aField, aIndex) {
				record[columns[aIndex]] = _convertParameterType(aField, types[aIndex]);
			});
			return record;
		});
	}
}
function _ensureUniquieName(aName, aDatabase)
{
	if (aName in aDatabase) {
		aName = aName+'('+(++aDatabase[aName])+')';
		return arguments.callee(aName, aDatabase);
	}
	else {
		aDatabase[aName] = 1;
		return aName;
	}
}
function _convertParameterType(aData, aType)
{
	if (!aType || aType == 'auto') {
		if (/^[0-9]+(\.[0-9]+)$/.test(aData))
			aType = 'number';
		else if (/^(true|false)$/i.test(aData))
			aType = 'boolean';
		else
			aType = 'string';
	}

	switch (aType)
	{
		case 'number':
			aData = Number(aData);
			break;
		case 'boolean':
			eval('aData = !!('+(aData || '""')+')');
			break;
		case 'object':
		case 'json':
			eval('aData = ('+(aData || '""')+')');
			break;
		case 'string':
		default:
			break;
	}
	return aData;
}
  
// アプリケーション 
var XULAppInfo = Cc['@mozilla.org/xre/app-info;1']
		.getService(Ci.nsIXULAppInfo);
	
var product = (function() { 
	switch (XULAppInfo.ID)
	{
		case '{ec8030f7-c20a-464f-9b0e-13a3a9e97384}':
			return 'Firefox';
		case '{3550f703-e582-4d05-9a08-453d09bdfdc6}':
			return 'Thunderbird';
		case '{86c18b42-e466-45a9-ae7a-9b95ba6f5640}':
			return 'Mozilla'; // Application Suite
		case '{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}':
			return 'Seamonkey';
		case '{718e30fb-e89b-41dd-9da7-e25a45638b28}':
			return 'Sunbird';
		case '{a23983c0-fd0e-11dc-95ff-0800200c9a66}':
			return 'Fennec';
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

	aProduct = String(aProduct).toLowerCase();

	var file = this.getPref('extensions.uxu.product.'+aProduct);
	if (file) {
		file = makeFileWithPath(file);
		if (file.exists()) return file;
	}

	switch (aProduct)
	{
		case 'firefox':
			return _getInstalledLocationOfMozillaProduct('Firefox') ||
					_getInstalledLocationOfMozillaProduct('Minefield');
		case 'thunderbird':
			return _getInstalledLocationOfMozillaProduct('Thunderbird') ||
					_getInstalledLocationOfMozillaProduct('Shredder');
		default:
			return _getInstalledLocationOfMozillaProduct(aProduct);
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
		case 'mozilla':
			key = 'mozilla.org\\Mozilla';
			break;
		case 'seamonkey':
			key = 'mozilla.org\\SeaMonkey';
			break;
		case 'sunbird':
			key = 'Mozilla\\Mozilla Sunbird';
			break;
		case 'fennec':
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

		return makeFileWithPath(path);
	}
	catch(e) {
	}
	return null;
}
   
// バージョン比較 
var _comparator = Cc['@mozilla.org/xpcom/version-comparator;1']
					.getService(Ci.nsIVersionComparator);
	
function compareVersions(aA, aB) 
{
	return _comparator.compare(aA, aB);
}
 
function checkAppVersion(aVersion) 
{
	return compareVersions(XULAppInfo.version, aVersion);
}
function checkApplicationVersion(aVersion)
{
	return checkAppVersion(aVersion);
}
  
// デバッグ 
var _console = Cc['@mozilla.org/consoleservice;1']
		.getService(Ci.nsIConsoleService);
	
function log() 
{
	var message = Array.slice(arguments).join('\n');
	_console.logStringMessage(message);
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
  
