new Folding(
	'/descendant::*[@class="api-list"]/child::*[local-name()="dd" or local-name()="DD"]',
	'Details',
	'Hide',
	'api',
	false,
	false
);
new Folding(
	'/descendant::*[@class="api-list"]/descendant::*[local-name()="pre" or local-name()="PRE"]',
	'Show Sample',
	'Hide Sample',
	'example',
	false,
	true
);

function writeCollapseExpandAllButton()
{
	document.write('<p id="showHideAllButtonHolder"></p>');
	var button = Folding.createToggleShowHideButton('Show All Descriptions', 'Hide All Descriptions');
	document.getElementById('showHideAllButtonHolder').appendChild(button);
}
