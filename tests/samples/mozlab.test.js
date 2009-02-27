var TestCase = mozlab.mozunit.TestCase;
var assert = mozlab.mozunit.assertions;

var tc = new TestCase('This is a unit test.');

tc.tests = {
	setUp : function() {
	},

	tearDown : function() {
	},

	'Successful test 1' : function() {
		assert.isTrue(true);
	}
}
