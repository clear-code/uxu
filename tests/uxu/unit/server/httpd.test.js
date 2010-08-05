var shouldSkip = utils.checkPlatformVersion('1.9') < 0;

function setUp()
{
	utils.setUpHttpServer(4445, baseURL+'../../fixtures/');
	utils.wait(300);
	utils.loadURI('about:blank');
}

function tearDown()
{
	utils.tearDownAllHttpServers();
}


testRedirect.parameters = [
	'http://localhost:4445/redirect/sub/permanent/hash.txt',
	'http://localhost:4445/redirect/sub/temp/hash.txt',
	'http://localhost:4445/redirect/sub/seeother/hash.txt',
	'http://localhost:4445/redirect/sub/permanent2/hash.txt',
	'http://localhost:4445/redirect/sub/temp2/hash.txt',
	'http://localhost:4445/redirect/match/hash.txt'
];
function testRedirect(aURI)
{
	utils.loadURI(aURI);
	assert.equals('http://localhost:4445/hash.txt', content.location.href);
}


