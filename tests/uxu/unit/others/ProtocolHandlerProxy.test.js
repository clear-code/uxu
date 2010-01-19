utils.include('../../../../components/GlobalService.js');
ENABLE_PROXY_ANYTIME = true;

var handler;
var uri;

var observer = {
		observe : function(aSubject, aTopic, aData)
		{
			if (aTopic != 'uxu-mapping-check') return;
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
			.addObserver(observer, 'uxu-mapping-check', false);
}
function removeObserver()
{
	Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService)
			.removeObserver(observer, 'uxu-mapping-check');
}


function test_mapURI_nomapping()
{
	assert.isNull(handler.mapURI(uri));
}

test_mapURI_mapped.setUp = function() { addObserver(); };
test_mapURI_mapped.tearDown = function() { removeObserver(); };
function test_mapURI_mapped()
{
	var newURI = handler.mapURI(uri);
	assert.isNotNull(newURI);
	assert.equals('http://www.example.jp/', newURI.spec);
}


function test_newChannel_nomapping()
{
	var channel = handler.newChannel(uri);
	assert.equals(uri.spec, channel.URI.spec);
}

test_newChannel_mapped.setUp = function() { addObserver(); };
test_newChannel_mapped.tearDown = function() { removeObserver(); };
function test_newChannel_mapped()
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
