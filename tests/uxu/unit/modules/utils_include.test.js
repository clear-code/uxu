// -*- indent-tabs-mode: t; tab-width: 4 -*-
var parallel = false;

utils.include('utils_common.inc.js');

function test_include()
{
	var namespace = {};
	utilsModule.include('../../fixtures/test.js', 'UTF-8', namespace);
	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);
}

function test_include_oldStyle()
{
	var namespace = {};
	utilsModule.include('../../fixtures/test.js', namespace, 'UTF-8');
	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);
}

function test_include_hashStyle()
{
	var namespace = {};
	utilsModule.include({
		uri : '../../fixtures/test.js',
		encoding : 'UTF-8',
		namespace : namespace,
		allowOverrideConstants : false
	});

	assert.isDefined(namespace.string);
	assert.equals('文字列', namespace.string);

	assert.isDefined(namespace.constant);
	assert.equals('定数', namespace.constant);
	// If the the message text of constants redeclaration error
	// changes too frequently, we should use "TypeError" checking only
	// type of the error instead of a regular expression covering all
	// the messages.
	assert.raises(
		/TypeError: (redeclaration of const constant|can't redefine non-configurable property 'constant')/,
		function() {
			namespace.__defineGetter__(
				'constant',
				function() { return 'foo'; }
			);
		}
	);
	assert.equals('定数', namespace.constant);

	namespace = {};
	utilsModule.include({
		uri : '../../fixtures/test.js',
		encoding : 'UTF-8',
		namespace : namespace,
		allowOverrideConstants : true
	});

	assert.isDefined(namespace.constant);
	assert.equals('定数', namespace.constant);
	var originalConstantValue = namespace.constant;
	assert.notRaises(
		'TypeError: redeclaration of const constant',
		function() {
			namespace.__defineGetter__(
				'constant',
				function() { return 'foo'; }
			);
		}
	);
	assert.equals(originalConstantValue, namespace.constant);
}