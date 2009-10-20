// from MozLab
var MAX_NEST = 50;
function go(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers, aNest)
{
	if (!aNest) aNest = { count : 0 };
	if (!aEventHandlers) aEventHandlers = {};
	if ('state/enter' in aEventHandlers)
		aEventHandlers['state/enter'].forEach(function(aEventHandler) {
			aEventHandler.call(aContext, aStateName);
		});

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
				if (++aNest.count < MAX_NEST)
					go(nextState, aContext, aStateHandlers, aStateTransitions, aEventHandlers, aNest);
				else
					window.setTimeout(go, 0, nextState, aContext, aStateHandlers, aStateTransitions, aEventHandlers);
			}
		}
	);
}
