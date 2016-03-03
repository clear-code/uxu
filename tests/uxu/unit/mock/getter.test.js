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
	var returner = () => 'returned';
	mock.expect([])
		.expect('single')
		.expect(['array'])
		.expect(returner);

	assert.equals([{ arguments   : [],
	                 returnValue : [] },
	               { arguments   : [],
	                 returnValue : 'single' },
	               { arguments   : [],
	                 returnValue : ['array'] },
	               { arguments   : [],
	                 returnValue : returner }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_expectThrows()
{
	mock.expectThrows(Error, 'with error class');

	assert.equals([{ arguments        : [],
	                 exceptionClass   : Error,
	                 exceptionMessage : 'with error class' }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_returnValue()
{
	mock.expect('static')
		.expect(() => 'dynamic');
	assert.equal('static', mock());
	assert.equal('dynamic', mock());
}

function test_throwError()
{
	mock.expectThrows('static')
		.expectThrows(Error, 'dynamic');
	yield assert.raises(/static/, function() { mock(); });
	yield assert.raises(/dynamic/, function() { mock(); });
}

function test_missingErrorDefinition()
{
	yield assert.raises(/Error/, function() { mock.expectThrows(); });
}

function test_unexpectedRun()
{
	mock.expect(Mock.NEVER);
	yield assert.raises('Error', function() { mock(); });
}


function test_runWithExpectedContext()
{
	var object = {};
	mock.expect(0).boundTo(object);
	object.__defineGetter__('property', mock);
	yield assert.notRaises('AssertionFailed', function() { object.property; });
	yield assert.raises('Error', function() { object.property; });
}

function test_runWithUnexpectedContext()
{
	var object = { object: true };
	mock.expect([0]).boundTo(object);
	var another = { object: false };
	another.__defineGetter__('property', mock);
	yield assert.raises('AssertionFailed', function() { another.property; });
	yield assert.raises('Error', function() { another.property; });
}

function test_assertSuccess()
{
	mock.expect(0);
	mock.expect(0);
	mock();
	mock();
	yield assert.succeeds(function() { mock.assert(); });
}

function test_assertFail()
{
	mock.expect(0);
	mock.expect(0);
	mock();
	yield assert.raises('AssertionFailed', function() { mock.assert(); });
}
