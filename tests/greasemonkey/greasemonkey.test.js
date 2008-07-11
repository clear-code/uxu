var description = 'Greasemonkeyスクリプトのテスト';
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

testGetDocumentTitleAndURI.description = 'スクリプト内の関数のテスト1';
function testGetDocumentTitleAndURI() {
	assert.equals(
		'ClearCode Inc.\nhttp://www.clear-code.com/',
		sandbox.getDocumentTitleAndURI()
	);
}

