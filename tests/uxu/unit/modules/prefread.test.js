// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('prefread.inc.js');

var topDir = baseURL+'../../../../';

var ns = {};
[
	topDir+'modules/diff.js'
].forEach(function(aURI) {
	utils.include({
		uri                    : aURI,
		encoding               : 'Shift_JIS',
		allowOverrideConstants : true,
		namespace              : ns
	});
}, this);
var prefreadModule = { prefread : ns.prefread };

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
