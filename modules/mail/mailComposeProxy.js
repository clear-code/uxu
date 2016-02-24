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
 * Portions created by the Initial Developer are Copyright (C) 2010-2016
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

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['MailComposeProxy'];

var Cc = Components.classes;
var Ci = Components.interfaces;

var ns = {}; 
Components.utils.import('resource://uxu-modules/lib/inherit.jsm', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/mail/utils.js', ns);

var utils = ns.utils;
var mailUtils = new ns.MailUtils(ns.inherit(utils, { utils : utils }));

function MailComposeProxy(aReal)
{
	this._real = aReal;
	this.DEBUG = false;
}

MailComposeProxy.prototype = {


SendMsg : function(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress, ...aArgs)
{
	var allArgs = [aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress].concat(aArgs);
	if (this.DEBUG ||
		utils.getPref('extensions.uxu.running')) {
		return this._fakeSendMsg.apply(this, allArgs);
	}
	else {
		return this._real.SendMsg.apply(this._real, allArgs);
	}
},

_fakeSendMsg : function(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress)
{
	var compFields = this._real.compFields;
	try {
		if (compFields instanceof Ci.nsIMsgCompFields) {
			var contentType = null;
			// nsMsgCompose::SendMsgの実装の部分移植。
			// プレーンテキストメールしか送信できない。HTMLメールはどうしたらいいのやら……
			if (!this._real.composeHTML) {
				contentType = 'text/plain';
				if (this._real.editor) {
					/* http://mxr.mozilla.org/mozilla1.8/source/content/base/public/nsIDocumentEncoder.h */
					var flags = 2    /* nsIDocumentEncoder::OutputFormatted */ |
								512  /* nsIDocumentEncoder::OutputCRLineBreak */ |
								1024 /* nsIDocumentEncoder::OutputLFLineBreak */;
					if (mailUtils.useFormatFlowed(compFields.characterSet))
						flags |= 64; /* nsIDocumentEncoder::OutputFormatFlowed */
					compFields.body = '';
					compFields.body = this._real.editor.outputToString('text/plain', flags);
				}
			}
			if (compFields.body) {
				var info = {};
				try {
					info = mailUtils.saveAsCharset(contentType, compFields.characterSet, compFields.body);
					if (compFields.forceMsgEncoding) {
						info.isAsciiOnly = false;
					}
				}
				catch(e) {
					if (compFields.needToCheckCharset) {
						info.output = utils.UnicodeToX(compFields.body, 'UTF-8');
					}
				}
				if (info.fallbackCharset) {
					compFields.characterSet = info.fallbackCharset;
				}
				compFields.bodyIsAsciiOnly = info.isAsciiOnly || false;
				if (info.output) {
					compFields.body = info.output;
				}
			}
			else {
				compFields.body = utils.UnicodeToX(compFields.body, 'ASCII');
			}
		}

		mailUtils.emulateSendMessage(aMsgWindow, compFields);

		var progress = this._real.progress;
		var compFields = this._real.compFields;
		var win = this._real.domWindow;
		if (compFields.fcc) {
			if (compFields.fcc.toLowerCase() == 'nocopy://') {
				if (progress && typeof progress.unregisterListener == 'function') {
					progress.unregisterListener(this._real);
		//			progress.closeProgressDialog(false);
				}
				if (win &&
					typeof this._real.CloseWindow == 'function') {
					this._real.CloseWindow(true);
				}
			}
		}
		else {
			if (progress && typeof progress.unregisterListener == 'function') {
				progress.unregisterListener(this._real);
		//		progress.closeProgressDialog(false);
			}
			if (win &&
				typeof this._real.CloseWindow == 'function') {
				this._real.CloseWindow(true);
			}
		}
		if (this._real.deleteDraft &&
			typeof this._real.removeCurrentDraftMessage == 'function') {
			this._real.removeCurrentDraftMessage(this._real, false);
		}
	}
	catch(e) {
		if (!this.DEBUG) throw e;
	}
}

/*
,

abort : function()
{
}
*/

};

MailComposeProxy.create = function(aReal) {
  var proxied = new MailComposeProxy(aReal);
  var cachedMethods = {};
  function proxyMethod(aName) {
    return cachedMethods[aName] = cachedMethods[aName] || proxied[aName].bind(proxied);
  }
  /**
   * Create a proxy for "{}" instaead of "aReal", because ES6 Proxy
   * doesn't allow to return different value for writable=false & configurable=false
   * properties of the original. Otherwise you'll get "TypeError"
   * as the result. See also:
   *   https://bugzilla.mozilla.org/show_bug.cgi?id=814892
   *   https://github.com/tvcutsem/harmony-reflect/blob/master/doc/handler_api.md
   */
  return new Proxy({}, {
    get: function(aTarget, aName, aReceiver) {
      if (typeof MailComposeProxy.prototype[aName] === 'function') {
        return proxyMethod(aName);
      }
      return aReal[aName];
    },
    set: function(aTarget, aName, aValue, aReceiver) {
      return aReal[aName] = aValue;
    }
  });
};
