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

	this._allowAccessesFromRemote = utils.getPref('extensions.uxu.allowAccessesFromRemote');

	this.socket = null;
	this._handlers = [];
}

function start()
{
	this.socket = Cc['@mozilla.org/network/server-socket;1']
		.createInstance(Ci.nsIServerSocket);

	try {
		this.socket.init(this._port, !this._allowAccessesFromRemote, -1);
		this.socket.asyncListen(this);
	}
	catch (e) {
		// already bound
		this.socket = null;
	}
}

function stop()
{
	this.removeAllListeners();
	if (!this.socket) return;
	this.socket.close();
	this.socket = null;
}


// nsIServerSocketListener

function onSocketAccepted(aSocket, aTransport)
{
	aTransport = aTransport.QueryInterface(Ci.nsISocketTransport);
	try {
		if (this._allowAccessesFromRemote) {
			var host = aTransport.host;
			var list = utils.getPref('extensions.uxu.allowAccessesFromRemote.allowedList');
			if (!list.split(/[,;\s]+/).some(function(aHost) {
					aHost = new RegExp('^'+aHost.replace(/\./g, '\\.').replace(/\*/g, '.*')+'$', 'i');
					return aHost.test(host);
				})) {
				aTransport.close(Components.results.NS_ERROR_UNKNOWN_HOST);
				dump('Access from <'+host+'> is rejected by UxU.\n');
				return;
			}
			dump('Access from <'+host+'> is accepted by UxU.\n');
		}

		var input  = aTransport.openInputStream(0, 0, 0);
		var output = aTransport.openOutputStream(0, 0, 0);
		var handler = new Handler(input, output, this);
		this._listeners.forEach(function(aListener) {
			handler.addListener(aListener);
			aListener.addListener(handler);
		});
		this._handlers.push(handler);
	}
	catch (e) {
		aTransport.close(Components.results.NS_ERROR_UNEXPECTED);
		dump('UxU: Error: ' + utils.formatError(utils.normalizeError(e)) + '\n');
	}
}

function onStopListening(aSocket, aStatus)
{
	this._handlers.forEach(function (aHandler) {
			this._listeners.forEach(function(aListener) {
				handler.removeListener(aListener);
				aListener.removeListener(handler);
			});
			aHandler.destroy();
		}, this);
	this._handlers = [];
}
