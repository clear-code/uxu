var fsm;

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
	fsm = {};
	utils.include('../../../../content/uxu/lib/fsm.js', fsm);
}

function tearDown()
{
}

testSimpleTransitions.description = '前に進むだけ';
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
	eventHandlers.log = [];
	fsm.go('state1', {}, stateHandlers, stateTransitions, eventHandlers);
	assert.equals('abc', string);
	assert.arrayEquals(
		'state1 enter,state1 exit,state2 enter,state2 exit,state3 enter,state3 exit'.split(','),
		eventHandlers.log
	);
}

testSimpleBackTransitions.description = '進んだり戻ったり';
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
	eventHandlers.log = [];
	fsm.go('state1', {}, stateHandlers, stateTransitions, eventHandlers);
	assert.equals('aabbcc', string);
	assert.arrayEquals(
		'state1 enter,state1 exit,state1 enter,state1 exit,state2 enter,state2 exit,state2 enter,state2 exit,state3 enter,state3 exit,state3 enter,state3 exit'.split(','),
		eventHandlers.log
	);
}

testDelayedTransitions.description = '処理待ち';
function testDelayedTransitions()
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
			}, 100);
		},
		state2 : function(aContinuation) {
			string += 'b';
			window.setTimeout(function() {
				aContinuation('ok');
			}, 100);
		},
		state3 : function(aContinuation) {
			string += 'c';
			window.setTimeout(function() {
				aContinuation('ok');
			}, 100);
		}
	};
	eventHandlers.log = [];
	fsm.go('state1', {}, stateHandlers, stateTransitions, eventHandlers);
	yield 500;
	assert.equals('abc', string);
	assert.arrayEquals(
		'state1 enter,state1 exit,state2 enter,state2 exit,state3 enter,state3 exit'.split(','),
		eventHandlers.log
	);
}

testFailedTransitions.description = '失敗例';
function testFailedTransitions()
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
	eventHandlers.log = [];
	fsm.go('state1', {}, stateHandlers, stateTransitions, eventHandlers);
	assert.equals('a', string);
	assert.arrayEquals(
		['state1 enter'],
		eventHandlers.log
	);
}
