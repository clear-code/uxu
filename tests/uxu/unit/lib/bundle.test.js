var bundle;
var locale = utils.getPref('general.useragent.locale');

function setUp()
{
	bundle = {};
	utils.include('../../../../content/uxu/lib/bundle.js', bundle);
}

function tearDown()
{
}

function testGetString()
{
	var expected = {};
	if (locale.indexOf('ja') == 0) {
		expected['report_description_setup'] = 'セットアップ';
		expected['all_result_failure']       = '1件のテストに失敗しました';
		expected['typed_value']              = '1 (2)';
	}
	else {
		expected['report_description_setup'] = 'Setup';
		expected['all_result_failure']       = '1 test(s) failed.';
		expected['typed_value']              = '1 (2)';
	}
	assert.equals(expected['report_description_setup'], bundle.getString('report_description_setup'));
	assert.equals(expected['all_result_failure'], bundle.getFormattedString('all_result_failure', [1]));
	assert.equals(expected['typed_value'], bundle.getFormattedString('typed_value', [1, 2]));
}
