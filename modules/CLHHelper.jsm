/*
 Command Line Handlers helper library for Firefox 3.5 or later

 Usage:
   Components.utils.import('resource://my-modules/CLHHelper.jsm');
   CommandLineHandler.prototype.handle = function(aCommandLine) {
     var args = {
          server     : CLHHelper.getBooleanValue('boolean-option', aCommandLine),
          serverPort : CLHHelper.getNumericValue('numeric-option', aCommandLine, 0),
          outputHost : CLHHelper.getStringValue('string-option', aCommandLine, ''),
          testcase   : CLHHelper.getFullPath('path-option', aCommandLine, '')
       };
   };
   CommandLineHandler.prototype.helpInfo = CLHHelper.formatHelpInfo({
     '-boolean-option' : 'It is a boolean option.',
     '-path-option <path>' : 'It is a path option.'
   });

 lisence: The MIT License, Copyright (c) 2010 ClearCode Inc.
   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 original:
   http://www.clear-code.com/repos/svn/js-codemodules/CLHHelper.jsm
   http://www.clear-code.com/repos/svn/js-codemodules/CLHHelper.test.js
*/

const EXPORTED_SYMBOLS = ['CLHHelper'];

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
		namespace = {};
	}
}

(function() {
	const currentRevision = 2;

	var loadedRevision = 'CLHHelper' in namespace ?
			namespace.CLHHelper.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	namespace.CLHHelper = {
		revision : currentRevision,

		_getValue : function(aOption, aCommandLine, aDefaultValue) 
		{
			if (aDefaultValue === void(0)) aDefaultValue = '';
			try {
				var value = aCommandLine.handleFlagWithParam(aOption.replace(/^-/, ''), false);
				return value === null ? aDefaultValue : value ;
			}
			catch(e) {
			}
			return aDefaultValue;
		},
	 
		getBooleanValue : function(aOption, aCommandLine) 
		{
			try {
				if (aCommandLine.handleFlag(aOption.replace(/^-/, ''), false))
					return true;
			}
			catch(e) {
			}
			return false;
		},
 
		getNumericValue : function(aOption, aCommandLine, aDefaultValue) 
		{
			if (!aDefaultValue) aDefaultValue = 0;
			var value = this._getValue(aOption, aCommandLine, aDefaultValue);
			if (!value) return aDefaultValue;
			value = Number(value);
			return isNaN(value) ? aDefaultValue : value ;
		},
 
		getStringValue : function(aOption, aCommandLine, aDefaultValue) 
		{
			return this._getValue(aOption, aCommandLine, aDefaultValue);
		},

		getFullPath : function(aOption, aCommandLine, aDefaultValue) 
		{
			if (!aDefaultValue) aDefaultValue = '';
			var value = this._getValue(aOption, aCommandLine, aDefaultValue);
			if (!value) return aDefaultValue;
			if (value.indexOf('/') < 0) {
				value = aCommandLine.resolveFile(value);
				return value.path;
			}
			else {
				value = aCommandLine.resolveURI(value);
				return value.spec;
			}
		},

		formatHelpInfo : function(aDescriptions)
		{
			var lines = [];
			var indent = '                       ';
			for (var i in aDescriptions)
			{
				let option = (i.indexOf('-') == 0) ? i : '-' + i ;
				let description = aDescriptions[i].replace(/^\s+|\s+$/g, '');

				option = '  '+option;
				if (option.length > 22) {
					lines.push(option);
					description = indent + description;
				}
				else {
					while (option.length < 23)
					{
						option += ' ';
					}
					description = option + description;
				}

				while (true)
				{
					lines.push(description.substring(0, 75).replace(/\s+$/, ''));
					if (description.length < 75)
						break;
					description = indent + description.substring(75).replace(/^\s+/, '');
				}
			}
			return this._UCS2ToUTF8(lines.join('\n'))+'\n';
		},

		_UCS2ToUTF8 : function(aInput)
		{
			return unescape(encodeURIComponent(aInput));
		}
	};
})();

var CLHHelper = namespace.CLHHelper;
