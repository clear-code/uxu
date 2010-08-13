if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Report'];

const Cc = Components.classes;
const Ci = Components.interfaces;

function Report()
{
	this.result = null;

	this._exceptions = [];
	this._descriptions = [];
	this._parameters = [];
	this._notifications = [];

	this._startAt = -1;
	this._finishAt = -1;

	this._startAtDetailed = -1;
	this._finishAtDetailed = -1;

	this.onStart();
}

Report.prototype = {

	get exception() {
		var e = this._exceptions;
		return e.length == 0 ? void(0) : e[e.length-1];
	},
	set exception(aException) {
		if (aException)
			this._exceptions.push(aException);
		return aException;
	},
	get exceptions() {
		return this._exceptions;
	},

	get description() {
		var d = this._descriptions;
		return d.length == 0 ? void(0) : d[d.length-1];
	},
	set description(aDescription) {
		if (aDescription)
			this._descriptions.push(aDescription);
		return aDescription;
	},
	get descriptions() {
		return this._descriptions;
	},

	get parameter() {
		var d = this._parameters;
		return d.length == 0 ? void(0) : d[d.length-1];
	},
	set parameter(aDescription) {
		if (aDescription)
			this._parameters.push(aDescription);
		return aDescription;
	},
	get parameters() {
		return this._parameters;
	},

	get notifications() {
		return this._notifications;
	},
	set notifications(aNotifications) {
		this._notifications = aNotifications;
		return aNotifications;
	},

	get time() {
		return (this._startAt < 0 || this._finishAt < 0) ?
			0 :
			this._finishAt - this._startAt ;
	},
	get detailedTime() {
		return (this._startAtDetailed < 0 || this._finishAtDetailed < 0) ?
			0 :
			this._finishAtDetailed - this._startAtDetailed ;
	},

	onStart : function()
	{
		this._startAt = Date.now();
	},

	onFinish : function()
	{
		this._finishAt = Date.now();
	},

	onDetailedStart : function()
	{
		this._startAtDetailed = Date.now();
	},

	onDetailedFinish : function()
	{
		this._finishAtDetailed = Date.now();
	}
};
