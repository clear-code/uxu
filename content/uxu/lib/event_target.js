function constructor()
{
	this.initListeners();
}

function initListeners()
{
	this._listeners = [];
}

function addListener(aListener) 
{
	if (this._listeners.indexOf(aListener) < 0)
		this._listeners.push(aListener);
}
 
function removeListener(aListener) 
{
	var index = this._listeners.indexOf(aListener);
	if (index > -1)
		this._listeners.splice(index, 1);
}
 
function fireEvent(aType, aData) 
{
	var event = {
			type   : aType,
			target : this,
			data   : aData
		};
	Array.slice(this._listeners).forEach(function(aListener) {
		if (!aListener) return;
		try {
			if (typeof aListener == 'function')
				aListener(event);
			else if ('handleEvent' in aListener &&
					typeof aListener.handleEvent == 'function')
				aListener.handleEvent(event);
		}
		catch(e) {
		}
	});
}
