// -*- indent-tabs-mode: t; tab-width: 4 -*-

var tc = new TestCase('This is a functional test.', {runStrategy: 'async'});

tc.tests = {
	setUp : function(continuation) {
		if (utils.getTestWindow()) {
			continuation("ok");
		} else {
			var open_callback = function(win) {
				window.setTimeout(function() {continuation('ok')}, 0);
			};
			utils.openTestWindow(open_callback);
		}
	},

	tearDown : function() {
		utils.closeTestWindow();
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
		win.gBrowser.addEventListener('load', function() {
			dump('LOADED');
			loaded.value = true;
		}, true);
		win.gBrowser.loadURI('http://www.google.com/');

		while (!loaded.value) {
			dump('NOT LOADED\n');
			yield 1000;
		}
		dump('NEXT STEP\n');

		assert.isTrue(true);
	}
}
