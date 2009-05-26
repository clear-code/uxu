var port = 4445;

function setUp()
{
	yield Do(utils.setUpHttpServer(port, '../uxu/fixtures/'));
}

function tearDown()
{
//	yield Do(utils.tearDownHttpServer());
}

function test_server()
{
	yield Do(utils.loadURI('http://localhost:'+port+'/html.html'));
	assert.equals('test', content.document.title);
}

