// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var assertions = lib_module.require('package', 'assertions');
var fsm        = lib_module.require('package', 'fsm');
var TestCase   = lib_module.require('class', 'test_case');
var utils      = lib_module.require('package', 'utils');
var runner_utils = lib_module.require('package', 'runner_utils');


function constructor(files)
{
	var i;

	this.n_running_tests = 0;
	this.files = files;
}

function run(reporter, all)
{
	var i, j;
	var all_tests = [];

	this.n_running_tests = 0;
	for (i = 0; i < this.files.length; i++) {
		var file = this.files[i];
		var tests = load(file, reporter);

		all_tests.push(tests);
	}

	this.start_test(reporter);
	for (i = 0; i < all_tests.length; i++) {
		var tests = all_tests[i];

		for (j = 0; j < tests.length; j++) {
			var runner = this;
			var test = tests[j];
			if (all) test.priority = 'must';

			try {
				this.start_test(reporter);
				test.reportHandler = {
					handleReport : function(report) {
						reporter.report(report)
					},
					onFinish	 : function() {
						runner.finish_test(reporter)
						runner_utils.onFinish(test);
					}
				};
				test.run();
			} catch (e) {
				var report = {
				  result: "error",
				  exception: e,
				  testDescription: "failed to run test: " + test.title
				};
				reporter.report(report)
				this.finish_test(reporter);
			}
		}
	}
	this.finish_test(reporter);
}

function start_test(reporter)
{
	if (this.n_running_tests == 0 && reporter.onStart)
		reporter.onStart();
	this.n_running_tests++;
}

function finish_test(reporter)
{
	this.n_running_tests--;
	if (this.n_running_tests == 0 && reporter.onFinished)
		reporter.onFinished();
	//utils.cleanUpTempFiles();
}

function isRunning()
{
	return this.n_running_tests > 0;
}

function load(aFilePath, aReporter)
{
	var file = utils.makeFileWithPath(aFilePath);
	var tests;
	if (file.isDirectory())
		tests = runFolder(file);
	else
		tests = runFile(file);

	return tests;
}

function loadFolder(aFolder, aReporter) {
	var filesMayBeTest = runner_utils.getTestFiles(aFolder);
	return filesMayBeTest.map(function(aFile) {
			return loadFile(aFile, aReporter);
		});
}

function loadFile(aFile, aReporter) {
	var tests = [];

	try {
		var suite = runner_utils.createTestSuite(utils.getURLSpecFromFilePath(aFile.path), null, TestCase);
		tests = runner_utils.getTests(suite, TestCase);
		if (tests.length == 0)
			aReporter.warn('No tests found in ' + aFile.path);
	} catch (e) {
		aReporter.error("failed to load " + aFile.path);
		aReporter.error(e);
	}

	return tests;
}


TestCase.prototype._original_run = TestCase.prototype.run;

TestCase.prototype.run = function() {
	runner = this[this._runStrategy == 'async' ? '_asyncRun1' : '_syncRun1'];
	runner.call(this, this._tests, this._setUp, this._tearDown,
	            this._reportHandler, this.onTestRunFinished);
};

