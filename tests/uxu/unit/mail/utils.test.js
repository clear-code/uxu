utils.include('../../../../content/uxu/lib/module_manager.js');

var mail_module = new ModuleManager(['chrome://uxu/content/mail']);
var utilsModule;

function setUp()
{
	utilsModule = mail_module.require('package', 'utils');
}

function tearDown()
{
}

