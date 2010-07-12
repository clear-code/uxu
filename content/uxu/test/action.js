// -*- indent-tabs-mode: t; tab-width: 4 -*- 
 
const Cc = Components.classes; 
const Ci = Components.interfaces;

var Prefs = Components.classes['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch)
		.QueryInterface(Ci.nsIPrefBranch2);
 
function constructor(aEnvironment) 
{
	this.utils = aEnvironment;
	this.shouldEmulateMouseEvent = Prefs.getBoolPref('extensions.uxu.action.fireMouseEvent.useOldMethod');
	this.shouldEmulateKeyEvent = Prefs.getBoolPref('extensions.uxu.action.fireKeyEvent.useOldMethod');
	this.readiedActionListeners = [];
}
	
function destroy() 
{
	this.cancelReadiedActions();
	delete this.utils;
}
  
function getBoxObjectFor(aNode) 
{
	if ('getBoxObjectFor' in aNode.ownerDocument)
		return aNode.ownerDocument.getBoxObjectFor(aNode);

	if (!('boxObject' in _boxObjectModule)) {
		Components.utils.import(
			'resource://uxu-modules/boxObject.js',
			_boxObjectModule
		);
	}
	return _boxObjectModule
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
	var options = this._getMouseOptionsFromArguments(aArguments);
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
	}, this);

	if (!w && x !== void(0) && y !== void(0)) {
		w = this._getWindowFromScreenPoint(x, y);
		w = this.getFrameFromScreenPoint(w, x, y);
		let root = this.getBoxObjectFor(w.document.documentElement);
		x = x - root.screenX - w.scrollX;
		y = y - root.screenY - w.scrollY;
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
	var options = this._getMouseOptionsFor('click', 0, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var leftClickOn = clickOn;
 
function middleClickOn() 
{
	var options = this._getMouseOptionsFor('click', 1, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
 
function rightClickOn() 
{
	var options = this._getMouseOptionsFor('click', 2, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
  
// dblclick on element 
	
function doubleClickOn() 
{
	var options = this._getMouseOptionsFor('dblclick', 0, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var doubleclickOn = doubleClickOn;
var dblClickOn = doubleClickOn;
var dblclickOn = doubleClickOn;
var leftDoubleclickOn = doubleClickOn;
var leftDoubleClickOn = doubleClickOn;
var leftDblClickOn = doubleClickOn;
var leftDblclickOn = doubleClickOn;
 
function middleDoubleClickOn() 
{
	var options = this._getMouseOptionsFor('dblclick', 1, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var middleDoubleclickOn = middleDoubleClickOn;
var middleDblClickOn = middleDoubleClickOn;
var middleDblclickOn = middleDoubleClickOn;
 
function rightDoubleClickOn() 
{
	var options = this._getMouseOptionsFor('dblclick', 2, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var rightDoubleclickOn = rightDoubleClickOn;
var rightDblClickOn = rightDoubleClickOn;
var rightDblclickOn = rightDoubleClickOn;
  
// mousedown/mouseup on element 
	
function mouseDownOn() 
{
	var options = this._getMouseOptionsFor('mousedown', 0, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var mousedownOn = mouseDownOn;
var leftMouseDownOn = mouseDownOn;
var leftMousedownOn = mouseDownOn;
 
function middleMouseDownOn() 
{
	var options = this._getMouseOptionsFor('mousedown', 1, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var middleMousedownOn = middleMouseDownOn;
 
function rightMouseDownOn() 
{
	var options = this._getMouseOptionsFor('mousedown', 2, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var rightMousedownOn = rightMouseDownOn;
 
function mouseUpOn() 
{
	var options = this._getMouseOptionsFor('mouseup', 0, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var mouseupOn = mouseUpOn;
var leftMouseUpOn = mouseUpOn;
var leftMouseupOn = mouseUpOn;
 
function middleMouseUpOn() 
{
	var options = this._getMouseOptionsFor('mouseup', 1, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var middleMouseupOn = middleMouseUpOn;
 
function rightMouseUpOn() 
{
	var options = this._getMouseOptionsFor('mouseup', 2, arguments);
	this.fireMouseEventOnElement(options.element, options);
}
var rightMouseupOn = rightMouseUpOn;
  
// click at position 
	
function clickAt() 
{
	var options = this._getMouseOptionsFor('click', 0, arguments);
	this.fireMouseEvent(options.window, options);
}
var leftClickAt = clickAt;
 
function middleClickAt() 
{
	var options = this._getMouseOptionsFor('click', 1, arguments);
	this.fireMouseEvent(options.window, options);
}
 
function rightClickAt() 
{
	var options = this._getMouseOptionsFor('click', 2, arguments);
	this.fireMouseEvent(options.window, options);
}
  
// dblclick at position 
	
function doubleClickAt() 
{
	var options = this._getMouseOptionsFor('dblclick', 0, arguments);
	this.fireMouseEvent(options.window, options);
}
var doubleclickAt = doubleClickAt;
var dblClickAt = doubleClickAt;
var dblclickAt = doubleClickAt;
var leftDoubleClickAt = doubleClickAt;
var leftDoubleclickAt = doubleClickAt;
 
function middleDoubleClickAt() 
{
	var options = this._getMouseOptionsFor('dblclick', 1, arguments);
	this.fireMouseEvent(options.window, options);
}
var middleDoubleclickAt = middleDoubleClickAt;
var middleDblClickAt = middleDoubleClickAt;
var middleDblclickAt = middleDoubleClickAt;
 
function rightDoubleClickAt() 
{
	var options = this._getMouseOptionsFor('dblclick', 2, arguments);
	this.fireMouseEvent(options.window, options);
}
var rightDoubleclickAt = rightDoubleClickAt;
var rightDblClickAt = rightDoubleClickAt;
var rightDblclickAt = rightDoubleClickAt;
  
// mousedown/mouseup at position 
	
function mouseDownAt() 
{
	var options = this._getMouseOptionsFor('mousedown', 0, arguments);
	this.fireMouseEvent(options.window, options);
}
var mousedownAt = mouseDownAt;
var leftMouseDownAt = mouseDownAt;
var leftMousedownAt = mouseDownAt;
 
function middleMouseDownAt() 
{
	var options = this._getMouseOptionsFor('mousedown', 1, arguments);
	this.fireMouseEvent(options.window, options);
}
var middleMousedownAt = middleMouseDownAt;
 
function rightMouseDownAt() 
{
	var options = this._getMouseOptionsFor('mousedown', 2, arguments);
	this.fireMouseEvent(options.window, options);
}
var rightMousedownAt = rightMouseDownAt;
 
function mouseUpAt() 
{
	var options = this._getMouseOptionsFor('mouseup', 0, arguments);
	this.fireMouseEvent(options.window, options);
}
var mouseupAt = mouseUpAt;
var leftMouseUpAt = mouseUpAt;
var leftMouseupAt = mouseUpAt;
 
function middleMouseUpAt() 
{
	var options = this._getMouseOptionsFor('mouseup', 1, arguments);
	this.fireMouseEvent(options.window, options);
}
var middleMouseupAt = middleMouseUpAt;
 
function rightMouseUpAt() 
{
	var options = this._getMouseOptionsFor('mouseup', 2, arguments);
	this.fireMouseEvent(options.window, options);
}
var rightMouseupAt = rightMouseUpAt;
  
// lower level API 
	
function fireMouseEvent(aWindow, aOptions) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action.fireMouseEvent::['+aWindow+'] is not a frame!');

	if (!aOptions) aOptions = {};

	this._normalizeScreenAndClientPoint(aOptions, aWindow);
	var x = aOptions.x;
	var y = aOptions.y;
	var screenX = aOptions.screenX;
	var screenY = aOptions.screenY;

	var win = this.getFrameFromScreenPoint(aWindow, screenX, screenY);
	if (!win ||
		!(win instanceof Ci.nsIDOMWindow))
		throw new Error('action.fireMouseEvent::there is no frame at ['+screenX+', '+screenY+']!');

	var utils = this._getWindowUtils(win);
	var node = this.getElementFromScreenPoint(aWindow, screenX, screenY);

	if (
		'sendMouseEvent' in utils &&
		!this.shouldEmulateMouseEvent &&
		!this._getOwnerPopup(node)
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
//				this._emulateClickOnXULElement(node, aOptions);
				break;
		}
		return;
	}

	if (node) {
		this.fireMouseEventOnElement(node, aOptions);
		this._emulateClickOnXULElement(node, aOptions);
	}
	else
		throw new Error('action.fireMouseEvent::there is no element at ['+x+','+y+']!');
};
	
function _emulateClickOnXULElement(aElement, aOptions) 
{
	if (!aOptions) aOptions = {};
	this._emulateActionOnXULElement(
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

	var utils = this._getWindowUtils(aElement.ownerDocument.defaultView);
	if (!aOptions) aOptions = { type : 'click' };
	if (
		'sendMouseEvent' in utils &&
		!this.shouldEmulateMouseEvent &&
		!this._getOwnerPopup(aElement)
		) {
		this._updateMouseEventOptionsOnElement(aOptions, aElement);
		this.fireMouseEvent(aElement.ownerDocument.defaultView, aOptions);
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
			options = {
				type      : 'mousedown',
				detail    : detail,
				__proto__ : aOptions
			};
			this.fireMouseEventOnElement(aElement, options);
			options.type = 'mouseup';
			this.fireMouseEventOnElement(aElement, options);
			detail++;
		case 'click':
		default:
			options = {
				type      : 'mousedown',
				detail    : detail,
				__proto__ : aOptions
			};
			this.fireMouseEventOnElement(aElement, options);
			options.type = 'mouseup';
			this.fireMouseEventOnElement(aElement, options);
			break;
	}
	event = this._createMouseEventOnElement(aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(event);
	if (aOptions.type != 'mousedown' &&
		aOptions.type != 'mouseup' &&
		aOptions.type != 'dblclick')
		this._emulateClickOnXULElement(aElement, aOptions);
};
	
function _createMouseEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action._createMouseEventOnElement::['+aElement+'] is not an element!');

	if (!aOptions) aOptions = {};
	if (!aElement) return null;
	this._updateMouseEventOptionsOnElement(aOptions, aElement);

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

	var doc = this._getDocumentFromEventTarget(aElement);
	var frame = doc.defaultView;
	var box = this.getBoxObjectFor(aElement);
	var root = doc.documentElement;
	var rootBox = this.getBoxObjectFor(root);

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
	this.fireMouseEvent(aWindow, aOptions);
};
	
function dragStartOnElement(aElement, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.type = 'mousedown';
	this.fireMouseEventOnElement(aElement, aOptions);
};
  
function dragEnd(aWindow, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.type = 'mouseup';
	this.fireMouseEvent(aWindow, aOptions);
};
	
function dragEndOnElement(aElement, aOptions) 
{
	if (!aOptions) aOptions = {};
	aOptions.type = 'mouseup';
	this.fireMouseEventOnElement(aElement, aOptions);
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
			_this.fireMouseEvent(aWindow, aOptions);
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
	var fromBox = this.getBoxObjectFor(aFromElement);
	var toBox = this.getBoxObjectFor(aToElement);
	return this.dragMove(
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
	this.dragStart(aWindow, aOptions);
	var dragEndFlag = { value : false };
	var _this = this;
	aWindow.setTimeout(function() {
		var flag = aSelf.dragMove(aWindow, aFromX, aFromY, aToX, aToY, aOptions);
		var timer = aWindow.setInterval(function() {
			if (!flag.value) return;
			aWindow.clearInterval(timer);
			aOptions.screenX = aToX;
			aOptions.screenY = aToY;
			aSelf.dragEnd(aWindow, aOptions);
			dragEndFlag.value = true;
		}, 10, this);
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
	var fromBox = this.getBoxObjectFor(aFromElement);
	var toBox = this.getBoxObjectFor(aToElement);
	return this.dragAndDrop(
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
	}, this);

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
	var options = this._getKeyOptionsFor('keypress', arguments);
	this.fireKeyEventOnElement(options.element, options);
}
var keypressOn = keyPressOn;
 
function keyDownOn(aElement, aKeyOrCharCode) 
{
	var options = this._getKeyOptionsFor('keydown', arguments);
	this.fireKeyEventOnElement(options.element, options);
}
var keydownOn = keyDownOn;
 
function keyUpOn(aElement, aKeyOrCharCode) 
{
	var options = this._getKeyOptionsFor('keyup', arguments);
	this.fireKeyEventOnElement(options.element, options);
}
var keyupOn = keyUpOn;
 
// lower level API 
	
function fireKeyEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action.fireKeyEventOnElement::['+aElement+'] is not an element!');

	if (aElement instanceof Ci.nsIDOMXULElement) {
		let dispatcher = this._getXULKeyEventDispatcher(aElement);
		if (!dispatcher || dispatcher.getAttribute('disabled') == 'true')
			return;
	}

	if (!aOptions) aOptions = {};
	if (!aOptions.type) aOptions.type = 'keypress';

	if (aElement.localName == 'textbox' &&
		'inputField' in aElement &&
		aElement.inputField instanceof Ci.nsIDOMElement)
		aElement = aElement.inputField;

	var doc = this._getDocumentFromEventTarget(aElement);
	var utils = this._getWindowUtils(doc.defaultView);
	if ('sendKeyEvent' in utils &&
		!this.shouldEmulateKeyEvent) {
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
			var options = {
					type      : 'keydown',
					__proto__ : aOptions
				};
			this.fireKeyEventOnElement(aElement, options);
			options.type = 'keyup';
			this.fireKeyEventOnElement(aElement, options);
			break;
	}
	aElement.dispatchEvent(this._createKeyEventOnElement(aElement, aOptions));
	if (aOptions.type != 'keydown' &&
		aOptions.type != 'keyup')
		this._emulateEnterOnXULElement(aElement, aOptions);
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
	var doc = this._getDocumentFromEventTarget(node);
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
	this._emulateActionOnXULElement(
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
	this._normalizeScreenAndClientPoint(aOptions, aWindow);
	var node = this.getElementFromScreenPoint(aWindow, aOptions.screenX, aOptions.screenY);
	if (!node)
		throw new Error('action.fireXULCommandEvent::there is no element at ['+aOptions.screenX+','+aOptions.screenY+']!');
	return this.fireXULCommandEventOnElement(node, aOptions);
};
 
function fireXULCommandEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action.fireXULCommandEventOnElement:['+aElement+'] is not an element!');

	aElement = this._getXULCommandEventDispatcher(aElement);
	if (!aElement || aElement.getAttribute('disabled') == 'true')
		return false;

	var event = this._createMouseEventOnElement(aElement, aOptions);
	if (event) {
		aElement.dispatchEvent(this._createXULCommandEvent(event));
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

	var target = this._getXULCommandEventDispatcher(aElement);
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
		this.fireXULCommandEventOnElement(target, aOptions);
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
	var options = this._getInputOptionsFor(arguments);
	this.inputTextToField(options.element, options.input);
}
 
function appendTo() 
{
	var options = this._getInputOptionsFor(arguments);
	this.inputTextToField(options.element, options.input, true);
}
 
function pasteTo() 
{
	var options = this._getInputOptionsFor(arguments);
	this.inputTextToField(options.element, options.input, false, true);
}
 
function additionallyPasteTo() 
{
	var options = this._getInputOptionsFor(arguments);
	this.inputTextToField(options.element, options.input, true, true);
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

	var doc = this._getDocumentFromEventTarget(aElement);
	var event = doc.createEvent('UIEvents');
	event.initUIEvent('input', true, true, doc.defaultView, 0);
	aElement.dispatchEvent(event);
};
   
/* ダイアログ操作の予約 */ 
var COMMON_DIALOG_URL = 'chrome://global/content/commonDialog.xul';
var SELECT_DIALOG_URL = 'chrome://global/content/selectDialog.xul';
	
function readyToOK(aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != COMMON_DIALOG_URL ||
				!aWindow.gCommonDialogParam ||
				self.readiedActionListeners.indexOf(listener) < 0)
				return;
			var params = aWindow.gCommonDialogParam;

			var buttonsCount = params.GetInt(2);
			if (buttonsCount != 1)
				return;

			var title = params.GetString(12);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(0);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick();
				}

				doc.documentElement.getButton('accept').doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
}
var readyToOk = readyToOK;
 
function readyToConfirm(aYes, aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != COMMON_DIALOG_URL ||
				!aWindow.gCommonDialogParam)
				return;
			var params = aWindow.gCommonDialogParam;

			var buttonsCount = params.GetInt(2);
			if (buttonsCount != 2 && buttonsCount != 3)
				return;

			var title = params.GetString(12);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(0);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick();
				}

				var button = (typeof aYes == 'number') ?
						aYes :
						(aYes ? 0 : 1 ) ;
				button = Math.min(button, buttonsCount-1);
				var buttonType;
				switch (button)
				{
					default:
					case 0: buttonType = 'accept'; break;
					case 1: buttonType = 'cancel'; break;
					case 2: buttonType = 'extra1'; break;
				}

				doc.documentElement.getButton(buttonType).doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
}
 
function readyToPrompt(aInput, aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != COMMON_DIALOG_URL ||
				!aWindow.gCommonDialogParam)
				return;
			var params = aWindow.gCommonDialogParam;

			var inputFieldsCount = params.GetInt(3);
			if (aOptions.inputFieldsType == 'both' ?
					(inputFieldsCount != 2) :
					(inputFieldsCount != 1))
				return;

			var passwordType = params.GetInt(4) == 1;
			if (passwordType != (aOptions.inputFieldsType == 'password'))
				return;

			var title = params.GetString(12);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(0);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick();
				}

				var usernameField = doc.getElementById('loginTextbox');
				var password1Field = doc.getElementById('password1Textbox');
				var password2Field = doc.getElementById('password2Textbox');

				switch (aOptions.inputFieldsType)
				{
					default:
						usernameField.value = aInput;
						break;

					case 'password':
						password1Field.value = aOptions.password;
						break;

					case 'both':
						usernameField.value = aOptions.username;
						password1Field.value = aOptions.password;
						break;
				}

				doc.documentElement.getButton('accept').doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
}
 
function readyToPromptPassword(aInput, aOptions)
{
	this.readyToPrompt(
		null,
		{
			password : aPassword,
			inputFieldsType : 'password',
			__proto__ : aOptions
		}
	);
}
 
function readyToPromptUsernameAndPassword(aUsername, aPassword, aOptions)
{
	this.readyToPrompt(
		null,
		{
			username : aUsername,
			password : aPassword,
			inputFieldsType : 'both',
			__proto__ : aOptions
		}
	);
}
 
function readyToSelect(aSelectedIndexes, aOptions)
{
	aOptions = aOptions || {};
	if (typeof aSelectedIndexes == 'number')
		aSelectedIndexes = [aSelectedIndexes];

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != SELECT_DIALOG_URL ||
				!aWindow.gCommonDialogParam)
				return;
			var params = aWindow.gCommonDialogParam;

			var title = params.GetString(0);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(1);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var list = doc.getElementById('list');
				aSelectedIndexes.forEach(function(aIndex) {
					var item = this.getItemAtIndex(aIndex);
					if (item)
						list.addItemToSelection(item);
				});

				doc.documentElement.getButton('accept').doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
}
 
function cancelReadiedActions(aInput) 
{
	this.readiedActionListeners.forEach(function(aListener) {
		this.utils.removeWindowWatcher(aListener);
	}, this);
	this.readiedActionListeners = [];
}
	
function cancelReadiedAction(aListener) 
{
	this.utils.removeWindowWatcher(aListener);
	var index = this.readiedActionListeners.indexOf(aListener);
	if (index > -1)
		this.readiedActionListeners.splice(index, 1);
}
   
/* 座標操作 */ 
	
const WindowMediator = Cc['@mozilla.org/appshell/window-mediator;1']
							.getService(Ci.nsIWindowMediator);
function _getWindowFromScreenPoint(aScreenX, aScreenY) 
{
	var windows = WindowMediator.getZOrderDOMWindowEnumerator(null, true);
	if (windows.hasMoreElements()) {
		while (windows.hasMoreElements())
		{
			let w = windows.getNext().QueryInterface(Ci.nsIDOMWindowInternal);
			if (this._isInside({
					x      : w.screenX,
					y      : w.screenY,
					width  : w.outerWidth,
					height : w.outerHeight
				}, aScreenX, aScreenY))
				return w;
		}
		throw new Error('action._getWindowFromScreenPoint:: there is no window at '+aScreenX+', '+aScreenY+'!');
	}
	// By the bug 156333, we cannot find windows by their Z order on Linux.
	// https://bugzilla.mozilla.org/show_bug.cgi?id=156333
	// This is alternative way for failover.
	windows = WindowMediator.getEnumerator(null);
	var array = [];
	while (windows.hasMoreElements())
	{
		array.push(windows.getNext().QueryInterface(Ci.nsIDOMWindowInternal));
	}
	var youngest;
	array.reverse()
		.some(function(aWindow) {
			youngest = this._isInside({
						x      : aWindow.screenX,
						y      : aWindow.screenY,
						width  : aWindow.outerWidth,
						height : aWindow.outerHeight
					}, aScreenX, aScreenY) ?
						aWindow :
						null ;
			return youngest;
		}, this);
	if (youngest) return youngest;
	throw new Error('action._getWindowFromScreenPoint:: there is no window at '+aScreenX+', '+aScreenY+'!');
}
function _getFrameAndScreenPointFromArguments(aArguments)
{
	var w, x, y;
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
		}
		return (x !== void(0) && y !== void(0));
	});
	if (!w)
		w = this._getWindowFromScreenPoint(x, y);
	return [w, x, y];
}
 
function getElementFromScreenPoint() 
{
	var [aFrame, aScreenX, aScreenY] = this._getFrameAndScreenPointFromArguments(arguments);
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action.getElementFromScreenPoint::['+aFrame+'] is not a frame!');

	var popup = this._getPopupElementFromScreenPoint(aFrame, aScreenX, aScreenY);
	if (popup) return popup;

	var clientPos = this._getClientPointFromScreenPoint(aFrame, aScreenX, aScreenY);
	if ('elementFromPoint' in aFrame.document) {
		var elem = aFrame.document.elementFromPoint(clientPos.x, clientPos.y);
		if (
			elem &&
			(
				/^(i?frame|browser)$/i.test(elem.localName) ||
				(elem.localName == 'tabbrowser' &&
				this._isInside(elem.mPanelContainer.boxObject, aScreenX, aScreenY))
			)
			) {
			var node = this.getElementFromScreenPoint(
					elem.contentWindow,
					aScreenX + aFrame.scrollX,
					aScreenY + aFrame.scrollY
				);
			return this._getOriginalTargetFromScreenPoint(node, aScreenX, aScreenY);
		}
		return this._getOriginalTargetFromScreenPoint(elem, aScreenX, aScreenY);
	}

	aFrame = this.getFrameFromScreenPoint(aFrame, aScreenX, aScreenY);
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
		if (this._isInside(this.getBoxObjectFor(node), aScreenX, aScreenY))
			nodes.push(node);
	}

	if (!nodes.length) return null;
	if (nodes.length == 1)
		return this._getOriginalTargetFromScreenPoint(nodes[0], aScreenX, aScreenY);

	var smallest = [];
	nodes.forEach(function(aNode) {
		if (!smallest.length) {
			smallest.push(aNode);
			return;
		}
		var box = this.getBoxObjectFor(aNode);
		var size = box.width * box.height;
		var smallestBox = this.getBoxObjectFor(smallest[0]);
		var smallestSize = smallestBox.width * smallestBox.height;
		if (size == smallestSize) {
			smallest.push(aNode);
		}
		else if (size < smallestSize) {
			smallest = [aNode];
		}
	}, this);

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
		}, this);
		node = (deepest.length == 1) ? deepest[0] : deepest[deepest.length-1] ;
	}
	return this._getOriginalTargetFromScreenPoint(node, aScreenX, aScreenY);
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
		if (!this._isInside(popup.boxObject, aScreenX, aScreenY)) continue;

		var nodes = [];
		var walker = doc.createTreeWalker(popup, NodeFilter.SHOW_ELEMENT, elementFilter, false);
		for (var node = walker.firstChild(); node != null; node = walker.nextNode())
		{
			if (this._isInside(this.getBoxObjectFor(node), aScreenX, aScreenY))
				nodes.push(node);
		}
		if (!nodes.length) continue;
		return this._getOriginalTargetFromScreenPoint(nodes[nodes.length-1], aScreenX, aScreenY);
	}
	return null;
}
 
function _getOriginalTargetFromScreenPoint(aElement, aScreenX, aScreenY) 
{
	return this._getOriginalTargetFromScreenPointInternal(aElement, aScreenX, aScreenY) || aElement;
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
			!this._isInside(this.getBoxObjectFor(nodes[i]), aScreenX, aScreenY))
			continue;
		var node = this._getOriginalTargetFromScreenPointInternal(nodes[i], aScreenX, aScreenY);
		if (node) return node;
	}
	return null;
}
  
var elementFilter = function(aNode) { 
	return NodeFilter.FILTER_ACCEPT;
};
  
function getFrameFromScreenPoint() 
{
	var [aFrame, aScreenX, aScreenY] = this._getFrameAndScreenPointFromArguments(arguments);
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action.getFrameFromScreenPoint::['+aFrame+'] is not a frame!');

	if ('elementFromPoint' in aFrame.document) {
		var elem = this.getElementFromScreenPoint(aFrame, aScreenX, aScreenY);
		return elem ? elem.ownerDocument.defaultView : null ;
	}

	var wins = this._flattenFrames(aFrame);
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
			let box = this.getBoxObjectFor(frameList[j]);
			if (this._isInside(box, aScreenX, aScreenY))
				return frameList[j].contentWindow;
		}
		if (this._isInside(this.getBoxObjectFor(doc.documentElement), aScreenX, aScreenY))
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
		ret = ret.concat(this._flattenFrames(aFrame.frames[i]));
	return ret;
};
  
function _getClientPointFromScreenPoint(aFrame, aScreenX, aScreenY) 
{
	if (!aFrame ||
		!(aFrame instanceof Ci.nsIDOMWindow))
		throw new Error('action._getClientPointFromScreenPoint::['+aFrame+'] is not a frame!');

	var box = this.getBoxObjectFor(aFrame.document.documentElement);
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

	var zoom = this.isFullZoom() ? this.getZoom(aFrame) : 1 ;
	var box = this.getBoxObjectFor(aFrame.document.documentElement);

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
  
