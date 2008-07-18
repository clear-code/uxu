// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils      = lib_module.require('package', 'utils');

var test_module  = new ModuleManager(['chrome://uxu/content/test']);
var runner_utils = test_module.require('package', 'runner_utils');


function constructor(aBrowser, aFiles)
{
	this.runningCount = 0;
	this.browser = aBrowser;
	this.files = aFiles;
}

function run(aReporter, aAll)
{
	var _this = this;
	var tests = [];

	this.runningCount = 0;
	this.files.forEach(function(aFile) {
		tests = tests.concat(_this.load(aFile, aReporter));
	});

	this.start(aReporter);
	tests.forEach(function(aTest) {
		if (aAll) aTest.priority = 'must';
		try {
			_this.start(aReporter);
			aTest.reportHandler = {
				handleReport : function(aReport)
				{
					aReporter.report(aReport)
				},
				onFinish : function()
				{
					_this.finish(aReporter)
					runner_utils.cleanUpModifications(aTest);
				}
			};
			aTest.run();
		}
		catch(e) {
			var report = {
				result          : 'error',
				exception       : e,
				testDescription : 'failed to run test: ' + aTest.title
			};
			aReporter.report(report)
			_this.finish(aReporter);
		}
	});
	this.finish(aReporter);
}

function start(aReporter)
{
	if (this.runningCount == 0 && aReporter.onStart)
		aReporter.onStart();
	this.runningCount++;
}

function finish(aReporter)
{
	this.runningCount--;
	if (this.runningCount == 0 && aReporter.onFinish)
		aReporter.onFinish();
	//utils.cleanUpTempFiles();
}

function isRunning()
{
	return this.runningCount > 0;
}

function load(aFilePath, aReporter)
{
	var file = utils.makeFileWithPath(aFilePath);

	if (file.isDirectory())
		return this.loadFolder(file, aReporter);
	else
		return this.loadFile(file, aReporter);
}

function loadFolder(aFolder, aReporter, aBrowser)
{
	var _this = this;
	var tests = [];
	var filesMayBeTest = runner_utils.getTestFiles(aFolder);
	filesMayBeTest.forEach(function(aFile) {
			if (aFile.isDirectory())
				tests = tests.concat(_this.loadFolder(aFile, aReporter));
			else
				tests = tests.concat(_this.loadFile(aFile, aReporter));
		});
	return tests;
}

function loadFile(aFile, aReporter)
{
	var tests = [];

	try {
		var suite = runner_utils.createTestSuite(utils.getURLSpecFromFilePath(aFile.path), this.browser);
		tests = runner_utils.getTests(suite);
		if (tests.length == 0)
			aReporter.warn('No tests found in ' + aFile.path);
	} catch (e) {
		aReporter.error("failed to load " + aFile.path);
		aReporter.error(e);
	}

	return tests;
}
