var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var lib_module = new ModuleManager([topDir+'content/uxu/lib']);
var ObserverClass = lib_module.require('class', 'observer');

var MailComposeProxy;

function warmUp()
{
	assert.equals('Thunderbird', utils.product);

	var mail_module = new ModuleManager([topDir+'content/uxu/mail']);
	MailComposeProxy = mail_module.require('class', 'mailComposeProxy');
}

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
			this.__defineSetter__(aProp, function(aValue) {
				return value = aValue;
			});
		}, mailComposeStub);
	return mailComposeStub;
}

var mailComposeStub;

function setUp()
{
	assert.equals('Thunderbird', utils.product);
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

function testSendMessage()
{
	mailComposeStub.compFields = {
			from    : 'from@foobar',
			replyTo : 'reply-to@foobar',
			to      : 'to@foobar',
			cc      : 'cc@foobar',
			bcc     : 'bcc@foobar',

			newsgroups  : 'group',
			newshost    : 'host',
			newspostUrl : 'url',
			followupTo  : 'followup',

			subject      : 'SUBJECT',
			organization : 'ORGANIZATION',
			priority     : 'high',
			messageId    : 'foobar',
			characterSet : 'UTF-8',

			body : 'BODY'
		};

	observer = new ObserverClass();
	assert.equals(0, observer.count);

	observer.startObserve('uxu:mail:sent');
	proxy.DEBUG = true;
	proxy.SendMsg();
	observer.endObserve('uxu:mail:sent');

	assert.equals(1, observer.count);
	assert.equals('uxu:mail:sent', observer.lastTopic);
	assert.isTrue(observer.lastData);

	var data ;
	eval('data = '+observer.lastData);
	assert.isTrue(data);

	assert.equals('from@foobar', data.from);
	assert.equals('reply-to@foobar', data.replyTo);
	assert.equals('to@foobar', data.to);
	assert.equals('cc@foobar', data.cc);
	assert.equals('bcc@foobar', data.bcc);
	assert.equals('group', data.newsgroups);
	assert.equals('host', data.newshost);
	assert.equals('url', data.newspostUrl);
	assert.equals('followup', data.followupTo);
	assert.equals('SUBJECT', data.subject);
	assert.equals('ORGANIZATION', data.organization);
	assert.equals('high', data.priority);
	assert.equals('foobar', data.messageId);
	assert.equals('UTF-8', data.characterSet);
	assert.equals('BODY', data.body);
}
