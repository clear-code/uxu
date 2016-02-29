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
	yield assert.notRaises(
		'AssertionFailed',
		function() {
			yield aAssertion.apply(assertionsModule, aArgs);
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
	yield assert.raises(
		'AssertionFailed',
		function() {
			yield aAssertion.apply(assertionsModule, aArgs);
		},
		null
	)
	.then(function(e) {
		exception = e;
	})
	.catch(function(e) {
		exception = e;
	});
	assert.notEquals(-1, exception.message.indexOf(aArgs[aArgs.length-1]));
	assert.equals(
		beforeCount+(aAssertionsCount === void(0) ? 0 : aAssertionsCount ),
		assertionsModule.successCount
	);
}

function assertError(aAssertion, aArgs, aError, aAssertionsCount)
{
	var beforeCount = assertionsModule.successCount;
	yield assert.raises(
		aError,
		function() {
			yield aAssertion.apply(assertionsModule, aArgs);
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
	yield utils.wait(function() {
		yield aAssertion.apply(assertionsModule, aArgs);
	})
	.then(function(e) {
		exception = e;
	})
	.catch(function(e) {
		exception = e;
	});
	assert.notEquals(-1, exception.message.indexOf(aArgs[aArgs.length-1]));
	assert.equals(
		beforeCount+(aAssertionsCount === void(0) ? 0 : aAssertionsCount ),
		assertionsModule.successCount
	);
}

function createRandomMessage()
{
	return 'messsage:' + (Math.random() * 65000);
}


// equals

testEquals_success.parameters = [
	[1, 1],
	[[1, "2", true],
	 [1, "2", true]],
	[[1, 2, false],
	 [1, "2", false]],
	[new Date(2007, 5, 27, 7, 23, 54),
	 new Date(2007, 5, 27, 7, 23, 54)],
	[{my: 1, name: "is", Nakano: "NO!"},
	 {my: "1", name: "is", Nakano: "NO!"}]
];
function testEquals_success(aParameter)
{
	yield assertSuccess(assertionsModule.equals, aParameter);
	yield assertSuccess(assertionsModule.equal, aParameter);
	assert.equal(2, assertionsModule.successCount);
}

testEquals_fail.parameters = [
	[0, 1, createRandomMessage()],
	[new Date(2008, 5, 27, 7, 23, 54),
	 new Date(2007, 5, 27, 7, 23, 54),
	 createRandomMessage()],
	[{my: 1, name: "is", Nakano: "NO!"},
	 {my: 9, name: "is", Nakano: "NO!"},
	 createRandomMessage()],
	[{my: 1, name: "is", Nakano: "NO!"},
	 {my: 1, name: "is", Nakano: "NO!", additional: 0},
	 createRandomMessage()],
	[{my: 1, name: "is", Nakano: "NO!", additional: 0},
	 {my: 1, name: "is", Nakano: "NO!"},
	 createRandomMessage()]
];
function testEquals_fail(aParameter)
{
	yield assertFailure(assertionsModule.equals, aParameter);
	yield assertFailure(assertionsModule.equal, aParameter);
	assert.equal(0, assertionsModule.successCount);
}

function testEquals_DOMNode()
{
	var node = document.createElement('box');

	yield assertSuccess(assertionsModule.equals,
	                    [node,
	                     node]);
	yield assertSuccess(assertionsModule.equals,
	                    [node,
	                     node]);
	yield assertFailure(assertionsModule.equal,
	                    [node,
	                     document.createElement('box'),
	                     createRandomMessage()]);
	yield assertFailure(assertionsModule.equal,
	                    [node,
	                     document.createElement('box'),
	                     createRandomMessage()]);

	assert.equal(2, assertionsModule.successCount);
}


// not equals

testNotEquals_success.parameters = [
	[0, 1]
];
function testNotEquals_success(aParameter)
{
	yield assertSuccess(assertionsModule.notEquals, aParameter);
	yield assertSuccess(assertionsModule.notEqual, aParameter);
	assert.equal(2, assertionsModule.successCount);
}

testNotEquals_fail.parameters = [
	[1, 1, createRandomMessage()]
];
function testNotEquals_fail(aParameter)
{
	yield assertFailure(assertionsModule.notEquals, aParameter);
	yield assertFailure(assertionsModule.notEqual, aParameter);
	assert.equal(0, assertionsModule.successCount);
}


// strictly equals

testStrictlyEquals_success.parameters = [
	[1, 1],
	[[1, "2", true],
	 [1, "2", true]],
	[new Date(2007, 5, 27, 7, 23, 54),
	 new Date(2007, 5, 27, 7, 23, 54)],
	[{my: 1, name: "is", Nakano: "NO!"},
	 {my: 1, name: "is", Nakano: "NO!"}]
];
function testStrictlyEquals_success(aParameter)
{
	yield assertSuccess(assertionsModule.strictlyEquals, aParameter);
	yield assertSuccess(assertionsModule.strictlyEqual, aParameter);
	assert.equal(2, assertionsModule.successCount);
}

testStrictlyEquals_fail.parameters = [
	[0, 1, createRandomMessage()],
	[[1, 2, false],
	 [1, "2", false],
	 createRandomMessage()],
	[new Date(2008, 5, 27, 7, 23, 54),
	 new Date(2007, 5, 27, 7, 23, 54),
	 createRandomMessage()],
	[{my: 1, name: "is", Nakano: "NO!"},
	 {my: "1", name: "is", Nakano: "NO!"},
	 createRandomMessage()],
	[{my: 1, name: "is", Nakano: "NO!", additional: 0},
	 {my: 1, name: "is", Nakano: "NO!"},
	 createRandomMessage()]
];
function testStrictlyEquals_fail(aParameter)
{
	yield assertFailure(assertionsModule.strictlyEquals, aParameter);
	yield assertFailure(assertionsModule.strictlyEqual, aParameter);
	assert.equal(0, assertionsModule.successCount);
}


// same

{
let table1 = {my: 1, name: "is", Nakano: "NO!"};
testSame_success.parameters = [
	[1, 1],
	[table1, table1]
];
}
function testSame_success(aParameter)
{
	yield assertSuccess(assertionsModule.same, aParameter);
	assert.equal(1, assertionsModule.successCount);
}

testSame_fail.parameters = [
	[new Number(1), new Number(1), createRandomMessage()],
	[new String("foo"), new String("foo"), createRandomMessage()],
	[new Date(2007, 5, 27, 7, 23, 54),
	 new Date(2007, 5, 27, 7, 23, 54),
	 createRandomMessage()]
];
function testSame_fail(aParameter)
{
	yield assertFailure(assertionsModule.same, aParameter);
	assert.equal(0, assertionsModule.successCount);
}

function testSame_DOMNode()
{
	var node = document.createElement('box');
	yield assertSuccess(assertionsModule.same, [
		node,
		node
	]);
	yield assertFailure(assertionsModule.same, [
		node,
		document.createElement('box'),
		createRandomMessage()
	]);
	assert.equal(1, assertionsModule.successCount);
}


// not same

testNotSame_success.parameters = [
	[0, 1],
	[new String("foo"), new String("foo")]
];
function testNotSame_success(aParameter)
{
	yield assertSuccess(assertionsModule.notSame, aParameter);
	assert.equal(1, assertionsModule.successCount);
}

testNotSame_fail.parameters = [
	[1, 1, createRandomMessage()]
];
function testNotSame_fail(aParameter)
{
	yield assertFailure(assertionsModule.notSame, aParameter);
	assert.equal(0, assertionsModule.successCount);
}


// contains

var item = { value : true };
var array = ['string', 29, true, item];
testContains_success.parameters = [
	['text', 'long text'],
	['string', array],
	[29, array],
	[true, array],
	[item, array]
];
function testContains_success(aParameter)
{
	yield assertSuccess(assertionsModule.contains, aParameter);
	yield assertSuccess(assertionsModule.contain, aParameter);
	assert.equal(2, assertionsModule.successCount);
}

testContains_fail.parameters = [
	['outside', 'long text', createRandomMessage()],
	['outside', array, createRandomMessage()]
];
function testContains_fail(aParameter)
{
	yield assertFailure(assertionsModule.contains, aParameter);
	yield assertFailure(assertionsModule.contain, aParameter);
	assert.equal(0, assertionsModule.successCount);
}


// not contains

testNotContains_success.parameters = [
	['outside', 'long text'],
	['outside', array]
];
function testNotContains_success(aParameter)
{
	yield assertSuccess(assertionsModule.notContains, aParameter);
	yield assertSuccess(assertionsModule.notContain, aParameter);
	assert.equal(2, assertionsModule.successCount);
}

testNotContains_fail.parameters = [
	['text', 'long text', createRandomMessage()],
	['string', array, createRandomMessage()],
	[29, array, createRandomMessage()],
	[true, array, createRandomMessage()],
	[item, array, createRandomMessage()]
];
function testNotContains_fail(aParameter)
{
	yield assertFailure(assertionsModule.notContains, aParameter);
	yield assertFailure(assertionsModule.notContain, aParameter);
	assert.equal(0, assertionsModule.successCount);
}


// contained

testContained_success.parameters = [
	['long text', 'text'],
	[array, 'string'],
	[array, 29],
	[array, true],
	[array, item]
];
function testContained_success(aParameter)
{
	yield assertSuccess(assertionsModule.contained, aParameter);
	assert.equal(1, assertionsModule.successCount);
}

testContained_fail.parameters = [
	['long text', 'outside', createRandomMessage()],
	[array, 'outside', createRandomMessage()]
];
function testContained_fail(aParameter)
{
	yield assertFailure(assertionsModule.contained, aParameter);
	assert.equal(0, assertionsModule.successCount);
}

// not contained

testNotContained_success.parameters = [
	['long text', 'outside'],
	[array, 'outside']
];
function testNotContained_success(aParameter)
{
	yield assertSuccess(assertionsModule.notContained, aParameter);
	assert.equal(1, assertionsModule.successCount);
}

testNotContained_fail.parameters = [
	['long text', 'text', createRandomMessage()],
	[array, 'string', createRandomMessage()],
	[array, 29, createRandomMessage()],
	[array, true, createRandomMessage()],
	[array, item, createRandomMessage()]
];
function testNotContained_fail(aParameter)
{
	yield assertFailure(assertionsModule.notContained, aParameter);
	assert.equal(0, assertionsModule.successCount);
}


// contains / not contains for DOM Range

var largeRange, smallRange;
testContainsAndContainedRange.setUp = function()
{
	yield utils.loadURI('../../fixtures/links.html');

};
testContainsAndContainedRange.tearDown = function()
{
	if (largeRange) largeRange.detach();
	if (smallRange) smallRange.detach();
};
function testContainsAndContainedRange()
{
	largeRange = content.document.createRange();
	largeRange.setStartBefore($('item4'));
	largeRange.setEndAfter($('item9'));

	yield assertSuccess(assertionsModule.contains,
                  [$('link5'), largeRange]);
	yield assertFailure(assertionsModule.contains,
                  [$('link10'), largeRange, createRandomMessage()]);
	yield assertFailure(assertionsModule.notContains,
                  [$('link5'), largeRange, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  [$('link10'), largeRange]);
	yield assertSuccess(assertionsModule.contained,
                  [largeRange, $('link5')]);
	yield assertFailure(assertionsModule.contained,
                  [largeRange, $('link10'), createRandomMessage()]);
	yield assertFailure(assertionsModule.notContained,
                  [largeRange, $('link5'), createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [largeRange, $('link10')]);

	yield assertSuccess(assertionsModule.contains,
                  ['リンク5', largeRange]);
	yield assertFailure(assertionsModule.contains,
                  ['リンク10', largeRange, createRandomMessage()]);
	yield assertFailure(assertionsModule.notContains,
                  ['リンク5', largeRange, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  ['リンク10', largeRange]);
	yield assertSuccess(assertionsModule.contained,
                  [largeRange, 'リンク5']);
	yield assertFailure(assertionsModule.contained,
                  [largeRange, 'リンク10', createRandomMessage()]);
	yield assertFailure(assertionsModule.notContained,
                  [largeRange, 'リンク5', createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [largeRange, 'リンク10']);

	smallRange = content.document.createRange();
	smallRange.selectNode($('em5'));
	smallRange.setEnd($('em5').lastChild, 3);
	yield assertSuccess(assertionsModule.contains,
                  [smallRange, largeRange]);
	yield assertFailure(assertionsModule.notContains,
                  [smallRange, largeRange, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [largeRange, smallRange]);
	yield assertFailure(assertionsModule.notContained,
                  [largeRange, smallRange, createRandomMessage()]);
	smallRange.selectNode($('em10'));
	smallRange.setEnd($('em10').lastChild, 3);
	yield assertFailure(assertionsModule.contains,
                  [smallRange, largeRange, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  [smallRange, largeRange]);
	yield assertFailure(assertionsModule.contained,
                  [largeRange, smallRange, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [largeRange, smallRange]);

	assert.equal(12, assertionsModule.successCount);
}

var selectionRanges = [];
testContainsAndContainedRange.setUp = function()
{
	yield utils.loadURI('../../fixtures/links.html');
};
testContainsAndContainedRange.tearDown = function()
{
	selectionRanges.forEach(function(aRange) {
		try {
			aRange.detach()
		}
		catch(e) {
		}
	});
	selectionRanges = [];
};
function testContainsSelection()
{
	var selection = content.getSelection();
	selection.removeAllRanges();

	var range1 = content.document.createRange();
	range1.setStartBefore($('item4'));
	range1.setEndAfter($('item9'));
	selectionRanges.push(range1);
	selection.addRange(range1);

	var range2 = content.document.createRange();
	range2.setStartBefore($('item12'));
	range2.setEndAfter($('item14'));
	selectionRanges.push(range2);
	selection.addRange(range2);

	yield assertSuccess(assertionsModule.contains,
                  [$('link5'), selection]);
	yield assertFailure(assertionsModule.contains,
                  [$('link10'), selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contains,
                  [$('link13'), selection]);
	yield assertFailure(assertionsModule.notContains,
                  [$('link5'), selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  [$('link10'), selection]);
	yield assertFailure(assertionsModule.notContains,
                  [$('link13'), selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [selection, $('link5')]);
	yield assertFailure(assertionsModule.contained,
                  [selection, $('link10'), createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [selection, $('link13')]);
	yield assertFailure(assertionsModule.notContained,
                  [selection, $('link5'), createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [selection, $('link10')]);
	yield assertFailure(assertionsModule.notContained,
                  [selection, $('link13'), createRandomMessage()]);

	yield assertSuccess(assertionsModule.contains,
                  ['リンク5', selection]);
	yield assertFailure(assertionsModule.contains,
                  ['リンク10', selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contains,
                  ['リンク13', selection]);
	yield assertFailure(assertionsModule.notContains,
                  ['リンク5', selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  ['リンク10', selection]);
	yield assertFailure(assertionsModule.notContains,
                  ['リンク13', selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [selection, 'リンク5']);
	yield assertFailure(assertionsModule.contained,
                  [selection, 'リンク10', createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [selection, 'リンク13']);
	yield assertFailure(assertionsModule.notContained,
                  [selection, 'リンク5', createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [selection, 'リンク10']);
	yield assertFailure(assertionsModule.notContained,
                  [selection, 'リンク13', createRandomMessage()]);

	var smallRange = content.document.createRange();
	smallRange.selectNode($('em5'));
	smallRange.setEnd($('em5').lastChild, 3);
	selectionRanges.push(smallRange);
	yield assertSuccess(assertionsModule.contains,
                  [smallRange, selection]);
	yield assertFailure(assertionsModule.notContains,
                  [smallRange, selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [selection, smallRange]);
	yield assertFailure(assertionsModule.notContained,
                  [selection, smallRange, createRandomMessage()]);
	smallRange.selectNode($('em10'));
	smallRange.setEnd($('em10').lastChild, 3);
	yield assertFailure(assertionsModule.contains,
                  [smallRange, selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  [smallRange, selection]);
	yield assertFailure(assertionsModule.contained,
                  [selection, smallRange, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [selection, smallRange]);
	smallRange.selectNode($('em13'));
	smallRange.setEnd($('em13').lastChild, 3);
	yield assertSuccess(assertionsModule.contains,
                  [smallRange, selection]);
	yield assertFailure(assertionsModule.notContains,
                  [smallRange, selection, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [selection, smallRange]);
	yield assertFailure(assertionsModule.notContained,
                  [selection, smallRange, createRandomMessage()]);

	assert.equal(18, assertionsModule.successCount);
}

testContainsDOMNodeTree.setUp = function()
{
	yield utils.loadURI('../../fixtures/links.html');
};
testContainsDOMNodeTree.tearDown = function()
{
	selectionRanges.forEach((aRange) => aRange.detach());
	selectionRanges = [];
};
function testContainsDOMNodeTree()
{
	var root = $('item5');

	yield assertSuccess(assertionsModule.contains,
                  [$('link5'), root]);
	yield assertFailure(assertionsModule.contains,
                  [$('link10'), root, createRandomMessage()]);
	yield assertFailure(assertionsModule.notContains,
                  [$('link5'), root, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  [$('link10'), root]);
	yield assertSuccess(assertionsModule.contained,
                  [root, $('link5')]);
	yield assertFailure(assertionsModule.contained,
                  [root, $('link10'), createRandomMessage()]);
	yield assertFailure(assertionsModule.notContained,
                  [root, $('link5'), createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [root, $('link10')]);

	yield assertSuccess(assertionsModule.contains,
                  ['リンク5', root]);
	yield assertFailure(assertionsModule.contains,
                  ['リンク10', root, createRandomMessage()]);
	yield assertFailure(assertionsModule.notContains,
                  ['リンク5', root, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  ['リンク10', root]);
	yield assertSuccess(assertionsModule.contained,
                  [root, 'リンク5']);
	yield assertFailure(assertionsModule.contained,
                  [root, 'リンク10', createRandomMessage()]);
	yield assertFailure(assertionsModule.notContained,
                  [root, 'リンク5', createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [root, 'リンク10']);

	var smallRange = content.document.createRange();
	smallRange.selectNode($('em5'));
	smallRange.setEnd($('em5').lastChild, 3);
	selectionRanges.push(smallRange);
	yield assertSuccess(assertionsModule.contains,
                  [smallRange, root]);
	yield assertFailure(assertionsModule.notContains,
                  [smallRange, root, createRandomMessage()]);
	yield assertSuccess(assertionsModule.contained,
                  [root, smallRange]);
	yield assertFailure(assertionsModule.notContained,
                  [root, smallRange, createRandomMessage()]);
	smallRange.selectNode($('em10'));
	smallRange.setEnd($('em10').lastChild, 3);
	yield assertFailure(assertionsModule.contains,
                  [smallRange, root, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContains,
                  [smallRange, root]);
	yield assertFailure(assertionsModule.contained,
                  [root, smallRange, createRandomMessage()]);
	yield assertSuccess(assertionsModule.notContained,
                  [root, smallRange]);

	assert.equal(12, assertionsModule.successCount);
}


// type detection

function testBoolean()
{
	yield assertSuccess(assertionsModule.isTrue, [true]);
	yield assertSuccess(assertionsModule.isTrue, [{}]);
	yield assertFailure(assertionsModule.isTrue, [false, createRandomMessage()]);
	yield assertFailure(assertionsModule.isTrue, [0, createRandomMessage()]);
	yield assertFailure(assertionsModule.isTrue, ['', createRandomMessage()]);
	yield assertFailure(assertionsModule.isTrue, [null, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isFalse, [false]);
	yield assertSuccess(assertionsModule.isFalse, [0]);
	yield assertSuccess(assertionsModule.isFalse, ['']);
	yield assertSuccess(assertionsModule.isFalse, [null]);
	yield assertSuccess(assertionsModule.isFalse, [void 0]);
	yield assertFailure(assertionsModule.isFalse, [true, createRandomMessage()]);
	yield assertFailure(assertionsModule.isFalse, [{}, createRandomMessage()]);

	assert.equal(7, assertionsModule.successCount);
}

function testType()
{
	yield assertSuccess(assertionsModule.isBoolean, [true]);
	yield assertFailure(assertionsModule.isBoolean, ['true', createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNotBoolean, ['true']);
	yield assertFailure(assertionsModule.isNotBoolean, [true, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isString, ['1']);
	yield assertFailure(assertionsModule.isString, [1, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNotString, [1]);
	yield assertFailure(assertionsModule.isNotString, ['1', createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNumber, [0]);
	yield assertFailure(assertionsModule.isNumber, ['0', createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNotNumber, ['0']);
	yield assertFailure(assertionsModule.isNotNumber, [0, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isFunction, [(function() {})]);
	yield assertSuccess(assertionsModule.isFunction, [(new Function('foo', 'return foo'))]);
	yield assertFailure(assertionsModule.isFunction, [true, createRandomMessage()]);
	yield assertFailure(assertionsModule.isFunction, [false, createRandomMessage()]);
	yield assertFailure(assertionsModule.isFunction, [0, createRandomMessage()]);
	yield assertFailure(assertionsModule.isFunction, ['func', createRandomMessage()]);
	yield assertFailure(assertionsModule.isFunction, [null, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNotFunction, [true]);
	yield assertSuccess(assertionsModule.isNotFunction, [false]);
	yield assertSuccess(assertionsModule.isNotFunction, [0]);
	yield assertSuccess(assertionsModule.isNotFunction, ['func']);
	yield assertSuccess(assertionsModule.isNotFunction, [null]);
	yield assertFailure(assertionsModule.isNotFunction, [(function() {}), createRandomMessage()]);
	yield assertFailure(assertionsModule.isNotFunction, [(new Function('foo', 'return foo')), createRandomMessage()]);

	yield assertSuccess(assertionsModule.isObject, [{}]);
	yield assertSuccess(assertionsModule.isObject, [new Object()]);
	yield assertSuccess(assertionsModule.isObject, [[]]);
	yield assertSuccess(assertionsModule.isObject, [new Array()]);
	yield assertFailure(assertionsModule.isObject, [true, createRandomMessage()]);
	yield assertFailure(assertionsModule.isObject, [false, createRandomMessage()]);
	yield assertFailure(assertionsModule.isObject, [0, createRandomMessage()]);
	yield assertFailure(assertionsModule.isObject, ['func', createRandomMessage()]);
	yield assertSuccess(assertionsModule.isObject, [null]);

	yield assertSuccess(assertionsModule.isNotObject, [true]);
	yield assertSuccess(assertionsModule.isNotObject, [false]);
	yield assertSuccess(assertionsModule.isNotObject, [0]);
	yield assertSuccess(assertionsModule.isNotObject, ['func']);
	yield assertFailure(assertionsModule.isNotObject, [null, createRandomMessage()]);
	yield assertFailure(assertionsModule.isNotObject, [{}, createRandomMessage()]);
	yield assertFailure(assertionsModule.isNotObject, [new Object(), createRandomMessage()]);
	yield assertFailure(assertionsModule.isNotObject, [[], createRandomMessage()]);
	yield assertFailure(assertionsModule.isNotObject, [new Array(), createRandomMessage()]);

	yield assertFailure(assertionsModule.isArray, [{}, createRandomMessage()]);
	yield assertFailure(assertionsModule.isArray, [new Object(), createRandomMessage()]);
	yield assertSuccess(assertionsModule.isArray, [[]]);
	yield assertSuccess(assertionsModule.isArray, [new Array()]);
	yield assertFailure(assertionsModule.isArray, [true, createRandomMessage()]);
	yield assertFailure(assertionsModule.isArray, [false, createRandomMessage()]);
	yield assertFailure(assertionsModule.isArray, [0, createRandomMessage()]);
	yield assertFailure(assertionsModule.isArray, ['func', createRandomMessage()]);
	yield assertFailure(assertionsModule.isArray, [null, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNotArray, [true]);
	yield assertSuccess(assertionsModule.isNotArray, [false]);
	yield assertSuccess(assertionsModule.isNotArray, [0]);
	yield assertSuccess(assertionsModule.isNotArray, ['func']);
	yield assertSuccess(assertionsModule.isNotArray, [null]);
	yield assertSuccess(assertionsModule.isNotArray, [{}, createRandomMessage()]);
	yield assertSuccess(assertionsModule.isNotArray, [new Object(), createRandomMessage()]);
	yield assertFailure(assertionsModule.isNotArray, [[], createRandomMessage()]);
	yield assertFailure(assertionsModule.isNotArray, [new Array(), createRandomMessage()]);

	assert.equal(31, assertionsModule.successCount);
}

function testNullAndUndefined()
{
	yield assertSuccess(assertionsModule.isDefined, [true]);
	yield assertSuccess(assertionsModule.isDefined, [false]);
	yield assertSuccess(assertionsModule.isDefined, [0]);
	yield assertSuccess(assertionsModule.isDefined, ['']);
	yield assertSuccess(assertionsModule.isDefined, [null]);
	yield assertFailure(assertionsModule.isDefined, [void(0), createRandomMessage()]);

	yield assertSuccess(assertionsModule.isUndefined, [void(0)]);
	yield assertFailure(assertionsModule.isUndefined, [true, createRandomMessage()]);
	yield assertFailure(assertionsModule.isUndefined, [false, createRandomMessage()]);
	yield assertFailure(assertionsModule.isUndefined, [0, createRandomMessage()]);
	yield assertFailure(assertionsModule.isUndefined, ['', createRandomMessage()]);
	yield assertFailure(assertionsModule.isUndefined, [null, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNull, [null]);
	yield assertFailure(assertionsModule.isNull, [true, createRandomMessage()]);
	yield assertFailure(assertionsModule.isNull, [false, createRandomMessage()]);
	yield assertFailure(assertionsModule.isNull, [0, createRandomMessage()]);
	yield assertFailure(assertionsModule.isNull, ['', createRandomMessage()]);
	yield assertFailure(assertionsModule.isNull, [void(0), createRandomMessage()]);

	yield assertSuccess(assertionsModule.isNotNull, [true]);
	yield assertSuccess(assertionsModule.isNotNull, [false]);
	yield assertSuccess(assertionsModule.isNotNull, [0]);
	yield assertSuccess(assertionsModule.isNotNull, ['']);
	yield assertSuccess(assertionsModule.isNotNull, [void(0)]);
	yield assertFailure(assertionsModule.isNotNull, [null, createRandomMessage()]);

	assert.equal(12, assertionsModule.successCount);
}

function testRegExp()
{
	yield assertSuccess(assertionsModule.matches,
		[/te[sx]t/, 'test']
	);
	yield assertFailure(assertionsModule.matches,
		[/te[sx]t/, 'tent', createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.match,
		[/te[sx]t/, 'test']
	);
	yield assertFailure(assertionsModule.match,
		[/te[sx]t/, 'tent', createRandomMessage()]
	);

	yield assertSuccess(assertionsModule.notMatches,
		[/te[sx]t/, 'tent']
	);
	yield assertFailure(assertionsModule.notMatches,
		[/te[sx]t/, 'test', createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.notMatch,
		[/te[sx]t/, 'tent']
	);
	yield assertFailure(assertionsModule.notMatch,
		[/te[sx]t/, 'test', createRandomMessage()]
	);

	yield assertSuccess(assertionsModule.pattern,
		['test', /te[sx]t/]
	);
	yield assertFailure(assertionsModule.pattern,
		['tent', /te[sx]t/, createRandomMessage()]
	);

	yield assertSuccess(assertionsModule.notPattern,
		['tent', /te[sx]t/]
	);
	yield assertFailure(assertionsModule.notPattern,
		['test', /te[sx]t/, createRandomMessage()]
	);

	assert.equal(6, assertionsModule.successCount);
}

function testArray()
{
	yield assertSuccess(assertionsModule.arrayEquals,
		[[0, 1, 2], [0, 1, 2]]
	);
	yield assertFailure(assertionsModule.arrayEquals,
		[[0, 1, 2], [3, 4, 5], createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.arrayEqual,
		[[0, 1, 2], [0, 1, 2]]
	);
	yield assertFailure(assertionsModule.arrayEqual,
		[[0, 1, 2], [3, 4, 5], createRandomMessage()]
	);

	assert.equal(2, assertionsModule.successCount);
}

function testImplementsInstance()
{
	yield assertSuccess(assertionsModule.implementsInterface, [Ci.nsIDOMWindow, window]);
	yield assertSuccess(assertionsModule.implementsInterface, ['nsIDOMWindow', window]);
	yield assertFailure(assertionsModule.implementsInterface, [Ci.nsIDOMRange, window, createRandomMessage()]);
	yield assertFailure(assertionsModule.implementsInterface, ['nsIDOMRange', window, createRandomMessage()]);

	var jsObject = {
			QueryInterface : function(aIID) {
				if (aIID.equals(Ci.nsISupports) ||
					aIID.equals(Ci.nsIObserver))
					return this;
				throw Cr.NS_ERROR_NO_INTERFACE;
			}
		};
	yield assertSuccess(assertionsModule.implementsInterface, [Ci.nsIObserver, jsObject]);
	yield assertSuccess(assertionsModule.implementsInterface, ['nsIObserver', jsObject]);
	yield assertFailure(assertionsModule.implementsInterface, [Ci.nsIDOMWindow, jsObject, createRandomMessage()]);
	yield assertFailure(assertionsModule.implementsInterface, ['nsIDOMWindow', jsObject, createRandomMessage()]);
}

function testIsInstanceOf()
{
	yield assertSuccess(assertionsModule.isInstanceOf, [Ci.nsIDOMWindow, window]);
	yield assertSuccess(assertionsModule.isInstanceOf, ['nsIDOMWindow', window]);
	yield assertFailure(assertionsModule.isInstanceOf, [Ci.nsIDOMRange, window, createRandomMessage()]);
	yield assertFailure(assertionsModule.isInstanceOf, ['nsIDOMRange', window, createRandomMessage()]);

	yield assertSuccess(assertionsModule.isInstanceOf, [Array, []]);
	yield assertSuccess(assertionsModule.isInstanceOf, [Object, [], createRandomMessage()]);
	yield assertSuccess(assertionsModule.isInstanceOf, [Object, {}]);
	yield assertFailure(assertionsModule.isInstanceOf, [Array, {}, createRandomMessage()]);
	yield assertSuccess(assertionsModule.isInstanceOf, [Date, new Date()]);
	yield assertFailure(assertionsModule.isInstanceOf, [Date, {}, createRandomMessage()]);

	function MyClass() {}
	MyClass.prototype = { prop : true };
	yield assertSuccess(assertionsModule.isInstanceOf, [MyClass, new MyClass()]);
}

function testRaises()
{
	yield assertSuccess(assertionsModule.raises,
		['test', function() { throw 'test'; }, {}]
	);
	yield assertFailure(assertionsModule.raises,
		['test', function() { return true; }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.raise,
		['test', function() { throw new Error('test'); }, {}]
	);
	yield assertFailure(assertionsModule.raise,
		['test', function() { return true; }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.raise,
		[{ bool : true, number : 0 }, function() { throw { bool : true, number : 0, unknown : '' }; }, {}]
	);
	yield assertFailure(assertionsModule.raise,
		[{ bool : true, number : 0 }, function() { throw { bool : false, number : 1, unknown : '' }; }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.raise,
		[/RegExp/i, function() { throw new Error('regexp') }, {}]
	);
	yield assertFailure(assertionsModule.raise,
		[/RegExp/, function() { throw new Error('regexp') }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.raise,
		['SyntaxError', function() { eval('{'); }, {}]
	);
	yield assertSuccess(assertionsModule.raise,
		[SyntaxError, function() { eval('{'); }, {}]
	);

	yield assertSuccess(assertionsModule.raise,
		['NS_NOINTERFACE', function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);
	yield assertSuccess(assertionsModule.raise,
		[Components.results.NS_NOINTERFACE, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);
	yield assertSuccess(assertionsModule.raise,
		[/nointerface/i, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);

	yield assertSuccess(assertionsModule.notRaises,
		['test', function() { return true; }, {}]
	);
	yield assertSuccess(assertionsModule.notRaises,
		['test', function() { throw 'unknown'; }, {}]
	);
	yield assertFailure(assertionsModule.notRaises,
		['test', function() { throw 'test'; }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.notRaise,
		['test', function() { return true; }, {}]
	);
	yield assertSuccess(assertionsModule.notRaise,
		['test', function() { throw 'unknown'; }, {}]
	);
	yield assertFailure(assertionsModule.notRaise,
		['test', function() { throw new Error('test'); }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.notRaise,
		[{ bool : true, number : 0 }, function() { throw { bool : false, number : 1, unknown : '' }; }, {}]
	);
	yield assertFailure(assertionsModule.notRaise,
		[{ bool : true, number : 0 }, function() { throw { bool : true, number : 0, unknown : '' }; }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.notRaise,
		[/RegExp/, function() { throw new Error('regexp') }, {}]
	);
	yield assertFailure(assertionsModule.notRaise,
		[/RegExp/i, function() { throw new Error('regexp') }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.notRaise,
		['SyntaxError', function() { throw 'test'; }, {}]
	);
	yield assertFailure(assertionsModule.notRaise,
		['SyntaxError', function() { eval('{'); }, {}, createRandomMessage()]
	);
	yield assertFailure(assertionsModule.notRaise,
		[SyntaxError, function() { eval('{'); }, {}, createRandomMessage()]
	);
	yield assertSuccess(assertionsModule.notRaise,
		['NS_OK', function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);
	yield assertSuccess(assertionsModule.notRaise,
		[Components.results.NS_OK, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}]
	);
	yield assertFailure(assertionsModule.notRaise,
		['NS_NOINTERFACE', function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}, createRandomMessage()]
	);
	yield assertFailure(assertionsModule.notRaise,
		[Components.results.NS_NOINTERFACE, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}, createRandomMessage()]
	);
	yield assertFailure(assertionsModule.notRaise,
		[/nointerface/i, function() { window.QueryInterface(Ci.nsIDOMDocument) }, {}, createRandomMessage()]
	);

	assert.equal(18, assertionsModule.successCount);
}


// delta

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
	yield assertSuccess(assertionsModule.inDelta, [1.0, 1.1, 0.11]);
	assert.equals(0, inDeltaListener.events.length);
	yield assertSuccess(assertionsModule.inDelta, [1.0, 1.1, 0.1]);
	assert.equals(1, inDeltaListener.events.length);
	yield assertFailure(assertionsModule.inDelta, [1.0, 1.2, 0.1, createRandomMessage()]);
	assert.equals(1, inDeltaListener.events.length);

	yield assertSuccess(assertionsModule.inDelta, [1.0, 0.9, 0.11]);
	assert.equals(1, inDeltaListener.events.length);
	yield assertSuccess(assertionsModule.inDelta, [1.0, 0.9, 0.1]);
	assert.equals(2, inDeltaListener.events.length);
	yield assertFailure(assertionsModule.inDelta, [1.0, 0.8, 0.1, createRandomMessage()]);
	assert.equals(2, inDeltaListener.events.length);

	assert.equal(4, assertionsModule.successCount);
}

function testDifference()
{
	var count = { value : 0 };

	count.value = 0;
	yield assertSuccess(assertionsModule.difference, [
		(function() count.value ),
		1,
		(function () {
			count.value++;
		}),
		{}
	]);

	count.value = 0;
	yield assertSuccess(assertionsModule.difference, [
		count,
		'value',
		1,
		(function () {
			count.value++;
		}),
		{}
	]);


	count.value = 0;
	yield assertFailure(assertionsModule.difference, [
		(function() count.value ),
		-1,
		(function () {
			count.value++;
		}),
		{},
		createRandomMessage()
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
	var count = { value : 0 };

	count.value = 0;
	yield assertSuccess(assertionsModule.noDifference, [
		(function() count.value ),
		(function () {}),
		{}
	]);

	count.value = 0;
	yield assertSuccess(assertionsModule.noDifference, [
		count,
		'value',
		1,
		(function () {}),
		{}
	]);


	count.value = 0;
	yield assertFailure(assertionsModule.noDifference, [
		(function() count.value ),
		(function () {
			count.value++;
		}),
		{},
		createRandomMessage()
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
	yield assertSuccess(assertionsModule.compare, [10, '<', 20]);
	yield assertFailure(assertionsModule.compare, [10, '<', 5, createRandomMessage()]);
	yield assertFailure(assertionsModule.compare, [10, '<', 10, createRandomMessage()]);

	yield assertSuccess(assertionsModule.compare, [10, '<=', 20]);
	yield assertFailure(assertionsModule.compare, [10, '<=', 5, createRandomMessage()]);
	yield assertSuccess(assertionsModule.compare, [10, '<=', 10]);
	yield assertSuccess(assertionsModule.compare, [10, '=<', 20]);
	yield assertFailure(assertionsModule.compare, [10, '=<', 5, createRandomMessage()]);
	yield assertSuccess(assertionsModule.compare, [10, '=<', 10]);

	yield assertSuccess(assertionsModule.compare, [10, '>', 5]);
	yield assertFailure(assertionsModule.compare, [10, '>', 20, createRandomMessage()]);
	yield assertFailure(assertionsModule.compare, [10, '>', 10, createRandomMessage()]);

	yield assertSuccess(assertionsModule.compare, [10, '>=', 5]);
	yield assertFailure(assertionsModule.compare, [10, '>=', 20, createRandomMessage()]);
	yield assertSuccess(assertionsModule.compare, [10, '>=', 10]);
	yield assertSuccess(assertionsModule.compare, [10, '=>', 5]);
	yield assertFailure(assertionsModule.compare, [10, '=>', 20, createRandomMessage()]);
	yield assertSuccess(assertionsModule.compare, [10, '=>', 10]);

	assert.equal(10, assertionsModule.successCount);
}


// time

function testFinishesWithin()
{
	yield assertSuccess(
		assertionsModule.finishesWithin,
		[
			1000,
			function() {
				assert.isTrue(true);
			},
			{}
		]
	);
	var message = createRandomMessage();
	yield assertFailure(
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
	yield assertFailure(
		assertionsModule.finishesWithin,
		[
			10,
			function() {
				var startAt = Date.now();
				while (Date.now() - startAt < 50) {}
			},
			{},
			createRandomMessage()
		]
	);

	yield Do(assertionsModule.finishesWithin(
		1000,
		function() {
			yield 10;
		},
		{}
	));

	var exception;
	yield assertionsModule.finishesWithin(
		10,
		function() {
			yield 500;
		},
		{}
	)
	.catch(function(e) {
		exception = e;
	});
	assert.isDefined(exception);
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);

	assert.equal(2, assertionsModule.successCount);
}

function testFinishesOver()
{
	yield assertSuccess(
		assertionsModule.finishesOver,
		[
			50,
			function() {
				yield utils.wait(100);
				assert.isTrue(true);
			},
			{}
		]
	);
	var message = createRandomMessage();
	yield assertFailure(
		assertionsModule.finishesOver,
		[
			50,
			function() {
				yield utils.wait(100);
				assert.isTrue(false, message);
			},
			{},
			message
		]
	);
	yield assertFailure(
		assertionsModule.finishesOver,
		[
			1000,
			function() {
				assert.isTrue(true);
			},
			{},
			createRandomMessage()
		]
	);

	yield Do(assertionsModule.finishesOver(
		10,
		function() {
			yield 500;
		},
		{}
	));

	var exception;
	yield assertionsModule.finishesOver(
		500,
		function() {
			yield 10;
		},
		{}
	)
	.catch(function(e) {
		exception = e;
	});
	assert.isDefined(exception);
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);

	assert.equal(2, assertionsModule.successCount);
}


// count

function testAssertionsCount()
{
	yield assertFailure(assertionsModule.assertionsCountEquals, [
		1,
		function() {
		},
		{},
		createRandomMessage()
	], 0);
	yield assertSuccess(assertionsModule.assertionsCountEquals, [
		1,
		function() {
			assertionsModule.isTrue(true);
		},
		{}
	], 2);
	yield assertFailure(assertionsModule.assertionsCountEquals, [
		1,
		function() {
			assertionsModule.isTrue(true);
			assertionsModule.isTrue(true);
		},
		{},
		createRandomMessage()
	], 2);

	yield assertFailure(assertionsModule.assertionsMinCount, [
		1,
		function() {
		},
		{},
		createRandomMessage()
	], 0);
	yield assertSuccess(assertionsModule.assertionsMinCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
		},
		{}
	], 2);
	yield assertSuccess(assertionsModule.assertionsMinCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
			assertionsModule.isTrue(true);
		},
		{}
	], 3);

	yield assertSuccess(assertionsModule.assertionsMaxCount, [
		1,
		function() {
		},
		{}
	], 1);
	yield assertSuccess(assertionsModule.assertionsMaxCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
		},
		{}
	], 2);
	yield assertFailure(assertionsModule.assertionsMaxCount, [
		1,
		function() {
			assertionsModule.isTrue(true);
			assertionsModule.isTrue(true);
		},
		{},
		createRandomMessage()
	], 2);
}


// internal

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
	var f = function() {};
	assert.equals(f.toString() + ' (function)', assertionsModule._appendTypeString(f));
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
		yield assert.notRaises(
			'AssertionFailed',
			() => assertionsModule.validSuccessCount(aExpected, aMin, aMax),
			null
		);
	}
	function assertAssertValidSuccessCountFailed(aExpected, aMin, aMax)
	{
		yield assert.raises(
			'AssertionFailed',
			() => assertionsModule.validSuccessCount(aExpected, aMin, aMax),
			null
		);
	}

	yield assertAssertValidSuccessCountSucceeded(-1, -1, -1);

	// expected
	yield assertAssertValidSuccessCountFailed(1, -1, -1);
	yield assertAssertValidSuccessCountSucceeded(2, -1, -1);
	yield assertAssertValidSuccessCountFailed(3, -1, -1);

	// min
	yield assertAssertValidSuccessCountSucceeded(-1, 1, -1);
	yield assertAssertValidSuccessCountSucceeded(-1, 2, -1);
	yield assertAssertValidSuccessCountFailed(-1, 3, -1);

	// max
	yield assertAssertValidSuccessCountFailed(-1, -1, 1);
	yield assertAssertValidSuccessCountSucceeded(-1, -1, 2);
	yield assertAssertValidSuccessCountSucceeded(-1, -1, 3);
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
	assert.isFunction(namespace.assert.same);
	assert.isFunction(namespace.assert.notSame);
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
	assert.isFunction(namespace.assert.notFinishesWithin);
	assert.isFunction(namespace.assert.notFinishWithin);
	assert.isFunction(namespace.assert.finishesOver);
	assert.isFunction(namespace.assert.finishOver);
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
	assert.isFunction(namespace.assertSame);
	assert.isFunction(namespace.assertNotSame);
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
	assert.isFunction(namespace.assertNotFinishesWithin);
	assert.isFunction(namespace.assertNotFinishWithin);
	assert.isFunction(namespace.assertFinishesOver);
	assert.isFunction(namespace.assertFinishOver);
	assert.isFunction(namespace.assertOk);
	assert.isFunction(namespace.assertIs);
	assert.isFunction(namespace.assertAssertionsCountEquals);
	assert.isFunction(namespace.assertAssertionsCountEqual);
	assert.isFunction(namespace.assertAssertionsMinCount);
	assert.isFunction(namespace.assertAssertionsMaxCount);
	assert.isFunction(namespace.assertValidSuccessCount);
}
