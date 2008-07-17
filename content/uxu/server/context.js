// -*- indent-tabs-mode: t; tab-width: 4 -*-

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner      = test_module.require('class', 'runner');
var Reporter    = test_module.require('class', 'reporter');

var WindowManager = Components.
	classes['@mozilla.org/appshell/window-mediator;1'].
	getService(Components.interfaces.nsIWindowMediator);

function constructor(handler)
{
    this.p = function() {handler.p.apply(handler, arguments)};
    this.puts = function() {handler.puts.apply(handler, arguments)};
    this.print = function() {handler.print.apply(handler, arguments)};
    this.error = function() {handler.error.apply(handler, arguments)};
    this.quit = function() {handler.quit.apply(handler, arguments)};
    this.exit = this.quit;
}


function runTest() {
	var runner = new Runner(arguments);
	var reporter = new Reporter(this);
	runner.run(reporter);
	return reporter;
}

