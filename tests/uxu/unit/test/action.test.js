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
	yield Do(utils.loadURI('about:blank'));
}



/* mouse events */

function test_mousedownAt()
{
	target = $('clickable-box');
	boxObject = utils.getBoxObjectFor(target);
	var events, modifiers, x, y;

	modifiers = { ctrlKey : true };
	x = boxObject.screenX+10;
	y = boxObject.screenY+10;
	actionModule.rightMousedownAt(content, boxObject.x+10, boxObject.y+10, modifiers);
	events = assertEventsCount(1);
	assertMouseEventAt('mousedown', 2, x, y, modifiers, 1, events[events.length-1]);

	modifiers = { altKey : true };
	x = boxObject.screenX+20;
	y = boxObject.screenY+20;
	actionModule.middleMouseupAt(content, boxObject.x+20, boxObject.y+20, modifiers);
	events = assertEventsCount(1);
	assertMouseEventAt('mouseup', 1, x, y, modifiers, 0, events[events.length-1]);

	modifiers = { shiftKey : true };
	x = boxObject.screenX+30;
	y = boxObject.screenY+30;
	actionModule.clickAt(content, boxObject.x+30, boxObject.y+30, modifiers);
	events = assertEventsCount(3);
	assertMouseEventAt('mousedown', 0, x, y, modifiers, 1, events[events.length-3]);
	assertMouseEventAt('mouseup', 0, x, y, modifiers, 1, events[events.length-2]);
	assertMouseEventAt('click', 0, x, y, modifiers, 1, events[events.length-1]);

	modifiers = { shiftKey : true };
	x = boxObject.screenX+40;
	y = boxObject.screenY+40;
	actionModule.dblclickAt(content, boxObject.x+40, boxObject.y+40, modifiers);
	events = assertEventsCount(7);
	assertMouseEventAt('mousedown', 0, x, y, modifiers, 1, events[events.length-7]);
	assertMouseEventAt('mouseup', 0, x, y, modifiers, 1, events[events.length-6]);
	assertMouseEventAt('click', 0, x, y, modifiers, 1, events[events.length-5]);
	assertMouseEventAt('mousedown', 0, x, y, modifiers, 2, events[events.length-4]);
	assertMouseEventAt('mouseup', 0, x, y, modifiers, 2, events[events.length-3]);
	assertMouseEventAt('click', 0, x, y, modifiers, 2, events[events.length-2]);
	assertMouseEventAt('dblclick', 0, x, y, modifiers, 2, events[events.length-1]);
}

function test_mousedownOn()
{
	target = $('clickable-box');
	boxObject = utils.getBoxObjectFor(target);
	var event;

	modifiers = { ctrlKey : true };
	actionModule.rightMousedownOn(target, modifiers);
	events = assertEventsCount(1);
	assertMouseEventOn('mousedown', 2, modifiers, 1, events[events.length-1]);

	modifiers = { ctrlKey : true };
	actionModule.middleMouseupOn(target, modifiers);
	events = assertEventsCount(1);
	assertMouseEventOn('mouseup', 1, modifiers, 0, events[events.length-1]);

	modifiers = { shiftKey : true };
	actionModule.clickOn(target, modifiers);
	events = assertEventsCount(3);
	assertMouseEventOn('mousedown', 0, modifiers, 1, events[events.length-3]);
	assertMouseEventOn('mouseup', 0, modifiers, 1, events[events.length-2]);
	assertMouseEventOn('click', 0, modifiers, 1, events[events.length-1]);

	modifiers = { shiftKey : true };
	actionModule.dblclickOn(target, modifiers);
	events = assertEventsCount(7);
	assertMouseEventOn('mousedown', 0, modifiers, 1, events[events.length-7]);
	assertMouseEventOn('mouseup', 0, modifiers, 1, events[events.length-6]);
	assertMouseEventOn('click', 0, modifiers, 1, events[events.length-5]);
	assertMouseEventOn('mousedown', 0, modifiers, 2, events[events.length-4]);
	assertMouseEventOn('mouseup', 0, modifiers, 2, events[events.length-3]);
	assertMouseEventOn('click', 0, modifiers, 2, events[events.length-2]);
	assertMouseEventOn('dblclick', 0, modifiers, 2, events[events.length-1]);
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

function test_inputTo()
{
	var input = $('input');
	var events;
	assert.equals('', input.value);

	actionModule.inputTo(input, 'string');
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

	actionModule.inputTo(input, 'moji');
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
}

function test_appendTo()
{
	var input = $('input');
	var events;
	assert.equals('', input.value);

	actionModule.appendTo(input, 'string');
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

	actionModule.appendTo(input, 'moji');
	assert.equals('stringmoji', input.value);
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
}

