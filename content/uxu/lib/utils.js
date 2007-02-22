// -*- indent-tabs-mode: t; tab-width: 4 -*-

function convertURIToFilePath(aURI) {
    const ioService = Components.classes['@mozilla.org/network/io-service;1']
                                .getService(Components.interfaces.nsIIOService);

    // nsIIOServiceのnewURIメソッドで新しいURIオブジェクトを作る。
    var URI = ioService.newURI(aURI, null, null);

    if (!URI.schemeIs('file')) return ''; // リモートのリソースの場合は処理しない

    var tempLocalFile;
    try {
        var fileHandler = ioService.getProtocolHandler('file')
                                   .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        tempLocalFile = fileHandler.getFileFromURLSpec(aURI); // 「 URL 文字列からファイルを得る」機能
    }
    catch(e) {
        try {
            // Mozilla 1.1 までは nsIIOService のメソッドを使う
            tempLocalFile = ioService.getFileFromURLSpec(aURI);
        }
        catch(ex) { // for Mozilla 1.0.x
            try {
                // 仮のファイルオブジェクトを作る
                tempLocalFile = Components.classes['@mozilla.org/file/local;1']
                                          .createInstance(Components.interfaces.nsILocalFile);
                ioService.initFileFromURLSpec(tempLocalFile, aURI); // nsIIOService の「 URIURL からファイルを初期化する」機能を使う
            }
            catch(ex) {
                tempLocalFile.URL = aURI; // NS6 の時点の仕様では、 URL プロパティに URI を代入するだけでいい
            }
        }
    }
    return tempLocalFile.path; // ファイルのパスを帰す
}

function convertFilePathToURI(aFilePath) {
    var tempLocalFile = Components.classes['@mozilla.org/file/local;1']
                                  .createInstance(Components.interfaces.nsILocalFile);
    tempLocalFile.initWithPath(aFilePath); // パスを渡してファイルオブジェクトを初期化する

    const ioService = Components.classes['@mozilla.org/network/io-service;1']
                                .getService(Components.interfaces.nsIIOService);
    try {
        // nsIIOService の「ファイルから URI のオブジェクトを得る」機能を使う
        return ioService.newFileURI(tempLocalFile).spec;
    }
    catch(e) { // for Mozilla 1.0～1.1
        try {
            return ioService.getURLSpecFromFile(tempLocalFile); // nsIIOService の「ファイルから URL の文字列を得る」機能を使う
        } catch(ex) { // for NS6
            return tempLocalFile.URL; // NS6 の時点の仕様では、初期化した時点で URL プロパティに URL の文字列が入っている
        }
    }
}

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


