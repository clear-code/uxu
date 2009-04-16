var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var ReportClass = test_module.require('class', 'report');

var report;

function setUp()
{
	report = new ReportClass();
}

function tearDown()
{
}

function testExceptions()
{
	assert.isUndefined(report.exception);
	assert.equals([], report.exceptions);

	report.exception = 29;
	assert.equals(29, report.exception);
	assert.equals([29], report.exceptions);

	report.exception = 290;
	assert.equals(290, report.exception);
	assert.equals([29, 290], report.exceptions);
}

function testDescriptions()
{
	assert.isUndefined(report.description);
	assert.equals([], report.descriptions);

	report.description = 29;
	assert.equals(29, report.description);
	assert.equals([29], report.descriptions);

	report.description = 290;
	assert.equals(290, report.description);
	assert.equals([29, 290], report.descriptions);
}

function testNotifications()
{
	assert.equals([], report.notifications);

	report.notifications = [29, 290];
	assert.equals([29, 290], report.notifications);
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
