utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
}

function test_JSMockStyle()
{
	var manager = new MockManager();

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

function test_JsMockitoStyle()
{
	var manager = new MockManager();

	var mock = new Mock();
	yield assertCallAdded(mock, function() {
		manager.when(mock).methodWithoutArg();
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(29).thenReturn(290);
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(290).thenThrow('my error');
	});
	var count = 0;
	yield assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(2900).then(function() {
			count += 1;
		});
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(29000).thenReturn(2.9).then(function() {
			count += 10;
		});
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(Mock.prototype.ANY_ONETIME).thenReturn('ANY');
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
		mock.methodWithArg('anything');
	});

	mock.assert();
}

function test_JsMockitoStyle_withoutManager()
{
	var mock = new Mock();
	yield assertCallAdded(mock, function() {
		mock.when.methodWithoutArg();
	});
	yield assertCallAdded(mock, function() {
		mock.when.methodWithArg(29).thenReturn(290);
	});
	yield assertCallAdded(mock, function() {
		mock.when.methodWithArg(290).thenThrow('my error');
	});
	var count = 0;
	yield assertCallAdded(mock, function() {
		mock.when.methodWithArg(2900).then(function() {
			count += 1;
		});
	});
	yield assertCallAdded(mock, function() {
		mock.when.methodWithArg(29000).thenReturn(2.9).then(function() {
			count += 10;
		});
	});
	yield assertCallAdded(mock, function() {
		mock.when.methodWithArg(Mock.prototype.ANY_ONETIME).thenReturn('ANY');
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
		mock.methodWithArg('anything');
	});

	mock.assert();
}

function test_JsMockitoStyle_functionMock()
{
	var manager = new MockManager();
	var mock = new FunctionMock();

	yield assertCallAdded(mock, function() {
		manager.when(mock)();
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock)(29).thenReturn(290);
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock)(290).thenThrow('my error');
	});
	var count = 0;
	yield assertCallAdded(mock, function() {
		manager.when(mock)(2900).then(function() {
			count += 1;
		});
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock)(29000).thenReturn(2.9).then(function() {
			count += 10;
		});
	});

	yield assertCallRemoved(mock, function() {
		assert.isUndefined(mock());
	});
	yield assertCallRemoved(mock, function() {
		assert.equals(290, mock(29));
	});
	yield assertCallRemoved(mock, function() {
		yield assert.raises(
			'my error',
			function() {
				mock(290);
			}
		);
	});
	yield assertCallRemoved(mock, function() {
		mock(2900);
		assert.equals(1, count);
	});
	yield assertCallRemoved(mock, function() {
		assert.equals(2.9, mock(29000));
		assert.equals(11, count);
	});
}

function test_JsMockitoStyle_functionMock_withWrongContext()
{
	var manager = new MockManager();
	var mock = new FunctionMock();

	var context = {};
	yield assertCallAdded(mock, function() {
		manager.when(mock).call(context, 10).thenReturn('OK');
	});

	yield assertCallRaise(mock, [10], 'AssertionFailed');
}

function test_JsMockitoStyle_functionMock_withCorrectContext()
{
	var manager = new MockManager();
	var mock = new FunctionMock();

	var context = {};
	yield assertCallAdded(mock, function() {
		manager.when(mock).call(context, 10).thenReturn('OK');
	});
	yield assertCallAdded(mock, function() {
		manager.when(mock)(Mock.prototype.ANY_ONETIME).thenReturn('ANY');
	});

	yield assertCallRemoved(mock, function() {
		context.method = mock;
		context.method(10);
	});
	yield assertCallRemoved(mock, function() {
		mock('anything');
	});

	mock.assert();
}

function test_JsMockitoStyle_functionMock_withoutManager()
{
	var mock = new FunctionMock();

	yield assertCallAdded(mock, function() {
		mock.when();
	});
	yield assertCallAdded(mock, function() {
		mock.when(29).thenReturn(290);
	});
	yield assertCallAdded(mock, function() {
		mock.when(290).thenThrow('my error');
	});
	var count = 0;
	yield assertCallAdded(mock, function() {
		mock.when(2900).then(function() {
			count += 1;
		});
	});
	yield assertCallAdded(mock, function() {
		mock.when(29000).thenReturn(2.9).then(function() {
			count += 10;
		});
	});

	yield assertCallRemoved(mock, function() {
		assert.isUndefined(mock());
	});
	yield assertCallRemoved(mock, function() {
		assert.equals(290, mock(29));
	});
	yield assertCallRemoved(mock, function() {
		yield assert.raises(
			'my error',
			function() {
				mock(290);
			}
		);
	});
	yield assertCallRemoved(mock, function() {
		mock(2900);
		assert.equals(1, count);
	});
	yield assertCallRemoved(mock, function() {
		assert.equals(2.9, mock(29000));
		assert.equals(11, count);
	});
}

function test_JsMockitoStyle_functionMock_withoutManager_withWrongContext()
{
	var mock = new FunctionMock();

	var context = {};
	yield assertCallAdded(mock, function() {
		mock.when.call(context, 10).thenReturn('OK');
	});
	yield assertCallRaise(mock, [10], 'AssertionFailed');
}

function test_JsMockitoStyle_functionMock_withoutManager_withCorrectContext()
{
	var mock = new FunctionMock();

	var context = {};
	yield assertCallAdded(mock, function() {
		mock.when.call(context, 10).thenReturn('OK');
	});
	var context2 = { method : mock };
	yield assertCallAdded(mock, function() {
		context2.method.when(11).thenReturn('OK');
	});
	yield assertCallAdded(mock, function() {
		context2.method.when.call(context, 12).thenReturn('OK');
	});
	yield assertCallAdded(mock, function() {
		mock.when(Mock.prototype.ANY_ONETIME).thenReturn('ANY');
	});

	yield assertCallRemoved(mock, function() {
		context.method = mock;
		context.method(10);
	});
	yield assertCallRemoved(mock, function() {
		context2.method(11);
	});
	yield assertCallRemoved(mock, function() {
		context.method(12);
	});
	yield assertCallRemoved(mock, function() {
		mock('anything');
	});

	mock.assert();
}


function test_JsMockitoStyleMock_integrated()
{
	var mock = mockFunction('mock function');
	when(mock)(10, 100).thenReturn(1000);
	assert.equals(1000, mock(10, 100));
}

function test_JSMockStyleMock_integrated()
{
	var controller = MockControl();
	var mock = controller.createMock();
	mock.expects().myMethod(10, 100).andReturn(1000);
	assert.equals(1000, mock.myMethod(10, 100));
}
