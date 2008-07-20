// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner      = test_module.require('class', 'runner');
var Environment = test_module.require('class', 'environment');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Reporter    = server_module.require('class', 'reporter');

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

function constructor(aHandler, aBrowser)
{
	this.browser = aBrowser;
	this.p     = aHandler.p;
	this.puts  = aHandler.puts;
	this.print = aHandler.print;
	this.error = aHandler.error;
	this.quit  = aHandler.quit;
	this.exit  = this.quit;
	this.quitApplication = aHandler.quitApplication;
	this.closeMainWindows = aHandler.closeMainWindows;
	this.runTest = runTest;
	this.runnerListeners = [];
}

function addRunnerListener(aListener)
{
	this.runnerListeners.push(aListener);
}

function runTest()
{
	var runner = new Runner(this.browser, Array.slice(arguments));
	var reporter = new Reporter(this);
	this.runnerListeners.forEach(function (aListener) {
		runner.addListener(aListener);
	});
	runner.addListener(reporter);
	runner.run();
	return reporter;
}
