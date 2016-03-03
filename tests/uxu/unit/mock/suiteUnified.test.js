function setUp()
{
}

function tearDown()
{
}


function test_JsMockitoStyleMock()
{
	var mock = mockFunction('mock function');
	when(mock)(10, 100).thenReturn(1000);
	assert.equals(1000, mock(10, 100));
}

function test_JSMockStyleMock()
{
	var controller = MockControl();
	var mock = controller.createMock();
	mock.expects().myMethod(10, 100).andReturn(1000);
	assert.equals(1000, mock.myMethod(10, 100));
}
