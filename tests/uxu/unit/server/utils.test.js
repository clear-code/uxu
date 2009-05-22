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

	var message = String(parseInt(Math.random() * 65000));
	var response;
	utilsModule.sendMessage(
		message,
		'localhost',
		listener.port,
		function(aResponse) {
			response = aResponse;
		}
	);
	var start = Date.now();
	yield function() {
			return response || (Date.now() - start > 5000);
		};
	assert.equals({ received : message,
	                response : message },
	              { received : received,
	                response : response });

	listener.stop();
}
