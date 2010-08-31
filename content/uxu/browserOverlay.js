/**
 * Copyright (C) 2010 by ClearCode Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA	02110-1301 USA
 *
 * Author: ClearCode Inc. http://www.clear-code.com/
 */

window.addEventListener('unload', function() {
	window.removeEventListener('unload', arguments.callee, false);

	const WindowManager = Components.classes['@mozilla.org/appshell/window-mediator;1']
			.getService(Components.interfaces.nsIWindowMediator);

	var targets = WindowManager.getEnumerator('navigator:browser');
	if (!targets.hasMoreElements()) {
		if (nsPreferences.getBoolPref('extensions.uxu.runner.autoExit')) {
			var runner = WindowManager.getMostRecentWindow('uxu:runner');
			if (runner)
				runner.close();
		}
	}

}, false);
