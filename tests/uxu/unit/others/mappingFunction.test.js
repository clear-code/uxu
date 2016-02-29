var parallel = false;
utils.include('./mapping.inc.js');

var mapping = function(aURI) {
		return aURI.spec
				.replace(/^.*localhost.*\/notfound.*$/, 'http://localhost:4445/html.html')
				.replace(/^.*google.*$/, baseURL+'../../fixtures/html.html')
				.replace(/^.*www.example.jp.*\.jpg$/, baseURL+'../../../../skin/classic/uxu/bomb.png')
				.replace(/^.*\/submission\/.*/, 'http://localhost:4445/redirect/match/hash.txt');
	};

testMapped.parameters = [
	{ uri : 'http://localhost:4445/notfound.html' },
	{ uri : 'http://www.google.com/', isFile : true },
];
function testMapped(aParameter)
{
	yield assertMapped(aParameter.uri, aParameter.isFile);
}

function testNotMapped()
{
	// http://www.example.com/ is redirected to the following URL
	yield assertNotMapped('http://www.iana.org/domains/reserved');
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
