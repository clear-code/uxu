// -*- indent-tabs-mode: t; tab-width: 4 -*-
var parallel = false;

utils.include('common.inc.js');


test$.setUp = function()
{
	var orig = utilsModule._getDocument;
	utilsModule._getDocument = function(aContext) {
		if (!aContext)
			return document;

		return orig.call(this, aContext);
	};
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
	var orig = utilsModule._getDocument;
	utilsModule._getDocument = function(aContext) {
		if (!aContext)
			return document;

		return orig.call(this, aContext);
	};
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


if (utils.checkPlatformVersion('1.9') < 0) test_sleep.priority = 'never';
function test_sleep()
{
	var before = Date.now();
	yield utilsModule.sleep(500);
	assert.inDelta(500, Date.now() - before, 200);
}

if (utils.checkPlatformVersion('1.9') < 0) test_wait.priority = 'never';
function test_wait()
{
	function assertWaitSuccess(aConditions, aTimeout)
	{
		var before = Date.now();
		yield utilsModule.wait.apply(utilsModule, aConditions);
		assert.inDelta(aTimeout, Date.now() - before, 200);
	}

	function assertWaitFail(aConditions, aTimeout)
	{
		yield assert.raises(
			new RegExp(
				bundle.getFormattedString('error_utils_wait_unknown_condition', [String(aConditions[0])])
					.replace(/([\[\]\.\{\}\(\)])/g, '\\$1')
			),
			function() {
				yield utilsModule.wait.apply(utilsModule, aConditions);
			}
		);
	}

	yield assertWaitSuccess([500], 500);

	var object = { value : false };
	yield assertWaitFail([object], 0);

	var func = function() { return true; };
	yield assertWaitSuccess([func], 0);

	yield assertWaitSuccess([true], 100);
	yield assertWaitSuccess([false], 100);
	yield assertWaitSuccess(['string'], 100);
	yield assertWaitSuccess([null], 100);
	yield assertWaitSuccess([undefined], 100);

	yield assertWaitFail([{}]);
	yield assertWaitFail([-100]);

	var deferred = new Deferred();
	window.setTimeout(function() {
		deferred.call();
	}, 500);
	yield assertWaitSuccess([deferred], 500);

	deferred = new Deferred();
	deferred.call();
	yield assertWaitSuccess([deferred], 0);
}

if (utils.checkPlatformVersion('1.9') < 0) test_waitDOMEvent.priority = 'never';
test_waitDOMEvent.setUp = function()
{
	utils.setPref('extensions.uxu.run.timeout.waitDOMEvent', 500);
	yield Do(utils.loadURI('about:blank?wait'));
}
function test_waitDOMEvent()
{
	function assertWaitSuccess(aConditions, aTimeout, aDelta)
	{
		var before = Date.now();
		yield utilsModule.waitDOMEvent.apply(utilsModule, aConditions)
			.catch(function(e) {
				utils.log('ERROR CONDITIONS:', aConditions, aTimeout, aDelta);
				throw e;
			});
		assert.inDelta(aTimeout, Date.now() - before, aDelta);
	}

	function clickWithDelay(aTarget, aDelay)
	{
		window.setTimeout(function() {
			try{
				action.clickOn(aTarget);
			}
			catch(e){
				utils.log('ERROR: failed to fire click event');
				utils.log(e);
			}
		}, aDelay || 10);
	}

	// standard
	clickWithDelay(content.document.documentElement);
	yield assertWaitSuccess([content.document, 'click', 1000], 500, 499);

	// timeout
	yield assert.raises(
		'Error',
		() => utilsModule.waitDOMEvent(content.document, 'click', 100)
	);

	// mixed order
	clickWithDelay(content.document.documentElement);
	yield assertWaitSuccess(['click', 1000, content.document], 500, 499);

	// multiple events
	clickWithDelay(content.document.documentElement);
	yield assertWaitSuccess([content.document, 'click',
	                   content.document, 'keypress',
	                   1000], 500, 499);

	// detailed conditions
	clickWithDelay(content.document.documentElement);
	window.setTimeout(function() {
		action.rightClickOn(content.document.documentElement, { ctrlKey : true });
	}, 20);
	yield assertWaitSuccess([{ type    : 'click',
	                     button  : 2,
	                     ctrlKey : true
	                   },
	                   content.document,
	                   1000], 500, 499);

	// callback style
	var events = [];
	utilsModule.waitDOMEvent(
			'click', content.document,
			100
		)
		.then(function(aEvent) {
				events.push(aEvent);
		})
		.catch(function(aError) {
				events.push(aError);
		});
	assert.equals([], events);
	clickWithDelay(content.document.documentElement);
	yield utils.wait(200);
	assert.equals(['click'],
	              events.map(function(aEvent) aEvent.type));
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
	var flagRecursive = false;

	function TestGenerator()
	{
		flagFirst = true;

		yield 100;
		flagWait = true;

		var startAt = Date.now();
		yield (function() {
				while (Date.now() - startAt < 100) {
					yield false;
				}
			});
		flagRecursive = true;
	}

	var iterator = TestGenerator();
	yield Do(utilsModule.doIteration(iterator));
	assert.isTrue(flagFirst);
	assert.isTrue(flagWait);
	assert.isTrue(flagRecursive);

	flagFirst = flagWait = flagRecursive = false;
	yield Do(utilsModule.doIteration(TestGenerator));
	assert.isTrue(flagFirst);
	assert.isTrue(flagWait);
	assert.isTrue(flagRecursive);
}

function test_doIterationWithError()
{
	function TestGenerator()
	{
		throw new Error('error');
		yield 1;
	}

	var iterator = TestGenerator();
	var exception;
	utilsModule.doIteration(iterator)
		.then(function() { exception = null; })
		.catch(function(aException) { exception = aException; });
	yield 100;
	assert.isInstanceOf(Error, exception);
}

function test_doIterationForVariousValues()
{
	function assertPromise(aValue)
	{
		yield assert.notRaises(
			'Error',
			function() {
				aValue = utilsModule.doIteration(aValue);
				assert.isObject(aValue);
				assert.isFunction(aValue.then);
				yield aValue
			}
		);
	}

	function assertUnacceptable(aValue)
	{
		yield assert.raises(
			'Error',
			() => utilsModule.doIteration(aValue)
		);
	}

	yield assertUnacceptable({});
	yield assertPromise(true);
	yield assertPromise(100);
	yield assertPromise('string');
	yield assertPromise(function() {
		return 'foobar';
	});

	function Generator()
	{
		yield 100;
	};
	yield assertPromise(Generator);
	yield assertPromise(Generator());
}

function test_Do()
{
	function assertPassThrough(aValue)
	{
		var result = utilsModule.Do(aValue);
		assertStrictlyEqual(aValue, result);
	}

	assertPassThrough({});
	assertPassThrough(true);
	assertPassThrough(100);
	assertPassThrough('string');
	assertPassThrough(function() {
		return 'foobar';
	});

	function Generator()
	{
		yield 100;
	};
	assertPassThrough(Generator);
	assertPassThrough(Generator());
}

var simpleObject = {string: "String", 29: 10};
var selfReferenceObject = {
		get propGetter()
		{
			return true;
		},
		get propError()
		{
			throw 'error';
		}
	};
var inspectedSelfReferenceObject = (
		'{"propError": (INACCESSIBLE #1, REASON: error), '+
		'"propGetter": true, "self": [object Object]}'
	);
var inspectedSelfReferenceObjectIndent = (
		'{\n  "propError": (INACCESSIBLE #1, REASON: error),\n'+
		'  "propGetter": true,\n  "self": [object Object]\n}'
	);
selfReferenceObject.self = selfReferenceObject;
testInspect.parameters = {
	string:         { input    : "String",
	                  expected : '"String"' },
	number:         { input    : 10,
	                  expected : '10' },
	array:          { input    : ["String", 10],
	                  expected : '["String", 10]' },
	object:         { input    : simpleObject,
	                  expected : '{"29": 10, "string": "String"}' },
	objectArray:    { input    : [simpleObject],
	                  expected : '[{"29": 10, "string": "String"}]' },
	objectArray2:   { input    : [simpleObject, simpleObject],
	                  expected : '[{"29": 10, "string": "String"}, ' +
	                	         '{"29": 10, "string": "String"}]' },
	recursive:      { input    : selfReferenceObject,
	                  expected : inspectedSelfReferenceObject },
	recursiveArray: { input    : [selfReferenceObject, selfReferenceObject],
	                  expected : '['+inspectedSelfReferenceObject+', '+
	                             inspectedSelfReferenceObject+']' },

	indentString:   { input    : "String",
	                  indent   : '  ',
	                  expected : '"String"' },
	indentNumber:   { input    : 10,
	                  indent   : '  ',
	                  expected : '10' },
	indentArray:    { input    : ["String", 10],
	                  indent   : '  ',
	                  expected : '[\n  "String",\n  10\n]' },
	indentObject:   { input    : simpleObject,
	                  indent   : '  ',
	                  expected : '{\n  "29": 10,\n  "string": "String"\n}' },
	indentObjectArray:
	                { input    : [simpleObject],
	                  indent   : '  ',
	                  expected : '[\n  {\n    "29": 10,\n    "string": "String"\n  }\n]' },
	indentObjectArray2:
	                { input    : [simpleObject, simpleObject],
	                  indent   : '  ',
	                  expected : '[\n  {\n    "29": 10,\n    "string": "String"\n  },\n' +
	                             '  {\n    "29": 10,\n    "string": "String"\n  }\n]' },
	indentRecursive:
	                { input    : selfReferenceObject,
	                  indent   : '  ',
	                  expected : inspectedSelfReferenceObjectIndent },
	indentRecursiveArray:
	                { input    : [selfReferenceObject, selfReferenceObject],
	                  indent   : '  ',
	                  expected : '[\n'+
	                             inspectedSelfReferenceObjectIndent.replace(/^/gm, '  ')+',\n'+
	                             inspectedSelfReferenceObjectIndent.replace(/^/gm, '  ')+
	                             '\n]' }
};
testInspect.priority = "must";
function testInspect(aParameter)
{
	assert.equals(
		aParameter.expected,
		utilsModule.inspect(aParameter.input, aParameter.indent)
	);
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
	yield Do(utils.tearDownTestWindow());
}
function test_setAndGetClipBoard()
{
	var random = Math.random() * 65000;
	utils.setClipBoard(random);
	assert.equals(random, utilsModule.getClipBoard());

	random = Math.random() * 65000;
	utilsModule.setClipBoard(random);
	assert.equals(random, utils.getClipBoard());

	var selection = content.getSelection();
	selection.removeAllRanges();

	var isLinux = (navigator.platform.toLowerCase().indexOf('linux') > -1);
	if (isLinux) {
		action.dblclickOn(content.document.getElementById('paragraph3'));
		yield 100;
		assert.equals('paragraph3', selection.toString());
		assert.equals('paragraph3', utilsModule.getSelectionClipBoard());
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
	isArrayTestWindow.setTimeout(
		'window.testArrayLiteral = [];\n' +
		'window.testArrayInstance = new Array();\n' +
		'window.testDate = new Date();\n' +
		'window.testString = "string";\n' +
		'window.testNumber = 29;\n' +
		'window.testNull = null;\n' +
		'window.testUndefined = void(0);',
		0
	);
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
	isDateTestWindow.setTimeout(
		'window.testArrayLiteral = [];\n' +
		'window.testArrayInstance = new Array();\n' +
		'window.testDate = new Date();\n' +
		'window.testString = "string";\n' +
		'window.testNumber = 29;\n' +
		'window.testNull = null;\n' +
		'window.testUndefined = void(0);',
		0
	);
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

function test_computeHash()
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

function test_computeHashFromFile()
{
	function assertHash(aExpected, aSource, aAlgorithm)
	{
		assert.equals(aExpected, utilsModule.computeHashFromFile(aSource, aAlgorithm));
		assert.equals(aExpected, utilsModule[aAlgorithm+'FromFile'](aSource));
	}

	var source = '../../fixtures/hash.txt';
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

function createCustomClass(aFunction)
{
	var f = aFunction || function(aValue) {
			this.value = aValue;
		};
	f.prototype = {
		property : 'source'
	};
	f.classMethod = function() {
		return 'source';
	};
	return f;
}

function createCustomClassReturnObject()
{
	return createCustomClass(function(aValue) {
			this.value = aValue;
			return {
				returned    : true,
				staticValue : aValue
			};
		});
}

function assertBound(aSource, aBound, aNamespace)
{
	var namespace = aNamespace || {};
	var bound = aBound || utilsModule.bind(aSource, namespace);

	// as a function
	assert.isFunction(bound);
	bound('new value');
	assert.equals('new value', namespace.value);

	// as constructor
	assert.isFunction(bound.classMethod);
	assert.equals('source', bound.classMethod());
	assert.equals(aSource.prototype, bound.prototype);

	var instance = new bound('my value');
	assert.isDefined(instance);
	if (instance.returned) {
		assert.equals('my value', instance.staticValue, utils.inspect(instance));
	}
	else {
		assert.isInstanceOf(aSource, instance);
		assert.equals('my value', instance.value, utils.inspect(instance));
	}
}

function test_bind()
{
	assertBound(createCustomClass());
	assertBound(createCustomClassReturnObject());
}


function test_export()
{
	var source = utils.inherit(
		{
				superProperty : 'super'
		},
		{
			_internal : 'source',
			property : 'source',
			get getter() {
				return 'source';
			},
			get setter() {
				return this.setterValue;
			},
			set setter(aValue) {
				this.setterValue = 'source '+aValue;
				return aValue;
			},
			method : function() {
				return 'source';
			},
			MyClass : createCustomClass(),
			MyClassReturnObject : createCustomClassReturnObject()
		}
	);

	var target = {
			_internal : 'original',
			property : 'original',
			get getter() {
				return 'original';
			},
			get setter() {
				return this.setterValue;
			},
			set setter(aValue) {
				this.setterValue = 'original '+aValue;
				return aValue;
			},
			method : function() {
				return 'original';
			}
		};
	utilsModule.export(target, true, source, source);

	assert.isUndefined(target.superProperty);
	assert.equals('original', target._internal);
	assert.equals('source', target.property);
	assert.equals('source', target.getter);
	target.setter = 'foo'; // this must be ignored.
	assert.isUndefined(target.setterValue);
	assert.isUndefined(source.setterValue);
	assert.isFunction(target.method);
	assert.equals('source', target.method());
	assertBound(source.MyClass, target.MyClass, source);
	assertBound(source.MyClassReturnObject, target.MyClassReturnObject, source);

	target = {
			_internal : 'original',
			property : 'original',
			get getter() {
				return 'original';
			},
			get setter() {
				return this.setterValue;
			},
			set setter(aValue) {
				this.setterValue = 'original '+aValue;
				return aValue;
			},
			method : function() {
				return 'original';
			}
		};
	utilsModule.export(target, false, source, source);

	assert.isUndefined(target.superProperty);
	assert.equals('original', target._internal);
	assert.equals('original', target.property);
	assert.equals('original', target.getter);
	target.setter = 'bar';
	assert.isUndefined(source.setterValue);
	assert.equals('original bar', target.setterValue);
	assert.isFunction(target.method);
	assert.equals('original', target.method());
	assertBound(source.MyClass, target.MyClass, source);
	assertBound(source.MyClassReturnObject, target.MyClassReturnObject, source);
}

function test_export_self()
{
	var exported = {};
	utilsModule.export(exported);

	var properties = [];
	var methods = [];
	for (let i in utilsModule.__proto__)
	{
		if (!utilsModule.__proto__.hasOwnProperty(i) ||
			i.indexOf('_') == 0)
			continue;

		else if (typeof utilsModule.__proto__[i] == 'function')
			methods.push(i);
		else
			properties.push(i);
	}

	var exportedProperties = [];
	var exportedMethods = [];
	for (let i in exported)
	{
		if (!exported.hasOwnProperty(i))
			continue;

		if (typeof exported[i] == 'function')
			exportedMethods.push(i);
		else
			exportedProperties.push(i);
	}

	assert.equals(methods.sort(), exportedMethods.sort());
	assert.equals(properties.sort(), exportedProperties.sort());
}
