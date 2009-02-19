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

	file = this.normalizeToFile('../../res/default.js');
	assert.equals(defaultPrefs, prefreadModule.read(file));

	file = this.normalizeToFile('../../res/user.js');
	assert.equals(userPrefs, prefreadModule.read(file));

}
