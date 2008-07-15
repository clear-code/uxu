// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

var description = 'テストケースの説明をここに入力してください'; // 省略可

// // 機能テストの場合は次の行のコメントを外してください。
// var isAsync = true;

// utils.include('../../myClass.js');
// utils.include('./common.js');


function setUp() {
    // テストごとの初期化処理をここに書いてください。
}

function tearDown() {
    // テストごとの終了処理をここに書いてください。
}


testWillSuccess.description = '成功するテストの例'; // 省略可
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

// このテストは isAsync = true の時だけ実行できます。
testAsync.description = '非同期処理のテスト';
// priority = never で一時的に実行を無効化できます。
testAsync.priority = isAsync ? 'normal' : 'never' ;
function testAsync() {
    // 読み込みの完了を待って次へ進む。
    yield Do(utils.loadURI('http://www.mozilla.org/'));

    var link = content.document.getElementsByTagName('a')[2];
    assert.equals('http://www.mozilla.org/about/', link.href);

    content.location.href = link.href;
    // 3秒待って次へ進む。
    yield 3000;

    assert.equals('http://www.mozilla.org/about/', content.location.href);
}

