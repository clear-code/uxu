// from MozLab
function go(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers)
{
	if (aEventHandlers['state/enter'])
		aEventHandlers['state/enter'].forEach(function(aEventHandler) {
			aEventHandler.call(aContext, aStateName);
		});

	aStateHandlers[aStateName].call(
		aContext,
		function(aExitResult)
		{
			if (aEventHandlers['state/exit'])
				aEventHandlers['state/exit'].forEach(function(aEventHandler) {
					aEventHandler.call(aContext, aStateName);
				});

			var nextState = aStateTransitions[aStateName][aExitResult];
			if (nextState)
				go(nextState, aContext, aStateHandlers, aStateTransitions, aEventHandlers);
		}
	);
}
