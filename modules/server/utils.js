if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['ServerUtils'];

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/multiplexError.js', ns);
Components.utils.import('resource://uxu-modules/server/httpd.js', ns);
Components.utils.import('resource://uxu-modules/server/message.js', ns);
Components.utils.import('resource://uxu-modules/server/server.js', ns);
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);

var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

var ERROR_INVALID_PORT = 'Invalid port is specified for HTTP daemon!';
var ERROR_USED_PORT    = 'The port is already used by another HTTP daemon!';

function ServerUtils(aMockManager)
{
	this.initListeners();

	this.mMockManager = aMockManager;
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

	getHttpServer : function(aPort)
	{
		var index = -1;
		if (this._HTTPServerInstances.some(function(aServer, aIndex) {
				if (aServer.port == aPort) {
					index = aIndex;
					return true;
				}
				return false;
			}))
			return this._HTTPServerInstances[i];

		return null;
	},
	getHTTPServer : function() { return this.getHttpServer.apply(this, arguments); },

	setUpHttpServer : function(aPort, aBasePath, aAsync)
	{
		if (!aPort) throw new Error(ERROR_INVALID_PORT);
		if (this._HTTPServerInstances.some(function(aServer) {
				return aServer.port == aPort;
			}))
			throw new Error(ERROR_USED_PORT);

		var server = new ns.HTTPServer(aPort, aBasePath, this.mMockManager);
		this._HTTPServerInstances.push(server);

		var completedCheck = function() {
				return !server.isStopped();
			};

		if (!aAsync)
			ns.utils.wait(server);

		return server;
	},
	setUpHTTPServer : function() { return this.setUpHttpServer.apply(this, arguments); },

	tearDownHttpServer : function(aPort, aAsync)
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
		return server ? server.stop(aAsync) : { value : true } ;
	},
	tearDownHTTPServer : function() { return this.tearDownHttpServer.apply(this, arguments); },

	tearDownAllHttpServers : function(aAsync)
	{
		var stopped = [];
		var errors = [];
		while (this._HTTPServerInstances.length)
		{
			try {
				stopped.push(this.tearDownHttpServer());
			}
			catch(e) {
				errors.push(e);
			}
		}
		var completedCheck = function() {
				if (stopped.every(function(aStopped) {
						return aStopped.value;
					})) {
					if (errors.length)
						throw new ns.MultiplexError(errors);
					return true;
				}
				return false;
			};

		if (!aAsync)
			ns.utils.wait(completedCheck);

		return completedCheck;
	},
	tearDownAllHTTPServers : function() { return this.tearDownAllHttpServers.apply(this, arguments); },
	tearDownHttpServers : function() { return this.tearDownAllHttpServers.apply(this, arguments); },
	tearDownHTTPServers : function() { return this.tearDownAllHttpServers.apply(this, arguments); },

	isHttpServerRunning : function()
	{
		return this._HTTPServerInstances.length > 0;
	},
	isHTTPServerRunning : function() { return this.isHttpServerRunning.apply(this, arguments); }
};
