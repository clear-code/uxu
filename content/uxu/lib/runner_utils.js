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
	for (var i in aSuite) {
		if (!aSuite[i]) continue;
		if (aSuite[i].__proto__ == (aTestCaseClass || mozlab.mozunit.TestCase).prototype) {
			aSuite[i].environment = aSuite;
			tests.push(aSuite[i]);
		}
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
