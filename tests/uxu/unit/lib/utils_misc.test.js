// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');


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
	utilsModule.include('../../fixtures/test.js', 'UTF-8', namespace);
	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);
}

function test_include_oldStyle()
{
	var namespace = {};
	utilsModule.include('../../fixtures/test.js', namespace, 'UTF-8');
	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);
}


test_setAndGetClipBoard.setUp = function() {
	if (utils.product == 'Firefox') {
		yield Do(utils.setUpTestWindow());
	}
	yield Do(utils.loadURI('../../fixtures/html.html'));
	if (utils.product == 'Firefox') {
		utils.getTestWindow().resizeTo(680, 480);
	}
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

function test_hash()
{
	function assertHash(aExpected, aSource, aAlgorithm)
	{
		assert.equals(aExpected, utilsModule.computeHash(aSource, aAlgorithm));
		assert.equals(aExpected, utilsModule[aAlgorithm](aSource));
	}

	assertHash('D9CCE882EE690A5C1CE70BEFF3A78C77', 'hello world', 'md2');
	assertHash('5EB63BBBE01EEED093CB22BB8F5ACDC3', 'hello world', 'md5');
	assertHash('2AAE6C35C94FCFB415DBE95F408B9CE91EE846ED',
	           'hello world', 'sha1');
	assertHash('B94D27B9934D3E08A52E52D7DA7DABFAC484EFE37A5380EE9088F7ACE2EFCDE9',
	           'hello world', 'sha256');
	assertHash('FDBD8E75A67F29F701A4E040385E2E23986303EA10239211AF907FCBB83578B3'+
	           'E417CB71CE646EFD0819DD8C088DE1BD',
	           'hello world', 'sha384');
	assertHash('309ECC489C12D6EB4CC40F50C902F2B4D0ED77EE511A7C7A9BCD3CA86D4CD86F'+
	           '989DD35BC5FF499670DA34255B45B0CFD830E81F605DCF7DC5542E93AE9CD76F',
	           'hello world', 'sha512');
}

function test_hashFromFile()
{
	function assertHash(aExpected, aSource, aAlgorithm)
	{
		assert.equals(aExpected, utilsModule.computeHashFromFile(aSource, aAlgorithm));
		assert.equals(aExpected, utilsModule[aAlgorithm+'FromFile'](aSource));
	}

	var source = utils.normalizeToFile('../../fixtures/hash.txt');
	assertHash('4D8F010D437637D3D72E8D935A660757', source, 'md2');
	assertHash('2609A2251E2A1A934A99539BA54D6E55', source, 'md5');
	assertHash('7BD6E50A060F9D63CDD89082CC215025A800333E',
	           source, 'sha1');
	assertHash('23615DDBB04C4F5976DE4D70671A928A1904D15A7E3B573E1E5DADEF24802110',
	           source, 'sha256');
	assertHash('99D9FA2F423643543784685A81C8E86CFC700AA342655264A3B116490BA18E03'+
	           '830F627C4E4A4DA00142569BC836E8E3',
	           source, 'sha384');
	assertHash('871F8CFEAA2C091376C21E3142605BE19E77C1D61DC96D39E9BBCBEC3D4753DC'+
	           'CA25CBAEC62C33A3AC0930B5B757FEBB3419809C2E97FDD640FD21EDC4A4733E',
	           source, 'sha512');
}
