var parallel = false;
var targetProduct = 'Firefox';

var topDir = baseURL+'../../../../';

var GreasemonkeyUtils = utils.import(topDir+'modules/test/greasemonkey.js', {}).GreasemonkeyUtils;

var GMUtils;
var lastPageURI;

function loadPage(aURI) {
	aURI = aURI || 'about:blank';
	lastPageURI = aURI+'?'+parseInt(Math.random() * 65000);
	yield utils.loadURI(lastPageURI);
}

function setUp()
{
	utils.setPref('browser.tabs.maxOpenBeforeWarn', 9999);
	utils.setPref('browser.tabs.warnOnClose', false);
	utils.setPref('browser.tabs.warnOnOpen', false);
	utils.setPref('browser.warnOnQuit', false);
	utils.setPref('browser.warnOnRestart', false);

	yield loadPage();
	assert.equals(lastPageURI, content.location.href);
	GMUtils = new GreasemonkeyUtils(utils);
}

function tearDown()
{
	GMUtils.destroy();
	yield Do(loadPage());
	yield Do(GMUtils.close());
}

function test_loadAndUnload()
{
	yield GMUtils.load('about:');
	assert.equals('about:', content.location.href);

	yield GMUtils.unload();
	assert.equals('about:blank', content.location.href);
}


test_openAndClose.tearDown = utils.tearDownTestWindow;
function test_openAndClose()
{
	var window;
	yield GMUtils.open('about:').then(function(aWindow) {
		window = aWindow
	});
	if (utils.checkPlatformVersion('35') < 0) {
		assert.isInstanceOf(Components.interfaces.nsIDOMWindow, window);
		assert.isInstanceOf(Components.interfaces.nsIDOMChromeWindow, window);
	}
	else {
		assert.isInstanceOf(window.Window, window);
		assert.isInstanceOf(window.ChromeWindow, window);
	}
	assert.equals('about:', window.content.location.href);

	yield GMUtils.close();
	assert.isTrue(window.closed);
}

test_getSandbox.setUp = function() {
	yield Do(loadPage('../../fixtures/page_with_script.html'));
}
function test_getSandbox()
{
	var sandbox1 = GMUtils.getSandboxFor(lastPageURI);
	assert.isDefined(sandbox1);
	assert.isDefined(sandbox1.window);
	assert.isDefined(sandbox1.unsafeWindow);
	if (utils.checkPlatformVersion('35') < 0) {
		assert.isInstanceOf(Components.interfaces.nsIDOMWindow, sandbox1.window);
		assert.isInstanceOf(Components.interfaces.nsIDOMWindow, sandbox1.unsafeWindow);
	}
	else {
		assert.isInstanceOf(sandbox1.window.Window, sandbox1.window);
		assert.isInstanceOf(sandbox1.window.Window, sandbox1.unsafeWindow);
	}

	assert.isUndefined(sandbox1.window.PROPERTY_DEFINED_BY_PAGE_SCRIPT);
	assert.isUndefined(Components.utils.evalInSandbox('window.PROPERTY_DEFINED_BY_PAGE_SCRIPT', sandbox1));
	assert.isDefined(Components.utils.evalInSandbox('unsafeWindow.PROPERTY_DEFINED_BY_PAGE_SCRIPT', sandbox1));

	assert.isDefined(sandbox1.document);
	if (utils.checkPlatformVersion('35') < 0) {
		assert.isInstanceOf(Components.interfaces.nsIDOMDocument, sandbox1.document);
	}
	else {
		assert.isInstanceOf(sandbox1.window.Document, sandbox1.document);
	}

	assert.isDefined(sandbox1.XPathResult);

	assert.isFunction(sandbox1.GM_log);
	assert.isFunction(sandbox1.GM_getValue);
	assert.isFunction(sandbox1.GM_setValue);
	assert.isFunction(sandbox1.GM_registerMenuCommand);
	assert.isFunction(sandbox1.GM_xmlhttpRequest);
	assert.isFunction(sandbox1.GM_addStyle);
	assert.isFunction(sandbox1.GM_getResourceURL);
	assert.isFunction(sandbox1.GM_getResourceText);
	assert.isFunction(sandbox1.GM_openInTab);
	assert.isDefined(sandbox1.console);
	assert.isFunction(sandbox1.console.log);

	var sandbox2 = GMUtils.getSandboxFor(lastPageURI);
	assert.same(sandbox1, sandbox2);

	var sandbox3 = GMUtils.getSandBoxFor(lastPageURI);
	assert.same(sandbox1, sandbox3);

	var sandbox4 = GMUtils.getSandboxFor('about:mozilla');
	assert.notSame(sandbox1, sandbox4);

	var sandbox5 = GMUtils.getSandBoxFor('about:mozilla');
	assert.notSame(sandbox1, sandbox5);
	assert.same(sandbox4, sandbox5);
}

function test_loadScript()
{
	var url = topDir+'tests/samples/greasemonkey/greasemonkey.user.js';
	var sandbox1 = GMUtils.loadScript(url);
	assert.isTrue(sandbox1);

	var sandbox2 = GMUtils.getSandboxFor(url);
	assert.equals(sandbox1, sandbox2);

	assert.isFunction(sandbox1.getDocumentTitleAndURI);
}



function test_GM_log()
{
	assert.equals([], GMUtils.logs);
	sandbox = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_log.user.js');
	assert.equals([navigator.userAgent.toString()], GMUtils.logs);
}

function test_GM_getValue()
{
	assert.isUndefined(GMUtils.GM_getValue('nonexistence'));
	assert.equals(100, GMUtils.GM_getValue('nonexistence', 100));

	var sandboxGet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_getValue.user.js');
	assert.isUndefined(sandboxGet.userAgent);
	assert.equals(100, sandboxGet.nonExistance);
}

function test_GM_setValue()
{
	yield Do(loadPage());
	var sandboxSet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_setValue.user.js');
	var sandboxGet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_getValue.user.js');
	assert.equals(navigator.userAgent, sandboxGet.userAgent);
}

function test_GM_deleteValue()
{
	var sandboxGet;
	yield Do(loadPage());
	GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_setValue.user.js');
	sandboxGet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_getValue.user.js');
	assert.equals(navigator.userAgent, sandboxGet.userAgent);
	GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_deleteValue.user.js');
	sandboxGet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_getValue.user.js');
	assert.isUndefined(sandboxGet.userAgent);
}

function test_GM_listValues()
{
	yield Do(loadPage());
	var sandbox = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_listValues.user.js');
	assert.equals(['userAgent', 'foo', 'bar'], sandbox.values);
}

function test_GM_registerMenuCommand()
{
	var sandbox = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_registerMenuCommand.user.js');
	assert.equals(0, sandbox.activeItem);
	assert.equals(2, GMUtils.commands.length);

	var item = GMUtils.commands[0];
	assert.equals('item1', item.getAttribute('label'));
	assert.equals('i', item.getAttribute('accesskey'));
	if (navigator.platform.toLowerCase().indexOf('mac') > -1)
		assert.equals('Command+A', item.getAttribute('acceltext'));
	else
		assert.equals('Ctrl+A', item.getAttribute('acceltext'));
	item.oncommand();
	assert.equals(1, sandbox.activeItem);

	item = GMUtils.commands[1];
	assert.equals('item2', item.getAttribute('label'));
	assert.equals('i', item.getAttribute('accesskey'));
	if (navigator.platform.toLowerCase().indexOf('mac') > -1)
		assert.equals('Control+Shift+B', item.getAttribute('acceltext'));
	else
		assert.equals('Ctrl+Shift+B', item.getAttribute('acceltext'));
	item.oncommand();
	assert.equals(2, sandbox.activeItem);
}

test_GM_xmlhttpRequest.setUp = function() {
	yield utils.setUpHttpServer(4445, topDir+'tests/uxu/fixtures/');
};
test_GM_xmlhttpRequest.tearDown = function() {
	yield utils.tearDownAllHttpServers();
};
function test_GM_xmlhttpRequest()
{
	var sandbox = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_xmlHttpRequest.user.js');
	assert.isFunction(sandbox.loadAsciiFile);
	sandbox.loadAsciiFile();
	yield function() {
		while (!sandbox.data) {
			yield;
		}
	};
	assert.equals('ASCII', sandbox.data);
}

function test_GM_addStyle()
{
	yield Do(GMUtils.load('about:'));
	var body = content.document.body;
	assert.isTrue(body);
	assert.isInstanceOf(content.Node, body);
	var style = content.getComputedStyle(body, null);
	assert.notEquals('red', style.getPropertyValue('color'));
	GMUtils.GM_addStyle(content.document, '* { color: rgb(255, 0, 0) !important; }');
	yield 100;
	style = content.getComputedStyle(body, null);
	assert.equals('rgb(255, 0, 0)', style.getPropertyValue('color'));
}

function test_GM_getResourceText()
{
	var sandbox = GMUtils.loadScript(topDir+'tests/samples/greasemonkey/greasemonkey.user.js');
	var text = sandbox.GM_getResourceText('about');
	assert.notEquals('about:', text);
	assert.equals('<?xml version="1.0" encoding="UTF-8"?>', text.substring(0, 38));
}

function test_GM_getResourceURL()
{
	var url = topDir+'tests/samples/greasemonkey/greasemonkey.user.js';
	var sandbox = GMUtils.loadScript(url);
	var resource = sandbox.GM_getResourceURL('page');
	assert.notEquals('http://www.clear-code.com/', resource);
	assert.equals('data:text/html;base64,', resource.substring(0, 22));
}

test_GM_openInTab.tearDown = utils.tearDownTestWindow;
function test_GM_openInTab()
{
	yield Do(GMUtils.open('about:'));
	var win = utils.getTestWindow();
	var tabs = win.gBrowser.visibleTabs || win.gBrowser.mTabs;
	var count = tabs.length;
	GMUtils.GM_openInTab('about:config');
	yield 200;
	tabs = win.gBrowser.visibleTabs || win.gBrowser.mTabs; // update "tabs", because visibleTabs is not live.
	assert.equals(count+1, tabs.length);
	assert.equals('about:config', tabs[tabs.length-1].linkedBrowser.currentURI.spec);
}


test_listeningEvents.tearDown = utils.tearDownTestWindow;
function test_listeningEvents()
{
	function defaultHandler(aEvent) { this.setResult(aEvent); };
	var listener = {
			results : [],
			get count()
			{
				return this.results.length;
			},
			get lastResult()
			{
				return this.results[this.results.length-1];
			},
			setResult : function(aEvent)
			{
				var result = {};
				for (var i in aEvent)
				{
					result[i] = aEvent[i];
				}
				this.results.push(result);
			},
			clear : function()
			{
				this.results = [];
			},
			onGM_logCall : defaultHandler,
			onGM_getValueCall : defaultHandler,
			onGM_setValueCall : defaultHandler,
			onGM_xmlhttpRequestCall : defaultHandler,
			onGM_xmlhttpRequestBeforeLoad : defaultHandler,
			onGM_xmlhttpRequestLoad : defaultHandler,
			onGM_xmlhttpRequestBeforeError : defaultHandler,
			onGM_xmlhttpRequestError : defaultHandler,
			onGM_xmlhttpRequestBeforeReadystatechange : defaultHandler,
			onGM_xmlhttpRequestReadystatechange : defaultHandler,
			onGM_registerMenuCommandCall : defaultHandler,
			onGM_addStyleCall : defaultHandler,
			onGM_getResourceURLCall : defaultHandler,
			onGM_getResourceTextCall : defaultHandler,
			onGM_openInTabCall : defaultHandler
		};

	function assertClear()
	{
		listener.clear();
		assert.equals(0, listener.count);
	}

	function assertResult(aExpected)
	{
		assert.equals(1, listener.count);
		for (var i in aExpected)
		{
			assert.isDefined(i, i);
			assert.equals(aExpected[i], listener.lastResult[i]);
		}
		assertClear();
	}

	yield Do(GMUtils.open('about:'));
	GMUtils.addListener(listener);

	var url = topDir+'tests/samples/greasemonkey/greasemonkey.user.js';
	var sandbox = GMUtils.loadScript(url);

	assertClear();

	GMUtils.GM_log('foo');
	assertResult({
		type    : 'GM_logCall',
		message : 'foo'
	});

	GMUtils.GM_setValue('key', 'value');
	assertResult({
		type  : 'GM_setValueCall',
		key   : 'key',
		value : 'value'
	});

	GMUtils.GM_getValue('key');
	assertResult({
		type : 'GM_getValueCall',
		key  : 'key',
	});

	var func = function(aArg) { return true; };
	GMUtils.GM_registerMenuCommand('command', func, 'c', 'control', 'd');
	assertResult({
		type           : 'GM_registerMenuCommandCall',
		name           : 'command',
		function       : func,
		accelKey       : 'c',
		accelModifiers : 'control',
		accessKey      : 'd'
	});

	GMUtils.GM_addStyle(content.document, '* { color: red; }');
	assertResult({
		type     : 'GM_addStyleCall',
		document : content.document,
		style    : '* { color: red; }'
	});

	GMUtils.GM_getResourceText('about');
	assertResult({
		type : 'GM_getResourceTextCall',
		key  : 'about'
	});

	GMUtils.GM_getResourceURL('about');
	assertResult({
		type : 'GM_getResourceURLCall',
		key  : 'about'
	});

	GMUtils.GM_openInTab('about:config');
	yield 200;
	assertResult({
		type : 'GM_openInTabCall',
		uri  : 'about:config'
	});

/*
GM_xmlhttpRequestCall
GM_xmlhttpRequestBeforeLoad
GM_xmlhttpRequestLoad
GM_xmlhttpRequestBeforeError
GM_xmlhttpRequestError
GM_xmlhttpRequestBeforeReadystatechange
GM_xmlhttpRequestReadystatechange
*/

	GMUtils.removeListener(listener);

//	GMUtils.fireEvent({});
}



test_doAndWaitLoad.setUp = function() {
	yield utils.setUpHttpServer(4445, topDir+'tests/uxu/fixtures/');
};
test_doAndWaitLoad.tearDown = function() {
	yield utils.tearDownAllHttpServers();
};
function test_doAndWaitLoad()
{
	var sandbox = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_xmlHttpRequest.user.js');
	assert.isFunction(sandbox.loadAsciiFile);
	yield Do(GMUtils.doAndWaitLoad(function() {
			sandbox.loadAsciiFile();
		}));
	assert.equals('ASCII', sandbox.data);
}
