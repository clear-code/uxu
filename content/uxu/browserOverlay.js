function startUxU() {
	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);

	var target = WindowManager.getMostRecentWindow('uxu:server');
	if (target) {
		target.focus();
		return;
	}

	window.openDialog('chrome://uxu/content/ui/uxu.xul', '_blank', 'chrome,all');
}

function openUxUMozUnit() {
	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);

	var target = WindowManager.getMostRecentWindow('uxu:mozunit');
	if (target) {
		target.focus();
		return;
	}

	window.openDialog('chrome://uxu/content/ui/mozunit.xul', '_blank', 'chrome,all');
}

if (nsPreferences.getBoolPref('extensions.uxu.auto.start'))
	startUxU();


window.addEventListener('unload', function() {
	window.removeEventListener('unload', arguments.callee, false);

	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);

	var targets = WindowManager.getEnumerator('navigator:browser');
	if (nsPreferences.getBoolPref('extensions.uxu.auto.exit') &&
		!targets.hasMoreElements()) {
		var uxu = WindowManager.getMostRecentWindow('uxu:server');
		if (uxu)
			uxu.close();
	}

}, false);
