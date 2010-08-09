if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['ServerUtils'];

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
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

	setUpHttpServer : function(aPort, aBasePath, aAsync)
	{
		if (!aPort) throw new Error(ERROR_INVALID_PORT);
		if (this._HTTPServerInstances.some(function(aServer) {
				return aServer.port == aPort;
			}))
			throw new Error(ERROR_USED_PORT);

		var server = new ns.HTTPServer(aPort, aBasePath);
		this._HTTPServerInstances.push(server);

		var completedCheck = function() {
				return !server.isStopped();
			};

		if (aAsync)
			return completedCheck;

		ns.utils.wait(completedCheck);
		return { value : true };
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

	tearDownAllHttpServers : function(aAsync)
	{
		var stopped = [];
		while (this._HTTPServerInstances.length)
		{
			stopped.push(this.tearDownHttpServer());
		}
		var completedCheck = function() {
				return stopped.every(function(aStopped) {
						return aStopped.value;
					});
			};

		if (aAsync)
			return completedCheck;

		ns.utils.wait(completedCheck);
		return { value : true };
	},

	isHttpServerRunning : function()
	{
		return this._HTTPServerInstances.length > 0;
	},

	processRequestByHtaccess : function(aPath, aHtaccess) 
	{
		return this._processRewriteRule(aPath, aHtaccess) ||
		       this._processRedirect(aPath, aHtaccess);
	},
	REWRITE_RULES_PATTERN : /^\s*RewriteRule\s+.+$/gm,
	REWRITE_RULE_PATTERN : /RewriteRule\s+([^\s]+)(?:\s+([^\s]+))?(?:\s+(\[[^\]]+\]))?/,
	_processRewriteRule : function(aPath, aHtaccess)
	{
		/* This supports following flags:
			* F(forbidden)
			* G(gone)
			* L(last)
			* NC(nocase)
			* R(redirect)
		*/
		var rules = aHtaccess.match(this.REWRITE_RULES_PATTERN);
		if (!rules) return null;

		var result = {
				status     : 200,
				statusText : 'OK',
				uri        : null
			};

		var rewrited = false;
		rules.some(function(aLine) {
			let match = aLine.match(this.REWRITE_RULE_PATTERN);
			if (!match)
				return false;

			var [redirect, from, to, flags] = match;
			flags = flags || '';

			from = new RegExp(from, /\b(NC|nocase)\b/.test(flags) ? 'i' : '');
			if (!from.test(aPath))
				return false;

			if (/\b(F|forbidden)\b/.test(flags)) {
				result.status = 403;
				result.statusText = this._statusTextFromCode[result.status] || '';
				rewrited = true;
			}
			else if (/\b(G|gone)\b/.test(flags)) {
				result.status = 401;
				result.statusText = this._statusTextFromCode[result.status] || '';
				rewrited = true;
			}
			else if (to != '-') {
				result.uri = aPath.replace(from, to);
				rewrited = true;

				if (/\b(R|redirect)\b/.test(flags)) {
					let match = flags.match(/R=([0-9]+)/);
					let status = 302;
					if (match) {
						let statusFromFlags = parseInt(match[1]);
						if (statusFromFlags >= 300 && status <= 399)
							status = statusFromFlags;
					}
					result.status     = status;
					result.statusText = this._statusTextFromCode[status] || '';
				}
				aPath = result.uri;
			}
			return /\b(L|last)\b/.test(flags);
		}, this);

		if (rewrited)
			return result;

		return null;
	},
	REDIRECTIONS_PATTERN : /^\s*Redirect(Match|Permanent|Temp)?\s+.+$/gim,
	REDIRECTION_PATTERN : /Redirect(Match|Permanent|Temp)?\s+(?:([^\s]+)\s+)?([^\s]+)\s+([^\s]+)/,
	_processRedirect : function(aPath, aHtaccess)
	{
		var redirections = aHtaccess.match(this.REDIRECTIONS_PATTERN);
		if (!redirections) return null;

		var result = {
				status     : 0,
				statusText : '',
				uri        : null
			};

		if (redirections.some(function(aLine) {
				let match = aLine.match(this.REDIRECTION_PATTERN);
				if (!match)
					return false;

				var [redirect, type, status, from, to] = match;

				if (status && /^[0-9]+$/.test()) {
					status = parseInt(status);
					if (status < 300 || status > 399)
						return false;
				}

				switch (type)
				{
					case 'Match':
						from = new RegExp(from);
						break;

					case 'Permanent':
						if (status) return false;
						status = 301;
						break;

					case 'Temp':
						if (status) return false;
						status = 302;
						break;
				}

				if (typeof from == 'string' ?
						aPath.indexOf(from) != 0 :
						!from.test(aPath))
					return false;

				if (typeof status == 'string') {
					switch (status.toLowerCase())
					{
						case 'permanent':
							status = 301;
							break;
						case 'temp':
							status = 302;
							break;
						case 'seeother':
							status = 303;
							break;
						default:
							return false;
					}
				}

				var uri = aPath.replace(from, to);

				result.status     = status;
				result.statusText = this._statusTextFromCode[status] || '';
				result.uri        = uri;
				return true;
			}, this))
			return result;

		return null;
	},
	_statusTextFromCode : {
		'200' : 'OK',
		'301' : 'Moved Permanently',
		'302' : 'Found',
		'303' : 'See Other',
		'401' : 'Gone',
		'403' : 'Forbidden'
	}
};
