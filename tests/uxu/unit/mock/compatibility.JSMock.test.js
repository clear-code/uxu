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

function test_JSMockStyle()
{
	var mock = manager.createMock();

	mock.expects().methodWithoutArg();

	assert.equals([{ arguments   : [],
	                 returnValue : undefined }],
	              toExpectedCallParams(mock.methodWithoutArg._mock));

	yield assert.succeeds(function() {
		assert.isUndefined(mock.methodWithoutArg());
	});

	yield assert.succeeds(function() {
		mock.verify();
	});

	var stub = function() { stub.count++; };
	stub.count = 0;

	var typeDefinition = TypeOf.isA(String);

	mock.expects().methodWithArg(29).andReturn(290);
	mock.expects().methodWithArg(290).andThrow('my error');
	mock.expects().methodWithArg(2900).andStub(stub);
	mock.expects().methodWithArg(29000).andReturn(2.9).andStub(stub);
	mock.expects().methodWithArg(typeDefinition);

	assert.equals([{ arguments        : [29],
	                 returnValue      : 290 },
	               { arguments        : [290],
	                 exceptionClass   : 'my error',
	                 exceptionMessage : undefined },
	               { arguments        : [2900],
	                 returnValue      : undefined,
	                 handlers         : [stub] },
	               { arguments        : [29000],
	                 returnValue      : 2.9,
	                 handlers         : [stub] },
	               { arguments        : [typeDefinition],
	                 returnValue      : undefined }],
	              toExpectedCallParams(mock.methodWithArg._mock));

	yield assert.succeeds(function() {
		assert.equals(290, mock.methodWithArg(29));
		yield assert.raises('my error', function() { mock.methodWithArg(290); });
		mock.methodWithArg(2900);
		assert.equals(1, stub.count);
		assert.equals(2.9, mock.methodWithArg(29000));
		assert.equals(2, stub.count);
		mock.methodWithArg(new String('string'));
	});

	yield assert.succeeds(function() {
		mock.verify();
	});

	mock.expects().method();
	mock.reset();
	yield assert.succeeds(function() {
		mock.verify();
	});

	assert.raises('Error', function() {
		mock.unknown();
	});
	manager.reset();
	yield assert.succeeds(function() {
		mock.verify();
	});
}

function test_integrated()
{
	var controller = MockControl();
	var mock = controller.createMock();
	mock.expects().myMethod(10, 100).andReturn(1000);
	assert.equals(1000, mock.myMethod(10, 100));
}
