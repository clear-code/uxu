var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils  = lib_module.require('package', 'utils');
var bundle = lib_module.require('package', 'bundle');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner = test_module.require('class', 'runner');
var TestLog = test_module.require('class', 'test_log');
var TestCase = test_module.require('class', 'test_case');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Message = server_module.require('class', 'message');

const Cc = Components.classes;
const Ci = Components.interfaces;

const ObserverService = Cc['@mozilla.org/observer-service;1']
	.getService(Ci.nsIObserverService);

var gOptions;
var gLog;
 
/* UTILITIES */ 
	 
function x() 
{
	var contextNode, path;
	if (arguments[0] instanceof XULElement) {
		contextNode = arguments[0];
		path = arguments[1];
	}
	else {
		path = arguments[0];
		contextNode = document;
	}

	function resolver(prefix)
	{
		switch (prefix)
		{
			case 'xul':
				return 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
				break;
			case 'hy':
				return 'http://hyperstruct.net/';
				break;
			default:
				return null;
		}
	}

	return document.evaluate(
		path, contextNode, resolver,
		XPathResult.ANY_UNORDERED_NODE_TYPE, null).
		singleNodeValue;
}
 
function _(idOrElement, subCriteria) 
{
	var element = (idOrElement instanceof XULElement) ?
		idOrElement : document.getElementById(idOrElement);

	if (subCriteria)
		if (typeof(subCriteria) == 'object') {
			for(var attributeName in subCriteria)
				return x(element, './/*[@' + attributeName + '=' +
						 '"' + subCriteria[attributeName] + '"]');
		} else
			return x(element, './/*[@role="' + subCriteria + '"]');
	else
		return element;
}
 
function clone(aBlueprintName) 
{
	return _('blueprints', aBlueprintName)
		.cloneNode(true);
}
 
function removeChildrenOf(aElement) 
{
	var range = document.createRange();
	range.selectNodeContents(aElement);
	range.deleteContents();
	range.detach();
}
 
function padLeft(aThing, aWidth, aPadder) 
{
	var paddedString = '';
	var string = aThing.toString();
	return (string.length < aWidth) ?
		(function() {
			for (var i = 0, l = aWidth - string.length; i < l; i++)
				paddedString += aPadder;
			return paddedString + string;
		})() :
		string;
}
 
function scrollReportsTo(aTarget) 
{
	if (!aTarget) return;
	_('testcase-reports')
		.boxObject
		.QueryInterface(Ci.nsIScrollBoxObject)
		.ensureElementIsVisible(aTarget);
};
 
function getFailureReports() 
{
	var reports = _('testcase-reports');
	return Array.slice(reports.getElementsByAttribute('report-type', 'failure'));
}
 
function getErrorReports() 
{
	var reports = _('testcase-reports');
	return Array.slice(reports.getElementsByAttribute('report-type', 'error'));
}
  
/* file picker */ 
	
function pickFile(aMode, aOptions) 
{
	if (!aOptions) aOptions = {};
	var mode = 'mode' + (aMode ?
						 aMode[0].toUpperCase() + aMode.substr(1) :
						 'open');
	const nsIFilePicker = Ci.nsIFilePicker;

	var picker = Cc["@mozilla.org/filepicker;1"]
		.createInstance(nsIFilePicker);
	if (aOptions.defaultExtension)
		picker.defaultExtension = aOptions.defaultExtension;

	if (aOptions.defaultFile) {
		var defaultFile = aOptions.defaultFile;
		try {
			defaultFile = defaultFile.QueryInterface(Ci.nsILocalFile)
		}
		catch(e) {
			try {
				defaultFile = utils.makeFileWithPath(defaultFile);
			}
			catch(e) {
				picker.defaultString = defaultFile;
				defaultFile = null;
			}
		}
		if (defaultFile) {
			if (defaultFile.exists() && defaultFile.isDirectory()) {
				picker.displayDirectory = defaultFile;
			}
			else if (!defaultFile.exists() || !defaultFile.isDirectory()) {
					picker.displayDirectory = defaultFile.parent;
			}
		}
	}

	picker.init(window, aOptions.title || '', nsIFilePicker[mode]);
	if (aOptions.filters) {
		for (var filter in aOptions.filters) {
			picker.appendFilter(filter, aOptions.filters[filter]);
		}
	}
	picker.appendFilters((aOptions.filter || 0) | nsIFilePicker.filterAll);
	var result = picker.show();
	if (result == nsIFilePicker.returnOK ||
	   result == nsIFilePicker.returnReplace)
		return picker.file;
}
 
function pickFileUrl(aMode, aOptions) 
{
	var file = pickFile(aMode, aOptions);
	if (file)
		return utils.getURLSpecFromFilePath(file.path);
}
 
const fileDNDObserver = 
{
	
	isTestCase : function(aFile) 
	{
		return aFile && (aFile.isDirectory() || /\.js$/.test(aFile.leafName));
	},
 
	onDrop : function(aEvent, aTransferData, aSession) 
	{
		var file = aTransferData.data;
		if (this.isTestCase(file)) {
			setTestFile(file.path, true);
			updateTestCommands();
			reset();
		}
	},
 
	canDrop : function(aEvent, aSession) 
	{
		if (_('stop').getAttribute('disabled') != 'true')
			return false;
		try {
			var data = nsDragAndDrop.getData(this.getSupportedFlavours());
			if (!data.Count) return false;
			data = data.GetElementAt(0);
			return this.isTestCase(data);
		}
		catch(e) {
			return true;
		}
	},
 
	onDragOver : function(aEvent, aFlavour, aSession) 
	{
	},
 
	onDragExit : function(aEvent, aFlavour, aSession) 
	{
	},
 
	getSupportedFlavours : function () 
	{
		var flavours = new FlavourSet();
		flavours.appendFlavour('application/x-moz-file', 'nsIFile');
		return flavours;
	}
 
}; 
   
/* DOMAIN */ 
	 
function startup() 
{
	gLog = new TestLog();

	if (!isLinux()) {
		ObserverService.addObserver(alwaysRaisedObserver, 'xul-window-registered', false);
		if (utils.getPref('extensions.uxu.mozunit.alwaysRaised'))
			toggleAlwaysRaised();
	}
	ObserverService.addObserver(restartObserver, 'quit-application-requested', false);

	setTestFile(utils.getPref('extensions.uxu.mozunit.lastPath'));
	updateTestCommands();

	_('content').addEventListener('load', onContentLoad, true);

	var running = false;
	if ('arguments' in window &&
		window.arguments &&
		window.arguments.length) {
		gOptions = window.arguments[0];
		if (gOptions instanceof Ci.nsIPropertyBag) {
			var jsobj = {};
			jsobj.testcase   = gOptions.getProperty('testcase');
			jsobj.outputHost = gOptions.getProperty('outputHost');
			jsobj.outputPort = gOptions.getProperty('outputPort');
			jsobj.log        = gOptions.getProperty('log');
			jsobj.rawLog     = gOptions.getProperty('rawLog');
			jsobj.priority   = gOptions.getProperty('priority');
			jsobj.hidden     = gOptions.getProperty('hidden');
			gOptions = jsobj;
		}

		if (gOptions.testcase) {
			var path = gOptions.testcase;
			if (path.indexOf('file://') > -1)
				path = utils.getFilePathFromURLSpec(path);
			setTestFile(path);
		}
		if (gOptions.log && gOptions.log.indexOf('file://') > -1)
			gOptions.log = utils.getFilePathFromURLSpec(gOptions.log);
		if (gOptions.rawLog && gOptions.rawLog.indexOf('file://') > -1)
			gOptions.rawLog = utils.getFilePathFromURLSpec(gOptions.rawLog);
		if (gOptions.testcase) {
			gRemoteRun.onEvent('start');
			runWithDelay(gOptions.priority);
		}
		if (gOptions.hidden) {
			window.setTimeout(function() { window.minimize(); }, 0);
			Array.slice(document.getElementsByTagName('command'))
				.forEach(function(aNode) {
					aNode.setAttribute('disabled', true);
				});
		}
		running = true;
	}

	if (!running) {
		var lastResult = utils.getPref('extensions.uxu.mozunit.lastResults');
		if (lastResult) {
			try {
				eval('lastResult = '+lastResult);
				gLog.items = lastResult;
				buildReportsFromResults(gLog.items);
				onAllTestsFinish();
			}
			catch(e) {
				alert(e);
			}
		}
	}
}
	 
var alwaysRaisedObserver = { 
	observe : function(aSubect, aTopic, aData)
	{
		var win = getXULWindow();
		if (aTopic == 'xul-window-registered' &&
			win.zLevel != win.normalZ) {
			win.zLevel = win.normalZ;
			window.setTimeout(function() {
				win.zLevel = win.highestZ;
			}, 250);
		}
	}
};
 
var restartObserver = { 
	observe : function(aSubect, aTopic, aData)
	{
		if (aTopic != 'quit-application-requested') return;

		if (utils.getPref('extensions.uxu.mozunit.autoStart.oneTime.enabled'))
			utils.setPref('extensions.uxu.mozunit.autoStart.oneTime', true);
	}
};
  
function shutdown() 
{
	if (!isLinux()) {
		ObserverService.removeObserver(alwaysRaisedObserver, 'xul-window-registered');
	}
	ObserverService.removeObserver(restartObserver, 'quit-application-requested');
	_('content').removeEventListener('load', onContentLoad, true);
	hideSource();
}
  
/* test cases */ 
	
function newTestCase() 
{
	var file = pickFile('save', makeTestCaseFileOptions());
	if (file) {
		reset();
		if (file.exists()) file.remove(true);
		setTestFile(file.path, true);
		writeTemplate(file.path);
		window.setTimeout(function() {
			openInEditor(file.path, 4, 29);
		}, 100);
	}
}
	
function writeTemplate(aFilePath) 
{
	var data = utils.readFrom('chrome://uxu/locale/sample.test.js');
	utils.writeTo(data, aFilePath);
}
  
function openTestCase(aIsFolder) 
{
	var file = pickFile((aIsFolder ? 'getFolder' : '' ), makeTestCaseFileOptions(aIsFolder));
	if (file) {
		setTestFile(file.path, true);
		updateTestCommands();
		reset();
	}
}
 
function pickTestFile(aOptions) 
{
	var url = pickFileUrl(null, aOptions);
	if (url) {
		setTestFile(url, true);
		updateTestCommands();
		reset();
	}
}
 
function makeTestCaseFileOptions(aIsFolder) 
{
	return {
		defaultFile : _('file').value,
		defaultExtension : 'test.js',
		filters : {
			'Javascript Files' : '*.test.js'
		},
		title : bundle.getString(aIsFolder ? 'picker_title_open_testcase_folder' : 'picker_title_open_testcase' )
	};
}
 
function getFocusedPath() 
{
	var node = document.popupNode;
	if (node) {
		var file = document.evaluate(
				'ancestor-or-self::*[@role="testcase-report" or local-name()="listitem"]/@source',
				node,
				null,
				XPathResult.STRING_TYPE,
				null
			).stringValue;
		if (file && file.indexOf('file:') > -1)
			return utils.getFilePathFromURLSpec(file);
	}
	return null;
}
  
/* runner */ 
	 
var gRunner; 
 
var runnerListener = { 
	// events from runner
	onError : function(aEvent)
	{
		var e = aEvent.data;
		_('prerun-report', 'error').textContent = bundle.getFormattedString('error_failed', [e.toString()]);
		_('prerun-report', 'error').hidden = false;

		if (utils.hasStackTrace(e)) {
			displayStackTrace(e, _('prerun-report', 'stack-trace'));
			_('prerun-report', 'stack-trace').hidden = false;
			_('prerun-report').hidden = false;
		}
	},
	onProgress : function(aEvent)
	{
		setRunningState(true);
		_('testRunningProgressMeter').setAttribute('value', aEvent.data);
	},
	onAbort : function(aEvent)
	{
		gAborted = true;
		this.onFinish(aEvent);
	},
	onFinish : function(aEvent)
	{
		setRunningState(false);
		onAllTestsFinish();
		aEvent.target.removeListener(this);
	},


	// events from testcases
	onTestCaseStart : function(aEvent)
	{
		gLog.items = aEvent.data.log.items;
		gRemoteRun.onEvent('progress');
		var report = getReport(aEvent.data.testCase.title);
		report.setAttribute('source', aEvent.data.testCase.source);
	},
	onTestCaseTestFinish : function(aEvent)
	{
		gLog.items = aEvent.data.log.items;
		gRemoteRun.onEvent('progress');
		var results = gLog.lastItem.results;
		fillReportFromResult(aEvent.data.testCase.title, results[results.length-1]);
	},
	onTestCaseRemoteTestFinish : function(aEvent)
	{
		gLog.items = aEvent.data.log.items;
		gRemoteRun.onEvent('progress');
		buildReportsFromResults(aEvent.data.data);
	},
	onTestCaseAbort : function(aEvent)
	{
		this.onTestCaseFinish(aEvent);
	},
	onTestCaseFinish : function(aEvent)
	{
		this.onTestCaseTestFinish(aEvent);
		gRemoteRun.onEvent('finish');
	}
};
 
var gRemoteRun = { 
	onEvent : function(aType)
	{
		if (
			!gOptions ||
			(!gOptions.outputHost && !gOptions.outputPort)
			)
			return;

		var msg;
		switch (aType)
		{
			case 'start':
				msg = TestCase.prototype.TESTCASE_STARTED;
				break;
			case 'finish':
				msg = TestCase.prototype.TESTCASE_FINISED;
				break;
			default:
				msg = gLog.toString(gLog.FORMAT_RAW);
				break;
		}
		var message = new Message(msg, gOptions.outputHost, gOptions.outputPort, this);
		message.send();
	},

	onResponse : function(aResponseText)
	{
		if (aResponseText.indexOf(TestCase.prototype.TESTCASE_ABORTED) != 0)
			return;

		if (gRunner) {
			stop();
		}
		else {
			cancelDelayedRun();
			this.onFinish();
		}
	},

	onFinish : function()
	{
		if (gOptions) {
			if (gOptions.log) {
				utils.writeTo(
					gLog.toString(),
					gOptions.log,
					'UTF-8'
				);
			}
			if (gOptions.rawLog) {
				utils.writeTo(
					gLog.toString(gLog.FORMAT_RAW),
					gOptions.rawLog,
					'UTF-8'
				);
			}
			if (gOptions.testcase && (gOptions.hidden || gOptions.log || gOptions.rawLog)) {
				const startup = Cc['@mozilla.org/toolkit/app-startup;1']
								.getService(Ci.nsIAppStartup);
				startup.quit(startup.eForceQuit);
				return;
			}
		}
	}
};
 	
function onAllTestsFinish() 
{
	utils.setPref(
		'extensions.uxu.mozunit.lastResults',
		gLog.toString(gLog.FORMAT_RAW)
	);

	if (!_('content').collapsed && contentAutoExpanded) {
		toggleContent();
	}

	_('saveReport').removeAttribute('disabled');

	stopAllProgressMeters();

	gRemoteRun.onFinish();

	if (gAborted) {
		_('testResultStatus').setAttribute('label', bundle.getString('all_abort'));
		return;
	}
	else if (gFailureCount || gErrorCount) {
		_('runFailed').removeAttribute('disabled');
		var failures = getFailureReports();
		var errors = getErrorReports();
		scrollReportsTo(failures.length ? failures[0] : errors[0]);
		_('testResultStatus').setAttribute('label', bundle.getString('all_result_problem'));
	}
	else {
		scrollReportsTo(_('testcase-reports').firstChild);
		_('testResultStatus').setAttribute('label',
			bundle.getString(gPassOverCount ? 'all_result_done' : 'all_result_success' )
		);
	}
	_('testResultStatistical').hidden = false;
	_('testResultStatistical').setAttribute('label',
		bundle.getFormattedString(
			'all_result_statistical',
			[gTotalCount, gSuccessCount, gFailureCount, gErrorCount, gPassOverCount]
		)
	);
};
 
function displayStackTrace(aException, aListbox) 
{
	displayStackTraceLines(utils.formatStackTraceForDisplay(aException), aListbox);
}
function displayStackTraceLines(aLines, aListbox)
{
	aLines.forEach(function(aLine) {
		if (!aLine) return;
		var item = document.createElement('listitem');
		item.setAttribute('label', aLine);
		item.setAttribute('crop', 'center');
		var source = utils.unformatStackLine(aLine).source;
		if (source) item.setAttribute('source', source);
		aListbox.appendChild(item);
	});
}
 
function reset() 
{
	gAborted = false;
	gTotalCount    = 0;
	gSuccessCount  = 0;
	gPassOverCount = 0;
	gErrorCount    = 0;
	gFailureCount  = 0;
	_('runFailed').setAttribute('disabled', true);
	_('prerun-report', 'error').hidden = true;
	_('prerun-report', 'stack-trace').hidden = true;
	_('testResultStatus').setAttribute('label', '');
	_('testResultStatistical').setAttribute('label', '');
	_('testResultStatistical').hidden = true;
	removeChildrenOf(_('prerun-report', 'stack-trace'));
	removeChildrenOf(_('testcase-reports'))
	hideSource();
	_('saveReport').setAttribute('disabled', true);
	gLog.clear();
}
var gAborted = false;
var gTotalCount    = 0;
var gSuccessCount  = 0;
var gPassOverCount = 0;
var gErrorCount    = 0;
var gFailureCount  = 0;
 
function setRunningState(aRunning) 
{
	if (aRunning) {
		_('run-box').setAttribute('hidden', true);
		_('run').setAttribute('disabled', true);
		_('runPriority').setAttribute('disabled', true);
		_('runAll').setAttribute('disabled', true);
		_('runFailed').setAttribute('disabled', true);
		_('stop-box').removeAttribute('hidden');
		_('stop').removeAttribute('disabled');
		_('testRunningProgressMeter').setAttribute('mode', 'determined');
		_('testRunningProgressMeterPanel').removeAttribute('collapsed');
		_('testResultStatus').setAttribute('label', bundle.getString('all_wait'));
	}
	else {
		_('run-box').removeAttribute('hidden');
		_('run').removeAttribute('disabled');
		_('runPriority').removeAttribute('disabled');
		_('runAll').removeAttribute('disabled');
		_('runFailed').setAttribute('disabled', true);
		_('stop-box').setAttribute('hidden', true);
		_('stop').setAttribute('disabled', true);
		_('testRunningProgressMeter').setAttribute('mode', 'undetermined');
		_('testRunningProgressMeterPanel').setAttribute('collapsed', true);
	}
}
 
function run(aMasterPriority) 
{
	reset();

	gRunner = new Runner(_('content'), [_('file').value]);

	gRunner.addListener(runnerListener);

	gRunner.run(null, aMasterPriority);
}
	
function runByPref() 
{
	run(utils.getPref('extensions.uxu.mozunit.runMode') == 1 ? 'must' : null );
}
 
function runWithDelay(aMasterPriority) 
{
	_delayedRunTimer = window.setTimeout(function() {
		_delayedRunTimer = null;
		run(aMasterPriority);
	}, 0);
}
function cancelDelayedRun()
{
	if (!_delayedRunTimer) return;
	window.clearTimeout(_delayedRunTimer);
	_delayedRunTimer = null;
}
var _delayedRunTimer = null;
  
function runFailed() 
{
	var failedTests = {};
	[].concat(getFailureReports()).concat(getErrorReports())
		.forEach(function(aTestReport) {
			var title = aTestReport.parentNode.parentNode.getAttribute('title');
			if (title in failedTests) return;
			failedTests[title] = true;
		});

	reset();

	gRunner = new Runner(_('content'), [_('file').value]);

	gRunner.addListener(runnerListener);

	gRunner.addTestFilter(function(aTestCase) {
		aTestCase.masterPriority = 'must';
		return aTestCase.title in failedTests;
	});

	gRunner.run();
}
 
function stop() 
{
	if (gRunner) gRunner.abort();
	gRunner = null;
	_('stop').setAttribute('disabled', true);
}
  
/* UI */ 
	 
function getReport(aTitle) 
{
	var id = 'testcase-report-'+encodeURIComponent(aTitle);
	return _(id) ||
		(function() {
			var wTestCaseReport = clone('testcase-report');
			wTestCaseReport.setAttribute('id', id);
			wTestCaseReport.setAttribute('title', aTitle);
			_(wTestCaseReport, 'title').textContent = aTitle;
			_(wTestCaseReport, 'bar').setAttribute('class', 'testcase-fine');
			_('testcase-reports').appendChild(wTestCaseReport);
			scrollReportsTo(wTestCaseReport);
			return wTestCaseReport;
		})();
}
 
function fillReportFromResult(aTitle, aResult) 
{
	var id = 'test-report-'+encodeURIComponent(aTitle)+'-'+aResult.index;
	if (_(id)) return;

	var reportNode = getReport(aTitle);

	_(reportNode, 'bar').setAttribute('mode', 'determined');
	_(reportNode, 'bar').setAttribute('value', aResult.percentage);
	_(reportNode, 'total-counter').value = aResult.step.split('/')[1];

	_(reportNode, 'bar').setAttribute('testcase-results',
		_(reportNode, 'bar').getAttribute('testcase-results')+
		' '+aResult.type
	);

	var dummyTestReport = document.createElement('data');
	dummyTestReport.setAttribute('id', id);

	gTotalCount++;
	switch (aResult.type)
	{
		case 'success':
			gSuccessCount++;
			var successes = parseInt(_(reportNode, 'success-counter').value);
			_(reportNode, 'success-counter').value = successes + 1;
			_(reportNode).appendChild(dummyTestReport);
			return;
		case 'passover':
			gPassOverCount++;
			var passover = parseInt(_(reportNode, 'passover-counter').value);
			_(reportNode, 'passover-counter').value = passover + 1;
			_(reportNode).appendChild(dummyTestReport);
			return;
		case 'failure':
			gFailureCount++;
			break;
		case 'error':
			gErrorCount++;
			break;
		default:
			break;
	}

	_(reportNode, 'bar').setAttribute('class', 'testcase-problems');

	var wTestReport = clone('test-report');
	wTestReport.setAttribute('id', id);
	_(wTestReport, 'result').value = bundle.getString('report_result_'+aResult.type);
	_(wTestReport, 'icon').setAttribute('class', 'test-' + aResult.type);
	_(wTestReport, 'description').textContent = aResult.title;
	_(wTestReport, 'description').setAttribute('tooltiptext', aResult.title);
	_(wTestReport).setAttribute('report-type', aResult.type);

	if (aResult.expected) {
		_(wTestReport, 'expected-value').textContent = aResult.expected;
		_(wTestReport, 'expected-row').removeAttribute('hidden');
	}
	if (aResult.actual) {
		_(wTestReport, 'actual-value').textContent = aResult.actual;
		_(wTestReport, 'actual-row').removeAttribute('hidden');
	}
	if (aResult.expected || aResult.actual) {
		_(wTestReport, 'vs').removeAttribute('hidden');
	}
	if (aResult.diff) {
		_(wTestReport, 'diff-value').textContent = aResult.diff;
		_(wTestReport, 'diff-row').removeAttribute('hidden');
	}
	if (aResult.description) {
		_(wTestReport, 'additionalInfo').textContent = aResult.description;
	}
	if (aResult.stackTrace && aResult.stackTrace.length) {
		displayStackTraceLines(aResult.stackTrace, _(wTestReport, 'stack-trace'));
		_(wTestReport, 'stack-trace').hidden = false;
	}

	_(reportNode, 'test-reports').appendChild(wTestReport);
	scrollReportsTo(wTestReport);
}
 
function buildReportsFromResults(aResults) 
{
	aResults.forEach(function(aResult) {
		var report = getReport(aResult.title);
		report.setAttribute('source', aResult.source);
		aResult.results.forEach(function(aOneResult) {
			fillReportFromResult(aResult.title, aOneResult);
		});
	});
}
 
function isLinux() 
{
	return /linux/i.test(navigator.platform);
}
 
function setTestFile(aPath, aClear) 
{
	_('file').value = aPath;
	utils.setPref('extensions.uxu.mozunit.lastPath', aPath);

	if (aClear) {
		utils.setPref('extensions.uxu.mozunit.lastResults', '');
	}
}
 
function updateRunMode() 
{
	var runPriority = _('runPriority');
	var runAll = _('runAll');
	var label;
	switch (utils.getPref('extensions.uxu.mozunit.runMode'))
	{
		default:
		case 0:
			label = runPriority.getAttribute('label-default');
			runPriority.setAttribute('label', label);
			label = runAll.getAttribute('label-normal');
			runAll.setAttribute('label', label);
			break;

		case 1:
			label = runPriority.getAttribute('label-normal');
			runPriority.setAttribute('label', label);
			label = runAll.getAttribute('label-default');
			runAll.setAttribute('label', label);
			break;
	}
}
 
function goUpdateCommand(aCommand) 
{
	var node = document.getElementById(aCommand);
	if (!node) return;
	try {
		var controller = document.commandDispatcher.getControllerForCommand(aCommand);
		var enabled = false
		if (controller)
			enabled = controller.isCommandEnabled(aCommand);
		if (enabled)
			node.removeAttribute('disabled');
		else
			node.setAttribute('disabled', true);
	}
	catch(e) {
	}
}
 
function updateEditItems() 
{
	goUpdateCommand('cmd_copy');
}
 
function updateViewItems() 
{
	if (isLinux()) {
		_('alwaysRaised-menuitem').setAttribute('hidden', true);
	}
	else {
		var alwaysRaised = _('alwaysRaised');
		var win = getXULWindow();
		if (win.zLevel == win.normalZ)
			alwaysRaised.removeAttribute('checked');
		else
			alwaysRaised.setAttribute('checked', true);
	}

	var toggleContent = _('toggleContent');
	if (_('content').collapsed)
		toggleContent.removeAttribute('checked');
	else
		toggleContent.setAttribute('checked', true);
}
 
function updateTestCommands() 
{
	var file = _('file').value;
	if (file &&
		(file = utils.makeFileWithPath(file)) &&
		file.exists()) {
		_('run').removeAttribute('disabled');
		_('runPriority').removeAttribute('disabled');
		_('runAll').removeAttribute('disabled');
		_('runOptions-menu').removeAttribute('disabled');
		_('runOptions-button').removeAttribute('disabled');
		if (!file.isDirectory())
			_('edit').removeAttribute('disabled');
		else
			_('edit').setAttribute('disabled', true);
	}
	else {
		_('run').setAttribute('disabled', true);
		_('runPriority').setAttribute('disabled', true);
		_('runAll').setAttribute('disabled', true);
		_('runOptions-menu').setAttribute('disabled', true);
		_('runOptions-button').setAttribute('disabled', true);
		_('edit').setAttribute('disabled', true);
	}
}
 
function updateContextMenu() 
{
	updateEditItems();

	if (getFocusedPath()) {
		_('editThis-menuitem').removeAttribute('hidden');
		_('editThis-separator').removeAttribute('hidden');
	}
	else {
		_('editThis-menuitem').setAttribute('hidden', true);
		_('editThis-separator').setAttribute('hidden', true);
	}
}
 
function stopAllProgressMeters() 
{
	var nodes = document.evaluate(
			'/descendant::*[local-name()="progressmeter" and @mode="undetermined" and not(ancestor::*[@id="blueprints"])]',
			document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
	for (var i = 0, maxi = nodes.snapshotLength; i < maxi; i++)
	{
		nodes.snapshotItem(i).setAttribute('mode', 'determined');
	}
}
  
/* commands */ 
	
function saveReport(aPath, aFormat) 
{
	var file;
	if (!aPath) {
		var picked = pickFile(
				'save', {
					defaultFile : 'log.txt',
					defaultExtension : 'txt',
					filters : {
						'Text Files' : '*.txt'
					},
					title : bundle.getString('log_picker_title')
				}
			);
		if (!picked) return;
		file = picked;
	}
	else {
		file = utils.makeFileWithPath(aPath);
	}

	if (file.exists()) file.remove(true);
	utils.writeTo(
		gLog.toString(aFormat),
		file.path,
		'UTF-8'
	);
}
 
function openInEditor(aFilePath, aLineNumber, aColumnNumber, aCommandLine) 
{
	if (utils.makeFileWithPath(aFilePath).isDirectory()) {
		return;
	}

	aLineNumber = aLineNumber || 1;
	aColumnNumber = aColumnNumber || 1;
	aCommandLine = aCommandLine ||
		utils.getPref('extensions.uxu.mozunit.editor') ||
		utils.getPref('extensions.mozlab.mozunit.editor') ||
		(utils.getPref('view_source.editor.path') ?
			'"'+utils.getPref('view_source.editor.path')+'" "%f"' : '') ||
		'/usr/bin/x-terminal-emulator -e /usr/bin/emacsclient -t +%l:%c %f';

	var tokens = [''];
	var quot   = '';
	var char;
	for (var i = 0, maxi = aCommandLine.length; i < maxi; i++)
	{
		char = aCommandLine.charAt(i);
		if (char == '"' || char == "'") {
			if (quot) {
				quot = '';
				tokens.push('');
				continue;
			}
			else {
				quot = char;
				continue;
			}
		}
		else if (/\s/.test(char)) {
			if (!quot) {
				if (tokens[tokens.length-1]) tokens.push('');
				continue;
			}
		}
		tokens[tokens.length-1] += char;
	}

	var argv = tokens.map(
		function(word) {
			return word.
				replace('%l', aLineNumber).
				replace('%c', aColumnNumber).
				replace('%u', utils.getURLSpecFromFilePath(aFilePath)).
				replace('%f', aFilePath);
		});

	var editorPath;
	var executable = Cc["@mozilla.org/file/local;1"].
		createInstance(Ci.nsILocalFile);
	var process = Cc["@mozilla.org/process/util;1"].
		createInstance(Ci.nsIProcess);
	try {
		editorPath = argv.shift();
		executable.initWithPath(editorPath);
		process.init(executable);
		process.run(false, argv, argv.length);
		return;
	}
	catch(e) {
		editorPath = '';
	}
	if (!editorPath || !executable.exists()) {
		var editor = pickFile('open', {
				title : bundle.getString('picker_title_external_editor'),
				defaultExtension : 'exe',
				filter : Ci.nsIFilePicker.filterApps
			});
		if (!editor || !editor.path) return;
		utils.setPref('extensions.uxu.mozunit.editor', '"'+editor.path+'" "%f"');
		arguments.callee(aFilePath, aLineNumber, aColumnNumber);
	}
}
 
function toggleAlwaysRaised() 
{
	var win = getXULWindow();
	win.zLevel = (win.zLevel == win.normalZ) ?
			win.highestZ : win.normalZ;
	utils.setPref('extensions.uxu.mozunit.alwaysRaised', win.zLevel != win.normalZ);
}
	
function getXULWindow() 
{
	return window
		.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIWebNavigation)
		.QueryInterface(Ci.nsIDocShellTreeItem)
		.treeOwner
		.QueryInterface(Ci.nsIInterfaceRequestor)
		.getInterface(Ci.nsIXULWindow);
}
  
function toggleContent() 
{
	_('content').collapsed = !_('content').collapsed;
	_('content-splitter').hidden = !_('content-splitter').hidden;
}
	
var contentAutoExpanded = false; 
 
function onContentLoad() 
{
	if (!utils.getPref('extensions.uxu.mozunit.autoShowContent')) return;
	if (_('content').collapsed) {
		contentAutoExpanded = true;
		toggleContent();
	}
	else if (content.location.href == 'about:blank' && contentAutoExpanded) {
		contentAutoExpanded = false;
		toggleContent();
	}
}
  
function showSource(aTraceLine) 
{
	var unformatted = utils.unformatStackLine(aTraceLine);
	if (!unformatted.source || !unformatted.line) return;

	var frame = _('source-viewer', 'source');
	var opened = !_('source-splitter').hidden;
	_('source-splitter').hidden = false;
	_('source-viewer').collapsed = false;
	if (!opened && utils.getPref('extensions.uxu.mozunit.autoExpandWindow.sourceViewer')) {
		window.resizeBy(
			_('source-splitter').boxObject.width +
			_('source-viewer').boxObject.width,
			0
		);
	}

	var frame = _('source-viewer', 'source');
	function onLoad(aEvent)
	{
		frame.removeEventListener('load', arguments.callee, true);

		if (frame.contentDocument.documentElement.getAttribute('formatted') == 'true') return;
		frame.contentDocument.documentElement.setAttribute('formatted', true);

		stylizeSource(
			frame.contentDocument,
			function(aSourceDoc, aNumber, aContent)
			{
				aContent = padLeft(aNumber, 3, 0) + ' ' + aContent + '\n';

				if (aNumber == unformatted.line) {
					var currentLine = aSourceDoc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
					currentLine.setAttribute('id', 'current');
					currentLine.textContent = aContent;

					if (unformatted.source.match(/^file:\/\//)) {
						currentLine.setAttribute('class', 'link');
						currentLine.addEventListener('click', function(aEvent) {
							openInEditor(utils.getFilePathFromURLSpec(unformatted.source), unformatted.line);
						}, false);
					}

					return currentLine;
				}
				else {
					return aSourceDoc.createTextNode(aContent);
				}
			}
		);

		frame.contentWindow.scrollTo(
			0,
			(frame.contentDocument.getElementById('current').offsetTop -
				frame.contentWindow.innerHeight/2)
		);
	}

	frame.addEventListener('load', onLoad, true);
	frame.webNavigation.loadURI(
		unformatted.source,
		Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE,
		null, null, null
	);
}
	
function stylizeSource(aSourceDocument, aLineCallback) 
{
	var originalSource = aSourceDocument.getElementsByTagName('pre')[0];
	var processedSource = aSourceDocument.createElementNS('http://www.w3.org/1999/xhtml', 'pre');
	var sourceLines = originalSource.textContent.split('\n');
	var sourceLine, htmlLine, lineContent;
	for(var i=0, l=sourceLines.length; i<l; i++) {
		if (aLineCallback)
			htmlLine = aLineCallback(aSourceDocument, i+1, sourceLines[i]) ||
				aSourceDocument.createTextNode(sourceLines[i]);

		processedSource.appendChild(htmlLine)
	}
	processedSource.normalize();
	originalSource.parentNode.replaceChild(processedSource, originalSource);

	var cssElem = aSourceDocument.createElementNS('http://www.w3.org/1999/xhtml', 'style');
	cssElem.type = 'text/css';
	cssElem.textContent =
		'body { margin: 0; }' +
		'#current { font-weight: bold; background-color: #e5e5e5; }' +
		'.link { color: blue; border-bottom: thin solid blue; cursor: pointer; }';

	aSourceDocument.getElementsByTagName('head')[0].appendChild(cssElem);
}
 
function hideSource() 
{
	if (_('source-splitter').hidden) return;
	if (utils.getPref('extensions.uxu.mozunit.autoExpandWindow.sourceViewer')) {
		window.resizeBy(
			-_('source-splitter').boxObject.width
			-_('source-viewer').boxObject.width,
			0
		);
	}
	_('source-viewer').collapsed = true;
	_('source-splitter').hidden = true;
}
  
function goDoCommand(aCommand) 
{
	try {
		var controller = document.commandDispatcher.getControllerForCommand(aCommand);
		if (controller && controller.isCommandEnabled(aCommand))
			controller.doCommand(aCommand);
	}
	catch(e) {
	}
}
 
function showPage(aURI) 
{
	var recentWindow = Cc['@mozilla.org/appshell/window-mediator;1']
		.getService(Ci.nsIWindowMediator)
		.getMostRecentWindow('navigator:browser');
	if (recentWindow) {
		if (recentWindow.content.location.href == 'about:blank')
			recentWindow.loadURI(aURI);
		else
			recentWindow.gBrowser.selectedTab = recentWindow.gBrowser.addTab(aURI);
	}
	else {
		try {
			window.open(aURI);
		}
		catch(e) {
			// Thunderbird
			var uri = Cc['@mozilla.org/network/io-service;1']
					.getService(Ci.nsIIOService)
					.newURI(aURI, null, null);
			var service = Cc['@mozilla.org/uriloader/external-protocol-service;1']
					.getService(Ci.nsIExternalProtocolService);
					service.loadUrl(uri);
		}
	}
}
 
function restartApplication() 
{
	utils.restartApplication();
}
  
