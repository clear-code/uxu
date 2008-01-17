// -*- indent-tabs-mode: t; tab-width: 4 -*-

var IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);

// URI�����񂩂�nsIURI�̃I�u�W�F�N�g�𐶐�
function makeURIFromSpec(aURI) {
	try {
		var newURI;
		aURI = aURI || '';
		if (aURI && aURI.match(/^file:/)) {
			var fileHandler = IOService.getProtocolHandler('file')
								.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
			var tempLocalFile = fileHandler.getFileFromURLSpec(aURI);

			newURI = IOService.newFileURI(tempLocalFile);
		}
		else {
			newURI = IOService.newURI(aURI, null, null);
		}

		return newURI;
	}
	catch(e){
	}
	return null;
};

// �t�@�C���̃p�X����nsIFile�̃I�u�W�F�N�g�𐶐�
function makeFileWithPath(aPath) {
	var newFile = Components.classes['@mozilla.org/file/local;1']
					.createInstance(Components.interfaces.nsILocalFile);
	newFile.initWithPath(aPath);
	return newFile;
};


// URL������nsIFile
function getFileFromURLSpec(aURI) {
	if ((aURI || '').indexOf('file://') != 0) return '';

	var fileHandler = IOService.getProtocolHandler('file')
						.QueryInterface(Components.interfaces.nsIFileProtocolHandler);
	return fileHandler.getFileFromURLSpec(aURI);
};

// URL�����񁨃t�@�C���̃p�X
function getFilePathFromURLSpec(aURI) {
	return this.getFileFromURLSpec(aURI).path;
};
 
// �t�@�C���̃p�X��nsIURI
function getURLFromFilePath(aPath) {
	var tempLocalFile = this.makeFileWithPath(aPath);
	return IOService.newFileURI(tempLocalFile);
};

// �t�@�C���̃p�X��URL������
function getURLSpecFromFilePath(aPath) {
	return this.getURLFromFilePath(aPath).spec;
};



function formatError(e) {
	return formatStackTrace(e) + e.toString() + '\n';
}

function formatStackTrace(exception)
{
    var trace = '';

    if (exception.stack) {
        var calls = exception.stack.split('\n');
        for each (var call in calls) {
            if (call.length > 0) {
                call = String(call).replace(/\\n/g, '\n');

                if (call.length > 200)
                    call = call.substr(0, 200) + '[...]\n';

				if (call.match(/^@data:application\/x-javascript,/)) {
					var info = RegExp.rightContext.split(":");
					var source = decodeURIComponent(info[0]);
					var line = info[1];
					trace += "(eval):" + line + ":" + source + "\n";
				} else {
					trace += call + '\n';
				}
            }
        }
    }
    return trace;
}



function loadScriot(aURL)
{
}
