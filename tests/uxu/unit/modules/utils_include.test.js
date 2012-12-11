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
}

function test_include_preprocessor_constant()
{
	function variableIsConstantIn(aVariableName, aContext) {
		var descriptor = Object.getOwnPropertyDescriptor(aContext, aVariableName);
		return !descriptor.writable;
	}

	var namespace = {};
	utilsModule.include({
		uri : '../../fixtures/test.js',
		encoding : 'UTF-8',
		namespace : namespace,
		allowOverrideConstants : false
	});
	assert.isDefined(namespace.constant);
	assert.equals('定数', namespace.constant);
	assert.isTrue(variableIsConstantIn('constant', namespace)); // not overridden

	namespace = {};
	utilsModule.include({
		uri : '../../fixtures/test.js',
		encoding : 'UTF-8',
		namespace : namespace,
		allowOverrideConstants : true
	});
	assert.isDefined(namespace.constant);
	assert.equals('定数', namespace.constant);
	assert.isFalse(variableIsConstantIn('constant', namespace)); // overridden
}