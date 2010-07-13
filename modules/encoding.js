/*
 String Encoding Converter Library for Firefox 3.5 or later

 Usage:
   Components.utils.import('resource://my-modules/encoding.js');
   var utf8 = UCS2ToUTF8('source string (Unicode, UCS-2');
   var ucs2 = UTF8ToUCS2(utf8);
   var sjis = UCS2ToX(ucs2, 'Shift_JIS');
   var euc  = UCS2ToX(ucs2, 'EUC-JP');
   ucs2 = XToUCS2(sjis, 'Shift_JIS');

 lisence: The MIT License, Copyright (c) 2010 ClearCode Inc.
   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 original:
   http://www.clear-code.com/repos/svn/js-codemodules/uconv.js
   http://www.clear-code.com/repos/svn/js-codemodules/uconv.test.js
*/


if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = [
			'encoding',
			'UTF8ToUCS2', 'UTF8ToUnicode',
			'UCS2ToUTF8', 'UnicodeToUTF8',
			'XToUCS2', 'XToUnicode',
			'UCS2ToX', 'UnicodeToX'
		];

// var namespace;
if (typeof namespace == 'undefined') {
	// If namespace.jsm is available, export symbols to the shared namespace.
	// See: http://www.cozmixng.org/repos/piro/fx3-compatibility-lib/trunk/namespace.jsm
	try {
		let ns = {};
		Components.utils.import('resource://uxu-modules/namespace.jsm', ns);
		namespace = ns.getNamespaceFor('clear-code.com');
	}
	catch(e) {
		namespace = window || {};
	}
}

(function() {
	const currentRevision = 1;

	var loadedRevision = 'encoding' in namespace ?
			namespace.encoding.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	const UCONV = Cc['@mozilla.org/intl/scriptableunicodeconverter']
			.getService(Ci.nsIScriptableUnicodeConverter);

	namespace.encoding = {
		revision : currentRevision,

		UTF8ToUCS2 : function(aInput) 
		{
			return decodeURIComponent(escape(aInput));
		},
			
		UTF8ToUnicode : function(aInput) 
		{
			return UTF8ToUCS2(aInput);
		},
		  
		UCS2ToUTF8 : function(aInput) 
		{
			return unescape(encodeURIComponent(aInput));
		},
			
		UnicodeToUTF8 : function(aInput) 
		{
			return UCS2ToUTF8(aInput);
		},
		  
		XToUCS2 : function(aInput, aEncoding) 
		{
			if (aEncoding == 'UTF-8') return UTF8ToUnicode(aInput);
			try {
				UCONV.charset = aEncoding;
				return UCONV.ConvertToUnicode(aInput);
			}
			catch(e) {
			}
			return aInput;
		},
			
		XToUnicode : function(aInput, aEncoding) 
		{
			return XToUCS2(aInput, aEncoding);
		},
		  
		UCS2ToX : function(aInput, aEncoding) 
		{
			if (aEncoding == 'UTF-8') return UnicodeToUTF8(aInput);

			try {
				UCONV.charset = aEncoding;
				return UCONV.ConvertFromUnicode(aInput);
			}
			catch(e) {
			}
			return aInput;
		},
			
		UnicodeToX : function(aInput, aEncoding) 
		{
			return UCS2ToX(aInput, aEncoding);
		},

		export : function(aNamespace)
		{
			aNamespace.UTF8ToUCS2    = this.UTF8ToUCS2;
			aNamespace.UTF8ToUnicode = this.UTF8ToUnicode;
			aNamespace.UCS2ToUTF8    = this.UCS2ToUTF8;
			aNamespace.UnicodeToUTF8 = this.UnicodeToUTF8;
			aNamespace.XToUCS2       = this.XToUCS2;
			aNamespace.XToUnicode    = this.XToUnicode;
			aNamespace.UCS2ToX       = this.UCS2ToX;
			aNamespace.UnicodeToX    = this.UnicodeToX;
		}
	};

})();

var encoding = namespace.encoding;
