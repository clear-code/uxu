// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');
utils.include('prefread.inc.js');

var Pref = Cc['@mozilla.org/preferences;1'] 
		.getService(Ci.nsIPrefBranch);

var prefKeyRoot;

function clearPref(aKey)
{
	try {
		Pref.clearUserPref(aKey);
	}
	catch(e) {
		Application.console.log(aKey+'\n'+e);
	}
}

function prefsSetUp()
{
	prefKeyRoot = 'uxu.testing.'+parseInt(Math.random() * 65000)+'.';
	Pref.setBoolPref(prefKeyRoot+'bool', true);
	Pref.setIntPref(prefKeyRoot+'int', 1);
	Pref.setCharPref(prefKeyRoot+'string', 'foobar');
}

function prefsTearDown()
{
	clearPref(prefKeyRoot+'bool');
	clearPref(prefKeyRoot+'int');
	clearPref(prefKeyRoot+'string');

	defaultPrefs.forEach(function(aItem) {
		clearPref(aItem.name);
	});
	userPrefs.forEach(function(aItem) {
		clearPref(aItem.name);
	});
}


test_getPref.setUp = prefsSetUp;
test_getPref.tearDown = prefsTearDown;
function test_getPref()
{
	var value;

	value = utilsModule.getPref(prefKeyRoot+'bool');
	assert.isBoolean(value);
	assert.isTrue(value);

	value = utilsModule.getPref(prefKeyRoot+'int');
	assert.isNumber(value);
	assert.equals(1, value);

	value = utilsModule.getPref(prefKeyRoot+'string');
	assert.isString(value);
	assert.equals('foobar', value);

	value = utilsModule.getPref(prefKeyRoot+'undefined');
	assert.isNull(value);
}

test_setAndClearPref.setUp = prefsSetUp;
test_setAndClearPref.tearDown = prefsTearDown;
function test_setAndClearPref()
{
	var key = 'undefined.pref.'+parseInt(Math.random() * 65000);
	var value;

	utilsModule.clearPref(key+'.bool');
	assert.isNull(utils.getPref(key+'.bool'));
	utilsModule.setPref(key+'.bool', true);
	value = utils.getPref(key+'.bool');
	assert.isBoolean(value);
	assert.isTrue(value);
	utilsModule.clearPref(key+'.bool');
	assert.isNull(utils.getPref(key+'.bool'));

	utilsModule.clearPref(key+'.int');
	assert.isNull(utils.getPref(key+'.int'));
	utilsModule.setPref(key+'.int', 30);
	value = utils.getPref(key+'.int');
	assert.isNumber(value);
	assert.equals(30, value);
	utilsModule.clearPref(key+'.int');
	assert.isNull(utils.getPref(key+'.int'));

	utilsModule.clearPref(key+'.string');
	assert.isNull(utils.getPref(key+'.string'));
	utilsModule.setPref(key+'.string', 'string');
	value = utils.getPref(key+'.string');
	assert.isString(value);
	assert.equals('string', value);
	utilsModule.clearPref(key+'.string');
	assert.isNull(utils.getPref(key+'.string'));
}

test_loadPrefs.setUp = prefsSetUp;
test_loadPrefs.tearDown = prefsTearDown;
function test_loadPrefs()
{
	var hash;
	var result;

	hash = {};
	result = utilsModule.loadPrefs('../../fixtures/default.js', hash);
	defaultPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, result[aItem.name], aItem.name);
		assert.isNull(utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(hash, result);

	hash = {};
	result = utilsModule.loadPrefs('../../fixtures/user.js', hash);
	userPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, result[aItem.name], aItem.name);
		assert.isNull(utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(hash, result);

	result = utilsModule.loadPrefs('../../fixtures/default.js');
	defaultPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(
		{ 'uxu.test.default.pref.bool': true,
		  'uxu.test.default.pref.bool.false': false,
		  'uxu.test.default.pref.int': 29,
		  'uxu.test.default.pref.plus': 29,
		  'uxu.test.default.pref.minus': -29,
		  'uxu.test.default.pref.string': 'string',
		  'uxu.test.default.pref.string.escaped': '"\'\\\r\n\x10\\x??\u0010\\u????\\t\\/',
		  'uxu.test.default.pref.string.single': 'single quote',
		  'uxu.test.default.pref.comment1': true,
		  'uxu.test.default.pref.comment2': true,
		  'uxu.test.default.pref.comment3': true },
		result
	);

	result = utilsModule.loadPrefs('../../fixtures/user.js');
	userPrefs.forEach(function(aItem) {
		assert.equals(aItem.value, utils.getPref(aItem.name), aItem.name);
	}, this);
	assert.equals(
		{ 'uxu.test.user.pref.bool': true,
		  'uxu.test.user.pref.bool.false': false,
		  'uxu.test.user.pref.int': 29,
		  'uxu.test.user.pref.plus': 29,
		  'uxu.test.user.pref.minus': -29,
		  'uxu.test.user.pref.string': 'string',
		  'uxu.test.user.pref.string.escaped': '"\'\\\r\n\x10\\x??\u0010\\u????\\t\\/',
		  'uxu.test.user.pref.string.single': 'single quote',
		  'uxu.test.user.pref.comment1': true,
		  'uxu.test.user.pref.comment2': true,
		  'uxu.test.user.pref.comment3': true },
		result
	);
}
