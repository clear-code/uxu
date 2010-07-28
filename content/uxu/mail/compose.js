// -*- indent-tabs-mode: t; tab-width: 4 -*- 

var Cc = Components.classes;
var Ci = Components.interfaces;

var utils = {};
Components.utils.import('resource://uxu-modules/utils.js', utils);
utils = utils.utils;

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

	this.__defineGetter__('addressFields',     _getAddressFields);
	this.__defineGetter__('firstAddressField', _getFirstAddressField);
	this.__defineGetter__('lastAddressField',  _getLastAddressField);

	this.__defineGetter__('blankAddressFields',     _getBlankAddressFields);
	this.__defineGetter__('firstBlankAddressField', _getFirstBlankAddressField);
	this.__defineGetter__('lastBlankAddressField',  _getLastBlankAddressField);

	this.__defineGetter__('addressTypes',     _getAddressTypes);
	this.__defineGetter__('firstAddressType', _getLastAddressType);
	this.__defineGetter__('lastAddressType',  _getLastAddressType);

	this.__defineGetter__('dummyRows',     _getDummyRows);
	this.__defineGetter__('firstDummyRow', _getFirstDummyRow);
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
	var textboxes = _getAddressFields(aComposeWindow);
	return (
			!aComposeWindow.closed &&
			(
				textboxes.length > 1 ||
				(
					textboxes.length > 0 &&
					_getLastAddressField(aComposeWindow) &&
					_getFirstDummyRow(aComposeWindow)
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

		// 新規メッセージのウィンドウを開く
		mainWindow.MsgNewMessage(null);

		// ウィンドウが開かれるまで待つ
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
	var closed = true;
	var composeWindows = this._getWindows();
	for (let i in composeWindows)
	{
		if (!this._close(composeWindows[i])) {
			closed = false;
		}
	}
	return closed;
}
   
// get input fields 
const ADDRESS_TYPE = '//*[@id="addressingWidget"]/descendant::*[local-name()="menulist" and starts-with(@value, "addr_")]';
const ADDRESS_FIELD = ADDRESS_TYPE+'/ancestor::*[local-name()="listitem"]/descendant::*[local-name()="textbox"]';
const DUMMY_ROW = '//*[@id="addressingWidget"]/descendant::*[@class="dummy-row"]';
	
function _getAddressFields(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return utils.$X(ADDRESS_FIELD, aComposeWindow.document);
}
function _getFirstAddressField(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	var fields = _getAddressFields(aComposeWindow);
	return fields.length ? fields[0] : null ;
}
function _getLastAddressField(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	var fields = _getAddressFields(aComposeWindow);
	return fields.length ? fields[fields.length-1] : null ;
}
 
function _getBlankAddressFields(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	var fields = _getAddressFields(aComposeWindow);
	var blank = [];
	for (let i in fields)
	{
		if (!fields[i].value) blank.push(fields[i]);
	}
	return blank;
}
function _getFirstBlankAddressField(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	var blank = _getBlankAddressFields(aComposeWindow);
	return blank.length ? blank[0] : null ;
}
function _getLastBlankAddressField(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	var blank = _getBlankAddressFields(aComposeWindow);
	return blank.length ? blank[blank.length-1] : null ;
}
 
function _getAddressTypes(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return utils.$X(ADDRESS_TYPE, aComposeWindow.document);
}
function _getFirstAddressType(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	var types = _getAddressTypes(aComposeWindow);
	return types.length ? types[0] : null ;
}
function _getLastAddressType(aComposeWindow)
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	var types = _getAddressTypes(aComposeWindow);
	return types.length ? types[types.length-1] : null ;
}
 
function getAddressTypeForField(aField, aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return utils.$X('ancestor::*[local-name()="listitem"]/descendant::*[local-name()="menulist"]', aField, XPathResult.FIRST_ORDERED_NODE_TYPE);
}
 
function _getDummyRows(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return utils.$X(DUMMY_ROW, aComposeWindow.document);
}
function _getFirstDummyRow(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return utils.$X(DUMMY_ROW, aComposeWindow.document, XPathResult.FIRST_ORDERED_NODE_TYPE);
}
 
function _getBodyFrame(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return aComposeWindow.document.getElementById('content-frame');
}
  
// commands 
	
function setRecipients(aAddresses, aComposeWindow)
{
	return this._setRecipients(aAddresses, false, aComposeWindow)
}
function appendRecipients(aAddresses, aComposeWindow)
{
	return this._setRecipients(aAddresses, true, aComposeWindow)
}
 
function setBodyContents(aContents, aComposeWindow) 
{
	return this._setBodyContents(aContents, false, aComposeWindow);
}
function appendBodyContents(aContents, aComposeWindow) 
{
	return this._setBodyContents(aContents, true, aComposeWindow);
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
   
// user input emulation 
	
function _getSubject(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return utils.$('msgSubject', aComposeWindow).value;
}
 
function _setSubject(aSubject, aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	action.inputTextToField(utils.$('msgSubject', aComposeWindow), aSubject);
}
 
function _getRecipients(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);

	var types = _getAddressTypes(aComposeWindow);
	var textboxes = _getAddressFields(aComposeWindow);
	var array = [];
	textboxes.forEach(function(aTextbox, aIndex) {
		let value = aTextbox.value;
		if (!value) return;
		let type = types[aIndex].value.replace('addr_', '');
		switch (type)
		{
			case 'reply':
				type = 'reply-to';
				break;
			case 'followup':
				type = 'followup-to';
				break;
		}
		array.push({
			type    : type,
			address : value
		});
	}, this);
	return array;
}
 
function _setRecipients(aAddresses, aAppend, aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);

	const ENTER_KEY = { type : 'keypress', keyCode : Ci.nsIDOMKeyEvent.DOM_VK_RETURN };

	if (!aAppend) {
		var types = _getAddressTypes(aComposeWindow)
		_getAddressFields(aComposeWindow).forEach(function(aField, aIndex) {
			types[aIndex].value = 'addr_to';
			aField.focus();
			aField.value = '';
		}, this);
	}

	if (!utils.isArray(aAddresses)) aAddresses = [aAddresses];
	aAddresses = aAddresses
					.map(function(aAddress) {
						if (typeof aAddress == 'string') {
							aAddress = { address : aAddress, type : 'to' };
						}

						let type = aAddress.type.toLowerCase();
						switch (type)
						{
							case 'reply-to':
								type = 'reply';
								break;
							case 'followup-to':
								type = 'followup';
								break;
						}
						return {
							type      : aAddress.type,
							typeValue : 'addr_'+type,
							address   : aAddress.address
						};
					})
					.filter(function(aAddress) {
						return aAddress.address;
					});

	var listbox = utils.$('addressingWidget', aComposeWindow);
	aAddresses.forEach(function(aAddress) {
		let field = _getFirstBlankAddressField(aComposeWindow);
		getAddressTypeForField(field, aComposeWindow).value = aAddress.typeValue;
		listbox.ensureElementIsVisible(utils.$X('ancestor::*[local-name()="listitem"]', field, XPathResult.FIRST_ORDERED_NODE_TYPE));
		field.focus();
		action.inputTextToField(field, aAddress.address);

		if (utils.isSleepAvailable) {
			utils.sleep(100);
			let next;
			do {
				field = _getLastAddressField(aComposeWindow);
				field.focus();
				action.fireKeyEventOnElement(field, ENTER_KEY);
				utils.sleep(100);
				next = _getFirstBlankAddressField(aComposeWindow);
			}
			while (!next);
		}
		else {
			next = _getFirstBlankAddressField(aComposeWindow);
			if (!next) {
				aComposeWindow.awAppendNewRow(true);
			}
		}
	}, this);
	return aAddresses;
}
 
function _getBodyContents(aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);
	return this._getBodyFrame(aComposeWindow).contentDocument.body;
}
 
function _setBodyContents(aContents, aAppend, aComposeWindow) 
{
	aComposeWindow = this._ensureWindowReady(aComposeWindow);

	var frame = this._getBodyFrame(aComposeWindow);
	var doc = frame.contentDocument;

	var range = doc.createRange();
	range.selectNodeContents(doc.body);
	if (!aAppend) {
		range.deleteContents();
	}
	range.collapse(false);
	if (aContents instanceof Ci.nsIDOMDocumentFragment ||
		aContents instanceof Ci.nsIDOMNode) {
		aContents = doc.importNode(aContents, true);
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

	return aContents;
}
 
function _getAttachments(aComposeWindow) 
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
   
