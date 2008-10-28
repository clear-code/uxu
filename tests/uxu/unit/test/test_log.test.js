var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var TestLogClass = test_module.require('class', 'test_log');

function setUp()
{
}

function tearDown()
{
}

function testFoo()
{
}
