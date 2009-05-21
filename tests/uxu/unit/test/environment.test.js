function setUp()
{
	yield utils.setUpTestWindow();
}

function tearDown()
{
	utils.tearDownTestWindow();
}

function test_properties()
{
	function assertProperty(aName)
	{
		eval('assert.equals(utils.'+aName+', '+aName+');');
	}
	assertProperty('gBrowser');
	assertProperty('getBrowser');
	assertProperty('content');
	assertProperty('contentWindow');
}

if (utils.product != 'Firefox') test_contentFrames.priority = 'never';
function test_contentFrames()
{
	var win = utils.getTestWindow();
	assert.isNotNull(win);
	assert.equals(win.gBrowser, utils.gBrowser);
	assert.equals(win.gBrowser, utils.getBrowser());
	assert.equals(win.gBrowser.contentWindow, utils.content);
	assert.equals(win.gBrowser.contentWindow, utils.contentWindow);

	utils.tearDownTestWindow();

	var frame = document.getElementById('content');
	assert.equals(frame, utils.gBrowser);
	assert.equals(frame, utils.getBrowser());
	assert.equals(frame.contentWindow, utils.content);
	assert.equals(frame.contentWindow, utils.contentWindow);
}

test$.setUp = function()
{
	utils.tearDownTestWindow();
	yield Do(utils.loadURI('../../fixtures/html.html'));
}
test$.tearDown = function()
{
	utils.tearDownTestWindow();
}
function test$()
{
	var expected = content.document.getElementById('paragraph1');
	assert.isNotNull(expected);
	assert.equals(expected, $('paragraph1'));
	assert.equals(expected, $(expected));
	assert.equals(expected, $('paragraph1', content));
	assert.equals(expected, $(expected, content));

	var node = $('content', document);
	expected = document.getElementById('content');
	assert.equals(expected, node);
	assert.equals(expected, $(node));
	assert.equals(expected, $(node, document));

	yield Do(utils.setUpTestWindow());
	expected = utils.getTestWindow().document.getElementById('content');
	assert.equals(expected, $('content'));
}

if (utils.product != 'Firefox') test_addTab.priority = 'never';
function test_addTab()
{
	var tabs = gBrowser.mTabs;
	assert.equals(1, tabs.length);

	yield Do(utils.addTab('about:'));
	assert.equals(2, tabs.length);
	assert.notEquals(tabs[1], gBrowser.selectedTab);
	assert.equals('about:', tabs[1].linkedBrowser.currentURI.spec);
	gBrowser.removeTab(tabs[1]);

	yield Do(utils.addTab('../../fixtures/frameTest.html?'+Date.now(), { selected : true }));
	assert.equals(2, tabs.length);
	assert.equals(tabs[1], gBrowser.selectedTab);
	assert.contains('/fixtures/frameTest.html', tabs[1].linkedBrowser.currentURI.spec);
	assert.equals(3, content.frames.length);
	assert.contains('/html.html', content.frames[0].location.href);
	assert.contains('/ascii.txt', content.frames[1].location.href);
	assert.contains('/links.html', content.frames[2].location.href);
	assert.notEquals(0, content.frames[2].document.links.length);
	gBrowser.removeTab(tabs[1]);

	yield Do(utils.addTab('../../fixtures/frameTestInline.html?'+Date.now(), { selected : true }));
	assert.equals(2, tabs.length);
	assert.contains('/fixtures/frameTestInline.html', tabs[1].linkedBrowser.currentURI.spec);
	assert.equals(2, content.frames.length);
	assert.contains('/html.html', content.frames[0].location.href);
	assert.contains('/links.html', content.frames[1].location.href);
	assert.notEquals(0, content.frames[1].document.links.length);
	gBrowser.removeTab(tabs[1]);
}

test_loadURI.setUp = function()
{
	utils.tearDownTestWindow();
	if (utils.product != 'Firefox') {
		utils.setPref('network.protocol-handler.expose.file', true);
		utils.setPref('network.protocol-handler.expose.http', true);
	}
}
test_loadURI.tearDown = function()
{
	if (utils.product != 'Firefox') {
		utils.clearPref('network.protocol-handler.expose.file');
		utils.clearPref('network.protocol-handler.expose.http');
	}
}
function test_loadURI()
{
	yield Do(utils.loadURI('about:'));
	assert.equals('about:', content.location.href);

	yield Do(utils.loadURI('../../fixtures/frameTest.html?'+Date.now()));
	assert.contains('/fixtures/frameTest.html', content.location.href);
	assert.equals(3, content.frames.length);
	assert.contains('/html.html', content.frames[0].location.href);
	assert.contains('/ascii.txt', content.frames[1].location.href);
	assert.contains('/links.html', content.frames[2].location.href);
	assert.notEquals(0, content.frames[2].document.links.length);

	yield Do(utils.loadURI('../../fixtures/frameTestInline.html?'+Date.now()));
	assert.contains('/fixtures/frameTestInline.html', content.location.href);
	assert.equals(2, content.frames.length);
	assert.contains('/html.html', content.frames[0].location.href);
	assert.contains('/links.html', content.frames[1].location.href);
	assert.notEquals(0, content.frames[1].document.links.length);
}

function test_include()
{
	var namespace = {};
	utils.include('../../fixtures/test.js', namespace, 'UTF-8');
	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);
}

function test_setAndGetClipBoard()
{
	var random = Math.random() * 65000;
	utils.setClipBoard(random);
	assert.equals(random, utils.getClipBoard());

	random = Math.random() * 65000;
	utils.setClipBoard(random);
	assert.equals(random, utils.getClipBoard());
}
test_setUpTearDownTestWindow.setUp = function() {
	utils.tearDownTestWindow();
	assert.isNull(utils.getTestWindow());
};
function test_setUpTearDownTestWindow()
{
	yield Do(utils.setUpTestWindow({ width : 290, height : 292, x : 29, y : 92 }));
	yield 300;
	var win = utils.getTestWindow();
	assert.isNotNull(win);
	assert.equals(290, win.outerWidth);
	assert.equals(292, win.outerHeight);
	assert.equals(29, win.screenX);
	assert.equals(92, win.screenY);
	utils.tearDownTestWindow();
	yield 100;
	assert.isTrue(win.closed);
}


var globalVariable1 = 'global1';
var localVariable1 = 'global2';

function test_parseTemplate()
{
	var localVariable1 = 'local';
	assert.equals(
		'global1global2',
		utils.parseTemplate('<%= globalVariable1 %><%= localVariable1 %>')
	);
}

