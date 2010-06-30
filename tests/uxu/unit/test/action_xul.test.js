var topDir = baseURL+'../../../../';
utils.include('action.inc.js', 'Shift_JIS');

var isGecko18 = utils.checkPlatformVersion('1.9') < 0;

var actionModule;
var win;
var options = {
		uri      : topDir+'tests/uxu/fixtures/action.xul',
		name     : '_blank',
		features : 'chrome,all,dialog=no',
		width    : 600,
		height   : 300
	};

function setUp()
{
	actionModule = {};
	utils.include(topDir+'content/uxu/test/action.js', actionModule);
	actionModule.constructor({});
	yield Do(utils.setUpTestWindow(options));
	win = utils.getTestWindow(options);
	actionSetUp();
}

function tearDown()
{
	actionTearDown();
	utils.tearDownTestWindow(options);
}

function inPopup(aNode)
{
	return $X('ancestor-or-self::*[contain(concat(" ",local-name()," "), " popup menupopup panel tooltip ")]', aNode).singleNodeValue;
}

/* public */

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
				yield 500;
			}
		));
	yield Do(aFire(
			'menuitem-disabled',
			function() {
				popup.showPopup();
				yield 500;
			}
		));
	if (!isGecko18) {
		yield Do(aFire(
				'button-in-panel',
				function() {
					$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
					yield 500;
				}
			));
		yield Do(aFire(
				'button-in-panel-disabled',
				function() {
					$('panel', win).openPopup(win.document.documentElement, 'overlap', 0, 0, false, false);
					yield 500;
				}
			));
	}
}

function test_fireMouseEvent()
{
	function assertFire(aTargetId, aSetUpBeforeEvent)
	{
		target = $(aTargetId, win);
		rootBoxObject = utils.getBoxObjectFor(win.document.documentElement);
		var event, param;
		var events = assertEventsCount(0, win, win)

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
		param = {
			type     : 'mouseup',
			button   : 1,
			shiftKey : true,
			screenX  : boxObject.screenX+10,
			screenY  : boxObject.screenY+3
		};
		actionModule.fireMouseEvent(win, param);
		events = assertEventsCount(1, win)
		var detail = inPopup(target) ? 1 : 0 ;
		assertMouseEventAt('mouseup', 1, param.screenX, param.screenY, param, detail, events[events.length-1])

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
		param = {
			type     : 'mousedown',
			button   : 1,
			ctrlKey  : true,
			screenX  : boxObject.screenX+5,
			screenY  : boxObject.screenY+5
		};
		actionModule.fireMouseEvent(win, param);
		events = assertEventsCount(1, win)
		assertMouseEventAt('mousedown', 1, param.screenX, param.screenY, param, 1, events[events.length-1])

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
		param = {
			type    : 'click',
			button  : 2,
			ctrlKey : true,
			screenX : boxObject.screenX+5,
			screenY : boxObject.screenY+5
		};
		actionModule.fireMouseEvent(win, param);
		yield 100;
		events = assertEventsCount(3, win)
		assertMouseEventAt('mousedown', 2, param.screenX, param.screenY, param, 1, events[events.length-3])
		assertMouseEventAt('mouseup', 2, param.screenX, param.screenY, param, 1, events[events.length-2])
		assertMouseEventAt('click', 2, param.screenX, param.screenY, param, 1, events[events.length-1])
	}

	yield Do(assertMouseEventFire(assertFire));
}

function test_fireMouseEventOnElement()
{
	function assertFire(aTargetId, aSetUpBeforeEvent)
	{
		target = $(aTargetId, win);
		rootBoxObject = utils.getBoxObjectFor(win.document.documentElement);
		var event, param;
		var events = assertEventsCount(0, win)

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
		param = {
			type     : 'mouseup',
			button   : 1,
			shiftKey : true
		};
		actionModule.fireMouseEventOnElement(target, param);
		events = assertEventsCount(1, win)
		var detail = inPopup(target) ? 1 : 0 ;
		assertMouseEventOn('mouseup', 1, param, detail, events[events.length-1]);

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
		param = {
			type     : 'mousedown',
			button   : 1,
			ctrlKey  : true
		};
		actionModule.fireMouseEventOnElement(target, param);
		events = assertEventsCount(1, win)
		assertMouseEventOn('mousedown', 1, param, 1, events[events.length-1]);

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		boxObject = utils.getBoxObjectFor(target);
		param = {
			type    : 'click',
			button  : 2,
			ctrlKey : true
		};
		actionModule.fireMouseEventOnElement(target, param);
		yield 100;
		events = assertEventsCount(3, win)
		assertMouseEventOn('mousedown', 2, param, 1, events[events.length-3]);
		assertMouseEventOn('mouseup', 2, param, 1, events[events.length-2]);
		assertMouseEventOn('click', 2, param, 1, events[events.length-1]);
	}

	yield Do(assertMouseEventFire(assertFire));
}


function test_fireKeyEventOnElement()
{
	function assertFire(aTargetId, aSetUpBeforeEvent)
	{
		target = $(aTargetId, win);
		if ('focus' in target) target.focus();
		boxObject = utils.getBoxObjectFor(target);
		rootBoxObject = utils.getBoxObjectFor(win.document.documentElement);
		var event, param;
		var events = assertEventsCount(0, win)

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		param = {
			type    : 'keydown',
			keyCode : Ci.nsIDOMKeyEvent.DOM_VK_DELETE,
			ctrlKey : true
		};
		actionModule.fireKeyEventOnElement(target, param);
		events = assertEventsCount(1, win)
		assertKeyEvent('keydown', Ci.nsIDOMKeyEvent.DOM_VK_DELETE, 0, param, events[events.length-1]);

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		param = {
			type     : 'keyup',
			charCode : 'f'.charCodeAt(0),
			shiftKey : true
		};
		actionModule.fireKeyEventOnElement(target, param);
		events = assertEventsCount(1, win)
		assertKeyEvent('keyup', 0, 'f', param, events[events.length-1]);

		if (aSetUpBeforeEvent)
			yield Do(aSetUpBeforeEvent);

		param = {
			type     : 'keypress',
			charCode : 'c'.charCodeAt(0),
			ctrlKey  : true,
			shiftKey : true
		};
		actionModule.fireKeyEventOnElement(target, param);
		yield 100;
		events = assertEventsCount(3, win)
		assertKeyEvent('keydown', 0, 'c', param, events[events.length-3]);
		assertKeyEvent('keyup', 0, 'c', param, events[events.length-2]);
		assertKeyEvent('keypress', 0, 'c', param, events[events.length-1]);
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
	var events;
	assert.equals('', input.value);

	var isGecko192 = utils.compareVersions(utils.platformVersion, '>=', '1.9.2');
	// -Gecko 1.9:
	//   keydown, keyup, keypress
	// Gecko 1.9.2-:
	//   keydown, keyup, keypress, input
	var eventsCount = isGecko192 ? 4 : 3 ;
	function assertStringInput(aInputString, aFinalString)
	{
		var append = aFinalString && aInputString != aFinalString;
		actionModule.inputTextToField(input, aInputString, append);
		assert.equals(aFinalString || aInputString, input.value);
		events = assertEventsCount((aInputString.length * eventsCount) + 1, win)
		if (isGecko192) {
			assert.equals(
				{ type : 'keypress', target : 'input',
				  keyCode : 0, charCode : aInputString.charCodeAt(aInputString.length-1),
				  altKey : false, ctrlKey : false, metaKey : false, shiftKey : false },
				events[events.length-3]
			);
			assert.equals(
				{ type : 'input', target : 'input' },
				events[events.length-2]
			);
		}
		else {
			assert.equals(
				{ type : 'keypress', target : 'input',
				  keyCode : 0, charCode : aInputString.charCodeAt(aInputString.length-1).charCodeAt(0),
				  altKey : false, ctrlKey : false, metaKey : false, shiftKey : false },
				events[events.length-2]
			);
		}
		assert.equals(
			{ type : 'input', target : 'input' },
			events[events.length-1]
		);
	}

	assertStringInput('string');
	assertStringInput('moji');
	assertStringInput('retsu', 'mojiretsu');

	actionModule.inputTextToField(input, 'foobar', false, true);
	assert.equals('foobar', input.value);
	events = assertEventsCount(1, win)
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
		var box = utils.getBoxObjectFor($(aTargetId, win));
		var events = assertEventsCount(0, win)
		var retVal = actionModule.fireXULCommandEvent(win, { screenX : box.screenX+5, screenY : box.screenY+5 });
		assert.isTrue(retVal);
		assert.notEquals('', log.textContent);
		events = assertEventsCount(1, win)
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	function assertNotFire(aTargetId)
	{
		var box = utils.getBoxObjectFor($(aTargetId, win));
		var retVal = actionModule.fireXULCommandEvent(win, { screenX : box.screenX+5, screenY : box.screenY+5 });
		assert.isFalse(retVal);
		events = assertEventsCount(0, win)
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, false));
}

test_fireXULCommandEventOnElement.shouldSkip = isGecko18;
function test_fireXULCommandEventOnElement()
{
	function assertFire(aTargetId)
	{
		var events = assertEventsCount(0, win)
		var retVal = actionModule.fireXULCommandEventOnElement($(aTargetId, win));
		assert.isTrue(retVal);
		events = assertEventsCount(1, win)
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	function assertNotFire(aTargetId)
	{
		var retVal = actionModule.fireXULCommandEventOnElement($(aTargetId, win));
		assert.isFalse(retVal);
		var events = assertEventsCount(0, win)
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, false));
}

test_fireXULCommandEventByMouseEvent.shouldSkip = isGecko18;
function test_fireXULCommandEventByMouseEvent()
{
	function assertFire(aTargetId)
	{
		target = $(aTargetId, win);
		var event, param;
		var events = assertEventsCount(0, win)

		boxObject = utils.getBoxObjectFor(target);
		rootBoxObject = utils.getBoxObjectFor(win.document.documentElement);
		param = {
			type     : 'click',
			button   : 0
		};
		actionModule.fireMouseEventOnElement(target, param);
		events = assertEventsCount(4, win)
		assertMouseEventOn('mousedown', 0, param, 1, events[events.length-4]);
		assertMouseEventOn('mouseup', 0, param, 1, events[events.length-3]);
		assertMouseEventOn('click', 0, param, 1, events[events.length-2]);
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	function assertNotFire(aTargetId)
	{
		target = $(aTargetId, win);
		var event, param;
		var events = assertEventsCount(0, win)

		boxObject = utils.getBoxObjectFor(target);
		rootBoxObject = utils.getBoxObjectFor(win.document.documentElement);
		param = {
			type     : 'click',
			button   : 0
		};
		actionModule.fireMouseEventOnElement(target, param);
		events = assertEventsCount(3, win)
		assertMouseEventOn('mousedown', 0, param, 1, events[events.length-3]);
		assertMouseEventOn('mouseup', 0, param, 1, events[events.length-2]);
		assertMouseEventOn('click', 0, param, 1, events[events.length-1]);
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, true));
}

test_fireXULCommandEventByKeyEvent.shouldSkip = isGecko18;
function test_fireXULCommandEventByKeyEvent()
{
	function assertFire(aTargetId, aKeyEventsShouldBeIgnored)
	{
		target = $(aTargetId, win);
		if ('focus' in target) target.focus();
		var event, param;
		var events = assertEventsCount(0, win)

		param = {
			type     : 'keypress',
			keyCode  : Ci.nsIDOMKeyEvent.DOM_VK_RETURN
		};
		actionModule.fireKeyEventOnElement(target, param);
		yield 100;
		if (aKeyEventsShouldBeIgnored) {
			events = assertEventsCount(1, win)
		}
		else {
			events = assertEventsCount(4, win)
			assertKeyEvent('keydown', param.keyCode, 0, param, events[events.length-4]);
			assertKeyEvent('keyup', param.keyCode, 0, param, events[events.length-3]);
			assertKeyEvent('keypress', param.keyCode, 0, param, events[events.length-2]);
		}
		assert.equals(
			{ type : 'command', target : aTargetId },
			events[events.length-1]
		);
	}

	function assertNotFire(aTargetId, aKeyEventsShouldBeIgnored)
	{
		target = $(aTargetId, win);
		if ('focus' in target) target.focus();
		var event, param;
		var events = assertEventsCount(0, win)

		param = {
			type     : 'keypress',
			keyCode  : Ci.nsIDOMKeyEvent.DOM_VK_RETURN
		};
		actionModule.fireKeyEventOnElement(target, param);
		yield 100;
		events = assertEventsCount(0, win)
	}

	yield Do(assertXULCommandEventFireOrNotFire(assertFire, assertNotFire, false));
}
