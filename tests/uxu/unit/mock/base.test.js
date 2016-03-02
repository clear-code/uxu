utils.include('./common.inc.js');

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
	yield assertCallError(mock);
	yield assertCallAdded(mock, () => mock.expect(0));
	yield assertCallSuccess(mock, [0]);
	yield assertCallError(mock);

	yield assertCallAdded(mock, () => mock.expect(29));
	yield assertCallSuccess(mock, [29]);

	yield assertCallAdded(mock, () => mock.expect([29]));
	yield assertCallSuccess(mock, [29]);

	yield assertCallAdded(mock, () => mock.expect([29, 0]));
	yield assertCallSuccess(mock, [29, 0]);

	yield assertCallAdded(mock, () => mock.expect(29, true));
	yield assertCallSuccess(mock, [29], true);

	yield assertCallAdded(mock,
		() => mock.expect('string', () => 'returned'));
	yield assertCallSuccess(mock, ['string'], 'returned');

	yield assertCallAdded(mock, () => mock.expect(29));
	yield assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_functionMock_specialSpec()
{
	var mock = createFunctionMock();

	yield assertAnyCallAdded(mock,
		() => mock.expect(Mock.ANY));
	yield assertAnyCallSuccess(mock, [0]);
	yield assertAnyCallSuccess(mock, [29]);
	yield assertAnyCallSuccess(mock, ['string']);

	yield assertAnyCallAdded(mock,
		() => mock.expect(Mock.ANY, 29));
	yield assertAnyCallSuccess(mock, [0], 29);
	yield assertAnyCallSuccess(mock, [29], 29);
	yield assertAnyCallSuccess(mock, ['string'], 29);

	yield assertCallAdded(mock,
		() => mock.expect(Mock.ANY_ONETIME, 29));
	yield assertCallSuccess(mock, [0], 29);
	yield assertCallError(mock, [0]);

	yield assertCallAdded(mock,
		() => mock.expect(Mock.ANY_ONETIME, 'foobar'));
	yield assertCallSuccess(mock, [29], 'foobar');
	yield assertCallError(mock, [0]);

	yield assertCallAdded(mock,
		() => mock.expect(29, 'foobar'));
	yield assertCallSuccess(mock, [29], 'foobar');

	yield assertCallNotModified(mock,
		() => mock.expect(Mock.NEVER));
	yield assertCallError(mock, [0]);
}

function test_functionMock_expectThrows()
{
	var mock = createFunctionMock();
	var message = Date.now();

	yield assertCallNotModified(mock, function() {
		yield assert.raises(
			bundle.getString('mock_error_no_exception'),
			() => mock.expectThrows()
		);
	});
	yield assertCallNotModified(mock, function() {
		yield assert.raises(
			bundle.getString('mock_error_no_exception'),
			() => mock.expectThrows([])
		);
	});
	yield assertCallAdded(mock, function() {
		assert.notRaises(
			bundle.getString('mock_error_no_exception'),
			() => mock.expectThrows([], message)
		);
	});
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, [], message);
	});

	yield assertCallAdded(mock, function() {
		mock.expectThrows(29, message);
	});
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, [29], message);
	});

	yield assertCallAdded(mock,
		() => mock.expectThrows([29], message));
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, [29], message);
	});

	yield assertCallAdded(mock,
		() => mock.expectThrows([29, 0], message));
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, [29, 0], message);
	});

	yield assertCallAdded(mock,
		() => mock.expectThrows(29, Error, 'user defined error'));
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, [29], 'user defined error');
	});

	yield assertCallAdded(mock,
		() => mock.expectThrows(29, message));
	yield assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_functionMock_bindTo_success()
{
	var mock = createFunctionMock();
	var object = {};
	mock.expect([0]).boundTo(object);
	object.method = mock;
	yield assertCallRemoved(mock, () => object.method(0));
}

function test_functionMock_bindTo_fail()
{
	var mock = createFunctionMock();
	var object = {};
	mock.expect([0]).boundTo(object);
	yield assertCallRaise(mock, [0], 'AssertionFailed');
	object.method = mock;
	yield assertCallRaise(mock, [0], 'Error');
}

function test_functionMock_reset()
{
	var mock = createFunctionMock();
	mock.expect([1]);
	mock.expect([1]);
	yield assertCallSuccess(mock, [1]);
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);

	mock = createFunctionMock();
	mock.expect([1]);
	yield assertCallRaise(mock, [0], 'AssertionFailed');
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);

	mock = createFunctionMock();
	mock.expect([1]);
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);
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
	assert.equals('custom name',
		(new GetterMock('custom name'))._mock.name);
	var f = function NamedGetter() {};
	assert.equals('NamedGetter',
		(new GetterMock(f))._mock.name);
}

function test_getterMock_expect()
{
	var mock = createGetterMock();
	yield assertCallError(mock);
	yield assertCallAdded(mock, () => mock.expect(0));
	yield assertCallSuccess(mock, [], 0);
	yield assertCallError(mock);

	yield assertCallAdded(mock, () => mock.expect(29));
	yield assertCallSuccess(mock, [], 29);

	yield assertCallAdded(mock, () => mock.expect([29]));
	yield assertCallSuccess(mock, [], [29]);

	yield assertCallAdded(mock,
		() => mock.expect(() => 'returned'));
	yield assertCallSuccess(mock, [], 'returned');

	yield assertCallAdded(mock, () => mock.expect(29, true));
	yield assertCallSuccess(mock, [], [29]);
}

function test_getterMock_specialSpec()
{
	var mock = createGetterMock();

	yield assertAnyCallAdded(mock,
		() => mock.expect(Mock.ANY, true));
	yield assertAnyCallSuccess(mock, [], true);
	yield assertAnyCallSuccess(mock, [], true);

	yield assertAnyCallAdded(mock,
		() => mock.expect(Mock.ANY, false));
	yield assertAnyCallSuccess(mock, [], false);
	yield assertAnyCallSuccess(mock, [], false);

	yield assertCallAdded(mock,
		() => mock.expect(Mock.ANY_ONETIME, 29));
	yield assertCallSuccess(mock, [], 29);
	yield assertCallError(mock, []);

	yield assertCallNotModified(mock,
		() => mock.expect(Mock.NEVER));
	yield assertCallError(mock, []);
}

function test_getterMock_expectThrows()
{
	var mock = createGetterMock();
	var message = Date.now();

	yield assert.raises(
		bundle.getString('mock_error_no_exception'),
		() => mock.expectThrows()
	);
	yield assert.notRaises(
		bundle.getString('mock_error_no_exception'),
		() => mock.expectThrows(message)
	);
	yield assertCallRaise(mock, [], message);
}

function test_getterMock_bindTo()
{
	var mock = createGetterMock();
	var object = {};
	mock.expect(29).boundTo(object);
	yield assertCallRaise(mock, [], 'AssertionFailed');
	yield assertCallRaise(mock, [], 'Error');

	mock = createGetterMock();
	mock.expect(29).boundTo(object);
	object.__defineGetter__('property', mock);
	yield assertCallRemoved(mock,
		() => assert.equals(29, object.property));
}

function test_getterMock_assert()
{
	var mock = createGetterMock();
	mock.expect(0);
	mock.expect(0);
	mock();
	mock();
	yield assertSuccess(mock);

	mock = createGetterMock();
	mock.expect(0);
	mock.expect(0);
	mock();
	yield assertFail(mock);
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
	yield assertCallError(mock);
	yield assertCallAdded(mock, () => mock.expect(0));
	yield assertCallSuccess(mock, [0], 0);
	yield assertCallError(mock);

	yield assertCallAdded(mock, () => mock.expect(29));
	yield assertCallSuccess(mock, [29], 29);

	yield assertCallAdded(mock, () => mock.expect([29]));
	yield assertCallSuccess(mock, [[29]], [29]);

	yield assertCallAdded(mock, function() {
		mock.expect(29, true);
	});
	yield assertCallSuccess(mock, [29], true);

	yield assertCallAdded(mock,
		() => mock.expect('string', () => 'returned'));
	yield assertCallSuccess(mock, ['string'], 'returned');

	yield assertCallAdded(mock,
		() => mock.expect(29));
	yield assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_setterMock_specialSpec()
{
	var mock = createSetterMock();

	yield assertAnyCallAdded(mock,
		() => mock.expect(Mock.ANY));
	yield assertAnyCallSuccess(mock, [0]);
	yield assertAnyCallSuccess(mock, [29]);
	yield assertAnyCallSuccess(mock, ['string']);

	yield assertAnyCallAdded(mock,
		() => mock.expect(Mock.ANY, 29));
	yield assertAnyCallSuccess(mock, [0], 29);
	yield assertAnyCallSuccess(mock, [29], 29);
	yield assertAnyCallSuccess(mock, ['string'], 29);

	yield assertCallAdded(mock,
		() => mock.expect(Mock.ANY_ONETIME, 29));
	yield assertCallSuccess(mock, [0], 29);
	yield assertCallError(mock, [0]);

	yield assertCallAdded(mock,
		() => mock.expect(Mock.ANY_ONETIME, 'foobar'));
	yield assertCallSuccess(mock, [29], 'foobar');
	yield assertCallError(mock, [0]);

	yield assertCallAdded(mock,
		() => mock.expect(29, 'foobar'));
	yield assertCallSuccess(mock, [29], 'foobar');

	yield assertCallNotModified(mock,
		() => mock.expect(Mock.NEVER));
	yield assertCallError(mock, [0]);
}

function test_setterMock_expectThrows()
{
	var mock = createSetterMock();
	var message = Date.now();

	yield assert.raises(
		bundle.getString('mock_error_no_exception'),
		() => mock.expectThrows()
	);
	yield assert.raises(
		bundle.getString('mock_error_no_exception'),
		() => mock.expectThrows(message)
	);
	yield assert.notRaises(
		bundle.getString('mock_error_no_exception'),
		() => mock.expectThrows(null, message)
	);
	yield assertCallRaise(mock, [], message);

	yield assertCallAdded(mock,
		() => mock.expectThrows(29, message));
	yield assertCallRaise(mock, [29], message);

	yield assertCallAdded(mock,
		() => mock.expectThrows([29], message));
	yield assertCallRaise(mock, [29], message);

	yield assertCallAdded(mock,
		() => mock.expectThrows(29, Error, 'user defined error'));
	yield assertCallRaise(mock, [29], 'user defined error');

	yield assertCallAdded(mock,
		() => mock.expectThrows(29, message));
	yield assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_setterMock_bindTo()
{
	var mock = createSetterMock();
	var object = {};
	mock.expect(29).boundTo(object);
	yield assertCallRaise(mock, [], 'AssertionFailed');
	yield assertCallRaise(mock, [], 'Error');

	mock = createSetterMock();
	mock.expect(29).boundTo(object);
	object.__defineSetter__('property', mock);
	yield assertCallRemoved(mock,
		() => { object.property = 29 });
}

function test_setterMock_assert()
{
	var mock = createSetterMock();
	mock.expect(0);
	mock.expect(0);
	mock(0);
	mock(0);
	yield assertSuccess(mock);

	mock = createSetterMock();
	mock.expect(0);
	mock.expect(0);
	mock(0);
	yield assertFail(mock);
}


function test_createMockNativeObject()
{
	var mock = new Mock('document', content.document);
	yield assert.raises(
		bundle.getFormattedString(
			'mock_unexpected_call',
			['document', 'write', utils.inspect([0])]
		),
		() => mock.write(0)
	);
}

function test_createMockArray()
{
	var mock = new Mock('mock array', []);
	yield assert.raises(
		bundle.getFormattedString(
			'mock_unexpected_call',
			['mock array', 'slice', utils.inspect([0])]
		),
		() => mock.slice(0)
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
	var mock;
	function setUpMock()
	{
		mock = new Mock();
		yield assertCallAdded(mock,
			() => mock.expect('method'));
		yield assertCallAdded(mock,
			() => mock.expectThrows('error', [], 'error message'));
		yield assertCallAdded(mock,
			() => mock.expect('args', [0, 1, 2], true));
	}

	yield setUpMock();
	yield assert.raises('MultiplexError', () => mock.assert());
	yield assert.notRaises('MultiplexError', () => mock.assert());

	yield setUpMock();
	yield assert.notRaises(
		'Error',
		() => mock.method()
	);
	yield assert.raises(
		'error message',
		() => mock.error()
	);
	assert.isTrue(mock.args(0, 1, 2));
	yield assert.notRaises('MultiplexError', () => mock.assert());
}

function test_mockGetter()
{
	var mock;
	function setUpMock()
	{
		mock = new Mock();
		yield assertCallAdded(mock,
			() => mock.expectGetThrows('getterError', Error, 'error message'));
		yield assertCallAdded(mock,
			() => mock.expectGet('getterUndefined'));
		yield assertCallAdded(mock,
			() => mock.expectGet('getterArray', [0, 1, 2]));
	}

	yield setUpMock();
	yield assert.raises('MultiplexError', () => mock.assert());
	yield assert.notRaises('MultiplexError', () => mock.assert());

	yield setUpMock();
	yield assert.raises(
		'error message',
		function() { var value = mock.getterError; }
	);
	yield assert.notRaises(
		'Error',
		() => assert.isUndefined(mock.getterUndefined)
	);
	assert.equals([0, 1, 2], mock.getterArray);
	yield assert.notRaises('MultiplexError', () => mock.assert());
}

function test_mockSetter()
{
	var mock;
	function setUpMock()
	{
		mock = new Mock();
		yield assertCallAdded(mock,
			() => mock.expectSet('setterUndefined'));
		yield assertCallAdded(mock,
			() => mock.expectSet('setterArray', [0, 1, 2]));
	//	mock.expectSet('setterString', 'string', 'returned');
		yield assertCallAdded(mock,
			() => mock.expectSetThrows('setterError', 'error', Error, 'error message'));
	}

	yield setUpMock();
	yield assert.raises('MultiplexError', () => mock.assert());
	yield assert.notRaises('MultiplexError', () => mock.assert());

	yield setUpMock();
	mock.setterUndefined = void(0);
	assert.equals([0, 1, 2], mock.setterArray = [0, 1, 2]);
//	assert.equals('returned', mock.setterString = 'string');
	yield assert.raises(
		'error message',
		function() { mock.setterError = 'error'; }
	);
	yield assert.notRaises('MultiplexError', () => mock.assert());
}

function test_mockAccessOrder()
{
	var mock = new Mock();
	mock.expectGet('first');
	mock.expectGet('second');
	yield assert.raises(
		'AssertionFailed',
		() => mock.second
	);

	mock = new Mock();
	mock.expectSet('first');
	mock.expectSet('second');
	yield assert.raises(
		'AssertionFailed',
		function() { mock.second = true; }
	);

	mock = new Mock();
	mock.expect('first');
	mock.expect('second');
	yield assert.raises(
		'AssertionFailed',
		() => mock.second()
	);

	mock = new Mock();
	mock.expect('first');
	mock.expectGet('second');
	mock.expectSet('third');
	yield assert.raises(
		'AssertionFailed',
		function() { mock.third = true; }
	);
	yield assert.notRaises(
		'AssertionFailed',
		() => mock.second
	);
	yield assert.raises(
		'AssertionFailed',
		() => mock.first()
	);
}

function test_Mock_reset()
{
	var mock = new Mock();
	mock.expect('method', [0]);
	mock.expectGet('getter', true);
	mock.expectSet('setter', true, true);
	yield assert.raises(
		'AssertionFailed',
		() => mock.method()
	);
	yield assert.raises(
		'Error',
		() => mock.unknown()
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
	yield assert.raises(
		'AssertionFailed',
		() => object.method()
	);
	yield assert.raises(
		'Error',
		() => assert.equals('OK', object.method(0, 1))
	);

	Mock.expect(object, 'method', [2, 3], 'OK');
	assert.equals('OK', object.method(2, 3));
	yield assert.raises(
		'Error',
		() => object.method()
	);

	Mock.expectThrows(object, 'methodError', [4, 5], 'custom error');
	assert.isFunction(object.methodError);
	yield assert.raises(
		'AssertionFailed',
		() => object.methodError()
	);
	yield assert.raises(
		'Error',
		() => object.methodError(4, 5)
	);

	Mock.expectThrows(object, 'methodError', [4, 5], 'custom error');
	yield assert.raises(
		'custom error',
		() => object.methodError(4, 5)
	);
	yield assert.notRaises(
		'custom error',
		() => object.methodError()
	);
}

function test_Mock_getter()
{
	var object = {};

	Mock.expectGet(object, 'getter', 'OK');
	assert.isFunction(object.__lookupGetter__('getter'));
	assert.equals('OK', object.getter);
	yield assert.raises(
		'Error',
		() => object.getter
	);

	Mock.expectGetThrows(object, 'getterError', 'custom error');
	assert.isFunction(object.__lookupGetter__('getterError'));
	yield assert.raises(
		'custom error',
		() => object.getterError
	);
	yield assert.notRaises(
		'custom error',
		() => object.getterError
	);
}

function test_Mock_setter()
{
	var object = {};

	Mock.expectSet(object, 'setter', 29, 'OK');
	assert.isFunction(object.__lookupSetter__('setter'));
	yield assert.raises(
		'AssertionFailed',
		function() {
			object.setter = 290;
		}
	);
	// this raises "unexpected call" error, because the expected call was already processed by the previous access.
	yield assert.raises(
		'Error',
		function() {
			object.setter = 29;
		}
	);

	Mock.expectSet(object, 'setter', 290, 'OK');
	object.setter = 290;
	yield assert.raises(
		'Error',
		function() {
			object.setter = 290;
		}
	);

	Mock.expectSetThrows(object, 'setterError', 2900, 'custom error');
	assert.isFunction(object.__lookupSetter__('setterError'));
	yield assert.raises(
		'AssertionFailed',
		function() {
			object.setterError = 290;
		}
	);
	// this raises "unexpected call" error, because the expected call was already processed by the previous access.
	yield assert.raises(
		'Error',
		function() {
			object.setterError = 2900;
		}
	);

	Mock.expectSetThrows(object, 'setterError', 2900, 'custom error');
	yield assert.raises(
		'custom error',
		function() {
			object.setterError = 2900;
		}
	);
	// this raises "unexpected call" error, because the expected call was already processed by the previous access.
	yield assert.raises(
		'Error',
		function() {
			object.setterError = 2900;
		}
	);
}
