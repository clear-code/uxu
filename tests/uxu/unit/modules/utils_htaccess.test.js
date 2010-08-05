// -*- indent-tabs-mode: t; tab-width: 4 -*-

utils.include('utils_common.inc.js');

var bundle = utils.import(topDir+'modules/lib/stringBundle.js', {})
				.stringBundle.get('chrome://uxu/locale/uxu.properties');

var htaccess;

function assertRedirect(aStatus, aStatusText, aURI, aPath)
{
	var result = utilsModule.processRequestByHtaccess(aPath, htaccess);
	assert.notNull(result);
	assert.equals(
		{ status     : aStatus,
		  statusText : aStatusText, 
		  uri        : aURI },
		result
	);
}

function assertRewrited(aURI, aPath)
{
	var result = utilsModule.processRequestByHtaccess(aPath, htaccess);
	assert.notNull(result);
	assert.equals(
		{ status     : 200,
		  statusText : 'OK', 
		  uri        : aURI },
		result
	);
}

function assertNotModified(aPath)
{
	assert.isNull(utilsModule.processRequestByHtaccess(aPath, htaccess));
}

test_processRequestByHtaccess.setUp = function() {
	htaccess = utils.readFrom(baseURL+'../../fixtures/redirect/.htaccess');
};
function test_processRequestByHtaccess()
{
	assertRedirect(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/sub/permanent/file');
	assertRedirect(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/sub/temp/file');
	assertRedirect(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/sub/seeother/file');
	assertRedirect(301, 'Moved Permanently', 'http://localhost:4445/file',
	               '/redirect/sub/permanent2/file');
	assertRedirect(302, 'Found', 'http://localhost:4445/file',
	               '/redirect/sub/temp2/file');
	assertRedirect(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/match/file');
	assertNotModified('/not_redirect/match/file');

	assertRewrited('/file',
	               '/redirect/rewrite/file');
	assertRewrited('http://localhost:4445/file',
	               '/redirect/rewrite_absolute/file');
	assertRedirect(303, 'See Other', 'http://localhost:4445/file',
	               '/redirect/rewrite_redirect/file');
	assertNotModified('/redirect/not_rewrite/match/file');
	assertNotModified('/redirect/rewrite_invalid/match/file');

	htaccess = '';
	assertNotModified('/redirect/sub/permanent/file');
	assertNotModified('/redirect/sub/temp/file');
	assertNotModified('/redirect/sub/seeother/file');
	assertNotModified('/redirect/sub/permanent2/file');
	assertNotModified('/redirect/sub/temp2/file');
	assertNotModified('/redirect/match/file');
	assertNotModified('/redirect/rewrite/file');
	assertNotModified('/redirect/rewrite_absolute/file');
	assertNotModified('/redirect/rewrite_redirect/file');
}
