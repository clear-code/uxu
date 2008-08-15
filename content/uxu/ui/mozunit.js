var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var utils  = lib_module.require('package', 'utils');
var bundle = lib_module.require('package', 'bundle');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Runner = test_module.require('class', 'runner');

const Cc = Components.classes;
const Ci = Components.interfaces;

const ObserverService = Cc['@mozilla.org/observer-service;1']
	.getService(Ci.nsIObserverService);
 
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
			defaultFile = utils.makeFileWithPath(defaultFile);
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
			_('file').value = file.path;
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
	if (!isLinux()) {
		ObserverService.addObserver(alwaysRaisedObserver, 'xul-window-registered', false);
		if (utils.getPref('extensions.uxu.mozunit.alwaysRaised'))
			toggleAlwaysRaised();
	}
	ObserverService.addObserver(restartObserver, 'quit-application-requested', false);
	updateTestCommands();
	_('content').addEventListener('load', onContentLoad, true);
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
		_('file').value = file.path;
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
		_('file').value = file.path;
		updateTestCommands();
		reset();
	}
}
 
function pickTestFile(aOptions) 
{
	var url = pickFileUrl(null, aOptions);
	if (url) {
		_('file').value = url;
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
				'ancestor-or-self::*[@role="testcase-report" or local-name()="listitem"]/@file',
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
 
function TestListener() 
{
}
TestListener.prototype = {
	registerTest : function(aTestCase)
	{
		aTestCase.addListener(this);
	},
	getTestCaseReport : function(aTitle)
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
	},
	onStart : function(aEvent)
	{
		this.getTestCaseReport(aEvent.target.title);
	},
	onTestFinish : function(aEvent)
	{
		var testCase = aEvent.target;
		var report = aEvent.data;

		var wTestCaseReport = this.getTestCaseReport(testCase.title);
		_(wTestCaseReport).setAttribute('test-id', report.testID);
		_(wTestCaseReport).setAttribute('file', testCase.namespace);
		_(wTestCaseReport, 'bar').setAttribute('mode', 'determined');
		_(wTestCaseReport, 'bar').setAttribute(
			'value', parseInt(report.testIndex / testCase.tests.length * 100));
		_(wTestCaseReport, 'total-counter').value = testCase.tests.length;

		_(wTestCaseReport, 'bar').setAttribute('testcase-results',
			_(wTestCaseReport, 'bar').getAttribute('testcase-results')+
			' '+report.result
		);

		gTotalCount++;
		switch (report.result)
		{
			case 'success':
				gSuccessCount++;
				var successes = parseInt(_(wTestCaseReport, 'success-counter').value);
				_(wTestCaseReport, 'success-counter').value = successes + 1;
				return;
			case 'passover':
				gPassOverCount++;
				var passover = parseInt(_(wTestCaseReport, 'passover-counter').value);
				_(wTestCaseReport, 'passover-counter').value = passover + 1;
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

		_(wTestCaseReport, 'bar').setAttribute('class', 'testcase-problems');

		var id = 'test-report-'+encodeURIComponent(title)+'-'+_(wTestCaseReport, 'test-reports').childNodes.length;
		var wTestReport = clone('test-report');
		wTestReport.setAttribute('id', id);
		_(wTestReport, 'result').value = bundle.getString('report_result_'+report.result);
		_(wTestReport, 'icon').setAttribute('class', 'test-' + report.result);
		_(wTestReport, 'description').textContent = report.testDescription;
		_(wTestReport, 'description').setAttribute('tooltiptext', report.testDescription);
		_(wTestReport).setAttribute('report-type', report.result);
		if (report.exception) {
			if (report.exception.expected) {
				_(wTestReport, 'expected-value').textContent = report.exception.expected;
				_(wTestReport, 'expected-row').removeAttribute('hidden');
			}
			if (report.exception.actual) {
				_(wTestReport, 'actual-value').textContent = report.exception.actual;
				_(wTestReport, 'actual-row').removeAttribute('hidden');
			}
			if (report.exception.expected || report.exception.actual) {
				_(wTestReport, 'vs').removeAttribute('hidden');
			}
			if (report.exception.diff) {
				_(wTestReport, 'diff-value').textContent = report.exception.foldedDiff || report.exception.diff;
				_(wTestReport, 'diff-row').removeAttribute('hidden');
			}
			_(wTestReport, 'additionalInfo').textContent = report.exception.message.replace(/^\s+/, '');
			if (utils.hasStackTrace(report.exception)) {
				displayStackTrace(report.exception, _(wTestReport, 'stack-trace'));
				_(wTestReport, 'stack-trace').hidden = false;
			}
		}

		_(wTestCaseReport, 'test-reports').appendChild(wTestReport);
		scrollReportsTo(wTestReport);
	},
	onFinish : function(aEvent)
	{
		aEvent.target.removeListener(this);
	},
	onAbort : function(aEvent)
	{
		this.onFinish(aEvent);
	}
};
 
var runnerListener = { 
	handleEvent : function(aEvent)
	{
		switch (aEvent.type)
		{
			case 'Error':
				var e = aEvent.data;
				_('prerun-report', 'error').textContent = bundle.getFormattedString('error_failed', [e.toString()]);
				_('prerun-report', 'error').hidden = false;

				if (utils.hasStackTrace(e)) {
					displayStackTrace(e, _('prerun-report', 'stack-trace'));
					_('prerun-report', 'stack-trace').hidden = false;
					_('prerun-report').hidden = false;
				}
				break;

			case 'Progress':
				setRunningState(true);
				_('testRunningProgressMeter').setAttribute('value', aEvent.data);
				break;

			case 'Abort':
				gAborted = true;
			case 'Finish':
				setRunningState(false);
				onAllTestsFinish();
				aEvent.target.removeListener(this);
				break;
		}
	}
};
 
function onAllTestsFinish() 
{
	if (!_('content').collapsed && contentAutoExpanded) {
		toggleContent();
	}

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
	var lines = utils.formatStackTrace(aException, { onlyTraceLine : true, onlyExternal : true }).split('\n');
	if (!lines.length || utils.getPref('extensions.uxu.mozunit.showInternalStacks'))
		lines = utils.formatStackTrace(aException, { onlyTraceLine : true }).split('\n');
	lines.forEach(function(aLine) {
		if (!aLine) return;
		var item = document.createElement('listitem');
		item.setAttribute('label', aLine);
		item.setAttribute('crop', 'center');
		var file = utils.unformatStackLine(aLine).source;
		if (file) item.setAttribute('file', file);
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
 
function run(aAll) 
{
	reset();

	gRunner = new Runner(_('content'), [_('file').value]);

	gRunner.addListener(runnerListener);

	var listener = new TestListener();
	gRunner.addTestFilter(function(aTestCase) {
		listener.registerTest(aTestCase);
		return true;
	});

	gRunner.run(null, aAll);
}
	 
function runByPref() 
{
	run(utils.getPref('extensions.uxu.mozunit.runMode') == 1);
}
  
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

	var listener = new TestListener();
	gRunner.addTestFilter(function(aTestCase) {
		listener.registerTest(aTestCase);
		return true;
	});

	gRunner.run();
}
 
function stop() 
{
	gRunner.abort();
	_('stop').setAttribute('disabled', true);
}
  
/* UI */ 
	 
function saveReport() 
{
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
 
function isLinux() 
{
	return /linux/i.test(navigator.platform);
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
  
