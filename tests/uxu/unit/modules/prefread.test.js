// -*- indent-tabs-mode: t; tab-width: 4 -*-
var parallel = false;

utils.include('prefread.inc.js');

var topDir = baseURL+'../../../../';

var prefread = utils.import(topDir+'modules/prefread.js', {});

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
	yield assert.raises(
		prefread.ERROR_MALFORMED_PREF_FILE,
		function() { prefread.read(file); }
	);

	file = this.normalizeToFile('../../fixtures/invalid_variable.js');
	yield assert.raises(
		prefread.ERROR_MALFORMED_PREF_FILE,
		function() { prefread.read(file); }
	);

	file = this.normalizeToFile('../../fixtures/invalid_array.js');
	yield assert.raises(
		prefread.ERROR_MALFORMED_PREF_FILE,
		function() { prefread.read(file); }
	);

}
