utils.include('../../../../content/uxu/lib/module_manager.js');

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var ObserverClass = lib_module.require('class', 'observer');

var mail_module = new ModuleManager(['chrome://uxu/content/mail']);
var utilsModule;

var observer;

function setUp()
{
	utilsModule = mail_module.require('package', 'utils');
}

function tearDown()
{
}

function testSend()
{
	assert.isFunction(utilsModule.emulateSendMessage);

	observer = new ObserverClass();
	assert.equals(0, observer.count);

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

	observer.startObserve('uxu:mail:sent');
	utilsModule.emulateSendMessage(window, mailCompFields);
	observer.endObserve('uxu:mail:sent');

	assert.equals(1, observer.count);
	assert.equals(window, observer.lastSubject);
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
