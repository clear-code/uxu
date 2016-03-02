utils.include('./common.inc.js');

function setUp()
{
}

function tearDown()
{
}

function test_TypeOf_instance()
{
	assert.isInstanceOf(TypeOf, TypeOf.isA(Array));
	assert.isInstanceOf(TypeOf, new TypeOf(Array));
	assert.isInstanceOf(TypeOf, TypeOf(Array));
	assert.isInstanceOf(TypeOf, TypeOf('array'));
}

function test_TypeOf_assert()
{
	TypeOf('string').assert('primitive string', assert);
	TypeOf(String).assert(new String('string'), assert);
	TypeOf(Array).assert([0, 1, 2], assert);
	TypeOf('array').assert([0, 1, 2], assert);
	TypeOf(Ci.nsIDOMWindow).assert(window, assert);
	TypeOf({
		boolean:       true,
		booleanClass:  TypeOf(Boolean),
		booleanString: TypeOf('boolean'),
		string:        'foo',
		stringClass:   TypeOf(String),
		stringString:  TypeOf('string'),
		number:        0,
		numberClass:   TypeOf(Number),
		numberString:  TypeOf('number'),
		array:         [0, 1, 2],
		arrayClass:    TypeOf(Array),
		arrayString:   TypeOf('array'),
		object:        TypeOf({ value : 'OK' })
	}).assert({
		boolean:       true,
		booleanClass:  new Boolean(true),
		booleanString: true,
		string:        'foo',
		stringClass:   new String('bar'),
		stringString:  'baz',
		number:        0,
		numberClass:   new Number(1),
		numberString:  2,
		array:         [0, 1, 2],
		arrayClass:    [3, 4, 5],
		arrayString:   [6, 7, 8],
		object:        { value : 'OK', another : true },
		extra:         'bar'
	}, assert);
}
