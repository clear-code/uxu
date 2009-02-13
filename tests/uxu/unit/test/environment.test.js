function setUp()
{
	yield Do(utils.setUpTestWindow());
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

function test_addTab()
{
	var tabs = gBrowser.mTabs;
	assert.equals(1, tabs.length);

	yield Do(utils.addTab('about:'));
	assert.equals(2, tabs.length);
	assert.notEquals(tabs[1], gBrowser.selectedTab);
	assert.equals('about:', tabs[1].linkedBrowser.currentURI.spec);
	gBrowser.removeTab(tabs[1]);

	yield Do(utils.addTab('../../res/frameTest.html?'+Date.now(), { selected : true }));
	assert.equals(2, tabs.length);
	assert.equals(tabs[1], gBrowser.selectedTab);
	assert.contains('/res/frameTest.html', tabs[1].linkedBrowser.currentURI.spec);
	assert.equals(3, content.frames.length);
	assert.equals('about:logo', content.frames[0].location.href);
	assert.equals('about:logo', content.frames[1].location.href);
	assert.contains('/links.html', content.frames[2].location.href);
	assert.notEquals(0, content.frames[2].document.links.length);
	gBrowser.removeTab(tabs[1]);

	yield Do(utils.addTab('../../res/frameTestInline.html?'+Date.now(), { selected : true }));
	assert.equals(2, tabs.length);
	assert.contains('/res/frameTestInline.html', tabs[1].linkedBrowser.currentURI.spec);
	assert.equals(2, content.frames.length);
	assert.equals('about:logo', content.frames[0].location.href);
	assert.contains('/links.html', content.frames[1].location.href);
	assert.notEquals(0, content.frames[1].document.links.length);
	gBrowser.removeTab(tabs[1]);
}

function test_loadURI()
{
	yield Do(utils.loadURI('about:'));
	assert.equals('about:', content.location.href);

	yield Do(utils.loadURI('../../res/frameTest.html?'+Date.now()));
	assert.contains('/res/frameTest.html', content.location.href);
	assert.equals(3, content.frames.length);
	assert.equals('about:logo', content.frames[0].location.href);
	assert.equals('about:logo', content.frames[1].location.href);
	assert.contains('/links.html', content.frames[2].location.href);
	assert.notEquals(0, content.frames[2].document.links.length);

	yield Do(utils.loadURI('../../res/frameTestInline.html?'+Date.now()));
	assert.contains('/res/frameTestInline.html', content.location.href);
	assert.equals(2, content.frames.length);
	assert.equals('about:logo', content.frames[0].location.href);
	assert.contains('/links.html', content.frames[1].location.href);
	assert.notEquals(0, content.frames[1].document.links.length);
}

function test_include()
{
	var namespace = {};
	utils.include('../../res/test.js', namespace, 'UTF-8');
	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);
}
