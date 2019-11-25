new Folding(
	'/descendant::*[@class="api-list"]/child::*[local-name()="dd" or local-name()="DD"]',
	'詳細',
	'隠す',
	'api',
	false,
	false
);
new Folding(
	'/descendant::*[@class="api-list"]/descendant::*[local-name()="pre" or local-name()="PRE"]',
	'用例を表示',
	'用例を隠す',
	'example',
	false,
	true
);

function writeCollapseExpandAllButton()
{
	document.write('<p id="showHideAllButtonHolder"></p>');
	var button = Folding.createToggleShowHideButton('説明文をすべて表示', '説明文をすべて隠す');
	document.getElementById('showHideAllButtonHolder').appendChild(button);
}
