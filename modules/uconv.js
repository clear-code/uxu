const EXPORTED_SYMBOLS = [
			'UTF8ToUCS2', 'UTF8ToUnicode',
			'UCS2ToUTF8', 'UnicodeToUTF8',
			'XToUCS2', 'XToUnicode',
			'UCS2ToX', 'UnicodeToX'
		];

const Cc = Components.classes;
const Ci = Components.interfaces;

const UCONV = Cc['@mozilla.org/intl/scriptableunicodeconverter']
		.getService(Ci.nsIScriptableUnicodeConverter);
	
function UTF8ToUCS2(aInput) 
{
	return decodeURIComponent(escape(aInput));
}
	
function UTF8ToUnicode(aInput) 
{
	return UTF8ToUCS2(aInput);
}
  
function UCS2ToUTF8(aInput) 
{
	return unescape(encodeURIComponent(aInput));
}
	
function UnicodeToUTF8(aInput) 
{
	return UCS2ToUTF8(aInput);
}
  
function XToUCS2(aInput, aEncoding) 
{
	if (aEncoding == 'UTF-8') return UTF8ToUnicode(aInput);
	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertToUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}
	
function XToUnicode(aInput, aEncoding) 
{
	return XToUCS2(aInput, aEncoding);
}
  
function UCS2ToX(aInput, aEncoding) 
{
	if (aEncoding == 'UTF-8') return UnicodeToUTF8(aInput);

	try {
		UCONV.charset = aEncoding;
		return UCONV.ConvertFromUnicode(aInput);
	}
	catch(e) {
	}
	return aInput;
}
	
function UnicodeToX(aInput, aEncoding) 
{
	return UCS2ToX(aInput, aEncoding);
}
