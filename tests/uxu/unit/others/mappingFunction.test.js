var parallel = false;
utils.include('./mapping.inc.js');

var mapping = function(aURI) {
		return aURI.spec
				.replace(/^.*localhost.*\/notfound.*$/, 'http://localhost:4445/html.html')
				.replace(/^.*google.*$/, baseURL+'../../fixtures/html.html')
				.replace(/^.*www.example.jp.*\.jpg$/, baseURL+'../../../../skin/classic/uxu/bomb.png')
				.replace(/^.*\/submission\/.*/, 'http://localhost:4445/redirect/match/hash.txt');
	};

function testMapping()
{
	assertMapped('http://localhost:4445/notfound.html', false);
	assertNotMapped('about:blank');
	// http://www.example.com/ is redirected to the following URL
	assertNotMapped('http://www.iana.org/domains/reserved');
	assertNotMapped('about:blank');
	assertMapped('http://www.google.com/', true);

	assertMappedXMLHttpRequest('http://www.google.com/');
	assertMappedImageRequest('http://www.example.jp/test.jpg');

	assertRedirectedSubmission();
}

