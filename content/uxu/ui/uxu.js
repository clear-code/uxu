// -*- indent-tabs-mode: t; tab-width: 4 -*-


const ObserverService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

var gServer;
var gLog;
var gAutoStart;

function Startup() {
	var module = new ModuleManager(['chrome://uxu/content']);
	var Server = module.require('class', 'server');
	gServer = new Server(nsPreferences.getIntPref('extensions.uxu.port'));
	gServer.start();

	gLog = document.getElementById('log');
	gAutoStart = document.getElementById('autostart');

	gAutoStart.checked = nsPreferences.getBoolPref('extensions.uxu.auto.start');

	ObserverService.addObserver(testEventObserver, 'UxU:TestStart', false);
	ObserverService.addObserver(testEventObserver, 'UxU:TestFinish', false);
	ObserverService.addObserver(testEventObserver, 'UxU:TestProgress', false);
}

function Shutdown() {
	gServer.stop();

	ObserverService.removeObserver(testEventObserver, 'UxU:TestStart');
	ObserverService.removeObserver(testEventObserver, 'UxU:TestFinish');
	ObserverService.removeObserver(testEventObserver, 'UxU:TestProgress');
}




var WindowManager = Components.
	classes['@mozilla.org/appshell/window-mediator;1'].
	getService(Components.interfaces.nsIWindowMediator);


window.__proto__.__defineGetter__('browser', function() {
	return WindowManager.getMostRecentWindow('navigator:browser');
});

window.__proto__.__defineGetter__('browsers', function() {
	var browserWindows = [];

	var targets = WindowManager.getEnumerator('navigator:browser'),
		target;
	while (targets.hasMoreElements())
	{
		target = targets.getNext().QueryInterface(Components.interfaces.nsIDOMWindowInternal);
		browserWindows.push(target);
	}

	return browserWindows;
});


var testEventObserver = {
	observe : function(aSubject, aTopic, aData)
	{
		if (aData)
			eval('aData = '+aData);

		switch(aTopic)
		{
			case 'UxU:TestStart':
				var node = document.createElement('label');
				node.setAttribute('style', 'border: 1px solid; padding: 0.5em;');
				node.setAttribute('value', 'New testcase starts');
				gLog.appendChild(node);
				break;

			case 'UxU:TestFinish':
				var node = document.createElement('label');
				node.setAttribute('style', 'border: 1px solid; padding: 0.5em; white-space: pre;');
				node.appendChild(document.createTextNode(aData.result));
				gLog.appendChild(node);
				break;

			case 'UxU:TestProgress':
				var color;
				switch (aData.result)
				{
					case 'success': color = 'background: green; color: white; '; break;
					case 'failure': color = 'background: red; color: white;'; break;
					case 'error'  : color = 'background: yellow; color: black;'; break;
					case 'unknown': color = 'background: gray; color: white;'; break;
				}

				var node = document.createElement('label');
				node.setAttribute('style', 'border: 1px solid; padding: 0.5em; '+color+';');
				node.setAttribute('value', aData.description);
				gLog.appendChild(node);
				break;
		}
	}
};
