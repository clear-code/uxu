// -*- indent-tabs-mode: t; tab-width: 4 -*-

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Reporter'];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/color.js', ns);
Components.utils.import('resource://uxu-modules/test/testCase.js', ns);

var utils = ns.utils;
var Color = ns.Color;

var statusOrder = [
		ns.TestCase.prototype.RESULT_SUCCESS,
		ns.TestCase.prototype.RESULT_FAILURE,
		ns.TestCase.prototype.RESULT_ERROR
	];

function Reporter(aOptions)
{
	this.allTests     = [];
	this.nAssertions  = 0;
	this.nFailures    = 0;
	this.nErrors      = 0;
	this.finished     = false;
	this.result       = '';
	this.resultStatus = ns.TestCase.prototype.RESULT_SUCCESS;
	this.badResults   = [];

	if (!aOptions)
		aOptions = {};
	this.useColor   = aOptions.useColor;

	this._initializeColor();
}

Reporter.prototype = {

	addListener : function(aListener)
	{
		this.listeners.push(aListener);
	},

	handleEvent : function(aEvent)
	{
		try {
			switch (aEvent.type)
			{
				case 'Start':
					this.onStart(aEvent);
					break;

				case 'TestCaseStart':
					this.doneReports = { count : 0 };
					break;

				case 'TestCaseTestFinish':
					this.onTestFinish(aEvent);
					break;

				case 'TestCaseRemoteTestFinish':
					this.onRemoteTestFinish(aEvent);
					break;

				case 'Finish':
					this.onFinish(aEvent);
					break;

				case 'Error':
					this.onError(aEvent);
					break;
			}
		}
		catch (e) {
			dump(utils.formatError(utils.normalizeError(e)));
		}
	},

	isFinished : function()
	{
		return this.finished;
	},

	onStart : function(aEvent)
	{
		this.finished = false;
	},

	onFinish : function(aEvent)
	{
		this.result += "\n\n";
		this._reportBadResults();
		this._reportSummary();

		this.finished = true;
	},

	handleReport : function(aReport, aTestCase)
	{
		var testId = 'testcase-report-line-'+
					encodeURIComponent(aTestCase.title)+'-'+
					encodeURIComponent(aTestCase.source)+'-'+
					aReport.index;
		var id = testId + '-'+encodeURIComponent(aReport.description);
		if (id in this.doneReports)
			return;

		switch (aReport.result)
		{
		    case ns.TestCase.prototype.RESULT_SKIPPED:
				return;
			case ns.TestCase.prototype.RESULT_SUCCESS:
				this.result += this._colorize('.', this.successColor);
				break;
			case ns.TestCase.prototype.RESULT_FAILURE:
				this.result += this._colorize('F', this.failureColor);
				this.nFailures++;
				break;
			case ns.TestCase.prototype.RESULT_ERROR:
				this._handleError(aReport, false);
				break;
			default:
				this.result += '?';
				break;
		}
		if (this._isMoreImportantStatus(aReport.result))
			this.resultStatus = aReport.result;

		if (this.allTests.indexOf(testId) < 0)
			this.allTests.push(testId);

		if (aReport.exception)
			this.badResults.push(aReport);

		this.doneReports[id] = true;
		this.doneReports.count++;
	},

	onTestFinish : function(aEvent)
	{
		this.handleReport(aEvent.data.data, aEvent.data.testCase);
	},

	onRemoteTestFinish : function(aEvent)
	{
		aEvent.data.data.forEach(function(aResult) {
			aResult.results
				.slice(this.doneReportCount)
				.forEach(function(aResult) {
					var exception = null;
					if (aResult.type == ns.TestCase.prototype.RESULT_FAILURE ||
						aResult.type == ns.TestCase.prototype.RESULT_ERROR) {
						exception = {
							actual     : aResult.actual,
							expected   : aResult.expected,
							diff       : aResult.diff,
							foldedDiff : aResult.foldedDiff,
							message    : aResult.description,
							stack      : aResult.stackTrace.join('\n')
						};
					}
					this.handleReport({
						result      : aResult.type,
						description : aResult.title,
						exception   : exception
					}, aEvent.data.testCase);
				}, this);
		}, this);
	},

	onError : function(aEvent)
	{
		var error = aEvent.data;
		var report = {
			result      : ns.TestCase.prototype.RESULT_ERROR,
			description : "unknown",
			exception   : error
		};
		this._handleError(report, true);
	},

	_handleError : function(aReport, aRegisterBadResults)
	{
		this.result += this._colorize('E', this.errorColor);
		if (aRegisterBadResults)
			this.badResults.push(aReport);
		this.nErrors++;
	},

	_reportBadResults : function()
	{
		var _this = this;

		this.badResults.forEach(function(aResult, aIndex) {
			var formattedIndex, summary, detail, exception;

			formattedIndex = _this._formatIndex(aIndex + 1, _this.badResults.length);
			formattedIndex = " " + formattedIndex + ") ";
			detail = _this._colorize([aResult.result,
									  aResult.description].join(': '),
									 _this._statusColor(aResult.result));
			detail = formattedIndex + detail + '\n';

			exception = aResult.exception;
			if (aResult.result == ns.TestCase.prototype.RESULT_FAILURE) {
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
	},

	_reportSummary : function()
	{
		var resultColor, summary, successRate;

		resultColor = this._statusColor(this.resultStatus);

		summary = [this.allTests + " test(s)",
				   // this.nAssertions + " assertion(s)",
				   this.nFailures + " failure(s)",
				   this.nErrors + " error(s)"].join(', ');
		this.result += this._colorize(summary, resultColor);
		this.result += "\n";

		if (this.allTests > 0)
			successRate = (this.allTests - this.badResults.length) / this.allTests * 100;
		else
			successRate = 0;
		this.result += this._colorize(successRate + '% passed.', resultColor);
		this.result += "\n";
	},

	_log10 : function(aNumber)
	{
		return Math.log(aNumber) / Math.log(10);
	},

	_formatIndex : function(aIndex, aMax)
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
	},

	_formatError : function(aError)
	{
		return aError.toString() + "\n" + this._formatStackTrace(aError);
	},

	_formatStackTrace : function(aError)
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
	},

	_initializeColor : function()
	{
		this.resetColor = new Color("reset");
		this.successColor = new Color("green", {bold: true});
		this.failureColor = new Color("red", {bold: true});
		this.pendingColor = new Color("magenta", {bold: true});
		this.omissionColor = new Color("blue", {bold: true});
		this.notificationColor = new Color("cyan", {bold: true});
		this.errorColor = new Color("yellow", {bold: true});
	},

	_colorize : function(aText, aColor)
	{
		if (!this.useColor)
			return aText;

		if (!aColor)
			return aText;

		return aColor.escapeSequence() + aText + this.resetColor.escapeSequence();
	},

	_isMoreImportantStatus : function(aStatus)
	{
		return statusOrder.indexOf(aStatus) > statusOrder.indexOf(this.resultStatus);
	},

	_statusColor : function(aStatus)
	{
		return this[aStatus + "Color"];
	}
};
