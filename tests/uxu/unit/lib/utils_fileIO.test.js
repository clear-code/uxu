// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');

var bundle;
function warmUp()
{
	bundle = {};
	utils.include(topDir+'content/uxu/lib/bundle.js', bundle);
}

var notExistFilesParent = utils.makeTempFolder();
var notExistFile = notExistFilesParent.clone();
notExistFile.append('notexist');
var notFolder = utils.makeTempFile();
utils.writeTo('foo', notFolder);
function coolDown()
{
	utils.scheduleToRemove(notExistFilesParent);
	utils.scheduleToRemove(notFolder);
}

var testDir;
function tearDown()
{
	if (testDir.length) {
		utils.scheduleToRemove(testDir);
		testDir = null;
	}
}

function test_makeURIFromSpec()
{
	var uri;

	uri = utilsModule.makeURIFromSpec('about:blank');
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.equals('about:blank', uri.spec);
	assert.equals('about', uri.scheme);

	uri = utilsModule.makeURIFromSpec('http://www.clear-code.com/');
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.equals('http://www.clear-code.com/', uri.spec);
	assert.equals('http', uri.scheme);
	assert.equals('www.clear-code.com', uri.host);

	uri = utilsModule.makeURIFromSpec('file:///c:/windows/');
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.isTrue(uri instanceof Ci.nsIFileURL);
	assert.matches(/file:\/\/\/C:\/Windows\/?/i, uri.spec);
	assert.equals('file', uri.scheme);
}

function test_makeFileWithPath()
{
	var expected = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
	var file;

	if (onWindows) {
		expected.initWithPath('C:\\Windows');
		file = utilsModule.makeFileWithPath('C:\\Windows');
	} else {
		expected.initWithPath('/tmp');
		file = utilsModule.makeFileWithPath('/tmp');
    }

	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(expected.path, file.path);
	assert.equals(expected.exists(), file.exists());
}

function test_getFileFromURL()
{
	var expected = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile),
		uriSpec,
		filePathPattern;
	if (onWindows) {
		expected.initWithPath('C:\\Windows');
		uriSpec = 'file:///C:/Windows';
		filePathPattern = /C:\\Windows\\?/i;
	} else {
		expected.initWithPath('/tmp');
		uriSpec = 'file:///tmp';
		filePathPattern = /\/tmp\/?/;
    }
	var uri = simpleMakeURIFromSpec(uriSpec);
	var file;

	file = utilsModule.getFileFromURL(uri);
	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(expected.path, file.path);
	assert.equals(expected.exists(), file.exists());

	assert.matches(filePathPattern, utilsModule.getFilePathFromURL(uri));

	file = utilsModule.getFileFromURLSpec(uriSpec);
	assert.isTrue(file);
	assert.isTrue(file instanceof Ci.nsIFile);
	assert.isTrue(file instanceof Ci.nsILocalFile);
	assert.equals(expected.path, file.path);
	assert.equals(expected.exists(), file.exists());

	assert.matches(filePathPattern, utilsModule.getFilePathFromURLSpec(uriSpec));
}

function test_getURLFromFile()
{
	var file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile),
		uriPattern,
		path,
		uri;
	if (onWindows) {
		uriPattern = /file:\/\/\/C:\/Windows\/?/i;
		path = 'C:\\Windows';
	} else {
		uriPattern = /file:\/\/\/tmp\/?/;
		path = '/tmp';
    }
	file.initWithPath(path);

	uri = utilsModule.getURLFromFile(file);
	assert.isTrue(uri);
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.isTrue(uri instanceof Ci.nsIFileURL);
	assert.matches(uriPattern, uri.spec);
	assert.equals('file', uri.scheme);

	assert.matches(uriPattern, utilsModule.getURLSpecFromFile(file));

	uri = utilsModule.getURLFromFilePath(path);
	assert.isTrue(uri);
	assert.isTrue(uri instanceof Ci.nsIURI);
	assert.isTrue(uri instanceof Ci.nsIFileURL);
	assert.matches(uriPattern, uri.spec);
	assert.equals('file', uri.scheme);

	assert.matches(uriPattern, utilsModule.getURLSpecFromFilePath(path));
}

function test_getFileFromKeyword()
{
	var DirectoryService = Cc['@mozilla.org/file/directory_service;1']
			.getService(Ci.nsIProperties);
	assert.equals(DirectoryService.get('TmpD', Ci.nsIFile).path, utilsModule.getFileFromKeyword('TmpD').path);
	assert.equals(DirectoryService.get('ProfD', Ci.nsIFile).path, utilsModule.getFileFromKeyword('ProfD').path);
	assert.equals(DirectoryService.get('CurProcD', Ci.nsIFile).path, utilsModule.getFileFromKeyword('CurProcD').path);
}

function test_readFrom()
{
	assert.equals('ASCII', utilsModule.readFrom(baseURL+'../../fixtures/ascii.txt'));
	assert.equals('ASCII', utilsModule.readFrom('../../fixtures/ascii.txt'));
	assert.equals('日本語', utilsModule.readFrom(baseURL+'../../fixtures/utf8.txt', 'UTF-8'));
	assert.equals('日本語', utilsModule.readFrom('../../fixtures/utf8.txt', 'UTF-8'));
	assert.equals('日本語', utilsModule.readFrom(baseURL+'../../fixtures/shift_jis.txt', 'Shift_JIS'));
	assert.equals('日本語', utilsModule.readFrom('../../fixtures/shift_jis.txt', 'Shift_JIS'));
}

function test_writeTo()
{
	utilsModule.writeTo('ASCII', tempFile.path);
	assert.equals('ASCII', utilsModule.readFrom(tempFile.path));

	utilsModule.writeTo('日本語', tempFile.path, 'UTF-8');
	assert.equals('日本語', utilsModule.readFrom(tempFile.path, 'UTF-8'));

	utilsModule.writeTo('日本語', tempFile.path, 'Shift_JIS');
	assert.equals('日本語', utilsModule.readFrom(tempFile.path, 'Shift_JIS'));
}

function test_fixupIncompleteURI()
{
	assert.equals(baseURL+'foobar', utilsModule.fixupIncompleteURI('foobar'));
	assert.equals('foobar://foobar', utilsModule.fixupIncompleteURI('foobar://foobar'));
	if (onWindows) {
		assert.equals('C:\\Windows', utilsModule.fixupIncompleteURI('C:\\Windows'));
	} else {
		assert.equals('/tmp', utilsModule.fixupIncompleteURI('/tmp'));
    }
}

function test_readJSON()
{
	assert.equals(
		{
			foo : "日本語",
			bar : 29,
			template : "<%= value %>"
		},
		utilsModule.readJSON(baseURL+'../../fixtures/test.json', 'UTF-8')
	);
	assert.equals(
		{
			foo : "日本語",
			bar : 29,
			template : 2929
		},
		utilsModule.readJSON(baseURL+'../../fixtures/test.json', 'UTF-8', { value : 2929 })
	);
}

function test_cosmeticClone_file()
{
	tempDir = utils.makeTempFolder();
	var original, cloned;

	original = utils.getFileFromURLSpec(baseURL+'../../fixtures/folder/normal.txt');

	cloned = utilsModule.cosmeticClone(original, tempDir);
	assert.isDefined(cloned);
	assert.implementsInterface(Ci.nsILocalFile, cloned);
	assert.equals('normal.txt', cloned.leafName);

	var existsPath = cloned.path;
	assert.raises(
		bundle.getFormattedString('error_utils_cosmeticClone_duplicate', [existsPath]),
		function() {
			cloned = utilsModule.cosmeticClone(original, tempDir);
		}
	);

	cloned = utilsModule.cosmeticClone(original, tempDir, 'different.txt');
	assert.isDefined(cloned);
	assert.implementsInterface(Ci.nsILocalFile, cloned);
	assert.equals('different.txt', cloned.leafName);

	original = utils.getFileFromURLSpec(baseURL+'../../fixtures/folder/.dot-file');
	assert.raises(
		bundle.getFormattedString('error_utils_cosmeticClone_original_hidden', [original.path]),
		function() {
			cloned = utilsModule.cosmeticClone(original, tempDir);
		}
	);
}

function test_cosmeticClone_folder()
{
	tempDir = utils.makeTempFolder();
	var original, cloned;

	original = utils.getFileFromURLSpec(baseURL+'../../fixtures/folder');

	cloned = utilsModule.cosmeticClone(original, tempDir);
	assert.isDefined(cloned);
	assert.implementsInterface(Ci.nsILocalFile, cloned);
	assert.equals('folder', cloned.leafName);

	var normal = cloned.clone();
	normal.append('normal.txt');
	assert.isTrue(normal.exists());

	var hiddenFile = cloned.clone();
	hiddenFile.append('.dot-file');
	assert.isFalse(hiddenFile.exists());

	var hiddenFolder = cloned.clone();
	hiddenFolder.append('.dot-folder');
	assert.isFalse(hiddenFolder.exists());

	var existsPath = cloned.path;
	assert.raises(
		bundle.getFormattedString('error_utils_cosmeticClone_duplicate', [existsPath]),
		function() {
			cloned = utilsModule.cosmeticClone(original, tempDir);
		}
	);

	cloned = utilsModule.cosmeticClone(original, tempDir, 'different');
	assert.isDefined(cloned);
	assert.implementsInterface(Ci.nsILocalFile, cloned);
	assert.equals('different', cloned.leafName);

	original = utils.getFileFromURLSpec(baseURL+'../../fixtures/folder/.dot-file');
	assert.raises(
		bundle.getFormattedString('error_utils_cosmeticClone_original_hidden', [original.path]),
		function() {
			cloned = utilsModule.cosmeticClone(original, tempDir);
		}
	);
}

test_cosmeticClone_invalidInput.parameters = {
	notExistOrignal : { orig  : notExistFile,
	                    dest  : notExistFilesParent,
	                    error : bundle.getFormattedString('error_utils_cosmeticClone_original_not_exists', [notExistFile.path]) },
	notExistDest    : { orig  : notExistFilesParent,
	                    dest  : notExistFile,
	                    error : bundle.getFormattedString('error_utils_cosmeticClone_dest_not_exist', [notExistFile.path]) },
	notFolderDest   : { orig  : notExistFilesParent,
	                    dest  : notFolder,
	                    error : bundle.getFormattedString('error_utils_cosmeticClone_dest_not_folder', [notFolder.path]) },
};
function test_cosmeticClone_invalidInput(aParameter)
{
	assert.raises(
		aParameter.error,
		function() {
			cloned = utilsModule.cosmeticClone(aParameter.orig, aParameter.dest);
		}
	);
}
