utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
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
