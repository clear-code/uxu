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
	testcase.randomOrder = false;
	testcase.masterPriority = 'must';
	testcase.suite = new TestSuite({
		uri        : baseURL,
		browser    : gBrowser,
		envCreator : function() { return {}; }
	});
	yield utils.wait(1); // to run tests progressively
}

function tearDown()
{
}


function assertResults(...aArgs)
{
	testcase.run();
	yield testcase.done;
	assert.equals(
		aArgs,
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
	testcase = new TestCase('description', {
		ignoreLastResult : true
	});
	assert.equals('description', testcase.title);
	assert.isNull(testcase.masterPriority);
}

function testFunctionsWithProperties()
{
	testcase.tests = {
		'function expression' : function() {},
		'Fuction constructor' : (new Function('arg', 'return true')),
		'object with properties' : (function() {
			var f = function() {};
			f.description = 'description (must be overridden by hash key)';
			f.priority = 'must';
			f.setUp = function() {};
			f.tearDown = function() {};
			return f;
		})(),
		'object with property 2, without description' : (function() {
			var f = function() {};
			f.setup = function() {};
			f.teardown = function() {};
			return f;
		})(),
		'mallformed test: number' : 10,
		'mallformed test: string' : 'str',
		'mallformed test: boolean' : true
	};
	assert.equals(4, testcase.tests.length);
	assert.equals('object with properties', testcase.tests[2].description);
	assert.isNotNull(testcase.tests[2].setUp);
	assert.isNotNull(testcase.tests[2].tearDown);
	assert.isNotNull(testcase.tests[3].setUp);
	assert.isNotNull(testcase.tests[3].tearDown);

	testcase.registerTest(function() {});
	testcase.registerTest(new Function('arg', 'return true'));
	testcase.registerTest((function() {
		var f = function() {};
		f.description = 'new description';
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
	assert.equals('new description', testcase.tests[6].description);
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
	var results = [];
	testcase.setUp(() => results.push('setUp'));
	testcase.tearDown(() => results.push('tearDown'));
	testcase.test('0', () => results.push('test0'));
	testcase.test('1', () => results.push('test1'));
	testcase.test('2', () => results.push('test2'));
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '0');
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'test0', 'tearDown',
	               'setUp', 'test1', 'tearDown',
	               'setUp', 'test2', 'tearDown'],
	              results);
}

function testRegisterOperationStyle()
{
	var results = [];
	testcase.registerSetUp(() => results.push('setUp'));
	testcase.registerTearDown(() => results.push('tearDown'));
	testcase.registerTest(() => results.push('test0'));
	testcase.registerTest(() => results.push('test1'));
	testcase.registerTest(() => results.push('test2'));
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], "() => results.push('test0')");
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'test0', 'tearDown',
	               'setUp', 'test1', 'tearDown',
	               'setUp', 'test2', 'tearDown'],
	              results);
}

function testRegisterHashStyle()
{
	var results = [];
	testcase.tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		'0'      : () => results.push('test0'),
		'1'      : () => results.push('test1'),
		'2'      : () => results.push('test2')
	};
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '0');
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'test0', 'tearDown',
	               'setUp', 'test1', 'tearDown',
	               'setUp', 'test2', 'tearDown'],
	              results);
}

function testBDDFunctionCallStyle()
{
	var results = [];
	testcase.given(() => results.push('given'));
	testcase.states('0', () => results.push('states0'));
	testcase.states('1', () => results.push('states1'));
	testcase.states('2', () => results.push('states2'));
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '0');
	testcase.verify();
	yield testcase.done;
	assert.equals(['given', 'states0',
	               'given', 'states1',
	               'given', 'states2'],
	              results);
}

function testBDDHashStyle()
{
	var results = [];
	testcase.stateThat = {
		given : () => results.push('given'),
		'0'   : () => results.push('states0'),
		'1'   : () => results.push('states1'),
		'2'   : () => results.push('states2')
	};
	assert.equals(3, testcase.tests.length);
	assertInitialized(testcase.tests[0], '0');
	testcase.verify();
	yield testcase.done;
	assert.equals(['given', 'states0',
	               'given', 'states1',
	               'given', 'states2'],
	              results);
}

function testAsync_yield()
{
	var results = [];
	testcase.tests = {
		setUp : function()
		{
			results.push('setUp/0');
			yield 50;
			results.push('setUp/1');
		},
		tearDown : function()
		{
			results.push('tearDown/0');
			yield 50;
			results.push('tearDown/1');
		},
		'0' : function()
		{
			results.push('test0/0');
			yield 50;
			results.push('test0/1');
		},
		'1' : function()
		{
			results.push('test1/0');
			yield 50;
			results.push('test1/1');
		},
		'2' : function()
		{
			results.push('test2/0');
			yield 50;
			results.push('test2/1');
		}
	};
	assert.equals(3, testcase.tests.length);
	var start = Date.now();
	testcase.run();
	yield testcase.done;
	assert.compare(Date.now() - start, '>=', (50 * 3) * 3);
	assert.equals(['setUp/0', 'setUp/1', 'test0/0', 'test0/1', 'tearDown/0', 'tearDown/1',
	               'setUp/0', 'setUp/1', 'test1/0', 'test1/1', 'tearDown/0', 'tearDown/1',
	               'setUp/0', 'setUp/1', 'test2/0', 'test2/1', 'tearDown/0', 'tearDown/1'],
	              results);
}

function testReuseFunctions()
{
	var results = [];
	var tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		'0'      : () => results.push('test0'),
		'1'      : () => results.push('test1'),
		'2'      : () => results.push('test2')
	};
	var expectedResult = ['setUp', 'test0', 'tearDown',
	                      'setUp', 'test1', 'tearDown',
	                      'setUp', 'test2', 'tearDown']

	testcase = new TestCase('description0');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = tests;
	testcase.randomOrder = false;
	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(expectedResult, results);

	results = [];
	testcase = new TestCase('description2');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = tests;
	testcase.randomOrder = false;
	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(expectedResult, results);
}

function testNoFunction()
{
	var results = [];
	var setUp = () => results.push('setUp');
	var tearDown = () => results.push('setUp');
	testcase.tests = {
		setUp    : setUp,
		tearDown : tearDown
	};
	assert.equals(0, testcase.tests.length);
	testcase.run();
	yield testcase.done;
	assert.equals([], results);
}

function testPriority()
{
	var setUpCount    = 0;
	var tearDownCount = 0;
	var testCount     = 0;
	testcase.tests = {
		setUp    : () => setUpCount++,
		tearDown : () => tearDownCount++,
		'0'      : () => testCount++,
		'1'      : () => testCount++,
		'2'      : () => testCount++,
		'3'      : () => testCount++,
		'4'      : () => testCount++,
		'5'      : () => testCount++,
		'6'      : () => testCount++,
		'7'      : () => testCount++,
		'8'      : () => testCount++,
		'9'      : () => testCount++
	};
	assert.equals(10, testcase.tests.length);

	testcase.masterPriority = 0.5;
	for (var i = 0, maxi = 10; i < maxi; i++)
	{
		testcase.tests.forEach(function(aTest) {
			delete aTest.shouldSkip;
		});
		testcase.run();
		yield testcase.done;
	}
	assert.equals(testCount, setUpCount);
	assert.equals(testCount, tearDownCount);
	assert.compare(0, '<', testCount);
	assert.compare(100, '>', testCount);
}

function testMasterPriority()
{
	var results = [];
	testcase = new TestCase('description1');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		'0'      : () => results.push('test0'),
		'1'      : () => results.push('test1')
	};
	assert.equals(2, testcase.tests.length);
	testcase.randomOrder = false;
	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'test0', 'tearDown',
	               'setUp', 'test1', 'tearDown'],
	              results);

	results = [];
	testcase = new TestCase('description2');
	testcase.suite = new TestSuite({
		envCreator : function() { return {}; },
		uri        : baseURL,
		browser    : gBrowser
	});
	testcase.tests = {
		setUp    : () => results.push('neverRunSetUp'),
		tearDown : () => results.push('neverRunTearDown'),
		'0'      : () => results.push('neverRunTest0'),
		'1'      : () => results.push('neverRunTest1')
	};
	testcase.randomOrder = false;
	testcase.masterPriority = 'never';
	testcase.run();
	yield testcase.done;
	assert.equals([], results);
}

function testMasterPriority_overriddenByEachPriority()
{
	var results = [];
	var neverRunTest = () => results.push('neverRunTest');
	neverRunTest.priority = 'never';
	testcase.tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		'0'      : () => results.push('test0'),
		'1'      : neverRunTest
	};
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'test0', 'tearDown'],
	              results);
}

testForceRetry.setUp = function() {
	testcase.ignoreLastResult = false;
};
function testForceRetry()
{
	var results = [];
	var tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		test     : function() { assert.isTrue(false); results.push('neverRun'); }
	};
	testcase.tests = tests;
	assert.equals(1, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	var expectedResult = ['setUp', 'tearDown'];
	assert.equals(expectedResult, results);

	results = [];

	var allResults = [];
	for (let i = 0, maxi = 10; i < maxi; i++)
	{
		allResults = allResults.concat(expectedResult);
	}

	yield utils.wait(function() {
		for (let i = 0, maxi = 10; i < maxi; i++)
		{
			testcase.done = false;
			testcase.masterPriority = 'normal';
			testcase.run();
			yield testcase.done;
		}
	});
	assert.equals(allResults, results);
}

function testPreventForceRetryByMasterPriorityNever()
{
	var results = [];
	testcase.tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		'0'      : function() { assert.isTrue(false); results.push('neverRun'); },
		'1'      : () => results.push('test1')
	};
	assert.equals(2, testcase.tests.length);

	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'tearDown',
	               'setUp', 'test1', 'tearDown'],
	              results);

	results = [];
	testcase.masterPriority = 'never';
	testcase.run();
	yield testcase.done;
	assert.equals([],
	              results);
}

function testContext()
{
	var results = [];
	var tests = {
		setUp    : function() { results.push('setUp '+(this.name || '')) },
		tearDown : function() { results.push('tearDown '+(this.name || '')) },
		'test'   : function() { results.push('test '+(this.name || '')) }
	};
	testcase.tests = tests;
	assert.equals(1, testcase.tests.length);

	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp ', 'test ', 'tearDown '],
	              results);

	results = [];
	testcase.done = false;
	var context = {
		name : 'context'
	};
	testcase.context = context;
	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp context', 'test context', 'tearDown context'],
	              results);
}

function testListener()
{
	var results = [];
	var tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		'0'      : function() { results.push('test0'); assert.isTrue(false); },
		'1'      : function() { results.push('test1'); throw 'error from test'; },
		'2'      : () => results.push('test2')
	};
	testcase.tests = tests;
	var listener = function(aEvent) {
		switch (aEvent.type)
		{
			case 'TestFinish':
				switch (aEvent.data.result)
				{
					case 'failure':
						results.push('failure');
						break;
					case 'error':
						results.push('error');
						break;
				}
				break;
		}
	};
	testcase.addListener(listener);
	assert.equals(3, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'test0', 'tearDown', 'failure',
	               'setUp', 'test1', 'tearDown', 'error',
	               'setUp', 'test2', 'tearDown'],
	              results);

	results = [];
	testcase.removeListener(listener);
	testcase.addListener({handleEvent : listener});
	testcase.done = false;
	testcase.masterPriority = 'must';
	testcase.run();
	yield testcase.done;
	assert.equals(['setUp', 'test0', 'tearDown', 'failure',
	               'setUp', 'test1', 'tearDown', 'error',
	               'setUp', 'test2', 'tearDown'],
	              results);
}

function testStopper()
{
	var stopper = function() {};
	var results = [];

	testcase.tests = {
		setUp    : () => results.push('setUp'),
		tearDown : () => results.push('tearDown'),
		'0'      : function() { results.push('test0'); stopper(); yield 100; },
		'1'      : () => results.push('test1'),
		'2'      : () => results.push('test2')
	};
	assert.equals(3, testcase.tests.length);

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	testcase.run();
	yield Promise.race([testcase.done, testcase.aborted]);
	assert.isFalse(testcase.running);
	assert.isTrue(testcase._done);
	assert.isFalse(testcase._aborted);
	assert.equals(['setUp', 'test0', 'tearDown',
	               'setUp', 'test1', 'tearDown',
	               'setUp', 'test2', 'tearDown'],
	              results);

	results = [];

	testcase.done = false;
	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	stopper = testcase.run();
	yield 100;
	yield Promise.race([testcase.done, testcase.aborted]);
	assert.isFalse(testcase.running);
	assert.isFalse(testcase._done);
	assert.isTrue(testcase._aborted);
	assert.equals(['setUp', 'test0', 'tearDown'],
	              results);
}

function testPrivSetUpTearDown_sync()
{
	var results = [];
	testcase.registerStartUp(() => results.push('startUp'));
	testcase.registerShutDown(() => results.push('shutDown'));
	testcase.registerSetUp(() => results.push('setUp'));
	testcase.registerTearDown(() => results.push('tearDown'));
	testcase.registerTest((function() {
		var f = () => results.push('test1');
		f.setUp = () => results.push('setUp1');
		f.tearDown = () => results.push('tearDown1');
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() { throw 'error'; results.push('test2'); };
		f.setUp = () => results.push('setUp2');
		f.tearDown = () => results.push('tearDown2');
		return f;
	})());
	testcase.registerTest((function() {
		var f = () => results.push('test3');
		f.setUp = function() { throw 'error'; results.push('setUp3'); };
		f.tearDown = () => results.push('tearDown3');
		return f;
	})());
	testcase.registerTest((function() {
		var f = () => results.push('test4');
		f.setUp = () => results.push('setUp4');
		f.tearDown = function() { throw 'error'; results.push('tearDown4'); };
		return f;
	})());
	assert.equals(4, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	testcase.run();
	yield testcase.done;
	assert.equals(['startUp',
	                 'setUp',
	                   'setUp1', 'test1', 'tearDown1',
	                 'tearDown',
	                 'setUp',
	                   'setUp2', 'tearDown2',
	                 'tearDown',
	                 'setUp',
	                   'tearDown3',
	                 'tearDown',
	                 'setUp',
	                   'setUp4', 'test4',
	                 'tearDown',
	               'shutDown'],
	              results);
}

function testPrivSetUpTearDown_async()
{
	var results = [];

	testcase.registerStartUp(function() { yield 1; results.push('startUp'); });
	testcase.registerShutDown(function() { yield 1; results.push('shutDown'); });
	testcase.registerSetUp(function() { yield 1; results.push('setUp'); });
	testcase.registerTearDown(function() { yield 1; results.push('tearDown'); });
	testcase.registerTest((function() {
		var f = function() { yield 1; results.push('test1'); };
		f.setUp = function() { yield 1; results.push('setUp1'); };
		f.tearDown = function() { yield 1; results.push('tearDown1'); };
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() { yield 1; throw 'error'; results.push('test2'); };
		f.setUp = function() { yield 1; results.push('setUp2'); };
		f.tearDown = function() { yield 1; results.push('tearDown2'); };
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() { yield 1; results.push('test3'); };
		f.setUp = function() { yield 1; throw 'error'; results.push('setUp3'); };
		f.tearDown = function() { yield 1; results.push('tearDown3'); };
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() { yield 1; results.push('test4'); };
		f.setUp = function() { yield 1; results.push('setUp4'); };
		f.tearDown = function() { yield 1; throw 'error'; results.push('tearDown4'); };
		return f;
	})());

	assert.equals(4, testcase.tests.length);
	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	testcase.run();
	yield testcase.done;
	assert.equals(['startUp',
	                 'setUp',
	                   'setUp1', 'test1', 'tearDown1',
	                 'tearDown',
	                 'setUp',
	                   'setUp2', 'tearDown2',
	                 'tearDown',
	                 'setUp',
	                   'tearDown3',
	                 'tearDown',
	                 'setUp',
	                   'setUp4', 'test4',
	                 'tearDown',
	               'shutDown'],
	              results);
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
	yield assertResults('success', 'failure', 'failure');
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
	yield assertResults('failure', 'success', 'success');
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
	yield assertResults('success', 'success', 'failure');
}

function testShouldSkip()
{
	var results = [];
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
			results.push('shouldSkip-true');
			return true;
		};
		return f;
	})());
	testcase.registerTest((function() {
		var f = function() {};
		f.shouldSkip = function() {
			results.push('shouldSkip-false');
			return false;
		};
		return f;
	})());

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	yield assertResults('skip', 'success', 'skip', 'success');
	assert.equals(['shouldSkip-true',
	               'shouldSkip-false'],
	              results);
}

function testShouldSkipForAll_boolean_skip()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = true;
	yield assertResults('skip', 'skip', 'skip');
}

function testShouldSkipForAll_boolean_success()
{
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = false;
	yield assertResults('success', 'success', 'success');
}

function testShouldSkipForAll_function_skip()
{
	var results = [];
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = function() {
		results.push('shouldSkip');
		return true;
	};
	yield assertResults('skip', 'skip', 'skip');
	assert.equals(['shouldSkip'],
	              results);
}

function testShouldSkipForAll_function_success()
{
	var results = [];
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.registerTest(function() {});
	testcase.masterPriority = 'must';
	testcase.shouldSkip = function() {
		results.push('shouldSkip');
		return false;
	};
	yield assertResults('success', 'success', 'success');
	assert.equals(['shouldSkip'],
	              results);
}


function assertRegisterTestWithParameters(aTest, aDescriptions)
{
	var lastCount = testcase.tests.length;
	assert.equals(aDescriptions.length, testcase.tests.length - lastCount);
	for (let i = 0; i < aDescriptions.length; i++)
	{
		assert.equals(aDescriptions[i],
		              testcase.tests[lastCount+i].description);
	}
}

function createTestWithParameter(aSuffix, aParams, aResults) {
	var test = function(aParameter) {
		aResults.push('test' + aSuffix + ':' + JSON.stringify(aParameter));
	};
	test.setUp = function(aParameter) {
		aResults.push('setUp' + aSuffix + ':' + JSON.stringify(aParameter));
	};
	test.tearDown = function(aParameter) {
		aResults.push('tearDown' + aSuffix + ':' + JSON.stringify(aParameter));
	};
	test.description = 'test' + aSuffix;
	test.parameters = aParams;
	return test;
}

function testWithArrayParameters()
{
	var results = [];
	var testBoolean = createTestWithParameter(
			'Boolean',
			[true, false],
			results
		);
	var testInteger = createTestWithParameter(
			'Integer',
			[0, 1, 2],
			results
		);
	var testObject = createTestWithParameter(
			'Object',
			[{}],
			results
		);

	testcase.registerTest(testBoolean);
	testcase.registerTest(testInteger);
	testcase.registerTest(testObject);
	assert.equals(['testBoolean (1)',
	               'testBoolean (2)',
	               'testInteger (1)',
	               'testInteger (2)',
	               'testInteger (3)',
	               'testObject (1)'],
	              testcase.tests.map((aTest) => aTest.description));

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	yield assertResults('success', 'success',
	                    'success', 'success', 'success',
	                    'success');
	assert.equals([
		'setUpBoolean:true', 'testBoolean:true', 'tearDownBoolean:true',
		'setUpBoolean:false', 'testBoolean:false', 'tearDownBoolean:false',
		'setUpInteger:0', 'testInteger:0', 'tearDownInteger:0',
		'setUpInteger:1', 'testInteger:1', 'tearDownInteger:1',
		'setUpInteger:2', 'testInteger:2', 'tearDownInteger:2',
		'setUpObject:{}', 'testObject:{}', 'tearDownObject:{}'
	], results);
}

function testWithHashParameters()
{
	var results = [];
	var testBoolean = createTestWithParameter(
			'Boolean',
			{ foo : true,
			  bar : false },
			results
		);
	var testInteger = createTestWithParameter(
			'Integer',
			{ hoge : 0,
			  fuga : 1 },
			results
		);
	var testObject = createTestWithParameter(
			'Object',
			{ aaa : {value:true},
			  bbb : {value:false} },
			results
		);

	testcase.registerTest(testBoolean);
	testcase.registerTest(testInteger);
	testcase.registerTest(testObject);
	assert.equals(['testBoolean (foo)',
	               'testBoolean (bar)',
	               'testInteger (hoge)',
	               'testInteger (fuga)',
	               'testObject (aaa)',
	               'testObject (bbb)'],
	              testcase.tests.map((aTest) => aTest.description));

	testcase.masterPriority = 'must';
	testcase.randomOrder = false;
	yield assertResults('success', 'success',
	                    'success', 'success',
	                    'success', 'success');
	assert.equals([
		'setUpBoolean:true', 'testBoolean:true', 'tearDownBoolean:true',
		'setUpBoolean:false', 'testBoolean:false', 'tearDownBoolean:false',
		'setUpInteger:0', 'testInteger:0', 'tearDownInteger:0',
		'setUpInteger:1', 'testInteger:1', 'tearDownInteger:1',
		'setUpObject:{"value":true}', 'testObject:{"value":true}',
		  'tearDownObject:{"value":true}',
		'setUpObject:{"value":false}', 'testObject:{"value":false}',
		  'tearDownObject:{"value":false}'
	], results);
}

function testErrorInGenerator()
{
	testcase.tests = {
		'test'   : function() {
			yield function() {
				throw new Error('error from generator');
				yield 1;
			};
		}
	};
	testcase.masterPriority = 'must';
	testcase.run();
	yield 100;
	assert.isTrue(testcase._done);
	yield assertResults('error');
}
