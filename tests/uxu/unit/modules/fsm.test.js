var topDir = baseURL+'../../../../';
var fsm;
var canceller;

var eventHandlers = {
	'state/enter' : [
		function(aState)
		{
			eventHandlers.log.push(aState+' enter');
		}
	],
	'state/exit' : [
		function(aState)
		{
			eventHandlers.log.push(aState+' exit');
		}
	],
	log : []
};

function setUp()
{
	fsm = utils.import(topDir+'modules/fsm.js', {}).fsm;
}

function tearDown()
{
	if (canceller)
		canceller();
	canceller = null;
}


function assertGo()
{
	eventHandlers.log = [];
	canceller = fsm.go.apply(fsm, arguments);
	assert.isFunction(canceller);
	yield 500;
}

function testSimpleTransitions()
{
	var stateTransitions = {
		state1 : { ok : 'state2' },
		state2 : { ok : 'state3' },
		state3 : {}
	}
	var string = '';
	var stateHandlers = {
		state1 : function(aContinuation) {
			string += 'a';
			aContinuation('ok');
		},
		state2 : function(aContinuation) {
			string += 'b';
			aContinuation('ok');
		},
		state3 : function(aContinuation) {
			string += 'c';
			aContinuation('ok');
		}
	};
	yield Do(assertGo('state1', {}, stateHandlers, stateTransitions, eventHandlers));
	assert.equals('abc', string);
	assert.equals(
		'state1 enter,state1 exit,state2 enter,state2 exit,state3 enter,state3 exit'.split(','),
		eventHandlers.log
	);
}

function testSimpleBackTransitions()
{
	var stateTransitions = {
		state1 : { ok : 'state2', ko : 'state1' },
		state2 : { ok : 'state3', ko : 'state2' },
		state3 : { ko : 'state3' }
	}
	var string = '';
	var state1passed = false;
	var state2passed = false;
	var state3passed = false;
	var stateHandlers = {
		state1 : function(aContinuation) {
			string += 'a';
			if (!state1passed) {
				state1passed = true;
				aContinuation('ko');
			}
			else {
				aContinuation('ok');
			}
		},
		state2 : function(aContinuation) {
			string += 'b';
			if (!state2passed) {
				state2passed = true;
				aContinuation('ko');
			}
			else {
				aContinuation('ok');
			}
		},
		state3 : function(aContinuation) {
			string += 'c';
			if (!state3passed) {
				state3passed = true;
				aContinuation('ko');
			}
			else {
				aContinuation('ok');
			}
		}
	};
	yield Do(assertGo('state1', {}, stateHandlers, stateTransitions, eventHandlers));
	assert.equals('aabbcc', string);
	assert.equals(
		'state1 enter,state1 exit,state1 enter,state1 exit,state2 enter,state2 exit,state2 enter,state2 exit,state3 enter,state3 exit,state3 enter,state3 exit'.split(','),
		eventHandlers.log
	);
}

function testTransitionsWithDelay()
{
	var stateTransitions = {
		state1 : { ok : 'state2' },
		state2 : { ok : 'state3' },
		state3 : {}
	}
	var string = '';
	var stateHandlers = {
		state1 : function(aContinuation) {
			string += 'a';
			window.setTimeout(function() {
				aContinuation('ok');
			}, 10);
		},
		state2 : function(aContinuation) {
			string += 'b';
			window.setTimeout(function() {
				aContinuation('ok');
			}, 10);
		},
		state3 : function(aContinuation) {
			string += 'c';
			window.setTimeout(function() {
				aContinuation('ok');
			}, 10);
		}
	};
	yield Do(assertGo('state1', {}, stateHandlers, stateTransitions, eventHandlers));
	assert.equals('abc', string);
	assert.equals(
		'state1 enter,state1 exit,state2 enter,state2 exit,state3 enter,state3 exit'.split(','),
		eventHandlers.log
	);
}


// We must call the continuation function in every state handlers.
// If it is not called, then "state exit" event doesn't dispatched.

function testInvalidTransitions_noContinuation()
{
	var stateTransitions = {
		state1 : { ok : 'state2' },
		state2 : { ok : 'state3' },
		state3 : {}
	}
	var string = '';
	var stateHandlers = {
		state1 : function(aContinuation) {
			string += 'a';
		},
		state2 : function(aContinuation) {
			string += 'b';
		},
		state3 : function(aContinuation) {
			string += 'c';
		}
	};
	yield Do(assertGo('state1', {}, stateHandlers, stateTransitions, eventHandlers));
	assert.equals('a', string);
	assert.equals(
		['state1 enter'],
		eventHandlers.log
	);
}

function testInvalidTransitions_noContinuationOnLastState()
{
	var stateTransitions = {
		state1 : { ok : 'state2' },
		state2 : { ok : 'state3' },
		state3 : {}
	}
	var string = '';
	var stateHandlers = {
		state1 : function(aContinuation) {
			string += 'a';
			aContinuation('ok');
		},
		state2 : function(aContinuation) {
			string += 'b';
			aContinuation('ok');
		},
		state3 : function(aContinuation) {
			string += 'c';
		}
	};
	yield Do(assertGo('state1', {}, stateHandlers, stateTransitions, eventHandlers));
	assert.equals('abc', string);
	assert.equals(
		'state1 enter,state1 exit,state2 enter,state2 exit,state3 enter'.split(','),
		eventHandlers.log
	);
}
