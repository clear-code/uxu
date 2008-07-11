// -*- indent-tabs-mode: t; tab-width: 4 -*-

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Handler = server_module.require('class', 'handler');

function constructor(port)
{
	var server = this;

	this.port = port;
	this.socket = null;

	this.handler = null;
	this.listener = {
	  onSocketAccepted: function(sock, transport) {
			try {
				var input = transport.openInputStream(0, 0, 0);
				var output = transport.openOutputStream(0, 0, 0);

				server.handler = new Handler(input, output);
			} catch (e) {
				dump('UxU: Error: ' + e + '\n');
			}
		},

	  onStopListening: function(socket, status) {
			if (this.handler) {
				this.handler.quit();
				this.handler = null;
			}
		}
	};
}

function start()
{
	this.socket = Components
		.classes['@mozilla.org/network/server-socket;1']
		.createInstance(Components.interfaces.nsIServerSocket);
	try {
		this.socket.init(this.port, true, -1);
		this.socket.asyncListen(this.listener);
	} catch (e) {
		// already bound
		this.socket = null;
	}
}

function stop()
{
	if (this.socket) {
		this.socket.close();
		this.socket = null;
	}
}
