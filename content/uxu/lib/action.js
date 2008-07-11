// -*- indent-tabs-mode: t; tab-width: 4 -*-


function getWindowUtils(aWindow) {
	return aWindow
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIDOMWindowUtils);
};

var Prefs = Components.classes['@mozilla.org/preferences;1'] 
		.getService(Components.interfaces.nsIPrefBranch)
		.QueryInterface(Components.interfaces.nsIPrefBranch2);

function isFullZoom()
{
	return Prefs.getBoolPref('browser.zoom.full');
};

function getZoom(aWindow)
{
	var markupDocumentViewer = aWindow.top
			.QueryInterface(this.nsIInterfaceRequestor)
			.getInterface(this.nsIWebNavigation)
			.QueryInterface(this.nsIDocShell)
			.contentViewer
			.QueryInterface(Components.interfaces.nsIMarkupDocumentViewer);
	return markupDocumentViewer.fullZoom;
};


function fireMouseEvent(aWindow, aOptions)
{
	if (!aWindow ||
		!(aWindow instanceof Components.interfaces.nsIDOMWindow))
		throw new Error('action.fireMouseEventOnElement::['+aWindow+'] is not a frame!');

	if (!aOptions) aOptions = {};

	var zoom = this.isFullZoom() ? this.getZoom : 1 ;

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
		!(win instanceof Components.interfaces.nsIDOMWindow))
		throw new Error('action.fireMouseEvent::there is no frame at ['+screenX+', '+screenY+']!');

	var utils = this.getWindowUtils(win);
	if ('sendMouseEvent' in utils &&
		!Prefs.getBoolPref('extensions.uxu.action.fireMouseEvent.useOldMethod')) {
		const nsIDOMNSEvent = Components.interfaces.nsIDOMNSEvent;
		var flags = 0;
		if (aOptions.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MASK;
		if (aOptions.altKey) flags |= nsIDOMNSEvent.ALT_MASK;
		if (aOptions.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MASK;
		if (aOptions.metaKey) flags |= nsIDOMNSEvent.META_MASK;

		var button = (aOptions.button || 0);
		var detail = (aOptions.detail || 1);
		if (aOption.type == 'click' && detail == 2) aOption.type = 'dblclick';
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
				break;
		}
		return;
	}

	var node = this.getElementFromScreenPoint(aWindow, screenX, screenY);
	if (node)
		this.fireMouseEventOnElement(node, aOptions);
	else
		throw new Error('action.fireMouseEvent::there is no element at [')+x+','+y+']!';
};

function fireMouseEventOnElement(aElement, aOptions)
{
	if (!aElement ||
		!(aElement instanceof Components.interfaces.nsIDOMElement))
		throw new Error('action.fireMouseEventOnElement::['+aElement+'] is not an element!');

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
	var event = this.createMouseEventOnElement(aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(event);
};

function createMouseEventOnElement(aElement, aOptions)
{
	if (!aElement ||
		!(aElement instanceof Components.interfaces.nsIDOMElement))
		throw new Error('action.createMouseEventOnElement::['+aElement+'] is not an element!');

	if (!aOptions) aOptions = {};
	var node = aElement;
	if (!node) return null;

	var doc = this.getDocumentFromEventTarget(node);
	var box = doc.getBoxObjectFor(node);
	if (!('screenX' in aOptions)) aOptions.screenX = box.screenX + parseInt(box.width / 2);
	if (!('screenY' in aOptions)) aOptions.screenY = box.screenY + parseInt(box.height / 2);

	var root = doc.documentElement;
	box = doc.getBoxObjectFor(root);
	if (!('x' in aOptions)) aOptions.x = aOptions.screenX - box.screenX - doc.defaultView.scrollX;
	if (!('y' in aOptions)) aOptions.y = aOptions.screenY - box.screenY - doc.defaultView.scrollY;

	var event = doc.createEvent('MouseEvents');
	event.initMouseEvent(
		(aOptions.type || 'click'),
		('canBubble' in aOptions ? aOptions.canBubble : true ),
		('cancelable' in aOptions ? aOptions.cancelable : true ),
		doc.defaultView,
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

function fireKeyEventOnElement(aElement, aOptions)
{
	if (!aElement ||
		!(aElement instanceof Components.interfaces.nsIDOMElement))
		throw new Error('action.fireKeyEventOnElement::['+aElement+'] is not an element!');

	if (aElement.localName == 'textbox' &&
		'inputField' in aElement &&
		aElement.inputField instanceof Components.interfaces.nsIDOMElement)
		aElement = aElement.inputField;

	var doc = this.getDocumentFromEventTarget(aElement);
	var utils = this.getWindowUtils(doc.defaultView);
	if ('sendKeyEvent' in utils &&
		!Prefs.getBoolPref('extensions.uxu.action.fireKeyEvent.useOldMethod')) {
		const nsIDOMNSEvent = Components.interfaces.nsIDOMNSEvent;
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
	var event = this.createKeyEventOnElement(aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(event);
};

function createKeyEventOnElement(aElement, aOptions)
{
	if (!aElement ||
		!(aElement instanceof Components.interfaces.nsIDOMElement))
		throw new Error('action.createKeyEventOnElement::['+aElement+'] is not an element!');

	if (!aOptions) aOptions = {};
	var node = aElement;
	var doc = this.getDocumentFromEventTarget(node);
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
	var event = this.createMouseEventOnElement(aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(this.createXULCommandEvent(event));
};

function createXULCommandEvent(aSourceEvent)
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


function inputTextToField(aElement, aValue, aAppend, aDontFireKeyEvents)
{
	if (!aElement) {
		throw new Error('action.inputTextToField::no target!');
	}
	else if (aElement instanceof Components.interfaces.nsIDOMElement) {
		if (aElement.localName != 'textbox' &&
			!(aElement instanceof Components.interfaces.nsIDOMNSEditableElement))
			throw new Error('action.inputTextToField::['+aElement+'] is not an input field!');
	}
	else {
		throw new Error('action.inputTextToField::['+aElement+'] is not an input field!');
	}

	if (!aAppend) aElement.value = '';

	if (aDontFireKeyEvents || aValue == '') {
		aElement.value += (aValue || '');
		var doc = this.getDocumentFromEventTarget(aElement);
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

var withIMECharacters = '\u3040-\uA4CF\uF900-\uFAFF';
var kINPUT_ARRAY_PATTERN  = new RegExp('[^'+withIMECharacters+']|['+withIMECharacters+']+', 'g');
var kDIRECT_INPUT_PATTERN = new RegExp('[^'+withIMECharacters+']');


function getDocumentFromEventTarget(aNode)
{
	return !aNode ? null :
		(aNode.document || aNode.ownerDocument || aNode );
};



// 座標から要素ノードを取得する
function getElementFromScreenPoint(aWindow, aScreenX, aScreenY)
{
	if (!aWindow ||
		!(aWindow instanceof Components.interfaces.nsIDOMWindow))
		throw new Error('action.getElementFromScreenPoint::['+aWindow+'] is not a frame!');

	var clientPos = this.getClientPointFromScreenPoint(aWindow, aScreenX, aScreenY);
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

	var accNode;
	try {
		var accService = Components.classes['@mozilla.org/accessibilityService;1']
							.getService(Components.interfaces.nsIAccessibilityService);
		var acc = accService.getAccessibleFor(aWindow.document);
		accNode = acc.getChildAtPoint(clientPos.x, clientPos.y);
		accNode = accNode.QueryInterface(Components.interfaces.nsIAccessNode).DOMNode;
	}
	catch(e) {
	}

	var doc = aWindow.document;
	var startNode = accNode || doc;
	var filter = function(aNode) {
		return NodeFilter.FILTER_ACCEPT;
	};
	var nodes = [];
	var walker = aWindow.document.createTreeWalker(startNode, NodeFilter.SHOW_ELEMENT, filter, false);
	for (var node = walker.firstChild(); node != null; node = walker.nextNode())
	{
		var box = doc.getBoxObjectFor(node);
		var l = box.screenX;
		var t = box.screenY;
		var r = l + box.width;
		var b = t + box.height;
		if (l <= aScreenX && aScreenX <= r && t <= aScreenY && aScreenY <= b)
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

function getClientPointFromScreenPoint(aWindow, aScreenX, aScreenY)
{
	if (!aWindow ||
		!(aWindow instanceof Components.interfaces.nsIDOMWindow))
		throw new Error('action.getClientPointFromScreenPoint::['+aWindow+'] is not a frame!');

	var box = aWindow.document.getBoxObjectFor(aWindow.document.documentElement);
	return {
		x : aScreenX - box.screenX - aWindow.scrollX,
		y : aScreenY - box.screenY - aWindow.scrollY
	};
}

function getWindowFromScreenPoint(aWindow, aScreenX, aScreenY)
{
	if (!aWindow ||
		!(aWindow instanceof Components.interfaces.nsIDOMWindow))
		throw new Error('action.getWindowFromScreenPoint::['+aWindow+'] is not a frame!');

	if ('elementFromPoint' in aWindow.document) {
		var elem = this.getElementFromScreenPoint(aWindow, aScreenX, aScreenY);
		return elem ? elem.ownerDocument.defaultView : null ;
	}

	var wins = this.flattenWindows(aWindow);
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
			var l = box.screenX;
			var t = box.screenY;
			var r = l + box.width;
			var b = t + box.height;
			if (l <= aScreenX && aScreenX <= r && t <= aScreenY && aScreenY <= b)
				return frameList[j].contentWindow;
		}
		if (l <= aScreenX && aScreenX <= r && t <= aScreenY && aScreenY <= b)
			return frameList[j].contentWindow;
	}
	return null;
};

function flattenWindows(aWindow) 
{
	if (!aWindow ||
		!(aWindow instanceof Components.interfaces.nsIDOMWindow))
		throw new Error('action.flattenWindows::['+aWindow+'] is not a frame!');

	var ret = [aWindow];
	for (var i = 0; i < aWindow.frames.length; i++)
		ret = ret.concat(this.flattenWindows(aWindow.frames[i]));
	return ret;
};
