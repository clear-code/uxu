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
			newspostUrl : aMsgCompFields.newspostUrl
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

