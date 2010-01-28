var topDir = baseURL+'../../../../';
utils.include('action.inc.js', 'Shift_JIS');

var actionModule;

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



/* mouse events */

function assertAtArgs(aMethod, aType, aButton, aX, aY, aModifiers, aArgs)
{
	if (!aModifiers) aModifiers = {};
	aMethod.apply(actionModule, aArgs);
	var events;
	switch (aType)
	{
		case 'mousedown':
			events = assertEventsCount(1);
			assertMouseEventAt(aType, aButton, aX, aY, aModifiers, 1, events[events.length-1]);
			break;
		case 'mouseup':
			var detail;
			events = assertEventsCount(1);
			assertMouseEventAt(aType, aButton, aX, aY, aModifiers, 0, events[events.length-1]);
			break;
		case 'click':
			events = assertEventsCount(3);
			assertMouseEventAt('mousedown', aButton, aX, aY, aModifiers, 1, events[events.length-3]);
			assertMouseEventAt('mouseup', aButton, aX, aY, aModifiers, 1, events[events.length-2]);
			assertMouseEventAt('click', aButton, aX, aY, aModifiers, 1, events[events.length-1]);
			break;
		case 'dblclick':
			events = assertEventsCount(7);
			assertMouseEventAt('mousedown', aButton, aX, aY, aModifiers, 1, events[events.length-7]);
			assertMouseEventAt('mouseup', aButton, aX, aY, aModifiers, 1, events[events.length-6]);
			assertMouseEventAt('click', aButton, aX, aY, aModifiers, 1, events[events.length-5]);
			assertMouseEventAt('mousedown', aButton, aX, aY, aModifiers, 2, events[events.length-4]);
			assertMouseEventAt('mouseup', aButton, aX, aY, aModifiers, 2, events[events.length-3]);
			assertMouseEventAt('click', aButton, aX, aY, aModifiers, 2, events[events.length-2]);
			assertMouseEventAt('dblclick', aButton, aX, aY, aModifiers, 2, events[events.length-1]);
			break;
	}
}

function assertOnArgs(aMethod, aType, aButton, aModifiers, aArgs)
{
	if (!aModifiers) aModifiers = {};
	aMethod.apply(actionModule, aArgs);
	var events;
	switch (aType)
	{
		case 'mousedown':
			events = assertEventsCount(1);
			assertMouseEventOn(aType, aButton, aModifiers, 1, events[events.length-1]);
			break;
		case 'mouseup':
			var detail;
			events = assertEventsCount(1);
			assertMouseEventOn(aType, aButton, aModifiers, 0, events[events.length-1]);
			break;
		case 'click':
			events = assertEventsCount(3);
			assertMouseEventOn('mousedown', aButton, aModifiers, 1, events[events.length-3]);
			assertMouseEventOn('mouseup', aButton, aModifiers, 1, events[events.length-2]);
			assertMouseEventOn('click', aButton, aModifiers, 1, events[events.length-1]);
			break;
		case 'dblclick':
			events = assertEventsCount(7);
			assertMouseEventOn('mousedown', aButton, aModifiers, 1, events[events.length-7]);
			assertMouseEventOn('mouseup', aButton, aModifiers, 1, events[events.length-6]);
			assertMouseEventOn('click', aButton, aModifiers, 1, events[events.length-5]);
			assertMouseEventOn('mousedown', aButton, aModifiers, 2, events[events.length-4]);
			assertMouseEventOn('mouseup', aButton, aModifiers, 2, events[events.length-3]);
			assertMouseEventOn('click', aButton, aModifiers, 2, events[events.length-2]);
			assertMouseEventOn('dblclick', aButton, aModifiers, 2, events[events.length-1]);
			break;
	}
}

test_mouseEventAt.parameters = [
	{ type : 'mousedown', method : 'mousedownAt', button : 0 },
	{ type : 'mousedown', method : 'middleMousedownAt', button : 1 },
	{ type : 'mousedown', method : 'rightMousedownAt', button : 2 },
	{ type : 'mouseup', method : 'mouseupAt', button : 0 },
	{ type : 'mouseup', method : 'middleMouseupAt', button : 1 },
	{ type : 'mouseup', method : 'rightMouseupAt', button : 2 },
	{ type : 'click', method : 'clickAt', button : 0 },
	{ type : 'click', method : 'middleClickAt', button : 1 },
	{ type : 'click', method : 'rightClickAt', button : 2 },
	{ type : 'dblclick', method : 'dblclickAt', button : 0 },
	{ type : 'dblclick', method : 'middleDblclickAt', button : 1 },
	{ type : 'dblclick', method : 'rightDblclickAt', button : 2 }
];
function test_mouseEventAt(aParameter)
{
	utils.setPref('nglayout.events.dispatchLeftClickOnly', false);
	utils.setPref('general.autoScroll', false);
	target = $('clickable-box');
	boxObject = utils.getBoxObjectFor(target);
	lastCount = 0;

	var x = boxObject.x;
	var y = boxObject.y;
	var screenX = boxObject.screenX;
	var screenY = boxObject.screenY;

	yield Do(assertAtArgs(actionModule[aParameter.method],
	                      aParameter.type, aParameter.button,
	                      screenX+5, screenY+5, null,
	                      [content, x+5, y+5]));
	yield Do(assertAtArgs(actionModule[aParameter.method],
	                      aParameter.type, aParameter.button,
	                      screenX+8, screenY+8, { ctrlKey : true },
	                      [content, x+8, y+8, { ctrlKey : true }]));
	yield Do(assertAtArgs(actionModule[aParameter.method],
	                      aParameter.type, aParameter.button,
	                      screenX+10, screenY+10, { shiftKey : true, altKey : true },
	                      [content, { shiftKey : true, altKey : true }, x+10, y+10]));
	yield Do(assertAtArgs(actionModule[aParameter.method],
	                      aParameter.type, aParameter.button,
	                      screenX+15, screenY+15, null,
	                      [screenX+15, screenY+15]));
}

test_mouseEventOn.parameters = [
	{ type : 'mousedown', method : 'mousedownOn', button : 0 },
	{ type : 'mousedown', method : 'middleMousedownOn', button : 1 },
	{ type : 'mousedown', method : 'rightMousedownOn', button : 2 },
	{ type : 'mouseup', method : 'mouseupOn', button : 0 },
	{ type : 'mouseup', method : 'middleMouseupOn', button : 1 },
	{ type : 'mouseup', method : 'rightMouseupOn', button : 2 },
	{ type : 'click', method : 'clickOn', button : 0 },
	{ type : 'click', method : 'middleClickOn', button : 1 },
	{ type : 'click', method : 'rightClickOn', button : 2 },
	{ type : 'dblclick', method : 'dblclickOn', button : 0 },
	{ type : 'dblclick', method : 'middleDblclickOn', button : 1 },
	{ type : 'dblclick', method : 'rightDblclickOn', button : 2 }
];
function test_mouseEventOn(aParameter)
{
	utils.setPref('nglayout.events.dispatchLeftClickOnly', false);
	utils.setPref('general.autoScroll', false);
	target = $('clickable-box');
	boxObject = utils.getBoxObjectFor(target);
	lastCount = 0;

	yield Do(assertOnArgs(actionModule[aParameter.method],
	                      aParameter.type, aParameter.button, null,
	                      [target]));
	yield Do(assertOnArgs(actionModule[aParameter.method],
	                      aParameter.type, aParameter.button, { ctrlKey : true },
	                      [target, { ctrlKey : true }]));
	yield Do(assertOnArgs(actionModule[aParameter.method],
	                      aParameter.type, aParameter.button, { shiftKey : true, altKey : true },
	                      [{ shiftKey : true, altKey : true }, target]));
}


/* key events */

function test_keypressOn()
{
	target = $('clickable-button');
	target.focus();
	var events;

	var modifiers = { ctrlKey : true, shiftKey : false };

	actionModule.keypressOn(target, 'c', modifiers);
	yield 100;
	events = assertEventsCount(3);
	assertKeyEvent('keydown', 0, 'c', modifiers, events[events.length-3]);
	assertKeyEvent('keyup', 0, 'c', modifiers, events[events.length-2]);
	assertKeyEvent('keypress', 0, 'c', modifiers, events[events.length-1]);

	var enter = Ci.nsIDOMKeyEvent.DOM_VK_ENTER;
	modifiers = {};

	actionModule.keypressOn(target, enter, modifiers);
	yield 100;
	events = assertEventsCount(3);
	assertKeyEvent('keydown', enter, 0, modifiers, events[events.length-3]);
	assertKeyEvent('keyup', enter, 0, modifiers,  events[events.length-2]);
	assertKeyEvent('keypress', enter, 0, modifiers, events[events.length-1]);

	modifiers = { altKey : true };

	actionModule.keypressOn(target, 'enter', modifiers);
	yield 100;
	events = assertEventsCount(3);
	assertKeyEvent('keydown', enter, 0, modifiers, events[events.length-3]);
	assertKeyEvent('keyup', enter, 0, modifiers, events[events.length-2]);
	assertKeyEvent('keypress', enter, 0, modifiers, events[events.length-1]);
}

function test_keydownOn()
{
	target = $('clickable-button');
	target.focus();
	var events;

	var modifiers = { ctrlKey : true, shiftKey : false };

	actionModule.keydownOn(target, 'c', modifiers);
	yield 100;
	events = assertEventsCount(1);
	assertKeyEvent('keydown', 0, 'c', modifiers, events[events.length-1]);

	var enter = Ci.nsIDOMKeyEvent.DOM_VK_ENTER;
	modifiers = {};

	actionModule.keydownOn(target, enter, modifiers);
	yield 100;
	events = assertEventsCount(1);
	assertKeyEvent('keydown', enter, 0, modifiers, events[events.length-1]);

	modifiers = { altKey : true };

	actionModule.keydownOn(target, 'enter', modifiers);
	yield 100;
	events = assertEventsCount(1);
	assertKeyEvent('keydown', enter, 0, modifiers, events[events.length-1]);
}

function test_keyupOn()
{
	target = $('clickable-button');
	target.focus();
	var events;

	var modifiers = { ctrlKey : true, shiftKey : false };

	actionModule.keyupOn(target, 'c', modifiers);
	yield 100;
	events = assertEventsCount(1);
	assertKeyEvent('keyup', 0, 'c', modifiers, events[events.length-1]);


	var enter = Ci.nsIDOMKeyEvent.DOM_VK_ENTER;
	modifiers = {};

	actionModule.keyupOn(target, enter, modifiers);
	yield 100;
	events = assertEventsCount(1);
	assertKeyEvent('keyup', enter, 0, modifiers, events[events.length-1]);


	modifiers = { altKey : true };

	actionModule.keyupOn(target, 'enter', modifiers);
	yield 100;
	events = assertEventsCount(1);
	assertKeyEvent('keyup', enter, 0, modifiers, events[events.length-1]);
}


/* text input */

function assertInput(aInputString, aFinalString)
{
	var isGecko192 = utils.compareVersions(utils.platformVersion, '>=', '1.9.2');

	assert.equals(aFinalString, target.value);
	// -Gecko 1.9:
	//   keydown, keyup, keypress
	// Gecko 1.9.2-:
	//   keydown, keyup, keypress, input
	var eventsCount = isGecko192 ? 4 : 3 ;
	var events = assertEventsCount((aInputString.length * eventsCount) + 1);
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
			  keyCode : 0, charCode : aInputString.charCodeAt(aInputString.length-1),
			  altKey : false, ctrlKey : false, metaKey : false, shiftKey : false },
			events[events.length-2]
		);
	}
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);
}

function test_inputTo()
{
	target = $('input');
	assert.equals('', target.value);

	actionModule.inputTo(target, 'string');
	assertInput('string', 'string');

	actionModule.inputTo(target, 'moji');
	assertInput('moji', 'moji');
}

function test_appendTo()
{
	target = $('input');
	assert.equals('', target.value);

	actionModule.appendTo(target, 'string');
	assertInput('string', 'string');

	actionModule.appendTo(target, 'moji');
	assertInput('moji', 'stringmoji');
}

function test_pasteTo()
{
	target = $('input');
	assert.equals('', target.value);

	actionModule.pasteTo(target, 'string');
	assert.equals('string', target.value);
	events = assertEventsCount(1);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);

	actionModule.pasteTo(target, 'moji');
	assert.equals('moji', target.value);
	events = assertEventsCount(1);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);
}

function test_additionallyPasteTo()
{
	target = $('input');
	assert.equals('', target.value);

	actionModule.additionallyPasteTo(target, 'string');
	assert.equals('string', target.value);
	events = assertEventsCount(1);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);

	actionModule.additionallyPasteTo(target, 'moji');
	assert.equals('stringmoji', target.value);
	events = assertEventsCount(1);
	assert.equals(
		{ type : 'input', target : 'input' },
		events[events.length-1]
	);
}

