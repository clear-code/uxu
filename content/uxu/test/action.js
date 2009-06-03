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
	var markupDocumentViewer = aWindow.top
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIWebNavigation)
			.QueryInterface(Ci.nsIDocShell)
			.contentViewer
			.QueryInterface(Ci.nsIMarkupDocumentViewer);
	return markupDocumentViewer.fullZoom;
};
  
/* mouse event */ 
	 
function fireMouseEvent(aWindow, aOptions) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action.fireMouseEvent::['+aWindow+'] is not a frame!');

	if (!aOptions) aOptions = {};

	var zoom = this.isFullZoom() ? this.getZoom(aWindow) : 1 ;
	var box = getBoxObjectFor(aWindow.document.documentElement);
	var x = ('x' in aOptions ?
			aOptions.x :
		'screenX' in aOptions ?
			aOptions.screenX - box.screenX - aWindow.scrollX :
			0
		) * zoom;
	var y = ('y' in aOptions ?
			aOptions.y :
		'screenY' in aOptions ?
			aOptions.screenY - box.screenY - aWindow.scrollY :
			0
		) * zoom;
	var screenX = ('screenX' in aOptions) ?
			aOptions.screenX :
			box.screenX + x + aWindow.scrollX;
	var screenY = ('screenY' in aOptions) ?
			aOptions.screenY :
			box.screenY + y + aWindow.scrollY;

	var win = this.getWindowFromScreenPoint(aWindow, screenX, screenY);
	if (!win ||
		!(win instanceof Ci.nsIDOMWindow))
		throw new Error('action.fireMouseEvent::there is no frame at ['+screenX+', '+screenY+']!');

	var utils = this._getWindowUtils(win);
	var node = this.getElementFromScreenPoint(aWindow, screenX, screenY);

	if (
		'sendMouseEvent' in utils &&
		!shouldEmulateMouseEvent &&
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
				this._emulateClickOnXULElement(node, aOptions);
				break;
		}
		return;
	}

	if (node) {
		this.fireMouseEventOnElement(node, aOptions);
		this._emulateClickOnXULElement(node, aOptions);
	}
	else
		throw new Error('action.fireMouseEvent::there is no element at [')+x+','+y+']!';
};
	 
function _emulateClickOnXULElement(aElement, aOptions) 
{
	if (!aElement) return;

	var target = this._getXULCommandEventDispatcher(aElement) || aElement ;
	if (target.getAttribute('disabled') == 'true') return;

	if (!aOptions) aOptions = {};
	var isSimpleAction = !(
			aOptions.altKey ||
			aOptions.ctrlKey ||
			aOptions.shiftKey ||
			aOptions.metaKey
		);
	var isSimpleClick = !(
			aOptions.type != 'click' ||
			aOptions.button != 0 ||
			!isSimpleAction
		);
	var shouldSendXULCommandEvent = false;

	switch (target.localName)
	{
		case 'menuitem':
			if (!isSimpleClick) return;
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
			if (!isSimpleClick) return;
			shouldSendXULCommandEvent = true;
			break;

		case 'toolbarbutton':
			if (target.localName == 'toolbarbutton' &&
				target.getAttribute('type') != 'menu') {
				if (!isSimpleClick) return;
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
		!shouldEmulateMouseEvent &&
		!this._getOwnerPopup(aElement)
		) {
		this._updateMouseEventOptionsOnElement(aOptions, aElement);
		this.fireMouseEvent(aElement.ownerDocument.defaultView, aOptions);
		return;
	}

	var detail = 1;
	switch (aOptions.type)
	{
		case 'mousedown':
		case 'mouseup':
			break;
		case 'dblclick':
			var options = { type : 'mousedown', detail : detail };
			options.__proto__ = aOptions;
			this.fireMouseEventOnElement(aElement, options);
			options.type = 'mouseup';
			this.fireMouseEventOnElement(aElement, options);
			detail++;
		case 'click':
		default:
			var options = { type : 'mousedown', detail : detail };
			options.__proto__ = aOptions;
			this.fireMouseEventOnElement(aElement, options);
			options.type = 'mouseup';
			this.fireMouseEventOnElement(aElement, options);
			break;
	}
	var event = this._createMouseEventOnElement(aElement, aOptions);
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
		if (!('screenX' in aOptions)) aOptions.screenX = box.screenX + parseInt(box.width / 2);
		if (!('screenY' in aOptions)) aOptions.screenY = box.screenY + parseInt(box.height / 2);
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

		if (!('screenX' in aOptions)) aOptions.screenX = visibleX + parseInt(visibleW / 2);
		if (!('screenY' in aOptions)) aOptions.screenY = visibleY + parseInt(visibleH / 2);
	}

	if (!('x' in aOptions)) aOptions.x = aOptions.screenX - rootBox.screenX - frame.scrollX;
	if (!('y' in aOptions)) aOptions.y = aOptions.screenY - rootBox.screenY - frame.scrollY;
}
  
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
	var fromBox = getBoxObjectFor(aFromElement);
	var toBox = getBoxObjectFor(aToElement);
	return this.dragMove(
			win,
			fromBox.screenX + parseInt(fromBox.width / 2),
			fromBox.screenY + parseInt(fromBox.height / 2),
			toBox.screenX + parseInt(toBox.width / 2),
			toBox.screenY + parseInt(toBox.height / 2),
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
		var flag = _this.dragMove(aWindow, aFromX, aFromY, aToX, aToY, aOptions);
		var timer = aWindow.setInterval(function() {
			if (!flag.value) return;
			aWindow.clearInterval(timer);
			aOptions.screenX = aToX;
			aOptions.screenY = aToY;
			_this.dragEnd(aWindow, aOptions);
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
	return this.dragAndDrop(
			win,
			fromBox.screenX + parseInt(fromBox.width / 2),
			fromBox.screenY + parseInt(fromBox.height / 2),
			toBox.screenX + parseInt(toBox.width / 2),
			toBox.screenY + parseInt(toBox.height / 2),
			aOptions
		);
};
   
/* key event */ 
	
function fireKeyEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action.fireKeyEventOnElement::['+aElement+'] is not an element!');

	if (aElement.localName == 'textbox' &&
		'inputField' in aElement &&
		aElement.inputField instanceof Ci.nsIDOMElement)
		aElement = aElement.inputField;

	var doc = this._getDocumentFromEventTarget(aElement);
	var utils = this._getWindowUtils(doc.defaultView);
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
			this.fireKeyEventOnElement(aElement, options);
			options.type = 'keyup';
			this.fireKeyEventOnElement(aElement, options);
			break;
	}
	var event = this._createKeyEventOnElement(aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(event);
};
	 
function _createKeyEventOnElement(aElement, aOptions) 
{
	if (!aElement ||
		!(aElement instanceof Ci.nsIDOMElement))
		throw new Error('action._createKeyEventOnElement::['+aElement+'] is not an element!');

	if (!aOptions) aOptions = {};

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
   
/* XULCommand event */ 
	 
function fireXULCommandEvent(aWindow, aOptions) 
{
	if (!aOptions) aOptions = {};
	var node = this.getElementFromScreenPoint(
				aWindow,
				('x' in aOptions ? aOptions.x : 0),
				('y' in aOptions ? aOptions.y : 0)
			);
	node = this._getXULCommandEventDispatcher(node);
	if (node)
		this.fireXULCommandEventOnElement(node, aOptions);
};
 
function fireXULCommandEventOnElement(aElement, aOptions) 
{
	var event = this._createMouseEventOnElement(aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(this._createXULCommandEvent(event));
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
			'ancestor-or-self::*[contains(" button toolbarbutton menuitem checkbox radio tab ", concat(" ", local-name(), " "))]',
			aElement,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}
  
/* text input */ 
	
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
  
/* ç¿ïWëÄçÏ */ 
	 
function getElementFromScreenPoint(aWindow, aScreenX, aScreenY) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action.getElementFromScreenPoint::['+aWindow+'] is not a frame!');

	var popup = this._getPopupElementFromScreenPoint(aWindow, aScreenX, aScreenY);
	if (popup) return popup;

	var clientPos = this._getClientPointFromScreenPoint(aWindow, aScreenX, aScreenY);
	if ('elementFromPoint' in aWindow.document) {
		var elem = aWindow.document.elementFromPoint(clientPos.x, clientPos.y);
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
					aScreenX + aWindow.scrollX,
					aScreenY + aWindow.scrollY
				);
			return this._getOriginalTargetFromScreenPoint(node, aScreenX, aScreenY);
		}
		return this._getOriginalTargetFromScreenPoint(elem, aScreenX, aScreenY);
	}

	aWindow = this.getWindowFromScreenPoint(aWindow, aScreenX, aScreenY);
	var doc = aWindow.document;

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
		if (this._isInside(getBoxObjectFor(node), aScreenX, aScreenY))
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
	return this._getOriginalTargetFromScreenPoint(node, aScreenX, aScreenY);
};
	 
function _getPopupElementFromScreenPoint(aWindow, aScreenX, aScreenY) 
{
	var doc = aWindow.document;
	var popups = doc.evaluate(
			'/descendant::*[contains(" menupopup popup tooltip panel", concat(" ", local-name(), " "))]',
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
			if (this._isInside(getBoxObjectFor(node), aScreenX, aScreenY))
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
			!this._isInside(getBoxObjectFor(nodes[i]), aScreenX, aScreenY))
			continue;
		var node = this._getOriginalTargetFromScreenPointInternal(nodes[i], aScreenX, aScreenY);
		if (node) return node;
	}
	return null;
}
  
var elementFilter = function(aNode) { 
	return NodeFilter.FILTER_ACCEPT;
};
  
function getWindowFromScreenPoint(aWindow, aScreenX, aScreenY) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action.getWindowFromScreenPoint::['+aWindow+'] is not a frame!');

	if ('elementFromPoint' in aWindow.document) {
		var elem = this.getElementFromScreenPoint(aWindow, aScreenX, aScreenY);
		return elem ? elem.ownerDocument.defaultView : null ;
	}

	var wins = this._flattenWindows(aWindow);
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
			if (this._isInside(box, aScreenX, aScreenY))
				return frameList[j].contentWindow;
		}
		if (this._isInside(getBoxObjectFor(doc.documentElement), aScreenX, aScreenY))
			return win;
	}
	return null;
};
	 
function _flattenWindows(aWindow) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action._flattenWindows::['+aWindow+'] is not a frame!');

	var ret = [aWindow];
	for (var i = 0; i < aWindow.frames.length; i++)
		ret = ret.concat(this._flattenWindows(aWindow.frames[i]));
	return ret;
};
  
function _getClientPointFromScreenPoint(aWindow, aScreenX, aScreenY) 
{
	if (!aWindow ||
		!(aWindow instanceof Ci.nsIDOMWindow))
		throw new Error('action._getClientPointFromScreenPoint::['+aWindow+'] is not a frame!');

	var box = getBoxObjectFor(aWindow.document.documentElement);
	return {
		x : aScreenX - box.screenX - aWindow.scrollX,
		y : aScreenY - box.screenY - aWindow.scrollY
	};
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
	 
function _getWindowUtils(aWindow) 
{
	return aWindow
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIDOMWindowUtils);
};
 
function _getDocumentFromEventTarget(aNode) 
{
	return !aNode ? null :
		(aNode.document || aNode.ownerDocument || aNode );
};
  
