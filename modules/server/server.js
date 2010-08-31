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
	this.EXPORTED_SYMBOLS = ['Server'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/server/handler.js', ns);

var utils = ns.utils;

function Server(aPort)
{
	this.initListeners();

	this._port  = (typeof aPort == 'number') ? aPort : -1 ;
	this._allowAccessesFromRemote = utils.getPref('extensions.uxu.allowAccessesFromRemote');

	this.socket = null;
	this._handlers = [];
}

Server.prototype = {
	__proto__ : ns.EventTarget.prototype,

	get port() {
		return this.socket ? this.socket.port : this._port ;
	},

	start : function()
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
	},

	stop : function()
	{
		this._handlers.forEach(function (aHandler) {
			this.removeListener(aHandler);
			aHandler.removeListener(this);
			aHandler.destroy();
		}, this);
		this._handlers = [];
		this.removeAllListeners();
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	},

	destroy : function()
	{
		this.stop();
	},


	// from listener to handler
	onResponseRequest : function(aEvent)
	{
		this.fireEvent('OutputRequest', aEvent.data);
	},

	// from handler to listener
	onHandlerInput : function(aEvent)
	{
		this.fireEvent('ServerInput', aEvent.data);
	},

	onQuitRequest : function(aEvent)
	{
		this.fireEvent('QuitRequest', aEvent.data);
	},


	// nsIServerSocketListener

	onSocketAccepted : function(aSocket, aTransport)
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
			var handler = new ns.Handler(input, output);
			handler.addListener(this);
			this.addListener(handler);
			this._handlers.push(handler);
		}
		catch (e) {
			aTransport.close(Components.results.NS_ERROR_UNEXPECTED);
			dump('UxU: Error: ' + utils.formatError(utils.normalizeError(e)) + '\n');
		}
	},

	onStopListening : function(aSocket, aStatus)
	{
		this.stop();
	}
};
