utils.include('./mock.inc.js');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
}


function createFunctionMock()
{
	var mock = new FunctionMock();
	assert.isFunction(mock);
	return mock;
}

function test_functionMock_name()
{
	assert.equals('custom name', (new FunctionMock('custom name'))._mock.name);
	var f = function NamedFunction() {};
	assert.equals('NamedFunction', (new FunctionMock(f))._mock.name);
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
	assertCallRaise(mock, [290], 'AssertionFailed');
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
	assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_functionMock_bindTo_success()
{
	var mock = createFunctionMock();
	var object = {};
	mock.expect([0]).boundTo(object);
	object.method = mock;
	assertCallRemoved(mock, function() {
		object.method(0);
	});
}

function test_functionMock_bindTo_fail()
{
	var mock = createFunctionMock();
	var object = {};
	mock.expect([0]).boundTo(object);
	assertCallRaise(mock, [0], 'AssertionFailed');
	object.method = mock;
	assertCallRaise(mock, [0], 'Error');
}

function test_functionMock_reset()
{
	var mock = createFunctionMock();
	mock.expect([1]);
	mock.expect([1]);
	assertCallSuccess(mock, [1]);
	mock.reset();
	mock.assert();
	assertCallError(mock, [0]);

	mock = createFunctionMock();
	mock.expect([1]);
	assertCallRaise(mock, [0], 'AssertionFailed');
	mock.reset();
	mock.assert();
	assertCallError(mock, [0]);

	mock = createFunctionMock();
	mock.expect([1]);
	mock.reset();
	mock.assert();
	assertCallError(mock, [0]);
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

function test_functionMock_addError()
{
	var mock = createFunctionMock();
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


function createGetterMock()
{
	var mock = new GetterMock();
	assert.isFunction(mock);
	return mock;
}

function test_getterMock_name()
{
	assert.equals('custom name', (new GetterMock('custom name'))._mock.name);
	var f = function NamedGetter() {};
	assert.equals('NamedGetter', (new GetterMock(f))._mock.name);
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

function test_getterMock_bindTo()
{
	var mock = createGetterMock();
	var object = {};
	mock.expect(29).boundTo(object);
	assertCallRaise(mock, [], 'AssertionFailed');
	assertCallRaise(mock, [], 'Error');

	mock = createGetterMock();
	mock.expect(29).boundTo(object);
	object.__defineGetter__('property', mock);
	assertCallRemoved(mock, function() {
		assert.equals(29, object.property);
	});
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

function test_setterMock_name()
{
	assert.equals('custom name', (new SetterMock('custom name'))._mock.name);
	var f = function NamedSetter() {};
	assert.equals('NamedSetter', (new SetterMock(f))._mock.name);
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

function test_setterMock_bindTo()
{
	var mock = createSetterMock();
	var object = {};
	mock.expect(29).boundTo(object);
	assertCallRaise(mock, [], 'AssertionFailed');
	assertCallRaise(mock, [], 'Error');

	mock = createSetterMock();
	mock.expect(29).boundTo(object);
	object.__defineSetter__('property', mock);
	assertCallRemoved(mock, function() {
		object.property = 29;
	});
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
	var mock = new Mock('window', window);
	assert.raises(
		bundle.getFormattedString(
			'mock_unexpected_call',
			['window', 'alert', utils.inspect([0])]
		),
		function() {
			mock.alert(0);
		}
	);

	mock = new Mock('mock array', []);
	assert.raises(
		bundle.getFormattedString(
			'mock_unexpected_call',
			['mock array', 'slice', utils.inspect([0])]
		),
		function() {
			mock.slice(0);
		}
	);
}

function test_mockName()
{
	assert.equals('custom name', (new Mock('custom name'))._name);
	assert.equals('Array', (new Mock(Array))._name);
	assert.equals('Object', (new Mock({}))._name);

	var mock = new Mock();
	mock.expect('method', true, true);
	assert.equals('method', mock.method._mock.name);
	mock.expectGet('getter', true);
	assert.equals('getter', mock.__lookupGetter__('getter')._mock.name);
	mock.expectSet('setter', true, false);
	assert.equals('setter', mock.__lookupSetter__('setter')._mock.name);
}

function test_mockMethod()
{
	function setUpMock()
	{
		var mock = new Mock();
		assertCallAdded(mock, function() {
			mock.expect('method');
		});
		assertCallAdded(mock, function() {
			mock.expectThrows('error', [], 'error message');
		});
		assertCallAdded(mock, function() {
			mock.expect('args', [0, 1, 2], true);
		});
		return mock;
	}

	var mock = setUpMock();
	assert.raises('MultiplexError', function() { mock.assert(); });
	assert.notRaises('MultiplexError', function() { mock.assert(); });

	mock = setUpMock();
	assert.notRaises(
		'Error',
		function() { mock.method(); }
	);
	assert.raises(
		'error message',
		function() { mock.error(); }
	);
	assert.isTrue(mock.args(0, 1, 2));
	assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_mockGetter()
{
	function setUpMock()
	{
		var mock = new Mock();
		assertCallAdded(mock, function() {
			mock.expectGetThrows('getterError', Error, 'error message');
		});
		assertCallAdded(mock, function() {
			mock.expectGet('getterUndefined');
		});
		assertCallAdded(mock, function() {
			mock.expectGet('getterArray', [0, 1, 2]);
		});
		return mock;
	}

	var mock = setUpMock();
	assert.raises('MultiplexError', function() { mock.assert(); });
	assert.notRaises('MultiplexError', function() { mock.assert(); });

	mock = setUpMock();
	assert.raises(
		'error message',
		function() { var value = mock.getterError; }
	);
	assert.notRaises(
		'Error',
		function() {
			assert.isUndefined(mock.getterUndefined);
		}
	);
	assert.equals([0, 1, 2], mock.getterArray);
	assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_mockSetter()
{
	function setUpMock()
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
		return mock;
	}

	var mock = setUpMock();
	assert.raises('MultiplexError', function() { mock.assert(); });
	assert.notRaises('MultiplexError', function() { mock.assert(); });

	mock = setUpMock();
	mock.setterUndefined = void(0);
	assert.equals([0, 1, 2], mock.setterArray = [0, 1, 2]);
//	assert.equals('returned', mock.setterString = 'string');
	assert.raises(
		'error message',
		function() { mock.setterError = 'error'; }
	);
	assert.notRaises('MultiplexError', function() { mock.assert(); });
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
	assert.notRaises(
		'AssertionFailed',
		function() { mock.second; }
	);
	assert.raises(
		'AssertionFailed',
		function() { mock.first(); }
	);
}

function test_Mock_reset()
{
	var mock = new Mock();
	mock.expect('method', [0]);
	mock.expectGet('getter', true);
	mock.expectSet('setter', true, true);
	assert.raises(
		'AssertionFailed',
		function() { mock.method(); }
	);
	assert.raises(
		'Error',
		function() { mock.unknown(); }
	);
	mock.reset();
	mock.assert();
}


function test_Mock_getMockFor()
{
	var object = {};
	var mock = Mock.getMockFor(object);
	assert.isInstanceOf(Mock, mock);
}

function test_Mock_addX()
{
	var object = {};
	Mock.addMethod(object, 'method');
	assert.isFunction(object.method);
	Mock.addGetter(object, 'getter');
	assert.isFunction(object.__lookupGetter__('getter'));
	Mock.addSetter(object, 'setter');
	assert.isFunction(object.__lookupSetter__('setter'));
}

function test_Mock_method()
{
	var object = {};

	Mock.expect(object, 'method', [0, 1], 'OK');
	assert.isFunction(object.method);
	assert.raises(
		'AssertionFailed',
		function() {
			object.method();
		}
	);
	assert.raises(
		'Error',
		function() {
			assert.equals('OK', object.method(0, 1));
		}
	);

	Mock.expect(object, 'method', [2, 3], 'OK');
	assert.equals('OK', object.method(2, 3));
	assert.raises(
		'Error',
		function() {
			object.method();
		}
	);

	Mock.expectThrows(object, 'methodError', [4, 5], 'custom error');
	assert.isFunction(object.methodError);
	assert.raises(
		'AssertionFailed',
		function() {
			object.methodError();
		}
	);
	assert.raises(
		'Error',
		function() {
			object.methodError(4, 5);
		}
	);

	Mock.expectThrows(object, 'methodError', [4, 5], 'custom error');
	assert.raises(
		'custom error',
		function() {
			object.methodError(4, 5);
		}
	);
	assert.notRaises(
		'custom error',
		function() {
			object.methodError();
		}
	);
}

function test_Mock_getter()
{
	var object = {};

	Mock.expectGet(object, 'getter', 'OK');
	assert.isFunction(object.__lookupGetter__('getter'));
	assert.equals('OK', object.getter);
	assert.raises(
		'Error',
		function() {
			object.getter;
		}
	);

	Mock.expectGetThrows(object, 'getterError', 'custom error');
	assert.isFunction(object.__lookupGetter__('getterError'));
	assert.raises(
		'custom error',
		function() {
			object.getterError;
		}
	);
	assert.notRaises(
		'custom error',
		function() {
			object.getterError;
		}
	);
}

function test_Mock_setter()
{
	var object = {};

	Mock.expectSet(object, 'setter', 29, 'OK');
	assert.isFunction(object.__lookupSetter__('setter'));
	assert.raises(
		'AssertionFailed',
		function() {
			object.setter = 290;
		}
	);
	// this raises "unexpected call" error, because the expected call was already processed by the previous access.
	assert.raises(
		'Error',
		function() {
			object.setter = 29;
		}
	);

	Mock.expectSet(object, 'setter', 290, 'OK');
	object.setter = 290;
	assert.raises(
		'Error',
		function() {
			object.setter = 290;
		}
	);

	Mock.expectSetThrows(object, 'setterError', 2900, 'custom error');
	assert.isFunction(object.__lookupSetter__('setterError'));
	assert.raises(
		'AssertionFailed',
		function() {
			object.setterError = 290;
		}
	);
	// this raises "unexpected call" error, because the expected call was already processed by the previous access.
	assert.raises(
		'Error',
		function() {
			object.setterError = 2900;
		}
	);

	Mock.expectSetThrows(object, 'setterError', 2900, 'custom error');
	assert.raises(
		'custom error',
		function() {
			object.setterError = 2900;
		}
	);
	// this raises "unexpected call" error, because the expected call was already processed by the previous access.
	assert.raises(
		'Error',
		function() {
			object.setterError = 2900;
		}
	);
}




function createHTTPServerMock()
{
	var mock = new HTTPServerMock();
	assert.isFunction(mock);
	return mock;
}

function test_HTTPServerMock_name()
{
	assert.equals('custom name', (new HTTPServerMock('custom name'))._mock.name);
	assert.equals(bundle.getString('server_mock_default_name'), (new HTTPServerMock())._mock.name);
}

function test_HTTPServerMock_formatReturnValue()
{
	var mock = createHTTPServerMock()._mock;
	assert.equals(
		{ uri : '', file : null, status : 0, statusText : '' },
		mock.formatReturnValue()
	);

	assert.equals(
		{ uri : '/actual', file : null, status : 200, statusText : '' },
		mock.formatReturnValue('/actual')
	);
	assert.equals(
		{ uri : '/actual', file : null, status : 200, statusText : '' },
		mock.formatReturnValue(200, '/actual')
	);
	assert.equals(
		{ uri : '/actual', file : null, status : 301, statusText : '' },
		mock.formatReturnValue('/actual', 301)
	);

	var file = utils.getFileFromURLSpec(baseURL);
	assert.equals(
		{ uri : '', file : file, status : 200, statusText : '' },
		mock.formatReturnValue(file)
	);
	assert.equals(
		{ uri : '/actual', file : file, status : 200, statusText : '' },
		mock.formatReturnValue(200, '/actual', file)
	);

	assert.equals(
		{ status : 404, file : file, path : '/actual', uri : '/actual', statusText : 'not found' },
		mock.formatReturnValue({ status : 404, file : file, path : '/actual', statusText : 'not found' })
	);
}

function test_HTTPServerMock_expect()
{
	var mock = createHTTPServerMock();
	assertCallError(mock);
	assertCallAdded(mock, function() {
		mock.expect('/');
	});
	assertCallSuccess(mock, ['/'],
		{ uri : '', file : null, status : 0, statusText : '' });
	assertCallError(mock);

	assertCallAdded(mock, function() {
		mock.expect('/expected');
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, ['/unexpected'], 'AssertionFailed');
	});

	mock = createHTTPServerMock();
	assertCallAdded(mock, function() {
		mock.expect(/FooBar/i, '/expected');
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, ['/foo'], 'AssertionFailed');
	});

	assertCallAdded(mock, function() {
		mock.expect(/FooBar/i, '/expected');
	});
	assertCallSuccess(mock, ['/foobar'],
		{ uri : '/expected', file : null, status : 200, statusText : '' });

	assertCallAdded(mock, function() {
		mock.expect(/([^\/]+)\.jpg/, '/images/jpeg/$1.jpg');
	});
	assertCallSuccess(mock, ['/files/photo.jpg?q=0123456'],
		{ uri : '/images/jpeg/photo.jpg', file : null, status : 200, statusText : '' });
}

function test_HTTPServerMock_specialSpec()
{
	var mock = createHTTPServerMock();

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY);
	});
	assertAnyCallSuccess(mock, ['/path1'], { uri : '/path1', file : null, status : 200, statusText : '' });
	assertAnyCallSuccess(mock, ['/path2'], { uri : '/path2', file : null, status : 200, statusText : '' });
	assertAnyCallSuccess(mock, ['/path3'], { uri : '/path3', file : null, status : 200, statusText : '' });

	assertAnyCallAdded(mock, function() {
		mock.expect(Mock.ANY, '/expected', 301);
	});
	assertAnyCallSuccess(mock, ['/path1'], { uri : '/expected', file : null, status : 301, statusText : '' });
	assertAnyCallSuccess(mock, ['/path2'], { uri : '/expected', file : null, status : 301, statusText : '' });
	assertAnyCallSuccess(mock, ['/path3'], { uri : '/expected', file : null, status : 301, statusText : '' });

	assertCallAdded(mock, function() {
		mock.expect(Mock.ANY_ONETIME, '/expected', 401);
	});
	assertCallSuccess(mock, ['/any'], { uri : '/expected', file : null, status : 401, statusText : '' });
	assertCallError(mock, ['/any']);

	assertCallNotModified(mock, function() {
		mock.expect(Mock.NEVER);
	});
	assertCallError(mock, ['/never']);
}

function test_HTTPServerMock_expectThrows()
{
	var mock = createHTTPServerMock();

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
				mock.expectThrows('/error')
			}
		);
	});
	assertCallAdded(mock, function() {
		assert.notRaises(
			bundle.getString('mock_error_no_exception'),
			function() {
				mock.expectThrows('/error', 502)
			}
		);
	});
	assertCallRemoved(mock, function() {
		assertCallSuccess(mock, ['/error'],
			{ uri : '', file : null, status : 502, statusText : '' });
	});

	assertCallAdded(mock, function() {
		mock.expectThrows(/errorpage/i, 503, 'some error');
	});
	assertCallRemoved(mock, function() {
		assertCallSuccess(mock, ['/ErrorPage'],
			{ uri : '', file : null, status : 503, statusText : 'some error' });
	});

	assertCallAdded(mock, function() {
		mock.expectThrows('/expected', 400);
	});
	assertCallRemoved(mock, function() {
		assertCallRaise(mock, ['/unexpected'], 'AssertionFailed');
	});
}

function test_HTTPServerMock_assert()
{
	var mock = createHTTPServerMock();
	mock.expect('/expect0');
	mock.expect('/expect1');
	mock('/expect0');
	mock('/expect1');
	assertSuccess(mock);

	mock = createHTTPServerMock();
	mock.expect('/expect0');
	mock.expect('/expect1');
	mock('/expect0');
	assertFail(mock);
}



function test_TypeOf_instance()
{
	assert.isInstanceOf(TypeOf, TypeOf.isA(Array));
	assert.isInstanceOf(TypeOf, new TypeOf(Array));
	assert.isInstanceOf(TypeOf, TypeOf(Array));
}

function test_TypeOf_assert()
{
	TypeOf('string').assert('primitive string', assert);
	TypeOf(String).assert(new String('string'), assert);
	TypeOf(Array).assert([0, 1, 2], assert);
	TypeOf(Ci.nsIDOMWindow).assert(window, assert);
	TypeOf({
		string : 'foo',
		array  : TypeOf(Array),
		object : TypeOf({ value : 'OK' })
	}).assert({
		string : 'foo',
		array  : [0, 1, 2],
		object : { value : 'OK', another : true },
		extra  : 'bar'
	}, assert);
}
