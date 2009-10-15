// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('prefread.inc.js');

var topDir = baseURL+'../../../../';

var utilsModule;
var tempFile;
var onWindows = false;
var IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);

function simpleMakeURIFromSpec(aURI)
{
	try {
		var newURI;
		aURI = aURI || '';
		if (aURI && aURI.match(/^file:/)) {
			var fileHandler = IOService.getProtocolHandler('file')
								.QueryInterface(Ci.nsIFileProtocolHandler);
			var tempLocalFile = fileHandler.getFileFromURLSpec(aURI);

			newURI = IOService.newFileURI(tempLocalFile);
		}
		else {
			newURI = IOService.newURI(aURI, null, null);
		}
		return newURI;
	}
	catch(e){
		alert(e);
	}
	return null;
}

var Pref = Cc['@mozilla.org/preferences;1'] 
		.getService(Ci.nsIPrefBranch);
var prefKeyRoot;

function setUp()
{
	onWindows = /win/i.test(navigator.platform);
	utilsModule = {};
	utils.include(topDir+'content/uxu/lib/utils.js', utilsModule);
	utilsModule.fileURL = utils.fileURL;
	utilsModule.baseURL = utils.baseURL;

	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	tempFile = DirectoryService.get('TmpD', Ci.nsIFile);
	tempFile.append('tmp' + parseInt(Math.random() * 650000) + '.tmp');

	yield 0; // to run tests progressively

	prefKeyRoot = 'uxu.testing.'+parseInt(Math.random() * 65000)+'.';
	Pref.setBoolPref(prefKeyRoot+'bool', true);
	Pref.setIntPref(prefKeyRoot+'int', 1);
	Pref.setCharPref(prefKeyRoot+'string', 'foobar');
}

function tearDown()
{
	if (tempFile.exists())
		tempFile.remove(true);
	utils.clearPref(prefKeyRoot+'bool', true);
	utils.clearPref(prefKeyRoot+'int', 1);
	utils.clearPref(prefKeyRoot+'string', 'foobar');

	defaultPrefs.forEach(function(aItem) {
		utils.clearPref(aItem.name);
	});
	userPrefs.forEach(function(aItem) {
		utils.clearPref(aItem.name);
	});
}

function $(aId)
{
	return content.document.getElementById(aId);
}
