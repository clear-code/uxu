var topDir = baseURL+'../../../../';

var Report = {};
utils.include(topDir+'modules/test/report.js', 'Shift_JIS', Report);
Report = Report.Report;

var TestLog = {};
utils.include(topDir+'modules/test/testCase.js', 'Shift_JIS', TestLog);
TestLog = TestLog.TestLog;

var TestCase = {};
utils.include(topDir+'modules/test/testCase.js', 'Shift_JIS', TestCase);
TestCase = TestCase.TestCase;

var bundle = {};
utils.include(topDir+'modules/lib/stringBundle.js', 'Shift_JIS', bundle);
bundle = bundle.stringBundle.get(topDir+'locale/ja/uxu/uxu.properties');

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
			r.result = TestCase.prototype.RESULT_SUCCESS;
			r.description = 'Success';
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 0;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.result = TestCase.prototype.RESULT_SUCCESS;
			r.description = 'Success with notifications';
			r.notifications = notifications;
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 1;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.result = TestCase.prototype.RESULT_FAILURE;
			r.description = 'Failure';
			r.exception = new Error('Failure');
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 2;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.result = TestCase.prototype.RESULT_FAILURE;
			r.description = 'Failure with notifications';
			r.exception = new Error('Failure');
			r.notifications = notifications;
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 3;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.result = TestCase.prototype.RESULT_SKIPPED;
			r.description = 'Skipped';
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 4;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.result = TestCase.prototype.RESULT_ERROR;
			r.description = 'Error';
			r.exception = new Error('Error');
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 5;
			return r;
		})(),
		(function() {
			var r = new Report();
			r.result = TestCase.prototype.RESULT_ERROR;
			r.description = 'Error with notifications';
			r.exception = new Error('Error');
			r.notifications = notifications;
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 6;
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
	assert.equals([], log.items[0].results);
	assert.isFalse(log.items[0].aborted);

	var events = createTestFinishEvents(testcase1, reports1);
	events.forEach(function(aEvent) {
		log.onTestFinish(aEvent);
	});
	assert.equals(1, log.items.length);
	assert.equals('test1', log.items[0].title);
	assert.equals(reports1.length-1, log.items[0].results.length);
	assert.isFalse(log.items[0].aborted);

	var results = log.items[0].results;
	results.forEach(function(aResult, aIndex) {
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
	assert.equals(reports1.length, log.items[0].results.length);
	assert.isFalse(log.items[0].aborted);

	log.onAbort({ type : 'Abort' });
	assert.equals(1, log.items.length);
	assert.equals(reports1.length, log.items[0].results.length);
	assert.isTrue(log.items[0].aborted);
}

function test_clear()
{
	log.onStart(createStartEvent(testcase1));
	assert.equals(1, log.items.length);
	assert.equals('test1', log.items[0].title);
	assert.equals([], log.items[0].results);
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
	log.lastItem.results.forEach(function(aResult, aIndex) {
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
