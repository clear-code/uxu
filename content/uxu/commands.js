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

function openUxURunner() {
	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator);
	var target = WindowManager.getMostRecentWindow('uxu:runner');
	if (target) {
		target.focus();
		return;
	}
	window.openDialog('chrome://uxu/content/ui/runner.xul', '_blank', 'chrome,all,dialog=no');
}

function openUXUConfig() {
	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator);
	var target = WindowManager.getMostRecentWindow('uxu:config');
	if (target) {
		target.focus();
		return;
	}
	window.openDialog(
		'chrome://uxu/content/ui/config.xul',
		'_blank',
		'chrome,titlebar,toolbar,centerscreen' + (
			nsPreferences.getBoolPref('browser.preferences.instantApply') ?
				',dialog=no' : 
				',modal'
		)
	);
}

