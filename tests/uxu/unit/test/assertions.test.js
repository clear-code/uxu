var assertionsModule;

function setUp()
{
	assertionsModule = {};
	utils.include('../../../../content/uxu/test/assertions.js', assertionsModule);
}

function tearDown()
{
}

function assertAssertion(aAssertion, aSuccessArgs, aFailureArg)
{
	var done, exception;

	done = false;
	try {
		aAssertion.apply(assertionsModule, aSuccessArgs);
		done = true;
	}
	catch(e) {
	}
	assert.isTrue(done);

	done = false;
	try {
		aAssertion.apply(assertionsModule, aFailureArg);
		done = true;
	}
	catch(e) {
		exception = e;
	}
	assert.isFalse(done);
	assert.equals(exception.name, 'AssertionFailed');
	assert.isTrue(exception.message.indexOf(aFailureArg[aFailureArg.length-1]) > -1);
}

function test_assertions()
{
	var message = Math.random() * 65000;
	assertAssertion(assertionsModule.equals, [1, 1], [0, 1, message]);
	assertAssertion(assertionsModule.equal, [1, 1], [0, 1, message]);
	assertAssertion(assertionsModule.notEquals, [0, 1], [1, 1, message]);
	assertAssertion(assertionsModule.notEqual, [0, 1], [1, 1, message]);
	assertAssertion(assertionsModule.isTrue, [true], [false, message]);
	assertAssertion(assertionsModule.isDefined, [true], [void(0), message]);
	assertAssertion(assertionsModule.isDefined, [false], [void(0), message]);
	assertAssertion(assertionsModule.isDefined, [0], [void(0), message]);
	assertAssertion(assertionsModule.isDefined, [null], [void(0), message]);
	assertAssertion(assertionsModule.isUndefined, [void(0)], [true, message]);
	assertAssertion(assertionsModule.isUndefined, [void(0)], [false, message]);
	assertAssertion(assertionsModule.isUndefined, [void(0)], [0, message]);
	assertAssertion(assertionsModule.isUndefined, [void(0)], [null, message]);
	assertAssertion(assertionsModule.isNull, [null], [true, message]);
	assertAssertion(assertionsModule.isNull, [null], [false, message]);
	assertAssertion(assertionsModule.isNull, [null], [0, message]);
	assertAssertion(assertionsModule.isNull, [null], [void(0), message]);
	assertAssertion(assertionsModule.isNotNull, [true], [null, message]);
	assertAssertion(assertionsModule.isNotNull, [false], [null, message]);
	assertAssertion(assertionsModule.isNotNull, [0], [null, message]);
	assertAssertion(assertionsModule.isNotNull, [void(0)], [null, message]);
	assertAssertion(assertionsModule.raises,
		['test', function() { throw 'test'; }, {}],
		['test', function() { return true; }, {}, message]
	);
	assertAssertion(assertionsModule.raise,
		['test', function() { throw 'test'; }, {}],
		['test', function() { return true; }, {}, message]
	);
	assertAssertion(assertionsModule.matches,
		[/te[sx]t/, 'test'],
		[/te[sx]t/, 'tent', message]
	);
	assertAssertion(assertionsModule.match,
		[/te[sx]t/, 'test'],
		[/te[sx]t/, 'tent', message]
	);
	assertAssertion(assertionsModule.pattern,
		['test', /te[sx]t/],
		['tent', /te[sx]t/, message]
	);
	assertAssertion(assertionsModule.notPattern,
		['tent', /te[sx]t/],
		['test', /te[sx]t/, message]
	);
	assertAssertion(assertionsModule.arrayEquals,
		[[0, 1, 2], [0, 1, 2]],
		[[0, 1, 2], [3, 4, 5], message]
	);
	assertAssertion(assertionsModule.arrayEqual,
		[[0, 1, 2], [0, 1, 2]],
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
