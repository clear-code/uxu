// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var EventTarget = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', EventTarget);
EventTarget = EventTarget.EventTarget;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner      = test_module.require('class', 'runner');
var Environment = test_module.require('class', 'environment');
var action = test_module.require('package', 'action');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Reporter    = server_module.require('class', 'reporter');

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

function constructor(aBrowser)
{
	this.__proto__.__proto__ = EventTarget.prototype;
	this.initListeners();

	this._browser = aBrowser;
	this._runnerListeners = [];

	// bufferにコードからアクセスできないようにするため、クロージャを使用する
	var buffer = '';
	var _this = this;
	this.onServerInput = function(aEvent) {
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
	this._runnerListeners.push(aListener);
}

function runTest(aOptions/*, aTargets, ...*/)
{
	var runner = new Runner(this._browser, Array.slice(arguments, 1));
	var reporter = new Reporter(aOptions);
	this._runnerListeners.forEach(function (aListener) {
		runner.addListener(aListener);
	});
	runner.addListener(reporter);
	runner.run();
	return reporter;
}

function quit()
{
	this.fireEvent('QuitRequest');
}

function exit()
{
	this.quit();
}

function inspect(aObject)
{
	return utils.inspect(aObject);
}

function inspectDOMNode(aNode)
{
	return utils.inspectDOMNode(aNode);
}

function print()
{
	var message = Array.slice(arguments).join('');
	this.fireEvent('ResponseRequest', message);
}

function puts()
{
	var message = Array.slice(arguments).join('\n');
	if (!/\n$/.test(message)) message += '\n';
	this.fireEvent('ResponseRequest', message);
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

var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
	.getService(Ci.mozIJSSubScriptLoader);

function load(aURI, aContext)
{
	return loader.loadSubScript(aURI, aContext || this || {});
}

function evaluate(aCode)
{
	try {
		this._lastEvaluatedScript = aCode;
		return this.load('chrome://uxu/content/lib/subScriptRunner.js?code='+encodeURIComponent(aCode));
	}
	catch(e) {
		return utils.formatError(utils.normalizeError(e));
	}
}

function quitApplication(aForceQuit)
{
	utils.quitApplication(aForceQuit);
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
