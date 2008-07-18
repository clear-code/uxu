// -*- indent-tabs-mode: t; tab-width: 4 -*-

const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var ObserverService = Cc['@mozilla.org/observer-service;1']
		.getService(Ci.nsIObserverService);

function constructor(aListener)
{
	this.listener   = aListener;
	this.testCount  = 0;
	this.finished   = false;
	this.result     = '';
	this.badResults = [];
}

function handleEvent(aEvent)
{
	switch (aEvent.type)
	{
		case 'Start':
			this.onStart();
			break;

		case 'Report':
			this.report(aEvent.data);
			break;

		case 'Finish':
			this.onFinish();
			break;

		case 'Error':
			this.error(aEvent.data);
			break;
	}
}

function isFinished()
{
	return this.finished;
}

function onStart()
{
	this.finished = false;
	this.listener.onStart();
}

function onFinish()
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
	this.listener.onFinish(data);
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
			break;
		default:
			this.result += '?';
			break;
	}

	var data = {
			description : aReport.testDescription,
			result      : (aReport.result || 'unknown'),
			exception   : aReport.exception
		};
	this.listener.onTestFinish(data);

	if (aReport.exception)
		this.badResults.push(aReport);
}


function error(aError)
{
	dump(utils.formatError(aError));
}
