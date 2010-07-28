if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['MailComposeProxy'];

var Cc = Components.classes;
var Ci = Components.interfaces;

var ns = {}; 
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/mail/utils.js', ns);

var utils = ns.utils;
var mailUtils = new ns.MailUtils({ __proto__ : utils, utils : utils });

function MailComposeProxy(aReal)
{
	this._real = aReal;

	properties
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\s*\/\/.+$/mg, '')
		.split(/\s+/)
		.forEach(function(aProp) {
			if (aProp in this || !(aProp in this._real)) return;
			this.__defineGetter__(aProp, function() {
				return this._real[aProp];
			});
			this.__defineSetter__(aProp, function(aValue) {
				return this._real[aProp] = aValue;
			});
		}, this);
	(readOnlyProperties+methods)
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\s*\/\/.+$/mg, '')
		.split(/\s+/)
		.forEach(function(aProp) {
			if (aProp in this || !(aProp in this._real)) return;
			this.__defineGetter__(aProp, function() {
				return this._real[aProp];
			});
		}, this);


	this.DEBUG = false;
}

MailComposeProxy.prototype = {


SendMsg : function(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress)
{
	if (this.DEBUG ||
		utils.getPref('extensions.uxu.running')) {
		this._fakeSendMsg.apply(this, arguments);
	}
	else {
		return this._real.SendMsg.apply(this._real, arguments);
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
				if (progress) {
					progress.unregisterListener(this._real);
		//			progress.closeProgressDialog(false);
				}
				if (win) this._real.CloseWindow(true);
			}
		}
		else {
			if (progress) {
				progress.unregisterListener(this._real);
		//		progress.closeProgressDialog(false);
			}
			if (win) this._real.CloseWindow(true);
		}
		if (this._real.deleteDraft) this._real.removeCurrentDraftMessage(this._real, false);
	}
	catch(e) {
		if (!this.DEBUG) throw e;
	}
},

/*
abort : function()
{
},
*/

// fallback
__noSuchMethod__ : function(aName, aArgs)
{
	if (!(aName in this._real)) {
		throw 'MailComposeProxy: the property "'+aName+'" is undefined.';
	}
	return this._real[aName].apply(this._real, aArgs);
}

};


var properties = <![CDATA[
		type
		bodyModified
		savedFolderURI
		recyclingListener
		recycledWindow
		deleteDraft
		insertingQuotedContent
	]]>.toString();
var readOnlyProperties = <![CDATA[
		messageSend
		editor
		domWindow
		compFields
		composeHTML
		wrapLength
		progress
		originalMsgURI
	]]>.toString();
var methods = <![CDATA[
		Initialize 
		SetDocumentCharset
		RegisterStateListener
		UnregisterStateListener
		SendMsg
		CloseWindow
		abort
		quoteMessage
		AttachmentPrettyName
		checkAndPopulateRecipients
		CheckAndPopulateRecipients
		bodyConvertible
		SetSignature
		checkCharsetConversion
		initEditor
		addMsgSendListener
		removeMsgSendListener

		onStartSending
		onProgress
		onStatus
		onStopSending
		onGetDraftFolderURI
		onSendNotPerformed
	]]>.toString();

