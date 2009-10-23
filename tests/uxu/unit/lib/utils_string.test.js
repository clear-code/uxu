// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');

var bundle = {};
utils.include(topDir+'content/uxu/lib/bundle.js', bundle);


test_formatError.priority = 'never';
function test_formatError()
{
}

test_formatStackTrace.priority = 'never';
function test_formatStackTrace()
{
}

test_makeStackLine.priority = 'never';
function test_makeStackLine()
{
}

function test_convertEncoding()
{
	var utf8String = utilsModule.readFrom('../../fixtures/utf8.txt');
	var ucs2String = utilsModule.readFrom('../../fixtures/utf8.txt', 'UTF-8');

	assert.equals(ucs2String, UTF8ToUnicode(utf8String));
	assert.equals(ucs2String, UTF8ToUCS2(utf8String));
	assert.equals(utf8String, UnicodeToUTF8(ucs2String));
	assert.equals(utf8String, UCS2ToUTF8(ucs2String));

	var sjisString = utilsModule.readFrom('../../fixtures/shift_jis.txt');

	assert.equals('日本語', XToUnicode(sjisString, 'Shift_JIS'));
	assert.equals('日本語', XToUCS2(sjisString, 'Shift_JIS'));
	assert.equals(sjisString, UnicodeToX('日本語', 'Shift_JIS'));
	assert.equals(sjisString, UCS2ToX('日本語', 'Shift_JIS'));
}

function test_processTemplate()
{
	var str = <![CDATA[
			<% for (var i = 0; i < 3; i++) { %>
			256の16進数表現は<%= (256).toString(16) %>です。
			<% } %>
			<%= foo %><%= this.foo %><%= \u65e5\u672c\u8a9e %>
		]]>.toString();
	var params = {
			foo : 'bar',
			__processTemplate__results : null,
			aContext : null
		};
	params["日本語"] = true;

	assert.equals(
		<![CDATA[
			
			256の16進数表現は100です。
			
			256の16進数表現は100です。
			
			256の16進数表現は100です。
			
			barbartrue
		]]>.toString(),
		utilsModule.processTemplate(str, params)
	);
}

test_compareVersions.parameters = {
	simpleEQ1OK          : { args : ['29', '=', '29'], expected : true },
	simpleEQ2OK          : { args : ['29', '==', '29'], expected : true },
	simpleEQ3OK          : { args : ['29', '===', '29'], expected : true },
	simpleEQ1NG          : { args : ['29', '=', '290'], expected : false },
	simpleEQ2NG          : { args : ['29', '==', '290'], expected : false },
	simpleEQ3NG          : { args : ['29', '===', '290'], expected : false },
	simpleNE1OK          : { args : ['29', '!=', '290'], expected : true },
	simpleNE2OK          : { args : ['29', '!==', '290'], expected : true },
	simpleNE1NG          : { args : ['29', '!=', '29'], expected : false },
	simpleNE2NG          : { args : ['29', '!==', '29'], expected : false },
	simpleLT_OK          : { args : ['29', '<', '290'], expected : true },
	simpleLT_NG_GT       : { args : ['290', '<', '29'], expected : false },
	simpleLT_NG_EQ       : { args : ['29', '<', '29'], expected : false },
	simpleGT_OK          : { args : ['290', '>', '29'], expected : true },
	simpleGT_NG_LT       : { args : ['29', '>', '290'], expected : false },
	simpleGT_NG_EQ       : { args : ['29', '>', '29'], expected : false },
	simpleEQLT_OK_EQ     : { args : ['29', '<=', '29'], expected : true },
	simpleEQLT_OK_LT     : { args : ['29', '<=', '290'], expected : true },
	simpleEQLT_NG        : { args : ['290', '<=', '29'], expected : false },
	simpleEQLT_Rev_OK_EQ : { args : ['29', '=<', '29'], expected : true },
	simpleEQLT_Rev_OK_LT : { args : ['29', '=<', '290'], expected : true },
	simpleEQLT_Rev_NG    : { args : ['290', '=<', '29'], expected : false },
	simpleEQGT_OK_EQ     : { args : ['29', '>=', '29'], expected : true },
	simpleEQGT_OK_GT     : { args : ['290', '>=', '29'], expected : true },
	simpleEQGT_NG        : { args : ['29', '>=', '290'], expected : false },
	simpleEQGT_Rev_OK_EQ : { args : ['29', '=>', '29'], expected : true },
	simpleEQGT_Rev_OK_GT : { args : ['290', '=>', '29'], expected : true },
	simpleEQGT_Rev_NG    : { args : ['29', '=>', '290'], expected : false },

	dotEQ1OK          : { args : ['2.9', '=', '2.9'], expected : true },
	dotEQ2OK          : { args : ['2.9', '==', '2.9'], expected : true },
	dotEQ3OK          : { args : ['2.9', '===', '2.9'], expected : true },
	dotEQ1NG          : { args : ['2.90', '=', '3.9'], expected : false },
	dotEQ2NG          : { args : ['2.90', '==', '3.9'], expected : false },
	dotEQ3NG          : { args : ['2.90', '===', '3.9'], expected : false },
	dotNE1OK          : { args : ['2.90', '!=', '3.9'], expected : true },
	dotNE2OK          : { args : ['2.90', '!==', '3.9'], expected : true },
	dotNE1NG          : { args : ['2.9', '!=', '2.9'], expected : false },
	dotNE2NG          : { args : ['2.9', '!==', '2.9'], expected : false },
	dotLT_OK          : { args : ['2.90', '<', '3.9'], expected : true },
	dotLT_NG_GT       : { args : ['3.9', '<', '2.90'], expected : false },
	dotLT_NG_EQ       : { args : ['2.90', '<', '2.9'], expected : false },
	dotGT_OK          : { args : ['3.9', '>', '2.90'], expected : true },
	dotGT_NG_LT       : { args : ['2.90', '>', '3.9'], expected : false },
	dotGT_NG_EQ       : { args : ['2.9', '>', '2.9'], expected : false },
	dotEQLT_OK_EQ     : { args : ['2.90', '<=', '2.90'], expected : true },
	dotEQLT_OK_LT     : { args : ['2.90', '<=', '3.9'], expected : true },
	dotEQLT_NG        : { args : ['3.9', '<=', '2.90'], expected : false },
	dotEQLT_Rev_OK_EQ : { args : ['2.90', '=<', '2.90'], expected : true },
	dotEQLT_Rev_OK_LT : { args : ['2.90', '=<', '3.9'], expected : true },
	dotEQLT_Rev_NG    : { args : ['3.9', '=<', '2.90'], expected : false },
	dotEQGT_OK_EQ     : { args : ['2.90', '>=', '2.90'], expected : true },
	dotEQGT_OK_GT     : { args : ['3.9', '>=', '2.90'], expected : true },
	dotEQGT_NG        : { args : ['2.90', '>=', '3.9'], expected : false },
	dotEQGT_Rev_OK_EQ : { args : ['2.90', '=>', '2.90'], expected : true },
	dotEQGT_Rev_OK_GT : { args : ['3.9', '=>', '2.90'], expected : true },
	dotEQGT_Rev_NG    : { args : ['2.90', '=>', '3.9'], expected : false },

	alphabetEQ1OK          : { args : ['2.9a2', '=', '2.9a2'], expected : true },
	alphabetEQ2OK          : { args : ['2.9a2', '==', '2.9a2'], expected : true },
	alphabetEQ3OK          : { args : ['2.9a2', '===', '2.9a2'], expected : true },
	alphabetEQ1NG          : { args : ['2.9a2', '=', '2.9b1'], expected : false },
	alphabetEQ2NG          : { args : ['2.9a2', '==', '2.9b1'], expected : false },
	alphabetEQ3NG          : { args : ['2.9a2', '===', '2.9b1'], expected : false },
	alphabetNE1OK          : { args : ['2.9a2', '!=', '2.9b1'], expected : true },
	alphabetNE2OK          : { args : ['2.9a2', '!==', '2.9b1'], expected : true },
	alphabetNE1NG          : { args : ['2.9a2', '!=', '2.9a2'], expected : false },
	alphabetNE2NG          : { args : ['2.9a2', '!==', '2.9a2'], expected : false },
	alphabetLT_OK          : { args : ['2.9a2', '<', '2.9b1'], expected : true },
	alphabetLT_NG_GT       : { args : ['2.9b1', '<', '2.9a2'], expected : false },
	alphabetLT_NG_EQ       : { args : ['2.9a2', '<', '2.9a2'], expected : false },
	alphabetGT_OK          : { args : ['2.9b1', '>', '2.9a2'], expected : true },
	alphabetGT_NG_LT       : { args : ['2.9a2', '>', '2.9b1'], expected : false },
	alphabetGT_NG_EQ       : { args : ['2.9a2', '>', '2.9a2'], expected : false },
	alphabetEQLT_OK_EQ     : { args : ['2.9a2', '<=', '2.9a2'], expected : true },
	alphabetEQLT_OK_LT     : { args : ['2.9a2', '<=', '2.9b1'], expected : true },
	alphabetEQLT_NG        : { args : ['2.9b1', '<=', '2.9a2'], expected : false },
	alphabetEQLT_Rev_OK_EQ : { args : ['2.9a2', '=<', '2.9a2'], expected : true },
	alphabetEQLT_Rev_OK_LT : { args : ['2.9a2', '=<', '2.9b1'], expected : true },
	alphabetEQLT_Rev_NG    : { args : ['2.9b1', '=<', '2.9a2'], expected : false },
	alphabetEQGT_OK_EQ     : { args : ['2.9a2', '>=', '2.9a2'], expected : true },
	alphabetEQGT_OK_GT     : { args : ['2.9b1', '>=', '2.9a2'], expected : true },
	alphabetEQGT_NG        : { args : ['2.9a2', '>=', '2.9b1'], expected : false },
	alphabetEQGT_Rev_OK_EQ : { args : ['2.9a2', '=>', '2.9a2'], expected : true },
	alphabetEQGT_Rev_OK_GT : { args : ['2.9b1', '=>', '2.9a2'], expected : true },
	alphabetEQGT_Rev_NG    : { args : ['2.9a2', '=>', '2.9b1'], expected : false },

	errorTooLessArgs : { args : ['2.9'],
	                     error : bundle.getFormattedString('error_utils_compareVersions_invalid_arguments', ['2.9']) },
	errorTooManyArgs : { args : ['2.9', '==', '2.9', 'foo'],
	                     error : bundle.getFormattedString('error_utils_compareVersions_invalid_arguments', ['2.9, ==, 2.9, foo']) },
	errorInvalidOperator : { args : ['2.9', '?', '2.9'],
	                         error : bundle.getFormattedString('error_utils_compareVersions_invalid_operator', ['2.9', '2.9', '?']) },

	simpleEqualsOld   : { args : ['29', '29'], expected : 0 },
	simpleLTOld       : { args : ['29', '290'], expected : -1 },
	simpleGTOld       : { args : ['290', '29'], expected : 1 },
	dotEqualsOld      : { args : ['2.9', '2.9'], expected : 0 },
	dotLTOld          : { args : ['2.90', '3.9'], expected : -1 },
	dotGTOld          : { args : ['3.9', '2.90'], expected : 1 },
	alphabetEqualsOld : { args : ['2.9b1', '2.9b1'], expected : 0 },
	alphabetLTOld     : { args : ['2.9a2', '2.9b1'], expected : -1 },
	alphabetGTOld     : { args : ['2.9b1', '2.9a2'], expected : 1 },
};
function test_compareVersions(aParameter)
{
	if (aParameter.error) {
		assert.raises(aParameter.error,
		              function() {
		                utilsModule.compareVersions.apply(utilsModule, aParameter.args);
		              },
		              null);
	}
	else {
		assert.strictlyEquals(aParameter.expected,
		                      utilsModule.compareVersions.apply(utilsModule, aParameter.args));
	}
}
