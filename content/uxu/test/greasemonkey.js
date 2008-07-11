// -*- indent-tabs-mode: t; tab-width: 4 -*-


function constructor(aSuite, aBrowser)
{
	this.environment = aSuite;
	this.target = aBrowser;
	this.storage = {};
	this.listeners = [];
	this.sandboxes = {};
}

function load(aURI)
{
	this.listeners = [];
	this.sandboxes = {};
	var loadedFlag = { value : false };
	var b = this.target;
	b.addEventListener('load', function() {
		b.removeEventListener('load', arguments.callee, true);
		loadedFlag.value = true;
	}, true);
	b.loadURI(this.environment.utils.fixupIncompleteURI(aURI));
	return loadedFlag;
}

function unload()
{
	this.listeners = [];
	this.sandboxes = {};
	var loadedFlag = { value : false };
	var b = this.target;
	b.addEventListener('load', function() {
		b.removeEventListener('load', arguments.callee, true);
		loadedFlag.value = true;
	}, true);
	b.loadURI('about:blank');
	return loadedFlag;
}

function getSandboxFor(aURI)
{
	aURI = this.environment.utils.fixupIncompleteURI(aURI);
	if (aURI in this.sandboxes) return this.sandboxes[aURI];

	var env = this;
	var sandbox = {
		get window() {
			return env.target.contentWindow;
		},
		get unsafeWindow() {
			return env.target.contentWindow.wrappedJSObject;
		},
		get document() {
			return env.target.contentDocument;
		},
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
	this.environment.utils.include(aURI, sandbox, aEncoding);
	return sandbox;
}



function fireEvent(aEvent)
{
	this.listeners.forEach(function(aListener) {
		if (aListener && 'handleEvent' in aListener)
			aListener.handleEvent(aEvent);
		if (aListener && 'on'+aEvent.type in aListener)
			aListener['on'+aEvent.type](aEvent);
	});
}

function addListener(aListener) {
	if (this.listeners.indexOf(aListener) > -1) return;
	this.listeners.push(aListener);
}
function removeListener(aListener) {
	var index = this.listeners.indexOf(aListener);
	if (index > -1) return;
	this.listeners.splice(index, 1);
}



var ConsoleService = Components
		.classes['@mozilla.org/consoleservice;1']
		.getService(Components.interfaces.nsIConsoleService);

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

	var uri = aDetails.url;
	if (typeof uri != 'string')
		throw new Error('Invalid url: url must be of type string');
	if (!/^(http|https|ftp):\/\//.test(uri))
		throw new Error('Invalid url: '+uri);

	var request = Components
			.classes['@mozilla.org/xmlextras/xmlhttprequest;1']
			.createInstance(Components.interfaces.nsIXMLHttpRequest)
			.QueryInterface(Components.interfaces.nsIDOMEventTarget);
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
						type    : 'beforeGM_xmlhttpRequest'+eventType,
						state   : state,
						handled : false
					};
				_this.fireEvent(event);

				event.type = 'GM_xmlhttpRequest'+eventType;
				if ('on'+aEvent.type in this) {
					state.handled = event.handled = true;
					var func = this['on'+aEvent.type];
					this.target.contentWindow.setTimeout(function(aState) {
						func(aState);
						_this.fireEvent(event);
					}, 0, state);
					return;
				}
				_this.fireEvent(event);
			},
			target : this.target
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


function GM_addStyle()
{
	this.fireEvent({ type : 'GM_addStyleCall' });
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
}
