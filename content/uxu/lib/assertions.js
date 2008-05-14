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

var module = new ModuleManager(['chrome://uxu/content/lib']);
var bundle = module.require('package', 'bundle');


function equals(x, y) {
    if(y != x)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_equals', [x, y]),
            Components.stack.caller);
}

function notEquals(x, y) {
    if(y == x)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_not_equals', [x, y]),
            Components.stack.caller);
}

function isTrue(x) {
    if(!x)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_is_true', [x]),
            Components.stack.caller);
}

function isDefined(x) {
    if(x == null ||
       x == undefined)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_is_defined', [x]),
            Components.stack.caller);
}

function isUndefined(x) {
    if(x != undefined)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_is_undefined', [x]),
            Components.stack.caller);
}

function isFalse(x) {
    if(x)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_is_false', [x]),
            Components.stack.caller);
}

function isNull(x) {
    if(x != null)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_is_null', [x]),
            Components.stack.caller);
}

function raises(exception, code, context) {
    var raised = false;
    try {
        code.call(context);
    } catch(e if e == exception) {
        raised = true;
    } catch(e if e.name == exception) {
        raised = true;
    }
    if(!raised)
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_rases', [exception]),
            Components.stack.caller);
}

function matches(pattern, string) {
    if(!(string.match(pattern)))
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_matches', [pattern, string]),
            Components.stack.caller);
}

function pattern(string, pattern) {
    if(!(string.match(pattern)))
        throw createAssertionFailedError(
        	bundle.getFormattedString('assert_pattern', [string, pattern]),
            Components.stack.caller);
}

function fail(message) {
    throw createAssertionFailedError(message, Components.stack.caller);
}

function createAssertionFailedError(message, caller) {
	var error = new Error()
	error.name = 'AssertionFailed';
	error.message = message;
//	error.stack += '()@' + caller.filename + ':' + caller.lineNumber + '\n';
	return error;
}
