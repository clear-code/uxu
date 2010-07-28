// -*- indent-tabs-mode: t; tab-width: 4 -*-

var topDir = baseURL+'../../../../';

var ns = {};
[
	topDir+'modules/diff.js'
].forEach(function(aURI) {
	utils.include({
		uri                    : aURI,
		encoding               : 'Shift_JIS',
		allowOverrideConstants : true,
		namespace              : ns
	});
}, this);
var ReadableDiffer = ns.ReadableDiffer;

function setUp()
{
}

function testDiffLines()
{
    assertDiffLines(["- ddd",
                     "- efg",
                     "?  -",
                     "+ eg"],
                    ['<span class="line deleted">'+
                       'ddd'+
                     '</span>',
                     '<span class="line replaced">'+
                       'e'+
                       '<span class="phrase deleted">f</span>'+
                       'g'+
                     '</span>'],
                    ["aaa", "bbb", "ccc", "ddd", "efg"],
                    ["aaa", "BbB", "ccc", "eg"],
                    3, 5, 3, 4);
}

function testDiffLine()
{
    assertDiffLine(["- abcDefghiJkl",
                    "?    ^  ^  ^",
                    "+ abcdefGhijkl",
                    "?    ^  ^  ^"],
                   ['<span class="line replaced includes-both-modification">'+
                      'abc'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">D</span>'+
                      '<span class="phrase inserted">d</span>'+
                      '</span>'+
                      'ef'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">g</span>'+
                      '<span class="phrase inserted">G</span>'+
                      '</span>'+
                      'hi'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">J</span>'+
                      '<span class="phrase inserted">j</span>'+
                      '</span>'+
                      'kl'+
                    '</span>'],
                   "abcDefghiJkl",
                   "abcdefGhijkl");

    assertDiffLine(["- bcDefghiJklx",
                    "?   ^  ^  ^  -",
                    "+ abcdefGhijkl",
                    "? +  ^  ^  ^"],
                   ['<span class="line replaced includes-both-modification">'+
                      '<span class="phrase inserted">a</span>'+
                      'bc'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">D</span>'+
                      '<span class="phrase inserted">d</span>'+
                      '</span>'+
                      'ef'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">g</span>'+
                      '<span class="phrase inserted">G</span>'+
                      '</span>'+
                      'hi'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">J</span>'+
                      '<span class="phrase inserted">j</span>'+
                      '</span>'+
                      'kl'+
                      '<span class="phrase deleted">x</span>'+
                    '</span>'],
                   "bcDefghiJklx",
                   "abcdefGhijkl");

    assertDiffLine(["- abcDefghijkl",
                    "?    ^ ^",
                    "+ abcdeFghijkl",
                    "?    ^ ^"],
                   ['<span class="line replaced includes-both-modification">'+
                      'abc'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">D</span>'+
                      '<span class="phrase inserted">d</span>'+
                      '</span>'+
                      '<span class="phrase equal">'+
                      '<span class="phrase duplicated">e</span>'+
                      '<span class="phrase duplicated">e</span>'+
                      '</span>'+
                      '<span class="phrase replaced">'+
                      '<span class="phrase deleted">f</span>'+
                      '<span class="phrase inserted">F</span>'+
                      '</span>'+
                      'ghijkl'+
                    '</span>'],
                   "abcDefghijkl",
                   "abcdeFghijkl");

}

function testEmptyDiffLine()
{
    assertDiffLine(["- ",
                    "+ "],
                   ['<span class="line replaced">'+
                    '</span>'],
                   "", "");
}

function testFormatDiffPointe()
{
    assertFormatDiffPoint(["- \tabcDefghiJkl",
                           "? \t ^ ^  ^",
                           "+ \t\tabcdefGhijkl",
                           "? \t  ^ ^  ^"],
                          "\tabcDefghiJkl",
                          "\t\tabcdefGhijkl",
                          "  ^ ^  ^      ",
                          "+  ^ ^  ^      ");

    assertFormatDiffPoint(["- efg",
                           "?  ^",
                           "+ eg"],
                          "efg",
                          "eg",
                          " ^",
                          "");
}

function testSameContents()
{
    assertReadableDiff("  aaa",
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'aaa'+
                         '</span>'+
                       '</span>',
                       ["aaa"],
                       ["aaa"]);
    assertReadableDiff("  aaa\n" +
                       "  bbb",
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'aaa'+
                         '</span>'+
                         '<span class="line equal">'+
                           'bbb'+
                         '</span>'+
                       '</span>',
                       ["aaa", "bbb"],
                       ["aaa", "bbb"]);
}

function testDeleted()
{
    assertReadableDiff("  aaa\n" +
                       "- bbb",
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'aaa'+
                         '</span>'+
                       '</span>'+
                       '<span class="block deleted">'+
                         '<span class="line deleted">'+
                           'bbb'+
                         '</span>'+
                       '</span>',
                       ["aaa", "bbb"], ["aaa"]);
    assertReadableDiff("  aaa\n" +
                       "- bbb\n" +
                       "- ccc\n" +
                       "- ddd",
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'aaa'+
                         '</span>'+
                       '</span>'+
                       '<span class="block deleted">'+
                         '<span class="line deleted">'+
                           'bbb'+
                         '</span>'+
                         '<span class="line deleted">'+
                           'ccc'+
                         '</span>'+
                         '<span class="line deleted">'+
                           'ddd'+
                         '</span>'+
                       '</span>',
                       ["aaa", "bbb", "ccc", "ddd"], ["aaa"]);
}

function testInserted()
{
    assertReadableDiff("  aaa\n" +
                       "+ bbb\n" +
                       "+ ccc\n" +
                       "+ ddd",
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'aaa'+
                         '</span>'+
                       '</span>'+
                       '<span class="block inserted">'+
                         '<span class="line inserted">'+
                           'bbb'+
                         '</span>'+
                         '<span class="line inserted">'+
                           'ccc'+
                         '</span>'+
                         '<span class="line inserted">'+
                           'ddd'+
                         '</span>'+
                       '</span>',
                       ["aaa"], ["aaa", "bbb", "ccc", "ddd"]);
}

function testReplace()
{
    assertReadableDiff("  aaa\n" +
                       "- bbb\n" +
                       "+ BbB\n" +
                       "  ccc\n" +
                       "- ddd\n" +
                       "- efg\n" +
                       "?  -\n" +
                       "+ eg",
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'aaa'+
                         '</span>'+
                       '</span>'+
                       '<span class="block deleted">'+
                         '<span class="line deleted">'+
                           'bbb'+
                         '</span>'+
                       '</span>'+
                       '<span class="block inserted">'+
                         '<span class="line inserted">'+
                           'BbB'+
                         '</span>'+
                       '</span>'+
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'ccc'+
                         '</span>'+
                       '</span>'+
                       '<span class="block deleted">'+
                         '<span class="line deleted">'+
                           'ddd'+
                         '</span>'+
                       '</span>'+
                       '<span class="block replaced">'+
                         '<span class="line replaced">'+
                           'e'+
                           '<span class="phrase deleted">f</span>'+
                           'g'+
                         '</span>'+
                       '</span>',
                       ["aaa", "bbb", "ccc", "ddd", "efg"],
                       ["aaa", "BbB", "ccc", "eg"]);

    assertReadableDiff("-  abcd xyz abc\n" +
                       "? -\n" +
                       "+ abcd abcd xyz abc\n" +
                       "?      +++++",
                       '<span class="block replaced">'+
                         '<span class="line replaced includes-both-modification">'+
                           '<span class="phrase deleted"> </span>'+
                           'abcd '+
                           '<span class="phrase inserted">abcd </span>'+
                           'xyz abc'+
                         '</span>'+
                       '</span>',
                       [" abcd xyz abc"],
                       ["abcd abcd xyz abc"]);
}

function testDifference()
{
    assertReadableDiff("- 1 tests, 0 assertions, 1 failures, 0 pendings\n" +
                       "?                        ^           ^\n" +
                       "+ 1 tests, 0 assertions, 0 failures, 1 pendings\n" +
                       "?                        ^           ^",
                       '<span class="block replaced">'+
                         '<span class="line replaced includes-both-modification">'+
                           '1 tests, 0 assertions, '+
                           '<span class="phrase replaced">'+
                           '<span class="phrase deleted">1</span>'+
                           '<span class="phrase inserted">0</span>'+
                           '</span>'+
                           ' failures, '+
                           '<span class="phrase replaced">'+
                           '<span class="phrase deleted">0</span>'+
                           '<span class="phrase inserted">1</span>'+
                           '</span>'+
                           ' pendings'+
                         '</span>'+
                       '</span>',
                       ["1 tests, 0 assertions, 1 failures, 0 pendings"],
                       ["1 tests, 0 assertions, 0 failures, 1 pendings"]);
}

function testComplex()
{
    assertReadableDiff("  aaa\n" +
                       "- bbb\n" +
                       "- ccc\n" +
                       "+ \n" +
                       "+   # \n" +
                       "  ddd",
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'aaa'+
                         '</span>'+
                       '</span>'+
                       '<span class="block deleted">'+
                         '<span class="line deleted">'+
                           'bbb'+
                         '</span>'+
                         '<span class="line deleted">'+
                           'ccc'+
                         '</span>'+
                       '</span>'+
                       '<span class="block inserted">'+
                         '<span class="line inserted">'+
                           ''+
                         '</span>'+
                         '<span class="line inserted">'+
                           '  # '+
                         '</span>'+
                       '</span>'+
                       '<span class="block equal">'+
                         '<span class="line equal">'+
                           'ddd'+
                         '</span>'+
                       '</span>',
                       ["aaa", "bbb", "ccc", "ddd"],
                       ["aaa", "", "  # ", "ddd"]);

    assertReadableDiff("- one1\n" +
                       "?  ^\n" +
                       "+ ore1\n" +
                       "?  ^\n" +
                       "- two2\n" +
                       "- three3\n" +
                       "?  -   -\n" +
                       "+ tree\n" +
                       "+ emu",
                       '<span class="block replaced">'+
                         '<span class="line replaced includes-both-modification">'+
                           'o'+
                           '<span class="phrase replaced">'+
                           '<span class="phrase deleted">n</span>'+
                           '<span class="phrase inserted">r</span>'+
                           '</span>'+
                           'e1'+
                         '</span>'+
                       '</span>'+
                       '<span class="block deleted">'+
                         '<span class="line deleted">'+
                           'two2'+
                         '</span>'+
                       '</span>'+
                       '<span class="block replaced">'+
                         '<span class="line replaced">'+
                           't'+
                           '<span class="phrase deleted">h</span>'+
                           'ree'+
                           '<span class="phrase deleted">3</span>'+
                         '</span>'+
                       '</span>'+
                       '<span class="block inserted">'+
                         '<span class="line inserted">'+
                           'emu'+
                         '</span>'+
                       '</span>',
                       ["one1", "two2", "three3"],
                       ["ore1", "tree", "emu"]);
}

function testEmpty()
{
    assertReadableDiff("", "", [], []);
}

function assertDiffLines(aExpected, aExpectedEncoded,
                         aFrom, aTo,
                         aFromStart, aFromEnd,
                         aToStart, aToEnd)
{
    var differ = new ReadableDiffer(aFrom, aTo);
    assertEquals(aExpected,
                 differ._diffLines(aFromStart, aFromEnd, aToStart, aToEnd));
    assertEquals(aExpectedEncoded,
                 differ._diffLines(aFromStart, aFromEnd, aToStart, aToEnd, true));
}

function assertDiffLine(aExpected, aExpectedEncoded, aFromLine, aToLine)
{
    var differ = new ReadableDiffer([""], [""]);
    assertEquals(aExpected, differ._diffLine(aFromLine, aToLine));
    assertEquals(aExpectedEncoded, differ._diffLineEncoded(aFromLine, aToLine));
}

function assertFormatDiffPoint(aExpected, aFromLine, aToLine, aFromTags, aToTags)
{
    var differ = new ReadableDiffer([""], [""]);
    assertEquals(aExpected, differ._formatDiffPoint(aFromLine, aToLine,
                                                    aFromTags, aToTags));
}

function assertReadableDiff(aExpected, aExpectedEncoded, aFrom, aTo)
{
    assertEquals(aExpected,
                 new ReadableDiffer(aFrom, aTo).diff().join("\n"));
    assertEquals(aExpectedEncoded,
                 new ReadableDiffer(aFrom, aTo).encodedDiff());
}
