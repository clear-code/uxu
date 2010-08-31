if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['fsm'];

var ns = {};
Components.utils.import('resource://uxu-modules/lib/jstimer.jsm', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);

var utils = ns.utils;

var fsm = {

	go : function(aState, aHandlers, aTransitions)
	{
		var iterator = _go(aState, aHandlers, aTransitions);
		var timer, canceller;
		try {
			iterator.next();
			timer = ns.setInterval(function() {
					try {
						iterator.next();
					}
					catch(e if e instanceof StopIteration) {
						ns.clearInterval(timer);
					}
				}, 1);
			canceller = _createCanceller(timer);
		}
		catch(e if e instanceof StopIteration) {
			// finished
			canceller = _createCanceller();
		}
		return canceller;
	}

};

function _go(aState, aHandlers, aTransitions)
{
	var interval = utils.getPref('dom.max_chrome_script_run_time') * 1000 / 5;
	var start = Date.now();
	while (true)
	{
		let result = null;
		aHandlers[aState].call(
			aHandlers,
			function(aResult) // continuation function
			{
				result = aResult;
			}
		);

		// wait until the continuation function is called
		while (!result)
		{
			yield;
		}

		// split the loop to prevent "Warning: Unresponsive script" dialog
		let now = Date.now();
		if (now - start >= interval) {
			start = now;
			yield;
		}

		aState = aTransitions[aState][result];
		if (!aState) // all states are done!
			break;
	}
}

function _createCanceller(aTimer)
{
	return function() {
			if (!aTimer) return;
			ns.clearInterval(aTimer);
			aTimer = null;
		};
}
