var topDir = baseURL+'../../../../';

var Report = utils.import(topDir+'modules/test/report.js', {}).Report;
var TestLog = utils.import(topDir+'modules/test/log.js', {}).TestLog;
var TestCase = utils.import(topDir+'modules/test/testCase.js', {}).TestCase;

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get(topDir+'locale/ja/uxu/uxu.properties');

var notificationsTemplate = [
		{ type    : 'notification',
		  message : 'info',
		  stack   : ['traceLine1', 'traceLine2'] },
		{ type    : 'warning',
		  message : 'warning',
		  stack   : ['traceLine1', 'traceLine2'] }
	];

function createReports(aTestCase)
{
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
			r.notifications = notificationsTemplate;
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
			r.notifications = notificationsTemplate;
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
			r.notifications = notificationsTemplate;
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
}

function setUp()
{
	testcase1 = new TestCase('test1');
	testcase2 = new TestCase('test2');
	reports1 = createReports(testcase1);
	reports2 = createReports(testcase2);
	log = new TestLog();
	log.bundle = bundle;
}

function tearDown()
{
}

function testOnStart()
{
	log.onStart(createStartEvent(testcase1));
	assert.equals(1, log.items.length);
	assert.equals({
		title: 'test1',
		topics: [],
		aborted: false
	}, {
		title: log.items[0].title,
		topics: log.items[0].topics,
		aborted: log.items[0].aborted
	});
}

function testOnTestFinish()
{
	log.onStart(createStartEvent(testcase1));

	var events = createTestFinishEvents(testcase1, reports1);
	events.forEach(function(aEvent) {
		log.onTestFinish(aEvent);
	});
	assert.equals(1, log.items.length);
	assert.equals({
		title: 'test1',
		topicsLength: reports1.length-1,
		aborted: false
	}, {
		title: log.items[0].title,
		topicsLength: log.items[0].topics.length,
		aborted: log.items[0].aborted
	});

	var topics = log.items[0].topics;
	topics.forEach(function(aResult, aIndex) {
		var report = reports1[aIndex];
		assert.equals(report.result, aResult.result, aIndex);
		assert.equals(report.description, aResult.description, aIndex);
		assert.isNumber(aResult.timestamp, aIndex);
		assert.isNumber(aResult.time, aIndex);
		assert.isNumber(aResult.detailedTime, aIndex);
		assert.equals(report.notifications.length, aResult.notifications.length, aIndex);
		aResult.notifications.forEach(function(aNotification, aIndex) {
			var notification = notificationsTemplate[aIndex];
			var type = notification.type || 'notification';
			var description = bundle.getFormattedString('notification_message_'+type, [notification.message]) ||
						notification.message;
			assert.equals(notification.type, aNotification.type, aIndex+'\n'+utils.inspect(aNotification));
			assert.equals(description, aNotification.description, aIndex+'\n'+utils.inspect(aNotification));
			assert.isDefined(aNotification.stackTrace, aIndex+'\n'+utils.inspect(aNotification));
		});
	});
}

function testOnEventsFinishCase()
{
	log.onStart(createStartEvent(testcase1));
	log.onFinish(createFinishEvent(testcase1, reports1));
	assert.equals(1, log.items.length);
	assert.equals({
		topicsLength: 1,
		aborted: false
	}, {
		topicsLength: log.items[0].topics.length,
		aborted: log.items[0].aborted
	});
}

function testOnEventsAbortCase()
{
	log.onStart(createStartEvent(testcase1));
	log.onAbort({ type : 'Abort' });
	assert.equals(1, log.items.length);
	assert.equals({
		topicsLength: 0,
		aborted: true
	}, {
		topicsLength: log.items[0].topics.length,
		aborted: log.items[0].aborted
	});
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
	function normalizeStackTraces(logString) {
		return logString.replace(/^(?:\(\))?(@.*?):[0-9].*$/mg, "()$1");
	}

	function compareAfterNormalization(expected, actual) {
		assert.equals(normalizeStackTraces(expected), normalizeStackTraces(actual));
	}

	log.onStart(createStartEvent(testcase1));
	var events = createTestFinishEvents(testcase1, reports1);
	events.forEach(function(aEvent) {
		log.onTestFinish(aEvent);
	});
	log.onFinish(createFinishEvent(testcase1, reports1));

	function getNormalizedSpecFromPath(aPath) {
		var file = utils.normalizeToFile(aPath);
		file.normalize();
		var url = utils.getURLFromFile(file).spec;
		return url;
	}

	var start = Date.now();
	var now = start + 500;
	var finish = now + 500;
	var params = {
			now : new Date(now),
			start : new Date(start),
			finish : new Date(finish),
			baseURL : baseURL,
			testFileURL : getNormalizedSpecFromPath("log.test.js"),
			testTargetURL : getNormalizedSpecFromPath("../../../../modules/test/testCase.js")
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
	compareAfterNormalization(textVersion, log.toString(log.FORMAT_TEXT));

	textVersion = utils.parseTemplate(
			utils.readFrom('../../fixtures/log_ignore_skipped.txt', 'UTF-8'),
			params
		);
	compareAfterNormalization(textVersion, log.toString());
	compareAfterNormalization(textVersion, log.toString(log.FORMAT_TEXT | log.IGNORE_SKIPPED));

	textVersion = utils.parseTemplate(
			utils.readFrom('../../fixtures/log_ignore_skipped_and_success.txt', 'UTF-8'),
			params
		);
	compareAfterNormalization(textVersion, log.toString(log.FORMAT_TEXT | log.IGNORE_SKIPPED | log.IGNORE_SUCCESS));
}
