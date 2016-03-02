// -*- indent-tabs-mode: t; tab-width: 4 -*-
var parallel = false;

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

function setUp()
{
	onWindows = /win/i.test(navigator.platform);
	utilsModule = {};
	utils.include(topDir+'modules/utils.js', utilsModule);
	utilsModule = new utilsModule.Utils();
	utilsModule.fileURL = utils.fileURL;
	utilsModule.baseURL = utils.baseURL;

	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	tempFile = DirectoryService.get('TmpD', Ci.nsIFile);
	tempFile.append('tmp' + parseInt(Math.random() * 650000) + '.tmp');

	yield 0; // to run tests progressively
}

function tearDown()
{
	if (tempFile && tempFile.exists())
		tempFile.remove(true);
}

function $(aId)
{
	return content.document.getElementById(aId);
}
