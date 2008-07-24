// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');

var IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);

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
};

// ファイルのパスからnsIFileのオブジェクトを生成
function makeFileWithPath(aPath)
{
	var newFile = Cc['@mozilla.org/file/local;1']
					.createInstance(Ci.nsILocalFile);
	newFile.initWithPath(aPath);
	return newFile;
};


// URL文字列→nsIFile
function getFileFromURLSpec(aURI)
{
	if (!aURI)
		aURI = '';

	if (aURI.indexOf('chrome://') == 0) {
		var ChromeRegistry = Cc["@mozilla.org/chrome/chrome-registry;1"]
			.getService(Ci.nsIChromeRegistry);
		aURI = ChromeRegistry.convertChromeURL(makeURIFromSpec(aURI)).spec;
	}

	if (aURI.indexOf('file://') != 0) return '';

	var fileHandler = IOService.getProtocolHandler('file')
						.QueryInterface(Ci.nsIFileProtocolHandler);
	return fileHandler.getFileFromURLSpec(aURI);
};

// URL文字列→ファイルのパス
function getFilePathFromURLSpec(aURI)
{
	return getFileFromURLSpec(aURI).path;
};
 
// ファイルのパス→nsIURI
function getURLFromFilePath(aPath)
{
	var tempLocalFile = makeFileWithPath(aPath);
	return IOService.newFileURI(tempLocalFile);
};

// ファイルのパス→URL文字列
function getURLSpecFromFilePath(aPath)
{
	return getURLFromFilePath(aPath).spec;
};


// ファイルまたはURIで示された先のリソースを読み込み、文字列として返す
function readFrom(aTarget, aEncoding)
{
	if (typeof aTarget == 'string') {
		aTarget = this.fixupIncompleteURI(aTarget);
		if (aTarget.match(/^\w+:\/\//))
			aTarget = makeURIFromSpec(aTarget);
		else
			aTarget = makeFileWithPath(aTarget);
	}

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
	if (typeof aTarget == 'string') {
		aTarget = this.fixupIncompleteURI(aTarget);
		if (aTarget.match(/^\w+:\/\//))
			aTarget = makeURIFromSpec(aTarget);
		else
			aTarget = makeFileWithPath(aTarget);
	}

	try {
		aTarget = aTarget.QueryInterface(Ci.nsILocalFile)
	}
	catch(e) {
		aTarget = aTarget.QueryInterface(Ci.nsIURI);
		aTarget = getFileFromURLSpec(aTarget.spec);
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


	if (aTarget.exists()) aTarget.remove(true);
	aTarget.create(aTarget.NORMAL_FILE_TYPE, 0666);

	var stream = Cc['@mozilla.org/network/file-output-stream;1']
			.createInstance(Ci.nsIFileOutputStream);
	stream.init(aTarget, 2, 0x200, false); // open as "write only"

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

	return aTarget;
}




function formatError(e)
{
	var options = { onlyFile : true, onlyExternal : true, onlyTraceLine : true};
	return e.toString() + '\n' + formatStackTrace(e, options);
}

var lineRegExp = /@\w+:.+:\d+/;
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
	if (aException.stack) {
		aException.stack.split('\n').forEach(function(aLine) {
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
	}
	return trace;
}

function makeStackLine(aStack)
{
	if (typeof aStack == 'string') return aStack;
	return '()@' + aStack.filename + ':' + aStack.lineNumber + '\n';;
}

function unformatStackLine(aLine)
{
	/@(\w+:.*)?:(\d+)/.test(aLine);
	return {
		source : (RegExp.$1 || ''),
		line   : (RegExp.$2 || '')
	};
}



var Pref = Cc['@mozilla.org/preferences;1'] 
		.getService(Ci.nsIPrefBranch)
		.QueryInterface(Ci.nsIPrefBranch2);

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


var backupPrefs = {};

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
	try {
		Pref.clearUserPref(aKey);
	}
	catch(e) {
	}
}




function UTF8ToUnicode(aInput)
{
	return this.UTF8ToUCS2(aInput);
}
function UnicodeToUTF8(aInput)
{
	return this.UCS2ToUTF8(aInput);
}

function UTF8ToUCS2(aInput)
{
	return decodeURIComponent(escape(aInput));
}
function UCS2ToUTF8(aInput)
{
	return unescape(encodeURIComponent(aInput));
}

var UCONV = Cc['@mozilla.org/intl/scriptableunicodeconverter']
		.getService(Ci.nsIScriptableUnicodeConverter);

function XToUnicode(aInput, aEncoding)
{
	return this.XToUCS2(aInput, aEncoding);
}

function UnicodeToX(aInput, aEncoding)
{
	return this.UCS2ToX(aInput, aEncoding);
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

	var caller = Components.stack.caller;
	var callerStack = '';
	while (caller)
	{
		callerStack += makeStackLine(caller);
		caller = caller.caller;
	}

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

			if (aCallbacks.onEnd)
				aCallbacks.onEnd(e);
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

			if (aCallbacks.onFail)
				aCallbacks.onFail(e);
			else if (aCallbacks.onError)
				aCallbacks.onError(e);
		}
		catch(e) {
			try {
				e.stack += callerStack;
			}
			catch(e) {
			}
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			if (aCallbacks.onError)
				aCallbacks.onError(e);
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


var _db = null;
function getDB()
{
	if (_db) return _db;

	const DirectoryService = Cc['@mozilla.org/file/directory_service;1']
		.getService(Ci.nsIProperties);
	var file = DirectoryService.get('ProfD', Ci.nsIFile);
	file.append('uxu.sqlite');

	const StorageService = Cc['@mozilla.org/storage/service;1']
		.getService(Ci.mozIStorageService);
	_db = StorageService.openDatabase(file);

	return _db;
}

function inspect(aObject)
{
	var inspected = {};
	var _inspect = function (aTarget)
	{
		if (aTarget == null)
			return 'null';
		if (aTarget == undefined)
			return 'undefined';

		if (_inspect[aTarget])
			return _inspect[aTarget];

		if (!aTarget.__proto__)
			return aTarget.toString();

		if (aTarget.__proto__.toString == Object.prototype.toString) {
			_inspect[aTarget] = aTarget.toString();
			var values = [];
			for (var name in aTarget) {
				values.push(name + ": " + _inspect(aTarget[name]));
			}
			_inspect[aTarget] = "{" + values.join(", ") + "}";
			return _inspect[aTarget];
		} else if (aTarget.__proto__ == Array.prototype) {
			_inspect[aTarget] = aTarget.toString();
			var values = aTarget.map(function (aValue) {
					return _inspect(aValue);
				});
			_inspect[aTarget] = "[" + values.join(", ") + "]";
			return _inspect[aTarget];
		} else if (aTarget.__proto__ == String.prototype) {
			return '"' + aTarget.replace(/\"/g, '\\"') + '"';
		} else {
			return aTarget.toString();
		}
	};

	return _inspect(aObject);
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

function equals(aObject1, aObject2)
{
	if (aObject1 === aObject2)
		return true;

	var isArray = function (aObject) {
	    return aObject && aObject.__proto__ == Array.prototype;
	}

	if (isArray(aObject1) && isArray(aObject2)) {
		var i;
		var length = aObject1.length;

		if (length != aObject2.length)
			return false;
		for (i = 0; i < length; i++) {
			if (!equals(aObject1[i], aObject2[i]))
				return false;
		}
		return true;
	}

	return false;
}
