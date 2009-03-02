var targetProduct = 'Thunderbird';

var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var mail_module = new ModuleManager([topDir+'content/uxu/mail']);
var ComposeClass;
var compose;
var composeWindow;

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
	yield Do(compose.setUp());
	composeWindow = compose.window;
}

function tearDown()
{
	utils.tearDownTestWindow();
	if (compose) {
		compose.destroy();
	}
	compose = null;
	closeAllComposeWindows();
}

testWindowOperations.setUp = function()
{
	compose.tearDown();
}
function testWindowOperations()
{
	assert.isNull(compose.window);
	assert.equals(0, compose.windows.length);
	assert.isNull(utils.getTestWindow());

	assert.isFunction(compose.setUp);
	yield Do(compose.setUp());

	assert.isNotNull(utils.getTestWindow());
	var composeWindow = compose.window;
	assert.isNotNull(composeWindow);
	assert.equals(1, compose.windows.length);
	assert.equals(composeWindow, compose.windows[0]);

	assert.isFunction(compose.tearDown);
	compose.tearDown();

	assert.isNull(utils.getTestWindow());
	assert.isNull(compose.window);
	assert.equals(0, compose.windows.length);


	yield Do(compose.setUp());
	assert.isNotNull(utils.getTestWindow());
	assert.isNotNull(compose.window);

	assert.isFunction(compose.tearDownAll);
	compose.tearDownAll();

	assert.isNull(utils.getTestWindow());
	assert.isNull(compose.window);
}

function testGetFields()
{
	var nodes;

	nodes = $X('//*[@id="addressingWidget"]/descendant::*[local-name()="textbox"]', composeWindow.document);
	assert.equals(1, nodes.length);
	assert.equals(nodes, compose.addressFields);
	assert.equals(nodes[0], compose.lastAddressField);

	nodes = $X('//*[@id="addressingWidget"]/descendant::*[local-name()="menulist"]', composeWindow.document);
	assert.equals(1, nodes.length);
	assert.equals(nodes, compose.addressTypes);
	assert.equals(nodes[0], compose.lastAddressType);

	nodes = $X('//*[@id="addressingWidget"]/descendant::*[@class="dummy-row"]', composeWindow.document);
	assert.equals(3, nodes.length);
	assert.equals(nodes, compose.dummyRows);
	assert.equals(nodes[0], compose.firstDummyRow);

	assert.equals($('content-frame', composeWindow.document).contentDocument.body, compose.body);

	assert.equals([], compose.attachments);


	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.addressFields;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.lastAddressField;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.addressTypes;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.lastAddressType;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.dummyRows;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.firstDummyRow;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.body;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.attachments;
	});
}
