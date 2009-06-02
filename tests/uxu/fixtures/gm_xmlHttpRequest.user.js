var data;

function loadAsciiFile()
{
	GM_xmlhttpRequest({
		method : 'GET',
		url    : 'http://localhost:4445/ascii.txt',
		onload : function(aRequest) {
			data = aRequest.responseText;
		}
	});
}

