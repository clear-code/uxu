/* 
 * Copyright (C) 2006 by Massimiliano Mirra
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301 USA
 *
 * Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>
 *
 */

// Modified by SHIMODA Hiroshi <shimoda@clear-code.com>
 
//var module = new ModuleManager(['chrome://mozlab/content']); 
//const fsm = module.require('package', 'lib/fsm');
var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var fsm    = lib_module.require('package', 'fsm');
var bundle = lib_module.require('package', 'bundle');
var utils  = lib_module.require('package', 'utils');
 
/**
 * Invocation: 
 *     var case = new TestCase('Widget tests');
 *     var case = new TestCase('Widget tests', {runStrategy: 'async'});
 *
 * Use async run strategy when test cases mustn't be run immediately
 * after test setup, for example when during setup a document is
 * loaded into the browser and the browser will signal when the
 * document has finished loading through a callback.
 *
 * Note: code inside tests will still run sequentially.  In some
 * cases, e.g. testing interfaces, this means you will do something to
 * affect the interface and then test the effect, before the interface
 * thread has had a chance to apply your request.  Control of flow
 * inside tests is work in progress.
 *
 * Alias:
 *     var spec = new Specification();
 *
 */
 
function constructor(title, opts, namespace) { 
	opts = opts || {};

	this._title = title;
	this._runStrategy = opts.runStrategy;
	this.__defineGetter__('runStrategy', function() {
		return this._runStrategy;
	});
	this._tests = [];
	this._context = {};
	this._reportHandler = _defaultReportHandler;

	if (!namespace) {
		var path;
		var stack = Components.stack;
		do {
			path = stack.filename;
			if (path.indexOf('chrome://uxu/content/test/helper/subScriptRunner.js?') != 0)
				continue;
			/.+includeSource=([^;]+)/.test(path);
			namespace = RegExp.$1;
			break;
		}
		while (stack = stack.caller);
	}
	this._namespace = namespace;

	this.masterPriority = null;

	this.__defineSetter__(
		'tests', function(hash) {
			this.setTests(hash);
		});

	this.__defineSetter__(
		'stateThat', function(hash) {
			this.setTests(hash);
		});

	this.__defineSetter__(
		'reportHandler', function(callback) {
			this._reportHandler = callback;
		});
	this.__defineGetter__(
		'reportHandler', function() {
			return this._reportHandler;
		});

	this.__defineGetter__(
		'title', function() {
			return this._title;
		});

	this.__defineSetter__(
		'context', function(aContext) {
			this._context = aContext;
		});
	this.__defineGetter__(
		'context', function() {
			return this._context;
		});

	this._done = false;
	this.__defineGetter__(
		'done', function() {
			return this._done;
		});
}
 
/**
 * Define test cases, optionally with setup and teardown. 
 *
 *     var case = new TestCase();
 *     case.tests = {
 *         setUp: function() {
 *             this.plusFactor = 4;
 *         },
 *
 *         testOperation: function() {
 *             assert.equals(8, 2+2+this.plusFactor);
 *         },
 *
 *         tearDown: function() {
 *             // release resources if necessary
 *         }
 *     }
 *
 * Every test is run in a context created ex-novo and accessible from
 * the test itself via the 'this' identifier.
 *
 * Aliases: setTests(), 'stateThat'.  'setUp' is also aliased to
 * 'given'.  'stateThat' and 'given' allow a more Behaviour-Driven
 * Development style.
 *
 *     var spec = new Specification();
 *     spec.stateThat = {
 *         given: function() {
 *             this.plusFactor = 4;
 *         },
 *
 *         'Adding two and two and plus factor yields eight': function() {
 *             assert.equals(8, 2+2+this.plusFactor);
 *         },
 *
 *         tearDown: function() {
 *             // release resources if necessary
 *         }
 *     }
 */
	 
function setTests(hash) { 
	this.context = hash;
	for(var desc in hash)
	{
		if(desc == 'setUp' || desc == 'given') {
			this.registerSetUp(hash[desc]);
		}
		else if(desc == 'tearDown') {
			this.registerTearDown(hash[desc]);
		}
		else if(desc == 'inspect') {
		}
		else {
			hash[desc].description = desc;
			this.registerTest(hash[desc]);
		}
	}
}
 
// for UxU declaration style syntax 
	
function registerSetUp(aFunction) { 
	this._setUp = aFunction;
}
 
function registerTearDown(aFunction) { 
	this._tearDown = aFunction;
}
 
function registerTest(aFunction) { 
	var source = aFunction.toSource();
	if (
		this._tests.some(function(aTest) {
			return (aTest.source == source);
		})
		)
		return;

	this._tests.push({
		name     : (this._namespace + '::' + this.title + '::' + aFunction.description),
		desc     : aFunction.description,
		code     : aFunction,
		source   : aFunction.toSource(),
		priority : (
			typeof aFunction.priority == 'number' ?
				aFunction.priority :
				(String(aFunction.priority || '').toLowerCase() || 'normal')
		),
		id       : 'test-'+parseInt(Math.random() * 65000)
	});
}
  
/**
 * Alternative style for defining setup. 
 *
 */
	
function setUp(fn) { 
	this.registerSetUp(fn);
}
 
function tearDown(fn) { 
	this.registerTearDown(fn);
}
 
function test(desc, code) { 
	code.description = desc;
	this.registerTest(code);
}
  
// BDD-style alias 
	
/**
 * BDD-alias for setUp(). 
 *
 */
function given(fn) {
	this.setUp(fn);
}
 
/**
 * BDD-style alias for test(). 
 *
 */
function states(desc, fn) {
	this.test(desc, fn);
}
 
/**
 * BDD-style alias for run(). 
 *
 *    var spec = new Specification();
 *    spec.stateThat = { ... };
 *    spec.verify();
 *
 */
function verify(aStopper) {
	this.run(aStopper);
}
   
/**
 * Runs tests with strategy defined at construction time. 
 *
 *    var case = new TestCase();
 *    case.tests = { ... };
 *    case.run();
 *
 */
function run(aStopper) {
	this._stopper = aStopper;
	this[this._runStrategy == 'async' ? '_asyncRun1' : '_syncRun1'](
		this._tests, this._setUp, this._tearDown, this._reportHandler);
}
	 
function _exec1(test, setUp, tearDown, context, continuation, aReport) { 
	var report = {
		result:    undefined,
		exception: undefined
	};

	if (this._stopper && this._stopper()) return report;

	try {
		if (setUp)
			setUp.call(context);

		var result = test.code.call(context);

		if (utils.isGeneratedIterator(result)) {
			aReport.report = report;
			utils.doIteration(result, {
				onEnd : function(e) {
					aReport.report.result = 'success';
					_onFinish(test, aReport.report.result);
					continuation('ok');
				},
				onFail : function(e) {
					aReport.report.result = 'failure';
					aReport.report.exception = e;
					_onFinish(test, aReport.report.result);
					continuation('ok');
				},
				onError : function(e) {
					aReport.report.result = 'error';
					aReport.report.exception = e;
					_onFinish(test, aReport.report.result);
					continuation('ok');
				}
			});

			if(tearDown)
				tearDown.call(context);

			return report;
		}

		if(tearDown)
			tearDown.call(context);

		report.result = 'success';
		_onFinish(test, report.result);
	} catch(exception if exception.name == 'AssertionFailed') {
		report.result = 'failure';
		report.exception = exception;
		_onFinish(test, report.result);
	} catch(exception) {
		report.result = 'error';
		report.exception = exception;
		_onFinish(test, report.result);
	}

	return report;
}
 	
function _syncRun1(tests, setUp, tearDown, reportHandler) { 
	var test, context, report;
	for(var i=0, l=tests.length; i<l; i++) {
		test = tests[i];
		context = test.context || {};
		if (!this._checkPriorityToExec(test)) {
			report = { result : 'passover' }
		}
		else {
			report = _exec1(test, setUp, tearDown, context);
		}
		report.testOwner = this;
		report.testDescription = test.desc;
		report.testID = test.id;
		report.testCode = test.code;
		report.testIndex = i+1;
		report.testCount = l;
		if (typeof reportHandler == 'function')
			reportHandler(report);
		else if (reportHandler && 'handleReport' in reportHandler)
			reportHandler.handleReport(report);
		else
			throw new Error('invalid report handler');
	}
	if (reportHandler && 'onFinish' in reportHandler)
		reportHandler.onFinish();

	this._done = true;
}
 
function _asyncRun1(tests, setUp, tearDown, reportHandler) { 
	var testIndex = 0;
	var context;
	var report = { report : null };

	var stateTransitions = {
		start:         { ok: 'checkPriority' },
		checkPriority: { ok: 'doSetUp', ko: 'nextTest' },
		doSetUp:       { ok: 'doTest', ko: 'doReport' },
		doTest:        { ok: 'doReport' },
		doReport:      { ok: 'doTearDown' },
		doTearDown:    { ok: 'nextTest', ko: 'nextTest' },
		nextTest:      { ok: 'checkPriority', ko: 'finished' },
		finished:      { }
	}

	var nullContinuation = function() {};

	_this = this;
	var stateHandlers = {
		start: function(continuation) {
			continuation('ok')
		},
		checkPriority: function(continuation) {
			if (_this._checkPriorityToExec(tests[testIndex])) {
				continuation('ok');
				return;
			}
			report.report = {};
			report.report.result = 'passover'; // 'success';
			stateHandlers.doReport(nullContinuation);
			continuation('ko');
		},
		doSetUp: function(continuation) {
			if (!setUp) {
				continuation('ok');
				return;
			}
			context = _this.context || {};
			report.report = {};
			try {
				var result = setUp.call(context, continuation);
				if (utils.isGeneratedIterator(result)) {
					utils.doIteration(result, {
						onEnd : function(e) {
							if (setUp.arity == 0) continuation('ok');
						},
						onError : function(e) {
							report.report.result = 'error';
							report.report.exception = e;
							report.report.testDescription = bundle.getString('report_description_setup');
							continuation('ko');
						}
					});
				}
				else {
					if (setUp.arity == 0) continuation('ok');
				}
			} catch(e) {
				report.report.result = 'error';
				report.report.exception = e;
				report.report.testDescription = bundle.getString('report_description_setup');
				continuation('ko');
			}
		},
		doTest: function(continuation) {
			var test;
			test = tests[testIndex];
			var newReport = _exec1(test, null, null, context, continuation, report);
			if (newReport.result) {
				report.report = newReport;
				report.report.testDescription = test.desc;
				continuation('ok');
			}
			else {
				report.report.testDescription = test.desc;
			}
		},
		doReport: function(continuation) {
			_onFinish(tests[testIndex], report.report.result);
			report.report.testOwner = _this;
			report.report.testIndex = testIndex + 1;
			report.report.testCount = tests.length;
			if (typeof reportHandler == 'function')
				reportHandler(report.report);
			else if (reportHandler && 'handleReport' in reportHandler)
				reportHandler.handleReport(report.report);
			else
				throw new Error('invalid report handler');
			continuation('ok');
		},
		doTearDown: function(continuation) { // exceptions in setup/teardown are not reported correctly
			if (!tearDown) {
				continuation('ok');
				return;
			}
			try {
				// perhaps should pass continuation to tearDown as well
				var result = tearDown.call(context);
				if (utils.isGeneratedIterator(result)) {
					utils.doIteration(result, {
						onEnd : function(e) {
							continuation('ok');
						},
						onError : function(e) {
							_onFinish(tests[testIndex], 'error');
							continuation('ko');
						}
					});
				}
				else {
					continuation('ok');
				}
			} catch(e) {
				continuation('ko');
			}
		},
		nextTest: function(continuation) {
			if (_this._stopper && _this._stopper()) {
				continuation('ko');
				return;
			}
			testIndex += 1;
			tests[testIndex] ? continuation('ok') : continuation('ko');
		},
		finished: function(continuation) {
			if (reportHandler && 'onFinish' in reportHandler)
				reportHandler.onFinish();
			_this._done = true;
		}
	}

	fsm.go('start', {}, stateHandlers, stateTransitions, []);
}
 
function _checkPriorityToExec(aTest) { 
	var priority = (aTest.priority == 'never') ? 'never' : (this.masterPriority || aTest.priority);
	if (typeof priority == 'number') {
		priority = Math.min(1, Math.max(0, priority));
		switch (priority)
		{
			case 1:
				return true;
			case 0:
				return false;
			default:
				break;
		}
	}
	else {
		priority = priority.toLowerCase();
		switch (priority)
		{
			case 'must':
				return true;
			case 'never':
				return false;
			default:
				break;
		}
		priority = Number(utils.getPref('extensions.uxu.priority.'+priority));
		priority = Math.min(1, Math.max(0, priority));
	}
	var shouldDo = (Math.random() <= priority);
	if (!shouldDo) {
		var db = utils.getDB();
		var lastResult;
		if (db.tableExists('result_history')) {
			var statement = db.createStatement(
				  'SELECT result FROM result_history WHERE name = ?1'
				);
			try {
				statement.bindStringParameter(0, aTest.name);
				while (statement.executeStep()) {
					lastResult = statement.getString(0);
				}
			}
			finally {
				statement.reset();
			}
		}
		if (lastResult != 'success' && lastResult != 'passover') {
			shouldDo = true;
		}
	}
	return shouldDo;
}
 
function _onFinish(aTest, aResult) { 
	var db = utils.getDB();
	db.executeSimpleSQL(<![CDATA[
	  CREATE TABLE IF NOT EXISTS result_history
	    (name        TEXT PRIMARY KEY,
	     description TEXT,
	     result      TEXT,
	     date        DATETIME)
	]]>.toString());

	var statement = db.createStatement(
		  'INSERT OR REPLACE INTO result_history VALUES(?1, ?2, ?3, ?4)'
		);
	try {
		statement.bindStringParameter(0, aTest.name);
		statement.bindStringParameter(1, aTest.desc);
		statement.bindStringParameter(2, aResult);
		statement.bindDoubleParameter(3, Date.now());
		while (statement.executeStep()) {}
	}
	finally {
		statement.reset();
	}

	var days = utils.getPref('extensions.uxu.run.history.expire.days');
	if (days < 0) return;

	var cleanUpStatement = db.createStatement('DELETE FROM result_history WHERE date < ?1');
	try {
		cleanUpStatement.bindDoubleParameter(0, Date.now() - (1000 * 60 * 60 * 24 * days));
		while (cleanUpStatement.executeStep()) {}
	}
	finally {
		cleanUpStatement.reset();
	}
}
  
function _defaultReportHandler(report) { 
	if(report.result == 'success')
		return;


	var printout = bundle.getFormattedString('report_default', [
			report.testIndex,
			report.testCount,
			report.testDescription,
			bundle.getString('report_result_'+report.result)
		])

	if (report.exception) {
		printout += ': ' + report.exception + '\n';
		printout += _formatStackTrace1(report.exception);
	}
	printout += '\n';


	if(typeof(repl) == 'object')
		repl.print(printout);
	else
		dump(printout);
}
	
/*  Side effect-free functions. They're the ones who do the real job. :-) */ 

function _formatStackTrace1(exception) {
	function comesFromFramework(call) {
		return (call.match(/@chrome:\/\/mozlab\/content\/lib\/fsm\.js:/) ||
				call.match(/@chrome:\/\/mozlab\/content\/mozunit\/test_case\.js:/) ||
				// Following is VERY kludgy
				call.match(/\(function \(exitResult\) \{if \(eventHandlers/))
	}

	var trace = '';
	if(exception.stack) {
		var calls = exception.stack.split('\n');
		for each(var call in calls) {
			if(call.length > 0 && !comesFromFramework(call)) {
				call = call.replace(/\\n/g, '\n');

				if(call.length > 200)
					call =
						call.substr(0, 100) + ' [...] ' +
						call.substr(call.length - 100) + '\n';

				trace += call + '\n';
			}
		}
	}
	return trace;
}
  
