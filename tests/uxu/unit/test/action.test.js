var parallel = false;
var topDir = baseURL+'../../../../';

var Action = utils.import(topDir+'modules/test/action.js', {}).Action;

var PromptService = Cc['@mozilla.org/embedcomp/prompt-service;1']
					.getService(Ci.nsIPromptService);

var actionModule;

var ACCEPT_DELAY = 2000;

function setUp()
{
	actionModule = new Action(utils);
}

function tearDown()
{
	actionModule.destroy();
}


function test_readyToOK()
{
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToOK();
			alert('click OK');
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToOK();
			PromptService.alert(null, 'title', 'click OK');
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToOK({ checked : true });
			var checked = {};
			PromptService.alertCheck(null, 'title', 'click OK', 'check', checked);
			assert.isTrue(checked.value);
		}
	);
}

function test_readyToConfirm()
{
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(true);
			var result = confirm('click OK');
			assert.isTrue(result);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(false);
			var result = confirm('click Cancel');
			assert.isFalse(result);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(true);
			var result = PromptService.confirm(null, 'title', 'click OK');
			assert.isTrue(result);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(false);
			var result = PromptService.confirm(null, 'title', 'click Cancel');
			assert.isFalse(result);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(true, { checked : true });
			var checked = {};
			var result = PromptService.confirmCheck(null, 'title', 'click OK', 'check', checked);
			assert.isTrue(result);
			assert.isTrue(checked.value);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(false, { checked : true });
			var checked = {};
			var result = PromptService.confirmCheck(null, 'title', 'click Cancel', 'check', checked);
			assert.isFalse(result);
			assert.isTrue(checked.value);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(0, { checked : true });
			var checked = {};
			var result = PromptService.confirmEx(null, 'title', 'text', 
							(PromptService.BUTTON_POS_0 * PromptService.BUTTON_TITLE_SAVE) |
							(PromptService.BUTTON_POS_1 * PromptService.BUTTON_TITLE_DONT_SAVE) |
							(PromptService.BUTTON_POS_2 * PromptService.BUTTON_TITLE_CANCEL),
							null, null, null,
							'check', checked);
			assert.equals(0, result);
			assert.isTrue(checked.value);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(1, { checked : true });
			var checked = {};
			var result = PromptService.confirmEx(null, 'title', 'text', 
							(PromptService.BUTTON_POS_0 * PromptService.BUTTON_TITLE_SAVE) |
							(PromptService.BUTTON_POS_1 * PromptService.BUTTON_TITLE_DONT_SAVE) |
							(PromptService.BUTTON_POS_2 * PromptService.BUTTON_TITLE_CANCEL),
							null, null, null,
							'check', checked);
			assert.equals(1, result);
			assert.isTrue(checked.value);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToConfirm(2, { checked : true });
			var checked = {};
			var result = PromptService.confirmEx(null, 'title', 'text', 
							(PromptService.BUTTON_POS_0 * PromptService.BUTTON_TITLE_SAVE) |
							(PromptService.BUTTON_POS_1 * PromptService.BUTTON_TITLE_DONT_SAVE) |
							(PromptService.BUTTON_POS_2 * PromptService.BUTTON_TITLE_CANCEL),
							null, null, null,
							'check', checked);
			assert.equals(2, result);
			assert.isTrue(checked.value);
		}
	);
}

function test_readyToPrompt()
{
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToPrompt('input');
			var result = prompt('test');
			assert.equals('input', result);
		}
	);
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToPrompt('input', { checked : true });
			var input = {};
			var checked = {};
			var result = PromptService.prompt(null, 'title', 'test', input, 'check', checked);
			assert.isTrue(result);
			assert.equals('input', input.value);
			assert.isTrue(checked.value);
		}
	);
}

function test_readyToPromptPassword()
{
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToPromptPassword('password', { checked : true });
			var password = {};
			var checked = {};
			var result = PromptService.promptPassword(null, 'title', 'text', password, 'check', checked);
			assert.isTrue(result);
			assert.equals('password', password.value);
			assert.isTrue(checked.value);
		}
	);
}

function test_readyToPromptUsernameAndPassword()
{
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToPromptUsernameAndPassword('username', 'password', { checked : true });
			var username = {};
			var password = {};
			var checked = {};
			var result = PromptService.promptUsernameAndPassword(null, 'title', 'text', username, password, 'check', checked);
			assert.isTrue(result);
			assert.equals('username', username.value);
			assert.equals('password', password.value);
			assert.isTrue(checked.value);
		}
	);
}

function test_readyToSelect()
{
	yield assert.finishWithin(
		ACCEPT_DELAY,
		function() {
			actionModule.readyToSelect(1);
			var selection = {};
			var result = PromptService.select(null, 'title', 'text', 3, ['a', 'b', 'c'], selection);
			assert.isTrue(result);
			assert.equals(1, selection.value);
		}
	);
}


function test_multiple()
{
	actionModule.readyToOK();
	actionModule.readyToOK();
	actionModule.readyToOK({ checked : true });
	yield assert.finishWithin(
		ACCEPT_DELAY * 3,
		function() {
			alert('click OK');
			PromptService.alert(null, 'title', 'click OK');
			var checked = {};
			PromptService.alertCheck(null, 'title', 'click OK', 'check', checked);
			assert.isTrue(checked.value);
		}
	);
}
