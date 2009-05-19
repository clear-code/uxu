// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('prefread.inc.js');

var topDir = baseURL+'../../../../';

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

var Pref = Cc['@mozilla.org/preferences;1'] 
		.getService(Ci.nsIPrefBranch);
var prefKeyRoot;

function setUp()
{
	onWindows = /win/i.test(navigator.platform);
	utilsModule = {};
	utils.include(topDir+'content/uxu/lib/utils.js', utilsModule);
	utilsModule.fileURL = utils.fileURL;
	utilsModule.baseURL = utils.baseURL;

	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	tempFile = DirectoryService.get('TmpD', Ci.nsIFile);
	tempFile.append('tmp' + parseInt(Math.random() * 650000) + '.tmp');

	yield 0; // to run tests progressively

	prefKeyRoot = 'uxu.testing.'+parseInt(Math.random() * 65000)+'.';
	Pref.setBoolPref(prefKeyRoot+'bool', true);
	Pref.setIntPref(prefKeyRoot+'int', 1);
	Pref.setCharPref(prefKeyRoot+'string', 'foobar');
}

function tearDown()
{
	if (tempFile.exists())
		tempFile.remove(true);
	utils.clearPref(prefKeyRoot+'bool', true);
	utils.clearPref(prefKeyRoot+'int', 1);
	utils.clearPref(prefKeyRoot+'string', 'foobar');

	defaultPrefs.forEach(function(aItem) {
		utils.clearPref(aItem.name);
	});
	userPrefs.forEach(function(aItem) {
		utils.clearPref(aItem.name);
	});
}


test$.setUp = function()
{
	yield Do(utils.loadURI('../../fixtures/html.html'));
}
function test$()
{
	var node = utilsModule.$('content');
	var expected = document.getElementById('content');
	assert.equals(expected, node);
	assert.equals(expected, utilsModule.$(node));

	expected = content.document.getElementById('paragraph1');
	assert.equals(expected, utilsModule.$('paragraph1', content));
	assert.equals(expected, utilsModule.$('paragraph1', content.document));
	assert.equals(expected, utilsModule.$('paragraph1', content.document.documentElement));
	assert.equals(expected, utilsModule.$(expected, content));
	assert.equals(expected, utilsModule.$(expected, content.document));
	assert.equals(expected, utilsModule.$(expected, content.document.documentElement));
}

test$X.setUp = function()
{
	yield Do(utils.loadURI('../../fixtures/html.xml'));
}
function test$X()
{
	var expectedNode = document.getElementById('content');

	var nodesExpression = '//*[@id="content"]';
	var booleanExpression = '//*[@id="content"]/@id = "content"';
	var numberExpression = 'count(//*[@id="content"])';

	// arg1 = expression
	assert.equals([expectedNode], utilsModule.$X(nodesExpression));
	assert.strictlyEquals(true, utilsModule.$X(booleanExpression));
	assert.strictlyEquals(1, utilsModule.$X(numberExpression));

	// arg1 = expression, arg1 = context
	assert.equals([expectedNode], utilsModule.$X(nodesExpression, document));
	assert.equals([expectedNode], utilsModule.$X(nodesExpression, document.documentElement));
	assert.strictlyEquals(true, utilsModule.$X(booleanExpression, document.documentElement));
	assert.strictlyEquals(1, utilsModule.$X(numberExpression, document.documentElement));

	// arg1 = expression, arg2 = context, arg3 = type
	assert.equals(
		expectedNode,
		utilsModule.$X(nodesExpression, document, XPathResult.FIRST_ORDERED_NODE_TYPE)
	);
	assert.equals(
		expectedNode,
		utilsModule.$X(nodesExpression, document, XPathResult.ANY_UNORDERED_NODE_TYPE)
	);
	assert.strictlyEquals(
		true,
		utilsModule.$X(nodesExpression, document, XPathResult.BOOLEAN_TYPE)
	);
	assert.strictlyEquals(
		'',
		utilsModule.$X(nodesExpression, document, XPathResult.STRING_TYPE)
	);
	assert.strictlyEquals(
		'1',
		utilsModule.$X(numberExpression, document, XPathResult.STRING_TYPE)
	);
	assert.strictlyEquals(
		1,
		utilsModule.$X(numberExpression, document, XPathResult.NUMBER_TYPE)
	);

	// arg1 = expression, arg2 = context, arg3 = resolver, arg4 = type
	var resolver = function(aPrefix)
		{
			switch (aPrefix)
			{
				case 'html':
					return 'http://www.w3.org/1999/xhtml';
				case 'xul':
					return 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
				default:
					return '';
			}
		}
	assert.equals(
		content.document.documentElement,
		utilsModule.$X('/descendant::html:html', content.document, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE)
	);
	assert.isNull(
		utilsModule.$X('/descendant::xul:html', content.document, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE)
	);
}


if (utils.checkAppVersion('3.0') < 0) test_sleep.priority = 'never';
function test_sleep()
{
	var before = Date.now();
	utilsModule.sleep(500);
	assert.inDelta(500, Date.now() - before, 200);
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
	file.initWithPath(path);

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

function test_getFileFromKeyword()
{
	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	assert.equals(DirectoryService.get('TmpD', Ci.nsIFile).path, utilsModule.getFileFromKeyword('TmpD').path);
	assert.equals(DirectoryService.get('ProfD', Ci.nsIFile).path, utilsModule.getFileFromKeyword('ProfD').path);
	assert.equals(DirectoryService.get('CurProcD', Ci.nsIFile).path, utilsModule.getFileFromKeyword('CurProcD').path);
}

function test_readFrom()
{
	assert.equals('ASCII', utilsModule.readFrom(baseURL+'../../fixtures/ascii.txt'));
	assert.equals('ASCII', utilsModule.readFrom('../../fixtures/ascii.txt'));
	assert.equals('日本語', utilsModule.readFrom(baseURL+'../../fixtures/utf8.txt', 'UTF-8'));
	assert.equals('日本語', utilsModule.readFrom('../../fixtures/utf8.txt', 'UTF-8'));
	assert.equals('日本語', utilsModule.readFrom(baseURL+'../../fixtures/shift_jis.txt', 'Shift_JIS'));
	assert.equals('日本語', utilsModule.readFrom('../../fixtures/shift_jis.txt', 'Shift_JIS'));
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

function test_getPref()
{
	var value;

	value = utilsModule.getPref(prefKeyRoot+'bool');
	assert.isBoolean(value);
	assert.isTrue(value);

	value = utilsModule.getPref(prefKeyRoot+'int');
	assert.isNumber(value);
	assert.equals(1, value);

	value = utilsModule.getPref(prefKeyRoot+'string');
	assert.isString(value);
	assert.equals('foobar', value);

	value = utilsModule.getPref(prefKeyRoot+'undefined');
	assert.isNull(value);
}

function test_setAndClearPref()
{
	var key = 'undefined.pref.'+parseInt(Math.random() * 65000);
	var value;

	utilsModule.clearPref(key+'.bool');
	assert.isNull(utils.getPref(key+'.bool'));
	utilsModule.setPref(key+'.bool', true);
	value = utils.getPref(key+'.bool');
	assert.isBoolean(value);
	assert.isTrue(value);
	utilsModule.clearPref(key+'.bool');
	assert.isNull(utils.getPref(key+'.bool'));

	utilsModule.clearPref(key+'.int');
	assert.isNull(utils.getPref(key+'.int'));
	utilsModule.setPref(key+'.int', 30);
	value = utils.getPref(key+'.int');
	assert.isNumber(value);
	assert.equals(30, value);
	utilsModule.clearPref(key+'.int');
	assert.isNull(utils.getPref(key+'.int'));

	utilsModule.clearPref(key+'.string');
	assert.isNull(utils.getPref(key+'.string'));
	utilsModule.setPref(key+'.string', 'string');
	value = utils.getPref(key+'.string');
	assert.isString(value);
	assert.equals('string', value);
	utilsModule.clearPref(key+'.string');
	assert.isNull(utils.getPref(key+'.string'));
}

function test_loadPrefs()
{
	var hash;
	var result;

	hash = {};
	result = utilsModule.loadPrefs('../../fixtures/default.js', hash);
	defaultPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, result[aItem.name], aItem.name);
		assert.isNull(utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(hash, result);

	hash = {};
	result = utilsModule.loadPrefs('../../fixtures/user.js', hash);
	userPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, result[aItem.name], aItem.name);
		assert.isNull(utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(hash, result);

	result = utilsModule.loadPrefs('../../fixtures/default.js');
	defaultPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(
		{ 'uxu.test.default.pref.bool': true,
		  'uxu.test.default.pref.bool.false': false,
		  'uxu.test.default.pref.int': 29,
		  'uxu.test.default.pref.plus': 29,
		  'uxu.test.default.pref.minus': -29,
		  'uxu.test.default.pref.string': 'string',
		  'uxu.test.default.pref.string.escaped': '"\'\\\r\n\x10\\x??\u0010\\u????\\t\\/',
		  'uxu.test.default.pref.string.single': 'single quote',
		  'uxu.test.default.pref.comment1': true,
		  'uxu.test.default.pref.comment2': true,
		  'uxu.test.default.pref.comment3': true },
		result
	);

	result = utilsModule.loadPrefs('../../fixtures/user.js');
	userPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(
		{ 'uxu.test.user.pref.bool': true,
		  'uxu.test.user.pref.bool.false': false,
		  'uxu.test.user.pref.int': 29,
		  'uxu.test.user.pref.plus': 29,
		  'uxu.test.user.pref.minus': -29,
		  'uxu.test.user.pref.string': 'string',
		  'uxu.test.user.pref.string.escaped': '"\'\\\r\n\x10\\x??\u0010\\u????\\t\\/',
		  'uxu.test.user.pref.string.single': 'single quote',
		  'uxu.test.user.pref.comment1': true,
		  'uxu.test.user.pref.comment2': true,
		  'uxu.test.user.pref.comment3': true },
		result
	);
}

function test_convertEncoding()
{
	var utf8String = utilsModule.readFrom('../../fixtures/utf8.txt');
	var ucs2String = utilsModule.readFrom('../../fixtures/utf8.txt', 'UTF-8');

	assert.equals(ucs2String, UTF8ToUnicode(utf8String));
	assert.equals(ucs2String, UTF8ToUCS2(utf8String));
	assert.equals(utf8String, UnicodeToUTF8(ucs2String));
	assert.equals(utf8String, UCS2ToUTF8(ucs2String));

	var sjisString = utilsModule.readFrom('../../fixtures/shift_jis.txt');

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

assert.inspect = function(aExpected, aObject) {
	assert.equals(aExpected, utilsModule.inspect(aObject));
};

testInspect.priority = "must";
function testInspect()
{
	assert.inspect('"String"', "String");
	assert.inspect('10', 10);
	assert.inspect('["String", 10]', ["String", 10]);

	var object = {string: "String", 29: 10};
	assert.inspect('{"29": 10, "string": "String"}', object);
	assert.inspect('[{"29": 10, "string": "String"}]', [object]);
	assert.inspect('[{"29": 10, "string": "String"}, ' +
		       '{"29": 10, "string": "String"}]',
		       [object, object]);

	object = {
		get propGetter()
		{
			return true;
		},
		get propError()
		{
			throw 'error';
		}
	};
	object.self = object;
	var inspected = '{"propError": (INACCESSIBLE #1, REASON: error), '+
					'"propGetter": true, "self": [object Object]}';
	assert.inspect(inspected, object);
	assert.inspect('['+inspected+', '+inspected+']', [object, object]);
}

assert.inspectDOMNode = function(aExpected, aNode) {
	assert.equals(aExpected, utilsModule.inspectDOMNode(aNode));
};

testInspectDOMNode.priority = 'must';
function testInspectDOMNode()
{
	yield utils.loadURIInTestFrame('../../fixtures/html.xml');

	var p1 = content.document.getElementById('paragraph1');
	assert.isNotNull(p1);
	assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph1">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', p1);

	var p2 = content.document.getElementById('paragraph2');
	assert.isNotNull(p2);
	assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph2">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', p2);

	var fragment = content.document.createDocumentFragment();
	fragment.appendChild(p1.cloneNode(true));
	fragment.appendChild(p2.cloneNode(true));
	assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph1">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p><p xmlns="http://www.w3.org/1999/xhtml" id="paragraph2">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', fragment);

	yield utils.loadURIInTestFrame('../../fixtures/html.html');

	p1 = content.document.getElementById('paragraph1');
	assert.isNotNull(p1);
	assert.inspectDOMNode('<P id="paragraph1">test<EM class="class" lang="en">em</EM></P>', p1);

	p2 = content.document.getElementById('paragraph2');
	assert.isNotNull(p2);
	assert.inspectDOMNode('<P id="paragraph2">test<EM class="class" lang="en">em</EM></P>', p2);

	fragment = content.document.createDocumentFragment();
	fragment.appendChild(p1.cloneNode(true));
	fragment.appendChild(p2.cloneNode(true));
	assert.inspectDOMNode('<P id="paragraph1">test<EM class="class" lang="en">em</EM></P><P id="paragraph2">test<EM class="class" lang="en">em</EM></P>', fragment);
}

assert.utilsEquals = function(aValue1, aValue2, aValue3, aMessage) {
	assert.isTrue(utilsModule.equals(aValue1, aValue2), aMessage);
	assert.isFalse(utilsModule.equals(aValue1, aValue3), aMessage);
}

test_equals.priority = 'must';
function test_equals()
{
	assert.utilsEquals(true, true, false, 'primitive, bool');
	assert.utilsEquals(1, 1, 2, 'primitive, int');
	assert.utilsEquals('a', 'a', 'b', 'primitive, string');
	assert.utilsEquals(
		{ prop : true },
		{ prop : true },
		{ prop : false },
		'hash'
	);
	assert.utilsEquals(
		[String, Object],
		[String, Object],
		[Number, Object],
		'array'
	);

	function MyClass(aName) {
		this.self = this;
		this.name = aName;
	}
	var instance1 = new MyClass(1);
	var instance2 = new MyClass(2);
	assert.utilsEquals(instance1, instance1, instance2, 'custom class, includes circular reference');
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

function test_include()
{
	var namespace = {};
	utilsModule.include('../../fixtures/test.js', namespace, 'UTF-8');
	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);
}

function $(aId)
{
	return content.document.getElementById(aId);
}

function test_isTargetInRange()
{
	yield Do(utils.loadURI('../../fixtures/links.html'));

	var range = content.document.createRange();
	range.setStartBefore($('item4'));
	range.setEndAfter($('item9'));

	assert.isTrue(utilsModule.isTargetInRange($('link5'), range));
	assert.isFalse(utilsModule.isTargetInRange($('link10'), range));

	assert.isTrue(utilsModule.isTargetInRange('リンク5', range));
	assert.isFalse(utilsModule.isTargetInRange('リンク10', range));

	var targetRange = content.document.createRange();
	targetRange.selectNodeContents($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	targetRange.setEnd(targetRange.endContainer, targetRange.endOffset-1);
	assert.isTrue(utilsModule.isTargetInRange(targetRange, range));
	targetRange.selectNodeContents($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.isFalse(utilsModule.isTargetInRange(targetRange, range));

	range.detach();
	targetRange.detach();
}

function test_isTargetInSelection()
{
	yield Do(utils.loadURI('../../fixtures/links.html'));

	var selection = content.getSelection();
	selection.removeAllRanges();

	var range1 = content.document.createRange();
	range1.setStartBefore($('item4'));
	range1.setEndAfter($('item9'));
	selection.addRange(range1);

	var range2 = content.document.createRange();
	range2.setStartBefore($('item12'));
	range2.setEndAfter($('item14'));
	selection.addRange(range2);

	assert.isTrue(utilsModule.isTargetInSelection($('link5'), selection));
	assert.isFalse(utilsModule.isTargetInSelection($('link10'), selection));
	assert.isTrue(utilsModule.isTargetInSelection($('link13'), selection));

	assert.isTrue(utilsModule.isTargetInSelection('リンク5', selection));
	assert.isFalse(utilsModule.isTargetInSelection('リンク10', selection));
	assert.isTrue(utilsModule.isTargetInSelection('リンク13', selection));

	var targetRange = content.document.createRange();
	targetRange.selectNodeContents($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assert.isTrue(utilsModule.isTargetInSelection(targetRange, selection));
	targetRange.selectNodeContents($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.isFalse(utilsModule.isTargetInSelection(targetRange, selection));
	targetRange.selectNodeContents($('em13'));
	targetRange.setEnd($('em13').lastChild, 3);
	assert.isTrue(utilsModule.isTargetInSelection(targetRange, selection));

	targetRange.detach();
	selection.removeAllRanges();
}

function test_isTargetInSubTree()
{
	yield Do(utils.loadURI('../../fixtures/links.html'));

	var root = $('item5');

	assert.isTrue(utilsModule.isTargetInSubTree($('link5'), root));
	assert.isFalse(utilsModule.isTargetInSubTree($('link10'), root));

	assert.isTrue(utilsModule.isTargetInSubTree('リンク5', root));
	assert.isFalse(utilsModule.isTargetInSubTree('リンク10', root));

	var targetRange = content.document.createRange();
	targetRange.selectNodeContents($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assert.isTrue(utilsModule.isTargetInSubTree(targetRange, root));
	targetRange.selectNodeContents($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.isFalse(utilsModule.isTargetInSubTree(targetRange, root));

	targetRange.detach();
}

test_setAndGetClipBoard.setUp = function() {
	if (utils.product == 'Firefox') {
		yield Do(utils.setUpTestWindow());
	}
	yield Do(utils.loadURI('../../fixtures/html.html'));
	assert.contains('/fixtures/html.html', content.location.href);
}
test_setAndGetClipBoard.tearDown = function() {
	utils.tearDownTestWindow();

}
function test_setAndGetClipBoard()
{
	var random = Math.random() * 65000;
	utils.setClipBoard(random);
	assert.equals(random, utilsModule.getClipBoard());

	random = Math.random() * 65000;
	utilsModule.setClipBoard(random);
	assert.equals(random, utils.getClipBoard());

	var isLinux = (navigator.platform.toLowerCase().indexOf('linux') > -1);

	var selection = content.getSelection();
	selection.removeAllRanges();

	if (utils.checkAppVersion('3.0') < 0) {
		let range = content.document.createRange();
		range.selectNodeContents(content.document.getElementById('paragraph3'));
		selection.addRange(range);
	}
	else {
		action.fireMouseEventOnElement(
			content.document.getElementById('paragraph3'),
			{ type : 'dblclick', button : 0 }
		);
		yield 100;
	}
	assert.equals('paragraph3', selection.toString());
	if (isLinux) {
		assert.equals('paragraph3', utilsModule.getSelectionClipBoard());
	}
	else {
		assert.equals('', utilsModule.getSelectionClipBoard());
	}
	assert.equals(random, utilsModule.getClipBoard());
	selection.removeAllRanges();

	if (utils.checkAppVersion('3.0') < 0) {
		let range = content.document.createRange();
		range.selectNodeContents(content.document.getElementById('paragraph4'));
		selection.addRange(range);
	}
	else {
		action.fireMouseEventOnElement(
			content.document.getElementById('paragraph4'),
			{ type : 'dblclick', button : 0 }
		);
		yield 100;
	}
	assert.equals('paragraph4', selection.toString());
	if (isLinux) {
		assert.equals('paragraph4', utilsModule.getSelectionClipBoard());
	}
	else {
		assert.equals('', utilsModule.getSelectionClipBoard());
	}
	assert.equals(random, utilsModule.getClipBoard());
}

var isArrayTestWindow;
test_isArray.setUp = function() {
	isArrayTestWindow = window.openDialog('about:blank');
	yield 100;
};
test_isArray.tearDown = function() {
	isArrayTestWindow.close();
};
function test_isArray()
{
	assert.isTrue(utilsModule.isArray([]));
	assert.isTrue(utilsModule.isArray(new Array()));
	assert.isFalse(utilsModule.isArray(new Date()));
	assert.isFalse(utilsModule.isArray('string'));
	assert.isFalse(utilsModule.isArray(29));
	assert.isFalse(utilsModule.isArray(null));
	assert.isFalse(utilsModule.isArray(void(0)));
	isArrayTestWindow.setTimeout(<![CDATA[
		window.testArrayLiteral = [];
		window.testArrayInstance = new Array();
		window.testDate = new Date();
		window.testString = 'string';
		window.testNumber = 29;
		window.testNull = null;
		window.testUndefined = void(0);
	]]>.toString(), 0);
	yield 100;
	assert.isDefined(isArrayTestWindow.testArrayLiteral);
	assert.isTrue(utilsModule.isArray(isArrayTestWindow.testArrayLiteral));
	assert.isTrue(utilsModule.isArray(isArrayTestWindow.testArrayInstance));
	assert.isFalse(utilsModule.isArray(isArrayTestWindow.testDate));
	assert.isFalse(utilsModule.isArray(isArrayTestWindow.testString));
	assert.isFalse(utilsModule.isArray(isArrayTestWindow.testNumber));
	assert.isFalse(utilsModule.isArray(isArrayTestWindow.testNull));
	assert.isFalse(utilsModule.isArray(isArrayTestWindow.testUndefined));
}

var isDateTestWindow;
test_isDate.setUp = function() {
	isDateTestWindow = window.openDialog('about:blank');
	yield 100;
};
test_isDate.tearDown = function() {
	isDateTestWindow.close();
};
function test_isDate()
{
	assert.isFalse(utilsModule.isDate([]));
	assert.isFalse(utilsModule.isDate(new Array()));
	assert.isTrue(utilsModule.isDate(new Date()));
	assert.isFalse(utilsModule.isDate('string'));
	assert.isFalse(utilsModule.isDate(29));
	assert.isFalse(utilsModule.isDate(null));
	assert.isFalse(utilsModule.isDate(void(0)));
	isDateTestWindow.setTimeout(<![CDATA[
		window.testArrayLiteral = [];
		window.testArrayInstance = new Array();
		window.testDate = new Date();
		window.testString = 'string';
		window.testNumber = 29;
		window.testNull = null;
		window.testUndefined = void(0);
	]]>.toString(), 0);
	yield 100;
	assert.isDefined(isDateTestWindow.testArrayLiteral);
	assert.isFalse(utilsModule.isDate(isDateTestWindow.testArrayLiteral));
	assert.isFalse(utilsModule.isDate(isDateTestWindow.testArrayInstance));
	assert.isTrue(utilsModule.isDate(isDateTestWindow.testDate));
	assert.isFalse(utilsModule.isDate(isDateTestWindow.testString));
	assert.isFalse(utilsModule.isDate(isDateTestWindow.testNumber));
	assert.isFalse(utilsModule.isDate(isDateTestWindow.testNull));
	assert.isFalse(utilsModule.isDate(isDateTestWindow.testUndefined));
}


// database

function test_getDB()
{
	var db = utilsModule.getDB();
	assert.isTrue(db instanceof Ci.mozIStorageConnection);
}

function test_openDatabase()
{
	var db = utilsModule.openDatabase(baseURL+'../../fixtures/test.sqlite');
	assert.isTrue(db instanceof Ci.mozIStorageConnection);

	var statement = db.createStatement('SELECT value FROM test_table WHERE key = "key1"');
	statement.executeStep();
	assert.equals('value1', statement.getString(0));
}

function test_createDatabase()
{
	var db = utilsModule.createDatabase();
	assert.isTrue(db instanceof Ci.mozIStorageConnection);
	assert.equals(utilsModule.getFileFromKeyword('TmpD').path, db.databaseFile.parent.path);
	utils.scheduleToRemove(db.databaseFile);
}

function test_createDatabaseFromSQL()
{
	var db = utilsModule.createDatabaseFromSQL(<![CDATA[
DROP TABLE IF EXISTS "foo_table";
CREATE TABLE "foo_table" ("key" TEXT PRIMARY KEY  NOT NULL , "value" TEXT);
INSERT INTO "foo_table" VALUES('foo','bar');
INSERT INTO "foo_table" VALUES('hoge','fuga');
	]]>.toString());

	assert.isTrue(db instanceof Ci.mozIStorageConnection);
	assert.equals(utilsModule.getFileFromKeyword('TmpD').path, db.databaseFile.parent.path);

	var statement = db.createStatement('SELECT value FROM foo_table WHERE key = "hoge"');
	statement.executeStep();
	assert.equals('fuga', statement.getString(0));

	utils.scheduleToRemove(db.databaseFile);
}

function test_createDatabaseFromSQLFile()
{
	var db = utilsModule.createDatabaseFromSQLFile(baseURL+'../../fixtures/test.sql', 'UTF-8');

	assert.isTrue(db instanceof Ci.mozIStorageConnection);
	assert.equals(utilsModule.getFileFromKeyword('TmpD').path, db.databaseFile.parent.path);

	var statement = db.createStatement('SELECT value FROM test_table WHERE key = "key2"');
	statement.executeStep();
	assert.equals('value2', statement.getString(0));

	utils.scheduleToRemove(db.databaseFile);
}


function test_parseTemplate()
{
	var str = <![CDATA[
			<% for (var i = 0; i < 3; i++) { %>
			256の16進数表現は<%= (256).toString(16) %>です。
			<% } %>
			<%= foo %><%= this.foo %><%= \u65e5\u672c\u8a9e %>
		]]>.toString();
	var params = { foo : 'bar' };
	params["日本語"] = true;

	assert.equals(
		<![CDATA[
			
			256の16進数表現は100です。
			
			256の16進数表現は100です。
			
			256の16進数表現は100です。
			
			barbartrue
		]]>.toString(),
		utilsModule.parseTemplate(str, params)
	);
}
