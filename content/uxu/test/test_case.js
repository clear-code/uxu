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
 
var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var fsm    = lib_module.require('package', 'fsm');
var bundle = lib_module.require('package', 'bundle');
var utils  = lib_module.require('package', 'utils');
 
/**
 * Invocation: 
 *     var case = new TestCase('Widget tests');
 *
 * Alias:
 *     var spec = new Specification();
 *
 */
 
function constructor(aTitle, aNamespace) 
{
	this._title = aTitle;
	this.__defineGetter__(
		'title', function() {
			return this._title;
		});

	this._tests = [];
	this.__defineSetter__(
		'tests', function(aHash) {
			this.setTests(aHash);
			return aHash;
		});
	this.__defineGetter__(
		'tests', function() {
			return this._tests;
		});

	if (!aNamespace || typeof aNamespace != 'string') {
		var path;
		var stack = Components.stack;
		do {
			path = stack.filename;
			if (path.indexOf('chrome://uxu/content/test/helper/subScriptRunner.js?') != 0)
				continue;
			/.+includeSource=([^;]+)/.test(path);
			aNamespace = decodeURIComponent(RegExp.$1);
			break;
		}
		while (stack = stack.caller);
	}
	this._namespace = aNamespace;
	this.__defineGetter__(
		'namespace', function() {
			return this._namespace;
		});

	this._masterPriority = null;
	this.__defineSetter__(
		'masterPriority', function(aPriority) {
			this._masterPriority = aPriority;
			return aPriority;
		});
	this.__defineGetter__(
		'masterPriority', function() {
			return this._masterPriority;
		});

	this.__defineSetter__(
		'stateThat', function(aHash) {
			this.setTests(aHash);
			return aHash;
		});

	this._reportHandler = _defaultReportHandler;
	this.__defineSetter__(
		'reportHandler', function(aHandler) {
			this._reportHandler = aHandler;
			return aHandler;
		});
	this.__defineGetter__(
		'reportHandler', function() {
			return this._reportHandler;
		});

	this._context = {};
	this.__defineSetter__(
		'context', function(aContext) {
			this._context = aContext;
			return aContext;
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
	 
function setTests(aHash) 
{
	this.context = aHash;
	for (var desc in aHash)
	{
		if (typeof aHash[desc] != 'function') continue;
		switch (desc)
		{
			case 'setUp':
			case 'given':
				this.registerSetUp(aHash[desc]);
				break;
			case 'tearDown':
				this.registerTearDown(aHash[desc]);
				break;
			case 'inspect':
				break;
			default:
				aHash[desc].description = desc;
				this.registerTest(aHash[desc]);
				break;
		}
	}
}
 
// for UxU declaration style syntax 
	 
function registerSetUp(aFunction) 
{
	if (typeof aFunction != 'function') return;
	this._setUp = aFunction;
}
 
function registerTearDown(aFunction) 
{
	if (typeof aFunction != 'function') return;
	this._tearDown = aFunction;
}
 
function registerTest(aFunction) 
{
	if (typeof aFunction != 'function' ||
		this._tests.some(function(aTest) {
			return (aTest.code == aFunction);
		}))
		return;

	var desc = aFunction.description;
	var namePart = desc;
	var source = aFunction.toSource();
	if (!desc) {
		if (source.match(/\(?function ([^\(]+)\s*\(/))
			desc = RegExp.$1;
		else
			desc = source.substring(0, 30);
	}
	var hash = this._getHashFromString(source);

	this._tests.push({
		name     : (this._namespace + '::' + this.title + '::' + desc + '::' + hash),
		desc     : desc,
		code     : aFunction,
		priority : (
			typeof aFunction.priority == 'number' ?
				aFunction.priority :
				(String(aFunction.priority || '').toLowerCase() || 'normal')
		),
		id       : 'test-'+parseInt(Math.random() * 65000)
	});
}
function _getHashFromString(aString) 
{
	var hasher = Components
			.classes['@mozilla.org/security/hash;1']
			.createInstance(Components.interfaces.nsICryptoHash);
	hasher.init(hasher.MD5)
	var array = aString.split('').map(function(aChar) {
					return aChar.charCodeAt(0);
				});
	hasher.update(array, array.length);
	var hash = hasher.finish(false);

	var hexchars = '0123456789ABCDEF';
	var hexrep = new Array(hash.length * 2);
	hash.split('').forEach(function(aChar, aIndex) {
		hexrep[aIndex * 2] = hexchars.charAt((aChar.charCodeAt(0) >> 4) & 15);
		hexrep[aIndex * 2 + 1] = hexchars.charAt(aChar.charCodeAt(0) & 15);
	});
	return hexrep.join('');
}
  
/**
 * Alternative style for defining setup. 
 *
 */
	 
function setUp(aFunction) 
{
	this.registerSetUp(aFunction);
}
 
function tearDown(aFunction) 
{
	this.registerTearDown(aFunction);
}
 
function test(aDescription, aCode) 
{
	if (typeof aCode != 'function') return;
	aCode.description = aDescription;
	this.registerTest(aCode);
}
 	 
// BDD-style alias 
	 
/**
 * BDD-alias for setUp(). 
 *
 */
function given(aFunction)
{
	this.setUp(aFunction);
}
 
/**
 * BDD-style alias for test(). 
 *
 */
function states(aDescription, aFunction)
{
	this.test(aDescription, aFunction);
}
 
/**
 * BDD-style alias for run(). 
 *
 *    var spec = new Specification();
 *    spec.stateThat = { ... };
 *    spec.verify();
 *
 */
function verify(aStopper)
{
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
function run(aStopper)
{
	this._stopper = aStopper;
	this._asyncRun(this._tests, this._setUp, this._tearDown, this._reportHandler);
}
	 
function _asyncRun(aTests, aSetUp, aTearDown, aReportHandler) 
{
	var testIndex = 0;
	var context;
	var report = { report : null };

	var stateTransitions = {
		start :         { ok : 'checkPriority' },
		checkPriority : { ok : 'doSetUp', ko: 'nextTest' },
		doSetUp :       { ok : 'doTest', ko: 'doReport' },
		doTest :        { ok : 'doReport' },
		doReport :      { ok : 'doTearDown' },
		doTearDown :    { ok : 'nextTest', ko: 'nextTest' },
		nextTest :      { ok : 'checkPriority', ko: 'finished' },
		finished :      { }
	}

	var nullContinuation = function() {};

	_this = this;
	var stateHandlers = {
		start : function(aContinuation)
		{
			aContinuation('ok')
		},
		checkPriority : function(aContinuation)
		{
			if (_this._checkPriorityToExec(aTests[testIndex])) {
				aContinuation('ok');
				return;
			}
			report.report = {};
			report.report.result = 'passover'; // 'success';
			stateHandlers.doReport(nullContinuation);
			aContinuation('ko');
		},
		doSetUp : function(aContinuation)
		{
			if (!aSetUp) {
				aContinuation('ok');
				return;
			}
			context = _this.context || {};
			report.report = {};
			try {
				var result = aSetUp.call(context, aContinuation);
				if (utils.isGeneratedIterator(result)) {
					utils.doIteration(result, {
						onEnd : function(e) {
							if (aSetUp.arity == 0) aContinuation('ok');
						},
						onError : function(e) {
							report.report.result = 'error';
							report.report.exception = e;
							report.report.testDescription = bundle.getString('report_description_setup');
							aContinuation('ko');
						}
					});
				}
				else {
					if (aSetUp.arity == 0) aContinuation('ok');
				}
			} catch(e) {
				report.report.result = 'error';
				report.report.exception = e;
				report.report.testDescription = bundle.getString('report_description_setup');
				aContinuation('ko');
			}
		},
		doTest : function(aContinuation)
		{
			var test;
			test = aTests[testIndex];
			var newReport = _exec(test, context, aContinuation, report);
			if (newReport.result) {
				report.report = newReport;
				report.report.testDescription = test.desc;
				aContinuation('ok');
			}
			else {
				report.report.testDescription = test.desc;
			}
		},
		doReport : function(aContinuation)
		{
			_onFinish(aTests[testIndex], report.report.result);
			report.report.testOwner = _this;
			report.report.testIndex = testIndex + 1;
			report.report.testCount = aTests.length;
			report.report.testID    = aTests[testIndex].name;
			report.report.namespaceURL = _this._namespace;
			if (typeof aReportHandler == 'function')
				aReportHandler(report.report);
			else if (aReportHandler && 'handleReport' in aReportHandler)
				aReportHandler.handleReport(report.report);
			else
				throw new Error('invalid report handler');
			aContinuation('ok');
		},
		doTearDown : function(aContinuation)
		{ // exceptions in setup/teardown are not reported correctly
			if (!aTearDown) {
				aContinuation('ok');
				return;
			}
			try {
				// perhaps should pass continuation to tearDown as well
				var result = aTearDown.call(context);
				if (utils.isGeneratedIterator(result)) {
					utils.doIteration(result, {
						onEnd : function(e) {
							aContinuation('ok');
						},
						onError : function(e) {
							_onFinish(aTests[testIndex], 'error');
							aContinuation('ko');
						}
					});
				}
				else {
					aContinuation('ok');
				}
			} catch(e) {
				aContinuation('ko');
			}
		},
		nextTest : function(aContinuation)
		{
			if (_this._stopper && _this._stopper()) {
				aContinuation('ko');
				return;
			}
			testIndex += 1;
			aTests[testIndex] ? aContinuation('ok') : aContinuation('ko');
		},
		finished : function(aContinuation)
		{
			if (aReportHandler && 'onFinish' in aReportHandler)
				aReportHandler.onFinish();
			_this._done = true;
		}
	};

	this._done = false;
	fsm.go('start', {}, stateHandlers, stateTransitions, []);
}
	 
function _exec(aTest, aContext, aContinuation, aReport) 
{
	var report = {
		result:    undefined,
		exception: undefined
	};

	if (this._stopper && this._stopper()) return report;

	try {
		var result = aTest.code.call(aContext);

		if (utils.isGeneratedIterator(result)) {
			aReport.report = report;
			utils.doIteration(result, {
				onEnd : function(e) {
					aReport.report.result = 'success';
					_onFinish(aTest, aReport.report.result);
					aContinuation('ok');
				},
				onFail : function(e) {
					aReport.report.result = 'failure';
					aReport.report.exception = e;
					_onFinish(aTest, aReport.report.result);
					aContinuation('ok');
				},
				onError : function(e) {
					aReport.report.result = 'error';
					aReport.report.exception = e;
					_onFinish(aTest, aReport.report.result);
					aContinuation('ok');
				}
			});
			return report;
		}

		report.result = 'success';
		_onFinish(aTest, report.result);
	}
	catch(exception if exception.name == 'AssertionFailed') {
		report.result = 'failure';
		report.exception = exception;
		_onFinish(aTest, report.result);
	}
	catch(exception) {
		report.result = 'error';
		report.exception = exception;
		_onFinish(aTest, report.result);
	}

	return report;
}
  
function _checkPriorityToExec(aTest) 
{
	var forceNever = (
			(aTest.priority == 'never') ||
			(typeof aTest.priority == 'number' && Math.max(0, aTest.priority) == 0)
		);
	var priority = forceNever ? 'never' :
			(this._masterPriority !== null && this._masterPriority !== void(0)) ?
				(this._masterPriority || aTest.priority) :
				aTest.priority;
	if (typeof priority == 'number') {
		priority = Math.min(1, Math.max(0, priority));
		switch (priority)
		{
			case 1:
				shouldDo = true;
				break;
			case 0:
				shouldDo = false;
				break;
			default:
				shouldDo = (Math.random() <= priority);
				break;
		}
	}
	else {
		priority = priority.toLowerCase();
		switch (priority)
		{
			case 'must':
				shouldDo = true;
				break;
			case 'never':
				shouldDo = false;
				break;
			default:
				priority = Number(utils.getPref('extensions.uxu.priority.'+priority));
				priority = Math.min(1, Math.max(0, priority));
				shouldDo = (Math.random() <= priority);
				break;
		}
	}
	if (!shouldDo && !forceNever) {
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
 
function _onFinish(aTest, aResult) 
{
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
  
function _defaultReportHandler(aReport) 
{
	if (aReport.result == 'success')
		return;

	var printout = bundle.getFormattedString('report_default', [
			aReport.testIndex,
			aReport.testCount,
			aReport.testDescription,
			bundle.getString('report_result_'+aReport.result)
		])

	if (aReport.exception) {
		printout += ': ' + aReport.exception + '\n';
		printout += _formatStackTrace(aReport.exception);
	}
	printout += '\n';

	if (typeof(repl) == 'object')
		repl.print(printout);
	else
		dump(printout);
}
	 
/*  Side effect-free functions. They're the ones who do the real job. :-) */ 

function _formatStackTrace(aException)
{
	function comesFromFramework(aCall) {
		return (aCall.match(/@chrome:\/\/mozlab\/content\/lib\/fsm\.js:/) ||
				aCall.match(/@chrome:\/\/mozlab\/content\/mozunit\/test_case\.js:/) ||
				// Following is VERY kludgy
				aCall.match(/\(function \(exitResult\) \{if \(eventHandlers/))
	}

	var trace = '';
	if (aException.stack) {
		var calls = aException.stack.split('\n');
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
  
