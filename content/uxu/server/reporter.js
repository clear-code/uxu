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
		detail += utils.formatError(aResult.exception) + '\n\n';
		_this.result += utils.UCS2ToUTF8(detail);
	});

	this.result += (this.badResults.length / this.nTests) + '% passed.\n';

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
	dump(utils.formatError(aError));
}
