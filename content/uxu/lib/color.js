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
