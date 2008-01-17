// include(baseURL+'another.in.same.folder.js');
// include('chrome://myaddon/content/myaddon.file.js');

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
    setUp : function(continuation) {
        // in "async" tests, you have to call "continuation" function
        // with the argument "ok" to continue test.
        utils.setUpTestWindow(continuation);
        // continuation("ok");
    },

    tearDown : function() {
        utils.tearDownTestWindow();
    },

    'page loading test': function() {
        var loadedFlag = { value : false };
        var win = utils.getTestWindow();
        win.gBrowser.addEventListener('load', function() {
            loadedFlag.value = true;
        }, true);
        win.gBrowser.loadURI('http://www.mozilla.org/');

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
