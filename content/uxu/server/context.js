// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var inherits = lib_module.require('class', 'event_target');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner      = test_module.require('class', 'runner');
var Environment = test_module.require('class', 'environment');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Reporter    = server_module.require('class', 'reporter');

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
	.getService(Ci.mozIJSSubScriptLoader);

function constructor(aHandler, aBrowser)
{
	this.browser = aBrowser;
	this.runTest = runTest;
	this.runnerListeners = [];

	// bufferにコードからアクセスできないようにするため、クロージャを使用する
	var buffer = '';
	var _this = this;
	this.onInput = function(aEvent) {
		var code = aEvent.data;
		if (/[\r\n]+$/.test(code)) {
			if (buffer) {
				code = buffer + code;
				buffer = '';
			}
		}
		else {
			buffer += code;
			return;
		}
		var result = _this.evaluate(code);
		if (result !== undefined)
			_this.puts(result);
	}
}

function addRunnerListener(aListener)
{
	this.runnerListeners.push(aListener);
}

function runTest(aOptions/*, aTargets, ...*/)
{
	var runner = new Runner(this.browser, Array.slice(arguments, 1));
	var reporter = new Reporter(aOptions);
	this.runnerListeners.forEach(function (aListener) {
		runner.addListener(aListener);
	});
	runner.addListener(reporter);
	runner.run();
	return reporter;
}

function quit()
{
	this.fireEvent('HandlerCloseRequest');
}

function exit()
{
	this.quit();
}

function print()
{
	var message = Array.slice(arguments).join('');
	if (this.output)
		this.output.write(message, message.length);
	else
		dump("QUITED: " + message);
}

function puts()
{
	var message = Array.slice(arguments).join('\n');
	if (!/\n$/.test(message)) message += '\n';
	if (this.output)
		this.output.write(message, message.length);
	else
		dump("QUITED: " + message);
}

function p()
{
	var i;
	for (i = 0; i < arguments.length; i++) {
		this.puts(utils.inspect(arguments[i]));
	}
}

function error(aException)
{
	this.print(this.formatError(aException));
}

function load(aURI, aContext)
{
	return loader.loadSubScript(aURI, aContext || this.context || {});
}

function evaluate(aCode)
{
	try {
		this.context._lastEvaluatedScript = aCode;
		return this.load('chrome://uxu/content/lib/subScriptRunner.js?code='+encodeURIComponent(aCode));
	}
	catch(e) {
		return utils.formatError(e);
	}
}

function quitApplication(aForceQuit)
{
	var appStartup, quitSeverity;

	appStartup = Components.classes['@mozilla.org/toolkit/app-startup;1'].
		getService(Components.interfaces.nsIAppStartup);

	if (aForceQuit)
		quitSeverity = Components.interfaces.nsIAppStartup.eForceQuit;
	else
		quitSeverity = Components.interfaces.nsIAppStartup.eAttemptQuit;

	appStartup.quit(quitSeverity);
}

function closeMainWindows()
{
	var targets = WindowManager.getEnumerator('navigator:browser');
	while (targets.hasMoreElements())
	{
		var target;
		target = targets.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
		target.close();
	}
}
