/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim:set ts=2 sw=2 sts=2 et: */
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
 * The Original Code is the httpd.js server.
 *
 * The Initial Developer of the Original Code is
 * Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Darin Fisher (v1, netwerk/test/TestServ.js)
 *   Christian Biesinger (v2, netwerk/test/unit/head_http_server.js)
 *   Jeff Walden <jwalden+code@mit.edu> (v3, netwerk/test/httpserver/httpd.js)
 *   Robert Sayre <sayrer@gmail.com>
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

// from http://d.hatena.ne.jp/thorikawa/20090526/p1

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
const CC = Components.Constructor;

/** Constructs an HTTP error object. */
function HttpError(code, description)
{
  this.code = code;
  this.description = description;
}
HttpError.prototype =
{
  toString: function()
  {
    return this.code + " " + this.description;
  }
};

/**
 * Errors thrown to trigger specific HTTP server responses.
 */
const HTTP_400 = new HttpError(400, "Bad Request");
const HTTP_401 = new HttpError(401, "Unauthorized");
const HTTP_402 = new HttpError(402, "Payment Required");
const HTTP_403 = new HttpError(403, "Forbidden");
const HTTP_404 = new HttpError(404, "Not Found");
const HTTP_405 = new HttpError(405, "Method Not Allowed");
const HTTP_406 = new HttpError(406, "Not Acceptable");
const HTTP_407 = new HttpError(407, "Proxy Authentication Required");
const HTTP_408 = new HttpError(408, "Request Timeout");
const HTTP_409 = new HttpError(409, "Conflict");
const HTTP_410 = new HttpError(410, "Gone");
const HTTP_411 = new HttpError(411, "Length Required");
const HTTP_412 = new HttpError(412, "Precondition Failed");
const HTTP_413 = new HttpError(413, "Request Entity Too Large");
const HTTP_414 = new HttpError(414, "Request-URI Too Long");
const HTTP_415 = new HttpError(415, "Unsupported Media Type");
const HTTP_416 = new HttpError(416, "Requested Range Not Satisfiable");
const HTTP_417 = new HttpError(417, "Expectation Failed");

const HTTP_500 = new HttpError(500, "Internal Server Error");
const HTTP_501 = new HttpError(501, "Not Implemented");
const HTTP_502 = new HttpError(502, "Bad Gateway");
const HTTP_503 = new HttpError(503, "Service Unavailable");
const HTTP_504 = new HttpError(504, "Gateway Timeout");
const HTTP_505 = new HttpError(505, "HTTP Version Not Supported");




function uxuProxy()
{
	dump(">>> creating uxuProxy instance\n");

	this.listeners = [];
}

uxuProxy.prototype = {
	start : function()
	{
		this.socket = Cc['@mozilla.org/network/server-socket;1']
						.createInstance(Ci.nsIServerSocket);
		try {
			this.socket.init(kPORT, true, -1);
			dump(">>> listening on port "+this.socket.port+"\n");
			this.socket.asyncListen(this);
		}
		catch (e) {
			// already bound
			this.socket = null;
		}
	},

	stop : function()
	{
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	},

	// nsIServerSocketListener
	onSocketAccepted : function(aSocket, aTransport)
	{
		dump(">>> accepted connection on "+aTransport.host+":"+aTransport.port+"\n");
		var wrappedInputObject = getSocketInputStream(aTransport);
		var wrappedOutputObject = getSocketOutputStream(aTransport);
		var requestParser = new RequestParser(aTransport, wrappedInputObject.cistream, wrappedOutputObject.ostream);
		var listener = {
			transport : aTransport,
			requestParser : requestParser,
			input : wrappedInputObject.cistream,
			output : wrappedOutputObject.ostream,
			onStartRequest: function(aRequest, aContext)
			{
				dump(">>> onStartRequest\n");
			},
			onStopRequest : function(aRequest, aContext, aStatus)
			{
				dump(">>> onStopRequest\n");
				this.transport.close(null);
			},
			onDataAvailable : function(aRequest, aContext, aInputStream, aOffset, aCount) {
				dump(">>> onDataAvailable\n");
				this.requestParser.readData();
			},
			destroy : function()
			{
				this.input.close();
				this.output.close();
			}
		};
		this.listeners.push(listener);
		wrappedInputObject.pump.asyncRead(listener, null);
	},

	onStopListening : function(aSocket, aStatus)
	{
		dump(">>> shutting down server socket\n");
		this.listeners.forEach(function(aListener) {
			aListener.destroy();
		});
		this.listeners = [];
		this.stop();
	},

	// nsIObserver
	observe : function(aSubject, aTopic, aData)
	{
		dump(">>> observe [" + aTopic + "]\n");
		this.start();
	},

	QueryInterface : function(aIID)
	{
		if (aIID.equals(Ci.nsIServerSocketListener) ||
			aIID.equals(Ci.nsIObserver) ||
			aIID.equals(Ci.nsISupports))
			return this;
		throw Cr.NS_ERROR_NO_INTERFACE;
	}
};



function RequestParser(aTransport, aInputStream, aOutputStream)
{
	this.transport = aTransport;
	this.inputStream = aInputStream;
	this.outputStream = aOutputStream;
	this.reset();
};

RequestParser.prototype = {
	READER_INITIAL    : 0,
	READER_IN_HEADERS : 1,
	READER_IN_BODY    : 2,

	reset : function()
	{
		this.state = this.READER_INITIAL;
		this.requestLines = [];
		this.headerLines = [];
		this.bodyLines = [];
	},

	readData : function()
	{
		var linedata = {};
		var hasmore;

		do {
			hasmore = this.inputStream.readLine(linedata);
			if (this.state == this.READER_INITIAL) {
				this.requestLines.push(linedata.value);
				this.processRequestLine();
				this.state = this.READER_IN_HEADERS;
			}
			else if (this.state == this.READER_IN_HEADERS) {
				this.headerLines.push(linedata.value);
				if (linedata.value == "") {
					if (this.method == "POST") {
						dump("this is POST request\n");
						this.state = this.READER_IN_BODY;
					}
					else {
						this.doProxy();
						this.reset();
					}
				}
			}
			else if (this.state == this.READER_IN_BODY) {
				this.bodyLines.push(linedata.value);
				this.doProxy();
				this.reset();
			}
		}
		while (hasmore);
	},

	doProxy : function()
	{
		var uri = this.uri;
		var port = uri.port == -1 ? 80 : uri.port ;
		var TransportService = Cc["@mozilla.org/network/socket-transport-service;1"]
					.getService(Ci.nsISocketTransportService);

		dump("connect to " + uri.host + " on port " + port + "\n");
		var proxyTransport = TransportService.createTransport(null, 0, uri.host, port, null);
		var proxyWrappedInputObject = getSocketInputStream(proxyTransport);
		var proxyWrappedOutputObject = getSocketOutputStream(proxyTransport);
		var proxyOutputStream = proxyWrappedOutputObject.costream;
		var proxyListener = {
				transport : this.transport,
				proxyBistream : proxyWrappedInputObject.bistream,
				outputStream : this.outputStream,
				proxyTransport : proxyTransport,
				onStartRequest : function(aChannel, aContext)
				{
					dump("[proxy]onStartRequest\n");
				},
				onStopRequest : function(aChannel, aContext, aStatus)
				{
					dump("[proxy]onStopRequest\n");
					this.transport.close(null);
					this.proxyTransport.close(null);
				},
				onDataAvailable : function(aRequest, aContext, aInputStream, aOffset, aCount) {
					dump("[proxy]onDataAvailable\n");
					var data = this.proxyBistream.readBytes(aCount);
					var outCount = this.outputStream.write(data, data.length);
				}
			};
		proxyWrappedInputObject.pump.asyncRead(proxyListener, null);
		this.requestLines.forEach(function(requestLine) {
			proxyOutputStream.writeString(requestLine+"\r\n");
		});
		this.headerLines.forEach(function(headerLine) {
			proxyOutputStream.writeString(headerLine+"\r\n");
		});
		proxyOutputStream.writeString("\r\n");
		if (this.method == "POST") {
			this.bodyLines.forEach(function (bodyLine) {
				proxyOutputStream.writeString(bodyLine+"\r\n");
			});
		}
	},

	processRequestLine : function()
	{
		var line = this.requestLines[0];
		dump("*** _parseRequestLine('" + line + "')\n");

		var requestArray = line.split(/[ \t]+/);
		if (!requestArray || requestArray.length != 3)
			throw HTTP_400;

		this.method = requestArray[0];

		var ver = requestArray[2];
		var match = ver.match(/^HTTP\/(\d+\.\d+)$/);
		if (!match)
			throw HTTP_400;

		if (match[1] != "1.1" && match[1] != "1.0")
			throw HTTP_501;

		var fullPath = requestArray[1];
		if (fullPath.charAt(0) != "/") {
			try {
				var uri = Cc["@mozilla.org/network/io-service;1"]
						.getService(Ci.nsIIOService)
						.newURI(fullPath, null, null);
				fullPath = uri.path;
				this.uri = uri;
			}
			catch (e) {
			}
			if (fullPath.charAt(0) != "/") {
				throw HTTP_400;
			}
		}
		return;
	}
};


function getSocketInputStream(aTransport)
{
	var istream = aTransport.openInputStream(0, 0, 0);

	var cistream = Cc["@mozilla.org/intl/converter-input-stream;1"]
					.createInstance(Ci.nsIConverterInputStream);
	cistream.init(istream, "UTF-8", 0, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
	cistream.QueryInterface(Ci.nsIUnicharLineInputStream);

	var bistream = Cc["@mozilla.org/binaryinputstream;1"].createInstance(Ci.nsIBinaryInputStream);
	bistream.setInputStream(istream);

	var pump = Cc["@mozilla.org/network/input-stream-pump;1"]
				.createInstance(Ci.nsIInputStreamPump);
	pump.init(istream, -1, -1, 0, 0, false);

	return {
		istream : istream,
		cistream : cistream,
		bistream : bistream,
		pump : pump
	};
}

function getSocketOutputStream (aTransport)
{
	var ostream = aTransport.openOutputStream(0, 0, 0);

	var costream = Cc["@mozilla.org/intl/converter-output-stream;1"]
					.createInstance(Ci.nsIConverterOutputStream);
	costream.init(ostream, "UTF-8", 0, Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
	return {
		ostream : ostream,
		costream : costream
	};
}















/** we'll listen on this port for HTTP requests * */
const kPORT = 4444;
const kTESTSERV_CONTRACTID = "@mozilla.org/network/test-serv;1";
const kTESTSERV_CID = Components.ID("{a741fcd5-9695-42e8-a7f7-14f9a29f8200}");


var servModule = new Object();

servModule.registerSelf =
  function (compMgr, fileSpec, location, type)
  {
  compMgr = compMgr.QueryInterface(Ci.nsIComponentRegistrar);
  compMgr.registerFactoryLocation(kTESTSERV_CID,
      "uxuProxy",
      kTESTSERV_CONTRACTID,
      fileSpec,
      location,
      type);

  const CATMAN_CONTRACTID = "@mozilla.org/categorymanager;1";
  const nsICategoryManager = Ci.nsICategoryManager;
  var catman = Cc[CATMAN_CONTRACTID].getService(nsICategoryManager);
  catman.addCategoryEntry("xpcom-startup",
      "TestProxyServ",
      kTESTSERV_CONTRACTID,
      true,
      true);
  }

servModule.getClassObject =
  function (compMgr, cid, iid)
  {
  if (!cid.equals(kTESTSERV_CID))
    throw Cr.NS_ERROR_NO_INTERFACE;

  if (!iid.equals(Ci.nsIFactory))
    throw Cr.NS_ERROR_NOT_IMPLEMENTED;

  return servFactory;
  }

servModule.canUnload =
  function (compMgr)
  {
  dump(">>> unloading test serv.\n");
  return true;
  }

var servFactory = new Object();

servFactory.createInstance =
  function (outer, iid)
  {
  if (outer != null)
    throw Cr.NS_ERROR_NO_AGGREGATION;

  if (!iid.equals(Ci.nsIObserver) &&
      !iid.equals(Ci.nsISupports))
    throw Cr.NS_ERROR_NO_INTERFACE;

  return TestProxyServ;
  }

function NSGetModule(compMgr, fileSpec)
{
  return servModule;
}

var TestProxyServ = new uxuProxy();
