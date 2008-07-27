var diff;

function setUp()
{
    diff = {};
    utils.include('../../../../content/uxu/lib/diff.js', diff);
}

function testIsInterested()
{
    assertFalse(diff.isInterested());
    assertFalse(diff.isInterested(""));
    assertFalse(diff.isInterested(" a\n" +
                                  " b\n" +
                                  " c"));
    assertFalse(diff.isInterested("- abc\n" +
                                  "+ abc"));
    assertTrue(diff.isInterested("- a\n" +
                                 "+ b\n" +
                                 "+ c"));
    assertTrue(diff.isInterested("- abc\n" +
                                 "+ abc\n" +
                                 "  xyz"));
    assertTrue(diff.isInterested("- abc def ghi xyz\n" +
                                 "?     ^^^\n" +
                                 "+ abc DEF ghi xyz\n" +
                                 "?     ^^^"));
    assertTrue(diff.isInterested("  a\n" +
                                 "- abc def ghi xyz\n" +
                                 "?     ^^^\n" +
                                 "+ abc DEF ghi xyz\n" +
                                 "?     ^^^"));
}

function testReadableEmpty()
{
    assertEquals("", diff.readable("", ""));
}
