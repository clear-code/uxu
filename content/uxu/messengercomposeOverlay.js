var uxuLibModule = new ModuleManager(['chrome://uxu/content/lib']);
var UXUMailComposeProxy = uxuLibModule.require('class', 'uxuMailComposeProxy');

window.addEventListener('DOMContentLoaded', function() {
	window.removeEventListener('DOMContentLoaded', arguments.callee, false);

	eval('window.ComposeStartup = '+window.ComposeStartup.toSource(/(gMsgCompose) = ((sMsgComposeService|composeSvc).InitCompose\(window, params\);)/).replace(
		/(gMsgCompose) = ((sMsgComposeService|composeSvc).InitCompose\(window, params\);)/,
		'$1 = $2 if (!("_real" in $1)) { $1 = new UXUMailComposeProxy($1); }'
	));

}, false);
