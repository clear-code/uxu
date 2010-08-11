// API compatible to http://micampe.it/projects/jsmock

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['MockManager', 'Mock', 'FunctionMock', 'GetterMock', 'SetterMock'];

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
		var mock = Mock(aSource, this._assert);
		this._mocks.push(mock);
		return mock;
	},
	FunctionMock : function()
	{
		var mock = FunctionMock(this._assert);
		this._mocks.mocks.push(mock);
		return mock;
	},
	GetterMock : function()
	{
		var mock = GetterMock(this._assert);
		this._mocks.mocks.push(mock);
		return mock;
	},
	SetterMock : function()
	{
		var mock = SetterMock(this._assert);
		this._mocks.mocks.push(mock);
		return mock;
	},
	export : function(aTarget)
	{
		var self = this;
		aTarget.Mock = function() { return self.Mock.apply(self, arguments); };
		aTarget.FunctionMock = function() { return self.FunctionMock.apply(self, arguments); };
		aTarget.GetterMock = function() { return self.GetterMock.apply(self, arguments); };
		aTarget.SetterMock = function() { return self.SetterMock.apply(self, arguments); };

		// compatibility for http://micampe.it/projects/jsmock
		aTarget.MockObject = aTarget.MockCreate = aTarget.Mock;
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

	expect : function(aName, aArguments, aReturnValue)
	{
		var self = this;
		var call = this._addMethod(aName).expect(
						aArguments,
						aReturnValue,
						function(aCall) {
							if (!call) return;
							self.__assert.equals(self.__expectedCalls[0], aCall);
							self.__expectedCalls.splice(0, 1);
						}
					);
		if (call) this.__expectedCalls.push(call);
		return call;
	},
	_expect : function() { this.expect.apply(this, arguments) },
	expects : function() { this.expect.apply(this, arguments) },
	_expects : function() { this.expect.apply(this, arguments) },
	expectThrows : function(aName, aArguments, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var self = this;
		var call = this._addMethod(aName).expectThrows(
						aArguments,
						aExceptionClass,
						aExceptionMessage,
						function(aCall) {
							if (!call) return;
							self.__assert.equals(self.__expectedCalls[0], aCall);
							self.__expectedCalls.splice(0, 1);
						}
					);
		if (call) this.__expectedCalls.push(call);
		return call;
	},
	_expectThrows : function() { this.expectThrows.apply(this, arguments) },
	expectThrow : function() { this.expectThrows.apply(this, arguments) },
	_expectThrow : function() { this.expectThrows.apply(this, arguments) },
	expectRaises : function() { this.expectThrows.apply(this, arguments) },
	_expectRaises : function() { this.expectThrows.apply(this, arguments) },
	expectRaise : function() { this.expectThrows.apply(this, arguments) },
	_expectRaise : function() { this.expectThrows.apply(this, arguments) },

	expectGet : function(aName, aValue)
	{
		var self = this;
		var call = this._addGetter(aName).expect(
						aValue,
						function(aCall) {
							if (!call) return;
							self.__assert.equals(self.__expectedCalls[0], aCall);
							self.__expectedCalls.splice(0, 1);
						}
					);
		if (call) this.__expectedCalls.push(call);
		return call;
	},
	_expectGet : function() { this.expectGet.apply(this, arguments) },
	expectGetThrows : function(aName, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var self = this;
		var call = this._addGetter(aName).expectThrows(
						aExceptionClass,
						aExceptionMessage,
						function(aCall) {
							if (!call) return;
							self.__assert.equals(self.__expectedCalls[0], aCall);
							self.__expectedCalls.splice(0, 1);
						}
					);
		if (call) this.__expectedCalls.push(call);
		return call;
	},
	_expectGetThrows : function() { this.expectGetThrows.apply(this, arguments) },
	expectGetThrow : function() { this.expectGetThrows.apply(this, arguments) },
	_expectGetThrow : function() { this.expectGetThrows.apply(this, arguments) },
	expectGetRaises : function() { this.expectGetThrows.apply(this, arguments) },
	_expectGetRaises : function() { this.expectGetThrows.apply(this, arguments) },
	expectGetRaise : function() { this.expectGetThrows.apply(this, arguments) },
	_expectGetRaise : function() { this.expectGetThrows.apply(this, arguments) },

	expectSet : function(aName, aValue, aReturnValue)
	{
		var self = this;
		var handler = function(aCall) {
				if (!call) return;
				self.__assert.equals(self.__expectedCalls[0], aCall);
				self.__expectedCalls.splice(0, 1);
			};
		var call = (arguments.length > 2) ?
					this._addSetter(aName).expect(aValue, aReturnValue, handler) :
					this._addSetter(aName).expect(aValue, aValue, handler) ;
		if (call) this.__expectedCalls.push(call);
		return call;
	},
	_expectSet : function() { this.expectSet.apply(this, arguments) },
	expectSetThrows : function(aName, aValue, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var self = this;
		var call = this._addSetter(aName).expectThrows(
						aValue,
						aExceptionClass,
						aExceptionMessage,
						function(aCall) {
							if (!call) return;
							self.__assert.equals(self.__expectedCalls[0], aCall);
							self.__expectedCalls.splice(0, 1);
						}
					);
		if (call) this.__expectedCalls.push(call);
		return call;
	},
	_expectSetThrows : function() { this.expectSetThrows.apply(this, arguments) },
	expectSetThrow : function() { this.expectSetThrows.apply(this, arguments) },
	_expectSetThrow : function() { this.expectSetThrows.apply(this, arguments) },
	expectSetRaises : function() { this.expectSetThrows.apply(this, arguments) },
	_expectSetRaises : function() { this.expectSetThrows.apply(this, arguments) },
	expectSetRaise : function() { this.expectSetThrows.apply(this, arguments) },
	_expectSetRaise : function() { this.expectSetThrows.apply(this, arguments) },

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
	asserts : function() { this.assert(); },
	_asserts : function() { this.assert(); },

	_export : function(aObject, aAssertions)
	{
		var assertions = aAssertions || new ns.Assertions();

		aObject.ANY         = Mock.prototype.ANY;
		aObject.ANY_ONETIME = Mock.prototype.ANY_ONETIME;
		aObject.ALWAYS      = Mock.prototype.ALWAYS;

		aObject._addMethod = function(aObject, aName) {
			return Mock.prototype._addMethod.call(aObject, aName, assertions);
		};
		aObject._addSetter = function(aObject, aName) {
			return Mock.prototype._addSetter.call(aObject, aName, assertions);
		};
		aObject._addGetter = function(aObject, aName) {
			return Mock.prototype._addGetter.call(aObject, aName, assertions);
		};

		aObject.expect = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expect.apply(args[0], args.slice(1));
		};
		aObject._expects = aObject.expects = aObject._expect = aObject.expect;
		aObject.expectThrows = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectThrows.apply(args[0], args.slice(1));
		};
		aObject._expectThrow = aObject.expectThrow = aObject._expectThrows = aObject.expectThrows;
		aObject._expectRaise = aObject.expectRaise = aObject._expectRaises = aObject.expectRaises = aObject.expectThrows;

		aObject.expectGet = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectGet.apply(args[0], args.slice(1));
		};
		aObject._expectGet = Mock.expectGet;
		aObject.expectGetThrows = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectGetThrows.apply(args[0], args.slice(1));
		};
		aObject._expectGetThrow = aObject.expectGetThrow = aObject._expectGetThrows = aObject.expectGetThrows;
		aObject._expectGetRaise = aObject.expectGetRaise = aObject._expectGetRaises = aObject.expectGetRaises = aObject.expectGetThrows;

		aObject.expectSet = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectSet.apply(args[0], args.slice(1));
		};
		aObject._expectSet = aObject.expectSet;
		aObject.expectSetThrows = function() {
			var args = Array.slice(arguments);
			return Mock.prototype.expectSetThrows.apply(args[0], args.slice(1));
		};
		aObject._expectSetThrow = aObject.expectSetThrow = aObject._expectSetThrows = aObject.expectSetThrows;
		aObject._expectSetRaise = aObject.expectSetRaise = aObject._expectSetRaises = aObject.expectSetRaises = aObject.expectSetThrows;

		aObject.export = function(aObject) {
			Mock.prototype._export(aObject);
		};
	}
};
Mock.prototype._export(Mock);


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
	},
	createFunction : function()
	{
		var self = this;
		var func = function() { return self.onCall(arguments); };
		func._mock = this;
		this.export(func);

		return func;
	},
	get count()
	{
		return this.expectedCalls.length - this.errorsCount;
	},
	expect : function(aArguments, aReturnValue, aHandler)
	{
		var call = {
				arguments   : aArguments || [],
				returnValue : aReturnValue,
				handler     : aHandler
			};
		if (aArguments == Mock.prototype.ANY || aArguments == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
		}
		return call;
	},
	expects : function() { return this.expect.apply(this, arguments); },
	expectThrows : function(aArguments, aExceptionClass, aExceptionMessage, aHandler)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var call = {
				arguments        : aArguments || [],
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage,
				handler          : aHandler
			};
		if (aArguments == Mock.prototype.ANY || aArguments == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
		}
		return call;
	},
	expectThrow : function() { return this.expectThrows.apply(this, arguments); },
	expectRaises : function() { return this.expectThrows.apply(this, arguments); },
	expectRaise : function() { return this.expectThrows.apply(this, arguments); },
	onCall : function(aArguments)
	{
		if (!this.anyCall && !this.expectedCalls.length) {
			this.errorsCount++;
			throw new Error(bundle.getFormattedString(
						'function_mock_unexpected_call',
						[ns.utils.inspect(aArguments)]
					));
		}

		var call = this.anyCall || this.expectedCalls[0];
		if (call.arguments != Mock.prototype.ANY &&
			call.arguments != Mock.prototype.ANY_ONETIME &&
			call.arguments != Mock.prototype.ALWAYS)
			this._assert.equals(
				call.arguments,
				Array.slice(aArguments),
				bundle.getString('function_mock_wrong_arguments')
			);

		if (call.handler && typeof call.handler == 'function')
			call.handler(call);

		if (!this.anyCall)
			this.expectedCalls.splice(0, 1);

		var exception = call.exceptionClass;
		if (exception) {
			if (typeof exception == 'function')
				exception = new call.exceptionClass(call.exceptionMessage);
			throw exception;
		}

		return typeof call.returnValue == 'function' ?
				call.returnValue.apply(null, aArguments) :
				call.returnValue ;
	},
	assert : function()
	{
		this._assert.equals(
			0,
			this.count,
			bundle.getString('function_mock_assert_fail')
		);
	},
	verify : function() { this.assert(); },
	asserts : function() { this.assert(); },
	export : function(aTarget)
	{
		var self = this;
		['assert', 'asserts', 'verify',
		 'expect', 'expects',
		 'expectThrows', 'expectThrow',
		 'expectRaises', 'expectRaise'].forEach(function(aMethod) {
			aTarget[aMethod] = function() { return self[aMethod].apply(self, arguments); }
			aTarget['_'+aMethod] = function() { return self[aMethod].apply(self, arguments); }
		}, this);
	}
};

function GetterMock(aAssertions)
{
	this.init(aAssertions);
	return this.createFunction();
}
GetterMock.prototype = {
	__proto__ : FunctionMock.prototype,
	expect : function(aReturnValue, aHandler)
	{
		var call = {
				returnValue : aReturnValue,
				handler     : aHandler
			};
		this.alwaysCall = null;
		this.expectedCalls.push(call);
		return call;
	},
	expectThrows : function(aExceptionClass, aExceptionMessage, aHandler)
	{
		var args = [];
		if (
			aExceptionMessage &&
			(aExceptionClass == Mock.prototype.ALWAYS ||
			 aExceptionClass == Mock.prototype.ANY ||
			 aExceptionClass == Mock.prototype.ANY_ONETIME)
			) {
			[args, aExceptionClass, aExceptionMessage, aHandler] = Array.slice(arguments);
		}
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var call = {
				arguments        : args,
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage,
				handler          : aHandler
			};
		if (args == Mock.prototype.ALWAYS || args == Mock.prototype.ANY) {
			this.alwaysCall = call;
			call = null;
		}
		else {
			this.alwaysCall = null;
			this.expectedCalls.push(call);
		}
		return call;
	},
	onCall : function()
	{
		if (!this.alwaysCall && !this.expectedCalls.length) {
			this.errorsCount++;
			throw new Error(bundle.getString('getter_mock_unexpected_call'));
		}

		var call = this.alwaysCall || this.expectedCalls[0];

		if (call.handler && typeof call.handler == 'function')
			call.handler(call);

		if (!this.alwaysCall)
			this.expectedCalls.splice(0, 1);

		var exception = call.exceptionClass;
		if (exception) {
			if (typeof exception == 'function')
				exception = new call.exceptionClass(call.exceptionMessage);
			throw exception;
		}

		return typeof call.returnValue == 'function' ?
				call.returnValue.call(null) :
				call.returnValue ;
	},
	assert : function()
	{
		this._assert.equals(
			0,
			this.count,
			bundle.getString('getter_mock_assert_fail')
		);
	}
};

function SetterMock(aAssertions)
{
	this.init(aAssertions);
	return this.createFunction();
}
SetterMock.prototype = {
	__proto__ : FunctionMock.prototype,
	expect : function(aSetValue, aReturnValue, aHandler)
	{
		var call = {
				setValue    : aSetValue,
				returnValue : aReturnValue,
				handler     : aHandler
			};
		if (aSetValue == Mock.prototype.ANY || aSetValue == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
			if (arguments.length < 2)
				call.returnValue = aSetValue;
		}
		return call;
	},
	expectThrows : function(aSetValue, aExceptionClass, aExceptionMessage, aHandler)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var call = {
				setValue         : aSetValue,
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage,
				handler          : aHandler
			};
		if (aSetValue == Mock.prototype.ANY || aSetValue == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
		}
		return call;
	},
	onCall : function(aArguments)
	{
		if (!this.anyCall && !this.expectedCalls.length) {
			this.errorsCount++;
			throw new Error(bundle.getFormattedString(
						'setter_mock_unexpected_call',
						[ns.utils.inspect(aArguments[0])]
					));
		}

		var call = this.anyCall || this.expectedCalls[0];
		if (call.setValue != Mock.prototype.ANY &&
			call.setValue != Mock.prototype.ANY_ONETIME &&
			call.setValue != Mock.prototype.ALWAYS)
			this._assert.equals(
				call.setValue,
				aArguments[0],
				bundle.getString('setter_mock_wrong_value')
			);

		if (call.handler && typeof call.handler == 'function')
			call.handler(call);

		if (!this.anyCall)
			this.expectedCalls.splice(0, 1);

		var exception = call.exceptionClass;
		if (exception) {
			if (typeof exception == 'function')
				exception = new call.exceptionClass(call.exceptionMessage);
			throw exception;
		}

		return typeof call.returnValue == 'function' ?
				call.returnValue.call(null, aArguments[0]) :
				call.returnValue ;
	},
	assert : function()
	{
		this._assert.equals(
			0,
			this.count,
			bundle.getString('setter_mock_assert_fail')
		);
	}
};
