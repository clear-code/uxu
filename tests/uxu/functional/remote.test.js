var description = '「特定のプロファイルを使用して実行するテスト」のテスト';
var profile = '../res/profile/';
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
	assert.isTrue(false);
}

function testError()
{
	undefinedFunction();
}
