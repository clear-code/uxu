// -*- indent-tabs-mode: t -*- 
const kCID  = Components.ID('{dd385d40-9e6f-11dd-ad8b-0800200c9a66}'); 
const kID   = '@clear-code.com/uxu/startup;1';
const kNAME = "UxU Global Service";

const kUXU_DIR_NAME = 'uxu@clear-code.com';
const kCATEGORY = 'm-uxu';

const ObserverService = Components.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);

const Pref = Components.classes['@mozilla.org/preferences;1'] 
			.getService(Components.interfaces.nsIPrefBranch)
			.QueryInterface(Components.interfaces.nsIPrefBranch2);
	 
function GlobalService() { 
}
GlobalService.prototype = {
	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				ObserverService.addObserver(this, 'final-ui-startup', false);
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
		var dir = Components.classes['@mozilla.org/extensions/manager;1']
				.getService(Components.interfaces.nsIExtensionManager)
				.getInstallLocation(id)
				.getItemLocation(id);
		return dir;
	},

	get globalLocation()
	{
		var dir = Components.classes['@mozilla.org/file/directory_service;1']
				.getService(Components.interfaces.nsIProperties)
				.get('CurProcD', Components.interfaces.nsIFile);
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
		aFile = aFile.QueryInterface(Components.interfaces.nsILocalFile)
		var stream = Components.classes['@mozilla.org/network/file-input-stream;1']
					.createInstance(Components.interfaces.nsIFileInputStream);
		try {
			stream.init(aFile, 1, 0, false); // open as "read only"
		}
		catch(ex) {
			return [];
		}

		var fileContents = null;
		try {
			var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1']
					.createInstance(Components.interfaces.nsIScriptableInputStream);
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
		const startup = Components.classes['@mozilla.org/toolkit/app-startup;1']
						.getService(Components.interfaces.nsIAppStartup);
		startup.quit(startup.eRestart | startup.eAttemptQuit);
	},



	/* nsICommandLineHandler */
	handle : function(aCommandLine)
	{
		var arg = {
				server     : false,
				serverPort : this._getNumericValueFromCommandLine('uxu-listen-port', aCommandLine, 0),
				testcase   : this._getFullPathFromCommandLine('uxu-testcase', aCommandLine, ''),
				priority   : this._getValueFromCommandLine('uxu-priority', aCommandLine, null),
				log        : this._getFullPathFromCommandLine('uxu-log', aCommandLine, ''),
				rawLog     : this._getFullPathFromCommandLine('uxu-rawlog', aCommandLine, ''),
				running    : this._getFullPathFromCommandLine('uxu-running-testcase', aCommandLine, ''),
				ouputPort  : this._getNumericValueFromCommandLine('uxu-output-port', aCommandLine, 0),
				hidden     : false
			};
		try {
			if (aCommandLine.handleFlag('uxu-start-server', false)) {
				arg.server = true;
			}
		}
		catch(e) {
		}
		try {
			if (aCommandLine.handleFlag('uxu-hidden', false)) {
				arg.hidden = true;
			}
		}
		catch(e) {
		}

		if (arg.testcase || arg.server) {
			aCommandLine.preventDefault = true;
			var WindowWatcher = Components
					.classes['@mozilla.org/embedcomp/window-watcher;1']
					.getService(Components.interfaces.nsIWindowWatcher);
			var bag = Components.classes['@mozilla.org/hash-property-bag;1']
					.createInstance(Components.interfaces.nsIWritablePropertyBag);
			for (var i in arg)
			{
				bag.setProperty(i, arg[i]);
			}
			WindowWatcher.openWindow(
				null,
				arg.server ? 'chrome://uxu/content/ui/uxu.xul' : 'chrome://uxu/content/ui/mozunit.xul',
				'_blank',
				'chrome,all',
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
		if (!aDefaultValue) aDefaultValue = '';
		try {
			return aCommandLine.handleFlagWithParam(aOption, false);
		}
		catch(e) {
		}
		return aDefaultValue;
	},

	helpInfo :
		'  -uxu-start-server    Starts UnitTest.XUL Server instead of Firefox\n'+
		'  -uxu-listen-port <port>\n'+
		'                       Listening port of UnitTest.XUL Server\n'+
		'  -uxu-testcase <url>  Run the testcase in UnitTest.XUL\n'+
		'  -uxu-priority <priority>\n'+
		'                       Run all tests in the testcase with the priority\n'+
		'  -uxu-log <url>       Output the result of the testcase\n'+
		'                       in human readable format\n'+
		'  -uxu-rawlog <url>    Output the result of the testcase\n'+
		'                       in raw format\n'+
		'  -uxu-output-port <port>\n'+
		'                       Output the result of the testcase\n'+
		'                       to the port in raw format\n',


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
		if(!aIID.equals(Components.interfaces.nsIObserver) &&
			!aIID.equals(Components.interfaces.nsICommandLineHandler) &&
			!aIID.equals(Components.interfaces.nsIFactory) &&
			!aIID.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
 
}; 

var gModule = { 
	registerSelf : function(aCompMgr, aFileSpec, aLocation, aType)
	{
		aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		aCompMgr.registerFactoryLocation(
			kCID,
			kNAME,
			kID,
			aFileSpec,
			aLocation,
			aType
		);

		var catMgr = Components.classes['@mozilla.org/categorymanager;1']
					.getService(Components.interfaces.nsICategoryManager);
		catMgr.addCategoryEntry('app-startup', kNAME, kID, true, true);
		catMgr.addCategoryEntry('command-line-handler', kCATEGORY, kID, true, true);
	},

	getClassObject : function(aCompMgr, aCID, aIID)
	{
		return this.factory;
	},

	factory : {
		QueryInterface : function(aIID)
		{
			if (!aIID.equals(Components.interfaces.nsISupports) &&
				!aIID.equals(Components.interfaces.nsIFactory)) {
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
 	
