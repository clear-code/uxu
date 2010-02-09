var Cc = Components.classes;
var Ci = Components.interfaces;

function init()
{
}

function showFilePicker(aTarget, aTitle)
{
	var target = document.getElementById(aTarget);

	var filePicker = Cc['@mozilla.org/filepicker;1']
			.createInstance(Ci.nsIFilePicker);

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

