utils.include({ url : '../../../../components/ProtocolHandler.js', allowOverrideConstants : true });
ENABLE_PROXY_ANYTIME = true;

URIMappingResolver.resolve = function() {
	return resolved;
};

var handler;
var uri;
var resolved;

function setUp()
{
	handler = new ProtocolHandlerProxy();
	uri = utils.makeURIFromSpec('http://www.example.com/');
	resolved = null;
}

function tearDown()
{
}

function test_newChannel()
{
	var channel = handler.newChannel(uri);
	assert.equals(uri.spec, channel.URI.spec);
	resolved = utils.makeURIFromSpec('http://www.example.jp/');
	channel = handler.newChannel(uri);
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
