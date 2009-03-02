// -*- indent-tabs-mode: t; tab-width: 4 -*-

var Cc = Components.classes;
var Ci = Components.interfaces;

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

var test_module = new ModuleManager(['chrome://uxu/content/test']);
var action = test_module.require('package', 'action');

var ERROR_NO_COMPOSE_WINDOW = new Error('no compose window');

function constructor(aMailUtils, aEnvironment)
{
	this._utils = aMailUtils;
	this._environment = aEnvironment;

	this.__defineGetter__('window', getWindow);
	this.__defineGetter__('windows', getWindows);

	this.__defineGetter__('recipients', getRecipients);
	this.__defineSetter__('recipients', setRecipients);

	this.__defineGetter__('subject', getSubject);
	this.__defineSetter__('subject', setSubject);

	this.__defineGetter__('body', getBodyContents);
	this.__defineSetter__('body', setBodyContents);

	this.__defineGetter__('attachments', getAttachments);
	this.__defineSetter__('attachments', setAttachments);
}

function destroy()
{
	delete this._utils;
	delete this._environment;
}


function getWindow()
{
	var composeWindows = this.getWindows();
	return composeWindows.length ? composeWindows[0] : null ;
}

function getWindows()
{
	var composeWindows = [];
	this._environment.getChromeWindows({ type : 'msgcompose' })
		.forEach(function(aWindow) {
			if (this._isWindowReady(aWindow)) {
				composeWindows.push(aWindow);
			}
		}, this);
	return composeWindows;
}

function _isWindowReady(aComposeWindow)
{
	var textboxes = getAddressTextboxes(aComposeWindow);
	return (
			textboxes.snapshotLength > 1 ||
			(
				textboxes.snapshotLength > 0 &&
				getLastAddressTextbox(aComposeWindow) &&
				getDummyRow(aComposeWindow)
			)
		);
}

function _ensureWindowReady(aComposeWindow)
{
	if (!aComposeWindow) {
		aComposeWindow = this.getWindow();
	}
	if (!aComposeWindow) {
		throw ERROR_NO_COMPOSE_WINDOW;
	}
	return aComposeWindow;
}


function setUp()
{
	return utils.doIteration((function(aSelf) {
		yield aSelf._environment.setUpTestWindow();

		var mainWindow = aSelf._environment.getTestWindow();
		yield (function() {
				return 'MsgNewMessage' in mainWindow;
			});

		yield 500; // wait for initializing processes

		// 新規メッセージのウィンドウを開く
		mainWindow.MsgNewMessage(null);

		// ウィンドウが開かれるまで待つ
		yield (function() {
				return composeWindow = aSelf.getWindow();
			});
	})(this));
}

function close()
{
	var composeWindow = this.getWindow();
	if (composeWindow) {
		composeWindow.SetContentAndBodyAsUnmodified();
		composeWindow.MsgComposeCloseWindow(true);
		return true;
	}
	return false;
}

function tearDown()
{
	if (this.close()) {
		this._environment.tearDownTestWindow();
	}
}

function closeAll()
{
	var closed = false;
	var composeWindows = this.getWindows();
	for (let i in composeWindows)
	{
		composeWindows[i].SetContentAndBodyAsUnmodified();
		composeWindows[i].MsgComposeCloseWindow(true);
		closed = true;
	}
	return closed;
}

function tearDownAll()
{
	if (this.closes()) {
		this._environment.tearDownTestWindow();
	}
}


function getLastAddressTextbox(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.evaluate(
			'/descendant::*[local-name()="menulist" and starts-with(@value, "addr_")][last()]'+
			'/ancestor::*[local-name()="listitem"]/descendant::*[local-name()="textbox"]',
			aComposeWindow.document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}

function getAddressTextboxes(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.evaluate(
			'/descendant::*[local-name()="menulist" and starts-with(@value, "addr_")]'+
			'/ancestor::*[local-name()="listitem"]/descendant::*[local-name()="textbox"]',
			aComposeWindow.document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
}

function getLastAddressType(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.evaluate(
			'/descendant::*[local-name()="menulist" and starts-with(@value, "addr_")][last()]',
			aComposeWindow.document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}

function getAddressTypes(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.evaluate(
			'/descendant::*[local-name()="menulist" and starts-with(@value, "addr_")]',
			aComposeWindow.document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		);
}

function getDummyRow(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.evaluate(
			'/descendant::*[@class="dummy-row"]',
			aComposeWindow.document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		).singleNodeValue;
}


function getRecipients(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);

	var types = getAddressTypes(aComposeWindow);
	var textboxes = getAddressTextboxes(aComposeWindow);
	var array = [];
	for (let i = 0, maxi = textboxes.snapshotLength; i < maxi; i++)
	{
		let value = textboxes.snapshotItem(i).value;
		if (value) {
			array.push({
				type    : types.snapshotItem(i).value.replace('addr_', ''),
				address : value
			});
		}
	}
	return array;
}

function setRecipients(aAddresses, aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	for (let i in aAddresses)
	{
		let type = aAddresses[i].type,
			address = aAddresses[i].address;

		getLastAddressType(aComposeWindow).value = 'addr_'+type.toLowerCase();

		let textbox = getLastAddressTextbox(aComposeWindow);

		textbox.focus();
		action.inputTextToField(textbox, address);

		aComposeWindow.awReturnHit(textbox);
	}
	return aAddresses;
}


function getSubject(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.getElementById('msgSubject').value;
}

function setSubject(aSubject, aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	action.inputTextToField(aComposeWindow.document.getElementById('msgSubject'), aSubject);
}


function getBodyFrame(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.getElementById('content-frame');
}

function getBodyContents(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return this.getBodyFrame(aComposeWindow).contentDocument;
}

function setBodyContents(aContents, aAppend, aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);

	var frame = this.getBodyFrame(aComposeWindow);
	var doc = frame.contentDocument;

	var range = doc.createRange();
	range.selectNodeContents(doc.body);
	if (!aAppend) {
		range.deleteContents();
	}
	range.collapse(false);
	if (aContents instanceof Ci.nsIDOMDocumentFragment ||
		aContents instanceof Ci.nsIDOMNode) {
		aContents = doc.importNode(aContents);
		range.insertNode(aContents);
	}
	else {
		var fragment = doc.createDocumentFragment();
		var lines = String(aContents).split(/[¥r¥n]+/);
		lines.forEach(function(aLine, aIndex) {
			fragment.appendChild(doc.createTextNode(aLine));
			if (aIndex < lines.length-1) {
				fragment.appendChild(doc.createElement('br'));
			}
		});
		range.insertNode(fragment);
	}
	range.detach();
}


function getAttachments(aComposeWIndow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);

	var bucket = aComposeWindow.document.getElementById('attachmentBucket');
	var files = [];
	for (let i = 0, maxi = bucket.getRowCount(); i < maxi; i++)
	{
		let attachment = bucket.getItemAtIndex(i).attachment;
		if (attachment) {
			attachment = this._environment.normalizeToFile(attachment.url);
			if (attachment) {
				files.push(attachment);
			}
		}
	}
	return files;
}

function setAttachments(aFiles, aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	if (!utils.isArray(aFiles)) {
		aFiles = [aFiles];
	}
	aComposeWindow.RemoveAllAttachments();
	aFiles.forEach(function(aFile) {
		this.attachFile(aFile, aComposeWindow);
	}, this);
}

function attachFile(aFile, aComposeWindow)
{
	if (!aFile) return;
	aFile = this._environment.normalizeToFile(aFile);
	if (!aFile || !aFile.exists()) return;
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	if ('AddFileAttachment' in aComposeWindow) { // Thunderbird 3 or later
		aComposeWindow.AddFileAttachment(aFile);
	}
	else { // Thunderbird 2
		aComposeWindow.AttachFile(aFile);
	}
}


function send(aAsync, aComposeWindow)
{
	this.sendByAPI(aAsync, aComposeWindow);
}

function _send(aCommand, aAsync, aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	if (aAsync) {
		// このタイミングでダイアログ等が開かれるとメインスレッドの
		// 処理が止まってしまうため、タイマーを使って非同期で開く。
		aComposeWindow.setTimeout(aCommand, 0);
	}
	else {
		aCommand();
	}
}

function sendByAPI(aAsync, aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	this._send(function() {
		aComposeWindow.SendMessage();
	}, aAsync);
}

function sendByButtonClick(aAsync, aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	this._send(function() {
		action.fireMouseEventOnElement(aComposeWindow.document.getElementById('button-send'));
	}, aAsync);
}
