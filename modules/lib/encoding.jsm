/*
 String Encoding Converter Library for Firefox 3.5 or later

 Usage:
   Components.utils.import('resource://my-modules/encoding.jsm');
   var utf8 = encoding.UCS2ToUTF8('source string (Unicode, UCS-2');
   var ucs2 = encoding.UTF8ToUCS2(utf8);
   var sjis = encoding.UCS2ToX(ucs2, 'Shift_JIS');
   var euc  = encoding.UCS2ToX(ucs2, 'EUC-JP');
   ucs2     = encoding.XToUCS2(sjis, 'Shift_JIS');
   encoding.export(this);

 lisence: The MIT License, Copyright (c) 2010 ClearCode Inc.
   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 original:
   http://www.clear-code.com/repos/svn/js-codemodules/encoding.jsm
   http://www.clear-code.com/repos/svn/js-codemodules/encoding.test.js
*/


if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['encoding'];

// var namespace;
if (typeof namespace == 'undefined') {
	// If namespace.jsm is available, export symbols to the shared namespace.
	// See: http://www.cozmixng.org/repos/piro/fx3-compatibility-lib/trunk/namespace.jsm
	try {
		let ns = {};
		Components.utils.import('resource://uxu-modules/lib/namespace.jsm', ns);
		namespace = ns.getNamespaceFor('clear-code.com');
	}
	catch(e) {
		namespace = (typeof window != 'undefined' ? window : null ) || {};
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

	namespace.encoding = {
		revision : currentRevision,

		get UCONV()
		{
			delete this.UCONV;
			return this.UCONV = Cc['@mozilla.org/intl/scriptableunicodeconverter'].getService(Ci.nsIScriptableUnicodeConverter);
		},

		UTF8ToUCS2 : function(aInput) 
		{
			return decodeURIComponent(escape(aInput));
		},
			
		UTF8ToUnicode : function(aInput) 
		{
			return this.UTF8ToUCS2(aInput);
		},
		  
		UCS2ToUTF8 : function(aInput) 
		{
			return unescape(encodeURIComponent(aInput));
		},
			
		UnicodeToUTF8 : function(aInput) 
		{
			return this.UCS2ToUTF8(aInput);
		},
		  
		XToUCS2 : function(aInput, aEncoding) 
		{
			if (aEncoding == 'UTF-8') return this.UTF8ToUnicode(aInput);
			try {
				this.UCONV.charset = aEncoding;
				return this.UCONV.ConvertToUnicode(aInput);
			}
			catch(e) {
			}
			return aInput;
		},
			
		XToUnicode : function(aInput, aEncoding) 
		{
			return this.XToUCS2(aInput, aEncoding);
		},
		  
		UCS2ToX : function(aInput, aEncoding) 
		{
			if (aEncoding == 'UTF-8') return this.UnicodeToUTF8(aInput);

			try {
				this.UCONV.charset = aEncoding;
				return this.UCONV.ConvertFromUnicode(aInput);
			}
			catch(e) {
			}
			return aInput;
		},
			
		UnicodeToX : function(aInput, aEncoding) 
		{
			return this.UCS2ToX(aInput, aEncoding);
		},

		export : function(aNamespace)
		{
			if (!aNamespace)
				aNamespace = (function() { return this; })();
			if (!aNamespace)
				return;

			var self = this;
			'UTF8ToUCS2,UTF8ToUnicode,UCS2ToUTF8,UnicodeToUTF8,XToUCS2,XToUnicode,UCS2ToX,UnicodeToX'
				.split(',')
				.forEach(function(aSymbol) {
					aNamespace[aSymbol] = function() {
						return self[aSymbol].apply(self, arguments);
					};
				});
		}
	};

})();

var encoding = namespace.encoding;
