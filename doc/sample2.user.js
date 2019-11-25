// ==UserScript==
// @name         sample2
// @namespace    https://www.clear-code.com/
// @description  sample
// @include      https://www.clear-code.com/
// ==/UserScript==

function getDocumentTitleAndURI() {
	return document.title + '\n'+ window.location.href;
}

