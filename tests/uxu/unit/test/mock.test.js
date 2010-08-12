var topDir = baseURL+'../../../../';

var ns = utils.import(topDir+'modules/test/mock.js', {});
var MockManager = ns.MockManager;
var Mock = ns.Mock;
var FunctionMock = ns.FunctionMock;
var GetterMock = ns.GetterMock;
var SetterMock = ns.SetterMock;
var TypeOf = ns.TypeOf;

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
}

function assertSuccess(aMock)
{
	assert.notRaises(
		'AssertionFailed',
		function() {
			aMock.assert();
		}
	);
}

function assertFail(aMock)
{
	assert.raises(
		'AssertionFailed',
		function() {
			aMock.assert();
		}
	);
}

function assertCallSuccess(aMock, aArguments, aReturnValue)
{
	assertCallRemoved(aMock, function() {
		var returnValue;
		assert.notRaises(
			'Error',
			function() {
				returnValue = aMock.apply(null, aArguments || []);
			}
		);
		assert.equals(aReturnValue, returnValue);
	});
}

function assertAnyCallSuccess(aMock, aArguments, aReturnValue)
{
	assertCallNotModified(aMock, function() {
		var returnValue;
		assert.notRaises(
			'Error',
			function() {
				returnValue = aMock.apply(null, aArguments || []);
			}
		);
		assert.equals(aReturnValue, returnValue);
	});
}

function assertCallRaise(aMock, aArguments, aException)
{
	assert.raises(
		aException,
		function() {
			aMock.apply(null, aArguments || []);
		}
	);
}

function assertCallError(aMock, aArguments)
{
	assertCallRaise(aMock, aArguments, 'Error');
}

function assertCallAdded(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	assert.difference(
		function() (aMock.expectedCalls || aMock.__expectedCalls).length,
		1,
		aTask
	);
}

function assertAnyCallAdded(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	assert.noDifference(
		function() (aMock.expectedCalls || aMock.__expectedCalls).length,
		aTask
	);
	assert.isNotNull(aMock.anyCall);
}

function assertCallRemoved(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	assert.difference(
		function() (aMock.expectedCalls || aMock.__expectedCalls).length,
		-1,
		aTask
	);
}

function assertCallNotModified(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	assert.noDifference(
		function() (aMock.expectedCalls || aMock.__expectedCalls).length,
		aTask
	);
}


function createFunctionMock()
{
	var mock = new FunctionMock();
	assert.isFunction(mock);
	return mock;
}

function test_functionMock_expect()
{
	var mock = createFunctionMock();
	assertCallError(mock);
	assertCallAdded(mock, function() {
		mock.expect(0);
	});
	assertCallSuccess(mock, [0]);
	assertCallError(mock);

	assertCallAdded(mock, function() {
		mock.expect(29);
	});
	assertCallSuccess(mock, [29]);

	assertCallAdded(mock, function() {
		mock.expect([29]);
	});
	assertCallSuccess(mock, [29]);

	assertCallAdded(mock, function() {
		mock.expect([29, 0]);
	});
	assertCallSuccess(mock, [29, 0]);

	assertCallAdded(mock, function() {
		mock.expect(29, true);
	});
	assertCallSuccess(mock, [29], true);

	assertCallAdded(mock, function() {
		mock.expect('string', function() { return 'returned' });
	});
	assertCallSuccess(mock, ['string'], 'returned');

	assertCallAdded(mock, function() {
		mock.expect(29);
	});
	assertCallNotModified(mock, function() {
		assertCallRaise(mock, [290], 'AssertionFailed');
	});
}

function test_functionMock_specialSpec()
{
	var mock = createFunctionMock();

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY);
	});
	assertAnyCallSuccess(mock, [0]);
	assertAnyCallSuccess(mock, [29]);
	assertAnyCallSuccess(mock, ['string']);

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY, 29);
	});
	assertAnyCallSuccess(mock, [0], 29);
	assertAnyCallSuccess(mock, [29], 29);
	assertAnyCallSuccess(mock, ['string'], 29);

	assertCallAdded(mock, function() {
		mock.expect(Mock.ANY_ONETIME, 29);
	});
	assertCallSuccess(mock, [0], 29);
	assertCallError(mock, [0]);

	assertCallAdded(mock, function() {
		mock.expect(Mock.ANY_ONETIME, 'foobar');
	});
	assertCallSuccess(mock, [29], 'foobar');
	assertCallError(mock, [0]);

	assertCallAdded(mock, function() {
		mock.expect(29, 'foobar');
	});
	assertCallSuccess(mock, [29], 'foobar');

	assertCallNotModified(mock, function() {
		mock.expect(Mock.NEVER);
	});
	assertCallError(mock, [0]);
}

function test_functionMock_expectThrows()
{
	var mock = createFunctionMock();
	var message = Date.now();

	assertCallNotModified(mock, function() {
		assert.raises(
			bundle.getString('mock_error_no_exception'),
			function() {
				mock.expectThrows()
			}
		);
	});
	assertCallNotModified(mock, function() {
		assert.raises(
			bundle.getString('mock_error_no_exception'),
			function() {
				mock.expectThrows([])
			}
		);
	});
	assertCallAdded(mock, function() {
		assert.notRaises(
			bundle.getString('mock_error_no_exception'),
			function() {
				mock.expectThrows([], message)
			}
		);
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, [], message);
	});

	assertCallAdded(mock, function() {
		mock.expectThrows(29, message);
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, [29], message);
	});

	assertCallAdded(mock, function() {
		mock.expectThrows([29], message);
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, [29], message);
	});

	assertCallAdded(mock, function() {
		mock.expectThrows([29, 0], message);
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, [29, 0], message);
	});

	assertCallAdded(mock, function() {
		mock.expectThrows(29, Error, 'user defined error');
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, [29], 'user defined error');
	});

	assertCallAdded(mock, function() {
		mock.expectThrows(29, message);
	});
	assertCallNotModified(mock, function() {
		assertCallRaise(mock, [290], 'AssertionFailed');
	});
}

function test_functionMock_assert()
{
	var mock = createFunctionMock();
	mock.expect([0]);
	mock.expect([1]);
	mock(0);
	mock(1);
	assertSuccess(mock);

	mock = createFunctionMock();
	mock.expect([0]);
	mock.expect([1]);
	mock(0);
	assertFail(mock);
}


function createGetterMock()
{
	var mock = new GetterMock();
	assert.isFunction(mock);
	return mock;
}

function test_getterMock_expect()
{
	var mock = createGetterMock();
	assertCallError(mock);
	assertCallAdded(mock, function() {
		mock.expect(0);
	});
	assertCallSuccess(mock, [], 0);
	assertCallError(mock);

	assertCallAdded(mock, function() {
		mock.expect(29);
	});
	assertCallSuccess(mock, [], 29);

	assertCallAdded(mock, function() {
		mock.expect([29]);
	});
	assertCallSuccess(mock, [], [29]);

	assertCallAdded(mock, function() {
		mock.expect(function() { return 'returned' });
	});
	assertCallSuccess(mock, [], 'returned');

	assertCallAdded(mock, function() {
		mock.expect(29, true);
	});
	assertCallSuccess(mock, [], [29]);
}

function test_getterMock_specialSpec()
{
	var mock = createGetterMock();

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY, true);
	});
	assertAnyCallSuccess(mock, [], true);
	assertAnyCallSuccess(mock, [], true);

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY, false);
	});
	assertAnyCallSuccess(mock, [], false);
	assertAnyCallSuccess(mock, [], false);

	assertCallAdded(mock, function() {
		mock.expect(Mock.ANY_ONETIME, 29);
	});
	assertCallSuccess(mock, [], 29);
	assertCallError(mock, []);

	assertCallNotModified(mock, function() {
		mock.expect(Mock.NEVER);
	});
	assertCallError(mock, []);
}

function test_getterMock_expectThrows()
{
	var mock = createGetterMock();
	var message = Date.now();

	assert.raises(
		bundle.getString('mock_error_no_exception'),
		function() {
			mock.expectThrows()
		}
	);
	assert.notRaises(
		bundle.getString('mock_error_no_exception'),
		function() {
			mock.expectThrows(message)
		}
	);
	assertCallRaise(mock, [], message);
}

function test_getterMock_assert()
{
	var mock = createGetterMock();
	mock.expect(0);
	mock.expect(0);
	mock();
	mock();
	assertSuccess(mock);

	mock = createGetterMock();
	mock.expect(0);
	mock.expect(0);
	mock();
	assertFail(mock);
}


function createSetterMock()
{
	var mock = new SetterMock();
	assert.isFunction(mock);
	return mock;
}

function test_setterMock_expect()
{
	var mock = createSetterMock();
	assertCallError(mock);
	assertCallAdded(mock, function() {
		mock.expect(0);
	});
	assertCallSuccess(mock, [0], 0);
	assertCallError(mock);

	assertCallAdded(mock, function() {
		mock.expect(29);
	});
	assertCallSuccess(mock, [29], 29);

	assertCallAdded(mock, function() {
		mock.expect([29]);
	});
	assertCallSuccess(mock, [[29]], [29]);

	assertCallAdded(mock, function() {
		mock.expect(29, true);
	});
	assertCallSuccess(mock, [29], true);

	assertCallAdded(mock, function() {
		mock.expect('string', function() { return 'returned' });
	});
	assertCallSuccess(mock, ['string'], 'returned');

	assertCallAdded(mock, function() {
		mock.expect(29);
	});
	assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_setterMock_specialSpec()
{
	var mock = createSetterMock();

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY);
	});
	assertAnyCallSuccess(mock, [0]);
	assertAnyCallSuccess(mock, [29]);
	assertAnyCallSuccess(mock, ['string']);

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY, 29);
	});
	assertAnyCallSuccess(mock, [0], 29);
	assertAnyCallSuccess(mock, [29], 29);
	assertAnyCallSuccess(mock, ['string'], 29);

	assertCallAdded(mock, function() {
		mock.expect(Mock.ANY_ONETIME, 29);
	});
	assertCallSuccess(mock, [0], 29);
	assertCallError(mock, [0]);

	assertCallAdded(mock, function() {
		mock.expect(Mock.ANY_ONETIME, 'foobar');
	});
	assertCallSuccess(mock, [29], 'foobar');
	assertCallError(mock, [0]);

	assertCallAdded(mock, function() {
		mock.expect(29, 'foobar');
	});
	assertCallSuccess(mock, [29], 'foobar');

	assertCallNotModified(mock, function() {
		mock.expect(Mock.NEVER);
	});
	assertCallError(mock, [0]);
}

function test_setterMock_expectThrows()
{
	var mock = createSetterMock();
	var message = Date.now();

	assert.raises(
		bundle.getString('mock_error_no_exception'),
		function() {
			mock.expectThrows()
		}
	);
	assert.raises(
		bundle.getString('mock_error_no_exception'),
		function() {
			mock.expectThrows(message)
		}
	);
	assert.notRaises(
		bundle.getString('mock_error_no_exception'),
		function() {
			mock.expectThrows(null, message)
		}
	);
	assertCallRaise(mock, [], message);

	assertCallAdded(mock, function() {
		mock.expectThrows(29, message);
	});
	assertCallRaise(mock, [29], message);

	assertCallAdded(mock, function() {
		mock.expectThrows([29], message);
	});
	assertCallRaise(mock, [29], message);

	assertCallAdded(mock, function() {
		mock.expectThrows(29, Error, 'user defined error');
	});
	assertCallRaise(mock, [29], 'user defined error');

	assertCallAdded(mock, function() {
		mock.expectThrows(29, message);
	});
	assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_setterMock_assert()
{
	var mock = createSetterMock();
	mock.expect(0);
	mock.expect(0);
	mock(0);
	mock(0);
	assertSuccess(mock);

	mock = createSetterMock();
	mock.expect(0);
	mock.expect(0);
	mock(0);
	assertFail(mock);
}


function test_createMock()
{
	var mock = new Mock(window);
	assert.isFunction(mock.alert);

	mock = new Mock([]);
	assert.raises(
		bundle.getFormattedString(
			'mock_unexpected_call',
			['slice', utils.inspect([0])]
		),
		function() {
			mock.slice(0);
		}
	);
}

function test_mockMethod()
{
	var mock = new Mock();
	assertCallAdded(mock, function() {
		mock.expect('method');
	});
	assertCallAdded(mock, function() {
		mock.expect('args', [0, 1, 2], true);
	});
	assertCallAdded(mock, function() {
		mock.expectThrows('error', [], 'error message');
	});
	assertFail(mock);
	assert.notRaises(
		'Error',
		function() { mock.method(); }
	);
	assert.isTrue(mock.args(0, 1, 2));
	assert.raises(
		'error message',
		function() { mock.error(); }
	);
	assertSuccess(mock);
}

function test_mockGetter()
{
	var mock = new Mock();
	assertCallAdded(mock, function() {
		mock.expectGet('getterUndefined');
	});
	assertCallAdded(mock, function() {
		mock.expectGet('getterArray', [0, 1, 2]);
	});
	assertCallAdded(mock, function() {
		mock.expectGetThrows('getterError', Error, 'error message');
	});
	assertFail(mock);
	assert.notRaises(
		'Error',
		function() {
			assert.isUndefined(mock.getterUndefined);
		}
	);
	assert.equals([0, 1, 2], mock.getterArray);
	assert.raises(
		'error message',
		function() { var value = mock.getterError; }
	);
	assertSuccess(mock);
}

function test_mockSetter()
{
	var mock = new Mock();
	assertCallAdded(mock, function() {
		mock.expectSet('setterUndefined');
	});
	assertCallAdded(mock, function() {
		mock.expectSet('setterArray', [0, 1, 2]);
	});
//	mock.expectSet('setterString', 'string', 'returned');
	assertCallAdded(mock, function() {
		mock.expectSetThrows('setterError', 'error', Error, 'error message');
	});
	assertFail(mock);
	assert.notRaises(
		'Error',
		function() {
			mock.setterUndefined = void(0);
		}
	);
	assert.equals([0, 1, 2], mock.setterArray = [0, 1, 2]);
//	assert.equals('returned', mock.setterString = 'string');
	assert.raises(
		'error message',
		function() { mock.setterError = 'error'; }
	);
	assertSuccess(mock);
}

function test_mockAccessOrder()
{
	var mock = new Mock();
	mock.expectGet('first');
	mock.expectGet('second');
	assert.raises(
		'AssertionFailed',
		function() { mock.second; }
	);

	mock = new Mock();
	mock.expectSet('first');
	mock.expectSet('second');
	assert.raises(
		'AssertionFailed',
		function() { mock.second = true; }
	);

	mock = new Mock();
	mock.expect('first');
	mock.expect('second');
	assert.raises(
		'AssertionFailed',
		function() { mock.second(); }
	);

	mock = new Mock();
	mock.expect('first');
	mock.expectGet('second');
	mock.expectSet('third');
	assert.raises(
		'AssertionFailed',
		function() { mock.third = true; }
	);
	assert.raises(
		'AssertionFailed',
		function() { mock.second; }
	);
	assert.notRaises(
		'AssertionFailed',
		function() { mock.first(); }
	);
}

function test_TypeOf()
{
	assert.isInstanceOf(TypeOf, TypeOf.isA(Array));
	assert.isInstanceOf(TypeOf, new TypeOf(Array));
	assert.isInstanceOf(TypeOf, TypeOf(Array));
}

function test_JSMockStyle()
{
	var mock = new Mock();
	assertCallAdded(mock, function() {
		mock.expects().methodWithoutArg();
	});
	assertCallAdded(mock, function() {
		mock.expects().methodWithArg(29).andReturn(290);
	});
	assertCallAdded(mock, function() {
		mock.expects().methodWithArg(290).andThrow('my error');
	});
	var count = 0;
	assertCallAdded(mock, function() {
		mock.expects().methodWithArg(2900).andStub(function() {
			count += 1;
		});
	});
	assertCallAdded(mock, function() {
		mock.expects().methodWithArg(29000).andReturn(2.9).andStub(function() {
			count += 10;
		});
	});
	assertCallAdded(mock, function() {
		mock.expects().methodWithArg(TypeOf.isA(String));
	});
	assertCallAdded(mock, function() {
		mock.expects().methodWithArg(TypeOf(Array));
	});

	assertCallRemoved(mock, function() {
		assert.isUndefined(mock.methodWithoutArg());
	});
	assertCallRemoved(mock, function() {
		assert.equals(290, mock.methodWithArg(29));
	});
	assertCallRemoved(mock, function() {
		assert.raises(
			'my error',
			function() {
				mock.methodWithArg(290);
			}
		);
	});
	assertCallRemoved(mock, function() {
		mock.methodWithArg(2900);
		assert.equals(1, count);
	});
	assertCallRemoved(mock, function() {
		assert.equals(2.9, mock.methodWithArg(29000));
		assert.equals(11, count);
	});
	assertCallRemoved(mock, function() {
		mock.methodWithArg(new String('string'));
	});
	assertCallRemoved(mock, function() {
		mock.methodWithArg(new Array(3));
	});

	mock.assert();
}

function test_JsMockitoStyle()
{
	var manager = new MockManager();

	var mock = new Mock();
	assertCallAdded(mock, function() {
		manager.when(mock).methodWithoutArg();
	});
	assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(29).thenReturn(290);
	});
	assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(290).thenThrow('my error');
	});
	var count = 0;
	assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(2900).then(function() {
			count += 1;
		});
	});
	assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(29000).thenReturn(2.9).then(function() {
			count += 10;
		});
	});
	assertCallAdded(mock, function() {
		manager.when(mock).methodWithArg(Mock.prototype.ANY_ONETIME).thenReturn('ANY');
	});

	assertCallRemoved(mock, function() {
		assert.isUndefined(mock.methodWithoutArg());
	});
	assertCallRemoved(mock, function() {
		assert.equals(290, mock.methodWithArg(29));
	});
	assertCallRemoved(mock, function() {
		assert.raises(
			'my error',
			function() {
				mock.methodWithArg(290);
			}
		);
	});
	assertCallRemoved(mock, function() {
		mock.methodWithArg(2900);
		assert.equals(1, count);
	});
	assertCallRemoved(mock, function() {
		assert.equals(2.9, mock.methodWithArg(29000));
		assert.equals(11, count);
	});
	assertCallRemoved(mock, function() {
		mock.methodWithArg('anything');
	});

	mock.assert();
}

function test_JsMockitoStyle_functionMock()
{
	var manager = new MockManager();
	var mock = new FunctionMock();

	assertCallAdded(mock, function() {
		manager.when(mock)();
	});
	assertCallAdded(mock, function() {
		manager.when(mock)(29).thenReturn(290);
	});
	assertCallAdded(mock, function() {
		manager.when(mock)(290).thenThrow('my error');
	});
	var count = 0;
	assertCallAdded(mock, function() {
		manager.when(mock)(2900).then(function() {
			count += 1;
		});
	});
	assertCallAdded(mock, function() {
		manager.when(mock)(29000).thenReturn(2.9).then(function() {
			count += 10;
		});
	});
	assertCallAdded(mock, function() {
		manager.when(mock)(Mock.prototype.ANY_ONETIME).thenReturn('ANY');
	});

	assertCallRemoved(mock, function() {
		assert.isUndefined(mock());
	});
	assertCallRemoved(mock, function() {
		assert.equals(290, mock(29));
	});
	assertCallRemoved(mock, function() {
		assert.raises(
			'my error',
			function() {
				mock(290);
			}
		);
	});
	assertCallRemoved(mock, function() {
		mock(2900);
		assert.equals(1, count);
	});
	assertCallRemoved(mock, function() {
		assert.equals(2.9, mock(29000));
		assert.equals(11, count);
	});
	assertCallRemoved(mock, function() {
		mock('anything');
	});

	mock.assert();
}
