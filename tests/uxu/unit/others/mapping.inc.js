var shouldSkip = utils.checkPlatformVersion('1.9') < 0;

function startUp()
{
	yield utils.setUpHttpServer(4445, baseURL+'../../fixtures/');
}

function shutDown()
{
	yield utils.tearDownAllHttpServers();
	yield utils.clearPref('general.useragent.vendor');
}

function setUp()
{
	yield utils.loadURI('about:blank');
}

function assertMapped(aURI, aMapToFile)
{
	var referrer = aURI.indexOf('about:') > -1 ?
				null :
				utils.makeURIFromSpec('http://www.example.com/referer?'+Date.now());
	yield utils.loadURI(aURI, { referrer : referrer });
	assert.equals(aURI, content.location.href);
	assert.equals('test', content.document.title);
	if (referrer) {
		if (aMapToFile)
			assert.equals('', content.document.referrer);
		else
			assert.equals(referrer.spec, content.document.referrer);
	}

	function assertScriptExecuted() {
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Gecko_user_agent_string_reference
		var regexp = /Mozilla\/([\.0-9]+) \((?:[^;]+;\s+)+rv:([^\)]+)\) Gecko\/([\.0-9]+)\s+(.+)/;
		assert.match(regexp, $('script').textContent);

		var match = $('script').textContent.match(regexp);
		assert.equals('5.0', match[1]);
		assert.match(/^[0-9]+\.[0-9]+([ab]([0-9]+)?(pre)?)?/, match[2]);
	}

	assertScriptExecuted();
	// force reload
	yield utils.loadURI('about:blank');
	yield utils.loadURI(aURI);
	assertScriptExecuted();
}

function assertRedirectedSubmission()
{
	yield utils.loadURI('http://localhost:4445/html.html');
	$('form').submit();
	yield utils.wait(300);
	assert.equals('hash\n', content.document.documentElement.textContent);
}

function assertNotMapped(aURI)
{
	var referrer = aURI.indexOf('about:') > -1 ?
				null :
				utils.makeURIFromSpec('http://www.example.com/referer?'+Date.now());
	yield utils.loadURI(aURI, { referrer : referrer });
	assert.equals(aURI, content.location.href);
	assert.notEquals('test', content.document.title);
	if (referrer) assert.equals(referrer.spec, content.document.referrer);
}

function assertMappedXMLHttpRequest(aURI)
{
	var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
				.createInstance(Ci.nsIXMLHttpRequest)
				.QueryInterface(Ci.nsIDOMEventTarget);
	request.open('GET', aURI, false);
	request.send(null);
	assert.contains(
		'<title>test</title>',
		request.responseText
	);
}

function assertMappedImageRequest(aURI)
{
	var image = new Image();
	yield new Promise(function(aResolve, aReject) {
		image.src = aURI
		image.onload = function() {
			aResolve();
		};
	});
	assert.equals([48, 48], [image.width, image.height]);
}
