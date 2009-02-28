// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('prefread.inc.js');

var topDir = baseURL+'../../../../';

var prefreadModule;

function setUp()
{
	prefreadModule = {};
	utils.include(topDir+'content/uxu/lib/prefread.js', prefreadModule);
}

function tearDown()
{
}

function test_read()
{
	var file;

	file = this.normalizeToFile('../../fixtures/default.js');
	assert.equals(defaultPrefs, prefreadModule.read(file));

	file = this.normalizeToFile('../../fixtures/user.js');
	assert.equals(userPrefs, prefreadModule.read(file));

	file = this.normalizeToFile('../../fixtures/invalid_calculate.js');
	assert.raises(
		prefreadModule.ERROR_MALFORMED_PREF_FILE,
		function() { prefreadModule.read(file); }
	);

	file = this.normalizeToFile('../../fixtures/invalid_variable.js');
	assert.raises(
		prefreadModule.ERROR_MALFORMED_PREF_FILE,
		function() { prefreadModule.read(file); }
	);

	file = this.normalizeToFile('../../fixtures/invalid_array.js');
	assert.raises(
		prefreadModule.ERROR_MALFORMED_PREF_FILE,
		function() { prefreadModule.read(file); }
	);

}
