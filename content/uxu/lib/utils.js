// -*- indent-tabs-mode: t; tab-width: 4 -*-

var mozlab_custom_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = mozlab_custom_module.require('package', 'bundle');

var IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);

// URI文字列からnsIURIのオブジェクトを生成
function makeURIFromSpec(aURI) {
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
function makeFileWithPath(aPath) {
	var newFile = Components.classes['@mozilla.org/file/local;1']
					.createInstance(Components.interfaces.nsILocalFile);
	newFile.initWithPath(aPath);
	return newFile;
};


// URL文字列→nsIFile
function getFileFromURLSpec(aURI) {
	if ((aURI || '').indexOf('file://') != 0) return '';

	var fileHandler = IOService.getProtocolHandler('file')
						.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
	return fileHandler.getFileFromURLSpec(aURI);
};

// URL文字列→ファイルのパス
function getFilePathFromURLSpec(aURI) {
	return getFileFromURLSpec(aURI).path;
};
 
// ファイルのパス→nsIURI
function getURLFromFilePath(aPath) {
	var tempLocalFile = makeFileWithPath(aPath);
	return IOService.newFileURI(tempLocalFile);
};

// ファイルのパス→URL文字列
function getURLSpecFromFilePath(aPath) {
	return getURLFromFilePath(aPath).spec;
};



// ファイルまたはURIで示された先のリソースを読み込み、文字列として返す
function readFrom(aTarget, aEncoding) {
	if (typeof aTarget == 'string') {
		aTarget = this.fixupIncompleteURI(aTarget);
		if (aTarget.match(/^\w+:\/\//))
			aTarget = makeURIFromSpec(aTarget);
		else
			aTarget = makeFileWithPath(aTarget);
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

	var fileContents = null;
	try {
		if (aEncoding) {
			var converterStream = Components.classes['@mozilla.org/intl/converter-input-stream;1']
					.createInstance(Components.interfaces.nsIConverterInputStream);
			var buffer = stream.available();
			converterStream.init(stream, aEncoding, buffer,
				converterStream.DEFAULT_REPLACEMENT_CHARACTER);
			var out = { value : null };
			converterStream.readString(stream.available(), out);
			converterStream.close();
			fileContents = out.value;
		}
		else {
			var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1']
					.createInstance(Components.interfaces.nsIScriptableInputStream);
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
function writeTo(aContent, aTarget, aEncoding) {
	if (typeof aTarget == 'string') {
		aTarget = this.fixupIncompleteURI(aTarget);
		if (aTarget.match(/^\w+:\/\//))
			aTarget = makeURIFromSpec(aTarget);
		else
			aTarget = makeFileWithPath(aTarget);
	}

	try {
		aTarget = aTarget.QueryInterface(Components.interfaces.nsILocalFile)
	}
	catch(e) {
		aTarget = aTarget.QueryInterface(Components.interfaces.nsIURI);
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

	var stream = Components.classes['@mozilla.org/network/file-output-stream;1']
			.createInstance(Components.interfaces.nsIFileOutputStream);
	stream.init(aTarget, 2, 0x200, false); // open as "write only"

	if (aEncoding) {
		var converterStream = Components.classes['@mozilla.org/intl/converter-output-stream;1']
				.createInstance(Components.interfaces.nsIConverterOutputStream);
		var buffer = aContent.length;
		converterStream.init(stream, aEncoding, buffer, Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
		converterStream.writeString(aContent);
		converterStream.close();
	}
	else {
		stream.write(aContent, aContent.length);
	}

	stream.close();

	return aTarget;
}




function formatError(e) {
	return formatStackTrace(e) + e.toString() + '\n';
}

function formatStackTrace(exception)
{
    var trace = '';

    if (exception.stack) {
        var calls = exception.stack.split('\n');
        for each (var call in calls) {
            if (call.length > 0) {
                call = String(call).replace(/\\n/g, '\n');

                if (call.length > 200)
                    call = call.substr(0, 200) + '[...]\n';

				if (call.match(/^@data:application\/x-javascript,/)) {
					var info = RegExp.rightContext.split(":");
					var source = decodeURIComponent(info[0]);
					var line = info[1];
					trace += "(eval):" + line + ":" + source + "\n";
				} else {
					trace += call + '\n';
				}
            }
        }
    }
    return trace;
}



var Pref = Components.classes['@mozilla.org/preferences;1'] 
		.getService(Components.interfaces.nsIPrefBranch)
		.QueryInterface(Components.interfaces.nsIPrefBranch2);

function getPref(aKey) {
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

function setPref(aKey, aValue) {
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

function clearPref(aKey) {
	try {
		Pref.clearUserPref(aKey);
	}
	catch(e) {
	}
}




function UTF8ToUnicode(aInput) {
	return this.UTF8ToUCS2(aInput);
}
function UnicodeToUTF8(aInput) {
	return this.UCS2ToUTF8(aInput);
}

function UTF8ToUCS2(aInput) {
	return decodeURIComponent(escape(aInput));
}
function UCS2ToUTF8(aInput) {
	return unescape(encodeURIComponent(aInput));
}

var UCONV = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
			.getService(Components.interfaces.nsIScriptableUnicodeConverter);

function XToUnicode(aInput, aEncoding) {
	return this.XToUCS2(aInput, aEncoding);
}

function UnicodeToX(aInput, aEncoding) {
	return this.UCS2ToX(aInput, aEncoding);
}

function XToUCS2(aInput, aEncoding) {
	if (aEncoding == 'UTF-8') return UTF8ToUnicode(aInput);
	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertToUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}

function UCS2ToX(aInput, aEncoding) {
	if (aEncoding == 'UTF-8') return UnicodeToUTF8(aInput);

	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertFromUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}


function fixupIncompleteURI(aURIOrPart) {
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


function isGeneratedIterator(aObject) {
	return (
		aObject &&
		'next' in aObject &&
		'send' in aObject &&
		'throw' in aObject &&
		'close' in aObject &&
		aObject == '[object Generator]'
	);
}

function makeStackLine(aStack) {
	if (typeof aStack == 'string') return aStack;
	return '()@' + aStack.filename + ':' + aStack.lineNumber + '\n';;
}

function doIteration(aGenerator, aCallbacks) {
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
			e.stack += callerStack;
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			if (aCallbacks.onEnd)
				aCallbacks.onEnd(e);
		}
		catch(e if e.name == 'AssertionFailed') {
			e.stack += callerStack;
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			if (aCallbacks.onFail)
				aCallbacks.onFail(e);
			else if (aCallbacks.onError)
				aCallbacks.onError(e);
		}
		catch(e) {
			e.stack += callerStack;
			retVal.error = e;
			retVal.value = true;
			if (!aCallbacks) return;

			if (aCallbacks.onError)
				aCallbacks.onError(e);
		}
	})(null);

	return retVal;
}


function Do(aObject) {
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
function getDB() {
	if (_db) return _db;

	const DirectoryService = Components
		.classes['@mozilla.org/file/directory_service;1']
		.getService(Components.interfaces.nsIProperties);
	var file = DirectoryService.get('ProfD', Components.interfaces.nsIFile);
	file.append('uxu.sqlite');

	const StorageService = Components
		.classes['@mozilla.org/storage/service;1']
		.getService(Components.interfaces.mozIStorageService);
	_db = StorageService.openDatabase(file);

	return _db;
}

