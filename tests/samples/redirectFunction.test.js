var redirect = function(aURI) {
		return aURI.spec.replace(/^.*google.*$/, baseURL+'../uxu/fixtures/html.html');
	};

function testRedirect()
{
	yield Do(utils.loadURI('http://www.example.com/'));
	assert.equals('http://www.example.com/', content.location.href);

	yield Do(utils.loadURI('about:blank'));
	assert.equals('about:blank', content.location.href);

	yield Do(utils.loadURI('http://www.google.com/'));
	assert.contains('file://', content.location.href);
}

