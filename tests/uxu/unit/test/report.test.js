var topDir = baseURL+'../../../../';

var Report = utils.import(topDir+'modules/test/report.js', {}).Report;
var TestCase = utils.import(topDir+'modules/test/testCase.js', {}).TestCase;

var report;

function setUp()
{
	report = new Report();
}

function tearDown()
{
}

function testStep()
{
	assert.equals('0/0', report.step);

	report.testCase = { tests : [0, 1, 2] };
	assert.equals('0/3', report.step);

	report.index = 1;
	assert.equals('2/3', report.step);
}

function testPercentage()
{
	assert.equals(100, report.percentage);

	report.testCase = { tests : [0, 1, 2, 3] };
	assert.equals(100, report.percentage);

	report.index = 1;
	assert.equals(50, report.percentage);
}

function testResult()
{
	assert.isNull(report.result);

	report.addTopic({
		result : TestCase.prototype.RESULT_SUCCESS
	});
	assert.equals(TestCase.prototype.RESULT_SUCCESS, report.result);
	assert.equals(TestCase.prototype.RESULT_SUCCESS, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_SKIP
	});
	assert.equals(TestCase.prototype.RESULT_SKIP, report.result);
	assert.equals(TestCase.prototype.RESULT_SKIP, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_FAILURE
	});
	assert.equals(TestCase.prototype.RESULT_FAILURE, report.result);
	assert.equals(TestCase.prototype.RESULT_FAILURE, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_SUCCESS
	});
	assert.equals(TestCase.prototype.RESULT_FAILURE, report.result);
	assert.equals(TestCase.prototype.RESULT_SUCCESS, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_SKIP
	});
	assert.equals(TestCase.prototype.RESULT_FAILURE, report.result);
	assert.equals(TestCase.prototype.RESULT_SKIP, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_ERROR
	});
	assert.equals(TestCase.prototype.RESULT_ERROR, report.result);
	assert.equals(TestCase.prototype.RESULT_ERROR, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_SUCCESS
	});
	assert.equals(TestCase.prototype.RESULT_ERROR, report.result);
	assert.equals(TestCase.prototype.RESULT_SUCCESS, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_SKIP
	});
	assert.equals(TestCase.prototype.RESULT_ERROR, report.result);
	assert.equals(TestCase.prototype.RESULT_SKIP, report.lastResult);

	report.addTopic({
		result : TestCase.prototype.RESULT_FAILURE
	});
	assert.equals(TestCase.prototype.RESULT_ERROR, report.result);
	assert.equals(TestCase.prototype.RESULT_FAILURE, report.lastResult);
}

function testDescription()
{
	assert.isNull(report.description);
	assert.isNull(report.lastDescription);

	report.addTopic({
		description : 'foo'
	});
	report.addTopic({
		description : 'bar'
	});
	assert.equals('bar', report.description);
	assert.equals('bar', report.lastDescription);

	report.description = 'bazz';
	assert.equals('bazz', report.description);
	assert.equals('bar', report.lastDescription);
}

function testAddTopic()
{
	assert.isFalse(report.hasTopic());

	report.addTopic({
		result      : TestCase.prototype.RESULT_SUCCESS,
		description : 'foo'
	});
	assert.isTrue(report.hasTopic());

	report.addTopic({
		result      : TestCase.prototype.RESULT_SUCCESS
	});
	assert.equals('foo', report.lastDescription);

	report.description = 'bar';
	report.addTopic({
		result      : TestCase.prototype.RESULT_SUCCESS
	});
	assert.equals('bar', report.lastDescription);
}

function testTopics()
{
	var topics = [
			{ description : 'foo' },
			{ description : 'bar' },
			{ description : 'baz' }
		];
	report.addTopic(topics[0]);
	report.addTopic(topics[1]);
	report.addTopic(topics[2]);
	assert.strictlyEquals(topics, report.topics);
	assert.strictlyEquals(topics[2], report.lastTopic);

	var success = TestCase.prototype.RESULT_SUCCESS;
	var before = Date.now();
	report.addTopic({
		result      : success,
		description : 'hoge'
	});
	var after = Date.now();
	var timestamp = parseInt((before + after) / 2);
	assert.equals(
		{
			result      : success,
			description : 'hoge',
			exception   : null,
			timestamp   : timestamp
		},
		report.lastTopic
	);

	topics = report.topics;
	assert.strictlyEquals(topics[topics.length-1], report.lastTopic);
	assert.equals(
		{
			_formatted    : true,
			result        : success,
			description   : 'hoge',
			exception     : null,
			timestamp     : timestamp,
			time          : report.time,
			detailedTime  : report.detailedTime,
			notifications : [],
			index         : report.index,
			step          : report.step,
			percentage    : report.percentage
		},
		report.lastTopic
	);
}

function testNotifications()
{
	assert.equals([], report.notifications);

	report.notifications = [
		{ message : 'foo', type : 'unknown' },
		{ message : 'bar' }
	];
	assert.equals(
		[
			{ description : 'foo', type : 'unknown', stackTrace : [] },
			{ description : 'bar', type : 'notification', stackTrace : [] }
		],
		report.notifications
	);
}

function testTime()
{
	assert.equals(0, report.time);
	report.onStart();
	assert.equals(0, report.time);
	yield 500;
	assert.equals(0, report.time);
	report.onFinish();
	assert.compare(500, '<=', report.time);
}

function testDetailedTime()
{
	assert.equals(0, report.detailedTime);
	report.onDetailedStart();
	assert.equals(0, report.detailedTime);
	yield 500;
	assert.equals(0, report.detailedTime);
	report.onDetailedFinish();
	assert.compare(500, '<=', report.detailedTime);
}

function testResult()
{
	assert.isNull(report.result);
}
