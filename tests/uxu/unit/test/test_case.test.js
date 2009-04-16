var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var TestCaseClass = test_module.require('class', 'test_case');
var EnvironmentClass = test_module.require('class', 'environment');

var testcase;

function setUp()
{
	testcase = new TestCaseClass('description');
	testcase.environment = new EnvironmentClass({}, baseURL, gBrowser);
	yield 0; // to run tests progressively
}

function tearDown()
{
}

function testProperties()
{
	assert.equals('description', testcase.title);
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

function assertDoneProcessCount(aSetUp, aTearDown, aTestCount)
{
	assert.equals({ setUpCount    : aSetUp,
	                tearDownCount : aTearDown,
	                testCount     : aTestCount,
	                done          : true },
	              { setUpCount    : setUpCount,
	                tearDownCount : tearDownCount,
	                testCount     : testCount,
	                done          : testcase.done });
}

function assertInitialized(aTest, aDescription)
{
	assert.equals({ description : aDescription,
	                priority    : 'normal' },
	              { description : aTest.description,
	                priority    : aTest.priority });
	assert.matches(/^test-\d+-\d+$/, aTest.id);
}

function testRegisterTestFunctions()
{
	testcase.tests = {
		'function式' : function() {},
		'Fuctionコンストラクタ' : (new Function('arg', 'return true')),
		'各種プロパティ付き' : (function() {
			var f = function() {};
			f.description = '説明（ここで定義された説明は、ハッシュのキーで上書きされる）';
			f.priority = 'must';
			f.setUp = function() {};
			f.tearDown = function() {};
			return f;
		})(),
		'各種プロパティ付き2' : (function() {
			var f = function() {};
			f.setup = function() {};
			f.teardown = function() {};
			return f;
		})(),
		'不正なテスト：数値' : 10,
		'不正なテスト：文字列' : 'str',
		'不正なテスト：真偽値' : true
	};
	assert.equals(4, testcase.tests.length);
	assert.equals('各種プロパティ付き', testcase.tests[2].description);
	assert.isNotNull(testcase.tests[2].setUp);
	assert.isNotNull(testcase.tests[2].tearDown);
	assert.isNotNull(testcase.tests[3].setUp);
	assert.isNotNull(testcase.tests[3].tearDown);

	testcase.registerTest(function() {});
	testcase.registerTest(new Function('arg', 'return true'));
	testcase.registerTest((function() {
		var f = function() {};
		f.description = '説明';
		f.priority = 'must';
		f.setUp = function() {};
		f.tearDown = function() {};
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {};
		f.setup = function() {};
		f.teardown = function() {};
		return f;
	})());
	testcase.registerTest(10);
	testcase.registerTest('str');
	testcase.registerTest('true');
	assert.equals(8, testcase.tests.length);
	assert.equals('説明', testcase.tests[6].description);
	assert.isNotNull(testcase.tests[6].setUp);
	assert.isNotNull(testcase.tests[6].tearDown);
	assert.isNotNull(testcase.tests[7].setUp);
	assert.isNotNull(testcase.tests[7].tearDown);
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
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	assertDoneProcessCount(3, 3, 3);
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
	assertInitialized(testcase.tests[0], 'test1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	assertDoneProcessCount(3, 3, 3);
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
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	assertDoneProcessCount(3, 3, 3);
}

function testBDDStyle1()
{
	clearCount();
	testcase.given(function() { setUpCount++; });
	testcase.states(1, function() { testCount++; });
	testcase.states(2, function() { testCount++; });
	testcase.states(3, function() { testCount++; });
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.verify();
	assertDoneProcessCount(3, 0, 3);
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
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.verify();
	assertDoneProcessCount(3, 0, 3);
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
	assert.compare(Date.now() - start, '>=', (100 * 3) * 3);
	assertDoneProcessCount(3, 3, 3);
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
	assert.compare(40, '<', testCount);
	assert.compare(60, '>', testCount);
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
	assertDoneProcessCount(2, 2, 2);

	clearCount();
	testcase.masterPriority = 'never';
	testcase.run();
	assertDoneProcessCount(0, 0, 0);

	clearCount();
	testcase.masterPriority = 'must';
	var tests;
	eval('tests = '+syncTests.toSource());
	tests[1].priority = 'never';
	testcase.tests = tests;
	assert.equals(4, testcase.tests.length);
	testcase.run();
	assertDoneProcessCount(3, 3, 3);
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
	assertDoneProcessCount(2, 2, 1);

	clearCount();
	testcase.masterPriority = 'never';
	testcase.run();
	assertDoneProcessCount(0, 0, 0);
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
	assertDoneProcessCount(2, 2, 0);
	assert.equals(2, tests.count);

	clearCount();
	var context = { count : 0 };
	testcase.context = context;
	assert.equals(0, context.count);
	testcase.run();
	assertDoneProcessCount(2, 2, 0);
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
	assertDoneProcessCount(3, 3, 1);
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
	assertDoneProcessCount(3, 3, 1);
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
	yield 1500;
	assertDoneProcessCount(3, 3, 3);

	clearCount();
	testcase.run(stopper);
	yield 100;
	shouldStop = true;
	yield 500;
	assertDoneProcessCount(1, 1, 1);
}
function testPrivSetUpTearDown()
{
	var steps = [];
	testcase.registerWarmUp(function() {
		steps.push('w');
	});
	testcase.registerCoolDown(function() {
		steps.push('c');
	});
	testcase.registerSetUp(function() {
		steps.push('s0');
	});
	testcase.registerTearDown(function() {
		steps.push('d0');
	});
	testcase.registerTest((function() {
		var f = function() {
			steps.push('t1');
		};
		f.setUp = function() {
			steps.push('s1');
		};
		f.tearDown = function() {
			steps.push('d1');
		};
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			steps.push('t2');
		};
		f.setUp = function() {
			throw 'error';
			steps.push('s2');
		};
		f.tearDown = function() {
			steps.push('d2');
		};
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			throw 'error';
			steps.push('t3');
		};
		f.setUp = function() {
			steps.push('s3');
		};
		f.tearDown = function() {
			steps.push('d3');
		};
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			steps.push('t4');
		};
		f.setUp = function() {
			steps.push('s4');
		};
		f.tearDown = function() {
			throw 'error';
			steps.push('d4');
		};
		return f;
	})());
	assert.equals(4, testcase.tests.length);
	assert.isFalse(testcase.done);
	var start = Date.now();
	testcase.masterPriority = 'must';
	testcase.run();
	yield (function() { return testcase.done; });
	assert.equals('w,s0,s1,t1,d1,d0,s0,d2,d0,s0,s3,d3,d0,s0,s4,t4,d0,c', steps.join(','));
}

function assertTestResult()
{
	assert.equals(
		Array.slice(arguments),
		testcase.tests.map(function(aTest) {
			return aTest.report.result;
		})
	);
}

function testAssertionsCount()
{
	testcase.registerTest((function() {
		var f = function() {
			testcase.environment.assert.isTrue(true);
			testcase.environment.assert.isTrue(true);
		};
		f.assertions = 2;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.environment.assert.isTrue(true);
			testcase.environment.assert.isTrue(true);
			testcase.environment.assert.isTrue(true);
		};
		f.assertions = 2;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.environment.assert.isTrue(true);
		};
		f.assertions = 2;
		return f;
	})());
	testcase.masterPriority = 'must';
	testcase.run();
	yield (function() { return testcase.done; });
	assertTestResult('success', 'failure', 'failure');
}

function testMinAssertionsCount()
{
	testcase.registerTest((function() {
		var f = function() {
		};
		f.minAssertions = 1;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.environment.assert.isTrue(true);
		};
		f.minAssertions = 1;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.environment.assert.isTrue(true);
			testcase.environment.assert.isTrue(true);
		};
		f.minAssertions = 1;
		return f;
	})());
	testcase.masterPriority = 'must';
	testcase.run();
	yield (function() { return testcase.done; });
	assertTestResult('failure', 'success', 'success');
}

function testMaxAssertionsCount()
{
	testcase.registerTest((function() {
		var f = function() {
		};
		f.maxAssertions = 1;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.environment.assert.isTrue(true);
		};
		f.maxAssertions = 1;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.environment.assert.isTrue(true);
			testcase.environment.assert.isTrue(true);
		};
		f.maxAssertions = 1;
		return f;
	})());

	testcase.masterPriority = 'must';
	testcase.run();
	yield (function() { return testcase.done; });
	assertTestResult('success', 'success', 'failure');
}

function testShouldSkip()
{
	testcase.registerTest((function() {
		var f = function() {};
		f.shouldSkip = true;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {};
		f.shouldSkip = false;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {};
		f.shouldSkip = function() {
			return true;
		};
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {};
		f.shouldSkip = function() {
			return false;
		};
		return f;
	})());

	testcase.masterPriority = 'must';
	testcase.run();
	yield (function() { return testcase.done; });
	assertTestResult('skip', 'success', 'skip', 'success');
}

