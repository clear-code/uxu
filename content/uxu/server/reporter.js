// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

function constructor()
{
	this.nTests     = 0;
	this.finished   = false;
	this.result     = '';
	this.badResults = [];
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

	_this.result += "\n";
	this.badResults.forEach(function(aResult) {
		var detail;
		detail = aResult.result + ': ';
		detail += aResult.testDescription + '\n';
		detail += _this._formatError(aResult.exception) + '\n';
		_this.result += utils.UCS2ToUTF8(detail);
	});

	var successRate;
	if (this.nTests > 0)
		successRate = this.badResults.length / this.nTests;
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
			this.result += '.';
			break;
		case 'failure':
			this.result += 'F';
			break;
		case 'error':
			this.result += 'E';
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

function _formatError(aError)
{
	var result = aError.toString() + "\n";
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
