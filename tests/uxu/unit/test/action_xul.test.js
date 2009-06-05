var topDir = baseURL+'../../../../';

var actionModule;
var win;
var options = {
		uri      : topDir+'tests/uxu/fixtures/action.xul',
		name     : '_blank',
		features : 'chrome,all,dialog=no',
		width    : 300,
		height   : 300
	};

function setUp()
{
	actionModule = {};
	utils.include(topDir+'content/uxu/test/action.js', actionModule);
	yield Do(utils.setUpTestWindow(options));
	win = utils.getTestWindow(options);
}

function tearDown()
{
	utils.tearDownTestWindow(options);
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
	var rootBoxObject = utils.getBoxObjectFor(win.document.documentElement);
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

function assertMouseEvent(aTarget, aSetUpBeforeEvent)
{
	var log = $('log', win);
	var events, event, param;
	var lastCount;

	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	boxObject = utils.getBoxObjectFor(aTarget);
	param = {
		type     : 'mouseup',
		button   : 1,
		detail   : 0,
		shiftKey : true,
		screenX  : boxObject.screenX+10,
		screenY  : boxObject.screenY+3
	};
	actionModule.fireMouseEvent(win, param);
	eval('events = '+log.textContent);
	assert.equals(1, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;

	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);


	boxObject = utils.getBoxObjectFor(aTarget);
	param = {
		type     : 'mousedown',
		button   : 1,
		detail   : 1,
		ctrlKey  : true,
		screenX  : boxObject.screenX+5,
		screenY  : boxObject.screenY+5
	};
	actionModule.fireMouseEvent(win, param);
	eval('events = '+log.textContent);
	assert.equals(lastCount+1, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;

	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	boxObject = utils.getBoxObjectFor(aTarget);
	param = {
		type    : 'click',
		button  : 2,
		detail  : 1,
		ctrlKey : true,
		screenX : boxObject.screenX+5,
		screenY : boxObject.screenY+5
	}
	actionModule.fireMouseEvent(win, param);
	yield 100;
	eval('events = '+log.textContent);
	assert.equals(lastCount+3, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	event.type = 'mousedown';
	assert.equals(event, events[events.length-3]);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	event.type = 'mouseup';
	assert.equals(event, events[events.length-2]);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
}

function assertMouseEventOnElement(aTarget, aSetUpBeforeEvent)
{
	var log = $('log', win);
	var events, event, param;
	var lastCount;

	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	param = {
		type     : 'mouseup',
		button   : 1,
		detail   : 0,
		shiftKey : true
	}
	actionModule.fireMouseEventOnElement(aTarget, param);
	eval('events = '+log.textContent);
	assert.equals(1, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	param = {
		type     : 'mousedown',
		button   : 1,
		detail   : 1,
		ctrlKey  : true
	};
	actionModule.fireMouseEventOnElement(aTarget, param);
	eval('events = '+log.textContent);
	assert.equals(lastCount+1, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	param = {
		type    : 'click',
		button  : 2,
		detail  : 1,
		ctrlKey : true
	}
	actionModule.fireMouseEventOnElement(aTarget, param);
	yield 100;
	eval('events = '+log.textContent);
	assert.equals(lastCount+3, events.length);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	event.type = 'mousedown';
	assert.equals(event, events[events.length-3]);

	event = generateMouseEventLogFromParams(param);
	event.target = aTarget.id;
	event.type = 'mouseup';
	assert.equals(event, events[events.length-2]);

	event = generateMouseEventLogFromParams(param);
	actionModule.fireMouseEventOnElement(aTarget, param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
}


function test_fireMouseEvent_onButton()
{
	yield Do(assertMouseEvent(
			$('button', win)
		));
}

function test_fireMouseEventOnElement_onButton()
{
	yield Do(assertMouseEventOnElement(
			$('button', win)
		));
}

function test_fireMouseEvent_onMenuItem()
{
	var menu = $('menu', win);
	yield Do(assertMouseEvent(
			$('menuitem', win),
			function() {
				menu.firstChild.showPopup();
				yield 300;
			}
		));
}

function test_fireMouseEventOnElement_onMenuItem()
{
	var menu = $('menu', win);
	yield Do(assertMouseEventOnElement(
			$('menuitem', win),
			function() {
				menu.firstChild.showPopup();
				yield 300;
			}
		));
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

function assertKeyEventOnElement(aTarget, aSetUpBeforeEvent)
{
	if ('focus' in aTarget) aTarget.focus();
	var boxObject = utils.getBoxObjectFor(aTarget);
	var log = $('log', win);
	var events, event, param;
	var lastCount;

	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	param = {
		type    : 'keydown',
		keyCode : Ci.nsIDOMKeyEvent.DOM_VK_DELETE,
		ctrlKey : true
	};
	actionModule.fireKeyEventOnElement(aTarget, param);
	eval('events = '+log.textContent);
	assert.equals(1, events.length);

	event = generateKeyEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	param = {
		type     : 'keyup',
		charCode : 'f'.charCodeAt(0),
		shiftKey : true
	};
	actionModule.fireKeyEventOnElement(aTarget, param);
	eval('events = '+log.textContent);
	assert.equals(lastCount+1, events.length);

	event = generateKeyEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
	lastCount = events.length;


	if (aSetUpBeforeEvent)
		yield Do(aSetUpBeforeEvent);

	param = {
		type     : 'keypress',
		charCode : 'c'.charCodeAt(0),
		ctrlKey  : true,
		shiftKey : true
	}
	actionModule.fireKeyEventOnElement(aTarget, param);
	yield 100;
	eval('events = '+log.textContent);
	assert.equals(lastCount+3, events.length);

	param.type = 'keydown';
	event = generateKeyEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-3]);

	param.type = 'keyup';
	event = generateKeyEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-2]);

	param.type = 'keypress';
	event = generateKeyEventLogFromParams(param);
	event.target = aTarget.id;
	assert.equals(event, events[events.length-1]);
}

function test_fireKeyEventOnElement_onButton()
{
	yield Do(assertKeyEventOnElement(
			$('button', win)
		));
}

// menuitemはEnter以外のすべてのイベントを無視する模様
test_fireKeyEventOnElement_onMenuItem.shouldSkip = true;
function test_fireKeyEventOnElement_onMenuItem()
{
	var menu = $('menu', win);
	yield Do(assertKeyEventOnElement(
			$('menuitem', win),
			function() {
				menu.firstChild.showPopup();
				yield 300;
			}
		));
}

function test_inputTextToField()
{
	var input = $('input', win);
	var log = $('log', win);
	var events,
		lastCount = 0;
	assert.equals('', input.value);

	actionModule.inputTextToField(input, 'string');
	assert.equals('string', input.value);
	eval('events = '+log.textContent);
	assert.equals(lastCount + ('string'.length * 3) + 1, events.length);
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
	lastCount = events.length;

	actionModule.inputTextToField(input, 'moji');
	assert.equals('moji', input.value);
	eval('events = '+log.textContent);
	assert.equals(lastCount + ('moji'.length * 3) + 1, events.length);
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
	lastCount = events.length;

	actionModule.inputTextToField(input, 'retsu', true);
	assert.equals('mojiretsu', input.value);
	eval('events = '+log.textContent);
	assert.equals(lastCount + ('retsu'.length * 3) + 1, events.length);
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
	lastCount = events.length;

	actionModule.inputTextToField(input, 'foobar', false, true);
	assert.equals('foobar', input.value);
	eval('events = '+log.textContent);
	assert.equals(lastCount+1, events.length);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);
}


function test_fireXULCommandEvent()
{
	function assertXULCommand(aTargetId)
	{
		var log = $('log', win);
		var box = utils.getBoxObjectFor($(aTargetId, win));
		var events;
		if (log.textContent)
			eval('events = '+log.textContent);
		else
			events = [];
		var lastCount = events.length;
		actionModule.fireXULCommandEvent(win, { screenX : box.screenX+5, screenY : box.screenY+5 });
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length);
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommand('button'));
	yield Do(assertXULCommand('checkbox'));
	yield Do(assertXULCommand('radio2'));

	var menu = $('menu', win);
	menu.firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommand('menuitem'));
}

function test_fireXULCommandEventOnElement()
{
	function assertXULCommandOnElement(aTargetId)
	{
		var log = $('log', win);
		var events;
		if (log.textContent)
			eval('events = '+log.textContent);
		else
			events = [];
		var lastCount = events.length;
		actionModule.fireXULCommandEventOnElement($(aTargetId, win));
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length);
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommandOnElement('button'));
	yield Do(assertXULCommandOnElement('checkbox'));
	yield Do(assertXULCommandOnElement('radio2'));

	var menu = $('menu', win);
	menu.firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandOnElement('menuitem'));
}


function test_fireXULCommandEventByMouseEvent()
{
}

function test_fireXULCommandEventByKeyEvent()
{
}
