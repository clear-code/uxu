/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is UxU - UnitTest.XUL.
 *
 * The Initial Developer of the Original Code is YUKI "Piro" Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2010-2016
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): YUKI "Piro" Hiroshi <shimoda@clear-code.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// API compatible to:
//  * MockObject.js http://micampe.it/projects/jsmock
//  * JSMock http://jsmock.sourceforge.net/

var EXPORTED_SYMBOLS = [
		'MockManager', 'Mock', 'FunctionMock', 'MockFunction', 'GetterMock', 'SetterMock',
		'TypeOf'
	];

const Cc = Components.classes;
const Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/inherit.jsm', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/multiplexError.js', ns);
Components.utils.import('resource://uxu-modules/test/assertions.js', ns);
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

function MockManager(aAssertions)
{
	this._assert = aAssertions || new ns.Assertions();
	this.clear();
}
MockManager.prototype = {
	clear : function()
	{
		this.mocks = [];
	},
	resetAll : function()
	{
		this.mocks.forEach(function(aMock) {
			if ('_reset' in aMock)
				aMock._reset();
			else if ('reset' in aMock)
				aMock.reset();
		}, this);
	},
	assertAll : function()
	{
		var errors = [];
		var self = this;
		this._assert.doInternalAssertion(function() {
			self.mocks.forEach(function(aMock) {
				if ('assert' in aMock && typeof aMock.assert == 'function') {
					try {
						aMock.assert();
					}
					catch(e) {
						errors.push(e);
					}
				}
			}, self);
		});
		if (errors.length)
			throw new ns.MultiplexError(errors);
		else
			this._assert.isTrue(true); // to block "there is no assertion" warning
	},
	addMock : function(aMock)
	{
		if (this.mocks.indexOf(aMock) < 0)
			this.mocks.push(aMock);
	},
	createMock : function(aName, aSource)
	{
		var mock = new Mock(aName, aSource);
		mock._assert = this._assert;
		this.addMock(mock);
		return mock;
	},
	createFunctionMock : function(aName, aSource)
	{
		var mock = new FunctionMock(aName, aSource);
		mock._mock._assert = this._assert;
		this.addMock(mock);
		return mock;
	},
	createGetterMock : function(aName, aSource)
	{
		var mock = new GetterMock(aName, aSource);
		mock._mock._assert = this._assert;
		this.addMock(mock);
		return mock;
	},
	createSetterMock : function(aName, aSource)
	{
		var mock = new SetterMock(aName, aSource);
		mock._mock._assert = this._assert;
		this.addMock(mock);
		return mock;
	},
	createHTTPServerMock : function(aName, aSource)
	{
		var mock = new HTTPServerMock(aName, aSource);
		mock._mock._assert = this._assert;
		this.addMock(mock);
		return mock;
	},
	// JSMock API
	reset : function()
	{
		this.resetAll();
	},
	verify : function()
	{
		this.assertAll();
	},
	// JsMockito API
	when : function(aMock)
	{
		if (!aMock)
			throw new Error(bundle.getString('mock_manager_error_when_no_mock'));
		if (!('expect' in aMock) && !('expectThrows' in aMock))
			throw new Error(bundle.getFormattedString('mock_manager_error_when_not_mock', [utils.inspect(aMock)]));
		return aMock.expects();
	},
	export : function(aTarget)
	{
		var self = this;

		aTarget.Mock = function(...aArgs) { return self.createMock.apply(self, aArgs); };
		aTarget.Mock.prototype = Mock.prototype;
		Mock.export(aTarget.Mock, this._assert);
		aTarget.Mock.getMockFor = function(aObject, aName) {
			var mock = Mock.getMockFor(aObject, aName, self._assert);
			self.addMock(mock);
			return mock;
		};

		aTarget.FunctionMock = function(...aArgs) { return self.createFunctionMock.apply(self, aArgs); };
		aTarget.FunctionMock.prototype = FunctionMock.prototype;
		aTarget.MockFunction = aTarget.FunctionMock;
		aTarget.GetterMock = function(...aArgs) { return self.createGetterMock.apply(self, aArgs); };
		aTarget.GetterMock.prototype = GetterMock.prototype;
		aTarget.SetterMock = function(...aArgs) { return self.createSetterMock.apply(self, aArgs); };
		aTarget.SetterMock.prototype = SetterMock.prototype;
		aTarget.HTTPServerMock = function(...aArgs) { return self.createHTTPServerMock.apply(self, aArgs); };
		aTarget.HTTPServerMock.prototype = HTTPServerMock.prototype;

		// MockObject,js
		aTarget.MockObject = aTarget.MockCreate = aTarget.Mock;

		// JSMock
		aTarget.TypeOf = TypeOf;
		aTarget.MockControl = function() { return self; };
		aTarget.createMock = aTarget.Mock;
		aTarget.resetMocks = function() { return self.resetAll(); };
		aTarget.verifyMocks = function() { return self.assertAll(); };
		aTarget.JSMock = {
			extend : function(aTarget) {
				self.extend(aTarget);
			}
		};

		// JsMockito
		aTarget.mock = aTarget.Mock;
		aTarget.mockFunction = aTarget.FunctionMock;
		aTarget.when = function(...aArgs) { return self.when.apply(self, aArgs); };
		// JsHamcrest
		aTarget.anything = function() { return Mock.prototype.ANY_ONETIME; };
		aTarget.equalTo = function(aArg) { return aArg; };
	}
};

function Mock(aName, aSource, aAssertions)
{
	if (aName && typeof aName != 'string')
		[aSource, aAssertions, aName] = [aName, aSource, null];
	this._name = aName;
	this._reset();
	this._assert = aAssertions || new ns.Assertions();
	if (aSource) {
		aSource = aSource.wrappedJSObject || aSource;
		switch (typeof aSource)
		{
			case 'function':
				this._name = this._name ||
				              (String(aSource).match(/function\s*([^\(]*)\s*\(/) && RegExp.$1) ||
				              this._defaultName;
				this._inherit(aSource.prototype);
				break;
			case 'object':
				this._name = this._name ||
				              (String(aSource.constructor).match(/function\s*([^\(]*)\s*\(|\[object ([^\]]+)\]/) && (RegExp.$1 || RegExp.$2)) ||
				              this._defaultName;
				this._inherit(aSource);
				break;
			default:
				this._name = this._name || this._defaultName;
				break;
		}
	}
	else {
		this._name = this._name || this._defaultName;
	}

	return new Proxy(this, {
		get: function(aTarget, aName) {
			if (aName in aTarget)
				return aTarget[aName];
			return function(...aArgs) {
				return aTarget.__noSuchMethod__.call(this, aName, aArgs);
			};
		}
	});
}
Mock.prototype = {
	ANY         : '0f18acc8-9b1f-4261-a220-32e1dfed83d2',
	ANY_ONETIME : '1843351e-0446-40ce-9bbd-cfd01d3c87a4',
	ALWAYS      : '11941072-0dc4-406b-a392-f57d36bb0b27',
	ONETIME     : '079e5fb7-0b5e-4139-b365-48455901f17b',
	NEVER       : '5b9a1df9-2c17-4fb4-9b3d-cdb860bf39a6',
	_defaultName : bundle.getString('mock_default_name'),
	_inherit : function(aSource)
	{
		for (let i in aSource)
		{
			if (i in this)
				continue;

			let getter = utils.lookupGetter(aSource, i);
			if (getter) this.addGetter(i);
			let setter = utils.lookupSetter(aSource, i);
			if (setter) this.addSetter(i);
			if (!getter && !setter) {
				if (typeof aSource[i] != 'function') {
					this.addGetter(i);
					this.addSetter(i);
				}
			}
		}
	},
	addMethod : function(aName, aAssertions)
	{
		var method = this[aName];
		if (!method || !('expect' in method)) {
			method = new FunctionMock(aName, null, aAssertions || this._assert);
			this._methods[aName] = method;
			this[aName] = method;
		}
		return method;
	},
	_addMethod : function(...aArgs) { return this.addMethod.apply(this, aArgs); },
	addGetter : function(aName, aAssertions)
	{
		var getter = this._getters[aName];
		if (!getter || !('expect' in getter)) {
			getter = new GetterMock(aName, null, aAssertions || this._assert);
			this._getters[aName] = getter;
			this.__defineGetter__(aName, getter);
		}
		return getter;
	},
	_addGetter : function(...aArgs) { return this.addGetter.apply(this, aArgs); },
	addSetter : function(aName, aAssertions)
	{
		var setter = this._setters[aName];
		if (!setter || !('expect' in setter)) {
			setter = new SetterMock(aName, null, aAssertions || this._assert);
			this._setters[aName] = setter;
			this.__defineSetter__(aName, setter);
		}
		return setter;
	},
	_addSetter : function(...aArgs) { return this.addSetter.apply(this, aArgs); },

	__noSuchMethod__ : function(aName, aArguments)
	{
		throw new Error(bundle.getFormattedString(
					'mock_unexpected_call',
					[this._name, aName, utils.inspect(aArguments)]
				));
	},

	_addExpectedCall : function(aCall)
	{
		var self = this;
		this._expectedCalls.push(aCall);
		aCall.addHandler(function() {
			self._handleCall.call(self, this.firstExpectedCall);
		}, function(aError) {
			self._expectedCalls.shift();
		});
	},
	_handleCall : function(aCall)
	{
		try {
			this._assert.isObject(aCall);
			this._assert.isNotNull(aCall);
			this._assert.notEquals(0, this._expectedCalls.length);
			this._assert.equals(this._expectedCalls[0], aCall);
		}
		finally {
			this._expectedCalls.shift();
		}
	},

	expect : function(aName)
	{
		if (!arguments.length && !this._inExpectationChain)
			return this._createExpectationChain();

		var expectArgs = Array.slice(arguments, 1);
		if (!expectArgs.length) expectArgs.push([]);
		var method = this.addMethod(aName);
		var last = method.lastExpectedCall;
		method.expect.apply(method, expectArgs);
		if (method.lastExpectedCall != last)
			this._addExpectedCall(method.lastExpectedCall);
		return method;
	},
	_expect : function(...aArgs) { return this.expect.apply(this, aArgs); },
	expects : function(...aArgs) { return this.expect.apply(this, aArgs); },
	_expects : function(...aArgs) { return this.expect.apply(this, aArgs); },
	expectThrows : function(aName)
	{
		var method = this.addMethod(aName);
		var last = method.lastExpectedCall;
		method.expectThrows.apply(method, Array.slice(arguments, 1));
		if (method.lastExpectedCall != last)
			this._addExpectedCall(method.lastExpectedCall);
		return method;
	},
	_expectThrows : function(...aArgs) {return  this.expectThrows.apply(this, aArgs); },
	expectThrow : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },
	_expectThrow : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },
	expectRaises : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },
	_expectRaises : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },
	expectRaise : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },
	_expectRaise : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },

	expectGet : function(aName)
	{
		var expectArgs = Array.slice(arguments, 1);
		if (!expectArgs.length) expectArgs.push(void(0));
		var getter = this.addGetter(aName);
		var last = getter.lastExpectedCall;
		getter.expect.apply(getter, expectArgs);
		if (getter.lastExpectedCall != last)
			this._addExpectedCall(getter.lastExpectedCall);
		return getter;
	},
	_expectGet : function(...aArgs) { return this.expectGet.apply(this, aArgs); },
	expectGetThrows : function(aName)
	{
		var getter = this.addGetter(aName);
		var last = getter.lastExpectedCall;
		getter.expectThrows.apply(getter, Array.slice(arguments, 1));
		if (getter.lastExpectedCall != last)
			this._addExpectedCall(getter.lastExpectedCall);
		return getter;
	},
	_expectGetThrows : function(...aArgs) { return this.expectGetThrows.apply(this, aArgs); },
	expectGetThrow : function(...aArgs) { return this.expectGetThrows.apply(this, aArgs); },
	_expectGetThrow : function(...aArgs) { return this.expectGetThrows.apply(this, aArgs); },
	expectGetRaises : function(...aArgs) { return this.expectGetThrows.apply(this, aArgs); },
	_expectGetRaises : function(...aArgs) { return this.expectGetThrows.apply(this, aArgs); },
	expectGetRaise : function(...aArgs) { return this.expectGetThrows.apply(this, aArgs); },
	_expectGetRaise : function(...aArgs) { return this.expectGetThrows.apply(this, aArgs); },

	expectSet : function(aName)
	{
		var expectArgs = Array.slice(arguments, 1);
		if (!expectArgs.length) expectArgs.push(void(0));
		var setter = this.addSetter(aName);
		var last = setter.lastExpectedCall;
		setter.expect.apply(setter, expectArgs);
		if (setter.lastExpectedCall != last)
			this._addExpectedCall(setter.lastExpectedCall);
		return setter;
	},
	_expectSet : function(...aArgs) { return this.expectSet.apply(this, aArgs); },
	expectSetThrows : function(aName)
	{
		var setter = this.addSetter(aName);
		var last = setter.lastExpectedCall;
		setter.expectThrows.apply(setter, Array.slice(arguments, 1));
		if (setter.lastExpectedCall != last)
			this._addExpectedCall(setter.lastExpectedCall);
		return setter;
	},
	_expectSetThrows : function(...aArgs) { return this.expectSetThrows.apply(this, aArgs); },
	expectSetThrow : function(...aArgs) { return this.expectSetThrows.apply(this, aArgs); },
	_expectSetThrow : function(...aArgs) { return this.expectSetThrows.apply(this, aArgs); },
	expectSetRaises : function(...aArgs) { return this.expectSetThrows.apply(this, aArgs); },
	_expectSetRaises : function(...aArgs) { return this.expectSetThrows.apply(this, aArgs); },
	expectSetRaise : function(...aArgs) { return this.expectSetThrows.apply(this, aArgs); },
	_expectSetRaise : function(...aArgs) { return this.expectSetThrows.apply(this, aArgs); },

	// JSMock API
	addMockMethod : function(aName)
	{
		this.addMethod(aName);
	},

	// JSMock, JsMockito
	_createExpectationChain : function()
	{
		var self = this;
		this._inExpectationChain = true;
		var noSuchMethod = function(aName, aArguments) {
				var method = self.addMethod(aName);
				var last = method.lastExpectedCall;
				method.expect(aArguments);
				if (method.lastExpectedCall != last)
					self._addExpectedCall(method.lastExpectedCall);
				self._inExpectationChain = false;
				return method;
			};
		return new Proxy({}, {
			get: function(aTarget, aName) {
				if (aName in aTarget)
					return aTarget[aName];
				return function(...aArgs) {
					return noSuchMethod.call(this, aName, aArgs);
				};
			}
		});
	},
	get when()
	{
		return this._createExpectationChain();
	},

	reset : function()
	{
		if (this._getters) {
			for (let i in this._getters)
			{
				this._getters[i].reset();
			}
		}
		if (this._setters) {
			for (let i in this._setters)
			{
				this._setters[i].reset();
			}
		}
		if (this._methods) {
			for (let i in this._methods)
			{
				this._methods[i].reset();
			}
		}

		this._methods = {};
		this._getters = {};
		this._setters = {};
		this._inExpectationChain = false;
		this._expectedCalls = [];
	},
	_reset : function() { this.reset(); },

	assert : function()
	{
		var errors = [];
		var self = this;
		this._assert.doInternalAssertion(function() {
			for (let i in self._getters)
			{
				try {
					self._getters[i].assert();
				}
				catch(e) {
					errors.push(e);
				}
			}
			for (let i in self._setters)
			{
				try {
					self._setters[i].assert();
				}
				catch(e) {
					errors.push(e);
				}
			}
			for (let i in self._methods)
			{
				try {
					self._methods[i].assert();
				}
				catch(e) {
					errors.push(e);
				}
			}
		});
		if (errors.length)
			throw new ns.MultiplexError(errors);
		else
			this._assert.isTrue(true); // to block "there is no assertion" warning
	},
	_assert  : function() { this.assert(); },
	verify : function() { this.assert(); },
	_verify : function() { this.assert(); }
};

Mock.getMockFor = function(aObject, aName, aAssertions) {
	if (!aObject)
		throw new Error(bundle.getString('mock_error_creation_no_target'));
	if (typeof aObject != 'object')
		throw new Error(bundle.getFormattedString('mock_error_creation_invalid_target', [utils.inspect(aObject)]));
	return (aObject.__uxu__mock = aObject.__uxu__mock || new Mock(aName, aObject, aAssertions));
};
Mock.addMethod = function(aObject, aName, aAssertions) {
	var method = this.getMockFor(aObject).addMethod(aName, aAssertions);
	if (aObject[aName] != method) aObject[aName] = method;
	return method;
};
Mock.addGetter = function(aObject, aName, aAssertions) {
	var getter = this.getMockFor(aObject).addGetter(aName, aAssertions);
	if (utils.lookupGetter(aObject, aName) != getter) aObject.__defineGetter__(aName, getter);
	return getter;
};
Mock.addSetter = function(aObject, aName, aAssertions) {
	var setter = this.getMockFor(aObject).addSetter(aName, aAssertions);
	if (utils.lookupSetter(aObject, aName) != setter) aObject.__defineSetter__(aName, setter);
	return setter;
};

Mock.expect = function(aObject, aName) {
	var mock = this.getMockFor(aObject);
	this.addMethod(aObject, aName);
	return mock.expect.apply(mock, Array.slice(arguments, 1));
};
Mock.expects = Mock.expect;
Mock.expectThrows = function(aObject, aName) {
	var mock = this.getMockFor(aObject);
	this.addMethod(aObject, aName);
	return mock.expectThrows.apply(mock, Array.slice(arguments, 1));
};
Mock.expectRaise = Mock.expectRaises = Mock.expectThrow = Mock.expectThrows;

Mock.expectGet = function(aObject, aName) {
	var mock = this.getMockFor(aObject);
	this.addGetter(aObject, aName);
	return mock.expectGet.apply(mock, Array.slice(arguments, 1));
};
Mock.expectGetThrows = function(aObject, aName) {
	var mock = this.getMockFor(aObject);
	this.addGetter(aObject, aName);
	return mock.expectGetThrows.apply(mock, Array.slice(arguments, 1));
};
Mock.expectGetRaise = Mock.expectGetRaises = Mock.expectGetThrow = Mock.expectGetThrows;

Mock.expectSet = function(aObject, aName) {
	var mock = this.getMockFor(aObject);
	this.addSetter(aObject, aName);
	return mock.expectSet.apply(mock, Array.slice(arguments, 1));
};
Mock.expectSetThrows = function(aObject, aName) {
	var mock = this.getMockFor(aObject);
	this.addSetter(aObject, aName);
	return mock.expectSetThrows.apply(mock, Array.slice(arguments, 1));
};
Mock.expectSetRaise = Mock.expectSetRaises = Mock.expectSetThrow = Mock.expectSetThrows;

Mock.ANY         = Mock.prototype.ANY;
Mock.ANY_ONETIME = Mock.prototype.ANY_ONETIME;
Mock.ALWAYS      = Mock.prototype.ALWAYS;
Mock.ONETIME     = Mock.prototype.ONETIME;
Mock.NEVER       = Mock.prototype.NEVER;
Mock.export = function(aTarget, aAssertions) {
	aAssertions = aAssertions || new ns.Assertions();

	var self = this;
	aTarget.getMockFor = function(aObject, aName) {
		return self.getMockFor(aObject, aName, aAssertions);
	};
	aTarget.export = function(aObject) {
		self.export(aObject, aAssertions);
	};

	aTarget.ANY         = this.prototype.ANY;
	aTarget.ANY_ONETIME = this.prototype.ANY_ONETIME;
	aTarget.ALWAYS      = this.prototype.ALWAYS;
	aTarget.ONETIME     = this.prototype.ONETIME;
	aTarget.NEVER       = this.prototype.NEVER;

	aTarget.addMethod = this.addMethod;
	aTarget.addSetter = this.addSetter;
	aTarget.addGetter = this.addGetter;

	aTarget.expecs = aTarget.expect = this.expect;
	aTarget.expectRaise = aTarget.expectRaises = aTarget.expectThrow = aTarget.expectThrows = this.expectThrows;

	aTarget.expectGet = this.expectGet;
	aTarget.expectGetRaise = aTarget.expectGetRaises = aTarget.expectGetThrow = aTarget.expectGetThrows = this.expectGetThrows;

	aTarget.expectSet = this.expectSet;
	aTarget.expectSetRaise = aTarget.expectSetRaises = aTarget.expectSetThrow = aTarget.expectSetThrows = this.expectSetThrows;
};


function ExpectedCall(aOptions)
{
	this._arguments = [];
	this.handlers   = [];
	this.errorHandlers = [];

	if ('arguments' in aOptions)
		this.arguments = aOptions.arguments;
	if ('returnValue' in aOptions)
		this.returnValue = aOptions.returnValue;
	if ('exceptionClass' in aOptions)
		this.exceptionClass = aOptions.exceptionClass;
	if ('exceptionMessage' in aOptions)
		this.exceptionMessage = aOptions.exceptionMessage;
}
ExpectedCall.prototype = {
	addHandler : function(aHandler, aErrorHandler)
	{
		this.handlers.push(aHandler);
		this.errorHandlers.push(aErrorHandler);
	},
	onCall : function(aMock, aArguments)
	{
		this.handlers.forEach(function(aHandler) {
			if (aHandler && typeof aHandler == 'function')
				aHandler.apply(aMock, aArguments);
		}, aMock);
	},
	onError : function(aMock, aError)
	{
		this.errorHandlers.forEach(function(aHandler) {
			if (aHandler && typeof aHandler == 'function')
				aHandler.call(aMock, aError);
		}, aMock);
	},
	finish : function(aArguments)
	{
		if ('exceptionClass' in this) {
			let exception = this.exceptionClass;
			if (typeof exception == 'function')
				exception = new this.exceptionClass(this.exceptionMessage);
			throw exception;
		}
		return typeof this.returnValue == 'function' ?
				this.returnValue.apply(null, aArguments) :
				this.returnValue ;
	},
	get arguments()
	{
		return this._arguments;
	},
	set arguments(aValue)
	{
		if (utils.isArray(aValue)) {
			this._arguments = aValue.slice(0);
		}
		else {
			this._arguments = [aValue];
		}
		return this._arguments;
	},
	isAnyCall : function()
	{
		return this.arguments[0] == Mock.prototype.ANY || this.arguments[0] == Mock.prototype.ALWAYS;
	},
	isOneTimeAnyCall : function()
	{
		return this.arguments[0] == Mock.prototype.ANY_ONETIME || this.arguments[0] == Mock.prototype.ONETIME;
	}
};

function FunctionMock(aName, aSource, aAssertions)
{
	if (aName && typeof aName != 'string')
		[aSource, aAssertions, aName] = [aName, aSource, null];
	this.init(aName, aSource, aAssertions);
	return this.createFunction();
}
FunctionMock.prototype = {
	defaultName : bundle.getString('function_mock_default_name'),
	init : function(aName, aSource, aAssertions)
	{
		aName = aName || (String(aSource).match(/function\s*([^\(]*)\s*\(/) && RegExp.$1);
		this.name = aName || this.defaultName || '';
		this.stack = utils.getStackTrace();

		this._assert = aAssertions || new ns.Assertions();

		this.reset();
	},
	reset : function()
	{
		this.errors = [];
		this.inExpectationChain = false;
		this.expectedCalls = [];
		this.anyCall = null;
		this.successCount = 0;
		this.errorCount = 0;
		this.expectedCount = 0;
	},
	createFunction : function()
	{
		var self = this;
		var func = function(...aArgs) { return self.onCall(this, aArgs); };
		func._mock = this;
		this.export(func);

		return func;
	},
	get firstExpectedCall()
	{
		var calls = this.expectedCalls;
		return calls.length ? calls[0] : null ;
	},
	get lastExpectedCall()
	{
		var calls = this.expectedCalls;
		return calls.length ? calls[calls.length-1] : null ;
	},
	getCurrentCall : function(aMessage)
	{
		if (!this.anyCall && !this.expectedCalls.length) {
			this.errorCount++;
			throw new Error(aMessage);
		}
		return this.anyCall || this.firstExpectedCall;
	},
	addExpectedCall : function(aOptions)
	{
		var call = new ExpectedCall(aOptions);
		if (call.isAnyCall()) {
			this.anyCall = call;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
			this.expectedCount++;
		}
		return call;
	},
	addError : function(aError)
	{
		if (aError.name == 'MultiplexError') {
			aError.errors.forEach(function(aOneError) {
				this.addError(aOneError);
			}, this);
		}
		else {
			if (aError.stack)
				aError.stack += this.stack;
			this.errors.push(aError);
		}
		return aError;
	},
	isSpecialSpec : function(aArgument)
	{
		return (
			aArgument == Mock.prototype.ALWAYS ||
			aArgument == Mock.prototype.ONETIME ||
			aArgument == Mock.prototype.ANY ||
			aArgument == Mock.prototype.ANY_ONETIME ||
			aArgument == Mock.prototype.NEVER
		);
	},
	// JSMock, JsMockito
	createExpectationChain : function(aSelf)
	{
		this.inExpectationChain = true;
		var self = aSelf || this;
		return function(...aArgs) {
			self.expect(aArgs);
			var boundContext = this;
			if (boundContext != self)
				self.lastExpectedCall.context = boundContext;
			self.inExpectationChain = false;
			return self;
		};
	},
	get when()
	{
		return this.createExpectationChain();
	},
	expect : function(aArguments, aReturnValue)
	{
		if (!arguments.length && !this.inExpectationChain)
			return this.createExpectationChain();
		if (aArguments != Mock.prototype.NEVER)
			this.addExpectedCall({
				arguments   : aArguments,
				returnValue : aReturnValue
			});
		return this;
	},
	expects : function(...aArgs) { return this.expect.apply(this, aArgs); },
	expectThrows : function(aArguments, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getFormattedString('mock_error_no_exception', [this.name]));
		this.addExpectedCall({
			arguments        : aArguments,
			exceptionClass   : aExceptionClass,
			exceptionMessage : aExceptionMessage
		});
		return this;
	},
	expectThrow : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },
	expectRaises : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },
	expectRaise : function(...aArgs) { return this.expectThrows.apply(this, aArgs); },

	bindTo : function(aTarget)
	{
		this.lastExpectedCall.context = aTarget;
		return this;
	},
	boundTo : function(...aArgs) { return this.bindTo.apply(this, aArgs); },
	andBindTo : function(...aArgs) { return this.bindTo.apply(this, aArgs); },
	andBoundTo : function(...aArgs) { return this.bindTo.apply(this, aArgs); },

	times : function(aTimes)
	{
		if (!aTimes)
			throw new Error(bundle.getFormattedString('mock_error_times_zero', [this.name]));
		if (typeof aTimes != 'number' || aTimes < 1)
			throw new Error(bundle.getFormattedString('mock_error_times_invalid', [this.name, aTimes]));
		for (var i = 0, maxi = aTimes-1; i < maxi; i++)
		{
			this.addExpectedCall(this.lastExpectedCall);
		}
		return this;
	},
	time : function(...aArgs) { return this.times.apply(this, aArgs); },

	// JSMock API
	andReturn : function(aValue)
	{
		var call = this.lastExpectedCall;
		call.returnValue = aValue;
		return this;
	},
	andReturns : function(...aArgs) { return this.andReturn.apply(this, aArgs); }, // extended from JSMock
	andThrow : function(aExceptionClass, aExceptionMessage)
	{
		var call = this.lastExpectedCall;
		call.exceptionClass = aExceptionClass;
		call.exceptionMessage = aExceptionMessage;
		return this;
	},
	andThrows : function(...aArgs) { return this.andReturn.apply(this, aArgs); }, // extended from JSMock
	andStub : function(aHandler)
	{
		if (!aHandler)
			throw new Error(bundle.getFormattedString('function_mock_no_stub', [this.name, 'andStub']));
		if (typeof aHandler != 'function')
			throw new Error(bundle.getFormattedString('function_mock_not_stub', [this.name, 'andStub', utils.inspect(aHandler)]));
		var call = this.lastExpectedCall;
		call.addHandler(aHandler);
		return this;
	},

	// JsMockito API
	thenReturn : function(...aArgs) { return this.andReturn.apply(this, aArgs); },
	thenReturns : function(...aArgs) { return this.andReturn.apply(this, aArgs); }, // extended from JsMockito
	thenThrow : function(...aArgs) { return this.andThrow.apply(this, aArgs); },
	thenThrows : function(...aArgs) { return this.andThrow.apply(this, aArgs); }, // extended from JsMockito
	then : function(aHandler)
	{
		if (!aHandler)
			throw new Error(bundle.getFormattedString('function_mock_no_stub', [this.name, 'then']));
		if (typeof aHandler != 'function')
			throw new Error(bundle.getFormattedString('function_mock_not_stub', [this.name, 'then', utils.inspect(aHandler)]));
		return this.andStub.apply(this, arguments);
	},

	onCall : function(aContext, aArguments)
	{
		var call;
		try {
			call = this.getCurrentCall(bundle.getFormattedString(
				'function_mock_unexpected_call',
				[this.name, utils.inspect(aArguments)]
			));

			if (!call.isAnyCall() && !call.isOneTimeAnyCall()) {
				let message = bundle.getFormattedString('function_mock_wrong_arguments', [this.name]);
				this._assert.doInternalAssertion('equals',
					this.formatArgumentsArray(call.arguments, aArguments, message),
					aArguments,
					message
				);
			}

			if ('context' in call) {
				this._assert.doInternalAssertion('equals',
					call.context,
					aContext,
					bundle.getFormattedString('function_mock_wrong_context', [this.name, utils.inspect(aArguments)])
				);
			}

			call.onCall(this, aArguments);
		}
		catch(e) {
			if (call) call.onError(this, e);
			this.addError(e);
			throw e;
		}
		finally {
			if (!this.anyCall)
				this.expectedCalls.shift();
		}

		this.successCount++;
		return call.finish(aArguments);
	},
	formatArgumentsArray : function(aExpectedArray, aActualArray, aMessage)
	{
		return aExpectedArray.map(function(aExpected, aIndex) {
			if (aExpected instanceof TypeOf) {
				let actual = aActualArray[aIndex];
				try {
					aExpected.assert(actual, this._assert, aMessage);
				}
				catch(e) {
					this.addError(e)
					throw e;
				}
				return actual;
			}
			else {
				return aExpected;
			}
		}, this);
	},
	assertInternal : function(aErrorMessageKey, aFailMessageKey)
	{
		var expected = this.expectedCount;
		var success = this.successCount;
		var preErrorsCount = this.errorCount;
		var errors = this.errors;

		this.reset();

		if (preErrorsCount) {
			let error = new Error(bundle.getFormattedString(aErrorMessageKey, [this.name, preErrorsCount]));
			error.stack += this.stack;
			throw error;
		}
		if (errors.length) {
			throw errors.length > 1 ? new ns.MultiplexError(errors) : errors[0] ;
		}
		this._assert.doInternalAssertion(
			'equals',
			expected,
			success,
			bundle.getFormattedString(aFailMessageKey, [this.name])
		);
	},
	assert : function()
	{
		this.assertInternal('function_mock_assert_error', 'function_mock_assert_fail');
	},
	verify : function() { this.assert(); },
	export : function(aTarget)
	{
		var self = this;

		['reset',
		 'assert', 'verify'].forEach(function(aMethod) {
			aTarget['_'+aMethod] =
				aTarget[aMethod] =
					function(...aArgs) { return self[aMethod].apply(self, aArgs); };
		}, this);

		['expect', 'expects',
		 'expectThrows', 'expectThrow',
		 'bindTo', 'boundTo',
		 'andBindTo', 'andBoundTo',
		 'times', 'time',
		 'andReturn', 'andReturns',
		 'andThrow', 'andThrows',
		 'andStub',
		 'thenReturn', 'thenReturns',
		 'thenThrow', 'thenThrows',
		 'then'].forEach(function(aMethod) {
			aTarget['_'+aMethod] =
				aTarget[aMethod] =
					function(...aArgs) {
						var value = self[aMethod].apply(self, aArgs);
						return value == self ? this : value ;
					};
		}, this);

		['firstExpectedCall',
		 'lastExpectedCall',
		 'expectedCalls',
		 'errors'].forEach(function(aName) {
			aTarget.__defineGetter__(aName, function() { return self[aName]; });
		}, this);

		aTarget.__defineGetter__('when', function() {
			return self.createExpectationChain(this);
		});
	}
};

var MockFunction = FunctionMock;

function GetterMock(aName, aSource, aAssertions)
{
	if (aName && typeof aName != 'string')
		[aSource, aAssertions, aName] = [aName, aSource, null];
	this.init(aName, aSource, aAssertions);
	return this.createFunction();
}
GetterMock.prototype = ns.inherit(FunctionMock.prototype, {
	defaultName : bundle.getString('getter_mock_default_name'),
	expect : function(aReturnValue)
	{
		var args = [];
		if (this.isSpecialSpec(aReturnValue))
			[args, aReturnValue] = Array.slice(arguments);
		if (args != Mock.prototype.NEVER)
			this.addExpectedCall({
				arguments   : args,
				returnValue : aReturnValue
			});
		return this;
	},
	expectThrows : function(aExceptionClass, aExceptionMessage)
	{
		var args = [];
		if (
			aExceptionMessage &&
			this.isSpecialSpec(aExceptionClass)
			) {
			[args, aExceptionClass, aExceptionMessage] = Array.slice(arguments);
		}
		if (!aExceptionClass)
			throw new Error(bundle.getFormattedString('mock_error_no_exception', [this.name]));
		this.addExpectedCall({
			arguments        : args,
			exceptionClass   : aExceptionClass,
			exceptionMessage : aExceptionMessage
		});
		return this;
	},
	onCall : function(aContext)
	{
		var call;
		try {
			call = this.getCurrentCall(bundle.getFormattedString('getter_mock_unexpected_call', [this.name]));

			if ('context' in call) {
				this._assert.doInternalAssertion('equals',
					call.context,
					aContext,
					bundle.getFormattedString('getter_mock_wrong_context', [this.name])
				);
			}

			call.onCall(this, []);
		}
		catch(e) {
			if (call) call.onError(this, e);
			this.addError(e);
			throw e;
		}
		finally {
			if (!this.anyCall)
				this.expectedCalls.shift();
		}

		this.successCount++;
		return call.finish([]);
	},
	assert : function()
	{
		this.assertInternal('getter_mock_assert_error', 'getter_mock_assert_fail');
	}
});

function SetterMock(aName, aSource, aAssertions)
{
	if (aName && typeof aName != 'string')
		[aSource, aAssertions, aName] = [aName, aSource, null];
	this.init(aName, aSource, aAssertions);
	return this.createFunction();
}
SetterMock.prototype = ns.inherit(FunctionMock.prototype, {
	defaultName : bundle.getString('setter_mock_default_name'),
	expect : function(aArgument, aReturnValue)
	{
		if (aArgument != Mock.prototype.NEVER) {
			var call = this.addExpectedCall({
					arguments   : [aArgument]
				});
			if (arguments.length > 1)
				call.returnValue = aReturnValue;
			else if (!this.isSpecialSpec(aArgument))
				call.returnValue = aArgument;
		}
		return this;
	},
	expectThrows : function(aArgument, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getFormattedString('mock_error_no_exception', [this.name]));
		this.addExpectedCall({
			arguments        : [aArgument],
			exceptionClass   : aExceptionClass,
			exceptionMessage : aExceptionMessage
		});
		return this;
	},
	onCall : function(aContext, aArguments)
	{
		if (!aArguments.length) aArguments = [void(0)];

		var call;
		try {
			call = this.getCurrentCall(bundle.getFormattedString(
				'setter_mock_unexpected_call',
				[this.name, utils.inspect(aArguments[0])]
			));

			if (!call.isAnyCall() && !call.isOneTimeAnyCall()) {
				let message = bundle.getFormattedString('setter_mock_wrong_value', [this.name]);
				this._assert.doInternalAssertion('equals',
					this.formatArgumentsArray(call.arguments, aArguments, message)[0],
					aArguments[0],
					message
				);
			}

			if ('context' in call) {
				this._assert.doInternalAssertion('equals',
					call.context,
					aContext,
					bundle.getFormattedString('setter_mock_wrong_context', [this.name, utils.inspect(aArguments[0])])
				);
			}

			call.onCall(this, aArguments);
		}
		catch(e) {
			if (call) call.onError(this, e);
			this.addError(e);
			throw e;
		}
		finally {
			if (!this.anyCall)
				this.expectedCalls.shift();
		}

		this.successCount++;
		var returnValue = call.finish([]);
		return !('returnValue' in call) && !this.isSpecialSpec(call.arguments[0]) ?
				aArguments[0] :
				returnValue ;
	},
	assert : function()
	{
		this.assertInternal('setter_mock_assert_error', 'setter_mock_assert_fail');
	}
});

function HTTPServerMock(aName, aSource, aAssertions)
{
	if (aName && typeof aName != 'string')
		[aSource, aAssertions, aName] = [aName, aSource, null];
	this.init(aName, aSource, aAssertions);
	return this.createFunction();
}
HTTPServerMock.prototype = ns.inherit(FunctionMock.prototype, {
	defaultName : bundle.getString('server_mock_default_name'),
	expect : function(aArgument, aReturnValue)
	{
		if (!arguments.length && !this.inExpectationChain)
			return this.createExpectationChain();
		if (aArgument != Mock.prototype.NEVER) {
			aReturnValue = this.formatReturnValue.apply(this, Array.slice(arguments, 1));
			this.addExpectedCall({
				arguments   : [aArgument],
				returnValue : aReturnValue
			});
		}
		return this;
	},
	expectThrows : function(aArgument, aStatusCode, aStatusText)
	{
		if (!aStatusCode)
			throw new Error(bundle.getFormattedString('mock_error_no_exception', [this.name]));
		this.addExpectedCall({
			arguments   : [aArgument],
			returnValue : {
				uri        : '',
				file       : null,
				status     : aStatusCode,
				statusText : aStatusText || ''
			}
		});
		return this;
	},
	andReturn : function(aValue)
	{
		aValue = this.formatReturnValue.apply(this, Array.slice(arguments, 1));
		var call = this.lastExpectedCall;
		if (!call.returnValue) {
			for (let i in aValue)
			{
				call.returnValue[i] = aValue[i];
			}
		}
		else {
			call.returnValue = aValue;
		}
		return this;
	},
	andThrow : function(aStatusCode, aStatusText)
	{
		var call = this.lastExpectedCall;
		if (!call.returnValue)
			call.returnValue = { uri : '', file : null };
		call.returnValue.status = aStatusCode;
		call.returnValue.statusText = aStatusText || call.returnValue.statusText || '';
		return this;
	},
	onCall : function(aContext, aArguments)
	{
		if (!aArguments.length) aArguments = [void(0)];

		var call;
		try {
			call = this.getCurrentCall(bundle.getFormattedString(
				'server_mock_unexpected_call',
				[this.name, utils.inspect(aArguments[0])]
			));

			if (!call.isAnyCall() && !call.isOneTimeAnyCall()) {
				if (typeof call.arguments[0] == 'string') {
					let message = bundle.getFormattedString('server_mock_wrong_value', [this.name]);
					this._assert.doInternalAssertion('equals',
						this.formatArgumentsArray(call.arguments, aArguments, message)[0],
						aArguments[0],
						message
					);
				}
				else {
					this._assert.doInternalAssertion('matches',
						call.arguments[0],
						String(aArguments[0]),
						bundle.getFormattedString('server_mock_wrong_value', [this.name])
					);
				}
			}

			if (typeof call.arguments[0] != 'string') {
				let flags = call.arguments[0].ignoreCase ? 'i' : '' ;
				let regexp = new RegExp('^.*?(?:'+call.arguments[0].source+').*?$', flags);
				call.returnValue.uri = String(aArguments[0]).replace(regexp, call.returnValue.uri || '');
			}

			call.onCall(this, aArguments);
		}
		catch(e) {
			if (call) call.onError(this, e);
			this.addError(e);
			throw e;
		}
		finally {
			if (!this.anyCall)
				this.expectedCalls.shift();
		}

		this.successCount++;
		var returnValue = call.finish([]);
		return !returnValue.uri && !returnValue.file && this.isSpecialSpec(call.arguments[0]) ?
				this.formatReturnValue(aArguments[0]) :
				returnValue ;
	},
	assert : function()
	{
		this.assertInternal('server_mock_assert_error', 'server_mock_assert_fail');
	},
	formatReturnValue : function(aValue)
	{
		var uri, file, status, hash;
		Array.slice(arguments).forEach(function(aArg) {
			switch (typeof aArg)
			{
				case 'number':
					if (!status) status = aArg;
					break;

				case 'string':
					if (!uri) uri = aArg;
					break;

				case 'object':
					if (aArg instanceof Ci.nsIFile) {
						if (!file) file = aArg;
					}
					else if (aArg instanceof Ci.nsIURI) {
						if (!uri) uri = aArg;
					}
					else if (
							aArg &&
							(
								'uri' in aArg ||
								'url' in aArg ||
								'path' in aArg ||
								'file' in aArg
							)
							) {
						if (!hash) hash = aArg;
					}
					break;
			}
		});

		var result = hash || {};
		result.uri        = result.uri || result.url || result.path || uri || '';
		result.file       = result.file || file || null;
		result.status     = result.status || status || 0;
		result.statusText = result.statusText || '';
		if (!result.status && (result.uri || result.file))
			result.status = 200;

		return result;
	}
});

// JSMock API
function TypeOf(aConstructor) {
	if (this instanceof TypeOf) {
		this.expectedConstructor = aConstructor;
	}
	else {
		return new TypeOf(aConstructor);
	}
}
TypeOf.prototype = {
	assert : function(aActual, aAssertions, aMessage)
	{
		aAssertions = aAssertions || new ns.Assertions();

		aAssertions.isDefined(aActual, aMessage);
		aAssertions.isNotNull(aActual, aMessage);

		var expected = this.expectedConstructor;
		switch (typeof expected)
		{
			case 'string':
				switch (expected)
				{
					case 'bool':
					case 'boolean':
						aAssertions.doInternalAssertion('isBoolean', aActual, aMessage);
						break;
					case 'number':
						aAssertions.doInternalAssertion('isNumber', aActual, aMessage);
						break;
					case 'string':
						aAssertions.doInternalAssertion('isString', aActual, aMessage);
						break;
					case 'object':
						aAssertions.doInternalAssertion('isObject', aActual, aMessage);
						break;
					case 'array':
						aAssertions.doInternalAssertion('isArray', aActual, aMessage);
						break;
					default:
						aAssertions.doInternalAssertion('equals', expected, typeof aActual, aMessage);
						break;
				}
				break;

			case 'object':
				if (expected instanceof Ci.nsIJSIID) { // Ci.*
					aAssertions.doInternalAssertion('isInstanceOf', expected, aActual, aMessage);
				}
				else {
					let errors = [];
					for (let i in expected)
					{
						if (!expected.hasOwnProperty(i))
							continue;
						try {
							if (expected[i] instanceof TypeOf)
								expected[i].assert(aActual[i], aMessage);
							else
								aAssertions.doInternalAssertion('equals', expected[i], aActual[i], aMessage);
						}
						catch(e) {
							errors.push(e);
						}
					}
					if (errors.length)
						throw new ns.MultiplexError(errors);
				}
				break;

			default:
				aAssertions.doInternalAssertion('isInstanceOf', expected, aActual, aMessage);
				break;
		}
	}
};
TypeOf.isA = function(aConstructor) {
	return TypeOf(aConstructor);
};
