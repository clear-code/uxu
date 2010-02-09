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

			// continuation�֐������s�����܂ő҂�
			while (!exitResult)
			{
				yield;
			}

			// ���ȏ�̎��Ԃ��o�߂����狭���I�Ƀ��[�v��؂�B
			// �����ԃ��[�v����葱����ƁAFirefox���g���x����\�����Ă��܂��B
			let now = Date.now();
			if (now - start >= 5000) {
				start = now;
				yield;
			}

			stateName = aStateTransitions[stateName][exitResult];
			if (!stateName) // �Sstate��ʉ߂��I�����̂ŁA�I��
				break;
		}
	}

	var iterator = generate(aStateName, aContext, aStateHandlers, aStateTransitions, aEventHandlers);
	var timer, canceller;
	try {
		iterator.next();
		timer = window.setInterval(function() {
				try {
					iterator.next();
				}
				catch(e if e instanceof StopIteration) {
					window.clearInterval(timer);
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

function _createCanceller(aTimer)
{
	return function() {
			if (!aTimer) return;
			window.clearInterval(aTimer);
			aTimer = null;
		};
}
