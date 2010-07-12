// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils = lib_module.require('package', 'utils');

var ns = {};
Components.utils.import('resource://uxu-modules/stringBundle.js', ns);
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server = server_module.require('class', 'server');
var Context = server_module.require('class', 'context');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var TestCase = test_module.require('class', 'test_case');

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
	context.addListener(gServer);
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

	getReport: function(aTestCase) {
		var id = 'testcase-report-'+encodeURIComponent(aTestCase.title)+'-'+encodeURIComponent(aTestCase.source);

		var node = document.getElementById(id);
		if (node) return node;

		node = document.createElement('groupbox');
		node.setAttribute('id', id);
		node.setAttribute('class', 'server-report');
		node.appendChild(document.createElement('caption'));
		node.lastChild.setAttribute('class', 'testcase-start');
		node.lastChild.setAttribute('label', aTestCase.title);
		gLog.appendChild(node);
		return node;
	},

	onTestCaseStart: function(aEvent) {
		this.count = {
			success  : 0,
			failure  : 0,
			error    : 0,
			skip : 0
		};
		gLog.scrollBoxObject.ensureElementIsVisible(this.getReport(aEvent.data.testCase));
		document.documentElement.setAttribute('running', true);
	},

	onTestCaseFinish: function(aEvent) {
		var parent = this.getReport(aEvent.data.testCase);
		var node = document.createElement('hbox');
		node.setAttribute('class', 'testcase-finish');
		node.appendChild(document.createElement('label'));
		node.lastChild.setAttribute('value', bundle.getFormattedString(
			'all_result_statistical',
			[
				this.count.success+this.count.failure+this.count.error+this.count.skip,
				this.count.success,
				this.count.failure,
				this.count.error,
				this.count.skip
			]
		));
		parent.appendChild(node);
		gLog.scrollBoxObject.ensureElementIsVisible(node);
		document.documentElement.removeAttribute('running');
	},

	onTestCaseTestFinish: function(aEvent) {
		var report = aEvent.data.data;
		var color;
		switch (report.result)
		{
			case TestCase.prototype.RESULT_SUCCESS:
				color = 'background: green; color: white; ';
				break;
			case TestCase.prototype.RESULT_FAILURE:
				color = 'background: red; color: white;';
				break;
			case TestCase.prototype.RESULT_ERROR:
				color = 'background: yellow; color: black;';
				break;
			case TestCase.prototype.RESULT_SKIPPED:
				color = 'background: gray; color: white;';
				break;
		}
		this.count[report.result]++;
		var parent = this.getReport(aEvent.data.testCase);
		var node = document.createElement('hbox');
		node.setAttribute('class', 'test-finish');
		node.appendChild(document.createElement('label'));
		node.lastChild.setAttribute('style', color);
		node.lastChild.setAttribute('value', report.description);
		parent.appendChild(node);
		gLog.scrollBoxObject.ensureElementIsVisible(node);
	},

	_clearLog: function() {
		var range = document.createRange();
		range.selectNodeContents(gLog);
		range.deleteContents();
		range.detach();
	}
};
