var topDir = baseURL+'../../../../';

var ServerUtils = utils.import(topDir+'modules/server/utils.js', {}).ServerUtils;
var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

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



var htaccess;

function assertRedirect(aStatus, aStatusText, aURI, aPath)
{
	var result = utilsModule.processRequestByHtaccess(aPath, htaccess);
	assert.notNull(result);
	assert.equals(
		{ status     : aStatus,
		  statusText : aStatusText, 
		  uri        : aURI },
		result
	);
}

function assertRewrited(aURI, aPath)
{
	var result = utilsModule.processRequestByHtaccess(aPath, htaccess);
	assert.notNull(result);
	assert.equals(
		{ status     : 200,
		  statusText : 'OK', 
		  uri        : aURI },
		result
	);
}

function assertNotModified(aPath)
{
	assert.isNull(utilsModule.processRequestByHtaccess(aPath, htaccess));
}

test_processRequestByHtaccess.setUp = function() {
	htaccess = utils.readFrom(baseURL+'../../fixtures/redirect/.htaccess');
};
function test_processRequestByHtaccess()
{
	assertRedirect(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/sub/permanent/file');
	assertRedirect(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/sub/temp/file');
	assertRedirect(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/sub/seeother/file');
	assertRedirect(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/sub/permanent2/file');
	assertRedirect(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/sub/temp2/file');
	assertRedirect(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/match/file');
	assertNotModified('/not_redirect/match/file');

	assertRewrited('/file',
	               '/redirect/rewrite/file');
	assertRewrited('http://localhost:4445/file',
	               '/redirect/rewrite_absolute/file');
	assertRedirect(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect/file');
	assertRedirect(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect301/file');
	assertRedirect(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect302/file');
	assertRedirect(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect303/file');
	assertNotModified('/redirect/not_rewrite/match/file');
	assertNotModified('/redirect/rewrite_invalid/match/file');

	htaccess = '';
	assertNotModified('/redirect/sub/permanent/file');
	assertNotModified('/redirect/sub/temp/file');
	assertNotModified('/redirect/sub/seeother/file');
	assertNotModified('/redirect/sub/permanent2/file');
	assertNotModified('/redirect/sub/temp2/file');
	assertNotModified('/redirect/match/file');
	assertNotModified('/redirect/rewrite/file');
	assertNotModified('/redirect/rewrite_absolute/file');
	assertNotModified('/redirect/rewrite_redirect/file');
}
