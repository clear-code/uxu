function actionSetUp()
{
	lastCount = 0;
	target = null;
	boxObject = null;
}


var lastCount = 0;
function assertEventsCount(aCount)
{
	var events;
	eval('events = '+$('log').textContent);
	assert.equals(lastCount+aCount, events.length, inspect(events));
	lastCount += aCount;
	return events;
}


var target;
var boxObject;

function assertMouseEventAt(aType, aButton, aScreenX, aScreenY, aModifiers, aDetail, aEvent)
{
	var event = generateMouseEventLog(aType, aButton, aScreenX, aScreenY, aModifiers, aDetail);
	event.target = target.getAttribute('id');
	assert.equals(event, aEvent);
}

function assertMouseEventOn(aType, aButton, aModifiers, aDetail, aEvent)
{
	var event = generateMouseEventLog(aType, aButton, 0, 0, aModifiers, aDetail, boxObject);
	event.target = target.getAttribute('id');
	assert.equals(event, aEvent);
}

function generateMouseEventLog(aType, aButton, aScreenX, aScreenY, aModifiers, aDetail, aBox)
{
	if (!aModifiers) aModifiers = {};
	var event = {
		type     : aType,
		button   : aButton,
		detail   : aDetail,
		altKey   : aModifiers.altKey || false,
		ctrlKey  : aModifiers.ctrlKey || false,
		metaKey  : aModifiers.metaKey || false,
		shiftKey : aModifiers.shiftKey || false,
		screenX  : aScreenX || 0,
		screenY  : aScreenY || 0
	};
	if (aDetail !== void(0)) {
		event.detail = aDetail;
	}
	else {
		switch (event.type)
		{
			case 'mousedown': event.detail = 1; break;
			case 'mouseup': event.detail = 0; break;
			case 'click': event.detail = 1; break;
			case 'dblclick': event.detail = 2; break;
		}
	}
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


function assertKeyEvent(aType, aKeyCode, aChar, aModifiers, aEvent)
{
	var event = generateKeyEventLog(aType, aKeyCode, aChar, aModifiers);
	event.target = target.getAttribute('id');
	assert.equals(event, aEvent);
}

function generateKeyEventLog(aType, aKeyCode, aChar, aModifiers)
{
	if (!aModifiers) aModifiers = {};
	var event = {
		type     : aType || 'keypress',
		keyCode  : aKeyCode || 0,
		charCode : aChar ? aChar.charCodeAt(0) : 0,
		altKey   : aModifiers.altKey || false,
		ctrlKey  : aModifiers.ctrlKey || false,
		metaKey  : aModifiers.metaKey || false,
		shiftKey : aModifiers.shiftKey || false
	};
	if (event.type != 'keypress' &&
		event.charCode &&
		!event.keyCode) {
		event.keyCode = Ci.nsIDOMKeyEvent['DOM_VK_'+String.fromCharCode(event.charCode).toUpperCase()];
		event.charCode = 0;
	}
	return event;
}
