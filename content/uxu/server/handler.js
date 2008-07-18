// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
	.getService(Ci.mozIJSSubScriptLoader);

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Context = server_module.require('class', 'context');

function constructor(aInput, aOutput, aReportListener, aBrowser)
{
	var _this = this;
	var scriptableInput = Cc['@mozilla.org/scriptableinputstream;1']
			.createInstance(Ci.nsIScriptableInputStream);
	var pump = Cc['@mozilla.org/network/input-stream-pump;1']
			.createInstance(Ci.nsIInputStreamPump);

	scriptableInput.init(aInput);
	this.input = scriptableInput;
	this.output = aOutput;
	this.context = new Context(this, aReportListener, aBrowser);

	var buffer = '';
	var pumpListener = {
		onStartRequest : function(aRequest, aContext)
		{
		},
		onStopRequest : function(aRequest, aContext, aStatus)
		{
		},
		onDataAvailable : function(aRequest, aContext, aInputStream, aOffset, aCount)
		{
			if (!_this.input) return;
			var code = _this.input.read(aCount);
			if (/[\r\n]+$/.test(code)) {
				if (buffer) {
					code = buffer + code;
					buffer = '';
				}
			}
			else if (code.length == 1) {
				buffer += code;
				return;
			}
			var result = _this.evaluate(code);
			if (result != undefined)
				_this.puts(result);
		}
	};

	pump.init(aInput, -1, -1, 0, 0, false);
	pump.asyncRead(pumpListener, null);
}

function quit()
{
	if (this.input) {
		this.input.close();
		this.input = null;
	}

	if (this.output) {
		this.output.close();
		this.output = null;
	}

	if (this.context) {
		this.context = null;
	}
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

Object.prototype.inspect = function() { return this.toString();};
String.prototype.inspect = function() {
	return '"' + this.toString().replace(/\"/g, '\\"') + '"';
};
Array.prototype.inspect = function() {
	var elements = new Array();
	var i;

	for (i = 0; i < this.length; i++) {
		elements.push(this[i].inspect());
	}

	return "[" + elements.join(", ") + "]";
};

function p()
{
	var i;
	for (i = 0; i < arguments.length; i++) {
		this.puts(arguments[i].inspect());
	}
}

function error(aException)
{
	this.print(this.formatError(aException));
}

function load(aURI, aContext)
{
	return loader.loadSubScript(aURI, aContext || this.context);
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
