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

function test_fireMouseEvent()
{
	function assertMouseEvent(aTargetId, aSetUpBeforeEvent)
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

	yield Do(assertMouseEvent('button'));
	yield Do(assertMouseEvent('toolbarbutton'));
	yield Do(assertMouseEvent('toolbarbutton-menu-button'));
	yield Do(assertMouseEvent('checkbox'));
	yield Do(assertMouseEvent('radio2'));
	yield Do(assertMouseEvent(
			'menuitem',
			function() {
				$('menu', win).firstChild.showPopup();
				yield 300;
			}
		));
	if (!isGecko18) {
		yield Do(assertMouseEvent(
				'button-in-panel',
				function() {
					$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
					yield 300;
				}
			));
	}
}

function test_fireMouseEventOnElement()
{
	function assertMouseEventOnElement(aTargetId, aSetUpBeforeEvent)
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

	yield Do(assertMouseEventOnElement('button'));
	yield Do(assertMouseEventOnElement('toolbarbutton'));
	yield Do(assertMouseEventOnElement('toolbarbutton-menu-button'));
	yield Do(assertMouseEventOnElement('checkbox'));
	yield Do(assertMouseEventOnElement('radio2'));
	yield Do(assertMouseEventOnElement(
			'menuitem',
			function() {
				$('menu', win).firstChild.showPopup();
				yield 300;
			}
		));
	if (!isGecko18) {
		yield Do(assertMouseEventOnElement(
				'button-in-panel',
				function() {
					$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
					yield 300;
				}
			));
	}
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
	function assertKeyEventOnElement(aTargetId, aSetUpBeforeEvent)
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

	yield Do(assertKeyEventOnElement('button'));
	yield Do(assertKeyEventOnElement('toolbarbutton'));
	yield Do(assertKeyEventOnElement('toolbarbutton-menu-button'));
// menuitemはEnter以外のすべてのイベントを無視する模様
//	yield Do(assertKeyEventOnElement(
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

test_fireXULCommandEvent.shouldSkip = isGecko18;
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
		assert.notEquals('', log.textContent);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length, inspect(events));
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommandEvent('button'));
	yield Do(assertXULCommandEvent('toolbarbutton'));
	yield Do(assertXULCommandEvent('toolbarbutton-menu-button'));
	yield Do(assertXULCommandEvent('checkbox'));
	yield Do(assertXULCommandEvent('radio2'));

	$('menu', win).firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEvent('menuitem'));

	if (!isGecko18) {
		$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
		yield 300;
		yield Do(assertXULCommandEvent('button-in-panel'));
	}
}

test_fireXULCommandEventOnElement.shouldSkip = isGecko18;
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
		assert.notEquals('', log.textContent);
		eval('events = '+log.textContent);
		assert.equals(lastCount+1, events.length, inspect(events));
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	yield Do(assertXULCommandEventOnElement('button'));
	yield Do(assertXULCommandEventOnElement('toolbarbutton'));
	yield Do(assertXULCommandEventOnElement('checkbox'));
	yield Do(assertXULCommandEventOnElement('radio2'));

	$('menu', win).firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEventOnElement('menuitem'));

	if (!isGecko18) {
		$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
		yield 300;
		yield Do(assertXULCommandEventOnElement('button-in-panel'));
	}
}

test_fireXULCommandEventByMouseEvent.shouldSkip = isGecko18;
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
	yield Do(assertXULCommandEventByMouseEvent('toolbarbutton'));
	yield Do(assertXULCommandEventByMouseEvent('toolbarbutton-menu-button'));
	yield Do(assertXULCommandEventByMouseEvent('checkbox'));
	yield Do(assertXULCommandEventByMouseEvent('radio2'));

	$('menu', win).firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEventByMouseEvent('menuitem'));

	if (!isGecko18) {
		$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
		yield 300;
		yield Do(assertXULCommandEventByMouseEvent('button-in-panel'));
	}
}

test_fireXULCommandEventByKeyEvent.shouldSkip = isGecko18;
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
	yield Do(assertXULCommandEventByKeyEvent('toolbarbutton'));
	yield Do(assertXULCommandEventByKeyEvent('toolbarbutton-menu-button'));
	yield Do(assertXULCommandEventByKeyEvent('checkbox'));
	yield Do(assertXULCommandEventByKeyEvent('radio2'));

	$('menu', win).firstChild.showPopup();
	yield 300;
	yield Do(assertXULCommandEventByKeyEvent('menuitem', true));

	if (!isGecko18) {
		$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
		yield 300;
		yield Do(assertXULCommandEventByKeyEvent('button-in-panel'));
	}
}
