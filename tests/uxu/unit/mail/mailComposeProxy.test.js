utils.include('../../../../content/uxu/lib/module_manager.js');

var mail_module = new ModuleManager(['chrome://uxu/content/mail']);
var MailComposeProxy = mail_module.require('class', 'mailComposeProxy');

var proxy;

function setUp()
{
	proxy = new MailComposeProxy({});
}

function tearDown()
{
}

