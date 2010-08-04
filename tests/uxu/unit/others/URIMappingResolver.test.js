utils.include({ url : '../../../../components/ProtocolHandler.js', allowOverrideConstants : true });
ENABLE_PROXY_ANYTIME = true;

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
	uri = utils.makeURIFromSpec('http://www.example.com/');
}

function tearDown()
{
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


function test_getNativeProtocolHandler()
{
	var nativeHandler;

	nativeHandler = URIMappingResolver.getNativeProtocolHandler('http');
	assert.equals(
		Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'].getService(),
		nativeHandler
	);

	nativeHandler = URIMappingResolver.getNativeProtocolHandler('https');
	assert.isTrue(nativeHandler);
	assert.equals(
		Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'].getService(),
		nativeHandler
	);

	nativeHandler = URIMappingResolver.getNativeProtocolHandler('file');
	assert.isTrue(nativeHandler);
	assert.equals(
		Components.classesByID['{fbc81170-1f69-11d3-9344-00104ba0fd40}'].getService(),
		nativeHandler
	);
}


function test_resolve_nomapping()
{
	assert.isNull(URIMappingResolver.resolve(uri.spec));
}

test_resolve_mapped.setUp = function() { addObserver(); };
test_resolve_mapped.tearDown = function() { removeObserver(); };
function test_resolve_mapped()
{
	var newURI = URIMappingResolver.resolve(uri.spec);
	assert.isNotNull(newURI);
	assert.equals('http://www.example.jp/', newURI.spec);
}
