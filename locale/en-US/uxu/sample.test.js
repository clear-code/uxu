// If you want to use non-ASCII characters in this testcase,
// encode this file in UTF-8.

var description = 'testcase description here'; // can be omitted.

// // If you want to write functional tests, activate the next line.
// var isAsync = true;

// utils.include('../../myClass.js');
// utils.include('./common.js');


function setUp() {
    // put setup scripts here.
}

function tearDown() {
    // put teardown scripts here.
}


testWillSuccess.description = 'First test is successful'; // can be omitted.
function testWillSuccess() {
    assert.equals(0, [].length);
    assert.notEquals(10, ''.length);
    assert.isTrue(true);
    assert.isFalse(false);
    assert.isDefined(assert);
    assert.isUndefined(void(0));
    assert.isNull(null);
    assert.matches(/patterns?/, 'pattern');
}

// This test works correctly only when "isAsync = true".
testAsync.description = 'Async test';
// You can disable each test by "priority = never" temporary.
testAsync.priority = isAsync ? 'normal' : 'never' ;
function testAsync() {
    // Wait for the loading.
    yield Do(utils.loadURI('http://www.mozilla.org/'));

    var link = content.document.getElementsByTagName('a')[2];
    assert.equals('http://www.mozilla.org/about/', link.href);

    content.location.href = link.href;
    // Wait for three seconds.
    yield 3000;

    assert.equals('http://www.mozilla.org/about/', content.location.href);
}

