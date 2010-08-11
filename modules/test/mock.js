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
	Mock : function(aSource)
	{
		var mock = new Mock(aSource, this._assert);
		this._mocks.push(mock);
		return mock;
	},
	FunctionMock : function()
	{
		var mock = new FunctionMock(this._assert);
		this._mocks.push(mock);
		return mock;
	},
	MockFunction : function() { return this.FunctionMock.apply(this, arguments); },
	GetterMock : function()
	{
		var mock = new GetterMock(this._assert);
		this._mocks.push(mock);
		return mock;
	},
	SetterMock : function()
	{
		var mock = new SetterMock(this._assert);
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
	export : function(aTarget)
	{
		var self = this;
		aTarget.Mock = function() { return self.Mock.apply(self, arguments); };
		aTarget.FunctionMock = function() { return self.FunctionMock.apply(self, arguments); };
		aTarget.MockFunction = aTarget.FunctionMock;
		aTarget.GetterMock = function() { return self.GetterMock.apply(self, arguments); };
		aTarget.SetterMock = function() { return self.SetterMock.apply(self, arguments); };

		// MockObject,js
		aTarget.MockObject = aTarget.MockCreate = aTarget.Mock;

		// JSMock
		aTarget.TypeOf = TypeOf;
		aTarget.MockControl = function() { return self; };
	}
};

function Mock(aSource, aAssertions)
{
	this.__methods = {};
	this.__getters = {};
	this.__setters = {};
	this.__expectedCalls = [];
	this.__assert = aAssertions || new ns.Assertions();
	if (aSource) {
		aSource = aSource.wrappedJSObject || aSource;
		switch (typeof aSource)
		{
			case 'function':
				this.__inherit(aSource.prototype);
				break;
			case 'object':
				this.__inherit(aSource);
				break;
		}
	}
}
Mock.prototype = {
	ANY         : '0f18acc8-9b1f-4261-a220-32e1dfed83d2',
	ANY_ONETIME : '1843351e-0446-40ce-9bbd-cfd01d3c87a4',
	ALWAYS      : '11941072-0dc4-406b-a392-f57d36bb0b27',
	ONETIME     : '079e5fb7-0b5e-4139-b365-48455901f17b',
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
			method = new FunctionMock(aAssertions || this.__assert);
			this.__methods[aName] = method;
			this[aName] = method;
		}
		return method;
	},
	_addGetter : function(aName, aAssertions)
	{
		var getter = this.__getters[aName];
		if (!getter || !('expect' in getter)) {
			getter = new GetterMock(aAssertions || this.__assert);
			this.__getters[aName] = getter;
			this.__defineGetter__(aName, getter);
		}
		return getter;
	},
	_addSetter : function(aName, aAssertions)
	{
		var setter = this.__setters[aName];
		if (!setter || !('expect' in setter)) {
			setter = new SetterMock(aAssertions || this.__assert);
			this.__setters[aName] = setter;
			this.__defineSetter__(aName, setter);
		}
		return setter;
	},

	__noSuchMethod__ : function(aName, aArguments)
	{
		throw new Error(bundle.getFormattedString(
					'mock_unexpected_call',
					[aName, ns.utils.inspect(aArguments)]
				));
	},

	__handleCall : function(aCall)
	{
		this.__assert.equals(this.__expectedCalls[0], aCall);
		this.__expectedCalls.shift();
	},

	expect : function(aName)
	{
		if (!arguments.length)
			return this._JSMockExpects();

		var call = this._addMethod(aName).expect.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return call;
	},
	_expect : function() { return this.expect.apply(this, arguments); },
	expects : function() { return this.expect.apply(this, arguments); },
	_expects : function() { return this.expect.apply(this, arguments); },
	expectThrows : function(aName)
	{
		var call = this._addMethod(aName).expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return call;
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
		var call = this._addGetter(aName).expect.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return call;
	},
	_expectGet : function() { return this.expectGet.apply(this, arguments); },
	expectGetThrows : function(aName)
	{
		var call = this._addGetter(aName).expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return call;
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
		var call = this._addSetter(aName).expect.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return call;
	},
	_expectSet : function() { return this.expectSet.apply(this, arguments); },
	expectSetThrows : function(aName)
	{
		var call = this._addSetter(aName).expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			let self = this;
			call.addHandler(function() { self.__handleCall.call(self, this.firstExpectedCall); });
		}
		return call;
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
	_JSMockExpects : function()
	{
		return {
			_mock : this,
			__noSuchMethod__ : function(aName, aArguments) {
				var method = this._mock._addMethod(aName);
				method.expects(aArguments);
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
	this.returnValue      = aOptions.returnValue || void(0);
	this.exceptionClass   = aOptions.exceptionClass || void(0);
	this.exceptionMessage = aOptions.exceptionMessage || void(0);
}
ExpectedCall.prototype = {
	addHandler : function(aHandler)
	{
		this.handlers.push(aHandler);
	},
	onCall : function(aMock, aArguments)
	{
		this.handlers.forEach(function(aHandler) {
			aHandler.apply(aMock, aArguments);
		}, aMock);
	},
	finish : function(aArguments)
	{
		var exception = this.exceptionClass;
		if (exception) {
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
		if (ns.utils.isArray(aValue)) {
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

function FunctionMock(aAssertions)
{
	this.init(aAssertions);
	return this.createFunction();
}
FunctionMock.prototype = {
	init : function(aAssertions)
	{
		this.expectedCalls = [];
		this.anyCall = null;
		this._assert = aAssertions || new ns.Assertions();
		this.errorsCount = 0;
		this.totalCount = 0;
	},
	createFunction : function()
	{
		var self = this;
		var func = function() { return self.onCall(Array.slice(arguments)); };
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
	expect : function(aArguments, aReturnValue)
	{
		return this.addExpectedCall({
				arguments   : aArguments || [],
				returnValue : aReturnValue
			});
	},
	expects : function() { return this.expect.apply(this, arguments); },
	expectThrows : function(aArguments, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		return this.addExpectedCall({
				arguments        : aArguments || [],
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
	andReturns : function() { return this.andReturn.apply(this, arguments); },
	andThrow : function(aExceptionClass, aExceptionMessage)
	{
		var call = this.lastExpectedCall;
		call.exceptionClass = aExceptionClass;
		call.exceptionMessage = aExceptionMessage;
		return this;
	},
	andThrows : function() { return this.andReturn.apply(this, arguments); },
	andStub : function(aHandler)
	{
		var call = this.lastExpectedCall;
		call.addHandler(aHandler);
		return this;
	},

	onCall : function(aArguments)
	{
		var call = this.getCurrentCall(bundle.getFormattedString(
						'function_mock_unexpected_call',
						[ns.utils.inspect(aArguments)]
					));

		var call = this.anyCall || this.firstExpectedCall;
		if (!call.isAnyCall() && !call.isOneTimeAnyCall())
			this._assert.equals(
				this.formatArgumentsArray(call.arguments, aArguments),
				aArguments,
				bundle.getString('function_mock_wrong_arguments')
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
			throw new Error(bundle.getFormattedString('function_mock_assert_error', [this.errorsCount]));
		this._assert.equals(this.totalCount, this.calledCount, bundle.getString('function_mock_assert_fail'));
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
		 'andStub'].forEach(function(aMethod) {
			aTarget[aMethod] = function() { return self[aMethod].apply(self, arguments); }
			aTarget['_'+aMethod] = function() { return self[aMethod].apply(self, arguments); }
		}, this);
	}
};

var MockFunction = FunctionMock;

function GetterMock(aAssertions)
{
	this.init(aAssertions);
	return this.createFunction();
}
GetterMock.prototype = {
	__proto__ : FunctionMock.prototype,
	expect : function(aReturnValue)
	{
		var args = [];
		if (
			(aReturnValue == Mock.prototype.ALWAYS ||
			 aReturnValue == Mock.prototype.ONETIME ||
			 aReturnValue == Mock.prototype.ANY ||
			 aReturnValue == Mock.prototype.ANY_ONETIME)
			) {
			[args, aReturnValue] = Array.slice(arguments);
		}
		return this.addExpectedCall({
				arguments   : args,
				returnValue : aReturnValue
			});
	},
	expectThrows : function(aExceptionClass, aExceptionMessage)
	{
		var args = [];
		if (
			aExceptionMessage &&
			(aExceptionClass == Mock.prototype.ALWAYS ||
			 aExceptionClass == Mock.prototype.ONETIME ||
			 aExceptionClass == Mock.prototype.ANY ||
			 aExceptionClass == Mock.prototype.ANY_ONETIME)
			) {
			[args, aExceptionClass, aExceptionMessage] = Array.slice(arguments);
		}
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		return this.addExpectedCall({
				arguments        : args,
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			});
	},
	onCall : function()
	{
		var call = this.getCurrentCall(bundle.getString('getter_mock_unexpected_call'));

		call.onCall(this, []);

		if (!this.anyCall)
			this.expectedCalls.shift();

		return call.finish([]);
	},
	assert : function()
	{
		if (this.errorsCount)
			throw new Error(bundle.getFormattedString('getter_mock_assert_error', [this.errorsCount]));
		this._assert.equals(this.totalCount, this.calledCount, bundle.getString('getter_mock_assert_fail'));
	}
};

function SetterMock(aAssertions)
{
	this.init(aAssertions);
	return this.createFunction();
}
SetterMock.prototype = {
	__proto__ : FunctionMock.prototype,
	expect : function(aArgument, aReturnValue)
	{
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
			throw new Error(bundle.getString('mock_error_no_exception'));
		var call = this.addExpectedCall({
				arguments        : [aArgument],
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			});
	},
	onCall : function(aArguments)
	{
		if (!aArguments.length) aArguments = [void(0)];

		var call = this.getCurrentCall(bundle.getFormattedString(
				'setter_mock_unexpected_call',
				[ns.utils.inspect(aArguments[0])]
			));

		if (!call.isAnyCall() && !call.isOneTimeAnyCall())
			this._assert.equals(
				this.formatArgumentsArray(call.arguments, aArguments),
				aArguments,
				bundle.getString('setter_mock_wrong_value')
			);

		call.onCall(this, aArguments);

		if (!this.anyCall)
			this.expectedCalls.shift();

		return call.finish([]);
	},
	assert : function()
	{
		if (this.errorsCount)
			throw new Error(bundle.getFormattedString('setter_mock_assert_error', [this.errorsCount]));
		this._assert.equals(this.totalCount, this.calledCount, bundle.getString('setter_mock_assert_fail'));
	}
};

// JSMock API
function TypeOf(aConstructor) {
	this.expectedConstructor = aConstructor;
}
TypeOf.isA = function(aConstructor) {
	return new TypeOf(aConstructor);
};
