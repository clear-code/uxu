var targetProduct = 'Thunderbird';

var composeWindow;

function setUp()
{
	yield utils.setUpTestWindow();

	var mainWindow = utils.getTestWindow();
	yield 500; // wait for initializing processes

	mainWindow.MsgNewMessage(null);

	yield (function() {
			return composeWindow = utils.getChromeWindow({ type : 'msgcompose' });
		});
	yield 1000;
}

function tearDown()
{
	var composeWindows = utils.getChromeWindows({ type : 'msgcompose' });
	composeWindows.forEach(function(aWindow) {
		aWindow.close();
	});
	utils.tearDownTestWindow();
	composeWindow = null;
}

function testOverridenFunctions()
{
	assert.isDefined(composeWindow.ComposeStartup);
	assert.isFunction(composeWindow.ComposeStartup);
	assert.contains('UXUMailComposeProxy', composeWindow.ComposeStartup.toSource());
}

