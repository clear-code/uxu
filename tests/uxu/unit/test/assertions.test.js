var assertionsModule;

function setUp()
{
	assertionsModule = {};
	utils.include('../../../../content/uxu/test/assertions.js', assertionsModule);
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

function test_assertions()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.notEquals, [0, 1]);
	assert.assertFailed(assertionsModule.notEquals, [1, 1, message]);
	assert.assertSucceed(assertionsModule.notEqual, [0, 1]);
	assert.assertFailed(assertionsModule.notEqual, [1, 1, message]);

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
		['test', function() { throw 'text'; }, {}]
	);
	assert.assertFailed(assertionsModule.notRaises,
		['test', function() { throw 'test'; }, {}, message]
	);
	assert.assertSucceed(assertionsModule.notRaise,
		['test', function() { return true; }, {}]
	);
	assert.assertSucceed(assertionsModule.notRaise,
		['test', function() { throw 'text'; }, {}]
	);
	assert.assertFailed(assertionsModule.notRaise,
		['test', function() { throw 'test'; }, {}, message]
	);

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

function test_fail()
{
	var exception = null;
	try {
		assertionsModule.fail(0, 1, 2, 3, 4);
	}
	catch(e) {
		exception = e;
	}
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);
	assert.equals(0, exception.expected);
	assert.equals(1, exception.actual);
	assert.equals('4\n3\n2', exception.message);
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
