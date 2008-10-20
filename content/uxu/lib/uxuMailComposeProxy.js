function UXUMailComposeProxy(aReal)
{
	this._real = aReal;
	this._init();
}
UXUMailComposeProxy.prototype = {
	_real : null,

	_properties : <![CDATA[
		type
		bodyModified
		savedFolderURI
		recyclingListener
		recycledWindow
		deleteDraft
		insertingQuotedContent
	]]>.toString(),
	_readOnlyProperties : <![CDATA[
		messageSend
		editor
		domWindow
		compFields
		composeHTML
		wrapLength
		progress
		originalMsgURI
	]]>.toString(),
	_methods : <![CDATA[
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
	]]>.toString(),

	// fallback
	__noSuchMethod__ : function(aName, aArgs)
	{
		return this._real[aName].apply(this._real, aArgs);
	},

	SendMsg : function(aDeliverMode, aIdentity, aAccountKey, aMsgWindow, aProgress)
	{
		Pref = Components.classes['@mozilla.org/preferences;1'] 
				.getService(Components.interfaces.nsIPrefBranch)
				.QueryInterface(Components.interfaces.nsIPrefBranch2);
		if (Pref.getBoolPref('extensions.uxu.running')) {
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
		else {
			return this._real.SendMsg.apply(this._real, arguments);
		}
	},
//	abort : function()
//	{
//	},

	_init : function()
	{
		var self = this;
		this._properties
			.replace(/^\s+|\s+$/g, '')
			.replace(/^\s*\/\/.+$/mg, '')
			.split(/\s+/)
			.forEach(function(aProp) {
				if (aProp in this) return;
				this.__defineGetter__(aProp, function() {
					return self._real[aProp];
				});
				this.__defineSetter__(aProp, function(aValue) {
					return self._real[aProp] = aValue;
				});
			}, this);
		this._readOnlyProperties
			.replace(/^\s+|\s+$/g, '')
			.replace(/^\s*\/\/.+$/mg, '')
			.split(/\s+/)
			.forEach(function(aProp) {
				if (aProp in this) return;
				this.__defineGetter__(aProp, function() {
					return self._real[aProp];
				});
			}, this);
		this._methods
			.replace(/^\s+|\s+$/g, '')
			.replace(/^\s*\/\/.+$/mg, '')
			.split(/\s+/)
			.forEach(function(aProp) {
				if (aProp in this) return;
				this[aProp] = function() {
					return self._real[aProp].apply(self._real, arguments);
				};
			}, this);
	}
};
