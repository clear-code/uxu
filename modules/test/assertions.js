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

Assertions.prototype = {
	__proto__ : ns.EventTarget.prototype,

	get successCount() {
		return this._successCount;
	},

	resetSuccessCount : function()
	{
		this._successCount = 0;
	},

	_onSuccess : function()
	{
		this._successCount++;
	},

	equals : function(aExpected, aActual, aMessage)
	{
		if (!utils.equals(aExpected, aActual))
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_equals_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_equals_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_equals'),
			     aMessage);
		this._onSuccess();
	},
	equal : function() { return this.equals.apply(this, arguments); },
	arrayEquals : function() { return this.equals.apply(this, arguments); },
	arrayEqual : function() { return this.equals.apply(this, arguments); },

	notEquals : function(aExpected, aActual, aMessage)
	{
		if (utils.equals(aExpected, aActual))
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_equals_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_equals_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_equals'),
			     aMessage);
		this._onSuccess();
	},
	notEqual : function() { return this.notEquals.apply(this, arguments); },

	strictlyEquals : function(aExpected, aActual, aMessage)
	{
		if (!utils.strictlyEquals(aExpected, aActual))
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_strictly_equals_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_strictly_equals_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_strictly_equals'),
			     aMessage);
		this._onSuccess();
	},
	strictlyEqual : function() { return this.strictlyEquals.apply(this, arguments); },

	notStrictlyEquals : function(aExpected, aActual, aMessage)
	{
		if (utils.strictlyEquals(aExpected, aActual))
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_strictly_equals_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_strictly_equals_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_strictly_equals'),
			     aMessage);
		this._onSuccess();
	},
	notStrictlyEqual : function() { return this.notStrictlyEquals.apply(this, arguments); },

	isTrue : function(aActual, aMessage)
	{
		if (!aActual)
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_true_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_true'), aMessage);
		this._onSuccess();
	},
	'true' : function() { return this.isTrue.apply(this, arguments); },

	isFalse : function(aActual, aMessage)
	{
		if (aActual)
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_false_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_false'), aMessage);
		this._onSuccess();
	},
	'false' : function() { return this.isFalse.apply(this, arguments); },

	isBoolean : function(aActual, aMessage)
	{
		if (typeof aActual != 'boolean')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_boolean_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_boolean'), aMessage);
		this._onSuccess();
	},
	isBool : function() { return this.isBoolean.apply(this, arguments); },
	'bool' : function() { return this.isBoolean.apply(this, arguments); },
	'boolean' : function() { return this.isBoolean.apply(this, arguments); },

	isNotBoolean : function(aActual, aMessage)
	{
		if (typeof aActual == 'boolean')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_boolean_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_boolean'), aMessage);
		this._onSuccess();
	},
	isNotBool : function() { return this.isNotBoolean.apply(this, arguments); },
	notBool : function() { return this.isNotBoolean.apply(this, arguments); },
	notBoolean : function() { return this.isNotBoolean.apply(this, arguments); },

	isString : function(aActual, aMessage)
	{
		if (typeof aActual != 'string')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_string_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_string'), aMessage);
		this._onSuccess();
	},
	'string' : function() { return this.isString.apply(this, arguments); },

	isNotString : function(aActual, aMessage)
	{
		if (typeof aActual == 'string')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_string_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_string'), aMessage);
		this._onSuccess();
	},
	notString : function() { return this.isNotString.apply(this, arguments); },

	isNumber : function(aActual, aMessage)
	{
		if (typeof aActual != 'number')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_number_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_number'), aMessage);
		this._onSuccess();
	},
	'number' : function() { return this.isNumber.apply(this, arguments); },

	isNotNumber : function(aActual, aMessage)
	{
		if (typeof aActual == 'number')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_number_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_number'), aMessage);
		this._onSuccess();
	},
	notNumber : function() { return this.isNotNumber.apply(this, arguments); },

	isFunction : function(aActual, aMessage)
	{
		if (typeof aActual != 'function')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_function_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_function'), aMessage);
		this._onSuccess();
	},
	'function' : function() { return this.isFunction.apply(this, arguments); },

	isNotFunction : function(aActual, aMessage)
	{
		if (typeof aActual == 'function')
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_function_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_function'), aMessage);
		this._onSuccess();
	},
	notFunction : function() { return this.isNotFunction.apply(this, arguments); },

	isDefined : function(aActual, aMessage)
	{
		if (aActual === undefined)
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_defined_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_defined'), aMessage);
		this._onSuccess();
	},
	'defined' : function() { return this.isDefined.apply(this, arguments); },

	isUndefined : function(aActual, aMessage)
	{
		if (aActual !== undefined)
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_undefined_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_undefined'), aMessage);
		this._onSuccess();
	},
	'undefined' : function() { return this.isUndefined.apply(this, arguments); },

	isNull : function(aActual, aMessage)
	{
		if (aActual !== null)
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_null_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_null'), aMessage);
		this._onSuccess();
	},
	'null' : function() { return this.isNull.apply(this, arguments); },

	isNotNull : function(aActual, aMessage)
	{
		if (aActual === null)
			this.fail({
			     	actualRaw   : this.appendTypeString(aActual),
			     	actual      : bundle.getFormattedString('assert_is_not_null_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_is_not_null'), aMessage);
		this._onSuccess();
	},
	'notNull' : function() { return this.isNotNull.apply(this, arguments); },

	implementsInterface : function(aExpectedInterface, aActualInstance, aMessage)
	{
		if (typeof aExpectedInterface == 'string')
			aExpectedInterface = Ci[aExpectedInterface];

		if (Ci[aExpectedInterface] != aExpectedInterface)
			throw new Error(bundle.getFormattedString('assert_implement_interface_not_interface', [this.appendTypeString(aExpectedInterface)]));

		if (!(aActualInstance instanceof Ci.nsISupports))
			throw new Error(bundle.getFormattedString('assert_implement_interface_not_instance', [this.appendTypeString(aActualInstance)]));

		if (!(aActualInstance instanceof aExpectedInterface)) {
			var actualInterfaces = [];
			for (var i in Ci)
			{
				if (aActualInstance instanceof Ci[i]) actualInterfaces.push(i);
			}
			actualInterfaces = actualInterfaces.sort().join('\n');
			this.fail({
			     	expected    : bundle.getFormattedString('assert_implement_interface_expected', [aExpectedInterface]),
			     	actual      : bundle.getFormattedString('assert_implement_interface_actual', [actualInterfaces])
			     },
			     bundle.getString('assert_implement_interface'), aMessage);
		}
		this._onSuccess();
	},
	implementInterface : function() { return this.implementsInterface.apply(this, arguments); },

	raises : function(aExpectedException, aTask, aContext, aMessage)
	{
		var raised = false;
		var exception;
		if (typeof aTask == 'function') {
			try {
				aTask = aTask.call(aContext);
			}
			catch(e if e == aExpectedException ||
			           e.name == aExpectedException ||
			           e.message == aExpectedException) {
				raised = true;
				exception = e;
			}
			catch(e) {
				exception = e;
			}
		}
		if (aTask && utils.isGeneratedIterator(aTask)) {
			var _this = this;
			return utils.doIteration(aTask, {
				onEnd : function(e)
				{
					if (
						!e ||
						(
							e != aExpectedException &&
							e.name != aExpectedException &&
							e.message != aExpectedException
						)
						) {
						_this._onRaisesFinish(aExpectedException, e, aMessage);
					}
					_this._onSuccess();
				}
			});
		}
		else if (!raised) {
			this._onRaisesFinish(aExpectedException, exception, aMessage);
		}
		this._onSuccess();
	},
	raise : function() { return this.raises.apply(this, arguments); },
	_onRaisesFinish : function(aExpectedException, aActualException, aMessage)
	{
		if (aActualException) {
			this.fail({
			     	expectedRaw : aExpectedException,
			     	actualRaw   : aActualException,
			     	expected    : bundle.getFormattedString('assert_raises_expected', [aExpectedException]),
			     	actual      : bundle.getFormattedString('assert_raises_actual', [aActualException])
			     },
			     bundle.getString('assert_raises'), aMessage);
		}
		else {
			this.fail({
			     	expectedRaw : aExpectedException,
			     	expected    : bundle.getFormattedString('assert_raises_expected', [aExpectedException])
			     },
			     bundle.getString('assert_raises'), aMessage);
		}
	},

	notRaises : function(aUnexpectedException, aTask, aContext, aMessage)
	{
		var raised = false;
		var exception;
		if (typeof aTask == 'function') {
			try {
				aTask = aTask.call(aContext);
			}
			catch(e if e == aUnexpectedException ||
			           e.name == aUnexpectedException ||
			           e.message == aUnexpectedException) {
				exception = e;
				raised = true;
			}
			catch(e) {
				exception = e;
			}
			if (raised)
				this._onNotRaisesFinish(aUnexpectedException, exception, aMessage);
		}
		if (aTask && utils.isGeneratedIterator(aTask)) {
			var _this = this;
			return utils.doIteration(aTask, {
				onEnd : function(e)
				{
					if (
						!e ||
						(
							e != aUnexpectedException &&
							e.name != aUnexpectedException
						)
						) {
						_this._onSuccess();
						return;
					}
					_this._onNotRaisesFinish(aUnexpectedException, e, aMessage);
				}
			});
		}
		this._onSuccess();
	},
	notRaise : function() { return this.notRaises.apply(this, arguments); },
	_onNotRaisesFinish : function(aUnexpectedException, aActualException, aMessage)
	{
		this.fail({
		     	expectedRaw : aUnexpectedException,
		     	actualRaw   : aActualException,
		     	expected    : bundle.getFormattedString('assert_not_raises_expected', [aUnexpectedException]),
		     	actual      : bundle.getFormattedString('assert_not_raises_actual', [aActualException])
		     },
		     bundle.getString('assert_not_raises'), aMessage);
	},

	matches : function(aExpectedPattern, aActualString, aMessage)
	{
		if (!aActualString.match(aExpectedPattern))
			this.fail({
			     	expectedRaw : aExpectedPattern,
			     	actualRaw   : aActualString,
			     	expected    : bundle.getFormattedString('assert_matches_expected', [aExpectedPattern]),
			     	actual      : bundle.getFormattedString('assert_matches_actual', [aActualString])
			     },
			     bundle.getString('assert_matches'), aMessage);
		this._onSuccess();
	},
	match : function() { return this.matches.apply(this, arguments); },

	notMatches : function(aUnexpectedPattern, aActualString, aMessage)
	{
		if (aActualString.match(aUnexpectedPattern))
			this.fail({
			     	expectedRaw : aUnexpectedPattern,
			     	actualRaw   : aActualString,
			     	expected    : bundle.getFormattedString('assert_not_matches_expected', [aUnexpectedPattern]),
			     	actual      : bundle.getFormattedString('assert_not_matches_actual', [aActualString])
			     },
			     bundle.getString('assert_not_matches'), aMessage);
		this._onSuccess();
	},
	notMatch : function() { return this.notMatches.apply(this, arguments); },

	pattern : function(aExpectedString, aActualPattern, aMessage)
	{
		if (!aExpectedString.match(aActualPattern))
			this.fail({
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
			this.fail({
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
			this.fail({
			     	expectedRaw : (aExpected - aDelta)+' - '+(aExpected + aDelta),
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_in_delta_expected',
			     							   [aExpected - aDelta,
			     								aActual,
			     								aExpected + aDelta,
			     								aExpected,
			     								aDelta]),
			     	actual      : bundle.getFormattedString('assert_in_delta_actual',
			     							   [this.appendTypeString(aActual)])
			     },
				 bundle.getString('assert_in_delta'),
				 aMessage);
		this._onSuccess();
	},

	_greaterThan : function(aExpected, aActual, aMessage)
	{
		if (aExpected >= aActual)
			this.fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_greater_than_expected',
			     							   [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_greater_than_actual',
			     							   [this.appendTypeString(aActual)])
			     },
				 bundle.getString('assert_greater_than'),
				 aMessage);
		this._onSuccess();
	},
	_greater : function() { return this._greaterThan.apply(this, arguments); },

	_greaterOrEqual : function(aExpected, aActual, aMessage)
	{
		if (aExpected > aActual)
			this.fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_greater_or_equal_expected',
			     							   [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_greater_or_equal_actual',
			     							   [this.appendTypeString(aActual)])
			     },
				 bundle.getString('assert_greater_or_equal'),
				 aMessage);
		this._onSuccess();
	},

	_lessThan : function(aExpected, aActual, aMessage)
	{
		if (aExpected <= aActual)
			this.fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_less_than_expected',
			     							   [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_less_than_actual',
			     							   [this.appendTypeString(aActual)])
			     },
				 bundle.getString('assert_less_than'),
				 aMessage);
		this._onSuccess();
	},
	_less : function() { return this._lessThan.apply(this, arguments); },

	_lessOrEqual : function(aExpected, aActual, aMessage)
	{
		if (aExpected < aActual)
			this.fail({
			     	expectedRaw : aExpected,
			     	actualRaw   : aActual,
			     	expected    : bundle.getFormattedString('assert_less_or_equal_expected',
			     							   [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_less_or_equal_actual',
			     							   [this.appendTypeString(aActual)])
			     },
				 bundle.getString('assert_less_or_equal'),
				 aMessage);
		this._onSuccess();
	},

	compare : function(aExpected, aOperator, aActual, aMessage)
	{
		switch (aOperator)
		{
			case '<':
				return this._greaterThan(aExpected, aActual, aMessage);
			case '=<':
			case '<=':
				return this._greaterOrEqual(aExpected, aActual, aMessage);
			case '>':
				return this._lessThan(aExpected, aActual, aMessage);
			case '=>':
			case '>=':
				return this._lessOrEqual(aExpected, aActual, aMessage);
			case '=':
			case '==':
				return this.equals(aExpected, aActual, aMessage);
			case '!=':
				return this.notEquals(aExpected, aActual, aMessage);
			case '===':
				return this.strictlyEquals(aExpected, aActual, aMessage);
			case '!==':
				return this.notStrictlyEquals(aExpected, aActual, aMessage);
			default:
				throw new Error(bundle.getFormattedString('assert_compare_invalid_operator', [aOperator]));
		}
	},

	contains : function(aExpected, aActual, aMessage)
	{
		if (
			(aActual instanceof Ci.nsIDOMRange) ?
				!utils.isTargetInRange(aExpected, aActual) :
			(aActual instanceof Ci.nsISelection) ?
				!utils.isTargetInSelection(aExpected, aActual) :
			(aActual instanceof Ci.nsIDOMNode) ?
				!utils.isTargetInSubTree(aExpected, aActual) :
				(utils.isArray(aActual) ? aActual : String(aActual) ).indexOf(aExpected) < 0
			)
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_contains_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_contains_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_contains'),
			     aMessage);
		this._onSuccess();
	},
	contain : function() { return this.contains.apply(this, arguments); },

	notContains : function(aExpected, aActual, aMessage)
	{
		if (
			(aActual instanceof Ci.nsIDOMRange) ?
				utils.isTargetInRange(aExpected, aActual) :
			(aActual instanceof Ci.nsISelection) ?
				utils.isTargetInSelection(aExpected, aActual) :
			(aActual instanceof Ci.nsIDOMNode) ?
				utils.isTargetInSubTree(aExpected, aActual) :
				(utils.isArray(aActual) ? aActual : String(aActual) ).indexOf(aExpected) > -1
			)
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_contains_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_contains_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_contains'),
			     aMessage);
		this._onSuccess();
	},
	notContain : function() { return this.notContains.apply(this, arguments); },

	contained : function(aExpected, aActual, aMessage)
	{
		if (
			(aExpected instanceof Ci.nsIDOMRange) ?
				!utils.isTargetInRange(aActual, aExpected) :
			(aExpected instanceof Ci.nsISelection) ?
				!utils.isTargetInSelection(aActual, aExpected) :
			(aExpected instanceof Ci.nsIDOMNode) ?
				!utils.isTargetInSubTree(aActual, aExpected) :
				(utils.isArray(aExpected) ? aExpected : String(aExpected) ).indexOf(aActual) < 0
			)
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_contained_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_contained_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_contained'),
			     aMessage);
		this._onSuccess();
	},

	notContained : function(aExpected, aActual, aMessage)
	{
		if (
			(aExpected instanceof Ci.nsIDOMRange) ?
				utils.isTargetInRange(aActual, aExpected) :
			(aExpected instanceof Ci.nsISelection) ?
				utils.isTargetInSelection(aActual, aExpected) :
			(aExpected instanceof Ci.nsIDOMNode) ?
				utils.isTargetInSubTree(aActual, aExpected) :
				(utils.isArray(aExpected) ? aExpected : String(aExpected) ).indexOf(aActual) > -1
			)
			this.fail({
			     	expectedRaw : this.appendTypeString(aExpected),
			     	actualRaw   : this.appendTypeString(aActual),
			     	expected    : bundle.getFormattedString('assert_not_contained_expected', [this.appendTypeString(aExpected)]),
			     	actual      : bundle.getFormattedString('assert_not_contained_actual', [this.appendTypeString(aActual)])
			     },
			     bundle.getString('assert_not_contained'),
			     aMessage);
		this._onSuccess();
	},

	finishesWithin : function(aExpectedTime, aTask, aContext, aMessage)
	{
		var startAt = Date.now();
		if (typeof aTask == 'function') aTask = aTask.call(aContext);
		if (aTask && utils.isGeneratedIterator(aTask)) {
			var _this = this;
			return utils.doIteration(aTask, {
				onEnd : function(e)
				{
					_this._onFinishesWithinFinish(aExpectedTime, startAt, aMessage);
				},
				onError : function(e)
				{
					throw e;
				}
			});
		}
		else {
			this._onFinishesWithinFinish(aExpectedTime, startAt, aMessage);
		}
	},
	finishWithin : function() { return this.finishesWithin.apply(this, arguments); },
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
			this.fail({
			     	expected : bundle.getFormattedString('assert_finishes_within_expected', [aExpectedTime, longExpectedTime]),
			     	actual   : bundle.getFormattedString('assert_finishes_within_actual', [actualTime, longActualTime])
			     },
			     bundle.getString('assert_finishes_within'),
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
		if (typeof aTask == 'function') {
			aTask = aTask.call(aContext);
		}
		if (aTask && utils.isGeneratedIterator(aTask)) {
			var _this = this;
			return utils.doIteration(aTask, {
				onFail : function(e)
				{
					throw e;
				},
				onError : function(e)
				{
					throw e;
				},
				onEnd : function(e)
				{
					_this._assertionsCountCompare(aExpectedCount, aOperator, _this._successCount - count, aMessage);
					_this._onSuccess();
				}
			});
		}
		this._assertionsCountCompare(aExpectedCount, aOperator, this._successCount - count, aMessage);
		this._onSuccess();
	},
	assertionsCountEquals : function(aExpected, aTask, aContext, aMessage) { return this._assertionsCount(aExpected, '==', aTask, aContext, aMessage); },
	assertionsCountEqual : function() { return this.assertionsCountEquals.apply(this, arguments); },
	assertionsMinCount : function(aExpected, aTask, aContext, aMessage) { return this._assertionsCount(aExpected, '<=', aTask, aContext, aMessage); },
	assertionsMaxCount : function(aExpected, aTask, aContext, aMessage) { return this._assertionsCount(aExpected, '>=', aTask, aContext, aMessage); },

	_assertionsCountCompare : function(aExpected, aOperator, aActual, aMessage)
	{
		switch (aOperator)
		{
			case '<=':
				if (aExpected > aActual)
					this.fail({
							expected    : bundle.getFormattedString('assert_min_success_count_expected', [aExpected]),
							actual      : bundle.getFormattedString('assert_min_success_count_actual', [aActual])
						},
						bundle.getString('assert_min_success_count'),
						aMessage
					);
				return;
			case '>=':
				if (aExpected < aActual)
					this.fail({
							expected    : bundle.getFormattedString('assert_max_success_count_expected', [aExpected]),
							actual      : bundle.getFormattedString('assert_max_success_count_actual', [aActual])
						},
						bundle.getString('assert_max_success_count'),
						aMessage
					);
				return;
			case '==':
				if (!utils.equals(aExpected, aActual))
					this.fail({
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


	fail : function()
	{
		var args = Array.slice(arguments);
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

	appendTypeString : function(aValue)
	{
		if (aValue === null) return 'null';
		if (aValue === void(0)) return 'undefined';
		var args = (aValue instanceof Ci.nsIDOMNode) ?
				[utils.inspectDOMNode(aValue), utils.inspect(aValue)] :
				[utils.inspect(aValue), utils.inspectType(aValue)]
		return bundle.getFormattedString('typed_value', args);
	}
};
