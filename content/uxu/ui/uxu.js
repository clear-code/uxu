// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils = lib_module.require('package', 'utils');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server = server_module.require('class', 'server');

var gServer;
var gLog;
var gAutoStart;

function Startup() {
	gServer = new Server(utils.getPref('extensions.uxu.port'));
	gServer.start(window.document.getElementById("content"), testRunnerlistener);

	gLog = document.getElementById('log');
	gAutoStart = document.getElementById('autostart');

	gAutoStart.checked = utils.getPref('extensions.uxu.auto.start');
}

function Shutdown() {
	gServer.stop();
}

var testRunnerlistener = {
    onStart: function() {
		var node;

		this._clearLog();

		node = document.createElement('label');
		node.setAttribute('style', 'border: 1px solid; padding: 0.5em;');
		node.setAttribute('value', 'New testcase starts');
		gLog.appendChild(node);
	},

	onFinish: function(aData) {
		var node = document.createElement('label');
		node.setAttribute('style', 'border: 1px solid; padding: 0.5em; white-space: pre;');
		node.appendChild(document.createTextNode(aData.result));
		gLog.appendChild(node);
	},

	onTestFinish: function(aData) {
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
	},

	_clearLog: function() {
		var node;

		while ((node = gLog.firstChild)) {
			gLog.removeChild(node);
		}
	}
};
