// -*- indent-tabs-mode: t -*- 
var Cc = Components.classes;
var Ci = Components.interfaces;

const kUXU_INSTALL_GLOBAL = 'extensions.uxu.global';
const kUXU_TEST_RUNNING   = 'extensions.uxu.running';
const kUXU_PROXY_ENABLED  = 'extensions.uxu.enableInternalProxy';

const kUXU_DIR_NAME = 'uxu@clear-code.com';
const kCATEGORY = 'm-uxu';

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
var bundle;
 
function GlobalService() { 
}
GlobalService.prototype = {
	
	CID  : Components.ID('{dd385d40-9e6f-11dd-ad8b-0800200c9a66}'), 
	ID   : '@clear-code.com/uxu/startup;1',
	NAME : 'UxU Global Service',
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				ObserverService.addObserver(this, 'profile-after-change', false);
				ObserverService.addObserver(this, 'final-ui-startup', false);
				return;

			case 'profile-after-change':
				ObserverService.removeObserver(this, 'profile-after-change');
				this.upgradePrefs();
				return;

			case 'final-ui-startup':
				ObserverService.removeObserver(this, 'final-ui-startup');
				Pref.addObserver(kUXU_INSTALL_GLOBAL, this, false);
				Pref.addObserver(kUXU_PROXY_ENABLED, this, false);
				Pref.addObserver('general.useragent', this, false);
				this.init();
				return;

			case 'nsPref:changed':
				this.onPrefChange(aData)
				return;
		}
	},
 
	init : function() 
	{
		bundle = Cc['@mozilla.org/intl/stringbundle;1']
				.getService(Ci.nsIStringBundleService)
				.createBundle('chrome://uxu/locale/uxu.properties');
		PromptService = Cc['@mozilla.org/embedcomp/prompt-service;1']
				.getService(Ci.nsIPromptService);

		Pref.setBoolPref(kUXU_TEST_RUNNING, false);
		this.checkInstallGlobal();
	},
 
	onPrefChange : function(aPrefName) 
	{
		switch (aPrefName)
		{
			case kUXU_INSTALL_GLOBAL:
			case kUXU_PROXY_ENABLED:
				if (PromptService.confirmEx(
						null,
						bundle.GetStringFromName('confirm_changePref_restart_title'),
						bundle.GetStringFromName('confirm_changePref_restart_text'),
						Ci.nsIPromptService.BUTTON_TITLE_YES * Ci.nsIPromptService.BUTTON_POS_0 +
						Ci.nsIPromptService.BUTTON_TITLE_NO * Ci.nsIPromptService.BUTTON_POS_1,
						null, null, null, null, {}
					) == 0)
					this.restart();
				break;

			default:
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
				break;
		}
	},
 
	checkInstallGlobal : function() 
	{
		var UpdateService = Cc['@mozilla.org/updates/update-service;1']
							.getService(Ci.nsIApplicationUpdateService);
		if (!UpdateService.canUpdate) {
			if (Pref.getBoolPref(kUXU_INSTALL_GLOBAL))
				Pref.setBoolPref(kUXU_INSTALL_GLOBAL, false);
			return;
		}

		var inGlobal = this.installedLocation.path == this.globalLocation.path;
		if (Pref.getBoolPref(kUXU_INSTALL_GLOBAL)) {
			if (inGlobal) return;
			if (this.installToGlobal()) {
				this.restart();
			}
			else {
				Pref.setBoolPref(kUXU_INSTALL_GLOBAL, false);
			}
		}
		else if (inGlobal) {
			if (this.uninstallFromGlobal())
				this.restart();
		}
		else if (this.globalLocation.exists()) {
			this.globalLocation.remove(true);
		}
	},
	
	get installedLocation() 
	{
		var id = 'uxu@clear-code.com';
		var dir = Cc['@mozilla.org/extensions/manager;1']
				.getService(Ci.nsIExtensionManager)
				.getInstallLocation(id)
				.getItemLocation(id);
		return dir;
	},
	
	get globalLocation() 
	{
		var dir = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties)
				.get('CurProcD', Ci.nsIFile);
		dir.append('extensions');
		dir.append(kUXU_DIR_NAME);
		return dir;
	},
 
	get userLocation() 
	{
		var dir = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties)
				.get('ProfD', Ci.nsIFile);
		dir.append('extensions');
		dir.append(kUXU_DIR_NAME);
		return dir;
	},
  
	installToGlobal : function() 
	{
		try {
			var source = this.installedLocation;
			var dest = this.globalLocation;

			if (dest.exists()) {
				var sourceManifest = source.clone();
				sourceManifest.append('install.rdf');
				var sourceVersion = this.getVersionFromManifest(sourceManifest);

				var destManifest = dest.clone();
				destManifest.append('install.rdf');
				var destVersion = this.getVersionFromManifest(destManifest);

				var comparator = Cc['@mozilla.org/xpcom/version-comparator;1']
									.getService(Ci.nsIVersionComparator);
				if (
					sourceVersion && destVersion &&
					comparator.compare(destVersion, sourceVersion) > 0 &&
					source.lastModifiedTime < dest.lastModifiedTime
					) {
					source.remove(true);
					return true;
				}
				dest.remove(true);
			}
			source.moveTo(dest.parent, kUXU_DIR_NAME);
		}
		catch(e) {
			dump(e);
			return false;
		}
		return true;
	},
	
	getVersionFromManifest : function(aFile) 
	{
		aFile = aFile.QueryInterface(Ci.nsILocalFile)
		var stream = Cc['@mozilla.org/network/file-input-stream;1']
					.createInstance(Ci.nsIFileInputStream);
		try {
			stream.init(aFile, 1, 0, false); // open as "read only"
		}
		catch(ex) {
			return '';
		}

		var fileContents = null;
		try {
			var scriptableStream = Cc['@mozilla.org/scriptableinputstream;1']
					.createInstance(Ci.nsIScriptableInputStream);
			scriptableStream.init(stream);
			fileContents = scriptableStream.read(scriptableStream.available());
			scriptableStream.close();
		}
		finally {
			stream.close();
		}

		if (fileContents) {
			var match = fileContents.match(/<em:version>([^<]+)<\/em:version>/);
			if (match) return match[1];
			match = fileContents.match(/em:version=['"]([^'"]+)['"]/);
			if (match) return match[1];
		}
		return '';
	},
  
	uninstallFromGlobal : function() 
	{
		try {
			var source = this.installedLocation;
			var dest = this.userLocation;
			source.copyTo(dest.parent, kUXU_DIR_NAME);
		}
		catch(e) {
			dump(e);
			return false;
		}
		return true;
	},
 
	restart : function() 
	{
		const startup = Cc['@mozilla.org/toolkit/app-startup;1']
						.getService(Ci.nsIAppStartup);
		startup.quit(startup.eRestart | startup.eAttemptQuit);
	},
  
	/* nsICommandLineHandler */ 
	
	handle : function(aCommandLine) 
	{
		var arg = {
				server     : this._getBooleanValueFromCommandLine('uxu-start-server', aCommandLine),
				serverPort : this._getNumericValueFromCommandLine('uxu-listen-port', aCommandLine, 0),
				outputHost : this._getValueFromCommandLine('uxu-output-host', aCommandLine, ''),
				outputPort : this._getNumericValueFromCommandLine('uxu-output-port', aCommandLine, 0),
				testcase   : this._getFullPathFromCommandLine('uxu-testcase', aCommandLine, ''),
				priority   : this._getValueFromCommandLine('uxu-priority', aCommandLine, null),
				log        : this._getFullPathFromCommandLine('uxu-log', aCommandLine, ''),
				rawLog     : this._getFullPathFromCommandLine('uxu-rawlog', aCommandLine, ''),
				autoQuit   : this._getBooleanValueFromCommandLine('uxu-autoquit', aCommandLine),
				doNotQuit  : this._getBooleanValueFromCommandLine('uxu-do-not-quit', aCommandLine),
				hidden     : this._getBooleanValueFromCommandLine('uxu-hidden', aCommandLine)
			};

		if (arg.testcase || arg.server) {
			aCommandLine.preventDefault = true;
			var WindowWatcher = Components
					.classes['@mozilla.org/embedcomp/window-watcher;1']
					.getService(Ci.nsIWindowWatcher);
			var bag = Cc['@mozilla.org/hash-property-bag;1']
					.createInstance(Ci.nsIWritablePropertyBag);
			for (var i in arg)
			{
				bag.setProperty(i, arg[i]);
			}
			WindowWatcher.openWindow(
				null,
				arg.server ? 'chrome://uxu/content/ui/uxu.xul' : 'chrome://uxu/content/ui/runner.xul',
				'_blank',
				'chrome,all,dialog=no',
				bag
			);
		}
	},
 
	_getValueFromCommandLine : function(aOption, aCommandLine, aDefaultValue) 
	{
		if (aDefaultValue === void(0)) aDefaultValue = '';
		try {
			return aCommandLine.handleFlagWithParam(aOption, false);
		}
		catch(e) {
		}
		return aDefaultValue;
	},
	
	_getFullPathFromCommandLine : function(aOption, aCommandLine, aDefaultValue) 
	{
		if (!aDefaultValue) aDefaultValue = '';
		var value = this._getValueFromCommandLine(aOption, aCommandLine, aDefaultValue);
		if (!value) return aDefaultValue;
		if (value.indexOf('/') < 0) {
			value = aCommandLine.resolveFile(value);
			return value.path;
		}
		else {
			value = aCommandLine.resolveURI(value);
			return value.spec;
		}
	},
 
	_getNumericValueFromCommandLine : function(aOption, aCommandLine, aDefaultValue) 
	{
		if (!aDefaultValue) aDefaultValue = 0;
		var value = this._getValueFromCommandLine(aOption, aCommandLine, aDefaultValue);
		if (!value) return aDefaultValue;
		value = parseInt(value);
		return isNaN(value) ? aDefaultValue : value ;
	},
 
	_getBooleanValueFromCommandLine : function(aOption, aCommandLine) 
	{
		try {
			if (aCommandLine.handleFlag(aOption, false)) {
				return true;
			}
		}
		catch(e) {
		}
		return false;
	},
  
	helpInfo : 
		'  -uxu-start-server    Starts UnitTest.XUL Server instead of Firefox\n'+
		'  -uxu-listen-port <port>\n'+
		'                       Listening port of UnitTest.XUL Server\n'+
		'  -uxu-output-host <host>\n'+
		'                       Output the result of the testcase\n'+
		'                       to the host in raw format\n'+
		'  -uxu-output-port <port>\n'+
		'                       Listening port of the host specified by the\n'+
		'                       "-uxu-output-host" option\n'+
		'  -uxu-testcase <url>  Run the testcase in UnitTest.XUL\n'+
		'  -uxu-priority <priority>\n'+
		'                       Run all tests in the testcase with the priority\n'+
		'  -uxu-log <url>       Output the result of the testcase\n'+
		'                       in human readable format\n'+
		'  -uxu-rawlog <url>    Output the result of the testcase\n'+
		'                       in raw format\n',
  
	/* backward compatibility */ 
	
	upgradePrefs : function() 
	{
		this.upgradePrefsInternal(
			'extensions.uxu.mozunit.',
			'extensions.uxu.runner.'
		);
	},
 
	upgradePrefsInternal : function(aOldBase, aNewBase) 
	{
		Pref.getChildList(aOldBase, {}).forEach(function(aPref) {
			var newPref = aPref.replace(aOldBase, aNewBase);
			switch (Pref.getPrefType(aPref))
			{
				case Pref.PREF_STRING:
					Pref.setCharPref(newPref, Pref.getCharPref(aPref));
					break;
				case Pref.PREF_INT:
					Pref.setIntPref(newPref, Pref.getIntPref(aPref));
					break;
				default:
					Pref.setBoolPref(newPref, Pref.getBoolPref(aPref));
					break;
			}
			Pref.clearUserPref(aPref);
		}, this);
	},
  
	/* nsIFactory */ 
	
	createInstance : function(aOuter, aIID) 
	{
		if (aOuter != null)
			throw Components.results.NS_ERROR_NO_AGGREGATION;
		return this.QueryInterface(aIID);
	},
 
	lockFactory : function(aLock) 
	{
	},
  
	QueryInterface : function(aIID) 
	{
		if (!aIID.equals(Ci.nsIObserver) &&
			!aIID.equals(Ci.nsICommandLineHandler) &&
			!aIID.equals(Ci.nsIFactory) &&
			!aIID.equals(Ci.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
 
}; 
  
function ProtocolHandlerProxy() { 
	this.initNonSecure();
}
ProtocolHandlerProxy.prototype = {
	
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
			var uri = this.redirectURI(aURI);
			if (uri)
				return this.getNativeProtocolHandler(uri.scheme).newChannel(uri);
		}
		return this.mProtocolHandler.newChannel(aURI);
	},

	// nsIProxiedProtocolHandler
	newProxiedChannel : function(aURI, aProxyInfo)
	{
		if (Pref.getBoolPref(kUXU_TEST_RUNNING)) {
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
		return this.mProtocolHandler.newProxiedChannel(aURI);
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
 
	redirectURI : function(aURI) 
	{
		if (Pref.getBoolPref(kUXU_TEST_RUNNING)) {
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
 
	QueryInterface : function(aIID) 
	{
		if (Pref.getBoolPref(kUXU_TEST_RUNNING) &&
			(aIID.equals(Ci.nsIHttpProtocolHandler) ||
			 aIID.equals(Ci.nsIProtocolHandler) ||
			 aIID.equals(Ci.nsIProxiedProtocolHandler) ||
			 aIID.equals(Ci.nsIObserver) ||
			 aIID.equals(Ci.nsISupports) ||
			 aIID.equals(Ci.nsISupportsWeakReference)))
			return this;
		else
			return this.mProtocolHandler.QueryInterface(aIID);
	}
 
}; 
ProtocolHandlerProxy.prototype.initProperties();
  
function HttpProtocolHandlerProxy() { 
	this.initNonSecure();
}
HttpProtocolHandlerProxy.prototype = {
	
	CID  : Components.ID('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}'), 
	ID   : '@mozilla.org/network/protocol;1?name=http',
	NAME : 'HTTP Protocol Handler Proxy'
 
}; 
HttpProtocolHandlerProxy.prototype.__proto__ = ProtocolHandlerProxy.prototype;
  
function HttpsProtocolHandlerProxy() { 
	this.initSecure();
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
			if (!obj.enabled) continue;
			aComponentManager.registerFactoryLocation(
				obj.CID,
				obj.NAME,
				obj.ID,
				aFileSpec,
				aLocation,
				aType
			);
			if ('onRegister' in obj)
				obj.onRegister();
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
		global : {
			CID  : GlobalService.prototype.CID,
			NAME : GlobalService.prototype.NAME,
			ID   : GlobalService.prototype.ID,
			onRegister : function()
			{
				var catMgr = Cc['@mozilla.org/categorymanager;1']
							.getService(Ci.nsICategoryManager);
				catMgr.addCategoryEntry('app-startup', this.NAME, this.ID, true, true);
				catMgr.addCategoryEntry('command-line-handler', kCATEGORY, this.ID, true, true);
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
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return new GlobalService();
				}
			},
			enabled : true
		},
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
			},
			get enabled() {
				return Pref.getBoolPref(kUXU_PROXY_ENABLED);
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
			},
			get enabled() {
				return Pref.getBoolPref(kUXU_PROXY_ENABLED);
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
 
