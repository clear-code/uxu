// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils      = lib_module.require('package', 'utils');
var bundle     = lib_module.require('package', 'bundle');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var TestCase    = test_module.require('class', 'test_case');
var Environment = test_module.require('class', 'environment');

function createTestSuite(aURL, aBrowser)
{
	var suite = {};
	suite.__proto__ = new Environment(suite, aURL, aBrowser);

	suite.TestCase      = TestCase;
	suite.Specification = TestCase;

	suite.include(suite.fileURL);

	return suite;
}

function getTests(aSuite)
{
	var tests = [];
	var testObjects = { tests : [] };
	var obj;

	for (var i in aSuite)
	{
		obj = aSuite[i];
		if (!aSuite.hasOwnProperty(i) || !obj) continue;
		if (obj.__proto__ == TestCase.prototype) {
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
		var newTestCase = new TestCase(
				aSuite.description || aSuite.fileURL.match(/[^\/]+$/),
				aSuite.fileURL
			);

		if (testObjects.setUp)
			newTestCase.registerSetUp(testObjects.setUp);
		if (testObjects.tearDown)
			newTestCase.registerTearDown(testObjects.tearDown);

		testObjects.tests.forEach(function(aTest) {
			newTestCase.registerTest(aTest);
		});

		newTestCase.context = aSuite;
		newTestCase.environment = aSuite;
		tests.push(newTestCase);
	}

	return tests;
}

function getTestFiles(aFolder, aIgnoreHiddenFiles)
{
	var filesMayBeTest = _getTestFilesInternal(aFolder, aIgnoreHiddenFiles);
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
function _getTestFilesInternal(aFolder, aIgnoreHiddenFiles)
{ 
	var files = aFolder.directoryEntries;
	var file;
	var filesMayBeTest = [];
	if (aIgnoreHiddenFiles === void(0))
		aIgnoreHiddenFiles = utils.getPref('extensions.uxu.run.ignoreHiddenFiles');
	while (files.hasMoreElements())
	{
		file = files.getNext()
				.QueryInterface(Components.interfaces.nsILocalFile);

		if (
			aIgnoreHiddenFiles &&
			(
				file.isHidden() ||
				file.leafName.indexOf('.') == 0
			)
			)
			continue;

		if (file.isDirectory()) {
			filesMayBeTest = filesMayBeTest.concat(_getTestFilesInternal(file));
		}
		else if (/\.js$/i.test(file.leafName)) {
			filesMayBeTest.push(file);
		}
	}
	return filesMayBeTest;
}

function cleanUpModifications(aTestCase)
{
	aTestCase.environment.utils.cleanUpTempFiles();
	aTestCase.environment.utils.cleanUpModifiedPrefs();
}
