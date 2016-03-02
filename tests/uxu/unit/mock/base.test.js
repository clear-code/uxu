utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
}


function test_createNativeObject()
{
	var mock = new Mock('document', content.document);
	yield assert.raises(
		bundle.getFormattedString(
			'mock_unexpected_call',
			['document', 'write', utils.inspect([0])]
		),
		function() { mock.write(0); }
	);
}

function test_createArray()
{
	var mock = new Mock('mock array', []);
	yield assert.raises(
		bundle.getFormattedString(
			'mock_unexpected_call',
			['mock array', 'slice', utils.inspect([0])]
		),
		function() { mock.slice(0); }
	);
}

function test_name()
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

function test_methodCalled()
{
	var mock = new Mock();
	mock.expect('method');
	mock.expect('args', [0, 1, 2], true);
	mock.expectThrows('error', [], 'error message');

	yield assert.notRaises(
		'Error',
		function() { mock.method(); }
	);
	assert.isTrue(mock.args(0, 1, 2));
	yield assert.raises(
		'error message',
		function() { mock.error(); }
	);
	yield assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_methodNotCalled()
{
	var mock = new Mock();
	mock.expect('method');
	mock.expect('args', [0, 1, 2], true);
	mock.expectThrows('error', [], 'error message');

	yield assert.raises('MultiplexError', function() { mock.assert(); });
	yield assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_getterAccessed()
{
	var mock = new Mock();
	mock.expectGetThrows('getterError', Error, 'error message');
	mock.expectGet('getterUndefined');
	mock.expectGet('getterArray', [0, 1, 2]);

	yield assert.raises(
		'error message',
		function() { var value = mock.getterError; }
	);
	yield assert.notRaises(
		'Error',
		function() { assert.isUndefined(mock.getterUndefined); }
	);
	assert.equals([0, 1, 2], mock.getterArray);
	yield assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_getterNotAccessed()
{
	var mock = new Mock();
	mock.expectGetThrows('getterError', Error, 'error message');
	mock.expectGet('getterUndefined');
	mock.expectGet('getterArray', [0, 1, 2]);

	yield assert.raises('MultiplexError', function() { mock.assert(); });
	yield assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_setterAccessed()
{
	var mock = new Mock();
	mock.expectSet('setterUndefined');
	mock.expectSet('setterArray', [0, 1, 2]);
	mock.expectSetThrows('setterError', 'error', Error, 'error message');

	mock.setterUndefined = void(0);
	assert.equals([0, 1, 2], mock.setterArray = [0, 1, 2]);
	yield assert.raises(
		'error message',
		function() { mock.setterError = 'error'; }
	);
	yield assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_setterNotAccessed()
{
	var mock = new Mock();
	mock.expectSet('setterUndefined');
	mock.expectSet('setterArray', [0, 1, 2]);
	mock.expectSetThrows('setterError', 'error', Error, 'error message');
	yield assert.raises('MultiplexError', function() { mock.assert(); });
	yield assert.notRaises('MultiplexError', function() { mock.assert(); });
}

function test_accessOrder()
{
	var mock = new Mock();
	mock.expectGet('first');
	mock.expectGet('second');
	yield assert.raises(
		'AssertionFailed',
		function() { mock.second; }
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
		function() { mock.second(); }
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
		function() { mock.second; }
	);
	yield assert.raises(
		'AssertionFailed',
		function() { mock.first(); }
	);
}

function test_reset()
{
	var mock = new Mock();
	mock.expect('method', [0]);
	mock.expectGet('getter', true);
	mock.expectSet('setter', true, true);
	yield assert.raises(
		'AssertionFailed',
		function() { mock.method(); }
	);
	yield assert.raises(
		'Error',
		function() { mock.unknown(); }
	);
	mock.reset();
	mock.assert();
}


function test_getMockFor()
{
	var object = {};
	var mock = Mock.getMockFor(object);
	assert.isInstanceOf(Mock, mock);
}

function test_addX()
{
	var object = {};
	Mock.addMethod(object, 'method');
	assert.isFunction(object.method);
	Mock.addGetter(object, 'getter');
	assert.isFunction(object.__lookupGetter__('getter'));
	Mock.addSetter(object, 'setter');
	assert.isFunction(object.__lookupSetter__('setter'));
}

function test_method()
{
	var object = {};

	Mock.expect(object, 'method', [0, 1], 'OK');
	assert.isFunction(object.method);
	yield assert.raises(
		'AssertionFailed',
		function() { object.method(); }
	);
	yield assert.raises(
		'Error',
		function() { assert.equals('OK', object.method(0, 1)); }
	);

	Mock.expect(object, 'method', [2, 3], 'OK');
	assert.equals('OK', object.method(2, 3));
	yield assert.raises(
		'Error',
		function() { object.method(); }
	);

	Mock.expectThrows(object, 'methodError', [4, 5], 'custom error');
	assert.isFunction(object.methodError);
	yield assert.raises(
		'AssertionFailed',
		function() { object.methodError(); }
	);
	yield assert.raises(
		'Error',
		function() { object.methodError(4, 5); }
	);

	Mock.expectThrows(object, 'methodError', [4, 5], 'custom error');
	yield assert.raises(
		'custom error',
		function() { object.methodError(4, 5); }
	);
	yield assert.notRaises(
		'custom error',
		function() { object.methodError(); }
	);
}

function test_getter()
{
	var object = {};

	Mock.expectGet(object, 'getter', 'OK');
	assert.isFunction(object.__lookupGetter__('getter'));
	assert.equals('OK', object.getter);
	yield assert.raises(
		'Error',
		function() { object.getter; }
	);

	Mock.expectGetThrows(object, 'getterError', 'custom error');
	assert.isFunction(object.__lookupGetter__('getterError'));
	yield assert.raises(
		'custom error',
		function() { object.getterError; }
	);
	yield assert.notRaises(
		'custom error',
		function() { object.getterError; }
	);
}

function test_setter()
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
