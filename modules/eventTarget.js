if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['EventTarget'];

function EventTarget()
{
	this.initListeners();
}

EventTarget.prototype = {

initListeners : function()
{
	this._listeners = [];
},
 
inheritListeners : function(aOriginal) 
{
	this._ensureHasOwnListeners();
	aOriginal._ensureHasOwnListeners();
	aOriginal._listeners.forEach(function(aListener) {
		this.addListener(aListener);
		if (aListener._listeners.indexOf(aOriginal) > -1 &&
			'addListener' in aListener)
			aListener.addListener(this);
	}, this);
},

_ensureHasOwnListeners : function()
{
	if (this.hasOwnProperty('_listeners')) return;
	this.initListeners();
},

addListener : function(aListener) 
{
	this._ensureHasOwnListeners();
	if (this._listeners.indexOf(aListener) < 0)
		this._listeners.push(aListener);
},
 
removeListener : function(aListener) 
{
	this._ensureHasOwnListeners();
	var index = this._listeners.indexOf(aListener);
	if (index > -1)
		this._listeners.splice(index, 1);
},
 
removeAllListeners : function() 
{
	this._ensureHasOwnListeners();
	this._listeners.forEach(function(aListener) {
		if ('removeListener' in aListener)
			aListener.removeListener(this);
	}, this);
	this._listeners = [];
},
 
fireEvent : function(aType, aData) 
{
//	this._ensureHasOwnListeners();
	var event = {
			type   : aType,
			target : this,
			data   : aData
		};
	// We have to clone array before dispatch event, because
	// it will be stopped unexpectedly if some listener is
	// dynamically removed.
	Array.slice(this._listeners).forEach(function(aListener) {
		if (!aListener) return;
		try {
			if (typeof aListener == 'function')
				aListener(event);
			else if ('handleEvent' in aListener &&
					typeof aListener.handleEvent == 'function')
				aListener.handleEvent(event);
			else if ('on'+aType in aListener &&
					typeof aListener['on'+aType] == 'function')
				aListener['on'+aType](event);
		}
		catch(e) {
		}
	});
}

};
