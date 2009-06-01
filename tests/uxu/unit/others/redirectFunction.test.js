var redirect = function(aURI) {
		return aURI.spec.replace(/^.*google.*$/, baseURL+'../../fixtures/html.html');
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
}

