// -*- indent-tabs-mode: t -*- 
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const kUXU_TEST_RUNNING   = 'extensions.uxu.running';

// default "@mozilla.org/network/protocol;1?name=http" class id
const DEFAULT_HTTP_PROTOCOL_HANDLER = Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'];
// const DEFAULT_HTTPS_PROTOCOL_HANDLER = Components.classesByID['{dccbe7e4-7750-466b-a557-5ea36c8ff24e}'];

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Pref = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);
const IOService = Cc['@mozilla.org/network/io-service;1']
			.getService(Components.interfaces.nsIIOService);
 
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
 
	init : function() 
	{
		this.mDefaultHttpProtocolHandler = DEFAULT_HTTP_PROTOCOL_HANDLER
				.getService(Ci.nsIHttpProtocolHandler)
				.QueryInterface(Ci.nsIProtocolHandler)
				.QueryInterface(Ci.nsIProxiedProtocolHandler)
				.QueryInterface(Ci.nsIObserver)
				.QueryInterface(Ci.nsISupportsWeakReference);
//		this.mDefaultHttpsProtocolHandler = DEFAULT_HTTPS_PROTOCOL_HANDLER
//				.getService(Ci.nsIHttpProtocolHandler)
//				.QueryInterface(Ci.nsIProtocolHandler)
//				.QueryInterface(Ci.nsIProxiedProtocolHandler)
//				.QueryInterface(Ci.nsIObserver)
//				.QueryInterface(Ci.nsISupportsWeakReference);
		this.mProtocolHandler = this.mDefaultHttpProtocolHandler;
	},
	initNonSecure : function()
	{
		this.init();
	},
	initSecure : function()
	{
		this.init();
//		this.mProtocolHandler = this.mDefaultHttpsProtocolHandler;
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
			this[aProperty] = DEFAULT_HTTP_PROTOCOL_HANDLER
						.getService(Ci.nsIHttpProtocolHandler)
						.QueryInterface(Ci.nsIProtocolHandler)
						[aProperty];
		}, this);
	},
 
	// nsIProtocolHandler 
	allowPort : function(aPort, aScheme) { return this.mProtocolHandler.allowPort(aPort, aScheme); },
	newURI : function(aSpec, aCharset, aBaseURI) { return this.mProtocolHandler.newURI(aSpec, aCharset, aBaseURI); },
	newChannel: function(aURI)
	{
		if (Pref.getBoolPref(kUXU_TEST_RUNNING)) {
			var uri = this.mapURI(aURI);
			if (uri)
				return this.getNativeProtocolHandler(uri.scheme).newChannel(uri);
		}
		return this.mProtocolHandler.newChannel(aURI);
	},

	// nsIProxiedProtocolHandler
	newProxiedChannel : function(aURI, aProxyInfo)
	{
		if (Pref.getBoolPref(kUXU_TEST_RUNNING)) {
			var uri = this.mapURI(aURI);
			if (uri) {
				var handler = this.getNativeProtocolHandler(uri.scheme);
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
	},
 
	mapURI : function(aURI) 
	{
		if (Pref.getBoolPref(kUXU_TEST_RUNNING)) {
			var uri = Cc['@mozilla.org/supports-string;1']
						.createInstance(Ci.nsISupportsString);
			uri.data = aURI.spec;
			ObserverService.notifyObservers(uri, 'uxu-mapping-check', null);
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
				return this.mDefaultHttpProtocolHandler
						.QueryInterface(Ci.nsIHttpProtocolHandler);

			case 'https':
//				return this.mDefaultHttpsProtocolHandler
				return this.mDefaultHttpProtocolHandler
						.QueryInterface(Ci.nsIHttpProtocolHandler);

			case 'file':
				return IOService.getProtocolHandler('file')
						.QueryInterface(Ci.nsIFileProtocolHandler);

			default:
				return IOService.getProtocolHandler(aSchemer)
						.QueryInterface(Ci.nsIProtocolHandler);
		}
	},
 
	QueryInterface : XPCOMUtils.generateQI([ 
		Ci.nsIHttpProtocolHandler,
		Ci.nsIProtocolHandler,
		Ci.nsIProxiedProtocolHandler,
		Ci.nsIObserver,
		Ci.nsISupportsWeakReference
	])
 
}; 
ProtocolHandlerProxy.prototype.initProperties();
  
function HttpProtocolHandlerProxy() { 
	this.initNonSecure();
}
HttpProtocolHandlerProxy.prototype = {
	
	classDescription : 'UxUHttpProtocolHandlerProxy', 
	contractID : '@mozilla.org/network/protocol;1?name=http',
	classID : Components.ID('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}'),
 
	_xpcom_factory : { 
		createInstance: function(aOuter, aIID)
		{
			return (new HttpProtocolHandlerProxy()).QueryInterface(aIID);
		},
		QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIFactory])
	}
 
}; 
HttpProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
  
function HttpsProtocolHandlerProxy() { 
	this.initSecure();
}
HttpsProtocolHandlerProxy.prototype = {
	
	classDescription : 'UxUHttpsProtocolHandlerProxy', 
	contractID : '@mozilla.org/network/protocol;1?name=https',
	classID : Components.ID('{b81efa50-4e7d-11de-8a39-0800200c9a66}'),
 
	_xpcom_factory : { 
		createInstance: function(aOuter, aIID)
		{
			return (new HttpsProtocolHandlerProxy()).QueryInterface(aIID);
		},
		QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIFactory])
	}
 
}; 
HttpsProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy]);
 
