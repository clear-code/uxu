// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');


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

function test_parseTemplate()
{
	var str = <![CDATA[
			<% for (var i = 0; i < 3; i++) { %>
			256の16進数表現は<%= (256).toString(16) %>です。
			<% } %>
			<%= foo %><%= this.foo %><%= \u65e5\u672c\u8a9e %>
		]]>.toString();
	var params = {
			foo : 'bar',
			__parseTemplate__results : null,
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
		utilsModule.parseTemplate(str, params)
	);
}
