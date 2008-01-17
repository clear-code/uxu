// -*- indent-tabs-mode: t; tab-width: 4 -*-

var bundle = Components.classes['@mozilla.org/intl/stringbundle;1']
			.getService(Components.interfaces.nsIStringBundleService)
			.createBundle('chrome://uxu/locale/uxu.properties');

function getString(aKey) 
{
	try {
		return bundle.GetStringFromName(aKey);
	}
	catch(e) {
		return '';
	}
}

function getFormattedString(aKey, aValues) 
{
	try {
		return bundle.formatStringFromName(aKey, aValues, aValues.length);
	}
	catch(e) {
		return '';
	}
}
