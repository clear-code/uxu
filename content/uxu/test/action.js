// -*- indent-tabs-mode: t; tab-width: 4 -*- 
 
const Cc = Components.classes; 
const Ci = Components.interfaces;

var Prefs = Components.classes['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch)
		.QueryInterface(Ci.nsIPrefBranch2);

var shouldEmulateMouseEvent = Prefs.getBoolPref('extensions.uxu.action.fireMouseEvent.useOldMethod');
var shouldEmulateKeyEvent = Prefs.getBoolPref('extensions.uxu.action.fireKeyEvent.useOldMethod');

function getBoxObjectFor(aNode)
{
	if ('getBoxObjectFor' in aNode.ownerDocument)
		return aNode.ownerDocument.getBoxObjectFor(aNode);

	if (!('window' in _boxObjectModule)) {
		Components.utils.import(
			'resource://uxu-modules/boxObject.js',
			_boxObjectModule
		);
	}
	return _boxObjectModule
				.window['piro.sakura.ne.jp']
				.boxObject
				.getBoxObjectFor(aNode);
}
var _boxObjectModule = {};
 
/* zoom */ 
	
function isFullZoom() 
{
	try {
		return Prefs.getBoolPref('browser.zoom.full');
	}
	catch(e) {
	}
	return false;
};
 
function getZoom(aWindow) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action.getZoom::['+aWindow+'] is not a frame!');
	var markupDocumentViewer = aWindow.top
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIWebNavigation)
			.QueryInterface(Ci.nsIDocShell)
			.contentViewer
			.QueryInterface(Ci.nsIMarkupDocumentViewer);
	return markupDocumentViewer.fullZoom;
};
  
/* mouse event */ 
	
// utils 
	
function _getMouseOptionsFor(aType, aButton, aArguments) 
{
	var options = _getMouseOptionsFromArguments(aArguments);
	var returnOptions = {
		type : aType,
		button : aButton,
		altKey : options.modifiers.altKey,
		ctrlKey : options.modifiers.ctrlKey,
		shiftKey : options.modifiers.shiftKey,
		metaKey : options.modifiers.metaKey
	};
	if (options.element) {
		returnOptions.element = options.element;
	}
	if (options.window) {
		returnOptions.window = options.window;
		returnOptions.x = options.x;
		returnOptions.y = options.y;
	}
	return returnOptions;
}
 
function _getMouseOptionsFromArguments(aArguments) 
{
	var modifierNames = 'alt,ctrl,control,shift,meta,cmd,command'
							.replace(/([^,]+)/g, '$1,$1Key')
							.split(',');
	var x, y, w, modifiers, element;
	Array.slice(aArguments).some(function(aArg) {
		if (typeof aArg == 'number') {
			if (x === void(0))
				x = aArg;
			else if (y === void(0))
				y = aArg;
		}
		else if (aArg) {
			if (aArg instanceof Ci.nsIDOMWindow)
				w = aArg;
			else if (aArg instanceof Ci.nsIDOMElement)
				element = aArg;
			else if (modifierNames.some(function(aName) {
					return aName in aArg;
				}))
				modifiers = aArg;
		}
		return (x && y && w && modifiers && element);
	});

	if (!w && x !== void(0) && y !== void(0)) {
		w = _getWindowFromScreenPoint(x, y);
		x -= w.screenX;
		y -= w.screenY;
	}

	if (modifiers) {
		modifiers.altKey = modifiers.altKey || modifiers.alt;
		modifiers.ctrlKey = modifiers.ctrlKey || modifiers.ctrl ||
							modifiers.controlKey || modifiers.control;
		modifiers.shiftKey = modifiers.shiftKey || modifiers.shift;
		modifiers.metaKey = modifiers.metaKey || modifiers.meta ||
							modifiers.cmdKey || modifiers.cmd ||
							modifiers.commandKey || modifiers.command;
	}

	return {
		x : x,
		y : y,
		window : w,
		element : element,
		modifiers : modifiers || {}
	};
}
  
// click on element 
	
function clickOn() 
{
	var options = _getMouseOptionsFor('click', 0, arguments);
	fireMouseEventOnElement(options.element, options);
}
 
function middleClickOn() 
{
	var options = _getMouseOptionsFor('click', 1, arguments);
	fireMouseEventOnElement(options.element, options);
}
 
function rightClickOn() 
{
	var options = _getMouseOptionsFor('click', 2, arguments);
	fireMouseEventOnElement(options.element, options);
}
  
// dblclick on element 
	
function doubleClickOn() 
{
	var options = _getMouseOptionsFor('dblclick', 0, arguments);
	fireMouseEventOnElement(options.element, options);
}
var dblClickOn = doubleClickOn;
var dblclickOn = doubleClickOn;
 
function doubleMiddleClickOn() 
{
	var options = _getMouseOptionsFor('dblclick', 1, arguments);
	fireMouseEventOnElement(options.element, options);
}
var middleDoubleClickOn = doubleMiddleClickOn;
var dblclickMiddleOn = doubleMiddleClickOn;
var dblClickMiddleOn = doubleMiddleClickOn;
var middleDblClickOn = doubleMiddleClickOn;
var middleDblclickOn = doubleMiddleClickOn;
 
function doubleRightClickOn() 
{
	var options = _getMouseOptionsFor('dblclick', 2, arguments);
	fireMouseEventOnElement(options.element, options);
}
var rightDoubleClickOn = doubleRightClickOn;
var dblclickRightOn = doubleRightClickOn;
var dblClickRightOn = doubleRightClickOn;
var rightDblClickOn = doubleRightClickOn;
var rightDblclickOn = doubleRightClickOn;
  
// mousedown/mouseup on element 
	
function mouseDownOn() 
{
	var options = _getMouseOptionsFor('mousedown', 0, arguments);
	fireMouseEventOnElement(options.element, options);
}
var mousedownOn = mouseDownOn;
 
function middleMouseDownOn() 
{
	var options = _getMouseOptionsFor('mousedown', 1, arguments);
	fireMouseEventOnElement(options.element, options);
}
var middleMousedownOn = middleMouseDownOn;
var mouseDownMiddleOn = middleMouseDownOn;
var mousedownMiddleOn = middleMouseDownOn;
 
function rightMouseDownOn() 
{
	var options = _getMouseOptionsFor('mousedown', 2, arguments);
	fireMouseEventOnElement(options.element, options);
}
var rightMousedownOn = rightMouseDownOn;
var mouseDownRightOn = rightMouseDownOn;
var mousedownRightOn = rightMouseDownOn;
 
function mouseUpOn() 
{
	var options = _getMouseOptionsFor('mouseup', 0, arguments);
	fireMouseEventOnElement(options.element, options);
}
var mouseupOn = mouseUpOn;
 
function middleMouseUpOn() 
{
	var options = _getMouseOptionsFor('mouseup', 1, arguments);
	fireMouseEventOnElement(options.element, options);
}
var middleMouseupOn = middleMouseUpOn;
var mouseUpMiddleOn = middleMouseUpOn;
var mouseupMiddleOn = middleMouseUpOn;
 
function rightMouseUpOn() 
{
	var options = _getMouseOptionsFor('mouseup', 2, arguments);
	fireMouseEventOnElement(options.element, options);
}
var rightMouseupOn = rightMouseUpOn;
var mouseUpRightOn = rightMouseUpOn;
var mouseupRightOn = rightMouseUpOn;
  
// click at position 
	
function clickAt() 
{
	var options = _getMouseOptionsFor('click', 0, arguments);
	fireMouseEvent(options.window, options);
}
 
function middleClickAt() 
{
	var options = _getMouseOptionsFor('click', 1, arguments);
	fireMouseEvent(options.window, options);
}
 
function rightClickAt() 
{
	var options = _getMouseOptionsFor('click', 2, arguments);
	fireMouseEvent(options.window, options);
}
  
// dblclick at position 
	
function doubleClickAt() 
{
	var options = _getMouseOptionsFor('dblclick', 0, arguments);
	fireMouseEvent(options.window, options);
}
var dblClickAt = doubleClickAt;
var dblclickAt = doubleClickAt;
 
function doubleMiddleClickAt() 
{
	var options = _getMouseOptionsFor('dblclick', 1, arguments);
	fireMouseEvent(options.window, options);
}
var middleDoubleClickAt = doubleMiddleClickAt;
var dblclickMiddleAt = doubleMiddleClickAt;
var dblClickMiddleAt = doubleMiddleClickAt;
var middleDblClickAt = doubleMiddleClickAt;
var middleDblclickAt = doubleMiddleClickAt;
 
function doubleRightClickAt() 
{
	var options = _getMouseOptionsFor('dblclick', 2, arguments);
	fireMouseEvent(options.window, options);
}
var rightDoubleClickAt = doubleRightClickAt;
var dblclickRightAt = doubleRightClickAt;
var dblClickRightAt = doubleRightClickAt;
var rightDblClickAt = doubleRightClickAt;
var rightDblclickAt = doubleRightClickAt;
  
// mousedown/mouseup at position 
	
function mouseDownAt() 
{
	var options = _getMouseOptionsFor('mousedown', 0, arguments);
	fireMouseEvent(options.window, options);
}
var mousedownAt = mouseDownAt;
 
function middleMouseDownAt() 
{
	var options = _getMouseOptionsFor('mousedown', 1, arguments);
	fireMouseEvent(options.window, options);
}
var middleMousedownAt = middleMouseDownAt;
var mouseDownMiddleAt = middleMouseDownAt;
var mousedownMiddleAt = middleMouseDownAt;
 
function rightMouseDownAt() 
{
	var options = _getMouseOptionsFor('mousedown', 2, arguments);
	fireMouseEvent(options.window, options);
}
var rightMousedownAt = rightMouseDownAt;
var mouseDownRightAt = rightMouseDownAt;
var mousedownRightAt = rightMouseDownAt;
 
function mouseUpAt() 
{
	var options = _getMouseOptionsFor('mouseup', 0, arguments);
	fireMouseEvent(options.window, options);
}
var mouseupAt = mouseUpAt;
 
function middleMouseUpAt() 
{
	var options = _getMouseOptionsFor('mouseup', 1, arguments);
	fireMouseEvent(options.window, options);
}
var middleMouseupAt = middleMouseUpAt;
var mouseUpMiddleAt = middleMouseUpAt;
var mouseupMiddleAt = middleMouseUpAt;
 
function rightMouseUpAt() 
{
	var options = _getMouseOptionsFor('mouseup', 2, arguments);
	fireMouseEvent(options.window, options);
}
var rightMouseupAt = rightMouseUpAt;
var mouseUpRightAt = rightMouseUpAt;
var mouseupRightAt = rightMouseUpAt;
  
// lower level API 
	
function fireMouseEvent(aWindow, aOptions) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action.fireMouseEvent::['+aWindow+'] is not a frame!');

	if (!aOptions) aOptions = {};

	_normalizeScreenAndClientPoint(aOptions, aWindow);
	var x = aOptions.x;
	var y = aOptions.y;
	var screenX = aOptions.screenX;
	var screenY = aOptions.screenY;

	var win = getFrameFromScreenPoint(aWindow, screenX, screenY);
	if (!win ||
		!(win instanceof Ci.nsIDOMWindow))
		throw new Error('action.fireMouseEvent::there is no frame at ['+screenX+', '+screenY+']!');

	var utils = _getWindowUtils(win);
	var node = getElementFromScreenPoint(aWindow, screenX, screenY);

	if (
		'sendMouseEvent' in utils &&
		!shouldEmulateMouseEvent &&
		!_getOwnerPopup(node)
		) {
		const nsIDOMNSEvent = Ci.nsIDOMNSEvent;
		var flags = 0;
		if (aOptions.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MASK;
		if (aOptions.altKey) flags |= nsIDOMNSEvent.ALT_MASK;
		if (aOptions.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MASK;
		if (aOptions.metaKey) flags |= nsIDOMNSEvent.META_MASK;

		var button = (aOptions.button || 0);
		var detail = (aOptions.detail || 1);
		if (aOptions.type == 'click' && detail == 2) aOptions.type = 'dblclick';
		if (aOptions.type == 'dblclick') detail = 1;
		switch (aOptions.type)
		{
			case 'mousemove':
			case 'mouseover':
				utils.sendMouseEvent(aOptions.type, x, y, button, detail, flags);
				break;
			case 'mousedown':
				utils.sendMouseEvent('mousedown', x, y, button, detail, flags);
				break;
			case 'mouseup':
				utils.sendMouseEvent('mouseup', x, y, button, detail, flags);
				break;
			case 'dblclick':
				utils.sendMouseEvent('mousedown', x, y, button, detail, flags);
				utils.sendMouseEvent('mouseup', x, y, button, detail, flags);
				detail = 2;
			case 'click':
			default:
				utils.sendMouseEvent('mousedown', x, y, button, detail, flags);
				utils.sendMouseEvent('mouseup', x, y, button, detail, flags);
//				_emulateClickOnXULElement(node, aOptions);
				break;
		}
		return;
	}

	if (node) {
		fireMouseEventOnElement(node, aOptions);
		_emulateClickOnXULElement(node, aOptions);
	}
	else
		throw new Error('action.fireMouseEvent::there is no element at ['+x+','+y+']!');
};
	
function _emulateClickOnXULElement(aElement, aOptions) 
{
	if (!aOptions) aOptions = {};
	_emulateActionOnXULElement(
		aElement,
		aOptions,
		aOptions.type == 'click' && aOptions.button == 0
	);
}
 
function _getOwnerPopup(aElement) 
{
	return aElement.ownerDocument.evaluate(
			'ancestor-or-self::*[contains(" menupopup popup tooltip panel ", concat(" ", local-name(), " "))]',
			aElement,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}
  
function fireMouseEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action.fireMouseEventOnElement::['+aElement+'] is not an element!');

	var utils = _getWindowUtils(aElement.ownerDocument.defaultView);
	if (!aOptions) aOptions = { type : 'click' };
	if (
		'sendMouseEvent' in utils &&
		!shouldEmulateMouseEvent &&
		!_getOwnerPopup(aElement)
		) {
		_updateMouseEventOptionsOnElement(aOptions, aElement);
		fireMouseEvent(aElement.ownerDocument.defaultView, aOptions);
		return;
	}

	var detail = 1;
	var options, event;
	switch (aOptions.type)
	{
		case 'mousedown':
		case 'mouseup':
			break;
		case 'dblclick':
			options = { type : 'mousedown', detail : detail };
			options.__proto__ = aOptions;
			fireMouseEventOnElement(aElement, options);
			options.type = 'mouseup';
			fireMouseEventOnElement(aElement, options);
			// on Gecko 1.8, we have to fire click event manually!
			if (!('sendMouseEvent' in utils)) {
				options.type = 'click';
				event = _createMouseEventOnElement(aElement, options);
				if (event && aElement) aElement.dispatchEvent(event);
			}
			detail++;
		case 'click':
		default:
			options = { type : 'mousedown', detail : detail };
			options.__proto__ = aOptions;
			fireMouseEventOnElement(aElement, options);
			options.type = 'mouseup';
			fireMouseEventOnElement(aElement, options);
			// on Gecko 1.8, we have to fire click event manually!
			if (!('sendMouseEvent' in utils) && aOptions.type == 'dblclick') {
				options.type = 'click';
				event = _createMouseEventOnElement(aElement, options);
				if (event && aElement) aElement.dispatchEvent(event);
			}
			break;
	}
	event = _createMouseEventOnElement(aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(event);
	if (aOptions.type != 'mousedown' &&
		aOptions.type != 'mouseup' &&
		aOptions.type != 'dblclick')
		_emulateClickOnXULElement(aElement, aOptions);
};
	
function _createMouseEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action._createMouseEventOnElement::['+aElement+'] is not an element!');

	if (!aOptions) aOptions = {};
	if (!aElement) return null;
	_updateMouseEventOptionsOnElement(aOptions, aElement);

	var event = aElement.ownerDocument.createEvent('MouseEvents');
	event.initMouseEvent(
		(aOptions.type || 'click'),
		('canBubble' in aOptions ? aOptions.canBubble : true ),
		('cancelable' in aOptions ? aOptions.cancelable : true ),
		aElement.ownerDocument.defaultView,
		('detail' in aOptions ? aOptions.detail : 1),
		aOptions.screenX,
		aOptions.screenY,
		aOptions.x,
		aOptions.y,
		('ctrlKey' in aOptions ? aOptions.ctrlKey : false ),
		('altKey' in aOptions ? aOptions.altKey : false ),
		('shiftKey' in aOptions ? aOptions.shiftKey : false ),
		('metaKey' in aOptions ? aOptions.metaKey : false ),
		('button' in aOptions ? aOptions.button : 0 ),
		null
	);
	return event;
};
 
function _updateMouseEventOptionsOnElement(aOptions, aElement) 
{
	if (aElement.nodeType != aElement.ELEMENT_NODE) aElement = aElement.parentNode;
	if (!aOptions) aOptions = {};

	var doc = _getDocumentFromEventTarget(aElement);
	var frame = doc.defaultView;
	var box = getBoxObjectFor(aElement);
	var root = doc.documentElement;
	var rootBox = getBoxObjectFor(root);

	var frameX = frame.scrollX + rootBox.screenX;
	var frameY = frame.scrollY + rootBox.screenY;
	var frameW = Math.min(rootBox.width, frame.innerWidth);
	var frameH = Math.min(rootBox.height, frame.innerHeight);

	if ( // out of screen
		box.screenX > frameX + frameW ||
		box.screenY > frameY + frameH ||
		box.screenX + box.width < frameX ||
		box.screenY + box.height < frameY
		) {
		aOptions.screenX = box.screenX + Math.floor(box.width / 2);
		aOptions.screenY = box.screenY + Math.floor(box.height / 2);
	}
	else { // inside of screen:
		var visibleX = box.screenX;
		var visibleW = box.width;
		if (box.screenX < frameX) {
			visibleX = frameX;
			visibleW -= (frameX - box.screenX);
		}
		else if (box.screenX + box.width > frameX + frameW) {
			visibleW -= ((box.screenX + box.width) - (frameX + frameW));
		}

		var visibleY = box.screenY;
		var visibleH = box.height;
		if (box.screenY < frameY) {
			visibleY = frameY;
			visibleH -= (frameY - box.screenY);
		}
		else if (box.screenY + box.height > frameY + frameH) {
			visibleH -= ((box.screenY + box.height) - (frameY + frameH));
		}

		aOptions.screenX = visibleX + Math.floor(visibleW / 2);
		aOptions.screenY = visibleY + Math.floor(visibleH / 2);
	}

	aOptions.x = aOptions.screenX - rootBox.screenX - frame.scrollX;
	aOptions.y = aOptions.screenY - rootBox.screenY - frame.scrollY;
}
    
// drag and drop: under construction 
	
function dragStart(aWindow, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.type = 'mousedown';
	fireMouseEvent(aWindow, aOptions);
};
	
function dragStartOnElement(aElement, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.type = 'mousedown';
	fireMouseEventOnElement(aElement, aOptions);
};
  
function dragEnd(aWindow, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.type = 'mouseup';
	fireMouseEvent(aWindow, aOptions);
};
	
function dragEndOnElement(aElement, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.type = 'mouseup';
	fireMouseEventOnElement(aElement, aOptions);
};
  
function dragMove(aWindow, aFromX, aFromY, aToX, aToY, aOptions) 
{
	if (!aOptions) aOptions = {};
	var dragEndFlag = { value : false };

	var deltaX = aFromX == aToX ? 0 :
			aFromX > aToX ? -1 :
			1;
	var deltaY = aFromY == aToY ? 0 :
			aFromY > aToY ? -1 :
			1;
	if (!deltaX && !deltaY) {
		dragEndFlag.value = true;
		return dragEndFlag;
	}

	if (deltaX) deltaX = deltaX * parseInt(Math.abs(aFromX - aToX) / 20);
	if (deltaY) deltaY = deltaY * parseInt(Math.abs(aFromY - aToY) / 20);

	var _this = this;
	function Dragger()
	{
		var x = aFromX;
		var y = aFromY;
		while (true)
		{
			if (deltaX > 0)
				x = Math.min(aToX, x + deltaX);
			else
				x = Math.max(aToX, x + deltaX);
			if (deltaY > 0)
				y = Math.min(aToY, y + deltaY);
			else
				y = Math.max(aToY, y + deltaY);
			aOptions.type = 'mousemove';
			aOptions.screenX = x;
			aOptions.screenY = y;
			fireMouseEvent(aWindow, aOptions);
			yield;
			if (x == aToX && y == aToY) break;
		}
	}
	var dragger = Dragger();
	aWindow.setTimeout(function() {
		try {
			dragger.next();
			aWindow.setTimeout(arguments.callee, 10);
		}
		catch(e) {
			dragEndFlag.value = true;
		}
	}, 0);
	return dragEndFlag;
};
	
function dragMove(aFromElement, aToElement, aOptions) 
{
	if (aFromElement.nodeType != aFromElement.ELEMENT_NODE)
		aFromElement = aFromElement.parentNode;
	if (aToElement.nodeType != aToElement.ELEMENT_NODE)
		aToElement = aToElement.parentNode;

	var doc = aFromElement.ownerDocument;
	var win = doc.defaultView;
	var fromBox = getBoxObjectFor(aFromElement);
	var toBox = getBoxObjectFor(aToElement);
	return dragMove(
			win,
			fromBox.screenX + Math.floor(fromBox.width / 2),
			fromBox.screenY + Math.floor(fromBox.height / 2),
			toBox.screenX + Math.floor(toBox.width / 2),
			toBox.screenY + Math.floor(toBox.height / 2),
			aOptions
		);
};
  
function dragAndDrop(aWindow, aFromX, aFromY, aToX, aToY, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.screenX = aFromX;
	aOptions.screenY = aFromY;
	dragStart(aWindow, aOptions);
	var dragEndFlag = { value : false };
	var _this = this;
	aWindow.setTimeout(function() {
		var flag = dragMove(aWindow, aFromX, aFromY, aToX, aToY, aOptions);
		var timer = aWindow.setInterval(function() {
			if (!flag.value) return;
			aWindow.clearInterval(timer);
			aOptions.screenX = aToX;
			aOptions.screenY = aToY;
			dragEnd(aWindow, aOptions);
			dragEndFlag.value = true;
		}, 10);
	}, 0);
	return dragEndFlag;
};
	
function dragAndDropOnElement(aFromElement, aToElement, aOptions) 
{
	if (aFromElement.nodeType != aFromElement.ELEMENT_NODE)
		aFromElement = aFromElement.parentNode;
	if (aToElement.nodeType != aToElement.ELEMENT_NODE)
		aToElement = aToElement.parentNode;

	var doc = aFromElement.ownerDocument;
	var win = doc.defaultView;
	var fromBox = getBoxObjectFor(aFromElement);
	var toBox = getBoxObjectFor(aToElement);
	return dragAndDrop(
			win,
			fromBox.screenX + Math.floor(fromBox.width / 2),
			fromBox.screenY + Math.floor(fromBox.height / 2),
			toBox.screenX + Math.floor(toBox.width / 2),
			toBox.screenY + Math.floor(toBox.height / 2),
			aOptions
		);
};
   
/* key event */ 
	
// utils 
	
function _getKeyOptionsFor(aType, aArguments) 
{
	var modifierNames = 'alt,ctrl,control,shift,meta,cmd,command'
							.replace(/([^,]+)/g, '$1,$1Key')
							.split(',');
	var keyCode = 0,
		charCode = 0,
		modifiers, element;
	Array.slice(aArguments).some(function(aArg) {
		if (typeof aArg == 'number') {
			keyCode = aArg;
		}
		else if (typeof aArg == 'string') {
			if (aArg.length == 1) {
				charCode = aArg.charCodeAt(0);
			}
			else {
				var name = 'DOM_VK_'+aArg.toUpperCase();
				if (name in Ci.nsIDOMKeyEvent)
					keyCode = Ci.nsIDOMKeyEvent[name];
			}
		}
		else if (aArg) {
			if (aArg instanceof Ci.nsIDOMElement)
				element = aArg;
			else if (modifierNames.some(function(aName) {
					return aName in aArg;
				}))
				modifiers = aArg;
		}
		return ((keyCode || charCode) && modifiers && element);
	});

	if (modifiers) {
		modifiers.altKey = modifiers.altKey || modifiers.alt;
		modifiers.ctrlKey = modifiers.ctrlKey || modifiers.ctrl ||
							modifiers.controlKey || modifiers.control;
		modifiers.shiftKey = modifiers.shiftKey || modifiers.shift;
		modifiers.metaKey = modifiers.metaKey || modifiers.meta ||
							modifiers.cmdKey || modifiers.cmd ||
							modifiers.commandKey || modifiers.command;
	}
	else {
		modifiers = {};
	}

	return {
		type : aType,
		keyCode : keyCode,
		charCode : charCode,
		element : element,
		altKey : modifiers.altKey,
		ctrlKey : modifiers.ctrlKey,
		shiftKey : modifiers.shiftKey,
		metaKey : modifiers.metaKey
	};
}
  
function keyPressOn() 
{
	var options = _getKeyOptionsFor('keypress', arguments);
	fireKeyEventOnElement(options.element, options);
}
var keypressOn = keyPressOn;
 
function keyDownOn(aElement, aKeyOrCharCode) 
{
	var options = _getKeyOptionsFor('keydown', arguments);
	fireKeyEventOnElement(options.element, options);
}
var keydownOn = keyDownOn;
 
function keyUpOn(aElement, aKeyOrCharCode) 
{
	var options = _getKeyOptionsFor('keyup', arguments);
	fireKeyEventOnElement(options.element, options);
}
var keyupOn = keyUpOn;
 
// lower level API 
	
function fireKeyEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action.fireKeyEventOnElement::['+aElement+'] is not an element!');

	if (aElement instanceof Ci.nsIDOMXULElement) {
		let dispatcher = _getXULKeyEventDispatcher(aElement);
		if (!dispatcher || dispatcher.getAttribute('disabled') == 'true')
			return;
	}

	if (!aOptions) aOptions = {};
	if (!aOptions.type) aOptions.type = 'keypress';

	if (aElement.localName == 'textbox' &&
		'inputField' in aElement &&
		aElement.inputField instanceof Ci.nsIDOMElement)
		aElement = aElement.inputField;

	var doc = _getDocumentFromEventTarget(aElement);
	var utils = _getWindowUtils(doc.defaultView);
	if ('sendKeyEvent' in utils &&
		!shouldEmulateKeyEvent) {
		const nsIDOMNSEvent = Ci.nsIDOMNSEvent;
		var flags = 0;
		if (aOptions.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MASK;
		if (aOptions.altKey) flags |= nsIDOMNSEvent.ALT_MASK;
		if (aOptions.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MASK;
		if (aOptions.metaKey) flags |= nsIDOMNSEvent.META_MASK;

		var keyCode = ('keyCode' in aOptions ? aOptions.keyCode : 0 );
		var charCode = ('charCode' in aOptions ? aOptions.charCode : 0 );
		utils.focus(aElement);
		utils.sendKeyEvent((aOptions.type || 'keypress'), keyCode, charCode, flags);
		return;
	}

	switch (aOptions.type)
	{
		case 'keydown':
		case 'keyup':
			break;
		case 'keypress':
		default:
			var options = { type : 'keydown' };
			options.__proto__ = aOptions;
			fireKeyEventOnElement(aElement, options);
			options.type = 'keyup';
			fireKeyEventOnElement(aElement, options);
			break;
	}
	aElement.dispatchEvent(_createKeyEventOnElement(aElement, aOptions));
	if (aOptions.type != 'keydown' &&
		aOptions.type != 'keyup')
		_emulateEnterOnXULElement(aElement, aOptions);
};
	
function _createKeyEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action._createKeyEventOnElement::['+aElement+'] is not an element!');

	if (!aOptions) aOptions = {};
	if (!aOptions.type) aOptions.type = 'keypress';

	if (aOptions.type != 'keypress' &&
		aOptions.charCode &&
		!aOptions.keyCode) {
		aOptions.keyCode = Ci.nsIDOMKeyEvent['DOM_VK_'+String.fromCharCode(aOptions.charCode).toUpperCase()];
		aOptions.charCode = 0;
	}

	var node = aElement;
	var doc = _getDocumentFromEventTarget(node);
	var event = doc.createEvent('KeyEvents');
	event.initKeyEvent(
		(aOptions.type || 'keypress'),
		('canBubble' in aOptions ? aOptions.canBubble : true ),
		('cancelable' in aOptions ? aOptions.cancelable : true ),
		doc.defaultView,
		('ctrlKey' in aOptions ? aOptions.ctrlKey : false ),
		('altKey' in aOptions ? aOptions.altKey : false ),
		('shiftKey' in aOptions ? aOptions.shiftKey : false ),
		('metaKey' in aOptions ? aOptions.metaKey : false ),
		('keyCode' in aOptions ? aOptions.keyCode : 0 ),
		('charCode' in aOptions ? aOptions.charCode : 0 )
	);
	return event;
};
 
function _emulateEnterOnXULElement(aElement, aOptions) 
{
	if (!aOptions) aOptions = {};
	_emulateActionOnXULElement(
		aElement,
		aOptions,
		aOptions.type == 'keypress' &&
		(
			aOptions.keyCode == Ci.nsIDOMKeyEvent.DOM_VK_RETURN ||
			aOptions.keyCode == Ci.nsIDOMKeyEvent.DOM_VK_ENTER
		)
	);
}
    
/* XULCommand event */ 
	
function fireXULCommandEvent(aWindow, aOptions) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action.fireXULCommandEvent::['+aWindow+'] is not a frame!');

	if (!aOptions) aOptions = {};
	_normalizeScreenAndClientPoint(aOptions, aWindow);
	var node = getElementFromScreenPoint(aWindow, aOptions.screenX, aOptions.screenY);
	if (!node)
		throw new Error('action.fireXULCommandEvent::there is no element at ['+aOptions.screenX+','+aOptions.screenY+']!');
	return fireXULCommandEventOnElement(node, aOptions);
};
 
function fireXULCommandEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action.fireXULCommandEventOnElement:['+aElement+'] is not an element!');

	aElement = _getXULCommandEventDispatcher(aElement);
	if (!aElement || aElement.getAttribute('disabled') == 'true')
		return false;

	var event = _createMouseEventOnElement(aElement, aOptions);
	if (event) {
		aElement.dispatchEvent(_createXULCommandEvent(event));
		if (aElement.localName == 'menuitem') {
			aElement.ownerDocument.defaultView.setTimeout(function(aSelf) {
				var popup = aElement;
				while (popup = aSelf._getOwnerPopup(popup))
				{
					popup.hidePopup();
					popup = popup.parentNode;
				}
			}, 1, this);
		}
		return true;
	}
	return false;
};
	
function _createXULCommandEvent(aSourceEvent) 
{
	var event = aSourceEvent.view.document.createEvent('XULCommandEvents');
	event.initCommandEvent('command',
		true,
		true,
		aSourceEvent.view,
		0,
		false,
		false,
		false,
		false,
		aSourceEvent
	);
	return event;
};
  
function _getXULCommandEventDispatcher(aElement) 
{
	return aElement.ownerDocument.evaluate(
			'ancestor-or-self::*['+
				'contains(" button menuitem checkbox radio tab ", concat(" ", local-name(), " ")) or '+
				'(local-name() = "toolbarbutton" and (not(@type) or @type != "menu"))'+
			'][1]',
			aElement,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}
 
function _getXULKeyEventDispatcher(aElement) 
{
	return aElement.ownerDocument.evaluate(
			'ancestor-or-self::*['+
				'contains(" button menuitem checkbox radio tab textbox ", concat(" ", local-name(), " ")) or '+
				'(local-name() = "toolbarbutton" and (not(@type) or @type != "menu"))'+
			'][1]',
			aElement,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}
 
function _emulateActionOnXULElement(aElement, aOptions, aIsSimpleGesture) 
{
	if (!aElement) return;

	var target = _getXULCommandEventDispatcher(aElement);
	if (!target || target.getAttribute('disabled') == 'true') return;

	if (!aOptions) aOptions = {};
	var isSimpleAction = !(
			aOptions.altKey ||
			aOptions.ctrlKey ||
			aOptions.shiftKey ||
			aOptions.metaKey
		);
	var isSimpleGesture = aIsSimpleGesture && isSimpleAction;
	var shouldSendXULCommandEvent = false;

	switch (target.localName)
	{
		case 'menuitem':
			if (!isSimpleGesture) return;
			shouldSendXULCommandEvent = true;
			target.ownerDocument.defaultView.setTimeout(function(aSelf) {
				var popup = target;
				while (popup = aSelf._getOwnerPopup(popup))
				{
					popup.hidePopup();
					popup = popup.parentNode;
				}
			}, 1, this);
			break;

		case 'button':
		case 'checkbox':
		case 'radio':
		case 'tab':
			if (!isSimpleGesture) return;
			shouldSendXULCommandEvent = true;
			break;

		case 'toolbarbutton':
			if (target.localName == 'toolbarbutton' &&
				target.getAttribute('type') != 'menu') {
				if (!isSimpleGesture) return;
				shouldSendXULCommandEvent = true;
				break;
			}
		case 'colorpicker':
			if (target.localName == 'colorpicker' &&
				target.getAttribute('type') != 'button') {
				break;
			}
		case 'menu':
			var popupId;
			var expression = '';
			var isContext = false;
			switch (aOptions.button)
			{
				case 0:
					popupId = target.getAttribute('popup');
					expression += 'child::*[local-name()="menupopup" or local-name()="popup"] |';
					if (navigator.platform.toLowerCase().indexOf('mac') > -1 &&
						!aOptions.altKey &&
						aOptions.ctrlKey &&
						!aOptions.shiftKey &&
						!aOptions.metaKey) {
					}
					else {
						if (!isSimpleAction) return;
						break;
					}
				case 2:
					if (!isSimpleAction) return;
					popupId = target.getAttribute('context');
					isContext = true;
					break;
				default:
					return;
			}
			var popup = target.ownerDocument.evaluate(
					expression+'/descendant::menupopup[@id="'+popupId+'"]',
					target,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;

			if (!popup) return;
			if ('openPopup' in popup && isContext)
				popup.openPopup(target, 'after_pointer', -1, -1, true, true);
			else
				popup.showPopup();
			break;
	}

	if (!shouldSendXULCommandEvent) return;
	try {
		fireXULCommandEventOnElement(target, aOptions);
	}
	catch(e) {
		dump(e+'\n');
	}
}
  
/* text input */ 
	
// utils 
	
function _getInputOptionsFor(aArguments) 
{
	var input, element;
	Array.slice(aArguments).some(function(aArg) {
		if (typeof aArg == 'string') {
			input = aArg;
		}
		else if (aArg) {
			if (aArg instanceof Ci.nsIDOMElement)
				element = aArg;
		}
		return (input !== void(0) && element);
	});
	return { input : input, element : element };
}
  
function inputTo() 
{
	var options = _getInputOptionsFor(arguments);
	inputTextToField(options.element, options.input);
}
 
function appendTo() 
{
	var options = _getInputOptionsFor(arguments);
	inputTextToField(options.element, options.input, true);
}
 
// lower level API 
	
var withIMECharacters = '\u3040-\uA4CF\uF900-\uFAFF'; 
var kINPUT_ARRAY_PATTERN  = new RegExp('[^'+withIMECharacters+']|['+withIMECharacters+']+', 'g');
var kDIRECT_INPUT_PATTERN = new RegExp('[^'+withIMECharacters+']');
 
function inputTextToField(aElement, aValue, aAppend, aDontFireKeyEvents) 
{
	if (!aElement) {
		throw new Error('action.inputTextToField::no target!');
	}
	else if (aElement instanceof Ci.nsIDOMElement) {
		if (aElement.localName != 'textbox' &&
			!(aElement instanceof Ci.nsIDOMNSEditableElement))
			throw new Error('action.inputTextToField::['+aElement+'] is not an input field!');
	}
	else {
		throw new Error('action.inputTextToField::['+aElement+'] is not an input field!');
	}

	if (!aAppend) aElement.value = '';

	if (!aDontFireKeyEvents && aValue) {
		var input = aElement;
		if (input.localName == 'textbox') input = input.inputField;

		var self = this;
		var array = String(aValue || '').match(kINPUT_ARRAY_PATTERN);
		if (!array) array = String(aValue || '').split('');
		array.forEach(function(aChar) {
			if (kDIRECT_INPUT_PATTERN.test(aChar)) {
				self.fireKeyEventOnElement(input, {
					type     : 'keypress',
					charCode : aChar.charCodeAt(0)
				});
			}
			else {
				self.fireKeyEventOnElement(input, {
					type    : 'keypress',
					keyCode : 0xE5
				});
				self.inputTextToField(input, aChar, true, true);
			}
		});
	}
	else {
		aElement.value += (aValue || '');
	}

	var doc = _getDocumentFromEventTarget(aElement);
	var event = doc.createEvent('UIEvents');
	event.initUIEvent('input', true, true, doc.defaultView, 0);
	aElement.dispatchEvent(event);
};
   
/* ç¿ïWëÄçÏ */ 
	
function _getWindowFromScreenPoint(aScreenX, aScreenY) 
{
	var windows = Cc['@mozilla.org/appshell/window-mediator;1']
							.getService(Ci.nsIWindowMediator)
							.getZOrderDOMWindowEnumerator(null, true);
	while (windows.hasMoreElements())
	{
		let w = windows.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
		let left   = aBox.screenX;
		let top    = aBox.screenY;
		let right  = left + aBox.outerWidth;
		let bottom = top + aBox.outerHeight;
		if (
				left   <= aScreenX &&
				right  >= aScreenX &&
				top    <= aScreenY &&
				bottom >= aScreenY
			)
			return w;
	}
	new Error('action._getWindowFromScreenPoint:: there is no window at '+aScreenX+', '+aScreenY+'!');
}
 
function getElementFromScreenPoint(aFrame, aScreenX, aScreenY) 
{
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action.getElementFromScreenPoint::['+aFrame+'] is not a frame!');

	var popup = _getPopupElementFromScreenPoint(aFrame, aScreenX, aScreenY);
	if (popup) return popup;

	var clientPos = _getClientPointFromScreenPoint(aFrame, aScreenX, aScreenY);
	if ('elementFromPoint' in aFrame.document) {
		var elem = aFrame.document.elementFromPoint(clientPos.x, clientPos.y);
		if (
			elem &&
			(
				/^(i?frame|browser)$/i.test(elem.localName) ||
				(elem.localName == 'tabbrowser' &&
				_isInside(elem.mPanelContainer.boxObject, aScreenX, aScreenY))
			)
			) {
			var node = getElementFromScreenPoint(
					elem.contentWindow,
					aScreenX + aFrame.scrollX,
					aScreenY + aFrame.scrollY
				);
			return _getOriginalTargetFromScreenPoint(node, aScreenX, aScreenY);
		}
		return _getOriginalTargetFromScreenPoint(elem, aScreenX, aScreenY);
	}

	aFrame = getFrameFromScreenPoint(aFrame, aScreenX, aScreenY);
	if (!aFrame) return null;

	var doc = aFrame.document;

	var accNode;
	try {
		var accService = Components.classes['@mozilla.org/accessibilityService;1']
							.getService(Ci.nsIAccessibilityService);
		var acc = accService.getAccessibleFor(doc);
		accNode = acc.getChildAtPoint(clientPos.x, clientPos.y);
		accNode = accNode.QueryInterface(Ci.nsIAccessNode).DOMNode;
	}
	catch(e) {
	}

	var startNode = accNode || doc;
	var nodes = [];
	var walker = doc.createTreeWalker(startNode, NodeFilter.SHOW_ELEMENT, elementFilter, false);
	for (var node = walker.firstChild(); node != null; node = walker.nextNode())
	{
		if (_isInside(getBoxObjectFor(node), aScreenX, aScreenY))
			nodes.push(node);
	}

	if (!nodes.length) return null;
	if (nodes.length == 1)
		return _getOriginalTargetFromScreenPoint(nodes[0], aScreenX, aScreenY);

	var smallest = [];
	nodes.forEach(function(aNode) {
		if (!smallest.length) {
			smallest.push(aNode);
			return;
		}
		var box = getBoxObjectFor(aNode);
		var size = box.width * box.height;
		var smallestBox = getBoxObjectFor(smallest[0]);
		var smallestSize = smallestBox.width * smallestBox.height;
		if (size == smallestSize) {
			smallest.push(aNode);
		}
		else if (size < smallestSize) {
			smallest = [aNode];
		}
	});

	var node;
	if (smallest.length == 1) {
		node = 	smallest[0];
	}
	else {
		var deepest = [];
		var deepestNest = 0;
		nodes.forEach(function(aNode) {
			var nest = 0;
			var node = aNode;
			for (; node.parentNode; nest++) { node = node.parentNode; }
			if (!deepest.length) {
				deepest.push(aNode);
				deepestNest = nest;
				return
			}
			if (nest == deepestNest) {
				deepest.push(aNode);
			}
			else if (nest > deepestNest) {
				deepest = [aNode];
				deepestNest = nest;
			}
		});
		node = (deepest.length == 1) ? deepest[0] : deepest[deepest.length-1] ;
	}
	return _getOriginalTargetFromScreenPoint(node, aScreenX, aScreenY);
};
	
function _getPopupElementFromScreenPoint(aFrame, aScreenX, aScreenY) 
{
	var doc = aFrame.document;
	var popups = doc.evaluate(
			'/descendant::*[contains(" menupopup popup tooltip panel ", concat(" ", local-name(), " "))]',
			doc,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
	for (var i = 0, maxi = popups.snapshotLength; i < maxi; i++)
	{
		var popup = popups.snapshotItem(i);
		if (popup.state != 'open') continue;
		if (!_isInside(popup.boxObject, aScreenX, aScreenY)) continue;

		var nodes = [];
		var walker = doc.createTreeWalker(popup, NodeFilter.SHOW_ELEMENT, elementFilter, false);
		for (var node = walker.firstChild(); node != null; node = walker.nextNode())
		{
			if (_isInside(getBoxObjectFor(node), aScreenX, aScreenY))
				nodes.push(node);
		}
		if (!nodes.length) continue;
		return _getOriginalTargetFromScreenPoint(nodes[nodes.length-1], aScreenX, aScreenY);
	}
	return null;
}
 
function _getOriginalTargetFromScreenPoint(aElement, aScreenX, aScreenY) 
{
	return _getOriginalTargetFromScreenPointInternal(aElement, aScreenX, aScreenY) || aElement;
}
	
function _getOriginalTargetFromScreenPointInternal(aElement, aScreenX, aScreenY) 
{
	if (!aElement) return null;
	var doc = aElement.ownerDocument;
	var nodes = 'getAnonymousNodes' in doc ? doc.getAnonymousNodes(aElement) : null ;
	if (!nodes || !nodes.length) nodes = aElement.childNodes;
	if (!nodes || !nodes.length) return null;
	for (var i = 0, maxi = nodes.length; i < maxi; i++)
	{
		if (nodes[i].nodeType != nodes[i].ELEMENT_NODE ||
			!_isInside(getBoxObjectFor(nodes[i]), aScreenX, aScreenY))
			continue;
		var node = _getOriginalTargetFromScreenPointInternal(nodes[i], aScreenX, aScreenY);
		if (node) return node;
	}
	return null;
}
  
var elementFilter = function(aNode) { 
	return NodeFilter.FILTER_ACCEPT;
};
  
function getFrameFromScreenPoint(aFrame, aScreenX, aScreenY) 
{
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action.getFrameFromScreenPoint::['+aFrame+'] is not a frame!');

	if ('elementFromPoint' in aFrame.document) {
		var elem = getElementFromScreenPoint(aFrame, aScreenX, aScreenY);
		return elem ? elem.ownerDocument.defaultView : null ;
	}

	var wins = _flattenFrames(aFrame);
	for (var i = wins.length - 1; i >= 0; i--) {
		let win = wins[i];
		let doc = win.document;
		let frameList = [];
		let arr = doc.getElementsByTagName('frame');
		for (let j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		arr = doc.getElementsByTagName('iframe');
		for (let j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		arr = doc.getElementsByTagName('tabbrowser');
		for (let j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		arr = doc.getElementsByTagName('browser');
		for (let j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		for (let j = frameList.length - 1; j >= 0; j--) {
			let box = getBoxObjectFor(frameList[j]);
			if (_isInside(box, aScreenX, aScreenY))
				return frameList[j].contentWindow;
		}
		if (_isInside(getBoxObjectFor(doc.documentElement), aScreenX, aScreenY))
			return win;
	}
	return null;
};
var getWindowFromScreenPoint = getFrameFromScreenPoint; // for backward compatibility
	
function _flattenFrames(aFrame) 
{
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action._flattenFrames::['+aFrame+'] is not a frame!');

	var ret = [aFrame];
	for (var i = 0; i < aFrame.frames.length; i++)
		ret = ret.concat(_flattenFrames(aFrame.frames[i]));
	return ret;
};
  
function _getClientPointFromScreenPoint(aFrame, aScreenX, aScreenY) 
{
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action._getClientPointFromScreenPoint::['+aFrame+'] is not a frame!');

	var box = getBoxObjectFor(aFrame.document.documentElement);
	return {
		x : aScreenX - box.screenX - aFrame.scrollX,
		y : aScreenY - box.screenY - aFrame.scrollY
	};
}
 
function _normalizeScreenAndClientPoint(aOptions, aFrame) 
{
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action._normalizeScreenAndClientPoint::['+aFrame+'] is not a frame!');

	var zoom = isFullZoom() ? getZoom(aFrame) : 1 ;
	var box = getBoxObjectFor(aFrame.document.documentElement);

	var x = ('x' in aOptions ?
			aOptions.x :
		'screenX' in aOptions ?
			aOptions.screenX - box.screenX - aFrame.scrollX :
			0
		) * zoom;
	var y = ('y' in aOptions ?
			aOptions.y :
		'screenY' in aOptions ?
			aOptions.screenY - box.screenY - aFrame.scrollY :
			0
		) * zoom;
	var screenX = ('screenX' in aOptions) ?
			aOptions.screenX :
			box.screenX + x + aFrame.scrollX;
	var screenY = ('screenY' in aOptions) ?
			aOptions.screenY :
			box.screenY + y + aFrame.scrollY;

	aOptions.x = x;
	aOptions.y = y;
	aOptions.screenX = screenX;
	aOptions.screenY = screenY;
}
 
function _isInside(aBox, aScreenX, aScreenY) 
{
	var left   = aBox.screenX;
	var top    = aBox.screenY;
	var right  = left + aBox.width;
	var bottom = top + aBox.height;
	return !(
			left   > aScreenX ||
			right  < aScreenX ||
			top    > aScreenY ||
			bottom < aScreenY
		);
}
  
/* utils */ 
	
function _getWindowUtils(aFrame) 
{
	return aFrame
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIDOMWindowUtils);
};
 
function _getDocumentFromEventTarget(aNode) 
{
	return !aNode ? null :
		(aNode.document || aNode.ownerDocument || aNode );
};
  
