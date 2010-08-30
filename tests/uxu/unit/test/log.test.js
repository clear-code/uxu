var topDir = baseURL+'../../../../';

var Report = utils.import(topDir+'modules/test/report.js', {}).Report;
var TestLog = utils.import(topDir+'modules/test/log.js', {}).TestLog;
var TestCase = utils.import(topDir+'modules/test/testCase.js', {}).TestCase;

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get(topDir+'locale/ja/uxu/uxu.properties');

function createReports(aTestCase)
{
	var notifications = [
			{ type    : 'notification',
			  message : 'info',
			  stack   : ['traceLine1', 'traceLine2'] },
			{ type    : 'warning',
			  message : 'warning',
			  stack   : ['traceLine1', 'traceLine2'] }
		];

	return [
		(function() {
			var r = new Report();
			r.addTopic({
				result      : TestCase.prototype.RESULT_SUCCESS,
				description : 'Success'
			});
			r.testCase = aTestCase;
			r.id    = 'success';
			r.index = 0;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.addTopic({
				result      : TestCase.prototype.RESULT_SUCCESS,
				description : 'Success with notifications'
			});
			r.notifications = notifications;
			r.testCase = aTestCase;
			r.id    = 'success';
			r.index = 1;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.addTopic({
				result      : TestCase.prototype.RESULT_FAILURE,
				description : 'Failure',
				exception   : new Error('Failure')
			});
			r.testCase = aTestCase;
			r.id    = 'success';
			r.index = 2;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.addTopic({
				result      : TestCase.prototype.RESULT_FAILURE,
				description : 'Failure with notifications',
				exception   : new Error('Failure')
			});
			r.notifications = notifications;
			r.testCase = aTestCase;
			r.id    = 'success';
			r.index = 3;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.addTopic({
				result      : TestCase.prototype.RESULT_SKIPPED,
				description : 'Skipped'
			});
			r.testCase = aTestCase;
			r.id    = 'success';
			r.index = 4;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.addTopic({
				result      : TestCase.prototype.RESULT_ERROR,
				description : 'Error',
				exception   : new Error('Error')
			});
			r.testCase = aTestCase;
			r.id    = 'success';
			r.index = 5;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.addTopic({
				result      : TestCase.prototype.RESULT_ERROR,
				description : 'Error with notifications',
				exception   : new Error('Error')
			});
			r.notifications = notifications;
			r.testCase = aTestCase;
			r.id    = 'success';
			r.index = 6;
			return r;
		})()
	];
}

function createStartEvent(aTestCase)
{
	return {
			type   : 'Start',
			target : aTestCase
		};
}

function createTestFinishEvents(aTestCase, aReports)
{
	return aReports.slice(0, aReports.length-1).map(function(aReport) {
			return {
				type   : 'TestFinish',
				target : aTestCase,
				data   : aReport
			};
		});
}

function createFinishEvent(aTestCase, aReports)
{
	return {
		type   : 'Finish',
		target : aTestCase,
		data   : aReports[aReports.length-1]
	};
}

var log,
	testcase1,
	testcase2,
	reports1,
	reports2;

function startUp()
{
	utils.setPref('general.useragent.locale', 'ja');
}

function setUp()
{
	utils.setPref('general.useragent.locale', 'ja');

	testcase1 = new TestCase('test1');
	testcase2 = new TestCase('test2');
	reports1 = createReports(testcase1);
	reports2 = createReports(testcase2);
	log = new TestLog();
}

function tearDown()
{
}

function testOnEvents()
{
	log.onStart(createStartEvent(testcase1));
	assert.equals(1, log.items.length);
	assert.equals('test1', log.items[0].title);
	assert.equals([], log.items[0].topics);
	assert.isFalse(log.items[0].aborted);

	var events = createTestFinishEvents(testcase1, reports1);
	events.forEach(function(aEvent) {
		log.onTestFinish(aEvent);
	});
	assert.equals(1, log.items.length);
	assert.equals('test1', log.items[0].title);
	assert.equals(reports1.length-1, log.items[0].topics.length);
	assert.isFalse(log.items[0].aborted);

	var topics = log.items[0].topics;
	topics.forEach(function(aResult, aIndex) {
		var report = reports1[aIndex];
		assert.equals(report.result, aResult.type, aIndex);
		assert.equals(report.description, aResult.title, aIndex);
		assert.isNumber(aResult.timestamp, aIndex);
		assert.isNumber(aResult.time, aIndex);
		assert.isNumber(aResult.detailedTime, aIndex);
		assert.equals(report.notifications.length, aResult.notifications.length, aIndex);
		aResult.notifications.forEach(function(aNotification, aIndex) {
			var notification = report.notifications[aIndex];
			var type = notification.type || 'notification';
			var description = bundle.getFormattedString('notification_message_'+type, [notification.message]) ||
						notification.message;
			assert.equals(notification.type, aNotification.type, aIndex);
			assert.equals(description, aNotification.description, aIndex);
			assert.isDefined(aNotification.stackTrace, aIndex);
		});
	});

	log.onFinish(createFinishEvent(testcase1, reports1));
	assert.equals(1, log.items.length);
	assert.equals(reports1.length, log.items[0].topics.length);
	assert.isFalse(log.items[0].aborted);

	log.onAbort({ type : 'Abort' });
	assert.equals(1, log.items.length);
	assert.equals(reports1.length, log.items[0].topics.length);
	assert.isTrue(log.items[0].aborted);
}

function test_clear()
{
	log.onStart(createStartEvent(testcase1));
	assert.equals(1, log.items.length);
	assert.equals('test1', log.items[0].title);
	assert.equals([], log.items[0].topics);
	assert.isFalse(log.items[0].aborted);

	log.clear();
	assert.equals([], log.items);
}

function test_toString()
{
	log.onStart(createStartEvent(testcase1));
	var events = createTestFinishEvents(testcase1, reports1);
	events.forEach(function(aEvent) {
		log.onTestFinish(aEvent);
	});
	log.onFinish(createFinishEvent(testcase1, reports1));

	var start = Date.now();
	var now = start + 500;
	var finish = now + 500;
	var params = {
			now : new Date(now),
			start : new Date(start),
			finish : new Date(finish),
			baseURL : baseURL
		};

	log.lastItem.start = start;
	log.lastItem.finish = finish;
	log.lastItem.topics.forEach(function(aResult, aIndex) {
		aResult.timestamp = now;
	});

	var textVersion;

	textVersion = utils.parseTemplate(
			utils.readFrom('../../fixtures/log.txt', 'UTF-8'),
			params
		);
	assert.equals(textVersion, log.toString(log.FORMAT_TEXT));

	textVersion = utils.parseTemplate(
			utils.readFrom('../../fixtures/log_ignore_skipped.txt', 'UTF-8'),
			params
		);
	assert.equals(textVersion, log.toString());
	assert.equals(textVersion, log.toString(log.FORMAT_TEXT | log.IGNORE_SKIPPED));

	textVersion = utils.parseTemplate(
			utils.readFrom('../../fixtures/log_ignore_skipped_and_success.txt', 'UTF-8'),
			params
		);
	assert.equals(textVersion, log.toString(log.FORMAT_TEXT | log.IGNORE_SKIPPED | log.IGNORE_SUCCESS));
}
