// ==UserScript==
// @name         test
// @namespace    http://www.clear-code.com/
// @description  test
// @include      http://www.clear-code.com/
// @resource     about about:
// @resource     page  http://www.clear-code.com/
// ==/UserScript==

function getDocumentTitleAndURI() {
	return document.title + '\n'+ window.location.href;
}

function setAndGetValue() {
	GM_setValue('testKey', 'testValue');
	return GM_getValue('testKey');
}

var pageTitle = null;
function getPageTitle(aPageURL) {
	GM_xmlhttpRequest({
		method : 'GET',
		url    : aPageURL,
		onload : function(aState) {
			/<title>([^<]+)<\/title>/.test(aState.responseText);
			pageTitle = RegExp.$1;
		}
	});
}
