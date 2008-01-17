// -*- indent-tabs-mode: t; tab-width: 4 -*-


this.fireMouseEvent = function(aWindow, aOptions) {
	if (!aOptions) aOptions = {};
	var node = this.getElementFromPoint(
				aWindow,
				('x' in aOptions ? aOptions.x : 0),
				('y' in aOptions ? aOptions.y : 0)
			);
	if (node)
		this.fireMouseEventOnElement(aWindow, node, aOptions);
};

this.fireMouseEventOnElement = function(aWindow, aElement, aOptions) {
	var event = this.createMouseEventOnElement(aWindow, aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(event);
};

this.createMouseEventOnElement = function(aWindow, aElement, aOptions) {
	if (!aOptions) aOptions = {};
	var node = aElement;
	if (!node) return null;

	var box = this.getDocumentFromEventTarget(node).getBoxObjectFor(node);
	if (!('x' in aOptions)) aOptions.x = box.screenX + parseInt(box.width / 2);
	if (!('y' in aOptions)) aOptions.y = box.screenY + parseInt(box.height / 2);

	var event = this.getDocumentFromEventTarget(node).createEvent('MouseEvents');
	event.initMouseEvent(
		(aOptions.type || 'click'),
		('canBubble' in aOptions ? aOptions.canBubble : true ),
		('cancelable' in aOptions ? aOptions.cancelable : true ),
		this.getDocumentFromEventTarget(node).defaultView,
		('detail' in aOptions ? aOptions.detail : 0),
		aOptions.x,
		aOptions.y,
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


this.fireKeyEventOnElement = function(aWindow, aElement, aOptions) {
	var event = this.createKeyEventOnElement(aWindow, aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(event);
};

this.createKeyEventOnElement = function(aWindow, aElement, aOptions) {
	if (!aOptions) aOptions = {};
	var node = aElement;
	if (!node) return null;

	var event = this.getDocumentFromEventTarget(node).createEvent('KeyEvents');
	event.initKeyEvent(
		(aOptions.type || 'keypress'),
		('canBubble' in aOptions ? aOptions.canBubble : true ),
		('cancelable' in aOptions ? aOptions.cancelable : true ),
		this.getDocumentFromEventTarget(node).defaultView,
		('ctrlKey' in aOptions ? aOptions.ctrlKey : false ),
		('altKey' in aOptions ? aOptions.altKey : false ),
		('shiftKey' in aOptions ? aOptions.shiftKey : false ),
		('metaKey' in aOptions ? aOptions.metaKey : false ),
		('keyCode' in aOptions ? aOptions.keyCode : 0 ),
		('charCode' in aOptions ? aOptions.charCode : 0 )
	);
	return event;
};



this.fireXULCommandEvent = function(aWindow, aOptions) {
	if (!aOptions) aOptions = {};
	var node = this.getElementFromPoint(
				aWindow,
				('x' in aOptions ? aOptions.x : 0),
				('y' in aOptions ? aOptions.y : 0)
			);
	if (node)
		this.fireXULCommandEventOnElement(aWindow, node, aOptions);
};

this.fireXULCommandEventOnElement = function(aWindow, aElement, aOptions) {
	var event = this.createMouseEventOnElement(aWindow, aElement, aOptions);
	if (event && aElement)
		aElement.dispatchEvent(this.createXULCommandEvent(event));
};

this.createXULCommandEvent = function(aSourceEvent) {
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


this.getDocumentFromEventTarget = function(aNode) {
	return aNode.document || aNode.ownerDocument || aNode;
};



// À•W‚©‚ç—v‘fƒm[ƒh‚ðŽæ“¾‚·‚é
this.getElementFromPoint = function(aWindow, aX, aY) {
	var win = this.getWindowFromPoint(aWindow, aX, aY);
	return this.getElementFromPointInternal(win, aX, aY);
};

this.getWindowFromPoint = function(aWindow, aScreenX, aScreenY)
{
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
	return aWindow;
};

this.flattenWindows = function(aWindow) 
{
	var ret = [aWindow];
	for (var i = 0; i < aWindow.frames.length; i++)
		ret = ret.concat(this.flattenWindows(aWindow.frames[i]));
	return ret;
};

this.getElementFromPointInternal = function(aWindow, aScreenX, aScreenY)
{
	var accNode;
	try {
		var accService = Components.classes['@mozilla.org/accessibilityService;1']
							.getService(Components.interfaces.nsIAccessibilityService);
		var acc = accService.getAccessibleFor(aWindow.document);
		var box = aWindow.document.getBoxObjectFor(aWindow.document.documentElement);
		accNode = /* acc.getChildAtPoint(aScreenX - box.screenX, aScreenY - box.screenY) || */ acc.getChildAtPoint(aScreenX, aScreenY);
		accNode = accNode.QueryInterface(Components.interfaces.nsIAccessNode).DOMNode;
		var clickable = accNode ? this.getParentClickableNode(accNode) : null ;
		if (clickable)
			return this.getImageInLink(clickable) || clickable;
	}
	catch(e) {
//			dump(e+'\n');
	}

	var doc = aWindow.document;
	var startNode = accNode || doc;
	var filter = function(aNode) {
		return NodeFilter.FILTER_ACCEPT;
	};
	var walker = aWindow.document.createTreeWalker(startNode, NodeFilter.SHOW_ELEMENT, filter, false);
	for (var node = walker.firstChild(); node != null; node = walker.nextNode())
	{
		var box = doc.getBoxObjectFor(node);
		var l = box.screenX;
		var t = box.screenY;
		var r = l + box.width;
		var b = t + box.height;
		if (l <= aScreenX && aScreenX <= r && t <= aScreenY && aScreenY <= b)
			return node;
	}
	return doc.documentElement;
};
