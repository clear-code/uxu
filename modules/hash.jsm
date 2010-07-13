/*
 Hash Generator Library for Firefox 3.5 or later

 Usage:
   Components.utils.import('resource://my-modules/hash.jsm');
   hash.export(this);

 lisence: The MIT License, Copyright (c) 2010 ClearCode Inc.
   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 original:
   http://www.clear-code.com/repos/svn/js-codemodules/hash.jsm
   http://www.clear-code.com/repos/svn/js-codemodules/hash.test.js
*/


if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['hash'];

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

	var loadedRevision = 'hash' in namespace ?
			namespace.hash.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	namespace.hash = {
		revision : currentRevision,

		get Hasher()
		{
			delete this.Hasher;
			return this.Hasher = Cc['@mozilla.org/security/hash;1'].createInstance(Ci.nsICryptoHash);
		},

		computeHash : function(aData, aHashAlgorithm) 
		{
			var algorithm = String(aHashAlgorithm).toUpperCase().replace('-', '');
			if (algorithm in this.Hasher) {
				this.Hasher.init(this.Hasher[algorithm])
			}
			else {
				throw new Error('unknown hash algorithm: '+aHashAlgorithm);
			}

			if (aData instanceof Ci.nsIFile) {
				var stream = Cc['@mozilla.org/network/file-input-stream;1']
								.createInstance(Ci.nsIFileInputStream);
				stream.init(aData, 0x01, 0444, 0);
				const PR_UINT32_MAX = 0xffffffff;
				this.Hasher.updateFromStream(stream, PR_UINT32_MAX);
			}
			else {
				var array = aData.split('').map(function(aChar) {
								return aChar.charCodeAt(0);
							});
				this.Hasher.update(array, array.length);
			}
			return this.Hasher.finish(false)
				.split('')
				.map(function(aChar) {
					return ('0' + aChar.charCodeAt(0).toString(16)).slice(-2);
				}).join('').toUpperCase();
		},

		md2    : function(aData) { return this.computeHash(aData, 'md2'); },
		md5    : function(aData) { return this.computeHash(aData, 'md5'); },
		sha1   : function(aData) { return this.computeHash(aData, 'sha1'); },
		sha256 : function(aData) { return this.computeHash(aData, 'sha256'); },
		sha384 : function(aData) { return this.computeHash(aData, 'sha384'); },
		sha512 : function(aData) { return this.computeHash(aData, 'sha512'); },

		export : function(aNamespace)
		{
			if (!aNamespace)
				aNamespace = (function() { return this; })();
			if (!aNamespace)
				return;

			var self = this;
			'md2,md5,sha1,sha256,sha384,sha512'
				.split(',')
				.forEach(function(aSymbol) {
					aNamespace[aSymbol] = function() {
						return self[aSymbol].apply(self, arguments);
					};
				});
		}
	};

})();

var hash = namespace.hash;
