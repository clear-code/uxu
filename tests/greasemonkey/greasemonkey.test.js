var description = 'Sandboxを使用したGreasemonkeyスクリプトのテスト';
var isAsync = true;


var page   = 'http://www.clear-code.com/';
var script = 'greasemonkey.user.js';

var sandbox;

function setUp() {
	sandbox = greasemonkey.createSandbox();
	yield Do(sandbox.load(page));
	sandbox.loadScript(script);
}

function tearDown() {
	yield Do(sandbox.unload());
}

testNormalFunction.description = 'GM関数にアクセスしない例';
function testNormalFunction() {
	assert.equals(
		'ClearCode Inc.\nhttp://www.clear-code.com/',
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
	sandbox.addListener(listener);

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
	var listener = {
			details : null,
			onGM_xmlhttpRequestCall : function(aEvent) {
				this.details = aEvent.details;
			},
			onGM_xmlhttpRequestLoad : function(aEvent) {
				this.loaded.value = true;
			},
			loaded : {
				value : false
			}
		};
	sandbox.addListener(listener);

	assert.isNull(sandbox.servicePageTitle);
	sandbox.getServicesPageTitle();
	assert.isNotNull(listener.details);
	yield listener.loaded;
	assert.equals('サービス -ClearCode Inc.', sandbox.servicePageTitle);
}

