// -*- indent-tabs-mode: t; tab-width: 4 -*-

var module = new ModuleManager(['chrome://uxu/content/lib']);
var utils  = module.require('package', 'utils');
var bundle = module.require('package', 'bundle');

var action     = module.require('package', 'action');
var assertions = module.require('package', 'assertions');
var TestCase   = module.require('class', 'test_case');

var helper_module = new ModuleManager(['chrome://uxu/content/test']);
var TestUtils     = helper_module.require('class', 'test_utils');
var GMUtils       = helper_module.require('class', 'greasemonkey');

function createTestSuite(aURL, aBrowser, aTestCaseClass)
{
	var suite = {};
	suite.fileURL = aURL;
	suite.baseURL = suite.fileURL.replace(/[^/]*$/, '');

	addTestUtils(suite, aBrowser);
	addAssertions(suite);
	addActions(suite);
	addGMUtils(suite, aBrowser);

	suite.TestCase = aTestCaseClass || TestCase;
	suite.Specification = suite.TestCase;

	suite.utils.include(suite.fileURL);

	return suite;
}

function addTestUtils(aSuite, aBrowser)
{
	aSuite.utils = new TestUtils(aSuite, aBrowser);
	aSuite.utils.fileURL = aSuite.fileURL;
	aSuite.utils.baseURL = aSuite.baseURL;
	aSuite.__defineGetter__('testFrame', function() {
		return aBrowser;
	});
	aSuite.__defineGetter__('testContent', function() {
		return aBrowser.contentWindow;
	});
	aSuite.__defineGetter__('contentWindow', function() {
		return aBrowser.contentWindow;
	});
	aSuite.__defineGetter__('content', function() {
		return aBrowser.contentWindow;
	});
	aSuite.__defineGetter__('testDocument', function() {
		return aBrowser.contentDocument;
	});
	aSuite.__defineGetter__('contentDocument', function() {
		return aBrowser.contentDocument;
	});
	for (var aMethod in aSuite.utils)
	{
		if (typeof aSuite.utils[aMethod] != 'function') continue;
		(function(aMethod, aUtils) {
			aSuite[aMethod] = function() {
				return aUtils[aMethod].apply(aUtils, arguments);
			};
		})(aMethod, aSuite.utils);
	}
}

function addAssertions(aSuite)
{
	aSuite.assert = {};
	aSuite.assert.__proto__ = assertions;
	for (var aMethod in aSuite.assert)
	{
		if (typeof aSuite.assert[aMethod] != 'function') continue;
		(function(aMethod, aAssertions) {
			var func = function() {
					return aAssertions[aMethod].apply(aAssertions, arguments);
				};
			aSuite['assert'+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)] = func;
			if (aMethod.indexOf('is') == 0)
				aSuite['assert'+aMethod.substring(2)] = func;
		})(aMethod, aSuite.assert);
	}
}

function addActions(aSuite)
{
	aSuite.action = {};
	aSuite.action.__proto__ = action;
	for (var aMethod in aSuite.action)
	{
		if (typeof aSuite.action[aMethod] != 'function') continue;
		(function(aMethod, aActions) {
			aSuite['action'+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)] = function() {
				return aActions[aMethod].apply(aActions, arguments);
			};
		})(aMethod, aSuite.action);
	}
}

function addGMUtils(aSuite, aBrowser)
{
	aSuite.greasemonkey = new GMUtils(aSuite, aBrowser);
	for (var aMethod in aSuite.greasemonkey)
	{
		if (typeof aSuite.greasemonkey[aMethod] != 'function')
			continue;
		(function(aMethod, aGMUtils) {
			aSuite[
				aMethod.indexOf('GM_') == 0 ?
					aMethod :
					'greasemonkey'+aMethod.charAt(0).toUpperCase()+aMethod.substring(1)
			] = function() {
				return aGMUtils[aMethod].apply(aGMUtils, arguments);
			};
		})(aMethod, aSuite.greasemonkey);
	}
}

function getTests(aSuite, aTestCaseClass)
{
	var TC = aTestCaseClass || TestCase;
	var tests = [];
	var testObjects = { tests : [] };
	var obj;
	for (var i in aSuite)
	{
		obj = aSuite[i];
		if (!obj) continue;
		if (obj.__proto__ == (aTestCaseClass || TestCase).prototype) {
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
		var newTestCase = new TC(
				aSuite.description || aSuite.fileURL.match(/[^\/]+$/),
				options,
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

function getTestFiles(aFolder)
{
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
function getTestFilesInternal(aFolder)
{ 
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
