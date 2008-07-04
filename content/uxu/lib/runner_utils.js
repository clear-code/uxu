// -*- indent-tabs-mode: t; tab-width: 4 -*-

var module = new ModuleManager(['chrome://uxu/content/lib']);
var mozlab = {
	mozunit: module.require('package', 'package')
};
var utils  = module.require('package', 'utils');
var bundle = module.require('package', 'bundle');

var helper_module = new ModuleManager(['chrome://uxu/content/test/helper']);
var TestUtils     = helper_module.require('class', 'test_utils');
var action        = helper_module.require('package', 'action');

var TestCase = mozlab.mozunit.TestCase;

function createTestSuite(aURL, aTestCaseClass)
{
	var suite = {};
	suite.TestCase      = aTestCaseClass || mozlab.mozunit.TestCase;
	suite.Specification = aTestCaseClass || mozlab.mozunit.TestCase;
	suite.assert        = {};
	suite.assert.__proto__ = mozlab.mozunit.assertions;
	suite.fileURL       = aURL;
	suite.baseURL       = suite.fileURL.replace(/[^/]*$/, '');
	suite.utils         = new TestUtils(suite);
	suite.utils.fileURL = suite.fileURL;
	suite.utils.baseURL = suite.baseURL;
	suite.Do            = function(aObject) { return this.utils.Do(aObject); };
	suite.action        = {};
	suite.action.__proto__ = action;
	suite.utils.include(suite.fileURL);
	return suite;
}

function getTests(aSuite, aTestCaseClass)
{
	var tests = [];
	var testObjects = { tests : [] };
	var obj;
	for (var i in aSuite)
	{
		obj = aSuite[i];
		if (!obj) continue;
		if (obj.__proto__ == (aTestCaseClass || mozlab.mozunit.TestCase).prototype) {
			obj.environment = aSuite;
			tests.push(obj);
			continue;
		}

		if (typeof obj != 'function')
			continue;

		// declaration style
		if (i.indexOf('setUp') == 0 ||
			obj.isSetUp)
			testObjects.setUp = obj;
		else if (i.indexOf('tearDown') == 0 ||
			obj.isTearDown)
			testObjects.tearDown = obj;
		else if (i.indexOf('test') == 0 ||
			obj.isTest || obj.description)
			testObjects.tests.push(obj);
	}

	if (testObjects.tests.length) {
		var options = { runStrategy : aSuite.runStrategy };
		if (aSuite.isAsync) options.runStrategy = 'async';
		var newTestCase = new TestCase(aSuite.description || aSuite.fileURL.match(/[^\/]+$/), options);

		if (testObjects.setUp)
			newTestCase.registerSetUp(testObjects.setUp);
		if (testObjects.tearDown)
			newTestCase.registerTearDown(testObjects.tearDown);

		testObjects.tests.forEach(function(aTest) {
			newTestCase.registerTest(aTest);
		});

		newTestCase.context = aSuite;
		tests.push(newTestCase);
	}

	return tests;
}

function getTestFiles(aFolder) {
	var filesMayBeTest = getTestFilesInternal(aFolder);
	var nameList = filesMayBeTest.map(function(aFile) {
			return aFile.leafName;
		}).join('\n');
	if (testFileNamePattern.test(nameList))
		filesMayBeTest = filesMayBeTest.filter(function(aFile) {
			return testFileNamePattern.test(aFile.leafName);
		});
	return filesMayBeTest;
}
var testFileNamePattern = /\.test\.js$/im;
function getTestFilesInternal(aFolder) { 
	var files = aFolder.directoryEntries;
	var file;
	var filesMayBeTest = [];
	var ignoreHiddenFiles = utils.getPref('extensions.uxu.run.ignoreHiddenFiles');
	while (files.hasMoreElements())
	{
		file = files.getNext()
				.QueryInterface(Components.interfaces.nsILocalFile);

		if (
			ignoreHiddenFiles &&
			(
				file.isHidden() ||
				file.leafName.indexOf('.') == 0
			)
			)
			continue;

		if (file.isDirectory()) {
			filesMayBeTest = filesMayBeTest.concat(getTestFilesInternal(file));
		}
		else if (/\.js$/i.test(file.leafName)) {
			filesMayBeTest.push(file);
		}
	}
	return filesMayBeTest;
}

function onFinish(aTestCase)
{
	aTestCase.environment.utils.cleanUpTempFiles();
	aTestCase.environment.utils.cleanUpModifiedPrefs();
}
