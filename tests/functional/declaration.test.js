// 宣言型テストの例

var description = 'このテストの説明';

// 非同期型のテスト
var isAsync = true;
// var runStrategy = 'async' でも同じ


var value;


// 名前がsetUpで始まる物はset upと見なす
// function.isSetUp = true; としても同じ
function setUp() {
	value = 1;
}


// 名前がtearDownで始まる物はtear downと見なす
// function.isTearDown = true; としても同じ
function tearDown() {
	value = 0;
}



// 名前がtestで始まる物はテストと見なす
// function.isTest = true; としても同じ
testSomething1.description = 'Something1テストの説明';
function testSomething1() {
	assert.equal(1, value);
	assert.isTrue(true);
}

testSomething2.description = 'Something2テストの説明';
function testSomething2() {
	assert.notEqual(2, value);
	assert.isFalse(false);
}

testSomething3.description = '実行しないテスト';
testSomething3.disabled = true;
// disabled, enabled, available, active, inactive のどれでも同様に動作
function testSomething3() {
	assert.notEqual(3, value);
	assert.isFalse(true);
}
