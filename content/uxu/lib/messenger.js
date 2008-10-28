const Cc = Components.classes;
const Ci = Components.interfaces;

var TransportService = Cc['@mozilla.org/network/socket-transport-service;1'] 
		.getService(Ci.nsISocketTransportService);

function constructor(aHost, aPort, aListener) 
{
	this._listener = aListener;
	this._buffer = '';

	var transport = TransportService.createTransport(null, 0, aHost, aPort, null);
	this._output = transport.openOutputStream(0, 0, 0);
	this._input = transport.openInputStream(0, 0, 0);
	this._scriptableInput = Cc['@mozilla.org/scriptableinputstream;1']
				.createInstance(Ci.nsIScriptableInputStream);
	this._scriptableInput.init(this._input);

	var pump = Cc['@mozilla.org/network/input-stream-pump;1']
			.createInstance(Ci.nsIInputStreamPump);
	pump.init(this._input, -1, -1, 0, 0, false);
	pump.asyncRead(this, null);
}

function send(aMessage)
{
	this._output.write(aMessage, aMessage.length);
}

function onStartRequest(aRequest, aContext)
{
},

function onStopRequest(aRequest, aContext, aStatus)
{
	this._scriptableInput.close();
	this._input.close();
	this._output.close();
//	this._listener.onGetResponse(this._buffer);
},

function onDataAvailable(aRequest, aContext, aInputStream, aOffset, aCount)
{
	var chunk = this._scriptableInput.read(aCount);
	this._buffer += chunk;
	this._listener.onGetMessageResponse(chunk);
}
