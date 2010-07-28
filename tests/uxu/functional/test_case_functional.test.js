var topDir = baseURL+'../../../';

var ns = {};
utils.include(topDir+'modules/test/environment.js', ns);

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var TestCaseClass = test_module.require('class', 'test_case');

var testcase;

function setUp()
{
	testcase = new TestCaseClass('description');
	testcase.environment = new ns.TestEnvironment({}, baseURL, gBrowser);
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
