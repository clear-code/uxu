var topDir = baseURL+'../../../';

var TestCase = utils.import(topDir+'modules/test/testCase.js', 'Shift_JIS', {}).TestCase;
var TestSuite = utils.import(topDir+'modules/test/suite.js', {}).TestSuite;

var testcase;

function setUp()
{
	testcase = new TestCase('description');
	testcase.suite = new TestSuite({ uri : fileURL, browser :  gBrowser });
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
	testcase.run();
	yield testcase.done;
	assert.isFalse(testcase.suite.serverUtils.isHttpServerRunning());
}
