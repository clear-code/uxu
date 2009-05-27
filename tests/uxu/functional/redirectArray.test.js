var redirect = [
		'about:config',            baseURL+'../uxu/fixtures/html.html',
		'http://www.example.com/', baseURL+'../uxu/fixtures/html.html',
		'http://www.example.jp/*', baseURL+'../uxu/fixtures/html.html',
		/.*google.*/,              baseURL+'../uxu/fixtures/html.html'
	];

function testRedirect()
{
	yield Do(utils.loadURI('http://www.example.com/'));
	assert.contains('file://', content.location.href);

	yield Do(utils.loadURI('about:blank'));
	assert.equals('about:blank', content.location.href);

	yield Do(utils.loadURI('http://www.example.jp/test/foobar'));
	assert.contains('file://', content.location.href);

	yield Do(utils.loadURI('about:blank'));
	assert.equals('about:blank', content.location.href);

	yield Do(utils.loadURI('http://www.google.com/'));
	assert.contains('file://', content.location.href);

	yield Do(utils.loadURI('about:blank'));
	assert.equals('about:blank', content.location.href);

	yield Do(utils.loadURI('about:config'));
	assert.contains('file://', content.location.href);

	var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
				.createInstance(Ci.nsIXMLHttpRequest)
				.QueryInterface(Ci.nsIDOMEventTarget);
	request.open('GET', 'http://www.example.com/', false);
	request.send(null);
	assert.contains(
		'<title>test</title>',
		request.responseText
	);
}

