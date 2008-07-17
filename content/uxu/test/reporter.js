// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var ObserverService = Cc['@mozilla.org/observer-service;1']
		.getService(Ci.nsIObserverService);

function constructor(aOutput)
{
	this.output     = aOutput;
	this.testCount  = 0;
	this.finished   = false;
	this.result     = '';
	this.badResults = [];
}

function isFinished()
{
	return this.finished;
}

function onStart()
{
	this.finished = false;
	ObserverService.notifyObservers(this, 'UxU:TestStart', null);
}

function onFinished()
{
	var _this = this;

	this.finished = true;

	var result;
	var results = [];

	this.badResults.forEach(function(aResult) {
		result = aResult.result + ': '+
				aResult.testDescription + '\n'+
				utils.formatError(aResult.exception);

		this.result += '\n' + aResult;

		results.push(aResult);
	});

	if (!results.length)
		results = 'All tests succeed.'
	else
		results = results.join('\n');

	var data = { result : results };
	ObserverService.notifyObservers(this, 'UxU:TestFinish', data.toSource());
}

function report(aReport)
{
	this.testCount++;
	switch (aReport.result)
	{
		case 'success':
			this.result += '.';
			break;
		case 'failure':
			this.result += 'F';
			break;
		case 'error':
			this.result += 'E';
			reak;
		default:
			this.result += '?';
			break;
	}

	var data = {
			description : aReport.testDescription,
			result      : (aReport.result || 'unknown'),
			exception   : aReport.exception
		};
	ObserverService.notifyObservers(this, 'UxU:TestProgress', data.toSource());

	if (aReport.exception)
		this.badResults.push(aReport);
}


function error(aError)
{
	window.alert(aError);
}
