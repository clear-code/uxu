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

function testNeedFold()
{
    assertFalse(diff.needFold());
    assertFalse(diff.needFold(""));
    assertFalse(diff.needFold("0123456789" +
                              "1123456789" +
                              "2123456789" +
                              "3123456789" +
                              "4123456789" +
                              "5123456789" +
                              "6123456789" +
                              "7123456789"));

    assertFalse(diff.needFold("- 23456789" +
                              "1123456789" +
                              "2123456789" +
                              "3123456789" +
                              "4123456789" +
                              "5123456789" +
                              "6123456789" +
                              "712345678"));
    assertFalse(diff.needFold("+ 23456789" +
                              "1123456789" +
                              "2123456789" +
                              "3123456789" +
                              "4123456789" +
                              "5123456789" +
                              "6123456789" +
                              "712345678"));

    assertTrue(diff.needFold("- 23456789" +
                             "1123456789" +
                             "2123456789" +
                             "3123456789" +
                             "4123456789" +
                             "5123456789" +
                             "6123456789" +
                             "7123456789"));
    assertTrue(diff.needFold("+ 23456789" +
                             "1123456789" +
                             "2123456789" +
                             "3123456789" +
                             "4123456789" +
                             "5123456789" +
                             "6123456789" +
                             "7123456789"));

    assertTrue(diff.needFold("\n" +
                             "+ 23456789" +
                             "1123456789" +
                             "2123456789" +
                             "3123456789" +
                             "4123456789" +
                             "5123456789" +
                             "6123456789" +
                             "7123456789" +
                             "\n"));
}

function testFold()
{
    assertEquals("0123456789" +
                 "1123456789" +
                 "2123456789" +
                 "3123456789" +
                 "4123456789" +
                 "5123456789" +
                 "6123456789" +
                 "71234567\n" +
                 "89" +
                 "8123456789",
                 diff._fold("0123456789" +
                            "1123456789" +
                            "2123456789" +
                            "3123456789" +
                            "4123456789" +
                            "5123456789" +
                            "6123456789" +
                            "7123456789" +
                            "8123456789"));
}

function testFoldedReadable()
{
    assertEquals("- 0123456789" +
                 "1123456789" +
                 "2123456789" +
                 "3123456789" +
                 "4123456789" +
                 "5123456789" +
                 "6123456789" +
                 "71234567\n" +
                 "?  ^^^^^^^^^\n" +
                 "+ 0000000000" +
                 "1123456789" +
                 "2123456789" +
                 "3123456789" +
                 "4123456789" +
                 "5123456789" +
                 "6123456789" +
                 "71234567\n" +
                 "?  ^^^^^^^^^\n" +
                 "  89" +
                 "8123456789",
                 diff.foldedReadable("0123456789" +
                                     "1123456789" +
                                     "2123456789" +
                                     "3123456789" +
                                     "4123456789" +
                                     "5123456789" +
                                     "6123456789" +
                                     "7123456789" +
                                     "8123456789",

                                     "0000000000" +
                                     "1123456789" +
                                     "2123456789" +
                                     "3123456789" +
                                     "4123456789" +
                                     "5123456789" +
                                     "6123456789" +
                                     "7123456789" +
                                     "8123456789"));
}
