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
	var returnValue;
	assert.notRaises(
		'Error',
		function() {
			returnValue = aMock.apply(null, aArguments || []);
		}
	);
	assert.equals(aReturnValue, returnValue);
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
	mock.expect(0);
	assertCallSuccess(mock, [0]);
	assertCallError(mock);

	mock.expect(29);
	assertCallSuccess(mock, [29]);

	mock.expect([29]);
	assertCallSuccess(mock, [29]);

	mock.expect([29, 0]);
	assertCallSuccess(mock, [29, 0]);

	mock.expect(29, true);
	assertCallSuccess(mock, [29], true);

	mock.expect('string', function() { return 'returned' });
	assertCallSuccess(mock, ['string'], 'returned');

	mock.expect(29);
	assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_functionMock_expectAny()
{
	var mock = createFunctionMock();

	mock.expect(Mock.ANY);
	assertCallSuccess(mock, [0]);
	assertCallSuccess(mock, [29]);
	assertCallSuccess(mock, ['string']);

	mock.expect(Mock.ANY, 29);
	assertCallSuccess(mock, [0], 29);
	assertCallSuccess(mock, [29], 29);
	assertCallSuccess(mock, ['string'], 29);

	mock.expect(Mock.ANY_ONETIME, 29);
	assertCallSuccess(mock, [0], 29);
	assertCallError(mock, [0]);

	mock.expect(Mock.ANY_ONETIME, 'foobar');
	assertCallSuccess(mock, [29], 'foobar');
	assertCallError(mock, [0]);

	mock.expect(29, 'foobar');
	assertCallSuccess(mock, [29], 'foobar');
}

function test_functionMock_expectThrows()
{
	var mock = createFunctionMock();
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
			mock.expectThrows([])
		}
	);
	assert.notRaises(
		bundle.getString('mock_error_no_exception'),
		function() {
			mock.expectThrows([], message)
		}
	);
	assertCallRaise(mock, [], message);

	mock.expectThrows(29, message);
	assertCallRaise(mock, [29], message);

	mock.expectThrows([29], message);
	assertCallRaise(mock, [29], message);

	mock.expectThrows([29, 0], message);
	assertCallRaise(mock, [29, 0], message);

	mock.expectThrows(29, Error, 'user defined error');
	assertCallRaise(mock, [29], 'user defined error');

	mock.expectThrows(29, message);
	assertCallRaise(mock, [290], 'AssertionFailed');
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
	mock.expect(0);
	assertCallSuccess(mock, [0]);
	assertCallError(mock);

	mock.expect(29);
	assertCallSuccess(mock, [], 29);

	mock.expect([29]);
	assertCallSuccess(mock, [], [29]);

	mock.expect(function() { return 'returned' });
	assertCallSuccess(mock, [], 'returned');

	mock.expect(29, true);
	assertCallSuccess(mock, [], [29]);
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
	mock.expect(0);
	assertCallSuccess(mock, [0], 0);
	assertCallError(mock);

	mock.expect(29);
	assertCallSuccess(mock, [29], 29);

	mock.expect([29]);
	assertCallSuccess(mock, [[29]], [29]);

	mock.expect(29, true);
	assertCallSuccess(mock, [29], true);

	mock.expect('string', function() { return 'returned' });
	assertCallSuccess(mock, ['string'], 'returned');

	mock.expect(29);
	assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_setterMock_expectAny()
{
	var mock = createSetterMock();

	mock.expect(Mock.ANY);
	assertCallSuccess(mock, [0]);
	assertCallSuccess(mock, [29]);
	assertCallSuccess(mock, ['string']);

	mock.expect(Mock.ANY, 29);
	assertCallSuccess(mock, [0], 29);
	assertCallSuccess(mock, [29], 29);
	assertCallSuccess(mock, ['string'], 29);

	mock.expect(Mock.ANY_ONETIME, 29);
	assertCallSuccess(mock, [0], 29);
	assertCallError(mock, [0]);

	mock.expect(Mock.ANY_ONETIME, 'foobar');
	assertCallSuccess(mock, [29], 'foobar');
	assertCallError(mock, [0]);

	mock.expect(29, 'foobar');
	assertCallSuccess(mock, [29], 'foobar');
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

	mock.expectThrows(29, message);
	assertCallRaise(mock, [29], message);

	mock.expectThrows([29], message);
	assertCallRaise(mock, [29], message);

	mock.expectThrows(29, Error, 'user defined error');
	assertCallRaise(mock, [29], 'user defined error');

	mock.expectThrows(29, message);
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
	mock.expect('method');
	mock.expect('args', [0, 1, 2], true);
	mock.expectThrows('error', [], 'error message');
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
	mock.expectGet('getterUndefined');
	mock.expectGet('getterArray', [0, 1, 2]);
	mock.expectGetThrows('getterError', Error, 'error message');
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
	mock.expectSet('setterUndefined');
	mock.expectSet('setterArray', [0, 1, 2]);
//	mock.expectSet('setterString', 'string', 'returned');
	mock.expectSetThrows('setterError', 'error', Error, 'error message');
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
	mock.expects().calledWithoutArg();
	mock.expects().calledWithArg(29).andReturn(290);
	mock.expects().calledWithArg(290).andThrow('my error');
	var count = 0;
	mock.expects().calledWithArg(2900).andStub(function() {
		count += 1;
	});
	mock.expects().calledWithArg(29000).andReturn(2.9).andStub(function() {
		count += 10;
	});
	mock.expects().calledWithArg(TypeOf.isA(String));

	assert.isUndefined(mock.calledWithoutArg());
	assert.equals(290, mock.calledWithArg(29));
	assert.raises(
		'my error',
		function() {
			mock.calledWithArg(290);
		}
	);
	mock.calledWithArg(2900);
	assert.equals(1, count);
	assert.equals(2.9, mock.calledWithArg(29000));
	assert.equals(11, count);
	mock.calledWithArg(new String('string'));

	mock.assert();
}
