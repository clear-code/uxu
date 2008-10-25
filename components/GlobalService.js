// -*- indent-tabs-mode: t -*- 
const kCID  = Components.ID('{dd385d40-9e6f-11dd-ad8b-0800200c9a66}'); 
const kID   = '@clear-code.com/uxu/startup;1';
const kNAME = "UxU Global Service";

const kUXU_DIR_NAME = 'uxu@clear-code.com';

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
			if (dest.exists()) dest.remove(true);
			source.moveTo(dest.parent, kUXU_DIR_NAME);
		}
		catch(e) {
			dump(e);
			return false;
		}
		return true;
	},

	restart : function()
	{
		const startup = Components.classes['@mozilla.org/toolkit/app-startup;1']
						.getService(Components.interfaces.nsIAppStartup);
		startup.quit(startup.eRestart | startup.eAttemptQuit);
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.nsIObserver) &&
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
 	
