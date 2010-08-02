var targetProduct = 'Thunderbird';

var topDir = baseURL+'../../../../';

var Observer = utils.import(topDir+'modules/observer.js', {}).Observer;
var MailUtils = utils.import(topDir+'modules/mail/utils.js', {}).MailUtils;

var utilsModule;

var observer;

function setUp()
{
	utilsModule = new MailUtils(this);
}

function tearDown()
{
	utilsModule.destroy();
}

var mailCompFields = {
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

function testEmulateSendMessage()
{
	assert.isFunction(utilsModule.emulateSendMessage);

	observer = new Observer();
	assert.equals(0, observer.count);

	observer.startObserve('uxu:mail:sent');
	utilsModule.emulateSendMessage(window, mailCompFields);
	observer.endObserve('uxu:mail:sent');

	assert.equals(1, observer.count);
	assert.equals(window, observer.lastSubject);
	assert.equals('uxu:mail:sent', observer.lastTopic);
	assert.isTrue(observer.lastData);

	var data = utils.evalInSandbox(observer.lastData);
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

function testDeliveries()
{
	assert.isDefined(utilsModule.deliveries);

	utilsModule.emulateSendMessage(window, mailCompFields);
	assert.equals(1, utilsModule.deliveries.length);

	var data = utilsModule.deliveries[0];
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

	assert.isFunction(utilsModule.clear);
	utilsModule.clear();
	assert.equals(0, utilsModule.deliveries.length);
}

function testUseFormatFlowed()
{
	assert.isTrue(utilsModule.useFormatFlowed('UTF-8'));
	assert.isTrue(utilsModule.useFormatFlowed('Shfit_JIS'));
}

function testIsMultibyteCharset()
{
	assert.isTrue(utilsModule.isMultibyteCharset('Shift_JIS'));
	assert.isFalse(utilsModule.isMultibyteCharset('ASCII'));
}

function testIsAscii()
{
	assert.isTrue(utilsModule.isAscii('ascii'));
	assert.isFalse(utilsModule.isAscii('日本語'));
}
