var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var TestCaseClass = test_module.require('class', 'test_case');

var testcase;

function setUp()
{
	testcase = new TestCaseClass('description', { namespace : 'http://www.clear-code.com/' });
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

function clearCount()
{
	setUpCount    = 0;
	tearDownCount = 0;
	testCount     = 0;
}

assert.testDone = function(aSetUp, aTearDown, aTestCount)
{
	assert.isTrue(testcase.done);
	assert.equals(aSetUp, setUpCount);
	assert.equals(aTearDown, tearDownCount);
	assert.equals(aTestCount, testCount);
};

assert.testInitialized = function(aTest, aDescription)
{
	assert.equals(aDescription, aTest.desc);
	assert.equals('normal', aTest.priority);
	assert.matches(/^test-\d+$/, aTest.id);
};

function testRegisterTestFunctions()
{
	testcase.tests = {
		'1' : function() {},
		'2' : (new Function('arg', 'return true')),
		'3' : 10,
		'4' : 'str',
		'5' : true,
	};
	assert.equals(2, testcase.tests.length);

	testcase.registerTest(function() {});
	testcase.registerTest(new Function('arg', 'return true'));
	testcase.registerTest(10);
	testcase.registerTest('str');
	testcase.registerTest('true');
	assert.equals(4, testcase.tests.length);
}

function testNormalStyle1()
{
	clearCount();
	testcase.setUp(function() { setUpCount++; });
	testcase.tearDown(function() { tearDownCount++; });
	testcase.test(1, function() { testCount++; });
	testcase.test(2, function() { testCount++; });
	testcase.test(3, function() { testCount++; });
	assert.equals(3, testcase.tests.length);
	assert.testInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	assert.testDone(3, 3, 3);
}

function testNormalStyle2()
{
	clearCount();
	testcase.registerSetUp(function() { setUpCount++; });
	testcase.registerTearDown(function() { tearDownCount++; });
	testcase.registerTest(function test1() { testCount++; });
	testcase.registerTest(function test2() { testCount++; });
	testcase.registerTest(function test3() { testCount++; });
	assert.equals(3, testcase.tests.length);
	assert.testInitialized(testcase.tests[0], 'test1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	assert.testDone(3, 3, 3);
}

function testNormalStyle3()
{
	clearCount();
	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { testCount++; },
		'2' : function() { testCount++; },
		'3' : function() { testCount++; }
	};
	assert.equals(3, testcase.tests.length);
	assert.testInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	assert.testDone(3, 3, 3);
}

function testBDDStyle1()
{
	clearCount();
	testcase.given(function() { setUpCount++; });
	testcase.states(1, function() { testCount++; });
	testcase.states(2, function() { testCount++; });
	testcase.states(3, function() { testCount++; });
	assert.equals(3, testcase.tests.length);
	assert.testInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.verify();
	assert.testDone(3, 0, 3);
}

function testBDDStyle2()
{
	clearCount();
	testcase.stateThat = {
		given : function() { setUpCount++; },
		'1' : function() { testCount++; },
		'2' : function() { testCount++; },
		'3' : function() { testCount++; }
	};
	assert.equals(3, testcase.tests.length);
	assert.testInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.verify();
	assert.testDone(3, 0, 3);
}

function testAsync()
{
	clearCount();
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
	assert.testDone(3, 3, 3);
}

function testPriority()
{
	clearCount();
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
	for (var i = 0, maxi = 10; i < maxi; i++)
	{
		testcase.run();
		assert.isTrue(testcase.done);
		yield 0;
	}
	assert.equals(testCount, setUpCount);
	assert.equals(testCount, tearDownCount);
	assert.isTrue(testCount > 40, testCount);
	assert.isTrue(testCount < 60, testCount);
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

	clearCount();
	testcase.masterPriority = 'must';
	testcase.run();
	assert.testDone(2, 2, 2);

	clearCount();
	testcase.masterPriority = 'never';
	testcase.run();
	assert.testDone(0, 0, 0);

	clearCount();
	testcase.masterPriority = 'must';
	var tests;
	eval('tests = '+syncTests.toSource());
	tests[1].priority = 'never';
	testcase.tests = tests;
	assert.equals(4, testcase.tests.length);
	testcase.run();
	assert.testDone(3, 3, 3);
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

	clearCount();
	testcase.masterPriority = 'must';
	testcase.run();
	assert.testDone(2, 2, 1);

	clearCount();
	testcase.masterPriority = 'never';
	testcase.run();
	assert.testDone(0, 0, 0);
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

	clearCount();
	testcase.masterPriority = 'must';
	assert.equals(0, tests.count);
	testcase.run();
	assert.testDone(2, 2, 0);
	assert.equals(2, tests.count);

	clearCount();
	var context = { count : 0 };
	testcase.context = context;
	assert.equals(0, context.count);
	testcase.run();
	assert.testDone(2, 2, 0);
	assert.equals(2, context.count);
}

function testListener()
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
	var listener = function(aEvent) {
		switch (aEvent.type)
		{
			case 'TestFinish':
				switch (aEvent.data.result)
				{
					case 'failure':
						failCount++;
						break;
					case 'error':
						errorCount++;
						break;
				}
				break;
		}
	};
	testcase.addListener(listener);
	assert.equals(3, testcase.tests.length);

	clearCount();
	testcase.masterPriority = 'must';
	testcase.run();
	assert.testDone(3, 3, 1);
	assert.equals(1, failCount);
	assert.equals(1, errorCount);

        testcase.removeListener(listener);
	testcase.addListener({handleEvent : listener});
	clearCount();
	errorCount = 0;
	failCount  = 0;
	testcase.masterPriority = 'must';
	testcase.run();
	assert.isTrue(testcase.done);
	assert.testDone(3, 3, 1);
	assert.equals(1, failCount);
	assert.equals(1, errorCount);
}

function testStopper()
{
	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { testCount++; yield 300; },
		'2' : function() { testCount++; yield 100; },
		'3' : function() { testCount++; yield 100; }
	};
	assert.equals(3, testcase.tests.length);

	var shouldStop = false;
	var stopper = function() {
			return shouldStop;
		};

	clearCount();
	testcase.masterPriority = 'must';
	testcase.run(stopper);
	yield 1000;
	assert.testDone(3, 3, 3);

	clearCount();
	testcase.run(stopper);
	yield 100;
	shouldStop = true;
	yield 500;
	assert.testDone(1, 1, 1);
}

