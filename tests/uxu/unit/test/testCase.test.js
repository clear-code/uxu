var topDir = baseURL+'../../../../';

var TestCase = utils.import(topDir+'modules/test/testCase.js', {}).TestCase;
var TestSuite = utils.import(topDir+'modules/test/suite.js', {}).TestSuite;

var testcase;

function setUp()
{
	testcase = new TestCase('description');
	testcase.suite = new TestSuite(null, baseURL, gBrowser);
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

function assertDoneProcessCount(aSetUp, aTearDown, aTestCount, aParameters)
{
	if (!aParameters) aParameters = {};
	if ('priority' in aParameters) {
		testcase.masterPriority = aParameters.priority;
	}
	if (!aParameters.doNotRun) {
		assert.isFalse(testcase.done);
		testcase[aParameters.method || 'run']();
		utils.wait(function() { return testcase.done; });
	}
	assert.equals({ setUpCount    : aSetUp,
	                tearDownCount : aTearDown,
	                testCount     : aTestCount,
	                done          : ('done' in aParameters ? aParameters.done : true ) },
	              { setUpCount    : setUpCount,
	                tearDownCount : tearDownCount,
	                testCount     : testCount,
	                done          : testcase.done });
}

function assertTestResult()
{
	testcase.run();
	yield (function() { return testcase.done; });
	assert.equals(
		Array.slice(arguments),
		testcase.tests.map(function(aTest) {
			return aTest.report.result;
		})
	);
}

function assertInitialized(aTest, aDescription)
{
	assert.equals({ description : aDescription,
	                priority    : void(0) },
	              { description : aTest.description,
	                priority    : aTest.priority });
	assert.matches(/^test-\d+-\d+$/, aTest.id);
}

function testFunctionsWithProperties()
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

function testRegisterFunctionCallStyle()
{
	clearCount();
	testcase.setUp(function() { setUpCount++; });
	testcase.tearDown(function() { tearDownCount++; });
	testcase.test(1, function() { testCount++; });
	testcase.test(2, function() { testCount++; });
	testcase.test(3, function() { testCount++; });
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '1');
	assertDoneProcessCount(3, 3, 3, { priority : 'must' });
}

function testRegisterOperationStyle()
{
	clearCount();
	testcase.registerSetUp(function() { setUpCount++; });
	testcase.registerTearDown(function() { tearDownCount++; });
	testcase.registerTest(function test1() { testCount++; });
	testcase.registerTest(function test2() { testCount++; });
	testcase.registerTest(function test3() { testCount++; });
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], 'test1');
	assertDoneProcessCount(3, 3, 3, { priority : 'must' });
}

function testRegisterHashStyle()
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
	assertDoneProcessCount(3, 3, 3, { priority : 'must' });
}

function testBDDFunctionCallStyle()
{
	clearCount();
	testcase.given(function() { setUpCount++; });
	testcase.states(1, function() { testCount++; });
	testcase.states(2, function() { testCount++; });
	testcase.states(3, function() { testCount++; });
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '1');
	assertDoneProcessCount(3, 0, 3, { priority : 'must', method : 'verify' });
}

function testBDDHashStyle()
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
	assertDoneProcessCount(3, 0, 3, { priority : 'must', method : 'verify' });
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
	var start = Date.now();
	assertDoneProcessCount(3, 3, 3, { priority : 'must' });
	assert.compare(Date.now() - start, '>=', (100 * 3) * 3);
}

function testReuseFunctions()
{
	clearCount();

	var tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { testCount++; },
		'2' : function() { testCount++; },
		'3' : function() { testCount++; }
	};

	testcase = new TestCase('description1');
	testcase.suite = new TestSuite({}, baseURL, gBrowser);
	testcase.tests = tests;
	assertDoneProcessCount(3, 3, 3, { priority : 'must' });

	testcase = new TestCase('description2');
	testcase.suite = new TestSuite({}, baseURL, gBrowser);
	testcase.tests = tests;
	assertDoneProcessCount(6, 6, 6, { priority : 'must' });
}

function testNoFunction()
{
	clearCount();

	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; }
	};
	assert.equals(0, testcase.tests.length);
	assertDoneProcessCount(0, 0, 0, { priority : 'must' });
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
		yield (function() { return testcase.done; });
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
	assertDoneProcessCount(2, 2, 2, { priority : 'must' });

	clearCount();
	testcase.done = false;
	assertDoneProcessCount(0, 0, 0, { priority : 'never' });

	clearCount();
	testcase.done = false;
	var tests;
	eval('tests = '+syncTests.toSource());
	tests[1].priority = 'never';
	testcase.tests = tests;
	assert.equals(4, testcase.tests.length);
	assertDoneProcessCount(3, 3, 3, { priority : 'must' });
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
	assertDoneProcessCount(2, 2, 1, { priority : 'must' });

	clearCount();
	testcase.done = false;
	assertDoneProcessCount(0, 0, 0, { priority : 'never' });
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
	assert.equals(0, tests.count);
	assertDoneProcessCount(2, 2, 0, { priority : 'must' });
	assert.equals(2, tests.count);

	clearCount();
	testcase.done = false;
	var context = { count : 0 };
	testcase.context = context;
	assert.equals(0, context.count);
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
	assertDoneProcessCount(3, 3, 1, { priority : 'must' });
	assert.equals(1, failCount);
	assert.equals(1, errorCount);

	testcase.removeListener(listener);
	testcase.addListener({handleEvent : listener});
	clearCount();
	testcase.done = false;
	errorCount = 0;
	failCount  = 0;
	assertDoneProcessCount(3, 3, 1, { priority : 'must' });
	assert.equals(1, failCount);
	assert.equals(1, errorCount);
}

function testStopper()
{
	testcase.tests = {
		setUp : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1' : function() { testCount++; yield 1000; },
		'2' : function() { testCount++; yield 1000; },
		'3' : function() { testCount++; yield 1000; }
	};
	assert.equals(3, testcase.tests.length);

	var shouldStop = false;
	var stopper = function() {
			return shouldStop;
		};

	clearCount();
	testcase.masterPriority = 'must';
	testcase.run(stopper);
	yield 5000;
	assertDoneProcessCount(3, 3, 3, { doNotRun : true });

	clearCount();
	testcase.done = false;
	testcase.masterPriority = 'must';
	testcase.run(stopper);
	yield 500;
	shouldStop = true;
	yield 5000;
	assertDoneProcessCount(1, 1, 1, { doNotRun : true, done : false });
}
function testPrivSetUpTearDown()
{
	var steps = [];
	testcase.registerStartUp(function() {
		steps.push('SU');
	});
	testcase.registerShutDown(function() {
		steps.push('SD');
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
	assert.equals('SU,s0,s1,t1,d1,d0,s0,d2,d0,s0,s3,d3,d0,s0,s4,t4,d0,SD', steps.join(','));
}

function testAssertionsCount()
{
	testcase.registerTest((function() {
		var f = function() {
			testcase.suite.assert.isTrue(true);
			testcase.suite.assert.isTrue(true);
		};
		f.assertions = 2;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.suite.assert.isTrue(true);
			testcase.suite.assert.isTrue(true);
			testcase.suite.assert.isTrue(true);
		};
		f.assertions = 2;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.suite.assert.isTrue(true);
		};
		f.assertions = 2;
		return f;
	})());
	testcase.masterPriority = 'must';
	yield Do(assertTestResult('success', 'failure', 'failure'));
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
			testcase.suite.assert.isTrue(true);
		};
		f.minAssertions = 1;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.suite.assert.isTrue(true);
			testcase.suite.assert.isTrue(true);
		};
		f.minAssertions = 1;
		return f;
	})());
	testcase.masterPriority = 'must';
	yield Do(assertTestResult('failure', 'success', 'success'));
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
			testcase.suite.assert.isTrue(true);
		};
		f.maxAssertions = 1;
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {
			testcase.suite.assert.isTrue(true);
			testcase.suite.assert.isTrue(true);
		};
		f.maxAssertions = 1;
		return f;
	})());

	testcase.masterPriority = 'must';
	yield Do(assertTestResult('success', 'success', 'failure'));
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
	yield Do(assertTestResult('skip', 'success', 'skip', 'success'));
}

function testShouldSkipForAll_boolean_skip()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = true;
	yield Do(assertTestResult('skip', 'skip', 'skip'));
}

function testShouldSkipForAll_boolean_success()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = false;
	yield Do(assertTestResult('success', 'success', 'success'));
}

function testShouldSkipForAll_function_skip()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = function() { return true; };
	yield Do(assertTestResult('skip', 'skip', 'skip'));
}

function testShouldSkipForAll_function_success()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = function() { return false; };
	yield Do(assertTestResult('success', 'success', 'success'));
}


function assertRegisterTestWithParameters(aTest, aDescriptions)
{
	var lastCount = testcase.tests.length;
	testcase.registerTest(aTest);
	assert.equals(aDescriptions.length, testcase.tests.length - lastCount);
	for (let i = 0; i < aDescriptions.length; i++)
	{
		assert.equals(aDescriptions[i],
		              testcase.tests[lastCount+i].description);
	}
}

var privateSetUpWithParametersResults;
var privateTearDownWithParametersResults;

function createNewTestForParameters(aDescription)
{
	var test = function(aParameter) {
			testcase.suite.assert.isTrue(aParameter);
		};
	test.description = aDescription;
	test.setUp = function(aParameter) {
			privateSetUpWithParametersResults.push(aParameter);
		};
	test.tearDown = function(aParameter) {
			privateTearDownWithParametersResults.push(aParameter);
		};
	return test;
}

function testWithArrayParameters()
{
	var test;
	privateSetUpWithParametersResults = [];
	privateTearDownWithParametersResults = [];

	test = createNewTestForParameters('desc1');
	test.parameters = [true, false];
	assertRegisterTestWithParameters(test,
	                                 ['desc1 (1)',
	                                  'desc1 (2)']);

	test = createNewTestForParameters('desc2');
	test.params = [true, false];
	assertRegisterTestWithParameters(test,
	                                 ['desc2 (1)',
	                                  'desc2 (2)']);

	test = createNewTestForParameters('desc3');
	test.parameters = [true, false];
	assertRegisterTestWithParameters(test,
	                                 ['desc3 (1)',
	                                  'desc3 (2)']);

	testcase.masterPriority = 'must';
	yield Do(assertTestResult('success', 'failure',
	                          'success', 'failure',
	                          'success', 'failure'));
	assert.equals([true, false, true, false, true, false],
	              privateSetUpWithParametersResults);
	assert.equals([true, false, true, false, true, false],
	              privateTearDownWithParametersResults);
}

function testWithHashParameters()
{
	var test;
	privateSetUpWithParametersResults = [];
	privateTearDownWithParametersResults = [];

	test = createNewTestForParameters('desc1');
	test.parameters = { foo : true,
	                    bar : false };
	assertRegisterTestWithParameters(test,
	                                 ['desc1 (foo)',
	                                  'desc1 (bar)']);

	test = createNewTestForParameters('desc2');
	test.params = { foo : true,
	                bar : false };
	assertRegisterTestWithParameters(test,
	                                 ['desc2 (foo)',
	                                  'desc2 (bar)']);

	testcase.masterPriority = 'must';
	yield Do(assertTestResult('success', 'failure',
	                          'success', 'failure'));
	assert.equals([true, false, true, false],
	              privateSetUpWithParametersResults);
	assert.equals([true, false, true, false],
	              privateTearDownWithParametersResults);
}

