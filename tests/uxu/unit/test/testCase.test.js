var topDir = baseURL+'../../../../';

var TestCase = utils.import(topDir+'modules/test/testCase.js', {}).TestCase;
var TestSuite = utils.import(topDir+'modules/test/suite.js', {}).TestSuite;

var testcase;

function startUp()
{
	// if it is zero, this test will fail.
	utils.setPref('dom.max_chrome_script_run_time', 20);
}

function setUp()
{
	testcase = new TestCase('description', {
		ignoreLastResult : true
	});
	testcase.suite = new TestSuite({
		uri        : baseURL,
		browser    : gBrowser,
		envCreator : function() { return {}; }
	});
	utils.wait(1); // to run tests progressively
}

function tearDown()
{
}


function assertResults()
{
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
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


function testProperties()
{
	assert.equals('description', testcase.title);
	assert.isNull(testcase.masterPriority);
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

function createXUnitMocks(aTestCount, aArguments)
{
	var setUp = new FunctionMock('setUp');
	setUp.expect(aArguments || []).times(aTestCount);

	var tearDown = new FunctionMock('tearDown');
	tearDown.expect(aArguments || []).times(aTestCount);

	return {
		setUp    : setUp,
		tearDown : tearDown,
		tests    : createTestMocks(aTestCount, aArguments)
	};
}

function createBDDMocks(aTestCount, aArguments)
{
	var given = new FunctionMock('given');
	given.expect(aArguments || []).times(aTestCount);

	return {
		given : given,
		tests : createTestMocks(aTestCount, aArguments)
	};
}

function createTestMocks(aTestCount, aArguments)
{
	var tests = [];
	for (let i = 0; i < aTestCount; i++)
	{
		let test = new FunctionMock('test'+i);
		test.expect(aArguments || []);
		tests.push(test);
	}
	return tests;
}

function testRegisterFunctionCallStyle()
{
	var mocks = createXUnitMocks(3);
	testcase.setUp(mocks.setUp);
	testcase.tearDown(mocks.tearDown);
	testcase.test(1, mocks.tests[0]);
	testcase.test(2, mocks.tests[1]);
	testcase.test(3, mocks.tests[2]);
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testRegisterOperationStyle()
{
	var mocks = createXUnitMocks(3);
	mocks.tests[0].description = 'test0';
	testcase.registerSetUp(mocks.setUp);
	testcase.registerTearDown(mocks.tearDown);
	testcase.registerTest(mocks.tests[0]);
	testcase.registerTest(mocks.tests[1]);
	testcase.registerTest(mocks.tests[2]);
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], 'test0');
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testRegisterHashStyle()
{
	var mocks = createXUnitMocks(3);
	testcase.tests = {
		setUp    : mocks.setUp,
		tearDown : mocks.tearDown,
		'1'      : mocks.tests[0],
		'2'      : mocks.tests[1],
		'3'      : mocks.tests[2]
	};
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testBDDFunctionCallStyle()
{
	var mocks = createBDDMocks(3);
	testcase.given(mocks.given);
	testcase.states(1, mocks.tests[0]);
	testcase.states(2, mocks.tests[1]);
	testcase.states(3, mocks.tests[2]);
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	testcase.verify();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testBDDHashStyle()
{
	var mocks = createBDDMocks(3);
	testcase.stateThat = {
		given : mocks.given,
		'1'   : mocks.tests[0],
		'2'   : mocks.tests[1],
		'3'   : mocks.tests[2]
	};
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '1');
	testcase.masterPriority = 'must';
	testcase.verify();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testAsync_yield()
{
	var mocks = createXUnitMocks(3);
	testcase.tests = {
		setUp : function()
		{
			mocks.setUp();
			yield 100;
		},
		tearDown : function()
		{
			mocks.tearDown();
			yield 100;
		},
		'1' : function()
		{
			mocks.tests[0]();
			yield 100;
		},
		'2' : function()
		{
			mocks.tests[1]();
			yield 100;
		},
		'3' : function()
		{
			mocks.tests[2]();
			yield 100;
		}
	};
	assert.equals(3, testcase.tests.length);
	testcase.masterPriority = 'must';
	var start = Date.now();
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.compare(Date.now() - start, '>=', (100 * 3) * 3);
}

function testAsync_wait()
{
	var mocks = createXUnitMocks(3);
	testcase.tests = {
		setUp : function()
		{
			mocks.setUp();
			utils.wait(100);
		},
		tearDown : function()
		{
			mocks.tearDown();
			utils.wait(100);
		},
		'1' : function()
		{
			mocks.tests[0]();
			utils.wait(100);
		},
		'2' : function()
		{
			mocks.tests[1]();
			utils.wait(100);
		},
		'3' : function()
		{
			mocks.tests[2]();
			utils.wait(100);
		}
	};
	assert.equals(3, testcase.tests.length);
	testcase.masterPriority = 'must';
	var start = Date.now();
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
	assert.compare(Date.now() - start, '>=', (100 * 3) * 3);
}

function testReuseFunctions()
{
	var mocks = createXUnitMocks(3);

	var tests = {
		setUp    : mocks.setUp,
		tearDown : mocks.tearDown,
		'1'      : mocks.tests[0],
		'2'      : mocks.tests[1],
		'3'      : mocks.tests[2]
	};

	testcase = new TestCase('description1');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = tests;
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);

	mocks.setUp.assert();
	mocks.tearDown.assert();
	mocks.tests[0].assert();
	mocks.tests[1].assert();
	mocks.tests[2].assert();

	mocks.setUp.expect([]).times(3);
	mocks.tearDown.expect([]).times(3);
	mocks.tests[0].expect([]);
	mocks.tests[1].expect([]);
	mocks.tests[2].expect([]);

	testcase = new TestCase('description2');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = tests;
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testNoFunction()
{
	var setUp = new FunctionMock('setUp');
	var tearDown = new FunctionMock('setUp');
	testcase.tests = {
		setUp    : setUp,
		tearDown : tearDown
	};
	assert.equals(0, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testPriority()
{
	var setUpCount    = 0;
	var tearDownCount = 0;
	var testCount     = 0;
	testcase.tests = {
		setUp    : function() { setUpCount++; },
		tearDown : function() { tearDownCount++; },
		'1'      : function() { testCount++; },
		'2'      : function() { testCount++; },
		'3'      : function() { testCount++; },
		'4'      : function() { testCount++; },
		'5'      : function() { testCount++; },
		'6'      : function() { testCount++; },
		'7'      : function() { testCount++; },
		'8'      : function() { testCount++; },
		'9'      : function() { testCount++; },
		'10'     : function() { testCount++; }
	};
	assert.equals(10, testcase.tests.length);

	testcase.masterPriority = 0.5;
	for (var i = 0, maxi = 10; i < maxi; i++)
	{
		testcase.tests.forEach(function(aTest) {
			delete aTest.shouldSkip;
		});
		testcase.run();
		utils.wait(function() { return testcase.done || testcase.aborted; });
		utils.wait(1);
	}
	assert.equals(testCount, setUpCount);
	assert.equals(testCount, tearDownCount);
	assert.compare(0, '<', testCount);
	assert.compare(100, '>', testCount);
}

function testMasterPriority()
{
	var mocks = createXUnitMocks(2);
	testcase = new TestCase('description1');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = {
		setUp    : mocks.setUp,
		tearDown : mocks.tearDown,
		'1'      : mocks.tests[0],
		'2'      : mocks.tests[1]
	};
	assert.equals(2, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);

	testcase = new TestCase('description2');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = {
		setUp    : new MockFunction('neverRunSetUp'),
		tearDown : new MockFunction('neverRunTearDown'),
		'1'      : new MockFunction('neverRunTest0'),
		'2'      : new MockFunction('neverRunTest1')
	};
	testcase.masterPriority = 'never';
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testMasterPriority_overriddenByEachPriority()
{
	var mocks = createXUnitMocks(1);
	var neverRunTest = new MockFunction('neverRunTest');
	neverRunTest.priority = 'never';
	testcase.tests = {
		setUp    : mocks.setUp,
		tearDown : mocks.tearDown,
		'1'      : mocks.tests[0],
		'2'      : neverRunTest
	};
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

testForceRetry.setUp = function() {
	testcase.ignoreLastResult = false;
};
function testForceRetry()
{
	var neverRunTest = new MockFunction('neverRunTest');
	var tests = {
		setUp    : new FunctionMock('setUp').expect([]),
		tearDown : new FunctionMock('tearDown').expect([]),
		test    : function() { assert.isTrue(false); neverRunTest(); }
	};
	testcase.tests = tests;
	assert.equals(1, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);

	tests.setUp.assert();
	tests.tearDown.assert();
	neverRunTest.assert();

	tests.setUp.expect([]).times(10);
	tests.tearDown.expect([]).times(10);

	utils.wait(
		Deferred.repeat(10, function() {
			testcase.done = false;
			testcase.masterPriority = 'normal';
			testcase.run();
			utils.wait(function() { return testcase.done || testcase.aborted; });
			assert.isTrue(testcase.done);
		})
	);
}

function testPreventForceRetryByMasterPriorityNever()
{
	var mocks = createXUnitMocks(1);
	var neverRunTest = new MockFunction('neverRunTest');
	testcase.tests = {
		setUp    : mocks.setUp.expect([]),
		tearDown : mocks.tearDown.expect([]),
		'1'      : function() { assert.isTrue(false); neverRunTest(); },
		'2'      : mocks.tests[0]
	};
	assert.equals(2, testcase.tests.length);

	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);

	mocks.setUp.assert();
	mocks.tearDown.assert();
	mocks.tests[0].assert();
	neverRunTest.assert();

	testcase.masterPriority = 'never';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testContext()
{
	var tests = {
		setUp    : new MockFunction('setUp'),
		tearDown : new MockFunction('tearDown'),
		'test'   : new MockFunction('test')
	};
	testcase.tests = tests;
	assert.equals(1, testcase.tests.length);

	tests.setUp.expect([]).bindTo(tests);
	tests.tearDown.expect([]).bindTo(tests);
	tests.test.expect([]).bindTo(tests);

	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);

	testcase.done = false;
	var context = {};
	testcase.context = context;

	tests.setUp.expect([]).bindTo(context);
	tests.tearDown.expect([]).bindTo(context);
	tests.test.expect([]).bindTo(context);

	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testListener()
{
	var mocks = createXUnitMocks(3);
	var tests = {
		setUp    : mocks.setUp,
		tearDown : mocks.tearDown,
		'1'      : function() { assert.isTrue(false); },
		'2'      : function() { throw 'test'; },
		'3'      : mocks.tests[0]
	};
	testcase.tests = tests;
	var listener = function(aEvent) {
		switch (aEvent.type)
		{
			case 'TestFinish':
				switch (aEvent.data.result)
				{
					case 'failure':
						mocks.tests[1]();
						break;
					case 'error':
						mocks.tests[2]();
						break;
				}
				break;
		}
	};
	testcase.addListener(listener);
	assert.equals(3, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);

	mocks.setUp.assert();
	mocks.tearDown.assert();
	mocks.tests[0].assert();
	mocks.tests[1].assert();
	mocks.tests[2].assert();

	mocks.setUp.expect([]).times(3);
	mocks.tearDown.expect([]).times(3);
	mocks.tests[0].expect([]);
	mocks.tests[1].expect([]);
	mocks.tests[2].expect([]);

	testcase.removeListener(listener);
	testcase.addListener({handleEvent : listener});
	testcase.done = false;
	testcase.masterPriority = 'must';
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
}

function testStopper()
{
	var shouldStop = false;
	var stopper = function() {};

	var mocks = createXUnitMocks(3);
	testcase.tests = {
		setUp    : mocks.setUp,
		tearDown : mocks.tearDown,
		'1'      : function() { mocks.tests[0](); stopper(); yield 500; },
		'2'      : function() { mocks.tests[1](); },
		'3'      : function() { mocks.tests[2](); }
	};
	assert.equals(3, testcase.tests.length);

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isTrue(testcase.done);
	assert.isFalse(testcase.aborted);

	mocks.setUp.assert();
	mocks.tearDown.assert();
	mocks.tests[0].assert();
	mocks.tests[1].assert();
	mocks.tests[2].assert();

	mocks.setUp.expect([]);
	mocks.tearDown.expect([]);
	mocks.tests[0].expect([]);

	testcase.done = false;
	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	stopper = testcase.run();
	yield 100;
	shouldStop = true;
	utils.wait(function() { return testcase.done || testcase.aborted; });
	assert.isFalse(testcase.done);
	assert.isTrue(testcase.aborted);
}

function testPrivSetUpTearDown()
{
	var pass = new FunctionMock('pass');
	pass.expect('startUp')
			.expect('setUp')
				.expect('setUp1')
					.expect('test1')
				.expect('tearDown1')
			.expect('tearDown')
			.expect('setUp')
				.expect('setUp2')
				.expect('tearDown2')
			.expect('tearDown')
			.expect('setUp')
				.expect('tearDown3')
			.expect('tearDown')
			.expect('setUp')
				.expect('setUp4')
					.expect('test4')
			.expect('tearDown')
		.expect('shutDown');

	testcase.registerStartUp(function() { pass('startUp'); });
	testcase.registerShutDown(function() { pass('shutDown'); });
	testcase.registerSetUp(function() { pass('setUp'); });
	testcase.registerTearDown(function() { pass('tearDown'); });
	testcase.registerTest((function() {
		var f = function() { pass('test1'); };
		f.setUp = function() { pass('setUp1'); };
		f.tearDown = function() { pass('tearDown1'); };
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() { throw 'error'; pass('test2'); };
		f.setUp = function() { pass('setUp2'); };
		f.tearDown = function() { pass('tearDown2'); };
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() { pass('test3'); };
		f.setUp = function() { throw 'error'; pass('setUp3'); };
		f.tearDown = function() { pass('tearDown3'); };
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() { pass('test4'); };
		f.setUp = function() { pass('setUp4'); };
		f.tearDown = function() { throw 'error'; pass('tearDown4'); };
		return f;
	})());
	assert.equals(4, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	testcase.run();
	utils.wait(function() { return testcase.done || testcase.aborted; });
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
	testcase.randomOrder = false;
	assertResults('success', 'failure', 'failure');
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
	testcase.randomOrder = false;
	assertResults('failure', 'success', 'success');
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
	testcase.randomOrder = false;
	assertResults('success', 'success', 'failure');
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
		f.shouldSkip = (new MockFunction('shouldSkip-true')).expect([], true);
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {};
		f.shouldSkip = (new MockFunction('shouldSkip-false')).expect([], false);
		return f;
	})());

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	assertResults('skip', 'success', 'skip', 'success');
}

function testShouldSkipForAll_boolean_skip()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = true;
	assertResults('skip', 'skip', 'skip');
}

function testShouldSkipForAll_boolean_success()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = false;
	assertResults('success', 'success', 'success');
}

function testShouldSkipForAll_function_skip()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = (new MockFunction('shouldSkip'))
							.expect([], true);
	assertResults('skip', 'skip', 'skip');
}

function testShouldSkipForAll_function_success()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = (new MockFunction('shouldSkip'))
							.expect([], false);
	assertResults('success', 'success', 'success');
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

function testWithArrayParameters()
{
	var test;

	test = (new MockFunction('test1'))
			.expect(true).expect(false);
	test.setUp = (new MockFunction('setUp1'))
			.expect(true).expect(false);
	test.tearDown = (new MockFunction('tearDown1'))
			.expect(true).expect(false);
	test.description = 'desc1';
	test.parameters = [true, false];
	assertRegisterTestWithParameters(test,
	                                 ['desc1 (1)',
	                                  'desc1 (2)']);

	test = (new MockFunction('test2'))
			.expect(0).expect(1).expect(2);
	test.setUp = (new MockFunction('setUp2'))
			.expect(0).expect(1).expect(2);
	test.tearDown = (new MockFunction('tearDown2'))
			.expect(0).expect(1).expect(2);
	test.description = 'desc2';
	test.parameters = [0, 1, 2];
	assertRegisterTestWithParameters(test,
	                                 ['desc2 (1)',
	                                  'desc2 (2)',
	                                  'desc2 (3)']);

	var obj = {};
	test = (new MockFunction('test3'))
			.expect(obj);
	test.setUp = (new MockFunction('setUp3'))
			.expect(obj);
	test.tearDown = (new MockFunction('tearDown3'))
			.expect(obj);
	test.description = 'desc3';
	test.parameters = [obj];
	assertRegisterTestWithParameters(test,
	                                 ['desc3 (1)']);

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	assertResults('success', 'success',
	              'success', 'success', 'success',
	              'success');
}

function testWithHashParameters()
{
	var test;

	var params1 = { foo : true,
	                bar : false }
	test = (new MockFunction('test1'))
			.expect(params1.foo).expect(params1.bar);
	test.setUp = (new MockFunction('setUp1'))
			.expect(params1.foo).expect(params1.bar);
	test.tearDown = (new MockFunction('tearDown1'))
			.expect(params1.foo).expect(params1.bar);
	test.description = 'desc1';
	test.parameters = params1;
	assertRegisterTestWithParameters(test,
	                                 ['desc1 (foo)',
	                                  'desc1 (bar)']);

	var params2 = { hoge : 0,
	                fuga : 1 }
	test = (new MockFunction('test2'))
			.expect(params2.hoge).expect(params2.fuga);
	test.setUp = (new MockFunction('setUp2'))
			.expect(params2.hoge).expect(params2.fuga);
	test.tearDown = (new MockFunction('tearDown2'))
			.expect(params2.hoge).expect(params2.fuga);
	test.description = 'desc2';
	test.parameters = params2;
	assertRegisterTestWithParameters(test,
	                                 ['desc2 (hoge)',
	                                  'desc2 (fuga)']);

	var params3 = { aaa : {},
	                bbb : {} }
	test = (new MockFunction('test3'))
			.expect(params3.aaa).expect(params3.bbb);
	test.setUp = (new MockFunction('setUp3'))
			.expect(params3.aaa).expect(params3.bbb);
	test.tearDown = (new MockFunction('tearDown3'))
			.expect(params3.aaa).expect(params3.bbb);
	test.description = 'desc3';
	test.parameters = params3;
	assertRegisterTestWithParameters(test,
	                                 ['desc3 (aaa)',
	                                  'desc3 (bbb)']);

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	assertResults('success', 'success',
	              'success', 'success',
	              'success', 'success');
}

function testErrorInGenerator()
{
	testcase.tests = {
		'test' : function() {
			yield Do(function() {
				throw new Error('error from generator');
				yield 1;
			});
		}
	};
	testcase.masterPriority = 'must';
	testcase.run();
	yield 100;
	assert.isTrue(testcase.done);
	assertResults('error');
}
