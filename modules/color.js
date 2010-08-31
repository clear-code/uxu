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
	this.EXPORTED_SYMBOLS = ['Color', 'MixColor'];

var NAMES = ["black", "red", "green", "yellow",
             "blue", "magenta", "cyan", "white"];

function Color(aName, aOptions)
{
    this.name = aName;
    if (!aOptions)
        aOptions = {};

    this.foreground = aOptions.foreground;
    if (this.foreground === undefined)
        this.foreground = true;
    this.intensity = aOptions.intensity;
    this.bold = aOptions.bold;
    this.italic = aOptions.italic;
    this.underline = aOptions.underline;
}

Color.prototype = {
    sequence: function ()
    {
        var _sequence = [];

        switch (this.name) {
            case "none":
                break;
            case "reset":
                _sequence.push("0");
                break;
            default:
                var foregroundParameter, color;
                foregroundParameter = this.foreground ? 3 : 4;
                if (this.intensity)
                    foregroundParameter += 6;
                color = NAMES.indexOf(this.name);
                _sequence.push("" + foregroundParameter + color);
                break;
        }

        if (this.bold)
            _sequence.push("1");
        if (this.italic)
            _sequence.push("3");
        if (this.underline)
            _sequence.push("4");

        return _sequence;
    },

    escapeSequence: function()
    {
        return "\u001b[" + this.sequence().join(";") + "m";
    },

    concat: function(/* aColor, ... */)
    {
        return new MixColor([this].concat(Array.slice(arguments)));
    }
};

function MixColor(aColors)
{
    this.colors = aColors;
}

MixColor.prototype = {
    sequence: function()
    {
        var result = [];

        this.colors.forEach(function (aColor) {
                result = result.concat(aColor.sequence());
            });

        return result;
    },

    escapeSequence: function()
    {
        return "\u001b[" + this.sequence().join(";") + "m";
    },

    concat: function(/* aColor, ... */)
    {
        return new MixColor([this].concat(Array.slice(arguments)));
    }
};
