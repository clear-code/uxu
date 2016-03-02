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

function test_name()
{
	assert.equals('custom name', (new FunctionMock('custom name'))._mock.name);
	var f = function NamedFunction() {};
	assert.equals('NamedFunction', (new FunctionMock(f))._mock.name);
}

function test_expect()
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

function test_specialSpec()
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

function test_expectThrows()
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

function test_bindTo_success()
{
	var mock = createFunctionMock();
	var object = {};
	mock.expect([0]).boundTo(object);
	object.method = mock;
	yield assertCallRemoved(mock, () => object.method(0));
}

function test_bindTo_fail()
{
	var mock = createFunctionMock();
	var object = {};
	mock.expect([0]).boundTo(object);
	yield assertCallRaise(mock, [0], 'AssertionFailed');
	object.method = mock;
	yield assertCallRaise(mock, [0], 'Error');
}

function test_reset()
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

function test_assert()
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

function test_addError()
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
