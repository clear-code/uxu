var topDir = baseURL+'../../../../';

var bundle;

function setUp()
{
	utils.setPref('general.useragent.locale', 'ja');

	bundle = {};
	utils.include(topDir+'content/uxu/lib/bundle.js', bundle);
}

function tearDown()
{
}

function testGetString()
{
	var expected = {};
	var formatter = Cc["@mozilla.org/toolkit/URLFormatterService;1"]
            .getService(Ci.nsIURLFormatter);
	var locale = formatter.formatURL("%LOCALE%");

	expected['report_result_success']    = '成功';
	expected['report_description_setup'] = 'a の初期化処理';
	expected['typed_value']              = '1 (2)';
	assert.equals(expected['report_result_success'], bundle.getString('report_result_success'));
	assert.equals(expected['report_description_setup'], bundle.getFormattedString('report_description_setup', ['a']));
	assert.equals(expected['typed_value'], bundle.getFormattedString('typed_value', [1, 2]));
}
