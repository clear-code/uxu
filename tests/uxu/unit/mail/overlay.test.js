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

	assert.isDefined(composeWindow.AttachFile);
	assert.isFunction(composeWindow.AttachFile);
	if (!('AddFileAttachment' in composeWindow)) {
		var source = composeWindow.AttachFile.toSource();
		var match = source.match(/__uxu__fileFromArgument/g);
		assert.contains('AddFileAttachment' in composeWindow ? 0 : 4, match.length, source);
	}
}

