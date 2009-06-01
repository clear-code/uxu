function init()
{
	var adminItems = [
			document.getElementById('installGlobalLocation-caption'),
			document.getElementById('installGlobalLocation-check')
		];
	var UpdateService = Cc['@mozilla.org/updates/update-service;1']
						.getService(Ci.nsIApplicationUpdateService);
	var canUpdate = UpdateService.canUpdate;
	adminItems.forEach(function(aItem) {
		if (canUpdate)
			aItem.removeAttribute('disabled');
		else
			aItem.setAttribute('disabled', true);
	});
}

function showFilePicker(aTarget, aTitle)
{
	var target = document.getElementById(aTarget);

	var filePicker = Components
			.classes['@mozilla.org/filepicker;1']
			.createInstance(Components.interfaces.nsIFilePicker);

	if (target.file) {
		filePicker.displayDirectory = target.file.parent;
	}

	filePicker.appendFilters(filePicker.filterApps | filePicker.filterAll);
	filePicker.init(window, aTitle, filePicker.modeOpen);

	if (filePicker.show() != filePicker.returnCancel) {
		target.file  = filePicker.file;
//		target.label = target.file.path;
		document.getElementById(target.getAttribute('preference')).value = filePicker.file;
	}
}

function resetFilePicker(aTarget)
{
	var target = document.getElementById(aTarget);
	target.file  = null;
	document.getElementById(target.getAttribute('preference')).value = null;
}

