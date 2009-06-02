utils.include('./redirect.inc.js');

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
	yield Do(assertRedirected('http://www.example.com/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.example.jp/test/foobar'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.google.com/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('https://addons.mozilla.org/firefox/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertNotRedirected('about:config')); // not supported

	yield Do(assertRedirectedXMLHttpRequest('http://www.example.com/'));
	yield Do(assertRedirectedImageRequest('http://www.example.jp/test.jpg'));
}

