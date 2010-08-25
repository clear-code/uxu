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
Components.utils.import('resource://uxu-modules/lib/ijs.js', ns);

var utils = ns.utils;
var action = new ns.Action({ __proto__ : utils, utils : utils });

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

function Context(aOptions)
{
	aOptions = aOptions || {};

	this.initListeners();

	this._browser         = aOptions.browser;
	this._envCreator      = aOptions.envCreator;
	this._runnerListeners = [];

	this.environment = this._envCreator ? this._envCreator() : new aBrowser.ownerDocument.defaultView.Object() ;
	this.environment.__proto__ = this;

	this._buffer = '';
	this._lastEvaluatedScript = '';
}

Context.prototype = {
	__proto__ : ns.EventTarget.prototype,

	RETURNABLE_SYNTAX_ERROR : 'returnable syntax error',
	QUIT_MESSAGE : '\u001A__QUIT__',

	addRunnerListener : function(aListener)
	{
		this._runnerListeners.push(aListener);
	},

	runTest : function(aOptions/*, aTargets, ...*/)
	{
		var runner = new ns.TestRunner(
				{
					browser : this._browser,
					envCreator : this._envCreator
				},
				Array.slice(arguments, 1)
			);
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
		this.puts(this.QUIT_MESSAGE);
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
			let parser;
			try {
				parser = new ns.Parser(aCode);
				parser.parse();
			}
			catch(e) {
				if (parser.token === ns.Lexer.EOS && e === ns.Parser.SYNTAX)
					throw new Error(this.RETURNABLE_SYNTAX_ERROR);
			}
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
	},


	onServerInput : function(aEvent) {
		var code = aEvent.data;
		if (/[\r\n]+$/.test(code)) {
			if (this._buffer) {
				code = this._buffer + code;
				this._buffer = '';
			}
		}
		else {
			this._buffer += code;
			return;
		}
		try {
			var result = this.evaluate(code);
			if (result !== undefined)
				this.puts(result);
		}
		catch(e) {
			if (e.message == this.RETURNABLE_SYNTAX_ERROR)
				this._buffer = code;
		}
	}
};
