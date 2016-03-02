var description = 'Remote test with specific profile';
var profile = '../fixtures/profile/';
//var options = ['-console', '-jsconsole'];

function setUp()
{
	yield 50;
}

function tearDown()
{
}

function testSuccess()
{
	var value = utils.getPref('uxu.test.pref.value.boolean');
	yield 50;
	assert.isNotNull(value);
	yield 50;
	assert.isTrue(value);
}

function testFail()
{
	yield 50;
	assert.raises('AssertionFailed', function() {
		assert.isTrue(false);
	});
	yield 50;
}

function testError()
{
	yield 50;
	try {
		undefinedFunction();
		assert.isTrue(false);
	}
	catch(e) {
		assert.isTrue(true);
	}
	yield 50;
}
