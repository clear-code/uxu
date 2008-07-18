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


function equals(aExpected, aActual, aMessage)
{
	if (aActual != aExpected)
		fail(bundle.getFormattedString('assert_equals', appendTypeString([aExpected, aActual])), aMessage);
}
function equal(aExpected, aActual, aMessage) { this.equals(aExpected, aActual, aMessage); }

function notEquals(aExpected, aActual, aMessage)
{
	if (aActual == aExpected)
		fail(bundle.getFormattedString('assert_not_equals', appendTypeString([aExpected, aActual])), aMessage);
}
function notEqual(aExpected, aActual, aMessage) { this.notEquals(aExpected, aActual, aMessage); }

function isTrue(aActual, aMessage)
{
	if (!aActual)
		fail(bundle.getFormattedString('assert_is_true', appendTypeString([aActual])), aMessage);
}

function isFalse(aActual, aMessage)
{
	if (aActual)
		fail(bundle.getFormattedString('assert_is_false', appendTypeString([aActual])), aMessage);
}

function isBoolean(aActual, aMessage)
{
	if (typeof aActual != 'boolean')
		fail(bundle.getFormattedString('assert_is_boolean', appendTypeString([aActual])), aMessage);
}

function isNotBoolean(aActual, aMessage)
{
	if (typeof aActual == 'boolean')
		fail(bundle.getFormattedString('assert_is_not_boolean', appendTypeString([aActual])), aMessage);
}

function isString(aActual, aMessage)
{
	if (typeof aActual != 'string')
		fail(bundle.getFormattedString('assert_is_string', appendTypeString([aActual])), aMessage);
}

function isNotString(aActual, aMessage)
{
	if (typeof aActual == 'string')
		fail(bundle.getFormattedString('assert_is_not_string', appendTypeString([aActual])), aMessage);
}

function isNumber(aActual, aMessage)
{
	if (typeof aActual != 'number')
		fail(bundle.getFormattedString('assert_is_number', appendTypeString([aActual])), aMessage);
}

function isNotNumber(aActual, aMessage)
{
	if (typeof aActual == 'number')
		fail(bundle.getFormattedString('assert_is_not_number', appendTypeString([aActual])), aMessage);
}

function isFunction(aActual, aMessage)
{
	if (typeof aActual != 'function')
		fail(bundle.getFormattedString('assert_is_function', appendTypeString([aActual])), aMessage);
}

function isNotFunction(aActual, aMessage)
{
	if (typeof aActual == 'function')
		fail(bundle.getFormattedString('assert_is_not_function', appendTypeString([aActual])), aMessage);
}

function isDefined(aActual, aMessage)
{
	if (aActual === undefined)
		fail(bundle.getFormattedString('assert_is_defined', appendTypeString([aActual])), aMessage);
}

function isUndefined(aActual, aMessage)
{
	if (aActual !== undefined)
		fail(bundle.getFormattedString('assert_is_undefined', appendTypeString([aActual])), aMessage);
}

function isNull(aActual, aMessage)
{
	if (aActual !== null)
		fail(bundle.getFormattedString('assert_is_null', appendTypeString([aActual])), aMessage);
}

function isNotNull(aActual, aMessage)
{
	if (aActual === null)
		fail(bundle.getFormattedString('assert_is_not_null', appendTypeString([aActual])), aMessage);
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
		fail(bundle.getFormattedString('assert_raises', [aExpectedException]), aMessage);
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
		fail(bundle.getFormattedString('assert_not_raises', [aExpectedException, exception]), aMessage);
}
function notRaise(aExpectedException, aFunction, aContext, aMessage) { this.notRaises(aExpectedException, aFunction, aContext, aMessage); }

function matches(aExpectedPattern, aActualString, aMessage)
{
	if (!aActualString.match(aExpectedPattern))
		fail(bundle.getFormattedString('assert_matches', [aExpectedPattern, aActualString]), aMessage);
}
function match(aExpectedPattern, aActualString, aMessage) { this.matches(aExpectedPattern, aActualString, aMessage); }

function notMatches(aExpectedPattern, aActualString, aMessage)
{
	if (aActualString.match(aExpectedPattern))
		fail(bundle.getFormattedString('assert_not_matches', [aExpectedPattern, aActualString]), aMessage);
}
function notMatch(aExpectedPattern, aActualString, aMessage) { this.notMatches(aExpectedPattern, aActualString, aMessage); }

function pattern(aExpectedString, aActualPattern, aMessage)
{
	if (!aExpectedString.match(aActualPattern))
		fail(bundle.getFormattedString('assert_pattern', [aExpectedString, aActualPattern]), aMessage);
}

function notPattern(aExpectedString, aActualPattern, aMessage)
{
	if (aExpectedString.match(aActualPattern))
		fail(bundle.getFormattedString('assert_not_pattern', [aExpectedString, aActualPattern]), aMessage);
}

function arrayEquals(aExpected, aActual, aMessage)
{
	try {
		equals(aExpected.length, aActual.length);
		aExpected.forEach(function(aExpected, aIndex) {
			equals(aExpected.valueOf(), aActual[aIndex].valueOf());
		});
	}
	catch(e if e.name == 'AssertionFailed') {
		fail(bundle.getFormattedString('assert_array_equals', [aExpected, aActual]), aMessage);
	}
	catch(e) {
		throw e;
	}
}
function arrayEqual(aExpected, aActual, aMessage) { this.arrayEquals(aExpected, aActual, aMessage); }

function fail()
{
	var error = new Error()
	error.name = 'AssertionFailed';
	error.message = Array.slice(arguments).reverse().join('\n');
	throw error;
}

function appendTypeString(aArray)
{
	return aArray.map(function(aValue) {
			if (aValue === null) return 'null'
			if (aValue === void(0)) return 'undefined'
			return bundle.getFormattedString('typed_value', [aValue, (typeof aValue)]);
		});
}
