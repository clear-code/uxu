if (typeof window == 'undefined') 
	this.EXPORTED_SYMBOLS = ['URIMappingResolver'];
 
const Cc = Components.classes; 
const Ci = Components.interfaces;

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
 
	resolve : function(aURI) 
	{
		var uri = aURI;
		var finalURI;
		do {
			finalURI = uri;
			uri = this.resolveInternal(uri);
		}
		while (uri);
		return finalURI == aURI ? null : finalURI ;
	},
	
	resolveInternal : function(aURI) 
	{
		var uri = Cc['@mozilla.org/supports-string;1']
					.createInstance(Ci.nsISupportsString);
		uri.data = aURI.spec;
		ObserverService.notifyObservers(uri, 'uxu-mapping-check', null);
		uri = uri.data.replace(/^<redirect>/i, this.REDIRECTION_PROTOCOL+':');
		if (uri != aURI.spec) {
			var schemer = uri.split(':')[0];
			var handler = this.getNativeProtocolHandler(schemer);
			switch (schemer)
			{
				case 'file':
					var tempLocalFile = handler
							.QueryInterface(Ci.nsIFileProtocolHandler)
							.getFileFromURLSpec(uri);
					return IOService.newFileURI(tempLocalFile);

				default:
					return IOService.newURI(uri, null, null);
			}
		}
		return null;
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
URIMappingResolver.init();
  
