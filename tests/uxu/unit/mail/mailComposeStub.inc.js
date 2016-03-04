var properties = [
		'type',
		'bodyModified',
		'savedFolderURI',
		'recyclingListener',
		'recycledWindow',
		'deleteDraft',
		'insertingQuotedContent'
	];
var readOnlyProperties = [
		'messageSend',
		'editor',
		'domWindow',
		'compFields',
		'composeHTML',
		'wrapLength',
		'progress',
		'originalMsgURI'
	];
var methods = [
		'Initialize',
		'SetDocumentCharset',
		'RegisterStateListener',
		'UnregisterStateListener',
		'SendMsg',
		'CloseWindow',
		'abort',
		'quoteMessage',
		'AttachmentPrettyName',
		'expandMailingLists',
		'checkAndPopulateRecipients',
		'CheckAndPopulateRecipients',
		'bodyConvertible',
		'SetSignature',
		'checkCharsetConversion',
		'initEditor',
		'addMsgSendListener',
		'removeMsgSendListener',

		'onStartSending',
		'onProgress',
		'onStatus',
		'onStopSending',
		'onGetDraftFolderURI',
		'onSendNotPerformed'
	];

function createMailComposeStub()
{
	var mailComposeStub = {};
	properties.concat(readOnlyProperties).concat(methods)
		.forEach(function(aProp) {
			var value = parseInt(Math.random() * 65000);
			this.__defineGetter__(aProp, function() {
				return value;
			});
			this.__defineSetter__(aProp, function(aValue) {
				return value = aValue;
			});
		}, mailComposeStub);
	return mailComposeStub;
}
