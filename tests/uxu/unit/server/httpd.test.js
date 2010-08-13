var shouldSkip = utils.checkPlatformVersion('1.9') < 0;

var topDir = baseURL+'../../../../';

var HTTPServer = utils.import(topDir+'modules/server/httpd.js', {}).HTTPServer;
var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

var htaccess;

function assertModified(aStatus, aStatusText, aURI, aPath)
{
	var result = HTTPServer.prototype.processRequestByHtaccess(aPath, htaccess);
	assert.notNull(result);
	assert.equals(
		{ status     : aStatus,
		  statusText : aStatusText, 
		  uri        : aURI },
		result
	);
}

function assertNotModified(aPath)
{
	assert.isNull(utilsModule.processRequestByHtaccess(aPath, htaccess));
}

test_processRequestByHtaccess.setUp = function() {
	htaccess = utils.readFrom(baseURL+'../../fixtures/redirect/.htaccess');
};
function test_processRequestByHtaccess()
{
	assertModified(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/sub/permanent/file');
	assertModified(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/sub/temp/file');
	assertModified(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/sub/seeother/file');
	assertModified(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/sub/permanent2/file');
	assertModified(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/sub/temp2/file');
	assertModified(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/match/file');
	assertNotModified('/not_redirect/match/file');

	assertModified(200, 'OK', '/file',
	               '/redirect/rewrite/file');
	assertModified(200, 'OK', 'http://localhost:4445/file',
	               '/redirect/rewrite_absolute/file');
	assertModified(200, 'OK', 'http://localhost:4445/file',
	               '/redirect/rewrite_NoCase/file');
	assertModified(200, 'OK', 'http://localhost:4445/file',
	               '/redirect/rewrite_nocase/file');
	assertModified(401, 'Gone', null,
	               '/redirect/rewrite_401/file');
	assertModified(403, 'Forbidden', null,
	               '/redirect/rewrite_403/file');
	assertModified(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect/file');
	assertModified(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect301/file');
	assertModified(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect302/file');
	assertModified(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect303/file');
	assertModified(200, 'OK', '/redirect/rewrite_next/file',
	               '/redirect/rewrite_last/file');
	assertModified(200, 'OK', '/redirect/rewrite_final/file',
	               '/redirect/rewrite_next/file');
	assertNotModified('/redirect/not_rewrite/match/file');

	htaccess = '';
	assertNotModified('/redirect/sub/permanent/file');
	assertNotModified('/redirect/sub/temp/file');
	assertNotModified('/redirect/sub/seeother/file');
	assertNotModified('/redirect/sub/permanent2/file');
	assertNotModified('/redirect/sub/temp2/file');
	assertNotModified('/redirect/match/file');
	assertNotModified('/redirect/rewrite/file');
	assertNotModified('/redirect/rewrite_absolute/file');
	assertNotModified('/redirect/rewrite_redirect/file');
}


testRedirect.parameters = [
	'http://localhost:4445/redirect/sub/permanent/hash.txt',
	'http://localhost:4445/redirect/sub/temp/hash.txt',
	'http://localhost:4445/redirect/sub/seeother/hash.txt',
	'http://localhost:4445/redirect/sub/permanent2/hash.txt',
	'http://localhost:4445/redirect/sub/temp2/hash.txt',
	'http://localhost:4445/redirect/match/hash.txt'
];
testRedirect.setUp = setUpHttpServer;
testRedirect.tearDown = tearDownHttpServer;
function testRedirect(aURI)
{
	utils.loadURI(aURI);
	assert.equals('http://localhost:4445/hash.txt', content.location.href);
	assert.equals('hash\n', content.document.body.textContent);
}

testRewrite.parameters = [
	'http://localhost:4445/redirect/rewrite/hash.txt',
	'http://localhost:4445/redirect/rewrite_absolute/hash.txt'
];
testRewrite.setUp = setUpHttpServer;
testRewrite.tearDown = tearDownHttpServer;
function testRewrite(aURI)
{
	utils.loadURI(aURI);
	assert.equals(aURI, content.location.href);
	assert.equals('hash\n', content.document.body.textContent);
}


