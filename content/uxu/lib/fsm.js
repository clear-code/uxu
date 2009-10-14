// from MozLab
function go(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers)
{
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
			if (nextState)
				window.setTimeout(go, 0, nextState, aContext, aStateHandlers, aStateTransitions, aEventHandlers);
		}
	);
}
