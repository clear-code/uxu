// ==UserScript==
// @name         sample1
// @namespace    https://www.clear-code.com/
// @description  sample
// @include      https://www.clear-code.com/
// ==/UserScript==

function setAndGetValue() {
	GM_setValue('testKey', 'testValue');
	return GM_getValue('testKey');
}

var loadedPageTitle = null;
function loadAndGetPageTitle() {
	GM_xmlhttpRequest({
		method : 'GET',
		url    : 'https://www.clear-code.com/services/',
		onload : function(aState) {
			/<title>([^<]+)<\/title>/.test(aState.responseText);
			loadedPageTitle = RegExp.$1;
		}
	});
}
