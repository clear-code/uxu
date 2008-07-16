var utilsModule;
var tempFile;

function setUp()
{
	utilsModule = {};
	utils.include('../../../../content/uxu/lib/utils.js', utilsModule);
	utilsModule.fileURL = utils.fileURL;
	utilsModule.baseURL = utils.baseURL;

	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	tempFile = DirectoryService.get('TmpD', Ci.nsIFile);
	tempFile.append('tmp' + parseInt(Math.random() * 650000) + '.tmp');
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
	assert.equals('file:///c:/windows/', uri.spec);
	assert.equals('file', uri.scheme);
}

function test_makeFileWithPath()
{
	var fileExpected = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
	fileExpected.initWithPath('C:\\Windows');

	var file = utilsModule.makeFileWithPath('C:\\Windows');

	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(fileExpected.path, file.path);
	assert.equals(fileExpected.exists(), file.exists());
}

function test_getFileFromURLSpec()
{
	var fileExpected = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
	fileExpected.initWithPath('C:\\Windows');

	var file = utilsModule.getFileFromURLSpec('file:///C:/Windows');

	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(fileExpected.path, file.path);
	assert.equals(fileExpected.exists(), file.exists());
}

function test_getFilePathFromURLSpec()
{
	assert.equals('C:\\Windows', utilsModule.getFilePathFromURLSpec('file:///C:/Windows'));
}

function test_getURLFromFilePath()
{
	var url = utilsModule.getURLFromFilePath('C:\\Windows');
	assert.isTrue(url);
	assert.isTrue(url instanceof Ci.nsIURI);
	assert.isTrue(url instanceof Ci.nsIFileURL);
	assert.equals('file:///C:/Windows/', url.spec);
	assert.equals('file', url.scheme);
}

function test_getURLSpecFromFilePath()
{
	assert.equals('file:///C:/Windows/', utilsModule.getURLSpecFromFilePath('C:\\Windows'));
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
	assert.equals('boolean', typeof value);
	assert.equals(Pref.getBoolPref('general.autoScroll'), value);

	value = utilsModule.getPref('accessibility.tabfocus');
	assert.equals('number', typeof value);
	assert.equals(Pref.getIntPref('accessibility.tabfocus'), value);

	value = utilsModule.getPref('general.useragent.locale');
	assert.equals('string', typeof value);
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
	assert.equals('boolean', typeof value);
	assert.isTrue(value);
	utilsModule.clearPref(key);
	assert.isNull(utils.getPref(key));

	utilsModule.setPref(key, 30);
	value = utils.getPref(key);
	assert.equals('number', typeof value);
	assert.equals(30, value);
	utilsModule.clearPref(key);
	assert.isNull(utils.getPref(key));

	utilsModule.setPref(key, 'string');
	value = utils.getPref(key);
	assert.equals('string', typeof value);
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
	assert.equals('C:\\Windows', utilsModule.fixupIncompleteURI('C:\\Windows'));
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

//	yield Do(utilsModule.doIteration(function() {
//			yield 100;
//			assert.isTrue(false);
//		}, callbacks));
//	assert.isTrue(onFail);

//	yield Do(utilsModule.doIteration(function() {
//			yield 100;
//			var val = null;
//			null.foobar();
//		}, callbacks));
//	assert.isTrue(onError);
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
	assert.isTrue('value' in result);
	result = utilsModule.Do(Generator());
	assert.equals('object', typeof result);
	assert.isTrue('value' in result);
}

function test_getDB()
{
	var db = utilsModule.getDB();
	assert.isTrue(db instanceof Ci.mozIStorageConnection);
}
