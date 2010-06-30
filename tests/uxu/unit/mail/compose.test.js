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
	mail.clear();
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

function testAddressFields()
{
	var expression = '//*[@id="addressingWidget"]/descendant::*[local-name()="textbox"]';
	var nodes = $X(expression, composeWindow.document);
	assert.equals(1, nodes.length);
	assert.equals(nodes, compose.addressFields);
	assert.equals(nodes[0], compose.firstAddressField);
	assert.equals(nodes[0], compose.lastAddressField);

	action.inputTo(nodes[0], 'test@example.com');
	yield 500;
	action.keypressOn(nodes[0], 'return');
	yield 200;

	nodes = $X(expression, composeWindow.document);
	assert.equals(2, nodes.length);
	assert.equals(nodes, compose.addressFields);
	assert.equals(nodes[0], compose.firstAddressField);
	assert.equals(nodes[1], compose.lastAddressField);

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.addressFields;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.lastAddressField;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.firstAddressField;
	});
}

function testBlankAddressFields()
{
	var field = compose.firstAddressField;
	var blank = compose.blankAddressFields;
	assert.equals(1, blank.length);
	assert.equals(field, compose.firstBlankAddressField);
	assert.equals(field, compose.lastBlankAddressField);

	action.inputTo(field, 'test@example.com');
	yield 500;
	action.keypressOn(field, 'return');
	yield 200;

	var fields = compose.addressFields;
	assert.equals(2, fields.length);
	blank = compose.blankAddressFields;
	assert.equals(1, blank.length);
	assert.equals([fields[1]], blank);
	assert.equals(fields[1], compose.firstBlankAddressField);
	assert.equals(fields[1], compose.lastBlankAddressField);

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.blankAddressFields;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.firstBlankAddressField;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.lastBlankAddressField;
	});
}

function testAddressTypes()
{
	var expression = '//*[@id="addressingWidget"]/descendant::*[local-name()="menulist"]';
	var nodes = $X(expression, composeWindow.document);
	assert.equals(1, nodes.length);
	assert.equals(nodes, compose.addressTypes);
	assert.equals(nodes[0], compose.lastAddressType);

	var field = $X('//*[@id="addressingWidget"]/descendant::*[local-name()="textbox"]', composeWindow.document, XPathResult.FIRST_ORDERED_NODE_TYPE);
	assert.isNotNull(field);
	action.inputTo(field, 'test@example.com');
	yield 500;
	action.keypressOn(field, 'return');
	yield 200;

	nodes = $X(expression, composeWindow.document);
	assert.equals(2, nodes.length);
	assert.equals(nodes, compose.addressTypes);
	assert.equals(nodes[1], compose.lastAddressType);

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.addressTypes;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.firstAddressType;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.lastAddressType;
	});
}

function testDummyRows()
{
	var nodes = $X('//*[@id="addressingWidget"]/descendant::*[@class="dummy-row"]', composeWindow.document);
	assert.equals(3, nodes.length);
	assert.equals(nodes, compose.dummyRows);
	assert.equals(nodes[0], compose.firstDummyRow);

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.dummyRows;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.firstDummyRow;
	});
}

function testRecipients()
{
	assert.equals([], compose.recipients);

	var addresses = [
			{ type : 'to', address : 'to@example.com' },
			{ type : 'cc', address : 'cc@example.com' },
			{ type : 'bcc', address : 'bcc@example.com' },
			{ type : 'reply-to', address : 'reply@example.com' },
			{ type : 'followup-to', address : 'followup@example.com' }
		];
	compose.recipients = addresses;

	var fields = compose.addressFields;
	assert.equals(addresses.length+1, fields.length);
	var types = compose.addressTypes;
	assert.equals(addresses.length+1, types.length);
	addresses.forEach(function(aAddress, aIndex) {
		let type = types[aIndex].value.split('_')[1];
		if (type == 'reply' || type == 'followup') type += '-to';
		assert.equals(aAddress.type, type, inspect(aAddress)+'\n'+types[aIndex].value);
		assert.equals(aAddress.address, fields[aIndex].value, inspect(aAddress)+'\n'+fields[aIndex].value);
	})

	assert.equals(addresses, compose.recipients);

	// string type
	compose.recipients = ['test1@example.com', 'test2@example.com'];
	assert.equals(
		[
			{ type : 'to', address : 'test1@example.com' },
			{ type : 'to', address : 'test2@example.com' }
		],
		compose.recipients
	);

	// single string type
	compose.recipients = 'test@example.com';
	assert.equals([{ type : 'to', address : 'test@example.com' }], compose.recipients);

	// method type
	compose.setRecipients(['foo@example.com', 'bar@example.com']);
	assert.equals(
		[
			{ type : 'to', address : 'foo@example.com' },
			{ type : 'to', address : 'bar@example.com' }
		],
		compose.recipients
	);
	compose.appendRecipients(['baz@example.com', 'hoge@example.com']);
	assert.equals(
		[
			{ type : 'to', address : 'foo@example.com' },
			{ type : 'to', address : 'bar@example.com' },
			{ type : 'to', address : 'baz@example.com' },
			{ type : 'to', address : 'hoge@example.com' }
		],
		compose.recipients
	);

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.recipients;
	});
}

function testSubject()
{
	var field = composeWindow.document.getElementById('msgSubject');
	assert.equals('', compose.subject);
	assert.equals('', field.value);
	compose.subject = 'test subject';
	assert.equals('test subject', compose.subject);
	assert.equals('test subject', field.value);

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.subject;
	});
}

function testBody()
{
	assert.equals($('content-frame', composeWindow.document).contentDocument.body, compose.body);

	// text
	compose.body = 'foobar\nhoge';
	var body = compose.body;
	assert.equals(3, body.childNodes.length);
	assert.equals('foobar', utils.inspectDOMNode(body.childNodes[0]));
	if (body.childNodes[1].localName == body.childNodes[1].localName.toLowerCase())
		assert.equals('<br xmlns="http://www.w3.org/1999/xhtml"/>', utils.inspectDOMNode(body.childNodes[1]));
	else
		assert.equals('<BR/>', utils.inspectDOMNode(body.childNodes[1]));
	assert.equals('hoge', utils.inspectDOMNode(body.childNodes[2]));

	// node
	var doc = compose.body.ownerDocument;
	var text = doc.createTextNode('line');
	compose.body = text;
	body = compose.body;
	assert.equals(1, body.childNodes.length);
	assert.equals('line', utils.inspectDOMNode(body.childNodes[0]));

	// document fragment
	var fragment = doc.createDocumentFragment();
	text = doc.createTextNode('first');
	fragment.appendChild(text);
	fragment.appendChild(doc.createElement('br'));
	text = doc.createTextNode('last');
	fragment.appendChild(text);
	compose.body = fragment;
	body = compose.body;
	assert.equals(3, body.childNodes.length);
	assert.equals('first', utils.inspectDOMNode(body.childNodes[0]));
	if (body.childNodes[1].localName == body.childNodes[1].localName.toLowerCase())
		assert.equals('<br xmlns="http://www.w3.org/1999/xhtml"/>', utils.inspectDOMNode(body.childNodes[1]));
	else
		assert.equals('<BR/>', utils.inspectDOMNode(body.childNodes[1]));
	assert.equals('last', utils.inspectDOMNode(body.childNodes[2]));

	// set
	compose.setBodyContents('line');
	body = compose.body;
	assert.equals(1, body.childNodes.length);
	assert.equals('line', utils.inspectDOMNode(body.childNodes[0]));

	// append
	compose.appendBodyContents('foobar\nhoge');
	body = compose.body;
	assert.equals(4, body.childNodes.length);
	assert.equals('line', utils.inspectDOMNode(body.childNodes[0]));
	assert.equals('foobar', utils.inspectDOMNode(body.childNodes[1]));
	if (body.childNodes[2].localName == body.childNodes[2].localName.toLowerCase())
		assert.equals('<br xmlns="http://www.w3.org/1999/xhtml"/>', utils.inspectDOMNode(body.childNodes[2]));
	else
		assert.equals('<BR/>', utils.inspectDOMNode(body.childNodes[2]));
	assert.equals('hoge', utils.inspectDOMNode(body.childNodes[3]));

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.body;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.setBodyContents('foo');
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.appendBodyContents('foo');
	});
}

function testAttachments()
{
	assert.equals([], compose.attachments);

	compose.attachments = ['compose.test.js', 'utils.test.js'];
	var attachments = compose.attachments;
	assert.equals(2, attachments.length);
	assert.equals(utils.getFilePathFromURLSpec(baseURL+'compose.test.js'), attachments[0].path);
	assert.equals(utils.getFilePathFromURLSpec(baseURL+'utils.test.js'), attachments[1].path);

	compose.attachFile('overlay.test.js');
	attachments = compose.attachments;
	assert.equals(3, attachments.length);
	assert.equals(utils.getFilePathFromURLSpec(baseURL+'compose.test.js'), attachments[0].path);
	assert.equals(utils.getFilePathFromURLSpec(baseURL+'utils.test.js'), attachments[1].path);
	assert.equals(utils.getFilePathFromURLSpec(baseURL+'overlay.test.js'), attachments[2].path);

	compose.tearDown();
	assert.isNull(compose.window);
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.attachments;
	});
	assert.raises(compose.ERROR_NO_COMPOSE_WINDOW, function() {
		compose.attachFile('compose.test.js');
	});
}

function testSend()
{
	compose.recipients = ['test@example.com'];
	compose.subject = 'foo';
	compose.body = 'bar';
	assert.equals(0, mail.deliveries.length);
	compose.send();
	assert.equals(1, mail.deliveries.length);
}

function testSendAsync()
{
	compose.recipients = ['test@example.com'];
	compose.subject = 'foo';
	compose.body = 'bar';
	assert.equals(0, mail.deliveries.length);
	compose.send(true);
	assert.equals(0, mail.deliveries.length);
	yield 100;
	assert.equals(1, mail.deliveries.length);
}

testSendByButtonClick.shouldSkip = utils.checkAppVersion('3.0') < 0;
function testSendByButtonClick()
{
	compose.recipients = ['test@example.com'];
	compose.subject = 'foo';
	compose.body = 'bar';
	assert.equals(0, mail.deliveries.length);
	compose.sendByButtonClick();
	assert.equals(1, mail.deliveries.length);
}

testSendByButtonClickAsync.shouldSkip = utils.checkAppVersion('3.0') < 0;
function testSendByButtonClickAsync()
{
	compose.recipients = ['test@example.com'];
	compose.subject = 'foo';
	compose.body = 'bar';
	assert.equals(0, mail.deliveries.length);
	compose.sendByButtonClick(true);
	assert.equals(0, mail.deliveries.length);
	yield 100;
	assert.equals(1, mail.deliveries.length);
}
