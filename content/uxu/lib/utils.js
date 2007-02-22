// -*- indent-tabs-mode: t; tab-width: 4 -*-

function convertURIToFilePath(aURI) {
    const ioService = Components.classes['@mozilla.org/network/io-service;1']
                                .getService(Components.interfaces.nsIIOService);

    // nsIIOService��newURI���\�b�h�ŐV����URI�I�u�W�F�N�g�����B
    var URI = ioService.newURI(aURI, null, null);

    if (!URI.schemeIs('file')) return ''; // �����[�g�̃��\�[�X�̏ꍇ�͏������Ȃ�

    var tempLocalFile;
    try {
        var fileHandler = ioService.getProtocolHandler('file')
                                   .QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        tempLocalFile = fileHandler.getFileFromURLSpec(aURI); // �u URL �����񂩂�t�@�C���𓾂�v�@�\
    }
    catch(e) {
        try {
            // Mozilla 1.1 �܂ł� nsIIOService �̃��\�b�h���g��
            tempLocalFile = ioService.getFileFromURLSpec(aURI);
        }
        catch(ex) { // for Mozilla 1.0.x
            try {
                // ���̃t�@�C���I�u�W�F�N�g�����
                tempLocalFile = Components.classes['@mozilla.org/file/local;1']
                                          .createInstance(Components.interfaces.nsILocalFile);
                ioService.initFileFromURLSpec(tempLocalFile, aURI); // nsIIOService �́u URIURL ����t�@�C��������������v�@�\���g��
            }
            catch(ex) {
                tempLocalFile.URL = aURI; // NS6 �̎��_�̎d�l�ł́A URL �v���p�e�B�� URI �������邾���ł���
            }
        }
    }
    return tempLocalFile.path; // �t�@�C���̃p�X���A��
}

function convertFilePathToURI(aFilePath) {
    var tempLocalFile = Components.classes['@mozilla.org/file/local;1']
                                  .createInstance(Components.interfaces.nsILocalFile);
    tempLocalFile.initWithPath(aFilePath); // �p�X��n���ăt�@�C���I�u�W�F�N�g������������

    const ioService = Components.classes['@mozilla.org/network/io-service;1']
                                .getService(Components.interfaces.nsIIOService);
    try {
        // nsIIOService �́u�t�@�C������ URI �̃I�u�W�F�N�g�𓾂�v�@�\���g��
        return ioService.newFileURI(tempLocalFile).spec;
    }
    catch(e) { // for Mozilla 1.0�`1.1
        try {
            return ioService.getURLSpecFromFile(tempLocalFile); // nsIIOService �́u�t�@�C������ URL �̕�����𓾂�v�@�\���g��
        } catch(ex) { // for NS6
            return tempLocalFile.URL; // NS6 �̎��_�̎d�l�ł́A�������������_�� URL �v���p�e�B�� URL �̕����񂪓����Ă���
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


