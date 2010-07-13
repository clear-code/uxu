var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var ActionsClass = test_module.require('class', 'action');

var actionModule;

function setUp()
{
	actionModule = new ActionsClass(utils);
	actionModule.constructor(utils);
}

function tearDown()
{
	actionModule.destroy();
}


function test_readyToOK()
{
	actionModule.readyToOK();
	var before = Date.now();
	alert('click OK');
	assert.compare(500, '>', Date.now() - before);
}

function test_readyToConfirm()
{
	var before = Date.now();
	actionModule.readyToConfirm(true);
	var result = confirm('click OK');
	assert.isTrue(result);
	assert.compare(500, '>', Date.now() - before);

	before = Date.now();
	actionModule.readyToConfirm(false);
	result = confirm('click Cancel');
	assert.isFalse(result);
	assert.compare(500, '>', Date.now() - before);
}

function test_readyToPrompt()
{
	var before = Date.now();
	actionModule.readyToPrompt('input');
	var result = prompt('test');
	assert.equals('input', result);
	assert.compare(500, '>', Date.now() - before);
}
