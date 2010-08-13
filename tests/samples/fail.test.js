// -*- indent-tabs-mode: t; tab-width: 4 -*-

// 絶対に失敗するテスト。エラーや失敗そのもの、あるいは失敗時の差分表示のテスト用。
var priority = 'must';

var topDir = baseURL+'../../';

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
                     '<span class="line deleted">'+
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
                   ['<span class="line replaced">'+
                      'abc'+
                      '<span class="phrase modified">'+
                      '<span class="phrase deleted">D</span>'+
                      '<span class="phrase inserted">d</span>'+
                      '</span>'+
                      'ef'+
                      '<span class="phrase edited">'+
                      '<span class="phrase deleted">g</span>'+
                      '<span class="phrase inserted">G</span>'+
                      '</span>'+
                      'hi'+
                      '<span class="phrase modified">'+
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
                   ['<span class="line replaced">'+
                      '<span class="phrase inserted">a</span>'+
                      'bc'+
                      '<span class="phrase modified">'+
                      '<span class="phrase deleted">D</span>'+
                      '<span class="phrase inserted">d</span>'+
                      '</span>'+
                      'ef'+
                      '<span class="phrase deleted">g</span>'+
                      '<span class="phrase inserted">G</span>'+
                      'hi'+
                      '<span class="phrase deleted">J</span>'+
                      '<span class="phrase inserted">j</span>'+
                      'kl'+
                      '<span class="phrase deleted">x</span>'+
                    '</span>'],
                   "bcDefghiJklx",
                   "abcdefGhijkl");
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
                         '<span class="line replaced">'+
                           '<span class="phrase deleted"> </span>'+
                           'abcd '+
                           '<span class="phrase inserted">abcd </span>'+
                           'xyz abc'+
                         '</span>'+
                       '</span>',
                       [" abcd xyz abc"],
                       ["abcd abcd xyz abc"]);
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


testSuccessCountSuccess.assertions = 2;
function testSuccessCountSuccess()
{
	assert.isTrue(true);
	assert.isTrue(true);
}

testSuccessCountFailTooLess.assertions = 2;
function testSuccessCountFailTooLess()
{
	assert.isTrue(true);
	// assert.isTrue(true);
}

testSuccessCountFailTooMany.assertions = 1;
function testSuccessCountFailTooMany()
{
	assert.isTrue(true);
	assert.isTrue(true);
}

testSuccessCountFailMin.minAssertions = 2;
function testSuccessCountFailMin()
{
	assert.isTrue(true);
}

testSuccessCountFailMax.maxAssertions = 1;
function testSuccessCountFailMax()
{
	assert.isTrue(true);
	assert.isTrue(true);
}

function testSuccessCountNoAssertion()
{
}

function testAssertInDelta()
{
	assert.inDelta(10, 0, 10);
}

function testError()
{
	throw 'error';
}

function testNotification()
{
	assert.isTrue(true);
	utils.log('message');
}



function testMock()
{
	var mock = new Mock();
	mock.expect('method', [0, 1], 'OK');
	mock.expectGet('getter', 'OK');
	mock.expectSet('setter', 'OK', 'OK');
}
