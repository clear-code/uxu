// -*- indent-tabs-mode: t; tab-width: 4 -*-


function constructor(aSuite, aBrowser)
{
	this.environment = aSuite;
	this.target      = aBrowser;
	this.storage     = {};
	this.listeners   = [];
	this.uri         = aSuite.fileURL;
}


function createSandbox()
{
	var gmEnv = {
			environment : this.environment,
			target      : this.target,
			storage     : {},
			listeners   : [],
			fireEvent   : function() {
				fireEvent.apply(this, arguments);
			},
			callGMFunction : function(aFunc, aArguments) {
				this.uri = this.target.currentURI.spec;
				return aFunc.apply(this, aArguments);
			}
		};
	var sandbox = {
		get window() {
			return gmEnv.target.contentWindow;
		},
		get unsafeWindow() {
			return gmEnv.target.contentWindow.wrappedJSObject;
		},
		get document() {
			return gmEnv.target.contentDocument;
		},
		GM_log : function() {
			return gmEnv.callGMFunction(GM_log, arguments);
		},
		GM_getValue : function() {
			return gmEnv.callGMFunction(GM_getValue, arguments);
		},
		GM_setValue : function() {
			return gmEnv.callGMFunction(GM_setValue, arguments);
		},
		GM_registerMenuCommand : function() {
			return gmEnv.callGMFunction(GM_registerMenuCommand, arguments);
		},
		GM_xmlhttpRequest : function(aDetails) {
			return gmEnv.callGMFunction(GM_xmlhttpRequest, arguments);
		},
		GM_addStyle : function() {
			return gmEnv.callGMFunction(GM_addStyle, arguments);
		},
		GM_getResourceURL : function() {
			return gmEnv.callGMFunction(GM_getResourceURL, arguments);
		},
		GM_getResourceText : function() {
			return gmEnv.callGMFunction(GM_getResourceText, arguments);
		},
		GM_openInTab : function() {
			return gmEnv.callGMFunction(GM_openInTab, arguments);
		},
		addListener : function() {
			return gmEnv.callGMFunction(addListener, arguments);
		},
		removeListener : function() {
			return gmEnv.callGMFunction(removeListener, arguments);
		},
		load : function(aURI) {
			var loadedFlag = { value : false };
			gmEnv.target.addEventListener('load', function() {
				gmEnv.target.removeEventListener('load', arguments.callee, true);
				sandbox.__proto__ = gmEnv.target.contentWindow;
				loadedFlag.value = true;
			}, true);
			gmEnv.target.loadURI(gmEnv.environment.utils.fixupIncompleteURI(aURI));
			return loadedFlag;
		},
		unload : function() {
			this.__proto__ = null;
			var loadedFlag = { value : false };
			gmEnv.target.addEventListener('load', function() {
				gmEnv.target.removeEventListener('load', arguments.callee, true);
				loadedFlag.value = true;
			}, true);
			gmEnv.target.loadURI('about:blank');
			return loadedFlag;
		},
		loadScript : function(aURI, aEncoding) {
			gmEnv.environment.utils.include(aURI, this, aEncoding);
		}
	};
	return sandbox;
}


function fireEvent(aEvent)
{
	aEvent.target = this.uri;
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
	this.fireEvent({ type : 'GM_openInTabCall', uri : GM_openInTab });
}
