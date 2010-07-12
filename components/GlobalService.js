// -*- indent-tabs-mode: t -*- 
const Cc = Components.classes;
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

const kUXU_TEST_RUNNING   = 'extensions.uxu.running';

const kSKIP_INITIALIZE_FILE_NAME = '.uxu-skip-restart';

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);
const Pref = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);

var WindowWatcher;
var WindowManager;

var bundle;
 
function GlobalService() { 
}
GlobalService.prototype = {
	
	classDescription : 'UxUGlobalService', 
	contractID : '@clear-code.com/uxu/startup;1',
	classID : Components.ID('{dd385d40-9e6f-11dd-ad8b-0800200c9a66}'),

	_xpcom_categories : [
		{ category : 'app-startup', service : true }, // -Firefox 3.6
		{ category : 'command-line-handler', entry : 'm-uxu' }
	],

	QueryInterface : XPCOMUtils.generateQI([
		Ci.nsIObserver,
		Ci.nsICommandLineHandler,
		Ci.nsIFactory
	]),

	get wrappedJSObject() {
		return this;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				if (!this.listeningProfileAfterChange) {
					ObserverService.addObserver(this, 'profile-after-change', false);
					this.listeningProfileAfterChange = true;
				}
				return;

			case 'profile-after-change':
				if (this.listeningProfileAfterChange) {
					ObserverService.removeObserver(this, 'profile-after-change');
					this.listeningProfileAfterChange = false;
				}
				WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
								.getService(Ci.nsIWindowWatcher);
				WindowManager = Cc['@mozilla.org/appshell/window-mediator;1']
								.getService(Ci.nsIWindowMediator);
				Components.utils.import('resource://uxu-modules/CLHHelper.jsm');
				ObserverService.addObserver(this, 'final-ui-startup', false);
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


			case 'uxu-start-runner-request':
				this.startRunner(aSubject, this.evalInSandbox(aData));
				return;

			case 'uxu-start-server-request':
				this.startServer(aSubject, this.evalInSandbox(aData));
				return;

			case 'uxu-open-config-request':
				this.openConfig(aSubject);
				return;
		}
	},
 
	evalInSandbox : function(aCode, aOwner) 
	{
		try {
			var sandbox = new Components.utils.Sandbox(aOwner || 'about:blank');
			return Components.utils.evalInSandbox(aCode, sandbox);
		}
		catch(e) {
		}
		return void(0);
	},
 
	init : function() 
	{
		var ns = {};
		Components.utils.import('resource://uxu-modules/stringBundle.js', ns);
		bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

		PromptService = Cc['@mozilla.org/embedcomp/prompt-service;1']
				.getService(Ci.nsIPromptService);

		Pref.setBoolPref(kUXU_TEST_RUNNING, false);

		Pref.addObserver('general.useragent', this, false);
		ObserverService.addObserver(this, 'uxu-profile-setup', false);
		ObserverService.addObserver(this, 'uxu-start-runner-request', false);
		ObserverService.addObserver(this, 'uxu-start-server-request', false);
		ObserverService.addObserver(this, 'uxu-open-config-request', false);

		this.autoStart();
	},
 
	autoStart : function() 
	{
		if (
			Pref.getBoolPref('extensions.uxu.auto.start') ||
			(
				Pref.getBoolPref('extensions.uxu.autoStart.oneTime.enabled') &&
				Pref.getBoolPref('extensions.uxu.autoStart.oneTime')
			)
			) {
			Pref.setBoolPref('extensions.uxu.autoStart.oneTime', false);
			this.startServer(null, { serverPort : Pref.getIntPref('extensions.uxu.autoStart.oneTime.port') });
		}

		if (
			Pref.getBoolPref('extensions.uxu.runner.autoStart') ||
			(
				Pref.getBoolPref('extensions.uxu.runner.autoStart.oneTime.enabled') &&
				Pref.getBoolPref('extensions.uxu.runner.autoStart.oneTime')
			)
			) {
			Pref.setBoolPref('extensions.uxu.runner.autoStart.oneTime', false);
			this.startRunner();
		}
	},
 
	onPrefChange : function(aPrefName) 
	{
		switch (aPrefName)
		{
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
				bundle.getString('confirm_changePref_restart_title'),
				bundle.getString('confirm_changePref_restart_text'),
				Ci.nsIPromptService.BUTTON_TITLE_YES * Ci.nsIPromptService.BUTTON_POS_0 +
				Ci.nsIPromptService.BUTTON_TITLE_NO * Ci.nsIPromptService.BUTTON_POS_1,
				null, null, null, null, {}
			) == 0)
			this.restart();
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
 
	setUpUXUPrefs : function(aProfile) 
	{
		var skipInitialize = aProfile.clone(true);
		skipInitialize.append(kSKIP_INITIALIZE_FILE_NAME);
		skipInitialize.create(skipInitialize.NORMAL_FILE_TYPE, 0644);

		var userJSFile = aProfile.clone(true);
		userJSFile.append('user.js');
		var userJSContents = '';
		if (userJSFile.exists()) userJSContents = this.readFrom(userJSFile);

		var lines = [];
		var prefs = <![CDATA[
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
  
	openWindow : function(aOwner, aType, aURI, aFeatures, aOptions) 
	{
		var target = WindowManager.getMostRecentWindow(aType);
		if (target) {
			target.focus();
			return;
		}

		var bag = null;
		if (aOptions) {
			bag = Cc['@mozilla.org/hash-property-bag;1']
					.createInstance(Ci.nsIWritablePropertyBag);
			for (var i in aOptions)
			{
				bag.setProperty(i, aOptions[i]);
			}
		}

		if (aOwner) {
			aOwner = aOwner.QueryInterface(Ci.nsIDOMWindow)
						.QueryInterface(Ci.nsIDOMWindowInternal);
			if (bag)
				aOwner.openDialog(aURI, '_blank', aFeatures, bag);
			else
				aOwner.openDialog(aURI, '_blank', aFeatures);
		}
		else {
			WindowWatcher.openWindow(null, aURI, '_blank', aFeatures, bag);
		}
	},
 
	startRunner : function(aOwner, aOptions) 
	{
		this.openWindow(
			aOwner,
			'uxu:runner',
			'chrome://uxu/content/ui/runner.xul',
			'chrome,all,dialog=no,resizable=yes',
			aOptions
		);
	},
 
	startServer : function(aOwner, aOptions) 
	{
		this.openWindow(
			aOwner,
			'uxu:server',
			'chrome://uxu/content/ui/uxu.xul',
			'chrome,all,dialog=no,resizable=yes',
			aOptions
		);
	},
 
	openConfig : function(aOwner) 
	{
		this.openWindow(
			aOwner,
			'uxu:config',
			'chrome://uxu/content/ui/config.xul',
			'chrome,titlebar,toolbar,centerscreen' +
				(Pref.getBoolPref('browser.preferences.instantApply') ?
					',dialog=no' :
					',modal'
				),
			null
		);
	},
 
	/* nsICommandLineHandler */ 
	
	handle : function(aCommandLine) 
	{
		var arg = {
				server     : CLHHelper.getBooleanValue('uxu-start-server', aCommandLine),
				serverPort : CLHHelper.getNumericValue('uxu-listen-port', aCommandLine, 0),
				outputHost : CLHHelper.getStringValue('uxu-output-host', aCommandLine, ''),
				outputPort : CLHHelper.getNumericValue('uxu-output-port', aCommandLine, 0),
				testcase   : CLHHelper.getFullPath('uxu-testcase', aCommandLine, ''),
				priority   : CLHHelper.getStringValue('uxu-priority', aCommandLine, null),
				log        : CLHHelper.getFullPath('uxu-log', aCommandLine, ''),
				rawLog     : CLHHelper.getFullPath('uxu-rawlog', aCommandLine, ''),
				autoQuit   : CLHHelper.getBooleanValue('uxu-autoquit', aCommandLine),
				doNotQuit  : CLHHelper.getBooleanValue('uxu-do-not-quit', aCommandLine),
				hidden     : CLHHelper.getBooleanValue('uxu-hidden', aCommandLine)
			};

		if (arg.testcase || arg.server) {
			aCommandLine.preventDefault = true;
			if (arg.server)
				this.startServer(null, arg);
			else
				this.startRunner(null, arg);
		}
	},
 
	get helpInfo() 
	{
		if (!this._helpInfo)
			this._helpInfo =CLHHelper.formatHelpInfo({
				'uxu-start-server' : 'Starts UnitTest.XUL Server instead of Firefox.',
				'uxu-listen-port <port>' : 'Listening port of UnitTest.XUL Server.',
				'uxu-output-host <host>' : 'Output the result of the testcase to the host in raw format.',
				'uxu-output-port <port>' : 'Listening port of the host specified by the "-uxu-output-host" option.',
				'uxu-testcase <url>' :  'Run the testcase in UnitTest.XUL.',
				'uxu-priority <priority>' : 'Run all tests in the testcase with the priority.',
				'uxu-log <url>' : 'Output the result of the testcase.',
				'uxu-rawlog <url>' : 'Output the result of the testcase in raw format.'
			});
		return this._helpInfo;
	},
	_helpInfo : null,
  
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
	}
  
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([GlobalService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([GlobalService]);
 
