// -*- indent-tabs-mode: t; tab-width: 4 -*-
// Copyright (C) 2006 by Massimiliano Mirra
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301 USA
//
// Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Assertions'];

var Ci = Components.interfaces;

var ns = {};
Components.utils.import('resource://uxu-modules/lib/inherit.jsm', ns);
Components.utils.import('resource://uxu-modules/lib/stringBundle.js', ns);
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/diff.js', ns);
Components.utils.import('resource://uxu-modules/eventTarget.js', ns);

var utils = ns.utils;
var bundle = ns.stringBundle.get('chrome://uxu/locale/uxu.properties');

function Assertions()
{
	this.initListeners();

	this.resetSuccessCount();
}

Assertions.prototype = ns.inherit(ns.EventTarget.prototype, {

	get successCount() {
		return this._successCount;
	},

	resetSuccessCount : function()
	{
		this._successCount = 0;
	},

	doInternalAssertion : function(...aArgs)
	{
		var assertion = aArgs[0];
		var args = Array.slice(aArgs, 1);
		var count = this._successCount;
		return utils.wait((function() {
			if (typeof assertion == 'function')
				assertion();
			else
				this[assertion].apply(this, args);
		}).bind(this))
			.then((function() {
				this._successCount = count;
			}).bind(this));
	},

	_onSuccess : function()
	{
		this._successCount++;
	},

	equals : function(aExpected, aActual, aMessage)
	{
		if (!utils.equals(aExpected, aActual))
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_equals_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_equals_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_equals'),
			     aMessage);
		this._onSuccess();
	},
	equal : function(...aArgs) { return this.equals.apply(this, aArgs); },
	arrayEquals : function(...aArgs) { return this.equals.apply(this, aArgs); },
	arrayEqual : function(...aArgs) { return this.equals.apply(this, aArgs); },

	notEquals : function(aExpected, aActual, aMessage)
	{
		if (utils.equals(aExpected, aActual))
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_equals_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_equals_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_equals'),
			     aMessage);
		this._onSuccess();
	},
	notEqual : function(...aArgs) { return this.notEquals.apply(this, aArgs); },

	strictlyEquals : function(aExpected, aActual, aMessage)
	{
		if (!utils.strictlyEquals(aExpected, aActual))
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_strictly_equals_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_strictly_equals_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_strictly_equals'),
			     aMessage);
		this._onSuccess();
	},
	strictlyEqual : function(...aArgs) { return this.strictlyEquals.apply(this, aArgs); },

	notStrictlyEquals : function(aExpected, aActual, aMessage)
	{
		if (utils.strictlyEquals(aExpected, aActual))
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_strictly_equals_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_strictly_equals_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_strictly_equals'),
			     aMessage);
		this._onSuccess();
	},
	notStrictlyEqual : function(...aArgs) { return this.notStrictlyEquals.apply(this, aArgs); },

	same : function (aExpected, aActual, aMessage) {
		if (aExpected === aActual)
			this._onSuccess();
		else
			this._fail({
				expectedRaw : this._appendTypeString(aExpected),
				actualRaw   : this._appendTypeString(aActual),
				expected    : bundle.getFormattedString('assert_same_expected', [this._appendTypeString(aExpected)]),
				actual      : bundle.getFormattedString('assert_same_actual', [this._appendTypeString(aActual)])
			}, bundle.getString('assert_same'), aMessage);
	},

	notSame : function (aExpected, aActual, aMessage) {
		if (aExpected !== aActual)
			this._onSuccess();
		else
			this._fail({
				expectedRaw : this._appendTypeString(aExpected),
				actualRaw   : this._appendTypeString(aActual),
				expected    : bundle.getFormattedString('assert_not_same_expected', [this._appendTypeString(aExpected)]),
				actual      : bundle.getFormattedString('assert_not_same_actual', [this._appendTypeString(aActual)])
			}, bundle.getString('assert_not_same'), aMessage);
	},

	isTrue : function(aActual, aMessage)
	{
		if (!aActual)
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_true_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_true'), aMessage);
		this._onSuccess();
	},
	'true' : function(...aArgs) { return this.isTrue.apply(this, aArgs); },

	isFalse : function(aActual, aMessage)
	{
		if (aActual)
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_false_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_false'), aMessage);
		this._onSuccess();
	},
	'false' : function(...aArgs) { return this.isFalse.apply(this, aArgs); },

	isBoolean : function(aActual, aMessage)
	{
		if (typeof aActual != 'boolean')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_boolean_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_boolean'), aMessage);
		this._onSuccess();
	},
	isBool : function(...aArgs) { return this.isBoolean.apply(this, aArgs); },
	'bool' : function(...aArgs) { return this.isBoolean.apply(this, aArgs); },
	'boolean' : function(...aArgs) { return this.isBoolean.apply(this, aArgs); },

	isNotBoolean : function(aActual, aMessage)
	{
		if (typeof aActual == 'boolean')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_boolean_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_boolean'), aMessage);
		this._onSuccess();
	},
	isNotBool : function(...aArgs) { return this.isNotBoolean.apply(this, aArgs); },
	notBool : function(...aArgs) { return this.isNotBoolean.apply(this, aArgs); },
	notBoolean : function(...aArgs) { return this.isNotBoolean.apply(this, aArgs); },

	isString : function(aActual, aMessage)
	{
		if (typeof aActual != 'string')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_string_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_string'), aMessage);
		this._onSuccess();
	},
	'string' : function(...aArgs) { return this.isString.apply(this, aArgs); },

	isNotString : function(aActual, aMessage)
	{
		if (typeof aActual == 'string')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_string_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_string'), aMessage);
		this._onSuccess();
	},
	notString : function(...aArgs) { return this.isNotString.apply(this, aArgs); },

	isNumber : function(aActual, aMessage)
	{
		if (typeof aActual != 'number')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_number_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_number'), aMessage);
		this._onSuccess();
	},
	'number' : function(...aArgs) { return this.isNumber.apply(this, aArgs); },

	isNotNumber : function(aActual, aMessage)
	{
		if (typeof aActual == 'number')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_number_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_number'), aMessage);
		this._onSuccess();
	},
	notNumber : function(...aArgs) { return this.isNotNumber.apply(this, aArgs); },

	isFunction : function(aActual, aMessage)
	{
		if (typeof aActual != 'function')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_function_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_function'), aMessage);
		this._onSuccess();
	},
	'function' : function(...aArgs) { return this.isFunction.apply(this, aArgs); },

	isNotFunction : function(aActual, aMessage)
	{
		if (typeof aActual == 'function')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_function_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_function'), aMessage);
		this._onSuccess();
	},
	notFunction : function(...aArgs) { return this.isNotFunction.apply(this, aArgs); },

	isObject : function(aActual, aMessage)
	{
		if (typeof aActual != 'object')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_object_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_object'), aMessage);
		this._onSuccess();
	},
	'object' : function(...aArgs) { return this.isObject.apply(this, aArgs); },

	isNotObject : function(aActual, aMessage)
	{
		if (typeof aActual == 'object')
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_object_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_object'), aMessage);
		this._onSuccess();
	},
	notObject : function(...aArgs) { return this.isNotObject.apply(this, aArgs); },

	isArray : function(aActual, aMessage)
	{
		if (!utils.isArray(aActual))
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_array_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_array'), aMessage);
		this._onSuccess();
	},
	'array' : function(...aArgs) { return this.isArray.apply(this, aArgs); },

	isNotArray : function(aActual, aMessage)
	{
		if (utils.isArray(aActual))
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_array_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_array'), aMessage);
		this._onSuccess();
	},
	notArray : function(...aArgs) { return this.isNotArray.apply(this, aArgs); },

	isDefined : function(aActual, aMessage)
	{
		if (aActual === undefined)
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_defined_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_defined'), aMessage);
		this._onSuccess();
	},
	'defined' : function(...aArgs) { return this.isDefined.apply(this, aArgs); },

	isUndefined : function(aActual, aMessage)
	{
		if (aActual !== undefined)
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_undefined_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_undefined'), aMessage);
		this._onSuccess();
	},
	'undefined' : function(...aArgs) { return this.isUndefined.apply(this, aArgs); },

	isNull : function(aActual, aMessage)
	{
		if (aActual !== null)
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_null_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_null'), aMessage);
		this._onSuccess();
	},
	'null' : function(...aArgs) { return this.isNull.apply(this, aArgs); },

	isNotNull : function(aActual, aMessage)
	{
		if (aActual === null)
			this._fail({
			     	actualRaw   : this._appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_null_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_null'), aMessage);
		this._onSuccess();
	},
	'notNull' : function(...aArgs) { return this.isNotNull.apply(this, aArgs); },

	implementsInterface : function(aExpectedInterface, aActualInstance, aMessage)
	{
		var expected = aExpectedInterface;
		if (String(expected) in Ci)
			expected = Ci[String(expected)];

		if (Ci[String(expected)] != String(expected))
			throw new Error(bundle.getFormattedString('assert_implement_interface_not_interface', [this._appendTypeString(expected)]));

		if (!this._implementsXPCOMInterface(Ci.nsISupports, aActualInstance))
			throw new Error(bundle.getFormattedString('assert_implement_interface_not_instance', [this._appendTypeString(aActualInstance)]));

		if (!this._implementsXPCOMInterface(expected, aActualInstance)) {
			let actualInterfaces = [];
			Object.keys(Ci).forEach(function (interfaceName) {
				if (Ci[interfaceName] instanceof Ci.nsIJSIID &&
					this._implementsXPCOMInterface(Ci[interfaceName], aActualInstance)) {
					actualInterfaces.push(interfaceName);
				}
			}, this);
			actualInterfaces = actualInterfaces.sort().join('\n');
			this._fail({
			     	expected    : bundle.getFormattedString('assert_implement_interface_expected', [expected]),
			     	actual      : bundle.getFormattedString('assert_implement_interface_actual', [actualInterfaces])
			     },
			     bundle.getString('assert_implement_interface'), aMessage);
		}
		this._onSuccess();
	},
	_implementsXPCOMInterface : function(aExpected, aInstance)
	{
		if (!aInstance)
			return false;

		if (aInstance instanceof aExpected)
			return true;

		var implemented = false;
		if ('QueryInterface' in aInstance && typeof aInstance.QueryInterface == 'function') {
			try {
				aInstance.QueryInterface(aExpected);
				implemented = true;
			}
			catch(e) {
			}
		}
		return implemented;
	},
	implementInterface : function(...aArgs) { return this.implementsInterface.apply(this, aArgs); },

	isInstanceOf : function(aExpectedClass, aActualInstance, aMessage)
	{
		var expected = aExpectedClass;

		if (String(expected) in Ci)
			return this.implementsInterface(aExpectedClass, aActualInstance, aMessage);

		if (typeof expected != 'function')
			throw new Error(bundle.getFormattedString('assert_instance_not_constructor', [this._appendTypeString(expected)]));

		if (!aActualInstance.constructor)
			throw new Error(bundle.getFormattedString('assert_instance_not_instance', [this._appendTypeString(aActualInstance)]));

		if (aActualInstance.constructor != expected && !(aActualInstance instanceof expected)) {
			var actualConstructor = aActualInstance.constructor.toString().match(/function ([^\(\s]*)\(/)[1];
			this._fail({
			     	expected    : bundle.getFormattedString('assert_instance_expected', [expected]),
			     	actual      : bundle.getFormattedString('assert_instance_actual', [actualConstructor])
			     },
			     bundle.getString('assert_instanceof'), aMessage);
		}
		this._onSuccess();
	},
	'instanceOf' : function(...aArgs) { return this.isInstanceOf.apply(this, aArgs); },
	'instanceof' : function(...aArgs) { return this.isInstanceOf.apply(this, aArgs); },
	'isInstance' : function(...aArgs) { return this.isInstanceOf.apply(this, aArgs); },
	'instance' : function(...aArgs) { return this.isInstanceOf.apply(this, aArgs); },

	raises : function(aExpectedException, aTask, aContext, aMessage)
	{
		if (typeof aExpectedException == 'string' &&
			aExpectedException in Components.results)
			aExpectedException = Components.results[aExpectedException];

		return utils.wait(function() {
			if (typeof aTask === 'function' && aContext)
				aTask = aTask.call(aContext);
			return utils.wait(aTask);
		})
				.catch((function(aException) {
					return aException;
				}).bind(this))
				.then((function(aException) {
					if (!aException ||
						!this._exceptionMatches(aExpectedException, aException)) {
						this._onRaisesFinish(aExpectedException, aException, aMessage);
					}
					this._onSuccess();
				}).bind(this));
	},
	raise : function(...aArgs) { return this.raises.apply(this, aArgs); },
	'throw' : function(...aArgs) { return this.raises.apply(this, aArgs); },
	throws : function(...aArgs) { return this.raises.apply(this, aArgs); },
	_exceptionMatches : function(aExpected, aActual)
	{
		if (aExpected == aActual)
			return true;

		var NSErrorName = utils.getErrorNameFromNSExceptionCode(aActual.result);
		switch (typeof aExpected)
		{
			case 'string':
			case 'number':
				return (
					aActual.name == String(aExpected) ||
					aActual.message == String(aExpected) ||
					aActual.name+': '+aActual.message == String(aExpected) ||
					aActual.result == aExpected ||
					(NSErrorName !== null && NSErrorName == String(aExpected))
				);

			case 'function':
				return aActual instanceof aExpected;

			case 'object':
				if (aExpected === null)
					return false;
				if (typeof aExpected.test === 'function') { // maybe regexp
					return (
						aExpected.test(aActual.name) ||
						aExpected.test(aActual.message) ||
						aExpected.test(aActual.name+': '+aActual.message) ||
						aExpected.test(String(aActual)) ||
						aExpected.test(aActual.result) ||
						(NSErrorName !== null && aExpected.test(NSErrorName))
					);
				}
				{
					let checked = false;
					for (let i in aExpected)
					{
						if (aExpected.hasOwnProperty(i) &&
							aActual[i] != aExpected[i])
							return false;
						checked = true;
					}
					return checked;
				}
		}

		return false;
	},
	_onRaisesFinish : function(aExpectedException, aActualException, aMessage)
	{
		var name = utils.getErrorNameFromNSExceptionCode(aExpectedException);
		if (name)
			aExpectedException = aExpectedException+' ('+name+')';

		var expectedReadable = aExpectedException;
		if (expectedReadable && typeof expectedReadable == 'object')
			expectedReadable = utils.inspect(expectedReadable);

		var actualReadable = aActualException;
		if (actualReadable && typeof actualReadable == 'object')
			actualReadable = utils.inspect(actualReadable);

		if (aActualException) {
			this._fail({
			     	expectedRaw : aExpectedException,
			     	actualRaw   : aActualException,
			     	expected    : bundle.getFormattedString('assert_raises_expected', [expectedReadable]),
			     	actual      : bundle.getFormattedString('assert_raises_actual', [actualReadable])
			     },
			     bundle.getString('assert_raises'), aMessage);
		}
		else {
			this._fail({
			     	expectedRaw : aExpectedException,
			     	expected    : bundle.getFormattedString('assert_raises_expected', [expectedReadable])
			     },
			     bundle.getString('assert_raises'), aMessage);
		}
	},

	notRaises : function(aUnexpectedException, aTask, aContext, aMessage)
	{
		if (typeof aUnexpectedException == 'string' &&
			aUnexpectedException in Components.results)
			aUnexpectedException = Components.results[aUnexpectedException];

		return utils.wait(function() {
			if (typeof aTask === 'function' && aContext)
				aTask = aTask.call(aContext);
			return utils.wait(aTask);
		})
				.catch((function(aException) {
					return aException;
				}).bind(this))
				.then((function(aException) {
					if (!aException ||
						!this._exceptionMatches(aUnexpectedException, aException)) {
						this._onSuccess();
						return;
					}
					this._onNotRaisesFinish(aUnexpectedException, aException, aMessage);
				}).bind(this));
	},
	notRaise : function(...aArgs) { return this.notRaises.apply(this, aArgs); },
	notThrow : function(...aArgs) { return this.notRaises.apply(this, aArgs); },
	notThrows : function(...aArgs) { return this.notRaises.apply(this, aArgs); },
	_onNotRaisesFinish : function(aUnexpectedException, aActualException, aMessage)
	{
		var name = utils.getErrorNameFromNSExceptionCode(aUnexpectedException);
		if (name)
			aUnexpectedException = aUnexpectedException+' ('+name+')';

		var unexpectedReadable = aUnexpectedException;
		if (unexpectedReadable && typeof unexpectedReadable == 'object')
			unexpectedReadable = utils.inspect(unexpectedReadable);

		var actualReadable = aActualException;
		if (actualReadable && typeof actualReadable == 'object')
			actualReadable = utils.inspect(actualReadable);

		this._fail({
		     	expectedRaw : aUnexpectedException,
		     	actualRaw   : aActualException,
		     	expected    : bundle.getFormattedString('assert_not_raises_expected', [unexpectedReadable]),
		     	actual      : bundle.getFormattedString('assert_not_raises_actual', [actualReadable])
		     },
		     bundle.getString('assert_not_raises'), aMessage);
	},

	matches : function(aExpectedPattern, aActualString, aMessage)
	{
		if (!aActualString.match(aExpectedPattern))
			this._fail({
			     	expectedRaw : aExpectedPattern,
			     	actualRaw   : aActualString,
			     	expected    : bundle.getFormattedString('assert_matches_expected', [aExpectedPattern]),
			     	actual      : bundle.getFormattedString('assert_matches_actual', [aActualString])
			     },
			     bundle.getString('assert_matches'), aMessage);
		this._onSuccess();
	},
	match : function(...aArgs) { return this.matches.apply(this, aArgs); },

	notMatches : function(aUnexpectedPattern, aActualString, aMessage)
	{
		if (aActualString.match(aUnexpectedPattern))
			this._fail({
			     	expectedRaw : aUnexpectedPattern,
			     	actualRaw   : aActualString,
			     	expected    : bundle.getFormattedString('assert_not_matches_expected', [aUnexpectedPattern]),
			     	actual      : bundle.getFormattedString('assert_not_matches_actual', [aActualString])
			     },
			     bundle.getString('assert_not_matches'), aMessage);
		this._onSuccess();
	},
	notMatch : function(...aArgs) { return this.notMatches.apply(this, aArgs); },

	pattern : function(aExpectedString, aActualPattern, aMessage)
	{
		if (!aExpectedString.match(aActualPattern))
			this._fail({
			     	expectedRaw : aExpectedString,
			     	actualRaw   : aActualPattern,
			     	expected    : bundle.getFormattedString('assert_pattern_expected', [aExpectedString]),
			     	actual      : bundle.getFormattedString('assert_pattern_actual', [aActualPattern])
			     },
			     bundle.getString('assert_pattern'), aMessage);
		this._onSuccess();
	},

	notPattern : function(aUnexpectedString, aActualPattern, aMessage)
	{
		if (aUnexpectedString.match(aActualPattern))
			this._fail({
			     	expectedRaw : aUnexpectedString,
			     	actualRaw   : aActualPattern,
			     	expected    : bundle.getFormattedString('assert_not_pattern_expected', [aUnexpectedString]),
			     	actual      : bundle.getFormattedString('assert_not_pattern_actual', [aActualPattern])
			     },
			     bundle.getString('assert_not_pattern'), aMessage);
		this._onSuccess();
	},

	inDelta : function(aExpected, aActual, aDelta, aMessage)
	{
		if (aExpected - aDelta == aActual || aExpected + aDelta == aActual)
			this.fireEvent(
				'AssertionWarning',
				bundle.getFormattedString('assert_in_delta_boundary_warning',
				                          [aActual, aExpected, aDelta])
			);

		if (aExpected - aDelta > aActual || aActual > aExpected + aDelta)
			this._fail({
			     	expectedRaw : (aExpected - aDelta)+' - '+(aExpected + aDelta),
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_in_delta_expected',
			     							   [aExpected - aDelta,
			     								aActual,
			     								aExpected + aDelta,
			     								aExpected,
			     								aDelta]),
			     	actual      : bundle.getFormattedString('assert_in_delta_actual',
			     							   [this._appendTypeString(aActual)])
			     },
				 bundle.getString('assert_in_delta'),
				 aMessage);
		this._onSuccess();
	},

	difference : function(...aArgs)
	{
		var aGetter, aExpectedDelta, aTask, aContext, aMessage;
		var startValue, endValue;
		var args = Array.slice(aArgs);
		try {
			if (typeof args[0] == 'function') {
				aGetter = function() { return args[0].call(aContext); };
				[aExpectedDelta, aTask, aContext, aMessage] = args.slice(1);
			}
			else if (
				args[0] &&
				typeof args[1] == 'string' &&
				args[1] in args[0]
				) {
				aGetter = function() {
					var prop = args[0][args[1]];
					return (typeof prop == 'function') ? prop.call(args[0]) : prop ;
				};
				[aExpectedDelta, aTask, aContext, aMessage] = args.slice(2);
			}
		}
		catch(e) {
		}

		if (!aGetter)
			throw new Error(bundle.getFormattedString('assert_difference_invalid_arguments', [this._appendTypeString(args)]));

		if (typeof aExpectedDelta != 'number')
			throw new Error(bundle.getFormattedString('assert_difference_delta_not_number', [this._appendTypeString(aExpectedDelta)]));

		startValue = aGetter();
		if (typeof startValue != 'number')
			throw new Error(bundle.getFormattedString('assert_difference_value_not_number', [this._appendTypeString(startValue)]));

		return utils.wait(function() {
			if (typeof aTask === 'function' && aContext)
				aTask = aTask.call(aContext);
			return utils.wait(aTask);
		})
				.then((function() {
					this._onDifferenceFinish(startValue, aGetter(), aExpectedDelta, aMessage);
				}).bind(this));
	},
	_onDifferenceFinish : function(aStartValue, aEndValue, aExpectedDelta, aMessage)
	{
		if (typeof aEndValue != 'number')
			throw new Error(bundle.getFormattedString('assert_difference_not_number', [this._appendTypeString(aEndValue)]));

		var actualDelta = aEndValue - aStartValue;
		if (actualDelta != aExpectedDelta) {
			this._fail({
			     	expectedRaw : aExpectedDelta,
			     	expected    : aExpectedDelta,
			     	actualRaw   : actualDelta,
			     	actual      : actualDelta
			     },
			     bundle.getString('assert_difference'),
			     aMessage);
		}
		this._onSuccess();
	},
	noDifference : function(...aArgs)
	{
		var aGetter, aTask, aContext, aMessage;
		var args = Array.slice(aArgs);
		try {
			if (typeof args[0] == 'function') {
				aGetter = function() { return args[0].call(aContext); };
				[aTask, aContext, aMessage] = args.slice(1);
			}
			else if (
				args[0] &&
				typeof args[1] == 'string' &&
				args[1] in args[0]
				) {
				aGetter = function() {
					var prop = args[0][args[1]];
					return (typeof prop == 'function') ? prop.call(args[0]) : prop ;
				};
				[aTask, aContext, aMessage] = args.slice(2);
			}
		}
		catch(e) {
		}

		if (!aGetter)
			throw new Error(bundle.getFormattedString('assert_no_difference_invalid_arguments', [this._appendTypeString(args)]));

		startValue = aGetter();
		if (typeof startValue != 'number')
			throw new Error(bundle.getFormattedString('assert_difference_value_not_number', [this._appendTypeString(startValue)]));

		return utils.wait(function() {
			if (typeof aTask === 'function' && aContext)
				aTask = aTask.call(aContext);
			return utils.wait(aTask);
		})
				.then((function() {
					this._onNoDifferenceFinish(startValue, aGetter(), aMessage);
				}).bind(this));
	},
	_onNoDifferenceFinish : function(aStartValue, aEndValue, aMessage)
	{
		if (typeof aEndValue != 'number')
			throw new Error(bundle.getFormattedString('assert_difference_not_number', [this._appendTypeString(aEndValue)]));

		if (aStartValue != aEndValue) {
			this._fail({
			     	actualRaw : aEndValue - aStartValue,
			     	actual    : bundle.getFormattedString('assert_no_difference_actual', [aEndValue - aStartValue])
			     },
			     bundle.getString('assert_no_difference'),
			     aMessage);
		}
		this._onSuccess();
	},

	_greaterThan : function(aExpected, aActual, aMessage)
	{
		if (aExpected >= aActual)
			this._fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_greater_than_expected',
			     							   [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_greater_than_actual',
			     							   [this._appendTypeString(aActual)])
			     },
				 bundle.getString('assert_greater_than'),
				 aMessage);
		this._onSuccess();
	},
	_greater : function(...aArgs) { return this._greaterThan.apply(this, aArgs); },

	_greaterOrEqual : function(aExpected, aActual, aMessage)
	{
		if (aExpected > aActual)
			this._fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_greater_or_equal_expected',
			     							   [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_greater_or_equal_actual',
			     							   [this._appendTypeString(aActual)])
			     },
				 bundle.getString('assert_greater_or_equal'),
				 aMessage);
		this._onSuccess();
	},

	_lessThan : function(aExpected, aActual, aMessage)
	{
		if (aExpected <= aActual)
			this._fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_less_than_expected',
			     							   [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_less_than_actual',
			     							   [this._appendTypeString(aActual)])
			     },
				 bundle.getString('assert_less_than'),
				 aMessage);
		this._onSuccess();
	},
	_less : function(...aArgs) { return this._lessThan.apply(this, aArgs); },

	_lessOrEqual : function(aExpected, aActual, aMessage)
	{
		if (aExpected < aActual)
			this._fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_less_or_equal_expected',
			     							   [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_less_or_equal_actual',
			     							   [this._appendTypeString(aActual)])
			     },
				 bundle.getString('assert_less_or_equal'),
				 aMessage);
		this._onSuccess();
	},

	compare : function(aExpected, aOperator, aActual, aMessage)
	{
		var message = bundle.getFormattedString('assert_compare', [aExpected+' '+aOperator+' '+aActual]);
		if (aMessage) message = aMessage + message;
		switch (aOperator)
		{
			case '<':
				return this._greaterThan(aExpected, aActual, message);
			case '=<':
			case '<=':
				return this._greaterOrEqual(aExpected, aActual, message);
			case '>':
				return this._lessThan(aExpected, aActual, message);
			case '=>':
			case '>=':
				return this._lessOrEqual(aExpected, aActual, message);
			case '=':
			case '==':
				return this.equals(aExpected, aActual, message);
			case '!=':
				return this.notEquals(aExpected, aActual, message);
			case '===':
				return this.strictlyEquals(aExpected, aActual, message);
			case '!==':
				return this.notStrictlyEquals(aExpected, aActual, message);
			default:
				throw new Error(bundle.getFormattedString('assert_compare_invalid_operator', [aOperator]));
		}
	},

	contains : function(aExpected, aActual, aMessage)
	{
		if (
			(aActual instanceof Ci.nsISelection) ?
				!utils.isTargetInSelection(aExpected, aActual) :
			utils.isDOMNode(aActual) ?
				!utils.isTargetInSubTree(aExpected, aActual) :
			utils.isDOMRange(aActual) ?
				!utils.isTargetInRange(aExpected, aActual) :
				(utils.isArray(aActual) ? aActual : String(aActual) ).indexOf(aExpected) < 0
			)
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_contains_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_contains_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_contains'),
			     aMessage);
		this._onSuccess();
	},
	contain : function(...aArgs) { return this.contains.apply(this, aArgs); },

	notContains : function(aExpected, aActual, aMessage)
	{
		if (
			(aActual instanceof Ci.nsISelection) ?
				utils.isTargetInSelection(aExpected, aActual) :
			utils.isDOMNode(aActual) ?
				utils.isTargetInSubTree(aExpected, aActual) :
			utils.isDOMRange(aActual) ?
				utils.isTargetInRange(aExpected, aActual) :
				(utils.isArray(aActual) ? aActual : String(aActual) ).indexOf(aExpected) > -1
			)
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_contains_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_contains_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_contains'),
			     aMessage);
		this._onSuccess();
	},
	notContain : function(...aArgs) { return this.notContains.apply(this, aArgs); },

	contained : function(aExpected, aActual, aMessage)
	{
		if (
			(aExpected instanceof Ci.nsISelection) ?
				!utils.isTargetInSelection(aActual, aExpected) :
			utils.isDOMNode(aExpected) ?
				!utils.isTargetInSubTree(aActual, aExpected) :
			utils.isDOMRange(aExpected) ?
				!utils.isTargetInRange(aActual, aExpected) :
				(utils.isArray(aExpected) ? aExpected : String(aExpected) ).indexOf(aActual) < 0
			)
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_contained_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_contained_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_contained'),
			     aMessage);
		this._onSuccess();
	},

	notContained : function(aExpected, aActual, aMessage)
	{
		if (
			(aExpected instanceof Ci.nsISelection) ?
				utils.isTargetInSelection(aActual, aExpected) :
			utils.isDOMNode(aExpected) ?
				utils.isTargetInSubTree(aActual, aExpected) :
			utils.isDOMRange(aExpected) ?
				utils.isTargetInRange(aActual, aExpected) :
				(utils.isArray(aExpected) ? aExpected : String(aExpected) ).indexOf(aActual) > -1
			)
			this._fail({
			     	expectedRaw : this._appendTypeString(aExpected),
			     	actualRaw   : this._appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_contained_expected', [this._appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_contained_actual', [this._appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_contained'),
			     aMessage);
		this._onSuccess();
	},

	finishesWithin : function(aExpectedTime, aTask, aContext, aMessage)
	{
		var startAt = Date.now();
		return utils.wait(function() {
			if (typeof aTask === 'function' && aContext)
				aTask = aTask.call(aContext);
			return utils.wait(aTask);
		})
				.then((function() {
					this._onFinishesWithinFinish(aExpectedTime, startAt, aMessage);
				}).bind(this));
	},
	finishWithin : function(...aArgs) { return this.finishesWithin.apply(this, aArgs); },
	_onFinishesWithinFinish : function(aExpectedTime, aStartAt, aMessage)
	{
		var actualTime = Date.now() - aStartAt;
		if (actualTime > aExpectedTime) {
			var longExpectedTime = aExpectedTime < 1000 ?
					'' :
					bundle.getFormattedString('assert_finishes_within_expected_long', [Math.round(aExpectedTime / 1000)]) ;
			var longActualTime = actualTime < 1000 ?
					'' :
					bundle.getFormattedString('assert_finishes_within_actual_long', [Math.round(actualTime / 1000)]) ;
			this._fail({
			     	expected : bundle.getFormattedString('assert_finishes_within_expected', [aExpectedTime, longExpectedTime]),
			     	actual   : bundle.getFormattedString('assert_finishes_within_actual', [actualTime, longActualTime])
			     },
			     bundle.getString('assert_finishes_within'),
			     aMessage);
		}
		this._onSuccess();
	},

	notFinishesWithin : function(aExpectedTime, aTask, aContext, aMessage)
	{
		var startAt = Date.now();
		return utils.wait(function() {
			if (typeof aTask === 'function' && aContext)
				aTask = aTask.call(aContext);
			return utils.wait(aTask);
		})
				.then((function() {
					this._onNotFinishesWithinFinish(aExpectedTime, startAt, aMessage);
				}).bind(this));
	},
	notFinishWithin : function(...aArgs) { return this.notFinishesWithin.apply(this, aArgs); },
	finishesOver : function(...aArgs) { return this.notFinishesWithin.apply(this, aArgs); },
	finishOver : function(...aArgs) { return this.notFinishesWithin.apply(this, aArgs); },
	_onNotFinishesWithinFinish : function(aExpectedTime, aStartAt, aMessage)
	{
		var actualTime = Date.now() - aStartAt;
		if (actualTime < aExpectedTime) {
			var longExpectedTime = aExpectedTime < 1000 ?
					'' :
					bundle.getFormattedString('assert_not_finishes_within_expected_long', [Math.round(aExpectedTime / 1000)]) ;
			var longActualTime = actualTime < 1000 ?
					'' :
					bundle.getFormattedString('assert_not_finishes_within_actual_long', [Math.round(actualTime / 1000)]) ;
			this._fail({
			     	expected : bundle.getFormattedString('assert_not_finishes_within_expected', [aExpectedTime, longExpectedTime]),
			     	actual   : bundle.getFormattedString('assert_not_finishes_within_actual', [actualTime, longActualTime])
			     },
			     bundle.getString('assert_not_finishes_within'),
			     aMessage);
		}
		this._onSuccess();
	},

	ok : function(aExpression, aMessage)
	{
		this.isTrue(aExpression, aMessage);
	},

	is : function(aExpected, aActual, aMessage)
	{
		this.equals(aExpected, aActual, aMessage);
	},

	_assertionsCount : function(aExpectedCount, aOperator, aTask, aContext, aMessage)
	{
		var raised = false;
		var count = this._successCount;
		return utils.wait(function() {
			if (typeof aTask === 'function' && aContext)
				aTask = aTask.call(aContext);
			return utils.wait(aTask);
		})
				.then((function() {
					this._assertionsCountCompare(aExpectedCount, aOperator, self._successCount - count, aMessage);
					this._onSuccess();
				}).bind(this));
	},
	assertionsCountEquals : function(aExpected, aTask, aContext, aMessage) { return this._assertionsCount(aExpected, '==', aTask, aContext, aMessage); },
	assertionsCountEqual : function(...aArgs) { return this.assertionsCountEquals.apply(this, aArgs); },
	assertionsMinCount : function(aExpected, aTask, aContext, aMessage) { return this._assertionsCount(aExpected, '<=', aTask, aContext, aMessage); },
	assertionsMaxCount : function(aExpected, aTask, aContext, aMessage) { return this._assertionsCount(aExpected, '>=', aTask, aContext, aMessage); },

	_assertionsCountCompare : function(aExpected, aOperator, aActual, aMessage)
	{
		switch (aOperator)
		{
			case '<=':
				if (aExpected > aActual)
					this._fail({
							expected    : bundle.getFormattedString('assert_min_success_count_expected', [aExpected]),
							actual      : bundle.getFormattedString('assert_min_success_count_actual', [aActual])
						},
						bundle.getString('assert_min_success_count'),
						aMessage
					);
				return;
			case '>=':
				if (aExpected < aActual)
					this._fail({
							expected    : bundle.getFormattedString('assert_max_success_count_expected', [aExpected]),
							actual      : bundle.getFormattedString('assert_max_success_count_actual', [aActual])
						},
						bundle.getString('assert_max_success_count'),
						aMessage
					);
				return;
			case '==':
				if (!utils.equals(aExpected, aActual))
					this._fail({
							expected    : bundle.getFormattedString('assert_success_count_expected', [aExpected]),
							actual      : bundle.getFormattedString('assert_success_count_actual', [aActual])
						},
						bundle.getString(
							aExpected < aActual ?
								'assert_success_count_too_many' :
								'assert_success_count_too_less'
						),
						aMessage
					);
				return;
		}
	},


	validSuccessCount : function(aExpected, aMin, aMax)
	{
		if (aExpected === void(0)) aExpected = -1;
		if (aMin === void(0)) aMin = -1;
		if (aMax === void(0)) aMax = -1;

		if (aExpected > -1)
			this._assertionsCountCompare(aExpected, '==', this.successCount);

		if (aMin > -1)
			this._assertionsCountCompare(aMin, '<=', this.successCount);

		if (aMax > -1)
			this._assertionsCountCompare(aMax, '>=', this.successCount);

		if (aExpected < 0 && aMin < 0 && aMax < 0 &&
			!this.successCount &&
			utils.getPref('extensions.uxu.warnOnNoAssertion'))
			this.fireEvent(
				'AssertionWarning',
				bundle.getString('assert_success_count_no_assertion_warning')
			);
	},


	_fail : function(...aArgs)
	{
		var args = Array.slice(aArgs);
		var error = new Error();
		error.name = 'AssertionFailed';
		var results = args.shift() || {};
		error.expectedRaw = results.expectedRaw;
		error.actualRaw = results.actualRaw;
		error.expected = results.expected;
		error.actual = results.actual;
		if ('expectedRaw' in results && 'actualRaw' in results) {
			var _diff = ns.Diff.readable(error.expectedRaw, error.actualRaw);
			if (ns.Diff.isInterested(_diff)) {
				error.diff = _diff;
				if (ns.Diff.needFold(_diff)) {
					error.foldedDiff = ns.Diff.foldedReadable(error.expectedRaw,
														      error.actualRaw);
				}
				error.encodedDiff = ns.Diff.readable(error.expectedRaw,
												     error.actualRaw,
												     true);
			}
		}
		if (!('diff' in error)) error.diff = '';
		if (!('foldedDiff' in error)) error.foldedDiff = error.diff;
		error.message = args.reverse().join('\n');
		throw error;
	},

	_appendTypeString : function(aValue)
	{
		if (aValue === null) return 'null';
		if (aValue === void(0)) return 'undefined';
		var args = utils.isDOMNode(aValue) ?
				[utils.inspectDOMNode(aValue), utils.inspect(aValue)] :
				[utils.inspect(aValue), utils.inspectType(aValue)]
		return bundle.getFormattedString('typed_value', args);
	},

	export : function(aNamespace, aForce)
	{
		var self = this;
		var prototype = Assertions.prototype;

		var assertIsTrue = function(...aArgs) {
				return self.isTrue.call(self, aArgs);
			};
		assertIsTrue.__defineGetter__('_source', function(aValue) {
			return self;
		});

		if (aForce || !(utils.lookupGetter(aNamespace, 'assert') || 'assert' in aNamespace)) {
			aNamespace.__defineGetter__('assert', function(aValue) {
				return assertIsTrue;
			});
			aNamespace.__defineSetter__('assert', function(aValue) {
				return aValue;
			});
		}

		for (var aMethod in prototype)
		{
			if (
				!prototype.hasOwnProperty(aMethod) ||
				aMethod.charAt(0) == '_' ||
				/^(export|resetSuccessCount)$/.test(aMethod)
				)
				continue;

			(function(aMethod, aPrefix) {
				var alias = aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1);
				if (utils.lookupGetter(prototype, aMethod) || (typeof prototype[aMethod] != 'function')){
					assertIsTrue.__defineGetter__(aMethod, function() {
						return self[aMethod];
					});
					if (aForce || !(utils.lookupGetter(aNamespace, alias) || alias in aNamespace))
						aNamespace.__defineGetter__(alias, function() {
							return self[aMethod];
						});
				}
				else {
					assertIsTrue[aMethod] = utils.bind(prototype[aMethod], self);
					if (aForce || !(utils.lookupGetter(aNamespace, alias) || alias in aNamespace))
						aNamespace[alias] = assertIsTrue[aMethod];
				}
			})(aMethod, 'assert');
		}
	}
});
