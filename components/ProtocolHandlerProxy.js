// -*- indent-tabs-mode: t -*- 
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
Components.utils.import('resource://uxu-modules/URIMappingResolver.js');

const Pref = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);
 
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
			var uri = URIMappingResolver.resolve(aURI);
			if (uri)
				return URIMappingResolver.getNativeProtocolHandler(uri.scheme).newChannel(uri);
		}
		return this.mProtocolHandler.newChannel(aURI);
	},
 
	// nsIProxiedProtocolHandler 
	newProxiedChannel : function(aURI, aProxyInfo)
	{
		if (URIMappingResolver.available) {
			var uri = URIMappingResolver.resolve(aURI);
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
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([HttpProtocolHandlerProxy, HttpsProtocolHandlerProxy]);
 
