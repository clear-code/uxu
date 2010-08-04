var shouldSkip = utils.checkPlatformVersion('1.9') < 0;

function setUp()
{
	utils.setUpHttpServer(4445, baseURL+'../../fixtures/');
	utils.wait(300);
}

function tearDown()
{
	utils.tearDownAllHttpServers();
	utils.clearPref('general.useragent.vendor');
}

function assertMapped(aURI, aMapToFile)
{
	utils.setPref('general.useragent.vendor', '');
	utils.wait(300);

	var referrer = aURI.indexOf('about:') > -1 ?
				null :
				utils.makeURIFromSpec('http://www.example.com/referer?'+Date.now());
	utils.loadURI(aURI, { referrer : referrer });
	utils.wait(100);
	assert.equals(aURI, content.location.href);
	assert.equals('test', content.document.title);
	if (referrer) {
		if (aMapToFile)
			assert.equals('', content.document.referrer);
		else
			assert.equals(referrer.spec, content.document.referrer);
	}

	// for example:
	// Mozilla/5.0 (Windows; U; Windows NT 5.1; ja; rv:1.9.0.10) Gecko/2009042316 Firefox/3.0.10 (.NET CLR 3.5.30729)
	var regexp = /Mozilla\/([\.0-9]+) \(([^;]*); ([^;]*); (?:([^;]*); ([^;]*); )?rv:([^\)]+)\) Gecko\/([\.0-9]+)\s+(.+)/;
	assert.match(regexp, $('script').textContent);

	var match = $('script').textContent.match(regexp);
	assert.equals('5.0', match[1]);
	assert.match(/^[0-9]+\.[0-9]+([ab]([0-9]+)?(pre)?)?/, match[6]);

	assert.notContains('foobar', $('script').textContent);
	utils.setPref('general.useragent.vendor', 'foobar');
	utils.wait(300);
	// force reload
	utils.loadURI('about:blank');
	utils.loadURI(aURI);
	assert.contains('foobar', $('script').textContent);
}

function assertRedirected(aURI)
{
	utils.loadURI('about:blank');
	utils.loadURI(aURI);
	var redirected = utils.mapURI(aURI, mapping).replace(/^<redirect>/i, '');
	utils.wait(300);
	assert.equals(redirected, content.location.href);
	assert.equals('test', content.document.title);
}

function assertNotMapped(aURI)
{
	var referrer = aURI.indexOf('about:') > -1 ?
				null :
				utils.makeURIFromSpec('http://www.example.com/referer?'+Date.now());
	utils.loadURI(aURI, { referrer : referrer });
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
	var loaded = { value : false };
	var image = new Image();
	image.src = aURI
	image.onload = function() {
		loaded.value = true;
	};
	utils.wait(loaded);
	assert.equals([48, 48], [image.width, image.height]);
}
