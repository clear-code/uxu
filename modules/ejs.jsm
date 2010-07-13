/*
 Embedded JavaScript Template Library for Firefox 3.5 or later

 Usage:
   Components.utils.import('resource://my-modules/ejs.jsm');
   var source = 'Happy new year <%= (new Date()).getFullYear() %>!';
   var result = (new EJS(source)).result;
   // Just same to EJS.result(source);

 lisence: The MIT License, Copyright (c) 2010 ClearCode Inc.
   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 original:
   http://www.clear-code.com/repos/svn/js-codemodules/ejs.jsm
   http://www.clear-code.com/repos/svn/js-codemodules/ejs.test.js
*/


if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['EJS'];

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


	function EJS(aCode)
	{
		this.code = aCode;
	}
	EJS.prototype = {
		result : function(aScope) 
		{
			var __processTemplate__codes = [];
			this.code.split('%>').forEach(function(aPart) {
				let strPart, codePart;
				[strPart, codePart] = aPart.split('<%');
				__processTemplate__codes.push('__processTemplate__results.push('+
				                            strPart.toSource()+
				                            ');');
				if (!codePart) return;
				if (codePart.charAt(0) == '=') {
					__processTemplate__codes.push('__processTemplate__results.push(('+
					                            codePart.substring(1)+
					                            ') || "");');
				}
				else {
					__processTemplate__codes.push(codePart);
				}
			});
			var sandbox = new Components.utils.Sandbox(this._global);
			sandbox.__proto__ = { __processTemplate__results : [] };
			if (aScope) sandbox.__proto__.__proto__ = aScope;
			Components.utils.evalInSandbox(__processTemplate__codes.join('\n'), sandbox);
			return sandbox.__processTemplate__results.join('');
		},
		get _global()
		{
			return (function() { return this; })();
		}
	};

	EJS.result = function(aCode, aScope) {
		return (new EJS(aCode)).result(aScope);
	};

	EJS.currentRevision = currentRevision;

	namespace.EJS = EJS;
})();

var EJS = namespace.EJS;
