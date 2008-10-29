var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var lib_module = new ModuleManager([topDir+'content/uxu/lib']);

var server_module = new ModuleManager([topDir+'content/uxu/server']);
var utilsModule;

var observer;

function setUp()
{
	utilsModule = server_module.require('package', 'utils');
}

function tearDown()
{
}

function testSendAndReceiveMessage()
{
	var received;
	var listener = utilsModule.startListen(-1, function(aMessage) {
		received = aMessage;
	});
	assert.isNotNull(listener);

	var message = parseInt(Math.random() * 65000);
	var response;
	utilsModule.sendMessage(
		message,
		'localhost',
		listener.port,
		function(aResponse) {
			response = aResponse;
		}
	);
	yield 500;
	assert.equals(message, received);
	assert.equals(message, response);

	listener.stop();
}
