utils.include('./common.inc.js');

var mock;
var manager;

function setUp()
{
}

function tearDown()
{
}

function createHTTPServerMock()
{
	var mock = new HTTPServerMock();
	assert.isFunction(mock);
	return mock;
}

function test_name()
{
	assert.equals('custom name', (new HTTPServerMock('custom name'))._mock.name);
	assert.equals(bundle.getString('server_mock_default_name'), (new HTTPServerMock())._mock.name);
}

function test_formatReturnValue()
{
	var mock = createHTTPServerMock()._mock;
	assert.equals(
		{ uri : '', file : null, status : 0, statusText : '' },
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
	var mock = createHTTPServerMock();
	yield assertCallError(mock);
	yield assertCallAdded(mock, () => mock.expect('/'));
	yield assertCallSuccess(mock, ['/'],
		{ uri : '', file : null, status : 0, statusText : '' });
	yield assertCallError(mock);

	yield assertCallAdded(mock, () => mock.expect('/expected'));
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, ['/unexpected'], 'AssertionFailed');
	});

	mock = createHTTPServerMock();
	yield assertCallAdded(mock, () => mock.expect(/FooBar/i, '/expected'));
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, ['/foo'], 'AssertionFailed');
	});

	yield assertCallAdded(mock, () => mock.expect(/FooBar/i, '/expected'));
	yield assertCallSuccess(mock, ['/foobar'],
		{ uri : '/expected', file : null, status : 200, statusText : '' });

	yield assertCallAdded(mock, function() {
		mock.expect(/([^\/]+)\.jpg/, '/images/jpeg/$1.jpg');
	});
	yield assertCallSuccess(mock, ['/files/photo.jpg?q=0123456'],
		{ uri : '/images/jpeg/photo.jpg', file : null, status : 200, statusText : '' });
}

function test_specialSpec()
{
	var mock = createHTTPServerMock();

	yield assertAnyCallAdded(mock,
		() => mock.expect(Mock.ANY));
	yield assertAnyCallSuccess(mock,
		['/path1'], { uri : '/path1', file : null, status : 200, statusText : '' });
	yield assertAnyCallSuccess(mock,
		['/path2'], { uri : '/path2', file : null, status : 200, statusText : '' });
	yield assertAnyCallSuccess(mock,
		['/path3'], { uri : '/path3', file : null, status : 200, statusText : '' });

	yield assertAnyCallAdded(mock, () => mock.expect(Mock.ANY, '/expected', 301));
	yield assertAnyCallSuccess(mock,
		['/path1'], { uri : '/expected', file : null, status : 301, statusText : '' });
	yield assertAnyCallSuccess(mock,
		['/path2'], { uri : '/expected', file : null, status : 301, statusText : '' });
	yield assertAnyCallSuccess(mock,
		['/path3'], { uri : '/expected', file : null, status : 301, statusText : '' });

	yield assertCallAdded(mock,
		() => mock.expect(Mock.ANY_ONETIME, '/expected', 401));
	yield assertCallSuccess(mock,
		['/any'], { uri : '/expected', file : null, status : 401, statusText : '' });
	yield assertCallError(mock,
		['/any']);

	yield assertCallNotModified(mock, function() {
		mock.expect(Mock.NEVER);
	});
	yield assertCallError(mock, ['/never']);
}

function test_expectThrows()
{
	var mock = createHTTPServerMock();

	yield assertCallNotModified(mock, function() {
		yield assert.raises(
			bundle.getString('mock_error_no_exception'),
			() => mock.expectThrows()
		);
	});
	yield assertCallNotModified(mock, function() {
		yield assert.raises(
			bundle.getString('mock_error_no_exception'),
			() => mock.expectThrows('/error')
		);
	});
	yield assertCallAdded(mock, function() {
		yield assert.notRaises(
			bundle.getString('mock_error_no_exception'),
			() => mock.expectThrows('/error', 502)
		);
	});
	yield assertCallRemoved(mock, function() {
		yield assertCallSuccess(mock, ['/error'],
			{ uri : '', file : null, status : 502, statusText : '' });
	});

	yield assertCallAdded(mock,
		() => mock.expectThrows(/errorpage/i, 503, 'some error'));
	yield assertCallRemoved(mock, function() {
		yield assertCallSuccess(mock, ['/ErrorPage'],
			{ uri : '', file : null, status : 503, statusText : 'some error' });
	});

	yield assertCallAdded(mock,
		() => mock.expectThrows('/expected', 400));
	yield assertCallRemoved(mock, function() {
		yield assertCallRaise(mock, ['/unexpected'], 'AssertionFailed');
	});
}

function test_assert()
{
	var mock = createHTTPServerMock();
	mock.expect('/expect0');
	mock.expect('/expect1');
	mock('/expect0');
	mock('/expect1');
	yield assertSuccess(mock);

	mock = createHTTPServerMock();
	mock.expect('/expect0');
	mock.expect('/expect1');
	mock('/expect0');
	yield assertFail(mock);
}
