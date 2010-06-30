var topDir = baseURL+'../../../../';
utils.include('action.inc.js', 'Shift_JIS');

var actionModule;
var win;

function setUp()
{
	actionModule = {};
	utils.include(topDir+'content/uxu/test/action.js', actionModule);
	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/action.html'));
	actionSetUp();
}

function tearDown()
{
	actionTearDown();
	yield Do(utils.loadURI('about:blank'));
}


/* utilities */

function test_getElementFromScreenPoint()
{
	function assertGetElement(aTarget, aFrame, aX, aY)
	{
		if (aTarget)
			assert.equals(aTarget, actionModule.getElementFromScreenPoint(aFrame, aX, aY));
		else
			assert.isNull(actionModule.getElementFromScreenPoint(aFrame, aX, aY));
	}

	var target = $('clickable-box'),
		targetBoxObject,
		rootBoxObject = gBrowser.boxObject;
	assertGetElement(target, content,
	                 rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetElement(target, gBrowser.ownerDocument.defaultView,
	                 rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetElement(target, null,
	                 rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetElement(null, content,
	                 rootBoxObject.screenX - 150, rootBoxObject.screenY - 150);

	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/frameTest.html'));
	rootBoxObject = utils.getBoxObjectFor($('frame3'));
	target = $('frame3').contentDocument.getElementById('em1');
	targetBoxObject = utils.getBoxObjectFor(target);
	assertGetElement(target, content,
	                 targetBoxObject.screenX + 5, targetBoxObject.screenY + 5);
	assertGetElement(target, gBrowser.ownerDocument.defaultView,
	                 targetBoxObject.screenX + 5, targetBoxObject.screenY + 5);
	assertGetElement(target, null,
	                 targetBoxObject.screenX + 5, targetBoxObject.screenY + 5);

	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/frameTestInline.html'));
	rootBoxObject = utils.getBoxObjectFor($('frame2'));
	target = $('frame2').contentDocument.getElementById('em1');
	targetBoxObject = utils.getBoxObjectFor(target);
	assertGetElement(target, content,
	                 targetBoxObject.screenX + 5, targetBoxObject.screenY + 5);
	assertGetElement(target, gBrowser.ownerDocument.defaultView,
	                 targetBoxObject.screenX + 5, targetBoxObject.screenY + 5);
	assertGetElement(target, null,
	                 targetBoxObject.screenX + 5, targetBoxObject.screenY + 5);
}

function test_getFrameFromScreenPoint()
{
	function assertGetFrame(aTarget, aFrame, aX, aY)
	{
		if (aTarget)
			assert.equals(aTarget, actionModule.getFrameFromScreenPoint(aFrame, aX, aY));
		else
			assert.isNull(actionModule.getFrameFromScreenPoint(aFrame, aX, aY));
	}

	var rootBoxObject = gBrowser.boxObject;
	assertGetFrame(content, content,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetFrame(content, gBrowser.ownerDocument.defaultView,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetFrame(content, null,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetFrame(null, content,
	               rootBoxObject.screenX - 150, rootBoxObject.screenY - 150);

	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/frameTest.html'));
	rootBoxObject = utils.getBoxObjectFor($('frame3'));
	assertGetFrame($('frame3').contentWindow, content,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetFrame($('frame3').contentWindow, gBrowser.ownerDocument.defaultView,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetFrame($('frame3').contentWindow, null,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);

	yield Do(utils.loadURI(topDir+'tests/uxu/fixtures/frameTestInline.html'));
	rootBoxObject = utils.getBoxObjectFor($('frame2'));
	assertGetFrame($('frame2').contentWindow, content,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetFrame($('frame2').contentWindow, gBrowser.ownerDocument.defaultView,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
	assertGetFrame($('frame2').contentWindow, null,
	               rootBoxObject.screenX + 50, rootBoxObject.screenY + 50);
}
