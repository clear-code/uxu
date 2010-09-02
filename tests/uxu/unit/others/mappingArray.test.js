utils.include('./mapping.inc.js');

var mapping = [
		'http://localhost:4445/notfound.*', 'http://localhost:4445/html.html',
		'http://www.example.com/',          'http://localhost:4445/html.html',
		'http://www.example.jp/*.jpg',      baseURL+'../../../../skin/classic/uxu/bomb.png',
		'http://www.example.jp/*',          'http://localhost:4445/html.html',
		'https://addons.mozilla.org/*',     baseURL+'../../fixtures/html.html',
		/.*google.*/,                       baseURL+'../../fixtures/html.html',
		'about:config',                     baseURL+'../../fixtures/html.html',
		'http://submission/*',              'http://localhost:4445/redirect/match/hash.txt'
	];

function testMapping()
{
	assertMapped('http://localhost:4445/notfound.html', false);
	assertNotMapped('about:blank');
	assertMapped('http://www.example.com/', false)
	assertNotMapped('about:blank');
	assertMapped('http://www.example.jp/test/foobar', false);
	assertNotMapped('about:blank');
	assertMapped('https://addons.mozilla.org/firefox/', true);
	assertNotMapped('about:blank');
	assertMapped('http://www.google.com/', true);
	assertNotMapped('about:blank');
	assertNotMapped('about:config'); // not supported

	assertMappedXMLHttpRequest('http://www.example.com/');
	assertMappedImageRequest('http://www.example.jp/test.jpg');

	assertRedirectedSubmission();
}

