// -*- indent-tabs-mode: t; tab-width: 4 -*- 

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['TestRunner'];

const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/lib/jstimer.jsm', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/test/environment.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);
Components.utils.import('resource://uxu-modules/test/log.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

const RUNNING = 'extensions.uxu.running';
	
function TestRunner(aBrowser/*, aFile, ...*/) 
{
	this.initListeners();

	this.runningCount = 0;
	this.files = Array.slice(arguments, 1);
	if (utils.isArray(this.files[0])) this.files = this.files[0];
	this._browser = aBrowser;
	this._filters = [];
	this._log = new ns.TestLog();
}
TestRunner.prototype = {
	__proto__ : ns.EventTarget.prototype,
	
	run : function(aReporter, aMasterPriority) 
	{
		utils.setPref(RUNNING, true);

		if (aReporter) this.addListener(aReporter);

		this.runningCount = 0;

		var suites = [];
		this.files.forEach(function(aFile) {
			suites = suites.concat(this.load(aFile));
		}, this);

		var tests = this._collectTestCases(suites);
		if (aMasterPriority) {
			tests.forEach(function(aTest) {
				if (!aTest.neverRun)
					aTest.masterPriority = aMasterPriority;
			});
		}

		this._isProcessing = true;
		this.fireEvent('Start');
		this._runTests(tests);
		this._isProcessing = false;
	},
	
	_collectTestCases : function(aSuites) 
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
				this.fireEvent('Error', utils.normalizeError(e));
			}
		}, this);

		return allTests;
	},
	
	_getTestsFromSuite : function(aSuite) 
	{
		var tests = [];
		var testObjects = { tests : [] };
		var obj;

		var name;
		for (var i in aSuite)
		{
			obj = aSuite[i];
			if (!aSuite.hasOwnProperty(i) || !obj) continue;
			if (obj.__proto__ == ns.TestCase.prototype) {
				obj.environment = aSuite;
				tests.push(obj);
				continue;
			}

			if (typeof obj != 'function')
				continue;

			// declaration style
			if (/^(start|warm)[uU]p/.test(i) || obj.isStartUp || obj.isWarmUp)
				testObjects.startUp = obj;
			else if (/^(shut|warm|cool)[dD]own/.test(i) ||
				obj.isShutDown || obj.isCoolDown || obj.isWarmDown)
				testObjects.shutDown = obj;
			else if (/^set[uU]p/.test(i) || obj.isSetUp)
				testObjects.setUp = obj;
			else if (/^tear[dD]own/.test(i) || obj.isTearDown)
				testObjects.tearDown = obj;
			else if (/^test/.test(i) ||
				obj.isTest || obj.description)
				testObjects.tests.push(obj);
		}

		if (testObjects.tests.length) {
			var newTestCase = new ns.TestCase(
					aSuite.description || String(aSuite.fileURL.match(/[^\/]+$/)),
					{
						source        : aSuite.fileURL,
						profile       : aSuite.profile,
						application   : aSuite.application,
						options       : aSuite.options,
						priority      : aSuite.priority,
						shouldSkip    : aSuite.shouldSkip,
						context       : aSuite.testContext,
						targetProduct : aSuite.targetProduct,
						mapping       : aSuite.mapping || aSuite.redirect
					}
				);

			if (testObjects.startUp)
				newTestCase.registerStartUp(testObjects.startUp);
			if (testObjects.shutDown)
				newTestCase.registerShutDown(testObjects.shutDown);
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
	},
  
	_runTests : function(aTests) 
	{
		this._shouldAbort = false;
		this._current     = 0;
		this._testsCount  = aTests.length;

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
					_this.fireEvent('Error', utils.normalizeError(e));
				}
			};
		var stopper = function() {
				return _this._shouldAbort;
			};

		if (utils.getPref('extensions.uxu.runner.runParallel')) {
			aTests.forEach(runTest);
		}
		else {
			var test;
			ns.setTimeout(function() {
				if ((!test || test.done) && aTests.length) {
					test = aTests.shift();
					runTest(test);
				}
				if (aTests.length)
					ns.setTimeout(arguments.callee, 100);
			}, 100);
		}
	},
  
	abort : function() 
	{
		this._shouldAbort = true;
	},
	
	stop : function() 
	{
		this.abort();
	},
  
	isRunning : function() 
	{
		return this.runningCount > 0;
	},
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'Start':
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
				break;

			case 'RemoteTestFinish':
				this._log.append(aEvent.data);
				this._onTestCaseEvent(aEvent);
				break;

			case 'Finish':
				this._log.onFinish(aEvent);
				this.runningCount--;
				this._onTestCaseEvent(aEvent);
				this._cleanUpModifications(aEvent.target);
				aEvent.target.removeListener(this);
				if (this._current == this._testsCount) {
					utils.setPref(RUNNING, false);
					this.fireEvent('Finish');
				}
				break;

			case 'Abort':
				aEvent.target.removeListener(this);
			case 'Error':
				this._onTestCaseEvent(aEvent);
				utils.setPref(RUNNING, false);
				this.fireEvent(aEvent.type, aEvent.data);
				break;
		}
	},
	_onTestCaseEvent : function(aEvent)
	{
		this.fireEvent('TestCase'+aEvent.type, {
			testCase : aEvent.target,
			data     : aEvent.data,
			log      : this._log
		});
	},
	
	_cleanUpModifications : function(aTestCase) 
	{
		aTestCase.environment.utils.rollbackPrefs();
		aTestCase.environment.utils.cleanUpTempFiles(true);
	},
  
	addTestFilter : function(aFilter) 
	{
		if (this._filters.indexOf(aFilter) < 0)
			this._filters.push(aFilter);
	},
 
	removeTestFilter : function(aFilter) 
	{
		var index = this._filters.indexOf(aFilter);
		if (index > -1)
			this._filters.splice(index, 1);
	},
 
	load : function(aFilePath) 
	{
		var file = utils.makeFileWithPath(aFilePath);

		if (file.isDirectory())
			return this.loadFolder(file);
		else
			return [this.loadFile(file)];
	},
	
	loadFolder : function(aFolder) 
	{
		var _this = this;
		var filesMayBeTest = this._getTestFiles(aFolder);
		return filesMayBeTest.map(function(aFile) {
				return _this.loadFile(aFile);
			});
	},
	
	_getTestFiles : function(aFolder, aIgnoreHiddenFiles) 
	{
		var filesMayBeTest = _getTestFilesInternal(aFolder, aIgnoreHiddenFiles);
		var nameList = filesMayBeTest.map(function(aFile) {
				return aFile.leafName;
			}).join('\n');
		if (this.testFileNamePattern.test(nameList))
			filesMayBeTest = filesMayBeTest.filter(function(aFile) {
				return this.testFileNamePattern.test(aFile.leafName);
			}, this);
		return filesMayBeTest;
	},
	testFileNamePattern : /\.test\.js$/im,
	unitTestPattern : /\bunit/i,
	functionalTestPattern : /\bfunctional/i,
	_getTestFilesInternal : function(aFolder, aIgnoreHiddenFiles)
	{
		var files = aFolder.directoryEntries;
		var file;
		var filesMayBeTest = [];
		if (aIgnoreHiddenFiles === void(0))
			aIgnoreHiddenFiles = utils.getPref('extensions.uxu.run.ignoreHiddenFiles');

		var tests = [];
		var unitTests = [];
		var functionalTests = [];
		while (files.hasMoreElements())
		{
			file = files.getNext().QueryInterface(Ci.nsILocalFile);
			if (aIgnoreHiddenFiles &&
				(file.isHidden() || file.leafName.indexOf('.') == 0)) {
				continue;
			}
			if (file.isDirectory()) {
				if (this.unitTestPattern.test(file.leafName)) {
					unitTests.push(file);
					continue;
				}
				else if (this.functionalTestPattern.test(file.leafName)) {
					functionalTests.push(file);
					continue;
				}
			}
			tests.push(file);
		}

		tests = tests.concat(unitTests).concat(functionalTests);
		if (!unitTests.length || !functionalTests.length) {
			tests.sort(function(aA, aB) {
				return aA.leafName - aB.leafName;
			});
		}

		tests.forEach(function(aFile) {
			if (aFile.isDirectory()) {
				filesMayBeTest = filesMayBeTest.concat(this._getTestFilesInternal(aFile));
			}
			else if (/\.js$/i.test(aFile.leafName)) {
				filesMayBeTest.push(aFile);
			}
		}, this);
		return filesMayBeTest;
	},
  
	loadFile : function(aFile) 
	{
		var url = utils.getURLSpecFromFilePath(aFile.path);

		try {
			var suite = this._createTestSuite(url);
		}
		catch(e) {
			if (/\.(js|jsm)$/i.test(aFile.leafName))
				this.fireEvent('Error', utils.normalizeError(e));
			suite = null;
		}
		return suite;
	},
	
	_createTestSuite : function(aURL) 
	{
		var suite = { __proto__ : new ns.TestEnvironment(suite, aURL, this._browser) };

		/* backward compatibility for MozLab/MozUnit testcases */
		suite.TestCase      = ns.TestCase;
		suite.Specification = ns.TestCase;
		suite.mozlab = {
			mozunit : {
				TestCase      : ns.TestCase,
				Specification : ns.TestCase,
				assertions    : suite.assert
			}
		};

		suite.include(suite.fileURL);

		return suite;
	}
   
}; 
   
