// -*- indent-tabs-mode: t; tab-width: 4 -*-

var isWindows = navigator.platform.toLowerCase().indexOf('win32') > -1;

var topDir = baseURL+'../../../../';
var utilsModule;


function clearWindowsRegistoryKey(aRoot, aPath)
{
	try {
		var regKey = Cc['@mozilla.org/windows-registry-key;1']
						.createInstance(Ci.nsIWindowsRegKey);
		regKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
		try {
			let values = [];
			for (let i = 0, maxi = regKey.valueCount; i < maxi; i++)
			{
				values.push(regKey.getValueName(i));
			}
			values.forEach(function(aName) {
				regKey.removeValue(aName);
			});
		}
		catch(e) {
		}
		try {
			let children = [];
			for (let i = 0, maxi = regKey.childCount; i < maxi; i++)
			{
				children.push(regKey.getChildName(i));
			}
			children.forEach(function(aName) {
				_clearWindowsRegistory(aRoot, aPath+'\\'+aName);
			});
		}
		catch(e) {
		}
		regKey.close();
	}
	catch(e) {
	}

	aPath = aPath.replace(/\\([^\\]+)$/, '');
	var name = RegExp.$1;
	var parentRegKey = Cc['@mozilla.org/windows-registry-key;1']
					.createInstance(Ci.nsIWindowsRegKey);
	try {
		parentRegKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
		try {
			if (parentRegKey.hasChild(name))
				parentRegKey.removeChild(name);
		}
		catch(e) {
			parentRegKey.close();
			throw e;
		}
		finally {
			parentRegKey.close();
		}
	}
	catch(e) {
	}
}


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

var testData = [
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-string',
		  value    : 'string' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-string',
		  value    : true,
		  expected : 'true' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-string',
		  value    : 29,
		  expected : '29' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-number',
		  value    : 29 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-number',
		  value    : '2929',
		  expected : 2929 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-number',
		  value    : true,
		  expected : 1 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-number',
		  value    : false,
		  expected : 0 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-binary',
		  value    : [0, 2, 9, 29] },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-binary',
		  value    : 97,
		  expected : [97] },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-binary',
		  value    : 'b',
		  expected : [98] },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-binary',
		  value    : [true, false],
		  error    : 'ERROR_FAILED_TO_WRITE_REGISTORY' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-binary',
		  value    : ['a', 'b'],
		  error    : 'ERROR_FAILED_TO_WRITE_REGISTORY' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test-binary',
		  value    : [{ value : true }, { value : false }],
		  error    : 'ERROR_FAILED_TO_WRITE_REGISTORY' }
	];

test_setWindowsResigtory.setUp = function() {
	if (isWindows) {
		clearWindowsRegistoryKey(
			Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
			'Software\\ClearCode Inc.'
		);
	}
};
test_setWindowsResigtory.tearDown = function() {
	if (isWindows) {
		clearWindowsRegistoryKey(
			Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
			'HKCU\\Software\\ClearCode Inc.'
		);
	}
};
function test_setWindowsResigtory()
{
	function assertSetWindowsResigtory(aData)
	{
		if (isWindows) {
			if (aData.error) {
				assert.raises(
					utilsModule[aData.error],
					function() {
						utilsModule.setWindowsRegistory(aData.key, aData.value)
					}
				);
			}
			else {
				utilsModule.setWindowsRegistory(aData.key, aData.value);
				assert.strictlyEquals(
					('expected' in aData ? aData.expected : aData.value ),
					utilsModule.getWindowsRegistory(aData.key)
				);
			}
		}
		else {
			assert.raises(
				utilsModule.ERROR_PLATFORM_IS_NOT_WINDOWS,
				function() {
					utilsModule.setWindowsRegistory(aData.key, aData.value)
				}
			);
		}
	}

	testData.forEach(function(aData) {
		assertSetWindowsResigtory(aData);
	});
}

test_clearWindowsRegistory.shouldSkip = !isWindows;
test_clearWindowsRegistory.setUp = function() {
	testData.forEach(function(aData) {
		if (aData.error) return;
		utilsModule.setWindowsRegistory(aData.key, aData.value);
		assert.strictlyEquals(
			('expected' in aData ? aData.expected : aData.value ),
			utilsModule.getWindowsRegistory(aData.key)
		);
	});
};
test_clearWindowsRegistory.tearDown = function() {
	clearWindowsRegistoryKey(
		Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
		'HKCU\\Software\\ClearCode Inc.'
	);
};
function test_clearWindowsRegistory()
{
	utilsModule.clearWindowsRegistory('HKCU\\Software\\ClearCode Inc.');
	testData.forEach(function(aData) {
		assert.isNull(utilsModule.getWindowsRegistory(aData.key));
	});
}
