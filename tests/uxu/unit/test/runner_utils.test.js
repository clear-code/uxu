utils.include('../../../../content/uxu/lib/module_manager.js');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var runnerUtils = test_module.require('package', 'runner_utils');

var declarationStyleTest = baseURL+'../../../samples/declaration.test.js';
var mozLabStyleTest = baseURL+'../../../samples/unit.test.js';

var tempFiles;
var tempPrefs;

function setUp()
{
	tempFiles = [];
	tempPrefs = [];
}

function tearDown()
{
	tempFiles.forEach(function(aFile) {
		try {
			if (aFile.exists()) aFile.remove(true);
		}
		catch(e) {
		}
	});
	tempPrefs.forEach(function(aPref) {
		utils.clearPref(aPref);
	});
}

function test_createTestSuite()
{
	var suite = runnerUtils.createTestSuite(declarationStyleTest, gBrowser);
	assert.isDefined(suite.TestCase.prototype.run);
	assert.isDefined(suite.TestCase.prototype.registerTest);
	assert.isDefined(suite.TestCase.prototype.verify);
	assert.isDefined(suite.Specification.prototype.run);
	assert.isDefined(suite.Specification.prototype.registerTest);
	assert.isDefined(suite.Specification.prototype.verify);
	assert.equals(suite.TestCase, suite.Specification);

	assert.equals('このテストの説明', suite.description);
	assert.isDefined(suite.testSomething1);
	assert.isDefined(suite.utils);
	assert.isDefined(suite.utils.readFrom);
	assert.isDefined(suite.utils.include);
	assert.equals(suite.__proto__, suite.utils);


	function MyClass() {
	}
	MyClass.prototype = {
		dummy : null
	};
	var suite = runnerUtils.createTestSuite(declarationStyleTest, gBrowser, MyClass);
	assert.equals(MyClass, suite.TestCase);
	assert.equals(MyClass, suite.Specification);
}

function test_getTests()
{
	var suite = runnerUtils.createTestSuite(declarationStyleTest, gBrowser);
	var tests = runnerUtils.getTests(suite);
	assert.equals(1, tests.length);
	assert.equals('このテストの説明', tests[0].title);
	assert.equals(3, tests[0].tests.length);

	suite = runnerUtils.createTestSuite(mozLabStyleTest, gBrowser);
	tests = runnerUtils.getTests(suite);
	assert.equals(1, tests.length);
	assert.equals('This is a unit test.', tests[0].title);
	assert.equals(1, tests[0].tests.length);
}

function test_getTestFiles()
{
	var folder = utils.getFileFromURLSpec(baseURL+'../../../samples/');
	var files = runnerUtils.getTestFiles(folder, true);
	assert.equals(5, files.length);
}

function test_cleanUpModifications()
{
	var suite = runnerUtils.createTestSuite(declarationStyleTest, gBrowser);
	var tests = runnerUtils.getTests(suite);
	assert.equals(1, tests.length);

	var file = suite.utils.makeTempFile();
	tempFiles.push(file);
	assert.isTrue(file.exists());

	var key = 'uxu.temp.'+parseInt(Math.random() * 65000);
	tempPrefs.push(key);
	suite.utils.setPref(key, true);
	assert.isTrue(utils.getPref(key));

	runnerUtils.cleanUpModifications(tests[0]);
	assert.isFalse(file.exists());
	assert.isNull(utils.getPref(key));
}

