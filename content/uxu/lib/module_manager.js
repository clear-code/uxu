/*
  Copyright (C) 2005-2006 by Massimiliano Mirra

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation; either version 2 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301 USA

  Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>
*/

function ModuleManager(searchPath, suffixList) {
    this._searchPath = [];

    var pathItem;
    if(searchPath)
        for each(pathItem in searchPath) 
            if(String(pathItem).match(/^\./))
                this._searchPath.push(
                    Components.stack.caller.filename.replace(/\/[^/]+$/, '/' + pathItem));
            else
                this._searchPath.push(pathItem);
    
    this._suffixList = suffixList || ['.js'];
    this._loader = Components
        .classes['@mozilla.org/moz/jssubscript-loader;1']
        .getService(Components.interfaces.mozIJSSubScriptLoader);
    this._requireCache = {};
}

ModuleManager.prototype = {
    require: function(type, logicalUrl) {

        var directoryOfCaller = Components.stack.caller.filename.replace(/\/[^/]+$/, '');
        var realUrl = this._locate(
            logicalUrl,
            this._searchPath.concat([directoryOfCaller]),
            this._suffixList);

        if (realUrl)
            switch(type) {
            case 'class_p': // DEPRECATED
                return this._loadClassPrivateEnv(realUrl);
                break;
            case 'class':
                return this._loadClassSharedEnv(realUrl);
                break;
            case 'package':
                return this._loadPackage(realUrl);
                break;
            default:
                throw new Error('Unknown module type. (' + type + ')');
            }
        else
            throw new Error('No script with given logical URL available. (' + logicalUrl + ')');

        return null;
    },

    inject: function(logicalUrl, target) {
        var directoryOfCaller = Components.stack.caller.filename.replace(/\/[^/]+$/, '');
        var realUrl = this._locate(
            logicalUrl,
            this._searchPath.concat([directoryOfCaller]),
            this._suffixList);

        if (realUrl)
            this._loadSubScript(realUrl, target);
        else
            throw new Error('No script with given logical URL available. (' + logicalUrl + ')');        
    },

    /* Internals */

    _loadClassSharedEnv: function(realUrl) {
        var cacheKey = 'class::'+realUrl;

        var classConstructor = this._requireCache[cacheKey];
        if(!classConstructor) {
            var proto = {
                module: this
            };
            classConstructor = function() {
                if(proto.constructor)
                    proto.constructor.apply(this, arguments);
            };

            this._requireCache[cacheKey] = classConstructor;
            this._loadSubScript(realUrl, proto);

            if(proto.inheritor)
                classConstructor.prototype = proto.inheritor();
            else if(proto.inherits)
                classConstructor.prototype = new proto.inherits();

            for(var name in proto) 
                if(name != 'inherits' &&
                   name != 'inheritor' &&
                   name != 'constructor')
                    classConstructor.prototype[name] = proto[name];
        }
        return classConstructor;
    },

    // This variant brings a severe performance penalty (about seven
    // times slower than shared environment), because a file is loaded
    // and evaluated *each time* the constructor is called.

    _loadClassPrivateEnv: function(realUrl) {
        var _module = this;
        return function() {
            this.module = _module;
            _module._loadSubScript(realUrl, this);
            this.constructor.apply(this, arguments);
        }
    },

    _loadPackage: function(realUrl) {
        var cacheKey = 'package::'+realUrl;
        var pkg = this._requireCache[cacheKey];
        if(!pkg) {
            pkg = {
                module: this
            };
            this._requireCache[cacheKey] = pkg;

            this._loadSubScript(realUrl, pkg);
        }
        return pkg;
    },

    /* Internals, side-effect free */

    _locate: function(fileName, directoryList, suffixList) {
        var url, directoryName, suffixName;

        directoryList = directoryList || [];
        suffixList = suffixList || [''];

        for each(directoryName in directoryList) {
            for each(suffixName in suffixList) {
                url =
                    directoryName +
                    (directoryName.match(/\/$/) ? '' : '/') +
                    fileName +
                    suffixName;

                if (this._urlAvailable(url))
                    return url;
            }
        }
        return null;
    },

    _urlAvailable: function(url) {
        const NS_ERROR_FILE_NOT_FOUND = 0x80520012;
        const NS_ERROR_FAILURE = 0x80004005

        var channel, input, result;
        try {
            channel = Components.classes['@mozilla.org/network/io-service;1']
            .getService(Components.interfaces.nsIIOService)
            .newChannel(url, null, null);

            input = channel.open();
            // non-existing chrome:// urls within xpi packages do not
            // throw FILE_NOT_FOUND on channel opening but can be
            // checked with contentLength
            result = channel.contentLength != -1;
            input.close();
            return result;

        } catch(e if e.result == NS_ERROR_FILE_NOT_FOUND) {
            return false;
        } catch(e if e.result == NS_ERROR_FAILURE) {
            return false;
        }
        return false;
    },

    _loadSubScript: function(url, env) {
        var subScriptRegExp = /chrome:\/\/uxu\/content\/lib\/subScriptRunner\.js\?includeSource=([^;,:]+)(?:;encoding=([^;,:\s]+))?/i;
        var match = url.match(subScriptRegExp);
        if (match) {
            var script = decodeURIComponent(match[1]);
            var encoding = match[2] ? match[2] : null ;
            env._lastEvaluatedScript = this._readFrom(script, encoding);
        }
        this._loader.loadSubScript(url, env);
    },
    _readFrom: function(url, encoding) {
        const IOService = Components.classes['@mozilla.org/network/io-service;1']
                      .getService(Components.interfaces.nsIIOService);
        var stream;
        if (url.indexOf('file:') == 0) {
            var file = IOService.getProtocolHandler('file')
                         .QueryInterface(Components.interfaces.nsIFileProtocolHandler)
                         .getFileFromURLSpec(url);
            stream = Components.classes['@mozilla.org/network/file-input-stream;1']
                      .createInstance(Components.interfaces.nsIFileInputStream);
            stream.init(file, 1, 0, false); // open as "read only"
        }
        else {
            var channel = IOService.newChannelFromURI(IOService.newURI(url, null, null));
            stream = channel.open();
        }
        var fileContents = null;
        try {
            if (encoding) {
                var converterStream = Components.classes['@mozilla.org/intl/converter-input-stream;1']
                        .createInstance(Components.interfaces.nsIConverterInputStream);
                var buffer = stream.available();
                converterStream.init(stream, encoding, buffer,
                    converterStream.DEFAULT_REPLACEMENT_CHARACTER);
                var out = { value : null };
                converterStream.readString(stream.available(), out);
                converterStream.close();
                fileContents = out.value;
            }
            else {
                var scriptableStream = Components.classes['@mozilla.org/scriptableinputstream;1']
                        .createInstance(Components.interfaces.nsIScriptableInputStream);
                scriptableStream.init(stream);
                fileContents = scriptableStream.read(scriptableStream.available());
                scriptableStream.close();
            }
        }
        finally {
            stream.close();
        }
        return fileContents;
    },
};

ModuleManager.testBasic = function() {
    repl.print('\n***** Verifying class loader functionality (private class) *****\n');

    var module = new ModuleManager(['.']);
    var Test = module.require('class_p', 'test/classPrivateEnv');
    
    var t1 = new Test();
    var t2 = new Test();
    
    t1.setVar(4);
    t2.setVar(5);

    repl.print(t1.getVar() + '\n');
    repl.print(t2.getVar() + '\n');    
}


ModuleManager.benchmark = function() {
    var module = new ModuleManager();

    function benchmark(fn) {
        var start, end;
        
        start = new Date();
        fn();
        end = new Date();

        return end.getTime() - start.getTime();
    }

    repl.print('\n***** Benchmarking instantiation of 1000 loaded class vs. normal class *****\n');

    repl.print(
        'Class in private environment: ' +
        benchmark(
            function() {
                var Test = module.require('class_p', 'test/classPrivateEnv');
                for(var i=0; i<1000; i++)
                    new Test();
            }) +
        ' msecs.');

    repl.print(
        'Class in shared environment: ' +
        benchmark(
            function() {
                var Test = module.require('class', 'test/classSharedEnv');
                for(var i=0; i<1000; i++)
                    new Test();
            }) +
        ' msecs.');

    repl.print(
        'Native definition: ' +
        benchmark(
            function() {
                function Test() {}
                for (var i=0; i<1000; i++)
                    new Test();
            }) +
        ' msecs.');    
}

ModuleManager.testCircular = function() {
    repl.print('\n***** Handling circular dependencies *****\n');

    var module = new ModuleManager();

    repl.print('CIRCULAR PACKAGES');
    var pkgA = module.require('package', 'test/circPkgA');

    repl.print('CIRCULAR CLASSES');
    var classA = module.require('class', 'test/circClassA');
};

/*
  ModuleManager.testBasic();
  ModuleManager.testCircular();
  ModuleManager.benchmark();
*/

