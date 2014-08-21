function setUp()
{
}

function tearDown()
{
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
test_contentFrames.setUp = function() {
	yield utils.setUpTestWindow();
}
test_contentFrames.tearDown = function() {
	yield utils.tearDownTestWindow();
}
function test_contentFrames()
{
	var win = utils.getTestWindow();
	assert.isNotNull(win);
	assert.equals(win.gBrowser, utils.gBrowser);
	assert.equals(win.gBrowser, utils.getBrowser());
	assert.equals(win.gBrowser.contentWindow, utils.content);
	assert.equals(win.gBrowser.contentWindow, utils.contentWindow);

	yield utils.tearDownTestWindow();

	var frame = document.getElementById('content');
	assert.equals(frame, utils.gBrowser);
	assert.equals(frame, utils.getBrowser());
	assert.equals(frame.contentWindow, utils.content);
	assert.equals(frame.contentWindow, utils.contentWindow);
}

test$.setUp = function()
{
	utils.tearDownTestWindow();
	utils.loadURI('../../fixtures/html.html');
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

	utils.setUpTestWindow();
	expected = utils.getTestWindow().document.getElementById('content');
	assert.equals(expected, $('content'));
}

if (utils.product != 'Firefox') test_addTab.priority = 'never';
test_addTab.setUp = utils.setUpTestWindow;
test_addTab.tearDown = utils.tearDownTestWindow;
function test_addTab()
{
	var tabs = gBrowser.visibleTabs || Array.slice(gBrowser.mTabContainer.childNodes);
	assert.equals(1, tabs.length);

	utils.addTab('about:');
	tabs = gBrowser.visibleTabs || Array.slice(gBrowser.mTabContainer.childNodes);
	assert.equals(2, tabs.length);
	assert.notEquals(tabs[1], gBrowser.selectedTab);
	assert.equals('about:', tabs[1].linkedBrowser.currentURI.spec);
	gBrowser.removeTab(tabs[1]);

	utils.addTab('../../fixtures/frameTest.html?'+Date.now(), { selected : true });
	tabs = gBrowser.visibleTabs || Array.slice(gBrowser.mTabContainer.childNodes);
	assert.equals(2, tabs.length);
	assert.equals(tabs[1], gBrowser.selectedTab);
	assert.contains('/fixtures/frameTest.html', tabs[1].linkedBrowser.currentURI.spec);
	assert.equals(3, content.frames.length);
	assert.contains('/html.html', content.frames[0].location.href);
	assert.contains('/ascii.txt', content.frames[1].location.href);
	assert.contains('/links.html', content.frames[2].location.href);
	assert.notEquals(0, content.frames[2].document.links.length);
	gBrowser.removeTab(tabs[1]);

	utils.addTab('../../fixtures/frameTestInline.html?'+Date.now(), { selected : true });
	tabs = gBrowser.visibleTabs || Array.slice(gBrowser.mTabContainer.childNodes);
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
	utils.loadURI('about:');
	assert.equals('about:', content.location.href);

	utils.loadURI('../../fixtures/frameTest.html?'+Date.now());
	assert.contains('/fixtures/frameTest.html', content.location.href);
	assert.equals(3, content.frames.length);
	assert.contains('/html.html', content.frames[0].location.href);
	assert.contains('/ascii.txt', content.frames[1].location.href);
	assert.contains('/links.html', content.frames[2].location.href);
	assert.notEquals(0, content.frames[2].document.links.length);

	utils.loadURI('../../fixtures/frameTestInline.html?'+Date.now());
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
test_setUpTearDownTestWindow.tearDown = function() {
	utils.tearDownTestWindow(); // teadown it even if this test is failed.
};
function test_setUpTearDownTestWindow()
{
	utils.setUpTestWindow({ width : 350, height : 292, x : 129, y : 192 });
	yield 300;
	var win = utils.getTestWindow();
	assert.isNotNull(win);
	assert.equals(350, win.outerWidth);
	assert.equals(292, win.outerHeight);
	assert.equals(129, win.screenX);
	assert.equals(192, win.screenY);
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


var watcherParameters = {
	default          : { targets  : null,
	                     expected : ['load', 'domwindowclosed'] },
	domwindowopened  : { targets  : 'domwindowopened',
	                     expected : ['domwindowopened'] },
	DOMContentLoaded : { targets  : 'DOMContentLoaded',
	                     expected : ['DOMContentLoaded'] },
	load             : { targets  : 'load',
	                     expected : ['load'] },
	domwindowclosed  : { targets  : 'domwindowclosed',
	                     expected : ['domwindowclosed'] },
	all              : { targets  : ['domwindowopened', 'DOMContentLoaded', 'load',
	                                 'domwindowclosed'],
	                     expected : ['domwindowopened', 'DOMContentLoaded', 'load',
	                                 'domwindowclosed'] }
};
var watcher;

test_addRemoveWindowWatcher_function.tearDown = function() {
	if (watcher)
		utils.removeWindowWatcher(watcher);
}
test_addRemoveWindowWatcher_function.parameters = watcherParameters;
function test_addRemoveWindowWatcher_function(aParameter)
{
	watcher = function(aWindow, aEventType) {
		results.push([aWindow, aEventType]);
	};
	var results = [];
	utils.addWindowWatcher(watcher, aParameter.targets);
	yield utils.setUpTestWindow();
	yield 200;
	var win = utils.getTestWindow();
	yield 200;
	var expected = aParameter.expected.map(function(aEventType) {
			return [win, aEventType];
		}).join('\n');
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));
	utils.removeWindowWatcher(watcher);

	yield utils.setUpTestWindow();
	yield 200;
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));

	watcher = null;
}

test_addRemoveWindowWatcher_eventListener.tearDown = function() {
	if (watcher)
		utils.removeWindowWatcher(watcher);
}
test_addRemoveWindowWatcher_eventListener.parameters = watcherParameters;
function test_addRemoveWindowWatcher_eventListener(aParameter)
{
	watcher = {
		handleEvent : function(aEvent) {
			results.push([aEvent.target, aEvent.type]);
		}
	};
	var results = [];
	utils.addWindowWatcher(watcher, aParameter.targets);
	yield utils.setUpTestWindow();
	yield 200;
	var win = utils.getTestWindow();
	yield 200;
	var expected = aParameter.expected.map(function(aEventType) {
			if (aEventType.indexOf('domwindow') == 0)
				return [win, aEventType];
			else
				return [win.document, aEventType];
		}).join('\n');
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));
	utils.removeWindowWatcher(watcher);

	yield utils.setUpTestWindow();
	yield 200;
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));

	watcher = null;
}

test_addRemoveWindowWatcher_observer.tearDown = function() {
	if (watcher)
		utils.removeWindowWatcher(watcher);
}
test_addRemoveWindowWatcher_observer.parameters = watcherParameters;
function test_addRemoveWindowWatcher_observer(aParameter)
{
	watcher = {
		observe : function(aSubject, aTopic, aData) {
			results.push([aSubject, aTopic]);
		}
	};
	var results = [];
	utils.addWindowWatcher(watcher, aParameter.targets);
	yield utils.setUpTestWindow();
	yield 200;
	var win = utils.getTestWindow();
	yield 200;
	var expected = aParameter.expected.map(function(aEventType) {
			return [win, aEventType];
		}).join('\n');
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));
	utils.removeWindowWatcher(watcher);

	yield utils.setUpTestWindow();
	yield 200;
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));

	watcher = null;
}

test_addRemoveWindowWatcher_object.tearDown = function() {
	if (watcher)
		utils.removeWindowWatcher(watcher);
}
test_addRemoveWindowWatcher_object.parameters = watcherParameters;
function test_addRemoveWindowWatcher_object(aParameter)
{
	watcher = {
		ondomwindowopened : function(aWindow) {
			results.push([aWindow, 'domwindowopened']);
		},
		onDOMContentLoaded : function(aWindow) {
			results.push([aWindow, 'DOMContentLoaded']);
		},
		onload : function(aWindow) {
			results.push([aWindow, 'load']);
		},
		ondomwindowclosed : function(aWindow) {
			results.push([aWindow, 'domwindowclosed']);
		}
	};
	var results = [];
	utils.addWindowWatcher(watcher, aParameter.targets);
	yield utils.setUpTestWindow();
	yield 200;
	var win = utils.getTestWindow();
	yield 200;
	var expected = aParameter.expected.map(function(aEventType) {
			return [win, aEventType];
		}).join('\n');
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));
	utils.removeWindowWatcher(watcher);

	yield utils.setUpTestWindow();
	yield 200;
	yield utils.tearDownTestWindow();
	yield 200;
	assert.equals(expected, results.join('\n'));

	watcher = null;
}


function test_JsMockitoStyleMock()
{
	var mock = mockFunction('mock function');
	when(mock)(10, 100).thenReturn(1000);
	assert.equals(1000, mock(10, 100));
}

function test_JSMockStyleMock()
{
	var controller = MockControl();
	var mock = controller.createMock();
	mock.expects().myMethod(10, 100).andReturn(1000);
	assert.equals(1000, mock.myMethod(10, 100));
}
