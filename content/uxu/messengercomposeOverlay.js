var UXUMailModule = new ModuleManager(['chrome://uxu/content/mail']);
var UXUMailComposeProxy = UXUMailModule.require('class', 'mailComposeProxy');

function UXUSimpleEnumeratorFromArray(aArray)
{
	this._index = 0;
	this._elements = aArray;
}
UXUSimpleEnumeratorFromArray.prototype = {
	_index    : 0,
	_elements : null,
	getNext : function()
	{
		if (!this.hasMoreElements()) {
			throw Components.results.NS_ERROR_FAILURE;
		}
		return this._elements[this._index++];
	},
	hasMoreElements : function()
	{
		return this._elements.length > this._index;
	},
	QueryInterface : function(aIID)
	{
		if (!aIID.equals(Components.interfaces.nsISimpleEnumerator) &&
			!aIID.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
}

function UXUGetFileFromArguments(aArgs)
{
	var file = aArgs && aArgs.length ? aArgs[aArgs.length-1] : null ;
	return (file && file instanceof Components.interfaces.nsIFile) ? file : null ;
}

window.addEventListener('DOMContentLoaded', function() {
	window.removeEventListener('DOMContentLoaded', arguments.callee, false);

	eval('window.ComposeStartup = '+window.ComposeStartup.toSource().replace(
		/(gMsgCompose) = ((sMsgComposeService|composeSvc).InitCompose\(window, params\);)/,
		'$1 = $2 if (!("_real" in $1)) { $1 = new UXUMailComposeProxy($1); }'
	));

	eval('window.AttachFile = '+window.AttachFile.toSource().replace(
		'{',
		'{ var __uxu__fileFromArgument = UXUGetFileFromArguments(arguments);'
	).replace(
		'if (fp.show()',
		'if (__uxu__fileFromArgument || fp.show()'
	).replace(
		'fp.files',
		'(__uxu__fileFromArgument ? new UXUSimpleEnumeratorFromArray([__uxu__fileFromArgument]) : fp.files )'
	));

}, false);
