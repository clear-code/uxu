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
		if (nsPreferences.getBoolPref('extensions.uxu.runner.autoExit')) {
			var runner = WindowManager.getMostRecentWindow('uxu:runner');
			if (runner)
				runner.close();
		}
	}

}, false);
