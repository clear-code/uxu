// -*- indent-tabs-mode: t; tab-width: 4 -*-

var isWindows = navigator.platform.toLowerCase().indexOf('win32') > -1;

var topDir = baseURL+'../../../../';
var utilsModule;

function setUp()
{
	utilsModule = {};
	utils.include(topDir+'content/uxu/lib/utils.js', utilsModule);
}

function tearDown()
{
}

function test__splitRegistoryKey()
{
	function assertSplitRegistoryKey(aExpected, aInput)
	{
		if (isWindows) {
			assert.equals(
				aExpected,
				utilsModule._splitRegistoryKey(aInput)
			);
		}
		else {
			assert.raises(
				utilsModule.ERROR_PLATFORM_IS_NOT_WINDOWS,
				function() {
					utilsModule._splitRegistoryKey(aInput)
				}
			);
		}
	}

	assertSplitRegistoryKey(
		[Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT,
		 '.txt',
		 'Content Type'],
		'HKEY_CLASSES_ROOT\\.txt\\Content Type'
	);
	assertSplitRegistoryKey(
		[Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT,
		 '.txt',
		 'Content Type'],
		'HKCR\\.txt\\Content Type'
	);

	assertSplitRegistoryKey(
		[Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
		 'Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings',
		 'MigrateProxy'],
		'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings\\MigrateProxy'
	);
	assertSplitRegistoryKey(
		[Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
		 'Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings',
		 'MigrateProxy'],
		'HKCU\\Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings\\MigrateProxy'
	);

	assertSplitRegistoryKey(
		[Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE,
		 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
		 'ProgramFilesPath'],
		'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\'+
			'CurrentVersion\\ProgramFilesPath'
	);
	assertSplitRegistoryKey(
		[Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE,
		 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
		 'ProgramFilesPath'],
		'HKLM\\SOFTWARE\\Microsoft\\Windows\\'+
			'CurrentVersion\\ProgramFilesPath'
	);

	assertSplitRegistoryKey(
		[-1,
		 'Path',
		 'Name'],
		'UNKNOWN\\Path\\Name'
	);
}

function test_getWindowsResigtory()
{
	function assertGetWindowsResigtory(aExpected, aKey)
	{
		if (isWindows) {
			assert.strictlyEquals(
				aExpected,
				utilsModule.getWindowsRegistory(aKey)
			);
		}
		else {
			assert.raises(
				utilsModule.ERROR_PLATFORM_IS_NOT_WINDOWS,
				function() {
					utilsModule.getWindowsRegistory(aKey)
				}
			);
		}
	}

	// REG_SZ
	assertGetWindowsResigtory(
		'text/plain',
		'HKCR\\.txt\\Content Type'
	);
	// REG_DWORD
	assertGetWindowsResigtory(
		0,
		'HKLM\\Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\explorer\\Advanced\\TaskbarSizeMove'
	);
}

var testData = {
		'HKCU\\Software\\ClearCode Inc.\\UxU\\test-string' : 'string',
		'HKCU\\Software\\ClearCode Inc.\\UxU\\test-number' : 29,
		'HKCU\\Software\\ClearCode Inc.\\UxU\\test-binary' : [0, 2, 9, 29]
	};

test_setWindowsResigtory.setUp = function() {
	for (var i in testData)
	{
		utils.clearWindowsRegistory(i);
		let keys = [];
		while ((i = i.replace(/\\[^\\]+$/, '')) &&
				i.indexOf('HKCU\\Software\\ClearCode Inc.') == 0)
		{
			keys.push(i);
		}
		keys.reverse().forEach(function(aKey) {
			utils.createWindowsRegistoryKey(aKey);
		});
	}
};
test_setWindowsResigtory.tearDown = function() {
	for (var i in testData)
	{
		while (i.indexOf('HKCU\\Software\\ClearCode Inc.') == 0)
		{
			utils.clearWindowsRegistory(i);
			i = i.replace(/\\[^\\]+$/, '');
		}
	}
};
function test_setWindowsResigtory()
{
	function assertSetWindowsResigtory(aKey, aValue)
	{
		if (isWindows) {
			utilsModule.setWindowsRegistory(aKey, aValue);
			assert.strictlyEquals(
				aValue,
				utilsModule.getWindowsRegistory(aKey)
			);
		}
		else {
			assert.raises(
				utilsModule.ERROR_PLATFORM_IS_NOT_WINDOWS,
				function() {
					utilsModule.setWindowsRegistory(aKey)
				}
			);
		}
	}

	for (var i in testData)
	{
		assertSetWindowsResigtory(i, testData[i]);
	}
}
