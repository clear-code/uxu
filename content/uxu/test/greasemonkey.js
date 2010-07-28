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
	this.commands = [];
	this.logs = [];
	this.storage = {};
	this.listeners = [];
	this.sandboxes = {};
	this.emulateXMLHTTPRequest = true;
}

function destroy()
{
	this.testWindow = null;
	this.commands = null;
	this.logs = null;
	this.storage = null;
	this.listeners = null;
	this.sandboxes = null;
}

function load(aURI, aOptions)
{
	this.listeners = [];
	this.sandboxes = {};
	return this.utils.loadURIInTestFrame(aURI, aOptions);
}

function unload(aOptions)
{
	this.listeners = [];
	this.sandboxes = {};
	return this.utils.loadURIInTestFrame('about:blank', aOptions);
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
			win.setTimeout(function() {
				var b = win.gBrowser;
				if (!b) {
					loadedFlag.value = true;
					return;
				}
				var tab = b.addTab('about:blank');
				b.removeAllTabsBut(tab);
				b.stop();
				win.setTimeout(function() {
					_this.utils._waitBrowserLoad(tab, b, loadedFlag, function() {
						_this.frame = b;
					});
					b.loadURI(aURI);
				}, 0);
			}, 0);
		}
	);
	if (!aOptions || !aOptions.async) this.utils.wait(loadedFlag);
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
	var headers = [];
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
		GM_getResourceURL : function(aKey) {
			return GM_getResourceURL.call(env, aKey, headers);
		},
		GM_getResourceText : function(aKey) {
			return GM_getResourceText.call(env, aKey, headers);
		},
		GM_openInTab : function() {
			return GM_openInTab.apply(env, arguments);
		},
		console : {
			log : function() {
				return GM_log.apply(env, arguments);
			}
		},
		get GM_headers() {
			return headers;
		}
	};
	this.sandboxes[aURI] = sandbox;
	return sandbox;
}
function getSandBoxFor(aURI)
{
	return this.getSandboxFor(aURI);
}

const kHEADER_START = /==UserScript==/i;
const kHEADER_END   = /==\/UserScript==/i;
const kHEADER_LINE  = /^[^\@]*(\@[^\s]+)\s+(.*)$/;

function loadScript(aURI, aEncoding)
{
	var sandbox = this.getSandboxFor(aURI);
	var script;
	try {
		script = this.utils.include(aURI, sandbox, aEncoding);
	}
	catch(e) {
		throw new Error('Error: GMUtils::loadScript() failed to read specified script.\n'+e);
	}
	var headers = sandbox.GM_headers;
	if (kHEADER_START.test(script) && kHEADER_END.test(script)) {
		script.split(kHEADER_START)[1].split(kHEADER_END)[0]
			.split(/[\n\r]+/)
			.forEach(function(aLine) {
				var match = aLine.match(kHEADER_LINE);
				if (!match) return;
				headers.push({
					name  : match[1],
					value : match[2]
				});
			});
	}
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
	aMessage = String(aMessage);
	this.fireEvent({ type : 'GM_logCall', message : aMessage });
	ConsoleService.logStringMessage(aMessage);
	this.logs.push(aMessage);
}


function GM_getValue(aKey, aDefault)
{
	this.fireEvent({ type : 'GM_getValueCall', key : aKey });
	return (aKey in this.storage) ? this.storage[aKey] : aDefault ;
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
	var command = document.createElement('menuitem');
	command.setAttribute('label', aName);
	command.oncommand = aFunction;
	if (aAccelKey) {
		var modifiers = '';
		if (aAccelModifiers) {
			modifiers = [];
			var isMac = navigator.platform.toLowerCase().indexOf('mac') > -1;
			if (!isMac && /ctrl|control|accel/i.test(aAccelModifiers))
				modifiers.push('Ctrl');
			if (isMac && /ctrl|control/i.test(aAccelModifiers))
				modifiers.push('Control');
			if (/alt/i.test(aAccelModifiers))
				modifiers.push('Alt');
			if (!isMac && /meta/i.test(aAccelModifiers))
				modifiers.push('Meta');
			if (isMac && /meta|accel/i.test(aAccelModifiers))
				modifiers.push('Command');
			if (/shift/i.test(aAccelModifiers))
				modifiers.push('Shift');
			modifiers = modifiers.join('+');
			if (modifiers) modifiers += '+';
		}
		command.setAttribute('acceltext', modifiers+aAccelKey.toUpperCase());
	}
	if (aAccessKey) {
		command.setAttribute('accesskey', aAccessKey);
	}
	this.commands.push(command);
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
	this.fireEvent({ type : 'GM_addStyleCall', document : aDocument, style : aStyle });
	var head = aDocument.getElementsByTagName('head')[0];
	if (!head) return;
	var style = aDocument.createElement('style');
	style.setAttribute('type', 'text/css');
	style.appendChild(aDocument.createTextNode(aStyle));
	head.appendChild(style);
}

const kRESOURCE = /^([^\s]+)\s+(.+)$/;

function _getResourceURI(aKey, aHeaders)
{
	if (!aKey || !aHeaders) return null;
	var match;
	for (var i in aHeaders)
	{
		if (aHeaders[i].name.toLowerCase() != '@resource' ||
			!(match = aHeaders[i].value.match(kRESOURCE)))
			continue;
		if (match[1] == aKey) return match[2];
	}
	return null;
}

function _getResponse(aURI, aMethod)
{
	var request = Cc['@mozilla.org/xmlextras/xmlhttprequest;1']
			.createInstance(Ci.nsIXMLHttpRequest)
			.QueryInterface(Ci.nsIDOMEventTarget);
	try {
		request.open(aMethod || 'GET', aURI, false);
		request.send(null);
	}
	catch(e) {
	}
	return request;
}

function GM_getResourceText(aKey, aHeaders)
{
	this.fireEvent({ type : 'GM_getResourceTextCall', key : aKey });
	var uri = _getResourceURI(aKey, aHeaders);
	if (uri) {
		return _getResponse(uri).responseText;
	}
	return '';
}

function GM_getResourceURL(aKey, aHeaders)
{
	this.fireEvent({ type : 'GM_getResourceURLCall', key : aKey });
	var uri = _getResourceURI(aKey, aHeaders);
	if (uri) {
		var response = _getResponse(uri, 'HEAD');
		var mimeType = response.getResponseHeader('Content-Type');
		if (!mimeType) {
			var mimeService = Cc['@mozilla.org/mime;1']
					.getService(Ci.nsIMIMEService);
			if (uri.substring(0, 5) == 'file:') {
				mimeType = mimeService.getTypeFromFile(utils.getFileFromURLSpec(uri));
			}
			else {
				try {
					mimeType = mimeService.getTypeFromURI(utils.makeURIFromSpec(uri));
				}
				catch(e) {
				}
			}
		}
		var channel = Cc['@mozilla.org/network/io-service;1']
					.getService(Ci.nsIIOService)
					.newChannelFromURI(utils.makeURIFromSpec(uri));
		var stream = channel.open();
		var binaryStream = Cc['@mozilla.org/binaryinputstream;1']
					.createInstance(Ci.nsIBinaryInputStream);
		binaryStream.setInputStream(stream);
		var data = binaryStream.readBytes(binaryStream.available());
		return 'data:'+mimeType+';base64,'+encodeURIComponent(btoa(data));
	}
	return '';
}

function GM_openInTab(aURI)
{
	this.fireEvent({ type : 'GM_openInTabCall', uri : aURI });
	if (this.testWindow &&
		this.testWindow.gBrowser)
		this.testWindow.gBrowser.addTab(aURI);
}
