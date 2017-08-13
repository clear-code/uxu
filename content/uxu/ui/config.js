/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is UxU - UnitTest.XUL.
 *
 * The Initial Developer of the Original Code is YUKI "Piro" Hiroshi.
 * Portions created by the Initial Developer are Copyright (C) 2010-2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): YUKI "Piro" Hiroshi <shimoda@clear-code.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Cc = Components.classes;
var Ci = Components.interfaces;

function init()
{
	// workaround: filepicker doesn't initialized correctly, so we have to do it manually!!
	var filefields = document.getElementsByTagName('filefield');
	Array.forEach(filefields, function(aField) {
		aField.file = document.getElementById(aField.getAttribute('preference')).value;
	});
}

function showFilePicker(aTarget, aTitle)
{
	var target = document.getElementById(aTarget);

	var filePicker = Cc['@mozilla.org/filepicker;1']
			.createInstance(Ci.nsIFilePicker);

	if (target.file) {
		filePicker.displayDirectory = target.file.parent;
	}

	filePicker.appendFilters(filePicker.filterApps | filePicker.filterAll);
	filePicker.init(window, aTitle, filePicker.modeOpen);
	filePicker.open({ done: function(aResult) {
		if (aResult == picker.returnOK) {
//			target.label = target.file.path;
			document.getElementById(target.getAttribute('preference')).value = target.file = filePicker.file.QueryInterface(Ci.nsIFile);
		}
	}});
}

function resetFilePicker(aTarget)
{
	var target = document.getElementById(aTarget);
	target.file  = null;
	document.getElementById(target.getAttribute('preference')).value = null;
}

