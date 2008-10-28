// -*- indent-tabs-mode: t; tab-width: 4 -*-

var topDir = baseURL+'../../../../';

utils.include(topDir+'content/uxu/lib/module_manager.js');

var ReadableDiffer;

function setUp()
{
    var lib = new ModuleManager([topDir+'content/uxu/lib']);
    ReadableDiffer = lib.require('class', 'readableDiffer');
}

function testDiffLines()
{
    assertDiffLines(["- ddd",
                     "- efg",
                     "?  -",
                     "+ eg"],
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
                   "abcDefghiJkl",
                   "abcdefGhijkl");

    assertDiffLine(["- bcDefghiJklx",
                    "?   ^  ^  ^  -",
                    "+ abcdefGhijkl",
                    "? +  ^  ^  ^"],
                   "bcDefghiJklx",
                   "abcdefGhijkl");
}

function testEmptyDiffLine()
{
    assertDiffLine(["- ",
                    "+ "],
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
    assertReadableDiff("  aaa", ["aaa"], ["aaa"]);
    assertReadableDiff("  aaa\n" +
                       "  bbb",
                       ["aaa", "bbb"], ["aaa", "bbb"]);
}

function testDeleted()
{
    assertReadableDiff("  aaa\n" +
                       "- bbb",
                       ["aaa", "bbb"], ["aaa"]);
    assertReadableDiff("  aaa\n" +
                       "- bbb\n" +
                       "- ccc\n" +
                       "- ddd",
                       ["aaa", "bbb", "ccc", "ddd"], ["aaa"]);
}

function testInserted()
{
    assertReadableDiff("  aaa\n" +
                       "+ bbb\n" +
                       "+ ccc\n" +
                       "+ ddd",
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
                       ["aaa", "bbb", "ccc", "ddd", "efg"],
                       ["aaa", "BbB", "ccc", "eg"]);

    assertReadableDiff("-  abcd xyz abc\n" +
                       "? -\n" +
                       "+ abcd abcd xyz abc\n" +
                       "?      +++++",
                       [" abcd xyz abc"],
                       ["abcd abcd xyz abc"]);
}

function testDifference()
{
    assertReadableDiff("- 1 tests, 0 assertions, 1 failures, 0 pendings\n" +
                       "?                        ^           ^\n" +
                       "+ 1 tests, 0 assertions, 0 failures, 1 pendings\n" +
                       "?                        ^           ^",
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
                       ["one1", "two2", "three3"],
                       ["ore1", "tree", "emu"]);
}

function testEmpty()
{
    assertReadableDiff("", [], []);
}

function assertDiffLines(aExpected, aFrom, aTo,
                         aFromStart, aFromEnd,
                         aToStart, aToEnd)
{
    var differ = new ReadableDiffer(aFrom, aTo);
    assertEquals(aExpected,
                 differ._diffLines(aFromStart, aFromEnd, aToStart, aToEnd));
}

function assertDiffLine(aExpected, aFromLine, aToLine)
{
    var differ = new ReadableDiffer([""], [""]);
    assertEquals(aExpected, differ._diffLine(aFromLine, aToLine));
}

function assertFormatDiffPoint(aExpected, aFromLine, aToLine, aFromTags, aToTags)
{
    var differ = new ReadableDiffer([""], [""]);
    assertEquals(aExpected, differ._formatDiffPoint(aFromLine, aToLine,
                                                    aFromTags, aToTags));
}

function assertReadableDiff(aExpected, aFrom, aTo)
{
    assertEquals(aExpected,
                 new ReadableDiffer(aFrom, aTo).diff().join("\n"));
}
