utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
}


function createSetterMock()
{
	var mock = new SetterMock();
	assert.isFunction(mock);
	return mock;
}

function test_name()
{
	assert.equals('custom name', (new SetterMock('custom name'))._mock.name);
	var f = function NamedSetter() {};
	assert.equals('NamedSetter', (new SetterMock(f))._mock.name);
}

function test_expect()
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

function test_specialSpec()
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

function test_expectThrows()
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

function test_bindTo()
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

function test_assert()
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
