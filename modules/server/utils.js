if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['ServerUtils'];

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/server/httpd.js', ns);
Components.utils.import('resource://uxu-modules/server/message.js', ns);
Components.utils.import('resource://uxu-modules/server/server.js', ns);
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);

var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

var ERROR_INVALID_PORT = 'Invalid port is specified for HTTP daemon!';
var ERROR_USED_PORT    = 'The port is already used by another HTTP daemon!';

function ServerUtils()
{
	this.initListeners();

	this._HTTPServerInstances = [];
}

ServerUtils.prototype = {
	__proto__ : ns.EventTarget.prototype,

	sendMessage : function(aMessage, aHost, aPort, aListener) 
	{
		var message = new ns.Message(aMessage, aHost, aPort, {
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
	},
	 
	startListen : function(aPort, aListener) 
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

		var server = new ns.Server(aPort);
		var listener = new ns.EventTarget();
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
	},

	setUpHttpServer : function(aPort, aBasePath)
	{
		if (!aPort) throw new Error(ERROR_INVALID_PORT);
		if (this._HTTPServerInstances.some(function(aServer) {
				return aServer.port == aPort;
			}))
			throw new Error(ERROR_USED_PORT);

		var server = new ns.HTTPServer(aPort, aBasePath);
		this._HTTPServerInstances.push(server);
		return function() {
				return !server.isStopped();
			};
	},

	tearDownHttpServer : function(aPort)
	{
		var server;
		if (aPort) {
			this._HTTPServerInstances.slice().some(function(aServer, aIndex) {
				if (aServer.port != aPort) return false;
				server = aServer;
				this._HTTPServerInstances.splice(aIndex, 1);
				return true;
			}, this);
		}
		else {
			server = this._HTTPServerInstances.pop();
		}
		return server ? server.stop() : { value : true } ;
	},

	tearDownAllHttpServers : function()
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
	},

	isHttpServerRunning : function()
	{
		return this._HTTPServerInstances.length > 0;
	}
};
