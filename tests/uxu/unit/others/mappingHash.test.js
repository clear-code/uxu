var parallel = false;
utils.include('./mapping.inc.js');

var mapping = {
		'http://localhost:4445/notfound.*' : 'http://localhost:4445/html.html',
		'http://www.example.com/'          : 'http://localhost:4445/html.html',
		'http://www.example.jp/*.jpg'      : baseURL+'../../../../skin/classic/uxu/bomb.png',
		'http://www.example.jp/*'          : 'http://localhost:4445/html.html',
		'https://addons.mozilla.org/*'     : baseURL+'../../fixtures/html.html',
		'about:config'                     : baseURL+'../../fixtures/html.html',
		'http://submission/*'              : 'http://localhost:4445/redirect/match/hash.txt'
};

function tearDown()
{
	yield utils.loadURI('about:blank');
}

testMapped.patterns = [
	{ uri : 'http://localhost:4445/notfound.html' },
	{ uri : 'http://www.example.com/' },
	{ uri : 'http://www.example.jp/test/foobar' },
	{ uri : 'https://addons.mozilla.org/firefox/', isFile : true },
];
function testMapped(aPattern)
{
	assertMapped(aPattern.uri, aPattern.isFile);
}

function testNotMapped()
{
	assertNotMapped('about:config'); // not supported
}

function testXMLHttpRequest()
{
	assertMappedXMLHttpRequest('http://www.example.com/');
}

function testImageRequest()
{
	assertMappedImageRequest('http://www.example.jp/test.jpg');
}

function testRedirectedSubmission()
{
	assertRedirectedSubmission();
}
