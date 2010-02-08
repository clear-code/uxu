// from MozLab
function go(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers)
{
	function generate(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers)
	{
		if (!aEventHandlers) aEventHandlers = {};
		var stateName = aStateName;
		var start = Date.now();
		while (true)
		{
			if ('state/enter' in aEventHandlers)
				aEventHandlers['state/enter'].forEach(function(aEventHandler) {
					aEventHandler.call(aContext, stateName);
				});

			let exitResult = null;
			aStateHandlers[stateName].call(
				aContext,
				function(aExitResult)
				{
					if ('state/exit' in aEventHandlers)
						aEventHandlers['state/exit'].forEach(function(aEventHandler) {
							aEventHandler.call(aContext, stateName);
						});

					exitResult = aExitResult;
				}
			);

			// continuation関数が実行されるまで待つ
			while (!exitResult)
			{
				yield;
			}

			// 一定以上の時間が経過したら強制的にループを切る。
			// 長時間ループが回り続けると、Firefox自身が警告を表示してしまう。
			let now = Date.now();
			if (now - start >= 5000) {
				start = now;
				yield;
			}

			stateName = aStateTransitions[stateName][exitResult];
			if (!stateName) // 全stateを通過し終えたので、終了
				break;
		}
	}

	var iterator = generate(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers);
	try {
		iterator.next();
		var timer = window.setInterval(function() {
				try {
					iterator.next();
				}
				catch(e if e instanceof StopIteration) {
					window.clearInterval(timer);
				}
			}, 1);
	}
	catch(e if e instanceof StopIteration) {
		// finished
	}
}
