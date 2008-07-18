utils.include('../../../../content/uxu/lib/module_manager.js');

var rootManager;
var testManager;

function setUp()
{
	rootManager = new ModuleManager(['chrome://uxu/content']);
	testManager = new ModuleManager(['chrome://uxu/content/test']);
}

function tearDown()
{
}

function testClassType()
{
	var TestCaseClass = testManager.require('class', 'test_case');
	assert.isTrue(TestCaseClass);
	assert.equals('function', typeof TestCaseClass);

	var instance1 = new TestCaseClass('foobar');
	var instance2 = new TestCaseClass('hoge');
	assert.isTrue(instance1);
	assert.equals(instance1.__proto__, instance2.__proto__);
	assert.equals(instance1.run, instance2.run);
	assert.equals(instance1.registerTest, instance2.registerTest);

	var EnvironmentClass = testManager.require('class', 'environment');
	assert.isTrue(EnvironmentClass);
	assert.equals('function', typeof EnvironmentClass);

	var instance3 = new EnvironmentClass({}, 'http://www.clear-code.com/', gBrowser);
	assert.notEquals(instance1.__proto__, instance3.__proto__);
}

function testClassTypeLogical()
{
	var TestCaseClass = rootManager.require('class', 'test/test_case');
	assert.isTrue(TestCaseClass);
	assert.equals('function', typeof TestCaseClass);

	var instance1 = new TestCaseClass('foobar');
	var instance2 = new TestCaseClass('hoge');
	assert.isTrue(instance1);
	assert.notEquals(instance1, instance2);
	assert.equals(instance1.__proto__, instance2.__proto__);
	assert.equals(instance1.run, instance2.run);
	assert.equals(instance1.registerTest, instance2.registerTest);

	var EnvironmentClass = rootManager.require('class', 'test/environment');
	assert.isTrue(EnvironmentClass);
	assert.equals('function', typeof EnvironmentClass);

	var instance3 = new EnvironmentClass({}, 'http://www.clear-code.com/', gBrowser);
	assert.notEquals(instance1, instance3);
	assert.notEquals(instance1.__proto__, instance3.__proto__);
}

function testPackageType()
{
	var package1 = testManager.require('package', 'assertions');
	assert.isTrue(package1);
	assert.isFunction(package1.equals);

	var package2 = testManager.require('package', 'assertions');
	assert.equals(package1, package2);
}

function testUnknownType()
{
	var exception;
	var done = false;
	try {
		var something = testManager.require('foobar', 'assertions');
		done = true;
	}
	catch(e) {
		exception = e;
	}
	assert.isFalse(done);
	assert.equals('Unknown module type. (foobar)', exception.message);
}

