var targetProduct = 'Thunderbird';
var profile = '../fixtures/thuderbird-profile/';

function setUp()
{
	mail.clear();
	yield Do(mail.compose.setUp());
}

function tearDown()
{
	mail.compose.tearDown();
}

function testSend()
{
	var addresses = [
			{ type : 'to', address : 'address1@test' },
			{ type : 'to', address : 'address2@test' }
		];
	mail.compose.recipients = addresses;
	assert.equals(addresses, mail.compose.recipients);

	mail.compose.subject = 'test subject';
	mail.compose.body = 'test body\nnew row';

	assert.equals(0, mail.deliveries.length);

	mail.compose.send(); // mail.compose.sendByButtonClick();

	assert.equals(1, mail.deliveries.length);

	var data = mail.deliveries[0];
	assert.matches(/^\s*address1@test\s*,\s*address2@test\s*$/, data.to);
	assert.equals('test subject', data.subject);
	assert.equals('test body\nnew row', data.body);
}
