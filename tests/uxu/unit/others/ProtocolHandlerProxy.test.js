utils.include('../../../../components/GlobalService.js');
ENABLE_PROXY_ANYTIME = true;

var handler;
var uri;

var observer = {
		observe : function(aSubject, aTopic, aData)
		{
			if (aTopic != 'uxu-redirect-check') return;
			aSubject.QueryInterface(Ci.nsISupportsString)
				.data = 'http://www.example.jp/';
		}
	};

function setUp()
{
	handler = new ProtocolHandlerProxy();
	uri = utils.makeURIFromSpec('http://www.example.com/');
}

function tearDown()
{
}

function test_getNativeProtocolHandler()
{
	var nativeHandler;

	nativeHandler = handler.getNativeProtocolHandler('http');
	assert.equals(
		Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'].getService(),
		nativeHandler
	);

	nativeHandler = handler.getNativeProtocolHandler('https');
	assert.isTrue(nativeHandler);
	assert.equals(
		Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'].getService(),
		nativeHandler
	);

	nativeHandler = handler.getNativeProtocolHandler('file');
	assert.isTrue(nativeHandler);
	assert.equals(
		Components.classesByID['{fbc81170-1f69-11d3-9344-00104ba0fd40}'].getService(),
		nativeHandler
	);
}


function addObserver()
{
	Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService)
			.addObserver(observer, 'uxu-redirect-check', false);
}
function removeObserver()
{
	Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService)
			.removeObserver(observer, 'uxu-redirect-check');
}


function test_redirectURI_noredirect()
{
	assert.isNull(handler.redirectURI(uri));
}

test_redirectURI_redirected.setUp = function() { addObserver(); };
test_redirectURI_redirected.tearDown = function() { removeObserver(); };
function test_redirectURI_redirected()
{
	var newURI = handler.redirectURI(uri);
	assert.isNotNull(newURI);
	assert.equals('http://www.example.jp/', newURI.spec);
}


function test_newChannel_noredirect()
{
	var channel = handler.newChannel(uri);
	assert.equals(uri.spec, channel.URI.spec);
}

test_newChannel_redirected.setUp = function() { addObserver(); };
test_newChannel_redirected.tearDown = function() { removeObserver(); };
function test_newChannel_redirected()
{
	var channel = handler.newChannel(uri);
	assert.equals('http://www.example.jp/', channel.URI.spec);
}


/*
function test_newProxiedChannel()
{
	var file = utils.getFileFromURLSpec(baseURL+'../../fixtures/element.install.rdf');
	assert.isNotNull(file);
	var version = service.getVersionFromManifest(file);
	assert.equals('0.12.3.45', version);

	file = utils.getFileFromURLSpec(baseURL+'../../fixtures/attribute.install.rdf');
	assert.isNotNull(file);
	version = service.getVersionFromManifest(file);
	assert.equals('0.12.3.45', version);
}
*/
