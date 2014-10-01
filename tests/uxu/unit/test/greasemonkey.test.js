var parallel = false;
var targetProduct = 'Firefox';

var topDir = baseURL+'../../../../';

var GreasemonkeyUtils = utils.import(topDir+'modules/test/greasemonkey.js', {}).GreasemonkeyUtils;

var GMUtils;
var lastBlankPageURI;

function loadBlankPage() {
	lastBlankPageURI = 'about:blank?'+parseInt(Math.random() * 65000);
	return utils.loadURI(lastBlankPageURI);
}

function setUp()
{
	utils.setPref('browser.tabs.maxOpenBeforeWarn', 9999);
	utils.setPref('browser.tabs.warnOnClose', false);
	utils.setPref('browser.tabs.warnOnOpen', false);
	utils.setPref('browser.warnOnQuit', false);
	utils.setPref('browser.warnOnRestart', false);

	yield Do(loadBlankPage());
	assert.equals(lastBlankPageURI, content.location.href);
	GMUtils = new GreasemonkeyUtils(utils);
}

function tearDown()
{
	GMUtils.destroy();
	yield Do(loadBlankPage());
	yield Do(GMUtils.close());
}

function test_loadAndUnload()
{
	var retVal = GMUtils.load('about:');
	assert.isTrue(retVal.value);
	assert.equals('about:', content.location.href);

	retVal = GMUtils.unload();
	assert.isTrue(retVal.value);
	assert.equals('about:blank', content.location.href);
}

function test_loadAndUnload_async()
{
	var retVal = GMUtils.load('about:', { async: true });
	assert.isDefined(retVal.value);
	assert.isFalse(retVal.value);
	assert.notEquals('about:', content.location.href);

	yield 1000;
	assert.isTrue(retVal.value);
	assert.equals('about:', content.location.href);

	retVal = GMUtils.unload({ async: true });
	assert.isDefined(retVal.value);
	assert.isFalse(retVal.value);
	assert.notEquals('about:blank', content.location.href);

	yield 1000;
	assert.isTrue(retVal.value);
	assert.equals('about:blank', content.location.href);
}


test_openAndClose.tearDown = function() {
	utils.tearDownTestWindow();
};
function test_openAndClose()
{
	var retVal = GMUtils.open('about:');
	assert.isTrue(retVal.value);
	assert.isNotNull(retVal.window);
	assert.isTrue(retVal.window instanceof retVal.window.Window);
	assert.isTrue(retVal.window instanceof retVal.window.ChromeWindow);
	assert.equals('about:', retVal.window.content.location.href);

	GMUtils.close();
	yield 300;
	assert.isTrue(retVal.window.closed);
}

test_openAndClose_async.tearDown = function() {
	utils.tearDownTestWindow();
};
function test_openAndClose_async()
{
	var retVal = GMUtils.open('about:', { async : true });
	assert.isDefined(retVal.value);
	assert.isFalse(retVal.value);
	assert.isDefined(retVal.window);
	assert.isNull(retVal.window);

	var count = 0;
	while (count < 10)
	{
		count++;
		yield 1000;
		if (retVal.value) break;
	}
	yield 100;
	assert.isTrue(retVal.value);
	assert.isNotNull(retVal.window);
	assert.isTrue(retVal.window instanceof retVal.window.Window);
	assert.isTrue(retVal.window instanceof retVal.window.ChromeWindow);
	assert.equals('about:', retVal.window.content.location.href);

	GMUtils.close();
	yield 300;
	assert.isTrue(retVal.window.closed);
}

function test_getSandbox()
{
	function assertWrapped(object) {
		assert.matches(/XrayWrapper/, object.toString());
	}

	function assertNotWrapped(object) {
		assert.notMatches(/XrayWrapper/, object.toString());
	}

	var sandbox1 = GMUtils.getSandboxFor(lastBlankPageURI);
	assert.isDefined(sandbox1);
	assert.isDefined(sandbox1.window);
	assert.isInstanceOf(sandbox1.window.Window, sandbox1.window);
	assertWrapped(sandbox1.window);
	assert.isDefined(sandbox1.unsafeWindow);
	assert.isInstanceOf(sandbox1.window.Window, sandbox1.unsafeWindow);
	assertNotWrapped(sandbox1.unsafeWindow);

	assert.same(sandbox1.window.wrappedJSObject, sandbox1.unsafeWindow);

	assert.isUndefined(sandbox1.window.foobar);
	assert.isUndefined(sandbox1.unsafeWindow.foobar);
	sandbox1.window.foobar = true;
	assert.isDefined(sandbox1.window.foobar);
	assert.isUndefined(sandbox1.unsafeWindow.foobar);

	assert.isUndefined(sandbox1.window.hoge);
	assert.isUndefined(sandbox1.unsafeWindow.hoge);
	sandbox1.unsafeWindow.hoge = true;
	assert.isUndefined(sandbox1.window.hoge);
	assert.isDefined(sandbox1.unsafeWindow.hoge);

	assert.isDefined(sandbox1.document);
	assert.isInstanceOf(sandbox1.window.Document, sandbox1.document);
	assertWrapped(sandbox1.document);
	assert.same(sandbox1.unsafeWindow.document, sandbox1.document.wrappedJSObject);

	assert.equals(sandbox1.XPathResult, Ci.nsIDOMXPathResult);

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

	var sandbox2 = GMUtils.getSandboxFor(lastBlankPageURI);
	assert.same(sandbox1, sandbox2);

	var sandbox3 = GMUtils.getSandBoxFor(lastBlankPageURI);
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
	yield Do(loadBlankPage());
	var sandboxSet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_setValue.user.js');
	var sandboxGet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_getValue.user.js');
	assert.equals(navigator.userAgent, sandboxGet.userAgent);
}

function test_GM_deleteValue()
{
	var sandboxGet;
	yield Do(loadBlankPage());
	GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_setValue.user.js');
	sandboxGet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_getValue.user.js');
	assert.equals(navigator.userAgent, sandboxGet.userAgent);
	GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_deleteValue.user.js');
	sandboxGet = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_getValue.user.js');
	assert.isUndefined(sandboxGet.userAgent);
}

function test_GM_listValues()
{
	yield Do(loadBlankPage());
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
	utils.setUpHttpServer(4445, topDir+'tests/uxu/fixtures/');
};
test_GM_xmlhttpRequest.tearDown = function() {
	utils.tearDownAllHttpServers();
};
function test_GM_xmlhttpRequest()
{
	var sandbox = GMUtils.loadScript(topDir+'tests/uxu/fixtures/gm_xmlHttpRequest.user.js');
	assert.isFunction(sandbox.loadAsciiFile);
	sandbox.loadAsciiFile();
	yield function() { return sandbox.data; };
	assert.equals('ASCII', sandbox.data);
}

function test_GM_addStyle()
{
	yield Do(GMUtils.load('about:'));
	var body = content.document.body;
	assert.isTrue(body);
	assert.isTrue(body instanceof content.Node);
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

test_GM_openInTab.tearDown = function() {
	yield Do(utils.tearDownTestWindow());
};
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


test_listeningEvents.tearDown = function() {
	yield Do(utils.tearDownTestWindow());
};
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
	utils.setUpHttpServer(4445, topDir+'tests/uxu/fixtures/');
};
test_doAndWaitLoad.tearDown = function() {
	utils.tearDownAllHttpServers();
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
