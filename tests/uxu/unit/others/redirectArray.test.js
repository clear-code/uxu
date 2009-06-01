var redirect = [
		'http://www.example.com/',      baseURL+'../../fixtures/html.html',
		'http://www.example.jp/*.jpg',  baseURL+'../../../../skin/classic/uxu/bomb.png',
		'http://www.example.jp/*',      baseURL+'../../fixtures/html.html',
		'https://addons.mozilla.org/*', baseURL+'../../fixtures/html.html',
		/.*google.*/,                   baseURL+'../../fixtures/html.html',
		'about:config',                 baseURL+'../../fixtures/html.html'
	];

function testRedirect()
{
	function assertRedirected(aURI)
	{
		yield Do(utils.loadURI(aURI));
		assert.equals(aURI, content.location.href);
		assert.equals('test', content.document.title);
	}

	function assertNotRedirected(aURI)
	{
		yield Do(utils.loadURI(aURI));
		assert.equals(aURI, content.location.href);
		assert.notEquals('test', content.document.title);
	}

	yield Do(assertRedirected('http://www.example.com/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.example.jp/test/foobar'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.google.com/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('https://addons.mozilla.org/firefox/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertNotRedirected('about:config')); // not supported

	var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
				.createInstance(Ci.nsIXMLHttpRequest)
				.QueryInterface(Ci.nsIDOMEventTarget);
	request.open('GET', 'http://www.example.com/', false);
	request.send(null);
	assert.contains(
		'<title>test</title>',
		request.responseText
	);

	var loaded = { value : false };
	var image = new Image();
	image.src = 'http://www.example.jp/test.jpg'
	image.onload = function() {
		loaded.value = true;
	};
	yield loaded;
	assert.equals([48, 48], [image.width, image.height]);
}

