var DEBUG = false; 
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;

var loader = Cc['@mozilla.org/moz/jssubscript-loader;1'] 
		.getService(Ci.mozIJSSubScriptLoader);

var ModuleManager, AssertionsClass;

function uxuAssertion() { 
	mydump('create instance uxuAssertion');

	if (!AssertionsClass) {
		var namespace = {};
		loader.loadSubScript('chrome://uxu/content/lib/module_manager.js', namespace);
		ModuleManager = namespace.ModuleManager;

		var test_module = new ModuleManager(['chrome://uxu/content/test']);
		AssertionsClass  = test_module.require('class', 'assertions');
	}

	this.__proto__.__proto__ = AssertionsClass.prototype;
	this.resetSuccessCount();
	this.__defineGetter__('successCount', function() {
		return this._successCount;
	});
}

uxuAssertion.prototype = {
	
	get contractID() { 
		return '@clear-code.com/uxu/assertion;1';
	},
	get classDescription() {
		return 'UxU Assertions for global namespace.';
	},
	get classID() {
		return Components.ID('{a98b43b0-be24-11de-8a39-0800200c9a66}');
	},
 
	accessorName : 'Assertion',

	// nsIClassInfo 
	flags : Ci.nsIClassInfo.DOM_OBJECT,
	classDescription : 'uxuAssertion',
	getInterfaces : function(aCount)
	{
		var interfaces = [
				Ci.uxuIAssertion
				/* ,
				Ci.nsIClassInfo,
				Ci.nsIObserver
				*/
			];
		aCount.value = interfaces.length;
		return interfaces;
	},
	getHelperForLanguage : function(aLanguage)
	{
		return null;
	},

	QueryInterface : function(aIID) 
	{
		if (!aIID.equals(Ci.uxuIAssertion) &&
			!aIID.equals(Ci.nsIClassInfo) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
 
}; 
  
var categoryManager = Cc['@mozilla.org/categorymanager;1'] 
						.getService(Ci.nsICategoryManager);

var gModule = {
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(
				obj.CID,
				obj.className,
				obj.contractID,
				aFileSpec,
				aLocation,
				aType
			);
			categoryManager.addCategoryEntry(
				'JavaScript global constructor',
				obj.accessorName,
				obj.contractID,
				true,
				true
			);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Ci.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID          : uxuAssertion.prototype.classID,
			contractID   : uxuAssertion.prototype.contractID,
			className    : uxuAssertion.prototype.classDescription,
			accessorName : uxuAssertion.prototype.accessorName,
			factory      : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new uxuAssertion()).QueryInterface(aIID);
				}
			}
		}
	},

	canUnload : function (aComponentManager)
	{
		return true;
	}
};

function NSGetModule(compMgr, fileSpec)
{
	return gModule;
}

function mydump(aString)
{
	if (DEBUG)
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
