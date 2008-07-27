// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib = new ModuleManager(['chrome://uxu/content/lib']);
var ReadableDiffer = lib.require('class', 'readableDiffer');

function readable(aFrom, aTo)
{
	var differ = new ReadableDiffer(_splitWithLine(aFrom), _splitWithLine(aTo));
	return differ.diff().join("\n");
}

function isInterested(aDiff)
{
	if (!aDiff)
		return false;

	if (aDiff.length == 0)
		return false;

	if (!aDiff.match(/^[-+]/mg))
		return false;

	if (aDiff.match(/^[ ?]/mg))
		return true;

	if (aDiff.match(/(?:.*\n){2,}/g))
		return true;

	return false;
}

function _splitWithLine(aString)
{
	return aString.length == 0 ? [] : aString.split(/\r?\n/);
}
