// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);

var inherits = lib_module.require('class', 'event_target');

function constructor(aInput, aOutput)
{
	var scriptableInput = Cc['@mozilla.org/scriptableinputstream;1']
			.createInstance(Ci.nsIScriptableInputStream);
	var pump = Cc['@mozilla.org/network/input-stream-pump;1']
			.createInstance(Ci.nsIInputStreamPump);

	scriptableInput.init(aInput);
	this._input = scriptableInput;
	this._output = aOutput;

	pump.init(aInput, -1, -1, 0, 0, false);
	pump.asyncRead(this, null);
}

function destroy()
{
	this._input.close();
	this._input = null;

	this._output.close();
	this._output = null;
}

function onQuitRequest()
{
	this.destroy();
}

function onOutputRequest(aEvent)
{
	if (this._output)
		this._output.write(aEvent.data, aEvent.data.length);
	else
		dump("QUITED: " + aEvent.data);
}


// nsIStreamListener

function onStartRequest(aRequest, aContext)
{
}

function onStopRequest(aRequest, aContext, aStatus)
{
}

function onDataAvailable(aRequest, aContext, aInputStream, aOffset, aCount)
{
	if (!this._input) return;
	var input = this._input.read(aCount);
	if (aOffset) input = input.substring(aOffset);
	if (input) this.fireEvent('Input', input);
}
