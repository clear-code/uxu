// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils = lib_module.require('package', 'utils');
var bundle = lib_module.require('package', 'bundle');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server = server_module.require('class', 'server');

var gServer;
var gLog;
var gAutoStart;

var gOptions = {};

function Startup() {
	if ('arguments' in window &&
		window.arguments &&
		window.arguments.length) {
		gOptions = window.arguments[0];
		if (gOptions instanceof Ci.nsIPropertyBag) {
			var jsobj = {};
			jsobj.serverPort = gOptions.getProperty('serverPort');
			gOptions = jsobj;
		}
	}

	gServer = new Server(gOptions.serverPort || utils.getPref('extensions.uxu.port'));
	gServer.start(window.document.getElementById("content"), testRunnerlistener);

	gLog = document.getElementById('log');
	if (!gLog.scrollBoxObject)
		gLog.scrollBoxObject = gLog.boxObject.QueryInterface(Ci.nsIScrollBoxObject);
	gAutoStart = document.getElementById('autostart');

	gAutoStart.checked = utils.getPref('extensions.uxu.auto.start');
}

function Shutdown() {
	gServer.stop();
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
