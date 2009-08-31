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

function test__splitResigtoryKey()
{
	function assertSplitRegistoryKey(aExpected, aInput)
	{
		if (isWindows) {
			assert.equals(
				aExpected,
				utilsModule._splitResigtoryKey(aInput)
			);
		}
		else {
			assert.raises(
				utilsModule.ERROR_PLATFORM_IS_NOT_WINDOWS,
				function() {
					utilsModule._splitResigtoryKey(aInput)
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
