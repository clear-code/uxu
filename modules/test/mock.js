// API compatible to http://micampe.it/projects/jsmock

const EXPORTED_SYMBOLS = ['MockManager', 'Mock', 'FunctionMock', 'MockFunction', 'GetterMock', 'SetterMock'];

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
	export : function(aTarget)
	{
		var self = this;
		aTarget.Mock = function() { return self.Mock.apply(self, arguments); };
		aTarget.FunctionMock = function() { return self.FunctionMock.apply(self, arguments); };
		aTarget.MockFunction = aTarget.FunctionMock;
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
		this.__expectedCalls.splice(0, 1);
	},

	expect : function(aName)
	{
		var call = this._addMethod(aName).expect.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			call.handler = utils.bind(this.__handleCall, this);
		}
		return call;
	},
	_expect : function() { this.expect.apply(this, arguments) },
	expects : function() { this.expect.apply(this, arguments) },
	_expects : function() { this.expect.apply(this, arguments) },
	expectThrows : function(aName)
	{
		var call = this._addMethod(aName).expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			call.handler = utils.bind(this.__handleCall, this);
		}
		return call;
	},
	_expectThrows : function() { this.expectThrows.apply(this, arguments) },
	expectThrow : function() { this.expectThrows.apply(this, arguments) },
	_expectThrow : function() { this.expectThrows.apply(this, arguments) },
	expectRaises : function() { this.expectThrows.apply(this, arguments) },
	_expectRaises : function() { this.expectThrows.apply(this, arguments) },
	expectRaise : function() { this.expectThrows.apply(this, arguments) },
	_expectRaise : function() { this.expectThrows.apply(this, arguments) },

	expectGet : function(aName)
	{
		var call = this._addGetter(aName).expect.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			call.handler = utils.bind(this.__handleCall, this);
		}
		return call;
	},
	_expectGet : function() { this.expectGet.apply(this, arguments) },
	expectGetThrows : function(aName)
	{
		var call = this._addGetter(aName).expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			call.handler = utils.bind(this.__handleCall, this);
		}
		return call;
	},
	_expectGetThrows : function() { this.expectGetThrows.apply(this, arguments) },
	expectGetThrow : function() { this.expectGetThrows.apply(this, arguments) },
	_expectGetThrow : function() { this.expectGetThrows.apply(this, arguments) },
	expectGetRaises : function() { this.expectGetThrows.apply(this, arguments) },
	_expectGetRaises : function() { this.expectGetThrows.apply(this, arguments) },
	expectGetRaise : function() { this.expectGetThrows.apply(this, arguments) },
	_expectGetRaise : function() { this.expectGetThrows.apply(this, arguments) },

	expectSet : function(aName)
	{
		var call = this._addSetter(aName).expect.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			call.handler = utils.bind(this.__handleCall, this);
		}
		return call;
	},
	_expectSet : function() { this.expectSet.apply(this, arguments) },
	expectSetThrows : function(aName)
	{
		var call = this._addSetter(aName).expectThrows.apply(null, Array.slice(arguments, 1));
		if (call) {
			this.__expectedCalls.push(call);
			call.handler = utils.bind(this.__handleCall, this);
		}
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
		var func = function() { return self.onCall(arguments); };
		func._mock = this;
		this.export(func);

		return func;
	},
	get calledCount()
	{
		return this.totalCount - this.expectedCalls.length + this.errorsCount;
	},
	expect : function(aArguments, aReturnValue)
	{
		var call = {
				arguments   : aArguments || [],
				returnValue : aReturnValue
			};
		if (aArguments == Mock.prototype.ANY || aArguments == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
			this.totalCount++;
		}
		return call;
	},
	expects : function() { return this.expect.apply(this, arguments); },
	expectThrows : function(aArguments, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var call = {
				arguments        : aArguments || [],
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			};
		if (aArguments == Mock.prototype.ANY || aArguments == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
			this.totalCount++;
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
			call.arguments != Mock.prototype.ALWAYS &&
			call.arguments != Mock.prototype.ONETIME)
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
			this.totalCount,
			this.calledCount,
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
		var call = {
				arguments   : args,
				returnValue : aReturnValue
			};
		if (args == Mock.prototype.ALWAYS || args == Mock.prototype.ANY) {
			this.alwaysCall = call;
			call = null;
		}
		else {
			this.alwaysCall = null;
			this.expectedCalls.push(call);
			this.totalCount++;
		}
		return call;
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
		var call = {
				arguments        : args,
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			};
		if (args == Mock.prototype.ALWAYS || args == Mock.prototype.ANY) {
			this.alwaysCall = call;
			call = null;
		}
		else {
			this.alwaysCall = null;
			this.expectedCalls.push(call);
			this.totalCount++;
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
			this.totalCount,
			this.calledCount,
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
	expect : function(aArguments, aReturnValue)
	{
		var call = {
				arguments   : aArguments,
				returnValue : aReturnValue
			};
		if (aArguments == Mock.prototype.ANY || aArguments == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
			this.totalCount++;
			if (arguments.length < 2)
				call.returnValue = aArguments;
		}
		return call;
	},
	expectThrows : function(aArguments, aExceptionClass, aExceptionMessage)
	{
		if (!aExceptionClass)
			throw new Error(bundle.getString('mock_error_no_exception'));
		var call = {
				arguments        : aArguments,
				exceptionClass   : aExceptionClass,
				exceptionMessage : aExceptionMessage
			};
		if (aArguments == Mock.prototype.ANY || aArguments == Mock.prototype.ALWAYS) {
			this.anyCall = call;
			call = null;
		}
		else {
			this.anyCall = null;
			this.expectedCalls.push(call);
			this.totalCount++;
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
		if (call.arguments != Mock.prototype.ANY &&
			call.arguments != Mock.prototype.ANY_ONETIME &&
			call.arguments != Mock.prototype.ALWAYS &&
			call.arguments != Mock.prototype.ONETIME)
			this._assert.equals(
				call.arguments,
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
			this.totalCount,
			this.calledCount,
			bundle.getString('setter_mock_assert_fail')
		);
	}
};
