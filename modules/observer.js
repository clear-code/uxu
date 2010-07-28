if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Observer'];

const Cc = Components.classes;
const Ci = Components.interfaces;
const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

function Observer()
{
	this.clear();
}

Observer.prototype = {
	get lastSubject() {
		return this.subjects.length ? this.subjects[this.subjects.length-1] : null ;
	},
	get lastTopic() {
		return this.topics.length ? this.topics[this.topics.length-1] : null ;
	},
	get lastData() {
		return this.data.length ? this.data[this.data.length-1] : null ;
	},
	get count() {
		return this.subjects.length;
	},

	observe : function(aSubject, aTopic, aData)
	{
		this.subjects.push(aSubject);
		this.topics.push(aTopic);
		this.data.push(aData);
	},

	startObserve : function(aTopic)
	{
		ObserverService.addObserver(this, aTopic, false);
	},

	endObserve : function(aTopic)
	{
		ObserverService.removeObserver(this, aTopic);
	},

	stopObserve : function(aTopic)
	{
		this.endObserve(aTopic);
	},

	clear : function()
	{
		this.subjects = [];
		this.topics = [];
		this.data = [];
	}
};

