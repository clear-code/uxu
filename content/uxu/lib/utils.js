// -*- indent-tabs-mode: t; tab-width: 4 -*- 

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var prefread = lib_module.require('package', 'prefread');

var ns = {};
Components.utils.import('resource://uxu-modules/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/prefs.js', ns);
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

Components.utils.import('resource://uxu-modules/uconv.js', this);

var IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);
	
function constructor() 
{
}
 
function evalInSandbox(aCode, aOwner) 
{
	try {
		var sandbox = new Components.utils.Sandbox(aOwner || 'about:blank');
		return Components.utils.evalInSandbox(aCode, sandbox);
	}
	catch(e) {
	}
	return void(0);
}
 
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
	if (!doc) throw new Error(bundle.getFormattedString('error_utils_invalid_owner', [aOwner]));
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
	if (!arguments || !arguments.length)
		throw new Error(bundle.getString('error_utils_no_xpath_expression'));

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

	if (!expression) throw new Error(bundle.getString('error_utils_no_xpath_expression'));

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
const isThreadManagerAvailable = '@mozilla.org/thread-manager;1' in Cc; 
 
function sleep(aWait) 
{
	if (!isThreadManagerAvailable)
		throw new Error(bundle.getString('error_utils_sleep_is_not_available'));
	wait(aWait);
}
 
function wait(aWaitCondition) 
{
	if (!isThreadManagerAvailable)
		throw new Error(bundle.getString('error_utils_wait_is_not_available'));

	if (!aWaitCondition) aWaitCondition = 0;

	var finished = { value : false };
	switch (typeof aWaitCondition)
	{
		default:
			aWaitCondition = Number(aWaitCondition);
			if (isNaN(aWaitCondition))
				aWaitCondition = 0;

		case 'number':
			if (aWaitCondition < 0)
				throw new Error(bundle.getFormattedString('error_utils_wait_unknown_condition', [String(aWaitCondition)]));

			var timer = window.setTimeout(function() {
					finished.value = true;
					window.clearTimeout(timer);
				}, aWaitCondition);
			break;

		case 'function':
			var retVal = aWaitCondition();
			if (isGeneratedIterator(retVal)) {
				finished = doIteration(retVal);
			}
			else if (retVal) {
				finished.value = true;
			}
			else {
				let timer = window.setInterval(function() {
						finished.value = aWaitCondition();
						if (finished.value)
							window.clearInterval(timer);
					}, 10);
			}
			break;

		case 'object':
			if (isGeneratedIterator(aWaitCondition)) {
				finished = doIteration(aWaitCondition);
			}
			else {
				if (!aWaitCondition || !('value' in aWaitCondition))
					throw new Error(bundle.getFormattedString('error_utils_wait_unknown_condition', [String(aWaitCondition)]));
				finished = aWaitCondition;
			}
			break;
	}

	var lastRun = Date.now();
	var timeout = Math.max(0, this.getPref('extensions.uxu.run.timeout'));
	var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
	while (!finished.value)
	{
		thread.processNextEvent(true);
		if (Date.now() - lastRun >= timeout)
			throw new Error(bundle.getFormattedString('error_utils_wait_timeout', [parseInt(timeout / 1000)]));
	}
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
	if (!target)
		throw new Error(bundle.getFormattedString('error_utils_read_from', [aTarget]));

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
	if (!target)
		throw new Error(bundle.getFormattedString('error_utils_write_to', [aTarget]));

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
 
function readCSV(aTarget, aEncoding, aScope, aDelimiter) 
{
	var input = this.readFrom(aTarget, aEncoding || this.getPref('extensions.uxu.defaultEncoding'));
	if (aScope) input = this.processTemplate(input, aScope);
	return parseCSV(input, aDelimiter);
}
 
function readTSV(aTarget, aEncoding, aScope) 
{
	return this.readCSV(aTarget, aEncoding, aScope, '\t');
}
 
function readParametersFromCSV(aTarget, aEncoding, aScope) 
{
	return _parseParametersFrom2DArray(this.readCSV(aTarget, aEncoding, aScope));
}
var readParameterFromCSV = readParametersFromCSV;
var readParamsFromCSV = readParametersFromCSV;
var readParamFromCSV = readParametersFromCSV;
 
function readParametersFromTSV(aTarget, aEncoding, aScope) 
{
	return _parseParametersFrom2DArray(this.readTSV(aTarget, aEncoding, aScope));
}
var readParameterFromTSV = readParametersFromTSV;
var readParamsFromTSV = readParametersFromTSV;
var readParamFromTSV = readParametersFromTSV;
 
function readJSON(aTarget, aEncoding, aScope) 
{
	var input = this.readFrom(aTarget, aEncoding || this.getPref('extensions.uxu.defaultEncoding'));
	if (aScope) input = this.processTemplate(input, aScope);
	try {
		input = evalInSandbox('('+input+')');
	}
	catch(e) {
		throw new Error(bundle.getFormattedString('error_utils_readJSON_error', [e]));
	}
	return input;
}
 
// Subversionが作る不可視のファイルなどを除外して、普通に目に見えるファイルだけを複製する 
function cosmeticClone(aOriginal, aDest, aName, aInternalCall)
{
	var orig = this.normalizeToFile(aOriginal);
	var dest = this.normalizeToFile(aDest);

	if (!orig)
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_no_original', [aOriginal]));
	if (!orig.exists())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_original_not_exists', [orig.path]));
	if (orig.isHidden() || orig.leafName.indexOf('.') == 0) {
		if (!aInternalCall)
			throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_original_hidden', [orig.path]));
		return;
	}

	if (!dest)
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_no_dest', [aDest]));
	if (!dest.exists())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_dest_not_exist', [dest.path]));
	if (!dest.isDirectory())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_dest_not_folder', [dest.path]));

	if (!aName) aName = orig.leafName;

	var destFile = dest.clone();
	destFile.append(aName);
	if (destFile.exists())
		throw new Error(bundle.getFormattedString('error_utils_cosmeticClone_duplicate', [destFile.path]));

	if (orig.isDirectory()) {
		destFile.create(destFile.DIRECTORY_TYPE, 0777);

		var files = orig.directoryEntries;
		var file;
		while (files.hasMoreElements())
		{
			file = files.getNext().QueryInterface(Ci.nsILocalFile);
			arguments.callee.call(this, file, destFile, file.leafName, true);
		}
		return destFile;
	}
	else {
		orig.copyTo(dest, aName);
		return destFile;
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

function include(aSource, aEncoding, aScope)
{
	var allowOverrideConstants = false;

	if (aSource &&
		aEncoding === void(0) &&
		aScope === void(0) &&
		typeof aSource == 'object') { // hash style options
		let options = aSource;
		aSource = options.source || options.uri || options.url ;
		aEncoding = options.encoding || options.charset;
		aScope = options.scope || options.namespace || options.ns;
		allowOverrideConstants = options.allowOverrideConstants;
	}
	else if (typeof aEncoding == 'object') { // for backward compatibility
		let scope = aEncoding;
		aEncoding = aScope;
		aScope = scope;
	}

	aSource = this.fixupIncompleteURI(aSource);
	var encoding = aEncoding || this.getPref('extensions.uxu.defaultEncoding');
	var script;
	try {
		script = this.readFrom(aSource, encoding) || '';
		if (allowOverrideConstants)
			script = script.replace(/^\bconst\s+/gm, 'var ');
	}
	catch(e) {
		throw new Error(bundle.getFormattedString('error_utils_include', [e]));
	}
	aScope = aScope || {};
	aScope._lastEvaluatedScript = script;
	loader.loadSubScript(
		'chrome://uxu/content/lib/subScriptRunner.js?includeSource='+
			encodeURIComponent(aSource)+
			';encoding='+encoding,
		aScope
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
			try {
				var resolved = this.fixupIncompleteURI(aOriginal);
				if (resolved.match(/^\w+:\/\//))
					aOriginal = this.makeURIFromSpec(resolved);
				else
					aOriginal = this.makeFileWithPath(resolved);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_invalid_original_file', [aOriginal]));
			}
		}
		try {
			aOriginal = aOriginal.QueryInterface(Ci.nsILocalFile)
		}
		catch(e) {
			try {
				aOriginal = this.getFileFromURLSpec(aOriginal.spec);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_invalid_original_file', [aOriginal]));
			}
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
var createTempFile = makeTempFile;
 
function makeTempFolder(aOriginal, aCosmetic) 
{
	if (aOriginal)
		return makeTempFile(aOriginal, aCosmetic);

	var temp = this.getFileFromKeyword('TmpD');
	temp.append('uxu.tmp_dir');
	temp.createUnique(temp.DIRECTORY_TYPE, 0777);
	this.tempFiles.push(temp);
	return temp;
};
var makeTempDir = makeTempFolder;
var makeTempDirectory = makeTempFolder;
var createTempDir = makeTempFolder;
var createTempDirectory = makeTempFolder;
var createTempFolder = makeTempFolder;
 
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
  
function runScriptInFrame(aScript, aFrame, aVersion) 
{
	if (!aVersion) aVersion = '1.7';
	var script = aFrame.document.createElementNS('http://www.w3.org/1999/xhtml', 'script');
	script.setAttribute('type', 'application/javascript; version='+aVersion);
	script.appendChild(aFrame.document.createTextNode(aScript));
	aFrame.document.documentElement.appendChild(script);
}
  
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
	var lines = formatStackTrace(e, { onlyFile : true, onlyExternal : true, onlyTraceLine : true });
	if (!lines || this.getPref('extensions.uxu.showInternalStacks'))
		lines = formatStackTrace(e, { onlyFile : true, onlyTraceLine : true });
	return e.toString() + '\n' + lines;
}
 
function hasStackTrace(aException) 
{
	return aException.stack ||
		(aException.location && JSFrameLocationRegExp.test(aException.location));
}
 
function formatStackTraceForDisplay(aException) 
{
	var lines = formatStackTrace(aException, { onlyTraceLine : true, onlyExternal : true }).split('\n');
	if (!lines.length ||
		(lines.length == 1 && !lines[0]) ||
		this.getPref('extensions.uxu.showInternalStacks'))
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
var backupPrefs = {};
	
function getPref(aKey) 
{
	return ns.prefs.getPref(aKey);
}
 
function setPref(aKey, aValue) 
{
	if (!(aKey in this.backupPrefs))
		this.backupPrefs[aKey] = this.getPref(aKey);
	return ns.prefs.setPref(aKey, aValue);
}
 
function clearPref(aKey) 
{
	if (!(aKey in this.backupPrefs))
		this.backupPrefs[aKey] = this.getPref(aKey);
	ns.prefs.clearPref(aKey);
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
	
function _splitRegistryKey(aKey) 
{
	var root = -1, path = '', name = '';
	if (!('nsIWindowsRegKey' in Ci))
		throw new Error(bundle.getString('error_utils_platform_is_not_windows'));

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
 
function getWindowsRegistry(aKey) 
{
	var value = null;

	var root, path, name;
	[root, path, name] = _splitRegistryKey(aKey);
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
 
function setWindowsRegistry(aKey, aValue) 
{
	var root, path, name;
	[root, path, name] = _splitRegistryKey(aKey);
	if (root < 0 || !path || !name)
		throw new Error(bundle.getFormattedString('error_utils_failed_to_write_registry', [aKey, aValue]));

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
		throw aError || new Error(bundle.getFormattedString('error_utils_failed_to_write_registry', [aKey, aValue]));
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
 
function clearWindowsRegistry(aKey) 
{
	var root, path, name;
	[root, path, name] = _splitRegistryKey(aKey);
	if (root < 0 || !path || !name)
		throw new Error(bundle.getFormattedString('error_utils_failed_to_clear_registry', [aKey]));

	_clearWindowsRegistry(root, path+'\\'+name);
}
function _clearWindowsRegistry(aRoot, aPath)
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
				_clearWindowsRegistry(aRoot, aPath+'\\'+aName);
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
			throw new Error(bundle.getFormattedString('error_utils_failed_to_fixup_incomplete_uri', [aURIOrPart]));
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
		throw new Error(bundle.getString('error_utils_no_generator'));

	var iterator = aGenerator;
	if (typeof aGenerator == 'function')
		iterator = aGenerator();
	if (!isGeneratedIterator(iterator))
		throw new Error(bundle.getFormattedString('error_utils_invalid_generator', [aGenerator]));

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

			if (!returnedValue) returnedValue = 0;
			switch (typeof returnedValue)
			{
				default:
					returnedValue = Number(returnedValue);
					if (isNaN(returnedValue))
						returnedValue = 0;

				case 'number':
					if (returnedValue >= 0) {
						window.setTimeout(arguments.callee, returnedValue, returnedValue);
						return;
					}
					throw new Error(bundle.getFormattedString('error_yield_unknown_condition', [String(returnedValue)]));

				case 'object':
					if (
						returnedValue &&
						('value' in returnedValue || isGeneratedIterator(returnedValue))
						) {
						window.setTimeout(arguments.callee, 10, returnedValue);
						return;
					}
					throw new Error(bundle.getFormattedString('error_yield_unknown_condition', [String(returnedValue)]));

				case 'function':
					window.setTimeout(arguments.callee, 10, returnedValue);
					return;
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
 
function createDatabaseFromSQLFile(aSQLFile, aEncoding, aScope) 
{
	aSQLFile = this.normalizeToFile(aSQLFile);
	var sql;
	try {
		sql = this.readFrom(aSQLFile, aEncoding || this.getPref('extensions.uxu.defaultEncoding'));
	}
	catch(e) {
		throw new Error(bundle.getFormattedString('error_utils_cannot_read_sql_file', [aSQLFile, e]));
	}
	if (aScope) input = this.processTemplate(sql, aScope);
	return this.createDatabaseFromSQL(sql);
}
  
// 解析 
	
function inspect(aObject, aIndent) 
{
	var inspectedObjects = [];
	var inspectedResults = {};
	var inaccessible = {
			objects    : [],
			properties : [],
			values     : [],
			count      : 0
		};

	function _inspect(aTarget, aIndent)
	{
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
		else if (aTarget instanceof Ci.nsISupports) {
			ArrayClass     = Array;
			StringClass    = String;
			toStringMethod = Object.prototype.toString;
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

			var values = aTarget.map(function(aObject) {
							return _inspect(aObject, aIndent);
						});
			if (aIndent) {
				inspectedResults[index] = "[\n" +
						values
							.map(function(aElement) {
								return aElement.replace(/^/gm, aIndent);
							})
							.join(",\n") +
						"\n]";
			}
			else {
				inspectedResults[index] = "[" + values.join(", ") + "]";
			}
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
						value = _inspect(aTarget[aName], aIndent);
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
				});
			if (aIndent) {
				inspectedResults[index] = "{\n" +
						values
							.map(function(aElement) {
								return aElement.replace(/^/gm, aIndent);
							})
							.join(",\n") +
						"\n}";
			}
			else {
				inspectedResults[index] = "{" + values.join(", ") + "}";
			}
			return inspectedResults[index];
		}
		else {
			return aTarget.toString();
		}
	}

	return _inspect(aObject, aIndent);
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
	if (typeof aObject != 'object')
		return false;

	var root = _getRootScope(aObject);
	return aObject &&
		(root && root.Array ?
			(aObject instanceof root.Array) :
			(aObject instanceof eval('Array', aObject))
		);
}
 
function isDate(aObject) 
{
	if (typeof aObject != 'object')
		return false;

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
/*
	// https://bugzilla.mozilla.org/show_bug.cgi?id=552560
	// "__parent__" is no longer available on Firefox 3.7 or later.
	if (typeof aObject.valueOf == 'function')
		return aObject.valueOf.call(null);
*/
	var parent = aObject;
	do {
		lastParent = parent;
	}
	while (parent = _getParent(parent));
	return lastParent;
}
var _DOMWindowUtils = window.QueryInterface(Ci.nsIInterfaceRequestor)
						.getInterface(Ci.nsIDOMWindowUtils);
function _getParent(aObject)
{
	try {
		if (aObject.__parent__)
			return aObject.__parent__;

		if ('getParent' in _DOMWindowUtils)
			return _DOMWindowUtils.getParent(aObject);
	}
	catch(e) {
	}

	return void(0);
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
	
function processTemplate(aCode, aScope) 
{
	var __processTemplate__codes = [];
	aCode.split('%>').forEach(function(aPart) {
		let strPart, codePart;
		[strPart, codePart] = aPart.split('<%');
		__processTemplate__codes.push('__processTemplate__results.push('+
		                            strPart.toSource()+
		                            ');');
		if (!codePart) return;
		if (codePart.charAt(0) == '=') {
			__processTemplate__codes.push('__processTemplate__results.push(('+
			                            codePart.substring(1)+
			                            ') || "");');
		}
		else {
			__processTemplate__codes.push(codePart);
		}
	});
	var sandbox = new Components.utils.Sandbox(window);
	sandbox.__proto__ = { __processTemplate__results : [] };
	if (aScope) sandbox.__proto__.__proto__ = aScope;
	Components.utils.evalInSandbox(__processTemplate__codes.join('\n'), sandbox);
	return sandbox.__processTemplate__results.join('');
}
var parseTemplate = processTemplate; // for backward compatibility
 
var hasher = Cc['@mozilla.org/security/hash;1'] 
		.createInstance(Ci.nsICryptoHash);
 
function computeHash(aData, aHashAlgorithm) 
{
	var algorithm = String(aHashAlgorithm).toUpperCase().replace('-', '');
	if (algorithm in hasher) {
		hasher.init(hasher[algorithm])
	}
	else {
		throw new Error(bundle.getFormattedString('error_utils_unknown_hash_algorithm', [aHashAlgorithm]));
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
	var file = this.normalizeToFile(aFile);
	if (!file)
		throw new Error(bundle.getFormattedString('error_utils_compute_hash_from_file_null', [aFile]));
	if (!file.exists())
		throw new Error(bundle.getFormattedString('error_utils_compute_hash_from_file_not_exists', [aFile]));
	if (file.isDirectory())
		throw new Error(bundle.getFormattedString('error_utils_compute_hash_from_file_directory', [aFile]));

	return computeHash(file, aHashAlgorithm);
}
 
function md2FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'md2'); } 
function md5FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'md5'); }
function sha1FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha1'); }
function sha256FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha256'); }
function sha384FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha384'); }
function sha512FromFile(aFile) { return computeHashFromFile(this.normalizeToFile(aFile), 'sha512'); }
 
function mapURI(aURI, aMappingDefinition) 
{
	if (!aMappingDefinition) return aURI;

	var newURI;

	if (typeof aMappingDefinition == 'function')
		return aMappingDefinition(makeURIFromSpec(aURI));

	var matchers = [];
	var targets  = [];
	if (isArray(aMappingDefinition)) {
		if (aMappingDefinition.length % 2)
			throw new Error(bundle.getString('error_utils_invalid_mapping_definition'));

		for (var i = 0, maxi = aMappingDefinition.length; i < maxi; i = i+2)
		{
			matchers.push(aMappingDefinition[i]);
			targets.push(aMappingDefinition[i+1]);
		}
	}
	else {
		for (var prop in aMappingDefinition)
		{
			matchers.push(prop);
			targets.push(aMappingDefinition[prop]);
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
function redirectURI(aURI, aMappingDefinition)
{
	return mapURI.call(this, aURI, aMappingDefinition)
}
 
// http://liosk.blog103.fc2.com/blog-entry-75.html
// CSV parser based on RFC4180
function parseCSV(aInput, aDelimiter) 
{
	var delimiter = aDelimiter || ',';
	var tokenizer = new RegExp(
			delimiter+'|\r?\n|[^'+delimiter+'"\r\n][^'+delimiter+'\r\n]*|"(?:[^"]|"")*"',
			'g'
		);
	var record = 0,
		field = 0,
		data = [['']],
		qq = /""/g,
		longest = 0;
	aInput.replace(/\r?\n$/, '')
		.replace(tokenizer, function(aToken) {
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
function parseTSV(aInput)
{
	return parseCSV(aInput, '\t');
}
 
function _parseParametersFrom2DArray(aArray) 
{
	var data = evalInSandbox(aArray.toSource()); // duplicate object for safe
	var parameters;
	var columns = data.shift();
	var isHash = !columns[0];

	var types = [];
	if (isHash) columns.splice(0, 1);

	var typePattern = /.(\s*\[([^\]]+)\]\s*)$/i;
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
function _convertParameterType(aInput, aType)
{
	var source = aInput;
	aType = String(aType || '').toLowerCase();

	switch (aType)
	{
		case 'auto':
		default:
			if (/^[\-\+]?[0-9]+(\.[0-9]+)$/.test(source)) {
				aType = 'number';
			}
			else if (/^(true|false)$/i.test(source)) {
				aType = 'boolean';
				source = source.toLowerCase();
			}
			else {
				aType = 'string';
			}
			break;

		case 'number':
		case 'int':
		case 'float':
		case 'double':

		case 'boolean':
		case 'bool':

		case 'string':
		case 'char':

		case 'object':
		case 'json':
			break;
	}

	var data;
	switch (aType)
	{
		case 'number':
		case 'int':
		case 'float':
		case 'double':
			data = Number(source);
			if (isNaN(data))
				throw new Error(bundle.getFormattedString('error_utils_parameters_from_CSV_invalid_number', [aInput]));
			if (aType == 'int') data = parseInt(data);
			break;
		case 'boolean':
		case 'bool':
			try {
				data = evalInSandbox('!!('+(source || '""')+')');
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_parameters_from_CSV_invalid_boolean', [aInput]));
			}
			break;
		case 'object':
		case 'json':
			try {
				data = evalInSandbox('('+(source || '""')+')');
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_parameters_from_CSV_invalid_object', [aInput]));
			}
			break;
		case 'string':
		case 'char':
		default:
			data = source;
			break;
	}
	return data;
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
var productVersion = XULAppInfo.version;
var platformVersion = XULAppInfo.platformVersion;
 
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
	
function compareVersions() 
{
	var aA, aB, aOperator;
	switch (arguments.length)
	{
		case 3:
			aA = arguments[0];
			aB = arguments[2];
			aOperator = arguments[1];
			var result;
			try {
				result = _comparator.compare(aA, aB);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_compareVersions_failed_to_compare', [aA, aB, e]));
			}
			switch (aOperator)
			{
				case '<':
					return result < 0;
				case '=<':
				case '<=':
					return result <= 0;
				case '>':
					return result > 0;
				case '=>':
				case '>=':
					return result >= 0;
				case '=':
				case '==':
				case '===':
					return result == 0;
				case '!=':
				case '!==':
					return result != 0;
				default:
					throw new Error(bundle.getFormattedString('error_utils_compareVersions_invalid_operator', [aA, aB, aOperator]));
			}
			break;

		case 2:
			aA = arguments[0];
			aB = arguments[1];
			try {
				return _comparator.compare(aA, aB);
			}
			catch(e) {
				throw new Error(bundle.getFormattedString('error_utils_compareVersions_failed_to_compare', [aA, aB, e]));
			}

		default:
			throw new Error(bundle.getFormattedString('error_utils_compareVersions_invalid_arguments', [Array.slice(arguments).join(', ')]));
	}
}
 
function checkProductVersion(aVersion) 
{
	return compareVersions(XULAppInfo.version, aVersion);
}
function checkAppVersion(aVersion) // obsolete, for backward compatibility
{
	return checkProductVersion(aVersion);
}
function checkApplicationVersion(aVersion) // obsolete, for backward compatibility
{
	return checkProductVersion(aVersion);
}
 
function checkPlatformVersion(aVersion) 
{
	return compareVersions(XULAppInfo.platformVersion, aVersion);
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
  
