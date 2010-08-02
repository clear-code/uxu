var topDir = baseURL+'../../../../';

var ServerUtils = utils.import(topDir+'modules/server/utils.js', {}).ServerUtils;

var utilsModule;
var observer;

function setUp()
{
	utilsModule = new ServerUtils();
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


testHttpServer.shouldSkip = utils.checkPlatformVersion('1.9') < 0;
testHttpServer.tearDown = function() {
	yield Do(utilsModule.tearDownAllHttpServers());
};
function testHttpServer()
{
	assert.isFalse(utilsModule.isHttpServerRunning());
	var port = 4445;
	yield Do(utilsModule.setUpHttpServer(port, baseURL+'../../fixtures/'));
	yield Do(utils.loadURI('http://localhost:'+port+'/html.html'));
	assert.equals('test', content.document.title);
	assert.isTrue(utilsModule.isHttpServerRunning());
}
