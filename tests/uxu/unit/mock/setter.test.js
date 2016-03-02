utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
	mock = new SetterMock();
}

function tearDown()
{
}


function test_isFunction()
{
	assert.isFunction(mock);
}

function test_name()
{
	assert.equals('custom name', (new SetterMock('custom name'))._mock.name);
	var f = function NamedSetter() {};
	assert.equals('NamedSetter', (new SetterMock(f))._mock.name);
}

function test_expect()
{
	mock.expect([])
		.expect('single')
		.expect(['array'])
		.expect([], 'retVal for no argument')
		.expect('single with retVal', 'retVal for single')
		.expect(['array with retVal'], 'retVal for array');

	assert.equals([{ arguments   : [[]],
	                 returnValue : [] },
	               { arguments   : ['single'],
	                 returnValue : 'single' },
	               { arguments   : ['array'],
	                 returnValue : ['array'] },
	               { arguments   : [[]],
	                 returnValue : 'retVal for no argument' },
	               { arguments   : ['single with retVal'],
	                 returnValue : 'retVal for single' },
	               { arguments   : ['array with retVal'],
	                 returnValue : 'retVal for array' }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_expectThrows()
{
	mock.expectThrows([], Error, 'message for no argument')
		.expectThrows('single', Error, 'message for single')
		.expectThrows(['array', 'args'], Error, 'message for array');

	assert.equals([{ arguments        : [[]],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'message for no argument' },
	               { arguments        : ['single'],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'message for single' },
	               { arguments        : [['array', 'args']],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'message for array' }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_expectationChainWithAnyOnetime()
{
	mock.when(Mock.ANY_ONETIME)
		.thenReturn('any onetime')
		.when('regular')
		.thenReturn('regular');

	assert.equals([{ arguments   : [Mock.ANY_ONETIME],
	                 returnValue : 'any onetime' },
	               { arguments   : ['regular'],
	                 returnValue : 'regular' }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_expectationChainWithAny()
{
	mock.when(Mock.ANY)
		.thenReturn('any');

	assert.equals([],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
	assert.equals({ arguments   : [Mock.ANY],
	                returnValue : 'any' },
	              mock._mock.anyCall.toParams());
}

function test_returnValue()
{
	mock.expect([0], 'return 0')
		.when('static')
		.thenReturn('static')
		.when('dynamic')
		.thenReturn(() => 'dynamic');
	assert.equal('return 0', mock([0]));
	assert.equal('static', mock('static'));
	assert.equal('dynamic', mock('dynamic'));
}

function test_throwError()
{
	mock.expectThrows([0], Error, 'error 0')
		.when('static')
		.thenThrow('static')
		.when('dynamic')
		.thenThrow(Error, 'dynamic');
	yield assert.raises(/error 0/, function() { mock([0]); });
	yield assert.raises(/static/, function() { mock('static'); });
	yield assert.raises(/dynamic/, function() { mock('dynamic'); });
}

function test_missingErrorDefinition()
{
	yield assert.raises(/Error/, function() { mock.expectThrows([0]); });
}

function test_expectedArgs()
{
	mock.expect([0])
		.expect([0, 1, 2]);
	yield assert.notRaises('AssertionFailed', function() { mock([0]); });
	yield assert.notRaises('AssertionFailed', function() { mock([0, 1, 2]); });
	yield assert.raises('Error', function() { mock(0); });
}

function test_unexpectedArgs()
{
	mock.expect([0]);
	yield assert.raises('AssertionFailed', function() { mock(1); });
	yield assert.raises('Error', function() { mock(1); });
}

function test_withAnyArg()
{
	mock.expect([Mock.ANY]);
	yield assert.notRaises('AssertionFailed', function() { mock(0); });
	yield assert.notRaises('AssertionFailed', function() { mock(1); });
}

function test_unexpectedRun()
{
	mock.expect([Mock.NEVER]);
	yield assert.raises('Error', function() { mock(0); });
}


function test_runWithExpectedContext()
{
	var object = {};
	mock.expect(0).boundTo(object);
	object.method = mock;
	yield assert.notRaises('AssertionFailed', function() { object.method(0); });
	yield assert.raises('Error', function() { object.method(0); });
}

function test_runWithUnexpectedContext()
{
	var object = { object: true };
	mock.expect(0).boundTo(object);
	yield assert.raises('AssertionFailed', function() { mock.call(null, 0); });
	yield assert.raises('Error', function() { mock.call(null, 0); });
}


function test_assertSuccess()
{
	mock.expect(0);
	mock.expect(0);
	mock(0);
	mock(0);
	yield assertSuccess(mock);
}

function test_assertFail()
{
	mock.expect(0);
	mock.expect(0);
	mock(0);
	yield assertFail(mock);
}
