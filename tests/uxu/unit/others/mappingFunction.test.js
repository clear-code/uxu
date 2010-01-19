utils.include('./mapping.inc.js');

var mapping = function(aURI) {
		return aURI.spec
				.replace(/^.*localhost.*$/, 'http://localhost:4445/html.html')
				.replace(/^.*google.*$/, baseURL+'../../fixtures/html.html')
				.replace(/^.*www.example.jp.*\.jpg$/, baseURL+'../../../../skin/classic/uxu/bomb.png');
	};

function testMapping()
{
	yield Do(assertMapped('http://localhost:4445/notfound.html', false));
	yield Do(assertNotMapped('about:blank'));
	yield Do(assertNotMapped('http://www.example.com/'));
	yield Do(assertNotMapped('about:blank'));
	yield Do(assertMapped('http://www.google.com/', true));

	yield Do(assertMappedXMLHttpRequest('http://www.google.com/'));
	yield Do(assertMappedImageRequest('http://www.example.jp/test.jpg'));
}

