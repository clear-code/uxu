// -*- indent-tabs-mode: t; tab-width: 4 -*-

var tc = new TestCase('testcase description here', {runStrategy: 'async'});

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

	'test window open' : function() {

		alert('AFTER 2sec');
		yield 2000;

		alert('AFTER 3sec');
		yield 3000;

		assert.isTrue(true);
	},


	/* tests */

	'First test is successful': function() {
		alert('test2');

		var loaded = { value : false };
		var win = utils.getTestWindow();
		win.gBrowser.addEventListener('load', function() {
			alert('LOADED');
			loaded.value = true;
		}, true);
		win.gBrowser.loadURI('http://www.google.com/');

		while (!loaded.value) {
			alert('NOT LOADED');
			yield 1000;
		}
		alert('NEXT STEP');

		assert.isTrue(false);
	},

	'Second test is successful': function() {
		alert('test3');

		assert.isTrue(true);
	}
}
