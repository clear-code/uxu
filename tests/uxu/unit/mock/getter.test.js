utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
}


function createGetterMock()
{
	var mock = new GetterMock();
	assert.isFunction(mock);
	return mock;
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

function test_specialSpec()
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

function test_expectThrows()
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

function test_bindTo()
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

function test_assert()
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
