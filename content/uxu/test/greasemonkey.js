// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;


function constructor(aUtils)
{
	this.utils = aUtils;
	var frame = this.utils._testFrame;
	this.frame = frame;
	this.__defineGetter__('frameInTestRunner', function() {
		return frame;
	});
	this.testWindow = null;
	this.storage = {};
	this.listeners = [];
	this.sandboxes = {};
	this.emulateXMLHTTPRequest = true;
}

function load(aURI)
{
	this.listeners = [];
	this.sandboxes = {};
	return this.utils.loadURIInTestFrame(aURI);
}

function unload()
{
	this.listeners = [];
	this.sandboxes = {};
	return this.utils.loadURIInTestFrame('about:blank');
}

function open(aURI, aOptions)
{
	aURI = this.utils.fixupIncompleteURI(aURI)
	this.listeners = [];
	this.sandboxes = {};
	var loadedFlag = { value : false, window : null };
	var _this = this;
	this.utils.openTestWindow(
		aOptions,
		function(win) {
			_this.testWindow = win;
			loadedFlag.window = win;
			window.setTimeout(function() {
				var b = win.gBrowser;
				if (!b) {
					loadedFlag.value = true;
					return;
				}
				var tab = b.addTab('about:blank');
				b.removeAllTabsBut(tab);
				b.addEventListener('load', function() {
					b.removeEventListener('load', arguments.callee, true);
					_this.frame = b;
					loadedFlag.value = true;
				}, true);
				b.loadURI(aURI);
			}, 0);
		}
	);
	return loadedFlag;
}

function close()
{
	if (!this.testWindow) return;
	this.listeners = [];
	this.sandboxes = {};
	this.frame = this.frameInTestRunner;
	this.testWindow.close();
	this.testWindow = null;
}


function getSandboxFor(aURI)
{
	aURI = this.utils.fixupIncompleteURI(aURI);
	if (aURI in this.sandboxes) return this.sandboxes[aURI];

	var env = this;
	var sandbox = {
		get window() {
			return env.frame.contentWindow;
		},
		get unsafeWindow() {
			return env.frame.contentWindow.wrappedJSObject;
		},
		get document() {
			return env.frame.contentDocument;
		},
		XPathResult : Ci.nsIDOMXPathResult,
		GM_log : function() {
			return GM_log.apply(env, arguments);
		},
		GM_getValue : function() {
			return GM_getValue.apply(env, arguments);
		},
		GM_setValue : function() {
			return GM_setValue.apply(env, arguments);
		},
		GM_registerMenuCommand : function() {
			return GM_registerMenuCommand.apply(env, arguments);
		},
		GM_xmlhttpRequest : function(aDetails) {
			return GM_xmlhttpRequest.apply(env, arguments);
		},
		GM_addStyle : function() {
			return GM_addStyle.apply(env, arguments);
		},
		GM_getResourceURL : function() {
			return GM_getResourceURL.apply(env, arguments);
		},
		GM_getResourceText : function() {
			return GM_getResourceText.apply(env, arguments);
		},
		GM_openInTab : function() {
			return GM_openInTab.apply(env, arguments);
		},
		console : {
			log : function() {
				return GM_log.apply(env, arguments);
			}
		}
	};
	this.sandboxes[aURI] = sandbox;
	return sandbox;
}
function getSandBoxFor(aURI)
{
	return this.getSandboxFor(aURI);
}

function loadScript(aURI, aEncoding)
{
	var sandbox = this.getSandboxFor(aURI);
	this.utils.include(aURI, sandbox, aEncoding);
	return sandbox;
}



function fireEvent(aEvent)
{
	Array.slice(this.listeners).forEach(function(aListener) {
		if (aListener && 'handleEvent' in aListener)
			aListener.handleEvent(aEvent);
		if (aListener && 'on'+aEvent.type in aListener)
			aListener['on'+aEvent.type](aEvent);
	});
}

function addListener(aListener)
{
	if (this.listeners.indexOf(aListener) > -1) return;
	this.listeners.push(aListener);
}
function removeListener(aListener)
{
	var index = this.listeners.indexOf(aListener);
	if (index > -1) return;
	this.listeners.splice(index, 1);
}


function doAndWaitLoad(aFunction, aScope)
{
	var _this = this;
	var loadedFlag = { value : false };
	var listener = {
			handleEvent : function(aEvent)
			{
				switch (aEvent.type)
				{
					case 'GM_xmlhttpRequestLoad':
					case 'GM_xmlhttpRequestError':
						loadedFlag.value = true;
						_this.removeListener(this);
						break;
				}
			}
		};
	this.addListener(listener);
	if (aFunction) aFunction.call(aScope);
	return loadedFlag;
}




var ConsoleService = Cc['@mozilla.org/consoleservice;1']
		.getService(Ci.nsIConsoleService);

function GM_log(aMessage)
{
	this.fireEvent({ type : 'GM_logCall', message : aMessage });
	ConsoleService.logStringMessage(aMessage);
}


function GM_getValue(aKey)
{
	this.fireEvent({ type : 'GM_getValueCall', key : aKey });
	return (aKey in this.storage) ? this.storage[aKey] : null ;
}
function GM_setValue(aKey, aValue)
{
	this.fireEvent({ type : 'GM_setValueCall', key : aKey, value : aValue });
	this.storage[aKey] = aValue;
}


function GM_registerMenuCommand(aName, aFunction, aAccelKey, aAccelModifiers, aAccessKey)
{
	this.fireEvent({ type : 'GM_registerMenuCommandCall',
		name     : aName,
		function : aFunction,
		accelKey : aAccelKey,
		accelModifiers : aAccelModifiers,
		accessKey : aAccessKey
	});
}


function GM_xmlhttpRequest(aDetails)
{
	this.fireEvent({ type : 'GM_xmlhttpRequestCall', detail : aDetails });

	if (!this.emulateXMLHTTPRequest)
		return;

	var uri = aDetails.url;
	if (typeof uri != 'string')
		throw new Error('Invalid url: url must be of type string');
	if (!/^(http|https|ftp):\/\//.test(uri))
		throw new Error('Invalid url: '+uri);

	var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
			.createInstance(Ci.nsIXMLHttpRequest)
			.QueryInterface(Ci.nsIDOMEventTarget);
	var _this = this;
	var listener = {
			request : request,
			handleEvent : function(aEvent)
			{
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
					),
					handled : false // extended spec of UxU
				};

				var eventType = aEvent.type.charAt(0).toUpperCase()+aEvent.type.substring(1);
				var event = {
						type    : 'GM_xmlhttpRequestBefore'+eventType,
						state   : state,
						handled : false
					};
				_this.fireEvent(event);

				event.type = 'GM_xmlhttpRequest'+eventType;
				if ('on'+aEvent.type in this) {
					state.handled = event.handled = true;
					var func = this['on'+aEvent.type];
					this.frame.contentWindow.setTimeout(function(aState) {
						func(aState);
						_this.fireEvent(event);
					}, 0, state);
					return;
				}
				_this.fireEvent(event);
			},
			frame : this.frame
		};

	if (aDetails.onload) listener.onload = aDetails.onload;
	if (aDetails.onerror) listener.onerror = aDetails.onerror;
	if (aDetails.onreadystatechange) listener.onreadystatechange = aDetails.onreadystatechange;

	request.addEventListener('load', listener, false);
	request.addEventListener('error', listener, false);
	request.addEventListener('readystatechange', listener, false);

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


function GM_addStyle(aDocument, aStyle)
{
	this.fireEvent({ type : 'GM_addStyleCall', document : aDocument, sytle : aStyle });
	var head = aDocument.getElementsByTagName('head')[0];
	if (!head) return;
	var style = aDocument.createElement('style');
	style.setAttribute('type', 'text/css');
	style.appendChild(aDocument.createTextNode(aStyle));
	head.appendChild(style);
}

function GM_getResourceURL()
{
	this.fireEvent({ type : 'GM_getResourceURLCall' });
}

function GM_getResourceText()
{
	this.fireEvent({ type : 'GM_getResourceTextCall' });
}

function GM_openInTab(aURI)
{
	this.fireEvent({ type : 'GM_openInTabCall', uri : aURI });
	if (this.testWindow &&
		this.testWindow.gBrowser)
		this.testWindow.gBrowser.addTab(aURI);
}
