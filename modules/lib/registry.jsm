/*
 Windows Registry I/O Library for Firefox 3.5 or later

 Usage:
   Components.utils.import('resource://my-modules/registry.jsm');
   // both styles, HKEY_xxxx_xxxx and HKxx are available.
   var type = registry.getValue('HKEY_CLASSES_ROOT\\.txt\\Content Type');
   registry.setValue('HKCR\\.foobar\\Content Type', 'application/x-foobar');
   registry.clear('HKCU\\Software\\ClearCode Inc.\\MyApp');

 lisence: The MIT License, Copyright (c) 2010 ClearCode Inc.
   http://www.clear-code.com/repos/svn/js-codemodules/license.txt
 original:
   http://www.clear-code.com/repos/svn/js-codemodules/registry.jsm
   http://www.clear-code.com/repos/svn/js-codemodules/registry.test.js
*/


if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['registry'];

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

	var loadedRevision = 'registry' in namespace ?
			namespace.registry.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		return;
	}

	const Cc = Components.classes;
	const Ci = Components.interfaces;

	namespace.registry = {
		revision : currentRevision,

		ERROR_NOT_WINDOWS  : 'The platform is not Windows!',
		ERROR_WRITE_FAILED : 'Failed to write new value!',
		ERROR_CLEAR_FAILED : 'Failed to clear a registry key!',

		_splitKey : function(aKey) 
		{
			var root = -1, path = '', name = '';
			if (!('nsIWindowsRegKey' in Ci))
				throw new Error(this.ERROR_NOT_WINDOWS);

			path = aKey.replace(/\\([^\\]+)$/, '');
			name = RegExp.$1;

			path = path.replace(/^([^\\]+)\\/, '');
			root = RegExp.$1.toUpperCase();
			switch (root)
			{
				case 'HKEY_CLASSES_ROOT':
				case 'HKCR':
					root = Ci.nsIWindowsRegKey.ROOT_KEY_CLASSES_ROOT;
					break;

				case 'HKEY_CURRENT_USER':
				case 'HKCU':
					root = Ci.nsIWindowsRegKey.ROOT_KEY_CURRENT_USER;
					break;

				case 'HKEY_LOCAL_MACHINE':
				case 'HKLM':
					root = Ci.nsIWindowsRegKey.ROOT_KEY_LOCAL_MACHINE;
					break;

				default:
					root = -1;
					break;
			}

			return [root, path, name];
		},
		 
		getValue : function(aKey) 
		{
			var value = null;

			var root, path, name;
			[root, path, name] = this._splitKey(aKey);
			if (root < 0 || !path || !name)
				return value;

			var regKey = Cc['@mozilla.org/windows-registry-key;1']
							.createInstance(Ci.nsIWindowsRegKey);
			try {
				regKey.open(root, path, Ci.nsIWindowsRegKey.ACCESS_READ);
			}
			catch(e) {
				regKey.close();
				return value;
			}

			if (regKey.hasValue(name)) {
				switch (regKey.getValueType(name))
				{
					case Ci.nsIWindowsRegKey.TYPE_NONE:
						value = true;
						break;
					case Ci.nsIWindowsRegKey.TYPE_STRING:
						value = regKey.readStringValue(name);
						break;
					case Ci.nsIWindowsRegKey.TYPE_BINARY:
						value = regKey.readBinaryValue(name);
						value = value.split('').map(function(aChar) {
							return aChar.charCodeAt(0);
						});
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT:
						value = regKey.readIntValue(name);
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT64:
						value = regKey.readInt64Value(name);
						break;
				}
			}

			regKey.close();
			return value;
		},
		 
		setValue : function(aKey, aValue) 
		{
			var root, path, name;
			[root, path, name] = this._splitKey(aKey);
			if (root < 0 || !path || !name)
				throw new Error(this.ERROR_WRITE_FAILED);

			// create upper level items automatically
			var ancestors = [];
			var ancestor = path;
			do {
				ancestors.push(ancestor);
			}
			while (ancestor = ancestor.replace(/\\?[^\\]+$/, ''));
			ancestors.reverse().slice(1).forEach(function(aPath) {
				aPath = aPath.replace(/\\([^\\]+)$/, '');
				var name = RegExp.$1;
				var regKey = Cc['@mozilla.org/windows-registry-key;1']
								.createInstance(Ci.nsIWindowsRegKey);
				try {
					regKey.open(root, aPath, Ci.nsIWindowsRegKey.ACCESS_WRITE);
				}
				catch(e) {
					regKey.close();
					return;
				}
				try {
					if (!regKey.hasChild(name))
						regKey.createChild(name, Ci.nsIWindowsRegKey.ACCESS_WRITE);
				}
				catch(e) {
					regKey.close();
					throw e;
				}
				regKey.close();
			});

			var regKey = Cc['@mozilla.org/windows-registry-key;1']
							.createInstance(Ci.nsIWindowsRegKey);
			regKey.open(root, path, Ci.nsIWindowsRegKey.ACCESS_ALL);

			var self = this;
			function closeAndThrowError(aError)
			{
				regKey.close();
				throw aError || new Error(self.ERROR_WRITE_FAILED);
			}

			try {
				var type;
				if (regKey.hasValue(name)) {
					type = regKey.getValueType(name);
				}
				else {
					switch (typeof aValue)
					{
						case 'string':
							type = Ci.nsIWindowsRegKey.TYPE_STRING;
							break;
						case 'boolean':
							type = Ci.nsIWindowsRegKey.TYPE_INT;
							break;
						case 'number':
							type = Ci.nsIWindowsRegKey.TYPE_INT;
							break;
						case 'object':
							if (aValue &&
								'length' in aValue &&
								'forEach' in aValue) {
								type = Ci.nsIWindowsRegKey.TYPE_BINARY;
							}
							else {
								closeAndThrowError();
							}
							break;
					}
				}

				switch (type)
				{
					case Ci.nsIWindowsRegKey.TYPE_NONE:
						closeAndThrowError();
						break;
					case Ci.nsIWindowsRegKey.TYPE_STRING:
						regKey.writeStringValue(name, String(aValue));
						break;
					case Ci.nsIWindowsRegKey.TYPE_BINARY:
						switch (typeof aValue)
						{
							case 'boolean':
								aValue = String.fromCharCode(aValue ? 1 : 0 );
								break;
							case 'string':
								aValue = unescape(encodeURIComponent(aValue));
								break;
							case 'number':
								aValue = String.fromCharCode(parseInt(aValue));
								break;
							case 'object':
								if (aValue &&
									'length' in aValue &&
									'forEach' in aValue) {
									aValue = aValue.map(function(aCode) {
										if (typeof aCode != 'number') closeAndThrowError();
										return String.fromCharCode(aCode);
									}).join('');
								}
								else {
									closeAndThrowError();
								}
								break;
						}
						regKey.writeBinaryValue(name, aValue);
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT:
						switch (typeof aValue)
						{
							case 'boolean':
								aValue = aValue ? 1 : 0 ;
								break;
							case 'string':
							case 'number':
								aValue = parseInt(aValue);
								if (isNaN(aValue)) closeAndThrowError();
								break;
							case 'object':
								closeAndThrowError();
								break;
						}
						regKey.writeIntValue(name, aValue);
						break;
					case Ci.nsIWindowsRegKey.TYPE_INT64:
						switch (typeof aValue)
						{
							case 'boolean':
								aValue = aValue ? 1 : 0 ;
								break;
							case 'string':
							case 'number':
								aValue = parseInt(aValue);
								if (isNaN(aValue)) closeAndThrowError();
								break;
							case 'object':
								closeAndThrowError();
								break;
						}
						regKey.writeInt64Value(name, aValue);
						break;
				}
			}
			catch(e) {
				closeAndThrowError(e);
			}

			regKey.close();
			return aValue;
		},
		 
		clear : function(aKey) 
		{
			var root, path, name;
			[root, path, name] = this._splitKey(aKey);
			if (root < 0 || !path || !name)
				throw new Error(this.ERROR_CLEAR_FAILED);

			this._clear(root, path+'\\'+name);
		},
		_clear : function(aRoot, aPath)
		{
			try {
				var regKey = Cc['@mozilla.org/windows-registry-key;1']
								.createInstance(Ci.nsIWindowsRegKey);
				regKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
				try {
					let values = [];
					for (let i = 0, maxi = regKey.valueCount; i < maxi; i++)
					{
						values.push(regKey.getValueName(i));
					}
					values.forEach(function(aName) {
						regKey.removeValue(aName);
					});
				}
				catch(e) {
				}
				try {
					let children = [];
					for (let i = 0, maxi = regKey.childCount; i < maxi; i++)
					{
						children.push(regKey.getChildName(i));
					}
					children.forEach(function(aName) {
						this._clear(aRoot, aPath+'\\'+aName);
					}, this);
				}
				catch(e) {
				}
				regKey.close();
			}
			catch(e) {
			}

			aPath = aPath.replace(/\\([^\\]+)$/, '');
			var name = RegExp.$1;
			var parentRegKey = Cc['@mozilla.org/windows-registry-key;1']
							.createInstance(Ci.nsIWindowsRegKey);
			try {
				parentRegKey.open(aRoot, aPath, Ci.nsIWindowsRegKey.ACCESS_ALL);
				try {
					if (parentRegKey.hasValue(name))
						parentRegKey.removeValue(name);
					if (parentRegKey.hasChild(name))
						parentRegKey.removeChild(name);
				}
				catch(e) {
					parentRegKey.close();
					throw e;
				}
				finally {
					parentRegKey.close();
				}
			}
			catch(e) {
			}
		}
	};

})();

var registry = namespace.registry;
