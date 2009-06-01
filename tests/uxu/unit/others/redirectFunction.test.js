var redirect = function(aURI) {
		return aURI.spec
				.replace(/^.*google.*$/, baseURL+'../../fixtures/html.html')
				.replace(/^.*www.example.jp.*\.jpg$/, baseURL+'../../../../skin/classic/uxu/bomb.png');
	};

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

	yield Do(assertNotRedirected('http://www.example.com/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.google.com/'));

	var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
				.createInstance(Ci.nsIXMLHttpRequest)
				.QueryInterface(Ci.nsIDOMEventTarget);
	request.open('GET', 'http://www.google.com/', false);
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

