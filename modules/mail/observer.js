// -*- indent-tabs-mode: t; tab-width: 4 -*- 
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


if (typeof window == 'undefined')
	this.EXPORTED_SYMBOLS = ['MailObserver'];

var ns = {};
Components.utils.import('resource://uxu-modules/utils.js', ns);
Components.utils.import('resource://uxu-modules/observer.js', ns);

var utils = ns.utils;

function MailObserver()
{
	this.clear();
	this.startObserve('uxu:mail:sent');
}

MailObserver.prototype = {
	__proto__ : ns.Observer.prototype,

	destroy : function()
	{
		this.clear();
		this.endObserve('uxu:mail:sent');
	},

	observe : function(aSubject, aTopic, aData)
	{
		this.subjects.push(aSubject);
		this.topics.push(aTopic);
		aData = utils.evalInSandbox(aData);
		this.data.push(aData);
	}
};
