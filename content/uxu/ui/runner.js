/**
 * Copyright (C) 2006 by Massimiliano Mirra
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA	02110-1301 USA
 *
 * Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>
 */
var ns = {}; 
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/lib/inherit.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/server/message.js', ns);
Components.utils.import('resource://uxu-modules/server/server.js', ns);
Components.utils.import('resource://uxu-modules/server/context.js', ns);
Components.utils.import('resource://uxu-modules/server/reporter.js', ns);
Components.utils.import('resource://uxu-modules/test/runner.js', ns);
Components.utils.import('resource://uxu-modules/test/log.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);

var utils = ns.utils;
utils.exportToDocument(document);

var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

const Cc = Components.classes;
const Ci = Components.interfaces;

const ObserverService = Cc['@mozilla.org/observer-service;1']
	.getService(Ci.nsIObserverService);

const WindowMediator = Cc['@mozilla.org/appshell/window-mediator;1']
	.getService(Ci.nsIWindowMediator);

var gLog;
var gBrowser;
 
/* UTILITIES */ 
	
function _(idOrElement, subCriteria) 
{
	var element = $(idOrElement);
	if (subCriteria) {
		if (typeof(subCriteria) == 'object') {
			for (var attributeName in subCriteria)
			{
				return $X(
						'.//*[@'+attributeName+'="'+subCriteria[attributeName]+'"]',
						element,
						XPathResult.ANY_UNORDERED_NODE_TYPE
					);
			}
		}
		else {
			return $X(
					'.//*[@role="'+subCriteria+'"]',
					element,
					XPathResult.ANY_UNORDERED_NODE_TYPE
				);
		}
	}
	else {
		return element;
	}
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
	var boxObject = _('testcase-reports').boxObject;
	try { // for old Gecko
		if (boxObject instanceof Ci.nsIBoxObject &&
			'nsIScrollBoxObject' in Ci)
			boxObject = boxObject.QueryInterface(Ci.nsIScrollBoxObject);
	}
	catch(e) {
	}
	boxObject.ensureElementIsVisible(aTarget);
};
 
function getFailureReports() 
{
	var reports = _('testcase-reports');
	return Array.slice(reports.getElementsByAttribute('report-type', ns.TestCase.prototype.RESULT_FAILURE));
}
 
function getErrorReports() 
{
	var reports = _('testcase-reports');
	return Array.slice(reports.getElementsByAttribute('report-type', ns.TestCase.prototype.RESULT_ERROR));
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
			picker.defaultString = defaultFile.leafName;
		}
		catch(e) {
			try {
				defaultFile = utils.makeFileWithPath(defaultFile);
				picker.defaultString = defaultFile.leafName;
			}
			catch(e) {
				picker.defaultString = defaultFile;
			}
		}
		if (defaultFile && typeof defaultFile == 'object') {
			if (defaultFile.exists() && defaultFile.isDirectory()) {
				picker.displayDirectory = defaultFile;
			}
			else if (!defaultFile.exists() || !defaultFile.isDirectory()) {
					picker.displayDirectory = defaultFile.parent;
			}
			defaultFile = defaultFile.leafName;
		}
	}

	picker.init(window, aOptions.title || '', nsIFilePicker[mode]);
	if (aOptions.filters) {
		let count = 0;
		for (let label in aOptions.filters)
		{
			let filter = aOptions.filters[label];
			picker.appendFilter(label+' ('+filter+')', filter);
			try {
				if (new RegExp(filter.replace(/\./g, '\\.').replace(/\*/g, '.*'), 'i').test(defaultFile))
					picker.filterIndex = count
			}
			catch(e) {
			}
			count++;
		}
	}
	picker.appendFilters((aOptions.filter || 0) | nsIFilePicker.filterAll);
	var result = picker.show();
	if (result == nsIFilePicker.returnOK ||
		result == nsIFilePicker.returnReplace)
		return picker.file;

	return null;
}
 
function pickFileUrl(aMode, aOptions) 
{
	var file = pickFile(aMode, aOptions);
	if (file)
		return utils.getURLSpecFromFilePath(file.path);
}
 
const fileDNDObserver = 
{
	
	mayBeTestCase : function(aFile) 
	{
		if (!aFile) return false;
		aFile = aFile.QueryInterface(Ci.nsILocalFile);
		return aFile.isDirectory() || /\.js$/.test(aFile.leafName);
	},
 
	get browserWindow() 
	{
		return WindowMediator.getMostRecentWindow('navigator:browser');
	},
 
	onDrop : function(aEvent, aTransferData, aSession) 
	{
		var file = aTransferData.data;
		file = utils.normalizeToFile(file);
		if (this.mayBeTestCase(file)) {
			setTestFile(file.path, true);
			updateTestCommands();
			reset();
		}
		else if (this.browserWindow) {
			this.browserWindow.loadURI(utils.getURLSpecFromFile(file));
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
			data = utils.normalizeToFile(data);
			return this.mayBeTestCase(data) || this.browserWindow;
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
		flavours.appendFlavour('text/x-moz-url');
		return flavours;
	}
 
}; 
 
function getLastResultFile
{
	var file = utils.getFileFromKeyword('ProfD');
	utils.append('uxu.lastResult.js');
	return file;
}
   
/* DOMAIN */ 
	
function Startup() 
{
	ns.Utils.internalLoader = $('internal-loader');

	gLog = new ns.TestLog();

	if (!isLinux()) {
		ObserverService.addObserver(alwaysRaisedObserver, 'xul-window-registered', false);
		if (utils.getPref('extensions.uxu.runner.alwaysRaised'))
			toggleAlwaysRaised();
	}
	ObserverService.addObserver(restartObserver, 'quit-application-requested', false);

	var defaultTestPath = utils.getPref('extensions.uxu.runner.lastPath');

	setTestFile(defaultTestPath);
	updateTestCommands();

	gBrowser = _('content');
	gBrowser.addEventListener('load', onContentLoad, true);

	var result = handleOptions();
	if (result && result.path)
		defaultTestPath = result.path;

	if (utils.getPref('extensions.uxu.runner.autoStart.server'))
		startServer();

	if (
		gRemoteRun.pinging ||
		gOptions.testcase ||
		!restoreLastResult()
		)
		_('mainDeck').selectedIndex = 1;

	// ‹Œ”Å‚Ìpersist‘®«‚É‚æ‚Á‚Ä•Û‘¶‚³‚ê‚Ä‚¢‚½’l‚ª•œŒ³‚³‚ê‚Ä‚µ‚Ü‚Á‚½ê‡‚Ì‚½‚ß‚É
	window.setTimeout(setTestFile, 0, defaultTestPath, false);

	initializeMode();
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
 
function restoreLastResult()
{
	var lastResultFile = getLastResultFile();
	if (!lastResultFile.exists())
		return false;

	var lastResult = utils.readFrom(lastResultFile, 'UTF-8');
	if (!lastResult)
		return false;

	var mainDeck = _('mainDeck');
	mainDeck.selectedIndex = 0;
	try {
		gLog.items = utils.evalInSandbox(lastResult).items;
		var current = 0;
		var step = 20;
		var progress = _('initializingProgress');
		progress.setAttribute('mode', 'determined');

		var lastResultTimer = window.setInterval(function() {
				try {
				var items = gLog.items.slice(current, step);
				current += step;
				if (items.length) {
					progress.setAttribute('value', Math.min(100, parseInt(current / gLog.items.length * 100)));
					buildReports(gLog.items);
				}
				else {
					window.clearInterval(lastResultTimer);
					updateUIForAllTestsFinish();
					mainDeck.selectedIndex = 1;
				}
				}
				catch(e) {
					alert(e+'\n'+lastResult);
					window.clearInterval(lastResultTimer);
					mainDeck.selectedIndex = 1;
				}
			}, 50);
	}
	catch(e) {
		alert(e+'\n'+lastResult);
		mainDeck.selectedIndex = 1;
	}
	return true;
}
 
var gOptions;
function handleOptions()
{
	var returnValue = {};
	gOptions = {};

	if (!('arguments' in window) ||
		!window.arguments ||
		!window.arguments.length)
		return returnValue;

	gOptions = window.arguments[0] || {};
	if (gOptions instanceof Ci.nsIPropertyBag)
		gOptions = utils.toHash(gOptions);

	if (gOptions.testcase) {
		let path = gOptions.testcase;
		if (path.indexOf('file://') > -1)
			path = utils.getFilePathFromURLSpec(path);
		setTestFile(path);
		returnValue.path = path;
	}

	if (gOptions.log && gOptions.log.indexOf('file://') > -1)
		gOptions.log = utils.getFilePathFromURLSpec(gOptions.log);
	if (gOptions.rawLog && gOptions.rawLog.indexOf('file://') > -1)
		gOptions.rawLog = utils.getFilePathFromURLSpec(gOptions.rawLog);

	if (gOptions.testcase) {
		if (gOptions.outputHost || gOptions.outputPort)
			gRemoteRun.onEvent('start');
		runWithDelay(gOptions.priority);
	}

	if (gOptions.hidden) {
		window.setTimeout(function() {
			window.minimize();
			var console = WindowMediator.getMostRecentWindow('global:console');
			if (console)
				console.minimize();
			var browserConsole = WindowMediator.getMostRecentWindow('devtools:webconsole');
			if (browserConsole)
				browserConsole.minimize();
		}, 0);
		Array.slice(document.getElementsByTagName('command'))
			.forEach(function(aNode) {
				aNode.setAttribute('disabled', true);
			});
	}

	if (gOptions.outputHost || gOptions.outputPort)
		gRemoteRun.startPinging();

	if (gOptions.server || gOptions.serverPort) {
		stopServer();
		startServer(gOptions.serverPort || 0);
	}

	return returnValue;
}
 
var restartObserver = { 
	observe : function(aSubect, aTopic, aData)
	{
		if (aTopic != 'quit-application-requested') return;

		if (utils.getPref('extensions.uxu.runner.autoStart.oneTime.enabled')) {
			utils.setPref('extensions.uxu.runner.autoStart.oneTime', true);
			if (gServer) {
				utils.setPref('extensions.uxu.runner.autoStart.oneTime.server', true);
				utils.setPref('extensions.uxu.runner.autoStart.oneTime.port', gServer.port);
			}
		}
	}
};
  
function Shutdown() 
{
	stopServer();

	gRemoteRun.stopPinging();

	if (!isLinux()) {
		ObserverService.removeObserver(alwaysRaisedObserver, 'xul-window-registered');
	}
	ObserverService.removeObserver(restartObserver, 'quit-application-requested');
	_('content').removeEventListener('load', onContentLoad, true);
	hideSource();

	if (ns.Utils.internalLoader == $('internal-loader'))
		ns.Utils.internalLoader = null;
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
 
function getFocusedFile() 
{
	var info = { path : null, line : 0 };
	var node = document.popupNode;
	if (node) {
		node = $X(
				'ancestor-or-self::*[(@role="testcase-report" or local-name()="listitem") and starts-with(@source, "file:")][1]',
				node,
				XPathResult.FIRST_ORDERED_NODE_TYPE
			);
	}
	if (node) {
		info.path = utils.getFilePathFromURLSpec(node.getAttribute('source'));
		info.line = node.getAttribute('line') || 0;
	}
	return info;
}
  
/* runner */ 
	
var gRunner; 
 
var runnerListener = { 
	// events from runner
	onError : function(aEvent)
	{
		var e = aEvent.data;
		var report = clone('prerun-report');
		_('testcase-reports').appendChild(report);
		_(report, 'error').textContent = bundle.getFormattedString('error_failed', [e.toString()]);
		if (utils.hasStackTrace(e)) {
			displayStackTrace(e, _(report, 'stack-trace'));
			_(report, 'stack-trace').hidden = false;
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
		var node = getReportNode(aEvent.data.testCase);
		var item = gLog.getItemFor(aEvent.data.testCase);
		item.doneTopicsCount = 0;
		node.setAttribute('source', aEvent.data.testCase.source);
	},
	onTestCaseTestStart : function(aEvent)
	{
		var test = aEvent.data.data;
		gRemoteRun.onEvent('test-start', {
			hash : test.hash,
			name : encodeURIComponent(test.name)
		});
		var node = getReportNode(aEvent.data.testCase);
		_(node, 'running-status').setAttribute('value',
			bundle.getFormattedString('status_running', [test.title])
		);
	},
	onTestCaseTestFinish : function(aEvent)
	{
		gLog.items = aEvent.data.log.items;
		gRemoteRun.onEvent('progress');
		var item = gLog.getItemFor(aEvent.data.testCase);
		item.topics
			.slice(item.doneTopicsCount || 0)
			.forEach(function(aOneTopic) {
				fillReportFromTopic(aOneTopic, aEvent.data.testCase);
			});
		item.doneTopicsCount = item.topics.length;
	},
	onTestCaseRemoteTestStart : function(aEvent)
	{
		this.onTestCaseTestStart(aEvent);
	},
	onTestCaseRemoteTestFinish : function(aEvent)
	{
		gLog.items = aEvent.data.log.items;
		gRemoteRun.onEvent('progress');
		buildReports(aEvent.data.data);
	},
	onTestCaseAbort : function(aEvent)
	{
		this.onTestCaseFinish(aEvent);
	},
	onTestCaseFinish : function(aEvent)
	{
		this.onTestCaseTestFinish(aEvent);
		gRemoteRun.onEvent('finish');
		updateTestCountInModeButtons();
	}
};
 
var gRemoteRun = { 
	messages : [],

	onEvent : function(aType, aData)
	{
		if (
			!gOptions ||
			(!gOptions.outputHost && !gOptions.outputPort)
			)
			return;

		switch (aType)
		{
			case 'start':
				this.addMessage(ns.TestCase.prototype.TESTCASE_STARTED);
				break;
			case 'test-start':
				this.addMessage(ns.TestCase.prototype.TEST_STARTED + JSON.stringify(aData));
				break;
			case 'finish':
				this.addMessage(gLog.toString(gLog.FORMAT_RAW | gLog.WITH_CONSOLE_LOGS));
				this.addMessage(ns.TestCase.prototype.TESTCASE_FINISED);
				break;
			case 'finish-all':
				this.addMessage(gLog.toString(gLog.FORMAT_RAW | gLog.WITH_CONSOLE_LOGS));
				this.addMessage(ns.TestCase.prototype.ALL_TESTS_FINISHED);
				break;
			default:
				this.addMessage(gLog.toString(gLog.FORMAT_RAW | gLog.WITH_CONSOLE_LOGS));
				break;
		}
		utils.clearConsoleContents();
		this.sendMessage();
	},

	addMessage : function(aMessage)
	{
		this.messages.push(new ns.Message(aMessage, gOptions.outputHost, gOptions.outputPort));
	},
	sendMessage : function()
	{
		if (!this.sending && this.messages.length) {
			this.sending = true;
			this.messages[0].send()
				.then((function(aResponseText) {
					this.sending = false;
					this.handleResponse(aResponseText);
				}).bind(this));
		}
	},
	sending : false,

	handleResponse : function(aResponseText)
	{
		if (aResponseText.indexOf(ns.TestCase.prototype.TESTCASE_ABORTED) == 0) {
			if (gRunner) {
				stop();
			}
			else {
				cancelDelayedRun();
				this.onFinish();
			}
			return;
		}

		if (this.lastResponse != aResponseText) {
			this.lastResponse = aResponseText;

			let sent = this.messages.shift();
			if (sent) {
				sent.destroy();
				if (sent.message.indexOf(ns.TestCase.prototype.ALL_TESTS_FINISHED) == 0) {
					this.onFinish();
					return;
				}
			}
		}
		this.sendMessage();
	},

	onFinish : function()
	{
		if (gOptions.autoQuit) {
			utils.quitApplication(true);
		}
		else if (gOptions.autoClose) {
			this.closeConsoleWindows();
			window.close();
		}

		this.stopPinging();
	},

	startPinging : function()
	{
		this.stopPinging();
		this._pingTimer = window.setInterval(function(aSelf) {
			aSelf.ping();
		}, ns.TestCase.prototype.PING_INTERVAL, this);
	},
	stopPinging : function()
	{
		if (this._pingTimer) {
			window.clearTimeout(this._pingTimer);
			this._pingTimer = null;
		}
	},
	ping : function()
	{
		var message = new ns.Message(ns.TestCase.prototype.PING, gOptions.outputHost, gOptions.outputPort);
		message.send();
	},
	get pinging()
	{
		return this._pingTimer ? true : false ;
	},
	_pingTimer : null,

	closeConsoleWindows : function()
	{
		var console = WindowMediator.getMostRecentWindow('global:console');
		if (console)
			console.close();
		var browserConsole = WindowMediator.getMostRecentWindow('devtools:webconsole');
		if (browserConsole)
			browserConsole.close();
	}
};
 
function onAllTestsFinish() 
{
	var lastResultFile = getLastResultFile();
	utils.writeTo(gLog.toString(gLog.FORMAT_RAW), lastResultFile, 'UTF-8');

	if (gOptions.log) {
		utils.writeTo(
			gLog.toString(utils.makeFileWithPath(gOptions.log)),
			gOptions.log,
			'UTF-8'
		);
		gOptions.log = null;
	}
	if (gOptions.rawLog) {
		utils.writeTo(
			gLog.toString(gLog.FORMAT_RAW),
			gOptions.rawLog,
			'UTF-8'
		);
		gOptions.rawLog = null;
	}

	gRemoteRun.onEvent('finish-all');
	updateUIForAllTestsFinish();

	if (!gRemoteRun.pinging) {
		if (gOptions.autoQuit)
			utils.quitApplication(true);
		else if (gOptions.autoClose)
			window.close();
	}
};
 
function updateUIForAllTestsFinish() 
{
	document.documentElement.removeAttribute('running');

	if (!_('content').collapsed && contentAutoExpanded) {
		toggleContent();
	}

	_('saveReport').removeAttribute('disabled');
	_('toggleServer').removeAttribute('disabled');

	stopAllProgressMeters();

	if (gAborted) {
		_('testResultStatus').setAttribute('label', bundle.getString('all_abort'));
		return;
	}
	else if (gFailure || gError) {
		var failures = getFailureReports();
		var errors = getErrorReports();
		scrollReportsTo(failures.length ? failures[0] : errors[0]);
		_('testResultStatus').setAttribute('label', bundle.getString('all_result_problem'));
	}
	else {
		scrollReportsTo(_('testcase-reports').firstChild);
		_('testResultStatus').setAttribute('label',
			bundle.getString(gSkipped ? 'all_result_done' : 'all_result_success' )
		);
	}
	_('testResultStatistical').hidden = false;
	_('testResultStatistical').setAttribute('label',
		bundle.getFormattedString(
			'all_result_statistical',
			[gAllTests.length, gSuccess, gFailure, gError, gSkipped]
		)
	);
};
 
function testUnitCountsForResult(aResultType)
{
	var reports = _('testcase-reports').childNodes;
	return Array.filter(reports, function (report) {
		return  report.getAttribute("data-result-type") === aResultType;
	}).length;
}

function updateTestCountInModeButtons() {
	var success = testUnitCountsForResult("success");
	var failure = testUnitCountsForResult("failure");
	var error = testUnitCountsForResult("error");
	var skipped = testUnitCountsForResult("skip");
	updateTestCountInModeButtonsByCounts(success, failure, error, skipped);
}

function updateTestCountInModeButtonsByCounts(success, failure, error, skipped)
{
	var buttonIdToCounts = {
		"mode-all"           : success + failure + error + skipped,
		"mode-success"       : success,
		"mode-failure"       : failure,
		"mode-error"         : error,
		"mode-skip"          : skipped,
		"mode-failure-error" : failure + error
	};

	for (var buttonId in buttonIdToCounts) {
		if (buttonIdToCounts.hasOwnProperty(buttonId)) {
			var modeButton = _(buttonId);
			var count = buttonIdToCounts[buttonId];
			updateTestCountInModeButton(modeButton, count);
		}
	}
}
 
function updateTestCountInModeButton(modeButton, count)
{
	var baseLabel = modeButton.label.replace(/ (.*)$/, "");
	var labelWithCount = baseLabel + " (" + count + ")";
	modeButton.label = labelWithCount;
	modeButton.setAttribute("data-count", count);
}
 
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
		var unformatted = utils.unformatStackLine(aLine);
		if (unformatted.source) item.setAttribute('source', unformatted.source);
		if (unformatted.line) item.setAttribute('line', unformatted.line);
		if (utils.comesFromFramework(aLine)) item.setAttribute('internal', true);
		aListbox.appendChild(item);
	});
}
 
function reset() 
{
	gAborted  = false;
	gAllTests = [];
	gSuccess  = 0;
	gSkipped  = 0;
	gFailure  = 0;
	gError    = 0;
	updateTestCountInModeButtonsByCounts(0, 0, 0, 0);
	_('testResultStatus').setAttribute('label', '');
	_('testResultStatistical').setAttribute('label', '');
	_('testResultStatistical').hidden = true;
	removeChildrenOf(_('testcase-reports'))
	hideSource();
	_('saveReport').setAttribute('disabled', true);
	gLog.clear();
}
var gAborted  = false;
var gAllTests = [];
var gSuccess  = 0;
var gSkipped  = 0;
var gFailure  = 0;
var gError    = 0;
 
function setRunningState(aRunning) 
{
	if (aRunning) {
		_('run-box').setAttribute('hidden', true);
		_('run').setAttribute('disabled', true);
		_('runPriority').setAttribute('disabled', true);
		_('runAll').setAttribute('disabled', true);
		_('stop-box').removeAttribute('hidden');
		_('stop').removeAttribute('disabled');
		_('toggleServer').setAttribute('disabled', true);
		_('testRunningProgressMeter').setAttribute('mode', 'determined');
		_('testRunningProgressMeterPanel').removeAttribute('collapsed');
		_('testResultStatus').setAttribute('label', bundle.getString('all_wait'));
	}
	else {
		_('run-box').removeAttribute('hidden');
		_('run').removeAttribute('disabled');
		_('runPriority').removeAttribute('disabled');
		_('runAll').removeAttribute('disabled');
		_('stop-box').setAttribute('hidden', true);
		_('stop').setAttribute('disabled', true);
		_('toggleServer').removeAttribute('disabled');
		_('testRunningProgressMeter').setAttribute('mode', 'undetermined');
		_('testRunningProgressMeterPanel').setAttribute('collapsed', true);
	}
}
 
function run(aOptions) 
{
	aOptions = aOptions || {};

	reset();

	var maxParallelCount = aOptions.maxParallelCount;
	if (maxParallelCount === undefined || maxParallelCount <= 0)
		maxParallelCount = gOptions.maxParallelCount;
	if (maxParallelCount === undefined || maxParallelCount <= 0)
		maxParallelCount = utils.getPref('extensions.uxu.runner.maxParallelCount');

	gRunner = new ns.TestRunner(
		{
			browser          : _('content'),
			envCreator       : function() { return {}; },
			maxParallelCount : maxParallelCount
		},
		aOptions.targets || _('file').value
	);

	gRunner.addListener(runnerListener);
	if (aOptions.extraListeners)
		aOptions.extraListeners.forEach(function(aListener) {
			gRunner.addListener(aListener);
		});

	if (aOptions.onlyFailed)
		gRunner.addTestFilter(function(aTestCase) {
			var hasFailed = false;
			aTestCase.tests.forEach(function(aTest) {
				if (
					aTest.lastResult != ns.TestCase.prototype.RESULT_SUCCESS &&
					aTest.lastResult != ns.TestCase.prototype.RESULT_SKIPPED
					) {
					aTest.priority = 'must';
					hasFailed = true;
				}
				else {
					aTest.shouldSkip = true;
				}
			});
			if (!hasFailed)
				aTestCase.masterPriority = 'never';
			return hasFailed;
		});

	document.documentElement.setAttribute('running', true);

	gRunner.run(aOptions.priority);
}
	
function runByPref() 
{
	run({ priority : utils.getPref('extensions.uxu.runner.runMode') == 1 ? 'must' : null });
}
 
function runWithDelay(aMasterPriority) 
{
	_delayedRunTimer = window.setTimeout(function() {
		_delayedRunTimer = null;
		run({ priority : aMasterPriority });
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
	run({ onlyFailed : true });
}
 
function stop() 
{
	if (gRunner) gRunner.abort();
	gRunner = null;
	_('stop').setAttribute('disabled', true);
}
  
/* UI */ 
	
function getReportNode(aTestCase) 
{
	var id = 'testcase-report-'+encodeURIComponent(aTestCase.title)+'-'+encodeURIComponent(aTestCase.source);
	return _(id) ||
		(function() {
			var wTestCaseReport = clone('testcase-report');
			wTestCaseReport.setAttribute('id', id);
			wTestCaseReport.setAttribute('title', aTestCase.title);
			_(wTestCaseReport, 'title').textContent = aTestCase.title;
			_(wTestCaseReport, 'bar').setAttribute('class', 'testcase-fine');
			_('testcase-reports').appendChild(wTestCaseReport);
			setContentMinHeight();
			scrollReportsTo(wTestCaseReport);
			return wTestCaseReport;
		})();
}
 
function decideResultTypeForReportNode(aReportNode, aTopic)
{
	var currentResultType = aReportNode.getAttribute("data-result-type");
	if (!currentResultType)
		return aTopic.result;

	// If at least one topic ends with failure / error, containing
	// test case is regarded as failure / error (and error is
	// stronger than failure).

	if (currentResultType === ns.TestCase.prototype.RESULT_ERROR
		|| aTopic.result === ns.TestCase.prototype.RESULT_ERROR)
		return ns.TestCase.prototype.RESULT_ERROR;

	if (aTopic.result === ns.TestCase.prototype.RESULT_FAILURE)
		return ns.TestCase.prototype.RESULT_FAILURE;

	// Test case is regarded as skipped only if *ALL* topics in the
	// test case are skipped.
	if (currentResultType === ns.TestCase.prototype.RESULT_SKIPPED
		&& aTopic.result !== ns.TestCase.prototype.RESULT_SKIPPED)
		return aTopic.result;

	return currentResultType;
}
 
function fillReportFromTopic(aTopic, aTestCase) 
{
	var testId = 'test-report-'+encodeURIComponent(aTestCase.title)
					+'-'+encodeURIComponent(aTestCase.source)
					+'-'+aTopic.index;
	var id = testId+'-'+encodeURIComponent(aTopic.description);
	if (_(id)) return;

	var reportNode = getReportNode(aTestCase);

	reportNode.setAttribute(
		"data-result-type",
		decideResultTypeForReportNode(_(reportNode), aTopic)
	);
	_(reportNode, 'bar').setAttribute('mode', 'determined');
	_(reportNode, 'bar').setAttribute('value', aTopic.percentage);
	_(reportNode, 'running-status').removeAttribute('value');
	_(reportNode, 'total-counter').value = aTopic.step.split('/')[1];

	_(reportNode, 'bar').setAttribute('testcase-results',
		_(reportNode, 'bar').getAttribute('testcase-results')+
		' '+aTopic.result
	);

	var dummyTestReport = document.createElement('data');
	dummyTestReport.setAttribute('id', id);

	switch (aTopic.result)
	{
		case ns.TestCase.prototype.RESULT_SUCCESS:
			gSuccess++;
			var successes = parseInt(_(reportNode, 'success-counter').value);
			_(reportNode, 'success-counter').value = successes + 1;
			_(reportNode).appendChild(dummyTestReport);
			break;
		case ns.TestCase.prototype.RESULT_SKIPPED:
			gSkipped++;
			var skip = parseInt(_(reportNode, 'skip-counter').value);
			_(reportNode, 'skip-counter').value = skip + 1;
			_(reportNode).appendChild(dummyTestReport);
			return;
		case ns.TestCase.prototype.RESULT_FAILURE:
			gFailure++;
			break;
		case ns.TestCase.prototype.RESULT_ERROR:
			gError++;
			break;
		default:
			break;
	}
	if (gAllTests.indexOf(testId) < 0)
		gAllTests.push(testId);

	if (aTopic.result == ns.TestCase.prototype.RESULT_SUCCESS &&
		(!aTopic.notifications || !aTopic.notifications.length))
		return;

	var wTestReport = clone('test-report');
	wTestReport.setAttribute('id', id);
	_(wTestReport, 'result').setAttribute('value', bundle.getString('report_result_'+aTopic.result));
	_(wTestReport, 'icon').setAttribute('class', 'test-' + aTopic.result);
	_(wTestReport).setAttribute('report-type', aTopic.result);
	_(wTestReport, 'description').textContent = aTopic.description;
	_(wTestReport, 'description').setAttribute('tooltiptext', aTopic.description);
	if (aTopic.parameter) {
		_(wTestReport, 'parameter-oneline').setAttribute('value', aTopic.parameter);
		_(wTestReport, 'parameter-multiline').textContent = aTopic.formattedParameter;
		_(wTestReport, 'parameter-multiline').setAttribute('style', 'min-height:'+aTopic.formattedParameter.split('\n').length+'em');
		_(wTestReport, 'parameter-container').removeAttribute('collapsed');
	}

	if (aTopic.result == ns.TestCase.prototype.RESULT_ERROR ||
		aTopic.result == ns.TestCase.prototype.RESULT_FAILURE) {
		_(reportNode, 'bar').setAttribute('class', 'testcase-problems');

		var wTestReportPart = clone('test-report-part');
		if (aTopic.expected) {
			_(wTestReportPart, 'expected-value').textContent = aTopic.expected;
			_(wTestReportPart, 'expected-row').removeAttribute('hidden');
		}
		if (aTopic.actual) {
			_(wTestReportPart, 'actual-value').textContent = aTopic.actual;
			_(wTestReportPart, 'actual-row').removeAttribute('hidden');
		}
		if (aTopic.expected || aTopic.actual) {
			_(wTestReportPart, 'vs').removeAttribute('hidden');
		}
		if (aTopic.encodedDiff && utils.getPref('extensions.uxu.runner.coloredDiff')) {
			var pre = document.createElementNS('http://www.w3.org/1999/xhtml', 'pre');
			pre.innerHTML = aTopic.encodedDiff;
			_(wTestReportPart, 'diff-value').appendChild(pre);
			var range = document.createRange();
			range.selectNodeContents(pre);
			var encodedDiff = range.extractContents();
			range.selectNode(pre);
			range.deleteContents();
			range.insertNode(encodedDiff);
			_(wTestReportPart, 'diff-row').removeAttribute('hidden');
		}
		else if (aTopic.diff) {
			_(wTestReportPart, 'diff-value').textContent = aTopic.diff;
			_(wTestReportPart, 'diff-row').removeAttribute('hidden');
		}
		if (aTopic.message) {
			_(wTestReportPart, 'additionalInfo').textContent = aTopic.message;
		}
		if (aTopic.stackTrace && aTopic.stackTrace.length) {
			displayStackTraceLines(aTopic.stackTrace, _(wTestReportPart, 'stack-trace'));
			_(wTestReportPart, 'stack-trace').hidden = false;
		}
		_(wTestReport, 'test-report-parts').appendChild(wTestReportPart);
	}

	if (aTopic.notifications && aTopic.notifications.length) {
		aTopic.notifications.forEach(function(aNotification) {
			var wTestReportPart = clone('test-report-part');
			_(wTestReportPart, 'icon').setAttribute('class', 'report-'+aNotification.type);
			if (aNotification.description) {
				_(wTestReportPart, 'additionalInfo').textContent = aNotification.description;
			}
			if (aNotification.stackTrace && aNotification.stackTrace.length) {
				displayStackTraceLines(aNotification.stackTrace, _(wTestReportPart, 'stack-trace'));
				_(wTestReportPart, 'stack-trace').hidden = false;
			}
			_(wTestReport, 'test-report-parts').appendChild(wTestReportPart);
		});
	}

	_(reportNode, 'test-reports').appendChild(wTestReport);
	setContentMinHeight();
	scrollReportsTo(wTestReport);
}
 
function buildReports(aReports) 
{
	aReports.forEach(function(aReport) {
		var node = getReportNode(aReport);
		node.setAttribute('source', aReport.source);
		aReport.topics.forEach(function(aTopic) {
			fillReportFromTopic(aTopic, aReport);
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
	utils.setPref('extensions.uxu.runner.lastPath', aPath);

	if (aClear) {
		let lastResultFile = getLastResultFile();
		lastResultFile.remove(true);
	}
}
 
function updateRunMode() 
{
	var runPriority = _('runPriority');
	var runAll = _('runAll');
	var label;
	switch (utils.getPref('extensions.uxu.runner.runMode'))
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
	var toggleInternalStacks = _('toggleInternalStacks');
	var showInternalStacks = utils.getPref('extensions.uxu.showInternalStacks');
	if (showInternalStacks)
		toggleInternalStacks.setAttribute('checked', true);
	else
		toggleInternalStacks.removeAttribute('checked');

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

	var focused = getFocusedFile();
	if (focused.path) {
		var command = _('editThis');
		command.setAttribute(
			'label',
			command.getAttribute(focused.line ? 'label-line' : 'label-file' )
				.replace(/\%f/gi, focused.path.match(/[^\/\\]+$/))
				.replace(/\%l/gi, focused.line)
		);
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
	$X(
		'/descendant::*[local-name()="progressmeter" and @mode="undetermined" and not(ancestor::*[@id="blueprints"])]',
		document
	).forEach(function(aNode) {
		aNode.setAttribute('mode', 'determined');
	}, this);
}
 
function initializeMode()
{
	// TODO: save mode (persistent)?
	_('mode-all').checked = true;
	changeMode('all');
}
 
function changeMode(modeName)
{
	_('testcase-reports').setAttribute('data-mode', modeName);
}
  
/* server */ 
	
var gServer = null; 
 
function toggleServer() 
{
	if (gServer)
		stopServer();
	else
		startServer();
}
 
function startServer(aPort) 
{
	if (gServer)
		return;

	var context = new ns.Context({});
	context.runTest = function(aOptions/*, aTargets, ...*/) {
		setTestFile('', true);
		var reporter = new ns.Reporter(ns.inherit(aOptions, {
				onAbort : function() { stop(); }
			}));
		run({
			targets          : Array.slice(arguments, 1),
			priority         : aOptions.priority,
			maxParallelCount : aOptions.maxParallelCount,
			extraListeners   : [reporter]
		});
		return reporter;
	};

	gServer = new ns.Server(aPort || utils.getPref('extensions.uxu.port'));
	gServer.addListener(context);
	context.addListener(gServer);
	gServer.start();

	_('toggleServer').setAttribute('checked', true);
}
 
function stopServer() 
{
	if (!gServer)
		return;

	gServer.stop();
	gServer = null;

	_('toggleServer').removeAttribute('checked');
}
  
/* commands */ 
	
function saveReport(aPath, aFormat) 
{
	var file;
	if (!aPath) {
		let last;
		try {
			last = utils.makeFileWithPath(utils.getPref('extensions.uxu.runner.lastLog'));
		}
		catch(e) {
		}

		let filters = {};
		filters[bundle.getString('filetype_html')] = '*.html';
		filters[bundle.getString('filetype_txt')] = '*.txt';
		filters[bundle.getString('filetype_csv')] = '*.csv';
		filters[bundle.getString('filetype_tsv')] = '*.tsv';
		filters[bundle.getString('filetype_json')] = '*.json';
		let picked = pickFile(
				'save', {
					defaultFile : last || 'log.html',
					defaultExtension : (last ? last.leafName.replace(/^.*\.([^\.]+)$/, '$1') : '') || 'html',
					filters : filters,
					title : bundle.getString('log_picker_title')
				}
			);

		if (!picked) return;
		file = picked;
	}
	else {
		try {
			file = utils.makeFileWithPath(aPath);
		}
		catch(e) {
		}
	}
	if (!file) return;

	utils.setPref('extensions.uxu.runner.lastLog', file.path);

	if (file.exists()) file.remove(true);
	utils.writeTo(
		gLog.toString(aFormat || file),
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
		utils.getPref('extensions.uxu.runner.editor') ||
		utils.getPref('extensions.mozlab.runner.editor') ||
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
				replace(/\%l/gi, aLineNumber).
				replace(/\%c/gi, aColumnNumber).
				replace(/\%u/gi, utils.getURLSpecFromFilePath(aFilePath)).
				replace(/\%f/gi, aFilePath);
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
		utils.setPref(
			'extensions.uxu.runner.editor',
			'"'+editor.path+'" '+
			(utils.getPref('extensions.uxu.runner.editor.defaultOptions.'+editor.leafName.toLowerCase()) || '"%F"')
		);
		arguments.callee(aFilePath, aLineNumber, aColumnNumber);
	}
}
 
function toggleInternalStacks() 
{
	utils.setPref('extensions.uxu.showInternalStacks', !utils.getPref('extensions.uxu.showInternalStacks'));
}
 
function toggleAlwaysRaised() 
{
	var win = getXULWindow();
	win.zLevel = (win.zLevel == win.normalZ) ?
			win.highestZ : win.normalZ;
	utils.setPref('extensions.uxu.runner.alwaysRaised', win.zLevel != win.normalZ);
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
	_('content-splitter').collapsed = !_('content-splitter').collapsed;
	setContentMinHeight();
}
	
var contentAutoExpanded = false; 
 
function onContentLoad() 
{
	if (!utils.getPref('extensions.uxu.runner.autoShowContent')) return;
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
	var opened = !_('source-splitter').collapsed;
	_('source-splitter').collapsed = false;
	_('source-viewer').collapsed = false;
	if (!opened && utils.getPref('extensions.uxu.runner.autoExpandWindow.sourceViewer')) {
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
	if (_('source-splitter').collapsed) return;
	if (utils.getPref('extensions.uxu.runner.autoExpandWindow.sourceViewer')) {
		window.resizeBy(
			-_('source-splitter').boxObject.width
			-_('source-viewer').boxObject.width,
			0
		);
	}
	_('source-viewer').collapsed = true;
	_('source-splitter').collapsed = true;
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
	var recentWindow = WindowMediator.getMostRecentWindow('navigator:browser');
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
 
function setContentMinHeight() 
{
	var box = _('content')
	if (box.collapsed) return;
	var minHeight = parseInt(box.parentNode.boxObject.height / 2);
	if (box.boxObject.height >= minHeight) return;
	box.previousSibling.previousSibling.height = minHeight;
	box.height = minHeight;
}
 
function restartApplication() 
{
	utils.restartApplication();
}
  
