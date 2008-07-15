// -*- indent-tabs-mode: t; tab-width: 4 -*- 
 
var Ci = Components.interfaces; 

var Prefs = Components.classes['@mozilla.org/preferences;1']
		.getService(Ci.nsIPrefBranch)
		.QueryInterface(Ci.nsIPrefBranch2);

var shouldEmulateMouseEvent = Prefs.getBoolPref('extensions.uxu.action.fireMouseEvent.useOldMethod');
var shouldEmulateKeyEvent = Prefs.getBoolPref('extensions.uxu.action.fireKeyEvent.useOldMethod');
 
/* zoom */ 
	 
function isFullZoom() 
{
	return Prefs.getBoolPref('browser.zoom.full');
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
		throw new Error('action.fireMouseEventOnElement::['+aWindow+'] is not a frame!');

	if (!aOptions) aOptions = {};

	var zoom = this.isFullZoom() ? this.getZoom(aWindow) : 1 ;

	var x = ('x' in aOptions ? aOptions.x : 0) * zoom;
	var y = ('y' in aOptions ? aOptions.y : 0) * zoom;

	var box = aWindow.document.getBoxObjectFor(aWindow.document.documentElement);
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
		!this._isNodeInPopup(node)
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
		switch (aOptions.type)
		{
			case 'mousedown':
				utils.sendMouseEvent('mousedown', x, y, button, 1, flags);
				break;
			case 'mouseup':
				utils.sendMouseEvent('mouseup', x, y, button, 1, flags);
				break;
			case 'dblclick':
				utils.sendMouseEvent('mousedown', x, y, button, 1, flags);
				utils.sendMouseEvent('mouseup', x, y, button, 1, flags);
			case 'click':
			default:
				utils.sendMouseEvent('mousedown', x, y, button, 1, flags);
				utils.sendMouseEvent('mouseup', x, y, button, 1, flags);
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

	var isSimpleClick = !(
			aOptions.type != 'click' ||
			aOptions.button != 0 ||
			aOptions.altKey ||
			aOptions.ctrlKey ||
			aOptions.shiftKey ||
			aOptions.metaKey
		);

	switch (aElement.localName)
	{
		case 'toolbarbutton':
			if (aElement.getAttribute('type') != 'menu') {
				if (!isSimpleClick) return;
				try {
					this.fireXULCommandEventOnElement(aElement, aOptions);
				}
				catch(e) {
					dump(e+'\n');
				}
				return;
			}
		case 'menu':
			var popupId;
			var expression = '';
			var isContext = false;
			switch (aOptions.button)
			{
				case 0:
					popupId = aElement.getAttribute('popup');
					expression += 'child::*[local-name()="menupopup" or local-name()="popup"] |';
					if (navigator.platform.toLowerCase().indexOf('mac') < 0 ||
						!aButton.ctrlKey)
						break;
				case 2:
					popupId = aElement.getAttribute('context');
					isContext = true;
					break;
				case 1:
					return;
			}
			var popup = aElement.ownerDocument.evaluate(
					expression+'/descendant::menupopup[@id="'+popupId+'"]',
					aElement,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				).singleNodeValue;

			if (!popup) return;
			if ('openPopup' in popup && isContext)
				popup.openPopup(aElement, 'after_pointer', -1, -1, true, true);
			else
				popup.showPopup();
			break;

		case 'menuitem':
			if (!isSimpleClick) return;
			try {
				this.fireXULCommandEventOnElement(aElement, aOptions);
				aElement.ownerDocument.defaultView.setTimeout(function(aSelf) {
					var popup = aElement;
					while (popup = aSelf._getOwnerPopup(popup))
					{
						popup.hidePopup();
						popup = popup.parentNode;
					}
				}, 0, this);
			}
			catch(e) {
				dump(e+'\n');
			}
			break;

		case 'button':
			if (!isSimpleClick) return;
			try {
				this.fireXULCommandEventOnElement(aElement, aOptions);
			}
			catch(e) {
				dump(e+'\n');
			}
			break;
	}
}
 	
function _isNodeInPopup(aElement) 
{
	return this._getOwnerPopup(aElement) ? true : false ;
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
	if (
		'sendMouseEvent' in utils &&
		!shouldEmulateMouseEvent &&
		!this._isNodeInPopup(aElement)
		) {
		this._updateMouseEventOptionsOnElement(aOptions, aElement);
		this.fireMouseEvent(aElement.ownerDocument.defaultView, aOptions);
		return;
	}

	if (!aOptions) aOptions = { type : 'click' };
	switch (aOptions.type)
	{
		case 'mousedown':
		case 'mouseup':
			break;
		case 'dblclick':
			var options = { type : 'mousedown', detail : 1 };
			options.__proto__ = aOptions;
			this.fireMouseEventOnElement(aElement, options);
			options.type = 'mouseup';
			this.fireMouseEventOnElement(aElement, options);
		case 'click':
		default:
			var options = { type : 'mousedown', detail : 1 };
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
	var doc = this._getDocumentFromEventTarget(aElement);
	var box = doc.getBoxObjectFor(aElement);
	if (!('screenX' in aOptions)) aOptions.screenX = box.screenX + parseInt(box.width / 2);
	if (!('screenY' in aOptions)) aOptions.screenY = box.screenY + parseInt(box.height / 2);

	var root = doc.documentElement;
	box = doc.getBoxObjectFor(root);
	if (!('x' in aOptions)) aOptions.x = aOptions.screenX - box.screenX - doc.defaultView.scrollX;
	if (!('y' in aOptions)) aOptions.y = aOptions.screenY - box.screenY - doc.defaultView.scrollY;
}
   
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
		if (doc.commandDispatcher.focusedElement != aElement)
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
			var options = { type : 'keydown', detail : 1 };
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

	if (aDontFireKeyEvents || aValue == '') {
		aElement.value += (aValue || '');
		var doc = this._getDocumentFromEventTarget(aElement);
		var event = doc.createEvent('UIEvents');
		event.initUIEvent('input', true, true, doc.defaultView, 0);
		aElement.dispatchEvent(event);
		return;
	}

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
};
  
/* ���W���� */ 
	 
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
		if (elem && /^(i?frame|browser|tabbrowser)$/.test(elem.localName)) {
			return this.getElementFromScreenPoint(
					elem.contentWindow,
					aScreenX + aWindow.scrollX,
					aScreenY + aWindow.scrollY
				);
		}
		return elem;
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
		if (this._isPointInside(doc.getBoxObjectFor(node), aScreenX, aScreenY))
			nodes.push(node);
	}

	if (!nodes.length) return null;
	if (nodes.length == 1) return nodes[0];

	var smallest = [];
	nodes.forEach(function(aNode) {
		if (!smallest.length) {
			smallest.push(aNode);
			return
		}
		var box = doc.getBoxObjectFor(aNode);
		var size = box.width * box.height;
		var smallestBox = doc.getBoxObjectFor(smallest[0]);
		var smallestSize = smallestBox.width * smallestBox.height;
		if (size == smallestSize) {
			smallest.push(aNode);
		}
		else if (size < smallestSize) {
			smallest = [aNode];
		}
	});
	if (smallest.length == 1) return smallest[0];

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
	if (deepest.length == 1) return deepest[0];

	return deepest[deepest.length-1];
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
		if (!this._isPointInside(popup.boxObject, aScreenX, aScreenY)) continue;

		var nodes = [];
		var walker = doc.createTreeWalker(popup, NodeFilter.SHOW_ELEMENT, elementFilter, false);
		for (var node = walker.firstChild(); node != null; node = walker.nextNode())
		{
			if (this._isPointInside(doc.getBoxObjectFor(node), aScreenX, aScreenY))
				nodes.push(node);
		}
		if (!nodes.length) continue;
		return nodes[nodes.length-1];
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
		var win = wins[i];
		var frameList = [];
		var arr = win.document.getElementsByTagName('frame');
		for (var j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		var arr = win.document.getElementsByTagName('iframe');
		for (var j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		var arr = win.document.getElementsByTagName('tabbrowser');
		for (var j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		var arr = win.document.getElementsByTagName('browser');
		for (var j = 0; j < arr.length; j++)
			frameList.push(arr[j]);
		for (var j = frameList.length - 1; j >= 0; j--) {
			var box = win.document.getBoxObjectFor(frameList[j]);
			if (this._isPointInside(box, aScreenX, aScreenY))
				return frameList[j].contentWindow;
		}
		if (this._isPointInside(box, aScreenX, aScreenY))
			return frameList[j].contentWindow;
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

	var box = aWindow.document.getBoxObjectFor(aWindow.document.documentElement);
	return {
		x : aScreenX - box.screenX - aWindow.scrollX,
		y : aScreenY - box.screenY - aWindow.scrollY
	};
}
 
function _isPointInside(aBox, aScreenX, aScreenY) 
{
	var l = aBox.screenX;
	var t = aBox.screenY;
	var r = l + aBox.width;
	var b = t + aBox.height;
	return !(l > aScreenX || aScreenX > r || t > aScreenY || aScreenY > b);
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
  
