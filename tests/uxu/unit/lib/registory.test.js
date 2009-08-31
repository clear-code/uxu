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
	function assertSplitRegistoryKey(aInput, aRoot, aPath, aName)
	{
		if (isWindows) {
			assert.equals(
				[aRoot, aPath, aName],
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
		'HKEY_CLASSES_ROOT\\.txt\\Content Type',
		Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT,
		'.txt',
		'Content Type'
	);
	assertSplitRegistoryKey(
		'HKCR\\.txt\\Content Type',
		Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT,
		'.txt',
		'Content Type'
	);

	assertSplitRegistoryKey(
		'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings\\MigrateProxy',
		Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
		'Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings',
		'MigrateProxy'
	);
	assertSplitRegistoryKey(
		'HKCU\\Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings\\MigrateProxy',
		Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
		'Software\\Microsoft\\Windows\\'+
			'CurrentVersion\\Internet Settings',
		'MigrateProxy'
	);

	assertSplitRegistoryKey(
		'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\'+
			'CurrentVersion\\ProgramFilesPath',
		Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE,
		'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
		'ProgramFilesPath'
	);
	assertSplitRegistoryKey(
		'HKLM\\SOFTWARE\\Microsoft\\Windows\\'+
			'CurrentVersion\\ProgramFilesPath',
		Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE,
		'SOFTWARE\\Microsoft\\Windows\\CurrentVersion',
		'ProgramFilesPath'
	);

	assertSplitRegistoryKey(
		'INVALID_ROOT_KEY\\Path\\Name',
		-1,
		'Path',
		'Name'
	);
}
