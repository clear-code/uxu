utils.include('../../../../content/uxu/lib/module_manager.js');

var mail_module = new ModuleManager(['chrome://uxu/content/mail']);
var MailComposeProxy = mail_module.require('class', 'mailComposeProxy');

var proxy;

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

function createMailComposeStub()
{
	var mailComposeStub = {};
	(properties+readOnlyProperties+methods)
		.replace(/^\s+|\s+$/g, '')
		.replace(/^\s*\/\/.+$/mg, '')
		.split(/\s+/)
		.forEach(function(aProp) {
			var value = parseInt(Math.random() * 65000);
			this.__defineGetter__(aProp, function() {
				return value;
			});
		}, mailComposeStub);
	return mailComposeStub;
}

var mailComposeStub;

function setUp()
{
	mailComposeStub = createMailComposeStub();
	proxy = new MailComposeProxy(mailComposeStub);
}

function tearDown()
{
}

function testProperties()
{
	assert.equals(mailComposeStub.type, proxy.type);
	assert.equals(mailComposeStub.bodyModified, proxy.bodyModified);
	assert.equals(mailComposeStub.savedFolderURI, proxy.savedFolderURI);
	assert.equals(mailComposeStub.recyclingListener, proxy.recyclingListener);
	assert.equals(mailComposeStub.recycledWindow, proxy.recycledWindow);
	assert.equals(mailComposeStub.deleteDraft, proxy.deleteDraft);
	assert.equals(mailComposeStub.insertingQuotedContent, proxy.insertingQuotedContent);
	assert.equals(mailComposeStub.messageSend, proxy.messageSend);
	assert.equals(mailComposeStub.editor, proxy.editor);
	assert.equals(mailComposeStub.domWindow, proxy.domWindow);
	assert.equals(mailComposeStub.compFields, proxy.compFields);
	assert.equals(mailComposeStub.composeHTML, proxy.composeHTML);
	assert.equals(mailComposeStub.wrapLength, proxy.wrapLength);
	assert.equals(mailComposeStub.progress, proxy.progress);
	assert.equals(mailComposeStub.originalMsgURI, proxy.originalMsgURI);
	assert.equals(mailComposeStub.Initialize , proxy.Initialize );
	assert.equals(mailComposeStub.SetDocumentCharset, proxy.SetDocumentCharset);
	assert.equals(mailComposeStub.RegisterStateListener, proxy.RegisterStateListener);
	assert.equals(mailComposeStub.UnregisterStateListener, proxy.UnregisterStateListener);
	assert.equals(mailComposeStub.CloseWindow, proxy.CloseWindow);
	assert.equals(mailComposeStub.abort, proxy.abort);
	assert.equals(mailComposeStub.quoteMessage, proxy.quoteMessage);
	assert.equals(mailComposeStub.AttachmentPrettyName, proxy.AttachmentPrettyName);
	assert.equals(mailComposeStub.checkAndPopulateRecipients, proxy.checkAndPopulateRecipients);
	assert.equals(mailComposeStub.CheckAndPopulateRecipients, proxy.CheckAndPopulateRecipients);
	assert.equals(mailComposeStub.bodyConvertible, proxy.bodyConvertible);
	assert.equals(mailComposeStub.SetSignature, proxy.SetSignature);
	assert.equals(mailComposeStub.checkCharsetConversion, proxy.checkCharsetConversion);
	assert.equals(mailComposeStub.initEditor, proxy.initEditor);
	assert.equals(mailComposeStub.addMsgSendListener, proxy.addMsgSendListener);
	assert.equals(mailComposeStub.removeMsgSendListener, proxy.removeMsgSendListener);
	assert.equals(mailComposeStub.onStartSending, proxy.onStartSending);
	assert.equals(mailComposeStub.onProgress, proxy.onProgress);
	assert.equals(mailComposeStub.onStatus, proxy.onStatus);
	assert.equals(mailComposeStub.onStopSending, proxy.onStopSending);
	assert.equals(mailComposeStub.onGetDraftFolderURI, proxy.onGetDraftFolderURI);
	assert.equals(mailComposeStub.onSendNotPerformed, proxy.onSendNotPerformed);

	assert.notEquals(mailComposeStub.SendMsg, proxy.SendMsg);
	assert.isFunction(proxy.SendMsg);

}
