var description = 'Sandboxを使用したGreasemonkeyスクリプトのテスト';
var isAsync = true;


var page   = 'index.html';
var script = 'greasemonkey.user.js';

var sandbox;

function setUp() {
	yield Do(greasemonkey.load(page));
	sandbox = greasemonkey.loadScript(script);
}

function tearDown() {
	yield Do(greasemonkey.unload());
}

testNormalFunction.description = 'GM関数にアクセスしない例';
function testNormalFunction() {
	assert.equals(
		'ClearCode Inc.\n'+baseURL+'index.html',
		sandbox.getDocumentTitleAndURI()
	);
}

testGMFunctionAccess.description = 'GM関数にアクセスする例';
function testGMFunctionAccess() {
	var listener = {
			key   : null,
			value : null,
			onGM_setValueCall : function(aEvent) {
				this.key = aEvent.key;
				this.value = aEvent.value;
			}
		};
	greasemonkey.addListener(listener);

	sandbox.setAndGetValue();
	assert.equals('testKey', listener.key);
	assert.equals('testValue', listener.value);
}

testGMFunctionResult.description = 'GM関数にアクセスした結果を捕捉する例';
function testGMFunctionResult() {
	var value = sandbox.setAndGetValue();
	assert.equals(
		'testValue',
		value
	);
}

testGMXMLHttpRequest.description = 'GM_xmlhttpRequestを使った関数のテストの例';
function testGMXMLHttpRequest() {
	assert.isNull(sandbox.pageTitle);
	yield Do(greasemonkey.doAndWaitLoad(function() {
			sandbox.getPageTitle(utils.fixupIncompleteURI("service.html"));
		}));
	assert.equals('サービス - クリアコード', sandbox.pageTitle);
}

