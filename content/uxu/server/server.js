// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Handler = server_module.require('class', 'handler');

function constructor(aPort)
{
	var _this = this;

	this.port   = aPort;
	this.socket = null;

	this.handlers = [];
	this.listener = {
		onSocketAccepted : function(aSocket, aTransport)
		{
			try {
				var input  = aTransport.openInputStream(0, 0, 0);
				var output = aTransport.openOutputStream(0, 0, 0);
				_this.handlers.push(new Handler(input, output));
			}
			catch (e) {
				dump('UxU: Error: ' + e + '\n');
			}
		},
		onStopListening : function(aSocket, aStatus) {
			_this.handlers.forEach(function (aHandler) {
					aHandler.quit();
				});
			_this.handlers = [];
		}
	};
}

function start()
{
	this.socket = Cc['@mozilla.org/network/server-socket;1']
		.createInstance(Ci.nsIServerSocket);
	try {
		this.socket.init(this.port, true, -1);
		this.socket.asyncListen(this.listener);
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
