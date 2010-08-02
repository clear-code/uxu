// -*- indent-tabs-mode: t; tab-width: 4 -*- 

if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['Action'];
 
function Action(aEnvironment) 
{
	this.utils = aEnvironment;
	this.readiedActionListeners = [];
}
 
Action.prototype = { 
	
destroy : function() 
{
	this.cancelReadiedActions();
	delete this.utils;
},
 
/* ダイアログ操作の予約 */ 
COMMON_DIALOG_URL : 'chrome://global/content/commonDialog.xul',
SELECT_DIALOG_URL : 'chrome://global/content/selectDialog.xul',
	
readyToOK : function(aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != self.COMMON_DIALOG_URL ||
				!aWindow.gCommonDialogParam ||
				self.readiedActionListeners.indexOf(listener) < 0)
				return;
			var params = aWindow.gCommonDialogParam;

			var buttonsCount = params.GetInt(2);
			if (buttonsCount != 1)
				return;

			var title = params.GetString(12);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(0);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick();
				}

				doc.documentElement.getButton('accept').doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
},
readyToOk : function(aOptions) { return this.readyToOK(aOptions); },
 
readyToConfirm : function(aYes, aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != self.COMMON_DIALOG_URL ||
				!aWindow.gCommonDialogParam)
				return;
			var params = aWindow.gCommonDialogParam;

			var buttonsCount = params.GetInt(2);
			if (buttonsCount != 2 && buttonsCount != 3)
				return;

			var title = params.GetString(12);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(0);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick();
				}

				var button = (typeof aYes == 'number') ?
						aYes :
						(aYes ? 0 : 1 ) ;
				button = Math.min(button, buttonsCount-1);
				var buttonType;
				switch (button)
				{
					default:
					case 0: buttonType = 'accept'; break;
					case 1: buttonType = 'cancel'; break;
					case 2: buttonType = 'extra1'; break;
				}

				doc.documentElement.getButton(buttonType).doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
},
 
readyToPrompt : function(aInput, aOptions) 
{
	aOptions = aOptions || {};

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != self.COMMON_DIALOG_URL ||
				!aWindow.gCommonDialogParam)
				return;
			var params = aWindow.gCommonDialogParam;

			var inputFieldsCount = params.GetInt(3);
			if (aOptions.inputFieldsType == 'both' ?
					(inputFieldsCount != 2) :
					(inputFieldsCount != 1))
				return;

			var passwordType = params.GetInt(4) == 1;
			if (passwordType != (aOptions.inputFieldsType == 'password'))
				return;

			var title = params.GetString(12);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(0);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var checkbox = doc.getElementById('checkbox');
				if (checkbox.boxObject.width && 'checked' in aOptions) {
					checkbox.checked = aOptions.checked;
					aWindow.onCheckboxClick();
				}

				var usernameField = doc.getElementById('loginTextbox');
				var password1Field = doc.getElementById('password1Textbox');
				var password2Field = doc.getElementById('password2Textbox');

				switch (aOptions.inputFieldsType)
				{
					default:
						usernameField.value = aInput;
						break;

					case 'password':
						password1Field.value = aOptions.password;
						break;

					case 'both':
						usernameField.value = aOptions.username;
						password1Field.value = aOptions.password;
						break;
				}

				doc.documentElement.getButton('accept').doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
},
 
readyToPromptPassword : function(aInput, aOptions) 
{
	this.readyToPrompt(
		null,
		{
			password : aPassword,
			inputFieldsType : 'password',
			__proto__ : aOptions
		}
	);
},
 
readyToPromptUsernameAndPassword : function(aUsername, aPassword, aOptions) 
{
	this.readyToPrompt(
		null,
		{
			username : aUsername,
			password : aPassword,
			inputFieldsType : 'both',
			__proto__ : aOptions
		}
	);
},
 
readyToSelect : function(aSelectedIndexes, aOptions) 
{
	aOptions = aOptions || {};
	if (typeof aSelectedIndexes == 'number')
		aSelectedIndexes = [aSelectedIndexes];

	var self = this;
	var listener = function(aWindow) {
			if (aWindow.location.href != self.SELECT_DIALOG_URL ||
				!aWindow.gCommonDialogParam)
				return;
			var params = aWindow.gCommonDialogParam;

			var title = params.GetString(0);
			if ('title' in aOptions && aOptions.title != title)
				return;

			var message = params.GetString(1);
			if ('message' in aOptions && aOptions.message != message)
				return;

			self.cancelReadiedAction(listener);

			aWindow.setTimeout(function() {
				var doc = aWindow.document;

				var list = doc.getElementById('list');
				aSelectedIndexes.forEach(function(aIndex) {
					var item = this.getItemAtIndex(aIndex);
					if (item)
						list.addItemToSelection(item);
				});

				doc.documentElement.getButton('accept').doCommand();
			}, 0);
		};
	this.utils.addWindowWatcher(listener, 'load');
	this.readiedActionListeners.push(listener);
},
 
cancelReadiedActions : function(aInput) 
{
	this.readiedActionListeners.forEach(function(aListener) {
		this.utils.removeWindowWatcher(aListener);
	}, this);
	this.readiedActionListeners = [];
},
	
cancelReadiedAction : function(aListener) 
{
	this.utils.removeWindowWatcher(aListener);
	var index = this.readiedActionListeners.indexOf(aListener);
	if (index > -1)
		this.readiedActionListeners.splice(index, 1);
},
   
export : function(aNamespace, aForce) 
{
	var self = this;
	var prototype = Action.prototype;
	aNamespace.__defineGetter__('action', function() {
		return self;
	});
	aNamespace.__defineSetter__('action', function(aValue) {
		return aValue;
	});
	for (var aMethod in prototype)
	{
		if (
			!prototype.hasOwnProperty(aMethod) ||
			typeof prototype[aMethod] != 'function' ||
			aMethod.charAt(0) == '_' ||
			aMethod == 'export' ||
			(!aForce && (aNamespace.__lookupGetter__(aMethod) || aMethod in aNamespace))
			)
			continue;

		(function(aMethod, aPrefix) {
			var alias = aPrefix+aMethod.charAt(0).toUpperCase()+aMethod.substring(1);
			if (!aForce && (aNamespace.__lookupGetter__(alias) || alias in aNamespace))
				return;

			if (prototype.__lookupGetter__(aMethod) || (typeof prototype[aMethod] != 'function')){
				aNamespace.__defineGetter__(alias, function() {
					return self[aMethod];
				});
			}
			else {
				aNamespace[alias] = function() {
					return prototype[aMethod].apply(self, arguments);
				};
			}
		})(aMethod, 'action');
	}
}
 
}; 

var ns = {};
Components.utils.import('resource://uxu-modules/lib/action.jsm', ns);
ns.action.export(Action.prototype);
  
