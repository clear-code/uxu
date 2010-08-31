function openUxURunner() {
	Components.classes['@mozilla.org/observer-service;1']
		.getService(Components.interfaces.nsIObserverService)
		.notifyObservers(window, 'uxu-start-runner-request', null);
}

function openUXUConfig() {
	Components.classes['@mozilla.org/observer-service;1']
		.getService(Components.interfaces.nsIObserverService)
		.notifyObservers(window, 'uxu-open-config-request', null);
}
