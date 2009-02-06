var targetProduct = 'Thunderbird';

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var ObserverClass = lib_module.require('class', 'observer');

var observer;

function setUp()
{
	yield utils.setUpTestWindow();
}

function tearDown()
{
	var composeWindows = utils.getChromeWindows({ type : 'msgcompose' });
	composeWindows.forEach(function(aWindow) {
		aWindow.close();
	});
	utils.tearDownTestWindow();
}

function getTextboxesFor(aWindow, aTarget)
{
	return aWindow.document.evaluate(
			'/descendant::*[local-name()="menulist" and @value="addr_'+aTarget+'"]/ancestor::*[local-name()="listitem"]/descendant::*[local-name()="textbox"]',
			aWindow.document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
}


function getDummyRow(aWindow)
{
	return aWindow.document.evaluate(
			'/descendant::*[@class="dummy-row"]',
			aWindow.document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}

function clickDummyRow(aWindow)
{
	action.fireMouseEventOnElement(getDummyRow(aWindow));
}

function testSend()
{
	observer = new ObserverClass();
	observer.startObserve('uxu:mail:sent');
	assert.equals(0, observer.count);

	var mainWindow = utils.getTestWindow();
	var composeWindow = null;
	yield 500; // wait for initializing processes

	mainWindow.MsgNewMessage(null);

	yield (function() {
			return composeWindow = utils.getChromeWindow({ type : 'msgcompose' });
		});
	yield 500;

	var toBox = getTextboxesFor(composeWindow, 'to').snapshotItem(0);
	toBox.value = 'address1@test';

	yield (function() {
			return getDummyRow(composeWindow);
		});
	clickDummyRow(composeWindow);
	yield 500;

	toBox = getTextboxesFor(composeWindow, 'to').snapshotItem(1);
	toBox.value = 'address2@test';

	composeWindow.document.getElementById('msgSubject').value = 'test subject';

	var frame = composeWindow.document.getElementById('content-frame');
	var range = frame.contentDocument.createRange();
	range.selectNodeContents(frame.contentDocument.body);
	range.deleteContents();
	var fragment = frame.contentDocument.createDocumentFragment();
	fragment.appendChild(frame.contentDocument.createTextNode('test body'));
	fragment.appendChild(frame.contentDocument.createElement('br'));
	fragment.appendChild(frame.contentDocument.createTextNode('new row'));
	range.insertNode(fragment);
	range.detach();
	yield 200;

//	action.fireMouseEventOnElement(composeWindow.document.getElementById('button-send'));
	composeWindow.SendMessage();

	observer.endObserve('uxu:mail:sent');

	assert.equals(1, observer.count);
	assert.equals('uxu:mail:sent', observer.lastTopic);
	assert.isTrue(observer.lastData);

	var data ;
	eval('data = '+observer.lastData);
	assert.isTrue(data);

	assert.matches(/^\s*address1@test\s*,\s*address2@test\s*$/, data.to);
	assert.equals('test subject', data.subject);
	assert.equals('test body\nnew row', data.body);
}
