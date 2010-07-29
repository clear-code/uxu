// -*- indent-tabs-mode: t; tab-width: 4 -*-

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Context'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/action.js', ns);
Components.utils.import('resource://uxu-modules/test/runner.js', ns);
Components.utils.import('resource://uxu-modules/server/reporter.js', ns);

var utils = ns.utils;
var action = new ns.Action({ __proto__ : utils, utils : utils });

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

function Context(aBrowser)
{
	this.initListeners();

	this.environment = new aBrowser.ownerDocument.defaultView.Object();
	this.environment.__proto__ = this;

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

Context.prototype = {
	__proto__ : ns.EventTarget.prototype,

	addRunnerListener : function(aListener)
	{
		this._runnerListeners.push(aListener);
	},

	runTest : function(aOptions/*, aTargets, ...*/)
	{
		var runner = new ns.TestRunner(this._browser, Array.slice(arguments, 1));
		var reporter = new ns.Reporter(aOptions);
		this._runnerListeners.forEach(function (aListener) {
			runner.addListener(aListener);
		});
		runner.addListener(reporter);
		runner.run();
		return reporter;
	},

	quit : function()
	{
		this.fireEvent('QuitRequest');
	},

	exit : function()
	{
		this.quit();
	},

	inspect : function(aObject)
	{
		return utils.inspect(aObject);
	},

	inspectDOMNode : function(aNode)
	{
		return utils.inspectDOMNode(aNode);
	},

	print : function()
	{
		var message = Array.slice(arguments).join('');
		this.fireEvent('ResponseRequest', message);
	},

	puts : function()
	{
		var message = Array.slice(arguments).join('\n');
		if (!/\n$/.test(message)) message += '\n';
		this.fireEvent('ResponseRequest', message);
	},

	p : function()
	{
		var i;
		for (i = 0; i < arguments.length; i++) {
			this.puts(utils.inspect(arguments[i]));
		}
	},

	error : function(aException)
	{
		this.print(this.formatError(aException));
	},

	load : function(aURI, aContext)
	{
		var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
			.getService(Ci.mozIJSSubScriptLoader);
		return loader.loadSubScript(aURI, aContext || this.environment);
	},

	evaluate : function(aCode)
	{
		try {
			this._lastEvaluatedScript = aCode;
			return this.load('chrome://uxu/content/lib/subScriptRunner.js?code='+encodeURIComponent(aCode));
		}
		catch(e) {
			return utils.formatError(utils.normalizeError(e));
		}
	},

	quitApplication : function(aForceQuit)
	{
		utils.quitApplication(aForceQuit);
	},

	closeMainWindows : function()
	{
		var targets = WindowManager.getEnumerator('navigator:browser');
		while (targets.hasMoreElements())
		{
			var target;
			target = targets.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
			target.close();
		}
	}
};
