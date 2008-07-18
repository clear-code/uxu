// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner      = test_module.require('class', 'runner');
var Reporter    = test_module.require('class', 'reporter');
var Environment = test_module.require('class', 'environment');

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

function constructor(aHandler, aBrowser)
{
	this.browser = aBrowser;
	this.p     = function() { aHandler.p.apply(aHandler, arguments); };
	this.puts  = function() { aHandler.puts.apply(aHandler, arguments); };
	this.print = function() { aHandler.print.apply(aHandler, arguments); };
	this.error = function() { aHandler.error.apply(aHandler, arguments); };
	this.quit  = function() { aHandler.quit.apply(aHandler, arguments); };
	this.exit  = this.quit;
	this.quitApplication = function() {
		aHandler.quitApplication.apply(aHandler, arguments);
	};
	this.runTest = runTest;
	this.__proto__ = new Environment(this, location.href, aBrowser);
}

function runTest()
{
	var runner = new Runner(this.browser, Array.slice(arguments));
	var reporter = new Reporter(this);
	runner.run(reporter);
	return reporter;
}

