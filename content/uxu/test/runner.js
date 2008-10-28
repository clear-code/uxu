// -*- indent-tabs-mode: t; tab-width: 4 -*- 

const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');
var bundle = lib_module.require('package', 'bundle');

var inherits = lib_module.require('class', 'event_target');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var TestCase    = test_module.require('class', 'test_case');
var TestLog     = test_module.require('class', 'test_log');
var Environment = test_module.require('class', 'environment');
	 
function constructor(aBrowser, aFiles) 
{
	this.runningCount = 0;
	this.files = aFiles || [];
	this._browser = aBrowser;
	this._filters = [];
	this._log = new TestLog();
	this.initListeners();
}
 
function run(aReporter, aMasterPriority) 
{
	utils.setPref('extensions.uxu.running', true);

	if (aReporter) this.addListener(aReporter);

	this.runningCount = 0;

	var suites = [];
	this.files.forEach(function(aFile) {
		suites = suites.concat(this.load(aFile));
	}, this);

	var tests = this._collectTestCases(suites);
	if (aMasterPriority) {
		tests.forEach(function(aTest) {
			aTest.masterPriority = aMasterPriority;
		});
	}

	this._isProcessing = true;
	this.fireEvent('Start');
	this._runTests(tests);
	this._isProcessing = false;
}
	 
function _collectTestCases(aSuites) 
{
	var tests,
		allTests = [];
	aSuites.forEach(function(suite, aIndex) {
		if (!suite) return;
		try {
			tests = this._getTestsFromSuite(suite);
			if (!tests.length)
				throw new Error(bundle.getFormattedString('error_test_not_found', [suite.fileURL]));

			this._filters.forEach(function(aFilter) {
				tests = tests.filter(aFilter);
			});
			allTests = allTests.concat(tests);
		}
		catch(e) {
			this.fireEvent('Error', e);
		}
	}, this);

	return allTests;
}
	
function _getTestsFromSuite(aSuite) 
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
		if (i.indexOf('warmUp') == 0 ||
			obj.isWarmUp)
			testObjects.warmUp = obj;
		else if (i.indexOf('warmDown') == 0 ||
			i.indexOf('coolDown') == 0 ||
			obj.isWarmDown ||
			obj.isCoolDown)
			testObjects.warmDown = obj;
		else if (i.indexOf('setUp') == 0 ||
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
				aSuite.description || String(aSuite.fileURL.match(/[^\/]+$/)),
				{
					namespace : aSuite.fileURL,
					profile   : aSuite.profile,
					options   : aSuite.options
				}
			);

		if (testObjects.warmUp)
			newTestCase.registerWarmUp(testObjects.warmUp);
		if (testObjects.warmDown)
			newTestCase.registerWarmDown(testObjects.warmDown);
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
  
function _runTests(aTests) 
{
	this._shouldAbort = false;
	this._current    = 0;
	this._testsCount = aTests.length;

	var _this = this;
	var runTest = function(aTest) {
			if (_this._shouldAbort) {
				_this.fireEvent('Abort');
				return;
			}
			_this._current++;
			_this.fireEvent('Progress',
				parseInt(((_this._current) / (_this._testsCount + 1)) * 100));
			try {
				aTest.addListener(_this);
				aTest.run(stopper);
			}
			catch(e) {
				_this.fireEvent('Error', e);
			}
		};
	var stopper = function() {
			return _this._shouldAbort;
		};

	if (utils.getPref('extensions.uxu.mozunit.runParallel')) {
		aTests.forEach(runTest);
	}
	else {
		var test;
		window.setTimeout(function() {
			if ((!test || test.done) && aTests.length) {
				test = aTests.shift();
				runTest(test);
			}
			if (aTests.length)
				window.setTimeout(arguments.callee, 100);
		}, 100);
	}
}
  
function abort() 
{
	this._shouldAbort = true;
}
	 
function stop() 
{
	this.abort();
}
  
function isRunning() 
{
	return this.runningCount > 0;
}
 
function handleEvent(aEvent) 
{
	switch (aEvent.type)
	{
		case 'Start':
		case 'RemoteStart':
			this.runningCount++;
			this._log.onStart(aEvent);
			this._onTestCaseEvent(aEvent);
			break;

		case 'TestStart':
			this._onTestCaseEvent(aEvent);
			break;

		case 'TestFinish':
			this._log.onTestFinish(aEvent);
			this._onTestCaseEvent(aEvent);
			this.fireEvent('Report', aEvent.data);
			break;

		case 'RemoteFinish':
			this._log.append(aEvent.data);
		case 'Finish':
			this._log.onFinish(aEvent);
			this.runningCount--;
			this._onTestCaseEvent(aEvent);
			this._cleanUpModifications(aEvent.target);
			aEvent.target.removeListener(this);
			if (this._current == this._testsCount) {
				utils.setPref('extensions.uxu.running', false);
				this.fireEvent('Finish');
			}
			break;

		case 'RemoteProgress':
			this._log.append(aEvent.data);
			break;

		case 'Abort':
			aEvent.target.removeListener(this);
		case 'Error':
			this._onTestCaseEvent(aEvent);
			utils.setPref('extensions.uxu.running', false);
			this.fireEvent(aEvent.type, aEvent.data);
			break;
	}
}
function _onTestCaseEvent(aEvent)
{
	this.fireEvent('TestCase'+aEvent.type, {
		testCase : aEvent.target,
		data     : aEvent.data,
		log      : this._log
	});
}
	 
function _cleanUpModifications(aTestCase) 
{
	aTestCase.environment.utils.cleanUpTempFiles();
	aTestCase.environment.utils.cleanUpModifiedPrefs();
}
  	
function addTestFilter(aFilter) 
{
	if (this._filters.indexOf(aFilter) < 0)
		this._filters.push(aFilter);
}
 
function removeTestFilter(aFilter) 
{
	var index = this._filters.indexOf(aFilter);
	if (index > -1)
		this._filters.splice(index, 1);
}
 
function load(aFilePath) 
{
	var file = utils.makeFileWithPath(aFilePath);

	if (file.isDirectory())
		return this.loadFolder(file);
	else
		return [this.loadFile(file)];
}
	
function loadFolder(aFolder) 
{
	var _this = this;
	var filesMayBeTest = this._getTestFiles(aFolder);
	return filesMayBeTest.map(function(aFile) {
			return _this.loadFile(aFile);
		});
}
	
function _getTestFiles(aFolder, aIgnoreHiddenFiles) 
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
		file = files.getNext().QueryInterface(Ci.nsILocalFile);

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
  
function loadFile(aFile) 
{
	var url = utils.getURLSpecFromFilePath(aFile.path);

	try {
		var suite = this._createTestSuite(url);
	}
	catch(e) {
		if (/\.(js|jsm)$/i.test(aFile.leafName))
			this.fireEvent('Error', e);
		suite = null;
	}
	return suite;
}
	
function _createTestSuite(aURL) 
{
	var suite = {};
	suite.__proto__ = new Environment(suite, aURL, this._browser);

	suite.TestCase      = TestCase;
	suite.Specification = TestCase;

	suite.include(suite.fileURL);

	return suite;
}
    
