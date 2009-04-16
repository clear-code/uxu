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

function assertSuccess(aAssertion, aArgs)
{
	var beforeCount = assertionsModule.successCount;
	assert.notRaises(
		'AssertionFailed',
		function() {
			aAssertion.apply(assertionsModule, aArgs);
		},
		null
	);
	assert.equals(beforeCount+1, assertionsModule.successCount);
}

function assertFailure(aAssertion, aArgs)
{
	var beforeCount = assertionsModule.successCount;
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
	assert.equals(beforeCount, assertionsModule.successCount);
}

function assertSuccessWithDelay(aAssertion, aArgs)
{
	var beforeCount = assertionsModule.successCount;
	yield Do(assert.notRaises(
		'AssertionFailed',
		function() {
			yield Do(aAssertion.apply(assertionsModule, aArgs));
		},
		null
	));
	assert.equals(beforeCount+1, assertionsModule.successCount);
}

function assertFailureWithDelay(aAssertion, aArgs)
{
	var beforeCount = assertionsModule.successCount;
	yield Do(assert.raises(
		'AssertionFailed',
		function() {
			yield Do(aAssertion.apply(assertionsModule, aArgs));
		},
		null
	));

	var exception;
	try {
		aAssertion.apply(assertionsModule, aArgs);
	}
	catch(e) {
		exception = e;
	}
	assert.notEquals(-1, exception.message.indexOf(aArgs[aArgs.length-1]));
	assert.equals(beforeCount, assertionsModule.successCount);
}

function testEquals()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.equals, [1, 1]);
	assertFailure(assertionsModule.equals, [0, 1, message]);

	assertSuccess(assertionsModule.equals, [[1, "2", true],
                                              [1, "2", true]]);
	assertSuccess(assertionsModule.equals, [[1, 2, false],
                                              [1, "2", false]]);

	assertSuccess(assertionsModule.equals,
                    [new Date(2007, 5, 27, 7, 23, 54),
                     new Date(2007, 5, 27, 7, 23, 54)]);
	assertFailure(assertionsModule.equals,
                 [new Date(2008, 5, 27, 7, 23, 54),
                  new Date(2007, 5, 27, 7, 23, 54),
                  message]);

	assertSuccess(assertionsModule.equals,
                    [{my: 1, name: "is", Nakano: "NO!"},
                     {my: "1", name: "is", Nakano: "NO!"}]);
	assertFailure(assertionsModule.equals,
                 [{my: 1, name: "is", Nakano: "NO!"},
                  {my: 9, name: "is", Nakano: "NO!"},
                  message]);
	assertFailure(assertionsModule.equals,
                 [{my: 1, name: "is", Nakano: "NO!"},
                  {my: 1, name: "is", Nakano: "NO!", additional: 0},
                  message]);
	assertFailure(assertionsModule.equals,
                 [{my: 1, name: "is", Nakano: "NO!", additional: 0},
                  {my: 1, name: "is", Nakano: "NO!"},
                  message]);

	var node = document.createElement('box');
	assertSuccess(assertionsModule.equals,
                    [node,
                     node]);
	assertFailure(assertionsModule.equals,
                 [node,
                  document.createElement('box'),
                  message]);


	assertSuccess(assertionsModule.notEquals, [0, 1]);
	assertFailure(assertionsModule.notEquals, [1, 1, message]);
	assertSuccess(assertionsModule.notEqual, [0, 1]);
	assertFailure(assertionsModule.notEqual, [1, 1, message]);

	assert.equal(8, assertionsModule.successCount);
}

function testStrictlyEquals()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.strictlyEquals, [1, 1]);
	assertFailure(assertionsModule.strictlyEquals, [0, 1, message]);

	assertSuccess(assertionsModule.strictlyEquals, [[1, "2", true],
                                                      [1, "2", true]]);
	assertFailure(assertionsModule.strictlyEquals, [[1, 2, false],
                                                   [1, "2", false],
                                                   message]);

	assertSuccess(assertionsModule.strictlyEquals,
                    [new Date(2007, 5, 27, 7, 23, 54),
                     new Date(2007, 5, 27, 7, 23, 54)]);
	assertFailure(assertionsModule.strictlyEquals,
                 [new Date(2008, 5, 27, 7, 23, 54),
                  new Date(2007, 5, 27, 7, 23, 54),
                  message]);

	assertSuccess(assertionsModule.strictlyEquals,
                    [{my: 1, name: "is", Nakano: "NO!"},
                     {my: 1, name: "is", Nakano: "NO!"}]);
	assertFailure(assertionsModule.strictlyEquals,
                 [{my: 1, name: "is", Nakano: "NO!"},
                  {my: "1", name: "is", Nakano: "NO!"},
                  message]);
	assertFailure(assertionsModule.strictlyEquals,
                 [{my: 1, name: "is", Nakano: "NO!", additional: 0},
                  {my: 1, name: "is", Nakano: "NO!"},
                  message]);

	assert.equal(4, assertionsModule.successCount);
}

function testContainsString()
{
	var message = Math.random() * 65000;
	assertSuccess(assertionsModule.contains,
                    ['text', 'long text']);
	assertFailure(assertionsModule.contains,
                 ['outside', 'long text', message]);
	assertFailure(assertionsModule.notContains,
                 ['text', 'long text', message]);
	assertSuccess(assertionsModule.notContains,
                    ['outside', 'long text']);
	assert.equal(2, assertionsModule.successCount);
}

function testContainsArray()
{
	var message = Math.random() * 65000;
	var item = { value : true };
	var array = ['string', 29, true, item];
	assertSuccess(assertionsModule.contains,
                    ['string', array]);
	assertSuccess(assertionsModule.contains,
                    [29, array]);
	assertSuccess(assertionsModule.contains,
                    [true, array]);
	assertSuccess(assertionsModule.contains,
                    [item, array]);
	assertFailure(assertionsModule.contains,
                 ['outside', array, message]);
	assertFailure(assertionsModule.notContains,
                 ['string', array, message]);
	assertFailure(assertionsModule.notContains,
                 [29, array, message]);
	assertFailure(assertionsModule.notContains,
                 [true, array, message]);
	assertFailure(assertionsModule.notContains,
                 [item, array, message]);
	assertSuccess(assertionsModule.notContains,
                    ['outside', array]);
	assert.equal(5, assertionsModule.successCount);
}

function testContainsRange()
{
	var message = Math.random() * 65000;

	yield Do(utils.loadURI('../../fixtures/links.html'));

	function $(aId)
	{
		return content.document.getElementById(aId);
	}

	var range = content.document.createRange();
	range.setStartBefore($('item4'));
	range.setEndAfter($('item9'));

	assertSuccess(assertionsModule.contains,
                    [$('link5'), range]);
	assertFailure(assertionsModule.contains,
                 [$('link10'), range, message]);
	assertFailure(assertionsModule.notContains,
                 [$('link5'), range, message]);
	assertSuccess(assertionsModule.notContains,
                    [$('link10'), range]);

	assertSuccess(assertionsModule.contains,
                    ['リンク5', range]);
	assertFailure(assertionsModule.contains,
                 ['リンク10', range, message]);
	assertFailure(assertionsModule.notContains,
                 ['リンク5', range, message]);
	assertSuccess(assertionsModule.notContains,
                    ['リンク10', range]);

	var targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                    [targetRange, range]);
	assertFailure(assertionsModule.notContains,
                 [targetRange, range, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailure(assertionsModule.contains,
                 [targetRange, range, message]);
	assertSuccess(assertionsModule.notContains,
                    [targetRange, range]);

	range.detach();
	targetRange.detach();

	assert.equal(6, assertionsModule.successCount);
}

function testContainsSelection()
{
	var message = Math.random() * 65000;

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

	assertSuccess(assertionsModule.contains,
                    [$('link5'), selection]);
	assertFailure(assertionsModule.contains,
                 [$('link10'), selection, message]);
	assertSuccess(assertionsModule.contains,
                    [$('link13'), selection]);
	assertFailure(assertionsModule.notContains,
                 [$('link5'), selection, message]);
	assertSuccess(assertionsModule.notContains,
                    [$('link10'), selection]);
	assertFailure(assertionsModule.notContains,
                 [$('link13'), selection, message]);

	assertSuccess(assertionsModule.contains,
                    ['リンク5', selection]);
	assertFailure(assertionsModule.contains,
                 ['リンク10', selection, message]);
	assertSuccess(assertionsModule.contains,
                    ['リンク13', selection]);
	assertFailure(assertionsModule.notContains,
                 ['リンク5', selection, message]);
	assertSuccess(assertionsModule.notContains,
                    ['リンク10', selection]);
	assertFailure(assertionsModule.notContains,
                 ['リンク13', selection, message]);

	var targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                    [targetRange, selection]);
	assertFailure(assertionsModule.notContains,
                 [targetRange, selection, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailure(assertionsModule.contains,
                 [targetRange, selection, message]);
	assertSuccess(assertionsModule.notContains,
                    [targetRange, selection]);
	targetRange.selectNode($('em13'));
	targetRange.setEnd($('em13').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                    [targetRange, selection]);
	assertFailure(assertionsModule.notContains,
                 [targetRange, selection, message]);

	targetRange.detach();
	selection.removeAllRanges();

	assert.equal(9, assertionsModule.successCount);
}

function testContainsDOMNodeTree()
{
	var message = Math.random() * 65000;

	var root = $('item5');

	assertSuccess(assertionsModule.contains,
                    [$('link5'), root]);
	assertFailure(assertionsModule.contains,
                 [$('link10'), root, message]);
	assertFailure(assertionsModule.notContains,
                 [$('link5'), root, message]);
	assertSuccess(assertionsModule.notContains,
                    [$('link10'), root]);

	assertSuccess(assertionsModule.contains,
                    ['リンク5', root]);
	assertFailure(assertionsModule.contains,
                 ['リンク10', root, message]);
	assertFailure(assertionsModule.notContains,
                 ['リンク5', root, message]);
	assertSuccess(assertionsModule.notContains,
                    ['リンク10', root]);

	var targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                    [targetRange, root]);
	assertFailure(assertionsModule.notContains,
                 [targetRange, root, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailure(assertionsModule.contains,
                 [targetRange, root, message]);
	assertSuccess(assertionsModule.notContains,
                    [targetRange, root]);

	targetRange.detach();

	assert.equal(6, assertionsModule.successCount);
}

function testBoolean()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.isTrue, [true]);
	assertSuccess(assertionsModule.isTrue, [{}]);
	assertFailure(assertionsModule.isTrue, [false, message]);
	assertFailure(assertionsModule.isTrue, [0, message]);
	assertFailure(assertionsModule.isTrue, ['', message]);
	assertFailure(assertionsModule.isTrue, [null, message]);

	assertSuccess(assertionsModule.isFalse, [false]);
	assertSuccess(assertionsModule.isFalse, [0]);
	assertSuccess(assertionsModule.isFalse, ['']);
	assertSuccess(assertionsModule.isFalse, [null]);
	assertFailure(assertionsModule.isFalse, [true, message]);
	assertFailure(assertionsModule.isFalse, [{}, message]);

	assert.equal(6, assertionsModule.successCount);
}

function testType()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.isBoolean, [true]);
	assertFailure(assertionsModule.isBoolean, ['true', message]);

	assertSuccess(assertionsModule.isNotBoolean, ['true']);
	assertFailure(assertionsModule.isNotBoolean, [true, message]);

	assertSuccess(assertionsModule.isString, ['1']);
	assertFailure(assertionsModule.isString, [1, message]);

	assertSuccess(assertionsModule.isNotString, [1]);
	assertFailure(assertionsModule.isNotString, ['1', message]);

	assertSuccess(assertionsModule.isNumber, [0]);
	assertFailure(assertionsModule.isNumber, ['0', message]);

	assertSuccess(assertionsModule.isNotNumber, ['0']);
	assertFailure(assertionsModule.isNotNumber, [0, message]);

	assertSuccess(assertionsModule.isFunction, [(function() {})]);
	assertSuccess(assertionsModule.isFunction, [(new Function('foo', 'return foo'))]);
	assertFailure(assertionsModule.isFunction, [true, message]);
	assertFailure(assertionsModule.isFunction, [false, message]);
	assertFailure(assertionsModule.isFunction, [0, message]);
	assertFailure(assertionsModule.isFunction, ['func', message]);
	assertFailure(assertionsModule.isFunction, [null, message]);

	assertSuccess(assertionsModule.isNotFunction, [true]);
	assertSuccess(assertionsModule.isNotFunction, [false]);
	assertSuccess(assertionsModule.isNotFunction, [0]);
	assertSuccess(assertionsModule.isNotFunction, ['func']);
	assertSuccess(assertionsModule.isNotFunction, [null]);
	assertFailure(assertionsModule.isNotFunction, [(function() {}), message]);
	assertFailure(assertionsModule.isNotFunction, [(new Function('foo', 'return foo')), message]);

	assert.equal(13, assertionsModule.successCount);
}

function testNullAndUndefined()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.isDefined, [true]);
	assertSuccess(assertionsModule.isDefined, [false]);
	assertSuccess(assertionsModule.isDefined, [0]);
	assertSuccess(assertionsModule.isDefined, ['']);
	assertSuccess(assertionsModule.isDefined, [null]);
	assertFailure(assertionsModule.isDefined, [void(0), message]);

	assertSuccess(assertionsModule.isUndefined, [void(0)]);
	assertFailure(assertionsModule.isUndefined, [true, message]);
	assertFailure(assertionsModule.isUndefined, [false, message]);
	assertFailure(assertionsModule.isUndefined, [0, message]);
	assertFailure(assertionsModule.isUndefined, ['', message]);
	assertFailure(assertionsModule.isUndefined, [null, message]);

	assertSuccess(assertionsModule.isNull, [null]);
	assertFailure(assertionsModule.isNull, [true, message]);
	assertFailure(assertionsModule.isNull, [false, message]);
	assertFailure(assertionsModule.isNull, [0, message]);
	assertFailure(assertionsModule.isNull, ['', message]);
	assertFailure(assertionsModule.isNull, [void(0), message]);

	assertSuccess(assertionsModule.isNotNull, [true]);
	assertSuccess(assertionsModule.isNotNull, [false]);
	assertSuccess(assertionsModule.isNotNull, [0]);
	assertSuccess(assertionsModule.isNotNull, ['']);
	assertSuccess(assertionsModule.isNotNull, [void(0)]);
	assertFailure(assertionsModule.isNotNull, [null, message]);

	assert.equal(12, assertionsModule.successCount);
}

function testRegExp()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.matches,
		[/te[sx]t/, 'test']
	);
	assertFailure(assertionsModule.matches,
		[/te[sx]t/, 'tent', message]
	);
	assertSuccess(assertionsModule.match,
		[/te[sx]t/, 'test']
	);
	assertFailure(assertionsModule.match,
		[/te[sx]t/, 'tent', message]
	);

	assertSuccess(assertionsModule.notMatches,
		[/te[sx]t/, 'tent']
	);
	assertFailure(assertionsModule.notMatches,
		[/te[sx]t/, 'test', message]
	);
	assertSuccess(assertionsModule.notMatch,
		[/te[sx]t/, 'tent']
	);
	assertFailure(assertionsModule.notMatch,
		[/te[sx]t/, 'test', message]
	);

	assertSuccess(assertionsModule.pattern,
		['test', /te[sx]t/]
	);
	assertFailure(assertionsModule.pattern,
		['tent', /te[sx]t/, message]
	);

	assertSuccess(assertionsModule.notPattern,
		['tent', /te[sx]t/]
	);
	assertFailure(assertionsModule.notPattern,
		['test', /te[sx]t/, message]
	);

	assert.equal(6, assertionsModule.successCount);
}

function testArray()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.arrayEquals,
		[[0, 1, 2], [0, 1, 2]]
	);
	assertFailure(assertionsModule.arrayEquals,
		[[0, 1, 2], [3, 4, 5], message]
	);
	assertSuccess(assertionsModule.arrayEqual,
		[[0, 1, 2], [0, 1, 2]]
	);
	assertFailure(assertionsModule.arrayEqual,
		[[0, 1, 2], [3, 4, 5], message]
	);

	assert.equal(2, assertionsModule.successCount);
}

function testRaises()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.raises,
		['test', function() { throw 'test'; }, {}]
	);
	assertFailure(assertionsModule.raises,
		['test', function() { return true; }, {}, message]
	);
	assertSuccess(assertionsModule.raise,
		['test', function() { throw 'test'; }, {}]
	);
	assertFailure(assertionsModule.raise,
		['test', function() { return true; }, {}, message]
	);

	assertSuccess(assertionsModule.notRaises,
		['test', function() { return true; }, {}]
	);
	assertSuccess(assertionsModule.notRaises,
		['test', function() { throw 'unknown'; }, {}]
	);
	assertFailure(assertionsModule.notRaises,
		['test', function() { throw 'test'; }, {}, message]
	);
	assertSuccess(assertionsModule.notRaise,
		['test', function() { return true; }, {}]
	);
	assertSuccess(assertionsModule.notRaise,
		['test', function() { throw 'unknown'; }, {}]
	);
	assertFailure(assertionsModule.notRaise,
		['test', function() { throw 'test'; }, {}, message]
	);

	assert.equal(6, assertionsModule.successCount);
}

var inDeltaListener;
testInDelta.setUp = function()
{
	inDeltaListener = {
		onAssertionWarning : function(aEvent)
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

	assertSuccess(assertionsModule.inDelta, [1.0, 1.1, 0.11]);
	assert.equals(0, inDeltaListener.events.length);
	assertSuccess(assertionsModule.inDelta, [1.0, 1.1, 0.1]);
	assert.equals(1, inDeltaListener.events.length);
	assertFailure(assertionsModule.inDelta, [1.0, 1.2, 0.1, message]);
	assert.equals(1, inDeltaListener.events.length);

	assertSuccess(assertionsModule.inDelta, [1.0, 0.9, 0.11]);
	assert.equals(1, inDeltaListener.events.length);
	assertSuccess(assertionsModule.inDelta, [1.0, 0.9, 0.1]);
	assert.equals(2, inDeltaListener.events.length);
	assertFailure(assertionsModule.inDelta, [1.0, 0.8, 0.1, message]);
	assert.equals(2, inDeltaListener.events.length);

	assert.equal(4, assertionsModule.successCount);
}

function testCompare()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.compare, [10, '<', 20]);
	assertFailure(assertionsModule.compare, [10, '<', 5, message]);
	assertFailure(assertionsModule.compare, [10, '<', 10, message]);

	assertSuccess(assertionsModule.compare, [10, '<=', 20]);
	assertFailure(assertionsModule.compare, [10, '<=', 5, message]);
	assertSuccess(assertionsModule.compare, [10, '<=', 10]);
	assertSuccess(assertionsModule.compare, [10, '=<', 20]);
	assertFailure(assertionsModule.compare, [10, '=<', 5, message]);
	assertSuccess(assertionsModule.compare, [10, '=<', 10]);

	assertSuccess(assertionsModule.compare, [10, '>', 5]);
	assertFailure(assertionsModule.compare, [10, '>', 20, message]);
	assertFailure(assertionsModule.compare, [10, '>', 10, message]);

	assertSuccess(assertionsModule.compare, [10, '>=', 5]);
	assertFailure(assertionsModule.compare, [10, '>=', 20, message]);
	assertSuccess(assertionsModule.compare, [10, '>=', 10]);
	assertSuccess(assertionsModule.compare, [10, '=>', 5]);
	assertFailure(assertionsModule.compare, [10, '=>', 20, message]);
	assertSuccess(assertionsModule.compare, [10, '=>', 10]);

	assert.equal(10, assertionsModule.successCount);
}

function testFinishesWithin()
{
	var message = Math.random() * 65000;

	assertSuccess(
		assertionsModule.finishesWithin,
		[
			1000,
			function() {
				assert.isTrue(true);
			},
			{}
		]
	);
	assertFailure(
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
	assertFailure(
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

	assert.equal(2, assertionsModule.successCount);
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

function testSuccessCount()
{
	assert.equals(0, assertionsModule.successCount);
	assertionsModule.isTrue(true);
	assertionsModule.isTrue(true);
	assertionsModule.isTrue(true);
	assert.equals(3, assertionsModule.successCount);
	assertionsModule.resetSuccessCount();
	assert.equals(0, assertionsModule.successCount);
}

function testAssertValidSuccessCount()
{
	assertionsModule.isTrue(true);
	assertionsModule.isTrue(true);
	assert.equals(2, assertionsModule.successCount);

	function assertAssertValidSuccessCountSucceeded(aExpected, aMin, aMax)
	{
		assert.notRaises(
			'AssertionFailed',
			function() {
				assertionsModule.validSuccessCount(aExpected, aMin, aMax);
			},
			null
		);
	}
	function assertAssertValidSuccessCountFailed(aExpected, aMin, aMax)
	{
		assert.raises(
			'AssertionFailed',
			function() {
				assertionsModule.validSuccessCount(aExpected, aMin, aMax);
			},
			null
		);
	}

	assertAssertValidSuccessCountSucceeded(-1, -1, -1);

	// expected
	assertAssertValidSuccessCountFailed(1, -1, -1);
	assertAssertValidSuccessCountSucceeded(2, -1, -1);
	assertAssertValidSuccessCountFailed(3, -1, -1);

	// min
	assertAssertValidSuccessCountSucceeded(-1, 1, -1);
	assertAssertValidSuccessCountSucceeded(-1, 2, -1);
	assertAssertValidSuccessCountFailed(-1, 3, -1);

	// max
	assertAssertValidSuccessCountFailed(-1, -1, 1);
	assertAssertValidSuccessCountSucceeded(-1, -1, 2);
	assertAssertValidSuccessCountSucceeded(-1, -1, 3);
}
