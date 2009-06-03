var topDir = baseURL+'../../../../';

var actionModule;
var win;

function setUp()
{
	actionModule = {};
	utils.include(topDir+'content/uxu/test/action.js', actionModule);
	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/action.html'));
}

function tearDown()
{
	yield Do(utils.loadURI('about:blank'));
}

/* internal */

test_isFullZoom.tearDown = function() {
	utils.clearPref('browser.zoom.full');
};
function test_isFullZoom()
{
	if (utils.checkAppVersion('3.0') < 0) {
		assert.isFalse(actionModule.isFullZoom());
	}
	else {
		utils.setPref('browser.zoom.full', false);
		assert.isFalse(actionModule.isFullZoom());
		utils.setPref('browser.zoom.full', true);
		assert.isTrue(actionModule.isFullZoom());
		utils.setPref('browser.zoom.full', false);
		assert.isFalse(actionModule.isFullZoom());
	}
}

test_getZoom.shouldSkip = utils.checkAppVersion('3.0') < 0;
test_getZoom.setUp = function() {
	utils.setPref('browser.zoom.full', true);
	yield Do(utils.setUpTestWindow('about:'));
	win = utils.getTestWindow();
};
test_getZoom.tearDown = function() {
	win.FullZoom.reset();
	win = null;
	utils.tearDownTestWindow();
};
function test_getZoom()
{
	var zoom = utils.getPref('toolkit.zoomManager.zoomValues').split(',').map(parseFloat);
	var index = zoom.indexOf(1);

	win.FullZoom.reset();
	win.FullZoom.enlarge();
	win.FullZoom.enlarge();
	assert.equals(
		Math.floor(zoom[index+2] * 100),
		Math.floor(actionModule.getZoom(win.content) * 100)
	);

	win.FullZoom.reset();
	win.FullZoom.reduce();
	win.FullZoom.reduce();
	assert.equals(
		Math.floor(zoom[index-2] * 100),
		Math.floor(actionModule.getZoom(win.content) * 100)
	);
}

/* public */

function generateMouseEventLogFromParams(aParam, aBox)
{
	var event = {
		type     : aParam.type || 'click',
		button   : aParam.button || 0,
		detail   : aParam.detail || 0,
		altKey   : aParam.altKey || false,
		ctrlKey  : aParam.ctrlKey || false,
		metaKey  : aParam.metaKey || false,
		shiftKey : aParam.shiftKey || false,
		screenX  : aParam.screenX || 0,
		screenY  : aParam.screenY || 0
	};
	var rootBoxObject = utils.getBoxObjectFor(content.document.body);
	event.clientX = event.screenX - rootBoxObject.screenX;
	event.clientY = event.screenY - rootBoxObject.screenY;
	if (aBox) {
		event.screenX = aBox.screenX + (aBox.width / 2);
		event.screenY = aBox.screenY + (aBox.height / 2);
		event.clientX = aBox.x + (aBox.width / 2);
		event.clientY = aBox.y + (aBox.height / 2);
	}
	return event;
}

function test_fireMouseEvent()
{
	var box = $('clickable-box');
	var boxObject = utils.getBoxObjectFor(box);
	var log = $('log');
	var events, event, param;
	var lastCount;


	param = {
		type     : 'mousedown',
		button   : 2,
		detail   : 1,
		ctrlKey  : true,
		screenX  : boxObject.screenX+10,
		screenY  : boxObject.screenY+10
	}
	actionModule.fireMouseEvent(content, param);
	eval('events = '+log.textContent);
	assert.equals(1, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'mouseup',
		button   : 1,
		detail   : 0,
		altKey   : true,
		screenX  : boxObject.screenX+20,
		screenY  : boxObject.screenY+20
	}
	actionModule.fireMouseEvent(content, param);
	eval('events = '+log.textContent);
	assert.equals(lastCount+1, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'click',
		button   : 0,
		detail   : 1,
		shiftKey : true,
		screenX  : boxObject.screenX+30,
		screenY  : boxObject.screenY+30
	}
	actionModule.fireMouseEvent(content, param);
	yield 100;
	eval('events = '+log.textContent);
	assert.equals(lastCount+3, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'mousedown';
	assert.equals(event, events[events.length-3]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'mouseup';
	assert.equals(event, events[events.length-2]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'dblclick',
		button   : 0,
		detail   : 2,
		shiftKey : true,
		screenX  : boxObject.screenX+40,
		screenY  : boxObject.screenY+40
	}
	actionModule.fireMouseEvent(content, param);
	yield 300;
	eval('events = '+log.textContent);
	assert.equals(lastCount+7, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'mousedown';
	event.detail = 1;
	assert.equals(event, events[events.length-7]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'mouseup';
	event.detail = 1;
	assert.equals(event, events[events.length-6]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'click';
	event.detail = 1;
	assert.equals(event, events[events.length-5]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'mousedown';
	assert.equals(event, events[events.length-4]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'mouseup';
	assert.equals(event, events[events.length-3]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	event.type = 'click';
	assert.equals(event, events[events.length-2]);

	event = generateMouseEventLogFromParams(param);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
}

function test_fireMouseEventOnElement()
{
	var box = $('clickable-box');
	var boxObject = utils.getBoxObjectFor(box);
	var rootBoxObject = utils.getBoxObjectFor(content.document.body);
	var log = $('log');
	var events, event, param;
	var lastCount;


	param = {
		type     : 'mousedown',
		button   : 2,
		detail   : 1,
		ctrlKey  : true
	}
	actionModule.fireMouseEventOnElement(box, param);
	eval('events = '+log.textContent);
	assert.equals(1, events.length);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'mouseup',
		button   : 1,
		detail   : 0,
		altKey   : true
	}
	actionModule.fireMouseEventOnElement(box, param);
	eval('events = '+log.textContent);
	assert.equals(lastCount+1, events.length);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'click',
		button   : 0,
		detail   : 1,
		shiftKey : true
	}
	actionModule.fireMouseEventOnElement(box, param);
	yield 100;
	eval('events = '+log.textContent);
	assert.equals(lastCount+3, events.length);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'mousedown';
	assert.equals(event, events[events.length-3]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'mouseup';
	assert.equals(event, events[events.length-2]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'dblclick',
		button   : 0,
		detail   : 2,
		shiftKey : true
	}
	actionModule.fireMouseEventOnElement(box, param);
	yield 100;
	eval('events = '+log.textContent);
	assert.equals(lastCount+7, events.length);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'mousedown';
	event.detail = 1;
	assert.equals(event, events[events.length-7]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'mouseup';
	event.detail = 1;
	assert.equals(event, events[events.length-6]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'click';
	event.detail = 1;
	assert.equals(event, events[events.length-5]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'mousedown';
	assert.equals(event, events[events.length-4]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'mouseup';
	assert.equals(event, events[events.length-3]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	event.type = 'click';
	assert.equals(event, events[events.length-2]);

	event = generateMouseEventLogFromParams(param, boxObject);
	event.target = 'clickable-box';
	assert.equals(event, events[events.length-1]);
}

function generateKeyEventLogFromParams(aParam)
{
	var event = {
		type     : aParam.type || 'keypress',
		keyCode  : aParam.keyCode || 0,
		charCode : aParam.charCode || 0,
		altKey   : aParam.altKey || false,
		ctrlKey  : aParam.ctrlKey || false,
		metaKey  : aParam.metaKey || false,
		shiftKey : aParam.shiftKey || false
	};
	if (event.type != 'keypress' &&
		event.charCode &&
		!event.keyCode) {
		event.keyCode = Ci.nsIDOMKeyEvent['DOM_VK_'+String.fromCharCode(event.charCode).toUpperCase()];
		event.charCode = 0;
	}
	return event;
}

function test_fireKeyEventOnElement()
{
	var button = $('clickable-button');
	button.focus();
	var boxObject = utils.getBoxObjectFor(button);
	var log = $('log');
	var events, event, param;
	var lastCount;


	param = {
		type    : 'keydown',
		keyCode : Ci.nsIDOMKeyEvent.DOM_VK_DELETE,
		ctrlKey : true
	}
	actionModule.fireKeyEventOnElement(button, param);
	eval('events = '+log.textContent);
	assert.equals(1, events.length);

	event = generateKeyEventLogFromParams(param);
	event.target = 'clickable-button';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'keyup',
		charCode : 'f'.charCodeAt(0),
		shiftKey : true
	}
	actionModule.fireKeyEventOnElement(button, param);
	eval('events = '+log.textContent);
	assert.equals(lastCount+1, events.length);

	event = generateKeyEventLogFromParams(param);
	event.target = 'clickable-button';
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	param = {
		type     : 'keypress',
		charCode : 'c'.charCodeAt(0),
		ctrlKey  : true,
		shiftKey : true
	}
	actionModule.fireKeyEventOnElement(button, param);
	yield 100;
	eval('events = '+log.textContent);
	assert.equals(lastCount+3, events.length);

	param.type = 'keydown';
	event = generateKeyEventLogFromParams(param);
	event.target = 'clickable-button';
	assert.equals(event, events[events.length-3]);

	param.type = 'keyup';
	event = generateKeyEventLogFromParams(param);
	event.target = 'clickable-button';
	assert.equals(event, events[events.length-2]);

	param.type = 'keypress';
	event = generateKeyEventLogFromParams(param);
	event.target = 'clickable-button';
	assert.equals(event, events[events.length-1]);
}

function test_inputTextToField()
{
}

function test_getElementFromScreenPoint()
{
}

function test_getWindowFromScreenPoint()
{
	var rootBoxObject = gBrowser.boxObject;
	assert.equals(
		content,
		actionModule.getWindowFromScreenPoint(
			content,
			rootBoxObject.screenX + 50,
			rootBoxObject.screenY + 50
		)
	);
	assert.equals(
		content,
		actionModule.getWindowFromScreenPoint(
			gBrowser.ownerDocument.defaultView,
			rootBoxObject.screenX + 50,
			rootBoxObject.screenY + 50
		)
	);
	assert.isNull(
		actionModule.getWindowFromScreenPoint(
			content,
			rootBoxObject.screenX - 150,
			rootBoxObject.screenY - 150
		)
	);

	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/frameTest.html'));
	rootBoxObject = utils.getBoxObjectFor($('frame2'));
	assert.equals(
		$('frame2').contentWindow,
		actionModule.getWindowFromScreenPoint(
			content,
			rootBoxObject.screenX + 50,
			rootBoxObject.screenY + 50
		),
		[
			'expected: '+$('frame2').contentWindow.location.href,
			'actual: '+actionModule.getWindowFromScreenPoint(
				content,
				rootBoxObject.screenX + 50,
				rootBoxObject.screenY + 50
			).location.href
		].join('\n')
	);
	assert.equals(
		$('frame2').contentWindow,
		actionModule.getWindowFromScreenPoint(
			gBrowser.ownerDocument.defaultView,
			rootBoxObject.screenX + 50,
			rootBoxObject.screenY + 50
		)
	);
}

function test_fireXULCommandEvent()
{
}

function test_fireXULCommandEventOnElement()
{
}
