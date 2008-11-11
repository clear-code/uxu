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
		fail({
		     	expectedRaw : appendTypeString(aExpected),
		     	actualRaw   : appendTypeString(aActual),
		     	expected    : bundle.getFormattedString('assert_equals_expected', [appendTypeString(aExpected)]),
		     	actual      : bundle.getFormattedString('assert_equals_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_equals'),
		     aMessage);
}
function equal(aExpected, aActual, aMessage) { this.equals(aExpected, aActual, aMessage); }

function notEquals(aExpected, aActual, aMessage)
{
	if (utils.equals(aExpected, aActual))
		fail({
		     	expectedRaw : appendTypeString(aExpected),
		     	actualRaw   : appendTypeString(aActual),
		     	expected    : bundle.getFormattedString('assert_not_equals_expected', [appendTypeString(aExpected)]),
		     	actual      : bundle.getFormattedString('assert_not_equals_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_not_equals'),
		     aMessage);
}
function notEqual(aExpected, aActual, aMessage) { this.notEquals(aExpected, aActual, aMessage); }

function strictlyEquals(aExpected, aActual, aMessage)
{
	if (!utils.strictlyEquals(aExpected, aActual))
		fail({
		     	expectedRaw : appendTypeString(aExpected),
		     	actualRaw   : appendTypeString(aActual),
		     	expected    : bundle.getFormattedString('assert_strictly_equals_expected', [appendTypeString(aExpected)]),
		     	actual      : bundle.getFormattedString('assert_strictly_equals_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_strictly_equals'),
		     aMessage);
}
function strictlyEqual(aExpected, aActual, aMessage) { this.strictlyEquals(aExpected, aActual, aMessage); }

function notStrictlyEquals(aExpected, aActual, aMessage)
{
	if (utils.strictlyEquals(aExpected, aActual))
		fail({
		     	expectedRaw : appendTypeString(aExpected),
		     	actualRaw   : appendTypeString(aActual),
		     	expected    : bundle.getFormattedString('assert_not_strictly_equals_expected', [appendTypeString(aExpected)]),
		     	actual      : bundle.getFormattedString('assert_not_strictly_equals_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_not_strictly_equals'),
		     aMessage);
}
function notStrictlyEqual(aExpected, aActual, aMessage) { this.notStrictlyEquals(aExpected, aActual, aMessage); }

function isTrue(aActual, aMessage)
{
	if (!aActual)
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_true_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_true'), aMessage);
}

function isFalse(aActual, aMessage)
{
	if (aActual)
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_false_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_false'), aMessage);
}

function isBoolean(aActual, aMessage)
{
	if (typeof aActual != 'boolean')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_boolean_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_boolean'), aMessage);
}

function isNotBoolean(aActual, aMessage)
{
	if (typeof aActual == 'boolean')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_not_boolean_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_not_boolean'), aMessage);
}

function isString(aActual, aMessage)
{
	if (typeof aActual != 'string')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_string_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_string'), aMessage);
}

function isNotString(aActual, aMessage)
{
	if (typeof aActual == 'string')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_not_string_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_not_string'), aMessage);
}

function isNumber(aActual, aMessage)
{
	if (typeof aActual != 'number')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_number_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_number'), aMessage);
}

function isNotNumber(aActual, aMessage)
{
	if (typeof aActual == 'number')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_not_number_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_not_number'), aMessage);
}

function isFunction(aActual, aMessage)
{
	if (typeof aActual != 'function')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_function_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_function'), aMessage);
}

function isNotFunction(aActual, aMessage)
{
	if (typeof aActual == 'function')
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_not_function_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_not_function'), aMessage);
}

function isDefined(aActual, aMessage)
{
	if (aActual === undefined)
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_defined_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_defined'), aMessage);
}

function isUndefined(aActual, aMessage)
{
	if (aActual !== undefined)
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_undefined_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_undefined'), aMessage);
}

function isNull(aActual, aMessage)
{
	if (aActual !== null)
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_null_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_null'), aMessage);
}

function isNotNull(aActual, aMessage)
{
	if (aActual === null)
		fail({
		     	actualRaw   : appendTypeString(aActual),
		     	actual      : bundle.getFormattedString('assert_is_not_null_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_is_not_null'), aMessage);
}

function raises(aExpectedException, aTask, aContext, aMessage)
{
	var raised = false;
	if (typeof aTask == 'function') {
		try {
			aTask = aTask.call(aContext);
		}
		catch(e if e == aExpectedException) {
			raised = true;
		}
		catch(e if e.name == aExpectedException) {
			raised = true;
		}
	}
	if (aTask && utils.isGeneratedIterator(aTask)) {
		return utils.doIteration(aTask, {
			onEnd : function(e)
			{
				if (
					e &&
					(
						e == aExpectedException ||
						e.name == aExpectedException
					)
					) {
					raised = true;
				}
				if (!raised)
					_onRaisesFinish(aExpectedException, aMessage);
			}
		});
	}
	else if (!raised) {
		_onRaisesFinish(aExpectedException, aMessage);
	}
}
function raise(aExpectedException, aTask, aContext, aMessage) { this.raises(aExpectedException, aTask, aContext, aMessage); }
function _onRaisesFinish(aExpectedException, aMessage)
{
	fail({
	     	expectedRaw : aExpectedException,
	     	expected    : bundle.getFormattedString('assert_raises_expected', [aExpectedException])
	     },
	     bundle.getString('assert_raises'), aMessage);
}

function notRaises(aExpectedException, aTask, aContext, aMessage)
{
	var raised = false;
	var exception;
	if (typeof aTask == 'function') {
		try {
			aTask = aTask.call(aContext);
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
			_onNotRaisesFinish(aExpectedException, exception, aMessage);
	}
	if (aTask && utils.isGeneratedIterator(aTask)) {
		return utils.doIteration(aTask, {
			onEnd : function(e)
			{
				if (
					e &&
					(
						e == aExpectedException ||
						e.name == aExpectedException
					)
					) {
					exception = e;
					raised = true;
				}
				if (raised)
					_onNotRaisesFinish(aExpectedException, exception, aMessage);
			}
		});
	}
}
function notRaise(aExpectedException, aTask, aContext, aMessage) { this.notRaises(aExpectedException, aTask, aContext, aMessage); }
function _onNotRaisesFinish(aExpectedException, aActualException, aMessage)
{
	fail({
	     	expectedRaw : aExpectedException,
	     	actualRaw   : aActualException,
	     	expected    : bundle.getFormattedString('assert_not_raises_expected', [aExpectedException]),
	     	actual      : bundle.getFormattedString('assert_not_raises_actual', [aActualException])
	     },
	     bundle.getString('assert_not_raises'), aMessage);
}

function matches(aExpectedPattern, aActualString, aMessage)
{
	if (!aActualString.match(aExpectedPattern))
		fail({
		     	expectedRaw : aExpectedPattern,
		     	actualRaw   : aActualString,
		     	expected    : bundle.getFormattedString('assert_matches_expected', [aExpectedPattern]),
		     	actual      : bundle.getFormattedString('assert_matches_actual', [aActualString])
		     },
		     bundle.getString('assert_matches'), aMessage);
}
function match(aExpectedPattern, aActualString, aMessage) { this.matches(aExpectedPattern, aActualString, aMessage); }

function notMatches(aExpectedPattern, aActualString, aMessage)
{
	if (aActualString.match(aExpectedPattern))
		fail({
		     	expectedRaw : aExpectedPattern,
		     	actualRaw   : aActualString,
		     	expected    : bundle.getFormattedString('assert_not_matches_expected', [aExpectedPattern]),
		     	actual      : bundle.getFormattedString('assert_not_matches_actual', [aActualString])
		     },
		     bundle.getString('assert_not_matches'), aMessage);
}
function notMatch(aExpectedPattern, aActualString, aMessage) { this.notMatches(aExpectedPattern, aActualString, aMessage); }

function pattern(aExpectedString, aActualPattern, aMessage)
{
	if (!aExpectedString.match(aActualPattern))
		fail({
		     	expectedRaw : aExpectedString,
		     	actualRaw   : aActualPattern,
		     	expected    : bundle.getFormattedString('assert_pattern_expected', [aExpectedString]),
		     	actual      : bundle.getFormattedString('assert_pattern_actual', [aActualPattern])
		     },
		     bundle.getString('assert_pattern'), aMessage);
}

function notPattern(aExpectedString, aActualPattern, aMessage)
{
	if (aExpectedString.match(aActualPattern))
		fail({
		     	expectedRaw : aExpectedString,
		     	actualRaw   : aActualPattern,
		     	expected    : bundle.getFormattedString('assert_not_pattern_expected', [aExpectedString]),
		     	actual      : bundle.getFormattedString('assert_not_pattern_actual', [aActualPattern])
		     },
		     bundle.getString('assert_not_pattern'), aMessage);
}

function arrayEquals(aExpected, aActual, aMessage) { this.equals(aExpected, aActual, aMessage); }
function arrayEqual(aExpected, aActual, aMessage) { this.arrayEquals(aExpected, aActual, aMessage); }

function inDelta(aExpected, aActual, aDelta, aMessage)
{
	if (aExpected - aDelta < aActual && aActual < aExpected + aDelta)
		return;

	fail({
	     	expectedRaw : (aExpected - aDelta)+' - '+(aExpected + aDelta),
	     	actualRaw   : aActual,
	     	expected    : bundle.getFormattedString('assert_in_delta_expected',
	     							   [appendTypeString(aExpected - aDelta),
	     								appendTypeString(aActual),
	     								appendTypeString(aExpected + aDelta),
	     								appendTypeString(aExpected),
	     								appendTypeString(aDelta)]),
	     	actual      : bundle.getFormattedString('assert_in_delta_actual',
	     							   [appendTypeString(aActual)])
	     },
		 bundle.getString('assert_in_delta'),
		 aMessage);
}

function contains(aExpected, aActual, aMessage)
{
	if ((utils.isArray(aActual) ? aActual : String(aActual) ).indexOf(aExpected) < 0)
		fail({
		     	expectedRaw : appendTypeString(aExpected),
		     	actualRaw   : appendTypeString(aActual),
		     	expected    : bundle.getFormattedString('assert_contains_expected', [appendTypeString(aExpected)]),
		     	actual      : bundle.getFormattedString('assert_contains_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_contains'),
		     aMessage);
}
function contain(aExpected, aActual, aMessage) { this.contains(aExpected, aActual, aMessage); }

function notContains(aExpected, aActual, aMessage)
{
	if ((utils.isArray(aActual) ? aActual : String(aActual) ).indexOf(aExpected) > -1)
		fail({
		     	expectedRaw : appendTypeString(aExpected),
		     	actualRaw   : appendTypeString(aActual),
		     	expected    : bundle.getFormattedString('assert_not_contains_expected', [appendTypeString(aExpected)]),
		     	actual      : bundle.getFormattedString('assert_not_contains_actual', [appendTypeString(aActual)])
		     },
		     bundle.getString('assert_not_contains'),
		     aMessage);
}
function notContain(aExpected, aActual, aMessage) { this.notContains(aExpected, aActual, aMessage); }

function finishesWithin(aExpectedTime, aTask, aContext, aMessage)
{
	var startAt = Date.now();
	if (typeof aTask == 'function') aTask = aTask.call(aContext);
	if (aTask && utils.isGeneratedIterator(aTask)) {
		return utils.doIteration(aTask, {
			onEnd : function(e)
			{
				_onFinishesWithinFinish(aExpectedTime, startAt, aMessage);
			},
			onError : function(e)
			{
				throw e;
			}
		});
	}
	else {
		_onFinishesWithinFinish(aExpectedTime, startAt, aMessage);
	}
}
function finishWithin(aExpectedTime, aTask, aContext, aMessage) { this.finishesWithin(aExpectedTime, aTask, aContext, aMessage); }
function _onFinishesWithinFinish(aExpectedTime, aStartAt, aMessage)
{
	var actualTime = Date.now() - aStartAt;
	if (actualTime <= aExpectedTime) return;

	var longExpectedTime = aExpectedTime < 1000 ?
			'' :
			bundle.getFormattedString('assert_finishes_within_expected_long', [Math.round(aExpectedTime / 1000)]) ;
	var longActualTime = actualTime < 1000 ?
			'' :
			bundle.getFormattedString('assert_finishes_within_actual_long', [Math.round(actualTime / 1000)]) ;
	fail({
	     	expected : bundle.getFormattedString('assert_finishes_within_expected', [aExpectedTime, longExpectedTime]),
	     	actual   : bundle.getFormattedString('assert_finishes_within_actual', [actualTime, longActualTime])
	     },
	     bundle.getString('assert_finishes_within'),
	     aMessage);
}

function fail()
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
		var _diff = diff.readable(error.expectedRaw, error.actualRaw);
		if (diff.isInterested(_diff)) {
			error.diff = _diff;
			if (diff.needFold(_diff)) {
				error.foldedDiff = diff.foldedReadable(error.expectedRaw,
													   error.actualRaw);
			}
		}
	}
	if (!('diff' in error)) error.diff = '';
	if (!('foldedDiff' in error)) error.foldedDiff = error.diff;
	error.message = args.reverse().join('\n');
	throw error;
}

function appendTypeString(aValue)
{
	if (aValue === null) return 'null';
	if (aValue === void(0)) return 'undefined';
	return bundle.getFormattedString('typed_value', [utils.inspect(aValue), utils.inspectType(aValue)]);
}
