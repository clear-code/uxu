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
 
const Cc = Components.classes;
const Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']); 
var fsm    = lib_module.require('package', 'fsm');
var bundle = lib_module.require('package', 'bundle');
var utils  = {};
utils.__proto__ = lib_module.require('package', 'utils');

var inherits = lib_module.require('class', 'event_target');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server        = server_module.require('class', 'server');
var ServerUtils   = server_module.require('class', 'utils');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var Report      = test_module.require('class', 'report');
var Environment = test_module.require('class', 'environment');
var Assertions  = test_module.require('class', 'assertions');

var ObserverService = Cc['@mozilla.org/observer-service;1']
					.getService(Ci.nsIObserverService);
 
function _initDB() 
{
	var SCHEME_VERSION_HASH = 1;
	var CURRENT_SCHEME = SCHEME_VERSION_HASH;
	var tableDefinitionSQL = <![CDATA[
		  CREATE TABLE result_history
		    (name        TEXT PRIMARY KEY,
		     description TEXT,
		     result      TEXT,
		     date        DATETIME,
		     hash        TEXT)
		]]>.toString();
	var db = utils.getDB();
	if (!db.tableExists('result_history')) {
		db.executeSimpleSQL(tableDefinitionSQL);
		if ('schemaVersion' in db) // Firefox 3.0.x
			db.schemaVersion = CURRENT_SCHEME;
	}
	else { // possibly old version, so we have to migrate.
		var currentVersion = 'schemaVersion' in db ? db.schemaVersion : 0 ;
		if (currentVersion < SCHEME_VERSION_HASH) {
			db.executeSimpleSQL('ALTER TABLE result_history ADD hash TEXT');
			if ('schemaVersion' in db) // Firefox 3.0.x
				db.schemaVersion = SCHEME_VERSION_HASH;
		}
	}
}
try {
	_initDB();
}
catch(e) {
}
 
const REMOTE_PROFILE_PREFIX = 'uxu-test-profile'; 
const TESTCASE_STARTED      = '/* uxu-testcase-started */';
const TESTCASE_FINISED      = '/* uxu-testcase-finished */';
const TESTCASE_ABORTED      = '/* uxu-testcase-aborted */';
const ALL_TESTS_FINISHED    = '/* uxu-all-testcases-finished */';
const PING                  = ' ';
const PING_INTERVAL         = 3000;
 
const RESULT_SUCCESS = 'success'; 
const RESULT_FAILURE = 'failure';
const RESULT_ERROR   = 'error';
const RESULT_SKIPPED = 'skip';
 
const ERROR_NOT_INITIALIZED     = new Error('environment is not specified.'); 
const ERROR_INVALID_ENVIRONMENT = new Error('environment must be an Environment.');
 
/**
 * Invocation: 
 *     var case = new TestCase('Widget tests');
 *
 * Alias:
 *     var spec = new Specification();
 *
 */
 
function constructor(aTitle, aOptions) 
{
	if (!aOptions) aOptions = {};

	this._initSource(aOptions);
	this._initRemote(aOptions);

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
	this.__defineSetter__(
		'stateThat', function(aHash) {
			this.setTests(aHash);
			return aHash;
		});

	this._masterPriority = aOptions.priority || null;
	this.__defineSetter__(
		'masterPriority', function(aPriority) {
			this._masterPriority = aPriority;
			return aPriority;
		});
	this.__defineGetter__(
		'masterPriority', function() {
			return this._masterPriority;
		});

	this._shouldSkip = aOptions.shouldSkip || false;
	this.__defineSetter__(
		'shouldSkip', function(aSkip) {
			this._shouldSkip = aSkip;
			return aSkip;
		});
	this.__defineGetter__(
		'shouldSkip', function() {
			return this._shouldSkip;
		});

	this.__defineGetter__('neverRun', function() {
		return this._equalsToNever(this._masterPriority);
	});

	this._context = aOptions.context || {};
	this.__defineSetter__(
		'context', function(aContext) {
			this._context = aContext;
			return aContext;
		});
	this.__defineGetter__(
		'context', function() {
			return this._context;
		});

	this._targetProduct = aOptions.targetProduct || null;
	this.__defineSetter__(
		'targetProduct', function(aProduct) {
			this._targetProduct = aProduct;
			return aProduct;
		});
	this.__defineGetter__(
		'targetProduct', function() {
			return this._targetProduct;
		});

	this._environment = null;
	this.__defineSetter__(
		'environment', function(aEnvironment) {
			if (!aEnvironment) throw ERROR_INVALID_ENVIRONMENT;
			this._environment = aEnvironment;
			return aEnvironment;
		});
	this.__defineGetter__(
		'environment', function() {
			return this._environment;
		});

	this.done = false;

	this._redirect = aOptions.redirect || null;
	this.__defineSetter__(
		'redirect', function(aRedirect) {
			this._redirect = aRedirect;
			return aRedirect;
		});
	this.__defineGetter__(
		'redirect', function() {
			return this._redirect;
		});

	this.notifications = [];
	this.addListener(this);
}
	
function _initSource(aOptions) 
{
	var source = aOptions.source;
	if (!source || typeof source != 'string') {
		var path;
		var stack = Components.stack;
		while (stack)
		{
			path = stack.filename || '';
			if (path.indexOf('chrome://uxu/content/lib/subScriptRunner.js?') != 0) {
				stack = stack.caller
				continue;
			}
			/.+includeSource=([^;]+)/.test(path);
			source = decodeURIComponent(RegExp.$1);
			break;
		}
	}
	this._source = source;
	this.__defineGetter__(
		'source', function() {
			return this._source;
		});

	utils.baseURL = source.replace(/[^\/]*$/, '');
}
 
function _initRemote(aOptions) 
{
	var runningProfile = utils.getURLSpecFromFile(utils.getFileFromKeyword('ProfD'));
	runningProfile = runningProfile.replace(/([^\/])$/, '$1/');
	runningProfile = utils.getFileFromURLSpec(runningProfile);

	this._profile = null;
	this.__defineSetter__(
		'profile', function(aValue) {
			this._profile = aValue ? utils.normalizeToFile(aValue) : null ;
			if (
				!this._profile ||
				!this._profile.exists() ||
				!this._profile.isDirectory()
				)
				this._profile = null;
			return this._profile;
		});
	this.__defineGetter__(
		'profile', function() {
			return this._profile;
		});
	this.__defineGetter__(
		'shouldRunInRemote', function() {
			var tmp = utils.getFileFromKeyword('TmpD');
			return this._profile &&
				this._profile.path != runningProfile.path &&
				!runningProfile.parent.equals(tmp);
		});

	this._application = null;
	this.__defineSetter__(
		'application', function(aValue) {
			this._application = aValue ? utils.normalizeToFile(aValue) : null ;
			if (
				!this._application ||
				!this._application.exists() ||
				this._application.isDirectory()
				)
				this._application = null;
			return this._application;
		});
	this.__defineGetter__(
		'application', function() {
			return this._application;
		});

	this._options = [];
	this.__defineSetter__(
		'options', function(aValue) {
			this._options = aValue || [];
			if (!utils.isArray(aValue)) {
				this._options = [];
			}
			return this._options;
		});
	this.__defineGetter__(
		'options', function() {
			return this._options;
		});

	this.profile = aOptions.profile;
	this.application = aOptions.application;
	this.options = aOptions.options;
}
  
function onStart() 
{
	this.addListener(this.environment.__proto__);
	this.environment.__proto__.addListener(this);
	if (this._redirect) {
		if (
			!('{3d04c1d0-4e6c-11de-8a39-0800200c9a66}' in Components.classesByID) ||
			(Cc['@mozilla.org/network/protocol;1?name=http'].getService() !=
			 Components.classesByID['{3d04c1d0-4e6c-11de-8a39-0800200c9a66}'].getService()) ||
			!('{b81efa50-4e7d-11de-8a39-0800200c9a66}' in Components.classesByID) ||
			(Cc['@mozilla.org/network/protocol;1?name=https'].getService() !=
			 Components.classesByID['{b81efa50-4e7d-11de-8a39-0800200c9a66}'].getService())
			) {
			if (utils.getPref('extensions.uxu.protocolHandlerProxy.enabled'))
				this.fireEvent('Error', bundle.getString('error_proxy_disabled_conflict'));
			else
				this.fireEvent('Error', bundle.getString('error_proxy_disabled_pref'));
		}
		else {
			ObserverService.addObserver(this , 'uxu-redirect-check', false);
			this._redirectObserverRegistered = true;
		}
	}
}
 
function onFinish() 
{
	if (this._redirectObserverRegistered) {
		ObserverService.removeObserver(this , 'uxu-redirect-check');
		this._redirectObserverRegistered = false;
	}
	this.environment.__proto__.removeListener(this);
	this.removeAllListeners();
}
 
function onAbort() 
{
	this.onFinish();
}
 
function onNotify(aEvent) 
{
	this.notifications.push({
		type    : 'notification',
		message : aEvent.data,
		stack   : utils.getStackTrace()
	});
}
function onWarning(aEvent)
{
	this.notifications.push({
		type    : 'warning',
		message : aEvent.data,
		stack   : utils.getStackTrace()
	});
}
 
// nsIObserver 
function observe(aSubject, aTopic, aData)
{
	if (
		aTopic != 'uxu-redirect-check' ||
		!this._redirect
		)
		return;

	aSubject = aSubject.QueryInterface(Ci.nsISupportsString);

	var currentURI = aSubject.data;
	var newURI = utils.redirectURI(currentURI, this._redirect);
	if (newURI && newURI != currentURI)
		aSubject.data = newURI;
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
		switch (desc.toLowerCase())
		{
			case 'warmup':
				this.registerWarmUp(aHash[desc]);
				break;
			case 'cooldown':
			case 'warmdown':
				this.registerCoolDown(aHash[desc]);
				break;
			case 'setup':
			case 'given':
				this.registerSetUp(aHash[desc]);
				break;
			case 'teardown':
				this.registerTearDown(aHash[desc]);
				break;
			default:
				aHash[desc].description = desc;
				this.registerTest(aHash[desc]);
				break;
		}
	}
}
 
// for UxU declaration style syntax 
	
function registerWarmUp(aFunction) 
{
	if (typeof aFunction != 'function') return;
	this._warmUp = aFunction;
}
 
function registerCoolDown(aFunction) 
{
	if (typeof aFunction != 'function') return;
	this._coolDown = aFunction;
}
function registerWarmDown(aFunction)
{
	this.registerCoolDown(aFunction);
}
 
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
		aFunction.__uxu__registered)
		return;

	aFunction.__uxu__registered = true;

	this._normalizeTest(aFunction);

	var parameters = aFunction.parameters;
	if (!parameters) {
		this._registerSingleTest(aFunction);
		return;
	}

	switch (typeof parameters)
	{
		case 'number':
		case 'boolean':
		case 'string':
			parameters = [parameters];
			break;
	}

	if (utils.isArray(parameters)) {
		parameters.forEach(function(aParameter, aIndex) {
			this._registerSingleTest(this._createNewTestWithParameter(
				aFunction,
				aParameter,
				' ('+(aIndex+1)+')'
			));
		}, this);
	}
	else {
		for (let i in parameters)
		{
			this._registerSingleTest(this._createNewTestWithParameter(
				aFunction,
				parameters[i],
				' ('+i+')'
			));
		}
	}
}
	
function _normalizeTest(aFunction) 
{
	var desc = aFunction.description;
	if (!desc) {
		var source = aFunction.toSource();
		if (source.match(/\(?function ([^\(]+)\s*\(/))
			desc = RegExp.$1;
		else
			desc = source.substring(0, 30);
	}
	aFunction.description = desc;

	var privSetUp;
	var privTearDown;
	var shouldSkip;
	for (let i in aFunction)
	{
		if (
			!privSetUp &&
			/^set[uU]p/.test(i) &&
			typeof aFunction[i] == 'function'
			) {
			privSetUp = aFunction[i];
		}
		else if (
			!privTearDown &&
			/^tear[dD]own/.test(i) &&
			typeof aFunction[i] == 'function'
			) {
			privTearDown = aFunction[i];
		}
		else if (
			!shouldSkip &&
			/^should[sS]kip/.test(i)
			) {
			shouldSkip = aFunction[i];
		}
		if (privSetUp && privTearDown && shouldSkip) break;
	}

	aFunction.setUp = privSetUp;
	aFunction.tearDown = privTearDown;
	aFunction.shouldSkip = shouldSkip;

	aFunction.priority = (
			(aFunction.priority === null ||
			 aFunction.priority === void(0) ||
			 typeof aFunction.priority == 'number') ?
				aFunction.priority :
				(String(aFunction.priority || '').toLowerCase() || null)
		);

	aFunction.assertions = aFunction.assertions || aFunction.assertionsCount;
	aFunction.minAssertions = aFunction.minAssertions || aFunction.minAssertionsCount;
	aFunction.maxAssertions = aFunction.maxAssertions || aFunction.maxAssertionsCount;

	aFunction.parameters = aFunction.parameters || aFunction.params;

	return aFunction;
}
 
function _createNewTestWithParameter(aFunction, aParameter, aSuffix) 
{
	var test = function() {
			return aFunction.call(this, aParameter);
		};

	for (let i in aFunction)
	{
		test[i] = aFunction[i];
	}
	test.description = aFunction.description + aSuffix;
	test.original = aFunction;

	return test;
}
 
function _registerSingleTest(aFunction) 
{
	if (this._tests.some(function(aTest) {
			return (aTest.code == aFunction);
		}))
		return;

	var desc = aFunction.description;
	var source = aFunction.toSource();

	var test = {
		id          : 'test-'+Date.now()+'-'+parseInt(Math.random() * 65000),
		description : desc,
		title       : desc,

		code         : aFunction,
		originalCode : aFunction.original,

		priority      : aFunction.priority,
		shouldSkip    : aFunction.shouldSkip,
		targetProduct : aFunction.targetProduct,
		setUp         : aFunction.setUp,
		tearDown      : aFunction.tearDown,
		assertions    : aFunction.assertions,
		minAssertions : aFunction.minAssertions,
		maxAssertions : aFunction.maxAssertions,

		report : null
	};

	var sources = [];
	sources.push(desc);
	if (test.setUp) sources.push(test.setUp.toSource());
	sources.push(source);
	if (test.tearDown) sources.push(test.tearDown.toSource());
	sources.push('assertions:'+test.assertions);
	sources.push('minAssertions:'+test.minAssertions);
	sources.push('maxAssertions:'+test.maxAssertions);

	test.hash = utils.computeHash(sources.join('\n'), 'MD5');
	test.name = this._source + '::' + this.title + '::' + (desc || test.hash);

	this._tests.push(test);
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
	if (!this.environment) throw ERROR_NOT_INITIALIZED;

	this._stopper = aStopper;

	this.done = false;
	this._aborted = false;

	if (this.shouldRunInRemote && this._runByRemote()) return;

	var context = this.context || {};
	if (
		(
			this._targetProduct &&
			String(this._targetProduct).toLowerCase() != utils.product.toLowerCase()
		) ||
		(
			this._shouldSkip &&
			(
				(typeof this._shouldSkip != 'function') ||
				this._shouldSkip.call(context)
			)
		)
		) {
		this._masterPriority = 'never';
	}

	var testIndex = 0;
	var current;
	var testReport = { report : null };
	var testCaseReport = { report : null };

	var stateTransitions = {
		start             : { ok : 'setUpDaemons' },
		setUpDaemons      : { ok : 'doWarmUp' },
		doWarmUp          : { ok : 'prepareTest', ko: 'doCoolDown' },
		prepareTest       : { ok : 'checkDoOrSkip' },
		checkDoOrSkip     : { ok : 'doSetUp', ko: 'skip' },
		skip              : { ok : 'doReport' },
		doSetUp           : { ok : 'doPrivSetUp', ko: 'doPrivTearDown' },
		doPrivSetUp       : { ok : 'doTest', ko: 'doPrivTearDown' },
		doTest            : { ok : 'checkSuccessCount' },
		checkSuccessCount : { ok : 'doPrivTearDown', ko: 'doPrivTearDown' },
		doPrivTearDown    : { ok : 'doTearDown', ko: 'doTearDown' },
		doTearDown        : { ok : 'doReport', ko: 'doReport' },
		doReport          : { ok : 'nextTest' },
		nextTest          : { ok : 'prepareTest', ko: 'doCoolDown' },
		doCoolDown        : { ok : 'tearDownDaemons', ko: 'tearDownDaemons' },
		tearDownDaemons   : { ok : 'finished' },
		finished          : { }
	};

	var doPreOrPostProcess = function(aContinuation, aFunction, aOptions)
		{
			if (!aFunction || _this.neverRun) {
				aOptions.report.report.onFinish();
				aContinuation('ok');
				return;
			}
			var usesContinuation = aFunction.arity > 0;
			try {
				var result = usesContinuation ?
						aFunction.call(context, aContinuation) :
						aFunction.call(context) ;
				if (utils.isGeneratedIterator(result)) {
					utils.doIteration(result, {
						onEnd : function(e) {
							aOptions.report.report.onFinish();
							if (!usesContinuation) aContinuation('ok');
						},
						onError : function(e) {
							if (aOptions.onError) aOptions.onError();
							aOptions.report.report.result = RESULT_ERROR;
							aOptions.report.report.exception = utils.normalizeError(e);
							aOptions.report.report.description = aOptions.errorDescription;
							aOptions.report.report.onFinish();
							aContinuation('ko');
						}
					});
				}
				else {
					aOptions.report.report.onFinish();
					if (!usesContinuation) aContinuation('ok');
				}
			}
			catch(e) {
				aOptions.report.report.result = RESULT_ERROR;
				aOptions.report.report.exception = utils.normalizeError(e);
				aOptions.report.report.description = aOptions.errorDescription;
				aOptions.report.report.onFinish();
				aContinuation('ko');
			}
		};

	var _this = this;
	var stateHandlers = {
		start : function(aContinuation)
		{
			_this.fireEvent('Start');
			aContinuation('ok')
		},
		setUpDaemons : function(aContinuation)
		{
			aContinuation('ok');
		},
		doWarmUp : function(aContinuation)
		{
 			testCaseReport.report = new Report();
			doPreOrPostProcess(
				aContinuation,
				_this._warmUp,
				{
					errorDescription : bundle.getFormattedString('report_description_warmup', [_this.title]),
					report : testCaseReport
				}
			);
		},
		prepareTest : function(aContinuation)
		{
			testReport.report = new Report();
			current = _this._tests[testIndex];
			_this.fireEvent('TestStart', current);
			aContinuation('ok');
		},
		checkDoOrSkip : function(aContinuation)
		{
			if (current.targetProduct &&
				String(current.targetProduct).toLowerCase() != utils.product.toLowerCase()) {
				aContinuation('ko');
				return;
			}
			if (!_this._checkPriorityToExec(current)) {
				aContinuation('ko');
				return;
			}
			var shouldSkip = current.shouldSkip;
			if (shouldSkip !== void(0)) {
				if (typeof shouldSkip == 'function') {
					try {
						shouldSkip = shouldSkip.call(context);
					}
					catch(e) {
						testReport.report.result = RESULT_ERROR;
						testReport.report.exception = utils.normalizeError(e);
						testReport.report.description =  bundle.getFormattedString('report_description_check_to_skip', [current.description]);
						shouldSkip = true;
					}
				}
				if (shouldSkip) {
					aContinuation('ko');
					return;
				}
			}
			aContinuation('ok');
		},
		skip : function(aContinuation)
		{
			if (!testReport.report.result) {
				testReport.report.result = RESULT_SKIPPED;
				testReport.report.description = current.description;
			}
			aContinuation('ok');
		},
		doSetUp : function(aContinuation)
		{
			_this.notifications = [];
			testReport.report = new Report();
			doPreOrPostProcess(
				aContinuation,
				_this._setUp,
				{
					errorDescription : bundle.getFormattedString('report_description_setup', [current.description]),
					report : testReport
				}
			);
		},
		doPrivSetUp : function(aContinuation)
		{
			if (!current.setUp) {
				aContinuation('ok');
				return;
			}
			doPreOrPostProcess(
				aContinuation,
				current.setUp,
				{
					errorDescription : bundle.getFormattedString('report_description_priv_setup', [current.description]),
					report : testReport
				}
			);
		},
		doTest : function(aContinuation)
		{
			Assertions.prototype.resetSuccessCount.call(_this.environment.assert);
			testReport.report.onDetailedStart();
			var newReport = _this._exec(current, context, aContinuation, testReport);
			if (newReport.result) {
				testReport.report = newReport;
				testReport.report.description = current.description;
				testReport.report.onDetailedFinish();
				aContinuation('ok');
			}
			else {
				testReport.report.description = current.description;
			}
		},
		checkSuccessCount : function(aContinuation)
		{
			try {
				if (testReport.report.result == RESULT_SUCCESS) {
					Assertions.prototype.validSuccessCount.call(
						_this.environment.assert,
						current.assertions,
						current.minAssertions,
						current.maxAssertions
					);
				}
				aContinuation('ok');
			}
			catch(e) {
				testReport.report = new Report();
				testReport.report.result = RESULT_FAILURE;
				testReport.report.exception = utils.normalizeError(e);
				testReport.report.description = bundle.getFormattedString('report_description_check_success_count', [current.description]);
				aContinuation('ko');
			}
		},
		doPrivTearDown : function(aContinuation)
		{
			if (!current.tearDown) {
				aContinuation('ok');
				return;
			}
			doPreOrPostProcess(
				aContinuation,
				current.tearDown,
				{
					errorDescription : bundle.getFormattedString('report_description_priv_teardown', [current.description]),
					report : testReport,
					onError : function() {
						_this._onFinish(current, RESULT_ERROR);
					}
				}
			);
		},
		doTearDown : function(aContinuation)
		{
			doPreOrPostProcess(
				aContinuation,
				_this._tearDown,
				{
					errorDescription : bundle.getFormattedString('report_description_teardown', [current.description]),
					report : testReport,
					onError : function() {
						_this._onFinish(current, RESULT_ERROR);
					}
				}
			);
		},
		doReport : function(aContinuation)
		{
			current.report = testReport.report;
			_this._onFinish(current, testReport.report.result);
			testReport.report.testOwner = _this;
			testReport.report.testIndex = testIndex;
			testReport.report.testID    = current.name;
			testReport.report.notifications = _this.notifications;
			_this.notifications = [];
			_this.fireEvent('TestFinish', testReport.report);
			aContinuation('ok');
		},
		nextTest : function(aContinuation)
		{
			if (_this._stopper && _this._stopper()) {
				_this._aborted = true;
				_this.fireEvent('Abort');
				aContinuation('ko');
				return;
			}
			testIndex += 1;
			_this._tests[testIndex] ? aContinuation('ok') : aContinuation('ko');
		},
		doCoolDown : function(aContinuation)
		{
			doPreOrPostProcess(
				aContinuation,
				_this._coolDown,
				{
					errorDescription : bundle.getFormattedString('report_description_cooldown', [_this.title]),
					report : testCaseReport
				}
			);
		},
		tearDownDaemons : function(aContinuation)
		{
			if (!ServerUtils.prototype.isHttpServerRunning.call(_this.environment.serverUtils)) {
				aContinuation('ok');
				return;
			}
			utils.doIteration(
				function() {
					yield ServerUtils.prototype.tearDownAllHttpServers.call(_this.environment.serverUtils);
				},
				{
					onEnd : function(e) {
						aContinuation('ok');
					}
				}
			);
		},
		finished : function(aContinuation)
		{
			if (!_this._aborted) {
				_this.done = true;
				_this.fireEvent('Finish', testCaseReport.report);
			}
		}
	};

	fsm.go('start', {}, stateHandlers, stateTransitions, []);
}
	
function _runByRemote(aStopper) 
{
	if (
		!this._profile ||
		!this._profile.exists() ||
		this.neverRun
		)
		return false;

	if (this._targetProduct &&
		String(this._targetProduct).toLowerCase() != utils.product.toLowerCase() &&
		!this._application) {
		var application = utils.getInstalledLocationOfProduct(this._targetProduct);
		if (application) {
			this._application = application;
		}
		else {
			return false;
		}
	}

	this.fireEvent('Start');

	var profile = utils.getFileFromKeyword('TmpD');
	profile.append(REMOTE_PROFILE_PREFIX);
	profile.createUnique(profile.DIRECTORY_TYPE, 0777);
//	this._profile.copyTo(profile.parent, profile.leafName);
	profile.remove(true);
	utils.cosmeticClone(this._profile, profile.parent, profile.leafName);

	// 実行時の優先度計算のために必要
	utils.dbFile.copyTo(profile, utils.dbFile.leafName);

	if (!utils.getPref('extensions.uxu.global')) {
		var extensions = profile.clone();
		extensions.append('extensions');
		if (!extensions.exists()) extensions.create(extensions.DIRECTORY_TYPE, 0777);
		utils.installedUXU.copyTo(extensions, utils.installedUXU.leafName);
	}

	ObserverService.notifyObservers(profile, 'uxu-profile-setup', null);

	this._remoteResultBuffer = '';
	this._lastRemoteResponse = Date.now();
	this._remoteReady = false;

	var server = new Server();
	server.addListener(this);
	this.addListener(server);
	server.start();

	var args = [
			'-no-remote',
			'-profile',
			profile.path,
			'-uxu-testcase',
			this._source,
			'-uxu-output-host',
			'localhost',
			'-uxu-output-port',
			server.port,
			'-uxu-hidden'
		];
	if (this._masterPriority) {
		args = args.concat(['-uxu-priority', this._masterPriority]);
	}
	args = args.concat(this.options);

	var process = Cc['@mozilla.org/process/util;1']
				.createInstance(Ci.nsIProcess);
	process.init(this._application || utils.productExecutable);
	process.run(false, args, args.length);

	var _this = this;
	var beforeReadyTimeout = Math.max(0, utils.getPref('extensions.uxu.run.timeout.application'));
	var beforeReadyInterval = 500;
	var afterReadyTimeout = PING_INTERVAL + Math.max(0, utils.getPref('extensions.uxu.run.timeout'));
	var afterReadyInterval = 50;
	var report = new Report();
	utils.doIteration(
		function() {
			var last = Date.now();
			var current;
			var timeout;
			var interval;
			while (!_this.done)
			{
				timeout = _this._remoteReady ? afterReadyTimeout : beforeReadyTimeout ;
				interval = _this._remoteReady ? afterReadyInterval : beforeReadyInterval ;
				if (!_this._aborted && _this._stopper && _this._stopper()) {
					_this._aborted = true;
				}
				if (Date.now() - _this._lastRemoteResponse > timeout) {
					throw new Error(bundle.getFormattedString('error_remote_timeout', [parseInt(timeout / 1000)]));
				}
				yield interval;
			}
		},
		{
			onEnd : function(e) {
				report.result = RESULT_SUCCESS;
				report.onFinish();
				_this._onFinishRemoteResult(report);

				server.destroy();
				server = null;
				utils.scheduleToRemove(profile);
			},
			onError : function(e) {
				report.result = RESULT_ERROR;
				report.exception = e;
				report.description = bundle.getFormattedString('report_description_remote', [_this.title]);
				report.onFinish();
				_this._onFinishRemoteResult(report);

				server.destroy();
				server = null;
				utils.scheduleToRemove(profile);
			}
		}
	);

	return true;
}
	
function onServerInput(aEvent) 
{
	this._lastRemoteResponse = Date.now();
	var input = aEvent.data;
	var responseId = '/* '+Date.now()+'-'+parseInt(Math.random() * 65000)+' */';
	if (/[\r\n]+$/.test(input)) {
		if (this._remoteResultBuffer) {
			input = this._remoteResultBuffer + input;
			this._remoteResultBuffer = '';
		}
		input = input.replace(/[\r\n]+$/, '');
	}
	else {
		this._remoteResultBuffer += input;
		return;
	}
	if (this._aborted) {
		this.fireEvent('ResponseRequest', TESTCASE_ABORTED+responseId+'\n');
		this.fireEvent('Abort');
		return;
	}
	if (input.indexOf(TESTCASE_STARTED) == 0) {
		this._remoteReady = true;
		this.fireEvent('ResponseRequest', responseId+'\n');
		return;
	}
	if (input.indexOf(TESTCASE_FINISED) == 0) {
		this.done = true;
		this.fireEvent('ResponseRequest', responseId+'\n');
		return;
	}
	this._onReceiveRemoteResult(input);
	this.fireEvent('ResponseRequest', responseId+'\n');
}
 
function _onReceiveRemoteResult(aResult) 
{
	var result;
	try {
		eval('result = '+aResult);
		result[result.length-1].results.forEach(function(aResult) {
			this._onFinish(this._tests[aResult.index], aResult.type);
		}, this);
	}
	catch(e) {
		result = [];
	}
	this.fireEvent('RemoteTestFinish', result);
}
 
function _onFinishRemoteResult(aReport) 
{
	this.done = true;
	if (!this._aborted) {
		this.fireEvent('Finish', aReport);
	}
}
  
function _exec(aTest, aContext, aContinuation, aReport) 
{
	var report = new Report();

	if (this._stopper && this._stopper()) {
		report.result = RESULT_SKIPPED;
		return report;
	}

	try {
		var result = aTest.code.call(aContext);

		if (utils.isGeneratedIterator(result)) {
			aReport.report = report;
			var _this = this;
			window.setTimeout(function() {
				utils.doIteration(result, {
					onEnd : function(e) {
						aReport.report.onDetailedFinish();
						aReport.report.result = RESULT_SUCCESS;
						_this._onFinish(aTest, aReport.report.result);
						aContinuation('ok');
					},
					onFail : function(e) {
						aReport.report.onDetailedFinish();
						aReport.report.result = RESULT_FAILURE;
						aReport.report.exception = e;
						_this._onFinish(aTest, aReport.report.result);
						aContinuation('ok');
					},
					onError : function(e) {
						aReport.report.onDetailedFinish();
						aReport.report.result = RESULT_ERROR;
						aReport.report.exception = e;
						_this._onFinish(aTest, aReport.report.result);
						aContinuation('ok');
					}
				});
			}, 0);
			return report;
		}

		report.result = RESULT_SUCCESS;
		this._onFinish(aTest, report.result);
	}
	catch(exception if exception.name == 'AssertionFailed') {
		report.result = RESULT_FAILURE;
		report.exception = exception;
		this._onFinish(aTest, report.result);
	}
	catch(exception) {
		report.result = RESULT_ERROR;
		report.exception = utils.normalizeError(exception);;
		this._onFinish(aTest, report.result);
	}

	return report;
}
 
function _checkPriorityToExec(aTest) 
{
	var priority = 0.5;
	var forceNever = _equalsToNever(aTest.priority) || _equalsToNever(this._masterPriority);
	if (forceNever) {
		priority = 'never';
	}
	else {
		if (this._masterPriority !== null && this._masterPriority !== void(0))
			priority = this._masterPriority;
		if (aTest.priority !== null && aTest.priority !== void(0))
			priority = aTest.priority;
	}

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
		var db, statement;
		var lastResult;
		var lastHash;
		try {
			db = utils.getDB();
			statement = db.createStatement(
				  'SELECT result, hash FROM result_history WHERE name = ?1'
				);
			statement.bindStringParameter(0, aTest.name);
			while (statement.executeStep())
			{
				lastResult = statement.getString(0);
				lastHash   = statement.getString(1);
			}
		}
		finally {
			statement.reset();
		}
		if ((lastHash != aTest.hash) ||
                    (lastResult != RESULT_SUCCESS && lastResult != RESULT_SKIPPED)) {
			shouldDo = true;
		}
	}
	return shouldDo;
}
function _equalsToNever(aPriority)
{
	return (
		(aPriority == 'never') ||
		(typeof aPriority == 'number' && Math.max(0, aPriority) == 0)
	);
}
 
function _onFinish(aTest, aResult) 
{
	var db, statement;
	try {
		db = utils.getDB();
		statement = db.createStatement(<![CDATA[
		  INSERT OR REPLACE INTO result_history
		          (name, description, result, date, hash)
		    VALUES(?1, ?2, ?3, ?4, ?5)
		]]>.toString());
	}
	catch(e) {
		return;
	}

	try {
		statement.bindStringParameter(0, aTest.name);
		statement.bindStringParameter(1, aTest.description);
		statement.bindStringParameter(2, aResult);
		statement.bindDoubleParameter(3, Date.now());
		statement.bindStringParameter(4, aTest.hash);
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
  
