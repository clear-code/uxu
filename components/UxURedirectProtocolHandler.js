// -*- indent-tabs-mode: t -*- 
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
Components.utils.import('resource://uxu-modules/URIMappingResolver.js');

const IOService = Cc['@mozilla.org/network/io-service;1']
			.getService(Ci.nsIIOService);
 
function UxURedirectProtocol() { 
}
UxURedirectProtocol.prototype = {
	
	contractID : '@mozilla.org/network/protocol;1?name='+URIMappingResolver.REDIRECTION_PROTOCOL, 
	classDescription : 'UxURedirectProtocol',
	classID : Components.ID('{335d9d60-9fbe-11df-981c-0800200c9a66}'),

	_xpcom_factory : {
		createInstance: function(aOuter, aIID)
		{
			return (new UxURedirectProtocol()).QueryInterface(aIID);

		},
		QueryInterface: XPCOMUtils.generateQI([Ci.nsIFactory])
	},
 
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
		var uri = Components.classes['@mozilla.org/network/simple-uri;1']
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

		var uri = URIMappingResolver.resolve(aContentLocation);
		if (!uri || uri.scheme != URIMappingResolver.REDIRECTION_PROTOCOL)
			return this.ACCEPT;

		var uri = uri.spec.replace(URIMappingResolver.REDIRECTION_PROTOCOL+':', '');
		aContext.loadURIWithFlags(
			uri,
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
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([UxURedirectProtocol, UxURedirector]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([UxURedirectProtocol, UxURedirector]);
 
