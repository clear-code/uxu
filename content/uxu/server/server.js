// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var inherits = lib_module.require('class', 'event_target');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Handler = server_module.require('class', 'handler');

function constructor(aPort)
{
	this._port  = (typeof aPort == 'number') ? aPort : -1 ;
	this.__defineGetter__('port', function() {
		return this.socket ? this.socket.port : this._port ;
	});

	this.socket = null;
	this._handlers = [];
}

function start()
{
	this.socket = Cc['@mozilla.org/network/server-socket;1']
		.createInstance(Ci.nsIServerSocket);

	try {
		this.socket.init(this._port, true, -1);
		this.socket.asyncListen(this);
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


function onInput(aEvent)
{
	this.fireEvent('Input', aEvent.data);
}


// nsIServerSocketListener

function onSocketAccepted(aSocket, aTransport)
{
	try {
		var input  = aTransport.openInputStream(0, 0, 0);
		var output = aTransport.openOutputStream(0, 0, 0);
		var handler = new Handler(input, output, this);
		this._handlers.push(handler);
	}
	catch (e) {
		dump('UxU: Error: ' + utils.formatError(e) + '\n');
	}
}

function onStopListening(aSocket, aStatus)
{
	this._handlers.forEach(function (aHandler) {
			aHandler.destroy();
		});
	this._handlers = [];
}
