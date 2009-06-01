// -*- indent-tabs-mode: t -*- 
const Cc = Components.classes;
const Ci = Components.interfaces;

// default "@mozilla.org/network/protocol;1?name=http" class id
const DEFAULT_HTTP_PROTOCOL_HANDLER = Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'];

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Pref = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);
const IOService = Cc['@mozilla.org/network/io-service;1']
			.getService(Components.interfaces.nsIIOService);
 
function ProtocolHandlerProxy() { 
	this.init();
}
ProtocolHandlerProxy.prototype = {
	
	init : function() 
	{
		this._original = DEFAULT_HTTP_PROTOCOL_HANDLER
				.createInstance(Ci.nsIHttpProtocolHandler)
				.QueryInterface(Ci.nsIProtocolHandler)
				.QueryInterface(Ci.nsIProxiedProtocolHandler)
				.QueryInterface(Ci.nsIObserver)
				.QueryInterface(Ci.nsISupportsWeakReference);
	},
 
	// nsIHttpProtocolHandler 
	get userAgent() { return this._original.userAgent; },
	get appName() { return this._original.appName; },
	get appVersion() { return this._original.appVersion; },
	get vendor() { return this._original.vendor; },
	set vendor(aValue) { return this._original.vendor = aValue; },
	get vendorSub() { return this._original.vendorSub; },
	set vendorSub(aValue) { return this._original.vendorSub = aValue; },
	get vendorComment() { return this._original.vendorComment; },
	set vendorComment(aValue) { return this._original.vendorComment = aValue; },
	get product() { return this._original.product; },
	set product(aValue) { return this._original.product = aValue; },
	get productSub() { return this._original.productSub; },
	set productSub(aValue) { return this._original.productSub = aValue; },
	get productComment() { return this._original.productComment; },
	set productComment(aValue) { return this._original.productComment = aValue; },
	get platform() { return this._original.platform; },
	get oscpu() { return this._original.oscpu; },
	get language() { return this._original.language; },
	set language(aValue) { return this._original.language = aValue; },
	get misc() { return this._original.misc; },
	set misc(aValue) { return this._original.misc = aValue; },

	// nsIProtocolHandler
	get scheme() { return this._original.scheme; },
	get defaultPort() { return this._original.defaultPort; },
	get protocolFlags() { return this._original.protocolFlags; },
	allowPort : function(aPort, aScheme) { return this._original.allowPort(aPort, aScheme); },
	newURI : function(aSpec, aCharset, aBaseURI) { return this._original.newURI(aSpec, aCharset, aBaseURI); },
	newChannel: function(aURI)
	{
		if (Pref.getBoolPref('extensions.uxu.running')) {
			var uri = this.redirectURI(aURI);
			if (uri)
				return this.getNativeProtocolHandler(uri.scheme).newChannel(uri);
		}
		return this._original.newChannel(aURI);
	},

	// nsIProxiedProtocolHandler
	newProxiedChannel : function(aURI, aProxyInfo)
	{
		if (Pref.getBoolPref('extensions.uxu.running')) {
			var uri = this.redirectURI(aURI);
			if (uri) {
				var handler = this.getNativeProtocolHandler(uri.scheme);
				try {
					return handler.QueryInterface(Ci.nsIProxiedProtocolHandler)
									.newProxiedChannel(uri);
				}
				catch(e) {
					return handler.newChannel(uri);
				}
			}
		}
		return this._original.newProxiedChannel(aURI);
	},

	// nsIObserver
	observe : function(aSubject, aTopic, aData)
	{
		return this._original.observe(aSubject, aTopic, aData);
	},

	// nsISupportsWeakReaference
	GetWeakReference : function()
	{
		return this._original.GetWeakReference();
	},
 
	redirectURI : function(aURI) 
	{
		if (Pref.getBoolPref('extensions.uxu.running')) {
			var uri = Cc['@mozilla.org/supports-string;1']
						.createInstance(Ci.nsISupportsString);
			uri.data = aURI.spec;
			ObserverService.notifyObservers(uri, 'uxu-redirect-check', null);
			if (uri.data && uri.data != aURI.spec) {
				var schemer = uri.data.split(':')[0];
				var handler = this.getNativeProtocolHandler(schemer);
				switch (schemer)
				{
					case 'file':
						var tempLocalFile = handler
								.QueryInterface(Ci.nsIFileProtocolHandler)
								.getFileFromURLSpec(uri.data);
						return IOService.newFileURI(tempLocalFile);

					default:
						return IOService.newURI(uri.data, null, null);
				}
			}
		}
		return null;
	},
 
	getNativeProtocolHandler : function(aSchemer) 
	{
		switch (aSchemer)
		{
			case 'http':
			case 'https':
				return this._original
						.QueryInterface(Ci.nsIHttpProtocolHandler);

			case 'file':
				return IOService.getProtocolHandler('file')
						.QueryInterface(Ci.nsIFileProtocolHandler);

			default:
				return IOService.getProtocolHandler(schemer)
						.QueryInterface(Ci.nsIProtocolHandler);
		}
	},
 
	QueryInterface : function(aIID) 
	{
		if (aIID.equals(Ci.nsIHttpProtocolHandler) ||
			aIID.equals(Ci.nsIProtocolHandler) ||
			aIID.equals(Ci.nsIProxiedProtocolHandler) ||
			aIID.equals(Ci.nsIObserver) ||
			aIID.equals(Ci.nsISupports) ||
			aIID.equals(Ci.nsISupportsWeakReference))
			return this;
		else
			return this._original.QueryInterface(aIID);
	}
 
}; 
  	
function HttpProtocolHandlerProxy() { 
	this.init();
}
HttpProtocolHandlerProxy.prototype = {
	
	CID  : Components.ID('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}'), 
	ID   : '@mozilla.org/network/protocol;1?name=http',
	NAME : 'HTTP Protocol Handler Proxy'
 
}; 
HttpProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
  
function HttpsProtocolHandlerProxy() { 
	this.init();
}
HttpsProtocolHandlerProxy.prototype = {
	
	CID  : Components.ID('{b81efa50-4e7d-11de-8a39-0800200c9a66}'), 
	ID   : '@mozilla.org/network/protocol;1?name=https',
	NAME : 'HTTPS Protocol Handler Proxy'
 
}; 
HttpsProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
  
var gModule = { 
	registerSelf : function(aComponentManager, aFileSpec, aLocation, aType)
	{
		aComponentManager = aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		for (var key in this._objects)
		{
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(
				obj.CID,
				obj.NAME,
				obj.ID,
				aFileSpec,
				aLocation,
				aType
			);
		}
	},

	getClassObject : function(aComponentManager, aCID, aIID)
	{
		for (var key in this._objects)
		{
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		http : {
			CID  : HttpProtocolHandlerProxy.prototype.CID,
			NAME : HttpProtocolHandlerProxy.prototype.NAME,
			ID   : HttpProtocolHandlerProxy.prototype.ID,
			factory : {
				QueryInterface : function(aIID)
				{
					if (!aIID.equals(Ci.nsISupports) &&
						!aIID.equals(Ci.nsIFactory)) {
						throw Components.results.NS_ERROR_NO_INTERFACE;
					}
					return this;
				},
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return new HttpProtocolHandlerProxy();
				}
			}
		},
		https : {
			CID  : HttpsProtocolHandlerProxy.prototype.CID,
			NAME : HttpsProtocolHandlerProxy.prototype.NAME,
			ID   : HttpsProtocolHandlerProxy.prototype.ID,
			factory : {
				QueryInterface : function(aIID)
				{
					if (!aIID.equals(Ci.nsISupports) &&
						!aIID.equals(Ci.nsIFactory)) {
						throw Components.results.NS_ERROR_NO_INTERFACE;
					}
					return this;
				},
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return new HttpsProtocolHandlerProxy();
				}
			}
		}
	},

	canUnload : function(aComponentManager)
	{
		return true;
	}
};
function NSGetModule(aCompMgr, aFileSpec) {
	return gModule;
}
 
