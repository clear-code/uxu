// -*- indent-tabs-mode: t; tab-width: 4 -*-

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

	try {
		var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1']
				.createInstance(Components.interfaces.nsIScriptableInputStream);
		scriptableStream.init(stream);

		var fileContents = scriptableStream.read(scriptableStream.available());

		scriptableStream.close();
		stream.close();

		return aEncoding ? XToUnicode(fileContents, aEncoding) : fileContents ;
	}
	catch(e) {
	}

	return null;
}

// ファイルパスまたはURLで示された先のテキストファイルに文字列を書き出す
function writeTo(aContent, aTarget, aEncoding) {
	if (typeof aTarget == 'string') {
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


	aTarget.create(aTarget.NORMAL_FILE_TYPE, 0666);

	var stream = Components.classes['@mozilla.org/network/file-output-stream;1']
			.createInstance(Components.interfaces.nsIFileOutputStream);
	stream.init(aTarget, 2, 0x200, false); // open as "write only"

	if (aEncoding) aContent = UnicodeToX(aContent, aEncoding);

	stream.write(aContent, aContent.length);

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

function setPref(aKey, aValue) {
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


function UTF8ToUnicode(aInput) {
	return decodeURIComponent(escape(aInput));
}
function UnicodeToUTF8(aInput) {
	return unescape(encodeURIComponent(aInput));
}

var UCONV = Components.classes['@mozilla.org/intl/scriptableunicodeconverter']
			.getService(Components.interfaces.nsIScriptableUnicodeConverter);

function XToUnicode(aInput, aEncoding) {
	if (aEncoding == 'UTF-8') return UTF8ToUnicode(aInput);
	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertToUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}

function UnicodeToX(aInput, aEncoding) {
	if (aEncoding == 'UTF-8') return UnicodeToUTF8(aInput);

	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertFromUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}
