// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');


assert.inspectDOMNode = function(aExpected, aNode) {
	assert.equals(aExpected, utilsModule.inspectDOMNode(aNode));
};

testInspectDOMNode.priority = 'must';
function testInspectDOMNode()
{
	yield utils.loadURIInTestFrame('../../fixtures/html.xml');

	var p1 = content.document.getElementById('paragraph1');
	assert.isNotNull(p1);
	assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph1">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', p1);

	var p2 = content.document.getElementById('paragraph2');
	assert.isNotNull(p2);
	assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph2">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', p2);

	var fragment = content.document.createDocumentFragment();
	fragment.appendChild(p1.cloneNode(true));
	fragment.appendChild(p2.cloneNode(true));
	assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph1">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p><p xmlns="http://www.w3.org/1999/xhtml" id="paragraph2">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', fragment);

	yield utils.loadURIInTestFrame('../../fixtures/html.html');

	p1 = content.document.getElementById('paragraph1');
	assert.isNotNull(p1);
	if (utils.checkAppVersion('3.6a1pre') >= 0) {
		assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph1">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', p1);
	}
	else {
		assert.inspectDOMNode('<P id="paragraph1">test<EM class="class" lang="en">em</EM></P>', p1);
	}

	p2 = content.document.getElementById('paragraph2');
	assert.isNotNull(p2);
	if (utils.checkAppVersion('3.6a1pre') >= 0) {
		assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph2">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', p2);
	}
	else {
		assert.inspectDOMNode('<P id="paragraph2">test<EM class="class" lang="en">em</EM></P>', p2);
	}

	fragment = content.document.createDocumentFragment();
	fragment.appendChild(p1.cloneNode(true));
	fragment.appendChild(p2.cloneNode(true));
	if (utils.checkAppVersion('3.6a1pre') >= 0) {
		assert.inspectDOMNode('<p xmlns="http://www.w3.org/1999/xhtml" id="paragraph1">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p><p xmlns="http://www.w3.org/1999/xhtml" id="paragraph2">test<em xmlns="http://www.w3.org/1999/xhtml" class="class" lang="en">em</em></p>', fragment);
	}
	else {
		assert.inspectDOMNode('<P id="paragraph1">test<EM class="class" lang="en">em</EM></P><P id="paragraph2">test<EM class="class" lang="en">em</EM></P>', fragment);
	}
}

function test_isTargetInRange()
{
	yield Do(utils.loadURI('../../fixtures/links.html'));

	var range = content.document.createRange();
	range.setStartBefore($('item4'));
	range.setEndAfter($('item9'));

	assert.isTrue(utilsModule.isTargetInRange($('link5'), range));
	assert.isFalse(utilsModule.isTargetInRange($('link10'), range));

	assert.isTrue(utilsModule.isTargetInRange('リンク5', range));
	assert.isFalse(utilsModule.isTargetInRange('リンク10', range));

	var targetRange = content.document.createRange();
	targetRange.selectNodeContents($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	targetRange.setEnd(targetRange.endContainer, targetRange.endOffset-1);
	assert.isTrue(utilsModule.isTargetInRange(targetRange, range));
	targetRange.selectNodeContents($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.isFalse(utilsModule.isTargetInRange(targetRange, range));

	range.detach();
	targetRange.detach();
}

function test_isTargetInSelection()
{
	yield Do(utils.loadURI('../../fixtures/links.html'));

	var selection = content.getSelection();
	selection.removeAllRanges();

	var range1 = content.document.createRange();
	range1.setStartBefore($('item4'));
	range1.setEndAfter($('item9'));
	selection.addRange(range1);

	var range2 = content.document.createRange();
	range2.setStartBefore($('item12'));
	range2.setEndAfter($('item14'));
	selection.addRange(range2);

	assert.isTrue(utilsModule.isTargetInSelection($('link5'), selection));
	assert.isFalse(utilsModule.isTargetInSelection($('link10'), selection));
	assert.isTrue(utilsModule.isTargetInSelection($('link13'), selection));

	assert.isTrue(utilsModule.isTargetInSelection('リンク5', selection));
	assert.isFalse(utilsModule.isTargetInSelection('リンク10', selection));
	assert.isTrue(utilsModule.isTargetInSelection('リンク13', selection));

	var targetRange = content.document.createRange();
	targetRange.selectNodeContents($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assert.isTrue(utilsModule.isTargetInSelection(targetRange, selection));
	targetRange.selectNodeContents($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.isFalse(utilsModule.isTargetInSelection(targetRange, selection));
	targetRange.selectNodeContents($('em13'));
	targetRange.setEnd($('em13').lastChild, 3);
	assert.isTrue(utilsModule.isTargetInSelection(targetRange, selection));

	targetRange.detach();
	selection.removeAllRanges();
}

function test_isTargetInSubTree()
{
	yield Do(utils.loadURI('../../fixtures/links.html'));

	var root = $('item5');

	assert.isTrue(utilsModule.isTargetInSubTree($('link5'), root));
	assert.isFalse(utilsModule.isTargetInSubTree($('link10'), root));

	assert.isTrue(utilsModule.isTargetInSubTree('リンク5', root));
	assert.isFalse(utilsModule.isTargetInSubTree('リンク10', root));

	var targetRange = content.document.createRange();
	targetRange.selectNodeContents($('em5'));
	targetRange.setEnd($('em5').lastChild, 3);
	assert.isTrue(utilsModule.isTargetInSubTree(targetRange, root));
	targetRange.selectNodeContents($('em10'));
	targetRange.setEnd($('em10').lastChild, 3);
	assert.isFalse(utilsModule.isTargetInSubTree(targetRange, root));

	targetRange.detach();
}
