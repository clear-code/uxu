/* 
 User Action Emulator for Firefox 3.5 or later

 Usage:
   Components.utils.import('resource://my-modules/action.jsm');

 lisence: The MIT License, Copyright (c) 2010 ClearCode Inc.
   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 original:
   http://www.clear-code.com/repos/svn/js-codemodules/action.jsm
   http://www.clear-code.com/repos/svn/js-codemodules/action_tests/
*/

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['action'];

// This depends on boxObject.js
// http://www.cozmixng.org/repos/piro/fx3-compatibility-lib/trunk/boxObject.js
const BOX_OBJECT_MODULE = 'resource://uxu-modules/boxObject.js';

// var namespace;
if (typeof namespace == 'undefined') {
	// If namespace.jsm is available, export symbols to the shared namespace.
	// See: http://www.cozmixng.org/repos/piro/fx3-compatibility-lib/trunk/namespace.jsm
	try {
		let ns = {};
		Components.utils.import('resource://uxu-modules/namespace.jsm', ns);
		namespace = ns.getNamespaceFor('clear-code.com');
	}
	catch(e) {
		namespace = (typeof window != 'undefined' ? window : null ) || {};
	}
}

(function() {
	const currentRevision = 1;

	var loadedRevision = 'action' in namespace ?
			namespace.action.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;
 
	namespace.action = { 
		revision : currentRevision,
	
		get Prefs() 
		{
			delete this.Prefs;
			return this.Prefs = Cc['@mozilla.org/preferences;1']
									.getService(Ci.nsIPrefBranch)
									.QueryInterface(Ci.nsIPrefBranch2);
		},
 
		get WindowMediator() 
		{
			delete this.WindowMediator;
			return this.WindowMediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
		},
 
		getBoxObjectFor : function(aNode) 
		{
			return ('getBoxObjectFor' in aNode.ownerDocument) ?
					aNode.ownerDocument.getBoxObjectFor(aNode) :
					this.boxObject.getBoxObjectFor(aNode) ;
		},
	
		get boxObject() 
		{
			delete this.boxObject;
			var ns = {};
			Components.utils.import(BOX_OBJECT_MODULE, ns);
			return this.boxObject = ns.boxObject;
		},
  
/* zoom */ 
	
		isFullZoom : function() 
		{
			try {
				return this.Prefs.getBoolPref('browser.zoom.full');
			}
			catch(e) {
			}
			return false;
		},
 
		getZoom : function(aWindow) 
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
		},
  
/* mouse event */ 
	
// utils 
	
		_getMouseOptionsFor : function(aType, aButton, aArguments) 
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
		},
 
		_getMouseOptionsFromArguments : function(aArguments) 
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
		},
  
// click on element 
	
		clickOn : function() 
		{
			var options = this._getMouseOptionsFor('click', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// leftClickOn
 
		middleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('click', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
 
		rightClickOn : function() 
		{
			var options = this._getMouseOptionsFor('click', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
  
// dblclick on element 
	
		doubleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// doubleclickOn, dblClickOn, dblclickOn,
		// leftDoubleclickOn, leftDoubleClickOn,
		// leftDblClickOn, leftDblclickOn
 
		middleDoubleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// middleDoubleclickOn, middleDblClickOn, middleDblclickOn
 
		rightDoubleClickOn : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// rightDoubleclickOn, rightDblClickOn, rightDblclickOn
  
// mousedown/mouseup on element 
	
		mouseDownOn : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// mousedownOn, leftMouseDownOn, leftMousedownOn
 
		middleMouseDownOn : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// middleMousedownOn
 
		rightMouseDownOn : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// rightMousedownOn
 
		mouseUpOn : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 0, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// mouseupOn, leftMouseUpOn, leftMouseupOn
 
		middleMouseUpOn : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 1, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// middleMouseupOn
 
		rightMouseUpOn : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 2, arguments);
			this.fireMouseEventOnElement(options.element, options);
		},
		// rightMouseupOn
  
// click at position 
	
		clickAt : function() 
		{
			var options = this._getMouseOptionsFor('click', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// leftClickAt
 
		middleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('click', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
 
		rightClickAt : function() 
		{
			var options = this._getMouseOptionsFor('click', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
  
// dblclick at position 
	
		doubleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// doubleclickAt, dblClickAt, dblclickAt,
		// leftDoubleClickAt, leftDoubleclickAt
 
		middleDoubleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// middleDoubleclickAt, middleDblClickAt, middleDblclickAt
 
		rightDoubleClickAt : function() 
		{
			var options = this._getMouseOptionsFor('dblclick', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// rightDoubleclickAt, rightDblClickAt, rightDblclickAt
  
// mousedown/mouseup at position 
	
		mouseDownAt : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// mousedownAt, leftMouseDownAt, leftMousedownA
 
		middleMouseDownAt : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// middleMousedownAt
 
		rightMouseDownAt : function() 
		{
			var options = this._getMouseOptionsFor('mousedown', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// rightMousedownAt
 
		mouseUpAt : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 0, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// mouseupAt, leftMouseUpAt, leftMouseupAt
 
		middleMouseUpAt : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 1, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// middleMouseupAt
 
		rightMouseUpAt : function() 
		{
			var options = this._getMouseOptionsFor('mouseup', 2, arguments);
			this.fireMouseEvent(options.window, options);
		},
		// rightMouseupAt
  
// lower level API 
	
		fireMouseEvent : function(aWindow, aOptions) 
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

			var node = this.getElementFromScreenPoint(aWindow, screenX, screenY);

			if (!this._getOwnerPopup(node)) {
				var utils = this._getWindowUtils(win);

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

			// DOMWindowUtils.sendMouseEvent() fails to send events in popups, so I emulate it manually.

			if (node) {
				this.fireMouseEventOnElement(node, aOptions);
				this._emulateClickOnXULElement(node, aOptions);
			}
			else {
				throw new Error('action.fireMouseEvent::there is no element at ['+x+','+y+']!');
			}
		},
	
		_emulateClickOnXULElement : function(aElement, aOptions) 
		{
			if (!aOptions) aOptions = {};
			this._emulateActionOnXULElement(
				aElement,
				aOptions,
				aOptions.type == 'click' && aOptions.button == 0
			);
		},
 
		_getOwnerPopup : function(aElement) 
		{
			return aElement.ownerDocument.evaluate(
					'ancestor-or-self::*[contains(" menupopup popup tooltip panel ", concat(" ", local-name(), " "))]',
					aElement,
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;
		},
  
		fireMouseEventOnElement : function(aElement, aOptions) 
		{
			if (!aElement ||
				!(aElement instanceof Ci.nsIDOMElement))
				throw new Error('action.fireMouseEventOnElement::['+aElement+'] is not an element!');

			var utils = this._getWindowUtils(aElement.ownerDocument.defaultView);
			if (!aOptions) aOptions = { type : 'click' };
			if (!this._getOwnerPopup(aElement)) {
				this._updateMouseEventOptionsOnElement(aOptions, aElement);
				this.fireMouseEvent(aElement.ownerDocument.defaultView, aOptions);
				return;
			}

			// DOMWindowUtils.sendMouseEvent() fails to send events in popups, so I emulate it manually.

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
		},
	
		_createMouseEventOnElement : function(aElement, aOptions) 
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
		},
 
		_updateMouseEventOptionsOnElement : function(aOptions, aElement) 
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
		},
    
// drag and drop: under construction 
	
		dragStart : function(aWindow, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mousedown';
			this.fireMouseEvent(aWindow, aOptions);
		},
	
		dragStartOnElement : function(aElement, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mousedown';
			this.fireMouseEventOnElement(aElement, aOptions);
		},
  
		dragEnd : function(aWindow, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mouseup';
			this.fireMouseEvent(aWindow, aOptions);
		},
	
		dragEndOnElement : function(aElement, aOptions) 
		{
			if (!aOptions) aOptions = {};
			aOptions.type = 'mouseup';
			this.fireMouseEventOnElement(aElement, aOptions);
		},
  
		dragMove : function(aWindow, aFromX, aFromY, aToX, aToY, aOptions) 
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
		},
	
		dragMove : function(aFromElement, aToElement, aOptions) 
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
		},
  
		dragAndDrop : function(aWindow, aFromX, aFromY, aToX, aToY, aOptions) 
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
		},
	
		dragAndDropOnElement : function(aFromElement, aToElement, aOptions) 
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
		},
   
/* key event */ 
	
// utils 
	
		_getKeyOptionsFor : function(aType, aArguments) 
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
		},
  
		keyPressOn : function() 
		{
			var options = this._getKeyOptionsFor('keypress', arguments);
			this.fireKeyEventOnElement(options.element, options);
		},
		// keypressOn
 
		keyDownOn : function(aElement, aKeyOrCharCode) 
		{
			var options = this._getKeyOptionsFor('keydown', arguments);
			this.fireKeyEventOnElement(options.element, options);
		},
		// keydownOn
 
		keyUpOn : function(aElement, aKeyOrCharCode) 
		{
			var options = this._getKeyOptionsFor('keyup', arguments);
			this.fireKeyEventOnElement(options.element, options);
		},
		// keyupOn
 
// lower level API 
	
		fireKeyEventOnElement : function(aElement, aOptions) 
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

		// nsIDOMWindowUtils.sendKeyEvent() doesn't emulate events fired by user's actual operations.
		// So, I don't use it, and I have to emulate events manually.

		//	var utils = this._getWindowUtils(doc.defaultView);
		//
		//	const nsIDOMNSEvent = Ci.nsIDOMNSEvent;
		//	var flags = 0;
		//	if (aOptions.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MASK;
		//	if (aOptions.altKey) flags |= nsIDOMNSEvent.ALT_MASK;
		//	if (aOptions.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MASK;
		//	if (aOptions.metaKey) flags |= nsIDOMNSEvent.META_MASK;
		//
		//	var keyCode = ('keyCode' in aOptions ? aOptions.keyCode : 0 );
		//	var charCode = ('charCode' in aOptions ? aOptions.charCode : 0 );
		//	utils.focus(aElement);
		//	utils.sendKeyEvent(aOptions.type || 'keypress', keyCode, charCode, flags);

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
		},
	
		_createKeyEventOnElement : function(aElement, aOptions) 
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
		},
 
		_emulateEnterOnXULElement : function(aElement, aOptions) 
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
		},
    
/* XULCommand event */ 
	
		fireXULCommandEvent : function(aWindow, aOptions) 
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
		},
 
		fireXULCommandEventOnElement : function(aElement, aOptions) 
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
		},
	
		_createXULCommandEvent : function(aSourceEvent) 
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
		},
  
		_getXULCommandEventDispatcher : function(aElement) 
		{
			return aElement.ownerDocument.evaluate(
					'ancestor-or-self::*['+
						'contains(" button menuitem checkbox radio tab ", concat(" ", local-name(), " ")) or '+
						'(local-name() = "toolbarbutton" and (not(@type) or @type != "menu"))'+
					'][1]',
					aElement,
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;
		},
 
		_getXULKeyEventDispatcher : function(aElement) 
		{
			return aElement.ownerDocument.evaluate(
					'ancestor-or-self::*['+
						'contains(" button menuitem checkbox radio tab textbox ", concat(" ", local-name(), " ")) or '+
						'(local-name() = "toolbarbutton" and (not(@type) or @type != "menu"))'+
					'][1]',
					aElement,
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;
		},
 
		_emulateActionOnXULElement : function(aElement, aOptions, aIsSimpleGesture) 
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
							Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
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
		},
  
/* text input */ 
	
// utils 
	
		_getInputOptionsFor : function(aArguments) 
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
		},
  
		inputTo : function() 
		{
			var options = this._getInputOptionsFor(arguments);
			this.inputTextToField(options.element, options.input);
		},
 
		appendTo : function() 
		{
			var options = this._getInputOptionsFor(arguments);
			this.inputTextToField(options.element, options.input, true);
		},
 
		pasteTo : function() 
		{
			var options = this._getInputOptionsFor(arguments);
			this.inputTextToField(options.element, options.input, false, true);
		},
 
		additionallyPasteTo : function() 
		{
			var options = this._getInputOptionsFor(arguments);
			this.inputTextToField(options.element, options.input, true, true);
		},
 
// lower level API 
	
		withIMECharacters : '\u3040-\uA4CF\uF900-\uFAFF', 
		get _inputArrayPattern() {
			delete this._inputArrayPattern;
			return this._inputArrayPattern = new RegExp('[^'+this.withIMECharacters+']|['+this.withIMECharacters+']+', 'g');
		},
		get _directInputPattern() {
			delete this._directInputPattern;
			return this._directInputPattern = new RegExp('[^'+this.withIMECharacters+']');
		},
 
		inputTextToField : function(aElement, aValue, aAppend, aDontFireKeyEvents) 
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

				var array = String(aValue || '').match(this._inputArrayPattern);
				if (!array) array = String(aValue || '').split('');
				array.forEach(function(aChar) {
					if (this._directInputPattern.test(aChar)) {
						this.fireKeyEventOnElement(input, {
							type     : 'keypress',
							charCode : aChar.charCodeAt(0)
						});
					}
					else {
						this.fireKeyEventOnElement(input, {
							type    : 'keypress',
							keyCode : 0xE5
						});
						this.inputTextToField(input, aChar, true, true);
					}
				}, this);
			}
			else {
				aElement.value += (aValue || '');
			}

			var doc = this._getDocumentFromEventTarget(aElement);
			var event = doc.createEvent('UIEvents');
			event.initUIEvent('input', true, true, doc.defaultView, 0);
			aElement.dispatchEvent(event);
		},
   
/* 座標操作 */ 
	
		_getWindowFromScreenPoint : function(aScreenX, aScreenY) 
		{
			var windows = this.WindowMediator.getZOrderDOMWindowEnumerator(null, true);
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
			windows = this.WindowMediator.getEnumerator(null);
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
		},
		_getFrameAndScreenPointFromArguments : function(aArguments)
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
		},
 
		getElementFromScreenPoint : function() 
		{
			var [aFrame, aScreenX, aScreenY] = this._getFrameAndScreenPointFromArguments(arguments);
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action.getElementFromScreenPoint::['+aFrame+'] is not a frame!');

			var popup = this._getPopupElementFromScreenPoint(aFrame, aScreenX, aScreenY);
			if (popup) return popup;

			var clientPos = this._getClientPointFromScreenPoint(aFrame, aScreenX, aScreenY);

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
		},
	
		_getPopupElementFromScreenPoint : function(aFrame, aScreenX, aScreenY) 
		{
			var doc = aFrame.document;
			var popups = doc.evaluate(
					'/descendant::*[contains(" menupopup popup tooltip panel ", concat(" ", local-name(), " "))]',
					doc,
					null,
					Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
					null
				);
			for (var i = 0, maxi = popups.snapshotLength; i < maxi; i++)
			{
				var popup = popups.snapshotItem(i);
				if (popup.state != 'open') continue;
				if (!this._isInside(popup.boxObject, aScreenX, aScreenY)) continue;

				var nodes = [];
				var walker = doc.createTreeWalker(popup, Ci.nsIDOMNodeFilter.SHOW_ELEMENT, this._elementFilter, false);
				for (var node = walker.firstChild(); node != null; node = walker.nextNode())
				{
					if (this._isInside(this.getBoxObjectFor(node), aScreenX, aScreenY))
						nodes.push(node);
				}
				if (!nodes.length) continue;
				return this._getOriginalTargetFromScreenPoint(nodes[nodes.length-1], aScreenX, aScreenY);
			}
			return null;
		},
 
		_getOriginalTargetFromScreenPoint : function(aElement, aScreenX, aScreenY) 
		{
			return this._getOriginalTargetFromScreenPointInternal(aElement, aScreenX, aScreenY) || aElement;
		},
	
		_getOriginalTargetFromScreenPointInternal : function(aElement, aScreenX, aScreenY) 
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
		},
  
		_elementFilter : function(aNode) { 
			return Ci.nsIDOMNodeFilter.FILTER_ACCEPT;
		},
  
		getFrameFromScreenPoint : function() 
		{
			var [aFrame, aScreenX, aScreenY] = this._getFrameAndScreenPointFromArguments(arguments);
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action.getFrameFromScreenPoint::['+aFrame+'] is not a frame!');

			var elem = this.getElementFromScreenPoint(aFrame, aScreenX, aScreenY);
			return elem ? elem.ownerDocument.defaultView : null ;
		},
	

  
		_getClientPointFromScreenPoint : function(aFrame, aScreenX, aScreenY) 
		{
			if (!aFrame ||
				!(aFrame instanceof Ci.nsIDOMWindow))
				throw new Error('action._getClientPointFromScreenPoint::['+aFrame+'] is not a frame!');

			var box = this.getBoxObjectFor(aFrame.document.documentElement);
			return {
				x : aScreenX - box.screenX - aFrame.scrollX,
				y : aScreenY - box.screenY - aFrame.scrollY
			};
		},
 
		_normalizeScreenAndClientPoint : function(aOptions, aFrame) 
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
		},
 
		_isInside : function(aBox, aScreenX, aScreenY) 
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
		},
  
/* utils */ 
	
		_getWindowUtils : function(aFrame) 
		{
			return aFrame
					.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIDOMWindowUtils);
		},
 
		_getDocumentFromEventTarget : function(aNode) 
		{
			return !aNode ? null :
				(aNode.document || aNode.ownerDocument || aNode );
		},
  
		export : function(aNamespace) 
		{
			if (!aNamespace)
				aNamespace = (function() { return this; })();
			if (!aNamespace)
				return;

			var self = this;
			_exportedSymbols.forEach(function(aSymbol) {
				aNamespace[aSymbol] = function() {
					return self[aSymbol].apply(self, arguments);
				};
			});
			for (var i in this._exportedSymbolsAliases)
			{
				this._exportedSymbolsAliases[i].forEach(function(aSymbol) {
					aNamespace[aSymbol] = aNamespace[i];
				});
			}
		},
		_exportedSymbols : [],
		_exportedSymbolsAliases : {},
 
		init : function() 
		{
			this._exportedSymbols = [];
			this._exportedSymbolsAliases = {};

			var lastSymbol;

			<![CDATA[

getBoxObjectFor
isFullZoom
getZoom
clickOn
	leftClickOn
middleClickOn
rightClickOn
doubleClickOn
	doubleclickOn
	dblClickOn
	dblclickOn
	leftDoubleclickOn
	leftDoubleClickOn
	leftDblClickOn
	leftDblclickOn
middleDoubleClickOn
	middleDoubleclickOn
	middleDblClickOn
	middleDblclickOn
rightDoubleClickOn
	rightDoubleclickOn
	rightDblClickOn
	rightDblclickOn
mouseDownOn
	mousedownOn
	leftMouseDownOn
	leftMousedownOn
middleMouseDownOn
	middleMousedownOn
rightMouseDownOn
	rightMousedownOn
mouseUpOn
	mouseupOn
	leftMouseUpOn
	leftMouseupOn
middleMouseUpOn
	middleMouseupOn
rightMouseUpOn
	rightMouseupOn
clickAt
	leftClickAt
middleClickAt
rightClickAt
doubleClickAt
	doubleclickAt
	dblClickAt
	dblclickAt
	leftDoubleClickAt
	leftDoubleclickAt
middleDoubleClickAt
	middleDoubleclickAt
	middleDblClickAt
	middleDblclickAt
rightDoubleClickAt
	rightDoubleclickAt
	rightDblClickAt
	rightDblclickAt
mouseDownAt
	mousedownAt
	leftMouseDownAt
	leftMousedownAt
middleMouseDownAt
	middleMousedownAt
rightMouseDownAt
	rightMousedownAt
mouseUpAt
	mouseupAt
	leftMouseUpAt
	leftMouseupAt
middleMouseUpAt
	middleMouseupAt
rightMouseUpAt
	rightMouseupAt
fireMouseEvent
fireMouseEventOnElement
keyPressOn
	keypressOn
keyDownOn
	keydownOn
keyUpOn
	keyupOn
fireKeyEventOnElement
fireXULCommandEvent
fireXULCommandEventOnElement
inputTo
appendTo
pasteTo
additionallyPasteTo
inputTextToField
getElementFromScreenPoint
getFrameFromScreenPoint
	getWindowFromScreenPoint

			]]>.toString()
				.replace(/^\s+|\s+$/g, '')
				.split('\n')
				.forEach(function(aSymbol) {
					if (/^\s/.test(aSymbol)) {
						aSymbol = aSymbol.replace(/^\s+/, '');
						if (!(lastSymbol in this._exportedSymbolsAliases))
							this._exportedSymbolsAliases[lastSymbol] = [];
						this._exportedSymbolsAliases[lastSymbol].push(aSymbol);
						this[aSymbol] = this[lastSymbol];
					}
					else {
						lastSymbol = aSymbol;
						this._exportedSymbols.push(aSymbol);
					}
				}, this);
		}
 
	}; 
	namespace.action.init();
  
})(); 

var action = namespace.action;
 
