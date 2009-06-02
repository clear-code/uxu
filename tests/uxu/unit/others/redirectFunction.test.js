utils.include('./redirect.inc.js');

var redirect = function(aURI) {
		return aURI.spec
				.replace(/^.*google.*$/, baseURL+'../../fixtures/html.html')
				.replace(/^.*www.example.jp.*\.jpg$/, baseURL+'../../../../skin/classic/uxu/bomb.png');
	};

function testRedirect()
{
	yield Do(assertNotRedirected('http://www.example.com/'));
	yield Do(assertNotRedirected('about:blank'));
	yield Do(assertRedirected('http://www.google.com/'));

	yield Do(assertRedirectedXMLHttpRequest('http://www.google.com/'));
	yield Do(assertRedirectedImageRequest('http://www.example.jp/test.jpg'));
}

