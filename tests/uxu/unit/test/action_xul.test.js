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

function test_fireMouseEvent()
{
	function assertMouseEvent(aTarget, aSetUpBeforeEvent)
	{
		var log = $('log', win);
		var events, event, param;
		var lastCount = 0;

		if (log.textContent) {
			eval('events = '+log.textContent);
			lastCount = events.length;
		}

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
		assert.equals(lastCount+1, events.length, inspect(events));

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
		assert.equals(lastCount+1, events.length, inspect(events));

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
		assert.equals(lastCount+3, events.length, inspect(events));

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

	yield Do(assertMouseEvent(
			$('button', win)
		));
	yield Do(assertMouseEvent(
			$('checkbox', win)
		));
	yield Do(assertMouseEvent(
			$('radio2', win)
		));
	var menu = $('menu', win);
	yield Do(assertMouseEvent(
			$('menuitem', win),
			function() {
				menu.firstChild.showPopup();
				yield 300;
			}
		));
}

function test_fireMouseEventOnElement()
{
	function assertMouseEventOnElement(aTarget, aSetUpBeforeEvent)
	{
		var log = $('log', win);
		var events, event, param;
		var lastCount = 0;

		if (log.textContent) {
			eval('events = '+log.textContent);
			lastCount = events.length;
		}

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
		assert.equals(lastCount+1, events.length, inspect(events));

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
		assert.equals(lastCount+1, events.length, inspect(events));

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
		assert.equals(lastCount+3, events.length, inspect(events));

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

	yield Do(assertMouseEventOnElement(
			$('button', win)
		));
	yield Do(assertMouseEventOnElement(
			$('checkbox', win)
		));
	yield Do(assertMouseEventOnElement(
			$('radio2', win)
		));
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

function test_fireKeyEventOnElement()
{
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
		assert.equals(lastCount+1, events.length, inspect(events));

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
		assert.equals(lastCount+3, events.length, inspect(events));

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

	yield Do(assertKeyEventOnElement(
			$('button', win)
		));
// menuitemはEnter以外のすべてのイベントを無視する模様
//	var menu = $('menu', win);
//	yield Do(assertKeyEventOnElement(
//			$('menuitem', win),
//			function() {
//				menu.firstChild.showPopup();
//				yield 300;
//			}
//		));
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
	assert.equals(lastCount + ('string'.length * 3) + 1, events.length, inspect(events));
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
	assert.equals(lastCount + ('moji'.length * 3) + 1, events.length, inspect(events));
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
	assert.equals(lastCount + ('retsu'.length * 3) + 1, events.length, inspect(events));
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
	assert.equals(lastCount+1, events.length, inspect(events));
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);
}

function test_fireXULCommandEvent()
{
	function assertXULCommandEvent(aTargetId)
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
		assert.equals(lastCount+1, events.length, inspect(events));
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommandEvent('button'));
	yield Do(assertXULCommandEvent('checkbox'));
	yield Do(assertXULCommandEvent('radio2'));

	var menu = $('menu', win);
	menu.firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEvent('menuitem'));
}

function test_fireXULCommandEventOnElement()
{
	function assertXULCommandEventOnElement(aTargetId)
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
		assert.equals(lastCount+1, events.length, inspect(events));
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommandEventOnElement('button'));
	yield Do(assertXULCommandEventOnElement('checkbox'));
	yield Do(assertXULCommandEventOnElement('radio2'));

	var menu = $('menu', win);
	menu.firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEventOnElement('menuitem'));
}

function test_fireXULCommandEventByMouseEvent()
{
	function assertXULCommandEventByMouseEvent(aTargetId)
	{
		var log = $('log', win);
		var events, event, param;
		var lastCount = 0;

		if (log.textContent) {
			eval('events = '+log.textContent);
			lastCount = events.length;
		}

		param = {
			type     : 'click',
			button   : 0,
			detail   : 1
		}
		actionModule.fireMouseEventOnElement($(aTargetId, win), param);
		eval('events = '+log.textContent);
		assert.equals(lastCount+4, events.length, inspect(events));

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'mousedown';
		assert.equals(event, events[events.length-4]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'mouseup';
		assert.equals(event, events[events.length-3]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'click';
		assert.equals(event, events[events.length-2]);

		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommandEventByMouseEvent('button'));
	yield Do(assertXULCommandEventByMouseEvent('checkbox'));
	yield Do(assertXULCommandEventByMouseEvent('radio2'));

	var menu = $('menu', win);
	menu.firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEventByMouseEvent('menuitem'));
}

function test_fireXULCommandEventByKeyEvent()
{
	function assertXULCommandEventByKeyEvent(aTargetId, aKeyEventsShouldBeIgnored)
	{
		var target = $(aTargetId, win);
		if ('focus' in target) target.focus();
		var boxObject = utils.getBoxObjectFor(target);
		var log = $('log', win);
		var events, event, param;
		var lastCount = 0;

		if (log.textContent) {
			eval('events = '+log.textContent);
			lastCount = events.length;
		}

		param = {
			type     : 'keypress',
			keyCode  : Ci.nsIDOMKeyEvent.DOM_VK_RETURN
		}
		actionModule.fireKeyEventOnElement(target, param);
		yield 100;
		eval('events = '+log.textContent);
		if (aKeyEventsShouldBeIgnored) {
			assert.equals(lastCount+1, events.length, inspect(events));
		}
		else {
			assert.equals(lastCount+4, events.length, inspect(events));

			param.type = 'keydown';
			event = generateKeyEventLogFromParams(param);
			event.target = aTargetId;
			assert.equals(event, events[events.length-4]);

			param.type = 'keyup';
			event = generateKeyEventLogFromParams(param);
			event.target = aTargetId;
			assert.equals(event, events[events.length-3]);

			param.type = 'keypress';
			event = generateKeyEventLogFromParams(param);
			event.target = aTargetId;
			assert.equals(event, events[events.length-2]);
		}

		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommandEventByKeyEvent('button'));
	yield Do(assertXULCommandEventByKeyEvent('checkbox'));
	yield Do(assertXULCommandEventByKeyEvent('radio2'));

	var menu = $('menu', win);
	menu.firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEventByKeyEvent('menuitem', true));
}
