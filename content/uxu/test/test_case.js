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
var utils  = {};
utils.__proto__ = lib_module.require('package', 'utils');

var inherits = lib_module.require('class', 'event_target');

var server_module = new ModuleManager(['chrome://uxu/content/server']);
var Server = server_module.require('class', 'server');
 
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
const TESTCASE_FINISED = '/*uxu-testcase-finished*/';
const TESTCASE_ABORTED = '/*uxu-testcase-aborted*/';
 
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
	this._initProfile(aOptions);

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

	this._done = false;
	this.__defineGetter__(
		'done', function() {
			return this._done;
		});

	this.initListeners();
}
	 
function _initSource(aOptions) 
{
	var source = aOptions.source;
	if (!source || typeof source != 'string') {
		var path;
		var stack = Components.stack;
		do {
			path = stack.filename;
			if (path.indexOf('chrome://uxu/content/lib/subScriptRunner.js?') != 0)
				continue;
			/.+includeSource=([^;]+)/.test(path);
			source = decodeURIComponent(RegExp.$1);
			break;
		}
		while (stack = stack.caller);
	}
	this._source = source;
	this.__defineGetter__(
		'source', function() {
			return this._source;
		});

	utils.baseURL = source.replace(/[^\/]*$/, '');
}
 
function _initProfile(aOptions) 
{
	var runningProfile = utils.getURLSpecFromFile(utils.getFileFromKeyword('ProfD'));
	runningProfile = runningProfile.replace(/([^\/])$/, '$1/');
	runningProfile = utils.getFileFromURLSpec(runningProfile);

	this._profile = null;
	this.__defineSetter__(
		'profile', function(aValue) {
			this._profile = null;
			if (aValue) {
				try {
					this._profile = utils.fixupIncompleteURI(aValue).replace(/([^\/])$/, '$1/');
					this._profile = utils.getFileFromURLSpec(this._profile);
					this._profile.normalize();
					if (
						!this._profile.exists() ||
						!this._profile.isDirectory()
						)
						this._profile = null;
				}
				catch(e) {
				}
			}
			if (!this._profile) {
				this._profile = runningProfile;
			}
			return this._profile;
		});
	this.__defineGetter__(
		'profile', function() {
			return this._profile;
		});
	this.__defineGetter__(
		'shouldRunInRemote', function() {
			var tmp = utils.getFileFromKeyword('TmpD');
			return this._profile.path != runningProfile.path &&
				!runningProfile.parent.equals(tmp);
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
	this.options = aOptions.options;
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
			case 'warmUp':
				this.registerWarmUp(aHash[desc]);
				break;
			case 'coolDown':
			case 'warmDown':
				this.registerCoolDown(aHash[desc]);
				break;
			case 'setUp':
			case 'given':
				this.registerSetUp(aHash[desc]);
				break;
			case 'tearDown':
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
		this._tests.some(function(aTest) {
			return (aTest.code == aFunction);
		}))
		return;

	var desc = aFunction.description;
	var key = desc;
	var source = aFunction.toSource();
	var hash = this._getHashFromString(source);
	if (!desc) {
		if (source.match(/\(?function ([^\(]+)\s*\(/)) {
			desc = RegExp.$1;
			key = desc;
		}
		else {
			desc = source.substring(0, 30);
			key = hash;
		}
	}

	this._tests.push({
		name     : (this._source + '::' + this.title + '::' + key),
		desc     : desc,
		code     : aFunction,
		hash     : hash,
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

	this._done = false;
	this._aborted = false;

	if (this.shouldRunInRemote && this._runWithRemotePofile()) return;

	if (this._targetProduct &&
		String(this._targetProduct).toLowerCase() != utils.product.toLowerCase()) {
		this._masterPriority = 'never';
	}

	var testIndex = 0;
	var context;
	var testReport = { report : null };
	var testCaseReport = { report : null };

	var stateTransitions = {
		start :         { ok : 'doWarmUp' },
		doWarmUp :      { ok : 'checkPriority', ko: 'doCoolDown' },
		checkPriority : { ok : 'doSetUp', ko: 'doReport' },
		doSetUp :       { ok : 'doTest', ko: 'doTearDown' },
		doTest :        { ok : 'doTearDown' },
		doTearDown :    { ok : 'doReport', ko: 'doReport' },
		doReport :      { ok : 'nextTest' },
		nextTest :      { ok : 'checkPriority', ko: 'doCoolDown' },
		doCoolDown :    { ok : 'finished', ko: 'finished' },
		finished :      { }
	};

	var doPreOrPostProcess = function(aContinuation, aFunction, aErrorDescription, aReport, aErrorProcess)
		{
			if (!aFunction || _this._isNever(_this._masterPriority)) {
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
							if (!usesContinuation) aContinuation('ok');
						},
						onError : function(e) {
							if (aErrorProcess) aErrorProcess();
							aReport.report.result = 'error';
							aReport.report.exception = e;
							aReport.report.testDescription = aErrorDescription;
							aContinuation('ko');
						}
					});
				}
				else {
					if (!usesContinuation) aContinuation('ok');
				}
			}
			catch(e) {
				aReport.report.result = 'error';
				aReport.report.exception = e;
				aReport.report.testDescription = aErrorDescription;
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
		doWarmUp : function(aContinuation)
		{
			context = _this.context || {};
 			testCaseReport.report = {};
			doPreOrPostProcess(
				aContinuation,
				_this._warmUp,
				bundle.getFormattedString('report_description_warmup', [_this.title]),
				testCaseReport
			);
		},
		checkPriority : function(aContinuation)
		{
			_this.fireEvent('TestStart', testIndex);
			var test = _this._tests[testIndex];
			if (_this._checkPriorityToExec(test)) {
				aContinuation('ok');
				return;
			}
			testReport.report = {};
			testReport.report.result = 'passover';
			testReport.report.testDescription = test.desc;
			aContinuation('ko');
		},
		doSetUp : function(aContinuation)
		{
			testReport.report = {};
			doPreOrPostProcess(
				aContinuation,
				_this._setUp,
				bundle.getFormattedString('report_description_setup', [_this._tests[testIndex].desc]),
				testReport
			);
		},
		doTest : function(aContinuation)
		{
			var test;
			test = _this._tests[testIndex];
			var newReport = _this._exec(test, context, aContinuation, testReport);
			if (newReport.result) {
				testReport.report = newReport;
				testReport.report.testDescription = test.desc;
				aContinuation('ok');
			}
			else {
				testReport.report.testDescription = test.desc;
			}
		},
		doReport : function(aContinuation)
		{
			_this._onFinish(_this._tests[testIndex], testReport.report.result);
			testReport.report.testOwner = _this;
			testReport.report.testIndex = testIndex;
			testReport.report.testID    = _this._tests[testIndex].name;
			_this.fireEvent('TestFinish', testReport.report);
			aContinuation('ok');
		},
		doTearDown : function(aContinuation)
		{
			doPreOrPostProcess(
				aContinuation,
				_this._tearDown,
				bundle.getFormattedString('report_description_teardown', [_this._tests[testIndex].desc]),
				testReport,
				function() {
					_this._onFinish(_this._tests[testIndex], 'error');
				}
			);
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
				bundle.getFormattedString('report_description_cooldown', [_this.title]),
				testCaseReport
			);
		},
		finished : function(aContinuation)
		{
			_this._done = true;
			if (!_this._aborted)
				_this.fireEvent('Finish', testCaseReport.report);
		}
	};

	fsm.go('start', {}, stateHandlers, stateTransitions, []);
}
	 
function _runWithRemotePofile(aStopper) 
{
	if (!this.profile.exists()) return false;

	this.fireEvent('RemoteStart');

	var profile = utils.getFileFromKeyword('TmpD');
	profile.append(REMOTE_PROFILE_PREFIX);
	profile.createUnique(profile.DIRECTORY_TYPE, 0777);
	this.profile.copyTo(profile.parent, profile.leafName);

	// 実行時の優先度計算のために必要
	utils.dbFile.copyTo(profile, utils.dbFile.leafName);

	if (!utils.getPref('extensions.uxu.global')) {
		var extensions = profile.clone();
		extensions.append('extensions');
		if (!extensions.exists()) extensions.create(extensions.DIRECTORY_TYPE, 0777);
		utils.installedUXU.copyTo(extensions, utils.installedUXU.leafName);
	}

	this._remoteResultBuffer = '';
	this._lastRemoteResponse = Date.now();

	var server = new Server();
	server.addListener(this);
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
		]
		.concat(this.options);

	var process = Cc['@mozilla.org/process/util;1']
				.createInstance(Ci.nsIProcess);
	process.init(utils.productExecutable);
	process.run(false, args, args.length);

	var _this = this;
	var interval = 100;
	var timeout = Math.max(0, utils.getPref('extensions.uxu.run.timeout'));
	utils.doIteration(
		function() {
			var last = Date.now();
			var current;
			while (!_this._done)
			{
				if (!_this._aborted && _this._stopper && _this._stopper()) {
					_this._aborted = true;
					_this.fireEvent('OutputRequest', TESTCASE_ABORTED);
					_this.fireEvent('Abort');
					_this._onFinishRemoteResult();
					break;
				}
				if (Date.now() - _this._lastRemoteResponse > timeout) {
					_this._onFinishRemoteResult()
					break;
				}
				yield interval;
			}
		},
		{
			onEnd : function(e) {
				server.stop();
				server = null;
				utils.scheduleToRemove(profile);
			}
		}
	);

	return true;
}
	 
function onInput(aEvent) 
{
	this._lastRemoteResponse = Date.now();
	var input = aEvent.data;
	if (/[\r\n]+$/.test(input)) {
		if (this._remoteResultBuffer) {
			input = this._remoteResultBuffer + input;
			this._remoteResultBuffer = '';
		}
	}
	else {
		this._remoteResultBuffer += input;
		return;
	}
	if (input.indexOf(TESTCASE_FINISED) == 0) {
		this._onFinishRemoteResult();
		return;
	}
	this._onReceiveRemoteResult(input);
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
	this.fireEvent('RemoteProgress', result);
}
 
function _onFinishRemoteResult() 
{
	this._done = true;
	if (!this._aborted) {
		this.fireEvent('RemoteFinish');
	}
}
  	
function _exec(aTest, aContext, aContinuation, aReport) 
{
	var report = {
		result:    undefined,
		exception: undefined
	};

	if (this._stopper && this._stopper()) {
		report.result = 'passover';
		return report;
	}

	try {
		var result = aTest.code.call(aContext);

		if (utils.isGeneratedIterator(result)) {
			aReport.report = report;
			var _this = this;
			utils.doIteration(result, {
				onEnd : function(e) {
					aReport.report.result = 'success';
					_this._onFinish(aTest, aReport.report.result);
					aContinuation('ok');
				},
				onFail : function(e) {
					aReport.report.result = 'failure';
					aReport.report.exception = e;
					_this._onFinish(aTest, aReport.report.result);
					aContinuation('ok');
				},
				onError : function(e) {
					aReport.report.result = 'error';
					aReport.report.exception = e;
					_this._onFinish(aTest, aReport.report.result);
					aContinuation('ok');
				}
			});
			return report;
		}

		report.result = 'success';
		this._onFinish(aTest, report.result);
	}
	catch(exception if exception.name == 'AssertionFailed') {
		report.result = 'failure';
		report.exception = exception;
		this._onFinish(aTest, report.result);
	}
	catch(exception) {
		report.result = 'error';
		report.exception = exception;
		this._onFinish(aTest, report.result);
	}

	return report;
}
 
function _checkPriorityToExec(aTest) 
{
	var forceNever = _isNever(aTest.priority) || _isNever(this._masterPriority);
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
                    (lastResult != 'success' && lastResult != 'passover')) {
			shouldDo = true;
		}
	}
	return shouldDo;
}
function _isNever(aPriority)
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
		statement.bindStringParameter(1, aTest.desc);
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
  
