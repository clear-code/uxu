utils.include('./redirect.inc.js');

var redirect = [
		'http://localhost:4445/*',      'http://localhost:4445/html.html',
		'http://www.example.com/',      'http://localhost:4445/html.html',
		'http://www.example.jp/*.jpg',  baseURL+'../../../../skin/classic/uxu/bomb.png',
		'http://www.example.jp/*',      'http://localhost:4445/html.html',
		'https://addons.mozilla.org/*', baseURL+'../../fixtures/html.html',
		/.*google.*/,                   baseURL+'../../fixtures/html.html',
		'about:config',                 baseURL+'../../fixtures/html.html'
	];

function testRedirect()
{
	yield Do(assertRedirected('http://localhost:4445/notfound.html', false));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.example.com/', false));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.example.jp/test/foobar', false));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('https://addons.mozilla.org/firefox/', true));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.google.com/', true));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertNotRedirected('about:config')); // not supported

	yield Do(assertRedirectedXMLHttpRequest('http://www.example.com/'));
	yield Do(assertRedirectedImageRequest('http://www.example.jp/test.jpg'));
}

