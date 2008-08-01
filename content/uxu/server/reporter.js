// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');
var color = lib_module.require('package', 'color');
const Color = color.Color;

var statusOrder = ["success", "failure", "error"];

function constructor(aOptions)
{
	this.nTests = 0;
	this.nAssertions = 0;
	this.nFailures = 0;
	this.nErrors = 0;
	this.finished   = false;
	this.result     = '';
	this.resultStatus = "success";
	this.badResults = [];

	if (!aOptions)
		aOptions = {};
	this.useColor   = aOptions.useColor;

	this._initializeColor();
}

function addListener(aListener)
{
	this.listeners.push(aListener);
}

function handleEvent(aEvent)
{
try {
	switch (aEvent.type)
	{
		case 'Start':
			this.onStart();
			break;

		case 'Report':
			this.onTestFinish(aEvent.data);
			break;

		case 'Finish':
			this.onFinish();
			break;

		case 'Error':
			this.onError(aEvent.data);
			break;
	}
} catch (e) {
	dump(utils.formatError(e));
}
}

function isFinished()
{
	return this.finished;
}

function onStart()
{
	this.finished = false;
}

function onFinish()
{
	this.result += "\n\n";
	this._reportBadResults();
	this._reportSummary();

	this.finished = true;
}

function onTestFinish(aReport)
{
	switch (aReport.result)
	{
	    case 'passover':
			return;
		case 'success':
			this.result += this._colorize('.', this.successColor);
			break;
		case 'failure':
			this.result += this._colorize('F', this.failureColor);
			this.nFailures++;
			break;
		case 'error':
			this._handleError(aReport, false);
			break;
		default:
			this.result += '?';
			break;
	}
	if (this._isMoreImportantStatus(aReport.result))
		this.resultStatus = aReport.result;

	this.nTests++;
	if (aReport.exception)
		this.badResults.push(aReport);
}

function onError(aError)
{
	var aReport = {
		result: 'error',
		testDescription: "unknown",
		exception: aError
	};
	this._handleError(aReport, true);
}

function _handleError(aReport, aRegisterBadResults)
{
	this.result += this._colorize('E', this.errorColor);
	if (aRegisterBadResults)
		this.badResults.push(aReport);
	this.nErrors++;
}

function _reportBadResults()
{
	var _this = this;

	this.badResults.forEach(function(aResult, aIndex) {
		var formattedIndex, summary, detail, exception;

		formattedIndex = _this._formatIndex(aIndex + 1, _this.badResults.length);
		formattedIndex = " " + formattedIndex + ") ";
		detail = _this._colorize([aResult.result,
								  aResult.testDescription].join(': '),
								 _this._statusColor(aResult.result));
		detail = formattedIndex + detail + '\n';

		exception = aResult.exception;
		if (aResult.result == "failure") {
			if (exception.message) {
				detail += exception.message.replace(/(^[\s\n]+|[\s\n]+$)/, '');
				detail += "\n";
			}
			if (exception.expected)
				detail += " expected: " + exception.expected + "\n";
			if (exception.actual)
				detail += "   actual: " + exception.actual + "\n";
			if (exception.diff)
				detail += "\ndiff:\n" + exception.diff + "\n";
			if (exception.foldedDiff)
				detail += "\nfolded diff:\n" + exception.foldedDiff + "\n";
			detail += _this._formatStackTrace(exception);
		} else {
			detail += _this._formatError(exception);
		}
		_this.result += utils.UCS2ToUTF8(detail);
	});
}

function _reportSummary()
{
	var resultColor, summary, successRate;

	resultColor = this._statusColor(this.resultStatus);

	summary = [this.nTests + " test(s)",
			   // this.nAssertions + " assertion(s)",
			   this.nFailures + " failure(s)",
			   this.nErrors + " error(s)"].join(', ');
	this.result += this._colorize(summary, resultColor);
	this.result += "\n";

	if (this.nTests > 0)
		successRate = (this.nTests - this.badResults.length) / this.nTests * 100;
	else
		successRate = 0;
	this.result += this._colorize(successRate + '% passed.', resultColor);
	this.result += "\n";
}

function _log10(aNumber)
{
	return Math.log(aNumber) / Math.log(10);
}

function _formatIndex(aIndex, aMax)
{
	var result = "";
	var width, maxWidth;
	var i;

	width = Math.floor(this._log10(aIndex)) + 1;
	maxWidth = Math.floor(this._log10(aMax)) + 1;

	for (i = maxWidth - width; i > 0; i--) {
		result += " ";
	}
	result += aIndex;

	return result;
}

function _formatError(aError)
{
	return aError.toString() + "\n" + this._formatStackTrace(aError);
}

function _formatStackTrace(aError)
{
	var result = "";
	var options = {
	  onlyFile: true,
	  onlyExternal: true,
	  onlyTraceLine: true
	};
	var stackTrace = utils.formatStackTrace(aError, options);
	stackTrace.split("\n").forEach(function (aLine) {
		var matchData = /^(.*?)@(.+):(\d+)$/.exec(aLine);
		if (matchData) {
			var info = matchData[1];
			var file = matchData[2];
			var line = matchData[3];

			file = utils.getFilePathFromURLSpec(file);
			result += file + ":" + line + ": " + info + "\n";
		} else {
			result += aLine + "\n";
		}
	});

	return result;
}

function _initializeColor()
{
	this.resetColor = new Color("reset");
	this.successColor = new Color("green", {bold: true});
	this.failureColor = new Color("red", {bold: true});
	this.pendingColor = new Color("magenta", {bold: true});
	this.omissionColor = new Color("blue", {bold: true});
	this.notificationColor = new Color("cyan", {bold: true});
	this.errorColor = new Color("yellow", {bold: true});
}

function _colorize(aText, aColor)
{
	if (!this.useColor)
		return aText;

	if (!aColor)
		return aText;

	return aColor.escapeSequence() + aText + this.resetColor.escapeSequence();
}

function _isMoreImportantStatus(aStatus)
{
	return statusOrder.indexOf(aStatus) > statusOrder.indexOf(this.resultStatus);
}

function _statusColor(aStatus)
{
	return this[aStatus + "Color"];
}
