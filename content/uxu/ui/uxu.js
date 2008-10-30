// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils = lib_module.require('package', 'utils');
var bundle = lib_module.require('package', 'bundle');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server = server_module.require('class', 'server');
var Context = server_module.require('class', 'context');

var gServer;
var gLog;
var gAutoStart;

var gOptions = {};

const ObserverService = Cc['@mozilla.org/observer-service;1']
	.getService(Ci.nsIObserverService);

var restartObserver = { 
	observe : function(aSubect, aTopic, aData)
	{
		if (aTopic != 'quit-application-requested') return;

		if (utils.getPref('extensions.uxu.autoStart.oneTime.enabled')) {
			utils.setPref('extensions.uxu.autoStart.oneTime', true);
			utils.setPref('extensions.uxu.autoStart.oneTime.port', gServer.port);
		}
	}
};

function Startup() {
	if ('arguments' in window &&
		window.arguments &&
		window.arguments.length) {
		gOptions = window.arguments[0];
		if (gOptions instanceof Ci.nsIPropertyBag) {
			var jsobj = {};
			jsobj.serverPort = gOptions.getProperty('serverPort');
			jsobj.hidden     = gOptions.getProperty('hidden');
			gOptions = jsobj;
		}
	}

	var context = new Context(window.document.getElementById("content"));
	context.addRunnerListener(testRunnerlistener);

	gServer = new Server(gOptions.serverPort || utils.getPref('extensions.uxu.port'));
	gServer.addListener(context);
	gServer.start();

	gLog = document.getElementById('log');
	if (!gLog.scrollBoxObject)
		gLog.scrollBoxObject = gLog.boxObject.QueryInterface(Ci.nsIScrollBoxObject);
	gAutoStart = document.getElementById('autostart');

	gAutoStart.checked = utils.getPref('extensions.uxu.auto.start');

	if (gOptions.hidden) {
		window.setTimeout(function() { window.minimize(); }, 0);
	}
	ObserverService.addObserver(restartObserver, 'quit-application-requested', false);
}

function Shutdown() {
	gServer.stop();
	ObserverService.removeObserver(restartObserver, 'quit-application-requested');
}

var testRunnerlistener = {
	onStart: function() {
		this._clearLog();
		var node = document.createElement('label');
		node.setAttribute('style', 'border: 1px solid; padding: 0.5em;');
		node.setAttribute('value', 'New testcase starts');
		gLog.appendChild(node);
	},

	onTestCaseStart: function() {
		this.count = {
			success  : 0,
			failure  : 0,
			error    : 0,
			passover : 0
		};
	},

	onTestCaseFinish: function(aEvent) {
		var node = document.createElement('label');
		node.setAttribute('style', 'border: 1px solid; padding: 0.5em; white-space: pre;');
		node.appendChild(
			document.createTextNode(
				bundle.getFormattedString(
					'all_result_statistical',
					[
						this.count.success+this.count.failure+this.count.error+this.count.passover,
						this.count.success,
						this.count.failure,
						this.count.error,
						this.count.passover
					]
				)
			)
		);
		gLog.appendChild(node);
		gLog.scrollBoxObject.ensureElementIsVisible(node);
	},

	onTestCaseTestFinish: function(aEvent) {
		var report = aEvent.data.data;
		var color;
		switch (report.result)
		{
			case 'success':
				color = 'background: green; color: white; ';
				break;
			case 'failure':
				color = 'background: red; color: white;';
				break;
			case 'error':
				color = 'background: yellow; color: black;';
				break;
			case 'passover':
				color = 'background: gray; color: white;';
				break;
		}
		this.count[report.result]++;
		var node = document.createElement('label');
		node.setAttribute('style', 'border: 1px solid; padding: 0.5em; '+color+';');
		node.setAttribute('value', report.testDescription);
		gLog.appendChild(node);
		gLog.scrollBoxObject.ensureElementIsVisible(node);
	},

	_clearLog: function() {
		var range = document.createRange();
		range.selectNodeCOntents(gLog);
		range.deleteContents();
		range.detach();
	}
};
