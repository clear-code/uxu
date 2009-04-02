const Cc = Components.classes;
const Ci = Components.interfaces;

function constructor()
{
	this._exceptions = [];
	this.__defineGetter__('exception', function() {
		var e = this._exceptions;
		return e.length == 0 ? void(0) : e[e.length-1];
	});
	this.__defineSetter__('exception', function(aException) {
		if (aException)
			this._exceptions.push(aException);
		return aException;
	});
	this.__defineGetter__('exceptions', function() {
		return this._exceptions;
	});

	this._descriptions = [];
	this.__defineGetter__('description', function() {
		var d = this._descriptions;
		return d.length == 0 ? void(0) : d[d.length-1];
	});
	this.__defineSetter__('description', function(aDescription) {
		if (aDescription)
			this._descriptions.push(aDescription);
		return aDescription;
	});
	this.__defineGetter__('descriptions', function() {
		return this._descriptions;
	});

	this._notifications = [];
	this.__defineGetter__('notifications', function() {
		return this._notifications;
	});
	this.__defineSetter__('notifications', function(aNotifications) {
		this._notifications = aNotifications;
		return aNotifications;
	});

	this._startAt = -1;
	this._finishAt = -1;
	this.__defineGetter__('time', function() {
		return (this._startAt < 0 || this._finishAt < 0) ?
			0 :
			this._finishAt - this._startAt ;
	});

	this._startAtDetailed = -1;
	this._finishAtDetailed = -1;
	this.__defineGetter__('detailedTime', function() {
		return (this._startAtDetailed < 0 || this._finishAtDetailed < 0) ?
			0 :
			this._finishAtDetailed - this._startAtDetailed ;
	});

	this.onStart();
}

function onStart()
{
	this._startAt = Date.now();
}

function onFinish()
{
	this._finishAt = Date.now();
}

function onDetailedStart()
{
	this._startAtDetailed = Date.now();
}

function onDetailedFinish()
{
	this._finishAtDetailed = Date.now();
}
