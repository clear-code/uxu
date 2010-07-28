// -*- indent-tabs-mode: t; tab-width: 4 -*-

var topDir = baseURL+'../../../../';

var ns = {};
[
	topDir+'modules/observer.js'
].forEach(function(aURI) {
	utils.include({
		uri                    : aURI,
		encoding               : 'Shift_JIS',
		allowOverrideConstants : true,
		namespace              : ns
	});
}, this);
var ObserverClass = ns.Observer;

var observer;

function setUp()
{
	observer = new ObserverClass();
	assert.equals(0, observer.count);
	assert.equals(0, observer.subjects.length);
	assert.equals(0, observer.topics.length);
	assert.equals(0, observer.data.length);
}

function tearDown()
{
}

function testObserve()
{
	observer.startObserve('uxu:test-topic');
	utils.notify(window, 'uxu:test-topic', 'data');

	assert.equals(1, observer.count);
	assert.equals(1, observer.subjects.length);
	assert.equals(1, observer.topics.length);
	assert.equals(1, observer.data.length);

	assert.equals(window, observer.lastSubject);
	assert.equals('uxu:test-topic', observer.lastTopic);
	assert.equals('data', observer.lastData);

	observer.endObserve('uxu:test-topic');

	utils.notify(window, 'uxu:test-topic', 'data');

	assert.equals(1, observer.count);
	assert.equals(1, observer.subjects.length);
	assert.equals(1, observer.topics.length);
	assert.equals(1, observer.data.length);
}
