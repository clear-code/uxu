// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var ObserverService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);

function constructor(output)
{
    this.output = output;
    this.n_tests = 0;
	this.finished = false;
	this.result = "";
	this.bad_results = [];
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
	var i;

	this.finished = true;

	var result;
	var results = [];

	for (i = 0; i < this.bad_results.length; i++) {
		var bad_result = this.bad_results[i];

		result = bad_result.result + ": "+
				bad_result.testDescription + "\n"+
				utils.formatError(bad_result.exception);

		this.result += "\n" + result;

		results.push(result);
	}

	if (!results.length)
		results = 'All tests succeed.'
	else
		results = results.join('\n');

	var data = { result : results };
	ObserverService.notifyObservers(this, 'UxU:TestFinish', data.toSource());
}

function report(rep)
{
	this.n_tests++;
    if (rep.result == "success") {
        this.result += ".";
    } else if (rep.result == "failure") {
        this.result += "F";
    } else if (rep.result == "error") {
        this.result += "E";
    } else {
        this.result += "?";
    }

	var data = {
			description : rep.testDescription,
			result      : (rep.result || 'unknown'),
			exception   : rep.exception
		};
	ObserverService.notifyObservers(this, 'UxU:TestProgress', data.toSource());

    if (rep.exception)
        this.bad_results.push(rep);
}


function error(e)
{
	alert(e);
}
