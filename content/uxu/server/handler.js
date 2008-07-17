// -*- indent-tabs-mode: t; tab-width: 4 -*-

var loader = Components
    .classes['@mozilla.org/moz/jssubscript-loader;1']
    .getService(Components.interfaces.mozIJSSubScriptLoader);
var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils      = lib_module.require('package', 'utils');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Context       = server_module.require('class', 'context');

function constructor(input, output, server)
{
	var handler = this;
	var scriptableInput = Components
		.classes['@mozilla.org/scriptableinputstream;1']
		.createInstance(Components.interfaces.nsIScriptableInputStream);
	var pump = Components
		.classes['@mozilla.org/network/input-stream-pump;1']
		.createInstance(Components.interfaces.nsIInputStreamPump);

	scriptableInput.init(input);
    this.input = scriptableInput;
    this.output = output;
	this.context = new Context(this);

    listener = {
      onStartRequest: function(request, context) {
		},
      onStopRequest: function(request, context, status) {
        },
      onDataAvailable: function(request, cont, inputStream, offset, count) {
			if (handler.input) {
				var code = handler.input.read(count);
				var result = handler.evaluate(code);
				if (result != undefined)
					handler.puts(result);
			}
        }
    };

	pump.init(input, -1, -1, 0, 0, false);
	pump.asyncRead(listener, null);
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

	if (this.server)
		this.server.removeSession(this);
}

function print()
{
	var message = "";
	var i;

	for (i = 0; i < arguments.length; i++) {
		message += arguments[i];
	}

	if (this.output)
		this.output.write(message, message.length);
	else
		dump("QUITED: " + message);
}

function puts()
{
	var message;
	var elements = new Array();
	var i;

	for (i = 0; i < arguments.length; i++) {
		elements.push(arguments[i]);
	}
	message = elements.join("\n");
	if (message[message.length - 1] != "\n")
		message += "\n";

	if (this.output)
		this.output.write(message, message.length);
	else
		dump("QUITED: " + message);
}

Object.prototype.inspect = function() {return this.toString();};
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

function error(exception)
{
	this.print(this.formatError(exception));
}

function load(url, context) {
    return loader.loadSubScript(url, context || this.context);
}

function evaluate(code)
{
    try {
		this.context._lastEvaluatedScript = code;
		return this.load('chrome://uxu/content/lib/subScriptLoader.js', context);
    } catch (e) {
        return utils.formatError(e);
    }
}
