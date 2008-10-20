const Cc = Components.classes;
const Ci = Components.interfaces;

function constructor()
{
	this._init();
	this.clear();
}

function observe(aSubject, aTopic, aData)
{
	this.subjects.push(aSubject);
	this.topics.push(aTopic);
	this.data.push(aData);
}

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

function startObserve(aTopic)
{
	ObserverService.addObserver(this, aTopic, false);
}

function endObserve(aTopic)
{
	ObserverService.removeObserver(this, aTopic);
}

function clear()
{
	this.subjects = [];
	this.topics = [];
	this.data = [];
}

function _init()
{
	this.__defineGetter__('lastSubject', function() {
		return this.subjects.length ? this.subjects[this.subjects.length-1] : null ;
	});
	this.__defineGetter__('lastTopic', function() {
		return this.topics.length ? this.topics[this.topics.length-1] : null ;
	});
	this.__defineGetter__('lastData', function() {
		return this.data.length ? this.data[this.data.length-1] : null ;
	});
	this.__defineGetter__('count', function() {
		return this.subjects.length;
	});
}

