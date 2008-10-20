var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils  = lib_module.require('package', 'utils');

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
