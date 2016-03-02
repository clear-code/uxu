utils.include('./common.inc.js');

var mock;

function setUp()
{
	mock = new FunctionMock();
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
	assert.equals('custom name', (new FunctionMock('custom name'))._mock.name);
	var f = function NamedFunction() {};
	assert.equals('NamedFunction', (new FunctionMock(f))._mock.name);
}

function test_expect()
{
	mock.expect([])
		.expect('single')
		.expect(['array', 'args'])
		.expect([], 'retVal for no argument')
		.expect('single with retVal', 'retVal for single')
		.expect(['array with retVal'], 'retVal for array');

	assert.equals([{ arguments   : [],
	                 returnValue : undefined },
	               { arguments   : ['single'],
	                 returnValue : undefined },
	               { arguments   : ['array', 'args'],
	                 returnValue : undefined },
	               { arguments   : [],
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

	assert.equals([{ arguments        : [],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'message for no argument' },
	               { arguments        : ['single'],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'message for single' },
	               { arguments        : ['array', 'args'],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'message for array' }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_expectationChain()
{
	var context = { isContext: true };
	var stub = function() { return true; };
	var returner = () => 'returned';

	mock.when('simple')
		.thenReturn('simple value')
		.when('with context')
		.bindTo(context)
		.andStub(stub)
		.andReturn('with context value')
		.when('throw')
		.thenThrow(Error, 'throw error')
		.when('throw with context')
		.then(stub)
		.andBindTo(context)
		.andThrow(Error, 'with context error')
		.when('repeat')
		.thenReturn('repeat value')
		.times(2)
		.when('dynamic return value')
		.thenReturn(returner);

	assert.equals([{ arguments        : ['simple'],
	                 returnValue      : 'simple value' },
	               { arguments        : ['with context'],
	                 returnValue      : 'with context value',
	                 context          : context,
	                 handlers         : [stub] },
	               { arguments        : ['throw'],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'throw error' },
	               { arguments        : ['throw with context'],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'with context error',
	                 context          : context,
	                 handlers         : [stub] },
	               { arguments        : ['repeat'],
	                 returnValue      : 'repeat value' },
	               { arguments        : ['repeat'],
	                 returnValue      : 'repeat value' },
	               { arguments        : ['dynamic return value'],
	                 returnValue      : returner }],
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
	assert.equal('return 0', mock(0));
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
	yield assert.raises(/error 0/, function() { mock(0); });
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
	yield assert.notRaises('AssertionFailed', function() { mock(0); });
	yield assert.notRaises('AssertionFailed', function() { mock(0, 1, 2); });
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
	yield assert.raises('Error', function() { mock(); });
}


function test_runWithExpectedContext()
{
	var object = {};
	mock.expect([0]).boundTo(object);
	object.method = mock;
	yield assert.notRaises('AssertionFailed', function() { object.method(0); });
	yield assert.raises('Error', function() { object.method(0); });
}

function test_runWithUnexpectedContext()
{
	var object = { object: true };
	mock.expect([0]).boundTo(object);
	yield assert.raises('AssertionFailed', function() { mock.call(null, 0); });
	yield assert.raises('Error', function() { mock.call(null, 0); });
}


function test_resetAfterSuccess()
{
	mock.expect([1]);
	mock.expect([1]);
	yield assertCallSuccess(mock, [1]);
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);
}

function test_resetAfterFail()
{
	mock.expect([1]);
	yield assertCallRaise(mock, [0], 'AssertionFailed');
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);
}

function test_resetBeforeCall()
{
	mock.expect([1]);
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);
}

function test_assertSuccess()
{
	mock.expect([0]);
	mock.expect([1]);
	mock(0);
	mock(1);
	yield assertSuccess(mock);
}

function test_assertFail()
{
	mock.expect([0]);
	mock.expect([1]);
	mock(0);
	yield assertFail(mock);
}

function test_addError()
{
	var mockStack = String(mock._mock.stack);
	assert.equals([], mock.errors);
	assert.notEquals('', mockStack);

	var error = new Error('single error');
	var errorStack = String(error.stack);
	mock._mock.addError(error);
	assert.equals([error], mock.errors);
	assert.equals(errorStack + mockStack, mock.errors[0].stack);

	var errors = [
			new Error('multiplex error 1'),
			new Error('multiplex error 2')
		];
	var errorStacks = errors.map(function(aError) {
			return String(aError.stack);
		});
	mock._mock.addError(new MultiplexError(errors));
	assert.equals([error, errors[0], errors[1]], mock.errors);
	assert.equals(errorStacks[0] + mockStack, mock.errors[1].stack);
	assert.equals(errorStacks[1] + mockStack, mock.errors[2].stack);
}
