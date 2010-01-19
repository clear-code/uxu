utils.include('./mapping.inc.js');

var mapping = {
		'http://localhost:4445/*'      : 'http://localhost:4445/html.html',
		'http://www.example.com/'      : 'http://localhost:4445/html.html',
		'http://www.example.jp/*.jpg'  : baseURL+'../../../../skin/classic/uxu/bomb.png',
		'http://www.example.jp/*'      : 'http://localhost:4445/html.html',
		'https://addons.mozilla.org/*' : baseURL+'../../fixtures/html.html',
		'about:config'                 : baseURL+'../../fixtures/html.html'
};

function testMapping()
{
	yield Do(assertMapped('http://localhost:4445/notfound.html', false));
	yield Do(assertNotMapped('about:blank'));
	yield Do(assertMapped('http://www.example.com/', false));
	yield Do(assertNotMapped('about:blank'));
	yield Do(assertMapped('http://www.example.jp/test/foobar', false));
	yield Do(assertNotMapped('about:blank'));
	yield Do(assertMapped('https://addons.mozilla.org/firefox/', true));
	yield Do(assertNotMapped('about:blank'));
	yield Do(assertNotMapped('about:config')); // not supported

	yield Do(assertMappedXMLHttpRequest('http://www.example.com/'));
	yield Do(assertMappedImageRequest('http://www.example.jp/test.jpg'));
}

