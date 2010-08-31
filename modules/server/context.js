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
	this.EXPORTED_SYMBOLS = ['Context'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/test/action.js', ns);
Components.utils.import('resource://uxu-modules/test/runner.js', ns);
Components.utils.import('resource://uxu-modules/server/reporter.js', ns);
Components.utils.import('resource://uxu-modules/lib/ijs.js', ns);

var utils = ns.utils;
var action = new ns.Action({ __proto__ : utils, utils : utils });

var WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator);

function Context(aEnvironment)
{
	this.initListeners();

	this.environment = aEnvironment;
	this.environment.__proto__ = this;

	this._buffer = '';
	this._lastEvaluatedScript = '';
}

Context.prototype = {
	__proto__ : ns.EventTarget.prototype,

	RETURNABLE_SYNTAX_ERROR : 'returnable syntax error',
	QUIT_MESSAGE : '\u001A__QUIT__',

	quit : function()
	{
		this.puts(this.QUIT_MESSAGE);
		this.fireEvent('QuitRequest');
	},

	exit : function()
	{
		this.quit();
	},

	inspect : function(aObject)
	{
		return utils.inspect(aObject);
	},

	inspectDOMNode : function(aNode)
	{
		return utils.inspectDOMNode(aNode);
	},

	print : function()
	{
		var message = Array.slice(arguments).join('');
		this.fireEvent('ResponseRequest', message);
	},

	puts : function()
	{
		var message = Array.slice(arguments).join('\n');
		if (!/\n$/.test(message)) message += '\n';
		this.fireEvent('ResponseRequest', message);
	},

	p : function()
	{
		var i;
		for (i = 0; i < arguments.length; i++) {
			this.puts(utils.inspect(arguments[i]));
		}
	},

	error : function(aException)
	{
		this.print(this.formatError(aException));
	},

	load : function(aURI, aContext)
	{
		var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
			.getService(Ci.mozIJSSubScriptLoader);
		return loader.loadSubScript(aURI, aContext || this.environment);
	},

	evaluate : function(aCode)
	{
		try {
			this._lastEvaluatedScript = aCode;
			return this.load('chrome://uxu/content/lib/subScriptRunner.js?code='+encodeURIComponent(aCode));
		}
		catch(e) {
			let parser;
			try {
				parser = new ns.Parser(aCode);
				parser.parse();
			}
			catch(e) {
				if (parser.token === ns.Lexer.EOS && e === ns.Parser.SYNTAX)
					throw new Error(this.RETURNABLE_SYNTAX_ERROR);
			}
			return utils.formatError(utils.normalizeError(e));
		}
	},

	quitApplication : function(aForceQuit)
	{
		utils.quitApplication(aForceQuit);
	},

	closeMainWindows : function()
	{
		var targets = WindowManager.getEnumerator('navigator:browser');
		while (targets.hasMoreElements())
		{
			var target;
			target = targets.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
			target.close();
		}
	},


	onServerInput : function(aEvent) {
		var code = aEvent.data;
		if (/[\r\n]+$/.test(code)) {
			if (this._buffer) {
				code = this._buffer + code;
				this._buffer = '';
			}
		}
		else {
			this._buffer += code;
			return;
		}
		try {
			var result = this.evaluate(code);
			if (result !== undefined)
				this.puts(result);
		}
		catch(e) {
			if (e.message == this.RETURNABLE_SYNTAX_ERROR)
				this._buffer = code;
		}
	}
};
