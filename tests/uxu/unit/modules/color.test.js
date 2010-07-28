var topDir = baseURL+'../../../../';
var Color;
var MixColor;

function setUp()
{
    var color = {};
    utils.include(topDir+'modules/color.js', color);
    Color = color.Color;
    MixColor = color.MixColor;
}

function testColorEscapeSequence()
{
    assertEscapeSequence(["31"], new Color("red"));
    assertEscapeSequence(["32", "1"], new Color("green", {bold: true}));
    assertEscapeSequence(["0"], new Color("reset"));
    assertEscapeSequence(["45"], new Color("magenta", {foreground: false}));
}

function testMixColorEscapeSequence()
{
    assertEscapeSequence(["34", "1"],
                         new MixColor([new Color("blue"),
                                       new Color("none", {bold: true})]));
    var mixColor = new MixColor([new Color("blue"),
                                 new Color("none", {bold: true})]);
    assertEscapeSequence(["34", "1", "4"],
                         mixColor.concat(new Color("none", {underline: true})));
    assertEscapeSequence(["34", "1", "4"],
                         new Color("blue").concat(
                             new Color("none", {bold: true}).concat(
                                 new Color("none", {underline: true}))));
}

function assertEscapeSequence(aExpected, aColor)
{
    assertEquals(aExpected, aColor.sequence());

    var escapeSequence = aColor.escapeSequence();
    assertMatch(/\u001b\[(?:\d+;)*\d+m/, escapeSequence);

    var sequenceString;
    sequenceString = escapeSequence.substring(2, escapeSequence.length - 1);
    assertEquals(aExpected, sequenceString.split(";"));
}
