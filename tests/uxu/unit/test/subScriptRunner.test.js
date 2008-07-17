function setUp()
{
}

function tearDown()
{
}

testLoad.description = 'スクリプトの中で定義された変数や関数を取り出す';
function testLoad()
{
	var env = {
			_subScript : [
				'var a = true;',
				'this.b = true;',
				'function c() { return true; }'
			].join('\n')
		};
	var loader = Cc['@mozilla.org/moz/jssubscript-loader;1']
			.getService(Ci.mozIJSSubScriptLoader);
	loader.loadSubScript(
		baseURL + '../../../../content/uxu/lib/subScriptRunner.js',
		env
	);
	assert.isTrue(env.a);
	assert.isTrue(env.b);
	assert.isFunction(env.c);
}

