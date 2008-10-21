// -*- indent-tabs-mode: t; tab-width: 4 -*-

var lib_module = new ModuleManager(['chrome://uxu/content/lib']);
var utils = lib_module.require('package', 'utils');

function emulateSendMessage(aMsgWindow, aMsgCompFields)
{
	var mail = {
			from    : aMsgCompFields.from,
			replyTo : aMsgCompFields.replyTo,
			to      : aMsgCompFields.to,
			cc      : aMsgCompFields.cc,
			bcc     : aMsgCompFields.bcc,

			newsgroups  : aMsgCompFields.newsgroups,
			newshost    : aMsgCompFields.newshost,
			newspostUrl : aMsgCompFields.newspostUrl,
			followupTo  : aMsgCompFields.followupTo,

			subject      : aMsgCompFields.subject,
			organization : aMsgCompFields.organization,
			priority     : aMsgCompFields.priority,
			messageId    : aMsgCompFields.messageId,
			characterSet : aMsgCompFields.characterSet,

			body : aMsgCompFields.body
		};

	utils.notify(aMsgWindow, 'uxu:mail:sent', mail.toSource());
}

function useFormatFlowed(aCharset)
{
	var value = utils.getPref('mailnews.send_plaintext_flowed');
	if (value !== null && !value)
		return false;

	if (!aCharset)
		return true;

	if (!utils.getPref('mailnews.disable_format_flowed_for_cjk'))
		return true;

	return !((aCharset != 'UTF-8') && isMultibyteCharset(aCharset));
}

function isMultibyteCharset(aCharset)
{
	try {
		var manager = Cc['@mozilla.org/charset-converter-manager;1']
						.getService(Ci.nsICharsetConverterManager);
		return String(manager.getCharsetData(aCharset, '.isMultibyte')).toLowerCase() == 'true';
	}
	catch(e) {
	}
	return false;
}

function saveAsCharset(aContentType, aCharset, aInput)
{
	var info = {
			output          : '',
			fallbackCharset : '',
			isAsciiOnly     : false
		};

	if (isAscii(aInput)) {
		info.isAsciiOnly = true;
		info.output = utils.UnicodeToX(aInput, 'ASCII');
		return info;
	}

	var isHTML = aContentType == 'text/html';
	if (aContentType == 'text/plain') {
		throw Components.results.NS_ERROR_ILLEGAL_VALUE;
	}

//	var alias = Cc['@mozilla.org/intl/charsetalias;1']
//			.getService(Ci.nsICharsetAlias);
//	var charsetName = alias.getPreferred(aCharset);
	var charsetName = aCharset;

	var converter = Cc['@mozilla.org/intl/saveascharset;1']
			.createInstance(Ci.nsISaveAsCharset);

	if (isHTML) {
		converter.Init(
			charsetName,
			(charsetName == 'ISO-8859-1' ?
				converter.attr_htmlTextDefault :
				converter.attr_EntityAfterCharsetConv + converter.attr_FallbackDecimalNCR),
			Ci.nsIEntityConverter.html32
		);
	}
	else {
		converter.Init(
			charsetName,
			(converter.attr_FallbackQuestionMark + converter.attr_EntityAfterCharsetConv),
			Ci.nsIEntityConverter.transliterate
		);
	}

	if (charsetName == 'ISO-2022-JP') {
		var sSendHankakuKana = -1;
		var sendHankakuPref = utils.getPref('mailnews.send_hankaku_kana');
		if (sendHankakuPref === null) {
			sSendHankakuKana = 0;
		}
		else {
			sSendHankakuKana = sendHankakuPref ? 1 : 0 ;
		}
		if (!sSendHankakuKana) {
			aInput = aInput.replace(/[[\uff61-\uff9f]]/, function(aChar) {
				return hankakuZenkakuTable[aChar];
			});
		}
	}

	var noMap = false;
	try {
		info.output = converter.Convert(aInput);
	}
	catch(e) {
		noMap = (e == Components.results.NS_ERROR_UENC_NOMAPPING);
	}

	if (noMap && !isHTML) {
		var charset = utils.getPref('intl.fallbackCharsetList.'+aCharset);
		if (!charset)
			throw Components.results.NS_ERROR_UENC_NOMAPPING;

		converter.Init(
			charset,
			converter.attr_FallbackQuestionMark +
				converter.attr_EntityAfterCharsetConv +
				converter.attr_CharsetFallback,
			Ci.nsIEntityConverter.transliterate
		);
		info.output = converter.Convert(aInput);
		info.fallbackCharset = converter.charset;
	}
	else if (
		info.isAsciiOnly &&
		isHTML &&
		info.outpit &&
		!nsMsgI18Nstateful_charset(charsetName)
		) {
		info.isAsciiOnly = isAscii(info.outpit);
	}

	return info;
}

function isAscii(aString)
{
	return !aString.split('').some(function(aChar) {
			return 0x0080 <= aChar.charCodeAt(0);
		});
}

var hankakuZenkakuTable = {};
var zenkakuHankakuTable = {};
var hankakuZenkakuCharacters = <![CDATA[
	\uff61	\u3002
	\uff62	\u300c
	\uff63	\u300d
	\uff64	\u3001
	\uff65	\u30fb
	\uff66	\u30f2
	\uff67	\u30a1
	\uff68	\u30a3
	\uff69	\u30a5
	\uff6a	\u30a7
	\uff6b	\u30a9
	\uff6c	\u30e3
	\uff6d	\u30e5
	\uff6e	\u30e7
	\uff6f	\u30c3
	\uff70	\u30fc
	\uff71	\u30a2
	\uff72	\u30a4
	\uff73	\u30a6
	\uff74	\u30a8
	\uff75	\u30aa
	\uff76	\u30ab
	\uff77	\u30ad
	\uff78	\u30af
	\uff79	\u30b1
	\uff7a	\u30b3
	\uff7b	\u30b5
	\uff7c	\u30b7
	\uff7d	\u30b9
	\uff7e	\u30bb
	\uff7f	\u30bd
	\uff80	\u30bf
	\uff81	\u30c1
	\uff82	\u30c4
	\uff83	\u30c6
	\uff84	\u30c8
	\uff85	\u30ca
	\uff86	\u30cb
	\uff87	\u30cc
	\uff88	\u30cd
	\uff89	\u30ce
	\uff8a	\u30cf
	\uff8b	\u30d2
	\uff8c	\u30d5
	\uff8d	\u30d8
	\uff8e	\u30db
	\uff8f	\u30de
	\uff90	\u30df
	\uff91	\u30e0
	\uff92	\u30e1
	\uff93	\u30e2
	\uff94	\u30e4
	\uff95	\u30e6
	\uff96	\u30e8
	\uff97	\u30e9
	\uff98	\u30ea
	\uff99	\u30eb
	\uff9a	\u30ec
	\uff9b	\u30ed
	\uff9c	\u30ef
	\uff9d	\u30f3
	\uff9e	\u309b
	\uff9f	\u309c
]]>.toString()
	.replace(/^\s+|\s+$/g, '')
	.split(/\s+/);
hankakuZenkakuCharacters.forEach(function(aChar, aIndex) {
	if (aIndex % 2) return;
	hankakuZenkakuTable[hankakuZenkakuCharacters[aIndex-1]] = hankakuZenkakuCharacters[aIndex];
	zenkakuHankakuTable[hankakuZenkakuCharacters[aIndex]] = hankakuZenkakuCharacters[aIndex-1];
});
