// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

// include(baseURL+'another.in.same.folder.js');
// include('chrome://myaddon/content/myaddon.file.js');

var unitTest = new TestCase('テストケースの説明をここに入力してください');

unitTest.tests = {
    setUp : function() {
      // put setup scripts here.
    },

    tearDown : function() {
      // put teardown scripts here.
    },

    '成功するテストの例': function() {
        assert.equals(0, [].length);
        assert.notEquals(10, ''.length);
        assert.isTrue(true);
        assert.isFalse(false);
        assert.isDefined(assert);
        assert.isUndefined(void(0));
        assert.isNull(null);
        assert.matches(/patterns?/, 'pattern');
    }
};

/*
var functionalTest = new TestCase('機能テストの例', {runStrategy: 'async'});

functionalTest.tests = {
    setUp : function(continuation) {
        // 非同期のテストでは、テストを続行するために
        // continuation("ok") を実行する必要があります。
        // utils.setUpTestWindow はメソッド内部で、
        // 適切なタイミングで自動的に continuation("ok") を
        // 実行します。
        utils.setUpTestWindow(continuation);
    },

    tearDown : function() {
        utils.tearDownTestWindow();
    },

    'ページ読み込みのテスト': function() {
        var loadedFlag = { value : false };
        var win = utils.getTestWindow();
        win.gBrowser.addEventListener('load', function() {
            loadedFlag.value = true;
        }, true);
        win.gBrowser.loadURI('http://www.mozilla.org/');

        // ページ読み込みの完了を待ちます。
        // yield文で「value」プロパティを持つオブジェクトを返すと、
        // テストランナーはこのオブジェクトの「value」プロパティの値が
        // 「true」になるまで処理を一時停止します。
        yield loadedFlag;

        assert.equals(win.content.location.href, 'http://www.mozilla.org/');


        // 別の例：ミリ秒単位でウェイトを設定して
        // 処理を一時停止することもできます。
        var beforeTime = (new Date()).getTime();
        yield 1000;

        var afterTime = (new Date()).getTime();
        assert.isTrue((afterTime - beforeTime) > 10);
    }
};
*/
