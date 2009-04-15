// -*- indent-tabs-mode: t; tab-width: 4 -*-

var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var Assertions = test_module.require('class', 'assertions');

var assertionsModule;
var diff;

function setUp()
{
	assertionsModule = new Assertions();
	diff = {};
	utils.include(topDir+'content/uxu/lib/diff.js', diff);
}

function tearDown()
{
}

function assertSucceeded(aAssertion, aArgs)
{
	assert.notRaises(
		'AssertionFailed',
		function() {
			aAssertion.apply(assertionsModule, aArgs);
		},
		null
	);
}

function assertFailed(aAssertion, aArgs)
{
	assert.raises(
		'AssertionFailed',
		function() {
			aAssertion.apply(assertionsModule, aArgs);
		},
		null
	);

	var exception;
	try {
		aAssertion.apply(assertionsModule, aArgs);
	}
	catch(e) {
		exception = e;
	}
	assert.notEquals(-1, exception.message.indexOf(aArgs[aArgs.length-1]));
}

function testEquals()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.equals, [1, 1]);
	assertFailed(assertionsModule.equals, [0, 1, message]);

	assertSucceeded(assertionsModule.equals, [[1, "2", true],
                                              [1, "2", true]]);
	assertSucceeded(assertionsModule.equals, [[1, 2, false],
                                              [1, "2", false]]);

	assertSucceeded(assertionsModule.equals,
                    [new Date(2007, 5, 27, 7, 23, 54),
                     new Date(2007, 5, 27, 7, 23, 54)]);
	assertFailed(assertionsModule.equals,
                 [new Date(2008, 5, 27, 7, 23, 54),
                  new Date(2007, 5, 27, 7, 23, 54),
                  message]);

	assertSucceeded(assertionsModule.equals,
                    [{my: 1, name: "is", Nakano: "NO!"},
                     {my: "1", name: "is", Nakano: "NO!"}]);
	assertFailed(assertionsModule.equals,
                 [{my: 1, name: "is", Nakano: "NO!"},
                  {my: 9, name: "is", Nakano: "NO!"},
                  message]);
	assertFailed(assertionsModule.equals,
                 [{my: 1, name: "is", Nakano: "NO!"},
                  {my: 1, name: "is", Nakano: "NO!", additional: 0},
                  message]);
	assertFailed(assertionsModule.equals,
                 [{my: 1, name: "is", Nakano: "NO!", additional: 0},
                  {my: 1, name: "is", Nakano: "NO!"},
                  message]);

	var node = document.createElement('box');
	assertSucceeded(assertionsModule.equals,
                    [node,
                     node]);
	assertFailed(assertionsModule.equals,
                 [node,
                  document.createElement('box'),
                  message]);


	assertSucceeded(assertionsModule.notEquals, [0, 1]);
	assertFailed(assertionsModule.notEquals, [1, 1, message]);
	assertSucceeded(assertionsModule.notEqual, [0, 1]);
	assertFailed(assertionsModule.notEqual, [1, 1, message]);
}

function testStrictlyEquals()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.strictlyEquals, [1, 1]);
	assertFailed(assertionsModule.strictlyEquals, [0, 1, message]);

	assertSucceeded(assertionsModule.strictlyEquals, [[1, "2", true],
                                                      [1, "2", true]]);
	assertFailed(assertionsModule.strictlyEquals, [[1, 2, false],
                                                   [1, "2", false],
                                                   message]);

	assertSucceeded(assertionsModule.strictlyEquals,
                    [new Date(2007, 5, 27, 7, 23, 54),
                     new Date(2007, 5, 27, 7, 23, 54)]);
	assertFailed(assertionsModule.strictlyEquals,
                 [new Date(2008, 5, 27, 7, 23, 54),
                  new Date(2007, 5, 27, 7, 23, 54),
                  message]);

	assertSucceeded(assertionsModule.strictlyEquals,
                    [{my: 1, name: "is", Nakano: "NO!"},
                     {my: 1, name: "is", Nakano: "NO!"}]);
	assertFailed(assertionsModule.strictlyEquals,
                 [{my: 1, name: "is", Nakano: "NO!"},
                  {my: "1", name: "is", Nakano: "NO!"},
                  message]);
	assertFailed(assertionsModule.strictlyEquals,
                 [{my: 1, name: "is", Nakano: "NO!", additional: 0},
                  {my: 1, name: "is", Nakano: "NO!"},
                  message]);
}

function testContains()
{
	var message = Math.random() * 65000;

	// simple string
	assertSucceeded(assertionsModule.contains,
                    ['text', 'long text']);
	assertFailed(assertionsModule.contains,
                 ['outside', 'long text', message]);
	assertFailed(assertionsModule.notContains,
                 ['text', 'long text', message]);
	assertSucceeded(assertionsModule.notContains,
                    ['outside', 'long text']);

	// array
	var item = { value : true };
	var array = ['string', 29, true, item];
	assertSucceeded(assertionsModule.contains,
                    ['string', array]);
	assertSucceeded(assertionsModule.contains,
                    [29, array]);
	assertSucceeded(assertionsModule.contains,
                    [true, array]);
	assertSucceeded(assertionsModule.contains,
                    [item, array]);
	assertFailed(assertionsModule.contains,
                 ['outside', array, message]);
	assertFailed(assertionsModule.notContains,
                 ['string', array, message]);
	assertFailed(assertionsModule.notContains,
                 [29, array, message]);
	assertFailed(assertionsModule.notContains,
                 [true, array, message]);
	assertFailed(assertionsModule.notContains,
                 [item, array, message]);
	assertSucceeded(assertionsModule.notContains,
                    ['outside', array]);


	yield Do(utils.loadURI('../../fixtures/links.html'));

	function $(aId)
	{
		return content.document.getElementById(aId);
	}

	var targetRange;

	// range
	var range = content.document.createRange();
	range.setStartBefore($('item4'));
	range.setEndAfter($('item9'));

	assertSucceeded(assertionsModule.contains,
                    [$('link5'), range]);
	assertFailed(assertionsModule.contains,
                 [$('link10'), range, message]);
	assertFailed(assertionsModule.notContains,
                 [$('link5'), range, message]);
	assertSucceeded(assertionsModule.notContains,
                    [$('link10'), range]);

	assertSucceeded(assertionsModule.contains,
                    ['リンク5', range]);
	assertFailed(assertionsModule.contains,
                 ['リンク10', range, message]);
	assertFailed(assertionsModule.notContains,
                 ['リンク5', range, message]);
	assertSucceeded(assertionsModule.notContains,
                    ['リンク10', range]);

	targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSucceeded(assertionsModule.contains,
                    [targetRange, range]);
	assertFailed(assertionsModule.notContains,
                 [targetRange, range, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailed(assertionsModule.contains,
                 [targetRange, range, message]);
	assertSucceeded(assertionsModule.notContains,
                    [targetRange, range]);

	range.detach();
	targetRange.detach();

	// selection
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

	assertSucceeded(assertionsModule.contains,
                    [$('link5'), selection]);
	assertFailed(assertionsModule.contains,
                 [$('link10'), selection, message]);
	assertSucceeded(assertionsModule.contains,
                    [$('link13'), selection]);
	assertFailed(assertionsModule.notContains,
                 [$('link5'), selection, message]);
	assertSucceeded(assertionsModule.notContains,
                    [$('link10'), selection]);
	assertFailed(assertionsModule.notContains,
                 [$('link13'), selection, message]);

	assertSucceeded(assertionsModule.contains,
                    ['リンク5', selection]);
	assertFailed(assertionsModule.contains,
                 ['リンク10', selection, message]);
	assertSucceeded(assertionsModule.contains,
                    ['リンク13', selection]);
	assertFailed(assertionsModule.notContains,
                 ['リンク5', selection, message]);
	assertSucceeded(assertionsModule.notContains,
                    ['リンク10', selection]);
	assertFailed(assertionsModule.notContains,
                 ['リンク13', selection, message]);

	targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSucceeded(assertionsModule.contains,
                    [targetRange, selection]);
	assertFailed(assertionsModule.notContains,
                 [targetRange, selection, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailed(assertionsModule.contains,
                 [targetRange, selection, message]);
	assertSucceeded(assertionsModule.notContains,
                    [targetRange, selection]);
	targetRange.selectNode($('em13'));
	targetRange.setEnd($('em13').lastChild, 3);
	assertSucceeded(assertionsModule.contains,
                    [targetRange, selection]);
	assertFailed(assertionsModule.notContains,
                 [targetRange, selection, message]);

	targetRange.detach();
	selection.removeAllRanges();

	// sub tree
	var root = $('item5');

	assertSucceeded(assertionsModule.contains,
                    [$('link5'), root]);
	assertFailed(assertionsModule.contains,
                 [$('link10'), root, message]);
	assertFailed(assertionsModule.notContains,
                 [$('link5'), root, message]);
	assertSucceeded(assertionsModule.notContains,
                    [$('link10'), root]);

	assertSucceeded(assertionsModule.contains,
                    ['リンク5', root]);
	assertFailed(assertionsModule.contains,
                 ['リンク10', root, message]);
	assertFailed(assertionsModule.notContains,
                 ['リンク5', root, message]);
	assertSucceeded(assertionsModule.notContains,
                    ['リンク10', root]);

	targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSucceeded(assertionsModule.contains,
                    [targetRange, root]);
	assertFailed(assertionsModule.notContains,
                 [targetRange, root, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailed(assertionsModule.contains,
                 [targetRange, root, message]);
	assertSucceeded(assertionsModule.notContains,
                    [targetRange, root]);

	targetRange.detach();
}

function testBoolean()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.isTrue, [true]);
	assertSucceeded(assertionsModule.isTrue, [{}]);
	assertFailed(assertionsModule.isTrue, [false, message]);
	assertFailed(assertionsModule.isTrue, [0, message]);
	assertFailed(assertionsModule.isTrue, ['', message]);
	assertFailed(assertionsModule.isTrue, [null, message]);

	assertSucceeded(assertionsModule.isFalse, [false]);
	assertSucceeded(assertionsModule.isFalse, [0]);
	assertSucceeded(assertionsModule.isFalse, ['']);
	assertSucceeded(assertionsModule.isFalse, [null]);
	assertFailed(assertionsModule.isFalse, [true, message]);
	assertFailed(assertionsModule.isFalse, [{}, message]);
}

function testType()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.isBoolean, [true]);
	assertFailed(assertionsModule.isBoolean, ['true', message]);

	assertSucceeded(assertionsModule.isNotBoolean, ['true']);
	assertFailed(assertionsModule.isNotBoolean, [true, message]);

	assertSucceeded(assertionsModule.isString, ['1']);
	assertFailed(assertionsModule.isString, [1, message]);

	assertSucceeded(assertionsModule.isNotString, [1]);
	assertFailed(assertionsModule.isNotString, ['1', message]);

	assertSucceeded(assertionsModule.isNumber, [0]);
	assertFailed(assertionsModule.isNumber, ['0', message]);

	assertSucceeded(assertionsModule.isNotNumber, ['0']);
	assertFailed(assertionsModule.isNotNumber, [0, message]);

	assertSucceeded(assertionsModule.isFunction, [(function() {})]);
	assertSucceeded(assertionsModule.isFunction, [(new Function('foo', 'return foo'))]);
	assertFailed(assertionsModule.isFunction, [true, message]);
	assertFailed(assertionsModule.isFunction, [false, message]);
	assertFailed(assertionsModule.isFunction, [0, message]);
	assertFailed(assertionsModule.isFunction, ['func', message]);
	assertFailed(assertionsModule.isFunction, [null, message]);

	assertSucceeded(assertionsModule.isNotFunction, [true]);
	assertSucceeded(assertionsModule.isNotFunction, [false]);
	assertSucceeded(assertionsModule.isNotFunction, [0]);
	assertSucceeded(assertionsModule.isNotFunction, ['func']);
	assertSucceeded(assertionsModule.isNotFunction, [null]);
	assertFailed(assertionsModule.isNotFunction, [(function() {}), message]);
	assertFailed(assertionsModule.isNotFunction, [(new Function('foo', 'return foo')), message]);
}

function testNullAndUndefined()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.isDefined, [true]);
	assertSucceeded(assertionsModule.isDefined, [false]);
	assertSucceeded(assertionsModule.isDefined, [0]);
	assertSucceeded(assertionsModule.isDefined, ['']);
	assertSucceeded(assertionsModule.isDefined, [null]);
	assertFailed(assertionsModule.isDefined, [void(0), message]);

	assertSucceeded(assertionsModule.isUndefined, [void(0)]);
	assertFailed(assertionsModule.isUndefined, [true, message]);
	assertFailed(assertionsModule.isUndefined, [false, message]);
	assertFailed(assertionsModule.isUndefined, [0, message]);
	assertFailed(assertionsModule.isUndefined, ['', message]);
	assertFailed(assertionsModule.isUndefined, [null, message]);

	assertSucceeded(assertionsModule.isNull, [null]);
	assertFailed(assertionsModule.isNull, [true, message]);
	assertFailed(assertionsModule.isNull, [false, message]);
	assertFailed(assertionsModule.isNull, [0, message]);
	assertFailed(assertionsModule.isNull, ['', message]);
	assertFailed(assertionsModule.isNull, [void(0), message]);

	assertSucceeded(assertionsModule.isNotNull, [true]);
	assertSucceeded(assertionsModule.isNotNull, [false]);
	assertSucceeded(assertionsModule.isNotNull, [0]);
	assertSucceeded(assertionsModule.isNotNull, ['']);
	assertSucceeded(assertionsModule.isNotNull, [void(0)]);
	assertFailed(assertionsModule.isNotNull, [null, message]);
}

function testRegExp()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.matches,
		[/te[sx]t/, 'test']
	);
	assertFailed(assertionsModule.matches,
		[/te[sx]t/, 'tent', message]
	);
	assertSucceeded(assertionsModule.match,
		[/te[sx]t/, 'test']
	);
	assertFailed(assertionsModule.match,
		[/te[sx]t/, 'tent', message]
	);

	assertSucceeded(assertionsModule.notMatches,
		[/te[sx]t/, 'tent']
	);
	assertFailed(assertionsModule.notMatches,
		[/te[sx]t/, 'test', message]
	);
	assertSucceeded(assertionsModule.notMatch,
		[/te[sx]t/, 'tent']
	);
	assertFailed(assertionsModule.notMatch,
		[/te[sx]t/, 'test', message]
	);

	assertSucceeded(assertionsModule.pattern,
		['test', /te[sx]t/]
	);
	assertFailed(assertionsModule.pattern,
		['tent', /te[sx]t/, message]
	);

	assertSucceeded(assertionsModule.notPattern,
		['tent', /te[sx]t/]
	);
	assertFailed(assertionsModule.notPattern,
		['test', /te[sx]t/, message]
	);
}

function testArray()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.arrayEquals,
		[[0, 1, 2], [0, 1, 2]]
	);
	assertFailed(assertionsModule.arrayEquals,
		[[0, 1, 2], [3, 4, 5], message]
	);
	assertSucceeded(assertionsModule.arrayEqual,
		[[0, 1, 2], [0, 1, 2]]
	);
	assertFailed(assertionsModule.arrayEqual,
		[[0, 1, 2], [3, 4, 5], message]
	);
}

function testRaises()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.raises,
		['test', function() { throw 'test'; }, {}]
	);
	assertFailed(assertionsModule.raises,
		['test', function() { return true; }, {}, message]
	);
	assertSucceeded(assertionsModule.raise,
		['test', function() { throw 'test'; }, {}]
	);
	assertFailed(assertionsModule.raise,
		['test', function() { return true; }, {}, message]
	);

	assertSucceeded(assertionsModule.notRaises,
		['test', function() { return true; }, {}]
	);
	assertSucceeded(assertionsModule.notRaises,
		['test', function() { throw 'unknown'; }, {}]
	);
	assertFailed(assertionsModule.notRaises,
		['test', function() { throw 'test'; }, {}, message]
	);
	assertSucceeded(assertionsModule.notRaise,
		['test', function() { return true; }, {}]
	);
	assertSucceeded(assertionsModule.notRaise,
		['test', function() { throw 'unknown'; }, {}]
	);
	assertFailed(assertionsModule.notRaise,
		['test', function() { throw 'test'; }, {}, message]
	);
}

var inDeltaListener;
testInDelta.setUp = function()
{
	inDeltaListener = {
		onAssertionNotify : function(aEvent)
		{
			this.events.push(aEvent);
		},
		events : []
	};
	assertionsModule.addListener(inDeltaListener);
}
testInDelta.tearDown = function()
{
	assertionsModule.removeListener(inDeltaListener);
}
function testInDelta()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.inDelta, [1.0, 1.1, 0.11]);
	assert.equals(0, inDeltaListener.events.length);
	assertSucceeded(assertionsModule.inDelta, [1.0, 1.1, 0.1]);
	assert.equals(1, inDeltaListener.events.length);
	assertFailed(assertionsModule.inDelta, [1.0, 1.2, 0.1, message]);
	assert.equals(1, inDeltaListener.events.length);

	assertSucceeded(assertionsModule.inDelta, [1.0, 0.9, 0.11]);
	assert.equals(1, inDeltaListener.events.length);
	assertSucceeded(assertionsModule.inDelta, [1.0, 0.9, 0.1]);
	assert.equals(2, inDeltaListener.events.length);
	assertFailed(assertionsModule.inDelta, [1.0, 0.8, 0.1, message]);
	assert.equals(2, inDeltaListener.events.length);
}

function testCompare()
{
	var message = Math.random() * 65000;

	assertSucceeded(assertionsModule.compare, [10, '<', 20]);
	assertFailed(assertionsModule.compare, [10, '<', 5, message]);
	assertFailed(assertionsModule.compare, [10, '<', 10, message]);

	assertSucceeded(assertionsModule.compare, [10, '<=', 20]);
	assertFailed(assertionsModule.compare, [10, '<=', 5, message]);
	assertSucceeded(assertionsModule.compare, [10, '<=', 10]);
	assertSucceeded(assertionsModule.compare, [10, '=<', 20]);
	assertFailed(assertionsModule.compare, [10, '=<', 5, message]);
	assertSucceeded(assertionsModule.compare, [10, '=<', 10]);

	assertSucceeded(assertionsModule.compare, [10, '>', 5]);
	assertFailed(assertionsModule.compare, [10, '>', 20, message]);
	assertFailed(assertionsModule.compare, [10, '>', 10, message]);

	assertSucceeded(assertionsModule.compare, [10, '>=', 5]);
	assertFailed(assertionsModule.compare, [10, '>=', 20, message]);
	assertSucceeded(assertionsModule.compare, [10, '>=', 10]);
	assertSucceeded(assertionsModule.compare, [10, '=>', 5]);
	assertFailed(assertionsModule.compare, [10, '=>', 20, message]);
	assertSucceeded(assertionsModule.compare, [10, '=>', 10]);
}

function testFinishesWithin()
{
	var message = Math.random() * 65000;

	assertSucceeded(
		assertionsModule.finishesWithin,
		[
			1000,
			function() {
				assert.isTrue(true);
			},
			{}
		]
	);
	assertFailed(
		assertionsModule.finishesWithin,
		[
			1000,
			function() {
				assert.isTrue(false, message);
			},
			{},
			message
		]
	);
	assertFailed(
		assertionsModule.finishesWithin,
		[
			10,
			function() {
				var startAt = Date.now();
				while (Date.now() - startAt < 50) {}
			},
			{},
			message
		]
	);

	yield Do(assertionsModule.finishesWithin(
		1000,
		function() {
			yield 10;
		},
		{}
	));

	var result = Do(assertionsModule.finishesWithin(
		10,
		function() {
			yield 500;
		},
		{}
	));
	yield (function() { return result.value; });
	assert.isDefined(result.error);
	assert.isNotNull(result.error);
	assert.equals('AssertionFailed', result.error.name);
}

function test_fail()
{
	var exception = null;
	try {
		assertionsModule.fail(
			null,
			0,
			1,
			2
		);
	}
	catch(e) {
		exception = e;
	}
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);
	assert.isUndefined(exception.expectedRaw);
	assert.isUndefined(exception.actualRaw);
	assert.isUndefined(exception.expected);
	assert.isUndefined(exception.actual);
	assert.equals('', exception.diff);
	assert.equals('', exception.foldedDiff);
	assert.equals('2\n1\n0', exception.message);


	exception = null;
	try {
		assertionsModule.fail(
			{
				actualRaw   : 0,
				actual      : 1
			},
			2,
			3,
			4
		);
	}
	catch(e) {
		exception = e;
	}
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);
	assert.isUndefined(exception.expectedRaw);
	assert.equals(0, exception.actualRaw);
	assert.isUndefined(exception.expected);
	assert.equals(1, exception.actual);
	assert.equals('', exception.diff);
	assert.equals('', exception.foldedDiff);
	assert.equals('4\n3\n2', exception.message);


	exception = null;
	try {
		assertionsModule.fail(
			{
				expectedRaw   : 0,
				expected      : 1
			},
			2,
			3,
			4
		);
	}
	catch(e) {
		exception = e;
	}
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);
	assert.equals(0, exception.expectedRaw);
	assert.isUndefined(exception.actualRaw);
	assert.equals(1, exception.expected);
	assert.isUndefined(exception.actual);
	assert.equals('', exception.diff);
	assert.equals('', exception.foldedDiff);
	assert.equals('4\n3\n2', exception.message);


	exception = null;
	try {
		assertionsModule.fail(
			{
				expectedRaw : '0aaaaaaaaaa',
				actualRaw   : '1aaaaaaaaaa',
				expected    : 2,
				actual      : 3
			},
			4,
			5,
			6
		);
	}
	catch(e) {
		exception = e;
	}
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);
	assert.equals('0aaaaaaaaaa', exception.expectedRaw);
	assert.equals('1aaaaaaaaaa', exception.actualRaw);
	assert.equals(2, exception.expected);
	assert.equals(3, exception.actual);
	assert.equals(diff.readable('0aaaaaaaaaa', '1aaaaaaaaaa'), exception.diff);
	assert.equals(diff.foldedReadable('0aaaaaaaaaa', '1aaaaaaaaaa'), exception.foldedDiff);
	assert.equals('6\n5\n4', exception.message);
}

function test_appendTypeString()
{
	assert.equals('true (boolean)', assertionsModule.appendTypeString(true));
	assert.equals('0 (number)',     assertionsModule.appendTypeString(0));
	assert.equals('"a" (string)',   assertionsModule.appendTypeString('a'));
	assert.equals('"a" (String)',   assertionsModule.appendTypeString(new String('a')));
	assert.equals('{} (Object)',    assertionsModule.appendTypeString({}));
	assert.equals('[] (Array)',     assertionsModule.appendTypeString([]));
	assert.equals('null',           assertionsModule.appendTypeString(null));
	assert.equals('undefined',      assertionsModule.appendTypeString(void(0)));
	assert.equals('function () {\n} (function)', assertionsModule.appendTypeString(function() {}));
}
