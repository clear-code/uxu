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
	this._defineProperties();
}
	
function _defineProperties() 
{
	this.__defineGetter__('window', _getWindow);
	this.__defineGetter__('windows', _getWindows);

	this.__defineGetter__('recipients', _getRecipients);
	this.__defineSetter__('recipients', _setRecipients);

	this.__defineGetter__('subject', _getSubject);
	this.__defineSetter__('subject', _setSubject);

	this.__defineGetter__('body', _getBodyContents);
	this.__defineSetter__('body', setBodyContents);

	this.__defineGetter__('attachments', _getAttachments);
	this.__defineSetter__('attachments', _setAttachments);
}
  
function destroy() 
{
	delete this._utils;
	delete this._environment;
}
 
// compose window 
	
function _getWindows() 
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
	
function _getWindow() 
{
	var composeWindows = this._getWindows();
	return composeWindows.length ? composeWindows[0] : null ;
}
  
function _isWindowReady(aComposeWindow) 
{
	var textboxes = getAddressTextboxes(aComposeWindow);
	return (
			!aComposeWindow.closed &&
			(
				textboxes.snapshotLength > 1 ||
				(
					textboxes.snapshotLength > 0 &&
					getLastAddressTextbox(aComposeWindow) &&
					getDummyRow(aComposeWindow)
				)
			)
		);
}
 
function _ensureWindowReady(aComposeWindow) 
{
	if (!aComposeWindow) {
		aComposeWindow = this._getWindow();
	}
	if (!aComposeWindow) {
		throw ERROR_NO_COMPOSE_WINDOW;
	}
	return aComposeWindow;
}
  
// window operation 
	
function setUp() 
{
	return utils.doIteration((function(aSelf) {
		yield aSelf._environment.setUpTestWindow();

		var mainWindow = aSelf._environment.getTestWindow();
		yield (function() {
				return 'MsgNewMessage' in mainWindow;
			});

		yield 500; // wait for initializing processes

		// �V�K���b�Z�[�W�̃E�B���h�E���J��
		mainWindow.MsgNewMessage(null);

		// �E�B���h�E���J�����܂ő҂�
		yield (function() {
				return composeWindow = aSelf._getWindow();
			});
	})(this));
}
 
function tearDown() 
{
	if (this._close()) {
		this._environment.tearDownTestWindow();
	}
}
	
function _close(aWindow) 
{
	var composeWindow = aWindow || this._getWindow();
	if (composeWindow) {
		composeWindow.SetContentAndBodyAsUnmodified();
		composeWindow.MsgComposeCloseWindow(true);
		return true;
	}
	return false;
}
  
function tearDownAll() 
{
	if (this._closeAll()) {
		this._environment.tearDownTestWindow();
	}
}
	
function _closeAll() 
{
	var closedInverted = true;
	var composeWindows = this._getWindows();
	for (let i in composeWindows)
	{
		if (!this._close(composeWindows[i])) {
			closedInverted = false;
		}
	}
	return !closedInverted;
}
   
// get input fields 
	
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
 
function getBodyFrame(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.getElementById('content-frame');
}
  
// commands 
	
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
		var lines = String(aContents).split(/[\r\n]+/);
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
		// ���̃^�C�~���O�Ń_�C�A���O�����J�����ƃ��C���X���b�h��
		// �������~�܂��Ă��܂����߁A�^�C�}�[���g���Ĕ񓯊��ŊJ���B
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
   
// user input emulation 
	
function _getSubject(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.getElementById('msgSubject').value;
}
 
function _setSubject(aSubject, aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	action.inputTextToField(aComposeWindow.document.getElementById('msgSubject'), aSubject);
}
 
function _getRecipients(aComposeWindow) 
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
 
function _setRecipients(aAddresses, aComposeWindow) 
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
 
function _getBodyContents(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return this.getBodyFrame(aComposeWindow).contentDocument.body;
}
 
function _setBodyContents(aContents) 
{
	this.setBodyContents(aContents);
	return aContents;
}
 
function _getAttachments(aComposeWIndow) 
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
 
function _setAttachments(aFiles, aComposeWindow) 
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
   
