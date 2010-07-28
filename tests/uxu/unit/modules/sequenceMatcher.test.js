// -*- indent-tabs-mode: t; tab-width: 4 -*-

var topDir = baseURL+'../../../../';

var SequenceMatcher;

function setUp()
{
    var ns = {};
    utils.include(topDir+'modules/diff.js', ns);
    SequenceMatcher = ns.SequenceMatcher;
}

function testToIndexes()
{
    assertToIndexes({"abc def": [0, 2], "abc": [1]},
                    ["abc def", "abc", "abc def"]);

    assertToIndexes({a: [0, 3], b: [1], c: [2], d: [4]},
                    "abcad");

    assertToIndexes({
				"1": [0, 35],
				"t": [2, 5, 16],
				"e": [3, 14, 31, 38],
				"s": [4, 6, 12, 13, 20, 32, 44],
				",": [7, 21, 33],
				"0": [9, 23],
				"a": [11, 26],
				"r": [15, 30],
				"i": [17, 27, 41],
				"o": [18],
				"n": [19, 39, 42],
				"f": [25],
				"l": [28],
				"u": [29],
				"p": [37],
				"d": [40],
				"g": [43],
				},
        "1 tests, 0 assertions, 0 failures, 1 pendings",
        function (aChar) {return aChar == " "});
}

function testLongestMatch()
{
    assertLongestMatch([0, 1, 3],
					   ["b", "c", "d"], ["a", "b", "c", "d", "x", "y", "z"],
					   0, 2, 0, 7);
    assertLongestMatch([1, 2, 2],
					   ["b", "c", "d"], ["a", "b", "c", "d", "x", "y", "z"],
					   1, 2, 0, 6);
    assertLongestMatch([0, 0, 0],
					   ["a", "b"], ["c"],
					   0, 1, 0, 0);
    assertLongestMatch([1, 0, 2],
					   ["q", "a", "b", "x", "c", "d"],
					   ["a", "b", "y", "c", "d", "f"],
					   0, 5, 0, 5);
    assertLongestMatch([4, 3, 2],
					   ["q", "a", "b", "x", "c", "d"],
					   ["a", "b", "y", "c", "d", "f"],
					   3, 5, 2, 5);

    assertLongestMatch([1, 0, 2], "qabxcd", "abycdf", 0, 5, 0, 5);
    assertLongestMatch([0, 0, 1], "efg", "eg", 0, 2, 0, 1);
    assertLongestMatch([2, 1, 1], "efg", "eg", 1, 2, 1, 1);
}

function testLongestMatchWithJunkPredicate()
{
    assertLongestMatch([0, 4, 5], " abcd", "abcd abcd", 0, 4, 0, 8);
    assertLongestMatch([1, 0, 4], " abcd", "abcd abcd", 0, 4, 0, 8,
					   function (aChar) {return aChar == ' ';});
}

function testMatches()
{
    assertMatches([[0, 0, 2],
				   [3, 2, 2]],
				  ["a", "b", "x", "c", "d"], ["a", "b", "c", "d"]);
    assertMatches([[1, 0, 2],
				   [4, 3, 2]],
				  ["q", "a", "b", "x", "c", "d"],
				  ["a", "b", "y", "c", "d", "f"]);

    assertMatches([[1, 0, 2],
				   [4, 3, 2]],
				  "qabxcd", "abycdf");
    assertMatches([[0, 0, 1],
				   [2, 1, 1]],
				  "efg", "eg");
}

function testMatchesWithJunkPredicate()
{
    assertMatches([[0, 0, 23],
				   [24, 24, 11],
				   [36, 36, 9]],
                  "1 tests, 0 assertions, 1 failures, 0 pendings",
                  "1 tests, 0 assertions, 0 failures, 1 pendings");

    assertMatches([[0, 0, 1],
				   [1, 1, 8],
				   [9, 9, 1],
				   [10, 10, 13],
				   [24, 24, 11],
				   [36, 36, 9]],
                  "1 tests, 0 assertions, 1 failures, 0 pendings",
                  "1 tests, 0 assertions, 0 failures, 1 pendings",
				  function (aChar) {return aChar == " "});
}

function testBlocks()
{
    assertBlocks([[0, 0, 2],
				  [3, 2, 2],
				  [5, 4, 0]],
				 ["a", "b", "x", "c", "d"], ["a", "b", "c", "d"]);
    assertBlocks([[1, 0, 2],
				  [4, 3, 2],
				  [6, 6, 0]],
				 ["q", "a", "b", "x", "c", "d"], ["a", "b", "y", "c", "d", "f"]);

    assertBlocks([[1, 0, 2],
				  [4, 3, 2],
				  [6, 6, 0]],
				 "qabxcd", "abycdf");
    assertBlocks([[0, 0, 1],
				  [2, 1, 1],
				  [3, 2, 0]],
				 "efg", "eg");
}

function testBlocksWithJunkPredicate()
{
    assertBlocks([[0, 0, 23],
				  [24, 24, 11],
				  [36, 36, 9],
				  [45, 45, 0]],
				 "1 tests, 0 assertions, 1 failures, 0 pendings",
				 "1 tests, 0 assertions, 0 failures, 1 pendings",
				 function (aChar) {return aChar == " "});
}

function testOperations()
{
    assertOperations([], [], []);

    assertOperations([["delete", 0, 1, 0, 0],
                       ["equal", 1, 3, 0, 2],
                       ["replace", 3, 4, 2, 3],
                       ["equal", 4, 6, 3, 5],
                       ["insert", 6, 6, 5, 6]],
                      ["q", "a", "b", "x", "c", "d"],
					  ["a", "b", "y", "c", "d", "f"]);

    assertOperations([["delete", 0, 1, 0, 0],
                       ["equal", 1, 3, 0, 2],
                       ["replace", 3, 4, 2, 3],
                       ["equal", 4, 6, 3, 5],
                       ["insert", 6, 6, 5, 6]],
                      "qabxcd", "abycdf");

    assertOperations([["equal", 0, 23, 0, 23],
                       ["replace", 23, 24, 23, 24],
                       ["equal", 24, 35, 24, 35],
                       ["replace", 35, 36, 35, 36],
                       ["equal", 36, 45, 36, 45]],
                      "1 tests, 0 assertions, 1 failures, 0 pendings",
                      "1 tests, 0 assertions, 0 failures, 1 pendings");

    assertOperations([["equal", 0, 23, 0, 23],
                       ["replace", 23, 24, 23, 24],
                       ["equal", 24, 35, 24, 35],
                       ["replace", 35, 36, 35, 36],
                       ["equal", 36, 45, 36, 45]],
                      "1 tests, 0 assertions, 1 failures, 0 pendings",
                      "1 tests, 0 assertions, 0 failures, 1 pendings",
					  function (aChar) {return aChar == " "});
}

function testGroupedOperations()
{
    assertGroupedOperations([[["equal", 0, 0, 0, 0]]],
							[],
							[]);

    assertGroupedOperations([[["equal", 0, 3, 0, 3]]],
							["a", "b", "c"],
							["a", "b", "c"]);

    assertGroupedOperations([[["equal", 0, 1, 0, 1],
							  ["replace", 1, 2, 1, 2],
							  ["equal", 2, 5, 2, 5]],
							 [["equal", 8, 11, 8, 11],
							  ["replace", 11, 12, 11, 12],
							  ["equal", 12, 13, 12, 13],
							  ["delete", 13, 16, 13, 13],
							  ["equal", 16, 17, 13, 14],
							  ["replace", 17, 18, 14, 15],
							  ["equal", 18, 20, 15, 17]]],
							["1", "2", "3", "4", "5", "6", "7", "8", "9",
							 "a", "b", "c", "d", "e", "f", "g", "h", "i",
							 "j", "k"],
							["1", "i", "3", "4", "5", "6", "7", "8", "9",
							 "a", "b", "cX", "d", "h", "iX", "j", "k"]);
}

function testRatio()
{
    assertRatio(0.75, "abcd", "bcde");
    assertRatio(0.80, "efg", "eg");
}

function assertToIndexes(aExpected, aTo, aJunkPredicate)
{
    matcher = new SequenceMatcher([""], aTo, aJunkPredicate);
    assertEquals(aExpected, matcher.toIndexes);
}

function assertLongestMatch(aExpected, aFrom, aTo,
							aFromStart, aFromEnd, aToStart, aToEnd,
							aJunkPredicate)
{
    matcher = new SequenceMatcher(aFrom, aTo, aJunkPredicate);
    assertEquals(aExpected,
				 matcher.longestMatch(aFromStart, aFromEnd, aToStart, aToEnd));
}

function assertMatches(aExpected, aFrom, aTo, aJunkPredicate)
{
    matcher = new SequenceMatcher(aFrom, aTo, aJunkPredicate);
    assertEquals(aExpected, matcher.matches());
}

function assertBlocks(aExpected, aFrom, aTo, aJunkPredicate)
{
    matcher = new SequenceMatcher(aFrom, aTo, aJunkPredicate);
    assertEquals(aExpected, matcher.blocks());
}

function assertOperations(aExpected, aFrom, aTo, aJunkPredicate)
{
    matcher = new SequenceMatcher(aFrom, aTo, aJunkPredicate);
    assertEquals(aExpected, matcher.operations());
}

function assertGroupedOperations(aExpected, aFrom, aTo)
{
    matcher = new SequenceMatcher(aFrom, aTo);
    assertEquals(aExpected, matcher.groupedOperations());
}

function assertRatio(aExpected, aFrom, aTo)
{
    matcher = new SequenceMatcher(aFrom, aTo);
    assertInDelta(aExpected, matcher.ratio(), 0.001);
}
