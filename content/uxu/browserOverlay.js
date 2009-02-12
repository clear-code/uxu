function startUxU(aOptions) {
	if (!aOptions) aOptions = {};

	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator);

	var target = WindowManager.getMostRecentWindow('uxu:server');
	if (target) {
		target.focus();
		return;

	}
	window.openDialog('chrome://uxu/content/ui/uxu.xul', '_blank', 'chrome,all,dialog=no', aOptions);
}

function openUxUMozUnit() {
	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator);

	var target = WindowManager.getMostRecentWindow('uxu:mozunit');
	if (target) {
		target.focus();
		return;
	}

	window.openDialog('chrome://uxu/content/ui/mozunit.xul', '_blank', 'chrome,all,dialog=no');
}

window.addEventListener('load', function() {
	window.removeEventListener('load', arguments.callee, false);

	if (
		nsPreferences.getBoolPref('extensions.uxu.auto.start') ||
		(
			nsPreferences.getBoolPref('extensions.uxu.autoStart.oneTime.enabled') &&
			nsPreferences.getBoolPref('extensions.uxu.autoStart.oneTime')
		)
		) {
		nsPreferences.setBoolPref('extensions.uxu.autoStart.oneTime', false);
		startUxU({ serverPort : nsPreferences.getIntPref('extensions.uxu.autoStart.oneTime.port') });
	}

	if (
		nsPreferences.getBoolPref('extensions.uxu.mozunit.autoStart') ||
		(
			nsPreferences.getBoolPref('extensions.uxu.mozunit.autoStart.oneTime.enabled') &&
			nsPreferences.getBoolPref('extensions.uxu.mozunit.autoStart.oneTime')
		)
		) {
		nsPreferences.setBoolPref('extensions.uxu.mozunit.autoStart.oneTime', false);
		openUxUMozUnit();
	}
}, false);

window.addEventListener('unload', function() {
	window.removeEventListener('unload', arguments.callee, false);

	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator);

	var targets = WindowManager.getEnumerator('navigator:browser');
	if (!targets.hasMoreElements()) {
		if (nsPreferences.getBoolPref('extensions.uxu.auto.exit')) {
			var uxu = WindowManager.getMostRecentWindow('uxu:server');
			if (uxu)
				uxu.close();
		}
		if (nsPreferences.getBoolPref('extensions.uxu.mozunit.autoExit')) {
			var mozunit = WindowManager.getMostRecentWindow('uxu:mozunit');
			if (mozunit)
				mozunit.close();
		}
	}

}, false);
