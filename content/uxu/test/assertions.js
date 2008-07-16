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


function equals(x, y, aMessage) {
	if (y != x)
		fail(bundle.getFormattedString('assert_equals', appendTypeString([x, y])), aMessage);
}
function equal(x, y, aMessage) { this.equals(x, y, aMessage); }

function notEquals(x, y, aMessage) {
	if (y == x)
		fail(bundle.getFormattedString('assert_not_equals', appendTypeString([x, y])), aMessage);
}
function notEqual(x, y, aMessage) { this.notEquals(x, y, aMessage); }

function isTrue(x, aMessage) {
	if (!x)
		fail(bundle.getFormattedString('assert_is_true', appendTypeString([x])), aMessage);
}

function isDefined(x, aMessage) {
	if (x === undefined)
		fail(bundle.getFormattedString('assert_is_defined', appendTypeString([x])), aMessage);
}

function isUndefined(x, aMessage) {
	if (x !== undefined)
		fail(bundle.getFormattedString('assert_is_undefined', appendTypeString([x])), aMessage);
}

function isFalse(x, aMessage) {
	if (x)
		fail(bundle.getFormattedString('assert_is_false', appendTypeString([x])), aMessage);
}

function isNull(x, aMessage) {
	if (x !== null)
		fail(bundle.getFormattedString('assert_is_null', appendTypeString([x])), aMessage);
}

function isNotNull(x, aMessage) {
	if (x === null)
		fail(bundle.getFormattedString('assert_is_not_null', appendTypeString([x])), aMessage);
}

function raises(exception, code, context, aMessage) {
	var raised = false;
	try {
		code.call(context);
	} catch(e if e == exception) {
		raised = true;
	} catch(e if e.name == exception) {
		raised = true;
	}
	if (!raised)
		fail(bundle.getFormattedString('assert_rases', [exception]), aMessage);
}
function raise(exception, code, context, aMessage) { this.raises(exception, code, context, aMessage); }

function matches(pattern, string, aMessage) {
	if (!pattern.test(string))
		fail(bundle.getFormattedString('assert_matches', [pattern, string]), aMessage);
}
function match(pattern, string, aMessage) { this.matches(pattern, string, aMessage); }

function notMatches(pattern, string, aMessage) {
	if (pattern.test(string))
		fail(bundle.getFormattedString('assert_not_matches', [pattern, string]), aMessage);
}
function notMatch(pattern, string, aMessage) { this.notMatches(pattern, string, aMessage); }

function pattern(string, pattern, aMessage) {
	if (!(string.match(pattern)))
		fail(bundle.getFormattedString('assert_pattern', [string, pattern]), aMessage);
}

function notPattern(string, pattern, aMessage) {
	if ((string.match(pattern)))
		fail(bundle.getFormattedString('assert_not_pattern', [string, pattern]), aMessage);
}

function arrayEquals(expected, actual, aMessage) {
	try {
		equals(expected.length, actual.length);
		expected.forEach(function(aExpected, aIndex) {
			equals(aExpected.valueOf(), actual[aIndex].valueOf());
		});
	}
	catch(e if e.name == 'AssertionFailed') {
		fail(bundle.getFormattedString('assert_array_equals', [expected, actual]), aMessage);
	}
	catch(e) {
		throw e;
	}
}
function arrayEqual(expected, actual, aMessage) { this.arrayEquals(expected, actual, aMessage); }

function fail() {
	var error = new Error()
	error.name = 'AssertionFailed';
	error.message = Array.prototype.slice.call(arguments).reverse().join('\n');
	throw error;
}

function appendTypeString(aArray)
{
	return aArray.map(function(aValue) {
			return bundle.getFormattedString('typed_value', [aValue, (typeof aValue)]);
		});
}
