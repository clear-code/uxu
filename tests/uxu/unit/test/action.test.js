var topDir = baseURL+'../../../../';

var actionModule;
var win;

function setUp()
{
	actionModule = {};
	utils.include(topDir+'content/uxu/test/action.js', actionModule);
	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/action.html'));
	yield 600;
}

function tearDown()
{
	yield Do(utils.loadURI('about:blank'));
}

/* internal */

test_isFullZoom.tearDown = function() {
	utils.clearPref('browser.zoom.full');
};
function test_isFullZoom()
{
	if (utils.checkAppVersion('3.0') < 0) {
		assert.isFalse(actionModule.isFullZoom());
	}
	else {
		utils.setPref('browser.zoom.full', false);
		assert.isFalse(actionModule.isFullZoom());
		utils.setPref('browser.zoom.full', true);
		assert.isTrue(actionModule.isFullZoom());
		utils.setPref('browser.zoom.full', false);
		assert.isFalse(actionModule.isFullZoom());
	}
}

test_getZoom.shouldSkip = utils.checkAppVersion('3.0') < 0;
test_getZoom.setUp = function() {
	utils.setPref('browser.zoom.full', true);
	yield Do(utils.setUpTestWindow('about:'));
	win = utils.getTestWindow();
};
test_getZoom.tearDown = function() {
	win.FullZoom.reset();
	win = null;
	utils.tearDownTestWindow();
};
function test_getZoom()
{
	var zoom = utils.getPref('toolkit.zoomManager.zoomValues').split(',').map(parseFloat);
	var index = zoom.indexOf(1);

	win.FullZoom.reset();
	win.FullZoom.enlarge();
	win.FullZoom.enlarge();
	assert.equals(
		Math.floor(zoom[index+2] * 100),
		Math.floor(actionModule.getZoom(win.content) * 100)
	);

	win.FullZoom.reset();
	win.FullZoom.reduce();
	win.FullZoom.reduce();
	assert.equals(
		Math.floor(zoom[index-2] * 100),
		Math.floor(actionModule.getZoom(win.content) * 100)
	);
}

/* public */

function test_fireMouseEvent()
{
}

function test_fireMouseEventOnElement()
{
}

function test_fireKeyEventOnElement()
{
}

function test_inputTextToField()
{
}

function test_getElementFromScreenPoint()
{
}

function test_getWindowFromScreenPoint()
{
}

function test_fireXULCommandEvent()
{
}

function test_fireXULCommandEventOnElement()
{
}
