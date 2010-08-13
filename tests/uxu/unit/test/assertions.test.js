// -*- indent-tabs-mode: t; tab-width: 4 -*-

var topDir = baseURL+'../../../../';

var Assertions = utils.import(topDir+'modules/test/assertions.js', {}).Assertions;
var Diff = utils.import(topDir+'modules/diff.js', {}).Diff;

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

var assertionsModule;

function setUp()
{
	assertionsModule = new Assertions();
}

function tearDown()
{
}

function assertSuccess(aAssertion, aArgs, aAssertionsCount)
{
	var beforeCount = assertionsModule.successCount;
	assert.notRaises(
		'AssertionFailed',
		function() {
			aAssertion.apply(assertionsModule, aArgs);
		},
		null
	);
	assert.equals(
		beforeCount+(aAssertionsCount === void(0) ? 1 : aAssertionsCount ),
		assertionsModule.successCount
	);
}

function assertFailure(aAssertion, aArgs, aAssertionsCount)
{
	var beforeCount = assertionsModule.successCount;
	var exception;
	assert.raises(
		'AssertionFailed',
		function() {
			try {
				aAssertion.apply(assertionsModule, aArgs);
			}
			catch(e) {
				exception = e;
				throw e;
			}
		},
		null
	);
	assert.notEquals(-1, exception.message.indexOf(aArgs[aArgs.length-1]));
	assert.equals(
		beforeCount+(aAssertionsCount === void(0) ? 0 : aAssertionsCount ),
		assertionsModule.successCount
	);
}

function assertError(aAssertion, aArgs, aError, aAssertionsCount)
{
	var beforeCount = assertionsModule.successCount;
	assert.raises(
		aError,
		function() {
			aAssertion.apply(assertionsModule, aArgs);
		},
		null
	);
	assert.equals(
		beforeCount+(aAssertionsCount === void(0) ? 0 : aAssertionsCount ),
		assertionsModule.successCount
	);
}

function assertSuccessWithDelay(aAssertion, aArgs, aAssertionsCount)
{
	var beforeCount = assertionsModule.successCount;
	yield Do(assert.notRaises(
		'AssertionFailed',
		function() {
			yield Do(aAssertion.apply(assertionsModule, aArgs));
		},
		null
	));
	assert.equals(
		beforeCount+(aAssertionsCount === void(0) ? 1 : aAssertionsCount ),
		assertionsModule.successCount
	);
}

function assertFailureWithDelay(aAssertion, aArgs, aAssertionsCount)
{
	yield Do(assert.raises(
		'AssertionFailed',
		function() {
			yield Do(aAssertion.apply(assertionsModule, aArgs));
		},
		null
	));

	var beforeCount = assertionsModule.successCount;
	var exception;
	try {
		aAssertion.apply(assertionsModule, aArgs);
	}
	catch(e) {
		exception = e;
	}
	assert.notEquals(-1, exception.message.indexOf(aArgs[aArgs.length-1]));
	assert.equals(
		beforeCount+(aAssertionsCount === void(0) ? 0 : aAssertionsCount ),
		assertionsModule.successCount
	);
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

function testContainedString()
{
	var message = Math.random() * 65000;
	assertSuccess(assertionsModule.contained,
                  ['long text', 'text']);
	assertFailure(assertionsModule.contained,
                  ['long text', 'outside', message]);
	assertFailure(assertionsModule.notContained,
                  ['long text', 'text', message]);
	assertSuccess(assertionsModule.notContained,
                  ['long text', 'outside']);
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

function testContainedArray()
{
	var message = Math.random() * 65000;
	var item = { value : true };
	var array = ['string', 29, true, item];
	assertSuccess(assertionsModule.contained,
                  [array, 'string']);
	assertSuccess(assertionsModule.contained,
                  [array, 29]);
	assertSuccess(assertionsModule.contained,
                  [array, true]);
	assertSuccess(assertionsModule.contained,
                  [array, item]);
	assertFailure(assertionsModule.contained,
                  [array, 'outside', message]);
	assertFailure(assertionsModule.notContained,
                  [array, 'string', message]);
	assertFailure(assertionsModule.notContained,
                  [array, 29, message]);
	assertFailure(assertionsModule.notContained,
                  [array, true, message]);
	assertFailure(assertionsModule.notContained,
                  [array, item, message]);
	assertSuccess(assertionsModule.notContained,
                  [array, 'outside']);
	assert.equal(5, assertionsModule.successCount);
}

function testContainsAndContainedRange()
{
	var message = Math.random() * 65000;

	utils.loadURI('../../fixtures/links.html');

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
	assertSuccess(assertionsModule.contained,
                  [range, $('link5')]);
	assertFailure(assertionsModule.contained,
                  [range, $('link10'), message]);
	assertFailure(assertionsModule.notContained,
                  [range, $('link5'), message]);
	assertSuccess(assertionsModule.notContained,
                  [range, $('link10')]);

	assertSuccess(assertionsModule.contains,
                  ['リンク5', range]);
	assertFailure(assertionsModule.contains,
                  ['リンク10', range, message]);
	assertFailure(assertionsModule.notContains,
                  ['リンク5', range, message]);
	assertSuccess(assertionsModule.notContains,
                  ['リンク10', range]);
	assertSuccess(assertionsModule.contained,
                  [range, 'リンク5']);
	assertFailure(assertionsModule.contained,
                  [range, 'リンク10', message]);
	assertFailure(assertionsModule.notContained,
                  [range, 'リンク5', message]);
	assertSuccess(assertionsModule.notContained,
                  [range, 'リンク10']);

	var targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                  [targetRange, range]);
	assertFailure(assertionsModule.notContains,
                  [targetRange, range, message]);
	assertSuccess(assertionsModule.contained,
                  [range, targetRange]);
	assertFailure(assertionsModule.notContained,
                  [range, targetRange, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailure(assertionsModule.contains,
                  [targetRange, range, message]);
	assertSuccess(assertionsModule.notContains,
                  [targetRange, range]);
	assertFailure(assertionsModule.contained,
                  [range, targetRange, message]);
	assertSuccess(assertionsModule.notContained,
                  [range, targetRange]);

	range.detach();
	targetRange.detach();

	assert.equal(12, assertionsModule.successCount);
}

function testContainsSelection()
{
	var message = Math.random() * 65000;

	utils.loadURI('../../fixtures/links.html');

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
	assertSuccess(assertionsModule.contained,
                  [selection, $('link5')]);
	assertFailure(assertionsModule.contained,
                  [selection, $('link10'), message]);
	assertSuccess(assertionsModule.contained,
                  [selection, $('link13')]);
	assertFailure(assertionsModule.notContained,
                  [selection, $('link5'), message]);
	assertSuccess(assertionsModule.notContained,
                  [selection, $('link10')]);
	assertFailure(assertionsModule.notContained,
                  [selection, $('link13'), message]);

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
	assertSuccess(assertionsModule.contained,
                  [selection, 'リンク5']);
	assertFailure(assertionsModule.contained,
                  [selection, 'リンク10', message]);
	assertSuccess(assertionsModule.contained,
                  [selection, 'リンク13']);
	assertFailure(assertionsModule.notContained,
                  [selection, 'リンク5', message]);
	assertSuccess(assertionsModule.notContained,
                  [selection, 'リンク10']);
	assertFailure(assertionsModule.notContained,
                  [selection, 'リンク13', message]);

	var targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                  [targetRange, selection]);
	assertFailure(assertionsModule.notContains,
                  [targetRange, selection, message]);
	assertSuccess(assertionsModule.contained,
                  [selection, targetRange]);
	assertFailure(assertionsModule.notContained,
                  [selection, targetRange, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailure(assertionsModule.contains,
                  [targetRange, selection, message]);
	assertSuccess(assertionsModule.notContains,
                  [targetRange, selection]);
	assertFailure(assertionsModule.contained,
                  [selection, targetRange, message]);
	assertSuccess(assertionsModule.notContained,
                  [selection, targetRange]);
	targetRange.selectNode($('em13'));
	targetRange.setEnd($('em13').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                  [targetRange, selection]);
	assertFailure(assertionsModule.notContains,
                  [targetRange, selection, message]);
	assertSuccess(assertionsModule.contained,
                  [selection, targetRange]);
	assertFailure(assertionsModule.notContained,
                  [selection, targetRange, message]);

	targetRange.detach();
	selection.removeAllRanges();

	assert.equal(18, assertionsModule.successCount);
}

function testContainsDOMNodeTree()
{
	var message = Math.random() * 65000;

	utils.loadURI('../../fixtures/links.html');

	var root = $('item5');

	assertSuccess(assertionsModule.contains,
                  [$('link5'), root]);
	assertFailure(assertionsModule.contains,
                  [$('link10'), root, message]);
	assertFailure(assertionsModule.notContains,
                  [$('link5'), root, message]);
	assertSuccess(assertionsModule.notContains,
                  [$('link10'), root]);
	assertSuccess(assertionsModule.contained,
                  [root, $('link5')]);
	assertFailure(assertionsModule.contained,
                  [root, $('link10'), message]);
	assertFailure(assertionsModule.notContained,
                  [root, $('link5'), message]);
	assertSuccess(assertionsModule.notContained,
                  [root, $('link10')]);

	assertSuccess(assertionsModule.contains,
                  ['リンク5', root]);
	assertFailure(assertionsModule.contains,
                  ['リンク10', root, message]);
	assertFailure(assertionsModule.notContains,
                  ['リンク5', root, message]);
	assertSuccess(assertionsModule.notContains,
                  ['リンク10', root]);
	assertSuccess(assertionsModule.contained,
                  [root, 'リンク5']);
	assertFailure(assertionsModule.contained,
                  [root, 'リンク10', message]);
	assertFailure(assertionsModule.notContained,
                  [root, 'リンク5', message]);
	assertSuccess(assertionsModule.notContained,
                  [root, 'リンク10']);

	var targetRange = content.document.createRange();
	targetRange.selectNode($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assertSuccess(assertionsModule.contains,
                  [targetRange, root]);
	assertFailure(assertionsModule.notContains,
                  [targetRange, root, message]);
	assertSuccess(assertionsModule.contained,
                  [root, targetRange]);
	assertFailure(assertionsModule.notContained,
                  [root, targetRange, message]);
	targetRange.selectNode($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assertFailure(assertionsModule.contains,
                  [targetRange, root, message]);
	assertSuccess(assertionsModule.notContains,
                  [targetRange, root]);
	assertFailure(assertionsModule.contained,
                  [root, targetRange, message]);
	assertSuccess(assertionsModule.notContained,
                  [root, targetRange]);

	targetRange.detach();

	assert.equal(12, assertionsModule.successCount);
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

	assertSuccess(assertionsModule.isObject, [{}]);
	assertSuccess(assertionsModule.isObject, [new Object()]);
	assertSuccess(assertionsModule.isObject, [[]]);
	assertSuccess(assertionsModule.isObject, [new Array()]);
	assertFailure(assertionsModule.isObject, [true, message]);
	assertFailure(assertionsModule.isObject, [false, message]);
	assertFailure(assertionsModule.isObject, [0, message]);
	assertFailure(assertionsModule.isObject, ['func', message]);
	assertSuccess(assertionsModule.isObject, [null]);

	assertSuccess(assertionsModule.isNotObject, [true]);
	assertSuccess(assertionsModule.isNotObject, [false]);
	assertSuccess(assertionsModule.isNotObject, [0]);
	assertSuccess(assertionsModule.isNotObject, ['func']);
	assertFailure(assertionsModule.isNotObject, [null, message]);
	assertFailure(assertionsModule.isNotObject, [{}, message]);
	assertFailure(assertionsModule.isNotObject, [new Object(), message]);
	assertFailure(assertionsModule.isNotObject, [[], message]);
	assertFailure(assertionsModule.isNotObject, [new Array(), message]);

	assertFailure(assertionsModule.isArray, [{}, message]);
	assertFailure(assertionsModule.isArray, [new Object(), message]);
	assertSuccess(assertionsModule.isArray, [[]]);
	assertSuccess(assertionsModule.isArray, [new Array()]);
	assertFailure(assertionsModule.isArray, [true, message]);
	assertFailure(assertionsModule.isArray, [false, message]);
	assertFailure(assertionsModule.isArray, [0, message]);
	assertFailure(assertionsModule.isArray, ['func', message]);
	assertFailure(assertionsModule.isArray, [null, message]);

	assertSuccess(assertionsModule.isNotArray, [true]);
	assertSuccess(assertionsModule.isNotArray, [false]);
	assertSuccess(assertionsModule.isNotArray, [0]);
	assertSuccess(assertionsModule.isNotArray, ['func']);
	assertSuccess(assertionsModule.isNotArray, [null]);
	assertSuccess(assertionsModule.isNotArray, [{}, message]);
	assertSuccess(assertionsModule.isNotArray, [new Object(), message]);
	assertFailure(assertionsModule.isNotArray, [[], message]);
	assertFailure(assertionsModule.isNotArray, [new Array(), message]);

	assert.equal(31, assertionsModule.successCount);
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

function testImplementsInstance()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.implementsInterface, [Ci.nsIDOMWindow, window]);
	assertSuccess(assertionsModule.implementsInterface, ['nsIDOMWindow', window]);
	assertFailure(assertionsModule.implementsInterface, [Ci.nsIDOMRange, window, message]);
	assertFailure(assertionsModule.implementsInterface, ['nsIDOMRange', window, message]);
}

function testIsInstanceOf()
{
	var message = Math.random() * 65000;

	assertSuccess(assertionsModule.isInstanceOf, [Ci.nsIDOMWindow, window]);
	assertSuccess(assertionsModule.isInstanceOf, ['nsIDOMWindow', window]);
	assertFailure(assertionsModule.isInstanceOf, [Ci.nsIDOMRange, window, message]);
	assertFailure(assertionsModule.isInstanceOf, ['nsIDOMRange', window, message]);

	assertSuccess(assertionsModule.isInstanceOf, [Array, []]);
	assertSuccess(assertionsModule.isInstanceOf, [Object, [], message]);
	assertSuccess(assertionsModule.isInstanceOf, [Object, {}]);
	assertFailure(assertionsModule.isInstanceOf, [Array, {}, message]);
	assertSuccess(assertionsModule.isInstanceOf, [Date, new Date()]);
	assertFailure(assertionsModule.isInstanceOf, [Date, {}, message]);

	function MyClass() {}
	MyClass.prototype = { prop : true };
	assertSuccess(assertionsModule.isInstanceOf, [MyClass, new MyClass()]);
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
		['test', function() { throw new Error('test'); }, {}]
	);
	assertFailure(assertionsModule.raise,
		['test', function() { return true; }, {}, message]
	);
	assertSuccess(assertionsModule.raise,
		['SyntaxError', function() { eval('{'); }, {}]
	);

	assertSuccess(assertionsModule.raise,
		['NS_NOINTERFACE', function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);
	assertSuccess(assertionsModule.raise,
		[Components.results.NS_NOINTERFACE, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
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
		['test', function() { throw new Error('test'); }, {}, message]
	);
	assertSuccess(assertionsModule.notRaise,
		['SyntaxError', function() { throw 'test'; }, {}]
	);
	assertFailure(assertionsModule.notRaise,
		['SyntaxError', function() { eval('{'); }, {}, message]
	);
	assertSuccess(assertionsModule.notRaise,
		['NS_OK', function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);
	assertSuccess(assertionsModule.notRaise,
		[Components.results.NS_OK, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);
	assertFailure(assertionsModule.notRaise,
		['NS_NOINTERFACE', function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}, message]
	);
	assertFailure(assertionsModule.notRaise,
		[Components.results.NS_NOINTERFACE, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}, message]
	);

	assert.equal(12, assertionsModule.successCount);
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

function testDifference()
{
	var message = Math.random() * 65000;

	var count = { value : 0 };

	count.value = 0;
	assertSuccess(assertionsModule.difference, [
		(function() count.value ),
		1,
		(function () {
			count.value++;
		}),
		{}
	]);

	count.value = 0;
	assertSuccess(assertionsModule.difference, [
		count,
		'value',
		1,
		(function () {
			count.value++;
		}),
		{}
	]);


	count.value = 0;
	assertFailure(assertionsModule.difference, [
		(function() count.value ),
		-1,
		(function () {
			count.value++;
		}),
		{},
		message
	]);


	count.value = 0;
	var args = [
			'not function',
			'string',
			(function () {
				count.value++;
			}),
			{}
		];
	assertError(
		assertionsModule.difference,
		args,
		bundle.getFormattedString(
			'assert_difference_invalid_arguments',
			[assertionsModule._appendTypeString(args)]
		)
	);
	assert.equals(0, count.value);
	assertError(
		assertionsModule.difference,
		[
			(function() count.value ),
			'string',
			(function () {
				count.value++;
			}),
			{}
		],
		bundle.getFormattedString(
			'assert_difference_delta_not_number',
			[assertionsModule._appendTypeString('string')]
		)
	);
	assert.equals(0, count.value);
	assertError(
		assertionsModule.difference,
		[
			(function() 'string' ),
			1,
			(function () {
				count.value++;
			}),
			{}
		],
		bundle.getFormattedString(
			'assert_difference_value_not_number',
			[assertionsModule._appendTypeString('string')]
		)
	);
	assert.equals(0, count.value);


	assert.equal(2, assertionsModule.successCount);
}

function testNoDifference()
{
	var message = Math.random() * 65000;

	var count = { value : 0 };

	count.value = 0;
	assertSuccess(assertionsModule.noDifference, [
		(function() count.value ),
		(function () {}),
		{}
	]);

	count.value = 0;
	assertSuccess(assertionsModule.noDifference, [
		count,
		'value',
		1,
		(function () {}),
		{}
	]);


	count.value = 0;
	assertFailure(assertionsModule.noDifference, [
		(function() count.value ),
		(function () {
			count.value++;
		}),
		{},
		message
	]);


	count.value = 0;
	var args = [
			'not function',
			(function () {}),
			{}
		];
	assertError(
		assertionsModule.noDifference,
		args,
		bundle.getFormattedString(
			'assert_no_difference_invalid_arguments',
			[assertionsModule._appendTypeString(args)]
		)
	);
	assert.equals(0, count.value);
	assertError(
		assertionsModule.noDifference,
		[
			(function() 'string' ),
			(function () {}),
			{}
		],
		bundle.getFormattedString(
			'assert_difference_value_not_number',
			[assertionsModule._appendTypeString('string')]
		)
	);
	assert.equals(0, count.value);


	assert.equal(2, assertionsModule.successCount);
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

function testAssertionsCount()
{
	var message = Math.random() * 65000;

	assertFailure(assertionsModule.assertionsCountEquals, [
		1,
		function() {
		},
		{},
		message
	], 0);
	assertSuccess(assertionsModule.assertionsCountEquals, [
		1,
		function() {
			assertionsModule.isTrue(true);
		},
		{}
	], 2);
	assertFailure(assertionsModule.assertionsCountEquals, [
		1,
		function() {
			assertionsModule.isTrue(true);
			assertionsModule.isTrue(true);
		},
		{},
		message
	], 2);

	assertFailure(assertionsModule.assertionsMinCount, [
		1,
		function() {
		},
		{},
		message
	], 0);
	assertSuccess(assertionsModule.assertionsMinCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
		},
		{}
	], 2);
	assertSuccess(assertionsModule.assertionsMinCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
			assertionsModule.isTrue(true);
		},
		{}
	], 3);

	assertSuccess(assertionsModule.assertionsMaxCount, [
		1,
		function() {
		},
		{}
	], 1);
	assertSuccess(assertionsModule.assertionsMaxCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
		},
		{}
	], 2);
	assertFailure(assertionsModule.assertionsMaxCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
			assertionsModule.isTrue(true);
		},
		{},
		message
	], 2);
}

function test_fail()
{
	var exception = null;
	try {
		assertionsModule._fail(
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
		assertionsModule._fail(
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
		assertionsModule._fail(
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
		assertionsModule._fail(
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
	assert.equals(Diff.readable('0aaaaaaaaaa', '1aaaaaaaaaa'), exception.diff);
	assert.equals(Diff.foldedReadable('0aaaaaaaaaa', '1aaaaaaaaaa'), exception.foldedDiff);
	assert.equals('6\n5\n4', exception.message);
}

function test_appendTypeString()
{
	assert.equals('true (boolean)', assertionsModule._appendTypeString(true));
	assert.equals('0 (number)',     assertionsModule._appendTypeString(0));
	assert.equals('"a" (string)',   assertionsModule._appendTypeString('a'));
	assert.equals('"a" (String)',   assertionsModule._appendTypeString(new String('a')));
	assert.equals('{} (Object)',    assertionsModule._appendTypeString({}));
	assert.equals('[] (Array)',     assertionsModule._appendTypeString([]));
	assert.equals('null',           assertionsModule._appendTypeString(null));
	assert.equals('undefined',      assertionsModule._appendTypeString(void(0)));
	assert.equals('function () {\n} (function)', assertionsModule._appendTypeString(function() {}));
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


testExport.priority = 'must';
function testExport()
{
	var namespace = {};
	assertionsModule.export(namespace);

	assert.isFunction(namespace.assert);
	assert.equals(assertionsModule, namespace.assert._source);

	assert.isFunction(namespace.assert.equals);
	assert.isFunction(namespace.assert.equal);
	assert.isFunction(namespace.assert.arrayEquals);
	assert.isFunction(namespace.assert.arrayEqual);
	assert.isFunction(namespace.assert.notEquals);
	assert.isFunction(namespace.assert.notEqual);
	assert.isFunction(namespace.assert.strictlyEquals);
	assert.isFunction(namespace.assert.strictlyEqual);
	assert.isFunction(namespace.assert.notStrictlyEquals);
	assert.isFunction(namespace.assert.notStrictlyEqual);
	assert.isFunction(namespace.assert.isTrue);
	assert.isFunction(namespace.assert.true);
	assert.isFunction(namespace.assert.isFalse);
	assert.isFunction(namespace.assert.false);
	assert.isFunction(namespace.assert.isBoolean);
	assert.isFunction(namespace.assert.isBool);
	assert.isFunction(namespace.assert.boolean);
	assert.isFunction(namespace.assert.bool);
	assert.isFunction(namespace.assert.isNotBoolean);
	assert.isFunction(namespace.assert.isNotBool);
	assert.isFunction(namespace.assert.notBoolean);
	assert.isFunction(namespace.assert.notBool);
	assert.isFunction(namespace.assert.isString);
	assert.isFunction(namespace.assert.string);
	assert.isFunction(namespace.assert.isNotString);
	assert.isFunction(namespace.assert.notString);
	assert.isFunction(namespace.assert.isNumber);
	assert.isFunction(namespace.assert.number);
	assert.isFunction(namespace.assert.isNotNumber);
	assert.isFunction(namespace.assert.notNumber);
	assert.isFunction(namespace.assert.isFunction);
	assert.isFunction(namespace.assert.function);
	assert.isFunction(namespace.assert.isNotFunction);
	assert.isFunction(namespace.assert.notFunction);
	assert.isFunction(namespace.assert.isObject);
	assert.isFunction(namespace.assert.object);
	assert.isFunction(namespace.assert.isNotObject);
	assert.isFunction(namespace.assert.notObject);
	assert.isFunction(namespace.assert.isArray);
	assert.isFunction(namespace.assert.array);
	assert.isFunction(namespace.assert.isNotArray);
	assert.isFunction(namespace.assert.notArray);
	assert.isFunction(namespace.assert.isDefined);
	assert.isFunction(namespace.assert.defined);
	assert.isFunction(namespace.assert.isUndefined);
	assert.isFunction(namespace.assert.undefined);
	assert.isFunction(namespace.assert.isNull);
	assert.isFunction(namespace.assert.null);
	assert.isFunction(namespace.assert.isNotNull);
	assert.isFunction(namespace.assert.notNull);
	assert.isFunction(namespace.assert.implementsInterface);
	assert.isFunction(namespace.assert.implementInterface);
	assert.isFunction(namespace.assert.isInstanceOf);
	assert.isFunction(namespace.assert.instanceOf);
	assert.isFunction(namespace.assert.instanceof);
	assert.isFunction(namespace.assert.isInstance);
	assert.isFunction(namespace.assert.instance);
	assert.isFunction(namespace.assert.raises);
	assert.isFunction(namespace.assert.raise);
	assert.isFunction(namespace.assert.notRaises);
	assert.isFunction(namespace.assert.notRaise);
	assert.isFunction(namespace.assert.matches);
	assert.isFunction(namespace.assert.match);
	assert.isFunction(namespace.assert.notMatches);
	assert.isFunction(namespace.assert.notMatch);
	assert.isFunction(namespace.assert.pattern);
	assert.isFunction(namespace.assert.notPattern);
	assert.isFunction(namespace.assert.inDelta);
	assert.isFunction(namespace.assert.difference);
	assert.isFunction(namespace.assert.noDifference);
	assert.isFunction(namespace.assert.compare);
	assert.isFunction(namespace.assert.contains);
	assert.isFunction(namespace.assert.contain);
	assert.isFunction(namespace.assert.notContains);
	assert.isFunction(namespace.assert.notContain);
	assert.isFunction(namespace.assert.contained);
	assert.isFunction(namespace.assert.notContained);
	assert.isFunction(namespace.assert.finishesWithin);
	assert.isFunction(namespace.assert.finishWithin);
	assert.isFunction(namespace.assert.ok);
	assert.isFunction(namespace.assert.is);
	assert.isFunction(namespace.assert.assertionsCountEquals);
	assert.isFunction(namespace.assert.assertionsCountEqual);
	assert.isFunction(namespace.assert.assertionsMinCount);
	assert.isFunction(namespace.assert.assertionsMaxCount);
	assert.isFunction(namespace.assert.validSuccessCount);

	assert.isFunction(namespace.assertEquals);
	assert.isFunction(namespace.assertEqual);
	assert.isFunction(namespace.assertArrayEquals);
	assert.isFunction(namespace.assertArrayEqual);
	assert.isFunction(namespace.assertNotEquals);
	assert.isFunction(namespace.assertNotEqual);
	assert.isFunction(namespace.assertStrictlyEquals);
	assert.isFunction(namespace.assertStrictlyEqual);
	assert.isFunction(namespace.assertNotStrictlyEquals);
	assert.isFunction(namespace.assertNotStrictlyEqual);
	assert.isFunction(namespace.assertIsTrue);
	assert.isFunction(namespace.assertTrue);
	assert.isFunction(namespace.assertIsFalse);
	assert.isFunction(namespace.assertFalse);
	assert.isFunction(namespace.assertIsBoolean);
	assert.isFunction(namespace.assertIsBool);
	assert.isFunction(namespace.assertBoolean);
	assert.isFunction(namespace.assertBool);
	assert.isFunction(namespace.assertIsNotBoolean);
	assert.isFunction(namespace.assertIsNotBool);
	assert.isFunction(namespace.assertNotBoolean);
	assert.isFunction(namespace.assertNotBool);
	assert.isFunction(namespace.assertIsString);
	assert.isFunction(namespace.assertString);
	assert.isFunction(namespace.assertIsNotString);
	assert.isFunction(namespace.assertNotString);
	assert.isFunction(namespace.assertIsNumber);
	assert.isFunction(namespace.assertNumber);
	assert.isFunction(namespace.assertIsNotNumber);
	assert.isFunction(namespace.assertNotNumber);
	assert.isFunction(namespace.assertIsFunction);
	assert.isFunction(namespace.assertFunction);
	assert.isFunction(namespace.assertIsNotFunction);
	assert.isFunction(namespace.assertNotFunction);
	assert.isFunction(namespace.assertIsObject);
	assert.isFunction(namespace.assertObject);
	assert.isFunction(namespace.assertIsNotObject);
	assert.isFunction(namespace.assertNotObject);
	assert.isFunction(namespace.assertIsArray);
	assert.isFunction(namespace.assertArray);
	assert.isFunction(namespace.assertIsNotArray);
	assert.isFunction(namespace.assertNotArray);
	assert.isFunction(namespace.assertIsDefined);
	assert.isFunction(namespace.assertDefined);
	assert.isFunction(namespace.assertIsUndefined);
	assert.isFunction(namespace.assertUndefined);
	assert.isFunction(namespace.assertIsNull);
	assert.isFunction(namespace.assertNull);
	assert.isFunction(namespace.assertIsNotNull);
	assert.isFunction(namespace.assertNotNull);
	assert.isFunction(namespace.assertImplementsInterface);
	assert.isFunction(namespace.assertImplementInterface);
	assert.isFunction(namespace.assertIsInstanceOf);
	assert.isFunction(namespace.assertInstanceOf);
	assert.isFunction(namespace.assertInstanceof);
	assert.isFunction(namespace.assertIsInstance);
	assert.isFunction(namespace.assertInstance);
	assert.isFunction(namespace.assertRaises);
	assert.isFunction(namespace.assertRaise);
	assert.isFunction(namespace.assertNotRaises);
	assert.isFunction(namespace.assertNotRaise);
	assert.isFunction(namespace.assertMatches);
	assert.isFunction(namespace.assertMatch);
	assert.isFunction(namespace.assertNotMatches);
	assert.isFunction(namespace.assertNotMatch);
	assert.isFunction(namespace.assertPattern);
	assert.isFunction(namespace.assertNotPattern);
	assert.isFunction(namespace.assertInDelta);
	assert.isFunction(namespace.assertDifference);
	assert.isFunction(namespace.assertNoDifference);
	assert.isFunction(namespace.assertCompare);
	assert.isFunction(namespace.assertContains);
	assert.isFunction(namespace.assertContain);
	assert.isFunction(namespace.assertNotContains);
	assert.isFunction(namespace.assertNotContain);
	assert.isFunction(namespace.assertContained);
	assert.isFunction(namespace.assertNotContained);
	assert.isFunction(namespace.assertFinishesWithin);
	assert.isFunction(namespace.assertFinishWithin);
	assert.isFunction(namespace.assertOk);
	assert.isFunction(namespace.assertIs);
	assert.isFunction(namespace.assertAssertionsCountEquals);
	assert.isFunction(namespace.assertAssertionsCountEqual);
	assert.isFunction(namespace.assertAssertionsMinCount);
	assert.isFunction(namespace.assertAssertionsMaxCount);
	assert.isFunction(namespace.assertValidSuccessCount);
}
