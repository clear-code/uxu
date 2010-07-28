var topDir = baseURL+'../../../';

var TestCase = {};
utils.include(topDir+'modules/test/testCase.js', 'Shift_JIS', TestCase);
TestCase = TestCase.TestCase;

var TestEnvironment = {};
utils.include(topDir+'modules/test/environment.js', 'Shift_JIS', TestEnvironment);
TestEnvironment = TestEnvironment.TestEnvironment;

var testcase;

function setUp()
{
	testcase = new TestCase('description');
	testcase.environment = new TestEnvironment(null, baseURL, gBrowser);
	yield 0; // to run tests progressively
}

function tearDown()
{
}

test_testCaseWithHttpDaemons.shouldSkip = utils.checkPlatformVersion('1.9') < 0;
test_testCaseWithHttpDaemons.assertions = 7;
function test_testCaseWithHttpDaemons()
{
	var base = baseURL+'../fixtures/';
	testcase.tests = {
		'1' : function() {
			assert.isFalse(serverUtils.isHttpServerRunning());
			var port = 4445;
			yield Do(utils.setUpHttpServer(port, base));
			yield Do(utils.loadURI('http://localhost:'+port+'/html.html'));
			assert.equals('test', content.document.title);
			assert.isTrue(serverUtils.isHttpServerRunning());
		}
	};
	assert.equals(1, testcase.tests.length);
	testcase.masterPriority = 'must';
	assert.isFalse(testcase.done);
	testcase.run();
	yield 1500;
	assert.isTrue(testcase.done);
	assert.isFalse(testcase.environment.serverUtils.isHttpServerRunning());
}
