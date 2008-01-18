// 文字列等に非ASCII文字を使う場合は、ファイルのエンコーディングを
// UTF-8にしてください。

// utils.include(baseURL+'another.in.same.folder.js');
// utils.include('chrome://myaddon/content/myaddon.file.js');

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
    setUp : function() {
        var loadedFlag = utils.setUpTestWindow();

        // テスト用ウィンドウが開かれたら次の行に進みます。
        // （※下のテストケースを参照）
        yield loadedFlag;

        var browser = utils.getBrowser();
        browser.removeAllTabsBut(browser.addTab('about:blank'));
    },

//    // setUpの引数としてcontinuation関数を受け取ると、
//    // continuation関数に 'ok' を渡して実行するまでは
//    // 次の処理に進まなくなります。
//    setUp : function(continuation) {
//        utils.setUpTestWindow();
//        utils.getTestWindow().addEventListener('load', function() {
//            var browser = utils.getBrowser();
//            browser.removeAllTabsBut(browser.addTab('about:blank'));
//            // 換言すれば、continuation関数を使って任意のタイミングで
//            // テストを開始することができます。
//            continuation("ok");
//        }, false);
//    },

    tearDown : function() {
        utils.tearDownTestWindow();
    },

    'ページ読み込みのテスト': function() {
        var win = utils.getTestWindow();

        var loadedFlag = { value : false };
        var browser = utils.getBrowser();
        browser.addEventListener('load', function() {
            loadedFlag.value = true;
        }, true);
        browser.loadURI('http://www.mozilla.org/');

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
