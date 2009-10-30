var topDir = baseURL+'../../../../';
utils.include('action.inc.js', 'Shift_JIS');

var actionModule;
var win;

function setUp()
{
	actionModule = {};
	utils.include(topDir+'content/uxu/test/action.js', actionModule);
	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/action.html'));
	actionSetUp();
}

function tearDown()
{
	actionTearDown();
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


/* mouse events */

function test_fireMouseEvent()
{
	target = $('clickable-box');
	boxObject = utils.getBoxObjectFor(target);
	var events, param, x, y;

	param = {
		type     : 'mousedown',
		button   : 2,
		ctrlKey  : true,
		screenX  : boxObject.screenX+10,
		screenY  : boxObject.screenY+10
	};
	[x, y] = [param.screenX, param.screenY];
	actionModule.fireMouseEvent(content, param);
	events = assertEventsCount(1);
	assertMouseEventAt('mousedown', 2, x, y, param, 1, events[events.length-1]);

	param = {
		type     : 'mouseup',
		button   : 1,
		altKey   : true,
		screenX  : boxObject.screenX+20,
		screenY  : boxObject.screenY+20
	};
	[x, y] = [param.screenX, param.screenY];
	actionModule.fireMouseEvent(content, param);
	events = assertEventsCount(1);
	assertMouseEventAt('mouseup', 1, x, y, param, 0, events[events.length-1]);

	param = {
		type     : 'click',
		button   : 0,
		shiftKey : true,
		screenX  : boxObject.screenX+30,
		screenY  : boxObject.screenY+30
	};
	[x, y] = [param.screenX, param.screenY];
	actionModule.fireMouseEvent(content, param);
	events = assertEventsCount(3);
	assertMouseEventAt('mousedown', 0, x, y, param, 1, events[events.length-3]);
	assertMouseEventAt('mouseup', 0, x, y, param, 1, events[events.length-2]);
	assertMouseEventAt('click', 0, x, y, param, 1, events[events.length-1]);

	param = {
		type     : 'dblclick',
		button   : 0,
		shiftKey : true,
		screenX  : boxObject.screenX+40,
		screenY  : boxObject.screenY+40
	};
	[x, y] = [param.screenX, param.screenY];
	actionModule.fireMouseEvent(content, param);
	events = assertEventsCount(7);
	assertMouseEventAt('mousedown', 0, x, y, param, 1, events[events.length-7]);
	assertMouseEventAt('mouseup', 0, x, y, param, 1, events[events.length-6]);
	assertMouseEventAt('click', 0, x, y, param, 1, events[events.length-5]);
	assertMouseEventAt('mousedown', 0, x, y, param, 2, events[events.length-4]);
	assertMouseEventAt('mouseup', 0, x, y, param, 2, events[events.length-3]);
	assertMouseEventAt('click', 0, x, y, param, 2, events[events.length-2]);
	assertMouseEventAt('dblclick', 0, x, y, param, 2, events[events.length-1]);
}

function test_fireMouseEventOnElement()
{
	target = $('clickable-box');
	boxObject = utils.getBoxObjectFor(target);
	var events, param;

	param = {
		type     : 'mousedown',
		button   : 2,
		ctrlKey  : true
	}
	actionModule.fireMouseEventOnElement(target, param);
	events = assertEventsCount(1);
	assertMouseEventOn('mousedown', 2, param, 1, events[events.length-1]);

	param = {
		type     : 'mouseup',
		button   : 1,
		altKey   : true
	}
	actionModule.fireMouseEventOnElement(target, param);
	events = assertEventsCount(1);
	assertMouseEventOn('mouseup', 1, param, 0, events[events.length-1]);

	param = {
		type     : 'click',
		button   : 0,
		shiftKey : true
	}
	actionModule.fireMouseEventOnElement(target, param);
	events = assertEventsCount(3);
	assertMouseEventOn('mousedown', 0, param, 1, events[events.length-3]);
	assertMouseEventOn('mouseup', 0, param, 1, events[events.length-2]);
	assertMouseEventOn('click', 0, param, 1, events[events.length-1]);

	param = {
		type     : 'dblclick',
		button   : 0,
		shiftKey : true
	}
	actionModule.fireMouseEventOnElement(target, param);
	events = assertEventsCount(7);
	assertMouseEventOn('mousedown', 0, param, 1, events[events.length-7]);
	assertMouseEventOn('mouseup', 0, param, 1, events[events.length-6]);
	assertMouseEventOn('click', 0, param, 1, events[events.length-5]);
	assertMouseEventOn('mousedown', 0, param, 2, events[events.length-4]);
	assertMouseEventOn('mouseup', 0, param, 2, events[events.length-3]);
	assertMouseEventOn('click', 0, param, 2, events[events.length-2]);
	assertMouseEventOn('dblclick', 0, param, 2, events[events.length-1]);
}


/* key events */

function test_fireKeyEventOnElement()
{
	target = $('clickable-button');
	target.focus();
	var events, param;

	param = {
		type    : 'keydown',
		keyCode : Ci.nsIDOMKeyEvent.DOM_VK_DELETE,
		ctrlKey : true
	}
	actionModule.fireKeyEventOnElement(target, param);
	events = assertEventsCount(1);
	assertKeyEvent('keydown', Ci.nsIDOMKeyEvent.DOM_VK_DELETE, 0, param, events[events.length-1]);

	param = {
		type     : 'keyup',
		charCode : 'f'.charCodeAt(0),
		shiftKey : true
	}
	actionModule.fireKeyEventOnElement(target, param);
	events = assertEventsCount(1);
	assertKeyEvent('keyup', 0, 'f', param, events[events.length-1]);

	param = {
		type     : 'keypress',
		charCode : 'c'.charCodeAt(0),
		ctrlKey  : true,
		shiftKey : true
	}
	actionModule.fireKeyEventOnElement(target, param);
	yield 100;
	events = assertEventsCount(3);
	assertKeyEvent('keydown', 0, 'c', param, events[events.length-3]);
	assertKeyEvent('keyup', 0, 'c', param, events[events.length-2]);
	assertKeyEvent('keypress', 0, 'c', param, events[events.length-1]);
}


/* input events */

function test_inputTextToField()
{
	var input = $('input');
	var events;
	assert.equals('', input.value);

	actionModule.inputTextToField(input, 'string');
	assert.equals('string', input.value);
	events = assertEventsCount(('string'.length * 3) + 1);
	assert.equals(
		{ type : 'keypress', target : 'input',
		  keyCode : 0, charCode : 'g'.charCodeAt(0),
		  altKey : false, ctrlKey : false, metaKey : false, shiftKey : false },
		events[events.length-2]
	);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);

	actionModule.inputTextToField(input, 'moji');
	assert.equals('moji', input.value);
	events = assertEventsCount(('moji'.length * 3) + 1);
	assert.equals(
		{ type : 'keypress', target : 'input',
		  keyCode : 0, charCode : 'i'.charCodeAt(0),
		  altKey : false, ctrlKey : false, metaKey : false, shiftKey : false },
		events[events.length-2]
	);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);

	actionModule.inputTextToField(input, 'retsu', true);
	assert.equals('mojiretsu', input.value);
	events = assertEventsCount(('retsu'.length * 3) + 1);
	assert.equals(
		{ type : 'keypress', target : 'input',
		  keyCode : 0, charCode : 'u'.charCodeAt(0),
		  altKey : false, ctrlKey : false, metaKey : false, shiftKey : false },
		events[events.length-2]
	);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);

	actionModule.inputTextToField(input, 'foobar', false, true);
	assert.equals('foobar', input.value);
	events = assertEventsCount(1);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);
}

