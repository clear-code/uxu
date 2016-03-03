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
	yield assertCallAdded(mock, function() {
		mock.expects().methodWithoutArg();
	});
	yield assertCallAdded(mock, function() {
		mock.expects().methodWithArg(29).andReturn(290);
	});
	yield assertCallAdded(mock, function() {
		mock.expects().methodWithArg(290).andThrow('my error');
	});
	var count = 0;
	yield assertCallAdded(mock, function() {
		mock.expects().methodWithArg(2900).andStub(function() {
			count += 1;
		});
	});
	yield assertCallAdded(mock, function() {
		mock.expects().methodWithArg(29000).andReturn(2.9).andStub(function() {
			count += 10;
		});
	});
	yield assertCallAdded(mock, function() {
		mock.expects().methodWithArg(TypeOf.isA(String));
	});

	yield assertCallRemoved(mock, function() {
		assert.isUndefined(mock.methodWithoutArg());
	});
	yield assertCallRemoved(mock, function() {
		assert.equals(290, mock.methodWithArg(29));
	});
	yield assertCallRemoved(mock, function() {
		yield assert.raises(
			'my error',
			function() {
				mock.methodWithArg(290);
			}
		);
	});
	yield assertCallRemoved(mock, function() {
		mock.methodWithArg(2900);
		assert.equals(1, count);
	});
	yield assertCallRemoved(mock, function() {
		assert.equals(2.9, mock.methodWithArg(29000));
		assert.equals(11, count);
	});
	yield assertCallRemoved(mock, function() {
		mock.methodWithArg(new String('string'));
	});

	mock.verify();

	mock.expects().method();
	mock.reset();
	mock.verify();

	assert.raises('Error', function() {
		mock.unknown();
	});
	manager.reset();
	manager.verify();
}

function test_integrated()
{
	var controller = MockControl();
	var mock = controller.createMock();
	mock.expects().myMethod(10, 100).andReturn(1000);
	assert.equals(1000, mock.myMethod(10, 100));
}
