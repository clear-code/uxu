// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('prefread.inc.js');

var topDir = baseURL+'../../../../';

var prefread = {};
utils.include(topDir+'modules/prefread.js', 'Shift_JIS', prefread);

function setUp()
{
}

function tearDown()
{
}

function test_read()
{
	var file;

	file = this.normalizeToFile('../../fixtures/default.js');
	assert.equals(defaultPrefs, prefread.read(file));

	file = this.normalizeToFile('../../fixtures/user.js');
	assert.equals(userPrefs, prefread.read(file));

	file = this.normalizeToFile('../../fixtures/invalid_calculate.js');
	assert.raises(
		prefread.ERROR_MALFORMED_PREF_FILE,
		function() { prefread.read(file); }
	);

	file = this.normalizeToFile('../../fixtures/invalid_variable.js');
	assert.raises(
		prefread.ERROR_MALFORMED_PREF_FILE,
		function() { prefread.read(file); }
	);

	file = this.normalizeToFile('../../fixtures/invalid_array.js');
	assert.raises(
		prefread.ERROR_MALFORMED_PREF_FILE,
		function() { prefread.read(file); }
	);

}
