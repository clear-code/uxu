utils.include('./common.inc.js');

var mock;

function setUp()
{
	mock = new FunctionMock();
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
	assert.equals('custom name', (new FunctionMock('custom name'))._mock.name);
	var f = function NamedFunction() {};
	assert.equals('NamedFunction', (new FunctionMock(f))._mock.name);
}

function test_expect()
{
	yield assertCallError(mock);
	yield assertCallAdded(mock, function() { mock.expect(0); });
	yield assertCallSuccess(mock, [0]);
	yield assertCallError(mock);

	yield assertCallAdded(mock, function() { mock.expect(29); });
	yield assertCallSuccess(mock, [29]);

	yield assertCallAdded(mock, function() { mock.expect([29]); });
	yield assertCallSuccess(mock, [29]);

	yield assertCallAdded(mock, function() { mock.expect([29, 0]); });
	yield assertCallSuccess(mock, [29, 0]);

	yield assertCallAdded(mock, function() { mock.expect(29, true); });
	yield assertCallSuccess(mock, [29], true);

	yield assertCallAdded(mock, function() {
		mock.expect('string', () => 'returned');
	});
	yield assertCallSuccess(mock, ['string'], 'returned');

	yield assertCallAdded(mock, function() { mock.expect(29); });
	yield assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_specialSpec()
{
	yield assertAnyCallAdded(mock,
		function() { mock.expect(Mock.ANY); });
	yield assertAnyCallSuccess(mock, [0]);
	yield assertAnyCallSuccess(mock, [29]);
	yield assertAnyCallSuccess(mock, ['string']);

	yield assertAnyCallAdded(mock,
		function() { mock.expect(Mock.ANY, 29); });
	yield assertAnyCallSuccess(mock, [0], 29);
	yield assertAnyCallSuccess(mock, [29], 29);
	yield assertAnyCallSuccess(mock, ['string'], 29);

	yield assertCallAdded(mock,
		function() { mock.expect(Mock.ANY_ONETIME, 29); });
	yield assertCallSuccess(mock, [0], 29);
	yield assertCallError(mock, [0]);

	yield assertCallAdded(mock,
		function() { mock.expect(Mock.ANY_ONETIME, 'foobar'); });
	yield assertCallSuccess(mock, [29], 'foobar');
	yield assertCallError(mock, [0]);

	yield assertCallAdded(mock,
		function() { mock.expect(29, 'foobar') });
	yield assertCallSuccess(mock, [29], 'foobar');

	yield assertCallNotModified(mock,
		function() { mock.expect(Mock.NEVER); });
	yield assertCallError(mock, [0]);
}

function test_expectThrows()
{
	var message = Date.now();

	yield assertCallNotModified(mock,
		() => assert.raises(
			bundle.getString('mock_error_no_exception'),
			function() { mock.expectThrows(); }
		)
	);
	yield assertCallNotModified(mock,
		() => assert.raises(
			bundle.getString('mock_error_no_exception'),
			function() { mock.expectThrows([]); }
		)
	);
	yield assertCallAdded(mock,
		() => assert.notRaises(
			bundle.getString('mock_error_no_exception'),
			function() { mock.expectThrows([], message); }
		)
	);
	yield assertCallRemoved(mock,
		() => assertCallRaise(mock, [], message));

	yield assertCallAdded(mock,
		function() { mock.expectThrows(29, message); });
	yield assertCallRemoved(mock,
		() => assertCallRaise(mock, [29], message));

	yield assertCallAdded(mock,
		function() { mock.expectThrows([29], message); });
	yield assertCallRemoved(mock,
		() => assertCallRaise(mock, [29], message));

	yield assertCallAdded(mock,
		function() { mock.expectThrows([29, 0], message); });
	yield assertCallRemoved(mock,
		() => assertCallRaise(mock, [29, 0], message));

	yield assertCallAdded(mock,
		function() { mock.expectThrows(29, Error, 'user defined error'); });
	yield assertCallRemoved(mock,
		() => assertCallRaise(mock, [29], 'user defined error'));

	yield assertCallAdded(mock,
		function() { mock.expectThrows(29, message); });
	yield assertCallRaise(mock, [290], 'AssertionFailed');
}

function test_bindTo_success()
{
	var object = {};
	mock.expect([0]).boundTo(object);
	object.method = mock;
	yield assertCallRemoved(mock, function() { object.method(0); });
}

function test_bindTo_fail()
{
	var object = {};
	mock.expect([0]).boundTo(object);
	yield assertCallRaise(mock, [0], 'AssertionFailed');
	object.method = mock;
	yield assertCallRaise(mock, [0], 'Error');
}

function test_reset()
{
	mock.expect([1]);
	mock.expect([1]);
	yield assertCallSuccess(mock, [1]);
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);

	mock = new FunctionMock();
	mock.expect([1]);
	yield assertCallRaise(mock, [0], 'AssertionFailed');
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);

	mock = new FunctionMock();
	mock.expect([1]);
	mock.reset();
	mock.assert();
	yield assertCallError(mock, [0]);
}

function test_assertSuccess()
{
	mock.expect([0]);
	mock.expect([1]);
	mock(0);
	mock(1);
	yield assertSuccess(mock);
}

function test_assertFail()
{
	mock.expect([0]);
	mock.expect([1]);
	mock(0);
	yield assertFail(mock);
}

function test_addError()
{
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
