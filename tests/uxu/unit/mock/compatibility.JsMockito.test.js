utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
	manager = new MockManager();
}

function tearDown()
{
}

function test_successCases()
{
	var mock = new Mock();

	manager.when(mock).methodWithoutArg();
	mock.when.methodWithoutArg();
	assert.equals([{ arguments   : [],
	                 returnValue : undefined },
	               { arguments   : [],
	                 returnValue : undefined }],
	              toExpectedCallParams(mock.methodWithoutArg._mock));
	yield assert.succeeds(function() {
		assert.isUndefined(mock.methodWithoutArg());
		assert.isUndefined(mock.methodWithoutArg());
	});

	manager.when(mock).methodWithArg(29).thenReturn(290);
	mock.when.methodWithArg(30).thenReturn(291);
	assert.equals([{ arguments   : [29],
	                 returnValue : 290 },
	               { arguments   : [30],
	                 returnValue : 291 }],
	              toExpectedCallParams(mock.methodWithArg._mock));
	yield assert.succeeds(function() {
		assert.equals(290, mock.methodWithArg(29));
		assert.equals(291, mock.methodWithArg(30));
	});

	manager.when(mock).methodWillRaise(290).thenThrow('my error');
	mock.when.methodWillRaise(291).thenThrow('my error without manager');
	assert.equals([{ arguments        : [290],
	                 exceptionClass   : 'my error',
	                 exceptionMessage : undefined },
	               { arguments        : [291],
	                 exceptionClass   : 'my error without manager',
	                 exceptionMessage : undefined }],
	              toExpectedCallParams(mock.methodWillRaise._mock));
	yield assert.raises('my error', function() {
		mock.methodWillRaise(290);
	});
	yield assert.raises('my error without manager', function() {
		mock.methodWillRaise(291);
	});

	var stub = function() { stub.count++; };
	stub.count = 0;
	manager.when(mock).methodWithStub(2900).then(stub);
	mock.when.methodWithStub(2901).then(stub);
	assert.equals([{ arguments   : [2900],
	                 returnValue : undefined,
	                 handlers    : [stub] },
	               { arguments   : [2901],
	                 returnValue : undefined,
	                 handlers    : [stub] }],
	              toExpectedCallParams(mock.methodWithStub._mock));
	yield assert.succeeds(function() {
		assert.isUndefined(mock.methodWithStub(2900));
		assert.isUndefined(mock.methodWithStub(2901));
		assert.equals(2, stub.count);
	});

	stub.count = 0;
	manager.when(mock).methodWithStub(29000).thenReturn(2.9).then(stub);
	mock.when.methodWithStub(29001).thenReturn(29).then(stub);
	assert.equals([{ arguments   : [29000],
	                 returnValue : 2.9,
	                 handlers    : [stub] },
	               { arguments   : [29001],
	                 returnValue : 29,
	                 handlers    : [stub] }],
	              toExpectedCallParams(mock.methodWithStub._mock));
	yield assert.succeeds(function() {
		assert.equals(2.9, mock.methodWithStub(29000));
		assert.equals(29, mock.methodWithStub(29001));
		assert.equals(2, stub.count);
	});

	manager.when(mock).methodAcceptsAnyArg(Mock.ANY_ONETIME).thenReturn('ANY ONETIME');
	assert.equals([{ arguments   : [Mock.ANY_ONETIME],
	                 returnValue : 'ANY ONETIME' }],
	              toExpectedCallParams(mock.methodAcceptsAnyArg._mock));
	yield assert.succeeds(function() {
		assert.equals('ANY ONETIME', mock.methodAcceptsAnyArg('anything'));
	});

	mock.when.methodAcceptsAnyArgWithoutManager(Mock.ANY_ONETIME).thenReturn('ANY ONETIME');
	assert.equals([{ arguments   : [Mock.ANY_ONETIME],
	                 returnValue : 'ANY ONETIME' }],
	              toExpectedCallParams(mock.methodAcceptsAnyArgWithoutManager._mock));
	yield assert.succeeds(function() {
		assert.equals('ANY ONETIME', mock.methodAcceptsAnyArgWithoutManager('anything'));
	});

	manager.when(mock).methodAcceptsAnyArgForever(Mock.ANY).thenReturn('ANY');
	assert.equals([],
	              toExpectedCallParams(mock.methodAcceptsAnyArgForever._mock));
	assert.equals({ arguments   : [Mock.ANY],
	                returnValue : 'ANY' },
	              toParamsWithoutInternalHandlers(mock.methodAcceptsAnyArgForever._mock.anyCall));
	yield assert.succeeds(function() {
		assert.equals('ANY', mock.methodAcceptsAnyArgForever('anything'));
		assert.equals('ANY', mock.methodAcceptsAnyArgForever(2900));
	});

	mock.when.methodAcceptsAnyArgForeverWithoutManager(Mock.ANY).thenReturn('ANY');
	assert.equals([],
	              toExpectedCallParams(mock.methodAcceptsAnyArgForeverWithoutManager._mock));
	assert.equals({ arguments   : [Mock.ANY],
	                returnValue : 'ANY' },
	              toParamsWithoutInternalHandlers(mock.methodAcceptsAnyArgForeverWithoutManager._mock.anyCall));
	yield assert.succeeds(function() {
		assert.equals('ANY', mock.methodAcceptsAnyArgForeverWithoutManager('anything'));
		assert.equals('ANY', mock.methodAcceptsAnyArgForeverWithoutManager(2900));
	});

	yield assert.success(function() { mock.assert(); });
}

function test_failCases()
{
	var mock = new Mock();

	manager.when(mock).methodAcceptsAnyArg(Mock.ANY_ONETIME).thenReturn('ANY ONETIME');
	assert.equals('ANY ONETIME', mock.methodAcceptsAnyArg('anything'));
	yield assert.raises(/Error/, function() {
		mock.methodAcceptsAnyArg(2900);
	});

	mock.when.methodAcceptsAnyArgWithoutManager(Mock.ANY_ONETIME).thenReturn('ANY ONETIME');
	assert.equals('ANY ONETIME', mock.methodAcceptsAnyArgWithoutManager('anything'));
	yield assert.raises(/Error/, function() {
		mock.methodAcceptsAnyArgWithoutManager(2901);
	});

	yield assert.raises(/Error/, function() {
		mock.assert();
	});
}

function test_functionMock()
{
	var mock = new FunctionMock();

	manager.when(mock)();
	mock.when();
	manager.when(mock)(29).thenReturn(290);
	mock.when(30).thenReturn(291);
	manager.when(mock)(290).thenThrow('my error');
	mock.when(291).thenThrow('my error without manager');
	var stub = function() { stub.count++; };
	manager.when(mock)(2900).then(stub);
	mock.when(2901).then(stub);
	manager.when(mock)(29000).thenReturn(2.9).then(stub);
	mock.when(29001).thenReturn(29).then(stub);

	assert.equals([{ arguments        : [],
	                 returnValue      : undefined },
	               { arguments        : [],
	                 returnValue      : undefined },
	               { arguments        : [29],
	                 returnValue      : 290 },
	               { arguments        : [30],
	                 returnValue      : 291 },
	               { arguments        : [290],
	                 exceptionClass   : 'my error',
	                 exceptionMessage : undefined },
	               { arguments        : [291],
	                 exceptionClass   : 'my error without manager',
	                 exceptionMessage : undefined },
	               { arguments        : [2900],
	                 returnValue      : undefined,
	                 handlers         : [stub] },
	               { arguments        : [2901],
	                 returnValue      : undefined,
	                 handlers         : [stub] },
	               { arguments        : [29000],
	                 returnValue      : 2.9,
	                 handlers         : [stub] },
	               { arguments        : [29001],
	                 returnValue      : 29,
	                 handlers         : [stub] }],
	              toExpectedCallParams(mock._mock));

	yield assert.succeeds(function() {
		assert.isUndefined(mock());
		assert.isUndefined(mock());
		assert.equals(290, mock(29));
		assert.equals(291, mock(30));
		yield assert.raises('my error', function() { mock(290); });
		yield assert.raises('my error without manager', function() { mock(291); });
		mock(2900);
		mock(2901);
		assert.equals(2.9, mock(29000));
		assert.equals(29, mock(29001));
	});

	yield assert.succeeds(function() {
		mock.assert();
	});
}

function test_functionMock_withContext()
{
	var mock = new FunctionMock();
	var context = {};

	manager.when(mock).call(context, 10).thenReturn('10');
	manager.when(mock).call(context, Mock.ANY_ONETIME).thenReturn('ANY');
	assert.equals([{ arguments        : [10],
	                 returnValue      : '10',
	                 context          : context },
	               { arguments        : [Mock.ANY_ONETIME],
	                 returnValue      : 'ANY',
	                 context          : context }],
	              toExpectedCallParams(mock._mock));
	yield assert.succeeds(function() {
		context.method = mock;
		context.method(10);
		context.method('anything');
	});

	yield assert.succeeds(function() {
		mock.assert();
	});
}

function test_integrated()
{
	var mock = mockFunction('mock function');
	when(mock)(10, 100).thenReturn(1000);
	assert.equals(1000, mock(10, 100));
}
