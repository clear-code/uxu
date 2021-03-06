// -*- indent-tabs-mode: t -*-

var topDir = baseURL+'../../../../';

var TestRunner = utils.import(topDir+'modules/test/runner.js', {}).TestRunner;

var declarationStyleTest = topDir+'tests/samples/declaration.test.js';
var mozLabStyleTest = topDir+'tests/samples/mozlab.test.js';
var mozLabStyleTestWithoutImporting = topDir+'tests/samples/unit.test.js';

var runenr;
var tempFiles;
var tempPrefs;

function setUp()
{
	runner = new TestRunner({
		browser    : gBrowser,
		envCreator : function() { return {}; }
	});
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
	assert.isFunction(suite.environment.TestCase.prototype.run);
	assert.isFunction(suite.environment.TestCase.prototype.registerTest);
	assert.isFunction(suite.environment.TestCase.prototype.verify);
	assert.isFunction(suite.environment.Specification.prototype.run);
	assert.isFunction(suite.environment.Specification.prototype.registerTest);
	assert.isFunction(suite.environment.Specification.prototype.verify);
	assert.equals(suite.environment.TestCase, suite.environment.Specification);

	assert.equals('このテストの説明', suite.environment.description);
	assert.isFunction(suite.environment.testSomething1);
	assert.isDefined(suite.utils);
	assert.isFunction(suite.utils.readFrom);
	assert.isFunction(suite.utils.include);
	assert.equals(suite.__proto__, suite.utils.__proto__);
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

	suite = runner._createTestSuite(mozLabStyleTestWithoutImporting);
	tests = runner._getTestsFromSuite(suite);
	assert.equals(1, tests.length);
	assert.equals('This is a unit test.', tests[0].title);
	assert.equals(1, tests[0].tests.length);
}

function test_getTestFiles()
{
	var folder = utils.getFileFromURLSpec(baseURL+'../../../samples/');
	var files = runner._getTestFiles(folder, true);
	assert.equals(10, files.length);
}

function test_cleanUpModifications()
{
	var suite = runner._createTestSuite(declarationStyleTest);
	var tests = runner._getTestsFromSuite(suite);
	assert.equals(1, tests.length);

	var file = suite.utils.makeTempFile();
	suite.utils.writeTo('foo', file);
	assert.isTrue(file.exists());

	var key = 'uxu.temp.'+parseInt(Math.random() * 65000);
	tempPrefs.push(key);
	suite.utils.setPref(key, true);
	assert.isTrue(utils.getPref(key));

	runner._cleanUpModifications(tests[0]);
	// wait for delayed remove
	yield function() {
			while(file.exists()) {
				yield;
			}
		};
	assert.isFalse(file.exists());
	assert.isNull(utils.getPref(key));
}

