var Cc = Components.classes;
var Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils  = lib_module.require('package', 'utils');

var mail_module = new ModuleManager(['chrome://uxu/content/mail']); 
var mailUtils = mail_module.require('package', 'utils');


function constructor(aReal)
{
	this._real = aReal;
	this._init();
	this.DEBUG = false;
}


function SendMsg(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress)
{
	if (this.DEBUG ||
		utils.getPref('extensions.uxu.running')) {
		this._fakeSendMsg.apply(this, arguments);
	}
	else {
		return this._real.SendMsg.apply(this._real, arguments);
	}
}

function _fakeSendMsg(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress)
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
}

/*
function abort()
{
}
*/

var _properties = <![CDATA[
		type
		bodyModified
		savedFolderURI
		recyclingListener
		recycledWindow
		deleteDraft
		insertingQuotedContent
	]]>.toString();
var _readOnlyProperties = <![CDATA[
		messageSend
		editor
		domWindow
		compFields
		composeHTML
		wrapLength
		progress
		originalMsgURI
	]]>.toString();
var _methods = <![CDATA[
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

// fallback
var __noSuchMethod__ = function(aName, aArgs)
{
	return this._real[aName].apply(this._real, aArgs);
}


function _init()
{
	_properties
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\s*\/\/.+$/mg, '')
		.split(/\s+/)
		.forEach(function(aProp) {
			if (aProp in this) return;
			this.__defineGetter__(aProp, function() {
				return this._real[aProp];
			});
			this.__defineSetter__(aProp, function(aValue) {
				return this._real[aProp] = aValue;
			});
		}, this);
	(_readOnlyProperties+_methods)
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\s*\/\/.+$/mg, '')
		.split(/\s+/)
		.forEach(function(aProp) {
			if (aProp in this) return;
			this.__defineGetter__(aProp, function() {
				return this._real[aProp];
			});
		}, this);
}
