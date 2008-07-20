// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Handler = server_module.require('class', 'handler');
var Context = server_module.require('class', 'context');

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

function constructor(aPort)
{
	var _this = this;

	this.port   = aPort;
	this.socket = null;

	this.handlers = [];
}

function start(aBrowser, aRunnerListener)
{
	var _this = this;
	var socketListener;

	this.socket = Cc['@mozilla.org/network/server-socket;1']
		.createInstance(Ci.nsIServerSocket);

	socketListener = {
	  onSocketAccepted : function(aSocket, aTransport)
		{
			try {
				var input  = aTransport.openInputStream(0, 0, 0);
				var output = aTransport.openOutputStream(0, 0, 0);
				var handler = new Handler(input, output);
				var context = new Context(handler, aBrowser);
				if (aRunnerListener)
					context.addRunnerListener(aRunnerListener);
				handler.setContext(context);
				_this.handlers.push(handler);
			}
			catch (e) {
				dump('UxU: Error: ' + utils.formatError(e) + '\n');
			}
		},
		onStopListening : function(aSocket, aStatus) {
			_this.handlers.forEach(function (aHandler) {
					aHandler.quit();
				});
			_this.handlers = [];
		}
	};
	try {
		this.socket.init(this.port, true, -1);
		this.socket.asyncListen(socketListener);
	}
	catch (e) {
		// already bound
		this.socket = null;
	}
}

function stop()
{
	if (!this.socket) return;
	this.socket.close();
	this.socket = null;
}
