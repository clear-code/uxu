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

var ns = {};
Components.utils.import('resource://uxu-modules/mail/mailComposeProxy.js', ns);
var UXUMailComposeProxy = ns.MailComposeProxy;

function UXUSimpleEnumeratorFromArray(aArray)
{
	this._index = 0;
	this._elements = aArray;
}
UXUSimpleEnumeratorFromArray.prototype = {
	_index    : 0,
	_elements : null,
	getNext : function()
	{
		if (!this.hasMoreElements()) {
			throw Components.results.NS_ERROR_FAILURE;
		}
		return this._elements[this._index++];
	},
	hasMoreElements : function()
	{
		return this._elements.length > this._index;
	},
	QueryInterface : function(aIID)
	{
		if (!aIID.equals(Components.interfaces.nsISimpleEnumerator) &&
			!aIID.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
}

function UXUGetFileFromArguments(aArgs)
{
	var file = aArgs && aArgs.length ? aArgs[aArgs.length-1] : null ;
	return (file && file instanceof Components.interfaces.nsIFile) ? file : null ;
}

window.addEventListener('DOMContentLoaded', function() {
	window.removeEventListener('DOMContentLoaded', arguments.callee, false);

	eval('window.ComposeStartup = '+window.ComposeStartup.toSource().replace(
		/(gMsgCompose) = ((sMsgComposeService|composeSvc).InitCompose\(window, params\);)/,
		'$1 = $2 if (!("_real" in $1)) { $1 = new UXUMailComposeProxy($1); }'
	));

	if (!('AddFileAttachment' in window)) { // only for Thunderbird 2
		eval('window.AttachFile = '+window.AttachFile.toSource().replace(
			'{',
			'{ var __uxu__fileFromArgument = UXUGetFileFromArguments(arguments);'
		).replace(
			'if (fp.show()',
			'if (__uxu__fileFromArgument || fp.show()'
		).replace(
			'fp.files',
			'(__uxu__fileFromArgument ? new UXUSimpleEnumeratorFromArray([__uxu__fileFromArgument]) : fp.files )'
		));
	}
}, false);
