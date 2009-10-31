// -*- indent-tabs-mode: t; tab-width: 4 -*- 

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils  = lib_module.require('package', 'utils');

var inherits = lib_module.require('class', 'observer');

function constructor() 
{
	this._init();
	this.clear();
	this.startObserve('uxu:mail:sent');
}

function destroy()
{
	this.clear();
	this.endObserve('uxu:mail:sent');
}

function observe(aSubject, aTopic, aData)
{
	this.subjects.push(aSubject);
	this.topics.push(aTopic);
	aData = utils.evalInSandbox(aData);
	this.data.push(aData);
}
