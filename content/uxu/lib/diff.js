// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib = new ModuleManager(['chrome://uxu/content/lib']);
var ReadableDiffer = lib.require('class', 'readableDiffer');

function readable(aFrom, aTo)
{
	var differ = new ReadableDiffer(_splitWithLine(aFrom), _splitWithLine(aTo));
	return differ.diff().join("\n");
}

function foldedReadable(aFrom, aTo)
{
	var differ = new ReadableDiffer(_splitWithLine(_fold(aFrom)),
									_splitWithLine(_fold(aTo)));
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

function needFold(aDiff)
{
	if (!aDiff)
		return false;

	if (aDiff.match(/^[-+].{79}/mg))
		return true;

	return false;
}

function _splitWithLine(aString)
{
	return aString.length == 0 ? [] : aString.split(/\r?\n/);
}

function _fold(aString)
{
	var foldedLines = aString.split("\n").map(function (aLine) {
		return aLine.replace(/(.{78})/g, "$1\n");
	});
	return foldedLines.join("\n");
}
