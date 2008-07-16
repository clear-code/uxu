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
	var done = false;
	try {
		aAssertion.apply(assertionsModule, aArgs);
		done = true;
	}
	catch(e) {
	}
	assert.isTrue(done);
}

assert.assertFailed = function(aAssertion, aArgs)
{
	var exception;
	var done = false;
	try {
		aAssertion.apply(assertionsModule, aArgs);
		done = true;
	}
	catch(e) {
		exception = e;
	}
	assert.isFalse(done);
	assert.equals(exception.name, 'AssertionFailed');
	assert.isTrue(exception.message.indexOf(aArgs[aArgs.length-1]) > -1);
}

function test_assertions()
{
	var message = Math.random() * 65000;

	assert.assertSucceed(assertionsModule.equals, [1, 1]);
	assert.assertFailed(assertionsModule.equals, [0, 1, message]);
	assert.assertSucceed(assertionsModule.equal, [1, 1]);
	assert.assertFailed(assertionsModule.equal, [0, 1, message]);

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
		assertionsModule.fail(0, 1, 2);
	}
	catch(e) {
		exception = e;
	}
	assert.isNotNull(exception);
	assert.equals('AssertionFailed', exception.name);
	assert.equals('2\n1\n0', exception.message);
}

function test_appendTypeString()
{
	var array = [
			true,
			0,
			'a',
			{},
			null,
			void(0),
			(function() {})
		];
	assert.arrayEquals(
		[
			'true (boolean)',
			'0 (number)',
			'a (string)',
			'[object Object] (object)',
			'null',
			'undefined',
			'function () {\n} (function)'
		],
		assertionsModule.appendTypeString(array)
	);
}
