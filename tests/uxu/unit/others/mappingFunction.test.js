utils.include('./mapping.inc.js');

var mapping = function(aURI) {
		return aURI.spec
				.replace(/^.*localhost.*$/, 'http://localhost:4445/html.html')
				.replace(/^.*google.*$/, baseURL+'../../fixtures/html.html')
				.replace(/^.*www.example.jp.*\.jpg$/, baseURL+'../../../../skin/classic/uxu/bomb.png')
				.replace(/^.*www.example.org.*\.jpg$/, '<redirect>http://localhost:4445/html.html');
	};

function testMapping()
{
	assertMapped('http://localhost:4445/notfound.html', false);
	assertNotMapped('about:blank');
	assertNotMapped('http://www.example.com/');
	assertNotMapped('about:blank');
	assertMapped('http://www.google.com/', true);
	assertRedirected('http://www.example.org/?', true);

	assertMappedXMLHttpRequest('http://www.google.com/');
	assertMappedImageRequest('http://www.example.jp/test.jpg');
}

