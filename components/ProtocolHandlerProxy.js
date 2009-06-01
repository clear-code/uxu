// -*- indent-tabs-mode: t -*- 
const Cc = Components.classes;
const Ci = Components.interfaces;

// default "@mozilla.org/network/protocol;1?name=http" class id
const ORIGINAL_CLASS = Components.classesByID['{4f47e42e-4d23-4dd3-bfda-eb29255e9ea3}'];

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Pref = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);
const IOService = Cc['@mozilla.org/network/io-service;1']
			.getService(Components.interfaces.nsIIOService);
 
function ProtocolHandlerProxy() { 
	this._original = ORIGINAL_CLASS.createInstance();
}
ProtocolHandlerProxy.prototype = {
	 
	CID  : Components.ID('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}'), 
	ID   : '@mozilla.org/network/protocol;1?name=http',
	NAME : 'HTTP Protocol Handler Proxy',
 
	allowPort : function(aPort, aScheme) {
		return this._original
				.QueryInterface(Ci.nsIHttpProtocolHandler)
				.allowPort(aPort, aScheme);
	},
 
	newURI : function(aSpec, aCharset, aBaseURI) {
		return this._original
				.QueryInterface(Ci.nsIHttpProtocolHandler)
				.newURI(aSpec, aCharset, aBaseURI);
	},
 
	newChannel: function(aURI) {
		if (Pref.getBoolPref('extensions.uxu.running')) {
			var uri = Cc['@mozilla.org/supports-string;1']
						.createInstance(Ci.nsISupportsString);
			uri.data = aURI.spec;
			ObserverService.notifyObservers(uri, 'uxu-redirect-check', null);
			if (uri.data && uri.data != aURI.spec) {
				var newURI;
				var schemer = uri.data.split(':')[0];
				switch (schemer)
				{
					case 'http':
						newURI = IOService.newURI(uri.data, null, null);
						return this._original
								.QueryInterface(Ci.nsIHttpProtocolHandler)
								.newChannel(newURI);

					case 'file':
						var fileHandler = IOService.getProtocolHandler('file')
											.QueryInterface(Ci.nsIFileProtocolHandler);
						var tempLocalFile = fileHandler.getFileFromURLSpec(uri.data);
						newURI = IOService.newFileURI(tempLocalFile);
						return fileHandler.newChannel(newURI);

					default:
						var handler = IOService.getProtocolHandler(schemer)
											.QueryInterface(Ci.nsIProtocolHandler);
						newURI = IOService.newURI(uri.data, null, null);
						return fileHandler.newChannel(newURI);
				}
			}
		}
		return this._original
				.QueryInterface(Ci.nsIHttpProtocolHandler)
				.newChannel(aURI);
	},
 
	QueryInterface : function(aIID) 
	{
		if (aIID.equals(Ci.nsIHttpProtocolHandler))
			return this;
		else
			return this._original.QueryInterface(aIID);
	}
 
}; 
  
var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			ProtocolHandlerProxy.prototype.CID,
			ProtocolHandlerProxy.prototype.NAME,
			ProtocolHandlerProxy.prototype.ID,
			aFileSpec,
			aLocation,
			aType
		);
	},

	getClassObject : function(aCompMgr, aCID, aIID)
	{
		return this.factory;
	},

	factory : {
		QueryInterface : function(aIID)
		{
			if (!aIID.equals(Ci.nsISupports) &&
				!aIID.equals(Ci.nsIFactory)) {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		},
		createInstance : function(aOuter, aIID)
		{
			return new ProtocolHandlerProxy();
		}
	},

	canUnload : function(aCompMgr)
	{
		return true;
	}
};

function NSGetModule(aCompMgr, aFileSpec) {
	return gModule;
}
 
