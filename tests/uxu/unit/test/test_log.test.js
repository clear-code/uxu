var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module   = new ModuleManager([topDir+'content/uxu/test']);
var TestLogClass  = test_module.require('class', 'test_log');
var TestCaseClass = test_module.require('class', 'test_case');
var ReportClass   = test_module.require('class', 'report');

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
			var r = new ReportClass();
			r.result = TestCaseClass.prototype.RESULT_SUCCESS;
			r.description = 'Success';
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 0;
			return r;
		})(),
		(function() {
			var r = new ReportClass();
			r.result = TestCaseClass.prototype.RESULT_SUCCESS;
			r.description = 'Success with notifications';
			r.notifications = notifications;
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 1;
			return r;
		})(),
		(function() {
			var r = new ReportClass();
			r.result = TestCaseClass.prototype.RESULT_FAILURE;
			r.description = 'Failure';
			r.exception = new Error('Failure');
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 2;
			return r;
		})(),
		(function() {
			var r = new ReportClass();
			r.result = TestCaseClass.prototype.RESULT_FAILURE;
			r.description = 'Failure with notifications';
			r.exception = new Error('Failure');
			r.notifications = notifications;
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 3;
			return r;
		})(),
		(function() {
			var r = new ReportClass();
			r.result = TestCaseClass.prototype.RESULT_ERROR;
			r.description = 'Error';
			r.exception = new Error('Error');
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 4;
			return r;
		})(),
		(function() {
			var r = new ReportClass();
			r.result = TestCaseClass.prototype.RESULT_ERROR;
			r.description = 'Error with notifications';
			r.exception = new Error('Error');
			r.notifications = notifications;
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 5;
			return r;
		})(),
		(function() {
			var r = new ReportClass();
			r.result = TestCaseClass.prototype.RESULT_SKIPPED;
			r.description = 'Skipped';
			r.testOwner = aTestCase;
			r.testID    = 'success';
			r.testIndex = 6;
			return r;
		})()
	];
}


function setUp()
{
	var reports1 = createReports(new TestCaseClass('test1'));
	var reports2 = createReports(new TestCaseClass('test2'));
}

function tearDown()
{
}

function testFoo()
{
}
