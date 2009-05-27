// -*- indent-tabs-mode: t -*- 
const kCID  = Components.ID('{dd385d40-9e6f-11dd-ad8b-0800200c9a66}'); 
const kID   = '@clear-code.com/uxu/startup;1';
const kNAME = "UxU Global Service";

const kUXU_DIR_NAME = 'uxu@clear-code.com';
const kCATEGORY = 'm-uxu';

var Cc = Components.classes;
var Ci = Components.interfaces;

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

const Pref = Cc['@mozilla.org/preferences;1'] 
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2);
	 
function GlobalService() { 
}
GlobalService.prototype = {
	
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
		}
	},
 
	init : function() 
	{
		Pref.setBoolPref('extensions.uxu.running', false);
		this.checkInstallGlobal();
	},

	checkInstallGlobal : function()
	{
		var inGlobal = this.installedLocation.path == this.globalLocation.path;
		if (Pref.getBoolPref('extensions.uxu.global')) {
			if (inGlobal) return;
			if (this.installToGlobal()) {
				this.restart();
			}
			else {
				Pref.setBoolPref('extensions.uxu.global', false);
			}
		}
		else if (inGlobal) {
			Pref.setBoolPref('extensions.uxu.global', true);
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

				if (
					this.isFirstLargerThanSecond(destVersion, sourceVersion) &&
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
			return [];
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
			if (match) return match[1].split('.');
			match = fileContents.match(/em:version=['"]([^'"]+)['"]/);
			if (match) return match[1].split('.');
		}
		return [];
	},

	isFirstLargerThanSecond : function(aVersion1, aVersion2)
	{
		while (aVersion1.length < aVersion2.length)
		{
			aVersion1.push(0);
		}
		while (aVersion2.length < aVersion1.length)
		{
			aVersion2.push(0);
		}
		aVersion1 = aVersion1.map(function(part1, aIndex) {
			var part2 = aVersion2[aIndex];
			part1 = String(parseInt(part1));
			part2 = String(parseInt(part2));
			while (part1.length < part2.length)
			{
				part1 = '0'+part1;
			}
			while (part2.length < part1.length)
			{
				part2 = '0'+part2;
			}
			aVersion2[aIndex] = part2;
			return part1;
		});

		aVersion1 = parseInt('1'+aVersion1.join(''));
		aVersion2 = parseInt('1'+aVersion2.join(''));
		return aVersion1 > aVersion2;
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


	// nsIContentPolicy

	TYPE_OTHER       : Ci.nsIContentPolicy.TYPE_OTHER,
	TYPE_SCRIPT      : Ci.nsIContentPolicy.TYPE_SCRIPT,
	TYPE_IMAGE       : Ci.nsIContentPolicy.TYPE_IMAGE,
	TYPE_STYLESHEET  : Ci.nsIContentPolicy.TYPE_STYLESHEET,
	TYPE_OBJECT      : Ci.nsIContentPolicy.TYPE_OBJECT,
	TYPE_DOCUMENT    : Ci.nsIContentPolicy.TYPE_DOCUMENT,
	TYPE_SUBDOCUMENT : Ci.nsIContentPolicy.TYPE_SUBDOCUMENT,
	TYPE_REFRESH     : Ci.nsIContentPolicy.TYPE_REFRESH,
	ACCEPT           : Ci.nsIContentPolicy.ACCEPT,
	REJECT_REQUEST   : Ci.nsIContentPolicy.REJECT_REQUEST,
	REJECT_TYPE      : Ci.nsIContentPolicy.REJECT_TYPE,
	REJECT_SERVER    : Ci.nsIContentPolicy.REJECT_SERVER,
	REJECT_OTHER     : Ci.nsIContentPolicy.REJECT_OTHER,

	shouldLoad : function(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra)
	{
		if (!Pref.getBoolPref('extensions.uxu.running')) return this.ACCEPT;
dump('*****shouldLoad*****\n');
dump([aContentType, aContentLocation.spec, aRequestOrigin, aContext, aMimeTypeGuess, aExtra].join('\n'+'\n');

		var uri = Cc['@mozilla.org/supports-string;1']
					.createInstance(Ci.nsISupportsString);
		uri.data = aContentLocation.spec;
		ObserverService.notifyObservers(uri, 'uxu-redirect-check', null);

		if (!uri.data || uri.data == aContentLocation.spec)
			return this.ACCEPT;

		try {
			if (aContext instanceof Ci.nsIDOMNode)
				aContext.loadURI(uri.data, null, null);
			else if (aContext instanceof Ci.nsIDOMDocument)
				aContext.location = uri.data;

			return this.REJECT_REQUEST;
		}
		catch(e) {
			return this.ACCEPT;
		}
	},

	shouldProcess : function(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra)
	{
		return this.ACCEPT;
	},



	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Ci.nsIObserver) &&
			!aIID.equals(Ci.nsICommandLineHandler) &&
			!aIID.equals(Ci.nsIFactory) &&
			!aIID.equals(Ci.nsIContentPolicy) &&
			!aIID.equals(Ci.nsISupportsWeakReference) &&
			!aIID.equals(Ci.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
 
}; 

var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			kCID,
			kNAME,
			kID,
			aFileSpec,
			aLocation,
			aType
		);

		var catMgr = Cc['@mozilla.org/categorymanager;1']
					.getService(Ci.nsICategoryManager);
		catMgr.addCategoryEntry('app-startup', kNAME, kID, true, true);
		catMgr.addCategoryEntry('command-line-handler', kCATEGORY, kID, true, true);
		catMgr.addCategoryEntry('content-policy', kCATEGORY, kID, true, true);
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
			return new GlobalService();
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
 	
