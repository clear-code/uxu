var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');
var EventTarget = lib_module.require('class', 'event_target');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server = server_module.require('class', 'server');
var Message = server_module.require('class', 'message');
var HTTPServer = server_module.require('class', 'httpd');

function constructor()
{
	this._HTTPServerInstances = [];
}

function sendMessage(aMessage, aHost, aPort, aListener) 
{
	var message = new Message(aMessage, aHost, aPort, {
			onResponse : function(aResponse)
			{
				if (!aListener) return;
				if (typeof aListener == 'function')
					aListener(aResponse);
				else if (aListener.onResponse && typeof aListener.onResponse == 'function')
					aListener.onResponse(aResponse);
			}
		});
	message.send();
}
 
function startListen(aPort, aListener) 
{
	if (
		!aListener ||
		(
			typeof aListener != 'function' &&
			(
				!aListener.onListen ||
				typeof aListener.onListen != 'function'
			)
		)
		)
		return null;

	var server = new Server(aPort);
	var listener = new EventTarget();
	listener.stop = function() {
		server.destroy();
	};
	var buffer = '';
	listener.onServerInput = function(aEvent) {
		var data = aEvent.data;
		if (/[\r\n]+$/.test(data)) {
			if (buffer) {
				data = buffer + data;
				buffer = '';
			}
			data = data.replace(/[\r\n]+$/, '');
		}
		else {
			buffer += data;
			return;
		}
		if (typeof aListener == 'function')
			aListener(data)
		else
			aListener.onListen(data);
		this.fireEvent('ResponseRequest', data+'\n');
	};
	server.addListener(listener);
	listener.addListener(server);
	server.start();
	listener.port = server.port;
	return listener;
}


var ERROR_INVALID_PORT = new Error('Invalid port is specified for HTTP daemon!');
var ERROR_USED_PORT    = new Error('The port is already used by another HTTP daemon!');

function setUpHttpServer(aPort, aBasePath)
{
	if (!aPort) throw ERROR_INVALID_PORT;
	if (this._HTTPServerInstances.some(function(aServer) {
			return aServer.port == aPort;
		}))
		throw ERROR_USED_PORT;

	var server = new HTTPServer(aPort, aBasePath);
	this._HTTPServerInstances.push(server);
	return function() {
			return !server.isStopped();
		};
}

function tearDownHttpServer(aPort)
{
	var server;
	if (aPort) {
		this._HTTPServerInstances.slice().some(function(aServer, aIndex) {
			if (aServer.port != aPort) return false;
			server = aServer;
			this._HTTPServerInstances.splice(aIndex, 1);
			return true;
		});
	}
	else {
		server = this._HTTPServerInstances.pop();
	}
	return server ? server.stop() : { value : true } ;
}

function tearDownAllHttpServers()
{
	var stopped = [];
	while (this._HTTPServerInstances.length)
	{
		stopped.push(this.tearDownHttpServer());
	}
	return function() {
			return stopped.every(function(aStopped) {
					return aStopped.value;
				});
		};
}

function isHttpServerRunning()
{
	return this._HTTPServerInstances.length > 0;
}
