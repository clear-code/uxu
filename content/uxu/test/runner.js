// -*- indent-tabs-mode: t; tab-width: 4 -*-

var loader = Components
    .classes['@mozilla.org/moz/jssubscript-loader;1']
    .getService(Components.interfaces.mozIJSSubScriptLoader);

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var assertions = lib_module.require('package', 'assertions');
var fsm        = lib_module.require('package', 'fsm');
var TestCase   = lib_module.require('class', 'test_case');
var utils      = lib_module.require('package', 'utils');

var helper_module = new ModuleManager(['chrome://uxu/content/test/helper']);
var test_utils    = helper_module.require('package', 'test_utils');

function constructor(files)
{
    var i;

    this.n_running_tests = 0;
    this.files = files;
}

function run(reporter)
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

            try {
                this.start_test(reporter);
                test.reportHandler = function(report) {reporter.report(report)};
                test.onTestRunFinished = function() {
					runner.finish_test(reporter)
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
}

function isRunning()
{
    return this.n_running_tests > 0;
}

function load(file, reporter)
{
    var tests = new Array();

    try {
        var suite = {};

        suite.TestCase      = TestCase;
        suite.Specification = TestCase;
        suite.assert        = assertions;
        suite.utils         = test_utils;
        suite.fileURL       = utils.convertFilePathToURI(file);
        suite.baseURL       = suite.fileURL.replace(/[^/]*$/, '');
        loader.loadSubScript(suite.fileURL, suite);

        for (var thing in suite) {
            if (suite[thing].__proto__ == TestCase.prototype) {
                tests.push(suite[thing]);
            }
        }

        if (tests.length == 0)
            reporter.warn('No tests found in ' + file);
    } catch (e) {
        reporter.error("failed to load " + file);
        reporter.error(e);
    }

    return tests;
}


TestCase.prototype._original_run = TestCase.prototype.run;

TestCase.prototype.run = function() {
    runner = this[this._runStrategy == 'async' ? '_asyncRun1' : '_syncRun1'];
    runner.call(this, this._tests, this._setUp, this._tearDown,
				this._reportHandler, this.onTestRunFinished);
};

