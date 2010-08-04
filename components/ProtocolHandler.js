// -*- indent-tabs-mode: t -*- 
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

// default "@mozilla.org/network/protocol;1?name=http" class id
const DEFAULT_HTTP_PROTOCOL_HANDLER = Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'];
// const DEFAULT_HTTPS_PROTOCOL_HANDLER = Components.classesByID['{dccbe7e4-7750-466b-a557-5ea36c8ff24e}'];

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Pref = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);
const IOService = Cc['@mozilla.org/network/io-service;1']
			.getService(Ci.nsIIOService);
 
var URIMappingResolver = { 
	
	REDIRECTION_PROTOCOL : 'uxu-redirect', 
 
	get available() { 
		return Pref.getBoolPref('extensions.uxu.running');
	},
 
	defaultHttpProtocolHandler : DEFAULT_HTTP_PROTOCOL_HANDLER 
				.getService(Ci.nsIHttpProtocolHandler)
				.QueryInterface(Ci.nsIProtocolHandler)
				.QueryInterface(Ci.nsIProxiedProtocolHandler)
				.QueryInterface(Ci.nsIObserver)
				.QueryInterface(Ci.nsISupportsWeakReference),
//	defaultHttpsProtocolHandler : DEFAULT_HTTPS_PROTOCOL_HANDLER
//				.getService(Ci.nsIHttpProtocolHandler)
//				.QueryInterface(Ci.nsIProtocolHandler)
//				.QueryInterface(Ci.nsIProxiedProtocolHandler)
//				.QueryInterface(Ci.nsISupportsWeakReference),
 
	resolve : function(aURISpec) 
	{
		var uri = aURISpec;
		var finalURI;
		do {
			finalURI = uri;
			uri = this.resolveInternal(uri);
		}
		while (uri);

		if (finalURI == aURISpec)
			return null;

		var schemer = finalURI.split(':')[0];
		var handler = this.getNativeProtocolHandler(schemer);
		switch (schemer)
		{
			case 'file':
				var tempLocalFile = handler
						.QueryInterface(Ci.nsIFileProtocolHandler)
						.getFileFromURLSpec(finalURI);
				return IOService.newFileURI(tempLocalFile);

			default:
				return IOService.newURI(finalURI, null, null);
		}
	},
	
	resolveInternal : function(aURISpec) 
	{
		var uri = Cc['@mozilla.org/supports-string;1']
					.createInstance(Ci.nsISupportsString);
		uri.data = aURISpec;
		ObserverService.notifyObservers(uri, 'uxu-mapping-check', null);
		uri = uri.data.replace(/^<redirect>/i, this.REDIRECTION_PROTOCOL+':');
		return (uri != aURISpec) ? uri : null ;
	},
  
	getNativeProtocolHandler : function(aSchemer) 
	{
		switch (aSchemer)
		{
			case 'http':
				return this.defaultHttpProtocolHandler
						.QueryInterface(Ci.nsIHttpProtocolHandler);

			case 'https':
//				return this.defaultHttpsProtocolHandler
				return this.defaultHttpProtocolHandler
						.QueryInterface(Ci.nsIHttpProtocolHandler);

			case 'file':
				return IOService.getProtocolHandler('file')
						.QueryInterface(Ci.nsIFileProtocolHandler);

			default:
				return IOService.getProtocolHandler(aSchemer)
						.QueryInterface(Ci.nsIProtocolHandler);
		}
	}
 
}; 
  
// HTTP Protocol Handler Proxy 
	
var PrefObserver = { 
	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				this.onPrefChange(aData)
				return;
		}
	},
 
	onPrefChange : function(aPrefName) 
	{
		if (aPrefName.indexOf('general.useragent.') > -1) {
			this.timer = Cc['@mozilla.org/timer;1']
							.createInstance(Ci.nsITimer);
			this.timer.init({
				self : this,
				observe : function() {
					ProtocolHandlerProxy.prototype.initProperties();
					this.self.timer.cancel();
					this.self.timer = null;
				}
			}, 100, Ci.nsITimer.TYPE_ONE_SHOT);
		}
	}
 
}; 
Pref.addObserver('general.useragent', PrefObserver, false);
  
function ProtocolHandlerProxy() { 
	this.initNonSecure();
}
ProtocolHandlerProxy.prototype = {
	
	get wrappedJSObject() { 
		return this;
	},
 
	QueryInterface : XPCOMUtils.generateQI([ 
		Ci.nsIHttpProtocolHandler,
		Ci.nsIProtocolHandler,
		Ci.nsIProxiedProtocolHandler,
		Ci.nsIObserver,
		Ci.nsISupportsWeakReference
	]),
 
	init : function() 
	{
		this.mProtocolHandler = URIMappingResolver.defaultHttpProtocolHandler;
	},
	
	initNonSecure : function() 
	{
		this.init();
	},
 
	initSecure : function() 
	{
		this.init();
//		this.mProtocolHandler = URIMappingResolver.defaultHttpsProtocolHandler;
	},
 
	initProperties : function() 
	{
		[
			// nsIHttpProtocolHandler
			'userAgent',
			'appName',
			'appVersion',
			'vendor',
			'vendorSub',
			'vendorComment',
			'product',
			'productSub',
			'productComment',
			'platform',
			'oscpu',
			'language',
			'misc',

			// nsIProtocolHandler
			'scheme',
			'defaultPort',
			'protocolFlags',
		].forEach(function(aProperty) {
			this[aProperty] = URIMappingResolver.defaultHttpProtocolHandler[aProperty];
		}, this);
	},
  
	// nsIProtocolHandler 
	allowPort : function(aPort, aScheme) { return this.mProtocolHandler.allowPort(aPort, aScheme); },
	newURI : function(aSpec, aCharset, aBaseURI) { return this.mProtocolHandler.newURI(aSpec, aCharset, aBaseURI); },
	newChannel: function(aURI)
	{
		if (URIMappingResolver.available) {
			var uri = URIMappingResolver.resolve(aURI.spec);
			if (uri)
				return URIMappingResolver.getNativeProtocolHandler(uri.scheme).newChannel(uri);
		}
		return this.mProtocolHandler.newChannel(aURI);
	},
 
	// nsIProxiedProtocolHandler 
	newProxiedChannel : function(aURI, aProxyInfo)
	{
		if (URIMappingResolver.available) {
			var uri = URIMappingResolver.resolve(aURI.spec);
			if (uri) {
				var handler = URIMappingResolver.getNativeProtocolHandler(uri.scheme);
				try {
					return handler.QueryInterface(Ci.nsIProxiedProtocolHandler)
									.newProxiedChannel(uri, aProxyInfo);
				}
				catch(e) {
					return handler.newChannel(uri);
				}
			}
		}
		return this.mProtocolHandler.newProxiedChannel(aURI, aProxyInfo);
	},
 
	// nsIObserver 
	observe : function(aSubject, aTopic, aData)
	{
		return this.mProtocolHandler.observe(aSubject, aTopic, aData);
	},
 
	// nsISupportsWeakReaference 
	GetWeakReference : function()
	{
		return this.mProtocolHandler.GetWeakReference();
	}
 
}; 
ProtocolHandlerProxy.prototype.initProperties();
  
function HttpProtocolHandlerProxy() { 
	this.initNonSecure();
}
HttpProtocolHandlerProxy.prototype = {
	
	classDescription : 'UxUHttpProtocolHandlerProxy', 
	contractID : '@mozilla.org/network/protocol;1?name=http',
	classID : Components.ID('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}')
 
}; 
HttpProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
  
function HttpsProtocolHandlerProxy() { 
	this.initSecure();
}
HttpsProtocolHandlerProxy.prototype = {
	
	classDescription : 'UxUHttpsProtocolHandlerProxy', 
	contractID : '@mozilla.org/network/protocol;1?name=https',
	classID : Components.ID('{b81efa50-4e7d-11de-8a39-0800200c9a66}')
 
}; 
HttpsProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
   
// Redirector 
	
function UxURedirectProtocol() { 
}
UxURedirectProtocol.prototype = {
	
	contractID : '@mozilla.org/network/protocol;1?name='+URIMappingResolver.REDIRECTION_PROTOCOL, 
	classDescription : 'UxURedirectProtocol',
	classID : Components.ID('{335d9d60-9fbe-11df-981c-0800200c9a66}'),
 
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler]), 
 
	scheme        : URIMappingResolver.REDIRECTION_PROTOCOL, 
	defaultPort   : -1,
	protocolFlags : Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE |
	                Ci.nsIProtocolHandler.URI_INHERITS_SECURITY_CONTEXT,
 
	allowPort: function(aPort, aScheme) 
	{
		return false;
	},
 
	newURI: function(aSpec, aCharset, aBaseURI) 
	{
		var uri = Cc['@mozilla.org/network/simple-uri;1']
					.createInstance(Ci.nsIURI);
		try {
			uri.spec = aSpec;
		}
		catch(e) {
			dump(e+'\n');
		}
		return uri;
	},
 
	newChannel: function(aURI) 
	{
		var channel = IOService.newChannel('about:blank?'+aURI.spec, null, null);
		return channel;
	}
 
}; 
  
function UxURedirector() { 
}
UxURedirector.prototype = {
	
	contractID : '@clear-code.com/uxu/redirector;1', 
	classDescription : 'UxURedirector',
	classID : Components.ID('{a29a5470-9fbe-11df-981c-0800200c9a66}'),

	_xpcom_categories: [{ category : 'content-policy' }],
 
	QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy]), 
 
	TYPE_OTHER			: Ci.nsIContentPolicy.TYPE_OTHER, 
	TYPE_SCRIPT			: Ci.nsIContentPolicy.TYPE_SCRIPT,
	TYPE_IMAGE			: Ci.nsIContentPolicy.TYPE_IMAGE,
	TYPE_STYLESHEET		: Ci.nsIContentPolicy.TYPE_STYLESHEET,
	TYPE_OBJECT			: Ci.nsIContentPolicy.TYPE_OBJECT,
	TYPE_DOCUMENT		: Ci.nsIContentPolicy.TYPE_DOCUMENT,
	TYPE_SUBDOCUMENT	: Ci.nsIContentPolicy.TYPE_SUBDOCUMENT,
	TYPE_REFRESH		: Ci.nsIContentPolicy.TYPE_REFRESH,
	ACCEPT				: Ci.nsIContentPolicy.ACCEPT,
	REJECT_REQUEST		: Ci.nsIContentPolicy.REJECT_REQUEST,
	REJECT_TYPE			: Ci.nsIContentPolicy.REJECT_TYPE,
	REJECT_SERVER		: Ci.nsIContentPolicy.REJECT_SERVER,
	REJECT_OTHER		: Ci.nsIContentPolicy.REJECT_OTHER,
 
	shouldLoad : function(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra) 
	{
		if (!URIMappingResolver.available)
			return this.ACCEPT;

		var uri = URIMappingResolver.resolve(aContentLocation.spec);
		if (!uri || uri.scheme != URIMappingResolver.REDIRECTION_PROTOCOL)
			return this.ACCEPT;

		aContext.loadURIWithFlags(
			uri.spec.replace(URIMappingResolver.REDIRECTION_PROTOCOL+':', ''),
			Ci.nsIWebNavigation.LOAD_FLAGS_REPLACE_HISTORY,
			null,
			null,
			null
		);

		return this.REJECT_REQUEST;
	},
 
	shouldProcess : function(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra) 
	{
		return this.ACCEPT;
	}
 
}; 
   
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy, UxURedirectProtocol, UxURedirector]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy, UxURedirectProtocol, UxURedirector]);
 
