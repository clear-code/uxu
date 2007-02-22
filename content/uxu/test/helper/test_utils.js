// -*- indent-tabs-mode: t; tab-width: 4 -*-

var WindowManager = Components.
	classes['@mozilla.org/appshell/window-mediator;1'].
	getService(Components.interfaces.nsIWindowMediator);

this.getTestWindow = function() {
	var targets = WindowManager.getEnumerator('navigator:browser'),
		target;
	while (targets.hasMoreElements())
	{
		target = targets.getNext().
			QueryInterface(Components.interfaces.nsIDOMWindowInternal);
		if (target.mozLabTestWindow)
			return target;
	}

	return null;
};

this.reopenTestWindow = function(callback) {
	var win = getTestWindow();
	if (win) win.close();
	return openTestWindow(callback);
};

this.openTestWindow = function(callback) {
	var win = getTestWindow();
	if (win) {
		if (callback) callback(win);
	} else {
		win = window.openDialog('chrome://browser/content/browser.xul',
								'_blank', 'chrome,all,dialog=no',
								'about:blank');
		win.mozLabTestWindow = true;
		if (callback) {
			win.addEventListener('load', function() {
				win.removeEventListener('load', arguments.callee, false);
				callback(win);
			}, false);
		}
	}
	return win;
};

this.closeTestWindow = function() {
	var win = getTestWindow();
	if (win) win.close();
};



this.loadURI = function(aURI, aLoadedFlag) {
	var win = getTestWindow();
	if (!win) return false;

	win.gBrowser.addEventListener('load', function() {
		aLoadedFlag.value = true;
		win.gBrowser.removeEventListener('load', arguments.callee, true);
	}, true);
	win.gBrowser.loadURI(aURI);

	return true;
};

this.addTab = function(aURI, aLoadedFlag) {
	var win = getTestWindow();
	if (!win) return false;

	var tab = win.gBrowser.addTab();
	tab.linkedBrowser.addEventListener('load', function() {
		aLoadedFlag.value = true;
		tab.linkedBrowser.removeEventListener('load', arguments.callee, true);
	}, true);
	tab.linkedBrowser.loadURI(aURI);

	return true;
};


