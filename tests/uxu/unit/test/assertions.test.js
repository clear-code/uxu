// -*- indent-tabs-mode: t; tab-width: 4 -*-

var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var Assertions = test_module.require('class', 'assertions');

var assertionsModule;
var diff;

function setUp()
{
	assertionsModule = new Assertions(utils);
	diff = {};
	utils.include(topDir+'content/uxu/lib/diff.js', diff);
}

function tearDown()
{
}

assert.assertSucceed = function(aAssertion, aArgs)
{
	assert.notRaises(
		'AssertionFailed',
		function() {
			aAssertion.apply(assertionsModule, aArgs);
		},
		null
	);
}

assert.assertFailed = function(aAssertion, aArgs)
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

	assert.assertSucceed(assertionsModule.equals, [1, 1]);
	assert.assertFailed(assertionsModule.equals, [0, 1, message]);

	assert.assertSucceed(assertionsModule.equals, [[1, "2", true],
                                                       [1, "2", true]]);
	assert.assertSucceed(assertionsModule.equals, [[1, 2, false],
                                                       [1, "2", false]]);

	assert.assertSucceed(assertionsModule.equals,
                             [new Date(2007, 5, 27, 7, 23, 54),
                              new Date(2007, 5, 27, 7, 23, 54)]);
	assert.assertFailed(assertionsModule.equals,
                            [new Date(2008, 5, 27, 7, 23, 54),
                             new Date(2007, 5, 27, 7, 23, 54),
                             message]);

	assert.assertSucceed(assertionsModule.equals,
                             [{my: 1, name: "is", Nakano: "NO!"},
                              {my: "1", name: "is", Nakano: "NO!"}]);
	assert.assertFailed(assertionsModule.equals,
                            [{my: 1, name: "is", Nakano: "NO!"},
                             {my: 9, name: "is", Nakano: "NO!"},
                             message]);
	assert.assertFailed(assertionsModule.equals,
                            [{my: 1, name: "is", Nakano: "NO!"},
                             {my: 1, name: "is", Nakano: "NO!", additional: 0},
                             message]);
	assert.assertFailed(assertionsModule.equals,
                            [{my: 1, name: "is", Nakano: "NO!", additional: 0},
                             {my: 1, name: "is", Nakano: "NO!"},
                             message]);

	var node = document.createElement('box');
	assert.assertSucceed(assertionsModule.equals,
                             [node,
                              node]);
	assert.assertFailed(assertionsModule.equals,
                             [node,
                              document.createElement('box'),
                              message]);


	assert.assertSucceed(assertionsModule.notEquals, [0, 1]);
	assert.assertFailed(assertionsModule.notEquals, [1, 1, message]);
	assert.assertSucceed(assertionsModule.notEqual, [0, 1]);
	assert.assertFailed(assertionsModule.notEqual, [1, 1, message]);
}

function testStrictlyEquals()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.strictlyEquals, [1, 1]);
	assert.assertFailed(assertionsModule.strictlyEquals, [0, 1, message]);

	assert.assertSucceed(assertionsModule.strictlyEquals, [[1, "2", true],
                                                               [1, "2", true]]);
	assert.assertFailed(assertionsModule.strictlyEquals, [[1, 2, false],
                                                              [1, "2", false],
                                                              message]);

	assert.assertSucceed(assertionsModule.strictlyEquals,
                             [new Date(2007, 5, 27, 7, 23, 54),
                              new Date(2007, 5, 27, 7, 23, 54)]);
	assert.assertFailed(assertionsModule.strictlyEquals,
                            [new Date(2008, 5, 27, 7, 23, 54),
                             new Date(2007, 5, 27, 7, 23, 54),
                             message]);

	assert.assertSucceed(assertionsModule.strictlyEquals,
                             [{my: 1, name: "is", Nakano: "NO!"},
                              {my: 1, name: "is", Nakano: "NO!"}]);
	assert.assertFailed(assertionsModule.strictlyEquals,
                            [{my: 1, name: "is", Nakano: "NO!"},
                             {my: "1", name: "is", Nakano: "NO!"},
                             message]);
	assert.assertFailed(assertionsModule.strictlyEquals,
                            [{my: 1, name: "is", Nakano: "NO!", additional: 0},
                             {my: 1, name: "is", Nakano: "NO!"},
                             message]);
}

function testContains()
{
	var message = Math.random() * 65000;

	// simple string
	assert.assertSucceed(assertionsModule.contains,
                         ['text', 'long text']);
	assert.assertFailed(assertionsModule.contains,
                        ['outside', 'long text', message]);
	assert.assertFailed(assertionsModule.notContains,
                        ['text', 'long text', message]);
	assert.assertSucceed(assertionsModule.notContains,
                         ['outside', 'long text']);

	// array
	var item = { value : true };
	var array = ['string', 29, true, item];
	assert.assertSucceed(assertionsModule.contains,
                         ['string', array]);
	assert.assertSucceed(assertionsModule.contains,
                         [29, array]);
	assert.assertSucceed(assertionsModule.contains,
                         [true, array]);
	assert.assertSucceed(assertionsModule.contains,
                         [item, array]);
	assert.assertFailed(assertionsModule.contains,
                        ['outside', array, message]);
	assert.assertFailed(assertionsModule.notContains,
                         ['string', array, message]);
	assert.assertFailed(assertionsModule.notContains,
                         [29, array, message]);
	assert.assertFailed(assertionsModule.notContains,
                         [true, array, message]);
	assert.assertFailed(assertionsModule.notContains,
                         [item, array, message]);
	assert.assertSucceed(assertionsModule.notContains,
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

	assert.assertSucceed(assertionsModule.contains,
                         [$('link5'), range]);
	assert.assertFailed(assertionsModule.contains,
                        [$('link10'), range, message]);
	assert.assertFailed(assertionsModule.notContains,
                        [$('link5'), range, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         [$('link10'), range]);

	assert.assertSucceed(assertionsModule.contains,
                         ['リンク5', range]);
	assert.assertFailed(assertionsModule.contains,
                        ['リンク10', range, message]);
	assert.assertFailed(assertionsModule.notContains,
                        ['リンク5', range, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         ['リンク10', range]);

	targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assert.assertSucceed(assertionsModule.contains,
                         [targetRange, range]);
	assert.assertFailed(assertionsModule.notContains,
                        [targetRange, range, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.assertFailed(assertionsModule.contains,
                        [targetRange, range, message]);
	assert.assertSucceed(assertionsModule.notContains,
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

	assert.assertSucceed(assertionsModule.contains,
                         [$('link5'), selection]);
	assert.assertFailed(assertionsModule.contains,
                        [$('link10'), selection, message]);
	assert.assertSucceed(assertionsModule.contains,
                         [$('link13'), selection]);
	assert.assertFailed(assertionsModule.notContains,
                        [$('link5'), selection, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         [$('link10'), selection]);
	assert.assertFailed(assertionsModule.notContains,
                        [$('link13'), selection, message]);

	assert.assertSucceed(assertionsModule.contains,
                         ['リンク5', selection]);
	assert.assertFailed(assertionsModule.contains,
                        ['リンク10', selection, message]);
	assert.assertSucceed(assertionsModule.contains,
                         ['リンク13', selection]);
	assert.assertFailed(assertionsModule.notContains,
                        ['リンク5', selection, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         ['リンク10', selection]);
	assert.assertFailed(assertionsModule.notContains,
                        ['リンク13', selection, message]);

	targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assert.assertSucceed(assertionsModule.contains,
                         [targetRange, selection]);
	assert.assertFailed(assertionsModule.notContains,
                        [targetRange, selection, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.assertFailed(assertionsModule.contains,
                        [targetRange, selection, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         [targetRange, selection]);
	targetRange.selectNode($('em13'));
	targetRange.setEnd($('em13').lastChild, 3);
	assert.assertSucceed(assertionsModule.contains,
                         [targetRange, selection]);
	assert.assertFailed(assertionsModule.notContains,
                        [targetRange, selection, message]);

	targetRange.detach();
	selection.removeAllRanges();

	// sub tree
	var root = $('item5');

	assert.assertSucceed(assertionsModule.contains,
                         [$('link5'), root]);
	assert.assertFailed(assertionsModule.contains,
                        [$('link10'), root, message]);
	assert.assertFailed(assertionsModule.notContains,
                        [$('link5'), root, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         [$('link10'), root]);

	assert.assertSucceed(assertionsModule.contains,
                         ['リンク5', root]);
	assert.assertFailed(assertionsModule.contains,
                        ['リンク10', root, message]);
	assert.assertFailed(assertionsModule.notContains,
                        ['リンク5', root, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         ['リンク10', root]);

	targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assert.assertSucceed(assertionsModule.contains,
                         [targetRange, root]);
	assert.assertFailed(assertionsModule.notContains,
                        [targetRange, root, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.assertFailed(assertionsModule.contains,
                        [targetRange, root, message]);
	assert.assertSucceed(assertionsModule.notContains,
                         [targetRange, root]);

	targetRange.detach();
}

function testBoolean()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.isTrue, [true]);
	assert.assertSucceed(assertionsModule.isTrue, [{}]);
	assert.assertFailed(assertionsModule.isTrue, [false, message]);
	assert.assertFailed(assertionsModule.isTrue, [0, message]);
	assert.assertFailed(assertionsModule.isTrue, ['', message]);
	assert.assertFailed(assertionsModule.isTrue, [null, message]);

	assert.assertSucceed(assertionsModule.isFalse, [false]);
	assert.assertSucceed(assertionsModule.isFalse, [0]);
	assert.assertSucceed(assertionsModule.isFalse, ['']);
	assert.assertSucceed(assertionsModule.isFalse, [null]);
	assert.assertFailed(assertionsModule.isFalse, [true, message]);
	assert.assertFailed(assertionsModule.isFalse, [{}, message]);
}

function testType()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.isBoolean, [true]);
	assert.assertFailed(assertionsModule.isBoolean, ['true', message]);

	assert.assertSucceed(assertionsModule.isNotBoolean, ['true']);
	assert.assertFailed(assertionsModule.isNotBoolean, [true, message]);

	assert.assertSucceed(assertionsModule.isString, ['1']);
	assert.assertFailed(assertionsModule.isString, [1, message]);

	assert.assertSucceed(assertionsModule.isNotString, [1]);
	assert.assertFailed(assertionsModule.isNotString, ['1', message]);

	assert.assertSucceed(assertionsModule.isNumber, [0]);
	assert.assertFailed(assertionsModule.isNumber, ['0', message]);

	assert.assertSucceed(assertionsModule.isNotNumber, ['0']);
	assert.assertFailed(assertionsModule.isNotNumber, [0, message]);

	assert.assertSucceed(assertionsModule.isFunction, [(function() {})]);
	assert.assertSucceed(assertionsModule.isFunction, [(new Function('foo', 'return foo'))]);
	assert.assertFailed(assertionsModule.isFunction, [true, message]);
	assert.assertFailed(assertionsModule.isFunction, [false, message]);
	assert.assertFailed(assertionsModule.isFunction, [0, message]);
	assert.assertFailed(assertionsModule.isFunction, ['func', message]);
	assert.assertFailed(assertionsModule.isFunction, [null, message]);

	assert.assertSucceed(assertionsModule.isNotFunction, [true]);
	assert.assertSucceed(assertionsModule.isNotFunction, [false]);
	assert.assertSucceed(assertionsModule.isNotFunction, [0]);
	assert.assertSucceed(assertionsModule.isNotFunction, ['func']);
	assert.assertSucceed(assertionsModule.isNotFunction, [null]);
	assert.assertFailed(assertionsModule.isNotFunction, [(function() {}), message]);
	assert.assertFailed(assertionsModule.isNotFunction, [(new Function('foo', 'return foo')), message]);
}

function testNullAndUndefined()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.isDefined, [true]);
	assert.assertSucceed(assertionsModule.isDefined, [false]);
	assert.assertSucceed(assertionsModule.isDefined, [0]);
	assert.assertSucceed(assertionsModule.isDefined, ['']);
	assert.assertSucceed(assertionsModule.isDefined, [null]);
	assert.assertFailed(assertionsModule.isDefined, [void(0), message]);

	assert.assertSucceed(assertionsModule.isUndefined, [void(0)]);
	assert.assertFailed(assertionsModule.isUndefined, [true, message]);
	assert.assertFailed(assertionsModule.isUndefined, [false, message]);
	assert.assertFailed(assertionsModule.isUndefined, [0, message]);
	assert.assertFailed(assertionsModule.isUndefined, ['', message]);
	assert.assertFailed(assertionsModule.isUndefined, [null, message]);

	assert.assertSucceed(assertionsModule.isNull, [null]);
	assert.assertFailed(assertionsModule.isNull, [true, message]);
	assert.assertFailed(assertionsModule.isNull, [false, message]);
	assert.assertFailed(assertionsModule.isNull, [0, message]);
	assert.assertFailed(assertionsModule.isNull, ['', message]);
	assert.assertFailed(assertionsModule.isNull, [void(0), message]);

	assert.assertSucceed(assertionsModule.isNotNull, [true]);
	assert.assertSucceed(assertionsModule.isNotNull, [false]);
	assert.assertSucceed(assertionsModule.isNotNull, [0]);
	assert.assertSucceed(assertionsModule.isNotNull, ['']);
	assert.assertSucceed(assertionsModule.isNotNull, [void(0)]);
	assert.assertFailed(assertionsModule.isNotNull, [null, message]);
}

function testRegExp()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.matches,
		[/te[sx]t/, 'test']
	);
	assert.assertFailed(assertionsModule.matches,
		[/te[sx]t/, 'tent', message]
	);
	assert.assertSucceed(assertionsModule.match,
		[/te[sx]t/, 'test']
	);
	assert.assertFailed(assertionsModule.match,
		[/te[sx]t/, 'tent', message]
	);

	assert.assertSucceed(assertionsModule.notMatches,
		[/te[sx]t/, 'tent']
	);
	assert.assertFailed(assertionsModule.notMatches,
		[/te[sx]t/, 'test', message]
	);
	assert.assertSucceed(assertionsModule.notMatch,
		[/te[sx]t/, 'tent']
	);
	assert.assertFailed(assertionsModule.notMatch,
		[/te[sx]t/, 'test', message]
	);

	assert.assertSucceed(assertionsModule.pattern,
		['test', /te[sx]t/]
	);
	assert.assertFailed(assertionsModule.pattern,
		['tent', /te[sx]t/, message]
	);

	assert.assertSucceed(assertionsModule.notPattern,
		['tent', /te[sx]t/]
	);
	assert.assertFailed(assertionsModule.notPattern,
		['test', /te[sx]t/, message]
	);
}

function testArray()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.arrayEquals,
		[[0, 1, 2], [0, 1, 2]]
	);
	assert.assertFailed(assertionsModule.arrayEquals,
		[[0, 1, 2], [3, 4, 5], message]
	);
	assert.assertSucceed(assertionsModule.arrayEqual,
		[[0, 1, 2], [0, 1, 2]]
	);
	assert.assertFailed(assertionsModule.arrayEqual,
		[[0, 1, 2], [3, 4, 5], message]
	);
}

function testRaises()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.raises,
		['test', function() { throw 'test'; }, {}]
	);
	assert.assertFailed(assertionsModule.raises,
		['test', function() { return true; }, {}, message]
	);
	assert.assertSucceed(assertionsModule.raise,
		['test', function() { throw 'test'; }, {}]
	);
	assert.assertFailed(assertionsModule.raise,
		['test', function() { return true; }, {}, message]
	);

	assert.assertSucceed(assertionsModule.notRaises,
		['test', function() { return true; }, {}]
	);
	assert.assertSucceed(assertionsModule.notRaises,
		['test', function() { throw 'unknown'; }, {}]
	);
	assert.assertFailed(assertionsModule.notRaises,
		['test', function() { throw 'test'; }, {}, message]
	);
	assert.assertSucceed(assertionsModule.notRaise,
		['test', function() { return true; }, {}]
	);
	assert.assertSucceed(assertionsModule.notRaise,
		['test', function() { throw 'unknown'; }, {}]
	);
	assert.assertFailed(assertionsModule.notRaise,
		['test', function() { throw 'test'; }, {}, message]
	);
}

function testInDelta()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.inDelta, [1.0, 1.1, 0.11]);
	assert.assertSucceed(assertionsModule.inDelta, [1.0, 1.1, 0.1]);
	assert.assertFailed(assertionsModule.inDelta, [1.0, 1.2, 0.1, message]);

	assert.assertSucceed(assertionsModule.inDelta, [1.0, 0.9, 0.11]);
	assert.assertSucceed(assertionsModule.inDelta, [1.0, 0.9, 0.1]);
	assert.assertFailed(assertionsModule.inDelta, [1.0, 0.8, 0.1, message]);
}

function testCompare()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.compare, [10, '<', 20]);
	assert.assertFailed(assertionsModule.compare, [10, '<', 5, message]);
	assert.assertFailed(assertionsModule.compare, [10, '<', 10, message]);

	assert.assertSucceed(assertionsModule.compare, [10, '<=', 20]);
	assert.assertFailed(assertionsModule.compare, [10, '<=', 5, message]);
	assert.assertSucceed(assertionsModule.compare, [10, '<=', 10]);
	assert.assertSucceed(assertionsModule.compare, [10, '=<', 20]);
	assert.assertFailed(assertionsModule.compare, [10, '=<', 5, message]);
	assert.assertSucceed(assertionsModule.compare, [10, '=<', 10]);

	assert.assertSucceed(assertionsModule.compare, [10, '>', 5]);
	assert.assertFailed(assertionsModule.compare, [10, '>', 20, message]);
	assert.assertFailed(assertionsModule.compare, [10, '>', 10, message]);

	assert.assertSucceed(assertionsModule.compare, [10, '>=', 5]);
	assert.assertFailed(assertionsModule.compare, [10, '>=', 20, message]);
	assert.assertSucceed(assertionsModule.compare, [10, '>=', 10]);
	assert.assertSucceed(assertionsModule.compare, [10, '=>', 5]);
	assert.assertFailed(assertionsModule.compare, [10, '=>', 20, message]);
	assert.assertSucceed(assertionsModule.compare, [10, '=>', 10]);
}

function testFinishesWithin()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(
		assertionsModule.finishesWithin,
		[
			1000,
			function() {
				assert.isTrue(true);
			},
			{}
		]
	);
	assert.assertFailed(
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
	assert.assertFailed(
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
			yield 100;
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
