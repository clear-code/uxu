// -*- indent-tabs-mode: t; tab-width: 4 -*-

var isWindows = navigator.platform.toLowerCase().indexOf('win32') > -1;

var topDir = baseURL+'../../../../';
var utilsModule;

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

function clearKey(aRoot, aPath)
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
				clearKey(aRoot, aPath+'\\'+aName);
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

function clearRoot()
{
	if (!isWindows) return;
	clearKey(
		Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER,
		'HKCU\\Software\\ClearCode Inc.\\UxU'
	);
	utils.wait(100);
}

function shutDown()
{
	clearRoot();
}


function setUp()
{
	utilsModule = {};
	utils.include(topDir+'modules/utils.js', utilsModule);
	utilsModule = utilsModule.utils;
	clearRoot();

}

function tearDown()
{
}

function test_getWindowsResigtory()
{
	function assertGetWindowsResigtory(aExpected, aKey)
	{
		if (isWindows) {
			assert.strictlyEquals(
				aExpected,
				utilsModule.getWindowsRegistry(aKey)
			);
		}
		else {
			assert.raises(
				utilsModule.ERROR_PLATFORM_IS_NOT_WINDOWS,
				function() {
					utilsModule.getWindowsRegistry(aKey)
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
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-string',
		  value    : 'string' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-number',
		  value    : 29 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		  value    : [0, 2, 9, 29] }
	];
test_setWindowsResigtory.parameters = testData;
function test_setWindowsResigtory(aData)
{
	if (isWindows) {
		utilsModule.setWindowsRegistry(aData.key, aData.value);
		assert.strictlyEquals(aData.value, utilsModule.getWindowsRegistry(aData.key));
	}
	else {
		assert.raises(
			utilsModule.ERROR_PLATFORM_IS_NOT_WINDOWS,
			function() {
				utilsModule.setWindowsRegistry(aData.key, aData.value)
			}
		);
	}
}

test_setWindowsResigtory_overwrite.shouldSkip = !isWindows;
test_setWindowsResigtory_overwrite.parameters = [
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-string',
		  old      : 's',
		  value    : true,
		  expected : 'true' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-string',
		  old      : 's',
		  value    : 29,
		  expected : '29' },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-number',
		  old      : 0,
		  value    : '2929',
		  expected : 2929 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-number',
		  old      : 0,
		  value    : true,
		  expected : 1 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-number',
		  old      : 0,
		  value    : false,
		  expected : 0 },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		  old      : [0],
		  value    : 97,
		  expected : [97] },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		  old      : [0],
		  value    : 'b',
		  expected : [98] },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		  old      : [0],
		  value    : [true, false],
		  error    : bundle.getFormattedString(
		               'error_utils_failed_to_write_registry',
		               ['HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		                [true, false]]) },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		  old      : [0],
		  value    : ['a', 'b'],
		  error    : bundle.getFormattedString(
		               'error_utils_failed_to_write_registry',
		               ['HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		                ['a', 'b']]) },
		{ key      : 'HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		  old      : [0],
		  value    : [{ value : true }, { value : false }],
		  error    : bundle.getFormattedString(
		               'error_utils_failed_to_write_registry',
		               ['HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-binary',
		                [{ value : true }, { value : false }]]) }
	];
test_setWindowsResigtory_overwrite.setUp = function(aData)
{
	utilsModule.setWindowsRegistry(aData.key, aData.old);
};
function test_setWindowsResigtory_overwrite(aData)
{
	if (aData.error) {
		assert.raises(
			aData.error,
			function() {
				utilsModule.setWindowsRegistry(aData.key, aData.value)
			}
		);
	}
	else {
		utilsModule.setWindowsRegistry(aData.key, aData.value);
		assert.strictlyEquals(aData.expected, utilsModule.getWindowsRegistry(aData.key));
	}
}

test_clearWindowsRegistry.shouldSkip = !isWindows;
test_clearWindowsRegistry.setUp = function() {
	testData.forEach(function(aData) {
		if (aData.error || utilsModule.getWindowsRegistry(aData.key) !== null)
			return;
		utilsModule.setWindowsRegistry(aData.key, aData.value);
		assert.strictlyEquals(aData.value, utilsModule.getWindowsRegistry(aData.key));
	});
};
function test_clearWindowsRegistry()
{
	utilsModule.clearWindowsRegistry('HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-string');
	assert.isNull(utilsModule.getWindowsRegistry('HKCU\\Software\\ClearCode Inc.\\UxU\\test\\test-string'));

	utilsModule.clearWindowsRegistry('HKCU\\Software\\ClearCode Inc.\\UxU');
	testData.forEach(function(aData) {
		assert.isNull(utilsModule.getWindowsRegistry(aData.key));
	});
}
