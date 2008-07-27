// -*- indent-tabs-mode: t; tab-width: 4 -*-

function constructor(aFrom, aTo, aJunkPredicate)
{
    this.from = aFrom;
    this.to = aTo;
    this.junkPredicate = aJunkPredicate;
    this._updateToIndexes();
}

function longestMatch(aFromStart, aFromEnd, aToStart, aToEnd)
{
    var bestInfo, haveJunk = false;

    bestInfo = this._findBestMatchPosition(aFromStart, aFromEnd,
                                           aToStart, aToEnd);
    for (var x in this.junks) {
        haveJunk = true;
        break;
    }

    if (haveJunk) {
        var adjust = this._adjustBestInfoWithJunkPredicate;
        var args = [aFromStart, aFromEnd, aToStart, aToEnd];

        bestInfo = adjust.apply(this, [false, bestInfo].concat(args));
        bestInfo = adjust.apply(this, [true, bestInfo].concat(args));
    }

    return bestInfo;
}

function matches() {
    if (!this._matches)
        this._matches = this._computeMatches();
    return this._matches;
}

function blocks() {
    if (!this._blocks)
        this._blocks = this._computeBlocks();
    return this._blocks;
}

function operations() {
    if (!this._operations)
        this._operations = this._computeOperations();
    return this._operations;
}

function groupedOperations(aContextSize)
{
	var _this = this;
	var _operations;
	var groupWindow, groups, group;

	if (!aContextSize)
		aContextSize = 3;

	_operations = this.operations();
	if (_operations.length == 0)
		_operations = [["equal", 0, 0, 0, 0]];
	_operations = this._expandEdgeEqualOperations(_operations, aContextSize);

	groupWindow = aContextSize * 2;
	groups = [];
	group = [];
	_operations.forEach(function (aOperation) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];

		if (tag == "equal" && fromEnd - fromStart > groupWindow) {
			group.push([tag,
                        fromStart,
                        Math.min(fromEnd, fromStart + aContextSize),
                        toStart,
                        Math.min(toEnd, toStart + aContextSize)]);
			groups.push(group);
			group = [];
			fromStart = Math.max(fromStart, fromEnd - aContextSize);
			toStart = Math.max(toStart, toEnd - aContextSize);
		}
		group.push([tag, fromStart, fromEnd, toStart, toEnd]);
	});

	if (group.length > 0)
		groups.push(group);

	return groups;
}

function ratio() {
    if (!this._ratio)
        this._ratio = this._computeRatio();
    return this._ratio;
}

function _updateToIndexes()
{
    var i, length;

    this.toIndexes = {};
    this.junks = {};

    length = this.to.length;
    for (i = 0; i < length; i++) {
        var item = this.to[i];

        if (!this.toIndexes[item])
            this.toIndexes[item] = [];
        this.toIndexes[item].push(i);
    }

    if (!this.junkPredicate)
        return;

    var item;
    var toIndexesWithoutJunk = {};
    for (item in this.toIndexes) {
        if (this.junkPredicate(item)) {
            this.junks[item] = true;
        } else {
            toIndexesWithoutJunk[item] = this.toIndexes[item];
        }
    }
    this.toIndexes = toIndexesWithoutJunk;
}

function _findBestMatchPosition(aFromStart, aFromEnd, aToStart, aToEnd)
{
    var bestFrom = aFromStart;
    var bestTo = aToStart;
    var bestSize = 0;
    var sizes = {};
    var fromIndex;

    for (fromIndex = aFromStart; fromIndex <= aFromEnd; fromIndex++) {
        var _sizes = {};
        var i, length;
        var toIndexes;

        toIndexes = this.toIndexes[this.from[fromIndex]] || [];
        length = toIndexes.length;
        for (i = 0; i < length; i++) {
            var size;
            var toIndex = toIndexes[i];

            if (toIndex < aToStart)
                continue;
            if (toIndex > aToEnd)
                break;

            size = _sizes[toIndex] = (sizes[toIndex - 1] || 0) + 1;
            if (size > bestSize) {
                bestFrom = fromIndex - size + 1;
                bestTo = toIndex - size + 1;
                bestSize = size;
            }
        }
        sizes = _sizes;
    }

    return [bestFrom, bestTo, bestSize];
}

function _adjustBestInfoWithJunkPredicate(aShouldJunk, aBestInfo,
                                          aFromStart, aFromEnd,
                                          aToStart, aToEnd)
{
    var bestFrom, bestTo, bestSize;

    bestFrom = aBestInfo[0];
    bestTo = aBestInfo[1];
    bestSize = aBestInfo[2];

    while (bestFrom > aFromStart &&
           bestTo > aToStart &&
           (aShouldJunk ?
            this.junks[this.to[bestTo - 1]] :
            !this.junks[this.to[bestTo - 1]]) &&
           this.from[bestFrom - 1] == this.to[bestTo - 1]) {
        bestFrom -= 1;
        bestTo -= 1;
        bestSize += 1;
    }

    while (bestFrom + bestSize < aFromEnd &&
           bestTo + bestSize < aToEnd &&
           (aShouldJunk ?
            this.junks[this.to[bestTo + bestSize]] :
            !this.junks[this.to[bestTo + bestSize]]) &&
           this.from[bestFrom + bestSize] == this.to[bestTo + bestSize]) {
        bestSize += 1;
    }

    return [bestFrom, bestTo, bestSize];
}

function _computeMatches()
{
    var _matches = [];
    var queue = [[0, this.from.length, 0, this.to.length]];

    while (queue.length > 0) {
        var target = queue.pop();
        var fromStart = target[0];
        var fromEnd = target[1];
        var toStart = target[2];
        var toEnd = target[3];
        var match, matchFromIndex, matchToIndex, size;

        match = this.longestMatch(fromStart, fromEnd - 1, toStart, toEnd - 1);
        matchFromIndex = match[0];
        matchToIndex = match[1];
        size = match[2];
        if (size > 0) {
            if (fromStart < matchFromIndex && toStart < matchToIndex)
                queue.push([fromStart, matchFromIndex, toStart, matchToIndex]);

            _matches.push(match);
            if (matchFromIndex + size < fromEnd && matchToIndex + size < toEnd)
                queue.push([matchFromIndex + size, fromEnd,
                            matchToIndex + size, toEnd]);
        }
    }

    _matches.sort(function (aMatchInfo1, aMatchInfo2) {
		var fromIndex1 = aMatchInfo1[0];
		var fromIndex2 = aMatchInfo2[0];
		return fromIndex1 - fromIndex2;
	});
    return _matches;
}

function _computeBlocks()
{
    var _blocks = [];
    var currentFromIndex = 0;
    var currentToIndex = 0;
    var currentSize = 0;

    this.matches().forEach(function (aMatch) {
		var fromIndex = aMatch[0];
		var toIndex = aMatch[1];
		var size = aMatch[2];

		if (currentFromIndex + currentSize == fromIndex &&
			currentToIndex + currentSize == toIndex) {
			currentSize += size;
		} else {
			if (currentSize > 0)
				_blocks.push([currentFromIndex, currentToIndex, currentSize]);
			currentFromIndex = fromIndex;
			currentToIndex = toIndex;
			currentSize = size;
		}
    });

	if (currentSize > 0)
		_blocks.push([currentFromIndex, currentToIndex, currentSize]);

    _blocks.push([this.from.length, this.to.length, 0]);
    return _blocks;
}

function _computeOperations()
{
	var fromIndex = 0;
	var toIndex = 0;
	var _operations = [];

	var _this = this;
	this.blocks().forEach(function (aBlock) {
		var matchFromIndex = aBlock[0];
		var matchToIndex = aBlock[1];
		var size = aBlock[2];
		var tag;

		tag = _this._determineTag(fromIndex, toIndex,
								  matchFromIndex, matchToIndex);
		if (tag != "equal")
			_operations.push([tag,
							  fromIndex, matchFromIndex,
							  toIndex, matchToIndex]);

		fromIndex = matchFromIndex + size;
		toIndex = matchToIndex + size;

		if (size > 0)
			_operations.push(["equal",
							  matchFromIndex, fromIndex,
							  matchToIndex, toIndex]);
	});

	return _operations;
}

function _determineTag(aFromIndex, aToIndex,
					   aMatchFromIndex, aMatchToIndex)
{
	if (aFromIndex < aMatchFromIndex && aToIndex < aMatchToIndex) {
		return "replace";
	} else if (aFromIndex < aMatchFromIndex) {
		return "delete";
	} else if (aToIndex < aMatchToIndex) {
		return "insert";
	} else {
		return "equal";
	}
}

function _expandEdgeEqualOperations(aOperations, aContextSize)
{
	var _operations = [];

	var _this = this;
	aOperations.forEach(function (aOperation, aIndex) {
		var tag = aOperation[0];
		var fromStart = aOperation[1];
		var fromEnd = aOperation[2];
		var toStart = aOperation[3];
		var toEnd = aOperation[4];

		if (tag == "equal" && aIndex == 0) {
			_operations.push([tag,
							  Math.max(fromStart, fromEnd - aContextSize),
                              fromEnd,
                              Math.max(toStart, toEnd - aContextSize),
                              toEnd]);
		} else if (tag == "equal" && aIndex == aOperations.length - 1) {
			_operations.push([tag,
							  fromStart,
							  Math.min(fromEnd, fromStart + aContextSize),
							  toStart,
                              Math.min(toEnd, toStart + aContextSize),
                              toEnd]);
		} else {
			_operations.push(aOperation);
		}
	});

	return _operations;
}

function _computeRatio()
{
	var length = this.from.length + this.to.length;

	if (length == 0)
		return 1.0;

	var _matches = 0;
	this.blocks().forEach(function (aBlock) {
		var size = aBlock[2];
		_matches += size;
	});
	return 2.0 * _matches / length;
}
