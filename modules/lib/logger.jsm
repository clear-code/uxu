/**
 * @fileOverview A Crappy Logger
 * @author       ClearCode Inc.
 * @version      1
 * @license
 *   The MIT License, Copyright (c) 2012 ClearCode Inc.
 */

var EXPORTED_SYMBOLS = ["Logger"];

var { classes: Cc, interfaces: Ci } = Components;

function Logger(logFileName) {
  this.logFile = this.openFile(logFileName);
}

Logger.prototype = {
  encoding: "UTF-8",

  openFile: function (path) {
    var file = Cc["@mozilla.org/file/local;1"]
          .createInstance(Ci.nsILocalFile);
    file.initWithPath(path);
    return file;
  },

  withAppendOnlyLogFileStreamForEncoding: function (encoding, callback) {
    var os = Cc["@mozilla.org/intl/converter-output-stream;1"]
          .createInstance(Ci.nsIConverterOutputStream);

    this.withAppendOnlyLogFileStream(function (fos) {
      os.init(fos, encoding, 0, 0x0000);
      callback.call(this, os);
      // we do not have to close os (fos will be closed)
    });
  },

  withAppendOnlyLogFileStream: function (callback) {
    var foStream = Cc["@mozilla.org/network/file-output-stream;1"]
          .createInstance(Ci.nsIFileOutputStream);
    // append only
    foStream.init(this.logFile, 0x02 | 0x08 | 0x10, parseInt("0664", 8), 0);
    try {
      callback.call(this, foStream);
    } finally {
      foStream.close();
    }
  },

  // without line termination
  logRawString: function (rawString) {
    this.withAppendOnlyLogFileStreamForEncoding(this.encoding, function (os) {
      os.writeString(rawString);
    });
  },

  // with line termination
  log: function (message) {
    this.logRawString(new Date() + " || " + message + "\n");
  }
};
