var topDir = baseURL+'../../../../';

var isGecko18 = utils.checkAppVersion('3.0') < 0;

var actionModule;
var win;
var options = {
		uri      : topDir+'tests/uxu/fixtures/action.xul',
		name     : '_blank',
		features : 'chrome,all,dialog=no',
		width    : 500,
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

function assertMouseEventFire(aFire, aToolbarButtonMenuShouldBeOpened)
{
	var popup;

	yield Do(aFire('label'));
	yield Do(aFire('button'));
	yield Do(aFire('button-disabled'));

	yield Do(aFire('toolbarbutton'));
	yield Do(aFire('toolbarbutton-disabled'));
	yield Do(aFire('toolbarbutton-menu'));
	yield 300;
	popup = $('toolbarbutton-menu', win).firstChild;
	if (aToolbarButtonMenuShouldBeOpened) {
		if (popup.state)
			assert.equals('open', popup.state);
		else
			assert.notEquals([0, 0], [popup.boxObject.width, popup.boxObject.height]);
		popup.hidePopup();
	}
	else {
		if (popup.state)
			assert.equals('closed', popup.state);
		else
			assert.equals([0, 0], [popup.boxObject.width, popup.boxObject.height]);
	}
	yield Do(aFire('toolbarbutton-menu-button'));
	yield Do(aFire('toolbarbutton-menu-button-disabled'));

	yield Do(aFire('checkbox'));
	yield Do(aFire('checkbox-disabled'));
	yield Do(aFire('radio2'));
	yield Do(aFire('radio3'));

	popup = $('menu', win).firstChild;
	yield Do(aFire(
			'menuitem',
			function() {
				popup.showPopup();
				yield 300;
			}
		));
	yield Do(aFire(
			'menuitem-disabled',
			function() {
				popup.showPopup();
				yield 300;
			}
		));
	if (!isGecko18) {
		yield Do(aFire(
				'button-in-panel',
				function() {
					$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
					yield 300;
				}
			));
		yield Do(aFire(
				'button-in-panel-disabled',
				function() {
					$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
					yield 300;
				}
			));
	}
}

function test_fireMouseEvent()
{
	function assertFire(aTargetId, aSetUpBeforeEvent)
	{
		var target = $(aTargetId, win);
		var log = $('log', win);
		var events, event, param;
		var lastCount = 0;

		if (log.textContent) {
			eval('events = '+log.textContent);
			lastCount = events.length;
		}

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
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
		event.target = aTargetId;
		assert.equals(event, events[events.length-1]);
		lastCount = events.length;

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);


		boxObject = utils.getBoxObjectFor(target);
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
		event.target = aTargetId;
		assert.equals(event, events[events.length-1]);
		lastCount = events.length;

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
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
		event.target = aTargetId;
		event.type = 'mousedown';
		assert.equals(event, events[events.length-3]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'mouseup';
		assert.equals(event, events[events.length-2]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		assert.equals(event, events[events.length-1]);
	}

	yield Do(assertMouseEventFire(assertFire));
}

function test_fireMouseEventOnElement()
{
	function assertFire(aTargetId, aSetUpBeforeEvent)
	{
		var target = $(aTargetId, win);
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
		actionModule.fireMouseEventOnElement(target, param);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length, inspect(events));

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
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
		actionModule.fireMouseEventOnElement(target, param);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length, inspect(events));

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
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
		actionModule.fireMouseEventOnElement(target, param);
		yield 100;
		eval('events = '+log.textContent);
		assert.equals(lastCount+3, events.length, inspect(events));

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'mousedown';
		assert.equals(event, events[events.length-3]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'mouseup';
		assert.equals(event, events[events.length-2]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		assert.equals(event, events[events.length-1]);
	}

	yield Do(assertMouseEventFire(assertFire));
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
	function assertFire(aTargetId, aSetUpBeforeEvent)
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

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		param = {
			type    : 'keydown',
			keyCode : Ci.nsIDOMKeyEvent.DOM_VK_DELETE,
			ctrlKey : true
		};
		actionModule.fireKeyEventOnElement(target, param);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length);

		event = generateKeyEventLogFromParams(param);
		event.target = aTargetId;
		assert.equals(event, events[events.length-1]);
		lastCount = events.length;


		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		param = {
			type     : 'keyup',
			charCode : 'f'.charCodeAt(0),
			shiftKey : true
		};
		actionModule.fireKeyEventOnElement(target, param);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length, inspect(events));

		event = generateKeyEventLogFromParams(param);
		event.target = aTargetId;
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
		actionModule.fireKeyEventOnElement(target, param);
		yield 100;
		eval('events = '+log.textContent);
		assert.equals(lastCount+3, events.length, inspect(events));

		param.type = 'keydown';
		event = generateKeyEventLogFromParams(param);
		event.target = aTargetId;
		assert.equals(event, events[events.length-3]);

		param.type = 'keyup';
		event = generateKeyEventLogFromParams(param);
		event.target = aTargetId;
		assert.equals(event, events[events.length-2]);

		param.type = 'keypress';
		event = generateKeyEventLogFromParams(param);
		event.target = aTargetId;
		assert.equals(event, events[events.length-1]);
	}

	yield Do(assertFire('button'));
	yield Do(assertFire('toolbarbutton'));
	yield Do(assertFire('toolbarbutton-menu-button'));
// menuitemはEnter以外のすべてのイベントを無視する模様
//	yield Do(assertFire(
//			'menuitem',
//			function() {
//				$('menu', win).firstChild.showPopup();
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

function assertXULCommandEventFireOrNotFire(aFire, aNotFire, aToolbarButtonMenuShouldBeOpened)
{
	var popup;

	yield Do(aNotFire('label'));
	yield Do(aFire('button'));
	yield Do(aNotFire('button-disabled'));

	yield Do(aFire('toolbarbutton'));
	yield Do(aNotFire('toolbarbutton-disabled'));
	yield Do(aNotFire('toolbarbutton-menu'));
	yield 300;
	popup = $('toolbarbutton-menu', win).firstChild;
	if (aToolbarButtonMenuShouldBeOpened) {
		if (popup.state)
			assert.equals('open', popup.state);
		else
			assert.notEquals([0, 0], [popup.boxObject.width, popup.boxObject.height]);
		popup.hidePopup();
	}
	else {
		if (popup.state)
			assert.equals('closed', popup.state);
		else
			assert.equals([0, 0], [popup.boxObject.width, popup.boxObject.height]);
	}
	yield Do(aFire('toolbarbutton-menu-button'));
	yield Do(aNotFire('toolbarbutton-menu-button-disabled'));

	yield Do(aFire('checkbox'));
	yield Do(aNotFire('checkbox-disabled'));
	yield Do(aFire('radio2'));
	yield Do(aNotFire('radio3'));

	popup = $('menu', win).firstChild;
	popup.showPopup();
	yield 300;
	yield Do(aFire('menuitem', true));
	yield 100;
	if (popup.state)
		assert.equals('closed', popup.state);
	else
		assert.equals([0, 0], [popup.boxObject.width, popup.boxObject.height]);

	popup.showPopup();
	yield 300;
	yield Do(aNotFire('menuitem-disabled', true));
	yield 100;
	if (popup.state)
		assert.equals('open', popup.state);
	else
		assert.notEquals([0, 0], [popup.boxObject.width, popup.boxObject.height]);
	popup.hidePopup();

	if (!isGecko18) {
		popup = $('panel', win);
		popup.openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
		yield 300;
		yield Do(aFire('button-in-panel'));
//		if (popup.state)
//			assert.equals('close', popup.state);
//		else
//			assert.equals([0, 0], [popup.boxObject.width, popup.boxObject.height]);

		popup.openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
		yield 300;
		yield Do(aNotFire('button-in-panel-disabled'));
//		if (popup.state)
//			assert.equals('open', popup.state);
//		else
//			assert.notEquals([0, 0], [popup.boxObject.width, popup.boxObject.height]);
		popup.hidePopup();
	}
}

test_fireXULCommandEvent.shouldSkip = isGecko18;
function test_fireXULCommandEvent()
{
	function assertFire(aTargetId)
	{
		var log = $('log', win);
		var box = utils.getBoxObjectFor($(aTargetId, win));
		var events;
		if (log.textContent)
			eval('events = '+log.textContent);
		else
			events = [];
		var lastCount = events.length;
		var retVal = actionModule.fireXULCommandEvent(win, { screenX : box.screenX+5, screenY : box.screenY+5 });
		assert.isTrue(retVal);
		assert.notEquals('', log.textContent);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length, inspect(events));
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	function assertNotFire(aTargetId)
	{
		var log = $('log', win);
		var box = utils.getBoxObjectFor($(aTargetId, win));
		var lastResult = log.textContent;
		var retVal = actionModule.fireXULCommandEvent(win, { screenX : box.screenX+5, screenY : box.screenY+5 });
		assert.isFalse(retVal);
		assert.equals(lastResult, log.textContent);
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, false));
}

test_fireXULCommandEventOnElement.shouldSkip = isGecko18;
function test_fireXULCommandEventOnElement()
{
	function assertFire(aTargetId)
	{
		var log = $('log', win);
		var events;
		if (log.textContent)
			eval('events = '+log.textContent);
		else
			events = [];
		var lastCount = events.length;
		var retVal = actionModule.fireXULCommandEventOnElement($(aTargetId, win));
		assert.isTrue(retVal);
		assert.notEquals('', log.textContent);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length, inspect(events));
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	function assertNotFire(aTargetId)
	{
		var log = $('log', win);
		var lastResult = log.textContent;
		var retVal = actionModule.fireXULCommandEventOnElement($(aTargetId, win));
		assert.isFalse(retVal);
		assert.equals(lastResult, log.textContent);
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, false));
}

test_fireXULCommandEventByMouseEvent.shouldSkip = isGecko18;
function test_fireXULCommandEventByMouseEvent()
{
	function assertFire(aTargetId)
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

	function assertNotFire(aTargetId)
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
		assert.equals(lastCount+3, events.length, inspect(events));

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'mousedown';
		assert.equals(event, events[events.length-3]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'mouseup';
		assert.equals(event, events[events.length-2]);

		event = generateMouseEventLogFromParams(param);
		event.target = aTargetId;
		event.type = 'click';
		assert.equals(event, events[events.length-1]);
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, true));
}

test_fireXULCommandEventByKeyEvent.shouldSkip = isGecko18;
function test_fireXULCommandEventByKeyEvent()
{
	function assertFire(aTargetId, aKeyEventsShouldBeIgnored)
	{
		var target = $(aTargetId, win);
		if ('focus' in target) target.focus();
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
		assert.notEquals('', log.textContent);
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

	function assertNotFire(aTargetId, aKeyEventsShouldBeIgnored)
	{
		var target = $(aTargetId, win);
		if ('focus' in target) target.focus();
		var log = $('log', win);
		var events, event, param;
		var lastCount = 0;
		var lastResult = log.textContent;

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
		if (log.textContent) {
			eval('events = '+log.textContent);
			assert.notEquals(
				{ type : 'command', target : aTargetId },
				events[events.length-1]
			);
		}
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, false));
}
