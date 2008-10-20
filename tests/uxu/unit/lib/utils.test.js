// -*- indent-tabs-mode: t; tab-width: 4 -*-

var utilsModule;
var tempFile;
var onWindows = false;
var IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);

function simpleMakeURIFromSpec(aURI)
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
		alert(e);
	}
	return null;
}

function setUp()
{
	onWindows = /win/i.test(navigator.platform);
	utilsModule = {};
	utils.include('../../../../content/uxu/lib/utils.js', utilsModule);
	utilsModule.fileURL = utils.fileURL;
	utilsModule.baseURL = utils.baseURL;

	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	tempFile = DirectoryService.get('TmpD', Ci.nsIFile);
	tempFile.append('tmp' + parseInt(Math.random() * 650000) + '.tmp');

	yield 0; // to run tests progressively
}

function tearDown()
{
	if (tempFile.exists())
		tempFile.remove(true);
}


function test_makeURIFromSpec()
{
	var uri;

	uri = utilsModule.makeURIFromSpec('about:blank');
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.equals('about:blank', uri.spec);
	assert.equals('about', uri.scheme);

	uri = utilsModule.makeURIFromSpec('http://www.clear-code.com/');
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.equals('http://www.clear-code.com/', uri.spec);
	assert.equals('http', uri.scheme);
	assert.equals('www.clear-code.com', uri.host);

	uri = utilsModule.makeURIFromSpec('file:///c:/windows/');
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.isTrue(uri instanceof Ci.nsIFileURL);
	assert.matches(/file:\/\/\/C:\/Windows\/?/i, uri.spec);
	assert.equals('file', uri.scheme);
}

function test_makeFileWithPath()
{
	var expected = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
	var file;

	if (onWindows) {
		expected.initWithPath('C:\\Windows');
		file = utilsModule.makeFileWithPath('C:\\Windows');
	} else {
		expected.initWithPath('/tmp');
		file = utilsModule.makeFileWithPath('/tmp');
    }

	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(expected.path, file.path);
	assert.equals(expected.exists(), file.exists());
}

function test_getFileFromURL()
{
	var expected = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile),
		uriSpec,
		filePathPattern;
	if (onWindows) {
		expected.initWithPath('C:\\Windows');
		uriSpec = 'file:///C:/Windows';
		filePathPattern = /C:\\Windows\\?/i;
	} else {
		expected.initWithPath('/tmp');
		uriSpec = 'file:///tmp';
		filePathPattern = /\/tmp\/?/;
    }
	var uri = simpleMakeURIFromSpec(uriSpec);
	var file;

	file = utilsModule.getFileFromURL(uri);
	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(expected.path, file.path);
	assert.equals(expected.exists(), file.exists());

	assert.matches(filePathPattern, utilsModule.getFilePathFromURL(uri));

	file = utilsModule.getFileFromURLSpec(uriSpec);
	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(expected.path, file.path);
	assert.equals(expected.exists(), file.exists());

	assert.matches(filePathPattern, utilsModule.getFilePathFromURLSpec(uriSpec));
}

function test_getURLFromFile()
{
	var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile),
		uriPattern,
		path,
		uri;
	if (onWindows) {
		uriPattern = /file:\/\/\/C:\/Windows\/?/i;
		path = 'C:\\Windows';
	} else {
		uriPattern = /file:\/\/\/tmp\/?/;
		path = '/tmp';
    }
	file.initWithPath('C:\\Windows');

	uri = utilsModule.getURLFromFile(file);
	assert.isTrue(uri);
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.isTrue(uri instanceof Ci.nsIFileURL);
	assert.matches(uriPattern, uri.spec);
	assert.equals('file', uri.scheme);

	assert.matches(uriPattern, utilsModule.getURLSpecFromFile(file));

	uri = utilsModule.getURLFromFilePath(path);
	assert.isTrue(uri);
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.isTrue(uri instanceof Ci.nsIFileURL);
	assert.matches(uriPattern, uri.spec);
	assert.equals('file', uri.scheme);

	assert.matches(uriPattern, utilsModule.getURLSpecFromFilePath(path));
}

function test_readFrom()
{
	assert.equals('ASCII', utilsModule.readFrom(baseURL+'../../res/ascii.txt'));
	assert.equals('ASCII', utilsModule.readFrom('../../res/ascii.txt'));
	assert.equals('日本語', utilsModule.readFrom(baseURL+'../../res/utf8.txt', 'UTF-8'));
	assert.equals('日本語', utilsModule.readFrom('../../res/utf8.txt', 'UTF-8'));
	assert.equals('日本語', utilsModule.readFrom(baseURL+'../../res/shift_jis.txt', 'Shift_JIS'));
	assert.equals('日本語', utilsModule.readFrom('../../res/shift_jis.txt', 'Shift_JIS'));
}

function test_writeTo()
{
	utilsModule.writeTo('ASCII', tempFile.path);
	assert.equals('ASCII', utilsModule.readFrom(tempFile.path));

	utilsModule.writeTo('日本語', tempFile.path, 'UTF-8');
	assert.equals('日本語', utilsModule.readFrom(tempFile.path, 'UTF-8'));

	utilsModule.writeTo('日本語', tempFile.path, 'Shift_JIS');
	assert.equals('日本語', utilsModule.readFrom(tempFile.path, 'Shift_JIS'));
}

test_formatError.priority = 'never';
function test_formatError()
{
}

test_formatStackTrace.priority = 'never';
function test_formatStackTrace()
{
}

var Pref = Cc['@mozilla.org/preferences;1'] 
		.getService(Ci.nsIPrefBranch);

function test_getPref()
{
	var value;

	value = utilsModule.getPref('general.autoScroll');
	assert.isBoolean(value);
	assert.equals(Pref.getBoolPref('general.autoScroll'), value);

	value = utilsModule.getPref('accessibility.tabfocus');
	assert.isNumber(value);
	assert.equals(Pref.getIntPref('accessibility.tabfocus'), value);

	value = utilsModule.getPref('general.useragent.locale');
	assert.isString(value);
	assert.equals(Pref.getCharPref('general.useragent.locale'), value);

	value = utilsModule.getPref('undefined.pref.'+parseInt(Math.random() * 65000));
	assert.isNull(value);
}

function test_setAndClearPref()
{
	var key = 'undefined.pref.'+parseInt(Math.random() * 65000);
	var value;
	utilsModule.clearPref(key);
	assert.isNull(utils.getPref(key));

	utilsModule.setPref(key, true);
	value = utils.getPref(key);
	assert.isBoolean(value);
	assert.isTrue(value);
	utilsModule.clearPref(key);
	assert.isNull(utils.getPref(key));

	utilsModule.setPref(key, 30);
	value = utils.getPref(key);
	assert.isNumber(value);
	assert.equals(30, value);
	utilsModule.clearPref(key);
	assert.isNull(utils.getPref(key));

	utilsModule.setPref(key, 'string');
	value = utils.getPref(key);
	assert.isString(value);
	assert.equals('string', value);
	utilsModule.clearPref(key);
	assert.isNull(utils.getPref(key));
}

function test_convertEncoding()
{
	var utf8String = utilsModule.readFrom('../../res/utf8.txt');
	var ucs2String = utilsModule.readFrom('../../res/utf8.txt', 'UTF-8');

	assert.equals(ucs2String, UTF8ToUnicode(utf8String));
	assert.equals(ucs2String, UTF8ToUCS2(utf8String));
	assert.equals(utf8String, UnicodeToUTF8(ucs2String));
	assert.equals(utf8String, UCS2ToUTF8(ucs2String));

	var sjisString = utilsModule.readFrom('../../res/shift_jis.txt');

	assert.equals('日本語', XToUnicode(sjisString, 'Shift_JIS'));
	assert.equals('日本語', XToUCS2(sjisString, 'Shift_JIS'));
	assert.equals(sjisString, UnicodeToX('日本語', 'Shift_JIS'));
	assert.equals(sjisString, UCS2ToX('日本語', 'Shift_JIS'));
}

function test_fixupIncompleteURI()
{
	assert.equals(baseURL+'foobar', utilsModule.fixupIncompleteURI('foobar'));
	assert.equals('foobar://foobar', utilsModule.fixupIncompleteURI('foobar://foobar'));
	if (onWindows) {
		assert.equals('C:\\Windows', utilsModule.fixupIncompleteURI('C:\\Windows'));
	} else {
		assert.equals('/tmp', utilsModule.fixupIncompleteURI('/tmp'));
    }
}

function test_isGeneratedIterator()
{
	function TestGenerator()
	{
		var count = 0;
		while (true)
		{
			yield count++;
		}
	}
	var iterator = TestGenerator();
	assert.equals(0, iterator.next());
	assert.equals(1, iterator.next());
	assert.equals(2, iterator.next());
	assert.isTrue(utilsModule.isGeneratedIterator(iterator));

	assert.isFalse(utilsModule.isGeneratedIterator({}));
	assert.isFalse(utilsModule.isGeneratedIterator(null));
	assert.isFalse(utilsModule.isGeneratedIterator('foobar'));
	assert.isFalse(utilsModule.isGeneratedIterator());
}

test_makeStackLine.priority = 'never';
function test_makeStackLine()
{
}

function test_doIteration()
{
	var flagFirst = false;
	var flagWait = false;
	var flagValue = false;
	var flagFunction = false;

	function TestGenerator()
	{
		flagFirst = true;

		yield 100;
		flagWait = true;

		var  flag = { value : false };
		window.setTimeout(function() {
			flag.value = true;
		}, 100);
		yield flag;
		flagValue = true;

		var startAt = Date.now();
		yield (function() {
				return (Date.now() - startAt) > 100;
			});
		flagFunction = true;
	}

	var iterator = TestGenerator();
	yield Do(utilsModule.doIteration(iterator));
	assert.isTrue(flagFirst);
	assert.isTrue(flagWait);
	assert.isTrue(flagValue);
	assert.isTrue(flagFunction);

	flagFirst = false;
	flagWait = false;
	flagValue = false;
	flagFunction = false;
	yield Do(utilsModule.doIteration(TestGenerator));
	assert.isTrue(flagFirst);
	assert.isTrue(flagWait);
	assert.isTrue(flagValue);
	assert.isTrue(flagFunction);
}

function test_doIterationCallbacks()
{
	var onEnd = false;
	var onFail = false;
	var onError = false;
	var callbacks = {
		onEnd : function(e)
		{
			onEnd = true;
		},
		onFail : function(e)
		{
			onFail = true;
		},
		onError : function(e)
		{
			onError = true;
		}
	};

	yield Do(utilsModule.doIteration(function() {
			yield 100;
		}, callbacks));
	assert.isTrue(onEnd);

	utilsModule.doIteration(function() {
			yield 100;
			assert.isTrue(false);
		}, callbacks);
	yield 200;
	assert.isTrue(onFail);

	utilsModule.doIteration(function() {
			yield 100;
			var val = null;
			null.foobar();
		}, callbacks);
	yield 200;
	assert.isTrue(onError);
}

function test_Do()
{
	var obj = {};
	assert.equals(obj, utilsModule.Do(obj));
	assert.isTrue(utilsModule.Do(true));
	assert.equals(100, utilsModule.Do(100));
	assert.equals('string', utilsModule.Do('string'));

	var func = function() {
		return 'foobar';
	};
	assert.equals('foobar', utilsModule.Do(func));

	function Generator()
	{
		yield 100;
	};
	var result = utilsModule.Do(Generator);
	assert.equals('object', typeof result);
	assert.isDefined(result.value);
	result = utilsModule.Do(Generator());
	assert.equals('object', typeof result);
	assert.isDefined(result.value);
}

function test_getDB()
{
	var db = utilsModule.getDB();
	assert.isTrue(db instanceof Ci.mozIStorageConnection);
}

assert.inspect = function(aExpected, aObject) {
	assert.equals(aExpected, utilsModule.inspect(aObject));
};

testInspect.priority = "must";
function testInspect()
{
	assert.inspect('"String"', "String");
	assert.inspect('10', 10);
	assert.inspect('["String", 10]', ["String", 10]);
	assert.inspect('{"string": "String", "29": 10}',
		       {string: "String", 29: 10});
	assert.inspect('[{"string": "String", "29": 10}]',
		       [{string: "String", 29: 10}]);

	var object = {string: "String", 29: 10};
	assert.inspect('[{"string": "String", "29": 10}, ' +
		       '{"string": "String", "29": 10}]',
		       [object, object]);
}

function testNotify()
{
	var observer = {
			observe : function(aSubject, aTopic, aData)
			{
				this.lastSubject = aSubject;
				this.lastTopic = aTopic;
				this.lastData = aData;
			},
			lastSubject : null,
			lastTopic : null,
			lastData : null
		};

	const ObserverService = Cc['@mozilla.org/observer-service;1']
				.getService(Ci.nsIObserverService);
	ObserverService.addObserver(observer, 'uxu:test-topic', false);

	utilsModule.notify(window, 'uxu:test-topic', 'data');

	ObserverService.removeObserver(observer, 'uxu:test-topic');

	assert.equals(window, observer.lastSubject);
	assert.equals('uxu:test-topic', observer.lastTopic);
	assert.equals('data', observer.lastData);
}
