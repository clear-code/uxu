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

testMapped.parameters = [
	{ uri : 'http://localhost:4445/notfound.html' },
	{ uri : 'http://www.example.com/' },
	{ uri : 'http://www.example.jp/test/foobar' },
	{ uri : 'https://addons.mozilla.org/firefox/', isFile : true },
];
function testMapped(aParameter)
{
	yield assertMapped(aParameter.uri, aParameter.isFile);
}

function testNotMapped()
{
	yield assertNotMapped('about:config'); // not supported
}

function testXMLHttpRequest()
{
	yield assertMappedXMLHttpRequest('http://www.example.com/');
}

function testImageRequest()
{
	yield assertMappedImageRequest('http://www.example.jp/test.jpg');
}

function testRedirectedSubmission()
{
	yield assertRedirectedSubmission();
}
