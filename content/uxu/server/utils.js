var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');
var EventTarget = lib_module.require('class', 'event_target');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server = server_module.require('class', 'server');
var Message = server_module.require('class', 'message');

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
