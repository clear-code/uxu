var targetProduct = 'Thunderbird';

var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var mail_module = new ModuleManager([topDir+'content/uxu/mail']);
var ComposeClass;
var compose;

function closeAllComposeWindows()
{
	utils.getChromeWindows({ type : 'msgcompose' })
		.forEach(function(aWindow) {
			composeWindow.SetContentAndBodyAsUnmodified();
			composeWindow.MsgComposeCloseWindow(true);
		}, this);
}

function setUp()
{
	closeAllComposeWindows();

	ComposeClass = mail_module.require('class', 'compose');
	compose = new ComposeClass(utils.mail, utils);
}

function tearDown()
{
	utils.tearDownTestWindow();
	compose.destroy();
	closeAllComposeWindows();
}

function testWindowOperations()
{
	assert.isNull(compose.window);
	assert.equals(0, compose.windows.length);
	assert.isNull(utils.getTestWindow());

	assert.isFunction(compose.setUp);
	yield compose.setUp();

	assert.isNotNull(utils.getTestWindow());
	var composeWindow = compose.window;
	assert.isNotNull(composeWindow);
	assert.equals(1, compose.windows.length);
	assert.equals(composeWindow, compose.windows[0]);

	assert.isFunction(compose.tearDown);
	yield compose.tearDown();

	assert.isNull(utils.getTestWindow());
	assert.isNull(compose.window);
	assert.equals(0, compose.windows.length);


	yield compose.setUp();
	assert.isNotNull(utils.getTestWindow());
	assert.isNotNull(compose.window);

	assert.isFunction(compose.tearDownAll);
	yield compose.tearDownAll();

	assert.isNull(utils.getTestWindow());
	assert.isNull(compose.window);
}
