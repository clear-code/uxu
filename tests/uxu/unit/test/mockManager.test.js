utils.include('./mock.inc.js');

var manager;
var assertions;

function setUp()
{
	assertions = new Assertions();
	manager = new MockManager(assertions);
}

function tearDown()
{
}


function test_addMock()
{
	assert.equals([], manager.mocks);
	manager.addMock([0]);
	manager.addMock([1]);
	manager.addMock([2]);
	assert.equals([[0], [1], [2]], manager.mocks);
}

function test_createX()
{
	assert.equals([], manager.mocks);
	var mock = manager.createMock('mock');
	var func = manager.createFunctionMock('func');
	var getter = manager.createGetterMock('getter');
	var setter = manager.createSetterMock('setter');
	assert.equals([mock, func, getter, setter], manager.mocks);
	assert.equals(assertions, mock._assert);
	assert.equals(assertions, func._mock._assert);
	assert.equals(assertions, getter._mock._assert);
	assert.equals(assertions, setter._mock._assert);
}

function test_handlingInstancesCreatedFromExportedClasses()
{
	var ns = {};
	manager.export(ns);

	assert.equals([], manager.mocks);
	var mock = new ns.Mock('mock');
	var mock2 = new ns.MockObject('mock2');
	var func = new ns.FunctionMock('func');
	var func2 = new ns.MockFunction('func2');
	var getter = new ns.GetterMock('getter');
	var setter = new ns.SetterMock('setter');
	assert.equals([mock, mock2, func, func2, getter, setter], manager.mocks);
	assert.equals(assertions, mock._assert);
	assert.equals(assertions, mock2._assert);
	assert.equals(assertions, func._mock._assert);
	assert.equals(assertions, func2._mock._assert);
	assert.equals(assertions, getter._mock._assert);
	assert.equals(assertions, setter._mock._assert);
}
