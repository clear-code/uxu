// -*- indent-tabs-mode: t; tab-width: 4 -*-


function constructor(aBrowser)
{
	this.target = aBrowser;
	this.storage = {};
}


function ready()
{
	var browser = this.target;
	this.__defineGetter__('window', function() {
		return browser.contentWindow;
	});
	this.__defineGetter__('unsafeWindow', function() {
		return browser.contentWindow;
	});
	this.__defineGetter__('document', function() {
		return browser.contentDocument;
	});
	this.__proto__ = browser.contentWindow;
}


var ConsoleService = Components
		.classes['@mozilla.org/consoleservice;1']
		.getService(Components.interfaces.nsIConsoleService);

function GM_log(aMessage)
{
	ConsoleService.logStringMessage(aMessage);
}


function GM_getValue(aKey)
{
	return (aKey in this.storage) ? this.storage[aKey] : null ;
}
function GM_setValue(aKey, aValue)
{
	this.storage[aKey] = aValue;
}


function GM_registerMenuCommand(aName, aFunction, aAccelKey, aAccelModifiers, aAccessKey)
{
}


function GM_xmlhttpRequest(aDetails)
{
	var uri = aDetails.url;
	if (typeof uri != 'string')
		throw new Error('Invalid url: url must be of type string');
	if (!/^(http|https|ftp):\/\//.test(uri))
		throw new Error('Invalid url: '+uri);

	var request = Components
			.classes['@mozilla.org/xmlextras/xmlhttprequest;1']
			.createInstance(Components.interfaces.nsIXMLHttpRequest)
			.QueryInterface(Components.interfaces.nsIDOMEventTarget);
	var listener = {
			request : request,
			handleEvent : function(aEvent)
			{
				if (!('on'+aEvent.type in this)) return;
				var state = {
					responseText : this.request.responseText,
					readyState : this.request.readyState,
					responseHeaders : (
						this.request.readyState == 4 ?
							this.request.getAllResponseHeaders() :
							''
					),
					status : (
						this.request.readyState == 4 ?
							this.request.status :
							''
					),
					statusText : (
						this.request.readyState == 4 ?
							this.request.statusText :
							''
					),
					finalUrl : (
						this.request.readyState == 4 ?
							this.request.channel.URI.spec :
							''
					)
				};
				var func = this['on'+aEvent.type];
				this.target.contentWindow.setTimeout(func, 0, state);
			},
			target : this.target
		};
	if (aDetails.onload) {
		listener.onload = aDetails.onload;
		request.addEventListener('load', listener, false);
	}
	if (aDetails.onerror) {
		listener.onerror = aDetails.onerror;
		request.addEventListener('error', listener, false);
	}
	if (aDetails.onreadystatechange) {
		listener.onreadystatechange = aDetails.onreadystatechange;
		request.addEventListener('readystatechange', listener, false);
	}

	request.open(aDetails.method, uri);

	if (aDetails.overrideMimeType)
		request.overrideMimeType(aDetails.overrideMimeType);

	if (aDetails.headers)
		for (var i in aDetails.headers)
		{
			request.setRequestHeader(i, aDetails.headers[i]);
		}

	request.send(aDetails.data || null);
}


function GM_addStyle()
{
}

function GM_getResourceURL()
{
}

function GM_getResourceText()
{
}

function GM_openInTab(aWindow, aURI)
{
}
