// -*- indent-tabs-mode: t; tab-width: 4 -*-

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Handler'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);

function Handler(aInput, aOutput)
{
	this.initListeners();

	var scriptableInput = Cc['@mozilla.org/scriptableinputstream;1']
			.createInstance(Ci.nsIScriptableInputStream);
	var pump = Cc['@mozilla.org/network/input-stream-pump;1']
			.createInstance(Ci.nsIInputStreamPump);

	scriptableInput.init(aInput);
	this._input = scriptableInput;
	this._output = aOutput;

	this._buffer = '';

	pump.init(aInput, -1, -1, 0, 0, false);
	pump.asyncRead(this, null);
}

Handler.prototype = {
	__proto__ : ns.EventTarget.prototype,

	destroy : function()
	{
		if (this._input) {
			this._input.close();
			this._input = null;
			this._buffer = '';
		}
		if (this._output) {
			this._output.close();
			this._output = null;
		}
		this.removeAllListeners();
	},

	onQuitRequest : function()
	{
		this.destroy();
	},

	onOutputRequest : function(aEvent)
	{
		if (this._output)
			this._output.write(aEvent.data, aEvent.data.length);
		else
			dump("QUITED: " + aEvent.data);
	},


	// nsIStreamListener

	onStartRequest : function(aRequest, aContext)
	{
	},

	onStopRequest : function(aRequest, aContext, aStatus)
	{
	},

	onDataAvailable : function(aRequest, aContext, aInputStream, aOffset, aCount)
	{
		if (!this._input) return;
		var input = this._input.read(aCount);
		if (input) this.fireEvent('HandlerInput', input);
	}
};
