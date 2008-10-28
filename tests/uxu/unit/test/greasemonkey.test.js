var targetProduct = 'Firefox';

var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var test_module = new ModuleManager([topDir+'content/uxu/test']);
var GMUtilsClass = test_module.require('class', 'greasemonkey');

var GMUtils;

function setUp()
{
	yield Do(utils.loadURI('about:blank'));
	assert.equals('about:blank', content.location.href);
	GMUtils = new GMUtilsClass(utils);
}

function tearDown()
{
	yield Do(utils.loadURI('about:blank'));
}

function test_loadAndUnload()
{
	var retVal = GMUtils.load('about:');
	assert.isDefined(retVal.value);
	assert.isFalse(retVal.value);
	assert.notEquals('about:', content.location.href);

	yield 1000;
	assert.isTrue(retVal.value);
	assert.equals('about:', content.location.href);

	retVal = GMUtils.unload();
	assert.isDefined(retVal.value);
	assert.isFalse(retVal.value);
	assert.notEquals('about:blank', content.location.href);

	yield 1000;
	assert.isTrue(retVal.value);
	assert.equals('about:blank', content.location.href);
}


function test_openAndClose()
{
	var retVal = GMUtils.open('about:');
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
	assert.isTrue(retVal.window instanceof Ci.nsIDOMWindow);
	assert.isTrue(retVal.window instanceof Ci.nsIDOMChromeWindow);
	assert.equals('about:', retVal.window.content.location.href);

	GMUtils.close();
	yield 300;
	assert.isTrue(retVal.window.closed);
}

function test_getSandbox()
{
	var sandbox1 = GMUtils.getSandboxFor('about:blank');
	assert.isTrue(sandbox1);

	assert.isTrue(sandbox1.window);
	assert.isTrue(sandbox1.window instanceof Ci.nsIDOMWindow);
	assert.matches(/XPCNativeWrapper/, String(sandbox1.window));
	assert.isTrue(sandbox1.unsafeWindow);
	assert.isTrue(sandbox1.unsafeWindow instanceof Ci.nsIDOMWindow);
	assert.notMatches(/XPCNativeWrapper/, String(sandbox1.unsafeWindow));
	assert.equals(sandbox1.window, sandbox1.unsafeWindow);

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

	assert.isTrue(sandbox1.document);
	assert.isTrue(sandbox1.document instanceof Ci.nsIDOMDocument);
	assert.matches(/XPCNativeWrapper/, String(sandbox1.document));
	assert.equals(sandbox1.window.document, sandbox1.document);

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
	assert.isTrue(sandbox1.console);
	assert.isFunction(sandbox1.console.log);

	var sandbox2 = GMUtils.getSandboxFor('about:blank');
	assert.equals(sandbox1, sandbox2);

	var sandbox3 = GMUtils.getSandBoxFor('about:blank');
	assert.equals(sandbox1, sandbox3);

	var sandbox4 = GMUtils.getSandboxFor('about:mozilla');
	assert.notEquals(sandbox1, sandbox4);

	var sandbox5 = GMUtils.getSandBoxFor('about:mozilla');
	assert.notEquals(sandbox1, sandbox5);
	assert.equals(sandbox4, sandbox5);
}

function test_loadScript()
{
	var url = baseURL+'../../../samples/greasemonkey/greasemonkey.user.js';
	var sandbox1 = GMUtils.loadScript(url);
	assert.isTrue(sandbox1);

	var sandbox2 = GMUtils.getSandboxFor(url);
	assert.equals(sandbox1, sandbox2);

	assert.isFunction(sandbox1.getDocumentTitleAndURI);
}


// TBD
function test_events()
{
	GMUtils.fireEvent({});
	GMUtils.addListener(listener);
	GMUtils.removeListener(listener);
}


function test_doAndWaitLoad()
{
}


function test_GM_log()
{
}

function test_GM_getValue()
{
    assert.equals(null, GMUtils.GM_getValue('nonexistence'));
    assert.equals(100, GMUtils.GM_getValue('nonexistence', 100));
}

function test_GM_setValue()
{
}

function test_GM_registerMenuCommand()
{
}

function test_GM_xmlhttpRequest()
{
}

function test_GM_addStyle()
{
}

function test_GM_getResourceURL()
{
}

function test_GM_getResourceText()
{
}

function test_GM_openInTab()
{
}
