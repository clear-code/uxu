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

	assert.equals('���{��', XToUnicode(sjisString, 'Shift_JIS'));
	assert.equals('���{��', XToUCS2(sjisString, 'Shift_JIS'));
	assert.equals(sjisString, UnicodeToX('���{��', 'Shift_JIS'));
	assert.equals(sjisString, UCS2ToX('���{��', 'Shift_JIS'));
}

function test_parseTemplate()
{
	var str = <![CDATA[
			<% for (var i = 0; i < 3; i++) { %>
			256��16�i���\����<%= (256).toString(16) %>�ł��B
			<% } %>
			<%= foo %><%= this.foo %><%= \u65e5\u672c\u8a9e %>
		]]>.toString();
	var params = {
			foo : 'bar',
			__parseTemplate__results : null,
			aContext : null
		};
	params["���{��"] = true;

	assert.equals(
		<![CDATA[
			
			256��16�i���\����100�ł��B
			
			256��16�i���\����100�ł��B
			
			256��16�i���\����100�ł��B
			
			barbartrue
		]]>.toString(),
		utilsModule.parseTemplate(str, params)
	);
}
