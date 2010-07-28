// -*- indent-tabs-mode: t; tab-width: 4 -*- 

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['MailObserver'];

var ns = {};
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/observer.js', ns);

var utils = ns.utils;

function MailObserver()
{
	this.clear();
	this.startObserve('uxu:mail:sent');
}

MailObserver.prototype = {
	__proto__ : ns.Observer.prototype,

	destroy : function()
	{
		this.clear();
		this.endObserve('uxu:mail:sent');
	},

	observe : function(aSubject, aTopic, aData)
	{
		this.subjects.push(aSubject);
		this.topics.push(aTopic);
		aData = utils.evalInSandbox(aData);
		this.data.push(aData);
	}
};
