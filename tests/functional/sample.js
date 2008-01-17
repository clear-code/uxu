// -*- indent-tabs-mode: t; tab-width: 4 -*-

var tc = new TestCase('This is a functional test.', {runStrategy: 'async'});

tc.tests = {
	setUp : function() {
        yield utils.setUpTestWindow();
        var browser = utils.getBrowser();
        browser.removeAllTabsBut(browser.addTab('about:blank'));
	},

	tearDown : function() {
		utils.tearDownTestWindow();
	},

	'yield' : function() {

		dump('AFTER 2sec\n');
		yield 2000;

		dump('AFTER 3sec\n');
		yield 3000;

		assert.isTrue(true);
	},

	'page loading test': function() {
		var loaded = {
				value : false
			};
		var win = utils.getTestWindow();
        var browser = utils.getBrowser();
		browser.addEventListener('load', function() {
			dump('LOADED');
			loaded.value = true;
		}, true);
		browser.loadURI('http://www.google.com/');

		while (!loaded.value) {
			dump('NOT LOADED\n');
			yield 1000;
		}
		dump('NEXT STEP\n');

		assert.isTrue(true);
	}
}
