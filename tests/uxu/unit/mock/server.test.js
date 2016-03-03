utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
	mock = new HTTPServerMock();
}

function tearDown()
{
}

function test_isFunction()
{
	assert.isFunction(mock);
}

function test_name()
{
	assert.equals('custom name', (new HTTPServerMock('custom name'))._mock.name);
	assert.equals(bundle.getString('server_mock_default_name'), (new HTTPServerMock())._mock.name);
}
var defaultResponse = {
	file       : null,
	status     : 0,
	statusText : '',
	uri        : ''
};

function test_formatReturnValue()
{
	mock = mock._mock;
	assert.equals(
		defaultResponse,
		mock.formatReturnValue()
	);

	assert.equals(
		{ uri : '/actual', file : null, status : 200, statusText : '' },
		mock.formatReturnValue('/actual')
	);
	assert.equals(
		{ uri : '/actual', file : null, status : 200, statusText : '' },
		mock.formatReturnValue(200, '/actual')
	);
	assert.equals(
		{ uri : '/actual', file : null, status : 301, statusText : '' },
		mock.formatReturnValue('/actual', 301)
	);

	var file = utils.getFileFromURLSpec(baseURL);
	assert.equals(
		{ uri : '', file : file, status : 200, statusText : '' },
		mock.formatReturnValue(file)
	);
	assert.equals(
		{ uri : '/actual', file : file, status : 200, statusText : '' },
		mock.formatReturnValue(200, '/actual', file)
	);

	assert.equals(
		{ status : 404, file : file, path : '/actual', uri : '/actual', statusText : 'not found' },
		mock.formatReturnValue({ status : 404, file : file, path : '/actual', statusText : 'not found' })
	);
}

function test_expect()
{
	mock.expect('/')
		.expect('/path')
		.expect('/path/with/params.html?query=0123456')
		.expect(/RegExp/i)
		.expect('/to/be/rewrited', '/rewrited')
		.expect(/ToBeRewrited/i, '/rewrited')
		.expect('/to/be/redirected', '/redirected', 301)
		.expect(/ToBeRedirected/i, '/redirected', 302);

	assert.equals([{ arguments   : ['/'],
	                 returnValue : defaultResponse },
	               { arguments   : ['/path'],
	                 returnValue : defaultResponse },
	               { arguments   : ['/path/with/params.html?query=0123456'],
	                 returnValue : defaultResponse },
	               { arguments   : [/RegExp/i],
	                 returnValue : defaultResponse },
	               { arguments   : ['/to/be/rewrited'],
	                 returnValue : { uri        : '/rewrited',
	                                 file       : null,
	                                 status     : 200,
	                                 statusText : '' } },
	               { arguments   : [/ToBeRewrited/i],
	                 returnValue : { uri        : '/rewrited',
	                                 file       : null,
	                                 status     : 200,
	                                 statusText : '' } },
	               { arguments   : ['/to/be/redirected'],
	                 returnValue : { uri        : '/redirected',
	                                 file       : null,
	                                 status     : 301,
	                                 statusText : '' } },
	               { arguments   : [/ToBeRedirected/i],
	                 returnValue : { uri        : '/redirected',
	                                 file       : null,
	                                 status     : 302,
	                                 statusText : '' } }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_expectThrows()
{
	mock.expectThrows('/server/error', 500)
		.expectThrows('/client/error', 400)
		.expectThrows(/NotFound/i, 404, 'not found');

	assert.equals([{ arguments   : ['/server/error'],
	                 returnValue : { uri        : '',
	                                 file       : null,
	                                 status     : 500,
	                                 statusText : '' } },
	               { arguments   : ['/client/error'],
	                 returnValue : { uri        : '',
	                                 file       : null,
	                                 status     : 400,
	                                 statusText : '' } },
	               { arguments   : [/NotFound/i],
	                 returnValue : { uri        : '',
	                                 file       : null,
	                                 status     : 404,
	                                 statusText : 'not found' } }],
	              mock._mock.expectedCalls.map((aCall) => aCall.toParams()));
}

function test_missingErrorDefinition()
{
	yield assert.raises(/Error/, function() { mock.expectThrows('/path'); });
}

function test_access()
{
	mock.expect('/');
	assert.equal(defaultResponse, mock('/'));

	mock.expect('/to/be/rewrited', '/rewrited');
	assert.equal({ uri        : '/rewrited',
	               file       : null,
	               status     : 200,
	               statusText : '' },
	             mock('/to/be/rewrited'));

	mock.expect(/pattern/, '/matched');
	assert.equal({ uri        : '/matched',
	               file       : null,
	               status     : 200,
	               statusText : '' },
	             mock('/path/will/match/to/pattern'));
}

function test_unexpectedAccess()
{
	mock.expect('/expected/path');
	yield assert.raises(/AssertionFailed/, function() { mock('/unexpected/path'); });
	yield assert.raises(/Error/, function() { mock('/unexpected/access'); });

	mock.expect(/pattern/, 200, '/matched');
	yield assert.success(function() { mock('/path/will/match/to/pattern'); });
}

function test_anyAccess()
{
	mock.expect(Mock.ANY);
	assert.equal({ uri        : '/path1',
	               file       : null,
	               status     : 200,
	               statusText : '' },
	             mock('/path1'));
	assert.equal({ uri        : '/path2',
	               file       : null,
	               status     : 200,
	               statusText : '' },
	             mock('/path2'));
}

function test_anyAccessWithStatus()
{
	mock.expect(Mock.ANY, '/redirected', 301);
	assert.equal({ uri        : '/redirected',
	               file       : null,
	               status     : 301,
	               statusText : '' },
	             mock('/path1'));
	assert.equal({ uri        : '/redirected',
	               file       : null,
	               status     : 301,
	               statusText : '' },
	             mock('/path2'));
}

function test_assertSuccess()
{
	mock.expect('/expect0');
	mock.expect('/expect1');
	mock('/expect0');
	mock('/expect1');
	yield assert.succeeds(function() { mock.assert(); });
}

function test_assertFail()
{
	mock.expect('/expect0');
	mock.expect('/expect1');
	mock('/expect0');
	yield assert.raises('AssertionFailed', function() { mock.assert(); });
}
