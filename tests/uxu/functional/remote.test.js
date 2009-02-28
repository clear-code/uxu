var description = '「特定のプロファイルを使用して実行するテスト」のテスト';
var profile = '../fixtures/profile/';
//var options = ['-console', '-jsconsole'];

function setUp()
{
}

function tearDown()
{
}

function testSuccess()
{
	var value = utils.getPref('uxu.test.pref.value.boolean');
	assert.isNotNull(value);
	assert.isTrue(value);
}

function testFail()
{
	assert.raises('AssertionFailed', function() {
		assert.isTrue(false);
	});
}

function testError()
{
	try {
		undefinedFunction();
		assert.isTrue(false);
	}
	catch(e) {
		assert.isTrue(true);
	}
}
