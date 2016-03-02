utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
	mock = new GetterMock();
}

function tearDown()
{
}


function test_isFunction()
{
	assert.isFunction(mock);
}

function test_name()
{
	assert.equals('custom name',
		(new GetterMock('custom name'))._mock.name);
	var f = function NamedGetter() {};
	assert.equals('NamedGetter',
		(new GetterMock(f))._mock.name);
}

function test_expect()
{
	yield assertCallError(mock);
	yield assertCallAdded(mock, function() { mock.expect(0); });
	yield assertCallSuccess(mock, [], 0);
	yield assertCallError(mock);

	yield assertCallAdded(mock, function() { mock.expect(29); });
	yield assertCallSuccess(mock, [], 29);

	yield assertCallAdded(mock, function() { mock.expect([29]); });
	yield assertCallSuccess(mock, [], [29]);

	yield assertCallAdded(mock,
		function() { mock.expect(() => 'returned'); });
	yield assertCallSuccess(mock, [], 'returned');

	yield assertCallAdded(mock, function() { mock.expect(29, true); });
	yield assertCallSuccess(mock, [], [29]);
}

function test_specialSpec()
{
	yield assertAnyCallAdded(mock,
		function() { mock.expect(Mock.ANY, true); });
	yield assertAnyCallSuccess(mock, [], true);
	yield assertAnyCallSuccess(mock, [], true);

	yield assertAnyCallAdded(mock,
		function() { mock.expect(Mock.ANY, false); });
	yield assertAnyCallSuccess(mock, [], false);
	yield assertAnyCallSuccess(mock, [], false);

	yield assertCallAdded(mock,
		function() { mock.expect(Mock.ANY_ONETIME, 29); });
	yield assertCallSuccess(mock, [], 29);
	yield assertCallError(mock, []);

	yield assertCallNotModified(mock,
		function() { mock.expect(Mock.NEVER); });
	yield assertCallError(mock, []);
}

function test_expectThrows()
{
	var message = Date.now();

	yield assert.raises(
		bundle.getString('mock_error_no_exception'),
		function() { mock.expectThrows(); }
	);
	yield assert.notRaises(
		bundle.getString('mock_error_no_exception'),
		function() { mock.expectThrows(message); }
	);
	yield assertCallRaise(mock, [], message);
}

function test_bindTo()
{
	var object = {};
	mock.expect(29).boundTo(object);
	yield assertCallRaise(mock, [], 'AssertionFailed');
	yield assertCallRaise(mock, [], 'Error');

	mock = createGetterMock();
	mock.expect(29).boundTo(object);
	object.__defineGetter__('property', mock);
	yield assertCallRemoved(mock,
		function() { assert.equals(29, object.property); });
}

function test_assertSuccess()
{
	mock.expect(0);
	mock.expect(0);
	mock();
	mock();
	yield assertSuccess(mock);
}

function test_assertFail()
{
	mock.expect(0);
	mock.expect(0);
	mock();
	yield assertFail(mock);
}
