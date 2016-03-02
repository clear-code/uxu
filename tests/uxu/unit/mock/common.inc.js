var topDir = baseURL+'../../../../';

var ns = utils.import(topDir+'modules/test/mock.js', {});
var MockManager = ns.MockManager;
var Mock = ns.Mock;
var FunctionMock = ns.FunctionMock;
var GetterMock = ns.GetterMock;
var SetterMock = ns.SetterMock;
var HTTPServerMock = ns.HTTPServerMock;
var TypeOf = ns.TypeOf;

var MultiplexError = utils.import(topDir+'modules/multiplexError.js', {}).MultiplexError;

var Assertions = utils.import(topDir+'modules/test/assertions.js', {}).Assertions;

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

function assertSuccess(aMock)
{
	yield assert.notRaises(
		'AssertionFailed',
		() => aMock.assert()
	);
}

function assertFail(aMock)
{
	yield assert.raises(
		'AssertionFailed',
		() => aMock.assert()
	);
}

function assertCallSuccess(aMock, aArguments, aReturnValue)
{
	yield assertCallRemoved(aMock, function() {
		var returnValue;
		var done;
		yield assert.notRaises(
			'Error',
			function() {
				returnValue = aMock.apply(null, aArguments || []);
				done = true;
			}
		);
		assert.isTrue(done);
		assert.equals(aReturnValue, returnValue);
	});
}

function assertAnyCallSuccess(aMock, aArguments, aReturnValue)
{
	yield assertCallNotModified(aMock, function() {
		var returnValue;
		var done;
		yield assert.notRaises(
			'Error',
			function() {
				returnValue = aMock.apply(null, aArguments || []);
				done = true;
			}
		);
		assert.isTrue(done);
		assert.equals(aReturnValue, returnValue);
	});
}

function assertCallRaise(aMock, aArguments, aException)
{
	yield assert.raises(
		aException,
		() => aMock.apply(null, aArguments || [])
	);
}

function assertCallError(aMock, aArguments)
{
	yield assertCallRaise(aMock, aArguments, 'Error');
}

function assertCallAdded(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	yield assert.difference(
		() => (aMock.expectedCalls || aMock._expectedCalls).length,
		1,
		aTask
	);
}

function assertAnyCallAdded(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	yield assert.noDifference(
		() => (aMock.expectedCalls || aMock._expectedCalls).length,
		aTask
	);
	assert.isNotNull(aMock.anyCall);
}

function assertCallRemoved(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	yield assert.difference(
		() => (aMock.expectedCalls || aMock._expectedCalls).length,
		-1,
		aTask
	);
}

function assertCallNotModified(aMock, aTask)
{
	aMock = aMock._mock || aMock;
	yield assert.noDifference(
		() => (aMock.expectedCalls || aMock._expectedCalls).length,
		aTask
	);
}

