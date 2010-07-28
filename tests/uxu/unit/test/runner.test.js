// -*- indent-tabs-mode: t -*-

var topDir = baseURL+'../../../../';

var ns = {};
[
	topDir+'modules/test/runner.js'
].forEach(function(aURI) {
	utils.include({
		uri                    : aURI,
		encoding               : 'Shift_JIS',
		allowOverrideConstants : true,
		namespace              : ns
	});
}, this);
var Runner = ns.TestRunner;

var declarationStyleTest = topDir+'tests/samples/declaration.test.js';
var mozLabStyleTest = topDir+'tests/samples/mozlab.test.js';
var mozLabStyleTestWithoutImporting = topDir+'tests/samples/unit.test.js';

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
	assert.equals(9, files.length);
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
			return !file.exists();
		};
	assert.isFalse(file.exists());
	assert.isNull(utils.getPref(key));
}

