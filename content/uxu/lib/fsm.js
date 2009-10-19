// from MozLab
function go(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers)
{
	if (!aEventHandlers) aEventHandlers = {};
	if ('state/enter' in aEventHandlers)
		aEventHandlers['state/enter'].forEach(function(aEventHandler) {
			aEventHandler.call(aContext, aStateName);
		});

	var nest = 0;
	var MAX_NEST = 50;

	aStateHandlers[aStateName].call(
		aContext,
		function(aExitResult)
		{
			if ('state/exit' in aEventHandlers)
				aEventHandlers['state/exit'].forEach(function(aEventHandler) {
					aEventHandler.call(aContext, aStateName);
				});

			var nextState = aStateTransitions[aStateName][aExitResult];
			if (nextState) {
				if (++nest < MAX_NEST)
					go(nextState, aContext, aStateHandlers, aStateTransitions, aEventHandlers);
				else
					window.setTimeout(go, 0, nextState, aContext, aStateHandlers, aStateTransitions, aEventHandlers);
			}
		}
	);
}
