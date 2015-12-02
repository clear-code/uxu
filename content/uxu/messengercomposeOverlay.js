/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is UxU - UnitTest.XUL.
 *
 * The Initial Developer of the Original Code is YUKI "Piro" Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2010-2015
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): YUKI "Piro" Hiroshi <shimoda@clear-code.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

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

	{
		let source = window.ComposeStartup.toSource();
		if (source.indexOf('gMsgCompose = ') > -1) {
			eval('window.ComposeStartup = '+source.replace(
				/(gMsgCompose) = ((?:sMsgComposeService|composeSvc|MailServices.compose).(?:I|i)nitCompose\((?:(?:window, )?params|params, window, editorElement.docShell)\);)/,
				'$1 = $2 if (!("_real" in $1)) { $1 = UXUMailComposeProxy.create($1); }'
			));
		}
		else { // Thunderbird 17 and later
			eval('window.ComposeStartup = '+source.replace(
				'{',
				'{ if (!("_real" in gMsgCompose)) { gMsgCompose = UXUMailComposeProxy.create(gMsgCompose); }'
			));
		}
	}

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
