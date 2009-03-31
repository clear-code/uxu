function getBoxObjectFor(aNode)
{
	if ('getBoxObjectFor' in aNode.ownerDocument)
		return aNode.ownerDocument.getBoxObjectFor(aNode);

	return this.getBoxObjectFromClientRectFor(aNode);
}

function getBoxObjectFromClientRectFor(aNode)
{
	var box = {
			x       : 0,
			y       : 0,
			width   : 0,
			height  : 0,
			screenX : 0,
			screenY : 0
		};
	try {
		var rect = aNode.getBoundingClientRect();
		var style = _getComputedStyle(aNode);
		var frame = aNode.ownerDocument.defaultView;

		// "x" and "y" are offset positions of the "padding-box" from the document top-left edge.
		box.x = rect.left + _getPropertyPixelValue(style, 'border-left-width');
		box.y = rect.top + _getPropertyPixelValue(style, 'border-top-width');
		if (style.getPropertyValue('position') != 'fixed') {
			box.x += frame.scrollX;
			box.y += frame.scrollY;
		}

		// "width" and "height" are sizes of the "border-box".
		box.width  = rect.right-rect.left;
		box.height = rect.bottom-rect.top;

		// "screenX" and "screenY" are absolute positions of the "border-box".
		box.screenX = rect.left;
		box.screenY = rect.top;
		var owner = aNode;
		while (true)
		{
			frame = owner.ownerDocument.defaultView;
			owner = _getFrameOwnerFromFrame(frame);

			let style = _getComputedStyle(owner);
			box.screenX += _getPropertyPixelValue(style, 'border-left-width');
			box.screenY += _getPropertyPixelValue(style, 'border-top-width');

			if (!owner) {
				box.screenX += frame.screenX;
				box.screenY += frame.screenY;
				break;
			}
			if (owner.ownerDocument instanceof Ci.nsIDOMXULDocument) {
				let ownerBox = owner.ownerDocument.getBoxObjectFor(owner);
				box.screenX += ownerBox.screenX;
				box.screenY += ownerBox.screenY;
				break;
			}

			let ownerRect = owner.getBoundingClientRect();
			box.screenX += ownerRect.left;
			box.screenY += ownerRect.top;
		}
	}
	catch(e) {
	}

	for (let i in box)
	{
		box[i] = parseInt(box[i]);
	}

	return box;
}

function _getComputedStyle(aNode)
{
	return aNode.ownerDocument.defaultView.getComputedStyle(aNode, null);
}

function _getPropertyPixelValue(aStyle, aProperty)
{
	return parseInt(aStyle.getPropertyValue(aProperty).replace('px', ''));
}

function _getFrameOwnerFromFrame(aFrame)
{
	var parentItem = aFrame
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIWebNavigation)
			.QueryInterface(Ci.nsIDocShell)
			.QueryInterface(Ci.nsIDocShellTreeNode)
			.QueryInterface(Ci.nsIDocShellTreeItem)
			.parent;
	var isChrome = parentItem.itemType == parentItem.typeChrome;
	var parentDocument = parentItem
			.QueryInterface(Ci.nsIWebNavigation)
			.document;
	var nodes = parentDocument.evaluate(
			'/descendant::*[contains(" frame FRAME iframe IFRAME browser tabbrowser ", concat(" ", local-name(), " "))]',
			parentDocument,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
	for (let i = 0, maxi = nodes.snapshotLength; i < maxi; i++)
	{
		let owner = nodes.snapshotItem(i);
		if (isChrome && owner.wrappedJSObject) owner = owner.wrappedJSObject;
		if (owner.localName == 'tabbrowser') {
			let tabs = owner.mTabContainer.childNodes;
			for (let i = 0, maxi = tabs.length; i < maxi; i++)
			{
				let browser = tabs[i].linkedBrowser;
				if (browser.contentWindow == aFrame)
					return browser;
			}
		}
		else if (owner.contentWindow == aFrame) {
			return owner;
		}
	}
	return null;
}

