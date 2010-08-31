// -*- indent-tabs-mode: t; tab-width: 4 -*-
/**
 * Copyright (C) 2010 by ClearCode Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA	02110-1301 USA
 *
 * Author: ClearCode Inc. http://www.clear-code.com/
 */

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
