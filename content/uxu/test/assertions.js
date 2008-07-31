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

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = lib_module.require('package', 'bundle');
var utils = lib_module.require('package', 'utils');
var diff = lib_module.require('package', 'diff');


function equals(aExpected, aActual, aMessage)
{
	if (!utils.equals(aExpected, aActual))
		fail(bundle.getFormattedString('assert_equals_expected', [appendTypeString(aExpected)]),
		     bundle.getFormattedString('assert_equals_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_equals'),
		     aMessage);
}
function equal(aExpected, aActual, aMessage) { this.equals(aExpected, aActual, aMessage); }

function notEquals(aExpected, aActual, aMessage)
{
	if (utils.equals(aExpected, aActual))
		fail(bundle.getFormattedString('assert_not_equals_expected', [appendTypeString(aExpected)]),
		     bundle.getFormattedString('assert_not_equals_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_not_equals'),
		     aMessage);
}
function notEqual(aExpected, aActual, aMessage) { this.notEquals(aExpected, aActual, aMessage); }

function strictlyEquals(aExpected, aActual, aMessage)
{
	if (!utils.strictlyEquals(aExpected, aActual))
		fail(bundle.getFormattedString('assert_strictly_equals_expected', [appendTypeString(aExpected)]),
		     bundle.getFormattedString('assert_strictly_equals_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_strictly_equals'),
		     aMessage);
}
function strictlyEqual(aExpected, aActual, aMessage) { this.strictlyEquals(aExpected, aActual, aMessage); }

function notStrictlyEquals(aExpected, aActual, aMessage)
{
	if (utils.strictlyEquals(aExpected, aActual))
		fail(bundle.getFormattedString('assert_not_strictly_equals_expected', [appendTypeString(aExpected)]),
		     bundle.getFormattedString('assert_not_strictly_equals_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_not_strictly_equals'),
		     aMessage);
}
function notStrictlyEqual(aExpected, aActual, aMessage) { this.notStrictlyEquals(aExpected, aActual, aMessage); }

function isTrue(aActual, aMessage)
{
	if (!aActual)
		fail(null,
		     bundle.getFormattedString('assert_is_true_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_true'), aMessage);
}

function isFalse(aActual, aMessage)
{
	if (aActual)
		fail(null,
		     bundle.getFormattedString('assert_is_false_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_false'), aMessage);
}

function isBoolean(aActual, aMessage)
{
	if (typeof aActual != 'boolean')
		fail(null,
		     bundle.getFormattedString('assert_is_boolean_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_boolean'), aMessage);
}

function isNotBoolean(aActual, aMessage)
{
	if (typeof aActual == 'boolean')
		fail(null,
		     bundle.getFormattedString('assert_is_not_boolean_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_not_boolean'), aMessage);
}

function isString(aActual, aMessage)
{
	if (typeof aActual != 'string')
		fail(null,
		     bundle.getFormattedString('assert_is_string_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_string'), aMessage);
}

function isNotString(aActual, aMessage)
{
	if (typeof aActual == 'string')
		fail(null,
		     bundle.getFormattedString('assert_is_not_string_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_not_string'), aMessage);
}

function isNumber(aActual, aMessage)
{
	if (typeof aActual != 'number')
		fail(null,
		     bundle.getFormattedString('assert_is_number_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_number'), aMessage);
}

function isNotNumber(aActual, aMessage)
{
	if (typeof aActual == 'number')
		fail(null,
		     bundle.getFormattedString('assert_is_not_number_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_not_number'), aMessage);
}

function isFunction(aActual, aMessage)
{
	if (typeof aActual != 'function')
		fail(null,
		     bundle.getFormattedString('assert_is_function_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_function'), aMessage);
}

function isNotFunction(aActual, aMessage)
{
	if (typeof aActual == 'function')
		fail(null,
		     bundle.getFormattedString('assert_is_not_function_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_not_function'), aMessage);
}

function isDefined(aActual, aMessage)
{
	if (aActual === undefined)
		fail(null,
		     bundle.getFormattedString('assert_is_defined_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_defined'), aMessage);
}

function isUndefined(aActual, aMessage)
{
	if (aActual !== undefined)
		fail(null,
		     bundle.getFormattedString('assert_is_undefined_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_undefined'), aMessage);
}

function isNull(aActual, aMessage)
{
	if (aActual !== null)
		fail(null,
		     bundle.getFormattedString('assert_is_null_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_null'), aMessage);
}

function isNotNull(aActual, aMessage)
{
	if (aActual === null)
		fail(null,
		     bundle.getFormattedString('assert_is_not_null_actual', [appendTypeString(aActual)]),
		     bundle.getString('assert_is_not_null'), aMessage);
}

function raises(aExpectedException, aFunction, aContext, aMessage)
{
	var raised = false;
	try {
		aFunction.call(aContext);
	}
	catch(e if e == aExpectedException) {
		raised = true;
	}
	catch(e if e.name == aExpectedException) {
		raised = true;
	}
	if (!raised)
		fail(bundle.getFormattedString('assert_raises_expected', [aExpectedException]),
		     null,
		     bundle.getString('assert_raises'), aMessage);
}
function raise(aExpectedException, aFunction, aContext, aMessage) { this.raises(aExpectedException, aFunction, aContext, aMessage); }

function notRaises(aExpectedException, aFunction, aContext, aMessage)
{
	var raised = false;
	var exception;
	try {
		aFunction.call(aContext);
	}
	catch(e if e == aExpectedException) {
		exception = e;
		raised = true;
	}
	catch(e if e.name == aExpectedException) {
		exception = e;
		raised = true;
	}
	catch(e) {
		exception = e;
	}
	if (raised)
		fail(bundle.getFormattedString('assert_not_raises_expected', [aExpectedException]),
		     bundle.getFormattedString('assert_not_raises_actual', [exception]),
		     bundle.getString('assert_not_raises'), aMessage);
}
function notRaise(aExpectedException, aFunction, aContext, aMessage) { this.notRaises(aExpectedException, aFunction, aContext, aMessage); }

function matches(aExpectedPattern, aActualString, aMessage)
{
	if (!aActualString.match(aExpectedPattern))
		fail(bundle.getFormattedString('assert_matches_expected', [aExpectedPattern]),
		     bundle.getFormattedString('assert_matches_actual', [aActualString]),
		     bundle.getString('assert_matches'), aMessage);
}
function match(aExpectedPattern, aActualString, aMessage) { this.matches(aExpectedPattern, aActualString, aMessage); }

function notMatches(aExpectedPattern, aActualString, aMessage)
{
	if (aActualString.match(aExpectedPattern))
		fail(bundle.getFormattedString('assert_not_matches_expected', [aExpectedPattern]),
		     bundle.getFormattedString('assert_not_matches_actual', [aActualString]),
		     bundle.getString('assert_not_matches'), aMessage);
}
function notMatch(aExpectedPattern, aActualString, aMessage) { this.notMatches(aExpectedPattern, aActualString, aMessage); }

function pattern(aExpectedString, aActualPattern, aMessage)
{
	if (!aExpectedString.match(aActualPattern))
		fail(bundle.getFormattedString('assert_pattern_expected', [aExpectedString]),
		     bundle.getFormattedString('assert_pattern_actual', [aActualPattern]),
		     bundle.getString('assert_pattern'), aMessage);
}

function notPattern(aExpectedString, aActualPattern, aMessage)
{
	if (aExpectedString.match(aActualPattern))
		fail(bundle.getFormattedString('assert_not_pattern_expected', [aExpectedString]),
		     bundle.getFormattedString('assert_not_pattern_actual', [aActualPattern]),
		     bundle.getString('assert_not_pattern'), aMessage);
}

function arrayEquals(aExpected, aActual, aMessage) { this.equals(aExpected, aActual, aMessage); }
function arrayEqual(aExpected, aActual, aMessage) { this.arrayEquals(aExpected, aActual, aMessage); }

function inDelta(aExpected, aActual, aDelta, aMessage)
{
	if (aExpected - aDelta < aActual && aActual < aExpected + aDelta)
		return;

	fail(bundle.getFormattedString('assert_in_delta_expected',
								   [appendTypeString(aExpected - aDelta),
									appendTypeString(aActual),
									appendTypeString(aExpected + aDelta),
									appendTypeString(aExpected),
									appendTypeString(aDelta)]),
		 bundle.getFormattedString('assert_in_delta_actual',
								   [appendTypeString(aActual)]),
		 bundle.getString('assert_in_delta'),
		 aMessage);
}

function fail()
{
	var args = Array.slice(arguments);
	var error = new Error();
	error.name = 'AssertionFailed';
	error.expected = args.shift();
	error.actual = args.shift();
	if (error.expected && error.actual) {
		var _diff = diff.readable(error.expected, error.actual);
		if (diff.isInterested(_diff)) {
			error.diff = _diff;
			if (diff.needFold(_diff))
				error.foldedDiff = diff.foldedReadable(error.expected,
													   error.actual);
		}
	}
	error.message = args.reverse().join('\n');
	throw error;
}

function appendTypeString(aValue)
{
	if (aValue === null) return 'null';
	if (aValue === void(0)) return 'undefined';
	return bundle.getFormattedString('typed_value', [utils.inspect(aValue), utils.inspectType(aValue)]);
}
