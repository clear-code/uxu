// -*- indent-tabs-mode: t -*- 
var Cc = Components.classes;
var Ci = Components.interfaces;

const kUXU_INSTALL_GLOBAL = 'extensions.uxu.global';
const kUXU_TEST_RUNNING   = 'extensions.uxu.running';
const kUXU_PROXY_ENABLED  = 'extensions.uxu.protocolHandlerProxy.enabled';

const kUXU_DIR_NAME = 'uxu@clear-code.com';
const kCATEGORY = 'm-uxu';

const kPROXY_ENABLED_FILE_NAME = '.uxu-protocol-handler-proxy-enabled';
const kSKIP_INITIALIZE_FILE_NAME = '.uxu-skip-restart';

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
				this.init();
				return;

			case 'nsPref:changed':
				this.onPrefChange(aData)
				return;

			case 'uxu-profile-setup':
				this.setUpUXUPrefs(aSubject.QueryInterface(Ci.nsILocalFile));
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

		if (!this.skipInitializeFile.exists()) {
			this.checkInstallGlobal();
			this.checkProxyEnabled();
			Pref.addObserver(kUXU_INSTALL_GLOBAL, this, false);
			Pref.addObserver(kUXU_PROXY_ENABLED, this, false);
		}

		Pref.addObserver('general.useragent', this, false);
		ObserverService.addObserver(this, 'uxu-profile-setup', false);
	},
 
	onPrefChange : function(aPrefName) 
	{
		switch (aPrefName)
		{
			case kUXU_PROXY_ENABLED:
				this.proxyEnabled = Pref.getBoolPref(aPrefName);
			case kUXU_INSTALL_GLOBAL:
				this.timer = Cc['@mozilla.org/timer;1']
								.createInstance(Ci.nsITimer);
				this.timer.init({
					self : this,
					observe : function() {
						this.self.timer.cancel();
						this.self.timer = null;
						GlobalService.prototype.confirmRestartToApplyChange();
					}
				}, 100, Ci.nsITimer.TYPE_ONE_SHOT);
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
 
	get profileDirectory() 
	{
		if (!this._profileDirectory)
			this._profileDirectory = Cc['@mozilla.org/file/directory_service;1']
				.getService(Ci.nsIProperties)
				.get('ProfDS', Ci.nsIFile);
		return this._profileDirectory;
	},
	_profileDirectory : null,
 
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
		if (!this._installedLocation) {
			var id = 'uxu@clear-code.com';
			var dir = Cc['@mozilla.org/extensions/manager;1']
					.getService(Ci.nsIExtensionManager)
					.getInstallLocation(id)
					.getItemLocation(id);
			this._installedLocation = dir;
		}
		return this._installedLocation;
	},
	_installedLocation : null,
	
	get globalLocation() 
	{
		if (!this._globalLocation) {
			var dir = Cc['@mozilla.org/file/directory_service;1']
					.getService(Ci.nsIProperties)
					.get('CurProcD', Ci.nsIFile);
			dir.append('extensions');
			dir.append(kUXU_DIR_NAME);
			this._globalLocation = dir;
		}
		return this._globalLocation;
	},
	_globalLocation : null,
 
	get userLocation() 
	{
		if (!this._userLocation) {
			var dir = this.profileDirectory.clone(true);
			dir.append('extensions');
			dir.append(kUXU_DIR_NAME);
			this._userLocation = dir;
		}
		return this._userLocation;
	},
	_userLocation : null,
  
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
 
	confirmRestartToApplyChange : function() 
	{
		if (PromptService.confirmEx(
				null,
				bundle.GetStringFromName('confirm_changePref_restart_title'),
				bundle.GetStringFromName('confirm_changePref_restart_text'),
				Ci.nsIPromptService.BUTTON_TITLE_YES * Ci.nsIPromptService.BUTTON_POS_0 +
				Ci.nsIPromptService.BUTTON_TITLE_NO * Ci.nsIPromptService.BUTTON_POS_1,
				null, null, null, null, {}
			) == 0)
			this.restart();
	},
  
	checkProxyEnabled : function() 
	{
		var proxyEnabled = Pref.getBoolPref(kUXU_PROXY_ENABLED);
		if (proxyEnabled != this.proxyEnabled) {
			this.proxyEnabled = proxyEnabled;
			this.restart();
		}
	},
	
	get proxyEnabled() 
	{
		return this.proxyEnabledFile.exists();
	},
 
	set proxyEnabled(aValue) 
	{
		var modified = false;
		var proxyEnabled = this.proxyEnabledFile;
		if (proxyEnabled.exists() && !aValue) {
			proxyEnabled.remove(true);
			modified = true;
		}
		else if (!proxyEnabled.exists() && aValue) {
			proxyEnabled.create(proxyEnabled.NORMAL_FILE_TYPE, 0644);
			modified = true;
		}
		if (modified) {
			var autoreg = this.profileDirectory.clone(true);
			autoreg.append('.autoreg');
			if (!autoreg.exists())
				autoreg.create(autoreg.NORMAL_FILE_TYPE, 0644);
		}
		return aValue;
	},
 
	get proxyEnabledFile() 
	{
		if (!this._proxyEnabledFile) {
			this._proxyEnabledFile = this.profileDirectory.clone(true);
			this._proxyEnabledFile.append(kPROXY_ENABLED_FILE_NAME);
		}
		return this._proxyEnabledFile;
	},
	_proxyEnabledFile : null,
  
	setUpUXUPrefs : function(aProfile) 
	{
		var skipInitialize = aProfile.clone(true);
		skipInitialize.append(kSKIP_INITIALIZE_FILE_NAME);
		skipInitialize.create(skipInitialize.NORMAL_FILE_TYPE, 0644);

		if (this.proxyEnabled) {
			var proxyEnabled = aProfile.clone(true);
			proxyEnabled.append(kPROXY_ENABLED_FILE_NAME);
			proxyEnabled.create(proxyEnabled.NORMAL_FILE_TYPE, 0644);
		}

		var userJSFile = aProfile.clone(true);
		userJSFile.append('user.js');
		var userJSContents = '';
		if (userJSFile.exists()) userJSContents = this.readFrom(userJSFile);

		var lines = [];
		var prefs = <![CDATA[
				bool extensions.uxu.protocolHandlerProxy.enabled
				bool extensions.uxu.profile.enableDebugOptions
				bool extensions.uxu.profile.disableAutoUpdate
				bool extensions.uxu.profile.disableExitWarning
				bool extensions.uxu.profile.disableCheckDefaultWarning
				int  extensions.uxu.run.timeout
				int  extensions.uxu.run.timeout.application
				int  extensions.uxu.run.history.expire.days
				char extensions.uxu.defaultEncoding
				bool extensions.uxu.showInternalStacks
				char extensions.uxu.priority.important
				char extensions.uxu.priority.high
				char extensions.uxu.priority.normal
				char extensions.uxu.priority.low
				bool extensions.uxu.warnOnNoAssertion
				bool extensions.uxu.action.fireMouseEvent.useOldMethod
				bool extensions.uxu.action.fireKeyEvent.useOldMethod
				char extensions.uxu.runner.runMode
				bool extensions.uxu.runner.runParallel
				bool extensions.uxu.runner.autoShowContent
				bool extensions.uxu.runner.coloredDiff
				int  extensions.uxu.port
				bool extensions.uxu.allowAccessesFromRemote
				char extensions.uxu.allowAccessesFromRemote.allowedList
			]]>.toString()
				.replace(/^\s+|\s+$/g, '')
				.split(/\s+/);
		for (var i = 0, maxi = prefs.length; i < maxi; i += 2)
		{
			switch (prefs[i])
			{
				case 'bool':
					lines.push('user_pref("'+prefs[i+1]+'", '+Pref.getBoolPref(prefs[i+1])+');');
					break;
				case 'int':
					lines.push('user_pref("'+prefs[i+1]+'", '+Pref.getIntPref(prefs[i+1])+');');
					break;
				case 'char':
					lines.push('user_pref("'+prefs[i+1]+'", "'+Pref.getCharPref(prefs[i+1])+'");');
					break;
			}
		}

		if (Pref.getBoolPref('extensions.uxu.profile.enableDebugOptions')) {
			lines.push('user_pref("browser.dom.window.dump.enabled", true);');
			lines.push('user_pref("javascript.options.showInConsole", true);');
		}
		if (Pref.getBoolPref('extensions.uxu.profile.disableAutoUpdate')) {
			lines.push('user_pref("app.update.enabled", false);');
			lines.push('user_pref("extensions.update.enabled", false);');
			lines.push('user_pref("browser.search.update", false);');
		}
		if (Pref.getBoolPref('extensions.uxu.profile.disableExitWarning')) {
			// Firefox
			lines.push('user_pref("browser.warnOnQuit", false);');
			lines.push('user_pref("browser.warnOnRestart", false);');
		}
		if (Pref.getBoolPref('extensions.uxu.profile.disableCheckDefaultWarning')) {
			// Firefox
			lines.push('user_pref("browser.shell.checkDefaultBrowser", false);');
			// Thunderbird
			lines.push('user_pref("mail.shell.checkDefaultClient", false);');
			lines.push('user_pref("mail.shell.checkDefaultMail", false);');
		}

		this.writeTo(userJSContents+'\n'+lines.join('\n')+'\n', userJSFile)
	},
	
	get skipInitializeFile() 
	{
		if (!this._skipInitializeFile) {
			this._skipInitializeFile = this.profileDirectory.clone(true);
			this._skipInitializeFile.append(kSKIP_INITIALIZE_FILE_NAME);
		}
		return this._skipInitializeFile;
	},
	_skipInitializeFile : null,
 
	readFrom : function(aTarget) 
	{
		aTarget = aTarget.QueryInterface(Ci.nsILocalFile)
		stream = Cc['@mozilla.org/network/file-input-stream;1']
					.createInstance(Ci.nsIFileInputStream);
		try {
			stream.init(aTarget, 1, 0, false); // open as "read only"
		}
		catch(ex) {
			return '';
		}

		var fileContents = '';
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

		return fileContents;
	},
 
	writeTo : function(aContent, aTarget) 
	{
		var stream = Cc['@mozilla.org/network/file-output-stream;1']
				.createInstance(Ci.nsIFileOutputStream);
		stream.init(aTarget, 2, 0x200, false); // open as "write only"
		stream.write(aContent, aContent.length);
		stream.close();
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
				return GlobalService.prototype.proxyEnabled;
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
				return GlobalService.prototype.proxyEnabled;
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
 
