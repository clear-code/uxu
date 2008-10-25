var description = '「特定のプロファイルを使用して実行するテスト」のテスト';
var profile = '../res/profile/';

function setUp()
{
}

function tearDown()
{
}

function testProfilePref()
{
	var value = utils.getPref('uxu.test.pref.value.boolean');
	assert.isNotNull(value);
	assert.isTrue(value);
}
