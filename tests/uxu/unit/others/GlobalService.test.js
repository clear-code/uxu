utils.include({ url : '../../../../components/GlobalService.js', allowOverrideConstants : true });

var service;

function setUp()
{
	service = new GlobalService();
}

function tearDown()
{
}

function testFoo()
{
	assert.isTrue(true);
}
