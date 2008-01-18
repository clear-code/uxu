// utils.include(baseURL+'another.in.same.folder.js');
// utils.include('chrome://myaddon/content/myaddon.file.js');

var unitTest = new TestCase('testcase description here');

unitTest.tests = {
    setUp : function() {
      // put setup scripts here.
    },

    tearDown : function() {
      // put teardown scripts here.
    },

    'First test is successful': function() {
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
var functionalTest = new TestCase('functional test', {runStrategy: 'async'});

functionalTest.tests = {
    setUp : function() {
        var loadedFlag = utils.setUpTestWindow();

        // After the testing window completely loaded, go to the next line.
        // (*see following testcase)
        yield loadedFlag;

        var browser = utils.getBrowser();
        browser.removeAllTabsBut(browser.addTab('about:blank'));
    },

//    // If you receive "continuation" function as the argument of "setUp",
//    // test runner doesn't start test until you execute "continuation('ok')".
//    setUp : function(continuation) {
//        utils.setUpTestWindow();
//        utils.getTestWindow().addEventListener('load', function() {
//            var browser = utils.getBrowser();
//            browser.removeAllTabsBut(browser.addTab('about:blank'));
//            // In other words, you can start tests when you feel like it.
//            continuation("ok");
//        }, false);
//    },

    tearDown : function() {
        utils.tearDownTestWindow();
    },

    'page loading test': function() {
        var win = utils.getTestWindow();

        var loadedFlag = { value : false };
        var browser = utils.getBrowser();
        browser.addEventListener('load', function() {
            loadedFlag.value = true;
        }, true);
        browser.loadURI('http://www.mozilla.org/');

        // Wait for the loading. If you return an object which has
        // "value" property, test runner waits the time that the "value"
        // property become to "true".
        yield loadedFlag;

        assert.equals(win.content.location.href, 'http://www.mozilla.org/');


        // another style: you can wait for a second.
        var beforeTime = (new Date()).getTime();
        yield 1000;

        var afterTime = (new Date()).getTime();
        assert.isTrue((afterTime - beforeTime) > 10);
    }
};
*/
