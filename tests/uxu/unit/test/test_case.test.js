utils.include('../../../../content/uxu/lib/module_manager.js');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var TestCase    = test_module.require('class', 'test_case');

var testcase;

function setUp()
{
	testcase = new TestCase('description', 'http://www.clear-code.com/');
	yield 0; // to run tests progressively
}

function tearDown()
{
}

function testProperties()
{
	assert.equals('description', testcase.title);
	assert.equals('http://www.clear-code.com/', testcase.namespace);
	assert.isNull(testcase.masterPriority);
}

var setUpCount = 0;
var tearDownCount = 0;
var testCount = 0;

function testNormalStyle()
{
	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { testCount++; },
		'2' : function() { testCount++; },
		'3' : function() { testCount++; }
	};
	assert.equals(3, testcase.tests.length);
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(3, setUpCount);
	assert.equals(3, tearDownCount);
	assert.equals(3, testCount);
}

function testAsync()
{
	var setUpCount = 0;
	var tearDownCount = 0;
	var testCount = 0;
	testcase.tests = {
		setUp : function()
		{
			setUpCount++;
			yield 100;
		},
		tearDown : function()
		{
			tearDownCount++;
			yield 100;
		},
		'1' : function()
		{
			testCount++;
			yield 100;
		},
		'2' : function()
		{
			testCount++;
			yield 100;
		},
		'3' : function()
		{
			testCount++;
			yield 100;
		}
	};
	assert.equals(3, testcase.tests.length);
	assert.isFalse(testcase.done);
	var start = Date.now();
	testcase.masterPriority = 'must';
	testcase.run();
	yield (function() { return testcase.done; });
	assert.isTrue(Date.now() - start >= (100 * 3) * 3);
	assert.isTrue(testcase.done);
	assert.equals(3, setUpCount);
	assert.equals(3, tearDownCount);
	assert.equals(3, testCount);
}

function testPriority()
{
	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { testCount++; },
		'2' : function() { testCount++; },
		'3' : function() { testCount++; },
		'4' : function() { testCount++; },
		'5' : function() { testCount++; },
		'6' : function() { testCount++; },
		'7' : function() { testCount++; },
		'8' : function() { testCount++; },
		'9' : function() { testCount++; },
		'10' : function() { testCount++; }
	};
	assert.equals(10, testcase.tests.length);

	testcase.masterPriority = 0.5;
	for (var i = 0, maxi = 5; i < maxi; i++)
	{
		testcase.run();
		assert.isTrue(testcase.done);
	}
	assert.equals(testCount, setUpCount);
	assert.equals(testCount, tearDownCount);
	assert.isTrue(testCount > 20, testCount);
	assert.isTrue(testCount < 30, testCount);
}

function testMasterPriority()
{
	var syncTests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { testCount++; },
		'2' : function() { testCount++; }
	};
	eval('testcase.tests = '+syncTests.toSource());
	assert.equals(2, testcase.tests.length);

	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.masterPriority = 'must';
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(2, setUpCount);
	assert.equals(2, tearDownCount);
	assert.equals(2, testCount);

	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.masterPriority = 'never';
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(0, setUpCount);
	assert.equals(0, tearDownCount);
	assert.equals(0, testCount);

	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.masterPriority = 'must';
	var tests;
	eval('tests = '+syncTests.toSource());
	tests[1].priority = 'never';
	testcase.tests = tests;
	assert.equals(4, testcase.tests.length);
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(3, setUpCount);
	assert.equals(3, tearDownCount);
	assert.equals(3, testCount);
}

function testForceRetry()
{
	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { assert.isTrue(false); testCount++; },
		'2' : function() { testCount++; }
	};
	assert.equals(2, testcase.tests.length);

	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.masterPriority = 'must';
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(2, setUpCount);
	assert.equals(2, tearDownCount);
	assert.equals(1, testCount);

	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.masterPriority = 'never';
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(1, setUpCount);
	assert.equals(1, tearDownCount);
	assert.equals(0, testCount);
}

function testContext()
{
	var tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { this.count++; },
		'2' : function() { this.count++; },
		count : 0
	};
	testcase.tests = tests;
	assert.equals(2, testcase.tests.length);

	setUpCount    = 0;
	tearDownCount = 0;
	testcase.masterPriority = 'must';
	assert.equals(0, tests.count);
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(2, setUpCount);
	assert.equals(2, tearDownCount);
	assert.equals(2, tests.count);

	setUpCount    = 0;
	tearDownCount = 0;
	var context = { count : 0 };
	testcase.context = context;
	assert.equals(0, context.count);
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(2, setUpCount);
	assert.equals(2, tearDownCount);
	assert.equals(2, context.count);
}

function testReportHandler()
{
	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { assert.isTrue(false); testCount++; },
		'2' : function() { throw 'test'; testCount++; },
		'3' : function() { testCount++; }
	};
	var errorCount = 0;
	var failCount  = 0;
	var handler = function(aReport) {
		switch (aReport.result)
		{
			case 'failure':
				failCount++;
				break;
			case 'error':
				errorCount++;
				break;
		}
	};
	testcase.reportHandler = handler;
	assert.equals(3, testcase.tests.length);

	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	testcase.masterPriority = 'must';
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(3, setUpCount);
	assert.equals(3, tearDownCount);
	assert.equals(1, testCount);
	assert.equals(1, failCount);
	assert.equals(1, errorCount);

	testcase.reportHandler = {
		handleReport : handler
	};
	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
	errorCount    = 0;
	failCount     = 0;
	testcase.masterPriority = 'must';
	testcase.run();
	assert.isTrue(testcase.done);
	assert.equals(3, setUpCount);
	assert.equals(3, tearDownCount);
	assert.equals(1, testCount);
	assert.equals(1, failCount);
	assert.equals(1, errorCount);
}

