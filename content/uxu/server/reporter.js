// -*- indent-tabs-mode: t; tab-width: 4 -*-const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');
var color = lib_module.require('package', 'color');
const Color = color.Color;

function constructor(aOptions)
{
	this.nTests     = 0;
	this.finished   = false;
	this.result     = '';
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
	var _this = this;

	_this.result += "\n\n";
	this.badResults.forEach(function(aResult, aIndex) {
		var formattedIndex, color, summary, detail, exception;

		formattedIndex = _this._formatIndex(aIndex + 1, _this.badResults.length);
		formattedIndex = " " + formattedIndex + ") ";
		color = _this[aResult.result + "Color"];
		detail = _this._colorize([aResult.result,
								  aResult.testDescription].join(': '),
								 color);
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
			detail += _this._formatStackTrace(exception);
		} else {
			detail += _this._formatError(exception);
		}
		_this.result += utils.UCS2ToUTF8(detail);
	});

	var successRate;
	if (this.nTests > 0)
		successRate = (this.nTests - this.badResults.length) / this.nTests * 100;
	else
		successRate = 0;
	this.result += successRate + '% passed.\n';

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
			break;
		case 'error':
			this.result += this._colorize('E', this.errorColor);
			break;
		default:
			this.result += '?';
			break;
	}

	this.nTests++;
	if (aReport.exception)
		this.badResults.push(aReport);
}

function onError(aError)
{
	dump(this._formatError(aError));
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
