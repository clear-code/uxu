var description = '「特定のプロファイルを使用して実行するテスト」のテスト';
var profile = '../fixtures/profile/';
//var options = ['-console', '-jsconsole'];

function setUp()
{
	yield 500;
}

function tearDown()
{
}

function testSuccess()
{
	var value = utils.getPref('uxu.test.pref.value.boolean');
	yield 500;
	assert.isNotNull(value);
	yield 500;
	assert.isTrue(value);
}

function testFail()
{
	yield 500;
	assert.raises('AssertionFailed', function() {
		assert.isTrue(false);
	});
	yield 500;
}

function testError()
{
	yield 500;
	try {
		undefinedFunction();
		assert.isTrue(false);
	}
	catch(e) {
		assert.isTrue(true);
	}
	yield 500;
}
