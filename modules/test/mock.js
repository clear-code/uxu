// API compatible to:
//  * MockObject.js http://micampe.it/projects/jsmock
//  * JSMock http://jsmock.sourceforge.net/

const EXPORTED_SYMBOLS = [
		'MockManager', 'Mock', 'FunctionMock', 'MockFunction', 'GetterMock', 'SetterMock',
		'TypeOf'
	];

var ns = {};
Components.utils.import('resource://uxu-modules/utils.js', ns);
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
		this._mocks = [];
	},
	assertAll : function()
	{
		this._mocks.forEach(function(aMock) {
			if ('assert' in aMock && typeof aMock.assert == 'function')
				aMock.assert();
		}, this);
	},
	Mock : function(aName, aSource)
	{
		var mock = new Mock(aName, aSource);
		mock.__assert = this._assert;
		this._mocks.push(mock);
		return mock;
	},
	FunctionMock : function(aName, aSource)
	{
		var mock = new FunctionMock(aName, aSource);
		mock._mock._assert = this._assert;
		this._mocks.push(mock);
		return mock;
	},
	MockFunction : function() { return this.FunctionMock.apply(this, arguments); },
	GetterMock : function(aName, aSource)
	{
		var mock = new GetterMock(aName, aSource);
		mock._mock._assert = this._assert;
		this._mocks.push(mock);
		return mock;
	},
	SetterMock : function(aName, aSource)
	{
		var mock = new SetterMock(aName, aSource);
		mock._mock._assert = this._assert;
		this._mocks.push(mock);
		return mock;
	},
	// JSMock API
	verify : function()
	{
		this.assertAll();
	},
	createMock : function(aSource)
	{
		return this.Mock(aSource);
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

		aTarget.Mock = function() { return self.Mock.apply(self, arguments); };
		Mock.export(aTarget.Mock);

		aTarget.FunctionMock = function() { return self.FunctionMock.apply(self, arguments); };
		aTarget.MockFunction = aTarget.FunctionMock;
		aTarget.GetterMock = function() { return self.GetterMock.apply(self, arguments); };
		aTarget.SetterMock = function() { return self.SetterMock.apply(self, arguments); };

		// MockObject,js
		aTarget.MockObject = aTarget.MockCreate = aTarget.Mock;

		// JSMock
		aTarget.TypeOf = TypeOf;
		aTarget.MockControl = function() { return self; };

		// JsMockito
		aTarget.mock = aTarget.Mock;
		aTarget.mockFunction = aTarget.FunctionMock;
		aTarget.when = function() { return self.when.apply(self, arguments); };
		// JsHamcrest
		aTarget.anything = function() { return Mock.prototype.ANY_ONETIME; };
		aTarget.equalTo = function(aArg) { return aArg; };
	}
};

function Mock(aName, aSource, aAssertions)
{
	if (aName && typeof aName != 'string')
		[aSource, aAssertions, aName] = [aName, aSource, null];
	this.__name = aName;
	this.__methods = {};
	this.__getters = {};
	this.__setters = {};
	this.__inExpectationChain = false;
	this.__expectedCalls = [];
	this.__assert = aAssertions || new ns.Assertions();
	if (aSource) {
		aSource = aSource.wrappedJSObject || aSource;
		switch (typeof aSource)
		{
			case 'function':
				this.__name = this.__name ||
				              (String(aSource).match(/function\s*([^\(]*)\s*\(/) && RegExp.$1) ||
				              this.__defaultName;
				this.__inherit(aSource.prototype);
				break;
			case 'object':
				this.__name = this.__name ||
				              (String(aSource.constructor).match(/function\s*([^\(]*)\s*\(/) && RegExp.$1) ||
				              this.__defaultName;
				this.__inherit(aSource);
				break;
			default:
				this.__name = this.__name || this.__defaultName;
				break;
		}
	}
	else {
		this.__name = this.__name || this.__defaultName;
	}
}
Mock.prototype = {
	ANY         : '0f18acc8-9b1f-4261-a220-32e1dfed83d2',
	ANY_ONETIME : '1843351e-0446-40ce-9bbd-cfd01d3c87a4',
	ALWAYS      : '11941072-0dc4-406b-a392-f57d36bb0b27',
	ONETIME     : '079e5fb7-0b5e-4139-b365-48455901f17b',
	NEVER       : '5b9a1df9-2c17-4fb4-9b3d-cdb860bf39a6',
	__defaultName : bundle.getString('mock_default_name'),
	__inherit : function(aSource)
	{
		for (let i in aSource)
		{
			if (i in this)
				continue;

			let getter = aSource.__lookupGetter__(i);
			if (getter) this._addGetter(i);
			let setter = aSource.__lookupSetter__(i);
			if (setter) this._addSetter(i);
			if (!getter && !setter) {
				if (typeof aSource[i] == 'function') {
					this._addMethod(i);
				}
				else {
					this._addGetter(i);
					this._addSetter(i);
				}
			}
		}
	},
	_addMethod : function(aName, aAssertions)
	{
		var method = this[aName];
		if (!method || !('expect' in method)) {
			method = new FunctionMock(aName, null, aAssertions || this.__assert);
			this.__methods[aName] = method;
			this[aName] = method;
		}
		return method;
	},
	_addGetter : function(aName, aAssertions)
	{
		var getter = this.__getters[aName];
		if (!getter || !('expect' in getter)) {
			getter = new GetterMock(aName, null, aAssertions || this.__assert);
			this.__getters[aName] = getter;
			this.__defineGetter__(aName, getter);
		}
		return getter;
	},
	_addSetter : function(aName, aAssertions)
	{
		var setter = this.__setters[aName];
		if (!setter || !('expect' in setter)) {
			setter = new SetterMock(aName, null, aAssertions || this.__assert);
			this.__setters[aName] = setter;
			this.__defineSetter__(aName, setter);
		}
		return setter;
	},

	__noSuchMethod__ : function(aName, aArguments)
	{
		throw new Error(bundle.getFormattedString(
					'mock_unexpected_call',
					[this.__name, aName, utils.inspect(aArguments)]
				));
	},

	__handleCall : function(aCall)
	{
		this.__assert.equals(this.__expectedCalls[0], aCall);
		this.__expectedCalls.shift();
	},

	expect : function(aName)
	{
		if (!arguments.length && !this.__inExpectationChain)
			return this._createExpectationChain();

		var expectArgs = Array.slice(arguments, 1);
		if (!expectArgs.length) expectArgs.push([]);
		var method = this._addMethod(aName);
		var call = method.expect.apply(null, expectArgs);
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return method;
	},
	_expect : function() { return this.expect.apply(this, arguments); },
	expects : function() { return this.expect.apply(this, arguments); },
	_expects : function() { return this.expect.apply(this, arguments); },
	expectThrows : function(aName)
	{
		var method = this._addMethod(aName);
		var call = method.expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return method;
	},
	_expectThrows : function() {return  this.expectThrows.apply(this, arguments); },
	expectThrow : function() { return this.expectThrows.apply(this, arguments); },
	_expectThrow : function() { return this.expectThrows.apply(this, arguments); },
	expectRaises : function() { return this.expectThrows.apply(this, arguments); },
	_expectRaises : function() { return this.expectThrows.apply(this, arguments); },
	expectRaise : function() { return this.expectThrows.apply(this, arguments); },
	_expectRaise : function() { return this.expectThrows.apply(this, arguments); },

	expectGet : function(aName)
	{
		var expectArgs = Array.slice(arguments, 1);
		if (!expectArgs.length) expectArgs.push(void(0));
		var getter = this._addGetter(aName);
		var call = getter.expect.apply(null, expectArgs);
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return getter;
	},
	_expectGet : function() { return this.expectGet.apply(this, arguments); },
	expectGetThrows : function(aName)
	{
		var getter = this._addGetter(aName);
		var call = getter.expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return getter;
	},
	_expectGetThrows : function() { return this.expectGetThrows.apply(this, arguments); },
	expectGetThrow : function() { return this.expectGetThrows.apply(this, arguments); },
	_expectGetThrow : function() { return this.expectGetThrows.apply(this, arguments); },
	expectGetRaises : function() { return this.expectGetThrows.apply(this, arguments); },
	_expectGetRaises : function() { return this.expectGetThrows.apply(this, arguments); },
	expectGetRaise : function() { return this.expectGetThrows.apply(this, arguments); },
	_expectGetRaise : function() { return this.expectGetThrows.apply(this, arguments); },

	expectSet : function(aName)
	{
		var expectArgs = Array.slice(arguments, 1);
		if (!expectArgs.length) expectArgs.push(void(0));
		var setter = this._addSetter(aName);
		var call = setter.expect.apply(null, expectArgs);
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return setter;
	},
	_expectSet : function() { return this.expectSet.apply(this, arguments); },
	expectSetThrows : function(aName)
	{
		var setter = this._addSetter(aName);
		var call = setter.expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return setter;
	},
	_expectSetThrows : function() { return this.expectSetThrows.apply(this, arguments); },
	expectSetThrow : function() { return this.expectSetThrows.apply(this, arguments); },
	_expectSetThrow : function() { return this.expectSetThrows.apply(this, arguments); },
	expectSetRaises : function() { return this.expectSetThrows.apply(this, arguments); },
	_expectSetRaises : function() { return this.expectSetThrows.apply(this, arguments); },
	expectSetRaise : function() { return this.expectSetThrows.apply(this, arguments); },
	_expectSetRaise : function() { return this.expectSetThrows.apply(this, arguments); },

	// JSMock API
	addMockMethod : function(aName)
	{
		this._addMethod(aName);
	},

	// JSMock, JsMockito
	_createExpectationChain : function()
	{
		var self = this;
		this.__inExpectationChain = true;
		return {
			__noSuchMethod__ : function(aName, aArguments) {
				var method = self._addMethod(aName);
				var call = method.expect(aArguments);
				if (call) {
					self.__expectedCalls.push(call);
					call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
				}
				self.__inExpectationChain = false;
				return method;
			}
		};
	},

	assert : function()
	{
		for (let i in this.__getters)
		{
			this.__getters[i].assert();
		}
		for (let i in this.__setters)
		{
			this.__setters[i].assert();
		}
		for (let i in this.__methods)
		{
			this.__methods[i].assert();
		}
	},
	_assert  : function() { this.assert(); },
	verify : function() { this.assert(); },
	_verify : function() { this.assert(); },

	_export : function(aTarget, aAssertions)
	{
		var assertions = aAssertions || new ns.Assertions();

		aTarget.ANY         = Mock.prototype.ANY;
		aTarget.ANY_ONETIME = Mock.prototype.ANY_ONETIME;
		aTarget.ALWAYS      = Mock.prototype.ALWAYS;
		aTarget.ONETIME     = Mock.prototype.ONETIME;
		aTarget.NEVER       = Mock.prototype.NEVER;

		aTarget._addMethod = function(aObject, aName) {
			return Mock.prototype._addMethod.call(aObject, aName, assertions);
		};
		aTarget._addSetter = function(aObject, aName) {
			return Mock.prototype._addSetter.call(aObject, aName, assertions);
		};
		aTarget._addGetter = function(aObject, aName) {
			return Mock.prototype._addGetter.call(aObject, aName, assertions);
		};

		aTarget.expect = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expect.apply(args[0], args.slice(1));
		};
		aTarget._expects = aTarget.expects = aTarget._expect = aTarget.expect;
		aTarget.expectThrows = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectThrows.apply(args[0], args.slice(1));
		};
		aTarget._expectThrow = aTarget.expectThrow = aTarget._expectThrows = aTarget.expectThrows;
		aTarget._expectRaise = aTarget.expectRaise = aTarget._expectRaises = aTarget.expectRaises = aTarget.expectThrows;

		aTarget.expectGet = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectGet.apply(args[0], args.slice(1));
		};
		aTarget._expectGet = Mock.expectGet;
		aTarget.expectGetThrows = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectGetThrows.apply(args[0], args.slice(1));
		};
		aTarget._expectGetThrow = aTarget.expectGetThrow = aTarget._expectGetThrows = aTarget.expectGetThrows;
		aTarget._expectGetRaise = aTarget.expectGetRaise = aTarget._expectGetRaises = aTarget.expectGetRaises = aTarget.expectGetThrows;

		aTarget.expectSet = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectSet.apply(args[0], args.slice(1));
		};
		aTarget._expectSet = aTarget.expectSet;
		aTarget.expectSetThrows = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectSetThrows.apply(args[0], args.slice(1));
		};
		aTarget._expectSetThrow = aTarget.expectSetThrow = aTarget._expectSetThrows = aTarget.expectSetThrows;
		aTarget._expectSetRaise = aTarget.expectSetRaise = aTarget._expectSetRaises = aTarget.expectSetRaises = aTarget.expectSetThrows;

		aTarget.export = function(aObject) {
			Mock.prototype._export(aObject);
		};
	}
};
Mock.prototype._export(Mock);


function ExpectedCall(aOptions)
{
	this._arguments       = [];
	this.handlers         = [];
	this.arguments        = aOptions.arguments;
	if ('returnValue' in aOptions) this.returnValue = aOptions.returnValue;
	if ('exceptionClass' in aOptions) this.exceptionClass = aOptions.exceptionClass;
	if ('exceptionMessage' in aOptions) this.exceptionMessage = aOptions.exceptionMessage;
}
ExpectedCall.prototype = {
	addHandler : function(aHandler)
	{
		this.handlers.push(aHandler);
	},
	onCall : function(aMock, aArguments)
	{
		this.handlers.forEach(function(aHandler) {
			if (aHandler && typeof aHandler == 'function')
				aHandler.apply(aMock, aArguments);
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
			this._arguments = aValue;
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

		this.inExpectationChain = false;
		this.expectedCalls = [];
		this.anyCall = null;
		this._assert = aAssertions || new ns.Assertions();
		this.errorsCount = 0;
		this.totalCount = 0;
	},
	createFunction : function()
	{
		var self = this;
		var func = function() { return self.onCall(this, Array.slice(arguments)); };
		func._mock = this;
		this.export(func);

		return func;
	},
	get calledCount()
	{
		return this.totalCount - this.expectedCalls.length;
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
			this.errorsCount++;
			throw new Error(aMessage);
		}
		return this.anyCall || this.firstExpectedCall;
	},
	addExpectedCall : function(aOptions)
	{
		var call = new ExpectedCall(aOptions);
		if (call.isAnyCall()) {
			this.anyCall = call;
			return null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
			this.totalCount++;
			return call;
		}
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
	createExpectationChain : function()
	{
		this.inExpectationChain = true;
		var self = this;
		return function() {
			self.expect(Array.slice(arguments));
			if (this != self)
				self.lastExpectedCall.context = this;
			self.inExpectationChain = false;
			return self;
		};
	},
	expect : function(aArguments, aReturnValue)
	{
		if (!arguments.length && !this.inExpectationChain)
			return this.createExpectationChain();

		return aArguments == Mock.prototype.NEVER ?
			null :
			this.addExpectedCall({
				arguments   : aArguments,
				returnValue : aReturnValue
			});
	},
	expects : function() { return this.expect.apply(this, arguments); },
	expectThrows : function(aArguments, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getFormattedString('mock_error_no_exception', [this.name]));
		return this.addExpectedCall({
				arguments        : aArguments,
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			});
	},
	expectThrow : function() { return this.expectThrows.apply(this, arguments); },
	expectRaises : function() { return this.expectThrows.apply(this, arguments); },
	expectRaise : function() { return this.expectThrows.apply(this, arguments); },

	// JSMock API
	andReturn : function(aValue)
	{
		var call = this.lastExpectedCall;
		call.returnValue = aValue;
		return this;
	},
	andReturns : function() { return this.andReturn.apply(this, arguments); }, // extended from JSMock
	andThrow : function(aExceptionClass, aExceptionMessage)
	{
		var call = this.lastExpectedCall;
		call.exceptionClass = aExceptionClass;
		call.exceptionMessage = aExceptionMessage;
		return this;
	},
	andThrows : function() { return this.andReturn.apply(this, arguments); }, // extended from JSMock
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
	thenReturn : function() { return this.andReturn.apply(this, arguments); },
	thenReturns : function() { return this.andReturn.apply(this, arguments); }, // extended from JsMockito
	thenThrow : function() { return this.andThrow.apply(this, arguments); },
	thenThrows : function() { return this.andThrow.apply(this, arguments); }, // extended from JsMockito
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
		var call = this.getCurrentCall(bundle.getFormattedString(
						'function_mock_unexpected_call',
						[this.name, utils.inspect(aArguments)]
					));

		if (!call.isAnyCall() && !call.isOneTimeAnyCall())
			this._assert.equals(
				this.formatArgumentsArray(call.arguments, aArguments),
				aArguments,
				bundle.getFormattedString('function_mock_wrong_arguments', [this.name])
			);

		if ('context' in call)
			this._assert.equals(
				call.context,
				aContext,
				bundle.getFormattedString('function_mock_wrong_context', [this.name, utils.inspect(aArguments)])
			);

		call.onCall(this, aArguments);

		if (!this.anyCall)
			this.expectedCalls.shift();

		return call.finish(aArguments);
	},
	formatArgumentsArray : function(aExpectedArray, aActualArray)
	{
		return aExpectedArray.map(function(aExpected, aIndex) {
			if (aExpected instanceof TypeOf) {
				let actual = aActualArray[aIndex];
				this._assert.isDefined(actual);
				this._assert.isInstanceOf(aExpected.expectedConstructor, actual)
				return actual;
			}
			else {
				return aExpected;
			}
		}, this);
	},
	assert : function()
	{
		if (this.errorsCount)
			throw new Error(bundle.getFormattedString(
						'function_mock_assert_error',
						[this.name, this.errorsCount]
					));
		this._assert.equals(
			this.totalCount,
			this.calledCount,
			bundle.getFormattedString('function_mock_assert_fail', [this.name])
		);
	},
	verify : function() { this.assert(); },
	export : function(aTarget)
	{
		var self = this;
		['assert', 'verify',
		 'expect', 'expects',
		 'expectThrows', 'expectThrow',
		 'andReturn', 'andReturns',
		 'andThrow', 'andThrows',
		 'andStub',
		 'thenReturn', 'thenReturns',
		 'thenThrow', 'thenThrows',
		 'then'].forEach(function(aMethod) {
			aTarget[aMethod] = function() { return self[aMethod].apply(self, arguments); }
			aTarget['_'+aMethod] = function() { return self[aMethod].apply(self, arguments); }
		}, this);
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
GetterMock.prototype = {
	__proto__ : FunctionMock.prototype,
	defaultName : bundle.getString('getter_mock_default_name'),
	expect : function(aReturnValue)
	{
		var args = [];
		if (this.isSpecialSpec(aReturnValue))
			[args, aReturnValue] = Array.slice(arguments);

		return args == Mock.prototype.NEVER ?
			null :
			this.addExpectedCall({
				arguments   : args,
				returnValue : aReturnValue
			});
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
		return this.addExpectedCall({
				arguments        : args,
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			});
	},
	onCall : function(aContext)
	{
		var call = this.getCurrentCall(bundle.getFormattedString('getter_mock_unexpected_call', [this.name]));

		if ('context' in call)
			this._assert.equals(
				call.context,
				aContext,
				bundle.getFormattedString('getter_mock_wrong_context', [this.name])
			);

		call.onCall(this, []);

		if (!this.anyCall)
			this.expectedCalls.shift();

		return call.finish([]);
	},
	assert : function()
	{
		if (this.errorsCount)
			throw new Error(bundle.getFormattedString(
						'getter_mock_assert_error',
						[this.name, this.errorsCount]
					));
		this._assert.equals(
			this.totalCount,
			this.calledCount,
			bundle.getFormattedString('getter_mock_assert_fail', [this.name])
		);
	}
};

function SetterMock(aName, aSource, aAssertions)
{
	if (aName && typeof aName != 'string')
		[aSource, aAssertions, aName] = [aName, aSource, null];
	this.init(aName, aSource, aAssertions);
	return this.createFunction();
}
SetterMock.prototype = {
	__proto__ : FunctionMock.prototype,
	defaultName : bundle.getString('setter_mock_default_name'),
	expect : function(aArgument, aReturnValue)
	{
		if (aArgument == Mock.prototype.NEVER)
			return;

		var call = this.addExpectedCall({
				arguments   : [aArgument],
				returnValue : aReturnValue
			});
		if (call && arguments.length < 2)
			call.returnValue = aArgument;
		return call;
	},
	expectThrows : function(aArgument, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getFormattedString('mock_error_no_exception', [this.name]));
		return this.addExpectedCall({
				arguments        : [aArgument],
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			});
	},
	onCall : function(aContext, aArguments)
	{
		if (!aArguments.length) aArguments = [void(0)];

		var call = this.getCurrentCall(bundle.getFormattedString(
				'setter_mock_unexpected_call',
				[this.name, utils.inspect(aArguments[0])]
			));

		if (!call.isAnyCall() && !call.isOneTimeAnyCall())
			this._assert.equals(
				this.formatArgumentsArray(call.arguments, aArguments),
				aArguments,
				bundle.getFormattedString('setter_mock_wrong_value', [this.name])
			);

		if ('context' in call)
			this._assert.equals(
				call.context,
				aContext,
				bundle.getFormattedString('setter_mock_wrong_context', [this.name, utils.inspect(aArguments[0])])
			);

		call.onCall(this, aArguments);

		if (!this.anyCall)
			this.expectedCalls.shift();

		return call.finish([]);
	},
	assert : function()
	{
		if (this.errorsCount)
			throw new Error(bundle.getFormattedString(
						'setter_mock_assert_error',
						[this.name, this.errorsCount]
					));
		this._assert.equals(
			this.totalCount,
			this.calledCount,
			bundle.getFormattedString('setter_mock_assert_fail', [this.name])
		);
	}
};

// JSMock API
function TypeOf(aConstructor) {
	if (this instanceof TypeOf) {
		this.expectedConstructor = aConstructor;
	}
	else {
		return new TypeOf(aConstructor);
	}
}
TypeOf.isA = function(aConstructor) {
	return TypeOf(aConstructor);
};
