// -*- indent-tabs-mode: t -*-

utils.include('../../../../content/uxu/lib/module_manager.js');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner = test_module.require('class', 'runner');

var declarationStyleTest = baseURL+'../../../samples/declaration.test.js';
var mozLabStyleTest = baseURL+'../../../samples/unit.test.js';

var runenr;
var tempFiles;
var tempPrefs;

function setUp()
{
	runner = new Runner(gBrowser);
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
	var suite = runner._createTestSuite(declarationStyleTest);
	assert.isFunction(suite.TestCase.prototype.run);
	assert.isFunction(suite.TestCase.prototype.registerTest);
	assert.isFunction(suite.TestCase.prototype.verify);
	assert.isFunction(suite.Specification.prototype.run);
	assert.isFunction(suite.Specification.prototype.registerTest);
	assert.isFunction(suite.Specification.prototype.verify);
	assert.equals(suite.TestCase, suite.Specification);

	assert.equals('このテストの説明', suite.description);
	assert.isFunction(suite.testSomething1);
	assert.isDefined(suite.utils);
	assert.isFunction(suite.utils.readFrom);
	assert.isFunction(suite.utils.include);
	assert.equals(suite.__proto__, suite.utils);
}

function test_getTestsFromSuite()
{
	var suite = runner._createTestSuite(declarationStyleTest);
	var tests = runner._getTestsFromSuite(suite);
	assert.equals(1, tests.length);
	assert.equals('このテストの説明', tests[0].title);
	assert.equals(3, tests[0].tests.length);

	suite = runner._createTestSuite(mozLabStyleTest);
	tests = runner._getTestsFromSuite(suite);
	assert.equals(1, tests.length);
	assert.equals('This is a unit test.', tests[0].title);
	assert.equals(1, tests[0].tests.length);
}

function test_getTestFiles()
{
	var folder = utils.getFileFromURLSpec(baseURL+'../../../samples/');
	var files = runner._getTestFiles(folder, true);
	assert.equals(5, files.length);
}

function test_cleanUpModifications()
{
	var suite = runner._createTestSuite(declarationStyleTest);
	var tests = runner._getTestsFromSuite(suite);
	assert.equals(1, tests.length);

	var file = suite.utils.makeTempFile();
	tempFiles.push(file);
	assert.isTrue(file.exists());

	var key = 'uxu.temp.'+parseInt(Math.random() * 65000);
	tempPrefs.push(key);
	suite.utils.setPref(key, true);
	assert.isTrue(utils.getPref(key));

	runner._cleanUpModifications(tests[0]);
	assert.isFalse(file.exists());
	assert.isNull(utils.getPref(key));
}

