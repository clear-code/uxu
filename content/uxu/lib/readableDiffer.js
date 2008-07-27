// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib = new ModuleManager(['chrome://uxu/content/lib']);
var SequenceMatcher = lib.require('class', 'sequenceMatcher');

function constructor(aFrom, aTo)
{
    this.from = aFrom;
    this.to = aTo;
}

function diff()
{
    var result = [];
    var matcher = new SequenceMatcher(this.from, this.to);

    var _this = this;
    matcher.operations().forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];
		var target;

		switch (tag) {
			case "replace":
				target = _this._diffLines(fromStart, fromEnd, toStart, toEnd);
				result = result.concat(target);
				break;
			case "delete":
				target = _this.from.slice(fromStart, fromEnd);
				result = result.concat(_this._tagDeleted(target));
				break;
			case "insert":
				target = _this.to.slice(toStart, toEnd);
				result = result.concat(_this._tagInserted(target));
				break;
			case "equal":
				target = _this.from.slice(fromStart, fromEnd);
				result = result.concat(_this._tagEqual(target));
				break;
			default:
				throw "unknown tag: " + tag;
				break;
		}
	});

	return result;
}

function _tag(aMark, aContents)
{
	return aContents.map(function (aContent) {return aMark + aContent});
}

function _tagDeleted(aContents)
{
	return this._tag("- ", aContents);
}

function _tagInserted(aContents)
{
	return this._tag("+ ", aContents);
}

function _tagEqual(aContents)
{
	return this._tag("  ", aContents);
}

function _tagDifference(aContents)
{
	return this._tag("? ", aContents);
}

function _findDiffLineInfo(aFromStart, aFromEnd, aToStart, aToEnd)
{
	var bestRatio = 0.74;
	var fromEqualIndex, toEqualIndex;
	var fromBestIndex, toBestIndex;
	var toIndex;

	for (toIndex = aToStart; toIndex < aToEnd; toIndex++) {
		var fromIndex;
		for (fromIndex = aFromStart; fromIndex < aFromEnd; fromIndex++) {
			var matcher;

			if (this.from[fromIndex] == this.to[toIndex]) {
				if (fromEqualIndex === undefined)
					fromEqualIndex = fromIndex;
				if (toEqualIndex === undefined)
					toEqualIndex = toIndex;
				continue;
			}

			matcher = new SequenceMatcher(this.from[fromIndex],
										  this.to[toIndex],
										  this._isSpaceCharacter);
			if (matcher.ratio() > bestRatio) {
                bestRatio = matcher.ratio();
                fromBestIndex = fromIndex;
                toBestIndex = toIndex;
			}
		}
	}

	return [bestRatio,
			fromEqualIndex, toEqualIndex,
			fromBestIndex, toBestIndex];
}

function _diffLines(aFromStart, aFromEnd, aToStart, aToEnd)
{
	var cutOff = 0.75;
	var info = this._findDiffLineInfo(aFromStart, aFromEnd, aToStart, aToEnd);
	var bestRatio = info[0];
	var fromEqualIndex = info[1];
	var toEqualIndex = info[2];
	var fromBestIndex = info[3];
	var toBestIndex = info[4];

	if (bestRatio < cutOff) {
		if (fromEqualIndex === undefined) {
			var taggedFrom, taggedTo;

			taggedFrom = this._tagDeleted(this.from.slice(aFromStart, aFromEnd));
			taggedTo = this._tagInserted(this.to.slice(aToStart, aToEnd));
			if (aToEnd - aToStart < aFromEnd - aFromStart)
                return taggedTo.concat(taggedFrom);
			else
                return taggedFrom.concat(taggedTo);
		}

		fromBestIndex = fromEqualIndex;
		toBestIndex = toEqualIndex;
		bestRatio = 1.0;
	}

	return [].concat(this.__diffLines(aFromStart, fromBestIndex,
									  aToStart, toBestIndex),
					 this._diffLine(this.from[fromBestIndex],
									this.to[toBestIndex]),
					 this.__diffLines(fromBestIndex + 1, aFromEnd,
									  toBestIndex + 1, aToEnd));
}

function __diffLines(aFromStart, aFromEnd, aToStart, aToEnd)
{
	if (aFromStart < aFromEnd) {
		if (aToStart < aToEnd) {
			return this._diffLines(aFromStart, aFromEnd, aToStart, aToEnd);
		} else {
			return this._tagDeleted(this.from.slice(aFromStart, aFromEnd));
		}
	} else {
		return this._tagInserted(this.to.slice(aToStart, aToEnd));
	}
}

function _diffLine(aFromLine, aToLine)
{
	var fromTags = "";
	var toTags = "";
	var matcher = new SequenceMatcher(aFromLine, aToLine,
									  this._isSpaceCharacter);

	var _this = this;
	matcher.operations().forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];
		var fromLength, toLength;

		fromLength = fromEnd - fromStart;
		toLength = toEnd - toStart;
		switch (tag) {
			case "replace":
				fromTags += _this._repeat("^", fromLength);
				toTags += _this._repeat("^", toLength);
				break;
			case "delete":
            	fromTags += _this._repeat("-", fromLength);
				break;
			case "insert":
            	toTags += _this._repeat("+", toLength);
				break;
			case "equal":
				fromTags += _this._repeat(" ", fromLength);
				toTags += _this._repeat(" ", toLength);
				break;
            default:
				throw "unknown tag: " + tag;
				break;
		}
	});

	return this._formatDiffPoint(aFromLine, aToLine, fromTags, toTags);
}

function _formatDiffPoint(aFromLine, aToLine, aFromTags, aToTags)
{
	var common;
	var result;
	var fromTags, toTags;

	common = Math.min(this._nLeadingCharacters(aFromLine, "\t"),
					  this._nLeadingCharacters(aToLine, "\t"));
	common = Math.min(common,
					  this._nLeadingCharacters(aFromTags.substr(0, common),
											   " "));
	fromTags = aFromTags.substr(common).replace(/\s*$/, '');
	toTags = aToTags.substr(common).replace(/\s*$/, '');

	result = this._tagDeleted([aFromLine]);
	if (fromTags.length > 0) {
		fromTags = this._repeat("\t", common) + fromTags;
		result = result.concat(this._tagDifference([fromTags]));
	}
	result = result.concat(this._tagInserted([aToLine]));
	if (toTags.length > 0) {
		toTags = this._repeat("\t", common) + toTags;
		result = result.concat(this._tagDifference([toTags]));
	}

	return result;
}

function _nLeadingCharacters(aString, aCharacter)
{
	var n = 0;
	while (aString[n] == aCharacter) {
		n++;
	}
	return n;
}

function _isSpaceCharacter(aCharacter)
{
	return aCharacter == " " || aCharacter == "\t";
}

function _repeat(aString, n)
{
	var result = "";

	for (; n > 0; n--) {
		result += aString;
	}

	return result;
}
