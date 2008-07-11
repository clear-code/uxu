// ==UserScript==
// @name         test
// @namespace    http://www.clear-code.com/
// @description  test
// @include      http://www.clear-code.com/
// ==/UserScript==

function getDocumentTitleAndURI() {
	return document.title + '\n'+ window.location.href;
}
